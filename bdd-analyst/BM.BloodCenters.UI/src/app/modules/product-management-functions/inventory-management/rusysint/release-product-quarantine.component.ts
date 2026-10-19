import { Component, OnInit, OnDestroy, ViewChild, ElementRef, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import moment from 'moment';

import { ReleaseProductQuarantineApiService } from './services/release-product-quarantine-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MenuService } from '@shared/services/menu.service';

import {
  QuarantineType,
  QuarantineProduct,
  FilterValue,
  ProductCodeLOV,
  BloodTypeLOV,
  WarehouseLOV
} from './models/release-product-quarantine.model';

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

import { ReleaseProductQuarantineFilterChipsUtils } from './utils/filter-chips.utils';
import { ReleaseProductQuarantineFilterPanel } from './components/filter-panel/filter-panel';
import { ReleaseDialog, ReleaseDialogData } from './components/release-dialog/release-dialog';
import { ReasonsDialog, ReasonsDialogData } from './components/reasons-dialog/reasons-dialog';

import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';

@Component({
  selector: 'app-release-product-quarantine',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips
  ],
  templateUrl: './release-product-quarantine.component.html',
  styleUrls: ['./release-product-quarantine.component.scss']
})
export class ReleaseProductQuarantineComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  readonly componentId = `release-product-quarantine-${ReleaseProductQuarantineComponent.nextId++}`;
  readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild('controlsSection', { read: ElementRef }) controlsSection!: ElementRef<HTMLElement>;

  private service = inject(ReleaseProductQuarantineApiService);
  private overlay = inject(Overlay);
  private dialog = inject(MatDialog);
  private loggingService = inject(LoggingService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);
  private pageHeaderService = inject(PageHeaderService);
  private menuService = inject(MenuService);
  private fb = inject(FormBuilder);

  // Signal-based state
  protected readonly quarantineTypes = signal<QuarantineType[]>([]);
  protected readonly selectedType = signal<string>('QU'); // Default to Quarantine
  protected readonly data = signal<QuarantineProduct[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly totalCount = signal<number>(0);
  protected readonly filterChips = signal<FilterChip[]>([]);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Scan or enter Unit ID (8 characters)',
    minLength: 8,
    ariaLabel: 'Search by Unit ID barcode'
  };

  // Search form for Unit ID
  searchForm!: FormGroup;

  tableConfig: DataTableConfig<QuarantineProduct> = {
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
      column: 'unitId',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No products found in quarantine',
    loadingMessage: 'Loading quarantine products...',
    showPagination: true
  };

  dataSource: QuarantineProduct[] = [];
  appliedFilters: FilterValue | null = null;

  // LOV options
  productCodeOptions: ProductCodeLOV[] = [];
  bloodTypeOptions: BloodTypeLOV[] = [];
  warehouseOptions: WarehouseLOV[] = [];

  // State
  isFilterOpen = false;

  // Filter panel overlay
  private overlayRef: OverlayRef | null = null;
  private destroy$ = new Subject<void>();

  constructor() {
    this.initializeTableConfig();
    this.initializeSearchForm();

    // Update page header when menu data is loaded
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.ReleaseProductQuarantine]?.path;
        const menuItem = basePath ? this.menuService.findMenuItemByPath(basePath) : null;

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: 'Product Management Functions', link: null },
              { label: 'Inventory Management', link: null },
              { label: 'Product Management', link: null },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || 'Manage release of products from quarantine or restocking of returned products'
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadQuarantineTypes();
    this.loadData();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeFilterPanel();
  }

  private initializeSearchForm(): void {
    this.searchForm = this.fb.group({
      unitId: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(8),
        Validators.pattern(/^[CI][0-9]{7}$/) // First char must be C or I, followed by 7 digits
      ]]
    });

    // Auto-submit on 8-character entry (barcode scanner support)
    this.searchForm.get('unitId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: string) => {
        if (value && value.length === 8) {
          this.onSearchByUnitId();
        }
      });
  }

  private initializeTableConfig(): void {
    const columns: TableColumn<QuarantineProduct>[] = [
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: true,
        width: '120px'
      },
      {
        key: 'productCode',
        header: 'Product Code',
        sortable: true,
        width: '120px'
      },
      {
        key: 'productDesc',
        header: 'Product Description',
        sortable: false,
        width: 'auto'
      },
      {
        key: 'aliquot',
        header: 'Aliquot',
        sortable: false,
        width: '80px'
      },
      {
        key: 'bloodType',
        header: 'Blood Type',
        sortable: true,
        width: '100px'
      },
      {
        key: 'collDate',
        header: 'Collection Date',
        sortable: true,
        width: '140px',
        valueFormatter: (value: string) => this.formatDate(value)
      },
      {
        key: 'expDate',
        header: 'Expiration Date',
        sortable: true,
        width: '140px',
        valueFormatter: (value: string | null) => value ? this.formatDate(value) : '-'
      },
      {
        key: 'locationId',
        header: 'Location',
        sortable: false,
        width: '150px',
        valueFormatter: (value: string | null) => value || '-'
      },
      {
        key: 'reasonDesc',
        header: 'Reason',
        sortable: false,
        width: '200px',
        valueFormatter: (value: string | null) => value || '-'
      }
    ];

    const rowActions: RowAction<QuarantineProduct>[] = [
      {
        icon: 'check_circle',
        label: 'Release product',
        ariaLabel: 'Release product {{unitId}}',
        color: 'primary',
        action: 'release'
      },
      {
        icon: 'assignment',
        label: 'View reasons',
        ariaLabel: 'View quarantine reasons for {{unitId}}',
        color: 'default',
        action: 'view-reasons'
      }
    ];

    this.tableConfig = {
      ...this.tableConfig,
      columns,
      rowActions
    };
  }

  private formatDate(value: string): string {
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  private loadQuarantineTypes(): void {
    this.service.getQuarantineTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.quarantineTypes.set(types);
        },
        error: (error) => {
          this.loggingService.error('Failed to load quarantine types', error);
          this.snackbarService.showError('Failed to load quarantine types');
        }
      });
  }

  private extractFilterOptionsFromData(data: QuarantineProduct[]): void {
    const productCodeMap = new Map<string, string | null>();
    const bloodTypeMap = new Map<string, string | null>();
    const warehouseMap = new Map<string, string | null>();

    data.forEach((row) => {
      if (row.productCode) {
        productCodeMap.set(row.productCode, row.productDesc);
      }
      if (row.bloodType) {
        bloodTypeMap.set(row.bloodType, row.aboDesc);
      }
      // TODO: Extract warehouse from locationId or add warehouseId field to API response
    });

    this.productCodeOptions = Array.from(productCodeMap, ([productCode, productDesc]) => ({ productCode, productDesc }));
    this.bloodTypeOptions = Array.from(bloodTypeMap, ([bloodType, aboDesc]) => ({ bloodType, aboDesc }));
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const direction = this.tableConfig.sortConfig?.direction;
    const pageSize = this.tableConfig.pagination!.pageSize;
    const pageIndex = this.tableConfig.pagination!.pageIndex;
    const skip = pageIndex * pageSize;

    const query = {
      take: pageSize,
      skip: skip,
      quarantineType: this.selectedType(),
      productCode: this.appliedFilters?.productCode || null,
      bloodType: this.appliedFilters?.bloodType || null,
      warehouseId: this.appliedFilters?.warehouseId || null,
      fromDate: this.appliedFilters?.fromDate ? moment(this.appliedFilters.fromDate).format('YYYY-MM-DD') : null,
      toDate: this.appliedFilters?.toDate ? moment(this.appliedFilters.toDate).format('YYYY-MM-DD') : null,
      sortColumn: this.tableConfig.sortConfig?.column || 'unitId',
      sortOrder: direction === 'D' ? 'DESC' : 'ASC'
    };

    this.service
      .getQuarantineProducts(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.data.set(response.data);
          this.dataSource = response.data;
          this.totalCount.set(response.total);
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: response.total
            }
          };
          this.extractFilterOptionsFromData(response.data);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.error.set('Failed to load quarantine products. Please try again.');
          this.loggingService.error('Failed to load quarantine products', error);
          this.snackbarService.showError('Failed to load quarantine products');
        }
      });
  }

  onQuarantineTypeChange(type: string): void {
    this.selectedType.set(type);
    this.updatePagination({ pageIndex: 0 });
    this.tableConfig = {
      ...this.tableConfig,
      emptyMessage: type === 'QU' ? 'No products found in quarantine' : 'No products found in returns'
    };
    this.loadData();
  }

  onSearchByUnitId(): void {
    if (this.searchForm.invalid) {
      return;
    }

    const unitId = this.searchForm.get('unitId')?.value?.trim();
    if (!unitId) {
      return;
    }

    // TODO: Validate barcode format (Codabar 'C' or Code128 'I')
    // TODO: Implement unit ID search functionality
    // For now, just reload data
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

  onRowAction(event: TableRowActionEvent<QuarantineProduct>): void {
    if (event.action === 'release') {
      this.releaseProduct(event.row);
    } else if (event.action === 'view-reasons') {
      this.viewReasons(event.row);
    }
  }

  openFilterPanel(): void {
    if (this.isFilterOpen) {
      this.closeFilterPanel();
      return;
    }

    const positionStrategy = this.overlay
      .position()
      .global()
      .right('0')
      .top('0');

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      width: '400px',
      height: '100%'
    });

    const portal = new ComponentPortal(ReleaseProductQuarantineFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    // Pass data to filter panel
    componentRef.instance.productCodeOptions = this.productCodeOptions;
    componentRef.instance.bloodTypeOptions = this.bloodTypeOptions;
    componentRef.instance.warehouseOptions = this.warehouseOptions;
    componentRef.instance.currentFilters = this.appliedFilters;

    // Subscribe to filter panel events
    componentRef.instance.applyFilters
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters) => {
        this.appliedFilters = filters;
        this.updateFilterChips();
        this.updatePagination({ pageIndex: 0 });
        this.loadData();
      });

    componentRef.instance.clearFilters
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.appliedFilters = null;
        this.filterChips.set([]);
        this.updatePagination({ pageIndex: 0 });
        this.loadData();
      });

    componentRef.instance.closePanel
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });

    // Close on backdrop click
    this.overlayRef
      .backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });

    this.isFilterOpen = true;
  }

  private closeFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
  }

  onRemoveFilterChip(chipKey: string): void {
    if (!this.appliedFilters) {
      return;
    }

    this.appliedFilters = ReleaseProductQuarantineFilterChipsUtils.removeFilter(
      this.appliedFilters,
      chipKey
    );

    this.updateFilterChips();
    this.updatePagination({ pageIndex: 0 });
    this.loadData();
  }

  onClearAllFilters(): void {
    this.appliedFilters = ReleaseProductQuarantineFilterChipsUtils.clearAllFilters();
    this.updateFilterChips();
    this.updatePagination({ pageIndex: 0 });
    this.loadData();
  }

  private updateFilterChips(): void {
    if (!this.appliedFilters || Object.keys(this.appliedFilters).length === 0) {
      this.filterChips.set([]);
      return;
    }

    const chips = ReleaseProductQuarantineFilterChipsUtils.createFilterChips(
      this.appliedFilters,
      this.productCodeOptions,
      this.bloodTypeOptions,
      this.warehouseOptions
    );
    this.filterChips.set(chips);
  }

  private releaseProduct(row: QuarantineProduct): void {
    const dialogData: ReleaseDialogData = {
      product: row,
      quarantineType: this.selectedType()
    };

    const dialogRef = this.dialog.open(ReleaseDialog, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: dialogData,
      disableClose: false
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: boolean | null) => {
        if (result === true) {
          // Product was released successfully - reload the list
          this.loadData();
        }
      });
  }

  private viewReasons(row: QuarantineProduct): void {
    const dialogData: ReasonsDialogData = {
      product: row
    };

    const dialogRef = this.dialog.open(ReasonsDialog, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: dialogData,
      disableClose: false
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Optionally reload data if reasons were modified
        // For now, we'll just close the dialog
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset state on chapter change
        this.appliedFilters = null;
        this.filterChips.set([]);
        this.searchForm.reset();
        this.updatePagination({ pageIndex: 0 });
        this.loadData();
      });
  }
}
