import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OverlayModule } from '@angular/cdk/overlay';
import { Subject, takeUntil } from 'rxjs';

import { ValidDonationTypeProcedureCodesService } from './services/valid-donation-type-procedure-codes.service';
import {
  ValidDonationTypeProcedureCodesModel,
  ValidDonationTypeProcedureCodesParamsDto,
  ValidDonationTypeProcedureCodesFilterValue
} from './models/valid-donation-type-procedure-codes.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidDonationTypeProcedureCodesFilterPanel } from './valid-donation-type-procedure-codes-filter-panel/valid-donation-type-procedure-codes-filter-panel';
import { ValidDonationTypeProcedureCodesFilterChipsUtils } from './utils/filter-chips.utils';
import { AddEditAttributeMapping } from './add-edit-attribute-mapping/add-edit-attribute-mapping';

@Component({
  selector: 'app-valid-donation-type-procedure-codes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    ValidDonationTypeProcedureCodesFilterPanel,
    AddEditAttributeMapping
  ],
  templateUrl: './valid-donation-type-procedure-codes.html',
  styleUrls: ['./valid-donation-type-procedure-codes.scss']
})
export class ValidDonationTypeProcedureCodesComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

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

  tableConfig: DataTableConfig<ValidDonationTypeProcedureCodesModel> = {
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
      column: 'donationType',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: ValidDonationTypeProcedureCodesFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: ValidDonationTypeProcedureCodesModel[] = [];
  requestState: ValidDonationTypeProcedureCodesParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ValidDonationTypeProcedureCodesModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();

  constructor(
    private validDonationTypeProcedureCodesService: ValidDonationTypeProcedureCodesService
  ) {
    this.initializeConfigurations();
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/'
        },
        {
          label: 'Valid Donation Type/Procedure Codes',
          link: null
        }
      ],
      title: 'Valid Donation Type/Procedure Codes',
      subtitle: 'Configure valid donation and procedure combinations with their required attributes.',
      actions: [{
        label: 'ADD NEW ATTRIBUTE MAPPING',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new attribute mapping',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Donation Type, Procedure Code, Attribute Group, Attribute Code',
      minLength: 3,
      ariaLabel: 'Search by donation type, procedure code, attribute group, or attribute code'
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
        column: 'donationType',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No attribute mappings available to display',
      loadingMessage: 'Loading attribute mapping data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<ValidDonationTypeProcedureCodesModel>[] {
    return [
      {
        key: 'donationType',
        header: 'Donation Type',
        sortable: true,
        width: '130px'
      },
      {
        key: 'procedureCode',
        header: 'Procedure Code',
        width: '150px'
      },
      {
        key: 'attribGroup',
        header: 'Attribute Group',
        width: '150px'
      },
      {
        key: 'attribCode',
        header: 'Attribute Code',
        width: '140px'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'modificationDate',
        header: 'Modification Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<ValidDonationTypeProcedureCodesModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit attribute mapping',
        ariaLabel: 'Edit attribute mapping {{donationType}}/{{procedureCode}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 10);

    const take = this.tableConfig.pagination?.pageSize || 10;

    this.validDonationTypeProcedureCodesService
      .getValidDonationTypeProcedureCodes(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: ValidDonationTypeProcedureCodesModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load attribute mapping data. Please try again.';
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
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    // Handle sort direction - event.direction is 'A' | 'D' | 'default'
    if (event.direction === 'default') {
      this.requestState.sort = undefined;
    } else {
      // Send 'A' or 'D' directly to match the SQL query parameter
      this.requestState.sort = event.direction;
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<ValidDonationTypeProcedureCodesModel>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: ValidDonationTypeProcedureCodesModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  closeFilter(): void {
    this.isFilterOpen = false;
  }

  applyFilters(filters: ValidDonationTypeProcedureCodesFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = ValidDonationTypeProcedureCodesFilterChipsUtils.convertFiltersToChips(filters);

    // Update request state with filter values
    if (filters.donationType) {
      this.requestState.donationType = filters.donationType;
    } else {
      delete this.requestState.donationType;
    }

    if (filters.procedureCode) {
      this.requestState.procedureCode = filters.procedureCode;
    } else {
      delete this.requestState.procedureCode;
    }

    if (filters.attributeGroup) {
      this.requestState.attribGroup = filters.attributeGroup;
    } else {
      delete this.requestState.attribGroup;
    }

    // Handle effective date with period (Before/After)
    if (filters.effectiveDate && filters.periodType1) {
      const formattedDate = this.formatDateForAPI(filters.effectiveDate);
      if (filters.periodType1 === 'Before') {
        this.requestState.effectiveDateBefore = formattedDate;
        delete this.requestState.effectiveDateAfter;
      } else {
        this.requestState.effectiveDateAfter = formattedDate;
        delete this.requestState.effectiveDateBefore;
      }
    } else {
      delete this.requestState.effectiveDateBefore;
      delete this.requestState.effectiveDateAfter;
    }

    // Reset to first page when applying filters
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.closeFilter();
    this.loadData();
  }

  /**
   * Format date for API (ISO datetime string format)
   * Returns format like: "2020-12-31T10:30:16.590Z"
   */
  private formatDateForAPI(date: Date): string {
    const d = new Date(date);
    return d.toISOString();
  }

  removeFilterChip(chipKey: string): void {
    this.appliedFilters = ValidDonationTypeProcedureCodesFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = ValidDonationTypeProcedureCodesFilterChipsUtils.convertFiltersToChips(
      this.appliedFilters
    );

    // Update request state
    switch (chipKey) {
      case 'donationType':
        delete this.requestState.donationType;
        break;
      case 'procedureCode':
        delete this.requestState.procedureCode;
        break;
      case 'attributeGroup':
        delete this.requestState.attribGroup;
        break;
      case 'effectiveDate':
        delete this.requestState.effectiveDateBefore;
        delete this.requestState.effectiveDateAfter;
        break;
      case 'terminationDate':
        // Termination date not used in new API
        break;
    }

    // Reset to first page when removing filters
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    // Clear all filter-related request state
    delete this.requestState.donationType;
    delete this.requestState.procedureCode;
    delete this.requestState.attribGroup;
    delete this.requestState.effectiveDateBefore;
    delete this.requestState.effectiveDateAfter;

    // Reset to first page
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  get hasActiveFilters(): boolean {
    return ValidDonationTypeProcedureCodesFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Alt+C: Create new record
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.createRecord();
    }

    // Alt+S: Focus search field
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    // Alt+F: Toggle filter panel
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.toggleFilter();
    }

    // Escape: Close side panel or filter if open
    if (event.key === 'Escape') {
      if (this.sidePanelOpen) {
        event.preventDefault();
        this.closeSidePanel();
      } else if (this.isFilterOpen) {
        event.preventDefault();
        this.closeFilter();
      }
    }
  }
}
