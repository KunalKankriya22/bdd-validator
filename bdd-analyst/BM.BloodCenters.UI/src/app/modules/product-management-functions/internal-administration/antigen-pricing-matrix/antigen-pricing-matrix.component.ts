import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { AntigenPricingMatrixApiService } from './services/antigen-pricing-matrix-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  AntigenPricingMatrixModel,
  AntigenPricingMatrixQueryParamsDto,
  AntigenPricingMatrixFilterValue,
  AntigenPricingMatrixFormValue
} from './models/antigen-pricing-matrix.model';
import moment from 'moment';

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

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AntigenPricingMatrixFilterChipsUtils } from './utils/filter-chips.utils';
import { AntigenPricingMatrixFilterPanel } from './antigen-pricing-matrix-filter-panel/antigen-pricing-matrix-filter-panel';
import { AddEditAntigenPricingMatrixComponent } from './add-edit-antigen-pricing-matrix/add-edit-antigen-pricing-matrix';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MenuService } from '@shared/services/menu.service';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';

@Component({
  selector: 'app-antigen-pricing-matrix',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditAntigenPricingMatrixComponent
  ],
  templateUrl: './antigen-pricing-matrix.component.html',
  styleUrls: ['./antigen-pricing-matrix.component.scss']
})
export class AntigenPricingMatrixComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild(AddEditAntigenPricingMatrixComponent) addEditComponent?: AddEditAntigenPricingMatrixComponent;
  @ViewChild(DataTable) dataTableComponent!: DataTable<AntigenPricingMatrixModel>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 3,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<AntigenPricingMatrixModel> = {
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
      column: 'antigen',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: AntigenPricingMatrixFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: AntigenPricingMatrixModel[] = [];
  requestState: AntigenPricingMatrixQueryParamsDto = {};
  uniqueServiceCodes: string[] = [];

  isLoading = false;
  hasError = false;
  errorMessage = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: AntigenPricingMatrixModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayClose$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private service: AntigenPricingMatrixApiService,
    private overlay: Overlay,
    private loggingService: LoggingService,
    private snackbarService: SnackbarService,
    private headerService: HeaderService,
    private pageHeaderService: PageHeaderService,
    private menuService: MenuService
  ) {
    this.initializeConfigurations();

    // Update page header config when menu data is loaded
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.AntigenPricingMatrix]?.path;
        const menuItem = basePath ? this.menuService.findMenuItemByPath(basePath) : null;

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || ''
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadInitialFilterOptions();
    this.loadData();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeSidePanel();
        this.closeOverlay();
        this.loadInitialFilterOptions();
        this.loadData();
      });
  }

  private loadInitialFilterOptions(): void {
    this.service
      .getFilterDropdownValues()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.uniqueServiceCodes = [...codes].sort();
        },
        error: (error: unknown) => {
          this.loggingService.error('Error loading filter dropdown options', error);
          this.uniqueServiceCodes = [];
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayClose$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private closeOverlay(): void {
    this.overlayClose$.next();
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [],
      title: '',
      subtitle: '',
      actions: [
        {
          label: 'ADD NEW PRICE',
          icon: 'add',
          onClick: () => this.openAddDialog(),
          color: 'primary',
          matButton: 'raised'
        }
      ]
    };

    this.searchConfig = {
      placeholder: 'Search by service code',
      minLength: 1,
      ariaLabel: 'Search by service code',
      searchOnEnterOnly: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
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
      stickyActionsColumn: true,
      emptyMessage: 'No Results to Display',
      emptySubMessage: 'Please enter search criteria to view results',
      noDataIcon: 'edit',
      loadingMessage: 'Loading antigen pricing matrix...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<AntigenPricingMatrixModel>[] {
    return [
      {
        key: 'code',
        header: 'Service Code',
        sortable: true,
        width: '140px'
      },
      {
        key: 'quantity',
        header: 'Quantity',
        sortable: false,
        width: '100px'
      },
      {
        key: 'price',
        header: 'Price',
        sortable: false,
        width: '100px',
        valueFormatter: (value) => this.formatPrice(value)
      },
      {
        key: 'description',
        header: 'Description',
        sortable: false,
        width: '200px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        width: '160px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'modificationDate',
        header: 'Modification Date',
        sortable: false,
        width: '160px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<AntigenPricingMatrixModel>[] {
    return [
      {
        icon: 'edit',
        ariaLabel: 'Edit price',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private formatPrice(price: number | null | undefined): string {
    if (price === null || price === undefined) return '';
    // Format with thousand separators and 2 decimal places
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    // Build query DTO from request state
    const queryDto: AntigenPricingMatrixQueryParamsDto = {
      searchKeyword: this.requestState.searchKeyword || undefined,
      serviceCode: this.requestState.serviceCode || undefined,
      antigenQty: this.requestState.antigenQty,
      effDatePeriod: this.requestState.effDatePeriod || undefined,
      effDate: this.requestState.effDate || undefined,
      termDatePeriod: this.requestState.termDatePeriod || undefined,
      termDate: this.requestState.termDate || undefined,
      sortColumn: this.requestState.sortColumn || undefined,
      sortOrder: this.requestState.sortOrder || undefined
    };

    this.service
      .getAntigenPricingMatrix(take, skip, queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalCount;

          this.isLoading = false;
        },
        error: (error: unknown) => {
          this.loggingService.error('Error loading antigen pricing matrix', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load data. Please try again.';
        }
      });
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
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    // Implement three-state cycle: default → A → D → default
    let newDirection: 'A' | 'D' | 'default';
    const currentColumn = this.tableConfig.sortConfig?.column;
    const currentDirection = this.tableConfig.sortConfig?.direction;

    // If clicking on a different column or no current column, start with A
    if (!currentColumn || currentColumn !== event.column) {
      newDirection = 'A';
    } else {
      // Cycle through: default → A → D → default
      if (currentDirection === 'default' || !currentDirection) {
        newDirection = 'A';
      } else if (currentDirection === 'A') {
        newDirection = 'D';
      } else {
        newDirection = 'default';
      }
    }

    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = newDirection;
    }
    // Map column key 'code' to API field 'ServiceCode'
    const sortColumn = event.column === 'code' ? 'ServiceCode' : event.column;
    this.requestState.sortColumn = newDirection === 'default' ? undefined : sortColumn;
    this.requestState.sortOrder = newDirection === 'default' ? undefined : (newDirection === 'A' ? 'ASC' : 'DESC');
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<AntigenPricingMatrixModel>): void {
    // Highlight the row when action is clicked
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }

    switch (event.action) {
      case 'edit':
        this.openEditDialog(event.row);
        break;
    }
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.closeOverlay();
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

    const portal = new ComponentPortal(AntigenPricingMatrixFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.serviceCodeOptions = this.uniqueServiceCodes;

    componentRef.instance.apply
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeOverlay();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeOverlay();
      });
  }

  applyFilters(filters: AntigenPricingMatrixFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = AntigenPricingMatrixFilterChipsUtils.convertFiltersToChips(filters);

    // Update request state with service code filter
    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = AntigenPricingMatrixFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = AntigenPricingMatrixFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return AntigenPricingMatrixFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    // Preserve only search and sort state when clearing filters
    this.requestState = {
      searchKeyword: this.requestState.searchKeyword,
      sortColumn: this.requestState.sortColumn,
      sortOrder: this.requestState.sortOrder
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      this.requestState = {
        searchKeyword: this.requestState.searchKeyword,
        sortColumn: this.requestState.sortColumn,
        sortOrder: this.requestState.sortOrder
      };
      return;
    }

    // Update request state with all filter values
    this.requestState = {
      searchKeyword: this.requestState.searchKeyword,
      serviceCode: this.appliedFilters.serviceCode || undefined,
      antigenQty: this.appliedFilters.antigenQty ?? undefined,
      effDatePeriod: this.appliedFilters.effDatePeriod || undefined,
      effDate: this.appliedFilters.effDate || undefined,
      termDatePeriod: this.appliedFilters.termDatePeriod || undefined,
      termDate: this.appliedFilters.termDate || undefined,
      sortColumn: this.requestState.sortColumn,
      sortOrder: this.requestState.sortOrder
    };
  }

  openAddDialog(): void {
    // Close panel first to ensure component is destroyed and recreated with fresh form
    this.sidePanelOpen = false;
    this.sidePanelData = null;

    // Use setTimeout to ensure Angular change detection processes the close first
    setTimeout(() => {
      this.sidePanelMode = 'add';
      this.sidePanelOpen = true;
    });
  }

  openEditDialog(row: AntigenPricingMatrixModel): void {
    // If panel is already open, just update the data (ngOnChanges will handle form patching)
    // If panel is closed, open it with the data
    this.sidePanelMode = 'edit';
    this.sidePanelData = row;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    // Clear row selection when closing the side panel
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }
  }

  onSave(formValue: AntigenPricingMatrixFormValue): void {
    this.saveData(formValue, false);
  }

  onSaveAndCreateAnother(formValue: AntigenPricingMatrixFormValue): void {
    this.saveData(formValue, true);
  }

  private saveData(formValue: AntigenPricingMatrixFormValue, keepOpen: boolean): void {
    // Format price to 2 decimal places
    const formattedPrice = formValue.price !== null && formValue.price !== undefined
      ? parseFloat(formValue.price.toString()).toFixed(2)
      : '0.00';

    if (this.sidePanelMode === 'add') {
      const createDto = {
        code: formValue.code!,
        quantity: formValue.quantity!,
        price: parseFloat(formattedPrice),
        description: formValue.description!,
        effDate: moment(formValue.effDate).format('YYYY-MM-DDTHH:mm:ss'),
        termDate: formValue.termDate ? moment(formValue.termDate).format('YYYY-MM-DDTHH:mm:ss') : undefined
      };

      this.service.createAntigenPricingMatrix(createDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response?.success === false) {
              const errorCode = response?.errorCode || response?.errorResponse?.errorCode;
              const errorMessage = response?.error || response?.errorResponse?.error || response?.message || 'Failed to save. Please try again.';
              const displayMessage = errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;
              this.snackbarService.showError(displayMessage);
              if (this.addEditComponent) {
                this.addEditComponent.resetSubmitting();
                this.addEditComponent.cdr.markForCheck();
              }
              return;
            }

            this.snackbarService.showSuccess('New price has been added successfully.');
            this.loadData();

            if (keepOpen) {
              // Reset the form for creating another
              if (this.addEditComponent) {
                this.addEditComponent.errorMessage = null;
                this.addEditComponent.resetSubmitting();
                this.addEditComponent.form.reset();
                this.addEditComponent.form.markAsPristine();
                this.addEditComponent.form.markAsUntouched();
                this.addEditComponent.cdr.markForCheck();
              }
            } else {
              // Close the panel
              this.closeSidePanel();
            }
          },
          error: (error: unknown) => {
            const body = (error as HttpErrorResponse)?.error;
            const message = body?.message || 'Failed to save. Please try again.';
            if (this.addEditComponent) {
              this.addEditComponent.errorMessage = message;
              this.addEditComponent.resetSubmitting();
              this.addEditComponent.cdr.markForCheck();
            }
          }
        });
    } else {
      const updateDto = {
        code: formValue.code!,
        quantity: formValue.quantity!,
        price: parseFloat(formattedPrice),
        description: formValue.description!,
        effDate: moment(formValue.effDate).format('YYYY-MM-DDTHH:mm:ss'),
        termDate: formValue.termDate ? moment(formValue.termDate).format('YYYY-MM-DDTHH:mm:ss') : undefined
      };

      // For update, we need the original composite key values
      const oldServiceCode = this.sidePanelData!.code;
      const oldAntigenQty = this.sidePanelData!.quantity;
      const oldEffDate = this.sidePanelData!.effDate;

      this.service.updateAntigenPricingMatrix(oldServiceCode, oldAntigenQty, oldEffDate, updateDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response?.success === false) {
              const errorCode = response?.errorCode || response?.errorResponse?.errorCode;
              const errorMessage = response?.error || response?.errorResponse?.error || response?.message || 'Failed to save. Please try again.';
              const displayMessage = errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;
              this.snackbarService.showError(displayMessage);
              if (this.addEditComponent) {
                this.addEditComponent.resetSubmitting();
                this.addEditComponent.cdr.markForCheck();
              }
              return;
            }
            this.snackbarService.showSuccess('Service code has been updated successfully.');
            this.closeSidePanel();
            this.loadData();
          },
          error: (error: unknown) => {
            // Re-enable the buttons so user can try again
            this.addEditComponent?.resetSubmitting();
          }
        });
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.closeOverlay();
    }
  }
}
