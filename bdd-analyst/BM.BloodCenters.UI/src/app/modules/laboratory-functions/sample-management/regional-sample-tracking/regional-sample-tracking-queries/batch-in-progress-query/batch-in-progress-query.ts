import { Component, OnInit, OnDestroy, HostListener, signal, computed, effect, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';

import { BatchInProgressQueryApiService } from './services/batch-in-progress-query-api.service';
import { BatchInProgressStateService } from './services/batch-in-progress-state.service';
import {
  ContractDto,
  BatchLookupDto,
  BatchInProgressDto,
  BatchInProgressQueryDto,
  UnitInProgressDto,
  UnitTestResultDto,
} from './models/batch-in-progress-query.model';

// Dialog imports - Direct imports to avoid index.ts barrel export issues
import { SelectBatchesDialogComponent } from './dialogs/select-batches-dialog/select-batches-dialog.component';
import { ChapterFilterDialogComponent } from './dialogs/chapter-filter-dialog/chapter-filter-dialog.component';
import { UnscheduledHoldingTestsDialogComponent } from './dialogs/unscheduled-holding-tests-dialog/unscheduled-holding-tests-dialog.component';
import { UnitInterdictionsDialogComponent } from './dialogs/unit-interdictions-dialog/unit-interdictions-dialog.component';

// Utils
import {
  BatchInProgressFilterChipsUtils,
  ChapterFilterChip,
  BatchFilterChip
} from './utils/filter-chips.utils';

// Type aliases for clarity
type BatchRow = BatchInProgressDto;
type UnitRow = UnitInProgressDto;

@Component({
  selector: 'app-batch-in-progress-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatChipsModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    FilterChips,
    DataTable,
    SelectBatchesDialogComponent,
    ChapterFilterDialogComponent,
    UnscheduledHoldingTestsDialogComponent,
    UnitInterdictionsDialogComponent,
  ],
  templateUrl: './batch-in-progress-query.html',
  styleUrl: './batch-in-progress-query.scss',
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class BatchInProgressQueryComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `batch-in-progress-query-${BatchInProgressQueryComponent.nextId++}`;

  // Expose utils class for template usage
  protected readonly BatchInProgressFilterChipsUtils = BatchInProgressFilterChipsUtils;

  // API Service
  private readonly apiService = inject(BatchInProgressQueryApiService);
  private readonly stateService = inject(BatchInProgressStateService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  // Track intervals/timeouts for cleanup
  private chapterFilterInterval: ReturnType<typeof setInterval> | null = null;
  private chapterFilterTimeout: ReturnType<typeof setTimeout> | null = null;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || 'Review unreconciled, non-QC\'d check-in batches and filter details to show all units or exceptions only.',
        };
      }
    });
  }

  filterForm: FormGroup = this.fb.group({
    contractId: ['', Validators.required],
    queryMode: ['ALL'],
    includeUnitsWithoutResults: [false], // Default to false to match Oracle Forms behavior
    chapterIdFilter: [''],
    batchIdFilter: [''],
  });

  // Contract options loaded from API
  contractOptions = signal<ContractDto[]>([]);

  // Selected filters
  selectedChapterFilters = signal<ChapterFilterChip[]>([]);
  selectedBatchFilters = signal<BatchFilterChip[]>([]);

  // Computed filter chips for display
  filterChips = computed(() =>
    BatchInProgressFilterChipsUtils.convertAllFiltersToChips(
      this.selectedChapterFilters(),
      this.selectedBatchFilters()
    )
  );

  // Computed arrays for dialog preselection
  preselectedChapterIds = computed(() =>
    this.selectedChapterFilters().map(f => f.unitId)
  );

  preselectedBatchIds = computed(() =>
    this.selectedBatchFilters().map(f => f.batchId)
  );

  // Summary stats - Start with 0, populate after RETRIEVE
  totalBatches = signal(0);
  totalUnits = signal(0);
  unitsWithoutResults = signal(0);

  // Search controls
  contractSearchCtrl = new FormControl('');
  contractSearch = signal('');

  filteredContracts = computed(() =>
    this.filterContractOptions(this.contractOptions(), this.contractSearch()),
  );

  // Track selected contract ID separately for reactivity
  selectedContractId = signal<string | null>(null);

  // Selected contract info
  selectedContractInfo = computed(() => {
    const contractId = this.selectedContractId();
    if (!contractId) return null;
    return this.contractOptions().find(c => c.contractId === contractId);
  });

  // Loading states
  isLoadingContracts = signal(false);
  isLoadingSearch = signal(false);
  private pendingContractId: string | null = null;

  // Batch data and selection
  batches = signal<BatchRow[]>([]);
  selectedBatch = signal<BatchRow | null>(null);
  selectedUnit = signal<UnitRow | null>(null);
  hasSearched = signal(false);

  // FMB SET_TEST_RESULTS_BTN: disable when batch chapter differs from login chapter
  isCrossChapterNavDisabled = computed(() => {
    if (!this.selectedUnit()) return true;
    const batchChapter = this.selectedBatch()?.chapterId?.trim();
    const loginChapter = this.headerService.chapterId()?.trim();
    if (!batchChapter || !loginChapter) return true;
    return batchChapter !== loginChapter;
  });

  /** Get appropriate aria-label for Test Results Query button based on disabled state */
  getTestResultsQueryAriaLabel(): string {
    if (!this.selectedUnit()) {
      return 'Test Results Query - disabled because no unit is selected';
    }
    if (this.isCrossChapterNavDisabled()) {
      return 'Test Results Query - disabled because batch chapter differs from login chapter';
    }
    return 'Navigate to Test Results Query for selected unit';
  }

  /** Get appropriate tooltip for Test Results Query button based on disabled state */
  getTestResultsQueryTooltip(): string {
    if (!this.selectedUnit()) {
      return 'Select a unit to enable Test Results Query';
    }
    if (this.isCrossChapterNavDisabled()) {
      return 'Cannot navigate - batch chapter differs from login chapter';
    }
    return '';
  }

  /** Get appropriate aria-label for Samples Query button based on disabled state */
  getSamplesQueryAriaLabel(): string {
    if (!this.selectedUnit()) {
      return 'Samples Query - disabled because no unit is selected';
    }
    if (this.isCrossChapterNavDisabled()) {
      return 'Samples Query - disabled because batch chapter differs from login chapter';
    }
    return 'Navigate to Samples Query for selected unit';
  }

  /** Get appropriate tooltip for Samples Query button based on disabled state */
  getSamplesQueryTooltip(): string {
    if (!this.selectedUnit()) {
      return 'Select a unit to enable Samples Query';
    }
    if (this.isCrossChapterNavDisabled()) {
      return 'Cannot navigate - batch chapter differs from login chapter';
    }
    return '';
  }

  // Computed totals for 3-section layout
  totalUnscheduledTests = computed(() =>
    this.batches().reduce((sum, batch) => sum + (batch.unitsCount || 0), 0)
  );
  totalHoldingTests = computed(() =>
    this.batches().reduce((sum, batch) => sum + (batch.unitsCount || 0), 0)
  );

  // Pagination
  totalRecords = 20;
  pageSize = 10;
  pageIndex = 0;

  // Side panel states
  chapterFilterPanelOpen = false;
  batchFilterPanelOpen = false;
  unscheduledHoldingTestsPanelOpen = false;
  unitInterdictionsPanelOpen = false;
  selectedContractForBatchFilter: string | null = null;

  // Sort state for batch search
  private currentSortColumn: string | null = null;
  private currentSortOrder: 'ASC' | 'DESC' = 'ASC';

  // DataTable configurations for 3-section layout
  batchesTableConfig = signal<DataTableConfig>({
    columns: [
      { key: 'batchId', header: 'Batch ID', sortable: true, width: '150px' },
      { key: 'chapterId', header: 'Chapter ID', sortable: false, width: '100px' },
      { key: 'receivedDate', header: 'Received Date', sortable: false, width: '130px', valueFormatter: (val: string) => this.formatDate(val) },
      { key: 'age', header: 'Age', sortable: false, width: '80px' },
      { key: 'collectionDate', header: 'Collection Date', sortable: false, width: '130px', valueFormatter: (val: string) => this.formatDate(val) },
    ],
    showPagination: false,
    stickyHeader: true,
    enableSelection: false,
    enableRowHighlight: true,
  });

  unitsTableConfig = signal<DataTableConfig>({
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: false, width: '200px' },
      { key: 'skipReason', header: 'Skip Reason', sortable: false },
    ],
    showPagination: false,
    stickyHeader: true,
    enableSelection: false,
    enableRowHighlight: true,
    hideHeader: false,
  });

  getUnitsTableConfigWithCount(): DataTableConfig {
    const count = this.selectedBatch()?.units.length || 0;
    return {
      ...this.unitsTableConfig(),
      columns: [
        { key: 'unitId', header: `Unit ID (${count})`, sortable: false, width: '200px' },
        { key: 'skipReason', header: 'Skip Reason', sortable: false },
      ],
    };
  }

  resultsTableConfig = signal<DataTableConfig>({
    columns: [
      { key: 'testSeqNo', header: 'Seq', sortable: false, width: '80px' },
      { key: 'testId', header: 'Test ID', sortable: false, width: '120px' },
      { key: 'resultStatus', header: 'Result', sortable: false, width: '100px' },
      { key: 'resultDesc', header: 'Result Description', sortable: false, width: '150px' },
      { key: 'interimResult', header: 'Interim Result', sortable: false, width: '120px' },
    ],
    showPagination: false,
    stickyHeader: true,
    enableSelection: false,
    enableRowHighlight: false,
    hideHeader: false,
  });

  ngOnInit(): void {

    this.setupFormListeners();
    this.subscribeToChapterChanges();

    // Load contracts (lightweight, fast)
    this.loadContracts();

    // Auto-select current chapter filter
    this.initializeCurrentChapterFilter();

    // Check if we're navigating back (user clicked back button)
    const savedState = this.stateService.getPageState();
    const isNavigatingBack = this.stateService.isNavigatingBack();
    const hasRecentState = savedState && this.stateService.isStateRecent(savedState, 5);


    // ONLY restore state if user navigated away and is now returning
    if (isNavigatingBack && hasRecentState) {
      this.stateService.clearNavigationFlag(); // Clear flag after detecting
      this.restorePageStateWhenReady();
    } else {
      // Fresh page load (direct navigation) - DON'T restore state
      this.applyQueryParams();

      // Clear old state if it exists (but don't clear if we just saved it!)
      // Only clear if navigating back flag is NOT set
      if (savedState && !isNavigatingBack) {
        this.stateService.clearPageState();
      }

      // Ensure loading states are cleared for fresh load
      setTimeout(() => {
        this.isLoadingContracts.set(false);
        this.isLoadingSearch.set(false);
      }, 100);
    }
  }

  ngOnDestroy(): void {
    // Clean up intervals/timeouts to prevent memory leaks
    if (this.chapterFilterInterval) {
      clearInterval(this.chapterFilterInterval);
    }
    if (this.chapterFilterTimeout) {
      clearTimeout(this.chapterFilterTimeout);
    }

    // State is now saved synchronously in navigation methods (savePageState)
    // No need for async save here - already handled before navigation
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle Escape key to close panels - WCAG 2.1.2 No Keyboard Trap
   */
  @HostListener('keydown.escape')
  onEscapeKey(): void {
    if (this.chapterFilterPanelOpen) {
      this.closeChapterFilterPanel();
    } else if (this.batchFilterPanelOpen) {
      this.closeBatchFilterPanel();
    } else if (this.unscheduledHoldingTestsPanelOpen) {
      this.closeUnscheduledHoldingTestsPanel();
    } else if (this.unitInterdictionsPanelOpen) {
      this.closeUnitInterdictionsPanel();
    }
  }

  /**
   * Announce message to screen readers via ARIA live region
   * WCAG 4.1.3 Status Messages
   * Uses Angular CDK LiveAnnouncer for proper screen reader support
   */
  private announceToScreenReader(message: string): void {
    this.liveAnnouncer.announce(message, 'polite');
  }

  onRetrieve(): void {
    if (this.isLoadingSearch()) {
      return;
    }

    this.filterForm.markAllAsTouched();
    if (this.filterForm.invalid) {
      return;
    }
    this.hasSearched.set(true);
    this.searchBatches();
  }

  onClearAll(): void {
    this.filterForm.reset({
      contractId: '',
      queryMode: 'ALL',
      includeUnitsWithoutResults: true,
      chapterIdFilter: '',
      batchIdFilter: '',
    });
    this.selectedChapterFilters.set([]);
    this.selectedBatchFilters.set([]);
    this.batches.set([]);
    this.selectedBatch.set(null);
    this.selectedUnit.set(null);
    this.hasSearched.set(false);
    this.totalBatches.set(0);
    this.totalUnits.set(0);
    this.unitsWithoutResults.set(0);
    this.currentSortColumn = null;
    this.currentSortOrder = 'ASC';
    this.batchesTableConfig.update(config => ({
      ...config,
      sortConfig: undefined,
    }));
  }

  onFilterChapters(): void {
    this.chapterFilterPanelOpen = true;
    this.cdr.detectChanges();

    // WCAG 2.4.3 Focus Order - Move focus to panel when it opens
    setTimeout(() => {
      const panel = document.querySelector('.side-panel--chapter-filter');
      const closeButton = panel?.querySelector('button[aria-label*="Close"]') as HTMLElement;
      closeButton?.focus();
    }, 100);
  }

  closeChapterFilterPanel(): void {
    this.chapterFilterPanelOpen = false;
    this.cdr.detectChanges();
  }

  onChapterFilterApply(selectedChapters: any[]): void {
    if (selectedChapters && selectedChapters.length > 0) {
      const filters = selectedChapters.map((chapter: any) =>
        BatchInProgressFilterChipsUtils.createChapterFilterChip(
          chapter.chapterId,
          chapter.chapterName
        )
      );
      this.selectedChapterFilters.set(filters);
    }
    this.closeChapterFilterPanel();
  }

  onFilterBatches(): void {
    const contractId = this.filterForm.get('contractId')?.value;
    if (!contractId) {
      this.snackbarService.showInfo('Please select a contract first');
      return;
    }

    this.selectedContractForBatchFilter = contractId;
    this.batchFilterPanelOpen = true;
    this.cdr.detectChanges();

    // WCAG 2.4.3 Focus Order - Move focus to panel when it opens
    setTimeout(() => {
      const panel = document.querySelector('.side-panel--batch-filter');
      const searchInput = panel?.querySelector('input') as HTMLElement;
      searchInput?.focus();
    }, 100);
  }

  closeBatchFilterPanel(): void {
    this.batchFilterPanelOpen = false;
    this.selectedContractForBatchFilter = null;
    this.cdr.detectChanges();
  }

  onBatchFilterApply(selectedBatches: any[]): void {
    if (selectedBatches && selectedBatches.length > 0) {
      const filters = selectedBatches.map((batch: any) =>
        BatchInProgressFilterChipsUtils.createBatchFilterChip(
          batch.batchId,
          batch.chapterId
        )
      );
      this.selectedBatchFilters.set(filters);
    }
    this.closeBatchFilterPanel();
  }

  /**
   * Remove a filter chip by its key
   */
  onRemoveFilterChip(chipKey: string): void {
    const result = BatchInProgressFilterChipsUtils.removeFilterByChipKey(
      this.selectedChapterFilters(),
      this.selectedBatchFilters(),
      chipKey
    );

    this.selectedChapterFilters.set(result.chapterFilters);
    this.selectedBatchFilters.set(result.batchFilters);
  }

  /**
   * Clear all filters (both chapter and batch)
   */
  onClearAllFilters(): void {
    const result = BatchInProgressFilterChipsUtils.clearAllFilters();
    this.selectedChapterFilters.set(result.chapterFilters);
    this.selectedBatchFilters.set(result.batchFilters);
  }

  /**
   * Remove a single chapter filter
   */
  removeChapterFilter(filter: ChapterFilterChip): void {
    const current = this.selectedChapterFilters();
    this.selectedChapterFilters.set(current.filter(f => f.unitId !== filter.unitId));
  }

  /**
   * Remove a single batch filter
   */
  removeBatchFilter(filter: BatchFilterChip): void {
    const current = this.selectedBatchFilters();
    this.selectedBatchFilters.set(current.filter(f => f.batchId !== filter.batchId));
  }

  /**
   * Clear all chapter filters
   */
  clearAllChapterFilters(): void {
    this.selectedChapterFilters.set([]);
  }

  /**
   * Clear all batch filters
   */
  clearAllBatchFilters(): void {
    this.selectedBatchFilters.set([]);
  }

  /**
   * Handle batch row click in section 1
   * Loads units for selected batch into section 2
   */
  onBatchRowClick(batch: BatchRow): void {
    this.selectedBatch.set(batch);
    this.selectedUnit.set(null); // Clear unit selection when batch changes

    // WCAG 4.1.3 Status Messages - Announce selection to screen readers
    this.announceToScreenReader(`Batch ${batch.batchId} selected. ${batch.units?.length || 0} units available.`);
  }

  onBatchSortChange(event: TableSortEvent): void {
    if (event.column === 'batchId') {
      const sortColumnMap: Record<string, string> = { batchId: 'BatchId' };
      if (event.direction === 'default') {
        this.currentSortColumn = null;
        this.currentSortOrder = 'ASC';
      } else {
        this.currentSortColumn = sortColumnMap[event.column] || null;
        this.currentSortOrder = event.direction === 'A' ? 'ASC' : 'DESC';
      }

      this.batchesTableConfig.update(config => ({
        ...config,
        sortConfig: {
          column: event.column,
          direction: event.direction,
        },
      }));

      if (this.hasSearched()) {
        this.searchBatches();
      }
    }
  }

  onUnitsSortChange(event: TableSortEvent): void {
    if (event.column === 'skipReason') {
      const batch = this.selectedBatch();
      if (!batch) return;

      const sorted = [...batch.units];
      if (event.direction === 'default') {
        sorted.sort((a, b) => a.unitId.localeCompare(b.unitId));
      } else {
        const dir = event.direction === 'A' ? 1 : -1;
        sorted.sort((a, b) => {
          const aVal = a.skipReason || '';
          const bVal = b.skipReason || '';
          return aVal.localeCompare(bVal) * dir;
        });
      }

      this.selectedBatch.set({ ...batch, units: sorted });
    }
  }

  /**
   * Handle unit row click in section 2
   * Loads test results for selected unit into section 3
   */
  onUnitRowClick(unit: UnitRow): void {
    this.selectedUnit.set(unit);

    // WCAG 4.1.3 Status Messages - Announce selection to screen readers
    const testCount = unit.testResults?.length || 0;
    this.announceToScreenReader(`Unit ${unit.unitId} selected. ${testCount} test results available.`);
  }

  /**
   * Get unscheduled test count for a batch
   */
  getUnscheduledCountForBatch(batch: BatchRow): number {
    return batch.units.reduce((sum, unit) => sum + (unit.testBaseCount || 0), 0);
  }

  /**
   * Get holding test count for a batch
   */
  getHoldingCountForBatch(batch: BatchRow): number {
    return batch.units.reduce((sum, unit) => sum + (unit.holdingTestCount || 0), 0);
  }

  /**
   * Get test results for a unit (combines testResults from UnitTestResultDto)
   */
  getTestResultsForUnit(unit: UnitRow): any[] {
    if (!unit.testResults || unit.testResults.length === 0) {
      return [];
    }

    return unit.testResults.map(result => ({
      skipReason: unit.skipReason || '',
      testSeqNo: result.testSeqNo,
      testId: result.testId,
      resultStatus: result.resultStatus,
      resultDesc: result.resultDesc,
      interimResult: result.interimResult,
    }));
  }

  hasAnyFieldValue(): boolean {
    const values = this.filterForm.value;
    return !!(values.contractId || this.selectedChapterFilters().length > 0 || this.selectedBatchFilters().length > 0);
  }

  get f() {
    return this.filterForm.controls;
  }

  private setupFormListeners(): void {
    this.contractSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.contractSearch.set(v || ''));

    // Update selected contract ID signal when form value changes
    this.filterForm.get('contractId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(contractId => {
        this.selectedContractId.set(contractId || null);

        // Save contract context to state service when selected
        if (contractId) {
          const contractInfo = this.contractOptions().find(c => c.contractId === contractId);
          this.stateService.setSelectedContract({
            contractId,
            contractName: contractInfo?.company || null,
            timestamp: Date.now(),
          });
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.initializeCurrentChapterFilter(); // Re-initialize chapter filter when chapter changes
      });
  }

  private initializeCurrentChapterFilter(): void {
    const currentChapterId = this.headerService.chapterId();
    const currentChapterName = this.headerService.chapterName();

    if (currentChapterId) {
      this.applyChapterFilter(currentChapterId, currentChapterName);
      return;
    }

    // Header signal may not be populated yet — wait for it
    this.chapterFilterInterval = setInterval(() => {
      const id = this.headerService.chapterId();
      if (id) {
        if (this.chapterFilterInterval) clearInterval(this.chapterFilterInterval);
        if (this.chapterFilterTimeout) clearTimeout(this.chapterFilterTimeout);
        this.chapterFilterInterval = null;
        this.chapterFilterTimeout = null;
        this.applyChapterFilter(id, this.headerService.chapterName());
      }
    }, 100);

    // Stop polling after 3 seconds
    this.chapterFilterTimeout = setTimeout(() => {
      if (this.chapterFilterInterval) {
        clearInterval(this.chapterFilterInterval);
        this.chapterFilterInterval = null;
      }
      this.chapterFilterTimeout = null;
    }, 3000);
  }

  private applyChapterFilter(chapterId: string, chapterName: string): void {
    const alreadyFiltered = this.selectedChapterFilters().some(
      filter => filter.unitId === chapterId
    );
    if (alreadyFiltered) return;

    const name = chapterName || chapterId;
    const currentChapterFilter = BatchInProgressFilterChipsUtils.createChapterFilterChip(
      chapterId,
      name
    );
    this.selectedChapterFilters.set([currentChapterFilter]);
  }

  private loadContracts(): void {
    this.isLoadingContracts.set(true);
    this.apiService.getContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.contractOptions.set(response.data);
            this.applyPendingContract();
          } else {
            this.snackbarService.showError(response.message || 'Failed to load contracts');
          }
          this.isLoadingContracts.set(false);

          // Safety: Ensure search loading is also cleared (in case it got stuck)
          setTimeout(() => {
            if (this.isLoadingSearch()) {
              this.isLoadingSearch.set(false);
            }
          }, 500);
        },
        error: (error) => {
          const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Failed to load contracts');

          // Only show error if it's not a navigation-related error
          if (error.status !== 0) {
            this.snackbarService.showError(errorMessage);
          }

          this.isLoadingContracts.set(false);

          // Safety: Clear search loading on error too
          this.isLoadingSearch.set(false);
        }
      });
  }

  private applyQueryParams(): void {
    const contractId = this.route.snapshot.queryParamMap.get('contractId');
    if (contractId) {
      this.pendingContractId = contractId;
    }
  }

  private applyPendingContract(): void {
    if (!this.pendingContractId) return;
    const match = this.contractOptions().find(c => c.contractId === this.pendingContractId);
    if (match) {
      this.filterForm.patchValue({ contractId: match.contractId });
      this.pendingContractId = null;

      // Ensure loading state is clear before auto-retrieval
      this.isLoadingSearch.set(false);
      this.onRetrieve();
    }
    this.pendingContractId = null;
  }

  /**
   * Search for batches based on filters
   * @param onComplete - Optional callback to execute after search completes successfully
   */
  private searchBatches(onComplete?: () => void): void {
    // Guard: Prevent multiple simultaneous searches
    if (this.isLoadingSearch()) {
      return;
    }

    const formValue = this.filterForm.value;

    const queryDto: BatchInProgressQueryDto = {
      contractId: formValue.contractId!,
      queryMode: formValue.queryMode === 'ALL' ? 'A' : 'E',
      includeNoTestResults: formValue.includeUnitsWithoutResults ? 'Y' : 'N',
      take: 100, // Default page size
      skip: 0,
      sortColumn: this.currentSortColumn,
      sortOrder: this.currentSortOrder,
    };

    // Add chapter filters if selected
    // NOTE: Backend doesn't support arrays yet, sending as comma-separated string
    const selectedChapters = this.selectedChapterFilters();
    if (selectedChapters.length > 0) {
      queryDto.chapterId = selectedChapters.map(f => f.unitId).join(',');
      // Sends: "0001,0002,0003" - backend can parse with split(',')
    }

    // Add batch filter if selected
    // NOTE: Backend doesn't support arrays yet, sending as comma-separated string
    const selectedBatches = this.selectedBatchFilters();
    if (selectedBatches.length > 0) {
      queryDto.batchId = selectedBatches.map(f => f.batchId).join(',');
      // Sends: "BATCH001,BATCH002,BATCH003" - backend can parse with split(',')
    }

    this.isLoadingSearch.set(true);

    // Safety timeout: Force clear loading after 30 seconds if request hangs
    const loadingTimeout = setTimeout(() => {
      if (this.isLoadingSearch()) {
        this.isLoadingSearch.set(false);
        this.snackbarService.showError('Request timed out. Please try again.');
      }
    }, 30000);

    this.apiService.searchBatches(queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          clearTimeout(loadingTimeout);
          this.isLoadingSearch.set(false);

          if (response.success && response.data) {
            this.batches.set(response.data);
            this.totalBatches.set(response.totalCount || response.data.length);

            const allUnits = response.data.flatMap(batch => batch.units || []);
            this.totalUnits.set(allUnits.length);

            const withoutResults = allUnits.filter(unit =>
              !unit.testResults?.length || unit.testResults.every(tr => tr.resultStatus == null)
            ).length;
            this.unitsWithoutResults.set(withoutResults);

            // Execute callback after successful data load
            if (onComplete) {
              onComplete();
            }
          } else {
            this.snackbarService.showError(response.message || 'Failed to load batches');
            this.batches.set([]);
          }
        },
        error: (error) => {
          clearTimeout(loadingTimeout);
          this.isLoadingSearch.set(false);
          this.snackbarService.showError(HttpErrorHandler.extractErrorMessage(error, 'An error occurred'));
          this.batches.set([]);
        }
      });
  }


  private filterContractOptions(options: ContractDto[], search: string): ContractDto[] {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(
      o =>
        o.contractId?.toLowerCase().includes(q) || o.company?.toLowerCase().includes(q),
    );
  }

  // Action buttons - Bottom navigation buttons

  /**
   * Opens Unscheduled/Holding Tests panel for selected unit
   * Shows tests that are unscheduled or on hold status
   */
  onUnscheduledHoldingTests(): void {
    const unit = this.selectedUnit();
    if (!unit) {
      this.snackbarService.showInfo('Please select a unit first');
      return;
    }

    this.unscheduledHoldingTestsPanelOpen = true;
    this.cdr.detectChanges();

    // WCAG 2.4.3 Focus Order - Move focus to panel when it opens
    setTimeout(() => {
      const panel = document.querySelector('.side-panel--unscheduled-tests');
      const closeButton = panel?.querySelector('button[aria-label*="Close"]') as HTMLElement;
      closeButton?.focus();
    }, 100);
  }

  closeUnscheduledHoldingTestsPanel(): void {
    this.unscheduledHoldingTestsPanelOpen = false;
    this.cdr.detectChanges();
  }

  /**
   * Opens Unit Interdictions panel for selected unit
   * Shows interdiction details and quarantine information
   */
  onInterdictions(): void {
    const unit = this.selectedUnit();
    if (!unit) {
      this.snackbarService.showInfo('Please select a unit first');
      return;
    }

    this.unitInterdictionsPanelOpen = true;
    this.cdr.detectChanges();

    // WCAG 2.4.3 Focus Order - Move focus to panel when it opens
    setTimeout(() => {
      const panel = document.querySelector('.side-panel--interdictions');
      const closeButton = panel?.querySelector('button[aria-label*="Close"]') as HTMLElement;
      closeButton?.focus();
    }, 100);
  }

  closeUnitInterdictionsPanel(): void {
    this.unitInterdictionsPanelOpen = false;
    this.cdr.detectChanges();
  }

  /**
   * Navigate to Unit Test Results Query screen
   * Shows detailed test results for units
   */
  /**
   * Transform unit ID based on format rules:
   * - Starts with 'W': Add '=' at start and '00' at end (W633313070215 → =W63331307021500)
   * - 7 digits: Add 'D' at start and 'D' at end (1234567 → D1234567D)
   * - Otherwise: Return as-is
   */
  private transformUnitId(unitId: string): string {
    if (!unitId) return '';

    // Check if starts with 'W' (case-insensitive)
    if (unitId.toUpperCase().startsWith('W')) {
      // Add '=' prefix and '00' suffix for W-format unit IDs
      // The receiving screen will display the full unit ID including '00'
      return `=${unitId}00`;
    }

    // Check if 7 digits
    if (/^\d{7}$/.test(unitId)) {
      return `D${unitId}D`;
    }

    // Return as-is for other formats
    return unitId;
  }

  onTestResultsQuery(): void {
    // Check if route exists before navigating
    const route = ROUTE_REGISTRY[RouteKey.UnitTestResultsQuery];
    if (route && route.path) {
      const unit = this.selectedUnit();

      // ⚡ Save lightweight state before navigation (fast, non-blocking)
      this.stateService.setNavigatingAway();
      this.savePageState(); // Only saves form values & metadata, not heavy batches array

      if (unit?.unitId) {
        const transformedUnitId = this.transformUnitId(unit.unitId);
        this.router.navigate([route.path], {
          queryParams: { unitId: transformedUnitId },
          state: { fromBatchInProgressQuery: true }
        });
      } else {
        this.router.navigate([route.path]);
      }
    } else {
      this.snackbarService.showInfo('Unit Test Results Query screen is not yet available');
    }
  }

  /**
   * Save lightweight page state before navigation (for passing context)
   * ⚡ PERFORMANCE OPTIMIZED:
   * - Only saves lightweight data (contractId, form values, filters, metadata)
   * - Does NOT save batches array (would be 100+ records with nested data)
   * - Saves to sessionStorage for reliable restoration on back navigation
   * - Fast because it only saves ~5-10KB of data
   */
  savePageState(): void {
    const contractId = this.filterForm.get('contractId')?.value;
    if (!contractId) {
      return;
    }

    const selectedContract = this.contractOptions().find((c: ContractDto) => c.contractId === contractId);

    const stateToSave = {
      contractId,
      contractName: selectedContract?.company || null,
      timestamp: Date.now(),
      formState: {
        queryMode: this.filterForm.get('queryMode')?.value || 'ALL',
        includeUnitsWithoutResults: this.filterForm.get('includeUnitsWithoutResults')?.value || false,
      },
      filterState: {
        selectedChapterFilters: this.selectedChapterFilters(),
        selectedBatchFilters: this.selectedBatchFilters(),
      },
      searchState: {
        batches: [], // ⚡ Empty - will re-fetch on restore
        selectedBatchId: this.selectedBatch()?.batchId || null,
        selectedUnitId: this.selectedUnit()?.unitId || null,
        hasSearched: this.hasSearched(),
        totalBatches: this.totalBatches(),
        totalUnits: this.totalUnits(),
        unitsWithoutResults: this.unitsWithoutResults(),
      },
    };


    // ⚡ Save lightweight state with search metadata (but not actual batches data)
    this.stateService.setPageState(stateToSave, true); // true = persist to sessionStorage for back navigation

  }

  /**
   * Save complete page state including search results (for restoration on return)
   * ⚡ PERFORMANCE OPTIMIZED: Stores only IDs and metadata, not full batch arrays
   * Called in ngOnDestroy when user navigates away (async via setTimeout)
   */
  saveCompletePageState(): void {
    const contractId = this.filterForm.get('contractId')?.value;
    if (!contractId) return;

    const selectedContract = this.contractOptions().find((c: ContractDto) => c.contractId === contractId);

    // ⚡ PERFORMANCE: Save only essential data for restoration
    // DON'T save batches array (can be 100+ batches with nested units/tests)
    // Instead, mark that search was performed - will re-fetch on return
    this.stateService.setPageState({
      contractId,
      contractName: selectedContract?.company || null,
      timestamp: Date.now(),
      formState: {
        queryMode: this.filterForm.get('queryMode')?.value || 'ALL',
        includeUnitsWithoutResults: this.filterForm.get('includeUnitsWithoutResults')?.value || false,
      },
      filterState: {
        selectedChapterFilters: this.selectedChapterFilters(),
        selectedBatchFilters: this.selectedBatchFilters(),
      },
      searchState: {
        batches: [], // ⚡ Don't save heavy data - will re-fetch on restore
        selectedBatchId: this.selectedBatch()?.batchId || null,
        selectedUnitId: this.selectedUnit()?.unitId || null,
        hasSearched: this.hasSearched(),
        totalBatches: this.totalBatches(),
        totalUnits: this.totalUnits(),
        unitsWithoutResults: this.unitsWithoutResults(),
      },
    }, true); // Persist to sessionStorage for reliable restoration across component re-creation
  }

  /**
   * Restore complete page state on component init (after back navigation)
   * Restores form, filters, search results, and selections
   */
  restorePageState(): void {
    const savedState = this.stateService.getPageState();
    if (!savedState) {
      // Clear loading states if no state to restore
      this.isLoadingContracts.set(false);
      this.isLoadingSearch.set(false);
      return;
    }

    // Check if state is recent (within last 5 minutes)
    if (!this.stateService.isStateRecent(savedState, 5)) {
      this.stateService.clearPageState();
      // Clear loading states
      this.isLoadingContracts.set(false);
      this.isLoadingSearch.set(false);
      return;
    }


    // Update selected contract signal BEFORE patching form
    this.selectedContractId.set(savedState.contractId);

    // Restore form state
    if (savedState.formState) {
      this.filterForm.patchValue({
        contractId: savedState.contractId,
        queryMode: savedState.formState.queryMode,
        includeUnitsWithoutResults: savedState.formState.includeUnitsWithoutResults,
      }, { emitEvent: false }); // Don't trigger form listeners during restoration
    } else {
      // Minimal restoration if formState is missing
      this.filterForm.patchValue({
        contractId: savedState.contractId,
      }, { emitEvent: false });
    }

    // Restore filter state
    if (savedState.filterState) {
      this.selectedChapterFilters.set(savedState.filterState.selectedChapterFilters || []);
      this.selectedBatchFilters.set(savedState.filterState.selectedBatchFilters || []);
    }

    // Restore search results
    if (savedState.searchState) {
      if (savedState.searchState.batches?.length > 0) {

        this.batches.set(savedState.searchState.batches);
        this.hasSearched.set(savedState.searchState.hasSearched);
        this.totalBatches.set(savedState.searchState.totalBatches);
        this.totalUnits.set(savedState.searchState.totalUnits);
        this.unitsWithoutResults.set(savedState.searchState.unitsWithoutResults);

        if (savedState.searchState.selectedBatchId) {
          const batch = savedState.searchState.batches.find(b => b.batchId === savedState.searchState!.selectedBatchId);
          if (batch) {
            this.selectedBatch.set(batch);
          }
        }

        if (savedState.searchState.selectedUnitId && this.selectedBatch()) {
          const unit = this.selectedBatch()?.units.find(u => u.unitId === savedState.searchState!.selectedUnitId);
          if (unit) {
            this.selectedUnit.set(unit);
          }
        }
      } else if (savedState.searchState.hasSearched) {
        this.hasSearched.set(true);

        // Store selection IDs to restore after re-fetch completes
        const pendingSelections = {
          batchId: savedState.searchState.selectedBatchId,
          unitId: savedState.searchState.selectedUnitId
        };

        // Trigger search using existing searchBatches() method
        // It will use the already-restored form values and filters
        // Pass callback to restore selections after search completes
        this.searchBatches(() => {
          const batches = this.batches();
          if (batches.length > 0 && pendingSelections.batchId) {
            const batch = batches.find(b => b.batchId === pendingSelections.batchId);
            if (batch) {
              this.selectedBatch.set(batch);

              if (pendingSelections.unitId) {
                const unit = batch.units.find(u => u.unitId === pendingSelections.unitId);
                if (unit) {
                  this.selectedUnit.set(unit);
                }
              }
            }
          }
        });
      }
    }

    // Mark form as touched to show it's been used
    this.filterForm.markAllAsTouched();

    // CRITICAL: Clear all loading states after restoration
    this.isLoadingContracts.set(false);
    this.isLoadingSearch.set(false);

  }

  /**
   * Restore page state when ready (waits for contracts to load)
   * ⚡ OPTIMIZED: Restores form immediately, then waits for contracts to finish loading in background
   */
  private restorePageStateWhenReady(): void {
    const savedState = this.stateService.getPageState();
    if (!savedState) {
      this.applyQueryParams();
      // Ensure loading states are cleared
      this.isLoadingContracts.set(false);
      this.isLoadingSearch.set(false);
      return;
    }


    // ⚡ PERFORMANCE: Restore immediately, don't wait for contracts
    // The contract ID is saved, so we can restore the form and trigger search right away
    this.restorePageState();

    // Contracts will finish loading in the background
    // The form already has the contract ID, so user sees immediate results
  }

  /**
   * Navigate to Non Extracted Batch Query screen
   * Shows batches that haven't been extracted yet
   * Carries contract context from Batch In-Progress Query
   *
   * ⚡ PERFORMANCE: Navigation is instant, state saved in ngOnDestroy
   */
  onNonExtractedBatchQuery(): void {
    // Check if route exists before navigating
    const route = ROUTE_REGISTRY[RouteKey.NonExtractedBatchesQuery];
    if (route && route.path) {
      const contractId = this.filterForm.get('contractId')?.value;

      // ⚡ Save lightweight state before navigation (fast, non-blocking)
      this.stateService.setNavigatingAway();
      this.savePageState(); // Only saves form values & metadata, not heavy batches array

      if (contractId) {
        this.router.navigate([route.path], {
          queryParams: { contractId },
          state: { fromBatchInProgressQuery: true }
        });
      } else {
        this.router.navigate([route.path]);
      }
    } else {
      this.snackbarService.showInfo('Non Extracted Batch Query screen is not yet available');
    }
  }

  /**
   * Navigate to Samples Query screen
   * Shows sample tracking and query functionality
   */
  onSamplesQuery(): void {
    // Check if route exists before navigating
    const route = ROUTE_REGISTRY[RouteKey.SamplesQuery];
    if (route && route.path) {
      const unit = this.selectedUnit();

      // ⚡ Save lightweight state before navigation (fast, non-blocking)
      this.stateService.setNavigatingAway();
      this.savePageState(); // Only saves form values & metadata, not heavy batches array

      if (unit?.unitId) {
        const transformedUnitId = this.transformUnitId(unit.unitId);
        this.router.navigate([route.path], {
          queryParams: { unitId: transformedUnitId },
          state: { fromBatchInProgressQuery: true }
        });
      } else {
        this.router.navigate([route.path]);
      }
    } else {
      this.snackbarService.showInfo('Samples Query screen is not yet available');
    }
  }

  /**
   * Navigate to Unit Test Results Query screen
   * Shows test results for a specific unit
   */
  onUnitTestResults(unitId: string): void {
    const route = ROUTE_REGISTRY[RouteKey.UnitTestResultsQuery];
    if (route && route.path) {
      // ⚡ Save lightweight state before navigation (fast, non-blocking)
      this.stateService.setNavigatingAway();
      this.savePageState(); // Only saves form values & metadata, not heavy batches array

      // Navigate with unit ID
      this.router.navigate([route.path], {
        queryParams: { unitId },
        state: { fromBatchInProgressQuery: true }
      });
    } else {
      this.snackbarService.showInfo('Unit Test Results Query screen is not yet available');
    }
  }

  private formatDate(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dd = String(date.getDate()).padStart(2, '0');
    return `${dd}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }
}
