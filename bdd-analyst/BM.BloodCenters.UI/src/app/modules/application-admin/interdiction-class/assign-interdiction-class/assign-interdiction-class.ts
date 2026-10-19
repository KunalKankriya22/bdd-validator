import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { DatePipe } from '@angular/common';

import { AssignInterdictionClassService } from '../services/assign-interdiction-class.service';
import {
  AssignInterdictionClassModel,
  AssignInterdictionClassParamsDto,
  AssignInterdictionClassFilterValue
} from '../models/assign-interdiction-class.model';

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
import { A11yModule } from '@angular/cdk/a11y';
import { ComponentPortal } from '@angular/cdk/portal';

import { AssignInterdictionFilterPanel } from '../assign-interdiction-filter-panel/assign-interdiction-filter-panel';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { FilterChipsUtils } from '../utils/filter-chips.utils';
import { AddEditInterdictionClass, InterdictionClassFormData } from '../add-edit-interdiction-class/add-edit-interdiction-class';


@Component({
  selector: 'app-assign-interdiction-class-table',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    DatePipe,
    AddEditInterdictionClass,
    A11yModule
  ],
  templateUrl: './assign-interdiction-class.html',
  styleUrls: ['./assign-interdiction-class.scss']
})
export class AssignInterdictionClass implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild('announcer') announcerEl!: ElementRef<HTMLDivElement>;

  // Validation constants
  readonly VALIDATION = {
    LIMITS: {
      SEARCH_MIN_LENGTH: 3,
      DEFAULT_PAGE_SIZE: 25,
      DESCRIPTION_TRUNCATE_LENGTH: 50
    }
  };

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

  tableConfig: DataTableConfig<AssignInterdictionClassModel> = {
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
      column: 'interdictionCode',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: AssignInterdictionClassFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: AssignInterdictionClassModel[] = [];
  requestState: AssignInterdictionClassParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: AssignInterdictionClassModel | null = null;

  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private lastFocusedElement: HTMLElement | null = null;

  currentYear: number = new Date().getFullYear();

  constructor(
    private assignInterdictionClassService: AssignInterdictionClassService,
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
          breadcrumbs: [
            {
              label: 'Home',
              link: '/home'
            },
            {
              label: pageData.title,
              link: null
            }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
          actions: [{
            label: 'ADD INTERDICTION CLASS',
            icon: 'add',
            color: 'accent',
            ariaLabel: 'Add new interdiction class',
            onClick: () => this.createRecord()
          }]
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadTableData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private initializeConfigurations(): void {
    // Header config is now populated dynamically via PageHeaderService in the constructor effect
    // Keep initial empty state

    this.searchConfig = {
      placeholder: 'Search by Interdiction Code or Description',
      minLength: this.VALIDATION.LIMITS.SEARCH_MIN_LENGTH,
      ariaLabel: 'Search interdiction classes by code or description',
      searchOnEnterOnly: true,
      alwaysShowTooltip: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: this.VALIDATION.LIMITS.DEFAULT_PAGE_SIZE,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      sortConfig: {
        column: 'interdictionCode',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No Interdiction class available to display',
      loadingMessage: 'Loading interdiction class data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<AssignInterdictionClassModel>[] {
    return [
      {
        key: 'interdictionCode',
        header: 'Interdiction Code',
        sortable: true,
        width: '120px'
      },
      {
        key: 'description',
        header: 'Description',
        width: '321px',
        truncate: true,
        truncateLength: this.VALIDATION.LIMITS.DESCRIPTION_TRUNCATE_LENGTH
      },
      {
        key: 'type',
        header: 'Type',
        width: '120px',
        valueFormatter: (value) => this.formatType(value)
      },
      {
        key: 'class',
        header: 'Class',
        width: '100px'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'modificationDate',
        header: 'Modified Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<AssignInterdictionClassModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit interdiction class',
        ariaLabel: 'Edit interdiction class',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private formatType(value: string | null): string {
    const typeMap: Record<string, string> = {
      'I': 'Initial',
      'H': 'Hold',
      'B': 'Bio',
      'N': 'NFT'
    };
    return value ? (typeMap[value] || value) : '-';
  }

  private formatDate(date: Date | null): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private formatDateString(date: string | null): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  loadTableData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.announceToScreenReader('Loading interdiction class data');

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 10);

    const take = this.tableConfig.pagination?.pageSize || 10;

    this.assignInterdictionClassService
      .getAssignInterdictionClass(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
          this.announceToScreenReader(
            `${response.totalRecords} interdiction class record${response.totalRecords !== 1 ? 's' : ''} loaded`
          );
        },
        error: (error) => {
          console.error('Error loading assign interdiction class data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'No Interdiction class available to display';
          this.announceToScreenReader('Error: No interdiction class available to display');
        }
      });
  }

  onSearch(searchText: string): void {
    this.requestState.SearchKeyword = searchText || undefined;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadTableData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    this.requestState.Sort =
      event.direction === 'default' ? undefined : event.direction;

    this.loadTableData();
  }

  onRowAction(event: TableRowActionEvent<AssignInterdictionClassModel>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this.lastFocusedElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: AssignInterdictionClassModel): void {
    this.lastFocusedElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    setTimeout(() => {
      this.lastFocusedElement?.focus();
      this.lastFocusedElement = null;
    }, 0);
  }

  onSaveSuccess(): void {
    this.announceToScreenReader('Interdiction class saved successfully');
    setTimeout(() => this.loadTableData(), 600);
  }

  private announceToScreenReader(message: string): void {
    if (!this.announcerEl) return;
    const el = this.announcerEl.nativeElement;
    el.textContent = '';
    setTimeout(() => { el.textContent = message; }, 50);
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

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

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    this.isFilterOpen = true;

    const portal = new ComponentPortal(AssignInterdictionFilterPanel);
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

  applyFilters(filters: AssignInterdictionClassFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = FilterChipsUtils.convertFiltersToChips(
      filters,
      (date: string | null) => this.formatDateString(date)
    );

    this.requestState = {
      ...this.requestState,
      InterdictionCode: filters.interdictionCode || undefined,
      Type: filters.type || undefined,
      Class: filters.class || undefined,
      EffectiveDatePeriod: filters.effectiveDatePeriod || undefined,
      EffectiveDate: filters.effectiveDate || undefined,
      TerminationDatePeriod: filters.terminationDatePeriod || undefined,
      TerminationDate: filters.terminationDate || undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = FilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);

    this.filterChips = FilterChipsUtils.convertFiltersToChips(
      this.appliedFilters,
      (date: string | null) => this.formatDateString(date)
    );

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  hasActiveFilters(): boolean {
    return FilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { InterdictionCode, Type, Class, EffectiveDatePeriod, EffectiveDate, TerminationDatePeriod, TerminationDate, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { InterdictionCode, Type, Class, EffectiveDatePeriod, EffectiveDate, TerminationDatePeriod, TerminationDate, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      InterdictionCode: this.appliedFilters.interdictionCode || undefined,
      Type: this.appliedFilters.type || undefined,
      Class: this.appliedFilters.class || undefined,
      EffectiveDatePeriod: this.appliedFilters.effectiveDatePeriod || undefined,
      EffectiveDate: this.appliedFilters.effectiveDate || undefined,
      TerminationDatePeriod: this.appliedFilters.terminationDatePeriod || undefined,
      TerminationDate: this.appliedFilters.terminationDate || undefined
    };
  }

  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
    }
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