import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { HlaCrossReactiveGroupsService } from './services/hla-cross-reactive-groups.service';
import {
  HlaCrossReactiveGroupModel,
  HlaCrossReactiveGroupParamsDto,
  HlaCrossReactiveGroupFilterValue,
  PublicEpitopeOption,
  HlaStandardCodeDto,
  AssociatedEpitopeOption
} from './models/hla-cross-reactive-groups.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
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

import { CdkOverlayOrigin, CdkConnectedOverlay } from '@angular/cdk/overlay';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { HlaCrossReactiveGroupsFilterChipsUtils } from './utils/hla-cross-reactive-groups-filter-chips.utils';
import { HlaCrossReactiveGroupsFilterPanel } from './hla-cross-reactive-groups-filter-panel/hla-cross-reactive-groups-filter-panel';
import { AddEditHlaCrossReactiveGroups } from './add-edit-hla-cross-reactive-groups/add-edit-hla-cross-reactive-groups';

/**
 * Main component for Define HLA Cross-Reactive Groups
 * Located under Donor Functions → Recruitment
 * Follows Daylight Savings pattern with side panel for add/edit
 */
@Component({
  selector: 'app-define-hla-cross-reactive-groups',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    CdkOverlayOrigin,
    CdkConnectedOverlay,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    HlaCrossReactiveGroupsFilterPanel,
    AddEditHlaCrossReactiveGroups
  ],
  templateUrl: './define-hla-cross-reactive-groups.html',
  styleUrls: ['./define-hla-cross-reactive-groups.scss']
})
export class DefineHLACrossReactiveGroups implements OnInit, OnDestroy {

  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  headerConfig!: PageHeaderConfig;
  tableConfig!: DataTableConfig<HlaCrossReactiveGroupModel>;

