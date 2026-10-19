import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, filter, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment, { Moment } from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  DataTableConfig,
  TableColumn,
  PaginationConfig,
  TablePageEvent,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import { ReagentQueryService } from './services/reagent-query.service';
import {
  TestIdOption,
  ReagentCodeOption,
  LotNumberOption,
  ReagentIdOption,
  ReagentDto,
  ReagentSearchRequest
} from './models/reagent-query.model';
import { TestKitsDialogComponent, TestKitsDialogData } from './test-kits-dialog/test-kits-dialog';
import { PreparationDetailsDialogComponent, PreparationDetailsDialogData } from './preparation-details-dialog/preparation-details-dialog';

@Component({
  selector: 'app-reagent-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatDialogModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './reagent-query.html',
  styleUrl: './reagent-query.scss'
})
export class ReagentQueryComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `reagent-query-${ReagentQueryComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly reagentQueryService = inject(ReagentQueryService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly testIds = signal<TestIdOption[]>([]);
  protected readonly reagentCodes = signal<ReagentCodeOption[]>([]);
  protected readonly lotNumbers = signal<LotNumberOption[]>([]);
  protected readonly reagents = signal<ReagentDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingTestIds = signal<boolean>(false);
  protected readonly loadingReagentCodes = signal<boolean>(false);
  protected readonly loadingLotNumbers = signal<boolean>(false);
  protected readonly reagentIds = signal<ReagentIdOption[]>([]);
  protected readonly loadingReagentIds = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);
  protected readonly formDirty = signal<boolean>(false);
  protected readonly expandedRows = signal<Set<string>>(new Set());
  protected readonly totalRecords = signal<number>(0);
  protected readonly pageSize = signal<number>(25);
  protected readonly pageIndex = signal<number>(0);
  // Notes: noteId → note text (null = not yet loaded, '' = loading, string = loaded)
  protected readonly loadedNotes = signal<Map<number, string | null>>(new Map());

  // Tracking signals for FormControl values
  private readonly testIdValue = signal<string | null>(null);
  private readonly reagentCodeValue = signal<string | null>(null);
  private readonly lotNumberValue = signal<string | null>(null);

  // Search controls for dropdowns
  readonly testIdSearchControl = new FormControl('');
  readonly reagentCodeSearchControl = new FormControl('');
  readonly lotNumberSearchControl = new FormControl('');
  readonly reagentIdSearchControl = new FormControl('');
  private readonly testIdSearch = signal('');
  private readonly reagentCodeSearch = signal('');
  private readonly lotNumberSearch = signal('');
  private readonly reagentIdSearch = signal('');

  // Filtered dropdown options
  protected readonly filteredTestIds = computed(() => {
    const search = this.testIdSearch().toLowerCase();
    const options = this.testIds();
    if (!search) return options;
    return options.filter(o =>
      (o.testId || '').toLowerCase().includes(search) ||
      (o.testDesc || '').toLowerCase().includes(search)
    );
  });

  protected readonly filteredReagentCodes = computed(() => {
    const search = this.reagentCodeSearch().toLowerCase();
    const options = this.reagentCodes();
    if (!search) return options;
    return options.filter(o =>
      (o.reagentCode || '').toLowerCase().includes(search) ||
      (o.reagentName || '').toLowerCase().includes(search)
    );
  });

  protected readonly filteredLotNumbers = computed(() => {
    const search = this.lotNumberSearch().toLowerCase();
    const options = this.lotNumbers();
    if (!search) return options;
    return options.filter(o =>
      (o.lotNumber || '').toLowerCase().includes(search)
    );
  });

  protected readonly filteredReagentIds = computed(() => {
    const search = this.reagentIdSearch().toLowerCase();
    const options = this.reagentIds();
    if (!search) return options;
    return options.filter(o => (o.reagentId || '').toLowerCase().includes(search));
  });

  // Min date constraint for To Date
  protected readonly minToDate = signal<Moment | null>(null);

  // Truncation detection for tooltip
  isTestIdTruncated = false;
  isReagentCodeTruncated = false;
  isLotNumberTruncated = false;

  // Computed display values
  protected readonly selectedTestIdDisplay = computed(() => {
    const selectedId = this.testIdValue();
    if (!selectedId) return '';
    const option = this.testIds().find(t => t.testId === selectedId);
    if (!option) return selectedId;
    return option.testDesc ? `${option.testId} - ${option.testDesc}` : option.testId;
  });

  protected readonly selectedReagentCodeDisplay = computed(() => {
    const selectedCode = this.reagentCodeValue();
    if (!selectedCode) return '';
    const option = this.reagentCodes().find(r => r.reagentCode === selectedCode);
    if (!option) return selectedCode;
    return option.reagentName ? `${option.reagentCode} - ${option.reagentName}` : option.reagentCode;
  });

  protected readonly selectedLotNumberDisplay = computed(() => {
    const selectedLot = this.lotNumberValue();
    if (!selectedLot) return '';
    const option = this.lotNumbers().find(l => l.lotNumber === selectedLot);
    if (!option) return selectedLot;
    return option.lotNumber;
  });

  // Description display
  protected readonly testDescription = computed(() => {
    const selectedId = this.testIdValue();
    if (!selectedId) return '-';
    const option = this.testIds().find(t => t.testId === selectedId);
    return option?.testDesc || '-';
  });

  // Computed values
  protected readonly isEmpty = computed(() =>
    this.reagents().length === 0 && !this.loading() && this.submitted()
  );
  protected readonly isReady = computed(() => !this.loading());
  protected readonly hasSearched = computed(() => this.submitted());

  // Template references
  @ViewChild('expandTemplate', { static: true }) expandTemplate!: TemplateRef<any>;

  searchForm!: FormGroup;

  protected pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  protected tableConfig!: DataTableConfig<ReagentDto>;

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadTestIds();
    this.setupFormListeners();
    this.setupSearchListeners();
    this.setupDateValidation();
    this.initializeTableConfig();

    this.route.queryParams
      .pipe(
        takeUntil(this.destroy$),
        filter(params => !!params['testId'])
      )
      .subscribe((params) => {
        if (this.testIds().length > 0) {
          this.applyQueryParams(params);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      testId: [null, [Validators.required]],
      reagentCode: [null],
      reagentId: [null],
      lotNumber: [null],
      receivedDateFrom: [null],
      receivedDateTo: [null]
    }, {
      validators: [this.dateRangeValidator()]
    });
  }

  private dateRangeValidator() {
    return (formGroup: FormGroup) => {
      const fromDate = formGroup.get('receivedDateFrom')?.value;
      const toDate = formGroup.get('receivedDateTo')?.value;

      if (!fromDate || !toDate) return null;

      const from = moment.isMoment(fromDate) ? fromDate : moment(fromDate);
      const to = moment.isMoment(toDate) ? toDate : moment(toDate);

      if (to.isBefore(from, 'day')) {
        return { dateRangeInvalid: true };
      }

      return null;
    };
  }

  private setupFormListeners(): void {
    this.searchForm.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(testId => {
        this.testIdValue.set(testId);
        this.onTestIdChange(testId);
      });

    this.searchForm.get('reagentCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(reagentCode => {
        this.reagentCodeValue.set(reagentCode);
        this.onReagentCodeChange(reagentCode);
      });

    this.searchForm.get('lotNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(lotNumber => {
        this.lotNumberValue.set(lotNumber);
      });

    this.searchForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formDirty.set(this.searchForm.dirty);
      });
  }

  private setupSearchListeners(): void {
    this.testIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.testIdSearch.set(value || ''));

    this.reagentCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.reagentCodeSearch.set(value || ''));

    this.lotNumberSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.lotNumberSearch.set(value || ''));

    this.reagentIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.reagentIdSearch.set(value || ''));
  }

  private setupDateValidation(): void {
    const toDateControl = this.searchForm.get('receivedDateTo');

    this.searchForm.get('receivedDateFrom')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.validateDates();
        if (value && moment.isMoment(value)) {
          this.minToDate.set(value);
        } else if (value) {
          this.minToDate.set(moment(value));
        } else {
          this.minToDate.set(null);
        }

        if (value) {
          toDateControl?.setValidators([Validators.required]);
        } else {
          toDateControl?.clearValidators();
        }
        toDateControl?.updateValueAndValidity({ emitEvent: false });
      });

    toDateControl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateDates());
  }

  private initializeTableConfig(): void {
    const columns: TableColumn<ReagentDto>[] = [
      {
        key: 'reagent',
        header: 'Reagent',
        sortable: false,
        type: 'text',
        width: '108px',
        valueFormatter: (value: string | null) => value || '–'
      },
      {
        key: 'reagentDescription',
        header: 'Reagent Description',
        sortable: false,
        type: 'text',
        width: '273px',
        valueFormatter: (value: string | null) => value || '–'
      },
      {
        key: 'reagentId',
        header: 'Reagent ID',
        sortable: false,
        type: 'text',
        width: '138px',
        valueFormatter: (value: string | null) => value || '–'
      },
      {
        key: 'receivedDate',
        header: 'Received Date',
        sortable: false,
        type: 'text',
        width: '177px',
        valueFormatter: (value: string | null) => value ? this.formatDate(value) : '–'
      },
      {
        key: 'supplier',
        header: 'Supplier',
        sortable: false,
        type: 'text',
        width: '132px',
        valueFormatter: (value: string | null) => value || '–'
      },
      {
        key: 'supplierDescription',
        header: 'Supplier Description',
        sortable: false,
        type: 'text',
        width: '183px',
        valueFormatter: (value: string | null) => value || '–'
      },
      {
        key: 'expirationDate',
        header: 'Expiration Date',
        sortable: false,
        type: 'text',
        width: '198px',
        valueFormatter: (value: string | null) => value ? this.formatDateTime(value) : '–'
      }
    ];

    const pagination: PaginationConfig = {
      pageSize: this.pageSize(),
      pageIndex: this.pageIndex(),
      totalRecords: this.totalRecords(),
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    };

    this.tableConfig = {
      columns,
      pagination,
      rowActions: [
        { label: 'View Test Kits', action: 'viewTestKits' }
      ],
      showActionsAsMenu: true,
      stickyHeader: true,
      showPagination: true,
      emptyMessage: 'No Results to Display',
      emptySubMessage: 'Please enter search criteria to view results',
      loadingMessage: 'Loading reagents...',
      noDataIcon: 'search',
      showTableOnEmpty: false,
      enableRowHighlight: false,
      hideExpandAllInHeader: true
    };
  }

  private loadTestIds(): void {
    this.loadingTestIds.set(true);

    this.reagentQueryService.getTestIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (testIds) => {
          this.testIds.set(testIds);
          this.loadingTestIds.set(false);
          this.applyQueryParams();
        },
        error: () => {
          this.testIds.set([]);
          this.loadingTestIds.set(false);
          this.snackbarService.showError('Failed to load test IDs. Please refresh.');
        }
      });
  }

  private applyQueryParams(routeParams?: Record<string, string>): void {
    const params = routeParams ?? this.route.snapshot.queryParams;
    const testId = params['testId'];
    const reagentId = params['reagentId'];

    if (!testId) return;

    this.searchForm.get('testId')?.setValue(testId);

    if (reagentId) {
      this.searchForm.get('reagentId')?.setValue(reagentId);
    }

    this.onRetrieve();
  }

  private loadReagentCodes(testId: string): void {
    this.loadingReagentCodes.set(true);
    this.reagentCodes.set([]);

    this.reagentQueryService.getReagentCodes(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.reagentCodes.set(codes);
          this.loadingReagentCodes.set(false);
        },
        error: () => {
          this.reagentCodes.set([]);
          this.loadingReagentCodes.set(false);
        }
      });
  }

  private loadLotNumbers(testId: string, reagentCode?: string | null): void {
    this.loadingLotNumbers.set(true);

    this.reagentQueryService.getLotNumbers(testId, reagentCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lotNumbers) => {
          this.lotNumbers.set(lotNumbers);
          this.loadingLotNumbers.set(false);
        },
        error: () => {
          this.lotNumbers.set([]);
          this.loadingLotNumbers.set(false);
        }
      });
  }

  private loadReagentIds(testId: string): void {
    this.loadingReagentIds.set(true);
    this.reagentIds.set([]);

    this.reagentQueryService.getReagentIds(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ids) => {
          this.reagentIds.set(ids);
          this.loadingReagentIds.set(false);
        },
        error: () => {
          this.reagentIds.set([]);
          this.loadingReagentIds.set(false);
        }
      });
  }

  get f() {
    return this.searchForm.controls;
  }

  protected onTestIdChange(testId: string): void {
    // Reset dependent dropdowns
    this.searchForm.patchValue({ reagentCode: null, lotNumber: null, reagentId: null }, { emitEvent: false });
    this.reagentCodeValue.set(null);
    this.lotNumberValue.set(null);
    this.reagentCodes.set([]);
    this.lotNumbers.set([]);
    this.reagentIds.set([]);

    if (testId) {
      this.loadReagentCodes(testId);
      this.loadLotNumbers(testId, null);
      this.loadReagentIds(testId);
    }
  }

  protected onReagentCodeChange(reagentCode: string | null): void {
    const testId = this.searchForm.get('testId')?.value;
    this.searchForm.patchValue({ lotNumber: null }, { emitEvent: false });
    this.lotNumberValue.set(null);
    this.lotNumbers.set([]);

    if (testId) {
      this.loadLotNumbers(testId, reagentCode || null);
    }
  }

  protected onDropdownOpened(opened: boolean): void {
    if (!opened) {
      this.testIdSearchControl.setValue('');
      this.reagentCodeSearchControl.setValue('');
      this.lotNumberSearchControl.setValue('');
    }
  }

  checkTestIdTruncation(el: HTMLElement): void {
    this.isTestIdTruncated = el.scrollWidth > el.clientWidth;
  }

  checkReagentCodeTruncation(el: HTMLElement): void {
    this.isReagentCodeTruncated = el.scrollWidth > el.clientWidth;
  }

  checkLotNumberTruncation(el: HTMLElement): void {
    this.isLotNumberTruncated = el.scrollWidth > el.clientWidth;
  }

  protected onRetrieve(): void {
    this.submitted.set(true);
    this.error.set(null);

    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    this.pageIndex.set(0);
    this.performSearch();
  }

  private performSearch(): void {
    this.loading.set(true);
    this.expandedRows.set(new Set());

    const formValue = this.searchForm.getRawValue();
    const skip = this.pageIndex() * this.pageSize();

    const request: ReagentSearchRequest = {
      testId: formValue.testId,
      reagentCode: formValue.reagentCode || undefined,
      reagentId: formValue.reagentId?.trim() || undefined,
      lotNumber: formValue.lotNumber || undefined,
      dateStart: formValue.receivedDateFrom ?
        moment(formValue.receivedDateFrom).format('YYYY-MM-DD') : undefined,
      dateEnd: formValue.receivedDateTo ?
        moment(formValue.receivedDateTo).format('YYYY-MM-DD') : undefined,
      skip,
      take: this.pageSize()
    };

    this.reagentQueryService.searchReagents(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.reagents.set(response.reagents);
          this.totalRecords.set(response.totalRecords);
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: response.totalRecords,
              pageSize: this.pageSize(),
              pageIndex: this.pageIndex()
            }
          };
          this.loading.set(false);
        },
        error: () => {
          this.reagents.set([]);
          this.totalRecords.set(0);
          this.error.set('Failed to retrieve reagents. Please try again.');
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: 0,
              pageSize: this.pageSize(),
              pageIndex: this.pageIndex()
            }
          };
          this.loading.set(false);
        }
      });
  }

  protected onClearAll(): void {
    this.searchForm.reset();
    this.testIdValue.set(null);
    this.reagentCodeValue.set(null);
    this.lotNumberValue.set(null);
    this.submitted.set(false);
    this.formDirty.set(false);
    this.reagents.set([]);
    this.totalRecords.set(0);
    this.pageIndex.set(0);
    this.pageSize.set(25);
    this.expandedRows.set(new Set());
    this.error.set(null);
    this.reagentCodes.set([]);
    this.lotNumbers.set([]);
    this.reagentIds.set([]);
    this.loadedNotes.set(new Map());
    this.minToDate.set(null);
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        totalRecords: 0,
        pageSize: 25,
        pageIndex: 0
      }
    };
  }

  protected onPageChange(event: TablePageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);

    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageSize: event.pageSize,
        pageIndex: event.pageIndex
      }
    };

    if (this.submitted()) {
      this.performSearch();
    }
  }

  protected onRowExpand(row: ReagentDto): void {
    const expanded = new Set(this.expandedRows());
    const rowKey = row.reagentId;

    if (expanded.has(rowKey)) {
      expanded.delete(rowKey);
    } else {
      expanded.add(rowKey);
      // Load note if present and not yet loaded
      if (row.noteId != null) {
        const notes = this.loadedNotes();
        if (!notes.has(row.noteId)) {
          this.loadNote(row.noteId);
        }
      }
    }

    this.expandedRows.set(expanded);
  }

  private loadNote(noteId: number): void {
    // Mark as loading with empty string sentinel
    this.loadedNotes.update(map => new Map(map).set(noteId, ''));

    this.reagentQueryService.getNote(noteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (note) => {
          this.loadedNotes.update(map => new Map(map).set(noteId, note));
        },
        error: () => {
          this.loadedNotes.update(map => new Map(map).set(noteId, null));
        }
      });
  }

  protected getNoteText(row: ReagentDto): string | null {
    if (row.noteId == null) return null;
    return this.loadedNotes().get(row.noteId) ?? null;
  }

  protected isNoteLoading(row: ReagentDto): boolean {
    if (row.noteId == null) return false;
    return this.loadedNotes().get(row.noteId) === '';
  }

  protected onRowAction(event: TableRowActionEvent<ReagentDto>): void {
    switch (event.action) {
      case 'viewTestKits':
        this.dialog.open(TestKitsDialogComponent, {
          width: '450px',
          maxWidth: '100vw',
          height: 'calc(100vh - 64px)',
          maxHeight: 'calc(100vh - 64px)',
          position: { top: '64px', right: '0', bottom: '0' },
          data: {
            reagentId: event.row.reagentId,
            testId: this.searchForm.get('testId')?.value
          } as TestKitsDialogData,
          panelClass: 'side-panel-dialog',
          disableClose: false,
        });
        break;
    }
  }

  protected showPreparationDetails(row: ReagentDto): void {
    if (!row.preparationFlag || !['P', 'I'].includes(row.preparationFlag)) return;

    this.dialog.open(PreparationDetailsDialogComponent, {
      width: '700px',
      maxWidth: '100vw',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { top: '64px', right: '0', bottom: '0' },
      data: { reagentId: row.reagentId } as PreparationDetailsDialogData,
      panelClass: 'side-panel-dialog',
      disableClose: false,
    });
  }

  protected getContextHint(row: ReagentDto): string | null {
    switch (row.preparationFlag) {
      case 'P': return 'Preparation details available. Test kits prepared using this reagent can be viewed via the row menu.';
      case 'I': return 'Preparation details available for this prepared reagent.';
      case 'Y': return 'This is a prepared reagent (reagent mix).';
      default: return null;
    }
  }

  protected onFromDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.searchForm.get('receivedDateFrom')
    );
  }

  protected onFromDateBlur(): void {
    const control = this.searchForm.get('receivedDateFrom');
    if (control) {
      control.markAsTouched();
      this.validateDates();
    }
  }

  protected onToDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.searchForm.get('receivedDateTo')
    );
  }

  protected onToDateBlur(): void {
    const control = this.searchForm.get('receivedDateTo');
    if (control) {
      control.markAsTouched();
      this.validateDates();
    }
  }

  private validateDates(): void {
    const fromControl = this.searchForm.get('receivedDateFrom');
    const toControl = this.searchForm.get('receivedDateTo');

    this.clearCustomDateErrors(fromControl);
    this.clearCustomDateErrors(toControl);

    if (fromControl?.hasError('matDatepickerParse') || toControl?.hasError('matDatepickerParse')) {
      return;
    }

    const from = fromControl?.value;
    const to = toControl?.value;

    if (!from || !to) return;

    const fromStr = moment.isMoment(from) ? from.format('YYYY-MM-DD') : moment(from).format('YYYY-MM-DD');
    const toStr = moment.isMoment(to) ? to.format('YYYY-MM-DD') : moment(to).format('YYYY-MM-DD');
    if (toStr < fromStr) {
      this.addDateError(toControl, 'toBeforeFrom');
    }
  }

  private clearCustomDateErrors(control: AbstractControl | null): void {
    if (!control?.errors) return;
    const errors = { ...control.errors };
    delete errors['toBeforeFrom'];
    control.setErrors(Object.keys(errors).length ? errors : null);
  }

  private addDateError(control: AbstractControl | null, errorKey: string): void {
    if (!control) return;
    control.setErrors({ ...control.errors, [errorKey]: true });
    control.markAsTouched();
  }

  protected formatDate(value: string): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  protected formatDateTime(value: string): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : value;
  }

  protected formatPackageInsertDate(value: string): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD - MMM').toUpperCase() : value;
  }
}
