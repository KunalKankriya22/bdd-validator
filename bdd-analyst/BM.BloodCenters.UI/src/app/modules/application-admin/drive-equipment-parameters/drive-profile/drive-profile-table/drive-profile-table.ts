import { Component, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject, takeUntil } from 'rxjs';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import { DriveProfileModel, DriveProfileFilterParams } from '../../models/drive-equipment-parameters.model';
import { AddEditDriveProfile } from '../add-edit-drive-profile/add-edit-drive-profile';
import { DriveProfileFilterPanel } from '../drive-profile-filter-panel/drive-profile-filter-panel';
import { HeaderService } from '@shared/services/header.service';

/**
 * Drive Profile Table Component
 * Displays drive profile records with filtering, sorting, pagination, and CRUD operations
 */
@Component({
  selector: 'app-drive-profile-table',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    OverlayModule,
    DataTable,
    SearchBar,
    FilterChips,
    AddEditDriveProfile
  ],
  templateUrl: './drive-profile-table.html',
  styleUrls: ['./drive-profile-table.scss']
})
export class DriveProfileTable implements OnInit, OnDestroy {
  @ViewChild('filterButton', { read: ElementRef }) filterButton!: ElementRef;
  @ViewChild('filterAnchor', { read: ElementRef }) filterAnchor!: ElementRef;

  private readonly driveEquipmentService = inject(DriveEquipmentParametersService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly overlay = inject(Overlay);
  private readonly headerService = inject(HeaderService);

  private destroy$ = new Subject<void>();

  // State signals
  private dataSource = signal<DriveProfileModel[]>([]);
  private isLoading = signal<boolean>(false);
  private appliedFilters = signal<DriveProfileFilterParams>({});

  // Side panel signals
  private panelOpen = signal<boolean>(false);
  private panelMode = signal<'add' | 'edit'>('add');
  private panelData = signal<any>(null);

  sidePanelOpen = computed(() => this.panelOpen());
  sidePanelMode = computed(() => this.panelMode());
  sidePanelData = computed(() => this.panelData());

  // Extract just the record for row highlighting (DataTable expects the record object, not the wrapper)
  highlightedRecord = computed(() => {
    const data = this.panelData();
    return data?.record || null;
  });

  // Computed values
  data = computed(() => this.dataSource());
  loading = computed(() => this.isLoading());
  filterChips = computed(() => this.buildFilterChips());

  // Overlay reference for filter panel
  overlayRef: any = null;

  // Search configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Type or Drive Profile Type',
    minLength: 2,
    ariaLabel: 'Search drive profiles',
    searchOnEnterOnly: true
  };

