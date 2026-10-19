import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { DefineDefaultDriveChecklistService } from './services/define-default-drive-checklist.service';
import {
  DefineDefaultDriveChecklistModel,
  DriveChecklistParamsDto,
  DriveChecklistFilterValue
} from './models/define-default-drive-checklist.model';
import { MessageDialog } from '@shared/components/message-dialog/message-dialog';
import { MessageDialogData } from '@shared/interfaces/auth.interface';
import { HeaderService } from '@shared/services/header.service';

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

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DriveChecklistFilterChipsUtils } from './filter/filter-chips.utils';
import { DriveChecklistFilterPanel } from './drive-checklist-filter-panel/drive-checklist-filter-panel';
import { AddEditDriveChecklistComponent } from './add-edit-drive-checklist/add-edit-drive-checklist';

@Component({
  selector: 'app-define-default-drive-checklist',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditDriveChecklistComponent
  ],
  templateUrl: './define-default-drive-checklist.html',
  styleUrls: ['./define-default-drive-checklist.scss']
})
export class DefineDefaultDriveChecklistComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 3,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<DefineDefaultDriveChecklistModel> = {
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
      column: 'sequence',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: DriveChecklistFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: DefineDefaultDriveChecklistModel[] = [];
  requestState: DriveChecklistParamsDto = {};

  isLoading = false;
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: DefineDefaultDriveChecklistModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  // Chapter ID from user context
  currentChapterId: string = '';

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  currentYear: number = new Date().getFullYear();

  constructor(
    private driveChecklistService: DefineDefaultDriveChecklistService,
    private overlay: Overlay,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();

    // Reactively update chapterId when HeaderService signal changes
    effect(() => {
      this.currentChapterId = this.headerService.chapterId();
    });
  }

  ngOnInit(): void {
    this.loadData();
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
        {
          label: 'Home',
          link: '/home'
        },
        {
          label: 'Define Default Drive Checklist',
          link: null
        }
      ],
      actions: [{
        label: 'ADD NEW CHECKLIST ITEM',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new checklist item',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Action or Description',
      minLength: 2,
      ariaLabel: 'Search checklist items by action or description',
      searchOnEnterOnly: true
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
        column: 'sortSeq',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No records found matching the current criteria',
      loadingMessage: 'Loading checklist data...',
      showPagination: false
    };
  }

  private getTableColumns(): TableColumn<DefineDefaultDriveChecklistModel>[] {
    return [
      {
        key: 'sortSeq',
        header: 'Sequence',
        sortable: true,
        width: '100px',
        valueFormatter: (value) => value != null ? String(value).padStart(2, '0') : '-'
      },
      {
        key: 'actionCode',
        header: 'Action',
        width: '200px'
      },
      {
        key: 'actionDescription',
        header: 'Description',
        width: '300px'
      },
      {
        key: 'targetDays',
        header: 'No. of Days',
        width: '120px',
        valueFormatter: (value) => value ?? '-'
      },
      {
        key: 'timeFlagDescription',
        header: 'Timeline',
        width: '120px',
        valueFormatter: (value) => value || '-'
      }
    ];
  }

