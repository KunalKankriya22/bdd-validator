import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationStart } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import { AutoDirProductsFilterPanelComponent } from './filter-panel/auto-dir-products-filter-panel';
import { AutoDirProductsApiService } from './services/auto-dir-products-api.service';
import { AutoDirProductsStateService } from './services/auto-dir-products-state.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { formatTableDate } from '@shared/utils/date-format.util';
import {
  AutoDirProductsFilterForm,
  AutoDirProductsSearchRequestDto,
  AutoDirProductsUnitDto,
  AutoDirProductsComponentDto,
  FilterChip,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS
} from './models/auto-dir-products.model';
import { generateFilterChips, hasSearchCriteria } from './utils/filter-chips.utils';
import moment from 'moment';

/**
 * Products from Auto/Dir Donations Query Component
 * Oracle Form: CPQAUTOS.fmb
 * Mnemonic: AUTOQ
 * Read-Only Query Module
 */
@Component({
  selector: 'app-auto-dir-products',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    AutoDirProductsFilterPanelComponent
  ],
  templateUrl: './auto-dir-products.html',
  styleUrl: './auto-dir-products.scss'
})
export class AutoDirProductsComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `auto-dir-products-${AutoDirProductsComponent.nextId++}`;

  private readonly destroy$ = new Subject<void>();
  private readonly apiService = inject(AutoDirProductsApiService);
  private readonly stateService = inject(AutoDirProductsStateService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly router = inject(Router);

  // Flag to track if we're navigating to Product History (should save state) or away (should clear)
  private shouldSaveStateOnDestroy = false;

  // Signal-based state
  readonly units = signal<AutoDirProductsUnitDto[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly totalRecords = signal<number>(0);
  readonly searched = signal<boolean>(false);
  readonly filterChips = signal<FilterChip[]>([]);
  readonly selectedUnit = signal<AutoDirProductsUnitDto | null>(null);

  // Pagination state
  pageSize = DEFAULT_PAGE_SIZE;
  pageIndex = 0;
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  // Current filter values - protected so it can be bound in template
  protected currentFilters: AutoDirProductsFilterForm | null = null;

  // Computed values
  readonly isEmpty = computed(() =>
    this.searched() && this.units().length === 0 && !this.loading() && !this.error()
  );
  readonly hasResults = computed(() => this.units().length > 0);

  // Master table columns (left panel)
  protected readonly masterColumns: string[] = [
    'unitId',
    'collectionDate',
    'donationType'
  ];

  // Detail component table columns (right panel)
  protected readonly detailComponentColumns: string[] = [
    'patientId',
    'type',
    'product',
    'sld',
    'expiryDate',
    'sh'
  ];

  // Page header configuration
  protected pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: ROUTE_REGISTRY[RouteKey.Home].path }
    ],
    title: '',
    subtitle: ''
  };

  constructor() {
    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: ROUTE_REGISTRY[RouteKey.Home].path },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  ngOnInit(): void {
    // Try to restore previous state if returning from another screen
    this.restoreStateIfAvailable();

    // Subscribe to chapter changes
    this.subscribeToChapterChanges();

    // Handle navigation - save state only for Product History, clear for all others
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationStart),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationStart) => {
        // Save state only if navigating to Unit and Product History
        if (event.url.includes('unit-and-product-history')) {
          this.shouldSaveStateOnDestroy = true;
        } else {
          // Clear state for all other navigations
          this.shouldSaveStateOnDestroy = false;
          this.stateService.clearState();
        }
      });
  }

  /**
   * Subscribe to chapter changes and clear all data when chapter changes
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Clear all filters and results when chapter changes
        this.onClearFilters();
      });
  }

  ngOnDestroy(): void {
    // Only save state if navigating to Product History
    // For all other navigations, state was already cleared in NavigationStart event
    if (this.shouldSaveStateOnDestroy) {
      this.saveCurrentState();
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle search from filter panel
   */
  onSearch(filters: AutoDirProductsFilterForm): void {
    // Validate that at least one criterion is provided
    if (!hasSearchCriteria(filters)) {
      this.snackbarService.showError('0080 - At least one search criterion is required');
      return;
    }

    // Validate date range
    if (filters.fromDate && filters.toDate) {
      const from = moment(filters.fromDate);
      const to = moment(filters.toDate);
      if (to.isBefore(from, 'day')) {
        this.snackbarService.showError('7023 - To Date cannot be before From Date');
        return;
      }
    }

    // Validate surgery date
    if (filters.needByDate && filters.surgeryDate) {
      const needBy = moment(filters.needByDate);
      const surgery = moment(filters.surgeryDate);
      if (surgery.isBefore(needBy, 'day')) {
        this.snackbarService.showError('2319 - Surgery Date cannot be before Need By Date');
        return;
      }
    }

    // Store current filters
    this.currentFilters = filters;

    // Reset pagination
    this.pageIndex = 0;

    // Generate filter chips
    this.filterChips.set(generateFilterChips(filters));

    // Perform search
    this.loadData();
  }

  /**
   * Handle clear filters
   */
  onClearFilters(): void {
    this.currentFilters = null;
    this.units.set([]);
    this.totalRecords.set(0);
    this.searched.set(false);
    this.error.set(null);
    this.filterChips.set([]);
    this.selectedUnit.set(null);
    this.pageIndex = 0;
  }

  /**
   * Remove individual filter chip
   */
  onRemoveFilterChip(chip: FilterChip): void {
    if (!chip.removable || !this.currentFilters) {
      return;
    }

    // Remove the filter value
    this.currentFilters = {
      ...this.currentFilters,
      [chip.key]: null
    };

    // Check if any criteria remain
    if (!hasSearchCriteria(this.currentFilters)) {
      this.onClearFilters();
      return;
    }

    // Re-search with updated filters
    this.onSearch(this.currentFilters);
  }

  /**
   * Handle pagination change
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.selectedUnit.set(null); // Clear selection when changing pages
    this.loadData();
  }

  /**
   * Select a unit to display in detail panel
   */
  selectUnit(unit: AutoDirProductsUnitDto): void {
    this.selectedUnit.set(unit);
  }

  /**
   * Check if unit is selected
   */
  isUnitSelected(unitId: string): boolean {
    return this.selectedUnit()?.unitId === unitId;
  }

  /**
   * Handle Product History button click
   */
  onProductHistory(): void {
    const unit = this.selectedUnit();
    if (!unit) {
      return;
    }

    // Navigate to Unit and Product History screen with unit ID and breadcrumb info
    this.router.navigate(
      ['/product-management-functions/inventory-management/inventory-queries/unit-and-product-history'],
      {
        queryParams: {
          unitId: unit.unitId,
          from: 'Products from Autologous/Directed Donations',
          fromPath: '/laboratory-functions/component-production/component-queries/auto-dir-products'
        }
      }
    );
  }

  /**
   * Load data from API
   */
  private loadData(): void {
    if (!this.currentFilters) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Build request DTO
    const request: AutoDirProductsSearchRequestDto = {
      unitId: this.currentFilters.unitId || undefined,
      fromDate: this.currentFilters.fromDate ? moment(this.currentFilters.fromDate).format('YYYY-MM-DD') : undefined,
      toDate: this.currentFilters.toDate ? moment(this.currentFilters.toDate).format('YYYY-MM-DD') : undefined,
      needByDate: this.currentFilters.needByDate ? moment(this.currentFilters.needByDate).format('YYYY-MM-DD') : undefined,
      surgeryDate: this.currentFilters.surgeryDate ? moment(this.currentFilters.surgeryDate).format('YYYY-MM-DD') : undefined,
      hospitalId: this.currentFilters.hospitalId || undefined,
      patientId: this.currentFilters.patientId || undefined,
      orderBy: this.currentFilters.orderBy || 'UNIT',
      take: this.pageSize,
      skip: this.pageIndex * this.pageSize
    };

    this.apiService.searchProducts(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.units.set(response.data);
          this.totalRecords.set(response.total);
          this.searched.set(true);
          this.loading.set(false);

          // Auto-select first unit if results found
          if (response.data.length > 0) {
            this.selectedUnit.set(response.data[0]);
          } else {
            this.selectedUnit.set(null);
            this.snackbarService.showSuccess('No records found');
          }
        },
        error: (error) => {
          // Clear saved state on error to prevent persistence of invalid searches
          this.stateService.clearState();

          const errorMessage = error?.error?.message || error?.message || 'Failed to load Auto/Dir products';
          this.error.set(errorMessage);
          this.loading.set(false);
          this.snackbarService.showError(errorMessage);
          this.units.set([]);
          this.totalRecords.set(0);
        }
      });
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string | null | undefined): string {
    if (!date) {
      return '-';
    }
    // Convert Date to ISO string if needed
    if (date instanceof Date) {
      return formatTableDate(date.toISOString());
    }
    return formatTableDate(date);
  }

  /**
   * Get donor decision display label
   */
  getDonorDecisionLabel(code: string): string {
    switch (code) {
      case 'AU':
        return 'Autologous';
      case 'DI':
        return 'Directed';
      default:
        return code;
    }
  }

  /**
   * Get product types as comma-separated string
   */
  getProductTypesDisplay(productTypes: string[]): string {
    return productTypes && productTypes.length > 0 ? productTypes.join(', ') : 'N/A';
  }

  /**
   * Check if unit has components
   */
  hasComponents(unit: AutoDirProductsUnitDto): boolean {
    return unit.components && unit.components.length > 0;
  }

  /**
   * Save current state before navigating away
   */
  private saveCurrentState(): void {
    // Only save if we have searched data
    if (this.searched() && this.currentFilters) {
      this.stateService.saveState({
        filters: this.currentFilters,
        units: this.units(),
        totalRecords: this.totalRecords(),
        pageIndex: this.pageIndex,
        pageSize: this.pageSize,
        selectedUnitId: this.selectedUnit()?.unitId || null,
        filterChips: this.filterChips(),
        searched: this.searched()
      });
    }
  }

  /**
   * Restore previous state if available
   * Only restores if valid search results exist
   */
  private restoreStateIfAvailable(): void {
    const savedState = this.stateService.restoreState();
    if (savedState) {
      // Validate state before restoring - only restore successful searches
      if (savedState.searched && savedState.units && savedState.units.length > 0) {
        // Restore all state
        this.currentFilters = savedState.filters;
        this.units.set(savedState.units);
        this.totalRecords.set(savedState.totalRecords);
        this.pageIndex = savedState.pageIndex;
        this.pageSize = savedState.pageSize;
        this.filterChips.set(savedState.filterChips);
        this.searched.set(savedState.searched);

        // Restore selected unit if it exists in the current units list
        if (savedState.selectedUnitId) {
          const unit = savedState.units.find(u => u.unitId === savedState.selectedUnitId);
          if (unit) {
            this.selectedUnit.set(unit);
          }
        }
      } else {
        // Invalid or empty state, clear it
        this.stateService.clearState();
      }
    }
  }
}
