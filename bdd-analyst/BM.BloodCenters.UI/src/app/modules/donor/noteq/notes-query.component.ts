/**
 * Notes by Date Range Query Component
 * Allows users to search and view system notes within a date range
 * JIRA: MLT-11886
 * Mnemonic: NOTEQ
 */

import { Component, OnInit, OnDestroy, effect, signal, computed, DestroyRef, inject as ngInject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { UppercaseMomentDateAdapter } from '@shared/date/uppercase-date-adapter';
import { Subject, takeUntil, forkJoin, combineLatest, distinctUntilChanged, debounceTime, filter, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import moment from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { NotesQueryService } from './services/notes-query.service';
import {
  NoteResultDto,
  UserNoteCountDto,
  ProgramNoteCountDto,
  NotesQueryRequestDto,
  UserOption,
  ProgramOption,
  UserLovItemDto,
  ProgramLovItemDto
} from './models/notes-query.model';

@Component({
  selector: 'app-notes-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatTabsModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './notes-query.component.html',
  styleUrls: ['./notes-query.component.scss']
})
export class NotesQueryComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `notes-query-${NotesQueryComponent.nextId++}`;

  // Generate unique IDs for elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/' }
    ],
    title: 'Notes by Date Range Query',
    subtitle: 'View and filter system notes within a selected date range by user or program.',
    actions: []
  };

  // Form
  filterForm!: FormGroup;

  // Signal-based state
  protected readonly notes = signal<NoteResultDto[]>([]);
  protected readonly userCounts = signal<UserNoteCountDto[]>([]);
  protected readonly programCounts = signal<ProgramNoteCountDto[]>([]);
  protected readonly totalNotes = signal<number>(0);
  protected readonly totalCount = signal<number>(0);
  protected readonly selectedNote = signal<NoteResultDto | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly retrieveLoading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly activeTab = signal<number>(0);
  protected readonly submitted = signal<boolean>(false);

  // LOV signals (populated from dedicated LOV APIs when date range is valid)
  protected readonly userLovItems = signal<UserLovItemDto[]>([]);
  protected readonly programLovItems = signal<ProgramLovItemDto[]>([]);
  protected readonly lovLoading = signal(false);

  // Computed values
  protected readonly isEmpty = computed(() => this.notes().length === 0 && !this.loading());
  protected readonly hasData = computed(() => this.notes().length > 0);
  protected readonly userOptions = computed<UserOption[]>(() => {
    return this.userLovItems().map(u => ({
      userId: u.userId,
      name: u.name
    }));
  });
  protected readonly programOptions = computed<ProgramOption[]>(() => {
    return this.programLovItems().map(p => ({
      programId: p.programId,
      description: p.description
    }));
  });

  // Search controls for dropdowns
  userSearchControl = new FormControl('');
  programSearchControl = new FormControl('');

  protected readonly filteredUserOptions = signal<UserOption[]>([]);
  protected readonly filteredProgramOptions = signal<ProgramOption[]>([]);

  // Dropdown panel open state — hides "All" placeholder during search
  protected readonly userPanelOpen = signal(false);
  protected readonly programPanelOpen = signal(false);

  // Table configuration
  displayedColumns: string[] = ['insertUser', 'programId', 'noteId', 'noteSequence'];
  userCountColumns: string[] = ['userId', 'count'];
  programCountColumns: string[] = ['programId', 'count'];

  // Summary table sort state (signals for reactive computed)
  protected readonly userSortColumn = signal('');
  protected readonly userSortDirection = signal<'A' | 'D' | 'default'>('default');
  protected readonly programSortColumn = signal('');
  protected readonly programSortDirection = signal<'A' | 'D' | 'default'>('default');

  protected readonly sortedUserCounts = computed(() => {
    const data = [...this.userCounts()];
    const dir = this.userSortDirection();
    const col = this.userSortColumn();
    if (dir === 'default') return data;
    const mult = dir === 'A' ? 1 : -1;
    return data.sort((a, b) => {
      const valA = col === 'userId' ? a.userId : a.count;
      const valB = col === 'userId' ? b.userId : b.count;
      return valA < valB ? -1 * mult : valA > valB ? 1 * mult : 0;
    });
  });

  protected readonly sortedProgramCounts = computed(() => {
    const data = [...this.programCounts()];
    const dir = this.programSortDirection();
    const col = this.programSortColumn();
    if (dir === 'default') return data;
    const mult = dir === 'A' ? 1 : -1;
    return data.sort((a, b) => {
      const valA = col === 'programId' ? a.programId : a.count;
      const valB = col === 'programId' ? b.programId : b.count;
      return valA < valB ? -1 * mult : valA > valB ? 1 * mult : 0;
    });
  });

  // Pagination
  pageSize = 25;
  pageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];

  // Sorting
  sortColumn = '';
  sortDirection: 'A' | 'D' | 'default' = 'default';

  private destroy$ = new Subject<void>();
  private readonly destroyRef = ngInject(DestroyRef);

  constructor(
    private readonly fb: FormBuilder,
    private readonly notesQueryService: NotesQueryService,
    private readonly snackbarService: SnackbarService,
    private readonly pageHeaderService: PageHeaderService
  ) {
    this.initializeForm();

    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || 'View and filter system notes within a selected date range by user or program.',
          actions: []
        };
      }
    });
  }

  ngOnInit(): void {
    this.setupLovSubscriptions();
    this.setupSearchFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      fromDate: [null, [Validators.required, dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]],
      toDate: [null, [Validators.required, dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]],
      userId: [null],
      programId: [null]
    }, {
      validators: this.dateRangeValidator
    });
  }

  /**
   * Custom validator to ensure toDate >= fromDate
   */
  private dateRangeValidator(group: FormGroup): { [key: string]: boolean } | null {
    const fromDate = group.get('fromDate')?.value;
    const toDate = group.get('toDate')?.value;

    if (fromDate && toDate) {
      const from = moment(fromDate).startOf('day');
      const to = moment(toDate).startOf('day');

      if (to.isBefore(from)) {
        return { 'dateRangeInvalid': true };
      }
    }
    return null;
  }

  get f() {
    return this.filterForm.controls;
  }

  onDateInput(event: Event, controlName: string): void {
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleStartDateInput(inputValue, this.filterForm.get(controlName));
  }

  onUserPanelOpenChange(isOpen: boolean): void {
    this.userPanelOpen.set(isOpen);
    if (!isOpen) {
      this.userSearchControl.setValue('');
    }
  }

  onProgramPanelOpenChange(isOpen: boolean): void {
    this.programPanelOpen.set(isOpen);
    if (!isOpen) {
      this.programSearchControl.setValue('');
    }
  }

  getUserTriggerDisplay(): string {
    const value = this.filterForm.getRawValue().userId;
    if (value) {
      const match = this.userOptions().find(u => u.userId === value);
      return match?.name ? `${value} - ${match.name}` : value;
    }
    return '';
  }

  getProgramTriggerDisplay(): string {
    const value = this.filterForm.getRawValue().programId;
    if (value) {
      const match = this.programOptions().find(p => p.programId === value);
      return match?.description ? `${value} - ${match.description}` : value;
    }
    return '';
  }

  /**
   * Handle retrieve button click
   */
  onRetrieve(): void {
    this.submitted.set(true);

    if (this.filterForm.invalid) {
      // Focus first invalid field
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    // Reset pagination to first page on new search
    this.pageIndex = 0;
    this.retrieveLoading.set(true);
    this.loadNotes();
  }

  /**
   * Handle clear all button click
   */ 
  onClearAll(): void {
    this.enableFilterControls();
    this.filterForm.reset({
      fromDate: null,
      toDate: null,
      userId: null,
      programId: null
    });
    this.submitted.set(false);
    this.notes.set([]);
    this.userCounts.set([]);
    this.programCounts.set([]);
    this.totalNotes.set(0);
    this.totalCount.set(0);
    this.selectedNote.set(null);
    this.error.set(null);
    this.userLovItems.set([]);
    this.programLovItems.set([]);
    this.filteredUserOptions.set([]);
    this.filteredProgramOptions.set([]);
    this.userSearchControl.setValue('');
    this.programSearchControl.setValue('');
    this.pageIndex = 0;
    this.sortColumn = '';
    this.sortDirection = 'default';
  }

  private disableFilterControls(): void {
    this.filterForm.get('fromDate')!.disable({ emitEvent: false });
    this.filterForm.get('toDate')!.disable({ emitEvent: false });
    this.filterForm.get('userId')!.disable({ emitEvent: false });
    this.filterForm.get('programId')!.disable({ emitEvent: false });
  }

  private enableFilterControls(): void {
    this.filterForm.get('fromDate')!.enable({ emitEvent: false });
    this.filterForm.get('toDate')!.enable({ emitEvent: false });
    this.filterForm.get('userId')!.enable({ emitEvent: false });
    this.filterForm.get('programId')!.enable({ emitEvent: false });
  }

  /**
   * Set up reactive subscriptions to load LOV dropdowns when date range becomes valid
   */
  private setupLovSubscriptions(): void {
    const fromDate$ = this.filterForm.get('fromDate')!.valueChanges;
    const toDate$ = this.filterForm.get('toDate')!.valueChanges;

    combineLatest([fromDate$, toDate$]).pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) =>
        moment(prev[0]).isSame(curr[0], 'day') && moment(prev[1]).isSame(curr[1], 'day')
      ),
      filter(([from, to]) => !!from && !!to),
      filter(([from, to]) => {
        const fromM = moment(from).startOf('day');
        const toM = moment(to).startOf('day');
        return toM.isSameOrAfter(fromM);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([from, to]) => {
      const fromDate = moment(from).format('YYYY-MM-DD');
      const toDate = moment(to).format('YYYY-MM-DD');
      this.loadUserLov(fromDate, toDate);
      this.loadProgramLov(fromDate, toDate);
      this.filterForm.get('userId')!.setValue(null, { emitEvent: false });
      this.filterForm.get('programId')!.setValue(null, { emitEvent: false });
    });

    this.filterForm.get('userId')!.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(userId => {
      const from = this.filterForm.get('fromDate')!.value;
      const to = this.filterForm.get('toDate')!.value;
      if (from && to) {
        const fromDate = moment(from).format('YYYY-MM-DD');
        const toDate = moment(to).format('YYYY-MM-DD');
        this.loadProgramLov(fromDate, toDate, userId || undefined);
        this.filterForm.get('programId')!.setValue(null, { emitEvent: false });
      }
    });
  }

  private setupSearchFilters(): void {
    this.userSearchControl.valueChanges.pipe(
      startWith(''),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(search => {
      const term = (search || '').toLowerCase();
      this.filteredUserOptions.set(
        this.userOptions().filter(u =>
          u.userId.toLowerCase().includes(term) ||
          (u.name || '').toLowerCase().includes(term)
        )
      );
    });

    this.programSearchControl.valueChanges.pipe(
      startWith(''),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(search => {
      const term = (search || '').toLowerCase();
      this.filteredProgramOptions.set(
        this.programOptions().filter(p =>
          p.programId.toLowerCase().includes(term) ||
          (p.description || '').toLowerCase().includes(term)
        )
      );
    });
  }

  private refreshFilteredOptions(): void {
    const userTerm = (this.userSearchControl.value || '').toLowerCase();
    this.filteredUserOptions.set(
      this.userOptions().filter(u =>
        u.userId.toLowerCase().includes(userTerm) ||
        (u.name || '').toLowerCase().includes(userTerm)
      )
    );
    const programTerm = (this.programSearchControl.value || '').toLowerCase();
    this.filteredProgramOptions.set(
      this.programOptions().filter(p =>
        p.programId.toLowerCase().includes(programTerm) ||
        (p.description || '').toLowerCase().includes(programTerm)
      )
    );
  }

  private loadUserLov(fromDate: string, toDate: string): void {
    this.lovLoading.set(true);
    this.notesQueryService.getUsers({ fromDate, toDate })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.userLovItems.set(users);
          this.lovLoading.set(false);
          this.refreshFilteredOptions();
        },
        error: () => {
          this.userLovItems.set([]);
          this.lovLoading.set(false);
          this.refreshFilteredOptions();
        }
      });
  }

  private loadProgramLov(fromDate: string, toDate: string, userId?: string): void {
    this.notesQueryService.getPrograms({ fromDate, toDate, userId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (programs) => {
          this.programLovItems.set(programs);
          this.refreshFilteredOptions();
        },
        error: () => {
          this.programLovItems.set([]);
          this.refreshFilteredOptions();
        }
      });
  }

  /**
   * Load notes from API
   */
  private loadNotes(): void {
    this.loading.set(true);
    this.error.set(null);

    const formValue = this.filterForm.getRawValue();

    const request: NotesQueryRequestDto = {
      fromDate: this.formatDateForApi(formValue.fromDate),
      toDate: this.formatDateForApi(formValue.toDate),
      userId: formValue.userId || undefined,
      programId: formValue.programId || undefined,
      sortColumn: this.sortDirection !== 'default' ? this.getApiSortColumn() : undefined,
      sortOrder: this.sortDirection !== 'default' ? (this.sortDirection === 'A' ? 'ASC' : 'DESC') : undefined,
      take: this.pageSize,
      skip: this.pageIndex * this.pageSize
    };

    this.notesQueryService.searchNotes(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.notes.set(response.notes);
          this.userCounts.set(response.userCounts);
          this.programCounts.set(response.programCounts);
          this.totalNotes.set(response.totalNotes);
          this.totalCount.set(response.totalCount);

          this.selectedNote.set(null);

          this.disableFilterControls();
          this.loading.set(false);
          this.retrieveLoading.set(false);

          // Disable search criteria after retrieval (Bug #9 — matches Oracle Forms DO_RETRIEVE_PROCESSING)
          this.disableSearchCriteria();
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load notes');
          this.loading.set(false);
          this.retrieveLoading.set(false);
          console.error('Error loading notes:', err);
        }
      });
  }

  private disableSearchCriteria(): void {
    this.filterForm.get('fromDate')!.disable({ emitEvent: false });
    this.filterForm.get('toDate')!.disable({ emitEvent: false });
    this.filterForm.get('userId')!.disable({ emitEvent: false });
    this.filterForm.get('programId')!.disable({ emitEvent: false });
  }

  /**
   * Handle note row selection
   */
  onSelectNote(note: NoteResultDto): void {
    this.selectedNote.set(note);
  }

  /**
   * Handle pagination change
   */
  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadNotes();
  }

  /**
   * Handle sort click — cycles: default -> A -> D -> default
   */
  onSort(column: string): void {
    if (this.sortColumn === column) {
      if (this.sortDirection === 'default') {
        this.sortDirection = 'A';
      } else if (this.sortDirection === 'A') {
        this.sortDirection = 'D';
      } else {
        this.sortDirection = 'default';
      }
    } else {
      this.sortColumn = column;
      this.sortDirection = 'A';
    }

    this.pageIndex = 0;
    this.loadNotes();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn === column && this.sortDirection === 'A') return 'arrow_upward';
    if (this.sortColumn === column && this.sortDirection === 'D') return 'arrow_downward';
    return 'unfold_more';
  }

  private getApiSortColumn(): string {
    const columnMap: Record<string, string> = {
      'insertUser': 'InsertUser',
      'programId': 'ProgramId',
      'noteId': 'NoteId'
    };
    return columnMap[this.sortColumn] || '';
  }

  getSortAriaLabel(column: string): string {
    if (this.sortColumn === column && this.sortDirection === 'A') return 'Sorted ascending';
    if (this.sortColumn === column && this.sortDirection === 'D') return 'Sorted descending';
    return 'Not sorted';
  }

  onUserSort(column: string): void {
    if (this.userSortColumn() === column) {
      const dir = this.userSortDirection();
      this.userSortDirection.set(dir === 'default' ? 'A' : dir === 'A' ? 'D' : 'default');
    } else {
      this.userSortColumn.set(column);
      this.userSortDirection.set('A');
    }
  }

  onProgramSort(column: string): void {
    if (this.programSortColumn() === column) {
      const dir = this.programSortDirection();
      this.programSortDirection.set(dir === 'default' ? 'A' : dir === 'A' ? 'D' : 'default');
    } else {
      this.programSortColumn.set(column);
      this.programSortDirection.set('A');
    }
  }

  getSummarySortIcon(table: 'user' | 'program', column: string): string {
    const col = table === 'user' ? this.userSortColumn() : this.programSortColumn();
    const dir = table === 'user' ? this.userSortDirection() : this.programSortDirection();
    if (col === column && dir === 'A') return 'arrow_upward';
    if (col === column && dir === 'D') return 'arrow_downward';
    return 'unfold_more';
  }

  /**
   * Handle tab change
   */
  onTabChange(index: number): void {
    this.activeTab.set(index);
  }

  /**
   * Format date for API (ISO string)
   */
  private formatDateForApi(date: Date | null): string {
    if (!date) return '';
    return moment(date).format('YYYY-MM-DD');
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  formatDateForDisplay(dateString: string | null): string {
    if (!dateString) return '';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }

  /**
   * Check if note row is selected
   */
  isNoteSelected(note: NoteResultDto): boolean {
    const selected = this.selectedNote();
    if (!selected) return false;
    return selected.noteId === note.noteId &&
           selected.noteSequence === note.noteSequence;
  }

  hasAnyFilterValue(): boolean {
    const v = this.filterForm.getRawValue();
    return !!(v.fromDate || v.toDate || v.userId || v.programId);
  }

  get retrieveButtonAriaLabel(): string {
    if (this.loading()) {
      return 'Retrieving notes, please wait';
    }
    if (this.hasData()) {
      return 'Clear all to perform a new search';
    }
    return this.filterForm.invalid ? 'Retrieve button disabled, complete required fields' : 'Retrieve notes';
  }

  protected readonly isFormDisabled = computed(() => this.filterForm?.get('fromDate')?.disabled ?? false);
}
