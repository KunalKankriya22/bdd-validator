import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, signal, computed, effect } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { A11yModule } from '@angular/cdk/a11y';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent, TableSortEvent, TablePageEvent } from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { PendingAuditFilterChipsUtils } from '../shared/utils/pending-audit-filter-chips.utils';
import { PendingAuditFilterValue } from '../shared/models/pending-audit-query.model';

import { DeferralsPendingAuditQueryService } from './services/deferrals-pending-audit-query.service';
import {
  DeferralsPendingAuditDto,
  DeferralsPendingAuditQueryDto,
  DriveOption,
  StatusOption,
  DonationTypeOption,
  ProcedureCodeOption
} from './models/deferrals-pending-audit-query.model';

@Component({
  selector: 'app-deferrals-pending-audit-query',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule,
    A11yModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
    FilterPanelBase,
    FilterChips
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './deferrals-pending-audit-query.html',
  styleUrls: ['./deferrals-pending-audit-query.scss']
})
export class DeferralsPendingAuditQuery implements OnInit, OnDestroy {
  @ViewChild(DataTable) dataTableComponent!: DataTable<DeferralsPendingAuditDto>;
  @ViewChild('filterButton', { read: ElementRef }) filterButtonRef!: ElementRef;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(DeferralsPendingAuditQueryService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly headerService = inject(HeaderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly FILTER_STATE_KEY = 'deferrals-pending-audit-filter-state';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  filterForm!: FormGroup;

  readonly driveOptions = signal<DriveOption[]>([]);
  readonly donationTypeOptions = signal<DonationTypeOption[]>([]);
  readonly procedureCodeOptions = signal<ProcedureCodeOption[]>([]);
  readonly statusOptions = signal<StatusOption[]>([
    { code: 'A', description: 'All' },
    { code: 'R', description: 'Ready for Audit' },
    { code: 'N', description: 'No Donor' }
  ]);

  allData: DeferralsPendingAuditDto[] = [];
  dataSource: DeferralsPendingAuditDto[] = [];
  totalFound = 0;
  searchKeyword = '';

  maxDate: moment.Moment = this.chapterTimezoneService.getChapterLocalDate();
  isLoadingData = false;
  isLoadingDrives = false;
  hasRetrievedData = false;
  showEmptyState = true;
  showFilterPanel = false;
  filterPanelTop = 0;
  filterPanelLeft = 0;

  filterPanelForm!: FormGroup;

  appliedDonationType: string | null = null;
  appliedProcedureCode: string | null = null;
  appliedFilters: PendingAuditFilterValue | null = null;
  filterChips: FilterChip[] = [];

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Drive ID or Donor ID',
    minLength: 2,
    ariaLabel: 'Search deferrals pending audit',
    searchOnEnterOnly: true
  };

  readonly driveSearchControl = new FormControl('');
  readonly donationTypeSearchControl = new FormControl('');
  readonly procedureCodeSearchControl = new FormControl('');
  readonly driveSearch = signal('');
  readonly donationTypeSearch = signal('');
  readonly procedureCodeSearch = signal('');

  readonly filteredDrives = computed(() => {
    const search = this.driveSearch().toLowerCase();
    const options = this.driveOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.driveId || '').toLowerCase().includes(search) ||
      (o.driveDate || '').toLowerCase().includes(search) ||
      (o.sponsorName || '').toLowerCase().includes(search)
    );
  });

  readonly filteredDonationTypes = computed(() => {
    const search = this.donationTypeSearch().toLowerCase();
    const options = this.donationTypeOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.value || '').toLowerCase().includes(search) ||
      (o.label || '').toLowerCase().includes(search)
    );
  });

  readonly filteredProcedureCodes = computed(() => {
    const search = this.procedureCodeSearch().toLowerCase();
    const options = this.procedureCodeOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.value || '').toLowerCase().includes(search) ||
      (o.label || '').toLowerCase().includes(search)
    );
  });

  get isRetrieveDisabled(): boolean {
    return this.isLoadingData;
  }

  tableConfig: DataTableConfig<DeferralsPendingAuditDto> = {
    columns: [
      {
        key: 'driveId',
        header: 'Drive ID',
        sortable: true,
        type: 'text',
        minWidth: '120px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'deferralId',
        header: 'Deferral ID',
        sortable: true,
        type: 'text',
        minWidth: '120px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'transactionId',
        header: 'Transaction ID',
        sortable: true,
        type: 'text',
        minWidth: '140px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'driveDate',
        header: 'Drive Date',
        sortable: true,
        type: 'text',
        minWidth: '130px',
        valueFormatter: (value: string | null) =>
          value ? DateFieldValidationUtility.formatDateForUI(new Date(value)) || '--' : '--'
      },
      {
        key: 'donorId',
        header: 'Donor ID',
        sortable: true,
        type: 'text',
        minWidth: '120px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'donationType',
        header: 'Donation Type',
        sortable: true,
        type: 'text',
        minWidth: '100px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'procedureCode',
        header: 'Procedure Code',
        sortable: true,
        type: 'text',
        minWidth: '110px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'user',
        header: 'User',
        sortable: true,
        type: 'text',
        minWidth: '90px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'insertedDate',
        header: 'Inserted Date',
        sortable: true,
        type: 'text',
        minWidth: '180px',
        valueFormatter: (value: string | null) => {
          if (!value) return '--';
          const d = new Date(value);
          const dateStr = DateFieldValidationUtility.formatDateForUI(d) || '';
          const hours = d.getHours();
          const minutes = d.getMinutes().toString().padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const h = hours % 12 || 12;
          return `${dateStr}, ${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
        }
      }
    ],
    rowActions: [
      {
        iconSvg: 'assets/images/icons/frame-inspect.svg',
        label: 'Audit Deferral',
        ariaLabel: 'Audit deferral {{deferralId}}',
        color: 'primary',
        action: 'auditDeferral'
      }
    ],
    showActionsAsMenu: false,
    enableRowHighlight: false,
    stickyHeader: true,
    showPagination: true,
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100]
    },
    sortConfig: { column: 'driveId', direction: 'A' },
    emptyMessage: 'No deferrals pending audit found',
    loadingMessage: 'Loading deferrals...'
  };

  constructor() {
    this.initializeForm();
    this.initializeFilterPanelForm();

    this.driveSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.driveSearch.set(value || ''));

    this.donationTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.donationTypeSearch.set(value || ''));

    this.procedureCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.procedureCodeSearch.set(value || ''));

    this.filterForm.get('fromDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateDates();
        this.reloadDrivesOnDateChange();
      });

    this.filterForm.get('toDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateDates();
        this.reloadDrivesOnDateChange();
      });

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });

    effect(() => {
      const chapterDate = this.chapterTimezoneService.chapterLocalDate();
      if (chapterDate && chapterDate.isValid()) {
        this.maxDate = chapterDate.clone().startOf('day');
      }
    });
  }

  ngOnInit(): void {
    const restored = this.restoreFilterState();
    this.subscribeToChapterChanges();
    if (!restored && !this.driveOptions().length) {
      this.loadDrives();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      fromDate: [null],
      toDate: [null],
      driveId: [null],
      status: ['R']
    });
  }

  private initializeFilterPanelForm(): void {
    this.filterPanelForm = this.fb.group({
      donationType: [null],
      procedureCode: [null]
    });
  }

  private reloadDrivesOnDateChange(): void {
    const fromControl = this.filterForm.get('fromDate');
    const toControl = this.filterForm.get('toDate');

    if (fromControl?.errors || toControl?.errors) return;

    const fromDate = fromControl?.value ? DateFieldValidationUtility.serializeDateForApi(fromControl.value) : null;
    const toDate = toControl?.value ? DateFieldValidationUtility.serializeDateForApi(toControl.value) : null;

    this.filterForm.patchValue({ driveId: null }, { emitEvent: false });
    this.loadDrives(fromDate, toDate);
  }

  private loadDrives(fromDate?: string | null, toDate?: string | null): void {
    this.isLoadingDrives = true;

    this.service.getDrivesDropdown(fromDate, toDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.driveOptions.set(result.data || []);
          this.isLoadingDrives = false;
        },
        error: (error) => {
          this.showError(this.getErrorMessage(error, 'Failed to load drives'));
          this.isLoadingDrives = false;
          this.driveOptions.set([]);
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.dataSource = [];
        this.allData = [];
        this.totalFound = 0;
        this.hasRetrievedData = false;
        this.showEmptyState = true;
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.totalRecords = 0;
        }
        this.filterForm.patchValue({
          fromDate: null,
          toDate: null
        }, { emitEvent: false });
        this.driveOptions.set([]);
        this.loadDrives();
      });
  }

  onRetrieve(): void {
    const chapterDate = this.chapterTimezoneService.getChapterLocalDate();
    if (!this.filterForm.get('fromDate')?.value) {
      this.filterForm.patchValue({ fromDate: chapterDate.clone().subtract(25, 'days').startOf('day') }, { emitEvent: false });
    }
    if (!this.filterForm.get('toDate')?.value) {
      this.filterForm.patchValue({ toDate: chapterDate.clone().startOf('day') }, { emitEvent: false });
    }

    const formValue = this.filterForm.getRawValue();

    this.isLoadingData = true;
    this.showEmptyState = false;

    const take = this.tableConfig.pagination?.pageSize || 25;
    const skip = (this.tableConfig.pagination?.pageIndex || 0) * take;

    const request: DeferralsPendingAuditQueryDto = {
      fromDate: DateFieldValidationUtility.serializeDateForApi(formValue.fromDate) || '',
      toDate: DateFieldValidationUtility.serializeDateForApi(formValue.toDate) || '',
      driveId: formValue.driveId || null,
      donationType: this.appliedDonationType || null,
      procedureCode: this.appliedProcedureCode || null,
      searchKeyword: this.searchKeyword || null,
      status: formValue.status,
      sortColumn: this.tableConfig.sortConfig?.column || 'driveId',
      sortOrder: this.tableConfig.sortConfig?.direction === 'A' ? 'ASC' : 'DESC',
      take: take,
      skip: skip
    };

    this.service.searchDeferralsPendingAudit(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allData = response.data?.resp || [];
          this.dataSource = this.allData;
          this.totalFound = response.totalCount || 0;

          // Update donation types and procedure codes from search response
          this.donationTypeOptions.set(response.data?.donationType || []);
          this.procedureCodeOptions.set(response.data?.procedureCode || []);

          if (this.appliedFilters) {
            this.filterChips = PendingAuditFilterChipsUtils.toFilterChips(
              this.appliedFilters,
              this.donationTypeOptions(),
              this.procedureCodeOptions()
            );
          }

          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = this.totalFound;
          }

          this.hasRetrievedData = true;
          this.isLoadingData = false;

          // Announce results to screen readers
          if (this.dataSource.length === 0) {
            this.liveAnnouncer.announce('No deferrals pending audit found');
            this.showInfo('No deferrals pending audit found');
          } else {
            this.liveAnnouncer.announce(`${this.totalFound} deferrals pending audit found`);
          }
        },
        error: (error) => {
          this.showError(this.getErrorMessage(error, 'Failed to retrieve deferrals'));
          this.isLoadingData = false;
          this.dataSource = [];
          this.totalFound = 0;

          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = 0;
          }
        }
      });
  }

  onSearch(keyword: string): void {
    this.searchKeyword = keyword || '';

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.onRetrieve();
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }
    this.onRetrieve();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }

    this.onRetrieve();
  }

  onRowAction(event: TableRowActionEvent<DeferralsPendingAuditDto>): void {
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }

    if (event.action === 'auditDeferral') {
      if (!event.row.deferralId) return;

      this.saveFilterState();
      this.router.navigate([ROUTE_REGISTRY[RouteKey.DonationDeferralAuditDrawer].path], {
        state: {
          deferralId: event.row.deferralId,
          auditType: 'Deferral'
        }
      });
    }
  }

  onClearAll(): void {
    sessionStorage.removeItem(this.FILTER_STATE_KEY);
    this.filterForm.patchValue({
      fromDate: null,
      toDate: null,
      driveId: null,
      status: 'R'
    }, { emitEvent: false });
    this.driveOptions.set([]);
    this.loadDrives();
    this.filterForm.get('driveId')?.markAsUntouched();
    this.filterForm.get('driveId')?.markAsPristine();
    this.dataSource = [];
    this.allData = [];
    this.totalFound = 0;
    this.searchKeyword = '';
    this.hasRetrievedData = false;
    this.showEmptyState = true;

    this.appliedDonationType = null;
    this.appliedProcedureCode = null;
    this.filterPanelForm.reset({
      donationType: null,
      procedureCode: null
    });

    this.driveSearchControl.setValue('');
    this.donationTypeSearchControl.setValue('');
    this.procedureCodeSearchControl.setValue('');

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
      this.tableConfig.pagination.pageSize = 25;
      this.tableConfig.pagination.totalRecords = 0;
    }

  }

  onOpenFilterPanel(): void {
    this.filterPanelForm.patchValue({
      donationType: this.appliedDonationType,
      procedureCode: this.appliedProcedureCode
    });

    if (this.filterButtonRef) {
      const buttonElement = this.filterButtonRef.nativeElement;
      const rect = buttonElement.getBoundingClientRect();
      this.filterPanelTop = rect.bottom + 8;
      this.filterPanelLeft = rect.left;
    }

    this.showFilterPanel = true;

    // Move focus into the filter panel after it renders
    setTimeout(() => {
      const panel = document.querySelector('.filter-panel-wrapper') as HTMLElement;
      if (panel) {
        const firstFocusable = panel.querySelector('input, select, button, [tabindex]') as HTMLElement;
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }
    });
  }

  onCloseFilterPanel(): void {
    this.showFilterPanel = false;

    // Return focus to the filter toggle button
    if (this.filterButtonRef) {
      this.filterButtonRef.nativeElement.focus();
    }
  }

  onApplyFilters(): void {
    const formValue = this.filterPanelForm.value;
    this.appliedDonationType = formValue.donationType || null;
    this.appliedProcedureCode = formValue.procedureCode || null;

    // Update applied filters and chips
    this.appliedFilters = {
      donationType: this.appliedDonationType,
      procedureCode: this.appliedProcedureCode
    };
    this.filterChips = PendingAuditFilterChipsUtils.toFilterChips(
      this.appliedFilters,
      this.donationTypeOptions(),
      this.procedureCodeOptions()
    );

    this.showFilterPanel = false;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    if (this.hasRetrievedData) {
      this.onRetrieve();
    }
  }

  onClearFilters(): void {
    this.filterPanelForm.reset({
      donationType: null,
      procedureCode: null
    });
    this.donationTypeSearchControl.reset();
    this.procedureCodeSearchControl.reset();
  }

  get hasActiveFilters(): boolean {
    return !!(this.appliedDonationType || this.appliedProcedureCode);
  }

  onRemoveFilterChip(chipKey: string): void {
    if (!this.appliedFilters) return;

    const updatedFilters = PendingAuditFilterChipsUtils.removeFilter(
      this.appliedFilters,
      chipKey
    );

    // Update form and applied values
    this.appliedDonationType = updatedFilters.donationType;
    this.appliedProcedureCode = updatedFilters.procedureCode;
    this.appliedFilters = updatedFilters;

    // Update chips
    this.filterChips = PendingAuditFilterChipsUtils.toFilterChips(
      updatedFilters,
      this.donationTypeOptions(),
      this.procedureCodeOptions()
    );

    // Update filter panel form
    this.filterPanelForm.patchValue({
      donationType: updatedFilters.donationType,
      procedureCode: updatedFilters.procedureCode
    });

    // Reset pagination and reload data
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    if (this.hasRetrievedData) {
      this.onRetrieve();
    }
  }

  clearAllFilters(): void {
    const clearedFilters = PendingAuditFilterChipsUtils.clearAll();

    this.appliedDonationType = null;
    this.appliedProcedureCode = null;
    this.appliedFilters = clearedFilters;
    this.filterChips = [];

    // Update filter panel form
    this.filterPanelForm.patchValue({
      donationType: null,
      procedureCode: null
    });

    // Reset pagination and reload data
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    if (this.hasRetrievedData) {
      this.onRetrieve();
    }
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterPanelForm.value;
    const hasNoSelection = !formValue.donationType && !formValue.procedureCode;
    const hasAppliedFilters = !!(this.appliedDonationType || this.appliedProcedureCode);
    return hasNoSelection && !hasAppliedFilters;
  }

  onDriveSelectOpenedChange(isOpen: boolean): void {
    if (!isOpen) {
      this.driveSearchControl.setValue('');
    }
  }

  onFromDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('fromDate')
    );
  }

  onToDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('toDate')
    );
  }

  private validateDates(): void {
    const fromControl = this.filterForm.get('fromDate');
    const toControl = this.filterForm.get('toDate');

    this.clearCustomDateErrors(fromControl);
    this.clearCustomDateErrors(toControl);

    if (fromControl?.hasError('matDatepickerParse') || toControl?.hasError('matDatepickerParse')) return;

    const from = fromControl?.value;
    const to = toControl?.value;
    const chapterToday = this.chapterTimezoneService.getChapterLocalDate();
    const todayStr = chapterToday.format('YYYY-MM-DD');

    // Conditional required validation - if one date is filled, the other becomes required
    if (from && !to) {
      this.addDateError(toControl, 'required');
    }
    if (to && !from) {
      this.addDateError(fromControl, 'required');
    }

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
    delete errors['required'];
    control.setErrors(Object.keys(errors).length ? errors : null);
  }

  private addDateError(control: AbstractControl | null, errorKey: string): void {
    if (!control) return;
    control.setErrors({ ...control.errors, [errorKey]: true });
    control.markAsTouched();
  }

  private saveFilterState(): void {
    const formValue = this.filterForm.getRawValue();
    const state = {
      fromDate: formValue.fromDate ? DateFieldValidationUtility.serializeDateForApi(formValue.fromDate) : null,
      toDate: formValue.toDate ? DateFieldValidationUtility.serializeDateForApi(formValue.toDate) : null,
      driveId: formValue.driveId || '',
      status: formValue.status || 'R',
      appliedDonationType: this.appliedDonationType,
      appliedProcedureCode: this.appliedProcedureCode,
      searchKeyword: this.searchKeyword,
      sortColumn: this.tableConfig.sortConfig?.column || 'driveId',
      sortDirection: this.tableConfig.sortConfig?.direction || 'D',
      pageIndex: this.tableConfig.pagination?.pageIndex || 0,
      pageSize: this.tableConfig.pagination?.pageSize || 25
    };
    sessionStorage.setItem(this.FILTER_STATE_KEY, JSON.stringify(state));
  }

  private restoreFilterState(): boolean {
    const saved = sessionStorage.getItem(this.FILTER_STATE_KEY);
    if (!saved) return false;
    sessionStorage.removeItem(this.FILTER_STATE_KEY);

    try {
      const state = JSON.parse(saved);

      this.filterForm.patchValue({
        fromDate: state.fromDate ? moment(state.fromDate) : null,
        toDate: state.toDate ? moment(state.toDate) : null,
        driveId: state.driveId || '',
        status: state.status || 'R'
      }, { emitEvent: false });

      this.appliedDonationType = state.appliedDonationType || null;
      this.appliedProcedureCode = state.appliedProcedureCode || null;
      this.searchKeyword = state.searchKeyword || '';

      if (this.appliedDonationType || this.appliedProcedureCode) {
        this.appliedFilters = {
          donationType: this.appliedDonationType,
          procedureCode: this.appliedProcedureCode
        };
        this.filterPanelForm.patchValue({
          donationType: this.appliedDonationType,
          procedureCode: this.appliedProcedureCode
        });
      }

      if (this.tableConfig.sortConfig) {
        this.tableConfig.sortConfig.column = state.sortColumn || 'driveId';
        this.tableConfig.sortConfig.direction = state.sortDirection || 'D';
      }
      if (this.tableConfig.pagination) {
        this.tableConfig.pagination.pageIndex = state.pageIndex || 0;
        this.tableConfig.pagination.pageSize = state.pageSize || 25;
      }

      if (state.fromDate && state.toDate) {
        this.loadDrives(state.fromDate, state.toDate);
        setTimeout(() => {
          this.filterForm.patchValue({ driveId: state.driveId || '' }, { emitEvent: false });
          this.onRetrieve();
        });
        return true;
      }
    } catch {
      // Ignore corrupted state
    }
    return false;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    const err = error as { error?: { errorResponse?: { error?: string }; message?: string }; message?: string };
    return err?.error?.errorResponse?.error || err?.error?.message || err?.message || fallback;
  }

  private showError(message: string): void {
    this.liveAnnouncer.announce(message, 'assertive');
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
