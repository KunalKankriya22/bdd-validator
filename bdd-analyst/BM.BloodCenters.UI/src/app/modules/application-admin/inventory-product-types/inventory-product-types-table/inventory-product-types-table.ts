import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, forkJoin, of, map, catchError, Observable } from 'rxjs';

import { InventoryProductTypesService } from '../services/inventory-product-types.service';
import {
  InventoryProductTypeModel,
  InventoryProductTypeParamsDto,
  InventoryProductTypeFilterValue
} from '../models/inventory-product-types.model';
import { VALIDATION_INVENTORY_PRODUCT_TYPES } from 'src/app/core/constants/validation.constants';
import { HeaderService } from '@shared/services/header.service';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { InventoryProductTypesFilterPanel } from '../inventory-product-types-filter-panel/inventory-product-types-filter-panel';
import { AddEditInventoryProductType } from '../add-edit-inventory-product-type/add-edit-inventory-product-type';
import { MatDialog } from '@angular/material/dialog';
import { ModifyPriceDialog } from '../modify-price-dialog/modify-price-dialog';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { InventoryProductTypesFilterChipsUtils } from '../utils/inventory-product-types-filter-chips.utils';

@Component({
  selector: 'app-inventory-product-types-table',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips,
    AddEditInventoryProductType
  ],
  templateUrl: './inventory-product-types-table.html',
  styleUrls: ['./inventory-product-types-table.scss']
})
export class InventoryProductTypesTable implements OnInit, OnDestroy, OnChanges {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;

  readonly VALIDATION = VALIDATION_INVENTORY_PRODUCT_TYPES.INVENTORY_PRODUCT_TYPES_TABLE;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 1,
    ariaLabel: '',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<InventoryProductTypeModel> = {
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
      column: 'shortName',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: InventoryProductTypeFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: InventoryProductTypeModel[] = [];
  requestState: InventoryProductTypeParamsDto = {};
  selectedRows: InventoryProductTypeModel[] = [];
  selectedIds = new Set<any>();
  isAllSelected = false;
  isAllPagesSelected = false;

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';
  isFilterOpen = false;

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: InventoryProductTypeModel | null = null;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  currentYear: number = new Date().getFullYear();

  constructor(
    private inventoryProductTypesService: InventoryProductTypesService,
    private router: Router,
    private overlay: Overlay,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();

    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            {
              label: 'Home',
              link: '/home'
            },
            {
              label: pageData.title,
              link: null
            }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle,
          actions: [{
            label: 'ADD NEW RECORD',
            icon: 'add',
            color: 'accent',
            ariaLabel: 'Add new Inventory Product Type record',
            onClick: () => this.createRecord()
          }]
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadInventoryProductTypesData();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset search
        this.searchText = '';
        if (this.searchBarComponent) {
          this.searchBarComponent.clearSearch();
        }

        // Reset filters
        this.appliedFilters = null;
        this.filterChips = [];
        this.requestState = {};

        // Close filter overlay if open
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }

        // Close side panel if open
        this.sidePanelOpen = false;
        this.sidePanelMode = 'add';
        this.sidePanelData = null;

        // Reset selection state
        this.selectedIds.clear();
        this.selectedRows = [];
        this.isAllSelected = false;
        this.isAllPagesSelected = false;

        // Reset sorting to default
        if (this.tableConfig.sortConfig) {
          this.tableConfig.sortConfig = {
            column: 'shortName',
            direction: 'default'
          };
        }

        // Reset pagination
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
          this.tableConfig.pagination.totalRecords = 0;
        }

        // Clear data and errors
        this.dataSource = [];
        this.hasError = false;
        this.errorMessage = '';

