import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment, { Moment } from 'moment';

import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';

import { TransportBatchQueryApiService } from './services/transport-batch-query-api.service';
import {
  TransportBatchHeaderDto,
  TransportBatchDetailDto,
  WarehouseLookupDto,
  BatchStatusLookupDto,
  RecentBatchDto,
  TransportBatchDisplay,
  TransportBatchDetailDisplay
} from './models/transport-batch-query.model';

/**
 * Transport Batch Query Component
 *
 * Provides a read-only interface to query and view warehouse transport batch information.
 * Features:
 * - Multi-criteria filtering (warehouse, batch ID, date range, status)
 * - Master-detail layout (batch list + unit details)
 * - Client-side sorting of unit details
 * - Empty state for initial load
 */
@Component({
  selector: 'app-transport-batch-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatCardModule,
    MatTableModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './transport-batch-query.html',
  styleUrls: ['./transport-batch-query.scss']
})
export class TransportBatchQuery implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `transport-batch-query-${TransportBatchQuery.nextId++}`;

  // Generate unique IDs for elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  // Services
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(TransportBatchQueryApiService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly dateAdapter = inject(DateAdapter<Moment>);

  // Destroy subject for cleanup
  private readonly destroy$ = new Subject<void>();

  // Chapter timezone and dates
  minDate!: Moment;
  maxDate!: Moment;
  chapterTimezone = '';

  // Page header configuration - populated dynamically from menu-items API
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  // Filter form
  filterForm!: FormGroup;

  // Dropdown options
  readonly warehouses = signal<WarehouseLookupDto[]>([]);
  readonly batchStatuses = signal<BatchStatusLookupDto[]>([]);
  readonly recentBatches = signal<RecentBatchDto[]>([]);

  // Search controls for dropdowns
  readonly sentFromSearchCtrl = new FormControl<string>('');
  readonly sentToSearchCtrl = new FormControl<string>('');
  readonly batchIdSearchCtrl = new FormControl<string>('');
  readonly batchStatusSearchCtrl = new FormControl<string>('');

  // Search term signals
  readonly sentFromSearchTerm = signal<string>('');
  readonly sentToSearchTerm = signal<string>('');
  readonly batchIdSearchTerm = signal<string>('');
  readonly batchStatusSearchTerm = signal<string>('');

  // Filtered dropdown options
  readonly filteredSentFromWarehouses = computed(() => {
    const term = this.sentFromSearchTerm().toLowerCase();
    if (!term) return this.warehouses();
    return this.warehouses().filter(w =>
      w.code.toLowerCase().includes(term) ||
      w.description.toLowerCase().includes(term)
    );
  });

  readonly filteredSentToWarehouses = computed(() => {
    const term = this.sentToSearchTerm().toLowerCase();
    if (!term) return this.warehouses();
    return this.warehouses().filter(w =>
      w.code.toLowerCase().includes(term) ||
      w.description.toLowerCase().includes(term)
    );
  });

  readonly filteredBatchIds = computed(() => {
    const term = this.batchIdSearchTerm().toLowerCase();
    if (!term) return this.recentBatches();
    return this.recentBatches().filter(b =>
      b.batchId.toLowerCase().includes(term)
    );
  });

  readonly filteredBatchStatuses = computed(() => {
    const term = this.batchStatusSearchTerm().toLowerCase();
    if (!term) return this.batchStatuses();
    return this.batchStatuses().filter(s =>
      s.status.toLowerCase().includes(term)
    );
  });

  // Batch data
  readonly batches = signal<TransportBatchDisplay[]>([]);
  readonly selectedBatch = signal<TransportBatchDisplay | null>(null);
  readonly batchDetails = signal<TransportBatchDetailDisplay[]>([]);
  readonly sortedBatchDetails = signal<TransportBatchDetailDisplay[]>([]);

  // Loading states
  readonly loadingDropdowns = signal<boolean>(false);
  readonly loadingBatches = signal<boolean>(false);
  readonly loadingDetails = signal<boolean>(false);

  // Error states
  readonly error = signal<string | null>(null);

  // UI states
  readonly showEmptyState = signal<boolean>(true);
  readonly hasRetrievedData = signal<boolean>(false);

  /**
   * Check if RETRIEVE button should be disabled
   * Disabled when: nothing selected, validation errors, or invalid date range
   */
  isRetrieveDisabled(): boolean {
    if (!this.filterForm) return true;

    const values = this.filterForm.value;
    const fromDate = values.fromDate;
    const toDate = values.toDate;

    // Check for validation errors
    const fromDateControl = this.filterForm.get('fromDate');
    const toDateControl = this.filterForm.get('toDate');

    const hasErrors = fromDateControl?.hasError('invalidDate') ||
                      fromDateControl?.hasError('matDatepickerParse') ||
                      fromDateControl?.hasError('matDatepickerMax') ||
                      toDateControl?.hasError('invalidDate') ||
                      toDateControl?.hasError('matDatepickerParse') ||
                      toDateControl?.hasError('matDatepickerMax') ||
                      this.filterForm.hasError('dateRangeInvalid');

    if (hasErrors) {
      return true;
    }

    // If both dates provided, check order
    if (fromDate && toDate) {
      const fromMoment = moment(fromDate);
      const toMoment = moment(toDate);
      if (fromMoment.isAfter(toMoment)) {
        return true;
      }
    }

    return false;
  }

  readonly unitCount = computed(() => this.batchDetails().length);

  // Table columns for unit details
  readonly displayedColumns: string[] = [
    'unitId',
    'productCode',
    'receiveWarehouse',
    'receiveDate',
    'receiveUser',
    'reconReason',
    'reconDetail'
  ];

  // Current sort direction - 'D' for descending (default per Figma), 'A' for ascending
  currentSortDirection: 'A' | 'D' = 'D';

  constructor() {
    this.initializeForm();

    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
          actions: []
        };
      }
    });
  }

  ngOnInit(): void {
    // Initialize chapter timezone
    this.chapterTimezone = this.headerService.getCurrentChapterTimezone();
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterTimezone);
    // Set maxDate to chapter local date (today) to prevent future date selection (error 0503)
    this.maxDate = DateFieldValidationUtility.getMinDate(this.chapterTimezone);

    // Subscribe to search control changes
    this.sentFromSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.sentFromSearchTerm.set(value || ''));

    this.sentToSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.sentToSearchTerm.set(value || ''));

    this.batchIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.batchIdSearchTerm.set(value || ''));

    this.batchStatusSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.batchStatusSearchTerm.set(value || ''));

    // Subscribe to chapter changes
    this.subscribeToChapterChanges();

    // Load dropdown options
    this.loadDropdowns();
  }

  /**
   * Subscribe to chapter changes to reload data when chapter is switched
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Update chapter timezone
        this.chapterTimezone = this.headerService.getCurrentChapterTimezone();
        this.minDate = DateFieldValidationUtility.getMinDate(this.chapterTimezone);
        this.maxDate = DateFieldValidationUtility.getMinDate(this.chapterTimezone);

        // Reset form and state
        this.onClear();

        // Clear search controls
        this.sentFromSearchCtrl.setValue('');
        this.sentToSearchCtrl.setValue('');
        this.batchIdSearchCtrl.setValue('');
        this.batchStatusSearchCtrl.setValue('');

        // Reload dropdowns for new chapter
        this.loadDropdowns();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the filter form with validation
   */
  private initializeForm(): void {
    this.filterForm = this.fb.group(
      {
        sentFrom: [''],
        sentTo: [''],
        batchId: [''],
        fromDate: [null as Moment | null, [DateFieldValidationUtility.validDateValidator()]],
        toDate: [null as Moment | null, [DateFieldValidationUtility.validDateValidator()]],
        batchStatus: ['']
      },
      {
        validators: [this.dateRangeValidator()]
      }
    );
  }

  /**
   * Custom validator to ensure fromDate <= toDate
   */
  private dateRangeValidator() {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const fromDateControl = formGroup.get('fromDate');
      const toDateControl = formGroup.get('toDate');

      if (!fromDateControl || !toDateControl) {
        return null;
      }

      const fromDate = fromDateControl.value;
      const toDate = toDateControl.value;

      // Skip validation if either date is invalid or missing
      if (!fromDate || !toDate) {
        return null;
      }

      if (fromDateControl.hasError('matDatepickerParse') ||
          fromDateControl.hasError('invalidDate') ||
          toDateControl.hasError('matDatepickerParse') ||
          toDateControl.hasError('invalidDate')) {
        return null;
      }

      const fromMoment = moment(fromDate);
      const toMoment = moment(toDate);

      if (fromMoment.isAfter(toMoment)) {
        return { dateRangeInvalid: true };
      }

      return null;
    };
  }

  /**
   * Load all dropdown options (warehouses, statuses, recent batches)
   * Each API call has error handling to allow partial loading if one fails
   */
  private loadDropdowns(): void {
    this.loadingDropdowns.set(true);

    forkJoin({
      warehouses: this.apiService.getWarehouses().pipe(
        catchError(err => {
          console.error('Error loading warehouses:', err);
          return of([]);
        })
      ),
      batchStatuses: this.apiService.getBatchStatuses().pipe(
        catchError(err => {
          console.error('Error loading batch statuses:', err);
          return of([]);
        })
      ),
      recentBatches: this.apiService.getRecentBatches().pipe(
        catchError(err => {
          console.error('Error loading recent batches:', err);
          return of([]);
        })
      )
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.warehouses.set(result.warehouses);
          this.batchStatuses.set(result.batchStatuses);
          // Remove duplicate batch IDs
          const uniqueBatches = this.removeDuplicateBatches(result.recentBatches);
          this.recentBatches.set(uniqueBatches);
          this.loadingDropdowns.set(false);
        },
        error: (error) => {
          console.error('Error loading dropdowns:', error);
          this.loadingDropdowns.set(false);
        }
      });
  }

  /**
   * Handle RETRIEVE button click
   */
  onRetrieve(): void {
    // Mark all fields as touched to show validation errors
    this.filterForm.markAllAsTouched();

    // Don't proceed if form is invalid
    if (this.filterForm.invalid || this.isRetrieveDisabled()) {
      return;
    }

    // Auto-populate missing date with a 30-day inclusive range
    this.autoPopulateDateRange();

    this.showEmptyState.set(false);
    this.hasRetrievedData.set(true);
    this.loadBatches();
  }

  /**
   * Auto-populate missing date fields to enforce a bounded query window.
   *
   * Rules (matching Oracle KEY-NEXT-ITEM on STATUS):
   * - Both dates empty → toDate = chapter local date, fromDate = toDate − 30 days.
   * - Only fromDate provided → toDate = min(fromDate + 30 days, chapter local date).
   * - Only toDate provided → fromDate = toDate − 30 days.
   */
  private autoPopulateDateRange(): void {
    const fromDateControl = this.filterForm.get('fromDate');
    const toDateControl = this.filterForm.get('toDate');
    const fromDate: Moment | null = fromDateControl?.value;
    const toDate: Moment | null = toDateControl?.value;

    if (!fromDate && !toDate) {
      // Both dates empty → only auto-fill if ALL other filters are also empty
      // (matches Oracle KEY-NEXT-ITEM: defaults only when entire form is blank)
      const values = this.filterForm.value;
      const allFiltersEmpty = !values.sentFrom && !values.sentTo &&
                              !values.batchId && !values.batchStatus;
      if (allFiltersEmpty) {
        const chapterToday = moment(this.maxDate);
        toDateControl?.setValue(chapterToday);
        fromDateControl?.setValue(moment(chapterToday).subtract(30, 'days'));
      }
    } else if (fromDate && !toDate) {
      // fromDate selected, toDate missing → add 30 days, cap at chapter local date
      let calculatedToDate = moment(fromDate).add(30, 'days');
      if (calculatedToDate.isAfter(this.maxDate)) {
        calculatedToDate = moment(this.maxDate);
      }
      toDateControl?.setValue(calculatedToDate);
    } else if (toDate && !fromDate) {
      // toDate selected, fromDate missing → subtract 30 days
      const calculatedFromDate = moment(toDate).subtract(30, 'days');
      fromDateControl?.setValue(calculatedFromDate);
    }
  }

  /**
   * Load batches based on filter criteria
   */
  private loadBatches(): void {
    this.loadingBatches.set(true);
    this.error.set(null);
    this.batches.set([]);
    this.selectedBatch.set(null);
    this.batchDetails.set([]);

    const formValue = this.filterForm.value;

    const queryDto = {
      fromWarehouse: formValue.sentFrom || undefined,
      toWarehouse: formValue.sentTo || undefined,
      batchId: formValue.batchId || undefined,
      fromDate: formValue.fromDate ? this.formatDateForApi(formValue.fromDate) : undefined,
      toDate: formValue.toDate ? this.formatDateForApi(formValue.toDate) : undefined,
      status: formValue.batchStatus || undefined,
      take: 100, // Get up to 100 batches
      skip: 0
    };

    this.apiService.queryBatches(queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Remove duplicate batch IDs from API response
          const uniqueData = this.removeDuplicateBatchHeaders(response.data);
          const enrichedBatches = this.enrichBatchesWithWarehouseDescriptions(uniqueData);
          this.batches.set(enrichedBatches);
          this.loadingBatches.set(false);

          // Auto-select first batch if available and move focus to batch list
          if (enrichedBatches.length > 0) {
            this.selectBatch(enrichedBatches[0]);
            setTimeout(() => {
              const heading = document.getElementById(this.elementId('batch-list-heading'));
              heading?.focus();
            });
          }
        },
        error: (error) => {
          console.error('Error loading batches:', error);
          this.loadingBatches.set(false);
          this.error.set('Failed to load batches. Please try again.');
          // HTTP interceptor handles error display
        }
      });
  }

  /**
   * Enrich batch data with warehouse descriptions for display
   */
  private enrichBatchesWithWarehouseDescriptions(batches: TransportBatchHeaderDto[]): TransportBatchDisplay[] {
    const warehouseMap = new Map(this.warehouses().map(w => [w.code, w.description]));

    return batches.map(batch => ({
      ...batch,
      fromWarehouseDescription: warehouseMap.get(batch.fromWarehouse) || batch.fromWarehouse,
      toWarehouseDescription: warehouseMap.get(batch.toWarehouse) || batch.toWarehouse
    }));
  }

  /**
   * Handle batch selection from the list
   */
  selectBatch(batch: TransportBatchDisplay): void {
    this.selectedBatch.set(batch);
    this.loadBatchDetails(batch.batchId);
  }

  /**
   * Load unit details for the selected batch
   */
  private loadBatchDetails(batchId: string): void {
    this.loadingDetails.set(true);
    this.batchDetails.set([]);
    this.sortedBatchDetails.set([]);

    this.apiService.getBatchDetails(batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const enrichedDetails = this.enrichDetailsForDisplay(response.data);
          // Apply default sort (Unit ID descending) to display data
          this.applyDefaultSort(enrichedDetails);
          this.loadingDetails.set(false);
        },
        error: (error) => {
          console.error('Error loading batch details:', error);
          this.loadingDetails.set(false);
          // HTTP interceptor handles error display
        }
      });
  }

  /**
   * Enrich detail data with formatted values for display
   */
  private enrichDetailsForDisplay(details: TransportBatchDetailDto[]): TransportBatchDetailDisplay[] {
    const warehouseMap = new Map(this.warehouses().map(w => [w.code, w.description]));

    return details.map(detail => ({
      ...detail,
      fullUnitId: detail.chkDigit ? `${detail.unitId}-${detail.chkDigit}` : detail.unitId,
      formattedReceiveDate: detail.receiveDate ? this.formatDateTime(detail.receiveDate) : '',
      receiveWarehouse: warehouseMap.get(detail.receiveWarehouse || '') || detail.receiveWarehouse
    }));
  }

  /**
   * Apply default sort (Unit ID descending) to batch details
   * Descending = highest values first (Z before A, 9 before 0)
   */
  private applyDefaultSort(details: TransportBatchDetailDisplay[]): void {
    this.batchDetails.set(details);
    this.currentSortDirection = 'D'; // Reset to default descending
    this.applySortDirection();
  }

  /**
   * Toggle sort direction for Unit ID column
   * Toggles between ascending (A) and descending (D)
   */
  toggleSort(): void {
    // Toggle between A and D
    this.currentSortDirection = this.currentSortDirection === 'D' ? 'A' : 'D';
    this.applySortDirection();
  }

  /**
   * Apply current sort direction to batch details
   */
  private applySortDirection(): void {
    const data = [...this.batchDetails()];
    const sortedData = data.sort((a, b) => {
      const aVal = (a.fullUnitId || a.unitId || '').toLowerCase();
      const bVal = (b.fullUnitId || b.unitId || '').toLowerCase();
      // Ascending: a before b if a < b; Descending: b before a if b > a
      return this.currentSortDirection === 'A' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    this.sortedBatchDetails.set(sortedData);
  }

  /**
   * Compare function for sorting
   */
  private compare(a: any, b: any, isAsc: boolean): number {
    // Handle null/undefined values
    if (a == null && b == null) return 0;
    if (a == null) return isAsc ? 1 : -1;
    if (b == null) return isAsc ? -1 : 1;

    // Convert to strings for comparison
    const aStr = String(a).toLowerCase();
    const bStr = String(b).toLowerCase();

    return (aStr < bStr ? -1 : 1) * (isAsc ? 1 : -1);
  }

  /**
   * Handle CLEAR button click
   */
  onClear(): void {
    this.filterForm.reset({
      sentFrom: '',
      sentTo: '',
      batchId: '',
      fromDate: null,
      toDate: null,
      batchStatus: ''
    });

    this.batches.set([]);
    this.selectedBatch.set(null);
    this.batchDetails.set([]);
    this.sortedBatchDetails.set([]);
    this.showEmptyState.set(true);
    this.hasRetrievedData.set(false);
    this.error.set(null);
  }

  /**
   * Format date for API (YYYY-MM-DD)
   */
  private formatDateForApi(date: Moment | null): string {
    if (!date) return '';
    return moment(date).format('YYYY-MM-DD');
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return '';
    try {
      return moment(dateString).format('DD-MMM-YYYY').toUpperCase();
    } catch {
      return dateString;
    }
  }

  /**
   * Format datetime for display (DD-MMM-YYYY HH:mm)
   */
  formatDateTime(dateString: string | null): string {
    if (!dateString) return '';
    try {
      return moment(dateString).format('DD-MMM-YYYY HH:mm').toUpperCase();
    } catch {
      return dateString;
    }
  }

  /**
   * Get warehouse description by code
   */
  getWarehouseDescription(code: string | null): string {
    if (!code) return '';
    const warehouse = this.warehouses().find(w => w.code === code);
    return warehouse ? warehouse.description : code;
  }

  /**
   * Check if a batch is selected
   */
  isBatchSelected(batch: TransportBatchDisplay): boolean {
    return this.selectedBatch()?.batchId === batch.batchId;
  }

  /**
   * Handle From Date input for validation
   */
  onFromDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('fromDate')
    );
  }

  /**
   * Handle To Date input for validation
   */
  onToDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('toDate')
    );
  }

  /**
   * Remove duplicate batches by batchId (for recent batches dropdown)
   */
  private removeDuplicateBatches(batches: RecentBatchDto[]): RecentBatchDto[] {
    const seen = new Set<string>();
    return batches.filter(batch => {
      if (seen.has(batch.batchId)) {
        return false;
      }
      seen.add(batch.batchId);
      return true;
    });
  }

  /**
   * Remove duplicate batch headers by batchId (for batch list panel)
   */
  private removeDuplicateBatchHeaders(batches: TransportBatchHeaderDto[]): TransportBatchHeaderDto[] {
    const seen = new Set<string>();
    return batches.filter(batch => {
      if (seen.has(batch.batchId)) {
        return false;
      }
      seen.add(batch.batchId);
      return true;
    });
  }
}
