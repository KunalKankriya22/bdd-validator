import { Component, OnInit, OnDestroy, ViewChild, ElementRef, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule, NgModel } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';

import { SetupInventoryLevelsApiService } from './services/setup-inventory-levels-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';

import {
  SetInventoryLevelDto,
  SetInventoryLevelDisplay,
  SetInventoryLevelQueryDto,
  FilterValue,
  InventoryClassLOV
} from './models/setup-inventory-levels.model';

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

import { SetupInventoryLevelsFilterPanel } from './filter-panel/setup-inventory-levels-filter-panel';
import { AddEditInventoryDialog } from './add-edit-inventory-dialog/add-edit-inventory-dialog';
import { SetupInventoryLevelsFilterChipsUtils } from './utils/filter-chips.utils';

import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';
import moment from 'moment';

@Component({
  selector: 'app-setup-inventory-levels-for-blood-center',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditInventoryDialog
  ],
  templateUrl: './setup-inventory-levels-for-blood-center.html',
  styleUrls: ['./setup-inventory-levels-for-blood-center.scss']
})
export class SetupInventoryLevelsForBloodCenterComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  readonly componentId = `setup-inventory-levels-${SetupInventoryLevelsForBloodCenterComponent.nextId++}`;
  readonly elementId = (name: string) => `${this.componentId}-${name}`;
  readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild(DataTable) dataTableComponent!: DataTable<SetInventoryLevelDisplay>;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild('controlsSection', { read: ElementRef }) controlsSection!: ElementRef<HTMLElement>;
  @ViewChild('inventoryClassModel') inventoryClassModel?: NgModel;

  private service = inject(SetupInventoryLevelsApiService);
  private overlay = inject(Overlay);
  private focusTrapFactory = inject(FocusTrapFactory);
  private loggingService = inject(LoggingService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);
  private menuService = inject(MenuService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by product type',
    minLength: 2,
    ariaLabel: 'Search by product type',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<SetInventoryLevelDisplay> = {
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
    enableRowHighlight: false,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Select inventory class to begin',
    noDataIcon: 'search',
    loadingMessage: 'Loading inventory levels...',
    showPagination: true
  };

  dataSource: SetInventoryLevelDisplay[] = [];
  private allData: SetInventoryLevelDisplay[] = [];
  appliedFilters: FilterValue | null = null;
  filterChips: FilterChip[] = [];

  // Inventory Class selection
  inventoryClassOptions: InventoryClassLOV[] = [];
  filteredInventoryClassOptions: InventoryClassLOV[] = [];
  selectedInventoryClass: string | null = null;
  inventoryClassSearchControl = new FormControl<string>('');

  // State
  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchTerm = '';
  isFilterOpen = false;
  hasRetrieved = false; // Track if data has been loaded

  // Side panel state for Add/Edit
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: SetInventoryLevelDisplay | null = null;

  // Filter panel overlay
  private overlayRef: OverlayRef | null = null;
  private focusTrap: FocusTrap | null = null;
  private lastFocusedElement: HTMLElement | null = null;
  private destroy$ = new Subject<void>();

  constructor() {
    this.initializeTableConfig();

    // Update page header when menu data is loaded
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.SetupInventoryLevelsForBloodCenter]?.path;
        const menuItem = basePath ? this.menuService.findMenuItemByPath(basePath) : null;

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || 'Set minimum and optimal inventory levels by product type.'
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadInventoryClasses();
    this.setupInventoryClassSearch();
    this.subscribeToChapterChanges();
  }

  private setupInventoryClassSearch(): void {
    this.inventoryClassSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredInventoryClassOptions = this.inventoryClassOptions.filter((option) =>
          option.code.toLowerCase().includes(term) ||
          option.codeDesc.toLowerCase().includes(term)
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeFilterPanel();
  }

  private initializeTableConfig(): void {
    const columns: TableColumn<SetInventoryLevelDisplay>[] = [
      {
        key: 'productTypeDesc',
        header: 'Product Type',
        sortable: true,
        width: '250px',
        valueFormatter: (value: string | null, row: SetInventoryLevelDisplay) => {
          if (row.productType && row.productTypeDesc) {
            return `${row.productType} - ${row.productTypeDesc}`;
          }
          return value || row.productType || '-';
        }
      },
      {
        key: 'bloodTypeDesc',
        header: 'ABORh',
        sortable: false,
        width: '120px',
        valueFormatter: (value: string | null) => value || '-'
      },
      {
        key: 'attribCode',
        header: 'Attribute',
        sortable: false,
        width: '150px',
        valueFormatter: (value: string | null) => value || '-'
      },
      {
        key: 'minQty',
        header: 'Minimal Quantity',
        sortable: false,
        width: '150px',
        valueFormatter: (value: number | null) => value != null ? value.toFixed(0) : '-'
      },
      {
        key: 'optQty',
        header: 'Optimal Quantity',
        sortable: false,
        width: '150px',
        valueFormatter: (value: number | null) => value != null ? value.toFixed(0) : '-'
      },
      {
        key: 'effDateDisplay',
        header: 'Effective Date',
        sortable: false,
        width: '140px'
      },
      {
        key: 'termDateDisplay',
        header: 'Termination Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value: string | null) => value || '-'
      }
    ];

    const rowActions: RowAction<SetInventoryLevelDisplay>[] = [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        ariaLabel: 'Edit inventory level',
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

  private loadInventoryClasses(): void {
    this.service.getInventoryClasses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.inventoryClassOptions = data;
          this.filteredInventoryClassOptions = data;
        },
        error: (error) => {
          this.loggingService.error('Failed to load inventory classes', error);
          this.snackbarService.showError('Failed to load inventory classes');
        }
      });
  }

  get inventoryClassCode(): string | null {
    return this.selectedInventoryClass;
  }

  onInventoryClassChange(event: MatSelectChange): void {
    // Automatically load data when inventory class is selected
    const selectedValue = event.value;

    if (!selectedValue) {
      return;
    }

    // Reset state when inventory class changes
    this.selectedInventoryClass = selectedValue;
    this.hasRetrieved = true;
    this.appliedFilters = null;
    this.filterChips = [];
    this.searchTerm = '';
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: 'productType', direction: 'default' },
      pagination: { ...this.tableConfig.pagination!, pageIndex: 0 }
    };
    this.loadData();
  }


  onClearAll(): void {
    this.selectedInventoryClass = null;
    this.hasRetrieved = false;
    this.dataSource = [];
    this.allData = [];
    this.appliedFilters = null;
    this.filterChips = [];
    this.searchTerm = '';
    this.tableConfig = {
      ...this.tableConfig,
      emptyMessage: 'No Results to Display',
      emptySubMessage: 'Select inventory class to begin',
      noDataIcon: 'search',
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0,
        totalRecords: 0
      }
    };
  }

  private loadData(): void {
    if (!this.selectedInventoryClass) {
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    const direction = this.tableConfig.sortConfig?.direction;
    const query: SetInventoryLevelQueryDto = {};

    // Only include sort parameters when sorting is active
    if (direction && direction !== 'default') {
      query.sortColumn = 'ProductType';
      query.sortOrder = direction === 'D' ? 'DESC' : 'ASC';
    }

    // Pass search keyword to API
    if (this.searchTerm) {
      query.searchKeyword = this.searchTerm;
    }

    // Pass date filters to API
    if (this.appliedFilters?.effectiveDate && this.appliedFilters?.effectiveDatePeriod) {
      query.effectiveDatePeriod = this.appliedFilters.effectiveDatePeriod;
      query.effectiveDate = this.appliedFilters.effectiveDate;
    }
    if (this.appliedFilters?.terminationDate && this.appliedFilters?.terminationDatePeriod) {
      query.terminationDatePeriod = this.appliedFilters.terminationDatePeriod;
      query.terminationDate = this.appliedFilters.terminationDate;
    }

    const pageSize = this.tableConfig.pagination!.pageSize;
    const pageIndex = this.tableConfig.pagination!.pageIndex;
    const skip = pageIndex * pageSize;

    this.service
      .getInventoryLevels(this.selectedInventoryClass, query, pageSize, skip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const displayData = this.mapToDisplayModel(response.data);
          this.allData = displayData;

          // Apply only client-side filters (product type, ABORh, attribute)
          let filteredData = displayData;
          if (this.appliedFilters) {
            filteredData = this.applyClientSideFilters(filteredData);
          }
          this.dataSource = filteredData;

          this.tableConfig = {
            ...this.tableConfig,
            emptyMessage: 'No inventory levels available to display',
            emptySubMessage: undefined,
            noDataIcon: 'edit',
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
          this.errorMessage = 'Failed to load inventory levels. Please try again.';
          this.loggingService.error('Failed to load inventory levels', error);
          this.snackbarService.showError('Failed to load inventory levels');
        }
      });
  }

  private mapToDisplayModel(data: SetInventoryLevelDto[]): SetInventoryLevelDisplay[] {
    return data.map(item => ({
      ...item,
      effDateDisplay: this.formatDate(item.effDate),
      termDateDisplay: item.termDate ? this.formatDate(item.termDate) : null,
      lastModifiedDateDisplay: item.lastModifiedDate ? this.formatDateTime(item.lastModifiedDate) : null
    }));
  }

  private formatDate(isoDate: string): string {
    const m = moment(isoDate);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : isoDate;
  }

  private formatDateTime(isoDate: string): string {
    const m = moment(isoDate);
    return m.isValid() ? m.format('DD-MMM-YYYY, HH:mm') + ' PST' : isoDate;
  }

  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.updatePagination({ pageIndex: 0 });
    this.loadData();
  }

  private applyClientSideFilters(data: SetInventoryLevelDisplay[]): SetInventoryLevelDisplay[] {
    if (!this.appliedFilters) {
      return data;
    }

    return data.filter(row => {
      // Product Type filter (client-side)
      if (this.appliedFilters!.productType && row.productType !== this.appliedFilters!.productType) {
        return false;
      }

      // ABORh filter (client-side)
      if (this.appliedFilters!.aborh && row.bloodType !== this.appliedFilters!.aborh) {
        return false;
      }

      // Attribute filter (client-side)
      if (this.appliedFilters!.attribute && row.attribCode !== this.appliedFilters!.attribute) {
        return false;
      }

      return true;
    });
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

  onRowAction(event: TableRowActionEvent<SetInventoryLevelDisplay>): void {
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }

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

    const filterPanelPortal = new ComponentPortal(SetupInventoryLevelsFilterPanel);
    const componentRef = this.overlayRef.attach(filterPanelPortal);

    // Set up focus trap and ARIA attributes
    const panelElement = componentRef.location.nativeElement;
    panelElement.setAttribute('role', 'dialog');
    panelElement.setAttribute('aria-modal', 'true');
    panelElement.setAttribute('aria-labelledby', componentRef.instance.elementId('title'));
    this.focusTrap = this.focusTrapFactory.create(panelElement);
    this.focusTrap.focusInitialElementWhenReady();

    // Pass data to filter panel - use allData (unfiltered) so all options are available
    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.tableData = this.allData;

    // Handle filter panel events
    componentRef.instance.apply.pipe(takeUntil(this.destroy$)).subscribe((filters: FilterValue) => {
      this.applyFilters(filters);
      this.closeFilterPanel();
    });

    componentRef.instance.close.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });

    // Close on backdrop click
    this.overlayRef.backdropClick().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });

    // Close on Escape key
    this.overlayRef.keydownEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event.key === 'Escape') {
          this.closeFilterPanel();
        }
      });
  }

  private closeFilterPanel(): void {
    if (this.focusTrap) {
      this.focusTrap.destroy();
      this.focusTrap = null;
    }
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
    const prevFilters = this.appliedFilters;
    this.appliedFilters = filters;
    this.updateFilterChips();
    this.updatePagination({ pageIndex: 0 });

    // Check if date filters changed - if so, call API
    const dateFiltersChanged =
      prevFilters?.effectiveDate !== filters.effectiveDate ||
      prevFilters?.effectiveDatePeriod !== filters.effectiveDatePeriod ||
      prevFilters?.terminationDate !== filters.terminationDate ||
      prevFilters?.terminationDatePeriod !== filters.terminationDatePeriod;

    if (dateFiltersChanged) {
      this.loadData();
    } else {
      // Only grid filters changed - apply client-side
      let filteredData = this.allData;
      if (this.appliedFilters) {
        filteredData = this.applyClientSideFilters(filteredData);
      }
      this.dataSource = filteredData;
      this.updatePagination({ pageIndex: 0, totalRecords: filteredData.length });
    }
  }

  private updateFilterChips(): void {
    if (!this.appliedFilters || Object.keys(this.appliedFilters).length === 0) {
      this.filterChips = [];
      return;
    }

    this.filterChips = SetupInventoryLevelsFilterChipsUtils.createFilterChips(this.appliedFilters, this.allData);
  }

  onRemoveFilterChip(chipKey: string): void {
    if (!this.appliedFilters) {
      return;
    }

    const prevFilters = this.appliedFilters;
    this.appliedFilters = SetupInventoryLevelsFilterChipsUtils.removeFilter(this.appliedFilters, chipKey);
    this.updateFilterChips();
    this.updatePagination({ pageIndex: 0 });

    // Check if a date filter chip was removed - if so, call API
    const dateFiltersChanged =
      prevFilters?.effectiveDate !== this.appliedFilters?.effectiveDate ||
      prevFilters?.effectiveDatePeriod !== this.appliedFilters?.effectiveDatePeriod ||
      prevFilters?.terminationDate !== this.appliedFilters?.terminationDate ||
      prevFilters?.terminationDatePeriod !== this.appliedFilters?.terminationDatePeriod;

    if (dateFiltersChanged) {
      this.loadData();
    } else {
      let filteredData = this.allData;
      if (this.appliedFilters) {
        filteredData = this.applyClientSideFilters(filteredData);
      }
      this.dataSource = filteredData;
      this.updatePagination({ pageIndex: 0, totalRecords: filteredData.length });
    }
  }

  onClearAllFilters(): void {
    const prevFilters = this.appliedFilters;
    this.appliedFilters = SetupInventoryLevelsFilterChipsUtils.clearAllFilters();
    this.updateFilterChips();
    this.updatePagination({ pageIndex: 0 });

    // Check if date filters were active before clearing
    const hadDateFilters = prevFilters?.effectiveDate || prevFilters?.terminationDate;

    if (hadDateFilters) {
      this.loadData();
    } else {
      let filteredData = this.allData;
      this.dataSource = filteredData;
      this.updatePagination({ pageIndex: 0, totalRecords: filteredData.length });
    }
  }

  openAddDialog(): void {
    if (!this.selectedInventoryClass) {
      this.snackbarService.showError('Please select an inventory class first');
      return;
    }
    this.lastFocusedElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(row: SetInventoryLevelDisplay): void {
    this.lastFocusedElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'edit';
    this.sidePanelData = row;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }
    setTimeout(() => {
      if (this.lastFocusedElement) {
        this.lastFocusedElement.focus();
        this.lastFocusedElement = null;
      }
    }, 0);
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeSidePanel();
        this.closeFilterPanel();

        this.selectedInventoryClass = null;
        this.hasRetrieved = false;
        this.appliedFilters = null;
        this.filterChips = [];
        this.searchTerm = '';
        this.dataSource = [];
        this.allData = [];

        this.inventoryClassSearchControl.setValue('', { emitEvent: false });

        this.tableConfig = {
          ...this.tableConfig,
          emptyMessage: 'No Results to Display',
          emptySubMessage: 'Select inventory class to begin',
          noDataIcon: 'search',
          sortConfig: { column: 'productType', direction: 'default' },
          pagination: {
            ...this.tableConfig.pagination!,
            pageIndex: 0,
            totalRecords: 0
          }
        };

        if (this.inventoryClassModel) {
          this.inventoryClassModel.control.markAsUntouched();
          this.inventoryClassModel.control.markAsPristine();
          this.inventoryClassModel.control.updateValueAndValidity();
        }

        if (this.searchBarComponent) {
          this.searchBarComponent.clearSearch();
        }

        this.loadInventoryClasses();
      });
  }
}
