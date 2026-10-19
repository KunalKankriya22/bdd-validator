import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  untracked,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, map, Subscription, timer } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { ReportActionService } from '../services/report-action.service';
import {
  ReportAction,
  ReportActionQuery,
  ReportActionFilterValue,
  UserDetails,
  LogReportRequest
} from '../models/report-action.model';
import { ReportActionFilterChipsUtils } from '../utils/report-action-filter-chips.utils';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent
} from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ReportActionFilterPanelComponent } from '../report-action-filter-panel/report-action-filter-panel.component';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { VALIDATION_REPORT_ACTIONS } from '../../../../../../../core/constants/validation.constants';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { LoginService } from '@shared/services/login.service';
import { HeaderService } from '@shared/services/header.service';

/**
 * Report Actions List Component
 * Main component for displaying and managing report actions
 */
@Component({
  selector: 'app-report-actions-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    DataTable,
    FilterChips,
    PageHeaderWithBreadcrumb,
    SearchBar
  ],
  templateUrl: './report-actions-list.component.html',
  styleUrls: ['./report-actions-list.component.scss']
})
export class ReportActionsListComponent implements OnInit, OnDestroy {
  private readonly reportActionService = inject(ReportActionService);
  private readonly loginService = inject(LoginService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly overlay = inject(Overlay);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();
  private autoRefreshSubscription?: Subscription;

  // Template references
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef;
  @ViewChild('statusCellTemplate', { static: true }) statusCellTemplate!: any;

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    title: '',
    subtitle: '',
    breadcrumbs: [
      { label: 'Home', link: '/' }
    ]
  };

