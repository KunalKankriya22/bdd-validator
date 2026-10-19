import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, ErrorStateMatcher } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DeferralEntryDetailsDialogComponent } from '@shared/components/deferral-entry-details-dialog/deferral-entry-details-dialog';
import { DonationDeferralAuditDrawerComponent } from '../../audit-donation/components/donation-deferral-audit-drawer/donation-deferral-audit-drawer';
import { HoldReasonDialogComponent } from '../donations-on-hold-query/hold-reason-dialog/hold-reason-dialog';
import { HoldReasonDialogData } from '../donations-on-hold-query/models/donations-on-hold-query.model';
import { ConsentHistoryDialogComponent } from './components/consent-history-dialog/consent-history-dialog.component';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { ROUTES } from '../../../../../core/constants/route.constants';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { AbstractControl } from '@angular/forms';

import { RegisteredDeferralsQueryService } from './services/registered-deferrals-query.service';
import {
  RegisteredDeferralRow,
  LookupOption,
} from './models/registered-deferrals-query.model';

@Component({
  selector: 'app-registered-deferrals-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './registered-deferrals-query.html',
  styleUrls: ['./registered-deferrals-query.scss'],
})
export class RegisteredDeferralsQuery implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly service = inject(RegisteredDeferralsQueryService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();
  private lovLimit = 21;

  filterForm!: FormGroup;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: ROUTES.HOME }],
    title: '',
    subtitle: '',
    actions: [],
  };

  tableConfig: DataTableConfig<RegisteredDeferralRow> = {
    columns: [
      {
        key: 'deferralId',
        header: 'Deferral ID',
        sortable: true,
        type: 'text',
        minWidth: '120px',
        valueFormatter: (value) => value || '--',
      },
      {
        key: 'transactionId',
        header: 'Transaction ID',
        sortable: true,
        type: 'text',
        minWidth: '140px',
        valueFormatter: (value) => value || '--',
      },
      {
        key: 'setId',
        header: 'Batch ID',
        sortable: true,
        type: 'text',
        minWidth: '120px',
        valueFormatter: (value) => value || '--',
      },
      {
        key: 'driveId',
        header: 'Drive ID',
        sortable: true,
        type: 'text',
        minWidth: '130px',
        valueFormatter: (value) => value || '--',
      },
      {
        key: 'donorId',
        header: 'Donor ID',
        sortable: true,
        type: 'text',
        minWidth: '130px',
        valueFormatter: (value) => value || '--',
      },
      {
        key: 'donationType',
        header: 'Donation Type',
        sortable: true,
        type: 'text',
        minWidth: '110px',
        valueFormatter: (value) => value || '--',
      },
      {
        key: 'procedureCode',
        header: 'Procedure Code',
        sortable: true,
        type: 'text',
        minWidth: '120px',
        valueFormatter: (value) => value || '--',
      },
      {
        key: 'user',
        header: 'User',
        sortable: true,
        type: 'text',
        minWidth: '100px',
        valueFormatter: (value) => value || '--',
      },
      {
        key: 'dateTimeOfRegistration',
        header: 'Date and Time of Registration',
        sortable: true,
        type: 'text',
        minWidth: '220px',
        valueFormatter: (value) => this.formatDateTime(value) || '--',
      },
      {
        key: 'auditComplete',
        header: 'Audit Complete',
        sortable: true,
        type: 'text',
        minWidth: '110px',
        valueFormatter: (value) => value || '--',
      },
    ],
    rowActions: [
      {
        icon: 'description',
        label: 'Entry Details',
        ariaLabel: 'View entry details',
        action: 'entry-details',
      },
      {
        icon: 'fact_check',
        label: 'Consents',
        ariaLabel: 'View consents',
        action: 'consents',
      },
      {
        icon: 'block',
        label: 'Donor Holds',
        ariaLabel: 'View donor holds',
        action: 'donor-holds',
      },
      {
        icon: 'verified',
        label: 'Audit Details',
        ariaLabel: 'View audit details',
        action: 'audit-details',
      },
    ],
    sortConfig: {
      column: 'deferralId',
      direction: 'D',
    },
    stickyHeader: true,
    showActionsAsMenu: true,
    stickyActionsColumn: true,
    showPagination: false,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter search criteria to view Results',
    noDataIcon: 'search',
  };

  readonly driveIds = signal<LookupOption[]>([]);
  readonly users = signal<LookupOption[]>([]);
  readonly deferralIds = signal<LookupOption[]>([]);
  readonly transactionIds = signal<LookupOption[]>([]);
  readonly setIds = signal<LookupOption[]>([]);
  dataSource: RegisteredDeferralRow[] = [];

  readonly driveSearchControl = new FormControl('');
  readonly userSearchControl = new FormControl('');
  readonly deferralSearchControl = new FormControl('');
  readonly transactionSearchControl = new FormControl('');
  readonly setSearchControl = new FormControl('');

  readonly driveSearch = signal('');
  readonly userSearch = signal('');
  readonly deferralSearch = signal('');
  readonly transactionSearch = signal('');
  readonly setSearch = signal('');

  readonly filteredDrives = computed(() => {
    const search = this.driveSearch().toLowerCase();
    const options = this.driveIds();
    if (!search) return options;
    return options.filter(o =>
      (o.code || '').toLowerCase().includes(search) ||
      (o.description || '').toLowerCase().includes(search)
    );
  });

  readonly filteredUsers = computed(() => {
    const search = this.userSearch().toLowerCase();
    const options = this.users();
    if (!search) return options;
    return options.filter(o =>
      (o.code || '').toLowerCase().includes(search) ||
      (o.description || '').toLowerCase().includes(search)
    );
  });

  readonly filteredDeferrals = computed(() => {
    const search = this.deferralSearch().toLowerCase();
    const options = this.deferralIds();
    if (!search) return options;
    return options.filter(o =>
      (o.code || '').toLowerCase().includes(search) ||
      (o.description || '').toLowerCase().includes(search)
    );
  });

  readonly filteredTransactions = computed(() => {
    const search = this.transactionSearch().toLowerCase();
    const options = this.transactionIds();
    if (!search) return options;
    return options.filter(o =>
      (o.code || '').toLowerCase().includes(search) ||
      (o.description || '').toLowerCase().includes(search)
    );
  });

  readonly filteredSets = computed(() => {
    const search = this.setSearch().toLowerCase();
    const options = this.setIds();
    if (!search) return options;
    return options.filter(o =>
      (o.code || '').toLowerCase().includes(search) ||
      (o.description || '').toLowerCase().includes(search)
    );
  });

  isLoadingLookups = false;
  isLoadingData = false;
  showEmptyState = true;
  hasRetrievedData = false;
  totalFound = 0;
  sidePanelOpen = false;
  highlightedRow: RegisteredDeferralRow | null = null;

  // Track which date field was changed last to show error on the appropriate field
  private lastChangedDateField: 'driveDateFrom' | 'driveDateTo' | null = null;

  // Error state matchers for date fields
  // Both fields use their respective error message methods to determine error state
  // This allows smart error display based on which field was changed last
  driveDateFromErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      const touchedOrDirty = control.touched || control.dirty;
      return touchedOrDirty && !!this.getDriveDateFromError();
    }
  };

  driveDateToErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      const touchedOrDirty = control.touched || control.dirty;
      return touchedOrDirty && !!this.getDriveDateToError();
    }
  };

  get isRetrieveDisabled(): boolean {
    return this.isLoadingData;
  }

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: ROUTES.HOME },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
          actions: [],
        };
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadLookups();
    this.fetchLovLimit();
    this.subscribeToChapterChanges();
    this.subscribeToSearchControls();
    this.subscribeToDateChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      driveDateFrom: [null],
      driveDateTo: [null],
      driveId: [''],
      user: [''],
      deferralId: [''],
      transactionId: [''],
      setId: [''],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('driveDateFrom', 'driveDateTo')]
    });
  }

  private loadLookups(fromDate?: string, toDate?: string): void {
    this.isLoadingLookups = true;
    this.service
      .getLookups(fromDate, toDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lookups) => {
          this.driveIds.set(lookups.driveIds || []);
          this.users.set(lookups.users || []);
          this.deferralIds.set(lookups.deferralIds || []);
          this.transactionIds.set(lookups.transactionIds || []);
          this.setIds.set(lookups.setIds || []);
          this.isLoadingLookups = false;
        },
        error: () => {
          this.driveIds.set([]);
          this.users.set([]);
          this.deferralIds.set([]);
          this.transactionIds.set([]);
          this.setIds.set([]);
          this.isLoadingLookups = false;
        },
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadLookups();
        this.fetchLovLimit();
      });
  }

  private subscribeToSearchControls(): void {
    this.driveSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.driveSearch.set(value || ''));

    this.userSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.userSearch.set(value || ''));

    this.deferralSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.deferralSearch.set(value || ''));

    this.transactionSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.transactionSearch.set(value || ''));

    this.setSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.setSearch.set(value || ''));
  }

  private subscribeToDateChanges(): void {
    this.filterForm.get('driveDateFrom')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'driveDateFrom';
        this.filterForm.updateValueAndValidity();
      });

    this.filterForm.get('driveDateTo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'driveDateTo';
        this.filterForm.updateValueAndValidity();
      });

    this.filterForm.get('driveDateFrom')?.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(400))
      .subscribe(() => this.reloadLovsIfDatesValid());

    this.filterForm.get('driveDateTo')?.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(400))
      .subscribe(() => this.reloadLovsIfDatesValid());
  }

  onRetrieve(): void {
    if (this.isRetrieveDisabled) {
      return;
    }

    this.applyDefaultDatesIfEmpty();

    this.filterForm.markAllAsTouched();
    this.validateDates();

    if (this.filterForm.invalid) {
      return;
    }

    const formValue = this.filterForm.getRawValue();
    this.isLoadingData = true;
    this.showEmptyState = false;

    const request = {
      driveDateFrom: this.formatDateForApi(formValue.driveDateFrom),
      driveDateTo: this.formatDateForApi(formValue.driveDateTo),
      driveId: formValue.driveId || '',
      user: formValue.user || '',
      deferralId: formValue.deferralId || '',
      transactionId: formValue.transactionId || '',
      setId: formValue.setId || '',
      chapterId: this.headerService.getCurrentChapterId(),
      sortField: this.tableConfig.sortConfig?.column || '',
      sortDirection: this.tableConfig.sortConfig?.direction === 'A' ? 'ASC' : this.tableConfig.sortConfig?.direction === 'D' ? 'DESC' : '',
    };

    this.service
      .query(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dataSource = data;
          this.totalFound = data.length;
          this.hasRetrievedData = true;
          this.isLoadingData = false;

          if (data.length === 0) {
            this.showInfo('No registered deferrals found for the selected criteria.');
          }
        },
        error: (error) => {
          this.showError(this.getErrorMessage(error, 'Failed to retrieve registered deferrals'));
          this.isLoadingData = false;
          this.dataSource = [];
          this.totalFound = 0;
        },
      });
  }

  onClearAll(): void {
    this.filterForm.reset({
      driveDateFrom: null,
      driveDateTo: null,
      driveId: '',
      user: '',
      deferralId: '',
      transactionId: '',
      setId: '',
    });
    this.driveSearchControl.setValue('');
    this.userSearchControl.setValue('');
    this.deferralSearchControl.setValue('');
    this.transactionSearchControl.setValue('');
    this.setSearchControl.setValue('');
    this.dataSource = [];
    this.totalFound = 0;
    this.showEmptyState = true;
    this.hasRetrievedData = false;
  }

  /**
   * Handle keyboard input for Drive Date From field.
   * Both date fields are optional, so we use handleEndDateInput which:
   * - Clears value when input is empty
   * - Marks as untouched when cleared (hides errors)
   * - Marks as touched/dirty when typing
   * This ensures that when a user clears a date, the range validation error
   * disappears (correct behavior since you can't have an invalid range with one date).
   */
  onDriveDateFromInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('driveDateFrom')
    );
  }

  /**
   * Handle keyboard input for Drive Date To field.
   * Same behavior as Drive Date From - both are optional fields.
   */
  onDriveDateToInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('driveDateTo')
    );
  }

  /**
   * Get error message for Drive Date From field
   */
  getDriveDateFromError(): string {
    const control = this.filterForm.get('driveDateFrom');
    if (!control || !(control.touched || control.dirty)) {
      return '';
    }

    if (control.hasError('invalidDateFormat') ||
        control.hasError('invalidDate') ||
        control.hasError('matDatepickerParse')) {
      return 'Drive Date From is invalid';
    }

    if (control.hasError('futureDate')) {
      return 'Date cannot be in the future';
    }

    if (control.hasError('fromAfterTo')) {
      return 'From date cannot be after to date';
    }

    if (control.hasError('required')) {
      return 'Drive Date From is required';
    }

    if (this.filterForm.errors?.['dateRangeInvalid'] && this.lastChangedDateField === 'driveDateFrom') {
      return 'From date cannot be after to date';
    }

    return '';
  }

  /**
   * Get error message for Drive Date To field
   */
  getDriveDateToError(): string {
    const control = this.filterForm.get('driveDateTo');
    if (!control || !(control.touched || control.dirty)) {
      return '';
    }

    if (control.hasError('invalidDateFormat') ||
        control.hasError('invalidDate') ||
        control.hasError('matDatepickerParse')) {
      return 'Drive Date To is invalid';
    }

    if (control.hasError('futureDate')) {
      return 'Date cannot be in the future';
    }

    if (control.hasError('required')) {
      return 'Drive Date To is required';
    }

    if (this.filterForm.errors?.['dateRangeInvalid'] && this.lastChangedDateField === 'driveDateTo') {
      return 'To date cannot be before from date';
    }

    return '';
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }

    this.sortDataLocally(event.column, event.direction);
  }

  onRowAction(event: TableRowActionEvent<RegisteredDeferralRow>): void {
    switch (event.action) {
      case 'entry-details':
        if (!event.row.donorId) return;
        this.sidePanelOpen = true;
        this.highlightedRow = event.row;
        this.dialog.open(DeferralEntryDetailsDialogComponent, {
          width: '1200px',
          height: 'calc(100vh - 64px)',
          maxWidth: '100vw',
          maxHeight: 'calc(100vh - 64px)',
          data: {
            donorId: event.row.donorId,
            driveDate: event.row.driveDate || '',
          },
          disableClose: false,
          panelClass: 'code-dialog-panel-right',
          position: { right: '0', top: '64px' },
          hasBackdrop: true,
          backdropClass: 'code-dialog-backdrop',
        }).afterClosed().subscribe(() => {
          this.sidePanelOpen = false;
          this.highlightedRow = null;
        });
        break;
      case 'donor-holds':
        if (!event.row.transactionId) return;
        this.sidePanelOpen = true;
        this.highlightedRow = event.row;
        const holdReasonData: HoldReasonDialogData = {
          unitId: event.row.deferralId,
          collDate: event.row.driveDate || '',
          donorId: event.row.donorId,
          donorName: '',
          transactionId: event.row.transactionId,
        };
        this.dialog.open(HoldReasonDialogComponent, {
          width: '1000px',
          height: 'calc(100vh - 64px)',
          maxWidth: '100vw',
          maxHeight: 'calc(100vh - 64px)',
          data: holdReasonData,
          disableClose: false,
          panelClass: 'code-dialog-panel-right',
          position: { right: '0', top: '64px' },
          hasBackdrop: true,
          backdropClass: 'code-dialog-backdrop',
        }).afterClosed().subscribe(() => {
          this.sidePanelOpen = false;
          this.highlightedRow = null;
        });
        break;
      case 'audit-details':
        if (!event.row.transactionId) return;
        if (event.row.auditComplete !== 'Yes') {
          this.showInfo('No audit data available for this record');
          return;
        }
        this.sidePanelOpen = true;
        this.highlightedRow = event.row;
        this.dialog.open(DonationDeferralAuditDrawerComponent, {
          width: '1000px',
          height: 'calc(100vh - 64px)',
          maxWidth: '100vw',
          maxHeight: 'calc(100vh - 64px)',
          data: { transactionId: event.row.transactionId },
          disableClose: false,
          panelClass: 'code-dialog-panel-right',
          position: { right: '0', top: '64px' },
          hasBackdrop: true,
          backdropClass: 'code-dialog-backdrop',
        }).afterClosed().subscribe(() => {
          this.sidePanelOpen = false;
          this.highlightedRow = null;
        });
        break;
      case 'consents':
        this.openConsentHistoryDialog(event.row);
        break;
    }
  }

  private sortDataLocally(column: string, direction: 'A' | 'D' | 'default'): void {
    if (direction === 'default') {
      return;
    }

    this.dataSource = [...this.dataSource].sort((a, b) => {
      const aValue = a[column as keyof RegisteredDeferralRow];
      const bValue = b[column as keyof RegisteredDeferralRow];

      if (aValue === null || aValue === undefined) return direction === 'A' ? 1 : -1;
      if (bValue === null || bValue === undefined) return direction === 'A' ? -1 : 1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return direction === 'A' ? comparison : -comparison;
      }

      if (aValue < bValue) return direction === 'A' ? -1 : 1;
      if (aValue > bValue) return direction === 'A' ? 1 : -1;
      return 0;
    });
  }

  private formatDateTime(value: string | null): string {
    if (!value) return '';
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;

      const day = date.getDate().toString().padStart(2, '0');
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();

      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hoursStr = hours.toString().padStart(2, '0');

      return `${day}-${month}-${year}, ${hoursStr}:${minutes} ${ampm}`;
    } catch {
      return value;
    }
  }

  private formatDateForApi(date: unknown): string {
    if (!date) return '';
    try {
      const d = (date as { toDate?: () => Date }).toDate
        ? (date as { toDate: () => Date }).toDate()
        : new Date(date as string | number);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  }

  private getErrorMessage(error: { error?: { errorResponse?: { error?: string }; message?: string }; message?: string }, fallback: string): string {
    return error?.error?.errorResponse?.error || error?.error?.message || error?.message || fallback;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private validateDates(): void {
    const fromControl = this.filterForm.get('driveDateFrom');
    const toControl = this.filterForm.get('driveDateTo');

    this.clearCustomDateErrors(fromControl);
    this.clearCustomDateErrors(toControl);

    if (fromControl?.hasError('matDatepickerParse') || toControl?.hasError('matDatepickerParse')) return;

    const from = fromControl?.value;
    const to = toControl?.value;
    const chapterToday = this.chapterTimezoneService.getChapterLocalDate();
    const todayStr = chapterToday.format('YYYY-MM-DD');

    if (from) {
      const fromStr = DateFieldValidationUtility.serializeDateForApi(from);
      if (fromStr && fromStr > todayStr) {
        this.addDateError(fromControl, 'futureDate');
      }
    }

    if (to) {
      const toStr = DateFieldValidationUtility.serializeDateForApi(to);
      if (toStr && toStr > todayStr) {
        this.addDateError(toControl, 'futureDate');
      }
    }

    if (from && to && !fromControl?.hasError('futureDate') && !toControl?.hasError('futureDate')) {
      const fromStr = DateFieldValidationUtility.serializeDateForApi(from);
      const toStr = DateFieldValidationUtility.serializeDateForApi(to);
      if (fromStr && toStr && fromStr > toStr) {
        this.addDateError(fromControl, 'fromAfterTo');
      }
    }
  }

  private clearCustomDateErrors(control: AbstractControl | null): void {
    if (!control?.errors) return;
    const errors = { ...control.errors };
    delete errors['futureDate'];
    delete errors['fromAfterTo'];
    control.setErrors(Object.keys(errors).length ? errors : null);
  }

  private addDateError(control: AbstractControl | null, errorKey: string): void {
    if (!control) return;
    control.setErrors({ ...control.errors, [errorKey]: true });
    control.markAsTouched();
  }

  private fetchLovLimit(): void {
    this.service.getLovLimit()
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.lovLimit = value);
  }

  private applyDefaultDatesIfEmpty(): void {
    const formValue = this.filterForm.getRawValue();
    const datesEmpty = !formValue.driveDateFrom && !formValue.driveDateTo;

    if (datesEmpty) {
      const chapterToday = this.chapterTimezoneService.getChapterLocalDate();
      const fromDate = chapterToday.clone().subtract(this.lovLimit, 'days');
      this.filterForm.patchValue(
        { driveDateFrom: fromDate, driveDateTo: chapterToday }
      );
    }
  }

  private reloadLovsIfDatesValid(): void {
    const fromControl = this.filterForm.get('driveDateFrom');
    const toControl = this.filterForm.get('driveDateTo');
    if (fromControl?.errors || toControl?.errors) return;

    const from = fromControl?.value;
    const to = toControl?.value;
    if (!from && !to) return;

    const fromStr = from ? this.formatDateForApi(from) : undefined;
    const toStr = to ? this.formatDateForApi(to) : undefined;
    this.loadLookups(fromStr, toStr);
  }

  private openConsentHistoryDialog(row: RegisteredDeferralRow): void {
    if (!row.donorId) {
      this.showError('Donor ID is required to view consent history');
      return;
    }

    this.highlightedRow = row;

    const dialogRef = this.dialog.open(ConsentHistoryDialogComponent, {
      panelClass: 'consent-history-right-dialog',
      width: '800px',
      maxWidth: '100vw',
      height: '100vh',
      position: { right: '0' },
      data: {
        donorId: row.donorId,
        deferralId: row.deferralId
      },
      disableClose: true,
      autoFocus: false
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.highlightedRow = null;
    });
  }
}