  private getRowActions(): RowAction<DefineDefaultDriveChecklistModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit checklist item',
        ariaLabel: 'Edit checklist item {{actionCode}}',
        color: 'default',
        action: 'edit',
        visible: (row) => row.targetDateStatus !== 'FIXED'
      },
      {
        icon: 'delete',
        iconSvg: 'assets/images/icons/delete.svg',
        label: 'Delete checklist item',
        ariaLabel: 'Delete checklist item {{actionCode}}',
        color: 'warn',
        action: 'delete'
      }
    ];
  }

  loadData(showLoading: boolean = true): void {
    if (showLoading) {
      this.isLoading = true;
    }

    // Check if frontend-only filters (No. of Days/Condition) are active
    const hasFrontendFilters = this.appliedFilters?.noOfDays !== null &&
                                this.appliedFilters?.noOfDays !== undefined;

    // If frontend filters are active, fetch all records (no pagination)
    // Otherwise, use pagination normally
    const skip = hasFrontendFilters ? 0 :
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    // Fetch all records when frontend filtering is active (reasonable upper limit)
    const take = hasFrontendFilters ? 100 :
      (this.tableConfig.pagination?.pageSize || 25);

    this.driveChecklistService
      .getDriveChecklist(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: DefineDefaultDriveChecklistModel[]; totalRecords: number }) => {
          // Apply frontend filtering for No. of Days and Condition
          const filteredData = this.applyFrontendFilters(response.data);

          // Apply sorting based on user selection or default
          let sortedData: DefineDefaultDriveChecklistModel[];
          const sortColumn = this.tableConfig.sortConfig?.column;
          const sortDirection = this.tableConfig.sortConfig?.direction;

          if (sortColumn === 'sortSeq' && sortDirection !== 'default') {
            // User explicitly sorting by sequence column
            sortedData = this.sortBySequence(filteredData, sortDirection === 'A');
          } else {
            // Default sort: by timeFlag (BD, DD, AD, CD), then by targetDays descending
            sortedData = this.sortData(filteredData);
          }

          this.dataSource = sortedData;
          this.tableConfig.pagination!.totalRecords = sortedData.length;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading drive checklist data:', error);
          // Error handling is done globally by authInterceptor
          // Ensure loading state is cleared so empty message can display
          this.isLoading = false;
          this.dataSource = [];
          this.tableConfig.pagination!.totalRecords = 0;
        }
      });
  }

  /**
   * Apply frontend filters for No. of Days and Condition
   * Backend only supports Timeline filtering
   */
  private applyFrontendFilters(data: DefineDefaultDriveChecklistModel[]): DefineDefaultDriveChecklistModel[] {
    if (!this.appliedFilters) {
      return data;
    }

    let filtered = [...data];

    // Filter by No. of Days and Condition
    if (this.appliedFilters.noOfDays !== null && this.appliedFilters.noOfDays !== undefined) {
      const targetDays = this.appliedFilters.noOfDays;
      const condition = this.appliedFilters.condition || 'GE';

      filtered = filtered.filter(item => {
        const itemDays = item.targetDays;
        if (itemDays === null || itemDays === undefined) {
          return false;
        }

        switch (condition) {
          case 'GE': // Greater than or equal
            return itemDays >= targetDays;
          case 'LE': // Less than or equal
            return itemDays <= targetDays;
          case 'EQ': // Equal
            return itemDays === targetDays;
          default:
            return true;
        }
      });
    }

    return filtered;
  }

  /**
   * Sort data by timeFlag (BD, DD, AD, CD) first, then by targetDays ascending within each group
   */
  private sortData(data: DefineDefaultDriveChecklistModel[]): DefineDefaultDriveChecklistModel[] {
    const timeFlagOrder: { [key: string]: number } = {
      'BD': 1,
      'DD': 2,
      'AD': 3,
      'CD': 4
    };

    return [...data].sort((a, b) => {
      // First sort by timeFlag order (BD, DD, AD, CD)
      const orderA = timeFlagOrder[a.timeFlag || ''] ?? 99;
      const orderB = timeFlagOrder[b.timeFlag || ''] ?? 99;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Then sort by targetDays descending within the same timeFlag group
      const daysA = a.targetDays ?? 0;
      const daysB = b.targetDays ?? 0;

      return daysB - daysA;
    });
  }

  /**
   * Sort data by sequence (sortSeq) column
   */
  private sortBySequence(data: DefineDefaultDriveChecklistModel[], ascending: boolean): DefineDefaultDriveChecklistModel[] {
    return [...data].sort((a, b) => {
      const seqA = a.sortSeq ?? 0;
      const seqB = b.sortSeq ?? 0;

      return ascending ? seqA - seqB : seqB - seqA;
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

    // Map sort direction to API format: 'A' for ascending, 'D' for descending
    if (event.direction === 'default') {
      this.requestState.sort = undefined;
    } else if (event.direction === 'A') {
      this.requestState.sort = 'A';
    } else if (event.direction === 'D') {
      this.requestState.sort = 'D';
    }

    this.loadData(false);
  }

  onRowAction(event: TableRowActionEvent<DefineDefaultDriveChecklistModel>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
      case 'delete':
        this.deleteRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: DefineDefaultDriveChecklistModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  deleteRecord(record: DefineDefaultDriveChecklistModel): void {
    if (!record || !record.actionCode || !record.chapterId) {
      return;
    }

    const dialogData: MessageDialogData = {
      title: 'Delete Checklist Item',
      message: 'Are you sure you want to delete this item from the checklist? This action will permanently remove it from the default list and cannot be undone.',
      primaryAction: { label: 'DELETE', action: 'delete' },
      secondaryAction: { label: 'CANCEL', action: 'cancel' }
    };

    const dialogRef = this.dialog.open(MessageDialog, {
      width: '555px',
      panelClass: 'delete-checklist-dialog',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'delete') {
        this.performDelete(record.actionCode!, record.chapterId!);
      }
    });
  }

  private performDelete(actionCode: string, chapterId: string): void {
    this.driveChecklistService.deleteDriveChecklist(actionCode, chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const message = response?.message || 'Drive checklist item deleted successfully';

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          this.loadData();
        }
        // Error handling is done globally by authInterceptor
      });
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;

    // Trigger resize event after panel close animation completes
    // This allows filter chips to recalculate their visible count
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 350);
  }

  onSaveSuccess(): void {
    this.loadData();
  }

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
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const portal = new ComponentPortal(DriveChecklistFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });
  }

  applyFilters(filters: DriveChecklistFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = DriveChecklistFilterChipsUtils.convertFiltersToChips(filters);

    // Backend only supports timeline filtering
    // No. of Days and Condition will be filtered on frontend
    this.requestState = {
      ...this.requestState,
      timeline: filters.timeline || undefined
    };

    // Remove targetDaysCondition and targetDays from requestState if they exist
    const { targetDaysCondition, targetDays, ...cleanedState } = this.requestState;
    this.requestState = cleanedState;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = DriveChecklistFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = DriveChecklistFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return DriveChecklistFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { targetDaysCondition, targetDays, timeline, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { targetDaysCondition, targetDays, timeline, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    // Backend only supports timeline filtering
    // No. of Days and Condition are filtered on frontend
    this.requestState = {
      ...this.requestState,
      timeline: this.appliedFilters.timeline || undefined
    };

    // Remove targetDaysCondition and targetDays if they exist
    const { targetDaysCondition, targetDays, ...cleanedState } = this.requestState;
    this.requestState = cleanedState;
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

    // Escape: Close filter panel if open
    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
