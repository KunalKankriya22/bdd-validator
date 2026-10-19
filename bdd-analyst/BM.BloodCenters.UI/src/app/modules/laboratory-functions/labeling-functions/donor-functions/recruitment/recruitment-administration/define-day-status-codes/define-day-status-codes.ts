import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  HostListener,
  inject,
  ChangeDetectorRef,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Overlay, OverlayRef, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DayStatusCodesService } from './services/day-status-codes.service';
import {
  DayStatusCodeModel,
  DayStatusCodeParamsDto,
  DayStatusFilterValue,
  ResourceCodeOption,
  StatusCodeOption,
  AddDayStatusCodeDto,
  UpdateDayStatusCodeDto
} from './models/day-status-codes.model';
import { DayStatusFilterPanel } from './day-status-filter-panel/day-status-filter-panel';
import { AddEditDayStatusComponent } from './add-edit-day-status/add-edit-day-status';
import { DayStatusFilterChipsUtils } from './utils/filter-chips.utils';
import { FilterChip, FilterChips } from '@shared/components/filter-chips/filter-chips';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTableConfig, TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';

@Component({
  selector: 'app-define-day-status-codes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    DayStatusFilterPanel,
    AddEditDayStatusComponent
  ],
  templateUrl: './define-day-status-codes.html',
  styleUrls: ['./define-day-status-codes.scss']
})
export class DefineDayStatusCodesComponent implements OnInit, OnDestroy {
  private readonly dayStatusService = inject(DayStatusCodesService);
  private readonly overlay = inject(Overlay);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('filterButton', { read: ElementRef }) filterButtonRef!: ElementRef;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef;
  @ViewChild('sideDrawer') sideDrawerComponent?: AddEditDayStatusComponent;

