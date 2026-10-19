import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { CheckInBatchExceptionApiService } from './services/check-in-batch-exception-api.service';
import {
  CheckInBatchExceptionDto,
  CheckInBatchExceptionDisplay,
  ValidBatchDto,
  ExceptionType,
  UnitAttributeDto,
} from './models/check-in-batch-exception.model';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';

@Component({
  selector: 'app-check-in-batch-exception-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSortModule,
    MatAutocompleteModule,
    MatSidenavModule,
    DataTable,
    SearchBar,
  ],
  templateUrl: './check-in-batch-exception-query.html',
  styleUrls: ['./check-in-batch-exception-query.scss'],
})
export class CheckInBatchExceptionQueryComponent implements OnInit, OnDestroy {
  @ViewChild('sidePanel') sidePanel!: MatDrawer;
  @ViewChild(FormGroupDirective) private formDirective!: FormGroupDirective;
  // Unique ID generation for accessibility (REQUIRED)
  private static nextId = 0;
  protected readonly componentId = `check-in-batch-exception-query-${CheckInBatchExceptionQueryComponent.nextId++}`;

  // Generate unique IDs for elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(CheckInBatchExceptionApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  // Side panel state
  protected readonly sidePanelOpen = signal<boolean>(false);
  protected readonly selectedUnitId = signal<string>('');
  protected readonly unitAttributes = signal<UnitAttributeDto[]>([]);
  protected readonly loadingAttributes = signal<boolean>(false);
  protected readonly attributesError = signal<string | null>(null);

  // DataTable configuration for unit attributes
  protected attributesTableConfig: DataTableConfig<UnitAttributeDto> = {
    columns: [
      { key: 'attributeGroup', header: 'Attribute', sortable: true },
      { key: 'groupDescription', header: 'Group', sortable: false },
      { key: 'attributeCode', header: 'Code', sortable: false },
      { key: 'codeDescription', header: 'Description', sortable: false },
    ],
    sortConfig: { column: '', direction: 'default' },
    stickyHeader: false,
    showPagination: false,
    emptyMessage: 'No attributes found',
    emptySubMessage: 'This unit has no attributes assigned.',
    noDataIcon: 'info',
  };

  // Signal-based state
  protected readonly batchExceptions = signal<CheckInBatchExceptionDisplay[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly isRetrieving = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);
  protected readonly searchPerformed = signal<boolean>(false);
  protected searchKeyword: string = '';

  // Batch dropdown signals
  protected readonly allBatches = signal<ValidBatchDto[]>([]);
  protected readonly loadingBatches = signal<boolean>(false);
  private readonly batchIdSearch = signal('');

  // Computed signal for filtered batches
  protected readonly filteredBatches = computed(() => {
    const search = this.batchIdSearch().toLowerCase();
    const batches = this.allBatches();

    if (!search || search.length < 2) {
      return batches;
    }

    return batches.filter(b =>
      b.batchId?.toLowerCase().includes(search)
    );
  });

  // SearchBar configuration
  protected readonly searchConfig: SearchBarConfig = {
    placeholder: 'Search by unit ID',
    minLength: 0,
    ariaLabel: 'Search by unit ID',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true,
  };

  // Computed values
  protected readonly totalCount = computed(() => this.batchExceptions().length);
  protected readonly hasResults = computed(() => this.batchExceptions().length > 0);
  protected readonly showEmptyState = computed(() => this.searchPerformed() && !this.hasResults() && !this.loading());

  // Form
  searchForm!: FormGroup;

