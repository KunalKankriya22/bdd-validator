import { Component, OnInit, OnDestroy, effect, ViewChild, ElementRef, Injector, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import moment, { Moment } from 'moment';

import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ApiTempDataQueryService } from './services/api-temp-data-query.service';
import {
  IdTypeOption,
  SourceIdOption,
  TemporaryIdOption,
  PermanentIdOption,
  ApiTempDataRecord,
  ApiTempDataQueryFilterRequest
} from './models/api-temp-data-query.model';
import { ApiTempDataQueryFilterPanel, ApiTempDataQueryFilterValue } from './api-temp-data-query-filter-panel/api-temp-data-query-filter-panel';
import { ApiTempDataQueryFilterChipsUtils } from './utils/filter-chips.utils';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';

function noFutureDateValidatorFactory(chapterTimezoneService: ChapterTimezoneService): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }
    const selectedDate = moment(value).startOf('day');
    const chapterDate = chapterTimezoneService.chapterLocalDate();
    const today = chapterDate && chapterDate.isValid()
      ? chapterDate.clone().startOf('day')
      : moment().startOf('day');

    if (selectedDate.isAfter(today, 'day')) {
      return { futureDate: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-api-temp-data-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
    FilterChips,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './api-temp-data-query.html',
  styleUrls: ['./api-temp-data-query.scss']
})
export class ApiTempDataQuery implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('retrieveBtn', { read: ElementRef }) retrieveBtn?: ElementRef<HTMLButtonElement>;

  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  maxToDate = computed(() => {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    return chapterDate && chapterDate.isValid()
      ? chapterDate.clone().startOf('day')
      : moment().startOf('day');
  });

  dateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const maxDate = this.maxToDate();
    if (!maxDate) return true;
    return moment(date).startOf('day').isSameOrBefore(moment(maxDate).startOf('day'), 'day');
  };

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'API Temporary DATA Query', link: null }
    ],
    title: 'API Temporary DATA Query',
    subtitle: 'Search and manage temporary and permanent donor ID records with detailed audit tracking.',
    actions: []
  };

  tableConfig: DataTableConfig<ApiTempDataRecord> = {
    columns: [
      {
        key: 'temporaryId',
        header: 'Temporary ID',
        sortable: true,
        type: 'text',
        width: '150px'
      },
      {
        key: 'permanentId',
        header: 'Permanent ID',
        sortable: false,
        type: 'text',
        width: '150px'
      },
      {
        key: 'idType',
        header: 'ID Type',
        sortable: false,
        type: 'text',
        width: '120px'
      },
      {
        key: 'temporaryAuditKey',
        header: 'Temporary Audit Key',
        sortable: false,
        type: 'text',
        width: '180px'
      },
      {
        key: 'permanentAuditKey',
        header: 'Permanent Audit Key',
        sortable: false,
        type: 'text',
        width: '180px'
      },
      {
        key: 'sourceId',
        header: 'Source ID',
        sortable: false,
        type: 'text',
        width: '120px'
      },
      {
        key: 'insertDate',
        header: 'Insert Date',
        sortable: false,
        type: 'text',
        width: '200px',
        valueFormatter: (value) => this.formatDateTime(value)
      }
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: '',
      direction: 'default'
    },
    stickyHeader: true,
    showPagination: true,
    emptyMessage: 'No records found. Please adjust your search criteria and try again.'
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Temporary ID, Permanent ID or Type',
    minLength: 0,
    ariaLabel: 'Search by Temporary ID, Permanent ID or Type',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  filterForm!: FormGroup;
  idTypes: IdTypeOption[] = [];
  sourceIds: SourceIdOption[] = [];
  temporaryIds: TemporaryIdOption[] = [];
  permanentIds: PermanentIdOption[] = [];
  periodTypes: Array<{ value: string; label: string }> = [
    { value: 'after', label: 'After' },
    { value: 'before', label: 'Before' }
  ];
  appliedFilters: ApiTempDataQueryFilterValue | null = null;
  filterChips: FilterChip[] = [];

  // Search form controls for dropdowns
  readonly temporaryIdSearchControl = new FormControl('');
  readonly permanentIdSearchControl = new FormControl('');

  // Signals for search values
  readonly temporaryIdSearch = signal('');
  readonly permanentIdSearch = signal('');

  // Signals for dropdown options
  readonly temporaryIdOptions = signal<TemporaryIdOption[]>([]);
  readonly permanentIdOptions = signal<PermanentIdOption[]>([]);

  // Filtered options based on search
  readonly filteredTemporaryIds = computed(() => {
    const search = this.temporaryIdSearch().toLowerCase();
    const options = this.temporaryIdOptions();

    if (!search) return options;
    return options.filter(option =>
      option.temporaryId?.toLowerCase().includes(search) ?? false
    );
  });

  readonly filteredPermanentIds = computed(() => {
    const search = this.permanentIdSearch().toLowerCase();
    const options = this.permanentIdOptions();

    if (!search) return options;
    return options.filter(option =>
      option.permanentId?.toLowerCase().includes(search) ?? false
    );
  });

  dataSource: ApiTempDataRecord[] = [];
  filteredDataSource: ApiTempDataRecord[] = [];
  searchText = '';
  showEmptyState = true;
  isFilterOpen = false; // Track if filter overlay is open

  // Store the original retrieve criteria to restore when filters are cleared
  hasRetrievedData = false;

  isLoadingDropdowns = false;
  isLoadingData = false;
  isExporting = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private fb: FormBuilder,
    private apiTempDataQueryService: ApiTempDataQueryService,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private overlay: Overlay,
    private injector: Injector,
    private router: Router
  ) {
    this.initializeForm();

    // Subscribe to search control changes and update signals
    this.temporaryIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.temporaryIdSearch.set(value || '');
      });

    this.permanentIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.permanentIdSearch.set(value || '');
      });

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
          subtitle: pageData.subtitle || 'Search and manage temporary and permanent donor ID records with detailed audit tracking.',
          actions: []
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadDropdowns();
  }

  ngOnDestroy(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      fromDate: [null, [noFutureDateValidatorFactory(this.chapterTimezoneService)]],
      toDate: [null, [noFutureDateValidatorFactory(this.chapterTimezoneService)]],
      idType: [''],
      temporaryId: [''],
      permanentId: [''],
      sourceId: [''],
      periodType: [''],
      insertDate: [null, [DateFieldValidationUtility.validDateValidator()]]
    }, {
      validators: DateFieldValidationUtility.crossFieldDateRangeValidator('fromDate', 'toDate')
    });

    this.setupDateValidation();
  }

  private setupDateValidation(): void {
    const fromDateControl = this.filterForm.get('fromDate');
    const toDateControl = this.filterForm.get('toDate');

    if (!fromDateControl || !toDateControl) return;

    const conditionalDateValidator = (control: AbstractControl): ValidationErrors | null => {
      const fromDate = fromDateControl?.value;
      const toDate = toDateControl?.value;
      const controlName = control === fromDateControl ? 'fromDate' : 'toDate';

      if (fromDateControl?.hasError('matDatepickerParse') ||
          fromDateControl?.hasError('invalidDate') ||
          toDateControl?.hasError('matDatepickerParse') ||
          toDateControl?.hasError('invalidDate')) {
        return null;
      }

      if (!fromDate && !toDate) return null;

      if (controlName === 'fromDate' && fromDate && !toDate) return null;
      if (controlName === 'toDate' && toDate && !fromDate) return null;

      if (controlName === 'fromDate' && !fromDate && toDate) {
        return { conditionallyRequired: true };
      }
      if (controlName === 'toDate' && !toDate && fromDate) {
        return { conditionallyRequired: true };
      }

      return null;
    };

    fromDateControl.addValidators(conditionalDateValidator);
    toDateControl.addValidators(conditionalDateValidator);

    fromDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value && !toDateControl.value) {
          toDateControl.markAsTouched();
        }
        toDateControl.updateValueAndValidity({ emitEvent: false });
      });

    toDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value && !fromDateControl.value) {
          fromDateControl.markAsTouched();
        }
        fromDateControl.updateValueAndValidity({ emitEvent: false });
      });
  }

  private loadDropdowns(): void {
    this.isLoadingDropdowns = true;

    this.apiTempDataQueryService.getIdTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.idTypes = result;
          this.isLoadingDropdowns = false;
        },
        error: (error) => {
          console.error('Error loading dropdowns:', error);
          this.isLoadingDropdowns = false;
        }
      });
  }

  onIdTypeChange(selectedIdType: string): void {
    // Clear dependent selections since the available options will change
    this.filterForm.patchValue({ temporaryId: '', permanentId: '' });

    // If no ID type selected, clear the dropdowns
    if (!selectedIdType) {
      this.temporaryIds = [];
      this.permanentIds = [];
      this.temporaryIdOptions.set([]);
      this.permanentIdOptions.set([]);
      return;
    }

    // Fetch temporary and permanent IDs filtered by selected ID type
    forkJoin({
      temporaryIds: this.apiTempDataQueryService.getTemporaryIds(selectedIdType),
      permanentIds: this.apiTempDataQueryService.getPermanentIds(selectedIdType)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.temporaryIds = result.temporaryIds;
          this.permanentIds = result.permanentIds;
          this.temporaryIdOptions.set(result.temporaryIds);
          this.permanentIdOptions.set(result.permanentIds);
        },
        error: (error) => {
          console.error('Error reloading filtered IDs:', error);
        }
      });
  }


  get isSearchDisabled(): boolean {
    if (this.hasMutualExclusivityError) return true;

    const fromDateControl = this.filterForm.get('fromDate');
    const toDateControl = this.filterForm.get('toDate');

    const fromDate = fromDateControl?.value;
    const toDate = toDateControl?.value;

    // If neither date is provided, search is enabled
    const neitherDateProvided = !fromDate && !toDate;

    // If both dates are provided, check they are valid
    const bothDatesProvided = fromDate && toDate;
    const datesAreValid = !fromDateControl?.hasError('invalidDate') &&
                          !toDateControl?.hasError('invalidDate') &&
                          !fromDateControl?.hasError('matDatepickerParse') &&
                          !toDateControl?.hasError('matDatepickerParse') &&
                          !fromDateControl?.hasError('futureDate') &&
                          !toDateControl?.hasError('futureDate') &&
                          !fromDateControl?.hasError('conditionallyRequired') &&
                          !toDateControl?.hasError('conditionallyRequired') &&
                          !this.filterForm?.hasError('dateRangeInvalid');

    // If only one date is provided, it's invalid (conditional requirement)
    const onlyOneProvided = (fromDate && !toDate) || (!fromDate && toDate);
    if (onlyOneProvided) {
      return true; // Disable search
    }

    // If neither date provided, search is enabled
    if (neitherDateProvided) {
      return false;
    }

    // If both dates provided, check validity
    if (bothDatesProvided) {
      return !datesAreValid;
    }

    // If dates are invalid, disable search
    return !datesAreValid;
  }

  get hasAnyFieldValue(): boolean {
    const v = this.filterForm.value;
    return !!(v.fromDate || v.toDate || v.idType || v.temporaryId || v.permanentId);
  }

  get hasMutualExclusivityError(): boolean {
    const v = this.filterForm.value;
    return !!(v.idType && v.temporaryId && v.permanentId);
  }

  removeFilterChip(chipKey: string): void {
    this.appliedFilters = ApiTempDataQueryFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = ApiTempDataQueryFilterChipsUtils.convertFiltersToChips(
      this.appliedFilters,
      this.idTypes,
      this.sourceIds
    );

    // Clear only the specific filter field that was removed
    // Note: We don't clear idType here as it may be set from the main card
    switch (chipKey) {
      case 'sourceId':
        this.filterForm.patchValue({ sourceId: '' });
        break;
      case 'insertDate':
        this.filterForm.patchValue({ periodType: '', insertDate: null });
        break;
      case 'idType':
        // Only clear if there's no remaining filter for idType
        if (!this.appliedFilters?.idType) {
          this.filterForm.patchValue({ idType: '' });
        }
        break;
    }

    // Reset to first page when removing filters
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    // Reload data with main search criteria (from top card) + remaining filters
    this.loadApiTempData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    // Clear only filter-panel-exclusive fields (NOT idType as it's also in main card)
    this.filterForm.patchValue({
      sourceId: '',
      periodType: '',
      insertDate: null
    });

    // Reset to first page
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    // Reload data with main search criteria (from top card) only
    this.loadApiTempData();
  }

  hasActiveFilters(): boolean {
    return ApiTempDataQueryFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    // Ensure tableCard is initialized
    if (!this.tableCard) {
      console.error('[ApiTempDataQuery] tableCard ViewChild is not initialized');
      return;
    }

    // Load source IDs first if not already loaded, then create overlay
    if (this.sourceIds.length === 0) {
      this.apiTempDataQueryService.getSourceIds()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (sourceIds) => {
            this.sourceIds = sourceIds;
            // Create overlay after source IDs are loaded
            this.createFilterOverlay();
          },
          error: (error) => {
            console.error('Error loading source IDs:', error);
            // Create overlay anyway with empty source IDs
            this.createFilterOverlay();
          }
        });
    } else {
      // Source IDs already loaded, create overlay immediately
      this.createFilterOverlay();
    }
  }

  private createFilterOverlay(): void {
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
      scrollStrategy: this.overlay.scrollStrategies.block(),
      panelClass: 'filter-overlay-panel'
    });

    const portal = new ComponentPortal(ApiTempDataQueryFilterPanel, null, this.injector);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.idTypes = this.idTypes;
    componentRef.instance.sourceIds = this.sourceIds;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });
  }

  applyFilters(filters: ApiTempDataQueryFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = ApiTempDataQueryFilterChipsUtils.convertFiltersToChips(
      filters,
      this.idTypes,
      this.sourceIds
    );

    // Update form with filter values - ONLY update filter-panel-specific fields
    // Do NOT update idType if the filter value is empty, as it might be set from main card
    const patchValue: any = {
      sourceId: filters.sourceId || '',
      periodType: filters.periodType || '',
      insertDate: filters.insertDate || null
    };

    // Only update idType if it has a value from the filter panel
    if (filters.idType) {
      patchValue.idType = filters.idType;
    }

    this.filterForm.patchValue(patchValue);

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.showEmptyState = false;
    this.hasRetrievedData = true; // Applying filters also means we have data context
    this.loadApiTempData();
  }

  // Called from inline RETRIEVE button - no filter chips
  onSearch(): void {
    // Mark all fields as touched to show validation errors
    this.filterForm.markAllAsTouched();

    // Don't proceed if form is invalid
    if (this.filterForm.invalid) {
      return;
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.showEmptyState = false;
    this.hasRetrievedData = true; // Mark that data has been retrieved
    this.loadApiTempData();
  }

  onExport(): void {
    this.isExporting = true;

    const formValue = this.filterForm.value;
    const sortDirection = this.tableConfig.sortConfig?.direction;
    const sortParam = sortDirection === 'default' ? undefined :
                      sortDirection === 'A' ? 'ASC' :
                      sortDirection === 'D' ? 'DESC' : undefined;

    // Build filters combining main search criteria + filter panel filters
    const filters: ApiTempDataQueryFilterRequest = {
      // Main search criteria (from top card)
      fromDate: formValue.fromDate ? this.formatDate(formValue.fromDate) : undefined,
      toDate: formValue.toDate ? this.formatDate(formValue.toDate) : undefined,
      temporaryId: formValue.temporaryId || undefined,
      permanentId: formValue.permanentId || undefined,

      // Filter panel filters
      idType: formValue.idType || undefined,
      sourceId: formValue.sourceId || undefined,

      // Search text - handle audit key search
      searchItem: this.searchText?.trim() || undefined,

      // Sort
      SortDirection: sortParam
    };

    // If search text is numeric, treat it as an audit key search
    const searchTextTrimmed = this.searchText?.trim();
    if (searchTextTrimmed && !isNaN(Number(searchTextTrimmed))) {
      const auditKeyValue = Number(searchTextTrimmed);
      filters.temporaryAuditKey = auditKeyValue;
    }

    // Handle insert date with period type - add as separate parameters
    if (formValue.insertDate && formValue.periodType) {
      filters.period = formValue.periodType;
      filters.insertDate = this.formatDate(formValue.insertDate);
    }

    // Remove undefined fields
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof ApiTempDataQueryFilterRequest] === undefined) {
        delete filters[key as keyof ApiTempDataQueryFilterRequest];
      }
    });

    this.apiTempDataQueryService.exportApiTempData(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.downloadCsvFile(blob);
          this.isExporting = false;
          this.showSuccess('Data exported successfully');
        },
        error: (error) => {
          console.error('Error exporting API temporary data:', error);
          this.isExporting = false;
          // Error handling is now done by HTTP interceptor
        }
      });
  }

  private downloadCsvFile(blob: Blob): void {
    const filename = this.generateCsvFilename();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private generateCsvFilename(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `ApiTempData_${year}${month}${day}_${hours}${minutes}${seconds}.csv`;
  }

  onReset(): void {
    this.filterForm.reset({
      fromDate: null,
      toDate: null,
      idType: '',
      temporaryId: '',
      permanentId: '',
      sourceId: '',
      periodType: '',
      insertDate: null
    });
    this.appliedFilters = null;
    this.filterChips = [];
    this.dataSource = [];
    this.filteredDataSource = [];
    this.searchText = '';
    this.showEmptyState = true;
    this.hasRetrievedData = false; // Reset retrieved data flag
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.totalRecords = 0;
      this.tableConfig.pagination.pageIndex = 0;
    }
    // Reload unfiltered temporary/permanent ID dropdowns
    this.onIdTypeChange('');
  }

  onDonorDetails(): void {
    const route = ROUTE_REGISTRY[RouteKey.DonorDetailQuery]?.path;
    if (route) {
      this.router.navigate([route]);
    }
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageSize = event.pageSize;
      this.tableConfig.pagination.pageIndex = event.pageIndex;
    }
    this.loadApiTempData();
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadApiTempData();
  }

  onSearchChange(searchText: string): void {
    this.searchText = searchText;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    // If search is cleared (empty), automatically reload the initial data
    if (this.hasRetrievedData && !this.searchText.trim()) {
      this.loadApiTempData();
    }
    // If search text is present, it will only trigger on Enter key (searchOnEnterOnly: true)
    // and the search-bar component will call this method again
    else if (this.hasRetrievedData && this.searchText.trim()) {
      this.loadApiTempData();
    }
  }

  private loadApiTempData(): void {
    // Check if we have required date criteria
    const formValue = this.filterForm.value;
    const hasRequiredDates = formValue.fromDate && formValue.toDate;

    // If required dates are missing and no data retrieved yet, don't make API call
    if (!hasRequiredDates && !this.hasRetrievedData) {
      return;
    }

    this.isLoadingData = true;

    const pageSize = this.tableConfig.pagination?.pageSize || 25;
    const pageIndex = this.tableConfig.pagination?.pageIndex || 0;
    const skip = pageIndex * pageSize;
    const take = pageSize;

    const sortDirection = this.tableConfig.sortConfig?.direction;
    const sortParam = sortDirection === 'default' ? undefined :
                      sortDirection === 'A' ? 'ASC' :
                      sortDirection === 'D' ? 'DESC' : undefined;

    // Build filters combining main search criteria + filter panel filters
    const filters: ApiTempDataQueryFilterRequest = {
      // Main search criteria (from top card)
      fromDate: formValue.fromDate ? this.formatDate(formValue.fromDate) : undefined,
      toDate: formValue.toDate ? this.formatDate(formValue.toDate) : undefined,
      temporaryId: formValue.temporaryId || undefined,
      permanentId: formValue.permanentId || undefined,

      // Filter panel filters
      idType: formValue.idType || undefined,
      sourceId: formValue.sourceId || undefined,

      // Search text - handle audit key search
      searchItem: this.searchText?.trim() || undefined,

      // Sort
      SortDirection: sortParam
    };

    // If search text is numeric, treat it as an audit key search
    const searchTextTrimmed = this.searchText?.trim();
    if (searchTextTrimmed && !isNaN(Number(searchTextTrimmed))) {
      const auditKeyValue = Number(searchTextTrimmed);
      filters.temporaryAuditKey = auditKeyValue;
    }

    // Handle insert date with period type - add as separate parameters
    if (formValue.insertDate && formValue.periodType) {
      filters.period = formValue.periodType;
      filters.insertDate = this.formatDate(formValue.insertDate);
    }

    // Remove undefined fields
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof ApiTempDataQueryFilterRequest] === undefined) {
        delete filters[key as keyof ApiTempDataQueryFilterRequest];
      }
    });

    this.apiTempDataQueryService.queryApiTempData(take, skip, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.filteredDataSource = response.data;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.total;
          }
          this.isLoadingData = false;
          // Keep showEmptyState as false if we have retrieved data
          if (this.hasRetrievedData) {
            this.showEmptyState = false;
          }
        },
        error: (error) => {
          console.error('Error loading API temporary data:', error);
          // Clear data on error
          this.dataSource = [];
          this.filteredDataSource = [];
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = 0;
          }
          this.isLoadingData = false;
          // Error handling is now done by HTTP interceptor
        }
      });
  }

  private formatDate(date: any): string {
    if (!date) return '';
    if (date._isAMomentObject) {
      return date.format('YYYY-MM-DD');
    }
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  }

  onDateInput(controlName: string, inputElement: HTMLInputElement): void {
    const control = this.filterForm.get(controlName);
    const inputValue = inputElement.value?.trim();
    control?.markAsTouched();
    if (inputValue && control?.value === null) {
      control.setErrors({ invalidDateFormat: true });
    }
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
    if (!control || !control.touched) return '';
    if (control.hasError('futureDate')) return 'Future dates are not allowed';
    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate') || control.hasError('matDatepickerParse')) return 'From Date is invalid';
    if (control.hasError('conditionallyRequired')) return 'From Date is required when To Date is provided';
    return '';
  }

  getToDateError(): string {
    const control = this.filterForm.get('toDate');
    if (!control || !control.touched) return '';
    if (control.hasError('futureDate')) return 'Future dates are not allowed';
    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate') || control.hasError('matDatepickerParse')) return 'To Date is invalid';
    if (control.hasError('conditionallyRequired')) return 'To Date is required when From Date is provided';
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = control.value;
    if (fromDate && toDate && this.filterForm.hasError('dateRangeInvalid')) return 'To Date cannot be before From Date';
    return '';
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }


  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    try {
      return moment(dateString).format('DD-MMM-YYYY').toUpperCase();
    } catch {
      return dateString;
    }
  }

}
