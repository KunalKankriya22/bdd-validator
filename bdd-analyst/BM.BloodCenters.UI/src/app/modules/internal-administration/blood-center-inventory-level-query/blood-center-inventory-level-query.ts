import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OverlayModule } from '@angular/cdk/overlay';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { BloodCenterInventoryLevelQueryFilterPanel } from './filter-panel/blood-center-inventory-level-query-filter-panel';
import { BloodCenterInventoryLevelQueryService } from './services/blood-center-inventory-level-query.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MenuService } from '@shared/services/menu.service';
import { HeaderService } from '@shared/services/header.service';
import { ROUTES } from '@core/constants/route.constants';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTableConfig, TablePageEvent } from '@shared/interfaces/data-table.interface';
import { InventoryLevelFilterChipsUtils } from './utils/filter-chips.utils';
import {
  InventoryClassDto,
  InventoryLevelResultDto,
  InventoryLevelQueryDto
} from './interfaces/inventory-level.interface';

@Component({
  selector: 'app-blood-center-inventory-level-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    OverlayModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
    FilterChips,
    BloodCenterInventoryLevelQueryFilterPanel
  ],
  templateUrl: './blood-center-inventory-level-query.html',
  styleUrl: './blood-center-inventory-level-query.scss'
})
export class BloodCenterInventoryLevelQuery implements OnInit, OnDestroy {
  private static nextId = 0;
  readonly componentId = `inventory-query-${BloodCenterInventoryLevelQuery.nextId++}`;
  readonly elementId = (name: string) => `${this.componentId}-${name}`;
  readonly errorId  = (name: string) => `${this.componentId}-${name}-error`;

  private readonly fb            = inject(FormBuilder);
  private readonly service       = inject(BloodCenterInventoryLevelQueryService);
  private readonly snack         = inject(SnackbarService);
  private readonly menuService   = inject(MenuService);
  private readonly headerService = inject(HeaderService);
  private destroy$ = new Subject<void>();

  // ── data ──────────────────────────────────────────────────────────────────
  readonly inventoryClasses         = signal<InventoryClassDto[]>([]);
  readonly filteredInventoryClasses = signal<InventoryClassDto[]>([]);
  readonly inventoryResults         = signal<InventoryLevelResultDto[]>([]);

  inventoryClassSearchControl = new FormControl('');

  // ── ui state ──────────────────────────────────────────────────────────────
  readonly loading       = signal<boolean>(false);
  readonly loadingClasses = signal<boolean>(false);
  readonly error         = signal<string | null>(null);
  readonly isFilterOpen  = signal<boolean>(false);
  readonly appliedFilters = signal<Partial<InventoryLevelQueryDto>>({});
  readonly filterChips   = signal<FilterChip[]>([]);
  readonly searchText    = signal<string>('');
  readonly currentFilters = signal<Partial<InventoryLevelQueryDto>>({});
  readonly currentPage   = signal<number>(0);
  readonly currentPageSize = signal<number>(25);

  // ── derived ───────────────────────────────────────────────────────────────
  readonly filteredResults = computed(() => {
    const search = this.searchText().toLowerCase().trim();
    if (!search) return this.inventoryResults();
    return this.inventoryResults().filter(r =>
      r.productType?.toLowerCase().includes(search) ||
      r.productDescription?.toLowerCase().includes(search)
    );
  });

  readonly pagedResults = computed(() => {
    const all  = this.filteredResults();
    const page = this.currentPage();
    const size = this.currentPageSize();
    return all.slice(page * size, page * size + size);
  });

  readonly hasResults = computed(() => this.inventoryResults().length > 0);
  readonly selectedInventoryClass = signal<string>('');

  @ViewChild('filterButtonRef') filterButtonRef!: ElementRef<HTMLButtonElement>;

