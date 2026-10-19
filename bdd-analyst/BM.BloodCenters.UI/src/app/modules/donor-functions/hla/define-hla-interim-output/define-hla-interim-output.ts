import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import moment from 'moment';

import { HlaInterimOutputService } from './services/hla-interim-output.service';
import {
  HlaInterimOutput,
  HlaInterimOutputSearchParams,
  InterimCodeLov,
  DropdownOption,
  HlaInterimOutputFilterValues
} from './models/hla-interim-output.model';
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

import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { HlaInterimOutputFilterChipsUtils } from './utils/filter-chips.utils';
import { HlaInterimOutputFilterPanel } from './filter-panel/hla-interim-output-filter-panel';
import { AddEditHlaInterimOutput } from './add-edit-hla-interim-output/add-edit-hla-interim-output';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { PageHeaderService } from '@shared/services/page-header.service';

@Component({
  selector: 'app-define-hla-interim-output',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditHlaInterimOutput
  ],
  templateUrl: './define-hla-interim-output.html',
  styleUrls: ['./define-hla-interim-output.scss'],
})
export class DefineHlaInterimOutput implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 1,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<HlaInterimOutput> = {
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
      column: 'hlaCode',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: HlaInterimOutputSearchParams | null = null;
  filterChips: FilterChip[] = [];

  dataSource: HlaInterimOutput[] = [];
  requestState: HlaInterimOutputSearchParams = {};
  searchText = '';

  isLoading = false;
  hasError = false;

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: HlaInterimOutput | null = null;
  highlightedRow: HlaInterimOutput | null = null;

  // Filter Panel State
  isFilterOpen = false;

  // LOV data for dialogs and filters
  interimCodeLovData: InterimCodeLov[] = [];
  filterValues: HlaInterimOutputFilterValues | null = null;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  /**
   * Check if search and filter should be disabled
   * Only disable during loading or error states
   * Keep enabled even when no data - users need to modify filters
   */
  get isSearchAndFilterDisabled(): boolean {
    return this.isLoading || this.hasError;
  }

  constructor(
    private service: HlaInterimOutputService,
    private overlay: Overlay,
    private snackBar: MatSnackBar,
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
    this.loadLovDataAndTable();
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
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: '',
      subtitle: '',
      actions: [{
        label: 'ADD NEW COMBINATION',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new HLA interim output combination',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by A1A1, A1A2, A2A1, A2A2, Outcome Antigen 1, Outcome Antigen 2',
      minLength: 1,
      ariaLabel: 'Search HLA interim output configurations by match codes and outcome antigens',
      searchOnEnterOnly: true,
      alwaysShowTooltip: true
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
        column: 'matchA1A1',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No HLA Interim Output configurations found',
      noDataIcon: 'edit',
      loadingMessage: 'Loading HLA interim output data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<HlaInterimOutput>[] {
    return [
      {
        key: 'matchA1A1',
        header: 'A1A1',
        sortable: true,
        width: '150px',
        valueFormatter: (value, row) => row?.matchA1A1Description || value || '-'
      },
      {
        key: 'matchA1A2',
        header: 'A1A2',
        sortable: false,
        width: '150px',
        valueFormatter: (value, row) => row?.matchA1A2Description || value || '-'
      },
      {
        key: 'matchA2A1',
        header: 'A2A1',
        sortable: false,
        width: '150px',
        valueFormatter: (value, row) => row?.matchA2A1Description || value || '-'
      },
      {
        key: 'matchA2A2',
        header: 'A2A2',
        sortable: false,
        width: '150px',
        valueFormatter: (value, row) => row?.matchA2A2Description || value || '-'
      },
      {
        key: 'outcomeAntigenA1',
        header: 'Outcome Antigen A1',
        sortable: false,
        width: '180px',
        valueFormatter: (value, row) => row?.outcomeAntigenA1Description || value || '-'
      },
      {
        key: 'outcomeAntigenA2',
        header: 'Outcome Antigen A2',
        sortable: false,
        width: '180px',
        valueFormatter: (value, row) => row?.outcomeAntigenA2Description || value || '-'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value) => value ? moment(value).format('DD-MMM-YYYY').toUpperCase() : '-'
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value) => value ? moment(value).format('DD-MMM-YYYY').toUpperCase() : '-'
      }
    ];
  }

