import { Component, OnInit, OnDestroy, HostListener, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { ValidScanInterfaceService } from './services/valid-scan-interface.service';
import { HeaderService } from '@shared/services/header.service';
import {
  ValidScanInterfaceModel,
  ValidScanInterfaceParamsDto
} from './models/valid-scan-interface.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import { AddEditValidScanInterface } from './add-edit-valid-scan-interface/add-edit-valid-scan-interface';

@Component({
  selector: 'app-valid-scan-interfaces',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    AddEditValidScanInterface
  ],
  templateUrl: './valid-scan-interfaces.html',
  styleUrls: ['./valid-scan-interfaces.scss']
})
export class ValidScanInterfaces implements OnInit, OnDestroy {
  @ViewChild(DataTable) dataTableComponent!: DataTable<ValidScanInterfaceModel>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  tableConfig: DataTableConfig<ValidScanInterfaceModel> = {
    columns: [],
    rowActions: [],
    sortConfig: {
      column: 'scanType',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: false,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: false
  };

  dataSource: ValidScanInterfaceModel[] = [];
  requestState: ValidScanInterfaceParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ValidScanInterfaceModel | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private validScanInterfaceService: ValidScanInterfaceService,
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
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.loadTableData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeSidePanel();
        this.requestState = {};
        this.tableConfig.sortConfig = { column: 'scanType', direction: 'default' };
        this.dataSource = [];
        this.hasError = false;
        this.errorMessage = '';
        this.loadTableData();
      });
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/home'
        }
      ],
      title: '',
      subtitle: '',
      actions: [{
        label: 'ADD NEW SCALE CONFIGURATION',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new scale configuration',
        onClick: () => this.createRecord()
      }]
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      sortConfig: {
        column: 'scanType',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: false,
      enableRowHighlight: false,
      emptyMessage: 'No scale configurations available to display',
      loadingMessage: 'Loading scale configuration data...',
      showPagination: false
    };
  }

  private getTableColumns(): TableColumn<ValidScanInterfaceModel>[] {
    return [
      {
        key: 'scanType',
        header: 'Scan Type',
        sortable: true,
        width: '150px'
      },
      {
        key: 'startCount',
        header: 'Leading Character Count',
        width: '130px'
      },
      {
        key: 'startCode',
        header: 'Leading Characters',
        width: '150px',
        cellClass: 'preserve-whitespace'
      },
      {
        key: 'stopSize',
        header: 'Trailing Character Count',
        width: '130px'
      },
      {
        key: 'stopCode',
        header: 'Trailing Characters',
        width: '150px',
        cellClass: 'preserve-whitespace'
      },
      {
        key: 'stringSize',
        header: 'String Size',
        width: '100px'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '150px',
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

  private getRowActions(): RowAction<ValidScanInterfaceModel>[] {
    return [
      {
        icon: 'edit',
        label: 'Edit scale configuration',
        ariaLabel: 'Edit scale configuration',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private formatDate(date: Date | null): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  loadTableData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.validScanInterfaceService
      .getValidScanInterfaces(this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.dataSource = response.data;


          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading valid scan interfaces:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load scale configuration data. Please try again.';
        }
      });
  }


  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    if (event.direction === 'default') {
      this.requestState.sort = undefined;
    } else {
      this.requestState.sort = event.direction;
    }

    this.loadTableData();
  }

  onRowAction(event: TableRowActionEvent<ValidScanInterfaceModel>): void {
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
  }

  editRecord(record: ValidScanInterfaceModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }
  }

  onSaveSuccess(): void {
    this.loadTableData();
  }

  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Alt+C: Create new record
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.createRecord();
    }

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
