import { Component, OnInit, OnDestroy, ViewChild, ElementRef, effect, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject, debounceTime, map, startWith, switchMap, takeUntil, EMPTY } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import * as moment from 'moment';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { UppercaseMomentDateAdapter, DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import { TemporaryDriveQueryService } from './services/temporary-drive-query.service';
import {
  TemporaryDrive,
  TemporaryDriveDetail,
  TemporaryDriveFilterValue,
  TemporaryDriveQueryRequest,
  RecruiterOption,
  SponsorOption,
  StatusOption
} from './models/temporary-drive-query.model';
import { TemporaryDriveQueryFilterPanel } from './temporary-drive-query-filter-panel/temporary-drive-query-filter-panel';
import { TemporaryDriveQueryFilterChipsUtils } from './utils/filter-chips.utils';

/**
 * Temporary Drive Query Component
 * Allows users to query temporary/pending drives by date range, recruiter, status, and sponsor
 * Based on FMB: DRQTEMPD
 */
@Component({
  selector: 'app-temporary-drive-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    FilterChips,
    SearchBar
  ],
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './temporary-drive-query.html',
  styleUrls: ['./temporary-drive-query.scss']
})
export class TemporaryDriveQuery implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TemporaryDriveQueryService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly overlay = inject(Overlay);

  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild(DataTable) dataTableRef!: DataTable<TemporaryDrive>;
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: ''
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Sponsor',
    minLength: 3,
    ariaLabel: 'Search temporary drives by sponsor ID',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<TemporaryDrive> = {
    columns: [
      {
        key: 'tempdrId',
        header: 'Temporary ID',
        sortable: true,
        type: 'text',
        minWidth: '130px'
      },
      {
        key: 'driveDate',
        header: 'Drive Date',
        sortable: false,
        type: 'text',
        minWidth: '120px',
        valueFormatter: (value: string) => value ? DateFieldValidationUtility.formatDateForUI(new Date(value)) || '--' : '--'
      },
      {
        key: 'status',
        header: 'Status',
        sortable: false,
        type: 'text',
        minWidth: '80px',
        valueFormatter: (value: string | null) => {
          if (value === 'U') return 'Used';
          if (value === 'D') return 'Deleted';
          return '--';
        }
      },
      {
        key: 'sponsorName',
        header: 'Sponsor',
        sortable: false,
        type: 'text',
        minWidth: '180px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'recruiterName',
        header: 'Recruiter',
        sortable: false,
        type: 'text',
        minWidth: '130px',
        valueFormatter: (value: string | null) => value?.trim().replace(/^,\s*$/, '') || '--'
      },
      {
        key: 'projectedShow',
        header: 'Projected SHOW',
        sortable: false,
        type: 'number',
        minWidth: '90px',
        valueFormatter: (value: number | null) => value != null ? String(value) : '--'
      },
      {
        key: 'projectedDraw',
        header: 'Projected Draw',
        sortable: false,
        type: 'number',
        minWidth: '90px',
        valueFormatter: (value: number | null) => value != null ? String(value) : '--'
      },
      {
        key: 'projectedDeferralPct',
        header: 'Projected Deferrals %',
        sortable: false,
        type: 'number',
        minWidth: '90px',
        valueFormatter: (value: number | null) => value != null ? String(value) : '--'
      },
      {
        key: 'deleteUser',
        header: 'Delete User',
        sortable: false,
        type: 'text',
        minWidth: '100px',
        valueFormatter: (value: string | null) => value || '--'
      },
      {
        key: 'deleteDate',
        header: 'Delete Date',
        sortable: false,
        type: 'text',
        minWidth: '120px',
        valueFormatter: (value: string | null) => value ? DateFieldValidationUtility.formatDateForUI(new Date(value)) || '--' : '--'
      }
    ],
    sortConfig: {
      column: 'tempdrId',
      direction: 'default'
    },
    stickyHeader: true,
    showPagination: false,
    enableRowHighlight: true,
    emptyMessage: 'No temporary drive records found',
    loadingMessage: 'Loading temporary drive data...'
  };

  filterForm!: FormGroup;
  recruiterOptions: RecruiterOption[] = [];
  sponsorOptions: SponsorOption[] = [];
  appliedFilters: TemporaryDriveFilterValue | null = null;
  filterChips: FilterChip[] = [];

  statusOptions: StatusOption[] = [
    { code: 'U', description: 'Used' },
    { code: 'N', description: 'Unused' },
    { code: 'D', description: 'Deleted' }
  ];

  allData: TemporaryDrive[] = [];
  dataSource: TemporaryDrive[] = [];
  clientSearchKeyword?: string;
  clientSort?: string;
  showEmptyState = true;
  hasRetrievedData = false;

  // Overview Details side panel
  selectedDrive: TemporaryDrive | null = null;
  selectedDriveDetail: TemporaryDriveDetail | null = null;
  isLoadingDetail = false;

  isLoadingRecruiters = false;
  isLoadingSponsors = false;
  isLoadingData = false;
  isFilterOpen = false;
  sponsorName = '';

  // Autocomplete filtered lists
  filteredRecruiters$!: Observable<RecruiterOption[]>;
  filteredSponsors$!: Observable<SponsorOption[]>;
  isSponsorEnabled = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private dateChange$ = new Subject<void>();

  constructor() {
    this.initializeForm();

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
  }

  ngOnInit(): void {
    this.loadLookups();
  }

  ngOnDestroy(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    if (event.key === 'Escape' && this.isFilterOpen) {
      event.preventDefault();
      this.closeFilter();
    }
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required],
      recruiterId: [null],
      status: [null],
      sponsorId: [{ value: null, disabled: true }]
    });

    // Setup autocomplete filters
    this.setupRecruiterFilter();

    // Watch date changes to load sponsors
    this.filterForm.get('fromDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.dateChange$.next());

    this.filterForm.get('toDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.dateChange$.next());

    this.dateChange$.pipe(
      debounceTime(400),
      switchMap(() => {
        this.onDatesChanged();
        return EMPTY;
      }),
      takeUntil(this.destroy$)
    ).subscribe();

    // Normalize empty string to null + clear errors for recruiter
    this.filterForm.get('recruiterId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const control = this.filterForm.get('recruiterId');
        if (typeof value === 'string' && value.trim() === '') {
          control?.setValue(null, { emitEvent: false });
          control?.setErrors(null);
        } else if (typeof value === 'object' && value) {
          control?.setErrors(null);
        }
      });

    // Normalize empty string to null + clear errors + populate sponsor name
    this.filterForm.get('sponsorId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const control = this.filterForm.get('sponsorId');
        if (typeof value === 'string' && value.trim() === '') {
          control?.setValue(null, { emitEvent: false });
          control?.setErrors(null);
          this.sponsorName = '';
        } else if (typeof value === 'object' && value) {
          control?.setErrors(null);
          this.sponsorName = value.name || '';
        } else {
          this.sponsorName = '';
        }
      });
  }

  private onDatesChanged(): void {
    // Clear sponsor selection when dates change
    this.filterForm.get('sponsorId')?.setValue(null, { emitEvent: false });
    this.sponsorName = '';
    this.sponsorOptions = [];
    this.loadSponsorsIfDatesValid();
  }

  private loadSponsorsIfDatesValid(): void {
    const sponsorControl = this.filterForm.get('sponsorId');
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;

    const datesValid = fromDate && toDate && (
      moment.isMoment(fromDate)
        ? fromDate.isSameOrBefore(toDate, 'day')
        : fromDate <= toDate
    );

    if (datesValid) {
      sponsorControl?.enable({ emitEvent: false });
      this.isSponsorEnabled = true;
      this.loadSponsors();
    } else {
      sponsorControl?.disable({ emitEvent: false });
      this.isSponsorEnabled = false;
      this.sponsorOptions = [];
    }
  }

  private setupRecruiterFilter(): void {
    const control = this.filterForm.get('recruiterId');
    if (!control) return;
    this.filteredRecruiters$ = control.valueChanges.pipe(
      startWith(control.value || ''),
      map(value => {
        const filterText = typeof value === 'string' ? value : value?.name || '';
        return this.filterRecruiters(filterText);
      })
    );
  }

  private filterRecruiters(text: string): RecruiterOption[] {
    if (!text) return this.recruiterOptions;
    const lower = text.toLowerCase();
    return this.recruiterOptions.filter(r =>
      r.staffNo.toLowerCase().includes(lower) ||
      r.name.toLowerCase().includes(lower)
    );
  }

  private setupSponsorFilter(): void {
    const control = this.filterForm.get('sponsorId');
    if (!control) return;
    this.filteredSponsors$ = control.valueChanges.pipe(
      startWith(control.value || ''),
      map(value => {
        const filterText = typeof value === 'string' ? value : value?.sponsorId || '';
        return this.filterSponsors(filterText);
      })
    );
  }

  private filterSponsors(text: string): SponsorOption[] {
    if (!text) return this.sponsorOptions;
    const lower = text.toLowerCase();
    return this.sponsorOptions.filter(s =>
      s.sponsorId.toLowerCase().includes(lower) ||
      s.name.toLowerCase().includes(lower)
    );
  }

  displayRecruiter = (option: RecruiterOption): string => {
    return option ? option.name : '';
  };

  displaySponsor = (option: SponsorOption): string => {
    return option ? option.sponsorId : '';
  };

  onRecruiterBlur(): void {
    const control = this.filterForm.get('recruiterId');
    if (!control) return;
    const value = control.value;
    if (typeof value === 'string' && value.trim().length > 0) {
      control.setErrors({ invalidRecruiter: true });
      control.markAsTouched();
    } else if (typeof value === 'string') {
      control.setValue(null);
      control.setErrors(null);
    }
  }

  onRecruiterEnter(event: Event): void {
    event.preventDefault();
    this.onRecruiterBlur();
    (event.target as HTMLElement).blur();
  }

  onRecruiterSelected(): void {
    const control = this.filterForm.get('recruiterId');
    if (control) {
      control.setErrors(null);
    }
  }

  onSponsorBlur(): void {
    const control = this.filterForm.get('sponsorId');
    if (!control) return;
    const value = control.value;
    if (typeof value === 'string' && value.trim().length > 0) {
      control.setErrors({ invalidSponsor: true });
      control.markAsTouched();
    } else if (typeof value === 'string') {
      control.setValue(null);
      control.setErrors(null);
      this.sponsorName = '';
    }
  }

  onSponsorEnter(event: Event): void {
    event.preventDefault();
    this.onSponsorBlur();
    (event.target as HTMLElement).blur();
  }

  onSponsorSelected(): void {
    const control = this.filterForm.get('sponsorId');
    if (control) {
      control.setErrors(null);
    }
    const value = control?.value;
    if (value && typeof value === 'object') {
      this.sponsorName = value.name || '';
    }
  }

  private loadLookups(): void {
    this.isLoadingRecruiters = true;
    this.service.getRecruiters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recruiterOptions = response.data;
          this.isLoadingRecruiters = false;
          this.setupRecruiterFilter();
        },
        error: () => {
          this.recruiterOptions = [];
          this.isLoadingRecruiters = false;
        }
      });
  }

  private loadSponsors(): void {
    const fromDate = DateFieldValidationUtility.serializeDateForApi(this.filterForm.get('fromDate')?.value);
    const toDate = DateFieldValidationUtility.serializeDateForApi(this.filterForm.get('toDate')?.value);

    if (!fromDate || !toDate) return; // defensive: callers should validate dates first

    this.isLoadingSponsors = true;
    this.service.getSponsors(fromDate, toDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.sponsorOptions = response.data;
          this.isLoadingSponsors = false;
          this.setupSponsorFilter();
        },
        error: () => {
          this.sponsorOptions = [];
          this.isLoadingSponsors = false;
        }
      });
  }

  get isRetrieveDisabled(): boolean {
    if (this.isLoadingData || this.filterForm.invalid) return true;
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    if (!fromDate || !toDate) return true;
    const isFromBeforeTo = moment.isMoment(fromDate)
      ? fromDate.isSameOrBefore(toDate, 'day')
      : fromDate <= toDate;
    if (!isFromBeforeTo) return true;
    // Reject partial typed text that hasn't been selected from dropdown
    const recruiterValue = this.filterForm.get('recruiterId')?.value;
    if (typeof recruiterValue === 'string' && recruiterValue.trim().length > 0) return true;
    const sponsorValue = this.filterForm.get('sponsorId')?.value;
    if (typeof sponsorValue === 'string' && sponsorValue.trim().length > 0) return true;
    return false;
  }

  onRetrieve(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    this.showEmptyState = false;
    this.hasRetrievedData = true;
    this.selectedDrive = null;
    this.selectedDriveDetail = null;
    this.loadData();
  }

  onSearch(searchText: string): void {
    this.clientSearchKeyword = searchText || undefined;
    this.dataSource = this.applyClientFilters(this.allData);
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    const directionMap: Record<string, string> = { 'A': '_asc', 'D': '_desc' };

    this.clientSort =
      event.direction === 'default' ? undefined : `${event.column}${directionMap[event.direction]}`;

    this.dataSource = this.applyClientFilters(this.allData);
  }

  onRowClick(row: TemporaryDrive): void {
    this.selectedDrive = row;
    this.loadDetail(row.tempdrId);
  }

  closeSidePanel(): void {
    this.selectedDrive = null;
    this.selectedDriveDetail = null;
    if (this.dataTableRef) {
      this.dataTableRef.activeRow = null;
    }
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.closeFilter();
      return;
    }

    if (!this.tableCard) return;

    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.tableCard)
      .withPositions([
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 56
        }
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const portal = new ComponentPortal(TemporaryDriveQueryFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeFilter();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilter());

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilter());
  }

  private closeFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
  }

  applyFilters(filters: TemporaryDriveFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = TemporaryDriveQueryFilterChipsUtils.convertFiltersToChips(filters);
    this.dataSource = this.applyClientFilters(this.allData);
  }

  removeFilterChip(chipKey: string): void {
    this.appliedFilters = TemporaryDriveQueryFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );
    this.filterChips = TemporaryDriveQueryFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.dataSource = this.applyClientFilters(this.allData);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.dataSource = this.applyClientFilters(this.allData);
  }

  hasActiveFilters(): boolean {
    return TemporaryDriveQueryFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  private loadData(): void {
    const formValue = this.filterForm.getRawValue();

    if (!formValue.fromDate || !formValue.toDate) return;

    this.isLoadingData = true;

    const request: TemporaryDriveQueryRequest = {
      fromDate: DateFieldValidationUtility.serializeDateForApi(formValue.fromDate) || '',
      toDate: DateFieldValidationUtility.serializeDateForApi(formValue.toDate) || '',
      recruiterId: (typeof formValue.recruiterId === 'object' && formValue.recruiterId)
        ? formValue.recruiterId.staffNo : undefined,
      status: formValue.status || undefined,
      sponsorId: (typeof formValue.sponsorId === 'object' && formValue.sponsorId)
        ? formValue.sponsorId.sponsorId : undefined
    };

    this.service.searchTemporaryDrives(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allData = response.data;
          this.dataSource = this.applyClientFilters(this.allData);
          this.isLoadingData = false;
          if (this.hasRetrievedData) {
            this.showEmptyState = false;
          }
          // Auto-select first row for side panel
          if (this.dataSource.length > 0) {
            this.onRowClick(this.dataSource[0]);
            setTimeout(() => {
              if (this.dataTableRef) {
                this.dataTableRef.activeRow = this.dataSource[0];
              }
            });
          }
        },
        error: () => {
          this.allData = [];
          this.dataSource = [];
          this.isLoadingData = false;
        }
      });
  }

  private applyClientFilters(data: TemporaryDrive[]): TemporaryDrive[] {
    let filtered = [...data];

    // Search by sponsor (client-side)
    const keyword = this.clientSearchKeyword?.toLowerCase();
    if (keyword) {
      filtered = filtered.filter(d =>
        d.sponsorId?.toLowerCase().includes(keyword) ||
        d.sponsorName?.toLowerCase().includes(keyword)
      );
    }

    // Filter panel: status
    if (this.appliedFilters?.status) {
      const statusCode = this.appliedFilters.status;
      filtered = filtered.filter(d => d.status === statusCode);
    }

    // Filter panel: recruiterName
    if (this.appliedFilters?.recruiterName) {
      filtered = filtered.filter(d =>
        d.recruiterName?.toLowerCase().includes(this.appliedFilters!.recruiterName!.toLowerCase())
      );
    }

    // Filter panel: sponsorName
    if (this.appliedFilters?.sponsorName) {
      filtered = filtered.filter(d =>
        d.sponsorName?.toLowerCase().includes(this.appliedFilters!.sponsorName!.toLowerCase())
      );
    }

    // Sort
    if (this.clientSort) {
      const isDesc = this.clientSort.endsWith('_desc');
      filtered.sort((a, b) => {
        const cmp = (a.tempdrId || '').localeCompare(b.tempdrId || '');
        return isDesc ? -cmp : cmp;
      });
    }

    return filtered;
  }

  private loadDetail(tempdrId: string): void {
    this.isLoadingDetail = true;
    this.selectedDriveDetail = null;

    this.service.getDetail(tempdrId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.selectedDriveDetail = response.data;
          this.isLoadingDetail = false;
        },
        error: () => {
          this.isLoadingDetail = false;
        }
      });
  }

  onDateBlur(controlName: string, inputElement: HTMLInputElement): void {
    const control = this.filterForm.get(controlName);
    const inputValue = inputElement.value?.trim();
    if (inputValue && control?.value === null) {
      control.setErrors({ invalidDateFormat: true });
      control.markAsTouched();
    }
  }

  getFromDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('fromDate'), this.filterForm.errors, 'From Date');
  }

  getToDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('toDate'), this.filterForm.errors, 'To Date',
      'To Date must be on or after From Date');
  }

  get f() {
    return this.filterForm.controls;
  }
}
