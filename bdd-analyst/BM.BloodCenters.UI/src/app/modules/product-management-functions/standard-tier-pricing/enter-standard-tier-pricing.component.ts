import { Component, OnInit, OnDestroy, ViewChild, effect, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { StandardTierPricingApiService } from './services/standard-tier-pricing-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';

import {
  StandardTierPricingDto,
  ProductTypeDto,
  StandardTierPricingFilter,
  StandardTierPricingQueryDto
} from './models/standard-tier-pricing.model';
import { EnterStandardTierPricingFilterPanel } from './filter-panel/filter-panel';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
  RowAction,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';

import { AddEditStandardTierPricingPanel } from './add-edit-standard-tier-pricing/add-edit-standard-tier-pricing';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';

/**
 * Enter Standard Tier Pricing Component
 *
 * Manages tier-level pricing for blood products based on days to expiration.
 * Different from customer-specific pricing - this defines the standard/default pricing.
 *
 * Features:
 * - Product selection with life span and standard price display
 * - Paginated data table with tier pricing records
 * - Add/Edit tier pricing via side drawer
 * - Filter by tier, fromDay, toDay, searchKeyword
 * - Cascade updates: changing standard tier day ranges updates customer pricing
 *
 * JIRA: MLT-14079
 */
@Component({
  selector: 'app-enter-standard-tier-pricing',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    AddEditStandardTierPricingPanel,
    FilterChips
  ],
  templateUrl: './enter-standard-tier-pricing.component.html',
  styleUrls: ['./enter-standard-tier-pricing.component.scss']
})
export class EnterStandardTierPricingComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  readonly componentId = `enter-standard-tier-pricing-${EnterStandardTierPricingComponent.nextId++}`;
  readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild(FormGroupDirective) private formDirective!: FormGroupDirective;

  private service = inject(StandardTierPricingApiService);
  private fb = inject(FormBuilder);
  private loggingService = inject(LoggingService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);
  private pageHeaderService = inject(PageHeaderService);
  private overlay = inject(Overlay);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: '',
    actions: []
  };

  tableConfig: DataTableConfig<StandardTierPricingDto> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: { column: 'tier', direction: 'default' },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No tier pricing records found',
    loadingMessage: 'Loading tier pricing...',
    showPagination: true
  };

  // Search card form
  searchCardForm!: FormGroup;
  productTypeSearchCtrl = new FormControl<string>('');

  readonly productTypeOptions = signal<ProductTypeDto[]>([]);

  private readonly selectedProductTypeId = signal<string | null>(null);
  private readonly productTypeSearch = signal('');

  readonly filteredProductTypeOptions = computed(() => {
    const search = this.productTypeSearch().toLowerCase();
    const options = this.productTypeOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.productType ?? '').toLowerCase().includes(search) ||
      (o.productTypeDesc ?? '').toLowerCase().includes(search)
    );
  });

  readonly selectedProductTypeDisplay = computed(() => {
    const id = this.selectedProductTypeId();
    if (!id) return '';
    const pt = this.productTypeOptions().find(p => p.productType === id);
    if (!pt) return id;
    return pt.productTypeDesc ? `${pt.productType} - ${pt.productTypeDesc}` : pt.productType;
  });

  readonly selectedLifeSpan = computed(() => {
    const id = this.selectedProductTypeId();
    if (!id) return '-';
    const pt = this.productTypeOptions().find(p => p.productType === id);
    if (!pt || pt.lifeSpan == null) return '-';
    return `${pt.lifeSpan} ${pt.lifeSpanInd === 'DY' ? 'Days' : pt.lifeSpanInd === 'HR' ? 'Hours' : pt.lifeSpanInd === 'YR' ? 'Years' : pt.lifeSpanInd}`;
  });

  readonly selectedLifeSpanValue = computed(() => {
    const id = this.selectedProductTypeId();
    if (!id) return null;
    const pt = this.productTypeOptions().find(p => p.productType === id);
    return (pt && pt.lifeSpan != null) ? pt.lifeSpan : null;
  });

  readonly selectedStandardPrice = computed(() => {
    const id = this.selectedProductTypeId();
    if (!id) return '-';
    const pt = this.productTypeOptions().find(p => p.productType === id);
    if (!pt || pt.stdPrice == null) return '-';
    return pt.stdPrice.toFixed(2);
  });

  isLoadingProductTypes = false;
  isProductTypeTruncated = false;

  dataSource: StandardTierPricingDto[] = [];

  isLoading = false;
  hasError = false;
  errorMessage = '';
  hasRetrievedData = false;

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: StandardTierPricingDto | null = null;
  private previousActiveElement: HTMLElement | null = null;

  isFilterOpen = signal(false);
  currentFilters = signal<StandardTierPricingFilter>({});
  filterChips = signal<FilterChip[]>([]);
  private filterOverlayRef: OverlayRef | null = null;

  get hasActiveFilters(): boolean {
    return this.filterChips().length > 0;
  }


  private destroy$ = new Subject<void>();

  constructor() {
    this.searchCardForm = this.fb.group({
      productType: [null, Validators.required]
    });

    this.initializeTableConfig();

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
    this.loadProducts();
    this.subscribeToSearchCardChanges();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isClearAllDisabled(): boolean {
    return !this.searchCardForm.get('productType')?.value &&
      !this.hasRetrievedData;
  }

  private subscribeToSearchCardChanges(): void {
    this.productTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.productTypeSearch.set(value || ''));

    this.searchCardForm.get('productType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((productTypeId: string | null) => {
        this.selectedProductTypeId.set(productTypeId);
        if (productTypeId) {
          this.hasRetrievedData = true;
          this.updatePagination({ pageIndex: 0 });
          this.loadData();
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAllSearch();
        this.loadProducts();
      });
  }

  private loadProducts(): void {
    this.isLoadingProductTypes = true;
    this.searchCardForm.get('productType')?.disable({ emitEvent: false });
    this.service.getActiveProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.productTypeOptions.set(products);
          this.isLoadingProductTypes = false;
          this.searchCardForm.get('productType')?.enable({ emitEvent: false });
        },
        error: (error) => {
          this.productTypeOptions.set([]);
          this.isLoadingProductTypes = false;
          this.searchCardForm.get('productType')?.enable({ emitEvent: false });
          this.loggingService.error('Failed to load products', error);
        }
      });
  }

  onClearAllSearch(): void {
    if (this.formDirective) {
      this.formDirective.resetForm({ productType: null });
    }
    this.selectedProductTypeId.set(null);
    this.productTypeSearchCtrl.setValue('', { emitEvent: false });
    this.productTypeSearch.set('');
    this.isProductTypeTruncated = false;

    this.hasRetrievedData = false;
    this.dataSource = [];
    this.currentFilters.set({});
    this.filterChips.set([]);
    this.hasError = false;
    this.closeSidePanel();
    this.closeFilterPanel();
  }

  checkProductTypeTruncation(el: HTMLElement): void {
    this.isProductTypeTruncated = el.scrollWidth > el.clientWidth;
  }

  private initializeTableConfig(): void {
    const columns: TableColumn<StandardTierPricingDto>[] = [
      { key: 'tier', header: 'Tier', sortable: true, width: '80px', valueFormatter: (v: number) => v != null ? String(v) : '--' },
      { key: 'fromDay', header: 'Minimum Days to Expiration', sortable: false, width: '180px', valueFormatter: (v: number) => v != null ? String(v) : '--' },
      { key: 'toDay', header: 'Maximum Days till Expiration', sortable: false, width: '200px', valueFormatter: (v: number) => v != null ? String(v) : '--' },
      {
        key: 'lifespan',
        header: 'Lifespan',
        sortable: false,
        width: '120px',
        valueFormatter: () => this.selectedLifeSpan()
      },
      {
        key: 'unitPrice',
        header: 'Unit Price',
        sortable: false,
        width: '120px',
        valueFormatter: (v: number) => v != null ? `$${v.toFixed(2)}` : '--'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        width: '150px',
        valueFormatter: (v: string) => this.formatDate(v)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        width: '160px',
        valueFormatter: (v: string) => this.formatDate(v)
      }
    ];

    const rowActions: RowAction<StandardTierPricingDto>[] = [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit tier pricing',
        ariaLabel: 'Edit tier {{tier}}',
        color: 'default',
        action: 'edit'
      }
    ];

    this.tableConfig = {
      ...this.tableConfig,
      columns,
      rowActions
    };
  }

  private formatDate(value: string | null): string {
    if (!value) return '--';
    const datePart = value.substring(0, 10);
    const [year, month, day] = datePart.split('-');
    if (!year || !month || !day) return value;
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex < 0 || monthIndex > 11) return value;
    return `${day}-${months[monthIndex]}-${year}`;
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const productType = this.searchCardForm.get('productType')?.value;
    if (!productType) {
      this.isLoading = false;
      return;
    }

    const take = this.tableConfig.pagination?.pageSize || 10;
    const skip = (this.tableConfig.pagination?.pageIndex || 0) * take;

    const filters = this.currentFilters();
    const queryDto: StandardTierPricingQueryDto = {
      productType,
      unitPriceComparison: filters.unitPriceComparison || null,
      unitPrice: filters.unitPrice || null,
      effectiveDatePeriod: filters.effectiveDatePeriod || null,
      effectiveDate: filters.effectiveDate || null,
      terminationDatePeriod: filters.terminationDatePeriod || null,
      terminationDate: filters.terminationDate || null,
      sortColumn: 'Tier',
      sortOrder: this.tableConfig.sortConfig?.direction === 'A' ? 'ASC' : this.tableConfig.sortConfig?.direction === 'D' ? 'DESC' : 'ASC'
    };

    this.service.searchTiers(take, skip, queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: response.totalCount
            }
          };
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage = error.message || 'Failed to load tier pricing. Please try again.';
          this.loggingService.error('Failed to load standard tier pricing', error);
        }
      });
  }

  openFilterPanel(event: MouseEvent): void {
    if (this.isFilterOpen()) {
      this.closeFilterPanel();
      return;
    }

    const anchor = event.currentTarget as HTMLElement;
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(anchor)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 }
      ])
      .withPush(true);

    this.filterOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    const portal = new ComponentPortal(EnterStandardTierPricingFilterPanel);
    const componentRef = this.filterOverlayRef.attach(portal);

    componentRef.instance.currentFilters.set(this.currentFilters());

    componentRef.instance.apply.subscribe((filters: StandardTierPricingFilter) => {
      this.currentFilters.set(filters);
      this.filterChips.set(this.buildFilterChips(filters));
      this.updatePagination({ pageIndex: 0 });
      this.loadData();
      this.closeFilterPanel();
    });

    componentRef.instance.cancel.subscribe(() => {
      this.closeFilterPanel();
    });

    this.filterOverlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilterPanel());

    this.isFilterOpen.set(true);
  }

  closeFilterPanel(): void {
    if (this.filterOverlayRef) {
      this.filterOverlayRef.dispose();
      this.filterOverlayRef = null;
    }
    this.isFilterOpen.set(false);
  }

  onPageChange(event: TablePageEvent): void {
    this.updatePagination({ pageSize: event.pageSize, pageIndex: event.pageIndex });
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    const currentDirection = this.tableConfig.sortConfig?.direction;
    let nextDirection: 'A' | 'D' | 'default';
    if (currentDirection === 'default') {
      nextDirection = 'A';
    } else if (currentDirection === 'A') {
      nextDirection = 'D';
    } else {
      nextDirection = 'default';
    }
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: nextDirection },
      pagination: { ...this.tableConfig.pagination!, pageIndex: 0 }
    };
    this.loadData();
  }

  private updatePagination(changes: Partial<typeof this.tableConfig.pagination>): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: { ...this.tableConfig.pagination!, ...changes }
    };
  }

  onRowAction(event: TableRowActionEvent<StandardTierPricingDto>): void {
    if (event.action === 'edit') {
      this.openEditSidePanel(event.row);
    }
  }

  openAddSidePanel(): void {
    if (!this.searchCardForm.get('productType')?.value) {
      this.snackbarService.showError('Please select a product type first.');
      return;
    }
    this.previousActiveElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    this.focusPanelTitle();
  }

  openEditSidePanel(tier: StandardTierPricingDto): void {
    this.previousActiveElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'edit';
    this.sidePanelData = tier;
    this.sidePanelOpen = true;
    this.focusPanelTitle();
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }
  }

  private focusPanelTitle(): void {
    setTimeout(() => {
      const panelTitle = document.getElementById('side-panel-title');
      if (panelTitle) {
        panelTitle.setAttribute('tabindex', '-1');
        panelTitle.focus();
      }
    });
  }

  onSidePanelSave(): void {
    this.closeSidePanel();
    this.loadData();
    this.snackbarService.showSuccess('Tier details have been saved.');
  }

  onSidePanelCancel(): void {
    this.closeSidePanel();
  }

  private buildFilterChips(filters: StandardTierPricingFilter): FilterChip[] {
    const chips: FilterChip[] = [];
    if (filters.unitPriceComparison && filters.unitPrice) {
      const symbol = filters.unitPriceComparison === 'below' ? '≤' : '≥';
      chips.push({ key: 'unitPrice', label: `Unit Price ${symbol} $${filters.unitPrice}`, value: filters.unitPrice, removable: true });
    }
    if (filters.effectiveDatePeriod && filters.effectiveDate) {
      const symbol = filters.effectiveDatePeriod === 'after' ? '≥' : '≤';
      chips.push({ key: 'effectiveDate', label: `Effective Date ${symbol} ${filters.effectiveDate}`, value: filters.effectiveDate, removable: true });
    }
    if (filters.terminationDatePeriod && filters.terminationDate) {
      const symbol = filters.terminationDatePeriod === 'after' ? '≥' : '≤';
      chips.push({ key: 'terminationDate', label: `Termination Date ${symbol} ${filters.terminationDate}`, value: filters.terminationDate, removable: true });
    }
    return chips;
  }

  removeFilterChip(chipKey: string): void {
    const current = { ...this.currentFilters() };
    if (chipKey === 'unitPrice') {
      current.unitPriceComparison = null;
      current.unitPrice = null;
    } else if (chipKey === 'effectiveDate') {
      current.effectiveDatePeriod = null;
      current.effectiveDate = null;
    } else if (chipKey === 'terminationDate') {
      current.terminationDatePeriod = null;
      current.terminationDate = null;
    }
    this.currentFilters.set(current);
    this.filterChips.set(this.buildFilterChips(current));
    this.updatePagination({ pageIndex: 0 });
    this.loadData();
  }

  clearAllFilters(): void {
    this.currentFilters.set({});
    this.filterChips.set([]);
    this.updatePagination({ pageIndex: 0 });
    this.loadData();
  }
}
