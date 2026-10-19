import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect, TemplateRef, AfterViewInit, Inject } from '@angular/core';
import { CommonModule, TitleCasePipe, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { PhysicalFindingsTemplateService } from './services/physical-findings-template.service';
import {
  PhysicalFindingsTemplateModel,
  PhysicalFindingsTemplateQueryParams,
  PhysicalFindingsTemplateFilterValue,
  TemplateStatus
} from './models/physical-findings-template.model';
import { PhysicalFindingsTemplateFilterChipsUtils } from './utils/filter-chips.utils';

import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MessageDialog } from '@shared/components/message-dialog/message-dialog';
import { MessageDialogData } from '@shared/interfaces/auth.interface';
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
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';

import { PhysicalFindingsTemplateFilterPanel } from './physical-findings-template-filter-panel/physical-findings-template-filter-panel';

@Component({
  selector: 'app-physical-findings-template',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    TitleCasePipe
  ],
  templateUrl: './physical-findings-template.html',
  styleUrls: ['./physical-findings-template.scss'],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter }
  ]
})
export class PhysicalFindingsTemplateComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtnRef!: ElementRef<HTMLElement>;
  @ViewChild('statusCellTemplate', { static: true }) statusCellTemplate!: TemplateRef<any>;

  liveAnnouncement = '';

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  // Search bar configuration
  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 3,
    ariaLabel: ''
  };

  // Table configuration
  tableConfig: DataTableConfig<PhysicalFindingsTemplateModel> = {
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
    showPagination: true,
    enableSelection: true,
    selectionKey: 'templateId'
  };

  // Filter state
  appliedFilters: PhysicalFindingsTemplateFilterValue | null = null;
  filterChips: FilterChip[] = [];

  // Data
  dataSource: PhysicalFindingsTemplateModel[] = [];
  requestState: PhysicalFindingsTemplateQueryParams = {};

  // UI state
  isLoading = false;
  searchText = '';
  isFilterOpen = false;


  // Bulk update state
  showBulkUpdateSection = false;
  bulkTerminationDate: Date | null = null;
  selectedTemplates: PhysicalFindingsTemplateModel[] = [];
  minTerminationDate: Date = new Date(); // Today's date - prevent past dates

  // Chapter ID from user context
  currentChapterId: string = '';

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  private pageHeaderService: PageHeaderService;

  constructor(
    private templateService: PhysicalFindingsTemplateService,
    private overlay: Overlay,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private headerService: HeaderService,
    private router: Router,
    pageHeaderService: PageHeaderService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.pageHeaderService = pageHeaderService;
    this.initializeConfigurations();

    effect(() => {
      this.currentChapterId = this.headerService.chapterId();
    });

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
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Update status column with cell template after view init
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableConfig.columns.map(col =>
        col.key === 'status'
          ? { ...col, cellTemplate: this.statusCellTemplate }
          : col
      )
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/' },
        { label: 'Physical Findings Template', link: null }
      ],
      title: 'Physical Findings Template',
      subtitle: '',
      actions: [
        {
          label: 'ADD NEW TEMPLATE',
          icon: 'add',
          color: 'accent',
          variant: 'filled',
          ariaLabel: 'Add new physical findings template',
          onClick: () => this.createRecord()
        }
      ]
    };

    this.searchConfig = {
      placeholder: 'Search by Template ID',
      minLength: 2,
      searchOnEnterOnly: true,
      ariaLabel: 'Search templates by Template ID'
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
      stickyActionsColumn: false,
      emptyMessage: 'No records found matching the current criteria',
      loadingMessage: 'Loading template data...',
      showPagination: true,
      enableSelection: false
    };
  }

  private getTableColumns(): TableColumn<PhysicalFindingsTemplateModel>[] {
    return [
      {
        key: 'donationType',
        header: 'Donation Type',
        width: '120px',
        sortable: true
      },
      {
        key: 'donationTypeDescription',
        header: 'Description',
        width: '150px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'procedureCode',
        header: 'ProcedureCode',
        width: '120px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'procedureCodeDescription',
        header: 'Description',
        width: '150px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'templateId',
        header: 'Template ID',
        width: '140px'
      },
      {
        key: 'status',
        header: 'Status',
        width: '120px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '130px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '140px',
        valueFormatter: (value) => value ? this.formatDate(value) : '-'
      }
    ];
  }

  private getRowActions(): RowAction<PhysicalFindingsTemplateModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit template',
        ariaLabel: 'Edit template {{templateId}}',
        color: 'default',
        action: 'edit',
        disabled: (row: PhysicalFindingsTemplateModel) => row.status === 'INACTIVE'
      }
    ];
  }

  private formatDate(value: Date | string | null): string {
    if (!value) return '-';
    const date = value instanceof Date ? value : new Date(value);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  getStatusClass(status: TemplateStatus): string {
    return status.toLowerCase();
  }

  loadData(showLoading: boolean = true): void {
    if (showLoading) {
      this.isLoading = true;
    }

    const pageIndex = this.tableConfig.pagination?.pageIndex || 0;
    const pageSize = this.tableConfig.pagination?.pageSize || 25;
    const skip = pageIndex * pageSize;

    this.templateService.getTemplates(pageSize, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data || [];
          const total = response.total ?? 0;
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: total
            }
          };
          this.isLoading = false;
          this.announce(`${total} template${total !== 1 ? 's' : ''} loaded`);
        },
        error: (error) => {
          console.error('Error loading templates:', error);
          this.isLoading = false;
          this.dataSource = [];
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: 0
            }
          };
          this.announce('Error loading templates');
        }
      });
  }

  onSearch(searchText: string): void {
    this.requestState.searchKeyword = searchText || undefined;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.announce(searchText ? `Searching for "${searchText}"` : 'Search cleared');
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: event.pageIndex,
        pageSize: event.pageSize
      }
    };
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    // Create new config reference to trigger change detection
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: {
        column: event.column,
        direction: event.direction
      }
    };

    if (event.direction === 'default') {
      this.requestState.sort = undefined;
      this.requestState.sortColumn = undefined;
    } else {
      this.requestState.sort = event.direction === 'A' ? 'ASC' : 'DESC';
      // Convert camelCase to PascalCase for API (e.g., donationType -> DonationType)
      this.requestState.sortColumn = event.column.charAt(0).toUpperCase() + event.column.slice(1);
    }

    this.loadData(false);
  }

  onRowAction(event: TableRowActionEvent<PhysicalFindingsTemplateModel>): void {
    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  onSelectionChange(selected: PhysicalFindingsTemplateModel[]): void {
    this.selectedTemplates = selected;
  }

  createRecord(): void {
    this.router.navigate(
      ['/donor-functions/registration/registration-administration/physical-findings-template/add'],
      { state: { mode: 'add' } }
    );
  }

  editRecord(record: PhysicalFindingsTemplateModel): void {
    this.router.navigate(
      ['/donor-functions/registration/registration-administration/physical-findings-template/add'],
      { state: { mode: 'edit', data: record } }
    );
  }

  // Bulk Update Section
  toggleBulkUpdateSection(): void {
    this.showBulkUpdateSection = !this.showBulkUpdateSection;
    if (!this.showBulkUpdateSection) {
      this.bulkTerminationDate = null;
    }
  }

  onSaveBulkTerminationDate(): void {
    if (!this.bulkTerminationDate) {
      this.snackBar.open('Please select a Termination Date', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (this.selectedTemplates.length === 0) {
      this.snackBar.open('Please select at least one template', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Format the termination date for display
    const termDateFormatted = this.formatDate(this.bulkTerminationDate);

    // Build message based on selection count
    let message: string;
    if (this.selectedTemplates.length === 1) {
      const template = this.selectedTemplates[0];
      const status = template.status.charAt(0) + template.status.slice(1).toLowerCase();
      message = `Template: ${template.templateId} is ${status}. Set Terminate date to ${termDateFormatted}`;
    } else {
      message = `Set Terminate date to ${termDateFormatted} for ${this.selectedTemplates.length} selected templates?`;
    }

    const dialogData: MessageDialogData = {
      title: 'Update Termination Date',
      message: message,
      primaryAction: { label: 'YES', action: 'update' },
      secondaryAction: { label: 'NO', action: 'cancel' }
    };

    const dialogRef = this.dialog.open(MessageDialog, {
      width: '520px',
      panelClass: 'decision-message-dialog',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'update') {
        this.performBulkTerminationDateUpdate();
      }
    });
  }

  private performBulkTerminationDateUpdate(): void {
    // Format termination date as ISO string
    const termDate = this.bulkTerminationDate!.toISOString();

    if (this.selectedTemplates.length === 1) {
      // Single template - use the single update API
      const template = this.selectedTemplates[0];
      this.templateService.updateTerminationDate({
        templateIds: [template.templateId],
        donationType: template.donationType,
        procedureCode: template.procedureCode,
        terminationDate: termDate
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.onUpdateSuccess(response);
          }
        });
    } else {
      // Multiple templates - use the batch update API
      const items = this.selectedTemplates.map(t => ({
        templateId: t.templateId,
        donationType: t.donationType,
        procedureCode: t.procedureCode,
        termDate: termDate
      }));

      this.templateService.batchUpdateTerminationDate({
        chapterId: this.currentChapterId,
        items: items
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.onUpdateSuccess(response);
          }
        });
    }
  }

  private onUpdateSuccess(response: { message: string; updatedCount?: number }): void {
    this.snackBar.open(
      response.message || `${response.updatedCount || this.selectedTemplates.length} template(s) updated successfully`,
      'Close',
      {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      }
    );
    this.showBulkUpdateSection = false;
    this.bulkTerminationDate = null;
    this.selectedTemplates = [];
    this.loadData();
  }

  // Filter Panel
  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
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

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      width: '320px'
    });

    const portal = new ComponentPortal(PhysicalFindingsTemplateFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    // Move focus into filter panel after it attaches
    setTimeout(() => {
      const panelEl = componentRef.location.nativeElement;
      const firstFocusable = panelEl.querySelector('input, select, button, [tabindex], mat-checkbox');
      firstFocusable?.focus();
    });

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeFilterOverlay();
      });

    componentRef.instance.clearAll
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAllFilters();
        this.closeFilterOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterOverlay();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterOverlay();
      });
  }

  private closeFilterOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      // Restore focus to the filter button
      this.filterBtnRef?.nativeElement?.focus();
    }
  }

  /**
   * Convert filter panel's period+date format to API's before/after format
   */
  private convertDateFilters(filters: PhysicalFindingsTemplateFilterValue): {
    effectiveDateBefore?: string;
    effectiveDateAfter?: string;
    terminationDateBefore?: string;
    terminationDateAfter?: string;
  } {
    const result: {
      effectiveDateBefore?: string;
      effectiveDateAfter?: string;
      terminationDateBefore?: string;
      terminationDateAfter?: string;
    } = {};

    // Convert effective date
    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const date = filters.effectiveDate instanceof Date
        ? filters.effectiveDate
        : new Date(filters.effectiveDate as string);
      const isoDate = date.toISOString();
      if (filters.effectiveDatePeriod === 'before') {
        result.effectiveDateBefore = isoDate;
      } else if (filters.effectiveDatePeriod === 'after') {
        result.effectiveDateAfter = isoDate;
      }
    }

    // Convert termination date
    if (filters.terminationDate && filters.terminationDatePeriod) {
      const date = filters.terminationDate instanceof Date
        ? filters.terminationDate
        : new Date(filters.terminationDate as string);
      const isoDate = date.toISOString();
      if (filters.terminationDatePeriod === 'before') {
        result.terminationDateBefore = isoDate;
      } else if (filters.terminationDatePeriod === 'after') {
        result.terminationDateAfter = isoDate;
      }
    }

    return result;
  }

  applyFilters(filters: PhysicalFindingsTemplateFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = PhysicalFindingsTemplateFilterChipsUtils.convertFiltersToChips(filters);

    // Convert period+date format to before/after format for API
    const dateFilters = this.convertDateFilters(filters);

    this.requestState = {
      ...this.requestState,
      showInactive: filters.showInactive ?? false,
      donationType: filters.donationType || undefined,
      procedureCode: filters.procedureCode || undefined,
      effectiveDateBefore: dateFilters.effectiveDateBefore,
      effectiveDateAfter: dateFilters.effectiveDateAfter,
      terminationDateBefore: dateFilters.terminationDateBefore,
      terminationDateAfter: dateFilters.terminationDateAfter
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = PhysicalFindingsTemplateFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = PhysicalFindingsTemplateFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return PhysicalFindingsTemplateFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const {
      status,
      showInactive,
      donationType,
      procedureCode,
      effectiveDateBefore,
      effectiveDateAfter,
      terminationDateBefore,
      terminationDateAfter,
      ...rest
    } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const {
        status,
        showInactive,
        donationType,
        procedureCode,
        effectiveDateBefore,
        effectiveDateAfter,
        terminationDateBefore,
        terminationDateAfter,
        ...rest
      } = this.requestState;
      this.requestState = rest;
      return;
    }

    // Convert period+date format to before/after format for API
    const dateFilters = this.convertDateFilters(this.appliedFilters);

    this.requestState = {
      ...this.requestState,
      showInactive: this.appliedFilters.showInactive ?? false,
      donationType: this.appliedFilters.donationType || undefined,
      procedureCode: this.appliedFilters.procedureCode || undefined,
      effectiveDateBefore: dateFilters.effectiveDateBefore,
      effectiveDateAfter: dateFilters.effectiveDateAfter,
      terminationDateBefore: dateFilters.terminationDateBefore,
      terminationDateAfter: dateFilters.terminationDateAfter
    };
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

    // Alt+F: Open filter
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    // Escape: Close filter overlay
    if (event.key === 'Escape') {
      if (this.overlayRef) {
        event.preventDefault();
        this.closeFilterOverlay();
      }
    }
  }

  skipToTable(event: Event): void {
    event.preventDefault();
    const tableEl = this.document.getElementById('data-table');
    if (tableEl) {
      tableEl.setAttribute('tabindex', '-1');
      tableEl.focus();
    }
  }

  private announce(message: string): void {
    // Clear then set to ensure screen readers detect the change
    this.liveAnnouncement = '';
    setTimeout(() => { this.liveAnnouncement = message; });
  }
}
