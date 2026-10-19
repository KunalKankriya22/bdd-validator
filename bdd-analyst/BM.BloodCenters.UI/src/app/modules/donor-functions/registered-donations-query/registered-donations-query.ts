import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, inject, effect, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DonationEntryDetailsDialogComponent } from '@shared/components/donation-entry-details-dialog/donation-entry-details-dialog';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { DonationDeferralAuditDrawerComponent } from '../registration/audit-donation/components/donation-deferral-audit-drawer/donation-deferral-audit-drawer';
import { HoldReasonDialogComponent } from '../registration/registration-queries/donations-on-hold-query/hold-reason-dialog/hold-reason-dialog';
import { HoldReasonDialogData } from '../registration/registration-queries/donations-on-hold-query/models/donations-on-hold-query.model';
import { PhlebotomyDetailsDialogComponent } from './phlebotomy-details-dialog/phlebotomy-details-dialog';
import { RegisteredDonationsQueryService } from './services/registered-donations-query.service';
import { RegisteredDonationsQueryStateService } from './services/registered-donations-query-state.service';
import {
  DonationQueryResult,
  DonationQueryRequest,
  DriveOption,
  UserOption,
  SetOption
} from './models/registered-donations-query.model';

@Component({
  selector: 'app-registered-donations-query',
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
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './registered-donations-query.html',
  styleUrls: ['./registered-donations-query.scss']
})
export class RegisteredDonationsQuery implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(DataTable) dataTableComponent!: DataTable<DonationQueryResult>;
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(RegisteredDonationsQueryService);
  private readonly stateService = inject(RegisteredDonationsQueryStateService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly cancelDropdownLoad$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  filterForm!: FormGroup;

  readonly driveOptions = signal<DriveOption[]>([]);
  readonly userOptions = signal<UserOption[]>([]);
  readonly setOptions = signal<SetOption[]>([]);

  allData: DonationQueryResult[] = [];
  dataSource: DonationQueryResult[] = [];
  totalFound = 0;

  isLoadingData = false;
  isLoadingDrives = false;
  isLoadingUsers = false;
  isLoadingSets = false;
  hasRetrievedData = false;
  showEmptyState = true;
  private lovLimit = 21;

  // Dropdown search
  readonly driveSearchControl = new FormControl('');
  readonly userSearchControl = new FormControl('');
  readonly setSearchControl = new FormControl('');
  readonly driveSearch = signal('');
  readonly userSearch = signal('');
  readonly setSearch = signal('');
  private readonly driveIdValue = signal<string | null>(null);
  private readonly userIdValue = signal<string | null>(null);
  private readonly setIdValue = signal<string | null>(null);

  readonly filteredDrives = computed(() => {
    const search = this.driveSearch().toLowerCase();
    const options = this.driveOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.driveId || '').toLowerCase().includes(search) ||
      (o.driveName || '').toLowerCase().includes(search)
    );
  });

  readonly filteredUsers = computed(() => {
    const search = this.userSearch().toLowerCase();
    const options = this.userOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.userId || '').toLowerCase().includes(search) ||
      (o.userName || '').toLowerCase().includes(search)
    );
  });

  readonly filteredSets = computed(() => {
    const search = this.setSearch().toLowerCase();
    const options = this.setOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.setId || '').toLowerCase().includes(search) ||
      (o.collectionDate || '').toLowerCase().includes(search)
    );
  });

  readonly selectedDriveDisplay = computed(() => {
    const selectedId = this.driveIdValue();
    if (!selectedId) return '';
    const drive = this.driveOptions().find(d => d.driveId === selectedId);
    if (!drive) return selectedId;
    return drive.driveName ? `${drive.driveId} - ${drive.driveName}` : drive.driveId;
  });

  readonly selectedUserDisplay = computed(() => {
    const selectedId = this.userIdValue();
    if (!selectedId) return '';
    const user = this.userOptions().find(u => u.userId === selectedId);
    if (!user) return selectedId;
    return user.userName ? `${user.userId} - ${user.userName}` : user.userId;
  });

  readonly selectedSetDisplay = computed(() => {
    const selectedId = this.setIdValue();
    if (!selectedId) return '';
    const set = this.setOptions().find(s => s.setId === selectedId);
    if (!set) return selectedId;
    return set.collectionDate ? `${set.setId} - ${set.collectionDate}` : set.setId;
  });

  // Dropdown tooltip truncation
  isDriveTruncated = false;
  isUserTruncated = false;
  isSetTruncated = false;

  // To-only error state
  fromDateRequiredError = false;
  isDialogOpen = false;

  // Sort state
  currentSortColumn = 'unitId';
  currentSortDirection: 'A' | 'D' | 'default' = 'A';
  private pendingUnitIdRestore = '';

  tableConfig: DataTableConfig<DonationQueryResult> = {
    columns: [
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: true,
        type: 'text',
        minWidth: '160px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'setId',
        header: 'Batch ID',
        sortable: true,
        type: 'text',
        minWidth: '120px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'driveId',
        header: 'Drive ID',
        sortable: true,
        type: 'text',
        minWidth: '120px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'collectionDate',
        header: 'Collection Date',
        sortable: true,
        type: 'text',
        minWidth: '130px',
        valueFormatter: (value: string | null) =>
          value ? (DateFieldValidationUtility.formatDateForUI(new Date(value)) || '--').toUpperCase() : '--'
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
        key: 'insertUser',
        header: 'User',
        sortable: true,
        type: 'text',
        minWidth: '90px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'insertDate',
        header: 'Date and Time of Registration',
        sortable: true,
        type: 'text',
        minWidth: '200px',
        valueFormatter: (value: string | null) => {
          if (!value) return '--';
          const d = new Date(value);
          const dateStr = (DateFieldValidationUtility.formatDateForUI(d) || '').toUpperCase();
          const hours = d.getHours();
          const minutes = d.getMinutes().toString().padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const h = hours % 12 || 12;
          return `${dateStr}, ${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
        }
      },
      {
        key: 'auditFlag',
        header: 'Audit Complete',
        sortable: true,
        type: 'text',
        minWidth: '100px',
        valueFormatter: (value: string | null) => {
          if (value === 'Y') return 'Yes';
          return '--';
        }
      }
    ],
    rowActions: [
      { label: 'Entry Details', action: 'entryDetails' },
      { label: 'Audit Details', action: 'auditDetails' },
      { label: 'Phlebotomy Details', action: 'phlebotomyDetails' },
      { label: 'Hold Reason', action: 'holdReason' },
      { label: 'Consents', action: 'consents' }
    ],
    showActionsAsMenu: true,
    enableRowHighlight: false,
    stickyHeader: true,
    sortConfig: { column: 'unitId', direction: 'A' },
    emptyMessage: 'No donation records found',
    loadingMessage: 'Loading donation data...'
  };

  constructor() {
    this.initializeForm();

    this.driveSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.driveSearch.set(value || ''));

    this.userSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.userSearch.set(value || ''));

    this.setSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.setSearch.set(value || ''));

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras?.state || window.history.state;
        const breadcrumbs = state?.['fromDonorDetailQuery']
          ? [
              { label: 'Home', link: '/home' },
              { label: 'Donor Detail Query', link: '/donor-functions/donor-profile/donor-detail-query' },
              { label: pageData.title, link: null }
            ]
          : [
              { label: 'Home', link: '/home' },
              { label: pageData.title, link: null }
            ];
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs,
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    const restored = this.stateService.restore();
    if (restored) {
      this.restoreState(restored);
    } else {
      this.loadDropdownsIfDatesValid();
    }
    this.fetchLovLimit();
  }

  ngAfterViewInit(): void {
    if (this.pendingUnitIdRestore && this.unitIdField) {
      this.unitIdField.unitIdControl.setValue(this.pendingUnitIdRestore, { emitEvent: false });
      this.pendingUnitIdRestore = '';
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadDropdownsIfDatesValid();
        this.fetchLovLimit();
      });
  }

  private fetchLovLimit(): void {
    this.service.getLovLimit()
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.lovLimit = value);
  }

  ngOnDestroy(): void {
    this.cancelDropdownLoad$.next();
    this.cancelDropdownLoad$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      driveDateFrom: [null],
      driveDateTo: [null],
      driveId: [null],
      userId: [null],
      setId: [null]
    });

    this.filterForm.get('driveDateFrom')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onDatesChanged());

    this.filterForm.get('driveDateTo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onDatesChanged());

    this.filterForm.get('driveId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.driveIdValue.set(val));

    this.filterForm.get('userId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.userIdValue.set(val));

    this.filterForm.get('setId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.setIdValue.set(val));
  }

  private onDatesChanged(): void {
    this.cancelDropdownLoad$.next();
    this.validateDates();
    this.filterForm.patchValue({ driveId: null, userId: null, setId: null }, { emitEvent: false });
    this.driveIdValue.set(null);
    this.userIdValue.set(null);
    this.setIdValue.set(null);
    this.driveOptions.set([]);
    this.userOptions.set([]);
    this.setOptions.set([]);
    this.driveSearchControl.setValue('');
    this.userSearchControl.setValue('');
    this.setSearchControl.setValue('');
    this.loadDropdownsIfDatesValid();
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

  onFromDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.filterForm.get('driveDateFrom')
    );
  }

  onToDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.filterForm.get('driveDateTo')
    );
  }

  onDropdownOpened(opened: boolean): void {
    if (!opened) {
      this.fromDateRequiredError = false;
      return;
    }
    const from = this.filterForm.get('driveDateFrom')?.value;
    const to = this.filterForm.get('driveDateTo')?.value;
    if (!from && to) {
      this.fromDateRequiredError = true;
    } else if (from && !to) {
      this.filterForm.get('driveDateTo')?.setValue(from.clone(), { emitEvent: false });
      this.validateDates();
      this.loadDropdownsIfDatesValid();
    }
  }

  private loadDropdownsIfDatesValid(): void {
    const fromControl = this.filterForm.get('driveDateFrom');
    const toControl = this.filterForm.get('driveDateTo');

    if (fromControl?.errors || toControl?.errors) return;

    const from = fromControl?.value;
    const to = toControl?.value;

    if (!from && to) return;

    this.fromDateRequiredError = false;

    const fromStr = from ? DateFieldValidationUtility.serializeDateForApi(from) : null;
    const toStr = to ? DateFieldValidationUtility.serializeDateForApi(to) : null;

    this.loadDrives(fromStr, toStr);
    this.loadUsers(fromStr, toStr);
    this.loadSets(fromStr, toStr);
  }

  private loadDrives(fromDate?: string | null, toDate?: string | null): void {
    this.isLoadingDrives = true;
    this.service.getDrivesDropdown(fromDate, toDate)
      .pipe(takeUntil(this.cancelDropdownLoad$), takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.driveOptions.set(result.data);
          this.isLoadingDrives = false;
        },
        error: () => {
          this.driveOptions.set([]);
          this.isLoadingDrives = false;
        }
      });
  }

  private loadUsers(fromDate?: string | null, toDate?: string | null): void {
    this.isLoadingUsers = true;
    this.service.getUsersDropdown(fromDate, toDate)
      .pipe(takeUntil(this.cancelDropdownLoad$), takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.userOptions.set(result.data);
          this.isLoadingUsers = false;
        },
        error: () => {
          this.userOptions.set([]);
          this.isLoadingUsers = false;
        }
      });
  }

  private loadSets(fromDate?: string | null, toDate?: string | null): void {
    this.isLoadingSets = true;
    this.service.getSetsDropdown(fromDate, toDate)
      .pipe(takeUntil(this.cancelDropdownLoad$), takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.setOptions.set(result.data);
          this.isLoadingSets = false;
        },
        error: () => {
          this.setOptions.set([]);
          this.isLoadingSets = false;
        }
      });
  }

  onRetrieve(): void {
    this.showEmptyState = false;
    this.hasRetrievedData = true;
    this.applyDefaultDatesIfEmpty();
    this.loadData();
  }

  private applyDefaultDatesIfEmpty(): void {
    if (this.allFiltersEmpty) {
      const chapterToday = this.chapterTimezoneService.getChapterLocalDate();
      const fromDate = chapterToday.clone().subtract(this.lovLimit, 'days');

      this.filterForm.patchValue(
        { driveDateFrom: fromDate, driveDateTo: chapterToday },
        { emitEvent: false }
      );
    }
  }

  private loadData(): void {
    this.isLoadingData = true;

    const form = this.filterForm.value;
    const request: DonationQueryRequest = {
      driveDateFrom: form.driveDateFrom ? DateFieldValidationUtility.serializeDateForApi(form.driveDateFrom) : null,
      driveDateTo: form.driveDateTo ? DateFieldValidationUtility.serializeDateForApi(form.driveDateTo) : null,
      driveId: form.driveId || null,
      userId: form.userId || null,
      unitId: this.unitIdField?.parsedUnitId || null,
      setId: form.setId || null,
      sortDirection: this.currentSortDirection === 'D' ? 'DESC' : 'ASC'
    };

    this.service.searchDonations(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.allData = result.data;
          this.dataSource = [...this.allData];
          this.totalFound = result.totalRecords;
          this.isLoadingData = false;
        },
        error: () => {
          this.allData = [];
          this.dataSource = [];
          this.totalFound = 0;
          this.isLoadingData = false;
        }
      });
  }

  onClearAll(): void {
    this.cancelDropdownLoad$.next();
    this.filterForm.reset();
    this.allData = [];
    this.dataSource = [];
    this.totalFound = 0;
    this.driveOptions.set([]);
    this.userOptions.set([]);
    this.setOptions.set([]);
    this.driveSearchControl.setValue('');
    this.userSearchControl.setValue('');
    this.setSearchControl.setValue('');
    this.unitIdField?.clear();
    this.showEmptyState = true;
    this.hasRetrievedData = false;
    this.currentSortColumn = 'unitId';
    this.currentSortDirection = 'A';
    this.isDriveTruncated = false;
    this.isUserTruncated = false;
    this.isSetTruncated = false;
    this.fromDateRequiredError = false;
  }

  onSortChange(event: TableSortEvent): void {
    this.currentSortColumn = event.column;
    this.currentSortDirection = event.direction || 'A';
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: this.currentSortColumn, direction: this.currentSortDirection }
    };
    this.sortDataLocally();
  }

  private readonly dateColumns = new Set(['collectionDate', 'insertDate']);

  private sortDataLocally(): void {
    const key = this.currentSortColumn as keyof DonationQueryResult;
    const isDate = this.dateColumns.has(this.currentSortColumn);

    const sorted = [...this.allData].sort((a, b) => {
      const aRaw = a[key];
      const bRaw = b[key];

      if (!aRaw && !bRaw) return 0;
      if (!aRaw) return 1;
      if (!bRaw) return -1;

      let cmp: number;
      if (isDate) {
        cmp = new Date(aRaw).getTime() - new Date(bRaw).getTime();
      } else {
        cmp = aRaw.toLowerCase().localeCompare(bRaw.toLowerCase());
      }

      return this.currentSortDirection === 'D' ? -cmp : cmp;
    });
    this.dataSource = sorted;
  }

  onRowAction(event: TableRowActionEvent<DonationQueryResult>): void {
    if (event.action === 'entryDetails') {
      if (!event.row.unitId) return;
      this.isDialogOpen = true;
      setTimeout(() => {
        if (this.dataTableComponent) this.dataTableComponent.activeRow = event.row;
      });
      const dialogRef = this.dialog.open(DonationEntryDetailsDialogComponent, {
        width: '1000px',
        maxWidth: '100vw',
        data: { unitId: event.row.unitId, collDate: event.row.collectionDate },
        disableClose: false,
        panelClass: 'code-dialog-panel-right',
        position: { right: '0', top: '64px' },
        hasBackdrop: true,
        backdropClass: 'code-dialog-backdrop',
      });
      dialogRef.afterClosed().subscribe(() => {
        this.isDialogOpen = false;
        if (this.dataTableComponent) {
          this.dataTableComponent.activeRow = null;
        }
      });
    } else if (event.action === 'auditDetails') {
      if (!event.row.transactionId) return;
      this.isDialogOpen = true;
      setTimeout(() => {
        if (this.dataTableComponent) this.dataTableComponent.activeRow = event.row;
      });
      const dialogRef = this.dialog.open(DonationDeferralAuditDrawerComponent, {
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
      });
      dialogRef.afterClosed().subscribe(() => {
        this.isDialogOpen = false;
        if (this.dataTableComponent) {
          this.dataTableComponent.activeRow = null;
        }
      });
    } else if (event.action === 'holdReason') {
      if (!event.row.transactionId) return;
      this.isDialogOpen = true;
      setTimeout(() => {
        if (this.dataTableComponent) this.dataTableComponent.activeRow = event.row;
      });
      const holdReasonData: HoldReasonDialogData = {
        unitId: event.row.unitId || '',
        collDate: event.row.collectionDate || '',
        donorId: event.row.donorId || '',
        donorName: '',
        transactionId: event.row.transactionId,
      };
      const dialogRef = this.dialog.open(HoldReasonDialogComponent, {
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
      });
      dialogRef.afterClosed().subscribe(() => {
        this.isDialogOpen = false;
        if (this.dataTableComponent) {
          this.dataTableComponent.activeRow = null;
        }
      });
    } else if (event.action === 'phlebotomyDetails') {
      if (!event.row.transactionId) return;
      this.isDialogOpen = true;
      setTimeout(() => {
        if (this.dataTableComponent) this.dataTableComponent.activeRow = event.row;
      });
      const dialogRef = this.dialog.open(PhlebotomyDetailsDialogComponent, {
        width: '1000px',
        height: 'calc(100vh - 64px)',
        maxWidth: '100vw',
        maxHeight: 'calc(100vh - 64px)',
        data: { transactionId: event.row.transactionId },
        disableClose: false,
        autoFocus: false,
        panelClass: 'code-dialog-panel-right',
        position: { right: '0', top: '64px' },
        hasBackdrop: true,
        backdropClass: 'code-dialog-backdrop',
      });
      dialogRef.afterClosed().subscribe(() => {
        this.isDialogOpen = false;
        if (this.dataTableComponent) {
          this.dataTableComponent.activeRow = null;
        }
      });
    } else if (event.action === 'consents') {
      if (!event.row.donorId) return;
      this.saveState();
      this.router.navigate(
        ['/donor-functions/registration/consent-history'],
        { state: { donorId: event.row.donorId, unitId: event.row.unitId, collectionDate: event.row.collectionDate } }
      );
    }
  }

  onUnitValidated(_data: UnitValidationResponse): void {}

  onUnitCleared(): void {}

  checkDriveTruncation(el: HTMLElement): void {
    this.isDriveTruncated = el.scrollWidth > el.clientWidth;
  }

  checkUserTruncation(el: HTMLElement): void {
    this.isUserTruncated = el.scrollWidth > el.clientWidth;
  }

  checkSetTruncation(el: HTMLElement): void {
    this.isSetTruncated = el.scrollWidth > el.clientWidth;
  }

  private saveState(): void {
    this.stateService.save({
      filterFormValues: { ...this.filterForm.value },
      unitIdRaw: this.unitIdField?.unitIdControl?.value || '',
      allData: this.allData,
      dataSource: this.dataSource,
      totalFound: this.totalFound,
      hasRetrievedData: this.hasRetrievedData,
      showEmptyState: this.showEmptyState,
      currentSortColumn: this.currentSortColumn,
      currentSortDirection: this.currentSortDirection,
      driveOptions: this.driveOptions(),
      userOptions: this.userOptions(),
      setOptions: this.setOptions(),
    });
  }

  private restoreState(state: import('./services/registered-donations-query-state.service').RdqSavedState): void {
    this.filterForm.patchValue(state.filterFormValues, { emitEvent: false });
    this.driveIdValue.set(state.filterFormValues.driveId);
    this.userIdValue.set(state.filterFormValues.userId);
    this.setIdValue.set(state.filterFormValues.setId);
    this.driveOptions.set(state.driveOptions);
    this.userOptions.set(state.userOptions);
    this.setOptions.set(state.setOptions);
    this.allData = state.allData;
    this.dataSource = state.dataSource;
    this.totalFound = state.totalFound;
    this.hasRetrievedData = state.hasRetrievedData;
    this.showEmptyState = state.showEmptyState;
    this.currentSortColumn = state.currentSortColumn;
    this.currentSortDirection = state.currentSortDirection;
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: this.currentSortColumn, direction: this.currentSortDirection },
    };
    if (state.unitIdRaw) {
      this.pendingUnitIdRestore = state.unitIdRaw;
    }
  }

  private get allFiltersEmpty(): boolean {
    const form = this.filterForm.value;
    return !form.driveDateFrom && !form.driveDateTo && !form.driveId && !form.userId && !form.setId && !this.unitIdField?.parsedUnitId;
  }

  get isClearAllDisabled(): boolean {
    return this.allFiltersEmpty;
  }

  get isRetrieveDisabled(): boolean {
    const unitState = this.unitIdField?.validationState;
    return this.isLoadingData || unitState === 'validating' || unitState === 'invalid' || this.filterForm.invalid || this.fromDateRequiredError;
  }
}
