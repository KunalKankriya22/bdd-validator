import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import moment from 'moment';

// Shared
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { MenuService } from '@shared/services/menu.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';

// Local
import { VistaInterfaceStatusService } from '../../services/vista-interface-status.service';
import { UploadedDataDialog } from '../uploaded-data-dialog/uploaded-data-dialog';
import {
  VistaInterfaceStatusDto,
  VistaInterfaceStatusQueryDto,
  StatusOption,
  DriveOption,
  ERROR_CODES
} from '../../models/vista-interface-status.model';

/**
 * Vista Interface Status Component
 *
 * Allows users to:
 * - Filter and search Vista interface upload status records
 * - View uploaded data details
 * - Change status (P or X only, with business rules)
 * - Sort and paginate results
 *
 * Business Rules:
 * - Cannot change status from R (Registered) to P (Pending) - Error 23009
 * - Only P (Pending) and X (Cancel) statuses allowed for updates
 * - At least one criterion required: From Date, To Date, or Drive ID (Error 19108)
 * - From Date cannot be a future date (Error 8030)
 * - To Date cannot exceed chapter local date + 1 (Error 8030)
 * - From Date must be <= To Date (Error 16223/16224)
 * - Uploaded Data (Lookup) only available for Completed (C) status
 */
@Component({
  selector: 'app-vista-interface-status',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  templateUrl: './vista-interface-status.html',
  styleUrls: ['./vista-interface-status.scss'],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ]
})
export class VistaInterfaceStatusComponent implements OnInit, OnDestroy {
  // Page header configuration - dynamically resolved from menu API
  protected readonly headerConfig = computed<PageHeaderConfig>(() => {
    const data = this.pageHeaderService.pageHeaderData();
    return {
      title: data?.title || '',
      subtitle: data?.subtitle || '',
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Vista Interface Status' }
      ],
    };
  });
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `vista-interface-status-${VistaInterfaceStatusComponent.nextId++}`;

  // Generate unique IDs for elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly vistaService = inject(VistaInterfaceStatusService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly menuService = inject(MenuService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  // Signals - Data
  protected readonly data = signal<VistaInterfaceStatusDto[]>([]);
  protected readonly totalCount = signal<number>(0);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly hasSearched = signal<boolean>(false);

  // Signals - UI State
  protected readonly editMode = signal<boolean>(false);
  protected readonly editedStatuses = signal<Map<string, 'P' | 'X'>>(new Map());
  protected readonly pageIndex = signal<number>(0);
  protected readonly pageSize = signal<number>(200);
  protected readonly sortColumn = signal<string | null>('DriveDate');
  protected readonly sortOrder = signal<'ASC' | 'DESC' | null>('ASC');
  protected readonly isLoadingMore = signal<boolean>(false);
  protected readonly hasMoreData = computed(() => this.data().length < this.totalCount());
  protected readonly saveSuccessMessage = signal<string>('');

  // Computed
  protected readonly isEmpty = computed(() => this.data().length === 0 && this.hasSearched());
  protected readonly isReady = computed(() => !this.loading() && !this.error());
  protected readonly hasChanges = computed(() => this.editedStatuses().size > 0);

  // Form
  filterForm!: FormGroup;

  // Dropdown options
  statusOptions: StatusOption[] = [];
  protected readonly driveOptions = signal<DriveOption[]>([]);
  protected readonly drivesIsTruncated = signal<boolean>(false);
  protected readonly drivesLovLimit = signal<number>(0);
  driveSearchControl = new FormControl('');
  filteredDriveOptions: DriveOption[] = [];

  // Table columns
  displayedColumns: string[] = [
    'driveDate',
    'driveId',
    'donorId',
    'name',
    'transactionId',
    'donationType',
    'procedureCode',
    'lastUpdateDateTime',
    'status',
    'actions'
  ];

  // Pagination options
  pageSizeOptions: number[] = [10, 25, 50, 100];

  ngOnInit(): void {
    this.initForm();
    this.loadStatusOptions();
    this.setupDriveSearch();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
      });
  }

  /**
   * Initialize filter form with validation.
   * Date fields are pre-filled with chapter local date.
   * At least one criterion (fromDate, toDate, or driveId) is required (Oracle error 19108).
   */
  private initForm(): void {
    const chapterLocalDate = this.chapterTimezoneService.getChapterLocalDate();

    this.filterForm = this.fb.group({
      driveFromDate: [chapterLocalDate, [Validators.required, this.createFromDateValidator()]],
      driveToDate: [chapterLocalDate, [Validators.required, this.createToDateValidator()]],
      driveId: [null],
      sponsor: [{ value: '-', disabled: true }],
      status: ['']
    }, {
      validators: [
        VistaInterfaceStatusComponent.atLeastOneCriterionValidator(),
        VistaInterfaceStatusComponent.dateRangeValidator()
      ]
    });

    this.filterForm.get('driveFromDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterForm.get('driveToDate')?.updateValueAndValidity({ emitEvent: false });
        this.loadDrives();
      });

    this.filterForm.get('driveToDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterForm.get('driveFromDate')?.updateValueAndValidity({ emitEvent: false });
        this.loadDrives();
      });
  }

  // --- Custom Validators ---

  private createFromDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const selectedDate = moment.isMoment(value) ? value.clone().startOf('day') : moment(value).startOf('day');
      const chapterDate = this.chapterTimezoneService.getChapterLocalDate();
      if (selectedDate.isAfter(chapterDate)) {
        return { futureDate: true };
      }
      return null;
    };
  }

  private createToDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const selectedDate = moment.isMoment(value) ? value.clone().startOf('day') : moment(value).startOf('day');
      const chapterDate = this.chapterTimezoneService.getChapterLocalDate().clone().add(1, 'day');
      if (selectedDate.isAfter(chapterDate)) {
        return { futureDate: true };
      }
      return null;
    };
  }

  private static atLeastOneCriterionValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const fromDate = formGroup.get('driveFromDate')?.value;
      const toDate = formGroup.get('driveToDate')?.value;
      const driveId = formGroup.get('driveId')?.value;
      if (!fromDate && !toDate && !driveId) {
        return { noCriteria: true };
      }
      return null;
    };
  }

  private static dateRangeValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const fromDate = formGroup.get('driveFromDate')?.value;
      const toDate = formGroup.get('driveToDate')?.value;
      if (!fromDate || !toDate) return null;
      const from = moment.isMoment(fromDate) ? fromDate.clone().startOf('day') : moment(fromDate).startOf('day');
      const to = moment.isMoment(toDate) ? toDate.clone().startOf('day') : moment(toDate).startOf('day');
      if (from.isAfter(to)) {
        return { dateRangeInvalid: true };
      }
      return null;
    };
  }

  getFromDateError(): string {
    const control = this.filterForm.get('driveFromDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('required')) return 'From Date is required';
    if (control.hasError('matDatepickerParse')) return 'Invalid date format';
    if (control.hasError('futureDate')) return 'Future date not allowed';
    if (this.filterForm.hasError('dateRangeInvalid')) return "'From Date' must be less than or equal to 'To Date'";
    return '';
  }

  getToDateError(): string {
    const control = this.filterForm.get('driveToDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('required')) return 'To Date is required';
    if (control.hasError('matDatepickerParse')) return 'Invalid date format';
    if (control.hasError('futureDate')) return 'Future date not allowed';
    if (this.filterForm.hasError('dateRangeInvalid')) return "'To Date' must be greater than or equal to 'From Date'";
    return '';
  }

  /**
   * Load status dropdown options
   */
  private loadStatusOptions(): void {
    this.statusOptions = this.vistaService.getStatusOptions();
  }

  private setupDriveSearch(): void {
    this.driveSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredDriveOptions = this.driveOptions().filter(d =>
          d.driveId.toLowerCase().includes(term) ||
          (d.driveDate || '').toLowerCase().includes(term) ||
          (d.sponsorName || '').toLowerCase().includes(term)
        );
      });
  }

  /**
   * Load drives LOV based on date range
   */
  private loadDrives(): void {
    const fromDate = this.filterForm.get('driveFromDate')?.value;
    const toDate = this.filterForm.get('driveToDate')?.value;

    const fromStr = fromDate ? moment(fromDate).format('YYYY-MM-DD') : null;
    const toStr = toDate ? moment(toDate).format('YYYY-MM-DD') : null;

    this.vistaService.getDrivesLov(fromStr, toStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (drives) => {
          this.driveOptions.set(drives);
          this.filteredDriveOptions = [...drives];
          this.driveSearchControl.setValue('');
        },
        error: () => {
          this.driveOptions.set([]);
          this.filteredDriveOptions = [];
        }
      });
  }

  /**
   * Handle drive selection — populate sponsor field
   */
  onDriveChange(driveId: string | null): void {
    if (!driveId) {
      this.filterForm.get('sponsor')?.setValue('-');
      return;
    }
    const selected = this.driveOptions().find(d => d.driveId === driveId);
    this.filterForm.get('sponsor')?.setValue(selected?.sponsorName || '-');
  }

  hasAnyFilterValue(): boolean {
    const v = this.filterForm.getRawValue();
    return !!(v.driveFromDate || v.driveToDate || v.driveId || v.status);
  }

  /**
   * Get form controls for template
   */
  get f() {
    return this.filterForm.controls;
  }

  /**
   * Handle RETRIEVE button click
   * Validates form and triggers search
   * Auto-populates missing dates matching Oracle Forms PB_RETRIEVE logic:
   * - If fromDate is null and toDate is null: no action (defaults already set)
   * - If fromDate is not null and toDate is null: set toDate to chapter local date
   * - If toDate is not null and fromDate is null: set fromDate to toDate
   */
  onRetrieve(): void {
    const fromDate = this.filterForm.get('driveFromDate')?.value;
    const toDate = this.filterForm.get('driveToDate')?.value;

    // Match Oracle Forms PB_RETRIEVE trigger auto-populate logic
    if (fromDate && !toDate) {
      this.filterForm.get('driveToDate')?.setValue(this.chapterTimezoneService.getChapterLocalDate());
    } else if (toDate && !fromDate) {
      this.filterForm.get('driveFromDate')?.setValue(toDate);
    }

    if (this.filterForm.invalid) {
      Object.keys(this.filterForm.controls).forEach(key => {
        this.filterForm.get(key)?.markAsTouched();
      });

      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    this.pageIndex.set(0);
    this.loadData();
  }

  /**
   * Handle REFRESH button click
   * Re-queries data with existing filter criteria without validation or page reset
   * Matches Oracle Forms PB_REFRESH behavior
   */
  onRefresh(): void {
    if (!this.hasSearched()) {
      this.snackbarService.showError('Please retrieve data first before refreshing');
      return;
    }
    this.loadData();
  }

  /**
   * Load data from API
   */
  private loadData(append: boolean = false): void {
    const formValue = this.filterForm.value;

    // Build query DTO
    const query: VistaInterfaceStatusQueryDto = {
      driveFromDate: formValue.driveFromDate ? moment(formValue.driveFromDate).format('YYYY-MM-DD') : null,
      driveToDate: formValue.driveToDate ? moment(formValue.driveToDate).format('YYYY-MM-DD') : null,
      driveId: formValue.driveId || null,
      status: formValue.status || null,
      searchKeyword: null,
      sortColumn: this.sortColumn(),
      sortOrder: this.sortOrder()
    };

    if (append) {
      this.isLoadingMore.set(true);
    } else {
      this.loading.set(true);
      this.pageIndex.set(0);
    }
    this.error.set(null);
    this.hasSearched.set(true);

    this.vistaService
      .getAll(this.pageSize(), this.pageIndex() * this.pageSize(), query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (append) {
            this.data.set([...this.data(), ...(response.data || [])]);
          } else {
            this.data.set(response.data || []);
          }
          this.totalCount.set(response.total || 0);
          this.loading.set(false);
          this.isLoadingMore.set(false);
        },
        error: (err) => {
          const errorMsg = err?.error?.message || err?.message || 'Failed to load data';
          this.error.set(errorMsg);
          this.loading.set(false);
          this.isLoadingMore.set(false);
          this.snackbarService.showError(errorMsg);
        }
      });
  }

  /**
   * Load more data on scroll
   */
  loadMoreData(): void {
    if (this.isLoadingMore() || !this.hasMoreData() || this.loading()) {
      return;
    }
    this.pageIndex.set(this.pageIndex() + 1);
    this.loadData(true);
  }

  /**
   * Handle scroll event on table container
   */
  onTableScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const threshold = 100; // pixels from bottom to trigger load
    const position = element.scrollTop + element.clientHeight;
    const height = element.scrollHeight;

    if (position >= height - threshold) {
      this.loadMoreData();
    }
  }

  /**
   * Handle CLEAR ALL button click
   * Resets form to initial state with chapter local date
   */
  onClearAll(): void {
    const chapterLocalDate = this.chapterTimezoneService.getChapterLocalDate();

    this.filterForm.reset({
      driveFromDate: chapterLocalDate,
      driveToDate: chapterLocalDate,
      driveId: null,
      sponsor: '-',
      status: ''
    });
    this.data.set([]);
    this.totalCount.set(0);
    this.hasSearched.set(false);
    this.editMode.set(false);
    this.editedStatuses.set(new Map());
    this.driveOptions.set([]);
    this.filteredDriveOptions = [];
    this.driveSearchControl.setValue('');
    this.pageIndex.set(0);
  }

  /**
   * Handle pagination change
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadData();
  }

  /**
   * Toggle sort direction for Drive Date column
   */
  toggleSort(): void {
    const current = this.sortOrder();
    const next = current === null ? 'DESC' : current === 'DESC' ? 'ASC' : 'DESC';
    this.sortColumn.set('DriveDate');
    this.sortOrder.set(next);
    this.pageIndex.set(0);
    this.loadData();
  }

  getSortIcon(): string {
    if (this.sortColumn() !== 'DriveDate' || this.sortOrder() === null) return 'unfold_more';
    return this.sortOrder() === 'ASC' ? 'arrow_upward' : 'arrow_downward';
  }

  /**
   * Enter edit mode - makes status column editable
   */
  onChangeStatus(): void {
    this.editMode.set(true);
    this.editedStatuses.set(new Map());

    // Focus first editable status field after DOM updates
    setTimeout(() => {
      const firstSelect = document.querySelector('.status-select mat-select') as HTMLElement;
      if (firstSelect) {
        firstSelect.focus();
      }
    }, 100);
  }

  /**
   * Cancel edit mode - discard changes
   */
  onCancel(): void {
    this.editMode.set(false);
    this.editedStatuses.set(new Map());

    // Return focus to Change Status button
    setTimeout(() => {
      const changeBtn = document.getElementById(this.elementId('change-status-btn'));
      if (changeBtn) {
        changeBtn.focus();
      }
    }, 100);
  }

  /**
   * Save status changes
   */
  onSave(): void {
    const updates = this.editedStatuses();

    if (updates.size === 0) {
      this.snackbarService.showError('No changes to save');
      return;
    }

    this.loading.set(true);

    this.vistaService
      .bulkUpdateStatus(updates)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const message = 'Status updated successfully for ' + updates.size + ' transaction' + (updates.size > 1 ? 's' : '');
          this.saveSuccessMessage.set(message);
          this.snackbarService.showSuccess('Status updated successfully');
          // Clear after 3 seconds
          setTimeout(() => this.saveSuccessMessage.set(''), 3000);
          this.editMode.set(false);
          this.editedStatuses.set(new Map());
          this.loading.set(false);
          // Reload data to reflect changes
          this.loadData();
        },
        error: (err) => {
          this.loading.set(false);
          const errorMsg = err?.error?.message || err?.message || 'Failed to update status';

          // Check for specific error codes
          if (err?.error?.errorCode === ERROR_CODES.CANNOT_CHANGE_R_TO_P) {
            this.snackbarService.showError('Cannot change status from Registered to Pending');
          } else {
            this.snackbarService.showError(errorMsg);
          }
        }
      });
  }

  /**
   * Handle status change in edit mode
   */
  onStatusChange(transactionId: string, newStatus: string): void {
    const updates = new Map(this.editedStatuses());

    const originalRecord = this.data().find(d => d.transactionId === transactionId);
    if (originalRecord && originalRecord.idpProcStatus === newStatus) {
      // Changed back to original - remove from updates
      updates.delete(transactionId);
    } else {
      updates.set(transactionId, newStatus as 'P' | 'X');
    }

    this.editedStatuses.set(updates);
  }

  /**
   * Get current status for a row (edited or original)
   */
  getCurrentStatus(record: VistaInterfaceStatusDto): string {
    return this.editedStatuses().get(record.transactionId) || record.idpProcStatus || '';
  }

  /**
   * Get editable status options for a record
   */
  getEditableOptions(record: VistaInterfaceStatusDto): StatusOption[] {
    return this.vistaService.getEditableStatusOptions(record.idpProcStatus);
  }

  /**
   * Open uploaded data details dialog
   */
  openUploadedDataDialog(transactionId: string): void {
    this.dialog.open(UploadedDataDialog, {
      width: '1184px',
      disableClose: false,
      data: { transactionId },
      panelClass: 'right-side-drawer',
      position: { right: '0', top: '64px' },
      height: 'calc(100vh - 64px)',
    });
  }

  /**
   * Format date for display: DD-MMM-YYYY
   */
  formatDate(value: string | null): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  formatDateTime(value: string | null): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY, hh:mm A').replace(/^(\d{2})-([A-Za-z]{3})-(\d{4})/, (match, day, month, year) => `${day}-${month.toUpperCase()}-${year}`) : value;
  }

  getLastUpdateDateTime(row: VistaInterfaceStatusDto): string | null {
    const timestamps = [row.lkupUpdtTime, row.hlthUpdtTime, row.phyUpdtTime, row.phelobUpdtTime]
      .filter((t): t is string => !!t)
      .map(t => moment(t))
      .filter(m => m.isValid())
      .sort((a, b) => b.valueOf() - a.valueOf());
    return timestamps.length > 0 ? timestamps[0].toISOString() : null;
  }

  /**
   * Track by function for ngFor performance
   */
  trackByTransactionId(index: number, item: VistaInterfaceStatusDto): string {
    return item.transactionId;
  }
}
