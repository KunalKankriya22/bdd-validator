import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';

import { OrderClassCodesService } from './services/order-class-codes.service';
import {
  OrderClassCodesModel,
  OrderClassCodesParamsDto
} from './models/order-class-codes.model';

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

import { AddEditOrderClass } from './add-edit-order-class/add-edit-order-class';

@Component({
  selector: 'app-order-class-codes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    AddEditOrderClass
  ],
  templateUrl: './order-class-codes.html',
  styleUrls: ['./order-class-codes.scss']
})
export class OrderClassCodesComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;

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

  tableConfig: DataTableConfig<OrderClassCodesModel> = {
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
      column: '',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  dataSource: OrderClassCodesModel[] = [];
  requestState: OrderClassCodesParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: OrderClassCodesModel | null = null;
  editingRow: OrderClassCodesModel | null = null;

  private destroy$ = new Subject<void>();
  currentYear: number = new Date().getFullYear();

  constructor(
    private orderClassCodesService: OrderClassCodesService,
    private router: Router,
    private headerService: HeaderService,
    private pageHeaderService: PageHeaderService
  ) {
    this.initializeConfigurations();

    // Watch for page header data from API and update header config dynamically
    // Falls back to default hardcoded values if API doesn't return them
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        const title = pageData.title || this.defaultTitle;
        const subtitle = pageData.subtitle || this.defaultSubtitle;
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: title, link: null }
          ],
          title: title,
          subtitle: subtitle
        };
      }
    });

    // Watch for chapterId to become available before loading data
    // Effect will trigger on initial load and whenever user changes chapter
    effect(() => {
      const chapterId = this.headerService.chapterId();
      if (chapterId) {
        // Reset to first page when chapter changes
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
        }
        this.loadData();
      }
    });
  }

  ngOnInit(): void {
    // Data will be loaded by effect once chapterId is available
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Default hardcoded values for title and subtitle (fallback if API doesn't return them)
  private readonly defaultTitle = 'Order Class Codes';
  private readonly defaultSubtitle = 'Define standardized order urgency categories that determine priority ranking, and response time.';

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: this.defaultTitle, link: null }
      ],
      title: this.defaultTitle,
      subtitle: this.defaultSubtitle,
      actions: [{
        label: 'ADD NEW RECORD',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new record',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Order Class or Description',
      minLength: 2,
      ariaLabel: 'Search order classes by code or description',
      searchOnEnterOnly: true,
      alwaysShowTooltip: true
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
      emptyMessage: 'No order classes available to display',
      loadingMessage: 'Loading order class data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<OrderClassCodesModel>[] {
    return [
      {
        key: 'orderClass',
        header: 'Order Class',
        sortable: true,
        width: '12%'
      },
      {
        key: 'description',
        header: 'Description',
        width: '24%'
      },
      {
        key: 'priority',
        header: 'Priority',
        sortable: true,
        width: '10%',
        valueFormatter: (value) => this.formatPriority(value)
      },
      {
        key: 'hours',
        header: 'Hours',
        width: '10%',
        valueFormatter: (value) => this.formatNumber(value)
      },
      {
        key: 'displayFlag',
        header: 'Display',
        width: '10%',
        valueFormatter: (value) => this.formatDisplayFlag(value)
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '15%',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '15%',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
    // Total: 96%, leaving ~4% for actions column
  }

  private formatPriority(priority: number | undefined): string {
    return priority !== undefined && priority !== null ? priority.toString() : '-';
  }

  private formatNumber(num: number | undefined): string {
    return num !== undefined && num !== null ? num.toString() : '-';
  }

  private formatDisplayFlag(value: string | undefined): string {
    if (!value) return '-';
    return value === 'Y' ? 'Yes' : 'No';
  }

  private formatDate(date: Date | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<OrderClassCodesModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit order class',
        ariaLabel: 'Edit order class {{orderClass}}',
        color: 'default',
        action: 'edit',
        visible: (row: OrderClassCodesModel) => !!(row as any).editable
      }
    ];
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.updateEmptyMessage();

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    this.orderClassCodesService
      .getOrderClassCodes(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: OrderClassCodesModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
          this.hasError = false;
        },
        error: (error: any) => {
          console.error('Error loading order class data:', error);
          this.dataSource = [];
          this.tableConfig.pagination!.totalRecords = 0;
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load order class data. Please try again.';
        }
      });
  }

  onSearch(searchText: string): void {
    // Trim whitespace and validate - don't search with whitespace-only
    const trimmedSearch = searchText?.trim() || '';
    this.requestState.searchKeyword = trimmedSearch || undefined;
    this.searchText = trimmedSearch;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.updateEmptyMessage();
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
    if (event.column !== 'orderClass' && event.column !== 'priority') {
      return;
    }

    // Update table config with the sort state
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }

    // Clear both sort parameters first
    this.requestState.sort = undefined;
    this.requestState.prioritySort = undefined;

    // Set the appropriate sort parameter based on column and direction
    // event.direction is already in API format: 'A' | 'D' | 'default'
    if (event.direction !== 'default') {
      if (event.column === 'orderClass') {
        this.requestState.sort = event.direction;
      } else if (event.column === 'priority') {
        this.requestState.prioritySort = event.direction;
      }
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<OrderClassCodesModel>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.editingRow = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: OrderClassCodesModel): void {
    const normalizedRecord: OrderClassCodesModel = {
      orderClass: record.orderClass ?? '',
      chapterId: record.chapterId ?? '',
      description: record.description ?? '',
      priority: record.priority ?? 0,
      hours: record.hours ?? 0,
      displayFlag: record.displayFlag ?? 'N',
      effectiveDate: record.effectiveDate ?? null,
      terminationDate: record.terminationDate ?? null,
      modificationDate: record.modificationDate ?? null,
      editable: record.editable
    };

    this.sidePanelMode = 'edit';
    this.sidePanelData = normalizedRecord;
    this.editingRow = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.editingRow = null;
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
    }
  }

  /**
   * Update empty message based on active search
   */
  private updateEmptyMessage(): void {
    const hasSearch = !!this.requestState.searchKeyword;

    if (hasSearch) {
      this.tableConfig.emptyMessage = 'No records found';
    } else {
      this.tableConfig.emptyMessage = 'No order class codes records available to display';
    }
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

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