  form!: FormGroup;

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: ROUTES.HOME }],
    title: '',
    subtitle: ''
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by product type or description',
    minLength: 0,
    debounceTime: 300,
    searchOnEnterOnly: false
  };

  tableConfig: DataTableConfig<InventoryLevelResultDto> = {
    columns: [
      { key: 'productType',        header: 'Product Type',             sortable: false, width: '140px' },
      { key: 'productDescription', header: 'Product Type Description', sortable: false },
      { key: 'bloodTypeDescription', header: 'ABORh',                  sortable: false, width: '150px' },
      { key: 'actualCount',        header: 'Actual',                   sortable: false, width: '100px' },
      { key: 'minLevel',           header: 'Minimal',                  sortable: false, width: '100px' },
      { key: 'optimalLevel',       header: 'Optimal',                  sortable: false, width: '100px' }
    ],
    showPagination: true,
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'No inventory levels found for the selected criteria',
    noDataIcon: 'edit'
  };

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.BloodCenterInventoryLevelQuery].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);
        if (menuItem) {
          this.pageHeaderConfig = {
            ...this.pageHeaderConfig,
            breadcrumbs: [
              { label: 'Home', link: ROUTES.HOME },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || ''
          };
        }
      }
    });

    effect(() => {
      const total = this.filteredResults().length;
      if (this.tableConfig.pagination) {
        this.tableConfig.pagination.totalRecords = total;
      }
    });
  }

  ngOnInit(): void {
    this.form = this.fb.group({ inventoryClass: ['', Validators.required] });
    this.loadInventoryClasses();
    this.inventoryClassSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => this.filterInventoryClasses(search ?? ''));
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
        this.loadInventoryClasses();
      });
  }

  private filterInventoryClasses(search: string): void {
    const term = search.toLowerCase().trim();
    const all = this.inventoryClasses();
    this.filteredInventoryClasses.set(
      term ? all.filter(c =>
        c.description?.toLowerCase().includes(term) ||
        c.code?.toLowerCase().includes(term)
      ) : all
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── inventory class ───────────────────────────────────────────────────────
  private loadInventoryClasses(): void {
    this.loadingClasses.set(true);
    this.service.getInventoryClasses().pipe(takeUntil(this.destroy$)).subscribe({
      next: d => { this.inventoryClasses.set(d); this.filteredInventoryClasses.set(d); this.loadingClasses.set(false); },
      error: () => { this.snack.showError('Failed to load inventory classes.'); this.loadingClasses.set(false); }
    });
  }

  onInventoryClassChange(): void {
    this.selectedInventoryClass.set(this.form.get('inventoryClass')?.value ?? '');
    this.appliedFilters.set({});
    this.filterChips.set([]);
    this.currentFilters.set({});
    this.isFilterOpen.set(false);
    if (this.form.valid) { this.resetPage(); this.queryInventoryLevels(); }
  }

  onClear(): void {
    this.form.reset();
    this.selectedInventoryClass.set('');
    this.inventoryResults.set([]);
    this.currentFilters.set({});
    this.appliedFilters.set({});
    this.filterChips.set([]);
    this.searchText.set('');
    this.error.set(null);
    this.isFilterOpen.set(false);
    this.resetPage();
  }

  // ── query ─────────────────────────────────────────────────────────────────
  private queryInventoryLevels(): void {
    if (this.form.invalid) return;
    const inventoryClass = this.form.value.inventoryClass;
    if (!inventoryClass) return;

    this.loading.set(true);
    this.error.set(null);

    this.service.queryInventoryLevels({ inventoryClass, ...this.currentFilters() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.inventoryResults.set(data);
          this.loading.set(false);
        },
        error: err => {
          const errorResponse = err?.error?.errorResponse || err?.error;
          const errorCode = errorResponse?.errorCode;
          const errorMessage = errorResponse?.error || err?.error?.message || 'Failed to query inventory levels';
          const displayMessage = errorCode ? `${errorCode}: ${errorMessage}` : errorMessage;
          this.error.set(displayMessage);
          this.snack.showError(displayMessage);
          this.inventoryResults.set([]);
          this.loading.set(false);
        }
      });
  }

  // ── filter ────────────────────────────────────────────────────────────────
  toggleFilter(): void {
    const closing = this.isFilterOpen();
    this.isFilterOpen.update(v => !v);
    if (closing && this.filterButtonRef?.nativeElement) {
      this.filterButtonRef.nativeElement.blur();
    }
  }

  onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.toggleFilter();
    }
  }

  onApplyFilters(filters: Partial<InventoryLevelQueryDto>): void {
    this.appliedFilters.set({ ...filters });
    this.currentFilters.set(filters);
    this.filterChips.set(InventoryLevelFilterChipsUtils.convertFiltersToChips(filters));
    if (this.isFilterOpen()) {
      this.toggleFilter();
    }
    this.resetPage();
    this.queryInventoryLevels();
  }

  removeFilterChip(key: string): void {
    const updated = InventoryLevelFilterChipsUtils.removeFilterByChipKey(this.appliedFilters(), key);
    this.onApplyFilters(updated);
  }

  clearAllFilters(): void {
    this.onApplyFilters({});
  }

  // ── search / pagination ───────────────────────────────────────────────────
  onSearchChange(text: string): void { this.searchText.set(text); this.resetPage(); }

  onPageChange(event: TablePageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.currentPageSize.set(event.pageSize);
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageSize  = event.pageSize;
      this.tableConfig.pagination.pageIndex = event.pageIndex;
    }
  }

  private resetPage(): void {
    this.currentPage.set(0);
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
  }

  get f() { return this.form.controls; }
}
