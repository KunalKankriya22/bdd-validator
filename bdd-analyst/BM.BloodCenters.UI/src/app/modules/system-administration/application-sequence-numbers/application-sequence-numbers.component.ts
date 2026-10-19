import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { ROUTES } from '../../../core/constants/route.constants';
import { UI } from '../../../core/constants/ui.constants';
import {
  ApplicationSequenceNumber,
  ApplicationSequenceNumberFilterParams,
  ApplicationSequenceNumberParamsDto,
} from './interfaces/application-sequence-number.interface';
import { getCycleDisplay } from './models/reset-cycle.enum';
import { formatTableValue, formatTableDate } from './utils/table-display.util';
import { ApplicationSequenceNumbersApiService } from './services/application-sequence-numbers-api.service';
import { FilterModalComponent } from './filter-modal/filter-modal.component';
import { SequenceFormPanelComponent } from './sequence-form-panel/sequence-form-panel.component';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableColumn, RowAction, TableSortEvent, TableRowActionEvent, TablePageEvent } from '@shared/interfaces/data-table.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

/**
 * Application Sequence Numbers Component
 * Main page component using Angular 20 signals pattern
 */
@Component({
  selector: 'app-application-sequence-numbers',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    TranslateModule,
    SequenceFormPanelComponent,
    PageHeaderWithBreadcrumb,
    FilterChips,
    SearchBar,
    DataTable,
  ],
  templateUrl: './application-sequence-numbers.component.html',
  styleUrl: './application-sequence-numbers.component.scss',
})
export class ApplicationSequenceNumbersComponent implements OnInit, OnDestroy {
  // Inject dependencies
  private apiService = inject(ApplicationSequenceNumbersApiService);
  private dialog = inject(MatDialog);
  private pageHeaderService = inject(PageHeaderService);
  private headerService = inject(HeaderService);
  private el = inject(ElementRef);

  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;

  private destroy$ = new Subject<void>();

