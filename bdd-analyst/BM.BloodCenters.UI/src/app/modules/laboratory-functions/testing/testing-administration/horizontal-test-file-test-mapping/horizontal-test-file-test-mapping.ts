import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';

import { HtfMappingService } from './services/htf-mapping.service';
import { HtfMappingDto, HtfMappingQueryDto } from './models/htf-mapping.model';
import { AddEditHtfMapping } from './add-edit-htf-mapping/add-edit-htf-mapping';

export function getHtfMappingPaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Rows per page:';
  return paginatorIntl;
}

@Component({
  selector: 'app-horizontal-test-file-test-mapping',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
    AddEditHtfMapping
  ],
  providers: [
    { provide: MatPaginatorIntl, useFactory: getHtfMappingPaginatorIntl }
  ],
  templateUrl: './horizontal-test-file-test-mapping.html',
  styleUrls: ['./horizontal-test-file-test-mapping.scss']
})
export class HorizontalTestFileTestMappingComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild(DataTable) dataTableComponent!: DataTable<HtfMappingDto>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by test ID',
    minLength: 1,
    ariaLabel: 'Search by test ID',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  tableConfig: DataTableConfig<HtfMappingDto> = {
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
      column: 'sequenceNo',
      direction: 'A'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No test mappings available to display',
    loadingMessage: 'Loading test mappings...',
    showPagination: true
  };

  dataSource: HtfMappingDto[] = [];
  requestState: HtfMappingQueryDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: HtfMappingDto | null = null;

  private pendingFocusToPanel = false;
  private destroy$ = new Subject<void>();

  constructor(
    private htfService: HtfMappingService,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private liveAnnouncer: LiveAnnouncer
  ) {
    this.initializeConfigurations();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.subscribeToChapterChanges();
  }

  ngAfterViewChecked(): void {
    if (this.pendingFocusToPanel && this.sidePanelOpen) {
      this.pendingFocusToPanel = false;
      const panel = document.querySelector('.side-panel-container');
      const firstFocusable = panel?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: '',
      actions: [{
        label: 'ADD NEW TEST MAPPING',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new test mapping (Alt+C)',
        onClick: () => this.createRecord()
      }]
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
        column: 'sequenceNo',
        direction: 'A'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      enableRowHighlight: false,
      emptyMessage: 'No test mappings available to display',
      loadingMessage: 'Loading test mappings...',
      showPagination: true,
      noDataIcon:"edit"
    };
  }

  private getTableColumns(): TableColumn<HtfMappingDto>[] {
    return [
      {
        key: 'sequenceNo',
        header: 'Sequence Number',
        sortable: true,
        width: '180px'
      },
      {
        key: 'headerName',
        header: 'Test ID',
        width: '200px'
      },
      {
        key: 'startPos',
        header: 'Start Position',
        width: '150px'
      },
      {
        key: 'endPos',
        header: 'End Position',
        width: '150px'
      }
    ];
  }

  private getRowActions(): RowAction<HtfMappingDto>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit test mapping',
        ariaLabel: 'Edit test mapping {{headerName}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const take = this.tableConfig.pagination?.pageSize || 25;
    const skip = (this.tableConfig.pagination?.pageIndex || 0) * take;

    const sortColumnMap: Record<string, string> = {
      sequenceNo: 'SequenceNo',
      headerName: 'HeaderName',
      startPos: 'StartPos',
      endPos: 'EndPos'
    };

    const sortDirectionMap: Record<string, string> = {
      A: 'ASC',
      D: 'DESC'
    };

    const rawColumn = this.tableConfig.sortConfig?.column || null;
    const rawDirection = this.tableConfig.sortConfig?.direction;

    const query: HtfMappingQueryDto = {
      searchKeyword: this.requestState.searchKeyword || null,
      sortColumn: rawColumn ? (sortColumnMap[rawColumn] || rawColumn) : null,
      sortOrder: rawDirection && rawDirection !== 'default'
        ? (sortDirectionMap[rawDirection] || rawDirection)
        : null
    };

    this.htfService
      .getAll(take, skip, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
          this.liveAnnouncer.announce(`Loaded ${response.totalRecords} test mapping${response.totalRecords !== 1 ? 's' : ''}`);
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load test mappings. Please try again.';
          this.liveAnnouncer.announce('Failed to load test mappings');
        }
      });
  }

  onSearch(searchText: string): void {
    this.requestState.searchKeyword = searchText || null;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.closeSidePanel();
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.closeSidePanel();
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;
    this.closeSidePanel();
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<HtfMappingDto>): void {
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }

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
    this.pendingFocusToPanel = true;
  }

  editRecord(record: HtfMappingDto): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
    this.pendingFocusToPanel = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadData();
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
        this.requestState = {};
        this.closeSidePanel();
        this.loadData();
      });
  }
}
