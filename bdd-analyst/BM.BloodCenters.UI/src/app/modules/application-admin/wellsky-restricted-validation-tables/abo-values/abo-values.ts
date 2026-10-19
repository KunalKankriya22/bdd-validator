import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, AfterViewChecked, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { AboValuesService } from './services/abo-values.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import {
  AboValuesModel,
  AboValuesParamsDto,
  AboValuesFilterValue,
  DropdownOption
} from './models/abo-values.model';

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

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AboValuesFilterChipsUtils } from './utils/filter-chips.utils';
import { AboValuesFilterPanel } from './abo-values-filter-panel/abo-values-filter-panel';
import { AddEditAboValues } from './add-edit-abo-values/add-edit-abo-values';

@Component({
  selector: 'app-abo-values',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditAboValues
  ],
  templateUrl: './abo-values.html',
  styleUrls: ['./abo-values.scss']
})
export class AboValuesComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild('sidePanelContainer', { read: ElementRef }) sidePanelContainer?: ElementRef<HTMLElement>;

  private previouslyFocusedElement: HTMLElement | null = null;
  private sidePanelFocusPending = false;

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

  tableConfig: DataTableConfig<AboValuesModel> = {
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
      column: 'testedAbo',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: AboValuesFilterValue | null = null;
  filterChips: FilterChip[] = [];

  // Filter options for key-to-value conversion
  intendedUseOptions: DropdownOption[] = [];
  unitSchemeOptions: DropdownOption[] = [];
  transfusionStatusOptions: DropdownOption[] = [];

  dataSource: AboValuesModel[] = [];
  requestState: AboValuesParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Filter Panel State
  isFilterOpen = false;

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: AboValuesModel | null = null;
  selectedRow: AboValuesModel | null = null;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  currentYear: number = new Date().getFullYear();

  constructor(
    private aboValuesService: AboValuesService,
    private router: Router,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
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
    this.loadFilterOptions();
    this.loadData();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
      });
  }

  private loadFilterOptions(): void {
    this.aboValuesService.getAboValuesFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let filterData = null;

          if (response.data && response.data.length > 0) {
            filterData = response.data[0];
          } else if (response.item) {
            filterData = response.item;
          }

          if (filterData) {
            this.intendedUseOptions = filterData.intendedUse || [];
            this.unitSchemeOptions = filterData.unitScheme || [];
            this.transfusionStatusOptions = filterData.transfusionStatus || [];
          }
        },
        error: (error) => {
          console.error('Error loading filter options:', error);
        }
      });
  }

  private clearAllState(): void {
    // Clear search
    this.searchText = '';
    this.requestState.searchKeyword = undefined;
    if (this.searchBarComponent) {
      this.searchBarComponent.searchText = '';
    }

    // Clear filters
    this.clearAllFilters();

    // Reset sort
    this.tableConfig.sortConfig = {
      column: 'testedAbo',
      direction: 'default'
    };
    this.requestState.sort = undefined;

    // Reset pagination
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
      this.tableConfig.pagination.pageSize = 25;
    }

    // Close side panel
    this.closeSidePanel();

    // Close filter panel
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }

    // Clear data and reload
    this.dataSource = [];
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
          label: 'ABO Values',
          link: null
        }
      ],
      title: 'ABO Values',
      actions: [{
        label: 'ADD NEW ABO RULE',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new ABO value',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Tested ABO or Description',
      minLength: 1,
      ariaLabel: 'Search ABO values by tested ABO or description'
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
        column: 'testedAbo',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      loadingMessage: 'Loading ABO values data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<AboValuesModel>[] {
    return [
      {
        key: 'testedAbo',
        header: 'Tested ABO',
        sortable: true,
        width: '120px'
      },
      {
        key: 'description',
        header: 'Description',
        width: '150px'
      },
      {
        key: 'intendedUse',
        header: 'Intended Use',
        width: '120px'
      },
      {
        key: 'unitScheme',
        header: 'Unit Scheme',
        width: '120px'
      },
      {
        key: 'aboLabel',
        header: 'ABO Label',
        width: '120px'
      },
      {
        key: 'aboDescription',
        header: 'ABO Description',
        width: '150px'
      },
      {
        key: 'bloodTypeCode',
        header: 'Blood Type Code',
        width: '130px'
      },
      {
        key: 'transfusionStatus',
        header: 'Transfusion Status',
        width: '140px'
      },
      {
        key: 'aboOnly',
        header: 'ABO Only',
        width: '100px',
        valueFormatter: (value) => this.formatBoolean(value)
      },
      {
        key: 'alternateAbo',
        header: 'Alternate ABO',
        width: '120px'
      },
      {
        key: 'usageCode',
        header: 'Usage Code',
        width: '110px'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '130px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private formatBoolean(value: boolean | string | undefined): string {
    if (value === undefined || value === null) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string') {
      const upper = value.toUpperCase();
      if (upper === 'Y' || upper === 'YES' || upper === 'TRUE') return 'Yes';
      if (upper === 'N' || upper === 'NO' || upper === 'FALSE') return 'No';
    }
    return String(value);
  }

  private formatDate(date: Date | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<AboValuesModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit ABO value',
        ariaLabel: 'Edit ABO value {{testedAbo}}',
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

    this.aboValuesService
      .getAboValues(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: AboValuesModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
          this.hasError = false;
        },
        error: (error: any) => {
          console.error('Error loading ABO values data:', error);
          this.dataSource = [];
          this.tableConfig.pagination!.totalRecords = 0;
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load ABO values data. Please try again.';
        }
      });
  }

  onSearch(searchText: string): void {
    // Trim whitespace from search input
    const trimmedText = searchText?.trim() || '';

    // Update the search bar component with trimmed text
    if (this.searchBarComponent && searchText !== trimmedText) {
      this.searchBarComponent.searchText = trimmedText;
    }

    // Only trigger API call when search is cleared (empty)
    // Otherwise, just update the state without calling API
    if (trimmedText === '') {
      // Search was cleared - reload all data
      this.requestState.searchKeyword = undefined;

      if (this.tableConfig.pagination) {
        this.tableConfig.pagination.pageIndex = 0;
      }

      this.loadData();
    } else {
      // Text is being typed - just update state, don't call API
      this.requestState.searchKeyword = trimmedText;
    }
  }

  /**
   * Triggered when user presses Enter in search box.
   * Triggers if input has 3 or more characters, or if empty (to reload all data).
   */
  onEnterSearch(): void {
    const text = this.searchBarComponent?.searchText?.trim() || '';

    // Update the search bar component with trimmed text
    if (this.searchBarComponent && this.searchBarComponent.searchText !== text) {
      this.searchBarComponent.searchText = text;
    }

    if (text.length >= 1 || text.length === 0) {
      this.requestState.searchKeyword = text || undefined;
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

    this.requestState.sort =
      event.direction === 'default' ? undefined : event.direction;

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<AboValuesModel>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this.previouslyFocusedElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.selectedRow = null;
    this.sidePanelOpen = true;
    this.sidePanelFocusPending = true;
  }

  editRecord(record: AboValuesModel): void {
    this.previouslyFocusedElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.selectedRow = record;
    this.sidePanelOpen = true;
    this.sidePanelFocusPending = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.selectedRow = null;
    // Blur trigger element so edit/add button does not retain focus ring after panel closes
    setTimeout(() => {
      this.previouslyFocusedElement?.blur();
      this.previouslyFocusedElement = null;
    }, 0);
  }

  ngAfterViewChecked(): void {
    if (this.sidePanelFocusPending && this.sidePanelContainer) {
      const firstFocusable = this.sidePanelContainer.nativeElement
        .querySelector<HTMLElement>('input:not([disabled]), mat-select:not([disabled])');
      if (firstFocusable) {
        // Set false immediately to prevent multiple calls during change detection cycles
        this.sidePanelFocusPending = false;
        // Defer focus until after the 300ms slideIn animation completes to avoid layout
        // reflow mid-animation which causes the panel to flicker/jitter on open
        setTimeout(() => firstFocusable.focus(), 320);
      }
    }
  }

  onSaveSuccess(): void {
    this.loadData();
    this.closeSidePanel();
  }

  onModeChange(mode: 'add' | 'edit'): void {
    this.sidePanelMode = mode;
    if (mode === 'add') {
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
      scrollStrategy: this.overlay.scrollStrategies.block(),
      width: '420px',
      minWidth: '420px',
      maxWidth: '420px'
    });

    const portal = new ComponentPortal(AboValuesFilterPanel);
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

  applyFilters(filters: AboValuesFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = AboValuesFilterChipsUtils.convertFiltersToChips(filters);

    // Convert keys to values for API call
    const intendedUseValue = filters.intendedUse
      ? this.intendedUseOptions.find(opt => opt.key === filters.intendedUse)?.value || filters.intendedUse
      : undefined;

    const unitSchemeValue = filters.unitScheme
      ? this.unitSchemeOptions.find(opt => opt.key === filters.unitScheme)?.value || filters.unitScheme
      : undefined;

    const transfusionStatusValue = filters.transfusionStatus
      ? this.transfusionStatusOptions.find(opt => opt.key === filters.transfusionStatus)?.value || filters.transfusionStatus
      : undefined;

    // Map filter values to backend parameter names (camelCase)
    this.requestState = {
      ...this.requestState,
      intendedUse: intendedUseValue,
      unitScheme: unitSchemeValue,
      transfusionStatus: transfusionStatusValue,
      effectiveDate: filters.effectiveDate || undefined,
      effectiveDatePeriod: filters.effectiveDatePeriod || undefined,
      terminationDate: filters.terminationDate || undefined,
      terminationDatePeriod: filters.terminationDatePeriod || undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    const updatedFilters = AboValuesFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    if (updatedFilters) {
      this.appliedFilters = updatedFilters;
      this.filterChips = AboValuesFilterChipsUtils.convertFiltersToChips(updatedFilters);
      this.updateRequestStateFromFilters();

      if (this.tableConfig.pagination) {
        this.tableConfig.pagination.pageIndex = 0;
      }

      this.loadData();
    } else {
      this.clearAllFilters();
    }
  }

  hasActiveFilters(): boolean {
    return AboValuesFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    // Remove filter parameters using camelCase property names
    const {
      intendedUse,
      unitScheme,
      transfusionStatus,
      effectiveDate,
      effectiveDatePeriod,
      terminationDate,
      terminationDatePeriod,
      ...rest
    } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      // Remove filter parameters using camelCase property names
      const {
        intendedUse,
        unitScheme,
        transfusionStatus,
        effectiveDate,
        effectiveDatePeriod,
        terminationDate,
        terminationDatePeriod,
        ...rest
      } = this.requestState;
      this.requestState = rest;
      return;
    }

    // Convert keys to values for API call
    const intendedUseValue = this.appliedFilters.intendedUse
      ? this.intendedUseOptions.find(opt => opt.key === this.appliedFilters!.intendedUse)?.value || this.appliedFilters.intendedUse
      : undefined;

    const unitSchemeValue = this.appliedFilters.unitScheme
      ? this.unitSchemeOptions.find(opt => opt.key === this.appliedFilters!.unitScheme)?.value || this.appliedFilters.unitScheme
      : undefined;

    const transfusionStatusValue = this.appliedFilters.transfusionStatus
      ? this.transfusionStatusOptions.find(opt => opt.key === this.appliedFilters!.transfusionStatus)?.value || this.appliedFilters.transfusionStatus
      : undefined;

    // Map filter values to backend parameter names (camelCase)
    this.requestState = {
      ...this.requestState,
      intendedUse: intendedUseValue,
      unitScheme: unitSchemeValue,
      transfusionStatus: transfusionStatusValue,
      effectiveDate: this.appliedFilters.effectiveDate || undefined,
      effectiveDatePeriod: this.appliedFilters.effectiveDatePeriod || undefined,
      terminationDate: this.appliedFilters.terminationDate || undefined,
      terminationDatePeriod: this.appliedFilters.terminationDatePeriod || undefined
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
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }
  }
}
