import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  HostListener,
  ViewChild,
  ElementRef,
  NgZone,
  effect,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule, NgModel } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, Subscription } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { RackDefinitionService } from './services/rack-definition.service';
import {
  RackDetailListDto,
  RackDetailQueryDto,
  RackDefinitionFilterValue,
  LovOption
} from './models/rack-definition.model';

import { DataTable } from '@shared/components/data-table/data-table';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableSortEvent,
  TableRowActionEvent,
  TablePageEvent
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { RackDefinitionFilterChipsUtils } from './utils/filter-chips.utils';
import { RackDefinitionFilterPanel } from './rack-definition-filter-panel/rack-definition-filter-panel';
import { AddEditRackComponent } from './add-edit-rack/add-edit-rack';
import { formatTableDate } from '@shared/utils/date-format.util';

@Component({
  selector: 'app-rack-definition',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditRackComponent
  ],
  templateUrl: './rack-definition.html',
  styleUrls: ['./rack-definition.scss']
})
export class RackDefinitionComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild(DataTable) dataTableRef?: DataTable<RackDetailListDto>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtnRef?: ElementRef<HTMLElement>;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('tableWrapper', { read: ElementRef }) tableWrapper!: ElementRef<HTMLElement>;
  @ViewChild('warehouseModel') warehouseModel?: NgModel;
  @ViewChild('deviceTypeModel') deviceTypeModel?: NgModel;
  @ViewChild('deviceNumberModel') deviceNumberModel?: NgModel;
  @ViewChild('storageClassModel') storageClassModel?: NgModel;
  @ViewChild('warehouseSelect') warehouseSelect?: MatSelect;
  @ViewChild('deviceTypeSelect') deviceTypeSelect?: MatSelect;
  @ViewChild('deviceNumberSelect') deviceNumberSelect?: MatSelect;
  @ViewChild('storageTypeSelect') storageTypeSelect?: MatSelect;

  headerConfig!: PageHeaderConfig;
  searchConfig!: SearchBarConfig;
  tableConfig!: DataTableConfig<RackDetailListDto>;

  appliedFilters: RackDefinitionFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: RackDetailListDto[] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Retrieve card state
  warehouseOptions = signal<LovOption[]>([]);
  deviceTypeOptions = signal<LovOption[]>([]);
  deviceNumberOptions = signal<LovOption[]>([]);
  storageTypeOptions = signal<LovOption[]>([]);

  isLoadingWarehouses = false;
  isLoadingDeviceTypes = false;
  isLoadingDeviceNumbers = false;
  isLoadingStorageTypes = false;

  readonly warehouseSearchControl = new FormControl('');
  readonly deviceTypeSearchControl = new FormControl('');
  readonly deviceNumberSearchControl = new FormControl('');
  readonly storageTypeSearchControl = new FormControl('');

  readonly warehouseSearch = signal('');
  readonly deviceTypeSearch = signal('');
  readonly deviceNumberSearch = signal('');
  readonly storageTypeSearch = signal('');

  readonly filteredWarehouses = computed(() => {
    const q = this.warehouseSearch().toLowerCase();
    const opts = this.warehouseOptions();
    return q ? opts.filter(o => o.code?.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q)) : opts;
  });

  readonly filteredDeviceTypes = computed(() => {
    const q = this.deviceTypeSearch().toLowerCase();
    const opts = this.deviceTypeOptions();
    return q ? opts.filter(o => o.code?.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q)) : opts;
  });

  readonly filteredDeviceNumbers = computed(() => {
    const q = this.deviceNumberSearch().toLowerCase();
    const opts = this.deviceNumberOptions();
    return q ? opts.filter(o => o.code?.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q)) : opts;
  });

  readonly filteredStorageTypes = computed(() => {
    const q = this.storageTypeSearch().toLowerCase();
    const opts = this.storageTypeOptions();
    return q ? opts.filter(o => o.code?.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q)) : opts;
  });

  selectedWarehouseId: string | null = null;
  selectedDeviceType: string | null = null;
  selectedDeviceNumber: string | null = null;
  selectedStorageClass: string | null = null;

  isRetrieved = false;
  isDeviceNumberDisabled = true;

  private lastRetrievedValues: { warehouseId: string; deviceType: string; deviceNumber: string; storageClass: string } | null = null;

  // Side panel state
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: RackDetailListDto | null = null;
  private sidePanelTrigger: HTMLElement | null = null;

  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private filterSubscriptions: Subscription[] = [];
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    private rackDefinitionService: RackDefinitionService,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private ngZone: NgZone
  ) {
    this.initializeConfigurations();

    this.warehouseSearchControl.valueChanges.subscribe(v => this.warehouseSearch.set(v || ''));
    this.deviceTypeSearchControl.valueChanges.subscribe(v => this.deviceTypeSearch.set(v || ''));
    this.deviceNumberSearchControl.valueChanges.subscribe(v => this.deviceNumberSearch.set(v || ''));
    this.storageTypeSearchControl.valueChanges.subscribe(v => this.storageTypeSearch.set(v || ''));

    effect(() => {
      this.filteredWarehouses();
      this.filteredDeviceTypes();
      this.filteredDeviceNumbers();
      this.filteredStorageTypes();
      setTimeout(() => {
        [this.warehouseSelect, this.deviceTypeSelect, this.deviceNumberSelect, this.storageTypeSelect]
          .forEach(s => { if (s?.panelOpen) (s as any)._keyManager?.setActiveItem(1); });
      });
    });

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
    this.subscribeToChapterChanges();
    this.loadLovData();
  }

  ngAfterViewInit(): void {
    this.setupHorizontalScrollDetection();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.filterSubscriptions.forEach(sub => sub.unsubscribe());
    this.overlayRef?.dispose();
    this.resizeObserver?.disconnect();
  }

  /* -------------------------------- CHAPTER CHANGE -------------------------------- */

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeSidePanel();
        this.clearAllFilters();
        this.searchText = '';
        this.searchBarComponent?.clearSearch();
        this.clearRetrieveCard();
        this.dataSource = [];
        this.isRetrieved = false;
        this.lastRetrievedValues = null;
        this.hasError = false;
        this.errorMessage = '';
        this.loadLovData();
      });
  }

  /* -------------------------------- CONFIG -------------------------------- */

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: '',
      subtitle: ''
    };

    this.searchConfig = {
      placeholder: 'Search by rack description',
      minLength: 2,
      ariaLabel: 'Search rack definitions',
      searchOnEnterOnly: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      sortConfig: {
        column: 'RackNumber',
        direction: 'A'
      },
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No rack definitions available to display',
      noDataIcon: 'edit',
      loadingMessage: 'Loading rack definition data...',
      showPagination: true,
      enableRowHighlight: false
    };
  }

  private getTableColumns(): TableColumn<RackDetailListDto>[] {
    return [
      { key: 'rackNumber', header: 'Rack Number', width: '120px' },
      { key: 'rackDescription', header: 'Rack Description', width: '180px' },
      { key: 'productType', header: 'Type', width: '100px' },
      { key: 'bloodTypeDescription', header: 'ABORh', width: '140px',
        valueFormatter: (v: any) => v || ''
      },
      { key: 'shelfCount', header: 'Shelf', width: '80px',
        valueFormatter: (v: any) => v !== null && v !== undefined ? String(v) : ''
      },
      { key: 'trayCount', header: 'Tray', width: '80px',
        valueFormatter: (v: any) => v !== null && v !== undefined ? String(v) : ''
      },
      { key: 'mixProduct', header: 'Multiple Product Types in Tray', width: '200px',
        valueFormatter: (v: any) => v === 'Y' ? 'Yes' : v === 'N' ? 'No' : ''
      },
      { key: 'mixAbo', header: 'Multiple ABO/Rh in Tray', width: '180px',
        valueFormatter: (v: any) => v === 'Y' ? 'Yes' : v === 'N' ? 'No' : ''
      },
      { key: 'effectiveDate', header: 'Effective Date', width: '140px',
        valueFormatter: (v: any) => formatTableDate(v)
      },
      { key: 'terminationDate', header: 'Termination Date', width: '140px',
        valueFormatter: (v: any) => formatTableDate(v)
      }
    ];
  }

  private getRowActions(): RowAction<RackDetailListDto>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit rack',
        ariaLabel: 'Edit rack definition',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  /* -------------------------------- LOV DATA -------------------------------- */

  private loadLovData(): void {
    this.isLoadingWarehouses = true;
    this.rackDefinitionService.getWarehouseLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => { this.warehouseOptions.set(res.data ?? []); this.isLoadingWarehouses = false; },
        error: () => { this.warehouseOptions.set([]); this.isLoadingWarehouses = false; }
      });

    this.isLoadingDeviceTypes = true;
    this.rackDefinitionService.getDeviceTypeLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => { this.deviceTypeOptions.set(res.data ?? []); this.isLoadingDeviceTypes = false; },
        error: () => { this.deviceTypeOptions.set([]); this.isLoadingDeviceTypes = false; }
      });

    this.isLoadingStorageTypes = true;
    this.rackDefinitionService.getStorageTypeLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => { this.storageTypeOptions.set(res.data ?? []); this.isLoadingStorageTypes = false; },
        error: () => { this.storageTypeOptions.set([]); this.isLoadingStorageTypes = false; }
      });
  }

  onWarehouseChange(): void {
    this.selectedDeviceNumber = null;
    this.deviceNumberOptions.set([]);
    this.updateDeviceNumberState();
  }

  onDeviceTypeChange(): void {
    this.selectedDeviceNumber = null;
    this.deviceNumberOptions.set([]);
    this.updateDeviceNumberState();
  }

  private updateDeviceNumberState(): void {
    if (this.selectedWarehouseId && this.selectedDeviceType) {
      this.isDeviceNumberDisabled = false;
      this.isLoadingDeviceNumbers = true;
      this.rackDefinitionService.getDeviceNumberLov(this.selectedWarehouseId, this.selectedDeviceType)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: res => { this.deviceNumberOptions.set(res.data ?? []); this.isLoadingDeviceNumbers = false; },
          error: () => { this.deviceNumberOptions.set([]); this.isLoadingDeviceNumbers = false; }
        });
    } else {
      this.isDeviceNumberDisabled = true;
    }
  }

  private onRetrieveFieldChange(): void {
  }

  get isRetrieveEnabled(): boolean {
    const allSelected = !!(this.selectedWarehouseId && this.selectedDeviceType &&
              this.selectedDeviceNumber && this.selectedStorageClass);
    if (!allSelected) return false;
    if (!this.lastRetrievedValues) return true;
    return this.selectedWarehouseId !== this.lastRetrievedValues.warehouseId
        || this.selectedDeviceType !== this.lastRetrievedValues.deviceType
        || this.selectedDeviceNumber !== this.lastRetrievedValues.deviceNumber
        || this.selectedStorageClass !== this.lastRetrievedValues.storageClass;
  }

  get isClearAllDisabled(): boolean {
    return !this.selectedWarehouseId && !this.selectedDeviceType &&
           !this.selectedDeviceNumber && !this.selectedStorageClass && !this.isRetrieved;
  }

  onRetrieve(): void {
    if (!this.isRetrieveEnabled) return;

    this.isRetrieved = true;
    this.lastRetrievedValues = {
      warehouseId: this.selectedWarehouseId!,
      deviceType: this.selectedDeviceType!,
      deviceNumber: this.selectedDeviceNumber!,
      storageClass: this.selectedStorageClass!
    };
    this.closeSidePanel();
    this.searchText = '';
    this.searchBarComponent?.clearSearch();
    this.appliedFilters = null;
    this.filterChips = [];
    this.tableConfig.pagination!.pageIndex = 0;
    this.tableConfig.sortConfig = { column: 'RackNumber', direction: 'A' };
    this.loadData();
  }

  onClearAll(): void {
    this.clearRetrieveCard();
    this.isRetrieved = false;
    this.lastRetrievedValues = null;
    this.dataSource = [];
    this.appliedFilters = null;
    this.filterChips = [];
    this.searchText = '';
    this.searchBarComponent?.clearSearch();
    this.closeSidePanel();
  }

  private clearRetrieveCard(): void {
    this.selectedWarehouseId = null;
    this.selectedDeviceType = null;
    this.selectedDeviceNumber = null;
    this.selectedStorageClass = null;
    this.deviceNumberOptions.set([]);
    this.isDeviceNumberDisabled = true;
    this.warehouseModel?.control.markAsPristine();
    this.warehouseModel?.control.markAsUntouched();
    this.deviceTypeModel?.control.markAsPristine();
    this.deviceTypeModel?.control.markAsUntouched();
    this.deviceNumberModel?.control.markAsPristine();
    this.deviceNumberModel?.control.markAsUntouched();
    this.storageClassModel?.control.markAsPristine();
    this.storageClassModel?.control.markAsUntouched();
  }

  /* -------------------------------- LOAD DATA -------------------------------- */

  loadData(): void {
    if (!this.isRetrieved) return;

    this.isLoading = true;
    this.hasError = false;

    const skip = (this.tableConfig.pagination?.pageIndex || 0) *
                 (this.tableConfig.pagination?.pageSize || 25);
    const take = this.tableConfig.pagination?.pageSize || 25;

    const sortDirection = this.tableConfig.sortConfig?.direction;
    const sortOrder = sortDirection === 'A' ? 'ASC' : sortDirection === 'D' ? 'DESC' : 'ASC';

    const queryDto: RackDetailQueryDto = {
      warehouseId: this.selectedWarehouseId!,
      deviceType: this.selectedDeviceType!,
      deviceNumber: this.selectedDeviceNumber!,
      storageClass: this.selectedStorageClass!,
      searchKeyword: this.searchText || null,
      sortColumn: this.tableConfig.sortConfig?.column || 'RackNumber',
      sortOrder,
      filterRackNumber: this.appliedFilters?.rackNumber || null,
      filterProductType: this.appliedFilters?.productType || null,
      filterEffectiveDateAfter: this.appliedFilters?.effectivePeriod === 'After' ? this.appliedFilters.effectiveDate : null,
      filterEffectiveDateBefore: this.appliedFilters?.effectivePeriod === 'Before' ? this.appliedFilters.effectiveDate : null,
      filterTermDateAfter: this.appliedFilters?.terminationPeriod === 'After' ? this.appliedFilters.terminationDate : null,
      filterTermDateBefore: this.appliedFilters?.terminationPeriod === 'Before' ? this.appliedFilters.terminationDate : null
    };

    this.rackDefinitionService
      .getRackDetails(take, skip, queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.dataSource = res.data;
          this.tableConfig.pagination!.totalRecords = res.totalRecords;
          this.isLoading = false;
          setTimeout(() => this.checkHorizontalScroll());
        },
        error: () => {
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage = 'Failed to load rack definition data.';
        }
      });
  }

  /* -------------------------------- EVENTS -------------------------------- */

  onSearch(searchText: string): void {
    this.searchText = searchText;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    this.tableConfig.pagination!.pageIndex = event.pageIndex;
    this.tableConfig.pagination!.pageSize = event.pageSize;
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<RackDetailListDto>): void {
    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  /* -------------------------------- FILTERS -------------------------------- */

  applyFilters(filters: RackDefinitionFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = RackDefinitionFilterChipsUtils.convertFiltersToChips(filters);
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  /* -------------------------------- SIDE PANEL -------------------------------- */

  createRecord(): void {
    this.sidePanelTrigger = document.activeElement as HTMLElement;
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    this.focusSidePanel();
  }

  editRecord(row: RackDetailListDto): void {
    this.sidePanelTrigger = document.activeElement as HTMLElement;
    this.sidePanelData = row;
    this.sidePanelMode = 'edit';
    this.sidePanelOpen = true;
    if (this.dataTableRef) this.dataTableRef.activeRow = row;
    this.focusSidePanel();
  }

  closeSidePanel(): void {
    const trigger = this.sidePanelTrigger;
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.sidePanelTrigger = null;
    if (this.dataTableRef) this.dataTableRef.activeRow = null;
    setTimeout(() => trigger?.focus());
  }

  private focusSidePanel(): void {
    setTimeout(() => {
      const panel = document.querySelector('.side-panel-container');
      const firstFocusable = panel?.querySelector('button, input, mat-select, [tabindex]') as HTMLElement;
      firstFocusable?.focus();
    });
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  get retrieveState() {
    return {
      warehouseId: this.selectedWarehouseId!,
      deviceType: this.selectedDeviceType!,
      deviceNumber: this.selectedDeviceNumber!,
      storageClass: this.selectedStorageClass!
    };
  }

  /* -------------------------------- FILTER PANEL -------------------------------- */

  openFilter(): void {
    if (this.isFilterOpen) return;

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

    const filterPortal = new ComponentPortal(RackDefinitionFilterPanel);
    const filterComponentRef = this.overlayRef.attach(filterPortal);

    filterComponentRef.instance.currentFilters = this.appliedFilters;
    filterComponentRef.instance.retrieveState = this.retrieveState;

    this.filterSubscriptions = [
      filterComponentRef.instance.apply.subscribe((filters: RackDefinitionFilterValue) => {
        this.applyFilters(filters);
        this.closeFilterPanel();
      }),
      filterComponentRef.instance.close.subscribe(() => {
        this.closeFilterPanel();
      }),
      this.overlayRef.backdropClick().subscribe(() => {
        this.closeFilterPanel();
      })
    ];

    this.isFilterOpen = true;

    setTimeout(() => {
      const panelEl = filterComponentRef.location.nativeElement;
      const firstFocusable = panelEl.querySelector('mat-select, input, button') as HTMLElement;
      firstFocusable?.focus();
    });
  }

  private closeFilterPanel(): void {
    this.filterSubscriptions.forEach(sub => sub.unsubscribe());
    this.filterSubscriptions = [];
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.isFilterOpen = false;
  }

  hasActiveFilters(): boolean {
    return this.filterChips.length > 0;
  }

  onRemoveFilterChip(chipKey: string): void {
    const updatedFilters =
      RackDefinitionFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);

    if (updatedFilters === null) {
      this.clearAllFilters();
    } else {
      this.applyFilters(updatedFilters);
    }
  }

  skipToTable(): void {
    const region = document.getElementById('rack-table-region');
    if (region) {
      region.setAttribute('tabindex', '-1');
      region.focus();
      region.removeAttribute('tabindex');
    }
  }

  /* -------------------------------- SCROLL DETECTION -------------------------------- */

  private setupHorizontalScrollDetection(): void {
    if (!this.tableWrapper) return;

    const el = this.tableWrapper.nativeElement;

    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => this.checkHorizontalScroll());
      this.resizeObserver.observe(el);

      const scrollWrapper = el.querySelector('.data-table-scroll-wrapper');
      if (scrollWrapper) {
        this.resizeObserver.observe(scrollWrapper);
      }
    });

    this.checkHorizontalScroll();
  }

  private checkHorizontalScroll(): void {
    if (!this.tableWrapper) return;

    const el = this.tableWrapper.nativeElement;
    const scrollWrapper = el.querySelector('.data-table-scroll-wrapper');
    const target = scrollWrapper || el;
    const hasScroll = target.scrollWidth > target.clientWidth;

    el.classList.toggle('has-horizontal-scroll', hasScroll);
  }

  /* -------------------------------- KEYBOARD SHORTCUTS -------------------------------- */

  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkHorizontalScroll();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'c' && this.isRetrieved) {
      event.preventDefault();
      this.createRecord();
    }

    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    if (event.altKey && event.key.toLowerCase() === 'f' && this.isRetrieved) {
      event.preventDefault();
      this.openFilter();
    }

    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.closeFilterPanel();
    }

    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
