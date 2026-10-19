import { Component, OnInit, OnDestroy, ViewChild, ElementRef, effect, untracked, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableColumn } from '@shared/interfaces/data-table.interface';
import { FilterChip, FilterChips } from '@shared/components/filter-chips/filter-chips';

import { CustomerProductTierPricingApiService } from './services/customer-product-tier-pricing-api.service';
import {
  CustomerProductSummaryDto,
  CustomerProductTierPricingDto,
  CustomerProductTierPricingQueryDto,
  TierPricingFilterValue,
  type CustomerFilterOption,
  type ProductTypeFilterOption,
} from './models/customer-product-tier-pricing.model';
import { TierPricingFilterPanel } from './filter-panel/tier-pricing-filter-panel';
import { TierPricingFilterChipsUtils } from './utils/filter-chips.utils';

@Component({
  selector: 'app-customer-product-tier-pricing-query',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    TierPricingFilterPanel,
    FilterChips
  ],
  templateUrl: './customer-product-tier-pricing-query.html',
  styleUrls: ['./customer-product-tier-pricing-query.scss']
})
export class CustomerProductTierPricingQueryComponent implements OnInit, OnDestroy {
  @ViewChild('masterTableCard', { read: ElementRef }) masterTableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterButton', { read: ElementRef }) filterButtonRef!: ElementRef<HTMLButtonElement>;

  // Signal-based state
  readonly masterData = signal<CustomerProductSummaryDto[]>([]);
  readonly tierData = signal<CustomerProductTierPricingDto[]>([]);
  readonly loading = signal<boolean>(false);
  readonly tierLoading = signal<boolean>(false);
  readonly selectedRow = signal<CustomerProductSummaryDto | null>(null);
  readonly filters = signal<TierPricingFilterValue | null>(null);
  readonly searchTerm = signal<string>('');

  // Computed signals
  readonly hasMasterData = computed(() => this.masterData().length > 0);
  readonly hasTierData = computed(() => this.tierData().length > 0);
  readonly hasSelectedRow = computed(() => this.selectedRow() !== null);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search By Customer ID Or Product Type',
    minLength: 2,
    ariaLabel: 'Search customer product pricing',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  masterTableConfig: DataTableConfig<CustomerProductSummaryDto> = {
    columns: [],
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
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true,
    enableRowHighlight: true
  };

  tierTableConfig: DataTableConfig<CustomerProductTierPricingDto> = {
    columns: [],
    sortConfig: {
      column: 'tier',
      direction: 'A'
    },
    stickyHeader: true,
    emptyMessage: 'Select a customer-product to view tier details',
    loadingMessage: 'Loading tier details...',
    showPagination: false
  };

  // Filter panel state
  filterPanelOpen = false;
  private overlayRef: OverlayRef | null = null;

  // Filter chips
  filterChips: FilterChip[] = [];

