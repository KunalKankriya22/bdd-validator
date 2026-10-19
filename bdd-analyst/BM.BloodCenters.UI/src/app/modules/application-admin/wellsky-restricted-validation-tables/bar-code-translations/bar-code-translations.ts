import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { BarCodeTranslationsService } from './services/bar-code-translations.service';
import { HeaderService } from '@shared/services/header.service';
import {
  BarCodeTranslation,
  BarCodeTranslationFilter,
  BarCodeTranslationFilterValue
} from './models/bar-code-translations.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { BarCodeTranslationsFilterChipsUtils } from './utils/filter-chips.utils';
import { BarCodeFilterPanel } from './bar-code-filter-panel/bar-code-filter-panel';
import { formatTableDate } from 'src/app/modules/system-administration/application-sequence-numbers/utils/table-display.util';

@Component({
  selector: 'app-bar-code-translations',
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
  templateUrl: './bar-code-translations.html',
  styleUrls: ['./bar-code-translations.scss']
})
export class BarCodeTranslationsComponent implements OnInit, OnDestroy {
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

  tableConfig: DataTableConfig<BarCodeTranslation> = {
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
      column: 'machineCode',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: BarCodeTranslationFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: BarCodeTranslation[] = [];
  requestState: BarCodeTranslationFilter = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private barCodeTranslationsService: BarCodeTranslationsService,
    private router: Router,
    private overlay: Overlay,
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
    this.subscribeToChapterChanges();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchText = '';
        if (this.searchBarComponent) {
          this.searchBarComponent.clearSearch();
        }
        this.appliedFilters = null;
        this.filterChips = [];
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
        this.requestState = {};
        this.tableConfig.sortConfig = { column: 'machineCode', direction: 'default' };
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
          this.tableConfig.pagination.totalRecords = 0;
        }
        this.dataSource = [];
        this.hasError = false;
        this.errorMessage = '';
        this.loadData();
      });
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: '',
      subtitle: ''
    };

    this.searchConfig = {
      placeholder: 'Search by Machine Code or Eye Read Translation',
      minLength: 1,
      ariaLabel: 'Search bar code translations by machine code or eye read translation',
      searchOnEnterOnly: true
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
        column: 'machineCode',
        direction: 'default'
      },
      stickyHeader: true,
      emptyMessage: 'No bar code translations available to display',
      loadingMessage: 'Loading bar code translation data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<BarCodeTranslation>[] {
    return [
      {
        key: 'machineCode',
        header: 'Machine Code',
        sortable: true,
        width: '150px'
      },
      {
        key: 'eyeReadTrns',
        header: 'Eye Readable Translation',
        width: '200px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '150px',
        valueFormatter: (value) => formatTableDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (value) => formatTableDate(value)
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

    this.barCodeTranslationsService
      .getBarCodeTranslations(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: BarCodeTranslation[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading bar code translation data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load bar code translation data. Please try again.';
        }
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

    // Map DataTable sort event to API format: "column_asc" / "column_desc"
    const directionMap: Record<string, string> = { 'A': '_asc', 'D': '_desc' };

    this.requestState.sort =
      event.direction === 'default' ? undefined : `${event.column}${directionMap[event.direction]}`;

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

    const portal = new ComponentPortal(BarCodeFilterPanel);
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

  applyFilters(filters: BarCodeTranslationFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = BarCodeTranslationsFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      machineCode: filters.machineCode || undefined,
      eyeReadTrns: filters.eyeReadTrns || undefined,
      effDateAfter: (filters.effDatePeriod === 'AFTER' && filters.effDate) ? filters.effDate : undefined,
      effDateBefore: (filters.effDatePeriod === 'BEFORE' && filters.effDate) ? filters.effDate : undefined,
      termDateAfter: (filters.termDatePeriod === 'AFTER' && filters.termDate) ? filters.termDate : undefined,
      termDateBefore: (filters.termDatePeriod === 'BEFORE' && filters.termDate) ? filters.termDate : undefined,
    };

    // Remove the filter panel form values that shouldn't go to API
    delete (this.requestState as any).effDatePeriod;
    delete (this.requestState as any).termDatePeriod;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = BarCodeTranslationsFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = BarCodeTranslationsFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return BarCodeTranslationsFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    const { machineCode, eyeReadTrns, effDateAfter, effDateBefore, termDateAfter, termDateBefore, ...rest } = this.requestState;
    this.requestState = rest;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { machineCode, eyeReadTrns, effDateAfter, effDateBefore, termDateAfter, termDateBefore, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }
    this.requestState = {
      ...this.requestState,
      machineCode: this.appliedFilters.machineCode || undefined,
      eyeReadTrns: this.appliedFilters.eyeReadTrns || undefined,
      effDateAfter: (this.appliedFilters.effDatePeriod === 'AFTER' && this.appliedFilters.effDate) ? this.appliedFilters.effDate : undefined,
      effDateBefore: (this.appliedFilters.effDatePeriod === 'BEFORE' && this.appliedFilters.effDate) ? this.appliedFilters.effDate : undefined,
      termDateAfter: (this.appliedFilters.termDatePeriod === 'AFTER' && this.appliedFilters.termDate) ? this.appliedFilters.termDate : undefined,
      termDateBefore: (this.appliedFilters.termDatePeriod === 'BEFORE' && this.appliedFilters.termDate) ? this.appliedFilters.termDate : undefined,
    };
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
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
  }
}