        // Reload data for new chapter
        this.loadInventoryProductTypesData();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataSource']) {
      this.updateSelectionFromIds();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.isFilterOpen = false;
    }
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/home'
        },
        {
          label: '',
          link: null
        }
      ],
      title: '',
      subtitle: '',
      actions: [{
        label: 'ADD NEW RECORD',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new Inventory Product Type record',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by type, short name, or description',
      minLength: 1,
      ariaLabel: 'Search by type, short name, or description',
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
        column: 'shortName',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No Inventory Product Types available to display',
      loadingMessage: 'Loading Inventory Product Types data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<InventoryProductTypeModel>[] {
    return [
      {
        key: 'productType',
        header: 'Type',
        sortable: false,
        width: '90px'
      },
      {
        key: 'shortName',
        header: 'Short Name',
        sortable: true,
        width: '140px'
      },
      {
        key: 'description',
        header: 'Description',
        width: '200px'
      },
      {
        key: 'price',
        header: 'Price',
        width: '100px',
        valueFormatter: (value) => value !== null && value !== undefined ? `$${value.toFixed(2)}` : '-'
      },
      {
        key: 'lifeSpan',
        header: 'Lifespan',
        width: '100px',
        valueFormatter: (value, row) => {
          if (value !== null && value !== undefined) {
            return row.lifeSpanInd ? `${value} ${row.lifeSpanInd}` : value.toString();
          }
          return '-';
        }
      },
      {
        key: 'sortSequence',
        header: 'Sequence',
        width: '100px',
        valueFormatter: (value) => value !== null && value !== undefined ? value.toString() : '-'
      },
      {
        key: 'productGrouping',
        header: 'Grouping',
        width: '100px'
      },
      {
        key: 'aboOnly',
        header: 'ABO Only',
        width: '110px',
        valueFormatter: (value) => value ? 'Yes' : 'No'
      },
      {
        key: 'rhRequired',
        header: 'Rh Required',
        width: '120px',
        valueFormatter: (value) => value ? 'Yes' : 'No'
      },
      {
        key: 'importAllowed',
        header: 'Import Allowed',
        width: '170px',
        valueFormatter: (value) => value ? 'Yes' : 'No'
      },
      {
        key: 'pooledProduct',
        header: 'Pooled Product',
        width: '140px',
        valueFormatter: (value) => value ? 'Yes' : 'No'
      },
      {
        key: 'specialInventory',
        header: 'Special Inventory',
        width: '150px',
        valueFormatter: (value) => value ? 'Yes' : 'No'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '130px',
        valueFormatter: (value) => value ? this.formatDateDisplay(new Date(value)) : '-'
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (value) => value ? this.formatDateDisplay(new Date(value)) : '-'
      },
      {
        key: 'modificationDate',
        header: 'Modification Date',
        width: '160px',
        valueFormatter: (value) => value ? this.formatDateDisplay(new Date(value)) : '-'
      }
    ];
  }

  private getRowActions(): RowAction<InventoryProductTypeModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit Inventory Product Type',
        ariaLabel: 'Edit Inventory Product Type {{productType}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  loadInventoryProductTypesData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    this.inventoryProductTypesService
      .getInventoryProductTypes(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.updateSelectionFromIds();
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load Inventory Product Types data. Please try again later.';
        }
      });
  }

  onSearch(searchText: string): void {
    // Trim whitespace and validate
    const trimmedSearchText = searchText?.trim() || '';

    // Don't search if input is empty or contains only spaces
    if (!trimmedSearchText) {
      this.searchText = '';
      this.requestState.SearchKeyword = undefined;
    } else {
      this.searchText = trimmedSearchText;
      this.requestState.SearchKeyword = trimmedSearchText;
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadInventoryProductTypesData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadInventoryProductTypesData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    // Map frontend column names to backend column names (PascalCase)
    const columnMapping: Record<string, string> = {
      'shortName': 'ShortName',
      'productType': 'ProductType',
      'description': 'Description',
      'price': 'StandardPrice',
      'lifeSpan': 'LifeSpan',
      'sortSequence': 'SortSequence',
      'productGrouping': 'ProductGrouping',
      'effectiveDate': 'EffectiveDate',
      'terminationDate': 'TerminationDate',
      'modificationDate': 'LastModifiedDate'
    };

    // Set both sort column and direction for the API
    const backendColumnName = columnMapping[event.column] || event.column;
    this.requestState.SortBy =
      event.direction === 'default' ? undefined : backendColumnName;
    this.requestState.SortDirection =
      event.direction === 'default' ? undefined : event.direction;

    this.loadInventoryProductTypesData();
  }

  onRowAction(event: TableRowActionEvent<InventoryProductTypeModel>): void {
    if (event.action === 'edit') {
      this.editInventoryProductType(event.row);
    }
  }

  // Selection methods
  toggleSelectAll(): void {
    if (this.isAllPagesSelected || this.isAllSelected) {
      // Clear all selections
      this.selectedIds.clear();
      this.selectedRows = [];
      this.isAllSelected = false;
      this.isAllPagesSelected = false;
    } else {
      // Select all items across all pages
      this.isAllPagesSelected = true;
      this.isAllSelected = true;

      // Add current page items to selected IDs
      this.dataSource.forEach(row => {
        const id = this.getRowId(row);
        if (id !== undefined) {
          this.selectedIds.add(id);
        }
      });

      this.selectedRows = [...this.dataSource];
    }
  }

  toggleRowSelection(row: InventoryProductTypeModel): void {
    const id = this.getRowId(row);

    if (id === undefined) {
      // Fallback to object reference if no selection key is configured
      const index = this.selectedRows.indexOf(row);
      if (index > -1) {
        this.selectedRows.splice(index, 1);
      } else {
        this.selectedRows.push(row);
      }
    } else {
      // Use ID-based selection
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id);
        const index = this.selectedRows.findIndex(r => this.getRowId(r) === id);
        if (index > -1) {
          this.selectedRows.splice(index, 1);
        }
      } else {
        this.selectedIds.add(id);
        this.selectedRows.push(row);
      }
    }

    this.updateSelectionState();
  }

  isRowSelected(row: InventoryProductTypeModel): boolean {
    const id = this.getRowId(row);
    if (id !== undefined) {
      return this.selectedIds.has(id);
    }
    return this.selectedRows.includes(row);
  }

  private getRowId(row: InventoryProductTypeModel): any {
    return row.productType;
  }

  private updateSelectionFromIds(): void {
    if (this.isAllPagesSelected) {
      // When all pages are selected, automatically add current page items to selectedIds
      this.dataSource.forEach(row => {
        const id = this.getRowId(row);
        if (id !== undefined) {
          this.selectedIds.add(id);
        }
      });
      this.selectedRows = [...this.dataSource];
    } else {
      // Rebuild selectedRows from current page data based on selectedIds
      this.selectedRows = this.dataSource.filter(row => {
        const id = this.getRowId(row);
        return id !== undefined && this.selectedIds.has(id);
      });
    }

    this.updateSelectionState();
  }

  private updateSelectionState(): void {
    const totalRecords = this.tableConfig.pagination?.totalRecords || this.dataSource.length;
    this.isAllSelected = this.selectedRows.length === this.dataSource.length && this.dataSource.length > 0;
    this.isAllPagesSelected = this.selectedIds.size === totalRecords && totalRecords > 0;
  }

  public clearSelection(): void {
    this.selectedIds.clear();
    this.selectedRows = [];
    this.isAllSelected = false;
    this.isAllPagesSelected = false;
  }

  isModifyPriceDisabled(): boolean {
    return this.selectedIds.size === 0;
  }

  modifyPrice(): void {
    if (this.selectedIds.size === 0) {
      this.snackBar.open(
        'Please select at least one record to modify price.',
        'DISMISS',
        { duration: 3000 }
      );
      return;
    }

    // Fetch all selected products from all pages
    this.isLoading = true;
    this.getAllSelectedProducts().subscribe({
      next: (allSelectedProducts: InventoryProductTypeModel[]) => {
        this.isLoading = false;

        if (allSelectedProducts.length === 0) {
          this.snackBar.open(
            'Unable to load selected records. Please try again.',
            'DISMISS',
            { duration: 3000 }
          );
          return;
        }

        const dialogRef = this.dialog.open(ModifyPriceDialog, {
          width: '700px',
          disableClose: true,
          data: {
            selectedProducts: allSelectedProducts  // ✅ All pages
          }
        });

        dialogRef.afterClosed()
          .pipe(takeUntil(this.destroy$))
          .subscribe(updatedProducts => {
            if (updatedProducts && updatedProducts.length > 0) {
              this.updateMultiplePrices(updatedProducts);
            }
          });
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open(
          'Error loading selected records. Please try again.',
          'DISMISS',
          { duration: 5000 }
        );
      }
    });
  }

  /**
   * Fetches full product objects for all selected IDs across all pages
   */
  private getAllSelectedProducts(): Observable<InventoryProductTypeModel[]> {
    // If all selections are on current page, return immediately
    const allOnCurrentPage = Array.from(this.selectedIds).every(id =>
      this.dataSource.some(row => this.getRowId(row) === id)
    );

    if (allOnCurrentPage) {
      return of(this.selectedRows);
    }

    // Otherwise, fetch all selected records via API
    const selectedProductTypes = Array.from(this.selectedIds);

    return forkJoin(
      selectedProductTypes.map(productType =>
        this.inventoryProductTypesService.getInventoryProductTypeByCode(productType as string)
      )
    ).pipe(
      map(responses => responses.filter(r => r !== null)),
      catchError(() => of([]))
    );
  }

  private updateMultiplePrices(products: InventoryProductTypeModel[]): void {
    // TODO: Implement bulk update API call
    // For now, update each product individually
    let completedUpdates = 0;
    let successfulUpdates = 0;
    const totalUpdates = products.length;

    products.forEach(product => {
      this.inventoryProductTypesService
        .updateInventoryProductType(product.productType, {
          productType: product.productType,
          shortName: product.shortName,
          description: product.description,
          standardPrice: product.price || undefined, // Backend expects 'standardPrice'
          lifeSpan: product.lifeSpan || undefined,
          lifeSpanIndicator: product.lifeSpanInd,
          sortSequence: product.sortSequence || undefined,
          productGrouping: product.productGrouping,
          aboOnly: product.aboOnly,
          poolProduct: product.pooledProduct, // Backend expects 'poolProduct'
          specialProductType: product.specialInventory, // Backend expects 'specialProductType'
          shipAnyRh: product.rhRequired, // Backend expects 'shipAnyRh'
          aboFlag: product.importAllowed, // Backend expects 'aboFlag'
          maximumTemp: product.tempMax || undefined, // Backend expects 'maximumTemp'
          minimumTemp: product.tempMin || undefined, // Backend expects 'minimumTemp'
          effectiveDate: product.effectiveDate,
          terminationDate: product.terminationDate || undefined
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            completedUpdates++;
            successfulUpdates++;
            if (completedUpdates === totalUpdates) {
              // All updates completed, refresh the table
              this.loadInventoryProductTypesData();
              // Clear selection
              this.clearSelection();
              // Show success message
              this.snackBar.open(
                `Price updated successfully for ${successfulUpdates} Inventory Product type${successfulUpdates !== 1 ? 's' : ''}`,
                'Close',
                {
                  duration: 5000,
                  horizontalPosition: 'end',
                  verticalPosition: 'top',
                  panelClass: ['success-snackbar']
                }
              );
            }
          },
          error: () => {
            completedUpdates++;
            if (completedUpdates === totalUpdates) {
              // Refresh table even if some updates failed
              this.loadInventoryProductTypesData();
              // Show appropriate message
              if (successfulUpdates > 0) {
                this.snackBar.open(
                  `Price updated successfully for ${successfulUpdates} Inventory Product type${successfulUpdates !== 1 ? 's' : ''}`,
                  'Close',
                  {
                    duration: 5000,
                    horizontalPosition: 'center',
                    verticalPosition: 'bottom',
                    panelClass: ['success-snackbar']
                  }
                );
              } else {
                this.snackBar.open(
                  'Failed to update prices. Please try again.',
                  'Close',
                  {
                    duration: 5000,
                    horizontalPosition: 'end',
                    verticalPosition: 'top',
                    panelClass: ['error-snackbar']
                  }
                );
              }
            }
          }
        });
    });
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editInventoryProductType(record: InventoryProductTypeModel): void {
    this.isLoading = true;

    this.inventoryProductTypesService
      .getInventoryProductTypeByCode(record.productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: latestRecord => {
          this.isLoading = false;
          this.sidePanelMode = 'edit';
          this.sidePanelData = latestRecord;
          this.sidePanelOpen = true;
        },
        error: () => {
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage = `Failed to load data for product type ${record.productType}. Please try again.`;
        }
      });
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadInventoryProductTypesData();
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy =
      this.overlay.position()
        .flexibleConnectedTo(this.tableCard)
        .withPositions([
          {
            originX: 'start',
            originY: 'top',
            overlayX: 'start',
            overlayY: 'top',
            offsetX: 8,
            offsetY: 64
          }
        ])
        .withPush(true)
        .withViewportMargin(20)
        .withFlexibleDimensions(true)
        .withGrowAfterOpen(false);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      width: '340px',
      minWidth: '280px',
      maxWidth: '340px'
    });

    const portal = new ComponentPortal(InventoryProductTypesFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });
  }

  applyFilters(filters: InventoryProductTypeFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = InventoryProductTypesFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      ProductGrouping: filters.productGrouping || undefined,
      SpecialInventory: filters.specialInventory !== null ? filters.specialInventory : undefined,
      PriceRange: filters.priceRange || undefined,
      Price: filters.price !== null ? filters.price : undefined,
      EffectiveDateFrom: filters.effectiveDateFrom || undefined,
      EffectiveDateTo: filters.effectiveDateTo || undefined,
      TerminationDateFrom: filters.terminationDateFrom || undefined,
      TerminationDateTo: filters.terminationDateTo || undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadInventoryProductTypesData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = InventoryProductTypesFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = InventoryProductTypesFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadInventoryProductTypesData();
  }

  hasActiveFilters(): boolean {
    return InventoryProductTypesFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { ProductGrouping, SpecialInventory, PriceRange, Price, EffectiveDateFrom, EffectiveDateTo, TerminationDateFrom, TerminationDateTo, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadInventoryProductTypesData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { ProductGrouping, SpecialInventory, PriceRange, Price, EffectiveDateFrom, EffectiveDateTo, TerminationDateFrom, TerminationDateTo, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      ProductGrouping: this.appliedFilters.productGrouping || undefined,
      SpecialInventory: this.appliedFilters.specialInventory !== null ? this.appliedFilters.specialInventory : undefined,
      PriceRange: this.appliedFilters.priceRange || undefined,
      Price: this.appliedFilters.price !== null ? this.appliedFilters.price : undefined,
      EffectiveDateFrom: this.appliedFilters.effectiveDateFrom || undefined,
      EffectiveDateTo: this.appliedFilters.effectiveDateTo || undefined,
      TerminationDateFrom: this.appliedFilters.terminationDateFrom || undefined,
      TerminationDateTo: this.appliedFilters.terminationDateTo || undefined
    };
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.createRecord();
    }

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
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }

    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }

  formatDateDisplay(date: Date): string {
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  formatDateString(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    return this.formatDateDisplay(new Date(dateString));
  }

  /**
   * Smart tooltip: only show if text is actually overflowing
   */
  showTooltipIfOverflowing(element: HTMLElement, tooltip: MatTooltip): void {
    tooltip.disabled = element.scrollWidth <= element.clientWidth;
  }
}
