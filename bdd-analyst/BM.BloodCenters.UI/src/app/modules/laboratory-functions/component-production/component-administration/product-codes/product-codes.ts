import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, ElementRef, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { ProductCodesService } from './services/product-codes.service';
import { ProductCode, ProductCodeParamsDto } from './models/product-codes.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
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
import { ProductCodesFilterPanel, ProductCodeFilterValue } from './filter-panel/product-codes-filter-panel';
import { ProductCodeFilterChipsUtils } from './utils/filter-chips.utils';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { AddEditProductDialogComponent } from './add-edit-product-dialog/add-edit-product-dialog';

@Component({
  selector: 'app-product-codes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    ProductCodesFilterPanel,
    AddEditProductDialogComponent
  ],
  templateUrl: './product-codes.html',
  styleUrls: ['./product-codes.scss']
})
export class ProductCodesComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild(DataTable) dataTableComponent!: DataTable<ProductCode>;

  private readonly pageHeaderService = inject(PageHeaderService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: '',
    actions: [
      {
        label: 'ADD NEW PRODUCT',
        icon: 'add',
        onClick: () => this.onAddProduct(),
        color: 'primary',
        ariaLabel: 'Add new product code'
      }
    ]
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Product Code, Description',
    minLength: 1,
    ariaLabel: 'Search product codes',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<ProductCode> = {
    columns: [
      {
        key: 'productCode',
        header: 'Product Code',
        sortable: true,
        width: '120px'
      },
      {
        key: 'productType',
        header: 'Product Type',
        sortable: false,
        width: '120px'
      },
      {
        key: 'productDesc',
        header: 'Description',
        sortable: false,
        minWidth: '200px'
      },
      {
        key: 'productFormula',
        header: 'Formula',
        sortable: false,
        minWidth: '250px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        width: '160px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        width: '160px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ],
    rowActions: [
      {
        icon: 'edit',
        action: 'edit',
        ariaLabel: 'Edit product code'
      },
      {
        icon: 'visibility',
        action: 'view',
        ariaLabel: 'View product code details'
      }
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'productCode',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No product codes found',
    noDataIcon: 'edit',
    loadingMessage: 'Loading product codes...',
    showPagination: true
  };

  dataSource: ProductCode[] = [];
  requestState: ProductCodeParamsDto = {};

  appliedFilters: ProductCodeFilterValue | null = null;
  filterChips: FilterChip[] = [];
  isFilterOpen = false;

  isLoading = false;
  hasError = false;
  searchText = '';
  hasLoadedData = false;

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' | 'view' = 'add';
  sidePanelData: ProductCode | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: ProductCodesService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
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
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip = this.tableConfig.pagination!.pageIndex * this.tableConfig.pagination!.pageSize;
    const take = this.tableConfig.pagination!.pageSize;

    this.service.getProductCodes(take, skip, this.requestState).subscribe({
      next: (response) => {
        this.dataSource = response.data;
        // Update totalRecords - use response.total if available, otherwise use data length for single page
        this.tableConfig.pagination!.totalRecords = response.total || response.data.length;

        this.isLoading = false;
        this.hasLoadedData = true;
        this.hasError = false;

        // Force change detection by creating new config reference
        this.tableConfig = { ...this.tableConfig };
      },
      error: (error) => {
        this.hasError = true;
        this.isLoading = false;
        this.showError('Failed to load product codes');
      }
    });
  }

  onSearch(keyword: string): void {
    this.searchText = keyword;
    this.requestState.searchKeyword = keyword || undefined;
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    this.tableConfig.pagination!.pageSize = event.pageSize;
    this.tableConfig.pagination!.pageIndex = event.pageIndex;
    this.loadData();
  }

  onSortChange(event: { column: string; direction: 'A' | 'D' | 'default' }): void {
    if (event.column === 'productCode') {
      this.tableConfig.sortConfig = {
        column: event.column,
        direction: event.direction
      };

      if (event.direction === 'default') {
        this.requestState.sortColumn = undefined;
        this.requestState.sortOrder = undefined;
      } else {
        this.requestState.sortColumn = 'ProductCode';
        this.requestState.sortOrder = event.direction === 'A' ? 'ASC' : 'DESC';
      }

      this.tableConfig.pagination!.pageIndex = 0;
      this.loadData();
    }
  }

  onRowAction(event: TableRowActionEvent<ProductCode>): void {
    // Highlight the selected row
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }

    if (event.action === 'edit') {
      this.onEditProduct(event.row);
    } else if (event.action === 'view') {
      this.onViewProduct(event.row);
    }
  }

  onAddProduct(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  onEditProduct(product: ProductCode): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = product;
    this.sidePanelOpen = true;
  }

  onViewProduct(product: ProductCode): void {
    // Navigate to view page (like other pages)
    this.router.navigate([
      '/laboratory-functions/component-production/component-administration/product-codes',
      product.productCode
    ]);
  }

  onDialogClosed(result: { success: boolean }): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    if (result.success) {
      this.showSuccess(
        this.sidePanelMode === 'add'
          ? 'Product code created successfully'
          : 'Product code updated successfully'
      );
      this.loadData();
    }
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  onApplyFilters(filters: ProductCodeFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = ProductCodeFilterChipsUtils.convertFiltersToChips(filters);

    // Convert filter values to API params
    // Backend expects: effectiveDate + effectivePeriod (AFTER/BEFORE) format
    const effDate = filters.effectiveDate
      ? (DateFieldValidationUtility.serializeDateForApi(filters.effectiveDate) ?? null)
      : null;
    const termDate = filters.terminationDate
      ? (DateFieldValidationUtility.serializeDateForApi(filters.terminationDate) ?? null)
      : null;

    this.requestState = {
      ...this.requestState,
      productType: filters.productType ?? undefined,
      effectiveDate: effDate,
      effectivePeriod: filters.effectiveDatePeriod ?? null,
      terminationDate: termDate,
      terminationPeriod: filters.terminationDatePeriod ?? null
    };

    // Reset to first page when filtering
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.isFilterOpen = false;
    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = ProductCodeFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips = ProductCodeFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    // Update request state
    this.onApplyFilters(this.appliedFilters || {
      productType: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
  }

  onClearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.requestState = {
      searchKeyword: this.requestState.searchKeyword
    };
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  get isSearchAndFilterDisabled(): boolean {
    return !this.hasLoadedData;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private handleLoadError(error: any): void {
    const errorResponse = error?.error?.errorResponse || error?.error;
    const errorCode = errorResponse?.errorCode || error?.error?.errorCode;
    const errorMessage = errorResponse?.error || errorResponse?.message || error?.error?.message || error?.message || 'Failed to load product codes';

    const displayMessage = errorCode
      ? `Error ${errorCode}: ${errorMessage}`
      : errorMessage;

    this.showError(displayMessage);
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';
    return moment(date).format('DD-MMM-YYYY').toUpperCase();
  }
}
