import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Inject, inject, OnDestroy, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { DataTable } from '@shared/components/data-table/data-table';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import {
  DataTableConfig,
  RowAction,
  TableColumn,
  TableRowActionEvent,
  TableSortEvent
} from '@shared/interfaces/data-table.interface';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { DonorCommunication, DonorInfo } from '../../models/notification-log.interface';
import { NotificationLogService } from '../../services/notification-log.service';
import { CommunicationDialogComponent, CommunicationDialogResult } from './dialogs/communication-dialog/communication-dialog';
import { LetterDialogComponent } from './dialogs/letter-dialog/letter-dialog';

// Export dialog data interface
export interface NotificationLogDialogData {
  donorId: string;
}

@Component({
  selector: 'app-notification-log-dialog',
  standalone: true,  // Standalone component
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatInputModule,
    NgxMatSelectSearchModule,
    SearchBar,
    DataTable,
  ],
  templateUrl: './notification-log-dialog.html',
  styleUrls: ['./notification-log-dialog.scss'],
})
export class NotificationLogDialogComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(DataTable) dataTableComponent!: DataTable<DonorCommunication>;
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('commentCell', { static: true }) commentCellTemplate!: TemplateRef<unknown>;
  @ViewChild('dialogContent') dialogContent!: ElementRef<HTMLDivElement>;

  // Inject services using inject() function
  private readonly service = inject(NotificationLogService);
  private readonly dialogService = inject(MatDialog);
  private destroy$ = new Subject<void>();  // Cleanup subject

  // Component state - converted to signals for reactivity
  selectedComType = signal('');
  selectedComCode = signal('');
  loading = signal(false);              // Loading state for notification logs table API
  loadingCodes = signal(false);         // Loading state for communication codes dropdown
  initialLoading = signal(true);        // Loading state for initial donor info API call
  currentSearchText = signal('');
  shouldAddTopPadding = signal(false);  // Add 24px top padding when donor info API fails (404 or "No notification logs found.")

  // Search bar configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Communication Type',
    minLength: 3,
    ariaLabel: 'Search communications by type',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  // Table configuration
  tableConfig: DataTableConfig<DonorCommunication> = {
    columns: [],
    rowActions: [],
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No communications found',
    loadingMessage: 'Loading communications...',
    showPagination: false // No pagination required
    // enableRowHighlight defaults to true - rows are clickable and highlight on selection
  };

  // Dropdown options with search - converted to signals
  communicationTypes = signal<{ value: string; label: string }[]>([]);
  communicationCodes = signal<{ value: string; label: string }[]>([]);

  // Explicitly typed FormControls
  comTypeSearchControl = new FormControl<string>('');
  filteredComTypes = signal<{ value: string; label: string }[]>([]);

  comCodeSearchControl = new FormControl<string>('');
  filteredComCodes = signal<{ value: string; label: string }[]>([]);

  // Data - converted to signals
  donorInfo = signal<DonorInfo | null>(null);
  dataSource = signal<DonorCommunication[]>([]);
  allCommunications = signal<DonorCommunication[]>([]); // Store unfiltered data
  selectedRow = signal<DonorCommunication | null>(null);

  // Constructor injection for dialog ref and data
  constructor(
    public dialogRef: MatDialogRef<NotificationLogDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NotificationLogDialogData,
  ) {}

  ngOnInit(): void {
    this.initializeTableConfig();
    this.setupComTypeSearch();
    this.setupComCodeSearch();
    this.loadInitialData();
  }

  ngAfterViewInit(): void {
    // Assign template reference to column config
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableConfig.columns.map(col =>
        col.key === 'comments'
          ? { ...col, cellTemplate: this.commentCellTemplate }
          : col
      )
    };
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTableConfig(): void {
    this.tableConfig.columns = this.getTableColumns();
    this.tableConfig.rowActions = this.getRowActions();
  }

  private getTableColumns(): TableColumn<DonorCommunication>[] {
    return [
      {
        key: 'dateAndTime',
        header: 'Date and Time',
        width: '150px',
        valueFormatter: (value) => value ? this.formatDateTime(value) : '-'
      },
      {
        key: 'communicationType',
        header: 'Type',
        width: '82px'
      },
      {
        key: 'communicationTypeDescription',
        header: 'Description',
        width: '148px'
      },
      {
        key: 'communicationCode',
        header: 'Code',
        width: '66px'
      },
      {
        key: 'communicationCodeDescription',
        header: 'Description',
        width: '170px'
      },
      {
        key: 'targetDate',
        header: 'Target Date',
        width: '110px',
        valueFormatter: (value) => value ? this.formatDate(value) : '-'
      },
      {
        key: 'actionCode',
        header: 'Action Code',
        width: '99px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'actionDate',
        header: 'Actual Date',
        width: '110px',
        valueFormatter: (value) => value ? this.formatDate(value) : '-'
      },
      {
        key: 'comments',
        header: 'Comment',
        width: '96px'
        // cellTemplate assigned in ngAfterViewInit
      }
    ];
  }

  private formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private formatDob(dob: string): string {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const d = new Date(dob);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
    }
    const parts = dob.split('-');
    if (parts.length !== 3) return dob;
    const monthIndex = parseInt(parts[0], 10) - 1;
    if (monthIndex < 0 || monthIndex > 11) return dob;
    return `${parts[1]}-${months[monthIndex]}-${parts[2]}`;
  }

  private getRowActions(): RowAction<DonorCommunication>[] {
    return [];
  }

  onComTypeChange(): void {
    this.selectedComCode.set('');
    this.communicationCodes.set([]);
    this.filteredComCodes.set([]);

    if (this.selectedComType()) {
      this.loadCommunicationCodes();
    }
  }

  onComCodeChange(): void {
    // Communication code changed - user can click RETRIEVE to load data
  }

  onRetrieve(): void {
    const comType = this.selectedComType();
    const comCode = this.selectedComCode();

    if (!comType || !comCode) {
      console.warn('Please select both Communication Type and Communication Code');
      return;
    }

    this.loadNotificationLogs(comType, comCode);
  }

  /**
   * Clear all: resets dropdowns and reloads table data without filters
   */
  onClearAll(): void {
    // Clear dropdown selections
    this.selectedComType.set('');
    this.selectedComCode.set('');

    // Clear communication codes dropdown data
    this.communicationCodes.set([]);
    this.filteredComCodes.set([]);

    // Clear selected row
    this.selectedRow.set(null);
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }

    // Clear search
    this.currentSearchText.set('');
    if (this.searchBarComponent) {
      this.searchBarComponent.clearSearch();
    }

    // Reload table data without dropdown filters (all notification logs)
    this.loadNotificationLogs();
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }
    this.sortDataSource();
  }

  onRowAction(event: TableRowActionEvent<DonorCommunication>): void {
    // Highlight the row when action is clicked
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }
    this.selectedRow.set(event.row);
  }

  /**
   * Handle row click
   * Highlight row and update selection
   */
  onRowClick(row: DonorCommunication): void {
    // Highlight the row when clicked
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = row;
    }
    this.selectedRow.set(row);
    // Bottom section is now sticky at bottom, no need to scroll
  }

  openNewCommunication(): void {
    const dialogRef = this.dialogService.open(CommunicationDialogComponent, {
      width: '960px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: {
        mode: 'new',
        donorId: this.data.donorId,
      },
      disableClose: true,
      panelClass: 'notification-log-dialog-panel',
      position: { bottom: '0px', right: '0px' },
      hasBackdrop: false,
      backdropClass: 'code-dialog-backdrop',
      autoFocus: false
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: CommunicationDialogResult | undefined) => {
        (document.activeElement as HTMLElement)?.blur();
        if (result && result.action === 'save' && result.data) {
          // Refresh data after creation - use current filters if available
          const comType = this.selectedComType();
          const comCode = this.selectedComCode();
          this.loadNotificationLogs(comType || undefined, comCode || undefined);
          // Refresh communication codes dropdown if a type is selected
          if (comType) {
            this.loadCommunicationCodes();
          }
        }
      });
  }

  openDetails(row: DonorCommunication): void {
    const dialogRef = this.dialogService.open(CommunicationDialogComponent, {
      width: '960px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: {
        mode: 'edit',
        donorId: this.data.donorId,
        communication: row,
      },
      disableClose: true,
      panelClass: 'notification-log-dialog-panel',
      position: { bottom: '0px', right: '0px' },
      hasBackdrop: false,
      backdropClass: 'code-dialog-backdrop',
      autoFocus: false
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: CommunicationDialogResult | undefined) => {
        (document.activeElement as HTMLElement)?.blur();
        if (result && result.action === 'save' && result.data) {
          // Refresh data after update - use current filters if available
          const comType = this.selectedComType();
          const comCode = this.selectedComCode();
          this.loadNotificationLogs(comType || undefined, comCode || undefined);
          // Refresh communication codes dropdown if a type is selected
          if (comType) {
            this.loadCommunicationCodes();
          }
        }
      });
  }

  openLetterDetails(row: DonorCommunication): void {
    const dialogRef = this.dialogService.open(LetterDialogComponent, {
      width: '960px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: {
        communication: row,
        donorId: this.data.donorId,
      },
      disableClose: true,
      panelClass: 'notification-log-dialog-panel',
      position: { bottom: '0px', right: '0px' },
      hasBackdrop: false,
      backdropClass: 'code-dialog-backdrop',
      autoFocus: false
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        (document.activeElement as HTMLElement)?.blur();
      });
  }

  onClose(): void {
    // Close dialog
    this.dialogRef.close();
  }

  /**
   * TrackBy function for dropdown options to improve performance
   */
  trackByValue(_index: number, item: { value: string; label: string }): string {
    return item.value;
  }

  private setupComTypeSearch(): void {
    // Reactive search with takeUntil
    this.comTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredComTypes.set(!term
          ? [...this.communicationTypes()]
          : this.communicationTypes().filter(type =>
              type.label.toLowerCase().includes(term) ||
              type.value.toLowerCase().includes(term)
            ));
      });
  }

  private setupComCodeSearch(): void {
    this.comCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredComCodes.set(!term
          ? [...this.communicationCodes()]
          : this.communicationCodes().filter(code =>
              code.label.toLowerCase().includes(term) ||
              code.value.toLowerCase().includes(term)
            ));
      });
  }

  /**
   * Load initial data: donor info, communication types, and all notification logs
   */
  private loadInitialData(): void {
    this.initialLoading.set(true);

    forkJoin({
      donorInfo: this.service.getDonorInfo(this.data.donorId),
      communicationTypes: this.service.getCommunicationTypes(this.data.donorId),
      notificationLogs: this.service.getNotificationLogs(this.data.donorId)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.donorInfo?.dateOfBirth) {
            response.donorInfo.dateOfBirth = this.formatDob(response.donorInfo.dateOfBirth);
          }
          this.donorInfo.set(response.donorInfo);

          // Transform communication types to dropdown format
          const types = response.communicationTypes.map(type => ({
            value: type.code,
            label: `${type.code}${type.description ? ' - ' + type.description : ''}`
          }));
          this.communicationTypes.set(types);
          this.filteredComTypes.set([...types]);

          // Load initial notification logs (all logs without filters)
          this.allCommunications.set(response.notificationLogs);
          this.applySearchFilter();

          this.initialLoading.set(false);
          this.shouldAddTopPadding.set(false); // Reset padding flag on success
        },
        error: (error) => {
          console.error('Failed to load initial data:', error);

          // Add top padding for 404 or "No notification logs found." errors
          const shouldAddPadding = error?.status === 404 ||
                                   [error?.error?.message, error?.message]
                                     .some(msg => msg?.includes('No notification logs found.'));

          this.shouldAddTopPadding.set(shouldAddPadding);
          this.initialLoading.set(false);
        }
      });
  }

  /**
   * Load communication codes for selected type
   */
  private loadCommunicationCodes(): void {
    const comType = this.selectedComType();
    if (!comType) return;

    this.loadingCodes.set(true);

    this.service.getCommunicationCodes(this.data.donorId, comType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          // Transform communication codes to dropdown format
          const formattedCodes = codes.map(code => ({
            value: code.code,
            label: `${code.code}${code.description ? ' - ' + code.description : ''}`
          }));
          this.communicationCodes.set(formattedCodes);
          this.filteredComCodes.set([...formattedCodes]);

          this.loadingCodes.set(false);
        },
        error: (error) => {
          console.error('Failed to load communication codes:', error);
          this.loadingCodes.set(false);
        }
      });
  }

  /**
   * Load notification logs for selected type and code
   * If comType and comCode are provided, filters by those values
   * If not provided, returns all notification logs
   * Follows view-interdiction-codes - no auto-selection of first row
   */
  private loadNotificationLogs(comType?: string, comCode?: string): void {
    this.loading.set(true);

    this.service.getNotificationLogs(this.data.donorId, comType, comCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (communications) => {
          this.allCommunications.set(communications);
          this.applySearchFilter();
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Failed to load notification logs:', error);
          this.loading.set(false);
        }
      });
  }

  /**
   * Handle search from SearchBar component
   */
  onSearch(searchText: string): void {
    this.currentSearchText.set(searchText || '');
    this.applySearchFilter();
  }

  /**
   * Handle search cleared from SearchBar component
   */
  onSearchCleared(): void {
    this.currentSearchText.set('');
    this.applySearchFilter();
  }

  /**
   * Apply search filter to communications data
   * Follows view-interdiction-codes - clear selection if filtered out, but don't auto-select
   */
  private applySearchFilter(): void {
    const searchText = this.currentSearchText();
    if (!searchText || searchText.length < 3) {
      this.dataSource.set([...this.allCommunications()]);
    } else {
      const searchLower = searchText.toLowerCase();
      this.dataSource.set(this.allCommunications().filter(comm => {
        const comType = (comm.communicationType || '').toLowerCase();
        return comType.includes(searchLower);
      }));
    }
    this.sortDataSource();

    // Clear selection if filtered out
    const currentRow = this.selectedRow();
    if (currentRow && !this.dataSource().includes(currentRow)) {
      this.selectedRow.set(null);
      if (this.dataTableComponent) {
        this.dataTableComponent.activeRow = null;
      }
    }
  }

  private sortDataSource(): void {
    const sortColumn = this.tableConfig.sortConfig?.column || 'dateAndTime';
    const sortDirection = this.tableConfig.sortConfig?.direction || 'D';

    this.dataSource.set([...this.dataSource()].sort((a, b) => {
      type SortableValue = string | number | Date | null | undefined;
      let valueA: SortableValue = a[sortColumn as keyof DonorCommunication];
      let valueB: SortableValue = b[sortColumn as keyof DonorCommunication];

      // Handle date columns - convert to timestamps for comparison
      if (sortColumn === 'dateAndTime' || sortColumn === 'targetDate' || sortColumn === 'actionDate') {
        valueA = valueA ? new Date(valueA).getTime() : 0;
        valueB = valueB ? new Date(valueB).getTime() : 0;
      }

      // Handle string comparison - case insensitive
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      // Handle null/undefined values - treat as lowest value
      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return 1;
      if (valueB == null) return -1;

      let comparison = 0;
      if (valueA < valueB) comparison = -1;
      if (valueA > valueB) comparison = 1;

      return sortDirection === 'D' ? -comparison : comparison;
    }));
  }
}