  // Search configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search By Name, Report ID Or User',
    minLength: 3,
    ariaLabel: 'Search reports',
    searchOnEnterOnly: true
  };

  // State signals
  reports = signal<ReportAction[]>([]);
  totalRecords = signal<number>(0);
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');
  logGenerating = signal<string | null>(null);
  autoRefreshInterval = signal<number>(0); // 0 = disabled

  // User details and role
  currentUserDetails = signal<UserDetails | null>(null);
  isSupervisorMode = computed<boolean>(() => {
    const userDetails = this.currentUserDetails();
    return userDetails ? userDetails.isSupervisor : false;
  });

  // Distinct user names for filter dropdown (fetched from API)
  distinctUserNames = signal<string[]>([]);

  // Pagination signals
  pageSize = signal<number>(25);
  pageIndex = signal<number>(0);
  pageSizeOptions = [10, 25, 50, 100];

  // Sort state
  // Default sort: Date and Time descending (most recent first) - matches Oracle Forms
  sortColumn = signal<string>('submitDate');
  sortDirection = signal<'A' | 'D' | 'default'>('D');

  // Map database column names to UI column keys for display
  private dbToUiColumnMap: Record<string, string> = {
    'submitDate': 'localSubmitDate',
    'reportName': 'reportName',
    'userName': 'userName',
    'parmId': 'parmId',
    'repJobId': 'repJobId'
  };

  // UI column for display (computed from database column)
  uiSortColumn = computed(() => this.dbToUiColumnMap[this.sortColumn()] || this.sortColumn());

  // Search state
  searchText = signal<string>('');

  // Filter state
  currentFilters = signal<ReportActionFilterValue | null>(null);
  // Track if filters have been initialized (to distinguish initial null from user clearing)
  private filtersInitialized = signal<boolean>(false);
  filterChips = computed<FilterChip[]>(() =>
    ReportActionFilterChipsUtils.convertFiltersToChips(this.currentFilters())
  );
  hasActiveFilters = computed<boolean>(() =>
    ReportActionFilterChipsUtils.hasActiveFilters(this.currentFilters())
  );

  // Filter panel overlay
  private filterPanelOverlayRef: OverlayRef | null = null;
  isFilterOpen = signal<boolean>(false);

  // Table configuration
  tableConfig = computed<DataTableConfig<ReportAction>>(() => ({
    columns: this.getColumns(),
    rowActions: this.getRowActions(),
    pagination: {
      pageSize: this.pageSize(),
      pageIndex: this.pageIndex(),
      totalRecords: this.totalRecords(),
      pageSizeOptions: this.pageSizeOptions
    },
    sortConfig: {
      column: this.uiSortColumn(), // Use UI column key for display
      direction: this.sortDirection()
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    enableSelection: false,
    emptyMessage: 'No Data Available',
    loadingMessage: 'Loading reports...'
  }));

  constructor() {
    // Effect to set page header from menu items
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

    // Effect to load reports when user details are available
    effect(() => {
      const userDetails = this.currentUserDetails();
      if (userDetails) {
        untracked(() => this.loadReports());
      }
    });

    // Effect to reload data when filters change
    effect(() => {
      const filters = this.currentFilters();
      const userDetails = this.currentUserDetails();
      const initialized = this.filtersInitialized();

      // Only trigger if:
      // 1. User details are loaded AND
      // 2. Either filters have been set/changed OR filters have been cleared (initialized = true, filters = null)
      if (userDetails && initialized) {
        untracked(() => {
          this.pageIndex.set(0);
          this.loadReports();
        });
      }
    });
  }

  ngOnInit(): void {
    // Load user details first - reports will auto-load via effect when details are available
    this.loadUserDetails();
    this.loadAutoRefreshInterval();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeFilterPanel();
    this.stopAutoRefresh();
  }

  /**
   * Handle search from search bar component
   */
  onSearch(searchValue: string): void {
    this.searchText.set(searchValue);
    this.pageIndex.set(0);
    this.loadReports();
  }

  /**
   * Load user details to determine user role and access level
   */
  loadUserDetails(): void {
    // Get username from LoginService (stored in cookie)
    const userId = this.loginService.getStoredUsername();

    if (!userId) {
      console.warn('No username found in session. Please log in.');
      this.currentUserDetails.set(null);
      this.showError('Unable to load user information. Please log in again.');
      return;
    }

    this.reportActionService
      .getUserDetails(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: userDetails => {
          this.currentUserDetails.set(userDetails);
          if (userDetails.isSupervisor) {
            this.loadDistinctUsernames();
          }
        },
        error: error => {
          console.error('Error fetching user details:', error);
          this.currentUserDetails.set(null);
          this.showError('Failed to load user details. Some features may be unavailable.');
        }
      });
  }

  /**
   * Load distinct usernames for filter dropdown (supervisor mode only)
   */
  loadDistinctUsernames(): void {
    this.reportActionService
      .getDistinctUsernames()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: usernames => this.distinctUserNames.set(usernames),
        error: () => this.distinctUserNames.set([])
      });
  }

  /**
   * Load reports from API with role-based filtering
   */
  loadReports(): void {
    const userDetails = this.currentUserDetails();

    // Don't load reports if user details haven't been fetched yet
    if (!userDetails) {
      console.warn('User details not loaded yet, skipping report load');
      return;
    }

    // Clear existing reports to prevent stale data from showing
    this.reports.set([]);
    this.isLoading.set(true);
    this.hasError.set(false);

    const skip = this.pageIndex() * this.pageSize();
    const take = this.pageSize();

    // Build request body with role-based filtering
    const filterParams = ReportActionFilterChipsUtils.filtersToQueryParams(this.currentFilters());

    const directionMap: Record<string, string> = { 'A': 'asc', 'D': 'desc' };
    const sortDir = this.sortDirection();

    const requestBody: ReportActionQuery = {
      searchKeyword: this.searchText() || undefined,
      isSupervisor: userDetails.isSupervisor,
      chapterId: this.headerService.getCurrentChapterId() || undefined,
      ...filterParams,
      sortColumn: this.sortColumn(),
      sortDirection: directionMap[sortDir] || 'asc'
    };

    // Normal users must always send their username so the backend filters to their own reports.
    // Matches Oracle Forms: WHERE user_name LIKE '<current_user>%'
    if (!userDetails.isSupervisor) {
      requestBody.userName = userDetails.userId;
    }

    this.reportActionService
      .getReports(take, skip, requestBody, userDetails.accessLevel)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.reports.set(response.data || []);
          this.totalRecords.set(response.totalRecords || 0);
          this.isLoading.set(false);
        },
        error: error => {
          this.hasError.set(true);
          this.isLoading.set(false);
          this.errorMessage.set(
            VALIDATION_REPORT_ACTIONS.REPORT_ACTIONS_LIST.MESSAGES.LOAD_ERROR
          );
          this.showError('Failed to load reports. Please try again.');
          console.error('Error loading reports:', error);
        }
      });
  }

  /**
   * Handle pagination change
   */
  onPageChange(event: TablePageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadReports();
  }

  onSortChange(event: TableSortEvent): void {
    // Map UI column keys to database field names
    const columnMap: Record<string, string> = {
      'localSubmitDate': 'submitDate',
      'reportName': 'reportName',
      'userName': 'userName',
      'parmId': 'parmId',
      'repJobId': 'repJobId'
    };

    const dbColumn = columnMap[event.column] || event.column;
    this.sortColumn.set(dbColumn);
    this.sortDirection.set(event.direction);
    this.pageIndex.set(0);
    this.loadReports();
  }

  /**
   * Handle row action
   */
  onRowAction(event: { action: string; row: ReportAction }): void {
    const { action, row } = event;

    switch (action) {
      case 'review':
        this.reviewReport(row);
        break;
      case 'delete':
        this.confirmDeleteReport(row);
        break;
      case 'print':
        this.printReport(row);
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }

  /**
   * Review report - handles both normal reports and log reports.
   * If outputFile exists, automatically generates the log report (GERLOGREP)
   * before opening it, matching the legacy Oracle Forms behavior.
   */
  reviewReport(report: ReportAction): void {
    if (!report.canReview) {
      this.showError('Report must be completed before review');
      return;
    }

    if (report.outputFile) {
      this.generateAndViewLogReport(report);
    } else {
      const pdfFileName = report.fileName;
      const pdfPath = `/reports/${pdfFileName}`;
      window.open(pdfPath, '_blank');
    }
  }

  /**
   * Generate log report and open the resulting PDF.
   * Replicates the legacy PRINT_LOG_REPORT / PRINT_EXTRACT_REPORT flow:
   * 1. Submit log report request (calls POP_LOG_TABLE, creates GERLOGRP params, enqueues)
   * 2. Poll until the report listener service generates the PDF
   * 3. Open the PDF
   * 4. Cleanup temporary print_report_log entries
   */
  private generateAndViewLogReport(report: ReportAction): void {
    if (this.logGenerating()) return;
    this.logGenerating.set(report.parmId);

    // Pre-open window on user click (synchronous) to avoid popup blocker
    const pdfWindow = window.open('about:blank', '_blank');

    const request: LogReportRequest = {
      parmId: report.parmId,
      userName: report.userName,
      reportName: report.reportName,
      applId: report.applId
    };

    const currentUser = this.loginService.getStoredUsername() || report.userName;

    this.reportActionService.submitLogReport(request)
      .pipe(
        switchMap(response =>
          this.reportActionService.pollLogReportStatus('GERLOGRP', response.newParmId, currentUser).pipe(
            map(completedReport => ({ response, completedReport }))
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ({ response, completedReport }) => {
          this.logGenerating.set(null);
          const pdfFileName = completedReport.fileName || completedReport.outputFile;
          if (pdfFileName) {
            if (pdfWindow && !pdfWindow.closed) {
              pdfWindow.location.href = `/reports/${pdfFileName}`;
            } else {
              window.open(`/reports/${pdfFileName}`, '_blank');
            }
          } else {
            if (pdfWindow && !pdfWindow.closed) pdfWindow.close();
            this.showSuccess('Log report generated. Check Report Actions for GERLOGREP to view.');
          }
          this.reportActionService
            .cleanupLogReport(response.sessionId, response.originalParmId)
            .pipe(takeUntil(this.destroy$))
            .subscribe();
        },
        error: () => {
          this.logGenerating.set(null);
          if (pdfWindow && !pdfWindow.closed) pdfWindow.close();
          this.showError('Failed to generate log report. Please try again.');
        }
      });
  }

  /**
   * Confirm delete action
   */
  confirmDeleteReport(report: ReportAction): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Confirm Delete',
        message: 'Are you sure you want to delete this report?',
        detail: 'This action cannot be undone. The report will be permanently removed from the system.',
        confirmText: 'DELETE REPORT',
        cancelText: 'CANCEL'
      } as ConfirmActionDialogData
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (confirmed) {
        this.deleteReport(report);
      }
    });
  }

  /**
   * Delete report
   */
  deleteReport(report: ReportAction): void {
    this.isLoading.set(true);

    this.reportActionService
      .deleteReport(
        report.reportName,
        report.parmId,
        report.userName,
        report.applId
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.isLoading.set(false);
          if (response.success) {
            this.showSuccess('Report deleted successfully');
            this.loadReports();
          } else {
            this.showError(response.message || 'Failed to delete report');
          }
        },
        error: error => {
          this.isLoading.set(false);
          this.showError('Failed to delete report');
          console.error('Delete error:', error);
        }
      });
  }

  /**
   * Print report
   */
  printReport(report: ReportAction): void {
    // TODO: Implement print dialog with printer selection
    this.showError('Print functionality not yet implemented');
  }

  /**
   * Open filter panel
   */
  openFilterPanel(): void {
    if (this.isFilterOpen()) {
      this.closeFilterPanel();
      return;
    }

    const positionStrategy = this.overlay
      .position()
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

    this.filterPanelOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    const portal = new ComponentPortal(ReportActionFilterPanelComponent);
    const componentRef = this.filterPanelOverlayRef.attach(portal);

    // Set current filters and supervisor mode
    componentRef.instance.currentFilters.set(
      this.currentFilters() || ReportActionFilterChipsUtils.getEmptyFilters()
    );
    componentRef.instance.isSupervisorMode.set(this.isSupervisorMode());
    componentRef.instance.availableUserNames.set(this.distinctUserNames());

    // Subscribe to apply event
    componentRef.instance.apply.subscribe((filters: ReportActionFilterValue) => {
      this.filtersInitialized.set(true); // Mark filters as initialized
      this.currentFilters.set(filters);
      this.closeFilterPanel();
    });

    // Subscribe to cancel event
    componentRef.instance.cancel.subscribe(() => {
      this.closeFilterPanel();
    });

    // Subscribe to backdrop click
    this.filterPanelOverlayRef
      .backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });

    this.isFilterOpen.set(true);
  }

  /**
   * Close filter panel
   */
  closeFilterPanel(): void {
    if (this.filterPanelOverlayRef) {
      this.filterPanelOverlayRef.dispose();
      this.filterPanelOverlayRef = null;
      this.isFilterOpen.set(false);
    }
  }

  /**
   * Remove filter chip
   */
  onRemoveFilterChip(chipKey: string): void {
    this.filtersInitialized.set(true); // Mark filters as initialized
    const updatedFilters = ReportActionFilterChipsUtils.removeFilterByChipKey(
      this.currentFilters(),
      chipKey
    );
    this.currentFilters.set(updatedFilters);
  }

  /**
   * Clear all filters - sets to null and triggers API call
   */
  clearAllFilters(): void {
    this.filtersInitialized.set(true); // Mark filters as initialized
    this.currentFilters.set(null);
  }

  /**
   * Define table columns
   */
  private getColumns(): TableColumn<ReportAction>[] {
    return [
      {
        key: 'reportName',
        header: 'Name',
        sortable: true,
        width: '150px'
      },
      {
        key: 'parmId',
        header: 'Report ID',
        sortable: false,
        width: '200px'
      },
      {
        key: 'userName',
        header: 'User',
        sortable: false,
        width: '120px'
      },
      {
        key: 'localSubmitDate',
        header: 'Date and Time',
        sortable: false,
        width: '180px',
        valueFormatter: (value: Date) => this.formatDateTime(value)
      },
      {
        key: 'repJobId',
        header: 'Job ID',
        sortable: false,
        width: '100px'
      },
      {
        key: 'displayStatus',
        header: 'Status',
        sortable: false,
        width: '130px',
        cellClass: 'status-cell',
        cellTemplate: this.statusCellTemplate
      }
    ];
  }


  /**
   * Define row actions
   */
  private getRowActions(): RowAction<ReportAction>[] {
    return [
      {
        iconSvg: 'assets/images/icons/eye.svg',
        label: 'Review',
        ariaLabel: 'Review report',
        action: 'review',
        color: 'default',
        visible: (row: ReportAction) => row.canReview,
        disabled: (row: ReportAction) => !row.canReview || this.logGenerating() === row.parmId
      },
      {
        iconSvg: 'assets/images/icons/delete.svg',
        label: 'Delete',
        ariaLabel: 'Delete report',
        action: 'delete',
        color: 'default',
        visible: (row: ReportAction) => row.canDelete,
        disabled: (row: ReportAction) => !row.canDelete
      }
    ];
  }

  /**
   * Format date time for display (DD-MMM-YYYY HH:mm)
   */
  private formatDateTime(date: Date): string {
    if (!date) return '';

    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
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
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Load auto-refresh interval from VALID_PARAMETERS (PRINTTIMER)
   */
  private loadAutoRefreshInterval(): void {
    this.reportActionService
      .getAutoRefreshInterval()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (intervalSeconds) => {
          this.autoRefreshInterval.set(intervalSeconds);
          if (intervalSeconds > 0) {
            this.startAutoRefresh(intervalSeconds);
          }
        },
        error: () => {
          this.autoRefreshInterval.set(0); // Disable on error
        }
      });
  }

  /**
   * Start auto-refresh timer
   */
  private startAutoRefresh(intervalSeconds: number): void {
    this.stopAutoRefresh(); // Clear existing timer

    const intervalMs = intervalSeconds * 1000;

    this.autoRefreshSubscription = timer(intervalMs, intervalMs)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Refresh data while preserving current page and filters
        this.loadReports();
      });
  }

  /**
   * Stop auto-refresh timer
   */
  private stopAutoRefresh(): void {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
      this.autoRefreshSubscription = undefined;
    }
  }
}
