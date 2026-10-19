import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  HostListener,
  ViewChild,
  ElementRef,
  effect,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { StorageDeviceService } from './services/storage-device.service';
import {
  StorageDeviceListDto,
  StorageDeviceQueryDto,
  StorageDeviceFilterValue,
  LovOption
} from './models/storage-device.model';

import { DataTable } from '@shared/components/data-table/data-table';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import {
  DataTableConfig,
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
import { StorageDeviceFilterChipsUtils } from './utils/filter-chips.utils';
import { StorageDeviceFilterPanel } from './storage-device-filter-panel/storage-device-filter-panel';
import { AddEditStorageDeviceComponent } from './add-edit-storage-device/add-edit-storage-device';

@Component({
  selector: 'app-storage-device-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditStorageDeviceComponent
  ],
  templateUrl: './storage-device-details.html',
  styleUrls: ['./storage-device-details.scss']
})
export class StorageDeviceDetailsComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild(DataTable) dataTableRef?: DataTable<StorageDeviceListDto>;
  @ViewChild('filterButton', { read: ElementRef }) filterButton!: ElementRef<HTMLElement>;

  headerConfig!: PageHeaderConfig;
  searchConfig!: SearchBarConfig;
  tableConfig!: DataTableConfig<StorageDeviceListDto>;

  appliedFilters: StorageDeviceFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: StorageDeviceListDto[] = [];
  isLoading = false;
  hasSearched = false;
  searchText = '';

  selectedWarehouse: string | null = null;
  warehouseTouched = false;

  warehouseOptions = signal<LovOption[]>([]);
  isLoadingWarehouses = false;

  readonly warehouseSearchControl = new FormControl('');
  readonly warehouseSearch = signal('');

  readonly filteredWarehouseOptions = computed(() => {
    const search = this.warehouseSearch().toLowerCase();
    const options = this.warehouseOptions();
    if (!search) return options;
    return options.filter(o =>
      o.code.toLowerCase().includes(search) || o.description.toLowerCase().includes(search)
    );
  });

  deviceTypeLovOptions = signal<LovOption[]>([]);
  deviceStatusLovOptions = signal<LovOption[]>([]);

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: StorageDeviceListDto | null = null;
  private sidePanelTrigger: HTMLElement | null = null;

  isFilterPanelOpen = false;
  private filterOverlayRef: OverlayRef | null = null;
  private overlayClose$ = new Subject<void>();

  private totalRecords = 0;
  private sortColumn = 'DeviceType';
  private sortOrder = 'ASC';
  private pageSize = 25;
  private pageIndex = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private storageDeviceService: StorageDeviceService,
    private overlay: Overlay,
    private headerService: HeaderService,
    private pageHeaderService: PageHeaderService
  ) {
    this.headerConfig = {
      breadcrumbs: [{ label: 'Home', link: '/home' }],
      title: '',
      subtitle: ''
    };

    effect(() => {
      const data = this.pageHeaderService.pageHeaderData();
      if (data) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: data.title, link: null }
          ],
          title: data.title,
          subtitle: data.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.initTableConfig();
    this.initSearchConfig();
    this.loadWarehouseLov();
    this.loadFormDropdowns();
    this.subscribeToChapterChanges();

    this.warehouseSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.warehouseSearch.set(value || ''));
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeFilterOverlay();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    if (event.altKey && event.key === 'c') {
      event.preventDefault();
      if (this.selectedWarehouse && !this.sidePanelOpen) {
        this.openAddPanel();
      }
    }
    if (event.altKey && event.key === 'f') {
      event.preventDefault();
      if (this.hasSearched && !this.isFilterPanelOpen) {
        this.openFilterPanel();
      }
    }
    if (event.key === 'Escape') {
      if (this.isFilterPanelOpen) {
        this.closeFilterOverlay();
      } else if (this.sidePanelOpen) {
        this.closeSidePanel();
      }
    }
  }

  private initTableConfig(): void {
    this.tableConfig = {
      columns: [
        { key: 'deviceType', header: 'Device Type', width: '90px' },
        { key: 'deviceDescription', header: 'Device Description', width: '180px', truncate: true },
        { key: 'deviceNumber', header: 'Number', width: '90px' },
        { key: 'deviceStatusDescription', header: 'Status Code', width: '120px' },
        { key: 'rackCount', header: 'Count', width: '80px' },
        { key: 'installDate', header: 'Commissioned Date', width: '140px',
          valueFormatter: (v: any) => v ? String(v).toUpperCase() : '' },
        { key: 'lastServiceDate', header: 'Last Serviced Date', width: '140px',
          valueFormatter: (v: any) => v ? String(v).toUpperCase() : '' },
        { key: 'nextServiceDate', header: 'Next Serviced Date', width: '140px',
          valueFormatter: (v: any) => v ? String(v).toUpperCase() : '' },
        { key: 'lastTemperature', header: 'Last Temperature (C)', width: '120px' },
        { key: 'tempReadDate', header: 'Last Reading Date', width: '140px',
          valueFormatter: (v: any) => v ? String(v).toUpperCase() : '' },
        { key: 'effectiveDate', header: 'Effective Date', width: '130px',
          valueFormatter: (v: any) => v ? String(v).toUpperCase() : '' },
        { key: 'terminationDate', header: 'Termination Date', width: '130px',
          valueFormatter: (v: any) => v ? String(v).toUpperCase() : '' },
        { key: 'lastModifiedDate', header: 'Last Modified Date', width: '170px',
          valueFormatter: (v: any) => v ? String(v).toUpperCase() : '' }
      ],
      rowActions: [
        { icon: 'edit', action: 'edit', visible: () => true }
      ],
      pagination: {
        pageSize: this.pageSize,
        pageIndex: this.pageIndex,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      showPagination: true,
      emptyMessage: 'No storage device records available to display',
      noDataIcon: 'edit',
      enableRowHighlight: false,
      showActionsAsMenu: false
    };
  }

  private initSearchConfig(): void {
    this.searchConfig = {
      placeholder: 'Search by device type or description',
      minLength: 1,
      searchOnEnterOnly: true,
      alwaysShowTooltip: true
    };
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.selectedWarehouse = null;
        this.warehouseTouched = false;
        this.hasSearched = false;
        this.dataSource = [];
        this.totalRecords = 0;
        this.searchText = '';
        this.appliedFilters = null;
        this.filterChips = [];
        this.pageIndex = 0;
        this.closeSidePanel();
        this.closeFilterOverlay();
        this.warehouseOptions.set([]);
        this.deviceTypeLovOptions.set([]);
        this.deviceStatusLovOptions.set([]);
        this.loadWarehouseLov();
        this.loadFormDropdowns();
      });
  }

  private loadWarehouseLov(): void {
    this.isLoadingWarehouses = true;
    this.storageDeviceService.getWarehouseLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.warehouseOptions.set(res.data ?? []);
          this.isLoadingWarehouses = false;
        },
        error: () => {
          this.warehouseOptions.set([]);
          this.isLoadingWarehouses = false;
        }
      });
  }

  private loadFormDropdowns(): void {
    this.storageDeviceService.getDeviceTypeLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.deviceTypeLovOptions.set(res.data ?? []),
        error: () => this.deviceTypeLovOptions.set([])
      });

    this.storageDeviceService.getDeviceStatusLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.deviceStatusLovOptions.set(res.data ?? []),
        error: () => this.deviceStatusLovOptions.set([])
      });
  }

  onWarehouseDropdownToggle(opened: boolean): void {
    if (!opened) {
      this.warehouseTouched = true;
    }
  }

  onWarehouseChange(warehouseId: string): void {
    this.selectedWarehouse = warehouseId;
    this.warehouseTouched = false;
    this.hasSearched = true;
    this.searchText = '';
    this.appliedFilters = null;
    this.filterChips = [];
    this.pageIndex = 0;
    this.sortColumn = 'DeviceType';
    this.sortOrder = 'ASC';
    this.closeSidePanel();
    this.loadData();
  }

  clearWarehouse(): void {
    this.selectedWarehouse = null;
    this.warehouseTouched = false;
    this.hasSearched = false;
    this.dataSource = [];
    this.totalRecords = 0;
    this.searchText = '';
    this.appliedFilters = null;
    this.filterChips = [];
    this.pageIndex = 0;
    this.closeSidePanel();
    this.closeFilterOverlay();
  }

  private loadData(): void {
    if (!this.selectedWarehouse) return;

    this.isLoading = true;
    const skip = this.pageIndex * this.pageSize;

    const queryDto: StorageDeviceQueryDto = {
      warehouseId: this.selectedWarehouse,
      searchKeyword: this.searchText || null,
      sortColumn: this.sortColumn,
      sortOrder: this.sortOrder,
      filterDeviceType: this.appliedFilters?.deviceType ?? null,
      filterStatusCode: this.appliedFilters?.statusCode ?? null,
      filterEffectiveDateAfter: this.appliedFilters?.effectivePeriod === 'After' ? this.appliedFilters.effectiveDate : null,
      filterEffectiveDateBefore: this.appliedFilters?.effectivePeriod === 'Before' ? this.appliedFilters.effectiveDate : null,
      filterTermDateAfter: this.appliedFilters?.terminationPeriod === 'After' ? this.appliedFilters.terminationDate : null,
      filterTermDateBefore: this.appliedFilters?.terminationPeriod === 'Before' ? this.appliedFilters.terminationDate : null
    };

    this.storageDeviceService.getStorageDevices(this.pageSize, skip, queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.dataSource = result.data;
          this.totalRecords = result.totalRecords;
          if (this.tableConfig.pagination) {
            this.tableConfig = {
              ...this.tableConfig,
              pagination: {
                ...this.tableConfig.pagination!,
                totalRecords: this.totalRecords,
                pageIndex: this.pageIndex,
                pageSize: this.pageSize
              }
            };
          }
          this.isLoading = false;
        },
        error: () => {
          this.dataSource = [];
          this.totalRecords = 0;
          this.isLoading = false;
        }
      });
  }

  onSearch(searchText: string): void {
    this.searchText = searchText?.trim() || '';
    this.pageIndex = 0;
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    // Sorting disabled — no-op
  }

  onPageChange(event: TablePageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<StorageDeviceListDto>): void {
    if (event.action === 'edit') {
      this.openEditPanel(event.row);
    }
  }

  openAddPanel(): void {
    this.sidePanelTrigger = document.activeElement as HTMLElement;
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    if (this.dataTableRef) this.dataTableRef.activeRow = null;
    setTimeout(() => {
      (document.querySelector('.panel-title') as HTMLElement)?.focus();
    });
  }

  openEditPanel(row: StorageDeviceListDto): void {
    this.sidePanelTrigger = document.activeElement as HTMLElement;
    this.sidePanelMode = 'edit';
    this.sidePanelData = row;
    this.sidePanelOpen = true;
    if (this.dataTableRef) this.dataTableRef.activeRow = row;
    setTimeout(() => {
      (document.querySelector('.panel-title') as HTMLElement)?.focus();
    });
  }

  closeSidePanel(): void {
    const trigger = this.sidePanelTrigger;
    this.sidePanelTrigger = null;
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    if (this.dataTableRef) this.dataTableRef.activeRow = null;
    setTimeout(() => trigger?.focus());
  }

  onSaveSuccess(event: { keepPanelOpen: boolean }): void {
    if (!event.keepPanelOpen) {
      this.closeSidePanel();
    }
    this.loadData();
  }

  openFilterPanel(): void {
    if (this.isFilterPanelOpen || !this.filterButton) return;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterButton)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 }
      ])
      .withFlexibleDimensions(true)
      .withPush(true);

    this.filterOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: 350,
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    const portal = new ComponentPortal(StorageDeviceFilterPanel);
    const componentRef = this.filterOverlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.warehouseId = this.selectedWarehouse!;

    componentRef.instance.apply
      .pipe(takeUntil(this.overlayClose$))
      .subscribe((filters: StorageDeviceFilterValue) => {
        this.appliedFilters = filters;
        this.filterChips = StorageDeviceFilterChipsUtils.convertFiltersToChips(filters);
        this.pageIndex = 0;
        this.closeFilterOverlay();
        this.loadData();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => this.closeFilterOverlay());

    this.filterOverlayRef.backdropClick()
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => this.closeFilterOverlay());

    this.isFilterPanelOpen = true;

    setTimeout(() => {
      const panel = this.filterOverlayRef?.overlayElement;
      const firstFocusable = panel?.querySelector<HTMLElement>('input, mat-select, button:not([disabled]), [tabindex]');
      firstFocusable?.focus();
    });
  }

  private closeFilterOverlay(): void {
    this.overlayClose$.next();
    if (this.filterOverlayRef) {
      this.filterOverlayRef.dispose();
      this.filterOverlayRef = null;
    }
    this.isFilterPanelOpen = false;
    this.filterButton?.nativeElement?.focus();
  }

  onRemoveChip(chipKey: string): void {
    this.appliedFilters = StorageDeviceFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips = StorageDeviceFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.pageIndex = 0;
    this.loadData();
  }

  onClearAllChips(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.pageIndex = 0;
    this.loadData();
  }
}
