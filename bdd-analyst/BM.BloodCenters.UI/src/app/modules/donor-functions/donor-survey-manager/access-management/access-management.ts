import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { AccessManagementService } from './services/access-management.service';
import { HeaderService } from '@shared/services/header.service';
import {
  AccessManagementModel,
  AccessManagementParamsDto,
  AccessManagementFilterValue
} from './models/access-management.model';

import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
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
import { AccessManagementFilterChipsUtils } from './utils/filter-chips.utils';
import { AccessManagementFilterPanel } from './access-management-filter-panel/access-management-filter-panel';
import { AddEditAccessManagement } from './add-edit-access-management/add-edit-access-management';

@Component({
  selector: 'app-access-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditAccessManagement
  ],
  templateUrl: './access-management.html',
  styleUrls: ['./access-management.scss']
})
export class AccessManagementComponent implements OnInit, OnDestroy {

  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild(DataTable) dataTableRef?: DataTable<AccessManagementModel>;
  @ViewChild(SearchBar) searchBarRef?: SearchBar;

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Function Name',
    minLength: 2,
    ariaLabel: 'Search by Function Name',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  tableConfig: DataTableConfig<AccessManagementModel> = {
    columns: [],
    rowActions: [],
    sortConfig: {
      column: 'chapterId',
      direction: 'A'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    enableRowHighlight: false,
    noDataIcon: 'edit',
    emptyMessage: '',
    loadingMessage: '',
    showPagination: false
  };

  appliedFilters: AccessManagementFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: AccessManagementModel[] = [];
  requestState: AccessManagementParamsDto = { Sort: 'A' };

  isLoading = false;
  hasError = false;
  errorMessage = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: AccessManagementModel | null = null;

  // Filter Panel State
  isFilterOpen = false;
  private overlayRef: OverlayRef | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private accessManagementService: AccessManagementService,
    private overlay: Overlay,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();
  }

  ngOnInit(): void {
    this.loadData();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private initializeConfigurations(): void {
    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      sortConfig: {
        column: 'chapterId',
        direction: 'A'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      enableRowHighlight: false,
      noDataIcon: 'edit',
      emptyMessage: 'No access management records available to display',
      loadingMessage: 'Loading access management data...',
      showPagination: false
    };
  }

  private getTableColumns(): TableColumn<AccessManagementModel>[] {
    return [
      {
        key: 'chapterId',
        header: 'Chapter ID',
        sortable: true,
        width: '15%'
      },
      {
        key: 'type',
        header: 'Type',
        width: '20%'
      },
      {
        key: 'functionName',
        header: 'Function Name',
        width: '20%'
      },
      {
        key: 'alertRequired',
        header: 'Alert Required',
        width: '15%'
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
  }

  private formatDate(date: Date | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<AccessManagementModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit access',
        ariaLabel: 'Edit access {{functionName}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.accessManagementService
      .getAccessManagement(1000, 0, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: AccessManagementModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading access management data:', error);
          this.dataSource = [];
          this.tableConfig.emptyMessage = 'No records found';
          this.isLoading = false;
        }
      });
  }

  onSearch(searchValue: string): void {
    const trimmedSearch = searchValue?.trim() || '';
    this.requestState.SearchKeyword = trimmedSearch || undefined;
    this.updateEmptyMessage();
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    this.requestState.Sort =
      event.direction === 'default' ? undefined : event.direction;

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<AccessManagementModel>): void {
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
    if (this.dataTableRef) this.dataTableRef.activeRow = null;
  }

  editRecord(record: AccessManagementModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
    if (this.dataTableRef) this.dataTableRef.activeRow = record;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    if (this.dataTableRef) this.dataTableRef.activeRow = null;
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

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    this.isFilterOpen = true;

    const btnRect = this.filterBtn.nativeElement.getBoundingClientRect();
    const cardRect = this.tableCard.nativeElement.getBoundingClientRect();
    const offsetY = btnRect.bottom - cardRect.top;

    const positionStrategy: FlexibleConnectedPositionStrategy =
      this.overlay.position()
        .flexibleConnectedTo(this.tableCard)
        .withPositions([
          {
            originX: 'start',
            originY: 'top',
            overlayX: 'start',
            overlayY: 'top',
            offsetY,
          }
        ])
        .withPush(true)
        .withViewportMargin(16)
        .withFlexibleDimensions(false)
        .withGrowAfterOpen(false);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      width: '320px',
      minWidth: '320px',
      maxWidth: '320px'
    });

