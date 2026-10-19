import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, AfterViewInit, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, finalize } from 'rxjs';
import { first } from 'rxjs/operators';
import moment from 'moment';

import { SurveyTemplateService } from './services/survey-template.service';
import {
  SurveyTemplateModel,
  SurveyTemplateFilterValue
} from './models/survey-template.model';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SurveyTemplateFilterChipsUtils } from './utils/filter-chips.utils';
import { TemplateFilterPanel } from './template-filter-panel/template-filter-panel';
import { ROUTE_REGISTRY } from '../../../../core/constants/route-registry';
import { RouteKey } from '../../../../core/constants/route-keys';
import { removePathPrefix } from '../../../../core/utils/route-utils';
import { HeaderService } from '@shared/services/header.service';

/**
 * SurveyTemplateComponent
 * Main component for managing survey templates
 */
@Component({
  selector: 'app-survey-template',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    SearchBar,
    DataTable,
    FilterChips
  ],
  templateUrl: './survey-template.html',
  styleUrls: ['./survey-template.scss']
})
export class SurveyTemplateComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('statusBadgeTemplate') statusBadgeTemplate!: TemplateRef<unknown>;

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Template ID',
    minLength: 2,
    ariaLabel: 'Search survey templates by template ID',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  tableConfig: DataTableConfig<SurveyTemplateModel> = {
    columns: [],
    rowActions: [],
    sortConfig: {
      column: 'templateId',
      direction: 'A'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    showActionsAsMenu: true,
    enableRowHighlight: false,
    noDataIcon: 'edit',
    emptyMessage: 'No survey templates found',
    loadingMessage: 'Loading templates...',
    showPagination: false
  };

  // Data
  allData: SurveyTemplateModel[] = []; // All data from API
  dataSource: SurveyTemplateModel[] = []; // Filtered/sorted data

  appliedFilters: SurveyTemplateFilterValue | null = null;
  filterChips: FilterChip[] = [];

  isLoading = false;
  searchText = '';

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private surveyTemplateService: SurveyTemplateService,
    private overlay: Overlay,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService
  ) {
    this.initializeTableConfig();
  }

  ngOnInit(): void {
    this.loadData();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    const statusColumn = this.tableConfig.columns.find((column) => column.key === 'templateStatus');
    if (statusColumn) {
      statusColumn.cellTemplate = this.statusBadgeTemplate;
      // Trigger Input change for app-data-table so custom template is applied.
      this.tableConfig = {
        ...this.tableConfig,
        columns: [...this.tableConfig.columns]
      };
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      {
        key: 'templateId',
        header: 'Template ID',
        sortable: true,
        width: '140px',
        type: 'text'
      },
      {
        key: 'surveyTypeDescription',
        header: 'Survey Type',
        sortable: false,
        width: '150px',
        type: 'text'
      },
      {
        key: 'templateStatus',
        header: 'Status',
        sortable: false,
        width: '120px',
        type: 'custom',
        valueFormatter: (value) => value || 'Inactive'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        width: '150px',
        type: 'date',
        valueFormatter: (value) => value ? moment(value).format('DD-MMM-YYYY').toUpperCase() : '-'
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        width: '150px',
        type: 'date',
        valueFormatter: (value) => value ? moment(value).format('DD-MMM-YYYY').toUpperCase() : '-'
      }
    ];

    this.tableConfig.rowActions = [
      {
        icon: 'link',
        label: 'Link Template',
        action: 'linkTemplate'
      },
      {
        icon: 'visibility',
        label: 'View Responses',
        action: 'viewResponses'
      },
      {
        icon: 'edit',
        label: 'Edit Details',
        action: 'edit',
        color: 'warn'
      }
    ];
  }

  /**
   * Load all survey templates (client-side filtering)
   */
  loadData(): void {
    this.isLoading = true;
    this.surveyTemplateService.getSurveyTemplates()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (data) => {
          this.allData = data;
          this.applyClientSideFiltering();
        }
      });
  }

  /**
   * Apply client-side filtering and search
   */
  private applyClientSideFiltering(): void {
    let filtered = [...this.allData];

    // Apply search
    if (this.searchText) {
      const searchLower = this.searchText.toLowerCase();
      filtered = filtered.filter(item =>
        item.templateId?.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (this.appliedFilters) {
      if (this.appliedFilters.effDate && this.appliedFilters.effDatePeriod) {
        const filterDate = moment(this.appliedFilters.effDate).startOf('day');
        filtered = filtered.filter(item => {
          const itemDate = moment(item.effDate).startOf('day');
          if (this.appliedFilters!.effDatePeriod === 'after') {
            return itemDate.isSameOrAfter(filterDate);
          } else {
            return itemDate.isSameOrBefore(filterDate);
          }
        });
      }

      if (this.appliedFilters.termDate && this.appliedFilters.termDatePeriod) {
        const filterDate = moment(this.appliedFilters.termDate).startOf('day');
        filtered = filtered.filter(item => {
          if (!item.termDate) return false;
          const itemDate = moment(item.termDate).startOf('day');
          if (this.appliedFilters!.termDatePeriod === 'after') {
            return itemDate.isSameOrAfter(filterDate);
          } else {
            return itemDate.isSameOrBefore(filterDate);
          }
        });
      }

      if (this.appliedFilters.status) {
        filtered = filtered.filter(item => item.templateStatus === this.appliedFilters!.status);
      }
    }

    // Apply sorting
    if (this.tableConfig.sortConfig) {
      const { column, direction } = this.tableConfig.sortConfig;
      if (direction !== 'default' && column === 'templateId') {
        filtered.sort((a, b) => {
          const aVal = a.templateId || '';
          const bVal = b.templateId || '';
          const comparison = aVal.localeCompare(bVal);
          return direction === 'A' ? comparison : -comparison;
        });
      }
    }

    this.dataSource = filtered;
  }

  onSearch(keyword: string): void {
    this.searchText = keyword;
    this.applyClientSideFiltering();
  }

  onSearchCleared(): void {
    this.searchText = '';
    this.applyClientSideFiltering();
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.direction = event.direction;
      this.tableConfig.sortConfig.column = event.column;
    }
    this.applyClientSideFiltering();
  }

  onRowAction(event: TableRowActionEvent<SurveyTemplateModel>): void {
    switch (event.action) {
      case 'linkTemplate':
        this.navigateToLinkTemplate(event.row);
        break;
      case 'viewResponses':
        this.navigateToViewResponses(event.row);
        break;
      case 'edit':
        this.openEditTemplateDialog(event.row);
        break;
    }
  }

  navigateToLinkTemplate(template: SurveyTemplateModel): void {
    // Standalone route (not under DSM tab shell): same URL as before, different route config
    const dsmSegment = removePathPrefix(
      ROUTE_REGISTRY[RouteKey.DonorSurveyManager].path,
      '/donor-functions',
    );
    this.router.navigate(['/donor-functions', dsmSegment, 'link-template'], {
      queryParams: { templateId: template.templateId },
    });
  }

  navigateToViewResponses(template: SurveyTemplateModel): void {
    const dsmSegment = removePathPrefix(
      ROUTE_REGISTRY[RouteKey.DonorSurveyManager].path,
      '/donor-functions',
    );
    this.router.navigate(['/donor-functions', dsmSegment, 'responses', template.chapterId, template.templateId]);
  }

  navigateToEditTemplate(template: SurveyTemplateModel): void {
    const dsmSegment = removePathPrefix(
      ROUTE_REGISTRY[RouteKey.DonorSurveyManager].path,
      '/donor-functions',
    );
    this.router.navigate(['/donor-functions', dsmSegment, 'add-template'], {
      queryParams: { templateId: template.templateId },
    });
  }

  // Filter Panel
  openFilter(): void {
    if (this.isFilterOpen) {
      this.closeFilter();
      return;
    }

    const btnRect = this.filterBtn.nativeElement.getBoundingClientRect();
    const cardRect = this.tableCard.nativeElement.getBoundingClientRect();
    const offsetY = btnRect.bottom - cardRect.top;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.tableCard)
      .withPositions([
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'top', offsetY }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: '320px'
    });

    const filterPanelPortal = new ComponentPortal(TemplateFilterPanel);
    const filterPanelRef = this.overlayRef.attach(filterPanelPortal);

    filterPanelRef.instance.currentFilters = this.appliedFilters;
    filterPanelRef.instance.apply
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe((filters) => this.applyFilters(filters));

    filterPanelRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilter());

    this.overlayRef
      .backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilter());

    this.isFilterOpen = true;
  }

  closeFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
  }

  applyFilters(filters: SurveyTemplateFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = SurveyTemplateFilterChipsUtils.convertFiltersToChips(filters);
    this.closeFilter();
    this.applyClientSideFiltering();
  }

  onRemoveFilterChip(chipKey: string): void {
    if (this.appliedFilters) {
      this.appliedFilters = SurveyTemplateFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
      if (!SurveyTemplateFilterChipsUtils.hasActiveFilters(this.appliedFilters)) {
        this.appliedFilters = null;
      }
      this.filterChips = this.appliedFilters
        ? SurveyTemplateFilterChipsUtils.convertFiltersToChips(this.appliedFilters)
        : [];
      this.applyClientSideFiltering();
    }
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.applyClientSideFiltering();
  }

  hasActiveFilters(): boolean {
    return SurveyTemplateFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilter();
        this.appliedFilters = null;
        this.filterChips = [];
        this.searchText = '';
        this.searchBarComponent?.clearSearch();
        this.loadData();
      });
  }

  // Template Navigation Methods
  openAddTemplateDialog(): void {
    // Navigate to standalone add template route
    const dsmSegment = removePathPrefix(
      ROUTE_REGISTRY[RouteKey.DonorSurveyManager].path,
      '/donor-functions',
    );
    this.router.navigate(['/donor-functions', dsmSegment, 'add-template']);
  }

  openEditTemplateDialog(template: SurveyTemplateModel): void {
    // Navigate to standalone edit template route with templateId query param
    const dsmSegment = removePathPrefix(
      ROUTE_REGISTRY[RouteKey.DonorSurveyManager].path,
      '/donor-functions',
    );
    this.router.navigate(['/donor-functions', dsmSegment, 'add-template'], {
      queryParams: { templateId: template.templateId }
    });
  }

  // Keyboard Shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.altKey && event.key === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    } else if (event.altKey && event.key === 'f') {
      event.preventDefault();
      this.openFilter();
    } else if (event.key === 'Escape' && this.isFilterOpen) {
      this.closeFilter();
    }
  }
}