  // Search
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Public Epitope ID',
    minLength: 1,
    ariaLabel: 'Search by Public Epitope ID',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };
  searchTerm = '';

  appliedFilters: HlaCrossReactiveGroupFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: HlaCrossReactiveGroupModel[] = [];
  requestState: HlaCrossReactiveGroupParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: HlaCrossReactiveGroupModel | null = null;

  get activeHighlightedRow(): HlaCrossReactiveGroupModel | null {
    return this.sidePanelData;
  }

  isFilterOpen = false;

  // Cached dropdown options
  // HLA Standards for Add/Edit panel (from VALID_MASTER_CODES)
  hlaStandardOptionsForAddEdit: HlaStandardCodeDto[] = [];
  // HLA Standards for Filter panel (from VALID_HLA_EPITOPES)
  hlaStandardOptionsForFilter: HlaStandardCodeDto[] = [];
  // Public Epitopes for Add/Edit panel
  publicEpitopeOptions: PublicEpitopeOption[] = [];
  // Associated Epitopes for Add/Edit panel
  associatedEpitopeOptions: AssociatedEpitopeOption[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private service: HlaCrossReactiveGroupsService,
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
    this.loadDropdownOptions();
    this.loadData();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset filters and search
        this.searchTerm = '';
        this.appliedFilters = null;
        this.filterChips = [];
        this.requestState = {};
        this.isFilterOpen = false;

        // Reset data and pagination
        this.dataSource = [];
        this.tableConfig.pagination!.pageIndex = 0;

        // Close side panel
        this.sidePanelOpen = false;
        this.sidePanelData = null;

        // Reload data for new chapter
        this.loadData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* -------------------------------- CONFIG -------------------------------- */

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: '',
      subtitle: '',
      actions: [
        {
          label: 'ADD NEW CROSS-REACTIVE GROUP',
          icon: 'add',
          color: 'accent',
          ariaLabel: 'Add new cross-reactive group',
          onClick: () => this.createRecord()
        }
      ]
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
        column: 'publicEpitopeId',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No HLA Cross-Reactive Groups data found',
      noDataIcon: 'edit',
      loadingMessage: 'Loading cross-reactive groups data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<HlaCrossReactiveGroupModel>[] {
    return [
      { key: 'publicEpitopeId', header: 'Public Epitope ID', sortable: true, width: '150px' },
      {
        key: 'description',
        header: 'Description',
        sortable: false,
        width: '200px',
        valueFormatter: (_value, row) => row.publicEpitopeDescription || row.description || '-'
      },
      { key: 'associatedEpitopeId', header: 'Associated Epitope ID', sortable: false, width: '180px' },
      { key: 'hlaStandard', header: 'Reference', sortable: false, width: '120px' },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '150px',
        valueFormatter: (v) => this.formatDate(v)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (v) => this.formatDate(v)
      }
    ];
  }

  private getRowActions(): RowAction<HlaCrossReactiveGroupModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit cross-reactive group',
        ariaLabel: 'Edit cross-reactive group',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  /* -------------------------------- LOAD DATA -------------------------------- */

  /**
   * Load dropdown options for filter panel and add/edit panel
   * Cached in component to avoid re-loading every time panels open
   * - HLA Standards for Add/Edit: from VALID_MASTER_CODES
   * - HLA Standards for Filter: from VALID_HLA_EPITOPES
   * - Public Epitopes: from VALID_MASTER_CODES
   */
  loadDropdownOptions(): void {
    forkJoin({
      hlaStandardsForAddEdit: this.service.getHlaStandardsFromMasterCode(),
      hlaStandardsForFilter: this.service.getHlaStandardsFromEpitopes(),
      publicEpitopes: this.service.getPublicEpitopes(),
      associatedEpitopes: this.service.getAssociatedEpitopes()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.hlaStandardOptionsForAddEdit = response.hlaStandardsForAddEdit || [];
          this.hlaStandardOptionsForFilter = response.hlaStandardsForFilter || [];
          this.publicEpitopeOptions = response.publicEpitopes || [];
          this.associatedEpitopeOptions = response.associatedEpitopes || [];
        },
        error: () => {
          this.hlaStandardOptionsForAddEdit = [];
          this.hlaStandardOptionsForFilter = [];
          this.publicEpitopeOptions = [];
          this.associatedEpitopeOptions = [];
        }
      });
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    this.service
      .getHlaCrossReactiveGroups(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.total;
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage =
            err?.error?.message ||
            'Failed to load cross-reactive groups data.';
        }
      });
  }

  /* -------------------------------- EVENTS -------------------------------- */

  onSearch(searchTerm: string): void {
    const trimmedText = searchTerm?.trim() || '';
    this.searchTerm = trimmedText;
    this.requestState.searchKeyword = trimmedText || undefined;
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  onSearchCleared(): void {
    this.searchTerm = '';
    this.requestState.searchKeyword = undefined;
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    this.tableConfig.pagination!.pageIndex = event.pageIndex;
    this.tableConfig.pagination!.pageSize = event.pageSize;
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    // Map sort direction to API format (A -> ASC, D -> DESC)
    if (event.direction === 'A' || event.direction === 'D') {
      this.requestState.sortOrder = event.direction === 'A' ? 'ASC' : 'DESC';
      this.requestState.sortColumn = this.mapColumnToApiField(event.column);
    } else {
      delete this.requestState.sortOrder;
      delete this.requestState.sortColumn;
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<HlaCrossReactiveGroupModel>): void {
    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  /* -------------------------------- FILTERS -------------------------------- */

  applyFilters(filters: HlaCrossReactiveGroupFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips =
      HlaCrossReactiveGroupsFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      hlaStandard: filters.hlaStandard || undefined,
      effectivePeriod: filters.effectivePeriod || undefined,
      effectiveDate: filters.effectiveDate || undefined,
      terminationPeriod: filters.terminationPeriod || undefined,
      terminationDate: filters.terminationDate || undefined
    };

    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { hlaStandard, effectivePeriod, effectiveDate, terminationPeriod, terminationDate, ...rest } =
      this.requestState;

    this.requestState = rest;
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  /* -------------------------------- SIDE PANEL -------------------------------- */

  createRecord(): void {
    // Reload all dropdowns to reflect any master screen changes
    forkJoin({
      publicEpitopes: this.service.getPublicEpitopes(),
      hlaStandards: this.service.getHlaStandardsFromMasterCode(),
      associatedEpitopes: this.service.getAssociatedEpitopes()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.publicEpitopeOptions = response.publicEpitopes || [];
          this.hlaStandardOptionsForAddEdit = response.hlaStandards || [];
          this.associatedEpitopeOptions = response.associatedEpitopes || [];
          this.sidePanelMode = 'add';
          this.sidePanelData = null;
          this.sidePanelOpen = true;
        },
        error: () => {
          // On error, proceed with cached values
          this.sidePanelMode = 'add';
          this.sidePanelData = null;
          this.sidePanelOpen = true;
        }
      });
  }

  editRecord(record: HlaCrossReactiveGroupModel): void {
    // Reload all dropdowns to reflect any master screen changes
    forkJoin({
      publicEpitopes: this.service.getPublicEpitopes(),
      hlaStandards: this.service.getHlaStandardsFromMasterCode(),
      associatedEpitopes: this.service.getAssociatedEpitopes()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.publicEpitopeOptions = response.publicEpitopes || [];
          this.hlaStandardOptionsForAddEdit = response.hlaStandards || [];
          this.associatedEpitopeOptions = response.associatedEpitopes || [];
          this.sidePanelMode = 'edit';
          this.sidePanelData = record;
          this.sidePanelOpen = true;
        },
        error: () => {
          // On error, proceed with cached values
          this.sidePanelMode = 'edit';
          this.sidePanelData = record;
          this.sidePanelOpen = true;
        }
      });
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  /* -------------------------------- FILTER PANEL -------------------------------- */

  openFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  closeFilterPanel(): void {
    this.isFilterOpen = false;
    // Remove focus from filter button
    if (this.filterBtn?.nativeElement) {
      this.filterBtn.nativeElement.blur();
    }
  }

  hasActiveFilters(): boolean {
    return this.filterChips.length > 0;
  }

  onRemoveFilterChip(chipKey: string): void {
    const updatedFilters =
      HlaCrossReactiveGroupsFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);

    if (updatedFilters === null) {
      this.clearAllFilters();
    } else {
      this.applyFilters(updatedFilters);
    }
  }

  /* -------------------------------- UTILITIES -------------------------------- */

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}-${d
      .toLocaleString('en-US', { month: 'short' })
      .toUpperCase()}-${d.getFullYear()}`;
  }

  private mapColumnToApiField(column: string): string {
    const columnMap: Record<string, string> = {
      'publicEpitopeId': 'PublicEpitopeId',
      'description': 'Description',
      'associatedEpitopeId': 'AssociatedEpitopeId',
      'hlaStandard': 'HlaStandard',
      'effectiveDate': 'EffectiveDate',
      'terminationDate': 'TerminationDate'
    };

    return columnMap[column] || 'PublicEpitopeId';
  }

  /* -------------------------------- KEYBOARD SHORTCUTS -------------------------------- */

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
      const searchInput = document.querySelector<HTMLInputElement>('.search-wrapper input');
      searchInput?.focus();
    }

    // Alt+F: Open filter
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    // Escape: Close filter panel if open
    if (event.key === 'Escape' && this.isFilterOpen) {
      event.preventDefault();
      this.closeFilterPanel();
    }

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
