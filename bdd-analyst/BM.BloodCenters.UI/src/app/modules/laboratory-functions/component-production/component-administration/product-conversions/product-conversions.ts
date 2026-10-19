import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

import { ProductConversionsService } from './services/product-conversions.service';
import { ProductConversionModel, ProductConversionQueryDto } from './models/product-conversions.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { AddEditProductConversion } from './add-edit-product-conversion/add-edit-product-conversion';
import { formatTableDate } from '@shared/utils/date-format.util';

export function getProductConversionsPaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Rows per page:';
  return paginatorIntl;
}

@Component({
  selector: 'app-product-conversions',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
    AddEditProductConversion,
  ],
  providers: [
    { provide: MatPaginatorIntl, useFactory: getProductConversionsPaginatorIntl },
  ],
  templateUrl: './product-conversions.html',
  styleUrls: ['./product-conversions.scss'],
})
export class ProductConversionsComponent implements OnInit, OnDestroy {
  @ViewChild(DataTable) dataTableComponent!: DataTable<ProductConversionModel>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    actions: [],
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Source Code, Source Description, Target Code or Target Description',
    minLength: 2,
    ariaLabel: 'Search by Source Code, Source Description, Target Code or Target Description',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true,
  };

  tableConfig: DataTableConfig<ProductConversionModel> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: {
      column: 'sourceProductCode',
      direction: 'default',
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No product conversions available to display',
    loadingMessage: 'Loading product conversions...',
    showPagination: true,
  };

  dataSource: ProductConversionModel[] = [];
  requestState: ProductConversionQueryDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ProductConversionModel | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private productConversionsService: ProductConversionsService,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [{ label: 'Home', link: '/home' }],
      title: '',
      actions: [
        {
          label: 'ADD NEW',
          color: 'accent',
          ariaLabel: 'Add new product conversion',
          onClick: () => this.createRecord(),
        },
      ],
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true,
      },
      sortConfig: {
        column: 'sourceProductCode',
        direction: 'default',
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      enableRowHighlight: false,
      emptyMessage: 'No product conversions available to display',
      loadingMessage: 'Loading product conversions...',
      showPagination: true,
    };
  }

  private getTableColumns(): TableColumn<ProductConversionModel>[] {
    return [
      {
        key: 'sourceProductCode',
        header: 'Source Product',
        width: '120px',
      },
      {
        key: 'sourceProductDesc',
        header: 'Source Product Description',
        width: '250px',
      },
      {
        key: 'targetProductCode',
        header: 'Target Product',
        width: '120px',
      },
      {
        key: 'targetProductDesc',
        header: 'Target Product Description',
        width: '250px',
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '150px',
        valueFormatter: (value) => formatTableDate(value),
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (value) => value ? formatTableDate(value) : '--',
      },
    ];
  }

  private getRowActions(): RowAction<ProductConversionModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit product conversion',
        ariaLabel: 'Edit product conversion {{sourceProductCode}} to {{targetProductCode}}',
        color: 'default',
        action: 'edit',
      },
    ];
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const pageNumber = (this.tableConfig.pagination?.pageIndex || 0) + 1;
    const pageSize = this.tableConfig.pagination?.pageSize || 25;

    this.productConversionsService
      .getProductConversions(pageNumber, pageSize, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load product conversions. Please try again.';
        },
      });
  }

  onSearch(searchText: string): void {
    this.requestState.searchKeyword = searchText || null;

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

    this.requestState.sortColumn = event.column;
    this.requestState.sortOrder =
      event.direction === 'default' ? null : event.direction;

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<ProductConversionModel>): void {
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }

    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: ProductConversionModel): void {
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

  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.createRecord();
    }

    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadData();
      });
  }
}
