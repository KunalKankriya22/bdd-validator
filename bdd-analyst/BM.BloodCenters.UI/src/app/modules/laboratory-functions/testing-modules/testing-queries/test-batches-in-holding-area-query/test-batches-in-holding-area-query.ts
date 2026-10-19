import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  computed,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoggingService } from '@shared/services/logging.service';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import { TestBatchesInHoldingAreaQueryService } from './test-batches-in-holding-area-query.service';
import {
  HoldingTestModel,
  HoldingTestQueryParams,
  HoldingTestGridFilter,
  ViewInterdictionModel,
} from './test-batches-in-holding-area-query.model';
import { HoldingAreaFilterPanel } from './holding-area-filter-panel/holding-area-filter-panel';
import { ViewInterdictionsPanel } from './view-interdictions-dialog/view-interdictions-dialog';

@Component({
  selector: 'app-test-batches-in-holding-area-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
    FilterChips,
    ViewInterdictionsPanel,
    UnitIdFieldComponent,
  ],
  providers: [],
  templateUrl: './test-batches-in-holding-area-query.html',
  styleUrls: ['./test-batches-in-holding-area-query.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestBatchesInHoldingAreaQueryComponent implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly apiService = inject(TestBatchesInHoldingAreaQueryService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly loggingService = inject(LoggingService);
  private readonly overlay = inject(Overlay);
  private readonly router = inject(Router);

  headerConfig = computed<PageHeaderConfig>(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    if (pageData) {
      return {
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: pageData.title, link: null },
        ],
        title: pageData.title,
        subtitle: pageData.subtitle || '',
      };
    }
    return {
      breadcrumbs: [{ label: 'Home', link: '/home' }],
      title: 'Test Batches in Holding Area Query',
      subtitle: 'View test batches waiting in the holding area before they move into the staging process.',
    };
  });

  searchForm!: FormGroup;
  dataSource: HoldingTestModel[] = [];
  isLoading = false;
  hasSearched = false;
  recordCount: number | null = null;
  creationDate: string | null = null;
  creationTime: string | null = null;

  validatedUnitId: string | null = null;

  testIds: string[] = [];
  batchIds: string[] = [];
  testIdSearchControl = new FormControl('');
  batchIdSearchControl = new FormControl('');
  filteredTestIds: string[] = [];
  filteredBatchIds: string[] = [];

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Test Batch ID or Unit ID',
    minLength: 3,
    ariaLabel: 'Search by Test Batch ID or Unit ID',
    searchOnEnterOnly: true,
  };

  tableConfig: DataTableConfig<HoldingTestModel> = {
    columns: [
      { key: 'tbId', header: 'Test Batch ID', sortable: true, width: '160px' },
      { key: 'unitId', header: 'Unit ID', sortable: true, width: '180px' },
      { key: 'testId', header: 'Test ID', sortable: true, width: '100px' },
      { key: 'absorbance', header: 'Absorbance', sortable: false, width: '120px', valueFormatter: (v) => v || '' },
      { key: 'ratio', header: 'Ratio', sortable: false, width: '100px', valueFormatter: (v) => v?.trim() || '' },
      { key: 'resultStatus', header: 'Result Value', sortable: false, width: '120px', valueFormatter: (v) => v || '' },
      {
        key: 'resultDate',
        header: 'Result Date',
        sortable: true,
        width: '160px',
        valueFormatter: (v: string) => {
          if (!v) return '';
          const m = moment(v);
          return m.isValid() ? m.format('MMDDYY HH:mm') : v;
        },
      },
      {
        key: 'holdingStatus',
        header: 'Status',
        sortable: false,
        width: '100px',
        valueFormatter: (v) => v ? 'Upload' : 'Pending',
      },
    ],
    rowActions: [
      { label: 'Place Interdictions', action: 'placeInterdictions', ariaLabel: 'Place Interdictions' },
      { label: 'Remove Interdictions', action: 'removeInterdictions', ariaLabel: 'Remove Interdictions' },
      { label: 'View Interdictions', action: 'viewInterdictions', ariaLabel: 'View Interdictions' },
    ],
    pagination: {
      pageSize: 10,
      totalRecords: 0,
      pageIndex: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: { column: 'tbId', direction: 'default' },
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Scan or enter a Unit ID to begin.',
    noDataIcon: 'search',
    stickyHeader: true,
    showActionsAsMenu: true,
    stickyActionsColumn: true,
    showPagination: true,
  };

  private requestState: HoldingTestQueryParams = {
    allOrPending: 'P',
    testId: null,
    tbId: null,
    unitId: null,
    searchText: null,
    sortColumn: 'TbId',
    sortOrder: 'DESC',
    take: 10,
    skip: 0,
  };

  // Filter panel state
  isFilterOpen = false;
  private overlayRef: OverlayRef | null = null;
  private filterPanelRef: HoldingAreaFilterPanel | null = null;
  appliedFilters: HoldingTestGridFilter | null = null;
  filterChips: FilterChip[] = [];
  filterOptions = {
    testIds: [] as string[],
    absorbanceValues: [] as string[],
    ratioValues: [] as string[],
    resultValues: [] as string[],
    statusValues: [] as string[],
  };

  private searchKeyword = '';

  // View Interdictions side panel state
  sidePanelOpen = false;
  interdictionsPanelData: ViewInterdictionModel[] = [];

  get isRetrieveDisabled(): boolean {
    if (this.isLoading) return true;
    const testId = this.searchForm?.get('testId')?.value;
    const tbId = this.searchForm?.get('tbId')?.value;
    const unitId = this.validatedUnitId;
    return !testId && !tbId && !unitId;
  }

  get isClearAllDisabled(): boolean {
    return !this.hasSearched && !this.searchForm?.dirty;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadDropdowns();
    this.setupSearchFilters();
    this.subscribeToChapterChanges();
    this.preloadMenuAccess();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private initializeForm(): void {
    this.searchForm = this.fb.group({
      allOrPending: ['P'],
      testId: [null],
      tbId: [null],
    });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadDropdowns();
      });
  }

  private setupSearchFilters(): void {
    this.testIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.filterTestIdOptions());

    this.batchIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.filterBatchIdOptions());

    this.searchForm.get('allOrPending')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchForm.patchValue({ testId: null, tbId: null }, { emitEvent: false });
        this.loadDropdowns();
      });

    this.searchForm.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchForm.patchValue({ tbId: null }, { emitEvent: false });
        this.loadBatchIds();
      });
  }

  private filterTestIdOptions(): void {
    const search = this.testIdSearchControl.value?.toLowerCase()?.trim() || '';
    this.filteredTestIds = search
      ? this.testIds.filter((id) => id.toLowerCase().includes(search))
      : this.testIds;
    this.cdr.markForCheck();
  }

  private filterBatchIdOptions(): void {
    const search = this.batchIdSearchControl.value?.toLowerCase()?.trim() || '';
    this.filteredBatchIds = search
      ? this.batchIds.filter((id) => id.toLowerCase().includes(search))
      : this.batchIds;
    this.cdr.markForCheck();
  }

  private loadDropdowns(): void {
    const allOrPending = this.searchForm?.get('allOrPending')?.value || 'P';

    forkJoin([
      this.apiService.getTestIds(allOrPending),
      this.apiService.getBatchIds(allOrPending),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([testIdsRes, batchIdsRes]) => {
          this.testIds = testIdsRes.data || [];
          this.batchIds = batchIdsRes.data || [];
          this.filteredTestIds = this.testIds;
          this.filteredBatchIds = this.batchIds;
          this.testIdSearchControl.setValue('', { emitEvent: false });
          this.batchIdSearchControl.setValue('', { emitEvent: false });
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.loggingService.error('Failed to load dropdown options', error);
          this.cdr.markForCheck();
        },
      });
  }

  private loadBatchIds(): void {
    const allOrPending = this.searchForm.get('allOrPending')?.value || 'P';
    const testId = this.searchForm.get('testId')?.value || null;
    this.apiService
      .getBatchIds(allOrPending, testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.batchIds = response.data || [];
          this.filteredBatchIds = this.batchIds;
          this.batchIdSearchControl.setValue('', { emitEvent: false });
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.loggingService.error('Failed to load batch IDs', error);
          this.cdr.markForCheck();
        },
      });
  }

  private preloadMenuAccess(): void {
    forkJoin([
      this.apiService.checkMenuAccess('CPINTER'),
      this.apiService.checkMenuAccess('CPIRINT'),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([placeRes, removeRes]) => {
          this.apiService.setCachedMenuAccess('CPINTER', placeRes.success === true);
          this.apiService.setCachedMenuAccess('CPIRINT', removeRes.success === true);
        },
        error: () => {},
      });
  }

  onUnitValidated(data: UnitValidationResponse): void {
    this.validatedUnitId = data.parsedUnitId;
    this.onRetrieve();
  }

  onUnitCleared(): void {
    this.validatedUnitId = null;
  }

  onRetrieve(): void {
    const testId = this.searchForm.get('testId')?.value || null;
    const tbId = this.searchForm.get('tbId')?.value || null;
    const unitId = this.validatedUnitId || null;

    if (!testId && !tbId && !unitId) {
      this.snackbarService.showError('At least one of Test ID, Test Batch ID, or Unit ID is required');
      return;
    }

    this.hasSearched = true;
    this.isLoading = true;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 10);
    const take = this.tableConfig.pagination?.pageSize || 10;

    this.requestState = {
      allOrPending: this.searchForm.get('allOrPending')?.value || 'P',
      testId,
      tbId,
      unitId,
      absorbance: this.appliedFilters?.absorbance || null,
      ratio: this.appliedFilters?.ratio || null,
      resultStatus: this.appliedFilters?.resultValue || null,
      holdingStatus: this.appliedFilters?.status || null,
      searchText: this.searchKeyword || null,
      sortColumn: this.mapColumnToApiField(this.tableConfig.sortConfig?.column || 'tbId'),
      sortOrder: this.tableConfig.sortConfig?.direction === 'A' ? 'ASC' : 'DESC',
      take,
      skip,
    };

    this.apiService
      .getHoldingTests(this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.dataSource = response.data || [];
            this.recordCount = response.total ?? 0;

            this.tableConfig = {
              ...this.tableConfig,
              pagination: {
                ...this.tableConfig.pagination!,
                totalRecords: response.total ?? 0,
              },
            };

            if (this.dataSource.length > 0 && this.dataSource[0].batchCreationDate) {
              const batchDate = moment(this.dataSource[0].batchCreationDate);
              if (batchDate.isValid()) {
                this.creationDate = batchDate.format('DD-MMM-YYYY').toUpperCase();
                this.creationTime = batchDate.format('HH:mm');
              }
            } else {
              this.creationDate = null;
              this.creationTime = null;
            }

            if (response.errorCode === '2306') {
              this.snackbarService.showInfo('No records found matching criteria');
            }
          } else {
            this.snackbarService.showError(response.message || 'Failed to retrieve data');
            this.dataSource = [];
            this.recordCount = 0;
            this.tableConfig = {
              ...this.tableConfig,
              pagination: {
                ...this.tableConfig.pagination!,
                totalRecords: 0,
              },
            };
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.loggingService.error('Failed to retrieve holding tests', error);
          const errorMessage = error?.error?.message || error?.message || 'Failed to retrieve data';
          this.snackbarService.showError(errorMessage);
          this.dataSource = [];
          this.recordCount = 0;
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: 0,
            },
          };
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  onClearAll(): void {
    this.searchForm.reset({
      allOrPending: 'P',
      testId: null,
      tbId: null,
    });
    this.validatedUnitId = null;
    this.unitIdField?.clear();

    this.dataSource = [];
    this.recordCount = null;
    this.creationDate = null;
    this.creationTime = null;
    this.hasSearched = false;
    this.searchKeyword = '';
    this.appliedFilters = null;
    this.filterChips = [];

    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0,
        totalRecords: 0,
      },
    };

    this.testIdSearchControl.setValue('', { emitEvent: false });
    this.batchIdSearchControl.setValue('', { emitEvent: false });

    this.cdr.markForCheck();
  }

  onPageChange(event: TablePageEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: event.pageIndex,
        pageSize: event.pageSize,
      },
    };
    this.onRetrieve();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: {
        column: event.column,
        direction: event.direction,
      },
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0,
      },
    };
    this.onRetrieve();
  }

  onSearch(searchText: string): void {
    this.searchKeyword = searchText || '';
    if (this.hasSearched) {
      this.tableConfig = {
        ...this.tableConfig,
        pagination: {
          ...this.tableConfig.pagination!,
          pageIndex: 0,
        },
      };
      this.onRetrieve();
    }
  }

  onRowAction(event: TableRowActionEvent<HoldingTestModel>): void {
    switch (event.action) {
      case 'viewInterdictions':
        this.openViewInterdictions(event.row);
        break;
      case 'placeInterdictions':
        this.handleInterdictionNavigation('CPINTER', event.row);
        break;
      case 'removeInterdictions':
        this.handleInterdictionNavigation('CPIRINT', event.row);
        break;
    }
  }

  private handleInterdictionNavigation(execName: string, row: HoldingTestModel): void {
    const cached = this.apiService.getCachedMenuAccess(execName);
    if (cached !== undefined) {
      if (cached) {
        this.navigateToInterdiction(execName, row);
      } else {
        this.snackbarService.showError('You do not have access to this function');
      }
      return;
    }

    this.apiService
      .checkMenuAccess(execName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const hasAccess = response.success === true;
          this.apiService.setCachedMenuAccess(execName, hasAccess);
          if (hasAccess) {
            this.navigateToInterdiction(execName, row);
          } else {
            this.snackbarService.showError(response.message || 'You do not have access to this function');
          }
        },
        error: () => {
          this.snackbarService.showError('Failed to check menu access');
        },
      });
  }

  private navigateToInterdiction(execName: string, row: HoldingTestModel): void {
    const routeKey = execName === 'CPINTER'
      ? RouteKey.EnterComponentInterdiction
      : RouteKey.ReleaseComponentInterdiction;

    const path = ROUTE_REGISTRY[routeKey]?.path;
    if (!path) {
      this.snackbarService.showError('Navigation route not configured');
      return;
    }

    this.router.navigate([path], {
      queryParams: {
        tbId: row.tbId,
        unitId: row.unitId,
        testId: row.testId,
      },
    });
  }

  private openViewInterdictions(row: HoldingTestModel): void {
    this.apiService
      .getInterdictions(row.tbId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.interdictionsPanelData = response.data || [];
          this.sidePanelOpen = true;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.loggingService.error('Failed to load interdictions', error);
          this.snackbarService.showError('Failed to load interdictions');
        },
      });
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.interdictionsPanelData = [];
    this.cdr.markForCheck();
  }

  // Filter panel
  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    this.loadFilterValues();

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterBtn)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 4,
        },
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    this.isFilterOpen = true;

    const portal = new ComponentPortal(HoldingAreaFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    this.filterPanelRef = componentRef.instance;
    this.filterPanelRef.currentFilters = this.appliedFilters;
    this.filterPanelRef.filterOptions = this.filterOptions;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters) => {
        this.applyFilters(filters);
        this.closeFilterPanel();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilterPanel());

    this.overlayRef
      .backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilterPanel());

    this.overlayRef
      .keydownEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event.key === 'Escape') {
          this.closeFilterPanel();
        }
      });
  }

  private loadFilterValues(): void {
    const params: Partial<HoldingTestQueryParams> = {
      allOrPending: this.searchForm.get('allOrPending')?.value || 'P',
      testId: this.searchForm.get('testId')?.value || null,
      tbId: this.searchForm.get('tbId')?.value || null,
      unitId: this.validatedUnitId || null,
    };

    this.apiService
      .getFilterValues(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const item = response.item;
          if (item) {
            this.filterOptions = {
              testIds: item.testIds || [],
              absorbanceValues: item.absorbances || [],
              ratioValues: item.ratios || [],
              resultValues: item.resultValues || [],
              statusValues: item.statuses || [],
            };
            if (this.filterPanelRef) {
              this.filterPanelRef.filterOptions = this.filterOptions;
            }
            this.cdr.markForCheck();
          }
        },
        error: (error) => {
          this.loggingService.error('Failed to load filter values', error);
        },
      });
  }

  private closeFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.filterPanelRef = null;
      this.isFilterOpen = false;
    }
  }

  private applyFilters(filters: HoldingTestGridFilter): void {
    this.appliedFilters = filters;
    this.filterChips = this.convertFiltersToChips(filters);
    this.resetPaginationToFirstPage();

    if (this.hasSearched) {
      this.onRetrieve();
    }
  }

  onRemoveFilterChip(chipKey: string): void {
    if (!this.appliedFilters) return;

    this.appliedFilters = {
      ...this.appliedFilters,
      [chipKey]: null,
    };

    this.filterChips = this.convertFiltersToChips(this.appliedFilters);
    this.resetPaginationToFirstPage();

    if (this.hasSearched) {
      this.onRetrieve();
    }
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.resetPaginationToFirstPage();

    if (this.hasSearched) {
      this.onRetrieve();
    }
  }

  private resetPaginationToFirstPage(): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0,
      },
    };
  }

  hasActiveFilters(): boolean {
    if (!this.appliedFilters) return false;
    return Object.values(this.appliedFilters).some((v) => v !== null);
  }

  private convertFiltersToChips(filters: HoldingTestGridFilter): FilterChip[] {
    const chips: FilterChip[] = [];
    const labelMap: Record<string, string> = {
      testId: 'Test ID',
      absorbance: 'Absorbance',
      ratio: 'Ratio',
      resultValue: 'Result Value',
      status: 'Status',
    };

    for (const [key, value] of Object.entries(filters)) {
      if (value !== null && value !== undefined) {
        const fieldLabel = labelMap[key] || key;
        chips.push({
          key,
          label: `${fieldLabel}: ${value}`,
          value: String(value),
          removable: true,
        });
      }
    }
    return chips;
  }

  private mapColumnToApiField(column: string): string {
    const mapping: Record<string, string> = {
      tbId: 'TbId',
      unitId: 'UnitId',
      testId: 'TestId',
      resultDate: 'ResultDate',
    };
    return mapping[column] || column;
  }
}
