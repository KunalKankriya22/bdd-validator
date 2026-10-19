import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { ProductTypePrioritizationService } from './services/product-type-prioritization.service';
import {
  ProductTypePrioritizationModel,
  ProductTypePrioritizationListRequestDto,
  ProductTypePrioritizationFilterValue
} from './models/product-type-prioritization.model';

import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
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
import { ProductTypePrioritizationFilterChipsUtils } from './utils/filter-chips.utils';
import { ProductTypePrioritizationFilterPanel } from './product-type-prioritization-filter-panel/product-type-prioritization-filter-panel';
import { AddEditProductTypePrioritization } from './add-edit-product-type-prioritization/add-edit-product-type-prioritization';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { LabelingFilterDataService } from '../services/labeling-filter-data.service';


@Component({
  selector: 'app-product-type-prioritization',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditProductTypePrioritization
  ],
  templateUrl: './product-type-prioritization.html',
  styleUrls: ['./product-type-prioritization.scss']
})
export class ProductTypePrioritizationComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild(AddEditProductTypePrioritization) addEditPanelRef!: AddEditProductTypePrioritization;

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 3,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<ProductTypePrioritizationModel> = {
    columns: [],
    rowActions: [],
    sortConfig: {
      column: 'productType',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: false
  };

  appliedFilters: ProductTypePrioritizationFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: ProductTypePrioritizationModel[] = [];
  requestState: ProductTypePrioritizationListRequestDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ProductTypePrioritizationModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private _panelTriggerElement: HTMLElement | null = null;

  constructor(
    private prioritizationService: ProductTypePrioritizationService,
    private router: Router,
    private overlay: Overlay,
    private headerService: HeaderService,
    private filterDataService: LabelingFilterDataService
  ) {
    this.initializeConfigurations();
  }

  ngOnInit(): void {
    this.loadData();
    this.subscribeToChapterChanges();
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
        this.closeSidePanel();
        this.appliedFilters = null;
        this.filterChips = [];
        this.searchText = '';
        this.requestState = {};
        this.filterDataService.clearData('product-type-prioritization');
        if (this.searchBarComponent) {
          this.searchBarComponent.clearSearch();
        }
        if (this.tableConfig.sortConfig) {
          this.tableConfig.sortConfig.direction = 'default';
        }
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
        this.loadData();
      });
  }

  private initializeConfigurations(): void {
    this.searchConfig = {
      placeholder: 'Search by Product Type or Barcode Value',
      minLength: 3,
      ariaLabel: 'Search product type prioritizations',
      alwaysShowTooltip: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      sortConfig: {
        column: 'productType',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No product type prioritization records found.',
      loadingMessage: 'Loading product type prioritization data...',
      showPagination: false
    };
  }

  private getTableColumns(): TableColumn<ProductTypePrioritizationModel>[] {
    return [
      {
        key: 'productType',
        header: 'Product Type',
        sortable: true,
        width: '200px'
      },
      {
        key: 'barcodeValue',
        header: 'Barcode Value',
        width: '200px'
      },
      {
        key: 'prioritySeq',
        header: 'Priority',
        width: '120px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private formatDate(date: string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<ProductTypePrioritizationModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit product type',
        ariaLabel: 'Edit product type {{productType}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.prioritizationService
      .getProductTypePrioritizations(this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: ProductTypePrioritizationModel[]; totalRecords: number }) => {
          if (this.filterDataService.getData('product-type-prioritization').length === 0) {
            this.filterDataService.setData('product-type-prioritization', response.data);
          }
          this.dataSource = response.data;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading product type prioritization data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load product type prioritization data. Please try again.';
        }
      });
  }

  /**
   * Handles (search) event from SearchBar.
   * Only acts when the input is cleared to empty (reload default data).
   */
  onSearchEvent(searchText: string): void {
    const trimmed = (searchText || '').trim();
    if (trimmed === '') {
      this.requestState.searchKeyword = undefined;
      this.loadData();
    }
  }

  /**
   * Handles Enter key press on the search bar.
   * searchKeyword applies OR logic across productType and barcodeValue on the backend.
   * Only triggers if input has 3 or more characters.
   */
  onEnterSearch(): void {
    const text = this.searchBarComponent?.searchText?.trim() || '';
    if (text.length >= 3) {
      this.requestState.searchKeyword = text;
      this.loadData();
    }
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    if (event.direction === 'default') {
      this.requestState.sort = undefined;
    } else {
      this.requestState.sort = event.direction === 'D' ? 'D' : 'A';
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<ProductTypePrioritizationModel>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this._panelTriggerElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    setTimeout(() => this.addEditPanelRef?.focus(), 100);
  }

  editRecord(record: ProductTypePrioritizationModel): void {
    this._panelTriggerElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
    setTimeout(() => this.addEditPanelRef?.focus(), 100);
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    setTimeout(() => this._panelTriggerElement?.focus(), 50);
  }

  onSaveSuccess(): void {
    this.filterDataService.clearData('product-type-prioritization');
    this.loadData();
  }

  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
    }
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.closeFilterOverlay();
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

    const portal = new ComponentPortal(ProductTypePrioritizationFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeFilterOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterOverlay();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterOverlay();
      });
  }

  private closeFilterOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }
  }

  applyFilters(filters: ProductTypePrioritizationFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = ProductTypePrioritizationFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      productType: filters.productType || undefined,
      ...this.mapDateFilterToRequest('eff', filters.effectiveDatePeriod, filters.effectiveDate),
      ...this.mapDateFilterToRequest('term', filters.terminationDatePeriod, filters.terminationDate)
    };

    this.loadData();
  }

  private mapDateFilterToRequest(
    prefix: 'eff' | 'term',
    period: string | null,
    date: any
  ): Record<string, string | undefined> {
    const afterKey = prefix === 'eff' ? 'effDateAfter' : 'termDateAfter';
    const beforeKey = prefix === 'eff' ? 'effDateBefore' : 'termDateBefore';

    const result: Record<string, string | undefined> = {
      [afterKey]: undefined,
      [beforeKey]: undefined
    };

    if (date && period) {
      const formatted = this.formatFilterDate(date);
      if (period === 'after') {
        result[afterKey] = formatted;
      } else if (period === 'before') {
        result[beforeKey] = formatted;
      }
    }

    return result;
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = ProductTypePrioritizationFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = ProductTypePrioritizationFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return ProductTypePrioritizationFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { productType, effDateAfter, effDateBefore, termDateAfter, termDateBefore, ...rest } = this.requestState;
    this.requestState = rest;

    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { productType, effDateAfter, effDateBefore, termDateAfter, termDateBefore, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      productType: this.appliedFilters.productType || undefined,
      ...this.mapDateFilterToRequest('eff', this.appliedFilters.effectiveDatePeriod, this.appliedFilters.effectiveDate),
      ...this.mapDateFilterToRequest('term', this.appliedFilters.terminationDatePeriod, this.appliedFilters.terminationDate)
    };
  }

  private formatFilterDate(date: any): string | undefined {
    return DateFieldValidationUtility.serializeDateForApi(date) || undefined;
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
      this.closeFilterOverlay();
    }

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
