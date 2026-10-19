import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, effect, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { A11yModule } from '@angular/cdk/a11y';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject, filter, merge, takeUntil } from 'rxjs';
import moment from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableRowActionEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ROUTES } from '../../../../../core/constants/route.constants';
import { ROUTE_REGISTRY } from '../../../../../core/constants/route-registry';
import { RouteKey } from '../../../../../core/constants/route-keys';
import { DonationsOnHoldQueryService } from './services/donations-on-hold-query.service';
import {
  DonationOnHold,
  DonationsOnHoldRequest,
  DonationsOnHoldLookups,
  LookupOption,
} from './models/donations-on-hold-query.model';
import { HoldDetailsPanelComponent } from '@shared/components/hold-details-panel/hold-details-panel';
import { HoldDetailsPanelRecord } from '@shared/components/hold-details-panel/hold-details-panel.model';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { DonationEntryDetailsDialogComponent } from '@shared/components/donation-entry-details-dialog/donation-entry-details-dialog';
import { DonationEntryDetailsData } from '@shared/models/donation-entry-details.model';

@Component({
  selector: 'app-donations-on-hold-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSidenavModule,
    MatTooltipModule,
    A11yModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
    HoldDetailsPanelComponent,
    RouterOutlet,
  ],
  templateUrl: './donations-on-hold-query.html',
  styleUrls: ['./donations-on-hold-query.scss'],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
})
export class DonationsOnHoldQueryComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private donationsOnHoldQueryService = inject(DonationsOnHoldQueryService);
  private pageHeaderService = inject(PageHeaderService);
  private headerService = inject(HeaderService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private chapterTimezoneService = inject(ChapterTimezoneService);
  private snackbarService = inject(SnackbarService);
  private dialog = inject(MatDialog);

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  selectedRecord: HoldDetailsPanelRecord | null = null;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: ROUTES.HOME }],
    title: '',
    subtitle: '',
    actions: [],
  };

  tableConfig: DataTableConfig<DonationOnHold> = {
    columns: [
      { key: 'displayUnitId', header: 'Unit ID', sortable: true, type: 'text', width: '200px' },
      { key: 'driveId', header: 'Drive ID', sortable: false, type: 'text', width: '120px' },
      {
        key: 'collDate',
        header: 'Collection Date',
        sortable: false,
        type: 'text',
        width: '130px',
        valueFormatter: (value) => this.formatDate(value),
      },
      { key: 'donorId', header: 'Donor ID', sortable: false, type: 'text', width: '120px' },
      { key: 'donationType', header: 'Donation Type', sortable: false, type: 'text', width: '100px' },
      { key: 'procedureCode', header: 'Procedure Code', sortable: false, type: 'text', width: '120px' },
      { key: 'insertUser', header: 'User', sortable: false, type: 'text', width: '100px' },
      {
        key: 'insertDate',
        header: 'Date and Time of Registration',
        sortable: false,
        type: 'text',
        width: '220px',
        valueFormatter: (value) => this.formatDateTime(value),
      },
      { key: 'auditFlag', header: 'Audit Complete', sortable: false, type: 'text', width: '100px' },
    ],
    rowActions: [
      { icon: 'description', label: 'Entry Details', ariaLabel: 'View entry details', action: 'entry-details' },
      { icon: 'info', label: 'Hold Reason', ariaLabel: 'View hold reason', action: 'hold-reason' },
      { icon: 'person_add', label: 'Attach Donor', ariaLabel: 'Attach donor', action: 'attach-donor' },
      { icon: 'edit', label: 'Update REGIS', ariaLabel: 'Update registration', action: 'update-regis' },
      { icon: 'fact_check', label: 'Update Audit', ariaLabel: 'Update audit', action: 'update-audit' },
    ],
    sortConfig: { column: 'displayUnitId', direction: 'A' },
    stickyHeader: true,
    showActionsAsMenu: true,
    stickyActionsColumn: true,
    enableRowHighlight: false,
    showPagination: true,
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter search criteria to view Results',
  };

  isChildRouteActive = false;

  filterForm!: FormGroup;
  dataSource: DonationOnHold[] = [];
  totalFound = 0;
  errorMessage: string | null = null;

  lookups: DonationsOnHoldLookups = {
    showTerms: [],
    drives: [],
    users: [],
    donationTypes: [],
    procedureCodes: [],
    holds: [],
  };

  readonly driveOptions = signal<LookupOption[]>([]);
  readonly userOptions = signal<LookupOption[]>([]);
  readonly donationTypeOptions = signal<LookupOption[]>([]);
  readonly procedureCodeOptions = signal<LookupOption[]>([]);
  readonly holdOptions = signal<LookupOption[]>([]);

  readonly driveSearchCtrl = new FormControl('');
  readonly userSearchCtrl = new FormControl('');
  readonly donationTypeSearchCtrl = new FormControl('');
  readonly procedureCodeSearchCtrl = new FormControl('');
  readonly holdSearchCtrl = new FormControl('');

  readonly driveSearch = signal('');
  readonly userSearch = signal('');
  readonly donationTypeSearch = signal('');
  readonly procedureCodeSearch = signal('');
  readonly holdSearch = signal('');

  readonly filteredDrives = computed(() => {
    const search = this.driveSearch().toLowerCase();
    const options = this.driveOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.code || '').toLowerCase().includes(search) ||
      (o.description || '').toLowerCase().includes(search));
  });

  readonly filteredUsers = computed(() => {
    const search = this.userSearch().toLowerCase();
    const options = this.userOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.code || '').toLowerCase().includes(search) ||
      (o.description || '').toLowerCase().includes(search));
  });

  readonly filteredDonationTypes = computed(() => {
    const search = this.donationTypeSearch().toLowerCase();
    const options = this.donationTypeOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.code || '').toLowerCase().includes(search) ||
      (o.description || '').toLowerCase().includes(search));
  });

  readonly filteredProcedureCodes = computed(() => {
    const search = this.procedureCodeSearch().toLowerCase();
    const options = this.procedureCodeOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.code || '').toLowerCase().includes(search) ||
      (o.description || '').toLowerCase().includes(search));
  });

  readonly filteredHolds = computed(() => {
    const search = this.holdSearch().toLowerCase();
    const options = this.holdOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.code || '').toLowerCase().includes(search) ||
      (o.description || '').toLowerCase().includes(search));
  });

  maxDate: moment.Moment = this.chapterTimezoneService.getChapterLocalDate();
  isLoadingDropdowns = false;
  isLoadingData = false;

  private destroy$ = new Subject<void>();

  constructor() {
    this.initializeForm();

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

    effect(() => {
      const chapterDate = this.chapterTimezoneService.chapterLocalDate();
      if (chapterDate && chapterDate.isValid()) {
        this.maxDate = chapterDate.clone().startOf('day');
      }
    });
  }

  ngOnInit(): void {
    this.loadLookups();
    this.subscribeToChapterChanges();
    this.subscribeToSearchControls();
    this.subscribeToDateChanges();
    this.detectChildRoute();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private detectChildRoute(): void {
    this.isChildRouteActive = this.route.children.length > 0;
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.isChildRouteActive = this.route.children.length > 0;
        this.cdr.markForCheck();
      });
  }

  get isRetrieveDisabled(): boolean {
    return this.isLoadingData || this.filterForm.invalid || this.unitIdField?.validationState === 'invalid';
  }

  get hasAnyFilterValue(): boolean {
    const v = this.filterForm.value;
    return !!(v.showTerm || v.fromDate || v.toDate || v.drive || v.user ||
      this.unitIdField?.isValid || v.donationType || v.procedureCode || v.hold?.length);
  }

  onRetrieve(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageSize = event.pageSize;
      this.tableConfig.pagination.pageIndex = event.pageIndex;
    }
    this.loadData();
  }

  onClearAll(): void {
    this.filterForm.reset({ showTerm: 'N', hold: [] });
    this.driveSearchCtrl.setValue('');
    this.userSearchCtrl.setValue('');
    this.donationTypeSearchCtrl.setValue('');
    this.procedureCodeSearchCtrl.setValue('');
    this.holdSearchCtrl.setValue('');
    this.unitIdField?.clear();
    this.dataSource = [];
    this.totalFound = 0;
    this.errorMessage = null;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
      this.tableConfig.pagination.totalRecords = 0;
    }
  }

  onUnitValidated(_data: UnitValidationResponse): void {
  }

  onUnitCleared(): void {
  }

  onRowAction(event: TableRowActionEvent<DonationOnHold>): void {
    switch (event.action) {
      case 'entry-details':
        this.onEntryDetails(event.row);
        break;
      case 'hold-reason':
        this.onHoldReason(event.row);
        break;
      case 'attach-donor':
        this.onAttachDonor(event.row);
        break;
      case 'update-regis':
        this.onUpdateRegis(event.row);
        break;
      case 'update-audit':
        this.onUpdateAudit(event.row);
        break;
    }
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
    this.loadData();
  }

  onDateBlur(controlName: string, inputElement: HTMLInputElement): void {
    const control = this.filterForm.get(controlName);
    const inputValue = inputElement.value?.trim();

    const ddmmyyPattern = /^(\d{2})(\d{2})(\d{2})$/;
    const match = inputValue?.match(ddmmyyPattern);

    if (match) {
      const [, day, month, year] = match;
      const fullYear = `20${year}`;
      const parsedDate = moment(`${day}-${month}-${fullYear}`, 'DD-MM-YYYY', true);

      if (parsedDate.isValid()) {
        control?.setValue(parsedDate);
        control?.markAsTouched();
        return;
      }
    }

    if (inputValue && control?.value === null) {
      control.setErrors({ invalidDateFormat: true });
      control.markAsTouched();
    }
  }

  getFromDateError(): string {
    const control = this.filterForm.get('fromDate');

    if (
      control?.hasError('invalidDateFormat') ||
      control?.hasError('invalidDate') ||
      control?.hasError('matDatepickerParse')
    ) {
      return 'Date is invalid';
    }

    if (control?.hasError('futureDate')) {
      return 'Date cannot be in the future';
    }

    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    if (fromDate && toDate && this.filterForm.errors?.['dateRangeInvalid']) {
      return 'Date cannot be after To Date';
    }

    return '';
  }

  getToDateError(): string {
    const control = this.filterForm.get('toDate');

    if (
      control?.hasError('invalidDateFormat') ||
      control?.hasError('invalidDate') ||
      control?.hasError('matDatepickerParse')
    ) {
      return 'Date is invalid';
    }

    if (control?.hasError('futureDate')) {
      return 'Date cannot be in the future';
    }

    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    if (fromDate && toDate && this.filterForm.errors?.['dateRangeInvalid']) {
      return 'Date cannot be before From Date';
    }

    return '';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const m = moment(dateString);
      return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
    } catch {
      return dateString;
    }
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    try {
      const m = moment(dateString);
      if (!m.isValid()) return dateString;
      return m.format('DD-MMM-YYYY, hh:mm A').toUpperCase();
    } catch {
      return dateString;
    }
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group(
      {
        showTerm: ['N', [Validators.required]],
        fromDate: [null, [this.futureDateValidator()]],
        toDate: [null, [this.futureDateValidator()]],
        drive: [''],
        user: [''],
        donationType: [''],
        procedureCode: [''],
        hold: [[] as string[]],
      },
      {
        validators: [DateFieldValidationUtility.fromToDateRangeValidator('fromDate', 'toDate')],
      },
    );
  }

  private futureDateValidator() {
    return (control: { value: moment.Moment | Date | null }) => {
      if (!control.value) return null;
      const date = moment.isMoment(control.value) ? control.value : moment(control.value);
      const chapterDate = this.chapterTimezoneService.getChapterLocalDate();
      if (date.isValid() && date.isAfter(chapterDate, 'day')) {
        return { futureDate: true };
      }
      return null;
    };
  }

  private subscribeToSearchControls(): void {
    this.driveSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.driveSearch.set(v || ''));

    this.userSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.userSearch.set(v || ''));

    this.donationTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.donationTypeSearch.set(v || ''));

    this.procedureCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.procedureCodeSearch.set(v || ''));

    this.holdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.holdSearch.set(v || ''));
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.selectedRecord = null;
        this.onClearAll();
        this.loadLookups();
      });
  }

  private subscribeToDateChanges(): void {
    merge(
      this.filterForm.get('fromDate')!.valueChanges,
      this.filterForm.get('toDate')!.valueChanges,
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.reloadDateFilteredLookups());
  }

  private reloadDateFilteredLookups(): void {
    const fromDate = this.formatDateForApi(this.filterForm.get('fromDate')?.value);
    const toDate = this.formatDateForApi(this.filterForm.get('toDate')?.value);

    this.donationsOnHoldQueryService
      .getDrivesLookup(fromDate || undefined, toDate || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (drives) => {
          this.driveOptions.set([...drives].sort((a, b) => a.description.localeCompare(b.description)));
          const currentDrive = this.filterForm.get('drive')?.value;
          if (currentDrive && !drives.some(d => d.code === currentDrive)) {
            this.filterForm.get('drive')?.reset();
          }
          this.cdr.markForCheck();
        },
      });

    this.donationsOnHoldQueryService
      .getUsersLookup(fromDate || undefined, toDate || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.userOptions.set([...users].sort((a, b) => a.description.localeCompare(b.description)));
          const currentUser = this.filterForm.get('user')?.value;
          if (currentUser && !users.some(u => u.code === currentUser)) {
            this.filterForm.get('user')?.reset();
          }
          this.cdr.markForCheck();
        },
      });
  }

  private loadLookups(): void {
    this.isLoadingDropdowns = true;

    this.donationsOnHoldQueryService
      .getLookups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lookups) => {
          this.lookups = lookups;
          this.driveOptions.set([...lookups.drives].sort((a, b) => a.description.localeCompare(b.description)));
          this.userOptions.set([...lookups.users].sort((a, b) => a.description.localeCompare(b.description)));
          this.donationTypeOptions.set([...lookups.donationTypes].sort((a, b) => a.description.localeCompare(b.description)));
          this.procedureCodeOptions.set([...lookups.procedureCodes].sort((a, b) => a.description.localeCompare(b.description)));
          this.holdOptions.set([...lookups.holds].sort((a, b) => a.description.localeCompare(b.description)));
          this.isLoadingDropdowns = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading lookups:', error);
          this.isLoadingDropdowns = false;
        },
      });
  }

  private loadData(): void {
    this.isLoadingData = true;
    this.errorMessage = null;

    const formValue = this.filterForm.value;
    const userId = this.headerService.headerConfig().user?.id || '';
    const chapterId = this.headerService.chapterId() || '';

    const request: DonationsOnHoldRequest = {
      ShowTerminated: formValue.showTerm === 'Y',
      ChapterId: chapterId,
      LoggedInUserName: userId,
    };

    if (formValue.fromDate) {
      request.FromDate = this.formatDateForApi(formValue.fromDate);
    }
    if (formValue.toDate) {
      request.ToDate = this.formatDateForApi(formValue.toDate);
    }
    if (formValue.drive) {
      request.DriveId = formValue.drive;
    }
    if (formValue.user) {
      request.UserId = formValue.user;
    }
    if (this.unitIdField?.parsedUnitId) {
      request.UnitId = this.unitIdField.parsedUnitId;
    }
    if (formValue.donationType) {
      request.DonationType = formValue.donationType;
    }
    if (formValue.procedureCode) {
      request.ProcedureCode = formValue.procedureCode;
    }
    if (formValue.hold?.length) {
      request.HoldCodes = formValue.hold;
    }

    const sortConfig = this.tableConfig.sortConfig;
    if (sortConfig?.column && sortConfig.direction !== 'default') {
      request.SortColumn = sortConfig.column === 'displayUnitId' ? 'unitId' : sortConfig.column;
      request.SortOrder = sortConfig.direction === 'A' ? 'ASC' : 'DESC';
    }

    const pageSize = this.tableConfig.pagination?.pageSize ?? 25;
    const skip = (this.tableConfig.pagination?.pageIndex ?? 0) * pageSize;

    this.donationsOnHoldQueryService
      .search(request, pageSize, skip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.dataSource = result.data;
          this.totalFound = result.total;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = result.total;
          }
          if (result.appliedFromDate) {
            this.filterForm.patchValue({ fromDate: moment(result.appliedFromDate) }, { emitEvent: false });
          }
          if (result.appliedToDate) {
            this.filterForm.patchValue({ toDate: moment(result.appliedToDate) }, { emitEvent: false });
          }
          this.isLoadingData = false;
        },
        error: (error) => {
          console.error('Error loading donations on hold:', error);
          this.dataSource = [];
          this.totalFound = 0;
          this.isLoadingData = false;

          if (error?.error?.errorResponse?.error) {
            this.errorMessage = error.error.errorResponse.error;
          } else if (error?.error?.message) {
            this.errorMessage = error.error.message;
          } else if (error?.message) {
            this.errorMessage = error.message;
          } else {
            this.errorMessage = 'An error occurred while loading data';
          }
        },
      });
  }

  private formatDateForApi(date: moment.Moment | Date | null): string {
    if (!date) return '';
    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DD');
    }
    const d = date as Date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private onEntryDetails(row: DonationOnHold): void {
    if (!row.unitId) return;
    const data: DonationEntryDetailsData = {
      unitId: row.unitId,
      collDate: row.collDate ? DateFieldValidationUtility.serializeDateForApi(moment(row.collDate)) ?? undefined : undefined,
    };
    this.dialog.open(DonationEntryDetailsDialogComponent, {
      width: '1000px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data,
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    });
  }

  private onHoldReason(row: DonationOnHold): void {
    this.selectedRecord = {
      transactionId: row.transactionId,
      donorId: row.donorId,
      unitId: row.unitId,
      collectionDate: row.collDate,
    };
  }

  closeSidePanel(): void {
    this.selectedRecord = null;
  }

  private onAttachDonor(row: DonationOnHold): void {
    if (!row.transactionId) return;
    this.router.navigate(['attach-donor'], {
      relativeTo: this.route,
      queryParams: { transactionId: row.transactionId, unitId: row.unitId || undefined },
    });
  }

  private onUpdateRegis(row: DonationOnHold): void {
    if (!row.unitId) return;
    this.router.navigate(['update-registration'], {
      relativeTo: this.route,
      queryParams: {
        unitId: this.formatUnitIdForScan(row.unitId),
        collectionDate: row.collDate ? DateFieldValidationUtility.serializeDateForApi(moment(row.collDate)) : undefined,
      },
    });
  }

  private formatUnitIdForScan(unitId: string): string {
    if (!unitId) return unitId;
    const trimmed = unitId.trim();
    if (trimmed.length === 13) {
      return '=' + trimmed + '00';
    }
    return trimmed;
  }

  private onUpdateAudit(row: DonationOnHold): void {
    if (!row.unitId) return;
    this.router.navigate([ROUTE_REGISTRY[RouteKey.AuditDonation].path], {
      queryParams: {
        unitId: row.unitId,
        collectionDate: row.collDate ? DateFieldValidationUtility.serializeDateForApi(moment(row.collDate)) : undefined,
      },
    });
  }
}