    const portal = new ComponentPortal(AccessManagementFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeFilter();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilter();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilter();
      });
  }

  closeFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
    if (this.filterBtn?.nativeElement) {
      this.filterBtn.nativeElement.blur();
    }
  }

  applyFilters(filters: AccessManagementFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = AccessManagementFilterChipsUtils.convertFiltersToChips(filters);

    // Map period + date to appropriate From/To fields for API
    let effectiveDatePeriod: string | undefined;
    let effectiveDate: string | undefined;
    let terminationDatePeriod: string | undefined;
    let terminationDate: string | undefined;

    if (filters.effectiveDateFrom) {
      effectiveDatePeriod = 'After';
      effectiveDate = filters.effectiveDateFrom;
    } else if (filters.effectiveDateTo) {
      effectiveDatePeriod = 'Before';
      effectiveDate = filters.effectiveDateTo;
    }

    if (filters.terminationDateFrom) {
      terminationDatePeriod = 'After';
      terminationDate = filters.terminationDateFrom;
    } else if (filters.terminationDateTo) {
      terminationDatePeriod = 'Before';
      terminationDate = filters.terminationDateTo;
    }

    this.requestState = {
      ...this.requestState,
      ChapterId: filters.chapterId || undefined,
      AlertRequired: filters.alertRequired || undefined,
      EffectiveDatePeriod: effectiveDatePeriod,
      EffectiveDate: effectiveDate,
      TerminationDatePeriod: terminationDatePeriod,
      TerminationDate: terminationDate
    };

    this.updateEmptyMessage();
    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = AccessManagementFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = AccessManagementFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    this.updateEmptyMessage();
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return AccessManagementFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilter();
        this.closeSidePanel();
        this.appliedFilters = null;
        this.filterChips = [];
        this.requestState = { Sort: 'A' };
        this.updateEmptyMessage();
        this.searchBarRef?.clearSearch();
        this.loadData();
      });
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { ChapterId, AlertRequired, EffectiveDatePeriod, EffectiveDate, TerminationDatePeriod, TerminationDate, ...rest } = this.requestState;
    this.requestState = rest;

    this.updateEmptyMessage();
    this.loadData();
  }

  private updateEmptyMessage(): void {
    const hasSearch = !!this.requestState.SearchKeyword;
    const hasFilters = this.hasActiveFilters();

    if (hasSearch || hasFilters) {
      this.tableConfig.emptyMessage = 'No records found';
    } else {
      this.tableConfig.emptyMessage = 'No access management records available to display';
    }
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { ChapterId, AlertRequired, EffectiveDatePeriod, EffectiveDate, TerminationDatePeriod, TerminationDate, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    // Map period + date to appropriate From/To fields for API
    let effectiveDatePeriod: string | undefined;
    let effectiveDate: string | undefined;
    let terminationDatePeriod: string | undefined;
    let terminationDate: string | undefined;

    if (this.appliedFilters.effectiveDateFrom) {
      effectiveDatePeriod = 'After';
      effectiveDate = this.appliedFilters.effectiveDateFrom;
    } else if (this.appliedFilters.effectiveDateTo) {
      effectiveDatePeriod = 'Before';
      effectiveDate = this.appliedFilters.effectiveDateTo;
    }

    if (this.appliedFilters.terminationDateFrom) {
      terminationDatePeriod = 'After';
      terminationDate = this.appliedFilters.terminationDateFrom;
    } else if (this.appliedFilters.terminationDateTo) {
      terminationDatePeriod = 'Before';
      terminationDate = this.appliedFilters.terminationDateTo;
    }

    this.requestState = {
      ...this.requestState,
      ChapterId: this.appliedFilters.chapterId || undefined,
      AlertRequired: this.appliedFilters.alertRequired || undefined,
      EffectiveDatePeriod: effectiveDatePeriod,
      EffectiveDate: effectiveDate,
      TerminationDatePeriod: terminationDatePeriod,
      TerminationDate: terminationDate
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
      const searchInput = document.querySelector<HTMLInputElement>('app-search-bar input');
      searchInput?.focus();
    }

    // Alt+F: Toggle filter
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    // Escape: Close filter panel or side panel
    if (event.key === 'Escape') {
      if (this.overlayRef) {
        event.preventDefault();
        this.closeFilter();
      } else if (this.sidePanelOpen) {
        event.preventDefault();
        this.closeSidePanel();
      }
    }
  }
}
