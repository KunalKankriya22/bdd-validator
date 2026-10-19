import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subject, takeUntil } from 'rxjs';
import { animate, state, style, transition, trigger } from '@angular/animations';

import { VehicleDetailsService } from './services/vehicle-details.service';
import {
  VehicleDetails,
  VehicleDetailsFilter,
  VehicleDetailsFilterValue
} from './models/vehicle-details.model';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { VehicleDetailsFilterChipsUtils } from './utils/filter-chips.utils';
import { VehicleFilterPanel } from './vehicle-filter-panel/vehicle-filter-panel';
import { AddEditVehicleDetails } from './add-edit-vehicle-details/add-edit-vehicle-details';
import { formatTableDate } from './utils/table-display.util';

@Component({
  selector: 'app-maintain-vehicle-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips,
    AddEditVehicleDetails
  ],
  templateUrl: './maintain-vehicle-details.html',
  styleUrls: ['./maintain-vehicle-details.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class MaintainVehicleDetailsComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 3,
    ariaLabel: '',
    searchOnEnterOnly: true
  };

  // Table configuration
  displayedColumns: string[] = [
    'expand',
    'vehicleId',
    'vehicleName',
    'vehicleType',
    'identificationNumber',
    'effectiveDate',
    'terminationDate',
    'actions'
  ];

  // Pagination
  pageSize = 25;
  pageIndex = 0;
  totalRecords = 0;
  pageSizeOptions = [10, 25, 50, 100];

  // Sort
  sortColumn = 'vehicleId';
  sortDirection: 'A' | 'D' | 'default' = 'default';

  appliedFilters: VehicleDetailsFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource = new MatTableDataSource<VehicleDetails>([]);
  expandedElements: Set<VehicleDetails> = new Set();
  requestState: VehicleDetailsFilter = { showTerminated: false };

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: VehicleDetails | null = null;
  sidePanelActiveTab = 0;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  currentYear: number = new Date().getFullYear();

  constructor(
    private vehicleDetailsService: VehicleDetailsService,
    private router: Router,
    private overlay: Overlay,
    private chapterTimezoneService: ChapterTimezoneService
  ) {
    this.initializeConfigurations();
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
          label: 'Maintain Vehicle Details',
          link: ''
        }
      ],
      actions: [
        {
          label: 'ADD NEW VEHICLE DETAILS',
          icon: 'add',
          ariaLabel: 'Add new vehicle details',
          onClick: () => this.addNewVehicle()
        }
      ]
    };

    this.searchConfig = {
      placeholder: 'Search by Vehicle Name or Vehicle ID',
      minLength: 3,
      ariaLabel: 'Search vehicles by vehicle name or ID',
      searchOnEnterOnly: true,
      alwaysShowTooltip: true
    };
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const filter: VehicleDetailsFilter = {
      ...this.requestState,
      chapterLocalDate: this.chapterTimezoneService.getChapterLocalDate().format('YYYY-MM-DD'),
      searchText: this.searchText || undefined,
      sort: this.getSortString() || undefined,
      sortDirection: this.sortDirection !== 'default'
        ? (this.sortDirection === 'A' ? 'ASC' : 'DESC')
        : undefined
    };

    this.vehicleDetailsService
      .getVehicles(filter, this.pageSize, this.pageIndex)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.dataSource.data = result.data;
          this.totalRecords = result.total;
          this.expandedElements.clear();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading vehicle details:', error);
          this.hasError = true;
          this.errorMessage = 'Failed to load vehicle details. Please try again.';
          this.isLoading = false;
        }
      });
  }

  private getSortString(): string {
    if (this.sortDirection === 'default') {
      return '';
    }
    return `${this.sortColumn}_${this.sortDirection === 'A' ? 'asc' : 'desc'}`;
  }

  onSearch(keyword: string): void {
    this.searchText = keyword;
    this.pageIndex = 0;
    this.loadData();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      // Cycle through: default -> A -> D -> default
      if (this.sortDirection === 'default') {
        this.sortDirection = 'A';
      } else if (this.sortDirection === 'A') {
        this.sortDirection = 'D';
      } else {
        this.sortDirection = 'default';
      }
    } else {
      this.sortColumn = column;
      this.sortDirection = 'A';
    }
    this.loadData();
  }

  toggleRow(element: VehicleDetails, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.expandedElements.has(element)) {
      this.expandedElements.delete(element);
    } else {
      this.expandedElements.add(element);
    }
  }

  isExpanded(element: VehicleDetails): boolean {
    return this.expandedElements.has(element);
  }

  areAllExpanded(): boolean {
    return this.dataSource.data.length > 0 && this.expandedElements.size === this.dataSource.data.length;
  }

  toggleAllRows(): void {
    if (this.areAllExpanded()) {
      this.expandedElements.clear();
    } else {
      this.dataSource.data.forEach(element => this.expandedElements.add(element));
    }
  }

  editRecord(vehicle: VehicleDetails): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = vehicle;
    this.sidePanelActiveTab = 0;
    this.sidePanelOpen = true;
  }

  addNewVehicle(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelActiveTab = 0;
    this.sidePanelOpen = true;
  }

  openNotes(vehicle: VehicleDetails): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = vehicle;
    this.sidePanelActiveTab = 1;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.closeSidePanel();
    this.loadData();
  }

  openFilter(): void {
    if (this.isFilterOpen) {
      this.closeFilter();
      return;
    }

    if (!this.filterBtn || !this.tableCard) {
      return;
    }

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterBtn)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 8
        }
      ])
      .withPush(false)
      .withViewportMargin(16);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      panelClass: 'filter-panel-overlay',
      width: 320,
      height: 476,
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    const filterPanelPortal = new ComponentPortal(VehicleFilterPanel);
    const componentRef = this.overlayRef.attach(filterPanelPortal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: VehicleDetailsFilterValue) => {
        this.applyFilters(filters);
        this.closeFilter();
      });

    componentRef.instance.clearAll
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAllFilters();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilter();
      });

    this.overlayRef
      .backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilter();
      });

    this.isFilterOpen = true;
  }

  closeFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
  }

  applyFilters(filters: VehicleDetailsFilterValue): void {
    this.appliedFilters = filters;

    // Update request state
    this.requestState = {
      vehicleId: filters.vehicleId || undefined,
      vehicleType: filters.vehicleType || undefined,
      showTerminated: filters.showTerminated,
      effDate: filters.effectiveDate || undefined,
      effDatePeriod: filters.effectiveDatePeriod || undefined,
      termDate: filters.terminationDate || undefined,
      termDatePeriod: filters.terminationDatePeriod || undefined
    };

    // Update filter chips
    this.filterChips = VehicleDetailsFilterChipsUtils.toFilterChips(filters);

    // Reset to first page and reload data
    this.pageIndex = 0;
    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    if (!this.appliedFilters) return;

    const updatedFilters = VehicleDetailsFilterChipsUtils.removeFilter(
      this.appliedFilters,
      chipKey
    );
    this.applyFilters(updatedFilters);
  }

  clearAllFilters(): void {
    const clearedFilters = VehicleDetailsFilterChipsUtils.clearAll();
    this.applyFilters(clearedFilters);
  }

  hasActiveFilters(): boolean {
    return (
      this.appliedFilters !== null &&
      VehicleDetailsFilterChipsUtils.hasActiveFilters(this.appliedFilters)
    );
  }

  formatDate(isoDate: string | null | undefined): string {
    return formatTableDate(isoDate);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.isFilterOpen && this.overlayRef) {
      this.overlayRef.updatePosition();
    }
  }
}
