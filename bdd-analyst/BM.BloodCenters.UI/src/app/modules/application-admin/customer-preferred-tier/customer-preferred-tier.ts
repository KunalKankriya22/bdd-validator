import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
  effect,
  ChangeDetectorRef,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';

import { CustomerPreferredTierService } from './services/customer-preferred-tier.service';
import {
  CustomerPreferredTierModel,
  CustomerPreferredTierQueryDto,
  CustomerPreferredTierFilterValue,
  CustomerDropdownDto
} from './models/customer-preferred-tier.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { CustomerPreferredTierFilterChipsUtils } from './utils/filter-chips.utils';
import { CustomerPreferredTierFilterPanelComponent } from './customer-preferred-tier-filter-panel/customer-preferred-tier-filter-panel';
import { AddEditCustomerPreferredTierComponent } from './add-edit-customer-preferred-tier/add-edit-customer-preferred-tier';

@Component({
  selector: 'app-customer-preferred-tier',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    FilterChips,
    AddEditCustomerPreferredTierComponent
  ],
  templateUrl: './customer-preferred-tier.html',
  styleUrls: ['./customer-preferred-tier.scss']
})
export class CustomerPreferredTierComponent implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  // Customer selector state
  selectedCustomerId = '';
  selectedCustomerName = '';
  customerSearchCtrl = new FormControl('');
  customerOptionsSignal = signal<CustomerDropdownDto[]>([]);
  private customerSearchSignal = toSignal(this.customerSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  filteredCustomerOptions = computed(() => {
    const searchTerm = this.customerSearchSignal()?.toLowerCase() || '';
    const options = this.customerOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(o =>
      (o.customerId || '').toLowerCase().includes(searchTerm) ||
      (o.customerName || '').toLowerCase().includes(searchTerm)
    );
  });

  tableConfig: DataTableConfig<CustomerPreferredTierModel> = {
    columns: [],
    rowActions: [],
    sortConfig: {
      column: 'productType',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: false
  };

  appliedFilters: CustomerPreferredTierFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: CustomerPreferredTierModel[] = [];
  requestState: CustomerPreferredTierQueryDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: CustomerPreferredTierModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  // Store dropdown options for filter chips
  private customerOptions: any[] = [];
  private productTypeOptions: any[] = [];

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  currentYear: number = new Date().getFullYear();

  // Default title (fallback if API doesn't return it)
  private readonly defaultTitle = 'Setup Customer Preferred Product Tiers';

  constructor(
    private service: CustomerPreferredTierService,
    private router: Router,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService,
    private snackbarService: SnackbarService
  ) {
    this.initializeConfigurations();

    // Watch for page header data from API and update header config dynamically
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || this.defaultTitle, link: null }
          ],
          title: pageData.title || this.defaultTitle,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.loadDropdownOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  /**
   * Subscribe to chapter change events from HeaderService
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleChapterChange();
      });
  }

  /**
   * Handle chapter change event
   */
  private handleChapterChange(): void {
    // Clear customer selection
    this.selectedCustomerId = '';
    this.selectedCustomerName = '';

    // Clear filters
    this.appliedFilters = null;
    this.filterChips = [];
    const { customerId, productType, effDatePeriod, effDateFilter, termDatePeriod, termDateFilter, ...rest } = this.requestState;
    this.requestState = rest;

    // Close side panel if open
    if (this.sidePanelOpen) {
      this.sidePanelOpen = false;
      this.sidePanelData = null;
    }

    // Close filter panel if open
    if (this.isFilterOpen) {
      this.closeFilterPanel();
    }

    // Reset sort to default
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = 'productType';
      this.tableConfig.sortConfig.direction = 'default';
    }

    // Clear table data and dropdown options for new chapter
    this.dataSource = [];
    this.productTypeOptions = [];
    this.hasError = false;
    this.loadData();
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/home'
        },
        {
          label: this.defaultTitle,
          link: null
        }
      ],
      title: this.defaultTitle,
      subtitle: ''
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      sortConfig: {
        column: 'productType',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: false,
      emptyMessage: 'No customer preferred tier records available to display',
      loadingMessage: 'Loading customer preferred tier data...',
      showPagination: false
    };
  }

  private getTableColumns(): TableColumn<CustomerPreferredTierModel>[] {
    return [
      {
        key: 'productTypeDesc',
        header: 'Product',
        sortable: true,
        width: '220px'
      },
      {
        key: 'tier',
        header: 'Tier',
        width: '80px'
      },
      {
        key: 'fromDay',
        header: 'Minimum Age',
        width: '120px'
      },
      {
        key: 'toDay',
        header: 'Maximum Age',
        width: '120px'
      },
      {
        key: 'unitPrice',
        header: 'Unit Price',
        width: '120px',
        valueFormatter: (value) => this.formatCurrency(value)
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private formatDate(date: Date | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return `$${value.toFixed(2)}`;
  }

  private getRowActions(): RowAction<CustomerPreferredTierModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit product details',
        ariaLabel: 'Edit product details for {{productTypeDesc}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  /**
   * Load dropdown options for filter chips
   */
  private loadDropdownOptions(): void {
    this.service.getCustomersDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customers) => {
          this.customerOptions = customers;
          this.customerOptionsSignal.set(customers);
        },
        error: (error) => {
          console.error('Error loading customers:', error);
        }
      });
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const queryParams: CustomerPreferredTierQueryDto = {
      customerId: this.selectedCustomerId || this.requestState.customerId || null,
      productType: this.requestState.productType || null,
      sortColumn: this.getSortColumnName(),
      sortOrder: this.getSortOrder(),
      effDatePeriod: this.requestState.effDatePeriod || null,
      effDateFilter: this.requestState.effDateFilter || null,
      termDatePeriod: this.requestState.termDatePeriod || null,
      termDateFilter: this.requestState.termDateFilter || null
    };

    this.service
      .getAll(queryParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: CustomerPreferredTierModel[]; totalRecords: number }) => {
          this.dataSource = [...response.data];
          this.loadFilterProductTypes();
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading customer preferred tier data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load customer preferred tier data. Please try again.';
        }
      });
  }

  /**
   * Get sort column name for API
   */
  private getSortColumnName(): string | null {
    if (!this.tableConfig.sortConfig || this.tableConfig.sortConfig.direction === 'default') {
      return null;
    }

    const columnMap: Record<string, string> = {
      'productTypeDesc': 'ProductType',
      'tier': 'Tier',
      'effDate': 'EffDate',
      'termDate': 'TermDate'
    };

    return columnMap[this.tableConfig.sortConfig.column] || null;
  }

  /**
   * Get sort order for API
   */
  private getSortOrder(): string | null {
    if (!this.tableConfig.sortConfig || this.tableConfig.sortConfig.direction === 'default') {
      return null;
    }

    return this.tableConfig.sortConfig.direction === 'A' ? 'ASC' : 'DESC';
  }

  onCustomerSelected(customerId: string): void {
    this.selectedCustomerId = customerId;
    const customer = this.customerOptions.find((c: CustomerDropdownDto) => c.customerId === customerId);
    this.selectedCustomerName = customer?.customerName || '';

    this.loadData();
  }

  onClearCustomer(): void {
    this.selectedCustomerId = '';
    this.selectedCustomerName = '';
    this.dataSource = [];
    this.productTypeOptions = [];
    if (this.sidePanelOpen) {
      this.closeSidePanel();
    }
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<CustomerPreferredTierModel>): void {
    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: CustomerPreferredTierModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  closeFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }
    if (this.filterBtn?.nativeElement) {
      (this.filterBtn.nativeElement as HTMLElement).focus();
    }
    this.cdr.markForCheck();
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.closeFilterPanel();
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

    const portal = new ComponentPortal(CustomerPreferredTierFilterPanelComponent);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.appliedFilters = this.appliedFilters;
    componentRef.instance.productTypeOptions = this.productTypeOptions;

    componentRef.instance.applyFilters
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeFilterPanel();
      });

    componentRef.instance.closePanel
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

  applyFilters(filters: CustomerPreferredTierFilterValue | null): void {
    this.appliedFilters = filters;

    this.filterChips = CustomerPreferredTierFilterChipsUtils.generateFilterChips(
      filters,
      this.productTypeOptions
    );

    this.requestState = {
      ...this.requestState,
      productType: filters?.productType || null,
      effDatePeriod: filters?.effDatePeriod || null,
      effDateFilter: filters?.effDateFilter || null,
      termDatePeriod: filters?.termDatePeriod || null,
      termDateFilter: filters?.termDateFilter || null
    };

    if (this.sidePanelOpen) {
      this.closeSidePanel();
    }
    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = CustomerPreferredTierFilterChipsUtils.removeFilter(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = CustomerPreferredTierFilterChipsUtils.generateFilterChips(
      this.appliedFilters,
      this.productTypeOptions
    );

    this.updateRequestStateFromFilters();

    if (this.sidePanelOpen) {
      this.closeSidePanel();
    }
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return !!this.appliedFilters;
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { productType, effDatePeriod, effDateFilter, termDatePeriod, termDateFilter, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.sidePanelOpen) {
      this.closeSidePanel();
    }
    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { productType, effDatePeriod, effDateFilter, termDatePeriod, termDateFilter, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      productType: this.appliedFilters.productType || null,
      effDatePeriod: this.appliedFilters.effDatePeriod || null,
      effDateFilter: this.appliedFilters.effDateFilter || null,
      termDatePeriod: this.appliedFilters.termDatePeriod || null,
      termDateFilter: this.appliedFilters.termDateFilter || null
    };
  }

  private loadFilterProductTypes(): void {
    if (!this.selectedCustomerId) return;
    this.service.getFilterProductTypes(this.selectedCustomerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productTypes) => {
          this.productTypeOptions = productTypes;
        },
        error: (error) => {
          console.error('Error loading filter product types:', error);
          this.productTypeOptions = [];
        }
      });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Alt+C: Create new record
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.createRecord();
    }

    // Alt+F: Open filter
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    // Escape: Close filter panel if open
    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.closeFilterPanel();
    }

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
