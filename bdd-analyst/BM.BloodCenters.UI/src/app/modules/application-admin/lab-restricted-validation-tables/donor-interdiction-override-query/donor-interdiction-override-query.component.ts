import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { ValidDonorOverrideApiService, LookupDto } from './services/valid-donor-override-api.service';
import { LoggingService } from '@shared/services/logging.service';
import {
  DonorInterdictionOverrideQueryModel,
  DonorInterdictionOverrideQueryParamsDto,
  DonorInterdictionOverrideFilterValue
} from './models/donor-interdiction-override-query.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
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
import { DonorInterdictionOverrideFilterChipsUtils } from './utils/filter-chips.utils';
import { DonorInterdictionOverrideFilterPanel } from './donor-interdiction-override-filter-panel/donor-interdiction-override-filter-panel';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-donor-interdiction-override-query',
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
  templateUrl: './donor-interdiction-override-query.component.html',
  styleUrls: ['./donor-interdiction-override-query.component.scss']
})
export class DonorInterdictionOverrideQueryComponent implements OnInit, OnDestroy {
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
    minLength: 3,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<DonorInterdictionOverrideQueryModel> = {
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

  appliedFilters: DonorInterdictionOverrideFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: DonorInterdictionOverrideQueryModel[] = [];
  requestState: DonorInterdictionOverrideQueryParamsDto = {};
  cueOptions: LookupDto[] = [];
  typeOptions: LookupDto[] = [];

  isLoading = false;
  hasError = false;
  errorMessage = '';

  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayClose$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private service: ValidDonorOverrideApiService,
    private overlay: Overlay,
    private loggingService: LoggingService,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();
  }

  ngOnInit(): void {
    this.loadLookupOptions();
    this.loadData();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
        }
        this.loadLookupOptions();
        this.loadData();
      });
  }

  private loadLookupOptions(): void {
    this.service.getLookupCue()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.cueOptions = options;
        },
        error: (error) => {
          this.loggingService.error('Error loading cue lookup options', error);
        }
      });

    this.service.getLookupType()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.typeOptions = options;
        },
        error: (error) => {
          this.loggingService.error('Error loading type lookup options', error);
        }
      });
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
        { label: 'Donor Interdiction Override Query', link: null }
      ],
      title: 'Donor Interdiction Override Query',
      subtitle: 'View verified donor interdiction overrides',
      actions: []
    };

    this.searchConfig = {
      placeholder: 'Search by Interdiction or Description',
      minLength: 3,
      ariaLabel: 'Search by Interdiction or Description',
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
        column: 'donorDecisionCode',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: false,
      emptyMessage: 'No donor interdiction override records available to display',
      loadingMessage: 'Loading donor interdiction override data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<DonorInterdictionOverrideQueryModel>[] {
    return [
      {
        key: 'donorDecisionCode',
        header: 'Cue',
        sortable: true,
        width: '180px',
        valueFormatter: (value, row) => {
          if (!value) return '-';
          return row.decisionDesc ? `${value} - ${row.decisionDesc}` : value;
        }
      },
      {
        key: 'productType',
        header: 'Inventory Product Type',
        width: '180px'
      },
      {
        key: 'productTypeDesc',
        header: 'Inventory Product Type Description',
        width: '180px'
      },
      {
        key: 'attribGroup',
        header: 'Attribute Group',
        width: '130px'
      },
      {
        key: 'attribCode',
        header: 'Attribute Code',
        width: '120px'
      },
      {
        key: 'interCode',
        header: 'Donor Interdiction',
        width: '140px'
      },
      {
        key: 'interDesc',
        header: 'Donor Interdiction Description',
        width: '200px'
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
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    // Build query DTO from request state
    const queryDto = {
      donorDecisionCode: this.requestState.DonorDecisionCode || null,
      interType: this.requestState.InterType || null,
      searchKeyword: this.requestState.SearchKeyword || null,
      sort: this.requestState.Sort || null,
      effectiveDateFrom: this.requestState.EffectiveDatePeriod === 'After' && this.requestState.EffectiveDate
        ? this.requestState.EffectiveDate : null,
      effectiveDateTo: this.requestState.EffectiveDatePeriod === 'Before' && this.requestState.EffectiveDate
        ? this.requestState.EffectiveDate : null,
      terminationDateFrom: this.requestState.TerminationDatePeriod === 'After' && this.requestState.TerminationDate
        ? this.requestState.TerminationDate : null,
      terminationDateTo: this.requestState.TerminationDatePeriod === 'Before' && this.requestState.TerminationDate
        ? this.requestState.TerminationDate : null
    };

    this.service
      .getValidDonorOverrides(take, skip, queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data as DonorInterdictionOverrideQueryModel[];
          this.tableConfig.pagination!.totalRecords = response.total;
          this.isLoading = false;
        },
        error: (error: unknown) => {
          this.loggingService.error('Error loading donor interdiction override query data', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load data. Please try again.';
        }
      });
  }

  onSearch(searchText: string): void {
    this.requestState.SearchKeyword = searchText || undefined;

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

  /**
   * Handle sort change event.
   * Note: Sorting is only enabled on the 'Cue' (donorDecisionCode) column.
   * The backend SQL sorts by DONOR_DECISION_CODE when a sort direction is provided,
   * so we only need to pass the direction (A/D), not the column name.
   */
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

    const portal = new ComponentPortal(DonorInterdictionOverrideFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.cueOptions = this.cueOptions;
    componentRef.instance.typeOptions = this.typeOptions;

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

  applyFilters(filters: DonorInterdictionOverrideFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      DonorDecisionCode: filters.cue || undefined,
      InterType: filters.type || undefined,
      EffectiveDatePeriod: filters.effectiveDatePeriod || undefined,
      EffectiveDate: filters.effectiveDate ? DateFieldValidationUtility.serializeDateForApi(filters.effectiveDate) || undefined : undefined,
      TerminationDatePeriod: filters.terminationDatePeriod || undefined,
      TerminationDate: filters.terminationDate ? DateFieldValidationUtility.serializeDateForApi(filters.terminationDate) || undefined : undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = DonorInterdictionOverrideFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = DonorInterdictionOverrideFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return DonorInterdictionOverrideFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { DonorDecisionCode, InterType, EffectiveDatePeriod, EffectiveDate, TerminationDatePeriod, TerminationDate, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { DonorDecisionCode, InterType, EffectiveDatePeriod, EffectiveDate, TerminationDatePeriod, TerminationDate, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      DonorDecisionCode: this.appliedFilters.cue || undefined,
      InterType: this.appliedFilters.type || undefined,
      EffectiveDatePeriod: this.appliedFilters.effectiveDatePeriod || undefined,
      EffectiveDate: this.appliedFilters.effectiveDate ? DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.effectiveDate) || undefined : undefined,
      TerminationDatePeriod: this.appliedFilters.terminationDatePeriod || undefined,
      TerminationDate: this.appliedFilters.terminationDate ? DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.terminationDate) || undefined : undefined
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