  // Main table configuration
  protected mainTableConfig: DataTableConfig<CheckInBatchExceptionDisplay> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: true, minWidth: '150px' },
      { key: 'collDateDisplay', header: 'Collection Date', sortable: false, minWidth: '130px' },
      { key: 'cueDisplay', header: 'Cue', sortable: false, minWidth: '70px' },
      { key: 'catalogNumber', header: 'Catalog Number', sortable: false, minWidth: '130px' },
      { key: 'groupSiteId', header: 'Group/Site ID', sortable: false, minWidth: '120px' },
      { key: 'redTubeFlag', header: 'Red Tube 1', sortable: false, minWidth: '100px', valueFormatter: (v) => this.formatYesNo(v) },
      { key: 'redTube2', header: 'Red Tube 2', sortable: false, minWidth: '100px', valueFormatter: (v) => this.formatYesNo(v) },
      { key: 'purpleTubeFlag', header: 'Purple Tube 1', sortable: false, minWidth: '100px', valueFormatter: (v) => this.formatYesNo(v) },
      { key: 'serumPlasmaInd', header: 'Purple Tube 2', sortable: false, minWidth: '100px', valueFormatter: (v) => this.formatYesNo(v) },
      { key: 'bleedStartTimeDisplay', header: 'Bleed Start Time', sortable: false, minWidth: '130px' },
      { key: 'bleedEndTimeDisplay', header: 'Bleed End Time', sortable: false, minWidth: '130px' },
      { key: 'qcCheckinDateDisplay', header: 'QC Date', sortable: false, minWidth: '120px' },
    ],
    rowActions: [
      {
        icon: 'visibility',
        label: 'View Attributes',
        ariaLabel: 'View attributes',
        action: 'view-attributes',
        color: 'primary',
      },
    ],
    sortConfig: { column: '', direction: 'default' },
    stickyHeader: true,
    stickyActionsColumn: true,
    showActionsAsMenu: false,
    showPagination: false,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter search criteria to view results',
    noDataIcon: 'search',
    showTableOnEmpty: false,
    enableRowHighlight: true,
  };

  ngOnInit(): void {
    this.initForm();
    this.loadValidBatches();
    this.subscribeToChapterChanges();

    this.searchForm.get('batchId')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.batchIdSearch.set(value || '');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
        this.loadValidBatches();
      });
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      batchId: ['', [Validators.required]],
    });
  }

  private loadValidBatches(search?: string): void {
    this.loadingBatches.set(true);

    this.apiService
      .getValidBatches(search)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batches) => {
          this.allBatches.set(batches);
          this.loadingBatches.set(false);
        },
        error: (err) => {
          console.error('Error loading valid batches:', err);
          this.loadingBatches.set(false);
          this.allBatches.set([]);
        },
      });
  }

  get f() {
    return this.searchForm.controls;
  }

  onRetrieve(): void {
    this.submitted.set(true);

    if (this.searchForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const batchId = this.searchForm.value.batchId.trim();
    this.isRetrieving.set(true);
    this.loadBatchExceptions(batchId);
  }

  private loadBatchExceptions(batchId: string, unitIdFilter?: string, options: { isSearch?: boolean } = {}): void {
    this.loading.set(true);
    this.error.set(null);

    if (!options.isSearch) {
      this.batchExceptions.set([]);
      this.searchPerformed.set(false);
    }

    this.apiService
      .getBatchExceptions(batchId, unitIdFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const formattedData = this.formatExceptions(data);
          this.batchExceptions.set(formattedData);
          this.loading.set(false);
          this.isRetrieving.set(false);
          this.searchPerformed.set(true);

          if (data.length === 0) {
            const message = unitIdFilter
              ? `No exceptions found for unit ID "${unitIdFilter}" in this batch.`
              : 'No exceptions found for this batch. All units have complete data.';
            this.showInfoMessage(message);
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.isRetrieving.set(false);
          this.searchPerformed.set(true);
          const errorMessage = this.getErrorMessage(err);
          this.error.set(errorMessage);
          this.showErrorMessage(errorMessage);
        },
      });
  }

  private formatExceptions(
    data: CheckInBatchExceptionDto[]
  ): CheckInBatchExceptionDisplay[] {
    const chapterTimezone = this.headerService.getCurrentChapterTimezone();

    return data.map((exception) => ({
      ...exception,
      collDateDisplay: this.formatDate(exception.collDate),
      bleedStartTimeDisplay: this.formatTime(exception.bleedStartTime, chapterTimezone),
      bleedEndTimeDisplay: this.formatTime(exception.bleedEndTime, chapterTimezone),
      qcCheckinDateDisplay: this.formatDate(exception.qcCheckinDate),
      cueDisplay: this.determineCue(exception),
    }));
  }

  private formatDate(value: string | null): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  private formatTime(value: string | null, timezone: string): string {
    if (!value) return '';
    const m = moment(value);
    if (!m.isValid()) return '';

    // Convert from UTC to chapter local time using offset
    return m.utcOffset(timezone).format('HH:mm');
  }

  private formatYesNo(value: string | null | undefined): string {
    if (!value) return 'No';
    return value.toUpperCase() === 'Y' ? 'Yes' : 'No';
  }

  private determineCue(exception: CheckInBatchExceptionDto): string {
    // Display actual donor decision code from database (matches legacy MCQEXCP4)
    return exception.donorDecisionCode || '';
  }

  private getErrorMessage(error: any): string {
    // Pattern 1: error.error.errorResponse with errorCode
    if (error?.error?.errorResponse?.errorCode && error?.error?.errorResponse?.error) {
      return `Error ${error.error.errorResponse.errorCode}: ${error.error.errorResponse.error}`;
    }

    // Pattern 2: error.error with errorCode and message
    if (error?.error?.errorCode && error?.error?.message) {
      return `Error ${error.error.errorCode}: ${error.error.message}`;
    }

    // Pattern 3: HTTP 404 with specific check
    if (error?.status === 404) {
      return error?.error?.message || 'Batch not found or is not a check-in batch (CB type). Please verify the batch ID.';
    }

    // Default fallback
    return error?.error?.message || 'Failed to retrieve batch exceptions. Please try again.';
  }

  onClear(): void {
    this.formDirective?.resetForm();
    this.batchExceptions.set([]);
    this.searchKeyword = '';
    this.submitted.set(false);
    this.isRetrieving.set(false);
    this.searchPerformed.set(false);
    this.error.set(null);
  }

  onSearchChange(keyword: string): void {
    this.searchKeyword = keyword;
    const batchId = this.searchForm.value.batchId?.trim();

    if (!batchId) {
      this.showErrorMessage('Please select a batch before searching.');
      return;
    }

    const unitIdFilter = keyword.trim();
    this.loadBatchExceptions(batchId, unitIdFilter || undefined, { isSearch: true });
  }

  onRowAction(event: any): void {
    if (event.action === 'view-attributes') {
      this.onViewAttributes(event.row);
    }
  }

  onViewAttributes(exception: CheckInBatchExceptionDisplay): void {
    this.selectedUnitId.set(exception.unitId);
    this.loadingAttributes.set(true);
    this.attributesError.set(null);
    this.unitAttributes.set([]);

    this.sidePanel.open();

    this.apiService
      .getUnitAttributes(exception.unitId, exception.collDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.unitAttributes.set(data);
          this.loadingAttributes.set(false);
        },
        error: (err) => {
          console.error('Error loading unit attributes:', err);
          let errorMessage = 'Failed to load unit attributes.';

          if (err?.error?.message) {
            errorMessage = err.error.message;
          } else if (err?.status === 404) {
            errorMessage = 'No attributes found for this unit.';
          } else if (err?.status === 500) {
            errorMessage = 'A server error occurred. Please try again or contact support.';
          }

          this.attributesError.set(errorMessage);
          this.loadingAttributes.set(false);
        },
      });
  }

  onSortChange(event: TableSortEvent): void {
    this.mainTableConfig = {
      ...this.mainTableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
    this.batchExceptions.set(
      this.sortData(this.batchExceptions(), event.column as keyof CheckInBatchExceptionDisplay, event.direction)
    );
  }

  onAttributesSortChange(event: TableSortEvent): void {
    this.attributesTableConfig = {
      ...this.attributesTableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
    this.unitAttributes.set(
      this.sortData(this.unitAttributes(), event.column as keyof UnitAttributeDto, event.direction)
    );
  }

  private sortData<T>(data: T[], column: keyof T, direction: 'A' | 'D' | 'default'): T[] {
    if (direction === 'default') return data;
    return [...data].sort((a, b) => {
      const valA = ((a[column] as string) || '').toLowerCase();
      const valB = ((b[column] as string) || '').toLowerCase();
      const cmp = valA.localeCompare(valB);
      return direction === 'A' ? cmp : -cmp;
    });
  }

  onCloseSidePanel(): void {
    this.sidePanel.close();
    this.selectedUnitId.set('');
    this.unitAttributes.set([]);
    this.attributesError.set(null);
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  private showInfoMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['info-snackbar'],
    });
  }

  protected formatExceptionType(type: ExceptionType | null): string {
    if (!type) return 'Unknown';

    switch (type) {
      case 'MISSING_DATA':
        return 'Missing Data';
      case 'HAS_ATTRIB_14':
        return 'Has Attrib 14';
      default:
        return type;
    }
  }

  protected getExceptionTypeClass(type: ExceptionType | null): string {
    if (!type) return 'unknown';

    switch (type) {
      case 'MISSING_DATA':
        return 'missing-data';
      case 'HAS_ATTRIB_14':
        return 'has-attrib';
      default:
        return 'unknown';
    }
  }
}