  private _ = effect(() => {
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

  // Constants
  readonly ROUTES = ROUTES;
  readonly UI = UI.SYSTEM_ADMIN.APPLICATION_SEQUENCE_NUMBERS;

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: '',
    actions: [
      {
        label: 'ADD SEQUENCE',
        icon: 'add',
        onClick: () => this.createRecord()
      }
    ]
  };

  // Search bar configuration (matching BarCode Translation pattern)
  readonly searchConfig: SearchBarConfig = {
    placeholder: 'Search by Chapter ID, Chapter Name, or Number Type',
    minLength: 3,
    searchOnEnterOnly: true,
    ariaLabel: 'Search by Chapter ID, Chapter Name, or Number Type',
    alwaysShowTooltip: true
  };

  // Table configuration (matching BarCode Translation pattern)
  tableConfig: DataTableConfig<ApplicationSequenceNumber> = {
    columns: [
      { key: 'chapterId', header: 'Chapter ID', sortable: true, width: '120px' },
      { key: 'chapterName', header: 'Chapter Name', width: '200px' },
      { key: 'numberType', header: 'Number Type', width: '180px' },
      { key: 'maxNumber', header: 'Max Number', width: '120px' },
      { key: 'startingNumber', header: 'Start', width: '100px', valueFormatter: (v) => formatTableValue(v) },
      { key: 'resetCycle', header: 'Cycle', width: '140px', valueFormatter: (v) => getCycleDisplay(v) },
      { key: 'lastResetDate', header: 'Reset Date', width: '140px', valueFormatter: (v) => formatTableDate(v) },
    ],
    rowActions: [
      { icon: 'edit', iconSvg: 'assets/images/icons/edit.svg', label: 'Edit', action: 'edit', ariaLabel: 'Edit sequence' }
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: { column: 'chapterId', direction: 'default' },
    stickyHeader: true,
    stickyActionsColumn: true,
    showPagination: true,
    emptyMessage: 'No records found',
    loadingMessage: 'Loading application sequence numbers...',
  };

  // ========== STATE (matching Valid Product Substitution pattern) ==========

  // Filter state
  appliedFilters: ApplicationSequenceNumberFilterParams | null = null;

  // Request state (sent to API)
  requestState: ApplicationSequenceNumberParamsDto = {};

  // Data
  dataSource: ApplicationSequenceNumber[] = [];

  // Loading state
  isLoading = false;
  hasError = false;
  errorMessage = '';

  // Side panel state (matching Valid Product Substitution pattern)
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ApplicationSequenceNumber | null = null;

  // Filter panel state
  isFilterOpen = false;

  // Filter chips
  filterChips: FilterChip[] = [];

  // ========== CONSTRUCTOR ==========

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter changes to reset UI state and reload data (matching Valid Product Substitution pattern)
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset search
        if (this.searchBarComponent) {
          this.searchBarComponent.clearSearch();
        }

        // Reset filters
        this.appliedFilters = null;
        this.filterChips = [];
        this.requestState = {};

        // Close side panel if open
        this.sidePanelOpen = false;
        this.sidePanelMode = 'add';
        this.sidePanelData = null;

        // Reset sorting to default
        this.tableConfig.sortConfig = {
          column: 'chapterId',
          direction: 'default'
        };

        // Reset pagination
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
          this.tableConfig.pagination.totalRecords = 0;
        }

        // Clear data
        this.dataSource = [];
        this.hasError = false;

        // Reload data for new chapter
        this.loadData();
      });
  }

  // ========== METHODS ==========

  /**
   * Load data from API with server-side pagination (matching Valid Product Substitution pattern)
   */
  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    this.apiService
      .getApplicationSequenceNumbers(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: ApplicationSequenceNumber[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: (error: unknown) => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load application sequence numbers. Please try again.';
        }
      });
  }

  /**
   * Handle sort change from app-data-table (matching Valid Product Substitution pattern)
   */
  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    // Map DataTable direction values to API values
    // DataTable sends 'A' (ascending) or 'D' (descending)
    // API expects 'asc', 'desc', or undefined for default
    if (event.direction === 'A') {
      this.requestState.Sort = 'asc';
    } else if (event.direction === 'D') {
      this.requestState.Sort = 'desc';
    } else {
      this.requestState.Sort = undefined;
    }

    this.loadData();
  }

  /**
   * Handle row action from app-data-table (matching Valid Product Substitution pattern)
   */
  onRowAction(event: TableRowActionEvent<ApplicationSequenceNumber>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

  /**
   * Handle page change from data table (matching Valid Product Substitution pattern)
   */
  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  /**
   * Open filter modal dialog
   * Position it below the filter button
   * Filter dropdown values are now loaded from backend API on modal open
   */
  openFilterModal(event?: MouseEvent): void {
    this.isFilterOpen = true;

    // Get button position for dialog placement
    const target = event?.currentTarget as HTMLElement;
    const rect = target?.getBoundingClientRect();

    // Open modal - filter data will be loaded from API on modal open
    const dialogRef = this.dialog.open(FilterModalComponent, {
      width: '320px', // Exact width from Figma
      maxWidth: '90vw',
      data: {
        currentFilters: this.appliedFilters, // Pass current filters to show in modal
      },
      disableClose: false,
      autoFocus: false, // Prevent auto-focus on close button
      hasBackdrop: true,
      backdropClass: 'filter-backdrop',
      panelClass: 'filter-dialog-panel',
      position: rect
        ? {
            top: `${rect.bottom + 8}px`, // 8px gap (accounting for visual spacing with card margin)
            left: `${rect.left}px`,
          }
        : undefined,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: ApplicationSequenceNumberFilterParams | undefined) => {
        this.isFilterOpen = false;

        // Blur the filter button to remove focus highlight
        if (this.filterBtn?.nativeElement) {
          (this.filterBtn.nativeElement as HTMLElement).blur();
        }

        if (result !== undefined) {
          this.applyFilters(result);
        }
      });
  }

  /**
   * Apply filters (matching Valid Product Substitution pattern)
   */
  applyFilters(filters: ApplicationSequenceNumberFilterParams): void {
    this.appliedFilters = filters;

    this.filterChips = this.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      ChapterId: filters.chapterId || undefined,
      ChapterName: filters.chapterName || undefined,
      NumberType: filters.numberType || undefined,
      Cycle: filters.cycle || undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  /**
   * Remove a single filter chip (matching Valid Product Substitution pattern)
   */
  onRemoveFilterChip(chipKey: string): void {
    if (!this.appliedFilters) return;

    this.appliedFilters = {
      ...this.appliedFilters,
      [chipKey]: null
    };

    this.filterChips = this.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  /**
   * Check if any filters are active (matching Valid Product Substitution pattern)
   */
  hasActiveFilters(): boolean {
    if (!this.appliedFilters) return false;
    return (
      this.appliedFilters.chapterId !== null ||
      this.appliedFilters.chapterName !== null ||
      this.appliedFilters.numberType !== null ||
      this.appliedFilters.cycle !== null
    );
  }

  /**
   * Clear all active filters (matching Valid Product Substitution pattern)
   */
  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { ChapterId, ChapterName, NumberType, Cycle, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  /**
   * Update requestState from current filters (matching Valid Product Substitution pattern)
   */
  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { ChapterId, ChapterName, NumberType, Cycle, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      ChapterId: this.appliedFilters.chapterId || undefined,
      ChapterName: this.appliedFilters.chapterName || undefined,
      NumberType: this.appliedFilters.numberType || undefined,
      Cycle: this.appliedFilters.cycle || undefined
    };
  }

  /**
   * Convert filters to chips for display (matching Valid Product Substitution pattern)
   */
  private convertFiltersToChips(filters: ApplicationSequenceNumberFilterParams | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.chapterId) {
      chips.push({ key: 'chapterId', label: `Chapter ID: ${filters.chapterId}`, value: filters.chapterId });
    }
    if (filters.chapterName) {
      chips.push({ key: 'chapterName', label: `Chapter Name: ${filters.chapterName}`, value: filters.chapterName });
    }
    if (filters.numberType) {
      chips.push({ key: 'numberType', label: `Number Type: ${filters.numberType}`, value: filters.numberType });
    }
    if (filters.cycle) {
      chips.push({ key: 'cycle', label: `Cycle: ${getCycleDisplay(filters.cycle)}`, value: filters.cycle });
    }

    return chips;
  }

  /**
   * Handle search from app-search-bar component (matching Valid Product Substitution pattern)
   */
  onSearch(searchText: string): void {
    this.requestState.SearchKeyword = searchText || undefined;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  /**
   * Open side panel for adding new sequence (matching Valid Product Substitution pattern)
   */
  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  /**
   * Open side panel for editing sequence (matching Valid Product Substitution pattern)
   */
  editRecord(record: ApplicationSequenceNumber): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  /**
   * Close side panel (matching Valid Product Substitution pattern)
   */
  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  /**
   * Handle save success (matching Valid Product Substitution pattern)
   */
  onSaveSuccess(): void {
    this.loadData();
  }

  /**
   * Handle mode change (matching Valid Product Substitution pattern)
   */
  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
    }
  }
}
