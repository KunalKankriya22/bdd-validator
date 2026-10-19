import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  HostListener,
  ViewChild,
  ElementRef,
  effect,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { ProductStorageDefinitionService } from './services/product-storage-definition.service';
import {
  ProductStorageListDto,
  ProductStorageQueryDto,
  ProductStorageFilterValue,
  LovOption
} from './models/product-storage-definition.model';

import { DataTable } from '@shared/components/data-table/data-table';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import {
  DataTableConfig,
  TableSortEvent,
  TableRowActionEvent,
  TablePageEvent
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ProductStorageFilterChipsUtils } from './utils/filter-chips.utils';
import { ProductStorageDefinitionFilterPanel } from './product-storage-definition-filter-panel/product-storage-definition-filter-panel';
import { AddEditProductStorageComponent } from './add-edit-product-storage/add-edit-product-storage';
import moment from 'moment';

@Component({
  selector: 'app-product-storage-definition',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditProductStorageComponent
  ],
  templateUrl: './product-storage-definition.html',
  styleUrls: ['./product-storage-definition.scss']
})
export class ProductStorageDefinitionComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild(DataTable) dataTableRef!: DataTable<ProductStorageListDto>;
  @ViewChild('filterButton', { read: ElementRef }) filterButton!: ElementRef<HTMLElement>;

  /** WCAG 2.4.3: reference to the side panel child component for focus management */
  @ViewChild(AddEditProductStorageComponent) addEditPanelRef?: AddEditProductStorageComponent;

  headerConfig!: PageHeaderConfig;
  searchConfig!: SearchBarConfig;
  tableConfig!: DataTableConfig<ProductStorageListDto>;

  appliedFilters: ProductStorageFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: ProductStorageListDto[] = [];
  isLoading = false;
  searchText = '';

  productTypeLovOptions = signal<LovOption[]>([]);
  warehouseLovOptions = signal<LovOption[]>([]);
  deviceTypeLovOptions = signal<LovOption[]>([]);

  // Filter panel options (from actual table data)
  filterProductTypeOptions = signal<LovOption[]>([]);
  filterWarehouseOptions = signal<LovOption[]>([]);
  filterDeviceTypeOptions = signal<LovOption[]>([]);

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ProductStorageListDto | null = null;
  /** WCAG 2.4.3: stores the element that triggered panel open so focus can be restored on close */
  private sidePanelTriggerEl: HTMLElement | null = null;

  isFilterPanelOpen = false;
  private filterOverlayRef: OverlayRef | null = null;
  private overlayClose$ = new Subject<void>();

  private totalRecords = 0;
  private sortColumn = 'ProductType';
  private sortOrder = 'ASC';
  private pageSize = 25;
  private pageIndex = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private productStorageService: ProductStorageDefinitionService,
    private overlay: Overlay,
    private headerService: HeaderService,
    private pageHeaderService: PageHeaderService
  ) {
    this.headerConfig = {
      breadcrumbs: [{ label: 'Home', link: '/home' }],
      title: '',
      subtitle: ''
    };

    effect(() => {
      const data = this.pageHeaderService.pageHeaderData();
      if (data) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: data.title, link: null }
          ],
          title: data.title,
          subtitle: data.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.initTableConfig();
    this.initSearchConfig();
    this.loadFormDropdowns();
    this.subscribeToChapterChanges();
    this.loadData();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeFilterOverlay();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    if (event.altKey && event.key === 'c') {
      event.preventDefault();
      if (!this.sidePanelOpen) {
        this.openAddPanel();
      }
    }
    if (event.altKey && event.key === 'f') {
      event.preventDefault();
      if (!this.isFilterPanelOpen) {
        this.openFilterPanel();
      }
    }
    if (event.key === 'Escape') {
      if (this.isFilterPanelOpen) {
        this.closeFilterOverlay();
      } else if (this.sidePanelOpen) {
        this.closeSidePanel();
      }
    }
  }

  private initTableConfig(): void {
    this.tableConfig = {
      columns: [
        { key: 'productType', header: 'Product Type', width: '110px' },
        { key: 'warehouseId', header: 'Warehouse', width: '100px' },
        { key: 'deviceType', header: 'Device Type', width: '110px' },
        { key: 'deviceDescription', header: 'Device Description', width: '180px', truncate: true },
        { key: 'number', header: 'Number', width: '90px' },
        { key: 'trayCapacity', header: 'Tray Capacity', width: '110px' },
        { key: 'effectiveDate', header: 'Effective Date', width: '130px' },
        { key: 'terminationDate', header: 'Termination Date', width: '130px' },
        {
          key: 'lastModifiedDate',
          header: 'Last Modified Date',
          width: '170px',
          valueFormatter: (value: string | null) => this.formatDateTimePST(value)
        }
      ],
      rowActions: [
        {
          icon: 'edit',
          action: 'edit',
          visible: () => true,
          // WCAG 4.1.2: ariaLabel provides an accessible name for the icon-only action button.
          // {{productType}} is replaced at render time by data-table's getActionAriaLabel().
          ariaLabel: 'Edit {{productType}} product storage'
        }
      ],
      pagination: {
        pageSize: this.pageSize,
        pageIndex: this.pageIndex,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      showPagination: true,
      emptyMessage: 'No product storage records available to display',
      noDataIcon: 'edit',
      enableRowHighlight: true,
      showActionsAsMenu: false,
      caption: 'Product storage definitions',
      rowLabelKey: 'productType'
    };
  }

  private initSearchConfig(): void {
    this.searchConfig = {
      placeholder: 'Search by product type or warehouse',
      minLength: 1,
      searchOnEnterOnly: true,
      alwaysShowTooltip: true
    };
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.hasSearched = true;
        this.dataSource = [];
        this.totalRecords = 0;
        this.searchText = '';
        this.appliedFilters = null;
        this.filterChips = [];
        this.pageIndex = 0;
        this.closeSidePanel();
        this.closeFilterOverlay();
        this.productTypeLovOptions.set([]);
        this.warehouseLovOptions.set([]);
        this.deviceTypeLovOptions.set([]);
        this.loadFormDropdowns();
        this.loadData();
      });
  }

  hasSearched = true;

  private loadFormDropdowns(): void {
    this.productStorageService.getProductTypeLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.productTypeLovOptions.set(res.data ?? []),
        error: () => this.productTypeLovOptions.set([])
      });

    this.productStorageService.getWarehouseLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.warehouseLovOptions.set(res.data ?? []),
        error: () => this.warehouseLovOptions.set([])
      });

    this.productStorageService.getDeviceTypeLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.deviceTypeLovOptions.set(res.data ?? []),
        error: () => this.deviceTypeLovOptions.set([])
      });
  }

  private loadData(): void {
    this.isLoading = true;
    const skip = this.pageIndex * this.pageSize;

    const queryDto: ProductStorageQueryDto = {
      searchKeyword: this.searchText || null,
      sortColumn: this.sortColumn,
      sortOrder: this.sortOrder,
      productType: this.appliedFilters?.productType ?? null,
      warehouseId: this.appliedFilters?.warehouseCode ?? null,
      deviceType: this.appliedFilters?.deviceType ?? null,
      effectiveDate: this.appliedFilters?.effectiveDate ?? null,
      effectiveDatePeriod: this.appliedFilters?.effectivePeriod ?? null,
      terminationDate: this.appliedFilters?.terminationDate ?? null,
      terminationDatePeriod: this.appliedFilters?.terminationPeriod ?? null
    };

    this.productStorageService.getProductStorageList(this.pageSize, skip, queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.dataSource = result.data;
          this.totalRecords = result.totalRecords;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = this.totalRecords;
            this.tableConfig.pagination.pageIndex = this.pageIndex;
          }
          this.updateFilterOptionsFromData(result.data);
          this.isLoading = false;
        },
        error: () => {
          this.dataSource = [];
          this.totalRecords = 0;
          this.isLoading = false;
        }
      });
  }

  private updateFilterOptionsFromData(data: ProductStorageListDto[]): void {
    // Extract distinct product types
    const productTypes = Array.from(new Set(data.map(item => item.productType)))
      .filter(Boolean)
      .map(code => ({ code, description: code }))
      .sort((a, b) => a.code.localeCompare(b.code));

    // Extract distinct warehouses
    const warehouses = Array.from(new Set(data.map(item => item.warehouseId)))
      .filter(Boolean)
      .map(code => {
        const item = data.find(d => d.warehouseId === code);
        return {
          code,
          description: item?.warehouseDescription || code
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code));

    // Extract distinct device types
    const deviceTypes = Array.from(new Set(data.map(item => item.deviceType)))
      .filter(Boolean)
      .map(code => {
        const item = data.find(d => d.deviceType === code);
        return {
          code,
          description: item?.deviceDescription || code
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code));

    this.filterProductTypeOptions.set(productTypes);
    this.filterWarehouseOptions.set(warehouses);
    this.filterDeviceTypeOptions.set(deviceTypes);
  }

  /**
   * Format date in DD-MMM-YYYY format
   * Parses the date as-is without timezone conversion
   */
  private formatDateTimePST(isoDate: string | null): string {
    if (!isoDate) return '-';
    const date = moment(isoDate);
    if (!date.isValid()) return isoDate;
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.date()).padStart(2, '0');
    const month = MONTHS[date.month()];
    const year = date.year();
    return `${day}-${month}-${year}`;
  }

  onSearch(searchText: string): void {
    this.searchText = searchText?.trim() || '';
    this.pageIndex = 0;
    this.loadData();
  }

  onSortChange(_event: TableSortEvent): void {
    // Sorting handled server-side if needed
  }

  onPageChange(event: TablePageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageSize = event.pageSize;
      this.tableConfig.pagination.pageIndex = event.pageIndex;
    }
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<ProductStorageListDto>): void {
    if (event.action === 'edit') {
      this.openEditPanel(event.row);
    }
  }

  openAddPanel(): void {
    // WCAG 2.4.3: save triggering element so focus can be restored when panel closes
    this.sidePanelTriggerEl = document.activeElement as HTMLElement;
    this.loadFormDropdowns();
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    if (this.dataTableRef) this.dataTableRef.activeRow = null;
    // WCAG 2.4.3: move focus to panel's close button after Angular renders the component
    setTimeout(() => this.addEditPanelRef?.focusFirstElement(), 0);
  }

  openEditPanel(row: ProductStorageListDto): void {
    // WCAG 2.4.3: save triggering element so focus can be restored when panel closes
    this.sidePanelTriggerEl = document.activeElement as HTMLElement;
    this.sidePanelMode = 'edit';
    this.sidePanelData = row;
    this.sidePanelOpen = true;
    // Ensure row stays highlighted
    if (this.dataTableRef) {
      this.dataTableRef.activeRow = row;
    }
    // WCAG 2.4.3: move focus to panel's close button after Angular renders the component
    setTimeout(() => this.addEditPanelRef?.focusFirstElement(), 0);
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    if (this.dataTableRef) this.dataTableRef.activeRow = null;
    // WCAG 2.4.3: restore focus to the element that triggered the panel
    const triggerEl = this.sidePanelTriggerEl;
    this.sidePanelTriggerEl = null;
    setTimeout(() => triggerEl?.focus(), 0);
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  openFilterPanel(): void {
    if (this.isFilterPanelOpen || !this.filterButton) return;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterButton)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 }
      ])
      .withFlexibleDimensions(true)
      .withPush(true);

    this.filterOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: 350,
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    const portal = new ComponentPortal(ProductStorageDefinitionFilterPanel);
    const componentRef = this.filterOverlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.productTypeOptions.set(this.filterProductTypeOptions());
    componentRef.instance.warehouseCodeOptions.set(this.filterWarehouseOptions());
    componentRef.instance.deviceTypeOptions.set(this.filterDeviceTypeOptions());

    componentRef.instance.apply
      .pipe(takeUntil(this.overlayClose$))
      .subscribe((filters: ProductStorageFilterValue) => {
        this.appliedFilters = filters;
        this.filterChips = ProductStorageFilterChipsUtils.convertFiltersToChips(filters);
        this.pageIndex = 0;
        this.closeFilterOverlay();
        this.loadData();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => this.closeFilterOverlay());

    this.filterOverlayRef.backdropClick()
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => this.closeFilterOverlay());

    this.isFilterPanelOpen = true;
    // WCAG 2.4.3: move focus into the filter panel after the overlay renders
    setTimeout(() => componentRef.instance.focusCloseButton(), 0);
  }

  private closeFilterOverlay(): void {
    this.overlayClose$.next();
    if (this.filterOverlayRef) {
      this.filterOverlayRef.dispose();
      this.filterOverlayRef = null;
    }
    this.isFilterPanelOpen = false;
    // WCAG 2.4.3: restore focus to the trigger button when the filter panel closes
    if (this.filterButton?.nativeElement) {
      this.filterButton.nativeElement.focus();
    }
  }

  onRemoveChip(chipKey: string): void {
    this.appliedFilters = ProductStorageFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips = ProductStorageFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.pageIndex = 0;
    this.loadData();
  }

  onClearAllChips(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.pageIndex = 0;
    this.loadData();
  }
}
