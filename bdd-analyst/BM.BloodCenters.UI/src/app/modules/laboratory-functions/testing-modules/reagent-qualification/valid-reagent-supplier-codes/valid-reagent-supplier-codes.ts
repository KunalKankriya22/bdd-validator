import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ChangeDetectorRef,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OverlayModule } from '@angular/cdk/overlay';
import { Subject, takeUntil } from 'rxjs';

import { ValidReagentSupplierCodeService } from './services/valid-reagent-supplier-code.service';
import {
  ValidReagentSupplierCode,
  ValidReagentSupplierCodeQueryDto
} from './models/valid-reagent-supplier-code.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
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
import { AddEditValidReagentSupplierCodeDialog } from './add-edit-valid-reagent-supplier-code-dialog/add-edit-valid-reagent-supplier-code-dialog';
import { ValidReagentSupplierCodeFilterPanel, ValidReagentSupplierCodeFilterValue } from './filter-panel/valid-reagent-supplier-code-filter-panel';
import { ValidReagentSupplierCodeFilterChipsUtils } from './utils/filter-chips.utils';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

@Component({
  selector: 'app-valid-reagent-supplier-codes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditValidReagentSupplierCodeDialog,
    ValidReagentSupplierCodeFilterPanel
  ],
  templateUrl: './valid-reagent-supplier-codes.html',
  styleUrls: ['./valid-reagent-supplier-codes.scss']
})
export class ValidReagentSupplierCodesComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild(DataTable) dataTableComponent!: DataTable;

  private destroy$ = new Subject<void>();

  // Component state
  dataSource: ValidReagentSupplierCode[] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ValidReagentSupplierCode | null = null;

  // Filter panel state
  isFilterOpen = false;
  appliedFilters: ValidReagentSupplierCodeFilterValue | null = null;
  filterChips: FilterChip[] = [];

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: [
      {
        label: 'ADD NEW CODE',
        icon: 'add',
        color: 'primary',
        onClick: () => this.openAddDialog()
      }
    ]
  };

  // Search configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by supplier name or code',
    minLength: 1,
    ariaLabel: 'Search valid reagent supplier codes by name or code',
    searchOnEnterOnly: true,
    debounceTime: 300
  };

  // Data table configuration
  tableConfig: DataTableConfig<ValidReagentSupplierCode> = {
    columns: [
      {
        key: 'supplierCode',
        header: 'Code',
        sortable: true,
        width: '120px'
      },
      {
        key: 'supplierName',
        header: 'Supplier Name',
        sortable: false,
        width: '200px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value: string) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value: string | null) => value ? this.formatDate(value) : ''
      },
      {
        key: 'lastModifyDate',
        header: 'Modification Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value: string | null) => value ? this.formatDate(value) : ''
      },
      {
        key: 'lastModifyUser',
        header: 'User',
        sortable: false,
        width: '120px'
      }
    ],
    rowActions: [
      {
        action: 'edit',
        icon: 'edit',
        label: 'Edit',
        color: 'primary',
        ariaLabel: 'Edit supplier code'
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
      column: 'supplierCode',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No Results to Display',
    noDataIcon: 'edit',
    loadingMessage: 'Loading valid reagent supplier codes...',
    showPagination: true
  };

  // Current query parameters
  private currentQuery: ValidReagentSupplierCodeQueryDto = {
    ShowTerminated: 'N',
    SortColumn: null,
    SortOrder: null
  };

  constructor(
    private service: ValidReagentSupplierCodeService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private pageHeaderService: PageHeaderService
  ) {
    // Update header config dynamically from menu-items API response
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
    // Load initial data with default filters
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle filter panel
   */
  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  /**
   * Apply filters from filter panel
   */
  onApplyFilters(filters: ValidReagentSupplierCodeFilterValue): void {
    this.appliedFilters = filters;

    // Update current query with filter values (convert moment dates to ISO format)
    this.currentQuery = {
      ...this.currentQuery,
      ShowTerminated: filters.showTerminated || 'N',
      EffectiveDatePeriod: filters.effectiveDatePeriod || null,
      EffectiveDate: filters.effectiveDate
        ? DateFieldValidationUtility.serializeDateForApi(filters.effectiveDate)
        : null,
      TerminationDatePeriod: filters.terminationDatePeriod || null,
      TerminationDate: filters.terminationDate
        ? DateFieldValidationUtility.serializeDateForApi(filters.terminationDate)
        : null
    };

    // Generate filter chips using utility
    this.filterChips = ValidReagentSupplierCodeFilterChipsUtils.convertFiltersToChips(filters);

    // Reset pagination and load data
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  /**
   * Remove a specific filter chip
   */
  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = ValidReagentSupplierCodeFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );
    this.filterChips = ValidReagentSupplierCodeFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    // Update query and reload (convert moment dates to ISO format)
    this.currentQuery = {
      ...this.currentQuery,
      ShowTerminated: this.appliedFilters?.showTerminated || 'N',
      EffectiveDatePeriod: this.appliedFilters?.effectiveDatePeriod || null,
      EffectiveDate: this.appliedFilters?.effectiveDate
        ? DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.effectiveDate)
        : null,
      TerminationDatePeriod: this.appliedFilters?.terminationDatePeriod || null,
      TerminationDate: this.appliedFilters?.terminationDate
        ? DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.terminationDate)
        : null
    };
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  /**
   * Clear all filters
   */
  onClearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.currentQuery = {
      ...this.currentQuery,
      ShowTerminated: 'N',
      EffectiveDatePeriod: null,
      EffectiveDate: null,
      TerminationDatePeriod: null,
      TerminationDate: null
    };
    this.tableConfig.pagination!.pageIndex = 0;

    // Close side panel if open
    if (this.sidePanelOpen) {
      this.closeSidePanel();
    }

    this.loadData();
  }

  /**
   * Handle search event
   */
  onSearch(searchTerm: string): void {
    this.currentQuery = {
      ...this.currentQuery,
      SearchKeyword: searchTerm || null
    };

    // Reset pagination
    this.tableConfig.pagination!.pageIndex = 0;

    this.loadData();
  }

  /**
   * Handle page change event
   */
  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  /**
   * Handle sort change event
   */
  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig = {
      column: event.column,
      direction: event.direction
    };

    // Map frontend column names to backend PascalCase column names
    const columnMap: Record<string, string> = {
      'supplierCode': 'SupplierCode',
      'supplierName': 'SupplierName',
      'effDate': 'EffDate',
      'termDate': 'TermDate',
      'lastModifyDate': 'LastModifyDate',
      'lastModifyUser': 'LastModifyUser'
    };

    if (event.direction === 'default') {
      this.currentQuery.SortColumn = null;
      this.currentQuery.SortOrder = null;
    } else {
      this.currentQuery.SortColumn = columnMap[event.column] || event.column;
      this.currentQuery.SortOrder = event.direction === 'A' ? 'ASC' : 'DESC';
    }

    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  /**
   * Handle row action (edit)
   */
  onRowAction(event: TableRowActionEvent<ValidReagentSupplierCode>): void {
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }

    if (event.action === 'edit') {
      this.openEditDialog(event.row);
    }
  }

  /**
   * Load data from API
   */
  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const pageSize = this.tableConfig.pagination!.pageSize;
    const pageIndex = this.tableConfig.pagination!.pageIndex;
    const skip = pageIndex * pageSize;

    this.service
      .getAll(pageSize, skip, this.currentQuery)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;

          // Update first column header to show total count
          if (this.tableConfig.columns && this.tableConfig.columns.length > 0) {
            this.tableConfig.columns[0].header = `Code (${response.totalRecords})`;
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load valid reagent supplier codes. Please try again.';
        }
      });
  }

  /**
   * Open add dialog
   */
  openAddDialog(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  /**
   * Open edit dialog
   */
  openEditDialog(data: ValidReagentSupplierCode): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = data;
    this.sidePanelOpen = true;
  }

  /**
   * Close side panel
   */
  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  /**
   * Handle save success from dialog
   * @param addAnother - true if "Add and Create Another" was clicked, false for regular save
   */
  onSaveSuccess(addAnother: boolean): void {
    // Reload data to refresh the table
    this.loadData();

    // Only close panel if NOT adding another record
    if (!addAnother) {
      this.closeSidePanel();
    }
  }

  /**
   * Handle mode change from dialog
   */
  onModeChange(mode: 'add' | 'edit'): void {
    this.sidePanelMode = mode;
  }

  /**
   * Format date to DD-MON-YYYY
   */
  private formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message
   */
  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 7000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
