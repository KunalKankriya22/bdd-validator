import { Component, OnInit, OnDestroy, ViewChild, ElementRef, effect, inject, signal, computed } from '@angular/core';
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

import { EnterCustomerTierPricingApiService } from './services/enter-customer-tier-pricing-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';

import {
  CustomerTierPricingDto,
  CustomerLOV,
  ProductTypeLOV,
  CustomerTierPricingFilter,
  CustomerTierPricingFilterRequest
} from './models/enter-customer-tier-pricing.model';
import { EnterCustomerTierPricingFilterPanel } from './enter-customer-tier-pricing-filter-panel/enter-customer-tier-pricing-filter-panel';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
  RowAction,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';

import { AddEditCustomerTierPricingPanel } from './add-edit-customer-tier-pricing/add-edit-customer-tier-pricing';

@Component({
  selector: 'app-enter-customer-tier-pricing',
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
    AddEditCustomerTierPricingPanel,
    FilterChips,
    LoadingSpinnerComponent,
  ],
  templateUrl: './enter-customer-tier-pricing.component.html',
  styleUrls: ['./enter-customer-tier-pricing.component.scss']
})
export class EnterCustomerTierPricingComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  readonly componentId = `enter-customer-tier-pricing-${EnterCustomerTierPricingComponent.nextId++}`;
  readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild(FormGroupDirective) private formDirective!: FormGroupDirective;
  @ViewChild('filterButton', { read: ElementRef }) private filterButtonRef!: ElementRef<HTMLElement>;
  private sidePanelTrigger: HTMLElement | null = null;

  private service = inject(EnterCustomerTierPricingApiService);
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

  tableConfig: DataTableConfig<CustomerTierPricingDto> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
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
    showPagination: false
  };

  // Search card form
  searchCardForm!: FormGroup;
  customerSearchCtrl = new FormControl<string>('');
  productTypeSearchCtrl = new FormControl<string>('');

  readonly customerOptions = signal<CustomerLOV[]>([]);
  readonly productTypeOptions = signal<ProductTypeLOV[]>([]);

  readonly selectedCustomerId = signal<string | null>(null);
  readonly selectedProductTypeId = signal<string | null>(null);

  readonly customerIdDisplayValue = computed(() => this.selectedCustomerId() || '');
  private readonly customerSearch = signal('');
  private readonly productTypeSearch = signal('');

  readonly filteredCustomerOptions = computed(() => {
    const search = this.customerSearch().toLowerCase();
    const options = this.customerOptions();
    if (!search) return options;
    return options.filter(o =>
      o.customerId.toLowerCase().includes(search) ||
      (o.customerName ?? '').toLowerCase().includes(search) ||
      (o.phoneNo ?? '').toLowerCase().includes(search)
    );
  });

  readonly filteredProductTypeOptions = computed(() => {
    const search = this.productTypeSearch().toLowerCase();
    const options = this.productTypeOptions();
    if (!search) return options;
    return options.filter(o =>
      o.productTypeId.toLowerCase().includes(search) ||
      (o.productTypeDesc ?? '').toLowerCase().includes(search)
    );
  });

  readonly selectedCustomerName = computed(() => {
    const id = this.selectedCustomerId();
    if (!id) return '';
    return this.customerOptions().find(c => c.customerId === id)?.customerName || '';
  });

  readonly selectedProductTypeDisplay = computed(() => {
    const id = this.selectedProductTypeId();
    if (!id) return '';
    const pt = this.productTypeOptions().find(p => p.productTypeId === id);
    if (!pt) return id;
    return pt.productTypeDesc ? `${pt.productTypeId} - ${pt.productTypeDesc}` : pt.productTypeId;
  });

  readonly selectedLifeSpan = computed(() => {
    const id = this.selectedProductTypeId();
    if (!id) return '';
    const pt = this.productTypeOptions().find(p => p.productTypeId === id);
    if (!pt || pt.lifeSpan == null) return '';
    return pt.lifeSpanIndicator ? `${pt.lifeSpan} ${pt.lifeSpanIndicator}` : String(pt.lifeSpan);
  });

  readonly selectedStandardPrice = computed(() => {
    const id = this.selectedProductTypeId();
    if (!id) return '';
    const price = this.productTypeOptions().find(p => p.productTypeId === id)?.standardPrice;
    return price != null ? price.toFixed(2) : '';
  });

  isLoadingCustomers = false;
  isLoadingProductTypes = false;
  isCustomerTruncated = false;
  isCustomerNameTruncated = false;
  isProductTypeTruncated = false;
  retrievedWithCurrentSearch = false;

  dataSource: CustomerTierPricingDto[] = [];

  isLoading = false;
  hasError = false;
  errorMessage = '';
  hasRetrievedData = false;

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'edit';
  sidePanelData: CustomerTierPricingDto | null = null;

  isFilterOpen = signal(false);
  currentFilters = signal<CustomerTierPricingFilter>({});
  filterChips: FilterChip[] = [];
  private filterOverlayRef: OverlayRef | null = null;

  get hasActiveFilters(): boolean {
    const f = this.currentFilters();
    return !!(f.effectiveDate || f.terminationDate);
  }

  private destroy$ = new Subject<void>();

  constructor() {
    this.searchCardForm = this.fb.group({
      customerId: [null, Validators.required],
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
    this.loadDropdownValues();
    this.subscribeToSearchCardChanges();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isRetrieveDisabled(): boolean {
    return !this.searchCardForm.get('customerId')?.value ||
      !this.searchCardForm.get('productType')?.value ||
      this.isLoading ||
      this.retrievedWithCurrentSearch;
  }

  get isClearAllDisabled(): boolean {
    return !this.searchCardForm.get('customerId')?.value &&
      !this.searchCardForm.get('productType')?.value &&
      !this.hasRetrievedData;
  }

  private subscribeToSearchCardChanges(): void {
    this.customerSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.customerSearch.set(value || ''));

    this.productTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.productTypeSearch.set(value || ''));

    this.searchCardForm.get('customerId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((customerId: string | null) => {
        this.selectedCustomerId.set(customerId);
        this.selectedProductTypeId.set(null);
        this.searchCardForm.get('productType')?.setValue(null, { emitEvent: false });
        this.productTypeSearchCtrl.setValue('', { emitEvent: false });
        this.productTypeSearch.set('');
        this.isCustomerTruncated = false;
        this.isProductTypeTruncated = false;
        this.retrievedWithCurrentSearch = false;
      });

    this.searchCardForm.get('productType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((productTypeId: string | null) => {
        this.selectedProductTypeId.set(productTypeId);
        this.retrievedWithCurrentSearch = false;
      });
  }

  private loadDropdownValues(): void {
    this.isLoadingCustomers = true;
    this.isLoadingProductTypes = true;
    this.service.getDropdownValues()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.customerOptions.set(response.customers);
          this.productTypeOptions.set(response.productTypes);
          this.isLoadingCustomers = false;
          this.isLoadingProductTypes = false;
        },
        error: () => {
          this.customerOptions.set([]);
          this.productTypeOptions.set([]);
          this.isLoadingCustomers = false;
          this.isLoadingProductTypes = false;
        }
      });
  }

  onRetrieve(): void {
    this.searchCardForm.markAllAsTouched();
    if (this.isRetrieveDisabled) return;
    this.retrievedWithCurrentSearch = true;
    this.hasRetrievedData = true;
    this.updatePagination({ pageIndex: 0 });
    this.loadData();
  }

  onClearAllSearch(): void {
    if (this.formDirective) {
      this.formDirective.resetForm({ customerId: null, productType: null });
    }
    this.selectedCustomerId.set(null);
    this.selectedProductTypeId.set(null);
    this.customerSearchCtrl.setValue('', { emitEvent: false });
    this.productTypeSearchCtrl.setValue('', { emitEvent: false });
    this.customerSearch.set('');
    this.productTypeSearch.set('');
    this.isCustomerTruncated = false;
    this.isProductTypeTruncated = false;

    this.hasRetrievedData = false;
    this.retrievedWithCurrentSearch = false;
    this.dataSource = [];
    this.currentFilters.set({});
    this.hasError = false;
    this.filterChips = [];
    this.closeSidePanel();
    this.closeFilterPanel();
  }

  checkCustomerTruncation(el: HTMLElement): void {
    this.isCustomerTruncated = el.scrollWidth > el.clientWidth;
  }

  checkCustomerNameTruncation(el: HTMLElement): void {
    this.isCustomerNameTruncated = el.scrollWidth > el.clientWidth;
  }

  checkProductTypeTruncation(el: HTMLElement): void {
    this.isProductTypeTruncated = el.scrollWidth > el.clientWidth;
  }

  private initializeTableConfig(): void {
    const columns: TableColumn<CustomerTierPricingDto>[] = [
      { key: 'customer', header: 'Customer', sortable: false, width: '120px', valueFormatter: (v: string) => v || '--' },
      { key: 'minimumAge', header: 'Minimum Age', sortable: false, width: '140px', valueFormatter: (v: number) => v != null ? String(v) : '--' },
      { key: 'maximumAge', header: 'Maximum Age', sortable: false, width: '140px', valueFormatter: (v: number) => v != null ? String(v) : '--' },
      { key: 'tier', header: 'Tier', sortable: false, width: '80px', valueFormatter: (v: number) => v != null ? String(v) : '--' },
      { key: 'tierDay', header: 'Tier Days', sortable: false, width: '100px', valueFormatter: (v: number) => v != null ? String(v) : '--' },
      {
        key: 'unitPrice',
        header: 'Unit Price',
        sortable: false,
        width: '120px',
        valueFormatter: (v: number) => v != null ? `$${v.toFixed(2)}` : '--'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        sortable: false,
        width: '150px',
        valueFormatter: (v: string) => this.formatDate(v)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        sortable: false,
        width: '160px',
        valueFormatter: (v: string) => this.formatDate(v)
      }
    ];

    const rowActions: RowAction<CustomerTierPricingDto>[] = [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit tier pricing',
        ariaLabel: 'Edit tier {{tier}}',
        color: 'default',
        action: 'edit'
      },
      {
        icon: 'delete',
        label: 'Delete tier pricing',
        ariaLabel: 'Delete tier {{tier}}',
        color: 'default',
        action: 'delete',
        visible: (row: CustomerTierPricingDto) => row.customer !== 'STANDARD'
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
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const customerId = this.searchCardForm.get('customerId')?.value;
    const productType = this.searchCardForm.get('productType')?.value;

    const f = this.currentFilters();
    const filterRequest: CustomerTierPricingFilterRequest = {};
    if (f.effectiveDatePeriod && f.effectiveDate) {
      filterRequest.effectiveDatePeriod = f.effectiveDatePeriod;
      filterRequest.effectiveDate = f.effectiveDate;
    }
    if (f.terminationDatePeriod && f.terminationDate) {
      filterRequest.terminationDatePeriod = f.terminationDatePeriod;
      filterRequest.terminationDate = f.terminationDate;
    }

    this.service.searchCustomerTierPricing(customerId, productType, filterRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: response.total
            }
          };
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.hasError = true;
          const body = error?.error;
          const code = body?.errorResponse?.errorCode || body?.errorCode;
          const msg = body?.errorResponse?.error || body?.error || body?.message || 'Failed to load tier pricing. Please try again.';
          this.errorMessage = code ? `Error ${code}: ${msg}` : msg;
          this.loggingService.error('Failed to load customer tier pricing', error);
          this.snackbarService.showError(this.errorMessage);
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

    const portal = new ComponentPortal(EnterCustomerTierPricingFilterPanel);
    const componentRef = this.filterOverlayRef.attach(portal);

    componentRef.instance.currentFilters.set(this.currentFilters());

    componentRef.instance.apply.subscribe((filters: CustomerTierPricingFilter) => {
      this.currentFilters.set(filters);
      this.filterChips = this.buildFilterChips(filters);
      this.loadData();
      this.closeFilterPanel();
    });

    componentRef.instance.cancel.subscribe(() => {
      this.closeFilterPanel();
    });

    this.filterOverlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilterPanel());

    this.filterOverlayRef.keydownEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event.key === 'Escape') {
          this.closeFilterPanel();
        }
      });

    this.isFilterOpen.set(true);
  }

  buildFilterChips(filters: CustomerTierPricingFilter): FilterChip[] {
    const chips: FilterChip[] = [];
    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const symbol = filters.effectiveDatePeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date: ${symbol} ${this.formatDate(filters.effectiveDate)}`,
        value: filters.effectiveDate,
        removable: true,
      });
    }
    if (filters.terminationDate && filters.terminationDatePeriod) {
      const symbol = filters.terminationDatePeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date: ${symbol} ${this.formatDate(filters.terminationDate)}`,
        value: filters.terminationDate,
        removable: true,
      });
    }
    return chips;
  }

  onRemoveFilterChip(key: string): void {
    const updated: CustomerTierPricingFilter = { ...this.currentFilters() };
    if (key === 'effectiveDate') {
      delete updated.effectiveDate;
      delete updated.effectiveDatePeriod;
    } else if (key === 'terminationDate') {
      delete updated.terminationDate;
      delete updated.terminationDatePeriod;
    }
    this.currentFilters.set(updated);
    this.filterChips = this.buildFilterChips(updated);
    this.loadData();
  }

  clearAllFilters(): void {
    this.currentFilters.set({});
    this.filterChips = [];
    this.loadData();
  }

  closeFilterPanel(): void {
    if (this.filterOverlayRef) {
      this.filterOverlayRef.dispose();
      this.filterOverlayRef = null;
    }
    this.isFilterOpen.set(false);
    this.filterButtonRef?.nativeElement?.focus();
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

  onRowAction(event: TableRowActionEvent<CustomerTierPricingDto>): void {
    if (event.action === 'edit') {
      this.editRecord(event.row);
    } else if (event.action === 'delete') {
      this.deleteRecord(event.row);
    }
  }

  editRecord(row: CustomerTierPricingDto): void {
    this.sidePanelTrigger = document.activeElement as HTMLElement;
    this.sidePanelMode = row.customer === 'STANDARD' ? 'add' : 'edit';
    this.sidePanelData = row;
    this.sidePanelOpen = true;
    setTimeout(() => {
      const closeBtn = document.querySelector('.side-panel-container .close-btn') as HTMLElement;
      closeBtn?.focus();
    }, 100);
  }

  hasStandardRows(): boolean {
    return this.dataSource.some(r => r.customer === 'STANDARD');
  }

  openAddPanel(): void {
    const standardRow = this.dataSource.find(r => r.customer === 'STANDARD');
    if (!standardRow) return;
    this.sidePanelTrigger = document.activeElement as HTMLElement;
    this.sidePanelMode = 'add';
    this.sidePanelData = standardRow;
    this.sidePanelOpen = true;
  }

  deleteRecord(row: CustomerTierPricingDto): void {
    if (!window.confirm('Are you sure you want to delete this tier pricing record?')) return;

    const customerId = this.searchCardForm.get('customerId')?.value;
    const productType = this.searchCardForm.get('productType')?.value;

    this.service.deleteCustomerTierPricing(customerId, productType, row.tier)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.snackbarService.showSuccess(response.message || 'Tier pricing deleted successfully.');
          this.closeSidePanel();
          this.loadData();
        },
        error: (error) => {
          const msg = error?.error?.message || 'Failed to delete tier pricing. Please try again.';
          this.snackbarService.showError(msg);
        }
      });
  }



  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    if (this.sidePanelTrigger) {
      setTimeout(() => {
        this.sidePanelTrigger?.focus();
        this.sidePanelTrigger = null;
      });
    }
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAllSearch();
        this.loadDropdownValues();
      });
  }
}
