import { Component, OnInit, OnDestroy, ViewChild, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Observable, Subject, of, map, startWith, takeUntil, finalize } from 'rxjs';

import { AccessClassByInterCodeService } from './services/access-class-by-inter-code.service';
import {
  AccessClass,
  AccessClassSearchParams,
  InterdictionCodeInfo,
  InterdictionCodeLov
} from './models/access-class-by-inter-code.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import { AttachedUsersDialog, AttachedUsersDialogData } from './attached-users-dialog/attached-users-dialog';
import { InterdictionsDialog, InterdictionsDialogData } from './interdictions-dialog/interdictions-dialog';

@Component({
  selector: 'app-access-class-by-inter-code',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    AttachedUsersDialog,
    InterdictionsDialog
  ],
  templateUrl: './access-class-by-inter-code.html',
  styleUrls: ['./access-class-by-inter-code.scss']
})
export class AccessClassByInterCodeComponent implements OnInit, OnDestroy {
  @ViewChild(DataTable) dataTableRef?: DataTable<AccessClass>;
  @ViewChild('interCodeSelect', { static: false }) interCodeSelect?: MatSelect;

  private readonly service = inject(AccessClassByInterCodeService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: ''
  };

  tableConfig: DataTableConfig<AccessClass> = {
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
      column: 'class',
      direction: 'A'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    showActionsAsMenu: true,
    enableRowHighlight: false,
    emptyMessage: 'No Access Classes Available To Display',
    noDataIcon: 'edit',
    loadingMessage: 'Loading access classes...',
    showPagination: false
  };

  dataSource: AccessClass[] = [];
  requestState: AccessClassSearchParams = {
    sortOrder: 'ASC',
    sortColumn: 'class'
  };

  isLoading = false;
  hasSearched = false;
  hasError = false;
  interdictionInfo: InterdictionCodeInfo | null = null;

  // Interdiction code select with search
  interCodeControl = new FormControl<InterdictionCodeLov | null>(null);
  interCodeSearchControl = new FormControl('');
  allInterdictionCodes: InterdictionCodeLov[] = [];
  filteredInterdictionCodes$!: Observable<InterdictionCodeLov[]>;
  isLoadingLov = false;

  // Side panel state
  showAttachedUsersPanel = false;
  showInterdictionsPanel = false;
  attachedUsersPanelData: AttachedUsersDialogData | null = null;
  interdictionsPanelData: InterdictionsDialogData | null = null;

  private destroy$ = new Subject<void>();

  constructor() {
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
    this.loadInterdictionCodesLov();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.interCodeControl.setValue(null, { emitEvent: false });
        this.interCodeSearchControl.setValue('', { emitEvent: false });
        this.hasSearched = false;
        this.hasError = false;
        this.dataSource = [];
        this.interdictionInfo = null;
        this.closeAllPanels();
        this.loadInterdictionCodesLov();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    this.tableConfig.columns = this.getTableColumns();
    this.tableConfig.rowActions = this.getRowActions();
  }

  private getTableColumns(): TableColumn<AccessClass>[] {
    return [
      {
        key: 'class',
        header: 'Class',
        sortable: true,
        truncate: false
      },
      {
        key: 'description',
        header: 'Description',
        sortable: false,
        truncate: true,
        truncateLength: 50
      },
      {
        key: 'insUser',
        header: 'Ins User',
        sortable: false,
        truncate: false
      },
      {
        key: 'insDate',
        header: 'Ins Date',
        sortable: false,
        truncate: false
      }
    ];
  }

  private getRowActions(): RowAction<AccessClass>[] {
    return [
      {
        label: 'View Attached Users List',
        icon: 'people',
        action: 'view-users'
      },
      {
        label: 'View Interdictions in Class',
        icon: 'list',
        action: 'view-interdictions'
      }
    ];
  }

