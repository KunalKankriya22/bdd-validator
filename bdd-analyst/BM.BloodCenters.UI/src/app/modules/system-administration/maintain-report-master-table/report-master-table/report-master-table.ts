import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { ReportMasterTableService } from '../services/report-master-table.service';
import {
  ReportMasterTableModel,
  ReportMasterTableParamsDto,
  ReportMasterTableFilterValue
} from '../models/report-master-table.model';
import { VALIDATION_REPORT_MASTER } from 'src/app/core/constants/validation.constants';
import { MessageDialog } from '@shared/components/message-dialog/message-dialog';
import { MessageDialogData } from '@shared/interfaces/auth.interface';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
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

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ReportMasterFilterPanel } from '../report-master-filter-panel/report-master-filter-panel';
import { AddEditReportMasterTable } from '../add-edit-report-master-table/add-edit-report-master-table';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ReportMasterFilterChipsUtils } from '../utils/report-master-filter-chips.utils';

@Component({
  selector: 'app-report-master-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips
  ],
  templateUrl: './report-master-table.html',
  styleUrls: ['./report-master-table.scss']
})
export class ReportMasterTable implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;

  readonly VALIDATION = VALIDATION_REPORT_MASTER.REPORT_MASTER_TABLE;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Code or Description',
    minLength: 3,
    ariaLabel: 'Search reports by code or description'
  };

  searchTerm = '';

  tableConfig: DataTableConfig<ReportMasterTableModel> = {
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
      column: 'code',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    noDataIcon: 'edit',
    emptyMessage: 'No reports to view',
    emptySubMessage: 'Use the filter or search options to find reports, or check back later.',
    loadingMessage: 'Loading reports...',
    showPagination: true
  };

  appliedFilters: ReportMasterTableFilterValue | null = null;
  filterChips: FilterChip[] = [];

  // Dialog State
  isDialogOpen = false;
  private activeDialogRef: MatDialogRef<AddEditReportMasterTable> | null = null;

  dataSource: ReportMasterTableModel[] = [];
  requestState: ReportMasterTableParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  isFilterOpen = false;
  private previouslyFocusedElement: HTMLElement | null = null;
  currentYear: number = new Date().getFullYear();

  constructor(
    private reportMasterService: ReportMasterTableService,
    private router: Router,
    private overlay: Overlay,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService
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
          subtitle: pageData.subtitle || '',
          actions: this.headerConfig.actions // Preserve existing actions
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadReportData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.activeDialogRef) {
      this.activeDialogRef.close();
    }

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
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
        label: 'CREATE RECORD',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new report record',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by code or description',
      minLength: 3,
      ariaLabel: 'Search reports by code or description',
      searchOnEnterOnly: true,
      debounceTime: 300
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: this.VALIDATION.LIMITS.DEFAULT_PAGE_SIZE,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      sortConfig: {
        column: 'code',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      noDataIcon: 'edit',
      emptyMessage: 'No reports found',
      emptySubMessage: 'Try adjusting your search or filter criteria.',
      loadingMessage: 'Loading report data...',
      showPagination: true,
      enableRowHighlight: true
    };
  }

  private getTableColumns(): TableColumn<ReportMasterTableModel>[] {
    return [
      {
        key: 'chapterID',
        header: 'Chapter ID',
        width: '100px'
      },
      {
        key: 'type',
        header: 'Type',
        width: '100px'
      },
      {
        key: 'code',
        header: 'Code',
        sortable: true,
        width: '120px'
      },
      {
        key: 'description',
        header: 'Description'
      },
      {
        key: 'command',
        header: 'Command/ IP Address'
      },
      {
        key: 'port',
        header: 'Port#',
        width: '80px'
      },
      {
        key: 'sequence',
        header: 'Sequence',
        width: '100px',
        valueFormatter: (value) => value != null ? value : '-'
      },
      {
        key: 'warehouse',
        header: 'Warehouse',
        valueFormatter: (value, row) => {
          const code = value || '';
          const name = row.warehouseDescrription || '';

          // Both empty: show dash
          if (!code && !name) return '-';

          // Both present: show "code - name"
          if (code && name) return `${code} - ${name}`;

          // Only one present: show that value without dash
          return code || name;
        }
      },
      {
        key: 'clientHostName',
        header: 'Client Host Name'
      }
    ];
  }

  private getRowActions(): RowAction<ReportMasterTableModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit report',
        ariaLabel: 'Edit report {{code}}',
        color: 'default',
        action: 'edit'
      },
      {
        icon: 'delete',
        iconSvg: 'assets/images/icons/delete.svg',
        label: 'Delete report',
        ariaLabel: 'Delete report {{code}}',
        color: 'warn',
        action: 'delete'
      }
    ];
  }

  loadReportData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 10);

    const take = this.tableConfig.pagination?.pageSize || 10;

    this.reportMasterService
      .getReportMasterTable(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading report data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load report data. Please try again later.';
        }
      });
  }

  onSearch(): void {
    // SearchBar component already handles trimming and min length validation
    this.requestState.SearchKeyword = this.searchTerm || undefined;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadReportData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadReportData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    this.requestState.Sort =
      event.direction === 'default' ? undefined : event.direction;

    this.loadReportData();
  }

  onRowAction(event: TableRowActionEvent<ReportMasterTableModel>): void {
    switch (event.action) {
      case 'edit':
        this.editReport(event.row);
        break;
      case 'delete':
        this.deleteReport(event.row);
        break;
    }
  }

  createRecord(): void {
    this.isDialogOpen = true; // Track dialog state

    this.activeDialogRef = this.dialog.open(AddEditReportMasterTable, {
      width: '660px',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
      autoFocus: 'first-tabbable',
      position: { right: '0', top: '0' },
      panelClass: 'report-master-drawer',
      hasBackdrop: false,
      data: {
        mode: 'add'
      }
    });

    this.activeDialogRef.afterClosed().subscribe(result => {
      this.isDialogOpen = false;
      this.activeDialogRef = null;
      if (result) {
        console.log('Added:', result);
        this.loadReportData();
      }
    });
  }

  editReport(record: ReportMasterTableModel): void {
    this.isDialogOpen = true; // Track dialog state

    this.activeDialogRef = this.dialog.open(AddEditReportMasterTable, {
      width: '660px',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
      autoFocus: 'first-tabbable',
      position: { right: '0', top: '0' },
      panelClass: 'report-master-drawer',
      hasBackdrop: false,
      data: {
        mode: 'edit',
        record: record
      }
    });

    this.activeDialogRef.afterClosed().subscribe(result => {
      this.isDialogOpen = false;
      this.activeDialogRef = null;
      if (result) {
        console.log('Updated:', result);
        this.loadReportData();
      }
    });
  }

  deleteReport(record: ReportMasterTableModel): void {
    // Only check if record exists and has the required fields defined (allow empty strings)
    if (!record || record.chapterID === null || record.chapterID === undefined ||
        record.type === null || record.type === undefined ||
        record.code === null || record.code === undefined) {
      return;
    }

    const dialogData: MessageDialogData = {
      title: 'Are you sure you want to delete the record?',
      message: 'This action cannot be undone. The record will be permanently removed from the system.',
      primaryAction: { label: 'DELETE RECORD', action: 'delete' },
      secondaryAction: { label: 'CANCEL', action: 'cancel' }
    };

    const dialogRef = this.dialog.open(MessageDialog, {
      width: '555px',
      panelClass: ['delete-report-dialog', 'no-scrollbar-dialog'],
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'delete') {
        this.performDelete(record.chapterID, record.type, record.code);
      }
    });
  }

  private performDelete(chapterId: string, codeType: string, code: string): void {
    this.reportMasterService.deleteReportMaster({ chapterId, codeType, code })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const message = response?.message || 'Report deleted successfully';

          this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          this.loadReportData();
        },
        error: (error) => {
          console.error('Delete failed:', error);

          // Extract error message from backend response
          let errorMessage = 'Failed to delete report';
          if (error?.error?.errors && Array.isArray(error.error.errors) && error.error.errors.length > 0) {
            errorMessage = error.error.errors.join(', ');
          } else if (error?.error?.message) {
            errorMessage = error.error.message;
          }

          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.closeFilterPanel();
      return;
    }

    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    const positionStrategy: FlexibleConnectedPositionStrategy =
      this.overlay.position()
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

    this.isFilterOpen = true;

    const portal = new ComponentPortal(ReportMasterFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeFilterPanel();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });
  }

  private closeFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
    }
    this.previouslyFocusedElement = null;
  }

  applyFilters(filters: ReportMasterTableFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = ReportMasterFilterChipsUtils.convertFiltersToChips(filters);

    // Format dates to DD-MMM-YYYY for API
    const formatDateForApi = (date: Date | null): string | undefined => {
      if (!date) return undefined;
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };

    this.requestState = {
      ...this.requestState,
      CodeType: filters.type || undefined,
      ChapterID: filters.chapterId || undefined,
      Warehouse: filters.warehouse || undefined,
      EffectiveDatePeriod: filters.effectiveDatePeriod || undefined,
      EffectiveDate: formatDateForApi(filters.effectiveDate),
      TerminationDatePeriod: filters.terminationDatePeriod || undefined,
      TerminationDate: formatDateForApi(filters.terminationDate)
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadReportData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = ReportMasterFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = ReportMasterFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadReportData();
  }

  hasActiveFilters(): boolean {
    return ReportMasterFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { CodeType, ChapterID, Warehouse, EffectiveDatePeriod, EffectiveDate, TerminationDatePeriod, TerminationDate, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadReportData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { CodeType, ChapterID, Warehouse, EffectiveDatePeriod, EffectiveDate, TerminationDatePeriod, TerminationDate, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    // Format dates to DD-MMM-YYYY for API
    const formatDateForApi = (date: Date | null): string | undefined => {
      if (!date) return undefined;
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };

    this.requestState = {
      ...this.requestState,
      CodeType: this.appliedFilters.type || undefined,
      ChapterID: this.appliedFilters.chapterId || undefined,
      Warehouse: this.appliedFilters.warehouse || undefined,
      EffectiveDatePeriod: this.appliedFilters.effectiveDatePeriod || undefined,
      EffectiveDate: formatDateForApi(this.appliedFilters.effectiveDate),
      TerminationDatePeriod: this.appliedFilters.terminationDatePeriod || undefined,
      TerminationDate: formatDateForApi(this.appliedFilters.terminationDate)
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
      // Focus search input if exists
      const searchInput = document.querySelector<HTMLInputElement>('app-search-bar input');
      searchInput?.focus();
    }

    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.closeFilterPanel();
    }
  }
}