  // Page header configuration
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/' },
      { label: 'Define Day Status Codes', link: null }
    ],
    title: 'Define Day Status Codes',
    subtitle: 'Define and manage day status codes.',
    actions: [{
      label: 'ADD NEW DAY STATUS CODE',
      icon: 'add',
      color: 'accent',
      ariaLabel: 'Add new day status code',
      onClick: () => this.openAddDrawer()
    }]
  };

  // Search bar configuration
  searchBarConfig: SearchBarConfig = {
    placeholder: 'Search by Resource Code or Description',
    ariaLabel: 'Search by Resource Code or Description',
    debounceTime: 300
  };

  // Data table configuration
  dataTableConfig: DataTableConfig<DayStatusCodeModel> = {
    columns: [
      { key: 'status', header: 'Status', sortable: true, width: '120px' },
      { key: 'description', header: 'Description', width: '200px' },
      { key: 'resourceCode', header: 'Resource Code', width: '150px' },
      { key: 'lower', header: 'Lower', width: '100px' },
      { key: 'upper', header: 'Upper', width: '100px' },
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
      }
    ],
    rowActions: [
      {
        icon: 'edit',
        label: 'Edit',
        ariaLabel: 'Edit record',
        action: 'edit'
      }
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'status',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    showPagination: true,
    emptyMessage: 'No day status codes available to display',
    loadingMessage: 'Loading day status codes...'
  };

  // Data table properties
  dataSource: DayStatusCodeModel[] = [];
  isLoading = false;

  // Search keyword
  searchKeyword = '';

  // Filter properties
  filterOverlayRef: OverlayRef | null = null;
  appliedFilters: DayStatusFilterValue | null = null;
  filterChips: FilterChip[] = [];
  resourceCodes: ResourceCodeOption[] = [];
  statusCodes: StatusCodeOption[] = [];

  // Side drawer properties
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: DayStatusCodeModel | null = null;

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeFilterPanel();
  }

  /**
   * Load filter dropdown options
   */
  private loadFilterOptions(): void {
    this.dayStatusService.getDayStatusFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.resourceCodes = data.resourceCodes || [];
          this.statusCodes = data.statusCodes || [];
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.warn('Filter options endpoint not available. Using empty filter lists.', error);
          // Set empty arrays to allow the component to continue working
          this.resourceCodes = [];
          this.statusCodes = [];
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Load table data with current filters, search, and pagination
   */
  loadData(): void {
    this.isLoading = true;

    const params: DayStatusCodeParamsDto = {
      searchKeyword: this.searchKeyword || undefined,
      sort: this.dataTableConfig.sortConfig?.direction === 'default'
        ? undefined
        : this.dataTableConfig.sortConfig?.direction
    };

    // Add filter params if filters are applied
    if (this.appliedFilters) {
      if (this.appliedFilters.resourceCode) {
        params.resourceCode = this.appliedFilters.resourceCode;
      }
      if (this.appliedFilters.status) {
        params.status = this.appliedFilters.status;
      }

      // Effective Date filter
      if (this.appliedFilters.effectiveDatePeriod && this.appliedFilters.effectiveDate) {
        params.effectiveDate = this.appliedFilters.effectiveDate.toISOString();
        params.effectiveDatePeriod = this.appliedFilters.effectiveDatePeriod;
      }

      // Termination Date filter
      if (this.appliedFilters.terminationDatePeriod && this.appliedFilters.terminationDate) {
        params.terminationDate = this.appliedFilters.terminationDate.toISOString();
        params.terminationDatePeriod = this.appliedFilters.terminationDatePeriod;
      }
    }

    const skip = (this.dataTableConfig.pagination?.pageIndex || 0) * (this.dataTableConfig.pagination?.pageSize || 25);
    const take = this.dataTableConfig.pagination?.pageSize || 25;

    this.dayStatusService.getDayStatusCodes(take, skip, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          if (this.dataTableConfig.pagination) {
            this.dataTableConfig.pagination.totalRecords = response.total;
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Handle search event
   */
  onSearch(keyword: string): void {
    this.searchKeyword = keyword || '';

    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  /**
   * Handle page change event
   */
  onPageChange(event: TablePageEvent): void {
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = event.pageIndex;
      this.dataTableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  /**
   * Handle sort change event
   */
  onSortChange(event: TableSortEvent): void {
    this.dataTableConfig.sortConfig!.column = event.column;
    this.dataTableConfig.sortConfig!.direction = event.direction;
    this.loadData();
  }

  /**
   * Handle row action event
   */
  onRowAction(event: TableRowActionEvent<DayStatusCodeModel>): void {
    if (event.action === 'edit') {
      this.openEditDrawer(event.row);
    }
  }

  /**
   * Format date to DD-MMM-YYYY
   */
  formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Open filter panel using CDK Overlay
   */
  openFilterPanel(): void {
    if (this.filterOverlayRef) {
      this.filterOverlayRef.dispose();
      this.filterOverlayRef = null;
      return;
    }

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterButtonRef)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 8
        },
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 8
        }
      ])
      .withPush(true);

    this.filterOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const filterPortal = new ComponentPortal(DayStatusFilterPanel);
    const componentRef = this.filterOverlayRef.attach(filterPortal);

    // Pass data to filter panel
    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.resourceCodes = this.resourceCodes;
    componentRef.instance.statusCodes = this.statusCodes;

    // Subscribe to filter panel events
    componentRef.instance.apply.pipe(takeUntil(this.destroy$)).subscribe((filters) => {
      this.applyFilters(filters);
      this.closeFilterPanel();
    });

    componentRef.instance.close.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });

    // Close on backdrop click
    this.filterOverlayRef.backdropClick().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });
  }

  /**
   * Close filter panel
   */
  closeFilterPanel(): void {
    if (this.filterOverlayRef) {
      this.filterOverlayRef.dispose();
      this.filterOverlayRef = null;
    }
  }

  /**
   * Apply filters and reload data
   */
  applyFilters(filters: DayStatusFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = DayStatusFilterChipsUtils.convertFiltersToChips(filters);
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  /**
   * Remove a specific filter chip
   */
  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = DayStatusFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );
    this.filterChips = DayStatusFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  /**
   * Clear all filters
   */
  onClearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  /**
   * Open side drawer in add mode
   */
  openAddDrawer(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    this.cdr.detectChanges();
  }

  /**
   * Open side drawer in edit mode
   */
  openEditDrawer(data: DayStatusCodeModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = data;
    this.sidePanelOpen = true;
    this.cdr.detectChanges();
  }

  /**
   * Close side drawer
   */
  closeSideDrawer(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.cdr.detectChanges();
  }

  /**
   * Handle save from add/edit drawer
   */
  onSave(data: AddDayStatusCodeDto | UpdateDayStatusCodeDto): void {
    if (this.sidePanelMode === 'add') {
      this.dayStatusService.addDayStatusCode(data as AddDayStatusCodeDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.closeSideDrawer();
            this.loadData();
          },
          error: (error) => {
            this.handleSaveError(error);
          }
        });
    } else {
      this.dayStatusService.updateDayStatusCode(data as UpdateDayStatusCodeDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.closeSideDrawer();
            this.loadData();
          },
          error: (error) => {
            this.handleSaveError(error);
          }
        });
    }
  }

  /**
   * Handle save and create another
   */
  onSaveAndCreateAnother(data: AddDayStatusCodeDto | UpdateDayStatusCodeDto): void {
    if (this.sidePanelMode === 'add') {
      this.dayStatusService.addDayStatusCode(data as AddDayStatusCodeDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadData();
            // Reset form for next entry (keep drawer open)
            this.sideDrawerComponent?.resetForm();
            this.sidePanelMode = 'add';
            this.sidePanelData = null;
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.handleSaveError(error);
          }
        });
    } else {
      this.dayStatusService.updateDayStatusCode(data as UpdateDayStatusCodeDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadData();
            this.sideDrawerComponent?.resetSubmissionState();
            this.closeSideDrawer();
          },
          error: (error) => {
            this.handleSaveError(error);
          }
        });
    }
  }

  /**
   * Handle save errors
   */
  private handleSaveError(error: any): void {
    let errorMessage = 'An error occurred while saving. Please try again.';

    if (error.status === 409) {
      errorMessage = 'A record with this Status, Resource Code, and Effective Date already exists.';
    } else if (error.status === 404) {
      errorMessage = 'The record was not found. It may have been deleted.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.sideDrawerComponent?.setErrorMessage(errorMessage);
    this.cdr.detectChanges();
  }

  /**
   * Keyboard shortcuts
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Alt+C - Open add drawer
    if (event.altKey && event.key.toLowerCase() === 'c' && !this.sidePanelOpen) {
      event.preventDefault();
      this.openAddDrawer();
    }

    // Alt+F - Open filter panel
    if (event.altKey && event.key.toLowerCase() === 'f' && !this.filterOverlayRef) {
      event.preventDefault();
      this.openFilterPanel();
    }

    // Escape - Close side drawer or filter panel
    if (event.key === 'Escape') {
      if (this.sidePanelOpen) {
        this.closeSideDrawer();
      } else if (this.filterOverlayRef) {
        this.closeFilterPanel();
      }
    }
  }
}
