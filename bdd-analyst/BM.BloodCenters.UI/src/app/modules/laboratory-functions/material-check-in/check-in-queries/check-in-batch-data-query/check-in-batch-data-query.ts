import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  HostListener,
  inject,
  ChangeDetectorRef,
  ElementRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Overlay, OverlayRef, OverlayModule, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
} from '@shared/interfaces/data-table.interface';
import { FilterChip, FilterChips } from '@shared/components/filter-chips/filter-chips';

import { CheckInBatchDataQueryApiService } from './services/check-in-batch-data-query-api.service';
import { CheckInBatchDataDto, CheckInBatchDataQueryRequest } from './models/check-in-batch-data-query.model';
import {
  CheckInBatchFilterValue,
  ProductTypeOption,
  CheckInUserOption,
} from '../../../material-check/check-maintenance-function/modify-check-in-batch-details/models/modify-check-in-batch.model';
import { CheckInBatchFilterPanel } from '../../../material-check/check-maintenance-function/modify-check-in-batch-details/filter-panel/check-in-batch-filter-panel';
import { CheckInBatchFilterChipsUtils } from '../../../material-check/check-maintenance-function/modify-check-in-batch-details/utils/filter-chips.utils';

@Component({
  selector: 'app-check-in-batch-data-query',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    OverlayModule,
    SearchBar,
    DataTable,
    FilterChips,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './check-in-batch-data-query.html',
  styleUrls: ['./check-in-batch-data-query.scss'],
})
export class CheckInBatchDataQueryComponent implements OnInit, OnDestroy {
  private readonly service = inject(CheckInBatchDataQueryApiService);
  private readonly overlay = inject(Overlay);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by batch ID',
    ariaLabel: 'Search by batch ID',
    minLength: 3,
    searchOnEnterOnly: false,
    debounceTime: 300,
    alwaysShowTooltip: false,
  };

  tableConfig: DataTableConfig<CheckInBatchDataDto> = {
    columns: [
      { key: 'batchId', header: 'Batch ID', width: '160px', sortable: true },
      { key: 'contractId', header: 'Contract', width: '140px' },
      { key: 'company', header: 'Description', width: '220px' },
      {
        key: 'minTemp',
        header: 'Minimum Temperature',
        width: '160px',
        valueFormatter: (value) => value != null ? `${value} C` : '',
      },
      {
        key: 'maxTemp',
        header: 'Maximum Temperature',
        width: '160px',
        valueFormatter: (value) => value != null ? `${value} C` : '',
      },
      { key: 'productType', header: 'Product Type', width: '200px' },
      { key: 'cartonCount', header: 'Carton Count', width: '120px' },
      { key: 'numberOfUnits', header: 'No. of Units', width: '120px' },
      { key: 'shippedDate', header: 'Shipped Date', width: '130px',
        valueFormatter: (value) => value ? String(value).toUpperCase() : '',
      },
      { key: 'receivedDate', header: 'Received Date', width: '130px',
        valueFormatter: (value) => value ? String(value).toUpperCase() : '',
      },
      {
        key: 'qcDate',
        header: 'QC Date',
        width: '130px',
        valueFormatter: (value) => value ? String(value).split(' ')[0].toUpperCase() : '',
      },
      {
        key: 'batchDate',
        header: 'Batch Date',
        width: '130px',
        valueFormatter: (value) => value ? String(value).split(' ')[0].toUpperCase() : '',
      },
      { key: 'checkinUserId', header: 'Check-In User Id', width: '140px' },
      { key: 'userName', header: 'User Name', width: '160px' },
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: {
      column: 'batchId',
      direction: 'default',
    },
    stickyHeader: true,
    showPagination: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter search criteria to view results',
    noDataIcon: 'search',
    loadingMessage: 'Loading check-in batches...',
  };

  dataSource: CheckInBatchDataDto[] = [];
  isLoading = false;
  searchKeyword = '';
  filterOverlayRef: OverlayRef | null = null;
  appliedFilters: CheckInBatchFilterValue | null = null;
  filterChips: FilterChip[] = [];
  isFilterOpen = false;
  hasSearched = false;

  private overlayClose$ = new Subject<void>();

  productTypeOptions: ProductTypeOption[] = [];
  checkInUserOptions: CheckInUserOption[] = [];

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.loadDropdownOptions();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayClose$.next();
    this.overlayClose$.complete();
    this.closeFilterPanel();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetFilters();
        this.loadDropdownOptions();
        this.loadData();
      });
  }

  private loadDropdownOptions(): void {
    this.service.getProductTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.productTypeOptions = types.map(pt => ({
            code: pt.productType,
            description: pt.productType + (pt.productDesc ? ' - ' + pt.productDesc : ''),
          }));
        },
        error: () => {
          this.productTypeOptions = [];
        },
      });
  }

  private updateDropdownOptionsFromData(data: CheckInBatchDataDto[]): void {
    const userMap = new Map<string, string>();
    data.forEach(d => {
      if (d.checkinUserId) {
        userMap.set(d.checkinUserId, d.userName ?? '');
      }
    });
    this.checkInUserOptions = [...userMap.entries()]
      .map(([userId, userName]) => ({ userId, userName }))
      .sort((a, b) => a.userId.localeCompare(b.userId));
  }

  loadData(): void {
    this.hasSearched = true;
    this.isLoading = true;

    const pageSize = this.tableConfig.pagination?.pageSize ?? 25;
    const pageIndex = this.tableConfig.pagination?.pageIndex ?? 0;

    const body: CheckInBatchDataQueryRequest = {};

    if (this.searchKeyword) {
      body.batchId = this.searchKeyword;
    }

    if (this.tableConfig.sortConfig?.column && this.tableConfig.sortConfig.direction !== 'default') {
      body.sortColumn = this.tableConfig.sortConfig.column;
      body.sortOrder = this.tableConfig.sortConfig.direction === 'A' ? 'ASC' : 'DESC';
    }

    if (this.appliedFilters) {
      if (this.appliedFilters.productType) body.productType = this.appliedFilters.productType;
      if (this.appliedFilters.checkInUserId) body.checkinUserId = this.appliedFilters.checkInUserId;

      if (this.appliedFilters.shippedDate && this.appliedFilters.shippedDatePeriod) {
        body.shippedDatePeriod = this.appliedFilters.shippedDatePeriod;
        body.shippedDate = DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.shippedDate) ?? undefined;
      }
      if (this.appliedFilters.receivedDate && this.appliedFilters.receivedDatePeriod) {
        body.receivedDatePeriod = this.appliedFilters.receivedDatePeriod;
        body.receivedDate = DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.receivedDate) ?? undefined;
      }
      if (this.appliedFilters.qcDate && this.appliedFilters.qcDatePeriod) {
        body.qcDatePeriod = this.appliedFilters.qcDatePeriod;
        body.qcDate = DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.qcDate) ?? undefined;
      }
      if (this.appliedFilters.batchDate && this.appliedFilters.batchDatePeriod) {
        body.batchDatePeriod = this.appliedFilters.batchDatePeriod;
        body.batchDate = DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.batchDate) ?? undefined;
      }
    }

    this.service
      .getCheckInBatchData(pageSize, pageIndex * pageSize, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.total;
          }
          this.tableConfig = { ...this.tableConfig };
          this.updateDropdownOptionsFromData(response.data);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.dataSource = [];
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = 0;
          }
          this.updateDropdownOptionsFromData([]);
          this.isLoading = false;
          this.snackbarService.showError('Failed to load check-in batch data');
          this.cdr.detectChanges();
        },
      });
  }

  onSearch(keyword: string): void {
    this.searchKeyword = keyword?.trim() || '';
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }
    this.loadData();
  }

  // ===================== FILTER PANEL =====================

  openFilterPanel(): void {
    if (this.filterOverlayRef) {
      this.closeFilterPanel();
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
          offsetY: 56,
        },
      ])
      .withPush(true);

    this.filterOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      panelClass: 'filter-overlay-panel',
    });

    const filterPortal = new ComponentPortal(CheckInBatchFilterPanel);
    const componentRef = this.filterOverlayRef.attach(filterPortal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.productTypeOptions = this.productTypeOptions;
    componentRef.instance.checkInUserOptions = this.checkInUserOptions;

    componentRef.instance.apply
      .pipe(takeUntil(this.overlayClose$))
      .subscribe((filters) => {
        this.applyFilters(filters);
        this.closeFilterPanel();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeFilterPanel();
      });

    this.filterOverlayRef
      .backdropClick()
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeFilterPanel();
      });
  }

  closeFilterPanel(): void {
    this.overlayClose$.next();
    if (this.filterOverlayRef) {
      this.filterOverlayRef.dispose();
      this.filterOverlayRef = null;
    }
    this.isFilterOpen = false;
  }

  get isFilterActive(): boolean {
    return this.isFilterOpen || this.hasActiveFilters();
  }

  hasActiveFilters(): boolean {
    return CheckInBatchFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  applyFilters(filters: CheckInBatchFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = CheckInBatchFilterChipsUtils.convertFiltersToChips(filters);
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = CheckInBatchFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips = CheckInBatchFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    this.loadData();
  }

  onClearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    this.loadData();
  }

  private resetFilters(): void {
    this.searchKeyword = '';
    this.appliedFilters = null;
    this.filterChips = [];
    this.hasSearched = false;
    this.dataSource = [];
    this.closeFilterPanel();
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
      this.tableConfig.pagination.totalRecords = 0;
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'f' && !this.isFilterActive) {
      event.preventDefault();
      this.openFilterPanel();
    }

    if (event.key === 'Escape' && this.isFilterOpen) {
      this.closeFilterPanel();
    }
  }
}
