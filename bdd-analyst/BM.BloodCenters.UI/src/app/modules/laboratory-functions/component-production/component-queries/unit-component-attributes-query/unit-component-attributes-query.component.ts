import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, effect, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { formatTableDateTime } from '@shared/utils/date-format.util';

import { UnitComponentAttributesApiService } from './services/unit-component-attributes-api.service';
import {
  UnitAttributeDto,
  ComponentAttributeDto,
  ProductCodeLovDto,
  ApiResponse,
  CpqQueryAttributesResponseDto,
  UnitAttributesFilterOptionsDto,
  ComponentAttributesFilterOptionsDto,
} from './models/unit-component-attributes.interface';
import { UnitAttributesFilterValue, ComponentAttributesFilterValue } from './models/unit-component-attributes-filter.model';
import { UnitComponentAttributesFilterPanel } from './unit-component-attributes-filter-panel/unit-component-attributes-filter-panel';
import { ComponentAttributesFilterPanel } from './component-attributes-filter-panel/component-attributes-filter-panel';
import { UnitAttributesFilterChipsUtils, ComponentAttributesFilterChipsUtils } from './utils/filter-chips.utils';

@Component({
  selector: 'app-unit-component-attributes-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
    FilterChips,
    UnitIdFieldComponent,
  ],
  templateUrl: './unit-component-attributes-query.component.html',
  styleUrl: './unit-component-attributes-query.component.scss',
})
export class UnitComponentAttributesQueryComponent implements OnInit, OnDestroy {
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('unitFilterBtn', { read: ElementRef }) unitFilterBtn!: ElementRef;
  @ViewChild('compFilterBtn', { read: ElementRef }) compFilterBtn!: ElementRef;

  private readonly apiService = inject(UnitComponentAttributesApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly overlay = inject(Overlay);
  private readonly destroy$ = new Subject<void>();

  private currentUnitId = '';
  private currentCollDate = '';
  private currentCodeScheme = '';
  private overlayRef: OverlayRef | null = null;
  private compOverlayRef: OverlayRef | null = null;
  private currentUnitSearchText = '';
  private currentCompSearchText = '';

  appliedUnitFilters: UnitAttributesFilterValue | null = null;
  unitFilterChips: FilterChip[] = [];
  isUnitFilterOpen = false;

  appliedCompFilters: ComponentAttributesFilterValue | null = null;
  compFilterChips: FilterChip[] = [];
  isCompFilterOpen = false;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  constructor() {
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
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  unitSearchConfig: SearchBarConfig = {
    placeholder: 'Search by Attribute Code',
    minLength: 2,
    ariaLabel: 'Search by Attribute Code',
    alwaysShowTooltip: false,
    searchOnEnterOnly: true,
  };

  componentSearchConfig: SearchBarConfig = {
    placeholder: 'Search by Product Code',
    minLength: 2,
    ariaLabel: 'Search by Product Code',
    alwaysShowTooltip: false,
    searchOnEnterOnly: true,
  };

  componentIdControl = new FormControl('');
  componentSearchCtrl = new FormControl('');
  componentOptions = signal<ProductCodeLovDto[]>([]);
  selectedDescription = '';

  private readonly componentSearch = signal('');

  readonly filteredComponentOptions = computed(() => {
    const search = this.componentSearch();
    const options = this.componentOptions();
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter(option => {
      const code = (option.productCode || '').toLowerCase();
      const desc = (option.productDesc || '').toLowerCase();
      return code.includes(lower) || desc.includes(lower);
    });
  });

  selectedTabIndex = 0;

  readonly isLoading = signal(false);
  readonly hasResults = signal(false);

  readonly filteredUnitAttributes = signal<UnitAttributeDto[]>([]);
  readonly filteredComponentAttributes = signal<ComponentAttributeDto[]>([]);

  readonly unitAttributesMessage = signal('');
  readonly compAttributesMessage = signal('');

  // Filter options for dropdowns
  unitFilterOptions: UnitAttributesFilterOptionsDto | null = null;
  componentFilterOptions: ComponentAttributesFilterOptionsDto | null = null;

  unitAttributesTableConfig: DataTableConfig<UnitAttributeDto> = {
    columns: [
      {
        key: 'attribCode',
        header: 'Attribute Code',
        sortable: true,
        width: '15%'
      },
      {
        key: 'attribDesc',
        header: 'Description',
        sortable: false,
        width: '30%'
      },
      {
        key: 'attribGroup',
        header: 'Group',
        sortable: false,
        width: '15%'
      },
      {
        key: 'attribType',
        header: 'Attribute Type',
        sortable: false,
        width: '15%',
        valueFormatter: (value) => value || '--'
      },
      {
        key: 'insertDate',
        header: 'Insert Date',
        sortable: false,
        width: '15%',
        valueFormatter: (value) => formatTableDateTime(value)
      },
      {
        key: 'insertUserId',
        header: 'User',
        sortable: false,
        width: '10%'
      }
    ],
    showPagination: true,
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100]
    },
    sortConfig: { column: '', direction: 'default' as const },
    stickyHeader: true
  };

