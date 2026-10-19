import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { MatPaginatorIntl } from '@angular/material/paginator';
import moment from 'moment';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import { LabelingInterdictionOverrideService } from './services/labeling-interdiction-override.service';
import {
  LabelingInterdictionOverrideModel,
  LabelingInterdictionOverrideSearchParamsDto,
  LabelingInterdictionOverrideFilterValue
} from './models/labeling-interdiction-override.model';

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

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { LabelingInterdictionOverrideFilterChipsUtils } from './utils/filter-chips.utils';
import { LabelingInterdictionOverrideFilterPanel } from './labeling-interdiction-override-filter-panel/labeling-interdiction-override-filter-panel';
import { AddEditLabelingInterdictionOverride } from './add-edit-labeling-interdiction-override/add-edit-labeling-interdiction-override';

/**
 * Custom MatPaginatorIntl to change "Items per page" to "Rows per page"
 */
export function getLabelingInterdictionOverridePaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Rows per page:';
  return paginatorIntl;
}

@Component({
  selector: 'app-labeling-interdiction-override',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditLabelingInterdictionOverride
  ],
  providers: [
    { provide: MatPaginatorIntl, useFactory: getLabelingInterdictionOverridePaginatorIntl }
  ],
  templateUrl: './labeling-interdiction-override.html',
  styleUrls: ['./labeling-interdiction-override.scss']
})
export class LabelingInterdictionOverrideComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 2,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<LabelingInterdictionOverrideModel> = {
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
      column: 'donorDecisionCode',
      direction: 'A'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: LabelingInterdictionOverrideFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: LabelingInterdictionOverrideModel[] = [];
  requestState: LabelingInterdictionOverrideSearchParamsDto = { Sort: 'A' };

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: LabelingInterdictionOverrideModel | null = null;
  editingRow: LabelingInterdictionOverrideModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private overrideService: LabelingInterdictionOverrideService,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService
  ) {
    this.initializeConfigurations();

    // Update header config from menu-items API response
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
          label: 'Labeling Interdiction Override: Tech1',
          link: null
        }
      ],
      title: '',
      subtitle: '',
      actions: [{
        label: 'ADD NEW OVERRIDE',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new labeling interdiction override',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Interdiction or Description',
      minLength: 2,
      ariaLabel: 'Search labeling interdiction overrides'
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
        column: 'donorDecisionCode',
        direction: 'A'
      },
      enableRowHighlight: false,
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No labeling interdiction override: tech1 available to display.',
      loadingMessage: 'Loading labeling interdiction override: tech1 data...',
      noDataIcon: 'edit',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<LabelingInterdictionOverrideModel>[] {
    return [
      {
        key: 'donorDecisionCode',
        header: 'Cue',
        sortable: true,
        width: '220px',
        valueFormatter: (_value, row) => {
          const code = row?.donorDecisionCode || '';
          const desc = row?.donorDecisionDescription || '';
          return desc ? `${code} - ${desc}` : code;
        }
      },
      {
        key: 'productType',
        header: 'Lab Product Type',
        width: '130px'
      },
      {
        key: 'productTypeDescription',
        header: 'Lab Product Type Description',
        width: '200px'
      },
      {
        key: 'interCode',
        header: 'Interdiction',
        width: '120px'
      },
      {
        key: 'interDescription',
        header: 'Interdiction Description',
        width: '200px'
      },
      {
        key: 'interType',
        header: 'Type',
        width: '120px'
      },
      {
        key: 'overrideDescription',
        header: 'Description',
        width: '200px'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '150px',
        valueFormatter: (value) => value ? DateFieldValidationUtility.formatDateForUI(moment(String(value))) : '-'
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (value) => value ? DateFieldValidationUtility.formatDateForUI(moment(String(value))) : '-'
      }
    ];
  }

  private getRowActions(): RowAction<LabelingInterdictionOverrideModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit override',
        ariaLabel: 'Edit override {{donorDecisionCode}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    this.overrideService
      .getLabelingInterdictionOverrides(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: LabelingInterdictionOverrideModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load labeling interdiction override data. Please try again.';
        }
      });
  }

  /**
   * Handles (search) event from SearchBar.
   * Only acts when the input is cleared to empty (reload default data).
   */
  onSearchEvent(searchText: string): void {
    const trimmed = (searchText || '').trim();
    if (trimmed === '') {
      this.requestState.SearchKeyword = undefined;
      if (this.tableConfig.pagination) {
        this.tableConfig.pagination.pageIndex = 0;
      }
      this.loadData();
    }
  }

  /**
   * Handles Enter key press on the search bar.
   * SearchKeyword applies OR logic across Decision Description, Interdiction Description, and Override Description on the backend.
   * Only triggers if input has 3 or more characters.
   */
  onEnterSearch(): void {
    const text = this.searchBarComponent?.searchText?.trim() || '';
    if (text.length >= 2) {
      this.requestState.SearchKeyword = text;
      if (this.tableConfig.pagination) {
        this.tableConfig.pagination.pageIndex = 0;
      }
      this.loadData();
    }
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
    this.requestState.Sort = event.direction === 'D' ? 'D' : 'A';
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<LabelingInterdictionOverrideModel>): void {
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
  }

  editRecord(record: LabelingInterdictionOverrideModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.editingRow = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.editingRow = null;
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
      this.closeFilterOverlay();
      return;
    }

    this.isFilterOpen = true;
    this.filterBtn?.nativeElement?.blur();

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
          offsetY: 50
        }
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const portal = new ComponentPortal(LabelingInterdictionOverrideFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
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
      this.filterBtn?.nativeElement?.focus();
    }
  }

  applyFilters(filters: LabelingInterdictionOverrideFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      DonorDecisionCode: filters.donorDecisionCode || undefined,
      InterType: filters.interType || undefined,
      EffectivePeriod: filters.effectiveDatePeriod?.toLowerCase() || undefined,
      EffectiveDate: DateFieldValidationUtility.serializeDateForApi(filters.effectiveDate),
      TerminationPeriod: filters.terminationDatePeriod?.toLowerCase() || undefined,
      TerminationDate: DateFieldValidationUtility.serializeDateForApi(filters.terminationDate)
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = LabelingInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return LabelingInterdictionOverrideFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { DonorDecisionCode, InterType, EffectivePeriod, EffectiveDate, TerminationPeriod, TerminationDate, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { DonorDecisionCode, InterType, EffectivePeriod, EffectiveDate, TerminationPeriod, TerminationDate, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      DonorDecisionCode: this.appliedFilters.donorDecisionCode || undefined,
      InterType: this.appliedFilters.interType || undefined,
      EffectivePeriod: this.appliedFilters.effectiveDatePeriod?.toLowerCase() || undefined,
      EffectiveDate: DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.effectiveDate),
      TerminationPeriod: this.appliedFilters.terminationDatePeriod?.toLowerCase() || undefined,
      TerminationDate: DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.terminationDate)
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

    // Escape: Close filter panel if open
    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.closeFilterOverlay();
    }

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
