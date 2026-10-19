import {
  Component,
  ComponentRef,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';

import { ConfigureInterdictionPlacementService } from './configure-interdiction-placement.service';
import { InterdictionPlacementSidePanelComponent } from './interdiction-placement-side-panel/interdiction-placement-side-panel.component';
import { InterdictionPlacementFilterComponent } from './interdiction-placement-filter/interdiction-placement-filter.component';
import {
  InterdictionPlacement,
  InterdictionPlacementQuery,
  ActionFunctionNameLookup,
  ActionCodeLookup,
  ProductCodeLookup,
  InterdictionCodeLookup,
  ProductTypeLookup,
  InterdictionPlacementFilterState,
} from './configure-interdiction-placement.model';

@Component({
  selector: 'app-configure-interdiction-placement',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    InterdictionPlacementSidePanelComponent,
    InterdictionPlacementFilterComponent,
  ],
  templateUrl: './configure-interdiction-placement.component.html',
  styleUrl: './configure-interdiction-placement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigureInterdictionPlacementComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `configure-interdiction-placement-${ConfigureInterdictionPlacementComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ConfigureInterdictionPlacementService);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;

  protected readonly headerConfig = computed<PageHeaderConfig>(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: pageData?.title || 'Configure Interdiction Placement', link: null }
      ],
      title: pageData?.title || 'Configure Interdiction Placement',
      subtitle: pageData?.subtitle || 'Manage where and how interdiction labels are placed for blood product identification and processing.',
      actions: [{
        label: 'ADD NEW INTERDICTION PLACEMENT',
        icon: 'add',
        color: 'primary',
        onClick: () => this.openAddPanel(),
        disabled: !this.selectedFunction(),
      }],
    };
  });

  // Data signals
  protected readonly loading = signal<boolean>(false);
  protected readonly sidePanelLookupsLoading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly totalCount = signal<number>(0);
  protected readonly selectedFunction = signal<string>('');
  protected readonly searchKeyword = signal<string>('');
  protected readonly appliedFilters = signal<InterdictionPlacementFilterState>({});

  // Lookup data for Function Name dropdown
  protected readonly actionFunctionNames = signal<ActionFunctionNameLookup[]>([]);

  // Filter dropdown data — populated from distinct values in loaded data
  protected readonly filterOtherProductCodes = signal<ProductCodeLookup[]>([]);
  protected readonly filterActionCodes = signal<ActionCodeLookup[]>([]);

  // Side panel lookup data — loaded once in parent, passed to child as @Input
  protected readonly sidePanelActionCodes = signal<ActionCodeLookup[]>([]);
  protected readonly sidePanelProductCodes = signal<ProductCodeLookup[]>([]);
  protected readonly sidePanelInterdictionCodes = signal<InterdictionCodeLookup[]>([]);
  protected readonly sidePanelProductTypes = signal<ProductTypeLookup[]>([]);

  // Table data
  protected dataSource: InterdictionPlacement[] = [];
  protected currentPageSize = 10;
  protected currentPageIndex = 0;
  protected sortColumn = '';
  protected sortDirection: 'ASC' | 'DESC' = 'ASC';

  // Side panel state
  protected sidePanelOpen = false;
  protected sidePanelMode: 'add' | 'edit' = 'add';
  protected sidePanelData: InterdictionPlacement | null = null;

  // Filter overlay state
  protected isFilterOpen = false;
  private overlayRef: OverlayRef | null = null;
  private filterComponentRef: ComponentRef<InterdictionPlacementFilterComponent> | null = null;

  // Filter chips
  protected filterChips: FilterChip[] = [];

  // Function Name searchable dropdown
  protected functionNameSearchCtrl = new FormControl('');
  private functionNameSearch = signal('');
  protected readonly filteredFunctionNames = computed(() => {
    const search = this.functionNameSearch().toLowerCase();
    const options = this.actionFunctionNames();
    if (!search) return options;
    return options.filter(o => o.code.toLowerCase().includes(search));
  });

  protected readonly hasActiveFilters = computed(() => {
    const filters = this.appliedFilters();
    return !!(filters.currentProduct || filters.otherProduct || filters.rejectCode || filters.effectiveDate || filters.terminationDate);
  });

  // Search bar config
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Interdiction Code',
    minLength: 3,
    ariaLabel: 'Search by Interdiction Code',
    searchOnEnterOnly: true,
  };

  // Data table config
  tableConfig: DataTableConfig<InterdictionPlacement> = {
    columns: [
      { key: 'actionFunctionName', header: 'Function Code', sortable: true, width: '130px' },
      { key: 'actionProductCode', header: 'Product Code', width: '120px' },
      { key: 'actionCode', header: 'Reject Code', width: '110px' },
      {
        key: 'interOnCurrentProd', header: 'Current Product', width: '130px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No',
      },
      { key: 'interOnOtherProds', header: 'Other Product Code', width: '150px' },
      { key: 'interOnOtherProdTypes', header: 'Other Product Type', width: '150px' },
      {
        key: 'interOnUnitLevel', header: 'Unit Level Interdiction', width: '170px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No',
      },
      {
        key: 'interAllProdButCurr', header: 'Unit Level Code', width: '130px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No',
      },
      { key: 'interCode', header: 'Interdiction Code', width: '150px' },
      {
        key: 'effDate', header: 'Effective Date', width: '130px',
        valueFormatter: (value) => this.formatDate(value),
      },
      {
        key: 'termDate', header: 'Termination Date', width: '150px',
        valueFormatter: (value) => this.formatDate(value),
      },
    ],
    rowActions: [
      { icon: 'edit', action: 'edit', ariaLabel: 'Edit record' },
    ],
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: {
      column: '',
      direction: 'default',
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No interdiction placement configurations found',
    loadingMessage: 'Loading interdiction placement data...',
    showPagination: true,
  };

  functionForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.loadActionFunctionNames();
    this.setupFormListeners();
    this.setupSearchControls();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.dataSource = [];
        this.totalCount.set(0);
        this.currentPageIndex = 0;
        this.searchKeyword.set('');
        this.appliedFilters.set({});
        this.filterChips = [];
        this.filterOtherProductCodes.set([]);
        this.filterActionCodes.set([]);
        this.selectedFunction.set('');
        this.functionForm.reset();

        this.closeSidePanel();
        this.disposeFilterOverlay();

        this.loadActionFunctionNames();
      });
  }

  ngOnDestroy(): void {
    this.disposeFilterOverlay();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.functionForm = this.fb.group({
      functionName: [''],
    });
  }

  private setupFormListeners(): void {
    this.functionForm.get('functionName')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.selectedFunction.set(value || '');
        this.currentPageIndex = 0;
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
        }
        this.appliedFilters.set({});
        this.filterChips = [];
        this.filterOtherProductCodes.set([]);
        this.filterActionCodes.set([]);
        this.loadData();
      });
  }

  private setupSearchControls(): void {
    this.functionNameSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.functionNameSearch.set(v || ''));
  }

  private loadActionFunctionNames(): void {
    this.service.getActionFunctionNames()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.actionFunctionNames.set(data);
        },
        error: (err) => {
          console.error('Error loading action function names:', err);
          this.snackbarService.showError('Failed to load function names');
        },
      });
  }

  private loadSidePanelLookups(): void {
    this.sidePanelLookupsLoading.set(true);
    let pendingCalls = 4;
    const onComplete = () => {
      pendingCalls--;
      if (pendingCalls === 0) this.sidePanelLookupsLoading.set(false);
    };

    this.service.getActionCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.sidePanelActionCodes.set(data); onComplete(); },
        error: (err) => { console.error('Error loading action codes:', err); onComplete(); },
      });

    this.service.getProductCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.sidePanelProductCodes.set(data); onComplete(); },
        error: (err) => { console.error('Error loading product codes:', err); onComplete(); },
      });

    this.service.getInterdictionCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.sidePanelInterdictionCodes.set(data); onComplete(); },
        error: (err) => { console.error('Error loading interdiction codes:', err); onComplete(); },
      });

    this.service.getProductTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.sidePanelProductTypes.set(data); onComplete(); },
        error: (err) => { console.error('Error loading product types:', err); onComplete(); },
      });
  }

  private loadFilterOptions(functionName: string): void {
    if (!functionName) {
      this.filterOtherProductCodes.set([]);
      this.filterActionCodes.set([]);
      if (this.filterComponentRef) {
        this.filterComponentRef.instance.optionsLoading.set(false);
      }
      return;
    }

    this.service.getFilterOptions(functionName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.filterOtherProductCodes.set(
            options.otherProductCodes.map(code => ({ productCode: code, productDesc: '' }))
          );
          this.filterActionCodes.set(
            options.actionCodes.map(code => ({ code, codeDesc: '' }))
          );
          if (this.filterComponentRef) {
            this.filterComponentRef.instance.otherProductCodes = this.filterOtherProductCodes();
            this.filterComponentRef.instance.actionCodes = this.filterActionCodes();
            this.filterComponentRef.instance.optionsLoading.set(false);
          }
        },
        error: (err) => {
          console.error('Error loading filter options:', err);
          if (this.filterComponentRef) {
            this.filterComponentRef.instance.optionsLoading.set(false);
          }
        },
      });
  }

  loadData(): void {
    if (!this.selectedFunction()) {
      this.dataSource = [];
      this.totalCount.set(0);
      if (this.tableConfig.pagination) {
        this.tableConfig.pagination.totalRecords = 0;
      }
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const filters = this.appliedFilters();
    const query: InterdictionPlacementQuery = {
      actionFunctionName: this.selectedFunction() || undefined,
      searchKeyword: this.searchKeyword() || undefined,
      sortColumn: this.sortColumn || undefined,
      sortOrder: this.sortDirection || undefined,
      interOnCurrentProd: filters.currentProduct || undefined,
      actionCode: filters.rejectCode || undefined,
      interOnOtherProds: filters.otherProduct || undefined,
    };

    if (filters.effectiveDate && filters.effectivePeriod) {
      if (filters.effectivePeriod === 'After') {
        query.effDateFrom = filters.effectiveDate;
      } else if (filters.effectivePeriod === 'Before') {
        query.effDateTo = filters.effectiveDate;
      }
    }
    if (filters.terminationDate && filters.terminationPeriod) {
      if (filters.terminationPeriod === 'After') {
        query.termDateFrom = filters.terminationDate;
      } else if (filters.terminationPeriod === 'Before') {
        query.termDateTo = filters.terminationDate;
      }
    }

    const skip = this.currentPageIndex * this.currentPageSize;
    const take = this.currentPageSize;

    this.service.getAll(take, skip, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.totalCount.set(response.totalRecords);
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.totalRecords;
            this.tableConfig.pagination.pageIndex = this.currentPageIndex;
            this.tableConfig.pagination.pageSize = this.currentPageSize;
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading data:', err);
          this.error.set(err.message || 'Failed to load data');
          this.loading.set(false);
          this.snackbarService.showError('Failed to load interdiction placement data');
        },
      });
  }

  // Search bar handler
  protected onSearch(searchText: string): void {
    this.searchKeyword.set(searchText?.trim() || '');
    this.currentPageIndex = 0;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  // Data table handlers
  protected onPageChange(event: TablePageEvent): void {
    this.currentPageSize = event.pageSize;
    this.currentPageIndex = event.pageIndex;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  protected onSortChange(event: TableSortEvent): void {
    if (event.direction !== 'default') {
      this.sortColumn = event.column;
      this.sortDirection = event.direction === 'A' ? 'ASC' : 'DESC';
    } else {
      this.sortColumn = '';
      this.sortDirection = 'ASC';
    }
    this.tableConfig.sortConfig = { column: event.column, direction: event.direction };
    this.loadData();
  }

  protected onRowAction(event: TableRowActionEvent<InterdictionPlacement>): void {
    if (event.action === 'edit') {
      this.openEditPanel(event.row);
    }
  }

  // Side panel operations
  protected openAddPanel(): void {
    this.loadSidePanelLookups();
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  protected openEditPanel(row: InterdictionPlacement): void {
    this.loadSidePanelLookups();
    this.sidePanelMode = 'edit';
    this.sidePanelData = row;
    this.sidePanelOpen = true;
  }

  protected closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  protected onSaveSuccess(message: string): void {
    this.closeSidePanel();
    this.loadData();
    this.snackbarService.showSuccess(message);
  }

  protected onSaveAndCreateAnother(message: string): void {
    this.loadData();
    this.snackbarService.showSuccess(message);
  }

  // Filter overlay operations (CDK Overlay — IPT pattern)
  protected openFilter(): void {
    if (this.overlayRef) {
      this.disposeFilterOverlay();
      return;
    }

    this.isFilterOpen = true;
    this.loadFilterOptions(this.selectedFunction());

    const tableRect = this.tableCard.nativeElement.getBoundingClientRect();
    const availableHeight = window.innerHeight - tableRect.top - 64 - 20;

    const positionStrategy: FlexibleConnectedPositionStrategy =
      this.overlay.position()
        .flexibleConnectedTo(this.tableCard)
        .withPositions([
          {
            originX: 'start',
            originY: 'top',
            overlayX: 'start',
            overlayY: 'top',
            offsetX: 8,
            offsetY: 64,
          }
        ])
        .withPush(true)
        .withViewportMargin(20)
        .withFlexibleDimensions(true)
        .withGrowAfterOpen(false);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      width: '340px',
      minWidth: '280px',
      maxWidth: '340px',
      maxHeight: `${Math.max(availableHeight, 300)}px`,
    });

    const portal = new ComponentPortal(InterdictionPlacementFilterComponent);
    const componentRef = this.overlayRef.attach(portal);
    this.filterComponentRef = componentRef;

    componentRef.instance.currentFilters = this.appliedFilters();
    componentRef.instance.optionsLoading.set(true);
    componentRef.instance.otherProductCodes = this.filterOtherProductCodes();
    componentRef.instance.actionCodes = this.filterActionCodes();

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.onFiltersApplied(filters);
        this.disposeFilterOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.disposeFilterOverlay();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.disposeFilterOverlay();
      });
  }

  private disposeFilterOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.filterComponentRef = null;
    this.isFilterOpen = false;
  }

  protected onFiltersApplied(filters: InterdictionPlacementFilterState): void {
    this.appliedFilters.set(filters);
    this.filterChips = this.convertFiltersToChips(filters);
    this.currentPageIndex = 0;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  protected onRemoveFilterChip(key: string): void {
    const current = { ...this.appliedFilters() };
    switch (key) {
      case 'currentProduct': current.currentProduct = undefined; break;
      case 'otherProduct': current.otherProduct = undefined; break;
      case 'rejectCode': current.rejectCode = undefined; break;
      case 'effectiveDate': current.effectiveDate = undefined; current.effectivePeriod = undefined; break;
      case 'terminationDate': current.terminationDate = undefined; current.terminationPeriod = undefined; break;
    }
    this.appliedFilters.set(current);
    this.filterChips = this.convertFiltersToChips(current);
    this.currentPageIndex = 0;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  protected clearAllFilters(): void {
    this.appliedFilters.set({});
    this.filterChips = [];
    this.currentPageIndex = 0;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  private convertFiltersToChips(filters: InterdictionPlacementFilterState): FilterChip[] {
    const chips: FilterChip[] = [];
    if (filters.currentProduct) {
      chips.push({ key: 'currentProduct', label: `Current Product: ${filters.currentProduct === 'Y' ? 'Yes' : 'No'}`, value: filters.currentProduct });
    }
    if (filters.otherProduct) {
      chips.push({ key: 'otherProduct', label: `Other Product: ${filters.otherProduct}`, value: filters.otherProduct });
    }
    if (filters.rejectCode) {
      chips.push({ key: 'rejectCode', label: `Reject Code: ${filters.rejectCode}`, value: filters.rejectCode });
    }
    if (filters.effectiveDate && filters.effectivePeriod) {
      const formatted = this.formatDate(filters.effectiveDate);
      const symbol = filters.effectivePeriod === 'After' ? '≥' : '≤';
      chips.push({ key: 'effectiveDate', label: `Effective Date ${symbol} ${formatted}`, value: filters.effectiveDate });
    }
    if (filters.terminationDate && filters.terminationPeriod) {
      const formatted = this.formatDate(filters.terminationDate);
      const symbol = filters.terminationPeriod === 'After' ? '≥' : '≤';
      chips.push({ key: 'terminationDate', label: `Termination Date ${symbol} ${formatted}`, value: filters.terminationDate });
    }
    return chips;
  }

  protected formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const m = moment(dateStr);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateStr;
  }
}
