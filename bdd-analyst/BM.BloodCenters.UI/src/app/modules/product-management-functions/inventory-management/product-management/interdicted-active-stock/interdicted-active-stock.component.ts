import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
  inject,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { LiveAnnouncer } from '@angular/cdk/a11y';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTableConfig, TablePageEvent, TableSortEvent, SortConfig } from '@shared/interfaces/data-table.interface';
import { InterdictedStockTable } from './interdicted-stock-table/interdicted-stock-table';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

import { InterdictedActiveStockService } from './services/interdicted-active-stock.service';
import {
  InterdictedProduct,
  InventoryClassOption,
  ProductTypeOption,
  InterdictedFilterValue
} from './models/interdicted-active-stock.model';
import { InterdictedFilterPanel } from './filter-panel/filter-panel.component';

@Component({
  selector: 'app-interdicted-active-stock',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    InterdictedStockTable,
    FilterChips
  ],
  templateUrl: './interdicted-active-stock.component.html',
  styleUrls: ['./interdicted-active-stock.component.scss']
})
export class InterdictedActiveStockComponent implements OnInit, OnDestroy {

  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;

  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: ''
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Unit ID or Product Code',
    minLength: 1,
    ariaLabel: 'Search interdicted products by unit ID or product code'
  };

  tableConfig: DataTableConfig<InterdictedProduct> = {
    columns: [
      { key: 'unitId',         header: 'Unit ID',         sortable: true,
        valueFormatter: (v: string, row: InterdictedProduct) => row.checkDigit ? `${v}${row.checkDigit}` : v
      },
      { key: 'inventoryClass', header: 'Inventory Class', sortable: false },
      { key: 'productCode',    header: 'Product',         sortable: false },
      { key: 'aboRh',          header: 'ABORh',           sortable: false },
      { key: 'collDate',       header: 'Collection Date', sortable: false,
        valueFormatter: (v: string) => {
          if (!v) return '-';
          const d = new Date(v);
          if (isNaN(d.getTime())) return v;
          return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
        }
      },
      {
        key: 'stockState', header: 'Stock Status', sortable: false,
        valueFormatter: (v: string) => ({
          AV: 'Available', RE: 'Reserved', AL: 'Allocated', PK: 'Packed'
        }[v] ?? v)
      },
      { key: 'locationId',     header: 'Location',        sortable: false }
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: { column: 'unitId', direction: 'default' },
    stickyHeader: true,
    showPagination: true,
    emptyMessage: 'No interdicted products found',
    loadingMessage: 'Loading interdicted active stock...'
  };

  dataSource: InterdictedProduct[] = [];
  selectedProduct: InterdictedProduct | null = null;
  focusedProduct: InterdictedProduct | null = null;
  isLoading = false;
  hasError = false;
  errorMessage = '';

  inventoryClasses: InventoryClassOption[] = [];
  productTypes: ProductTypeOption[] = [];

  appliedFilters: InterdictedFilterValue | null = null;
  filterChips: FilterChip[] = [];
  isFilterOpen = false;

  private searchText = '';
  private sortDirection: 'A' | 'D' = 'A';
  private previousSortDirection: SortConfig['direction'] = 'default';
  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private focusAfterLoad: 'first' | 'last' | null = null;

  constructor(
    private service: InterdictedActiveStockService,
    private overlay: Overlay
  ) {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
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
    this.loadDropdownOptions();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.appliedFilters = null;
        this.filterChips = [];
        this.searchText = '';
        this.selectedProduct = null;
        this.focusedProduct = null;
        this.sortDirection = 'A';
        this.previousSortDirection = 'default';
        this.tableConfig.sortConfig = { column: 'unitId', direction: 'default' };
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
        }
        this.loadDropdownOptions();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  // ── Filter panel (CDK Overlay) ────────────────────────────────────────────

  openFilter(): void {
    if (this.overlayRef) {
      this.closeOverlay();
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
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    this.isFilterOpen = true;

    const portal = new ComponentPortal(InterdictedFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    setTimeout(() => {
      const panelEl = componentRef.location.nativeElement as HTMLElement;
      const firstFocusable = panelEl.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }, 50);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.inventoryClasses = this.inventoryClasses;
    componentRef.instance.productTypes = this.productTypes;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeOverlay());

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeOverlay());
  }

  private closeOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      setTimeout(() => this.filterBtn?.nativeElement?.focus(), 0);
    }
  }

  applyFilters(filters: InterdictedFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = this.buildFilterChips(filters);

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  onRemoveFilterChip(chipKey: string): void {
    if (!this.appliedFilters) return;

    const updated = { ...this.appliedFilters };
    if (chipKey === 'inventoryClass') delete updated.inventoryClass;
    if (chipKey === 'productType') delete updated.productType;

    this.appliedFilters = Object.keys(updated).length > 0 ? updated : null;
    this.filterChips = this.buildFilterChips(this.appliedFilters);

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  hasActiveFilters(): boolean {
    return !!(this.appliedFilters?.inventoryClass || this.appliedFilters?.productType);
  }

  private buildFilterChips(filters: InterdictedFilterValue | null): FilterChip[] {
    if (!filters) return [];
    const chips: FilterChip[] = [];
    if (filters.inventoryClass) {
      chips.push({ key: 'inventoryClass', label: `Inv. Class: ${filters.inventoryClass}`, value: filters.inventoryClass });
    }
    if (filters.productType) {
      chips.push({ key: 'productType', label: `Product Type: ${filters.productType}`, value: filters.productType });
    }
    return chips;
  }

  // ── Search ────────────────────────────────────────────────────────────────

  onSearch(term: string): void {
    this.searchText = term;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  // ── Table interactions ────────────────────────────────────────────────────

  onRowClick(product: InterdictedProduct): void {
    this.selectedProduct = product;
    this.focusedProduct = product;
    this.announceSelectedProduct();
  }

  private announceSelectedProduct(): void {
    if (!this.selectedProduct) return;
    const count = this.selectedProduct.interdictions?.length ?? 0;
    const msg = count > 0
      ? `${count} interdiction${count !== 1 ? 's' : ''} for unit ${this.selectedProduct.unitId}`
      : `No interdictions for unit ${this.selectedProduct.unitId}`;
    this.liveAnnouncer.announce(msg, 'polite');
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadTableData();
  }

  onSortChange(event: TableSortEvent): void {
    // DataTable cycles D→A internally; intercept that to produce default→A→D→default cycle.
    const effectiveDirection: SortConfig['direction'] =
      (this.previousSortDirection === 'D' && event.direction === 'A') ? 'default' : event.direction;

    this.previousSortDirection = effectiveDirection;
    this.tableConfig.sortConfig = { column: event.column, direction: effectiveDirection };
    this.sortDirection = effectiveDirection === 'D' ? 'D' : 'A';

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadTableData();
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  private loadDropdownOptions(): void {
    let resolved = 0;
    const afterBoth = () => {
      resolved++;
      if (resolved === 2) {
        this.loadTableData();
      }
    };

    this.service.getInventoryClasses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const items = response.item ?? response.data ?? [];
          this.inventoryClasses = Array.isArray(items) ? items : [];
          afterBoth();
        },
        error: () => afterBoth()
      });

    this.service.getProductTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const items = response.item ?? response.data ?? [];
          this.productTypes = Array.isArray(items) ? items : [];
          afterBoth();
        },
        error: () => afterBoth()
      });
  }

  loadTableData(): void {
    this.isLoading = true;
    this.hasError = false;
    if (!this.focusAfterLoad) {
      this.selectedProduct = null;
      this.focusedProduct = null;
    }

    const unitIdCol = this.tableConfig.columns.find(c => c.key === 'unitId');
    if (unitIdCol) {
      unitIdCol.header = 'Unit ID';
    }

    const pageIndex = this.tableConfig.pagination?.pageIndex ?? 0;
    const pageSize = this.tableConfig.pagination?.pageSize ?? 10;
    const skip = pageIndex * pageSize;

    this.service.getInterdictedProducts(
      this.appliedFilters?.inventoryClass ?? '',
      this.appliedFilters?.productType ?? '',
      pageSize,
      skip,
      this.sortDirection,
      this.searchText.trim()
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const all: InterdictedProduct[] = Array.isArray(response.data) ? response.data : (response.item ?? []);
          const total = response.total ?? 0;

          this.dataSource = all;

          if (this.focusAfterLoad === 'first') {
            this.focusedProduct = all[0] ?? null;
          } else if (this.focusAfterLoad === 'last') {
            this.focusedProduct = all[all.length - 1] ?? null;
          }
          this.focusAfterLoad = null;

          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = total;
          }

          const unitIdCol = this.tableConfig.columns.find(c => c.key === 'unitId');
          if (unitIdCol) {
            unitIdCol.header = `Unit ID (${total})`;
          }

          this.liveAnnouncer.announce(
            `${total} interdicted product${total !== 1 ? 's' : ''} loaded.`,
            'polite'
          );
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.errorMessage = 'Failed to load interdicted products. Please try again.';
          this.liveAnnouncer.announce(this.errorMessage, 'assertive');
          this.isLoading = false;
        }
      });
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.closeOverlay();
    }

    if (event.key === 'ArrowDown' && !this.overlayRef) {
      const cursor = this.focusedProduct ?? this.selectedProduct;
      if (cursor) {
        const idx = this.dataSource.indexOf(cursor);
        if (idx < this.dataSource.length - 1) {
          event.preventDefault();
          this.focusedProduct = this.dataSource[idx + 1];
        } else {
          const currentPage = this.tableConfig.pagination?.pageIndex ?? 0;
          const pageSize   = this.tableConfig.pagination?.pageSize ?? 25;
          const total      = this.tableConfig.pagination?.totalRecords ?? 0;
          if (currentPage < Math.ceil(total / pageSize) - 1 && this.tableConfig.pagination) {
            event.preventDefault();
            this.tableConfig.pagination.pageIndex = currentPage + 1;
            this.focusAfterLoad = 'first';
            this.loadTableData();
          }
        }
      }
    }

    if (event.key === 'ArrowUp' && !this.overlayRef) {
      const cursor = this.focusedProduct ?? this.selectedProduct;
      if (cursor) {
        const idx = this.dataSource.indexOf(cursor);
        if (idx > 0) {
          event.preventDefault();
          this.focusedProduct = this.dataSource[idx - 1];
        } else {
          const currentPage = this.tableConfig.pagination?.pageIndex ?? 0;
          if (currentPage > 0 && this.tableConfig.pagination) {
            event.preventDefault();
            this.tableConfig.pagination.pageIndex = currentPage - 1;
            this.focusAfterLoad = 'last';
            this.loadTableData();
          }
        }
      }
    }
  }
}