  componentAttributesTableConfig: DataTableConfig<ComponentAttributeDto> = {
    columns: [
      {
        key: 'productCode',
        header: 'Product Code',
        sortable: true,
        width: '12%'
      },
      {
        key: 'attribCode',
        header: 'Attribute Code',
        sortable: false,
        width: '12%'
      },
      {
        key: 'attribDesc',
        header: 'Description',
        sortable: false,
        width: '25%'
      },
      {
        key: 'attribGroup',
        header: 'Group',
        sortable: false,
        width: '12%'
      },
      {
        key: 'insertDate',
        header: 'Insert Date',
        sortable: false,
        width: '13%',
        valueFormatter: (value) => formatTableDateTime(value)
      },
      {
        key: 'procDate',
        header: 'Process Date',
        sortable: false,
        width: '13%',
        valueFormatter: (value) => value ? formatTableDateTime(value) : '--'
      },
      {
        key: 'insertUserId',
        header: 'User',
        sortable: false,
        width: '13%'
      }
    ],
    showPagination: true,
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100]
    },
    sortConfig: { column: '', direction: 'default' as const },
    stickyHeader: true
  };

  ngOnInit(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearResults();
        this.unitIdField?.clear();
      });

    this.componentSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.componentSearch.set(v || ''));
  }

  ngOnDestroy(): void {
    this.closeUnitFilterPanel();
    this.closeCompFilterPanel();
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUnitValidated(data: UnitValidationResponse): void {
    const unitId = data.parsedUnitId;
    if (!unitId) return;

    this.isLoading.set(true);
    this.componentIdControl.setValue('');
    this.selectedDescription = '';
    this.componentOptions.set([]);

    this.apiService.validateUnit(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const validationData = response.data;
            this.currentUnitId = validationData.unitId;
            this.currentCollDate = validationData.collectionDate || '';
            this.currentCodeScheme = validationData.codeScheme || data.codeScheme;

            if (!this.currentCollDate) {
              this.isLoading.set(false);
              this.snackbarService.showError('Collection date not found for this unit.');
              return;
            }

            this.fetchAttributes();
          } else {
            this.isLoading.set(false);
            this.clearResults();
            this.snackbarService.showError(response.message || 'Unit validation failed.');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.clearResults();
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while validating the unit')
          );
        }
      });
  }

  onUnitCleared(): void {
    this.clearResults();
  }

  onComponentSelectOpenedChange(opened: boolean): void {
    if (opened) {
      this.componentSearchCtrl.setValue('');
    }
  }

  onComponentIdChange(): void {
    const selectedProductCode = this.componentIdControl.value;

    const found = this.componentOptions().find(o => o.productCode === selectedProductCode);
    const fullDesc = found?.productDesc || '';

    // Truncate description at pipe character if present
    this.selectedDescription = fullDesc.includes('|')
      ? fullDesc.split('|')[0].trim()
      : fullDesc;

    // Reset to first page when product code changes
    this.componentAttributesTableConfig = {
      ...this.componentAttributesTableConfig,
      pagination: {
        ...this.componentAttributesTableConfig.pagination!,
        pageIndex: 0,
      },
    };

    // Reload data with selected product code (API handles filtering)
    this.loadComponentAttributesData();
  }

  onUnitTableSearch(searchText: string): void {
    this.currentUnitSearchText = searchText;
    // Reset to first page when searching
    this.unitAttributesTableConfig = {
      ...this.unitAttributesTableConfig,
      pagination: {
        ...this.unitAttributesTableConfig.pagination!,
        pageIndex: 0,
      },
    };
    this.loadUnitAttributesData();
  }

  openUnitFilter(): void {
    if (this.overlayRef) {
      this.closeUnitFilterPanel();
      return;
    }

    this.isUnitFilterOpen = true;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.unitFilterBtn)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 4,
        },
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    const portal = new ComponentPortal(UnitComponentAttributesFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedUnitFilters;
    componentRef.instance.filterOptions = this.unitFilterOptions;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyUnitFilters(filters);
        this.closeUnitFilterPanel();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeUnitFilterPanel();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeUnitFilterPanel();
      });
  }

  hasActiveUnitFilters(): boolean {
    return UnitAttributesFilterChipsUtils.hasActiveFilters(this.appliedUnitFilters);
  }

  onRemoveUnitFilterChip(chipKey: string): void {
    if (!this.appliedUnitFilters) return;
    this.appliedUnitFilters = UnitAttributesFilterChipsUtils.removeFilterByChipKey(
      this.appliedUnitFilters, chipKey
    );
    this.unitFilterChips = UnitAttributesFilterChipsUtils.convertFiltersToChips(this.appliedUnitFilters);
    if (!this.hasActiveUnitFilters()) {
      this.appliedUnitFilters = null;
      this.unitFilterChips = [];
    }
    // Reset to first page when filter changes
    this.unitAttributesTableConfig = {
      ...this.unitAttributesTableConfig,
      pagination: {
        ...this.unitAttributesTableConfig.pagination!,
        pageIndex: 0,
      },
    };
    this.loadUnitAttributesData();
  }

  clearAllUnitFilters(): void {
    this.appliedUnitFilters = null;
    this.unitFilterChips = [];
    // Reset to first page when clearing filters
    this.unitAttributesTableConfig = {
      ...this.unitAttributesTableConfig,
      pagination: {
        ...this.unitAttributesTableConfig.pagination!,
        pageIndex: 0,
      },
    };
    this.loadUnitAttributesData();
  }

  private applyUnitFilters(filters: UnitAttributesFilterValue): void {
    this.appliedUnitFilters = filters;
    this.unitFilterChips = UnitAttributesFilterChipsUtils.convertFiltersToChips(filters);
    // Reset to first page when applying filters
    this.unitAttributesTableConfig = {
      ...this.unitAttributesTableConfig,
      pagination: {
        ...this.unitAttributesTableConfig.pagination!,
        pageIndex: 0,
      },
    };
    this.loadUnitAttributesData();
  }

  private closeUnitFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isUnitFilterOpen = false;
  }

  private applyCompFilters(filters: ComponentAttributesFilterValue): void {
    this.appliedCompFilters = filters;
    this.compFilterChips = ComponentAttributesFilterChipsUtils.convertFiltersToChips(filters);
    // Reset to first page when applying filters
    this.componentAttributesTableConfig = {
      ...this.componentAttributesTableConfig,
      pagination: {
        ...this.componentAttributesTableConfig.pagination!,
        pageIndex: 0,
      },
    };
    this.loadComponentAttributesData();
  }

  private closeCompFilterPanel(): void {
    if (this.compOverlayRef) {
      this.compOverlayRef.dispose();
      this.compOverlayRef = null;
    }
    this.isCompFilterOpen = false;
  }


  onComponentTableSearch(searchText: string): void {
    this.currentCompSearchText = searchText;
    // Reset to first page when searching
    this.componentAttributesTableConfig = {
      ...this.componentAttributesTableConfig,
      pagination: {
        ...this.componentAttributesTableConfig.pagination!,
        pageIndex: 0,
      },
    };
    this.loadComponentAttributesData();
  }

  openCompFilter(): void {
    if (this.compOverlayRef) {
      this.closeCompFilterPanel();
      return;
    }

    this.isCompFilterOpen = true;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.compFilterBtn)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 4,
        },
      ])
      .withPush(true);

    this.compOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    const portal = new ComponentPortal(ComponentAttributesFilterPanel);
    const componentRef = this.compOverlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedCompFilters;
    componentRef.instance.filterOptions = this.componentFilterOptions;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyCompFilters(filters);
        this.closeCompFilterPanel();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeCompFilterPanel();
      });

    this.compOverlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeCompFilterPanel();
      });
  }

  hasActiveCompFilters(): boolean {
    return ComponentAttributesFilterChipsUtils.hasActiveFilters(this.appliedCompFilters);
  }

  onRemoveCompFilterChip(chipKey: string): void {
    if (!this.appliedCompFilters) return;
    this.appliedCompFilters = ComponentAttributesFilterChipsUtils.removeFilterByChipKey(
      this.appliedCompFilters, chipKey
    );
    this.compFilterChips = ComponentAttributesFilterChipsUtils.convertFiltersToChips(this.appliedCompFilters);
    if (!this.hasActiveCompFilters()) {
      this.appliedCompFilters = null;
      this.compFilterChips = [];
    }
    // Reset to first page when filter changes
    this.componentAttributesTableConfig = {
      ...this.componentAttributesTableConfig,
      pagination: {
        ...this.componentAttributesTableConfig.pagination!,
        pageIndex: 0,
      },
    };
    this.loadComponentAttributesData();
  }

  clearAllCompFilters(): void {
    this.appliedCompFilters = null;
    this.compFilterChips = [];
    // Reset to first page when clearing filters
    this.componentAttributesTableConfig = {
      ...this.componentAttributesTableConfig,
      pagination: {
        ...this.componentAttributesTableConfig.pagination!,
        pageIndex: 0,
      },
    };
    this.loadComponentAttributesData();
  }

  onUnitTablePageChange(event: TablePageEvent): void {
    this.unitAttributesTableConfig = {
      ...this.unitAttributesTableConfig,
      pagination: {
        ...this.unitAttributesTableConfig.pagination!,
        pageIndex: event.pageIndex,
        pageSize: event.pageSize,
      },
    };
    this.loadUnitAttributesData();
  }

  onUnitTableSortChange(event: TableSortEvent): void {
    this.unitAttributesTableConfig = {
      ...this.unitAttributesTableConfig,
      sortConfig: { column: event.column, direction: event.direction },
      pagination: {
        ...this.unitAttributesTableConfig.pagination!,
        pageIndex: 0,
      },
    };
    this.loadUnitAttributesData();
  }

  onComponentTablePageChange(event: TablePageEvent): void {
    this.componentAttributesTableConfig = {
      ...this.componentAttributesTableConfig,
      pagination: {
        ...this.componentAttributesTableConfig.pagination!,
        pageIndex: event.pageIndex,
        pageSize: event.pageSize,
      },
    };
    this.loadComponentAttributesData();
  }

  onComponentTableSortChange(event: TableSortEvent): void {
    this.componentAttributesTableConfig = {
      ...this.componentAttributesTableConfig,
      sortConfig: { column: event.column, direction: event.direction },
      pagination: {
        ...this.componentAttributesTableConfig.pagination!,
        pageIndex: 0,
      },
    };
    this.loadComponentAttributesData();
  }


  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    this.loadActiveTabData();
  }

  private loadActiveTabData(): void {
    if (this.selectedTabIndex === 0) {
      this.loadUnitAttributesData();
    } else {
      this.loadComponentAttributesData();
    }
  }

  private fetchAttributes(): void {
    // Load filter options and product codes first, then load grid data
    forkJoin({
      productCodes: this.apiService.getProductCodes(
        this.currentUnitId,
        this.currentCollDate,
        this.currentCodeScheme,
      ).pipe(
        catchError(() => of({ success: false, statusCode: 500, message: 'Failed to load product codes' } as ApiResponse<ProductCodeLovDto[]>))
      ),
      unitFilterOptions: this.apiService.getUnitAttributesFilterOptions(
        this.currentUnitId,
        this.currentCollDate,
        this.currentCodeScheme
      ).pipe(
        catchError(() => of({ success: false, statusCode: 500, message: 'Failed to load unit filter options' } as ApiResponse<UnitAttributesFilterOptionsDto>))
      ),
      componentFilterOptions: this.apiService.getComponentAttributesFilterOptions(
        this.currentUnitId,
        this.currentCollDate,
        this.currentCodeScheme
      ).pipe(
        catchError(() => of({ success: false, statusCode: 500, message: 'Failed to load component filter options' } as ApiResponse<ComponentAttributesFilterOptionsDto>))
      ),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ productCodes, unitFilterOptions, componentFilterOptions }) => {
          this.handleProductCodesResponse(productCodes);
          this.handleUnitFilterOptionsResponse(unitFilterOptions);
          this.handleComponentFilterOptionsResponse(componentFilterOptions);

          // Load grid data for the active tab only
          this.hasResults.set(true);
          this.loadActiveTabData();
        },
        error: (error) => {
          this.isLoading.set(false);
          this.clearAttributeState();
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while retrieving attributes')
          );
        }
      });
  }

  /**
   * Load unit attributes data with server-side pagination, sorting, filtering, searching
   */
  private loadUnitAttributesData(): void {
    const pageSize = this.unitAttributesTableConfig.pagination?.pageSize || 25;
    const pageIndex = this.unitAttributesTableConfig.pagination?.pageIndex || 0;
    const skip = pageIndex * pageSize;

    const sortConfig = this.unitAttributesTableConfig.sortConfig;
    const sortColumn = sortConfig?.column === 'attribCode' ? 'AttribCode' : null;
    const sortOrder = sortConfig?.direction === 'A' ? 'ASC' : sortConfig?.direction === 'D' ? 'DESC' : null;

    const queryDto = {
      unitId: this.currentUnitId,
      collDate: this.currentCollDate,
      codeScheme: this.currentCodeScheme,
      attribCode: this.appliedUnitFilters?.attribCode || null,
      attribGroup: this.appliedUnitFilters?.attribGroup || null,
      insertUserId: this.appliedUnitFilters?.insertUserId || null,
      searchKeyword: this.currentUnitSearchText || null,
      sortColumn: sortColumn,
      sortOrder: sortOrder,
    };

    this.apiService.getUnitAttributesPaginated(pageSize, skip, queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success && response.data) {
            this.filteredUnitAttributes.set(response.data);
            this.unitAttributesTableConfig = {
              ...this.unitAttributesTableConfig,
              pagination: {
                ...this.unitAttributesTableConfig.pagination!,
                totalRecords: response.total || 0,
              },
            };

            if ((response.total || 0) === 0 && response.message) {
              this.unitAttributesMessage.set(response.message);
            } else {
              this.unitAttributesMessage.set('');
            }
          } else {
            this.filteredUnitAttributes.set([]);
            this.unitAttributesTableConfig = {
              ...this.unitAttributesTableConfig,
              pagination: {
                ...this.unitAttributesTableConfig.pagination!,
                totalRecords: 0,
              },
            };
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.filteredUnitAttributes.set([]);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while loading unit attributes')
          );
        }
      });
  }

  /**
   * Load component attributes data with server-side pagination, sorting, filtering, searching
   */
  private loadComponentAttributesData(): void {
    const pageSize = this.componentAttributesTableConfig.pagination?.pageSize || 25;
    const pageIndex = this.componentAttributesTableConfig.pagination?.pageIndex || 0;
    const skip = pageIndex * pageSize;

    const sortConfig = this.componentAttributesTableConfig.sortConfig;
    const sortColumn = sortConfig?.column === 'productCode' ? 'ProductCode' : null;
    const sortOrder = sortConfig?.direction === 'A' ? 'ASC' : sortConfig?.direction === 'D' ? 'DESC' : null;

    const queryDto = {
      unitId: this.currentUnitId,
      collDate: this.currentCollDate,
      codeScheme: this.currentCodeScheme,
      productCode: this.componentIdControl.value || this.appliedCompFilters?.productCode || null,
      attribCode: this.appliedCompFilters?.attribCode || null,
      insertUserId: this.appliedCompFilters?.insertUserId || null,
      searchKeyword: this.currentCompSearchText || null,
      sortColumn: sortColumn,
      sortOrder: sortOrder,
    };

    this.apiService.getComponentAttributesPaginated(pageSize, skip, queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success && response.data) {
            this.filteredComponentAttributes.set(response.data);
            this.componentAttributesTableConfig = {
              ...this.componentAttributesTableConfig,
              pagination: {
                ...this.componentAttributesTableConfig.pagination!,
                totalRecords: response.total || 0,
              },
            };

            if ((response.total || 0) === 0 && response.message) {
              this.compAttributesMessage.set(response.message);
            } else {
              this.compAttributesMessage.set('');
            }
          } else {
            this.filteredComponentAttributes.set([]);
            this.componentAttributesTableConfig = {
              ...this.componentAttributesTableConfig,
              pagination: {
                ...this.componentAttributesTableConfig.pagination!,
                totalRecords: 0,
              },
            };
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.filteredComponentAttributes.set([]);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while loading component attributes')
          );
        }
      });
  }


  private handleProductCodesResponse(response: ApiResponse<ProductCodeLovDto[]>): void {
    if (response.success && response.data) {
      this.componentOptions.set(response.data);
    } else {
      this.componentOptions.set([]);
    }
  }

  private handleUnitFilterOptionsResponse(response: ApiResponse<UnitAttributesFilterOptionsDto>): void {
    if (response.success && response.data) {
      this.unitFilterOptions = response.data;
    } else {
      this.unitFilterOptions = null;
    }
  }

  private handleComponentFilterOptionsResponse(response: ApiResponse<ComponentAttributesFilterOptionsDto>): void {
    if (response.success && response.data) {
      this.componentFilterOptions = response.data;
    } else {
      this.componentFilterOptions = null;
    }
  }


  private clearAttributeState(): void {
    this.filteredUnitAttributes.set([]);
    this.filteredComponentAttributes.set([]);
    this.unitAttributesMessage.set('');
    this.compAttributesMessage.set('');
    this.componentOptions.set([]);
    this.componentIdControl.setValue('');
    this.selectedDescription = '';
    this.hasResults.set(false);
  }

  private clearResults(): void {
    this.currentUnitId = '';
    this.currentCollDate = '';
    this.currentCodeScheme = '';
    this.selectedTabIndex = 0;
    this.clearAttributeState();
  }
}