  private loadInterdictionCodesLov(): void {
    this.isLoadingLov = true;

    this.service.getInterdictionCodesLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.allInterdictionCodes = data;
          this.isLoadingLov = false;
          // Re-setup filter after data loads
          this.setupInterCodeFilter();
        },
        error: () => {
          this.isLoadingLov = false;
          this.filteredInterdictionCodes$ = of([]);
        }
      });
  }

  private setupInterCodeFilter(): void {
    this.filteredInterdictionCodes$ = this.interCodeSearchControl.valueChanges.pipe(
      startWith(''),
      map(searchText => {
        const text = (searchText || '').toLowerCase();
        if (!text) return this.allInterdictionCodes;
        return this.allInterdictionCodes.filter(o =>
          o.interCode.toLowerCase().includes(text) ||
          o.interDesc.toLowerCase().includes(text)
        );
      })
    );
  }

  compareInterCode = (a: InterdictionCodeLov, b: InterdictionCodeLov): boolean => {
    return !!a && !!b && a.interCode === b.interCode;
  };

  onSelectOpened(opened: boolean): void {
    if (opened && this.interCodeSelect) {
      this.interCodeSelect._keyManager?.setActiveItem(-1);
    }
  }

  get isRetrieveDisabled(): boolean {
    return this.isLoading || !this.interCodeControl.value;
  }

  onRetrieve(): void {
    const selected = this.interCodeControl.value;
    if (!selected) {
      return;
    }
    this.hasSearched = true;
    this.interdictionInfo = null;
    this.requestState.interCode = selected.interCode;
    this.loadTableData();
  }

  onSortChange(event: TableSortEvent): void {
    this.requestState.sortOrder = event.direction === 'D' ? 'DESC' : 'ASC';
    this.requestState.sortColumn = event.column;
    this.tableConfig.sortConfig = {
      column: event.column,
      direction: event.direction
    };
    this.loadTableData();
  }

  onRowAction(event: TableRowActionEvent<AccessClass>): void {
    switch (event.action) {
      case 'view-users':
        this.viewAttachedUsers(event.row);
        break;
      case 'view-interdictions':
        this.viewInterdictions(event.row);
        break;
    }
  }

  loadTableData(): void {
    if (!this.hasSearched) {
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    this.service.getAccessClassesByInterCode(this.requestState)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.hasError = false;
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;

          const selected = this.interCodeControl.value;
          if (selected) {
            this.interdictionInfo = {
              code: selected.interCode,
              description: selected.interDesc || '',
              level: selected.viewLevel != null ? String(selected.viewLevel) : ''
            };
          }
        },
        error: () => {
          this.hasError = true;
          this.dataSource = [];
          this.tableConfig.pagination!.totalRecords = 0;
        }
      });
  }

  viewAttachedUsers(accessClass: AccessClass): void {
    this.attachedUsersPanelData = {
      accessClass: accessClass.class,
      description: accessClass.description
    };
    this.showAttachedUsersPanel = true;
    setTimeout(() => { if (this.dataTableRef) this.dataTableRef.activeRow = accessClass; });
  }

  viewInterdictions(accessClass: AccessClass): void {
    this.interdictionsPanelData = {
      accessClass: accessClass.class,
      description: accessClass.description
    };
    this.showInterdictionsPanel = true;
    setTimeout(() => { if (this.dataTableRef) this.dataTableRef.activeRow = accessClass; });
  }

  closeAttachedUsersPanel(): void {
    this.showAttachedUsersPanel = false;
    this.attachedUsersPanelData = null;
    if (!this.showInterdictionsPanel && this.dataTableRef) this.dataTableRef.activeRow = null;
  }

  closeInterdictionsPanel(): void {
    this.showInterdictionsPanel = false;
    this.interdictionsPanelData = null;
    if (!this.showAttachedUsersPanel && this.dataTableRef) this.dataTableRef.activeRow = null;
  }

  closeAllPanels(): void {
    this.showAttachedUsersPanel = false;
    this.attachedUsersPanelData = null;
    this.showInterdictionsPanel = false;
    this.interdictionsPanelData = null;
    if (this.dataTableRef) this.dataTableRef.activeRow = null;
  }
}