  // Table configuration
  tableConfig: DataTableConfig<DriveProfileModel> = {
    columns: [
      {
        key: 'deviceType',
        header: 'Type',
        sortable: true,
        width: '120px'
      },
      {
        key: 'driveProfileType',
        header: 'Drive Profile Type',
        width: '140px'
      },
      {
        key: 'driveProfileTypeDescription',
        header: 'Drive Profile Type Description',
        width: '200px'
      },
      {
        key: 'code',
        header: 'Code',
        width: '100px'
      },
      {
        key: 'codeDescription',
        header: 'Code Description',
        width: '220px'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '120px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '130px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ],
    rowActions: [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit',
        action: 'edit'
      }
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100]
    },
    sortConfig: {
      column: 'code',
      direction: 'default'
    },
    stickyHeader: true,
    enableSelection: false
  };

  // Request state for API calls
  private requestState: DriveProfileFilterParams = {};

  ngOnInit(): void {
    this.loadData();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads data from the API
   */
  loadData(): void {
    this.isLoading.set(true);

    const take = this.tableConfig.pagination?.pageSize || 10;
    const skip = (this.tableConfig.pagination?.pageIndex || 0) * take;

    this.driveEquipmentService.getDriveProfiles(take, skip, this.requestState).subscribe({
      next: (response) => {
        // Always set the data, even if it's an empty array
        this.dataSource.set(response.data || []);
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.totalRecords = response.totalRecords || 0;
        }
        this.isLoading.set(false);
      },
      error: () => {
        // Clear data on error
        this.dataSource.set([]);
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.totalRecords = 0;
        }
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Handles search input
   */
  onSearch(keyword: string): void {
    this.requestState.searchKeyword = keyword || undefined;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  /**
   * Handles page change
   */
  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  /**
   * Handles sort change
   */
  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }

    // Set sort parameter for API (just A or D)
    if (event.direction === 'default') {
      this.requestState.sort = undefined;
    } else {
      this.requestState.sort = event.direction;
    }

    this.loadData();
  }

  /**
   * Handles row action (edit)
   */
  onRowAction(event: TableRowActionEvent<DriveProfileModel>): void {
    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  /**
   * Opens the Add New Drive Profile side panel
   */
  addRecord(): void {
    this.panelMode.set('add');
    this.panelData.set({ mode: 'add' });
    this.panelOpen.set(true);
  }

  /**
   * Opens the Edit Drive Profile side panel
   */
  editRecord(record: DriveProfileModel): void {
    this.panelMode.set('edit');
    this.panelData.set({ mode: 'edit', record });
    this.panelOpen.set(true);
  }

  /**
   * Closes the side panel
   */
  closeSidePanel(): void {
    this.panelOpen.set(false);
    this.panelData.set(null);
  }

  /**
   * Handles successful save from side panel
   */
  onSaveSuccess(): void {
    this.closeSidePanel();
    if (this.panelMode() === 'add') {
      this.resetSortAndPagination();
    }
    this.loadData();
  }

  onRefreshData(): void {
    this.resetSortAndPagination();
    this.loadData();
  }

  private resetSortAndPagination(): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = 'code';
      this.tableConfig.sortConfig.direction = 'default';
    }
    this.requestState.sort = undefined;
  }

  /**
   * Opens the filter panel
   */
  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      return;
    }

    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(this.filterAnchor)
      .withPositions([{
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
        offsetY: 0
      }]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: '320px'
    });

    const portal = new ComponentPortal(DriveProfileFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters();
    componentRef.instance.tableData = this.data();

    componentRef.instance.apply.subscribe((filters: DriveProfileFilterParams) => {
      this.applyFilters(filters);
      this.overlayRef?.dispose();
      this.overlayRef = null;
    });

    componentRef.instance.close.subscribe(() => {
      this.overlayRef?.dispose();
      this.overlayRef = null;
    });

    this.overlayRef.backdropClick().subscribe(() => {
      this.overlayRef?.dispose();
      this.overlayRef = null;
    });
  }

  /**
   * Applies filters from the filter panel
   */
  applyFilters(filters: DriveProfileFilterParams): void {
    this.appliedFilters.set(filters);

    // Clear existing date filters and apply new ones
    this.requestState = {
      searchKeyword: this.requestState.searchKeyword,
      sort: this.requestState.sort,
      ...filters
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  /**
   * Removes a single filter chip
   */
  onRemoveFilterChip(key: string): void {
    const filters = { ...this.appliedFilters() };
    delete (filters as any)[key];
    this.applyFilters(filters);
  }

  /**
   * Clears all filters
   */
  clearAllFilters(): void {
    this.appliedFilters.set({});
    this.requestState = {
      searchKeyword: this.requestState.searchKeyword,
      sort: this.requestState.sort
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  /**
   * Checks if there are active filters
   */
  hasActiveFilters(): boolean {
    const filters = this.appliedFilters();
    return Object.keys(filters).some(key =>
      (filters as any)[key] !== undefined && (filters as any)[key] !== ''
    );
  }

  /**
   * Builds filter chips from applied filters
   */
  private buildFilterChips(): FilterChip[] {
    const chips: FilterChip[] = [];
    const filters = this.appliedFilters();

    if (filters.driveProfileType) {
      chips.push({
        key: 'driveProfileType',
        label: `Drive Profile Type: ${filters.driveProfileType}`,
        value: filters.driveProfileType,
        removable: true
      });
    }

    if (filters.code) {
      chips.push({
        key: 'code',
        label: `Code: ${filters.code}`,
        value: filters.code,
        removable: true
      });
    }

    if (filters.effDateFrom) {
      chips.push({
        key: 'effDateFrom',
        label: `Effective Date ≥ ${this.formatDateForChip(filters.effDateFrom)}`,
        value: filters.effDateFrom,
        removable: true
      });
    }

    if (filters.effDateTo) {
      chips.push({
        key: 'effDateTo',
        label: `Effective Date ≤ ${this.formatDateForChip(filters.effDateTo)}`,
        value: filters.effDateTo,
        removable: true
      });
    }

    if (filters.termDateFrom) {
      chips.push({
        key: 'termDateFrom',
        label: `Termination Date ≥ ${this.formatDateForChip(filters.termDateFrom)}`,
        value: filters.termDateFrom,
        removable: true
      });
    }

    if (filters.termDateTo) {
      chips.push({
        key: 'termDateTo',
        label: `Termination Date ≤ ${this.formatDateForChip(filters.termDateTo)}`,
        value: filters.termDateTo,
        removable: true
      });
    }

    return chips;
  }

  /**
   * Formats date for display
   */
  private formatDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Formats date for filter chip display
   */
  private formatDateForChip(value: string): string {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    const day = String(date.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Subscribe to chapter changes from header
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Close side panel
        this.closeSidePanel();

        // Clear table data
        this.dataSource.set([]);

        // Reset pagination
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
          this.tableConfig.pagination.totalRecords = 0;
        }

        // Reload data for new chapter
        this.loadData();
      });
  }
}
