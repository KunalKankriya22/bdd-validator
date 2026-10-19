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

import { CustomerConsigneeProductDetailsApiService } from './services/customer-consignee-product-details-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';

import {
  CustomerConsigneeProductDetailsDto,
  CustomerConsigneeProductQueryDto,
  FilterValue,
  CustomerLOV,
  ConsigneeLOV
} from './models/customer-consignee-product-details.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
  RowAction,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';

import { CustomerConsigneeProductDetailsFilterPanel } from './customer-consignee-product-details-filter-panel/customer-consignee-product-details-filter-panel';
import { EditCustomerConsigneeProductDetailsDialog } from './edit-customer-consignee-product-details/edit-customer-consignee-product-details';
import { CustomerConsigneeProductDetailsFilterChipsUtils } from './utils/filter-chips.utils';

@Component({
  selector: 'app-customer-consignee-product-details',
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
    SearchBar,
    DataTable,
    FilterChips,
    EditCustomerConsigneeProductDetailsDialog
  ],
  templateUrl: './customer-consignee-product-details.component.html',
  styleUrls: ['./customer-consignee-product-details.component.scss']
})
export class CustomerConsigneeProductDetailsComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  readonly componentId = `customer-consignee-product-details-${CustomerConsigneeProductDetailsComponent.nextId++}`;
  readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild('controlsSection', { read: ElementRef }) controlsSection!: ElementRef<HTMLElement>;
  @ViewChild(FormGroupDirective) private formDirective!: FormGroupDirective;

  private service = inject(CustomerConsigneeProductDetailsApiService);
  private overlay = inject(Overlay);
  private fb = inject(FormBuilder);
  private loggingService = inject(LoggingService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);
  private pageHeaderService = inject(PageHeaderService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by product code or inventory product type',
    minLength: 1,
    ariaLabel: 'Search by product code or inventory product type',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<CustomerConsigneeProductDetailsDto> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'productType',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No customer consignee product details found',
    loadingMessage: 'Loading customer consignee product details...',
    showPagination: true
  };

  // Search card form
  searchCardForm!: FormGroup;
  customerSearchCtrl = new FormControl<string>('');
  consigneeSearchCtrl = new FormControl<string>('');

  // Customer/Consignee options
  readonly customerOptions = signal<CustomerLOV[]>([]);
  readonly consigneeOptions = signal<ConsigneeLOV[]>([]);

  private readonly selectedCustomerId = signal<string | null>(null);
  private readonly selectedConsigneeId = signal<string | null>(null);
  private readonly customerSearch = signal('');
  private readonly consigneeSearch = signal('');

  readonly filteredCustomerOptions = computed(() => {
    const search = this.customerSearch().toLowerCase();
    const options = this.customerOptions();
    if (!search) return options;
    return options.filter(o =>
      o.customerId.toLowerCase().includes(search) ||
      (o.name ?? '').toLowerCase().includes(search)
    );
  });

  readonly filteredConsigneeOptions = computed(() => {
    const search = this.consigneeSearch().toLowerCase();
    const options = this.consigneeOptions();
    if (!search) return options;
    return options.filter(o =>
      o.consigneeId.toLowerCase().includes(search) ||
      (o.name ?? '').toLowerCase().includes(search)
    );
  });

  readonly selectedCustomerName = computed(() => {
    const customerId = this.selectedCustomerId();
    if (!customerId) return '';
    const customer = this.customerOptions().find(c => c.customerId === customerId);
    return customer?.name || '';
  });

  readonly selectedCustomerDisplay = computed(() => {
    const customerId = this.selectedCustomerId();
    if (!customerId) return '';
    return customerId;
  });

  readonly selectedConsigneeDisplay = computed(() => {
    const consigneeId = this.selectedConsigneeId();
    if (!consigneeId) return '';
    const consignee = this.consigneeOptions().find(c => c.consigneeId === consigneeId);
    if (!consignee) return consigneeId;
    return consignee.name ? `${consignee.consigneeId} - ${consignee.name}` : consignee.consigneeId;
  });

  isCustomerTruncated = false;
  isConsigneeTruncated = false;
  isCustomerDescTruncated = false;

  // Loading states
  isLoadingCustomers = false;
  isLoadingConsignees = false;

  dataSource: CustomerConsigneeProductDetailsDto[] = [];
  appliedFilters: FilterValue | null = null;
  filterChips: FilterChip[] = [];

  // State
  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchKeyword = '';
  isFilterOpen = false;
  hasRetrievedData = false;

  // Side panel state
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: CustomerConsigneeProductDetailsDto | null = null;

  // Filter panel overlay
  private overlayRef: OverlayRef | null = null;
  private destroy$ = new Subject<void>();

  constructor() {
    this.searchCardForm = this.fb.group({
      customerId: [null, Validators.required],
      consigneeId: [{ value: null, disabled: true }]
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
    this.loadCustomers();
    this.subscribeToSearchCardChanges();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeFilterPanel();
  }

  get isRetrieveDisabled(): boolean {
    return !this.searchCardForm.get('customerId')?.value || this.isLoading;
  }

  get isClearAllDisabled(): boolean {
    return !this.searchCardForm.get('customerId')?.value && !this.hasRetrievedData;
  }

  private subscribeToSearchCardChanges(): void {
    this.customerSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.customerSearch.set(value || ''));

    this.consigneeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.consigneeSearch.set(value || ''));

    this.searchCardForm.get('customerId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((customerId: string | null) => {
        this.selectedCustomerId.set(customerId);
        this.selectedConsigneeId.set(null);
        this.searchCardForm.get('consigneeId')?.reset();
        this.searchCardForm.get('consigneeId')?.disable({ emitEvent: false });
        this.consigneeSearchCtrl.setValue('', { emitEvent: false });
        this.consigneeSearch.set('');
        this.consigneeOptions.set([]);
        this.isCustomerTruncated = false;
        this.isConsigneeTruncated = false;
        this.isCustomerDescTruncated = false;

        if (customerId) {
          this.loadConsignees(customerId);
        }
      });

    this.searchCardForm.get('consigneeId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((consigneeId: string | null) => {
        this.selectedConsigneeId.set(consigneeId);
      });
  }

  private loadCustomers(): void {
    this.isLoadingCustomers = true;
    this.service.getCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customers) => {
          this.customerOptions.set(customers);
          this.isLoadingCustomers = false;
        },
        error: () => {
          this.customerOptions.set([]);
          this.isLoadingCustomers = false;
        }
      });
  }

  private loadConsignees(customerId: string): void {
    this.isLoadingConsignees = true;
    this.service.getConsigneesByCustomer(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (consignees) => {
          this.consigneeOptions.set(consignees);
          this.isLoadingConsignees = false;
          this.searchCardForm.get('consigneeId')?.enable({ emitEvent: false });
        },
        error: () => {
          this.consigneeOptions.set([]);
          this.isLoadingConsignees = false;
        }
      });
  }

  onRetrieve(): void {
    if (this.isRetrieveDisabled) return;
    this.hasRetrievedData = true;
    this.updatePagination({ pageIndex: 0 });
    this.loadData();
  }

  onClearAllSearch(): void {
    this.formDirective.resetForm({ customerId: null, consigneeId: null });
    this.selectedCustomerId.set(null);
    this.selectedConsigneeId.set(null);
    this.customerSearchCtrl.setValue('', { emitEvent: false });
    this.consigneeSearchCtrl.setValue('', { emitEvent: false });
    this.customerSearch.set('');
    this.consigneeSearch.set('');
    this.consigneeOptions.set([]);
    this.isCustomerTruncated = false;
    this.isConsigneeTruncated = false;
    this.isCustomerDescTruncated = false;

    this.hasRetrievedData = false;
    this.dataSource = [];
    this.appliedFilters = null;
    this.filterChips = [];
    this.searchKeyword = '';
    this.hasError = false;
    this.closeSidePanel();
    this.closeFilterPanel();
  }

  checkCustomerTruncation(el: HTMLElement): void {
    this.isCustomerTruncated = el.scrollWidth > el.clientWidth;
  }

  checkConsigneeTruncation(el: HTMLElement): void {
    this.isConsigneeTruncated = el.scrollWidth > el.clientWidth;
  }

  checkCustomerDescTruncation(el: HTMLElement): void {
    this.isCustomerDescTruncated = el.scrollWidth > el.clientWidth;
  }

  private initializeTableConfig(): void {
    const columns: TableColumn<CustomerConsigneeProductDetailsDto>[] = [
      { key: 'productType', header: 'Inventory Product Type', sortable: true, width: '200px', valueFormatter: (value: string) => value || '--' },
      { key: 'productCode', header: 'Product Code', sortable: false, width: '160px', valueFormatter: (value: string) => value || '--' },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        width: '160px',
        valueFormatter: (value: string) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        width: '160px',
        valueFormatter: (value: string) => this.formatDate(value)
      }
    ];

    const rowActions: RowAction<CustomerConsigneeProductDetailsDto>[] = [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
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

  private formatDate(value: string): string {
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

    const direction = this.tableConfig.sortConfig?.direction;
    const sortColumn = this.tableConfig.sortConfig?.column || 'ProductType';

    const query: CustomerConsigneeProductQueryDto = {
      customerId: this.searchCardForm.get('customerId')?.value,
      consigneeId: this.searchCardForm.get('consigneeId')?.value || null,
      effectivePeriod: this.appliedFilters?.effectivePeriod || null,
      effectiveDate: this.appliedFilters?.effectiveDate || null,
      terminationPeriod: this.appliedFilters?.terminationPeriod || null,
      terminationDate: this.appliedFilters?.terminationDate || null,
      searchKeyword: this.searchKeyword || null,
      sortColumn: sortColumn.charAt(0).toUpperCase() + sortColumn.slice(1),
      sortOrder: direction === 'D' ? 'DESC' : 'ASC'
    };

    const pageSize = this.tableConfig.pagination!.pageSize;
    const pageIndex = this.tableConfig.pagination!.pageIndex;
    const skip = pageIndex * pageSize;

    this.service
      .getCustomerConsigneeProductDetails(query, pageSize, skip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: response.total || response.data.length
            }
          };
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.hasError = true;
          const body = error?.error;
          const code = body?.errorResponse?.errorCode || body?.errorCode;
          const msg = body?.errorResponse?.error || body?.error || body?.message || 'Failed to load customer consignee product details. Please try again.';
          const message = code ? `Error ${code}: ${msg}` : msg;
          this.errorMessage = message;
          this.loggingService.error('Failed to load customer consignee product details', error);
          this.snackbarService.showError(message);
        }
      });
  }

  onSearch(searchKeyword: string): void {
    this.searchKeyword = searchKeyword;
    this.updatePagination({ pageIndex: 0 });
    this.loadData();
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

  onRowAction(event: TableRowActionEvent<CustomerConsigneeProductDetailsDto>): void {
    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  openFilterPanel(): void {
    if (this.overlayRef) {
      this.closeFilterPanel();
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.controlsSection.nativeElement)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 0
        }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop'
    });

    const filterPanelPortal = new ComponentPortal(CustomerConsigneeProductDetailsFilterPanel);
    const componentRef = this.overlayRef.attach(filterPanelPortal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply.pipe(takeUntil(this.destroy$)).subscribe((filters: FilterValue) => {
      this.applyFilters(filters);
      this.closeFilterPanel();
    });

    componentRef.instance.close.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });

    this.overlayRef.backdropClick().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });
  }

  private closeFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
    if (this.filterBtn?.nativeElement) {
      this.filterBtn.nativeElement.focus();
    }
  }

  private applyFilters(filters: FilterValue): void {
    this.appliedFilters = filters;
    this.updateFilterChips();
    this.updatePagination({ pageIndex: 0 });
    this.loadData();
  }

  private updateFilterChips(): void {
    if (!this.appliedFilters || Object.keys(this.appliedFilters).length === 0) {
      this.filterChips = [];
      return;
    }
    this.filterChips = CustomerConsigneeProductDetailsFilterChipsUtils.createFilterChips(this.appliedFilters);
  }

  onRemoveFilterChip(chipKey: string): void {
    if (!this.appliedFilters) return;

    this.appliedFilters = CustomerConsigneeProductDetailsFilterChipsUtils.removeFilter(
      this.appliedFilters,
      chipKey
    );

    this.updateFilterChips();
    this.updatePagination({ pageIndex: 0 });
    this.loadData();
  }

  onClearAllFilters(): void {
    this.appliedFilters = CustomerConsigneeProductDetailsFilterChipsUtils.clearAllFilters();
    this.updateFilterChips();
    this.updatePagination({ pageIndex: 0 });
    this.loadData();
  }

  addNewRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = {
      customerId: this.searchCardForm.get('customerId')?.value || '',
      consigneeId: this.searchCardForm.get('consigneeId')?.value || null,
      effDate: '',
      termDate: null
    } as CustomerConsigneeProductDetailsDto;
    this.sidePanelOpen = true;
  }

  editRecord(row: CustomerConsigneeProductDetailsDto): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = row;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAllSearch();
        this.loadCustomers();
      });
  }
}
