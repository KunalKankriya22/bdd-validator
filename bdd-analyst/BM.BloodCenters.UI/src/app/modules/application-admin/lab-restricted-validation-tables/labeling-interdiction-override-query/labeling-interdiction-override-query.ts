import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { LabelingInterdictionOverrideQueryService } from './services/labeling-interdiction-override-query.service';
import {
  LabelingInterdictionOverrideQueryModel,
  LabelingInterdictionOverrideQueryParamsDto,
  LabelingInterdictionOverrideFilterValue
} from './models/labeling-interdiction-override-query.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent
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

@Component({
  selector: 'app-labeling-interdiction-override-query',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips
  ],
  templateUrl: './labeling-interdiction-override-query.html',
  styleUrls: ['./labeling-interdiction-override-query.scss']
})
export class LabelingInterdictionOverrideQueryComponent implements OnInit, OnDestroy {
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
    minLength: 2,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<LabelingInterdictionOverrideQueryModel> = {
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
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: false,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: LabelingInterdictionOverrideFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: LabelingInterdictionOverrideQueryModel[] = [];
  requestState: LabelingInterdictionOverrideQueryParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';

  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayClose$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private service: LabelingInterdictionOverrideQueryService,
    private router: Router,
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
    this.overlayClose$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private closeOverlay(): void {
    this.overlayClose$.next();
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Labeling Interdiction Override Query', link: null }
      ],
      title: '',
      subtitle: '',
      actions: []
    };

    this.searchConfig = {
      placeholder: 'Search by Interdiction or Description',
      minLength: 2,
      ariaLabel: 'Search by Interdiction or Description',
      alwaysShowTooltip: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
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
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: false,
      emptyMessage: 'No Labeling Interdiction Override Query data found.',
      loadingMessage: 'Loading labeling interdiction override data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<LabelingInterdictionOverrideQueryModel>[] {
    return [
      {
        key: 'donorDecisionCode',
        header: 'Cue',
        sortable: true,
        width: '220px',
        valueFormatter: (_value, row) => {
          const code = row?.donorDecisionCode || '';
          const desc = row?.decisionDesc || '';
          return desc ? `${code} - ${desc}` : code;
        }
      },
      {
        key: 'productType',
        header: 'Lab Product Type',
        width: '130px'
      },
      {
        key: 'productTypeDesc',
        header: 'Lab Product Type Description',
        width: '200px'
      },
      {
        key: 'interCode',
        header: 'Interdiction',
        width: '120px'
      },
      {
        key: 'interDesc',
        header: 'Interdiction Description',
        width: '180px'
      },
      {
        key: 'interType',
        header: 'Type',
        width: '80px'
      },
      {
        key: 'overrideDesc',
        header: 'Description',
        width: '180px'
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
        width: '130px',
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

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 10);

    const take = this.tableConfig.pagination?.pageSize || 10;

    this.service
      .getLabelingInterdictionOverrideQuery(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'No Labeling Interdiction Override Query data found.';
        }
      });
  }

  /**
   * Handles (search) event from SearchBar.
   * Only acts when the input is cleared to empty (reload default data).
   */
  onSearch(searchText: string): void {
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

    this.requestState.Sort =
      event.direction === 'default' ? undefined : event.direction;

    this.loadData();
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.closeOverlay();
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

    const portal = new ComponentPortal(LabelingInterdictionOverrideFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeOverlay();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeOverlay();
      });
  }

  applyFilters(filters: LabelingInterdictionOverrideFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = LabelingInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      DonorDecisionCode: filters.cue || undefined,
      InterType: filters.type || undefined,
      EffectivePeriod: filters.effectiveDatePeriod?.toLowerCase() || undefined,
      EffectiveDate: this.formatDateForApi(filters.effectiveDate),
      TerminationPeriod: filters.terminationDatePeriod?.toLowerCase() || undefined,
      TerminationDate: this.formatDateForApi(filters.terminationDate)
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private formatDateForApi(date: any): string | undefined {
    if (!date) return undefined;

    // Use Moment's format() to extract local date components and avoid
    // timezone shift that occurs with toISOString() (which converts to UTC).
    if (date.format) {
      return date.format('YYYY-MM-DD');
    }

    // Fallback for plain Date objects: use local date components
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
      DonorDecisionCode: this.appliedFilters.cue || undefined,
      InterType: this.appliedFilters.type || undefined,
      EffectivePeriod: this.appliedFilters.effectiveDatePeriod?.toLowerCase() || undefined,
      EffectiveDate: this.formatDateForApi(this.appliedFilters.effectiveDate),
      TerminationPeriod: this.appliedFilters.terminationDatePeriod?.toLowerCase() || undefined,
      TerminationDate: this.formatDateForApi(this.appliedFilters.terminationDate)
    };
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
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
      this.closeOverlay();
    }
  }
}