  // Filter dropdown options (enriched with display names)
  customerOptions: CustomerFilterOption[] = [];
  productTypeOptions: ProductTypeFilterOption[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private service: CustomerProductTierPricingApiService,
    private headerService: HeaderService,
    private pageHeaderService: PageHeaderService,
    private snackbarService: SnackbarService,
    private overlay: Overlay
  ) {
    this.initializeConfigurations();

    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        untracked(() => {
          this.headerConfig = {
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: pageData.title, link: null }
            ],
            title: pageData.title,
            subtitle: pageData.subtitle || '',
            actions: []
          };
        });
      }
    });

    // Watch for chapterId to become available before loading data
    effect(() => {
      const chapterId = this.headerService.chapterId();
      if (chapterId) {
        untracked(() => {
          // Reset pagination, filters, and chips on chapter change so filter
          // options are refreshed for the new chapter's data
          if (this.masterTableConfig.pagination) {
            this.masterTableConfig.pagination.pageIndex = 0;
          }
          this.filters.set(null);
          this.filterChips = [];
          this.loadMasterData();
        });
      }
    });
  }

  ngOnInit(): void {
    // Data will be loaded by effect once chapterId is available
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private initializeConfigurations(): void {
    this.masterTableConfig = {
      columns: this.getMasterTableColumns(),
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
      emptyMessage: 'No customer product pricing records available to display',
      loadingMessage: 'Loading customer product pricing data...',
      showPagination: true,
      enableRowHighlight: true
    };

    this.tierTableConfig = {
      columns: this.getTierTableColumns(),
      sortConfig: {
        column: 'tier',
        direction: 'A'
      },
      stickyHeader: true,
      emptyMessage: 'Select a customer-product to view tier details',
      loadingMessage: 'Loading tier details...',
      showPagination: false
    };
  }

  private getMasterTableColumns(): TableColumn<CustomerProductSummaryDto>[] {
    return [
      {
        key: 'customerId',
        header: 'Customer ID',
        width: 'auto',
        sortable: false
      },
      {
        key: 'shortName',
        header: 'Customer Name',
        width: 'auto',
        sortable: false
      },
      {
        key: 'productTypeDesc',
        header: 'Product Type',
        width: 'auto',
        sortable: false,
        valueFormatter: (value, row) => value || row.productType
      },
      {
        key: 'lifespan',
        header: 'Lifespan',
        width: 'auto',
        sortable: false,
        valueFormatter: (value, row) => this.formatLifespan(row)
      },
      {
        key: 'stdPrice',
        header: 'Unit Price',
        width: 'auto',
        sortable: false,
        valueFormatter: (value) => this.formatCurrency(value)
      }
    ];
  }

  private getTierTableColumns(): TableColumn<CustomerProductTierPricingDto>[] {
    return [
      {
        key: 'tier',
        header: 'Tier',
        width: '50px',
        sortable: false
      },
      {
        key: 'fromDay',
        header: 'Minimum Age',
        width: '110px',
        sortable: false,
        valueFormatter: (value, row) => this.formatAge(row.fromDay, row.lifespanInd)
      },
      {
        key: 'toDay',
        header: 'Maximum Age',
        width: '110px',
        sortable: false,
        valueFormatter: (value, row) => this.formatAge(row.toDay, row.lifespanInd)
      },
      {
        key: 'unitPrice',
        header: 'Price',
        width: '80px',
        sortable: false,
        valueFormatter: (value) => this.formatCurrency(value)
      }
    ];
  }

  private formatLifespan(row: CustomerProductSummaryDto): string {
    if (row.lifespan === null || row.lifespan === undefined) return '-';
    const unit = row.lifespanInd || '';
    return `${row.lifespan} ${unit}`;
  }

  private formatAge(value: number | null | undefined, unit: string | null | undefined): string {
    if (value === null || value === undefined) return '-';
    const unitLabel = unit || 'Days';
    return `${value} ${unitLabel}`;
  }

  private formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return `$${value.toFixed(2)}`;
  }

  loadMasterData(): void {
    this.loading.set(true);

    const filters = this.filters();
    const pagination = this.masterTableConfig.pagination;
    const pageIndex = pagination?.pageIndex ?? 0;
    const pageSize = pagination?.pageSize ?? 25;

    const query: CustomerProductTierPricingQueryDto = {
      customerId: filters?.customerId || null,
      productType: filters?.productType || null,
      sortOrder: 'ASC',
      skip: pageIndex * pageSize,
      take: pageSize
    };

    this.service
      .getCustomerProductSummaries(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let filteredData = response.data;

          // Apply client-side search filter
          const search = this.searchTerm().toLowerCase();
          if (search) {
            filteredData = filteredData.filter(row =>
              row.customerId.toLowerCase().includes(search) ||
              row.shortName?.toLowerCase().includes(search) ||
              row.productType.toLowerCase().includes(search)
            );
          }

          this.masterData.set(filteredData);
          if (this.masterTableConfig.pagination) {
            this.masterTableConfig.pagination.totalRecords = search
              ? filteredData.length
              : response.total;
          }

          // Reset tier details if selected row is no longer in filtered results
          const currentSelection = this.selectedRow();
          if (currentSelection) {
            const stillExists = filteredData.some(
              row => row.customerId === currentSelection.customerId &&
                     row.productType === currentSelection.productType
            );
            if (!stillExists) {
              this.selectedRow.set(null);
              this.tierData.set([]);
            }
          }

          // Extract filter options from unfiltered response (filters cleared on chapter change)
          if (!filters) {
            const seenCustomers = new Map<string, string>();
            const seenProductTypes = new Map<string, string | null>();
            response.data.forEach(r => {
              if (!seenCustomers.has(r.customerId)) seenCustomers.set(r.customerId, r.shortName ?? '');
              if (!seenProductTypes.has(r.productType)) seenProductTypes.set(r.productType, r.productTypeDesc ?? null);
            });
            this.customerOptions = Array.from(seenCustomers.entries())
              .map(([id, name]) => ({ id, name }))
              .sort((a, b) => a.id.localeCompare(b.id));
            this.productTypeOptions = Array.from(seenProductTypes.entries())
              .map(([code, desc]) => ({ code, desc }))
              .sort((a, b) => a.code.localeCompare(b.code));
          }

          this.loading.set(false);
        },
        error: (error) => {
          this.masterData.set([]);
          if (this.masterTableConfig.pagination) {
            this.masterTableConfig.pagination.totalRecords = 0;
          }
          this.loading.set(false);
          this.snackbarService.showError('Failed to load customer product pricing data. Please try again.');
        }
      });
  }

  onSearch(searchText: string): void {
    this.searchTerm.set(searchText);
    if (this.masterTableConfig.pagination) {
      this.masterTableConfig.pagination.pageIndex = 0;
    }
    this.loadMasterData();
  }

  onRowClick(row: CustomerProductSummaryDto): void {
    this.selectedRow.set(row);
    this.loadTierDetails(row.customerId, row.productType);
  }

  private loadTierDetails(customerId: string, productType: string): void {
    this.tierLoading.set(true);

    this.service
      .getTiersByCustomerAndProduct(customerId, productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tiers) => {
          this.tierData.set(tiers);
          this.tierLoading.set(false);
        },
        error: (error) => {
          this.tierData.set([]);
          this.tierLoading.set(false);
          this.snackbarService.showError('Failed to load tier details. Please try again.');
        }
      });
  }

  openFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.filterPanelOpen = false;
      return;
    }

    this.filterPanelOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.masterTableCard)
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
      width: '320px'
    });

    const portal = new ComponentPortal(TierPricingFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.filters();
    componentRef.instance.customerOptions = this.customerOptions;
    componentRef.instance.productTypeOptions = this.productTypeOptions;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.onFilterApply(filters);
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });
  }

  closeFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.filterPanelOpen = false;
    this.filterButtonRef?.nativeElement?.focus();
  }

  onFilterApply(filterValue: TierPricingFilterValue): void {
    this.filters.set(filterValue);
    this.filterChips = TierPricingFilterChipsUtils.convertFiltersToChips(filterValue);
    this.closeFilterPanel();

    // Reset pagination and reload data
    if (this.masterTableConfig.pagination) {
      this.masterTableConfig.pagination.pageIndex = 0;
    }

    this.loadMasterData();
  }

  hasActiveFilters(): boolean {
    return TierPricingFilterChipsUtils.hasActiveFilters(this.filters());
  }

  onRemoveFilterChip(chipKey: string): void {
    const updatedFilters = TierPricingFilterChipsUtils.removeFilterByChipKey(this.filters(), chipKey);
    this.filters.set(updatedFilters);
    this.filterChips = TierPricingFilterChipsUtils.convertFiltersToChips(updatedFilters);

    if (this.masterTableConfig.pagination) {
      this.masterTableConfig.pagination.pageIndex = 0;
    }

    this.loadMasterData();
  }

  onClearAllFilters(): void {
    this.filters.set(null);
    this.filterChips = [];

    if (this.masterTableConfig.pagination) {
      this.masterTableConfig.pagination.pageIndex = 0;
    }

    this.loadMasterData();
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    if (this.masterTableConfig.pagination) {
      this.masterTableConfig.pagination.pageIndex = event.pageIndex;
      this.masterTableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadMasterData();
  }
}
