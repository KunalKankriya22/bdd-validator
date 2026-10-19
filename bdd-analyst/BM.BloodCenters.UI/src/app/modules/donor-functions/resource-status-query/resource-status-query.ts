import { Component, OnInit, OnDestroy, ViewChild, ElementRef, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject, takeUntil, debounceTime, switchMap, of, EMPTY, startWith, map } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import * as moment from 'moment';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { UppercaseMomentDateAdapter, DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import { ResourceStatusQueryService } from './services/resource-status-query.service';
import {
  ResourceStatRecord,
  ResourceOption,
  ResourceStatusQueryFilterValue,
  ResourceStatusQueryFilterRequest
} from './models/resource-status-query.model';
import { ResourceStatusQueryFilterPanel } from './resource-status-query-filter-panel/resource-status-query-filter-panel';
import { ResourceStatusQueryFilterChipsUtils } from './utils/filter-chips.utils';

/**
 * Resource Status Query Component
 * Allows users to query resource availability across date ranges
 * Based on FMB: MRQEXRES
 */
@Component({
  selector: 'app-resource-status-query',
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
  templateUrl: './resource-status-query.html',
  styleUrls: ['./resource-status-query.scss']
})
export class ResourceStatusQuery implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly resourceStatusQueryService = inject(ResourceStatusQueryService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly overlay = inject(Overlay);
  private readonly snackbarService = inject(SnackbarService);

  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: ''
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Resource or Description',
    minLength: 3,
    ariaLabel: 'Search resource availability data',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<ResourceStatRecord> = {
    columns: [
      {
        key: 'driveDate',
        header: 'Date and Day',
        sortable: true,
        type: 'text',
        minWidth: '170px',
        valueFormatter: (value: string) => DateFieldValidationUtility.formatDateWithDay(value)
      },
      {
        key: 'resourceCode',
        header: 'Resource',
        sortable: false,
        type: 'text',
        minWidth: '90px'
      },
      {
        key: 'resourceDesc',
        header: 'Resource Description',
        sortable: false,
        type: 'text',
        minWidth: '150px'
      },
      {
        key: 'maximumRes',
        header: 'Level',
        sortable: false,
        type: 'number',
        minWidth: '70px'
      },
      {
        key: 'exceptionRes',
        header: 'Actual',
        sortable: false,
        type: 'number',
        minWidth: '70px'
      },
      {
        key: 'bookedRes',
        header: 'Booked',
        sortable: false,
        type: 'number',
        minWidth: '70px'
      },
      {
        key: 'availRes',
        header: 'Remain',
        sortable: false,
        type: 'number',
        minWidth: '70px'
      },
      {
        key: 'criticalInd',
        header: 'Critical',
        sortable: false,
        type: 'text',
        minWidth: '70px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : value === 'N' ? 'No' : '--'
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
      column: 'driveDate',
      direction: 'default'
    },
    stickyHeader: true,
    showPagination: true,
    emptyMessage: 'No resource availability records found',
    loadingMessage: 'Loading resource data...'
  };

  filterForm!: FormGroup;
  resourceOptions: ResourceOption[] = [];
  appliedFilters: ResourceStatusQueryFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: ResourceStatRecord[] = [];
  requestState: ResourceStatusQueryFilterRequest = {} as ResourceStatusQueryFilterRequest;
  showEmptyState = true;
  hasRetrievedData = false;

  isLoadingResources = false;
  filteredResources$!: Observable<ResourceOption[]>;
  isLoadingData = false;
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private dateChange$ = new Subject<void>();

  constructor() {
    this.initializeForm();

    // Update header config from menu-items API response
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
    // No data loaded initially - user must select dates and click Retrieve
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
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required],
      resourceCode: [{ value: null, disabled: true }]
    });

    // Normalize resourceCode: empty string → null immediately, clear errors on valid selection
    this.filterForm.get('resourceCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const control = this.filterForm.get('resourceCode');
        if (typeof value === 'string' && value.trim() === '') {
          control?.setValue(null, { emitEvent: false });
          control?.setErrors(null);
        } else if (typeof value === 'object' && value) {
          control?.setErrors(null);
        }
      });

    // Watch date changes — debounce to avoid rapid-fire API calls
    this.filterForm.get('fromDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.dateChange$.next());

    this.filterForm.get('toDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.dateChange$.next());

    // Debounce date changes and use switchMap to cancel in-flight requests
    this.dateChange$.pipe(
      debounceTime(400),
      switchMap(() => {
        this.onDatesChanged();
        return EMPTY;
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  private onDatesChanged(): void {
    // Clear current resource selection when dates change
    this.filterForm.get('resourceCode')?.setValue(null, { emitEvent: false });
    this.resourceOptions = [];
    this.loadResourcesIfDatesValid();
  }

  get isResourceDropdownEnabled(): boolean {
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    if (!fromDate || !toDate) return false;
    return moment.isMoment(fromDate)
      ? fromDate.isSameOrBefore(toDate, 'day')
      : fromDate <= toDate;
  }

  private loadResourcesIfDatesValid(): void {
    const resourceControl = this.filterForm.get('resourceCode');
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;

    const datesValid = fromDate && toDate && (
      moment.isMoment(fromDate)
        ? fromDate.isSameOrBefore(toDate, 'day')
        : fromDate <= toDate
    );

    if (datesValid) {
      resourceControl?.enable({ emitEvent: false });
      this.loadResources();
    } else {
      resourceControl?.disable({ emitEvent: false });
      this.resourceOptions = [];
    }
  }

  private loadResources(): void {
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;

    if (!fromDate || !toDate) {
      return;
    }

    const startDateStr = DateFieldValidationUtility.serializeDateForApi(fromDate) || '';
    const endDateStr = DateFieldValidationUtility.serializeDateForApi(toDate) || '';

    this.isLoadingResources = true;
    this.resourceStatusQueryService.getResources(startDateStr, endDateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.resourceOptions = response.data;
          this.isLoadingResources = false;
          this.setupResourceFilter();
        },
        error: () => {
          this.resourceOptions = [];
          this.isLoadingResources = false;
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
    // Resource must be null, empty string, or a selected object — not a partial typed string
    const resourceValue = this.filterForm.get('resourceCode')?.value;
    if (typeof resourceValue === 'string' && resourceValue.trim().length > 0) return true;
    return false;
  }

  onRetrieve(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.showEmptyState = false;
    this.hasRetrievedData = true;
    this.loadData();
  }

  onSearch(searchText: string): void {
    this.requestState.searchKeyword = searchText || undefined;

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

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    // Map DataTable sort event to API format: "column_asc" / "column_desc"
    const directionMap: Record<string, string> = { 'A': '_asc', 'D': '_desc' };

    this.requestState.sort =
      event.direction === 'default' ? undefined : `${event.column}${directionMap[event.direction]}`;

    this.loadData();
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    if (!this.tableCard) {
      // tableCard ViewChild not yet initialized
      return;
    }

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

    const portal = new ComponentPortal(ResourceStatusQueryFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

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

  applyFilters(filters: ResourceStatusQueryFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = ResourceStatusQueryFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      criticalInd: filters.criticalInd || undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    if (this.hasRetrievedData) {
      this.loadData();
    }
  }

  removeFilterChip(chipKey: string): void {
    this.appliedFilters = ResourceStatusQueryFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = ResourceStatusQueryFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    if (this.hasRetrievedData) {
      this.loadData();
    }
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { criticalInd, ...rest } = this.requestState;
    this.requestState = rest as ResourceStatusQueryFilterRequest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    if (this.hasRetrievedData) {
      this.loadData();
    }
  }

  hasActiveFilters(): boolean {
    return ResourceStatusQueryFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { criticalInd, ...rest } = this.requestState;
      this.requestState = rest as ResourceStatusQueryFilterRequest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      criticalInd: this.appliedFilters.criticalInd || undefined
    };
  }

  private loadData(): void {
    const formValue = this.filterForm.getRawValue();

    if (!formValue.fromDate || !formValue.toDate) {
      return;
    }

    this.isLoadingData = true;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    const filters: ResourceStatusQueryFilterRequest = {
      startDate: DateFieldValidationUtility.serializeDateForApi(formValue.fromDate) || '',
      endDate: DateFieldValidationUtility.serializeDateForApi(formValue.toDate) || '',
      resourceCode: (typeof formValue.resourceCode === 'object' && formValue.resourceCode)
        ? formValue.resourceCode.resourceCode
        : undefined,
      searchKeyword: this.requestState.searchKeyword || undefined,
      sort: this.requestState.sort || undefined,
      criticalInd: this.requestState.criticalInd || undefined
    };

    this.resourceStatusQueryService.searchResourceStatus(take, skip, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.totalRecords;
          }
          this.isLoadingData = false;
          if (this.hasRetrievedData) {
            this.showEmptyState = false;
          }
          if (response.message) {
            this.snackbarService.showSuccess(response.message);
          }
        },
        error: () => {
          this.dataSource = [];
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = 0;
          }
          this.isLoadingData = false;
        }
      });
  }

  private setupResourceFilter(): void {
    const control = this.filterForm.get('resourceCode');
    if (!control) return;
    this.filteredResources$ = control.valueChanges.pipe(
      startWith(control.value || ''),
      map(value => {
        const filterText = typeof value === 'string' ? value : value?.resourceCode || '';
        return this.filterResources(filterText);
      })
    );
  }

  private filterResources(text: string): ResourceOption[] {
    if (!text) return this.resourceOptions;
    const lower = text.toLowerCase();
    return this.resourceOptions.filter(r =>
      r.resourceCode.toLowerCase().includes(lower) ||
      r.resourceDesc.toLowerCase().includes(lower)
    );
  }

  displayResource = (resource: ResourceOption | null): string => {
    return resource ? `${resource.resourceCode} - ${resource.resourceDesc}` : '';
  };

  onResourceSelected(): void {
    const control = this.filterForm.get('resourceCode');
    if (control) {
      control.setErrors(null);
    }
  }

  onResourceEnter(event: Event): void {
    event.preventDefault();
    this.onResourceBlur();
    (event.target as HTMLElement).blur();
  }

  onResourceBlur(): void {
    const control = this.filterForm.get('resourceCode');
    if (!control) return;
    const value = control.value;
    if (typeof value === 'string' && value.trim().length > 0) {
      // User typed something but didn't select from dropdown — show error
      control.setErrors({ invalidResource: true });
      control.markAsTouched();
    } else if (typeof value === 'string') {
      // Empty string — clear to null (valid state)
      control.setValue(null);
      control.setErrors(null);
    }
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