  private getRowActions(): RowAction<HlaInterimOutput>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit configuration',
        ariaLabel: 'Edit HLA interim output {{matchA1A1}}-{{matchA1A2}}-{{matchA2A1}}-{{matchA2A2}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private loadLovDataAndTable(): void {
    // Set loading state immediately to prevent "No data found" flash
    this.isLoading = true;
    this.hasError = false;

    // Load LOV data first, then load table data
    forkJoin({
      interimCodes: this.service.getInterimCodesLov(),
      filterValues: this.service.getFilterValues()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.interimCodeLovData = result.interimCodes || [];
          this.filterValues = result.filterValues || null;

          // Now load table data after LOV is ready
          // loadData() will handle setting isLoading = false
          this.loadData();
        },
        error: () => {
          this.interimCodeLovData = [];
          this.filterValues = null;
          // Still load table data even if LOV fails
          // loadData() will handle setting isLoading = false
          this.loadData();
        }
      });
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const pageSize = this.tableConfig.pagination?.pageSize || 25;
    const pageIndex = this.tableConfig.pagination?.pageIndex || 0;
    const skip = pageIndex * pageSize;

    // Build search params from requestState
    const searchParams: HlaInterimOutputSearchParams = {
      ...this.requestState
    };

    // Add sorting if configured
    if (this.tableConfig.sortConfig?.column && this.tableConfig.sortConfig.direction !== 'default') {
      // Map frontend column names to backend PascalCase format
      const columnMap: Record<string, string> = {
        'matchA1A1': 'MatchA1A1',
        'matchA1A2': 'MatchA1A2',
        'matchA2A1': 'MatchA2A1',
        'matchA2A2': 'MatchA2A2',
        'outcomeAntigenA1': 'OutputA1',
        'outcomeAntigenA2': 'OutputA2',
        'effectiveDate': 'EffDate',
        'terminationDate': 'TermDate'
      };
      searchParams.sortColumn = columnMap[this.tableConfig.sortConfig.column] || this.tableConfig.sortConfig.column;
      searchParams.sortOrder = this.tableConfig.sortConfig.direction === 'A' ? 'ASC' : 'DESC';
    }

    this.service
      .getAll(pageSize, skip, searchParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: HlaInterimOutput[]; total: number }) => {
          this.dataSource = response.data || [];
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.total || 0;
          }
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.dataSource = [];
          this.snackBar.open('Failed to load HLA interim output data. Please try again.', 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  onSearch(searchText: string): void {
    this.searchText = searchText;
    this.requestState.searchText = searchText || undefined;

    // Reset to first page when searching
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
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<HlaInterimOutput>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.highlightedRow = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: HlaInterimOutput): void {
    this.sidePanelMode = 'edit';
    this.highlightedRow = record;

    // Fetch fresh data from API using match codes
    if (record.matchA1A1 && record.matchA1A2 && record.matchA2A1 && record.matchA2A2) {
      this.service.getByMatchCodes(
        record.matchA1A1,
        record.matchA1A2,
        record.matchA2A1,
        record.matchA2A2
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.sidePanelData = data || record;
          this.sidePanelOpen = true;
        },
        error: () => {
          // Fallback to row data if API call fails
          this.sidePanelData = record;
          this.sidePanelOpen = true;
          this.snackBar.open('Failed to load record details. Showing cached data.', 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      // Fallback if match codes are missing
      this.sidePanelData = record;
      this.sidePanelOpen = true;
    }
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.highlightedRow = null;
  }

  onSaveSuccess(): void {
    // Reload LOV data (filter dropdowns) and table data to include newly added record
    this.loadLovData();
    this.loadData();
  }

  /**
   * Reload LOV data (interim codes and filter values) without reloading table
   * Called after adding/editing a record to refresh dropdown options
   */
  private loadLovData(): void {
    forkJoin({
      interimCodes: this.service.getInterimCodesLov(),
      filterValues: this.service.getFilterValues()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.interimCodeLovData = result.interimCodes || [];
          this.filterValues = result.filterValues || null;
        },
        error: () => {
          // Keep existing values if reload fails
          console.error('Failed to reload LOV data');
        }
      });
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
      .withPush(true)
      .withViewportMargin(16)
      .withFlexibleDimensions(false)
      .withGrowAfterOpen(false);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      width: '400px',
      minWidth: '400px',
      maxWidth: '400px'
    });

    const portal = new ComponentPortal(HlaInterimOutputFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    // Create a subject that completes when the overlay is detached to prevent subscription leaks
    const overlayClose$ = new Subject<void>();
    this.overlayRef.detachments()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        overlayClose$.next();
        overlayClose$.complete();
      });

    componentRef.instance.currentFilters = this.appliedFilters;

    // Helper function to transform FilterValueItem array to DropdownOptions
    const transformFilterItems = (items: any[]): DropdownOption[] => {
      if (!items || items.length === 0) return [];
      return items.map(item => ({
        value: item.match,
        label: `${item.match} - ${item.description}`
      }));
    };

    // Use filter values from API if available, otherwise fallback to interim code LOV
    if (this.filterValues) {
      componentRef.instance.matchA1A1Options = transformFilterItems(this.filterValues.matchA1A1 || []);
      componentRef.instance.matchA1A2Options = transformFilterItems(this.filterValues.matchA1A2 || []);
      componentRef.instance.matchA2A1Options = transformFilterItems(this.filterValues.matchA2A1 || []);
      componentRef.instance.matchA2A2Options = transformFilterItems(this.filterValues.matchA2A2 || []);
      componentRef.instance.outcomeAntigenA1Options = transformFilterItems(this.filterValues.outputA1 || []);
      componentRef.instance.outcomeAntigenA2Options = transformFilterItems(this.filterValues.outputA2 || []);
    } else {
      // Fallback to interim code LOV data for all dropdowns
      const fallbackOptions = this.interimCodeLovData.map(i => ({
        value: i.interimCode,
        label: `${i.interimCode} - ${i.interimDescription}`
      }));
      componentRef.instance.matchA1A1Options = fallbackOptions;
      componentRef.instance.matchA1A2Options = fallbackOptions;
      componentRef.instance.matchA2A1Options = fallbackOptions;
      componentRef.instance.matchA2A2Options = fallbackOptions;
      componentRef.instance.outcomeAntigenA1Options = fallbackOptions;
      componentRef.instance.outcomeAntigenA2Options = fallbackOptions;
    }

    componentRef.instance.apply
      .pipe(takeUntil(overlayClose$))
      .subscribe(filters => {
        this.applyFilters(filters);
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    componentRef.instance.close
      .pipe(takeUntil(overlayClose$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(overlayClose$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });
  }

  applyFilters(filters: HlaInterimOutputSearchParams): void {
    this.appliedFilters = filters;
    this.filterChips = HlaInterimOutputFilterChipsUtils.convertFiltersToChips(filters);

    // Update requestState, preserving searchText
    this.requestState = {
      searchText: this.requestState.searchText,
      ...filters
    };

    // Reset to first page when applying filters
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = HlaInterimOutputFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );
    this.filterChips = HlaInterimOutputFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    // Update requestState with the new filters, preserving searchText
    this.requestState = {
      searchText: this.requestState.searchText,
      ...(this.appliedFilters || {})
    };

    // Reset to first page when removing filter
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return HlaInterimOutputFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    // Update requestState, preserving searchText
    this.requestState = {
      searchText: this.requestState.searchText
    };

    // Reset to first page when clearing filters
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleChapterChange();
      });
  }

  private handleChapterChange(): void {
    // Reset filters and search
    this.appliedFilters = null;
    this.filterChips = [];
    this.isFilterOpen = false;
    this.searchText = '';
    this.requestState = {};
    this.hasError = false;

    // Reset search bar
    if (this.searchBarComponent) {
      this.searchBarComponent.searchText = '';
    }

    // Close panels
    this.closeSidePanel();

    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }

    this.dataSource = [];

    // Reset pagination to first page
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    // Reload data for new chapter
    this.loadLovDataAndTable();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      this.createRecord();
    }

    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }

    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
