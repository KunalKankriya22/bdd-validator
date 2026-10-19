import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  effect,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TestResultReconciliationApiService } from './services/test-result-reconciliation-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';

import {
  TestBatchDto,
  TestForReconciliationDto,
  ReconciliationUnitDto,
  ValidTestResultDto,
  ReconciliationTableModel,
  UnitReconciliationDto,
  ReconcileResultsRequestDto
} from './models/test-result-reconciliation.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';

import { OverrideTestResultPanel } from './override-test-result-panel/override-test-result-panel';

@Component({
  selector: 'app-test-result-reconciliation',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    OverrideTestResultPanel
  ],
  templateUrl: './test-result-reconciliation.html',
  styleUrl: './test-result-reconciliation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TestResultReconciliation implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;

  private static nextId = 0;
  protected readonly componentId = `trr-${TestResultReconciliation.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
    ],
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by test batch/ worksheet ID',
    minLength: 1,
    ariaLabel: 'Search by test batch or worksheet ID'
  };

  tableConfig: DataTableConfig<ReconciliationTableModel> = {
    columns: [
      {
        key: 'tbId',
        header: 'Test Batch/ Worksheet ID',
        sortable: true,
        width: '200px'
      },
      {
        key: 'testId',
        header: 'Test',
        sortable: false,
        width: '100px'
      },
      {
        key: 'testDesc',
        header: 'Test Description',
        sortable: false,
        width: '300px'
      },
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: false,
        width: '200px'
      }
    ],
    rowActions: [
      {
        icon: 'visibility',
        label: 'View unit details',
        action: 'view',
        ariaLabel: 'View unit details'
      }
    ],
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No units pending reconciliation',
    loadingMessage: 'Loading test results...',
    showPagination: true
  };

  // Signals
  protected readonly batches = signal<TestBatchDto[]>([]);
  protected readonly tests = signal<TestForReconciliationDto[]>([]);
  protected readonly units = signal<ReconciliationUnitDto[]>([]);
  protected readonly validResults = signal<ValidTestResultDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sidePanelOpen = signal<boolean>(false);
  protected readonly currentUnit = signal<ReconciliationUnitDto | null>(null);
  protected readonly selectedBatch = signal<string | null>(null);
  protected readonly selectedTest = signal<string | null>(null);

  // Computed
  protected readonly tableData = computed<ReconciliationTableModel[]>(() => {
    const unitsData = this.units();
    const batch = this.selectedBatch();
    const test = this.selectedTest();
    const testData = this.tests().find(t => t.testId === test);

    if (!batch || !test || !testData) {
      return [];
    }

    return unitsData.map(unit => ({
      tbId: batch,
      testId: test,
      testDesc: testData.testDesc,
      unitId: unit.checkDigit ? `${unit.unitId}-${unit.checkDigit}` : unit.unitId,
      tbSeqNo: unit.tbSeqNo,
      checkDigit: unit.checkDigit,
      tech1Result: unit.tempResult1,
      tech1ResultDesc: unit.resultCodeDesc1,
      tech2Result: unit.tempResult2,
      tech2ResultDesc: unit.resultCodeDesc2,
      hasDiscrepancy: unit.tempResult2 && unit.tempResult2 !== 'NULL'
        ? unit.tempResult1 !== unit.tempResult2
        : false
    }));
  });

  protected readonly filteredTableData = computed<ReconciliationTableModel[]>(() => {
    const data = this.tableData();
    const keyword = this.searchKeyword().toLowerCase();

    if (!keyword) {
      return data;
    }

    return data.filter(row =>
      row.tbId.toLowerCase().includes(keyword) ||
      row.testId.toLowerCase().includes(keyword) ||
      row.testDesc.toLowerCase().includes(keyword) ||
      row.unitId.toLowerCase().includes(keyword)
    );
  });

  protected readonly paginatedData = computed<ReconciliationTableModel[]>(() => {
    const data = this.filteredTableData();
    const start = this.currentPageIndex * this.currentPageSize;
    const end = start + this.currentPageSize;
    return data.slice(start, end);
  });

  protected readonly totalRecords = computed(() => this.filteredTableData().length);

  protected readonly searchKeyword = signal<string>('');
  currentPageSize = 10;
  currentPageIndex = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private readonly service: TestResultReconciliationApiService,
    private readonly snackbarService: SnackbarService,
    private readonly headerService: HeaderService,
    private readonly pageHeaderService: PageHeaderService,
    private readonly cdr: ChangeDetectorRef
  ) {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
        };
        this.cdr.markForCheck();
      }
    });

    effect(() => {
      this.tableConfig = {
        ...this.tableConfig,
        pagination: {
          ...this.tableConfig.pagination!,
          totalRecords: this.totalRecords()
        }
      };
    });
  }

  ngOnInit(): void {
    this.loadOpenBatches();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetState();
        this.loadOpenBatches();
      });
  }

  private resetState(): void {
    this.batches.set([]);
    this.tests.set([]);
    this.units.set([]);
    this.validResults.set([]);
    this.error.set(null);
    this.sidePanelOpen.set(false);
    this.currentUnit.set(null);
    this.selectedBatch.set(null);
    this.selectedTest.set(null);
    this.searchKeyword.set('');
    this.currentPageIndex = 0;
  }

  protected loadOpenBatches(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getOpenBatches()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batches) => {
          this.batches.set(batches);
          this.loading.set(false);

          if (batches.length > 0) {
            this.loadTestsForBatch(batches[0].tbId);
          }
        },
        error: (err) => {
          this.error.set(err?.error?.message);
          this.loading.set(false);
          this.snackbarService.showError(err?.error?.message);
        }
      });
  }

  private loadTestsForBatch(tbId: string): void {
    this.selectedBatch.set(tbId);
    this.loading.set(true);
    this.error.set(null);

    this.service.getTestsInBatch(tbId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => {
          this.tests.set(tests);
          this.loading.set(false);

          if (tests.length > 0) {
            this.loadUnitsForTest(tbId, tests[0].testId);
          }
        },
        error: (err) => {
          this.error.set(err?.error?.message);
          this.loading.set(false);
          this.snackbarService.showError(err?.error?.message);
        }
      });
  }

  private loadUnitsForTest(tbId: string, testId: string): void {
    this.selectedTest.set(testId);
    this.loading.set(true);
    this.error.set(null);

    const selectedTestData = this.tests().find(t => t.testId === testId);
    const antigenFlag = selectedTestData?.antigenFlag || 'N';

    forkJoin({
      units: this.service.getUnitsForReconciliation(tbId, testId),
      validResults: this.service.getValidResults(testId, antigenFlag)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ units, validResults }) => {
          this.units.set(units);
          this.validResults.set(validResults);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message);
          this.loading.set(false);
          this.snackbarService.showError(err?.error?.message);
        }
      });
  }

  onSearch(keyword: string): void {
    this.searchKeyword.set(keyword);
    this.currentPageIndex = 0;
  }

  onPageChange(event: TablePageEvent): void {
    this.currentPageSize = event.pageSize;
    this.currentPageIndex = event.pageIndex;
  }

  onRowAction(event: TableRowActionEvent<ReconciliationTableModel>): void {
    if (event.action === 'view') {
      this.openOverridePanel(event.row);
    }
  }

  private openOverridePanel(row: ReconciliationTableModel): void {
    const unit = this.units().find(u => u.tbSeqNo === row.tbSeqNo);

    if (unit) {
      this.currentUnit.set(unit);
      this.sidePanelOpen.set(true);
    }
  }

  onCloseSidePanel(): void {
    this.sidePanelOpen.set(false);
    this.currentUnit.set(null);
  }

  onConfirmReconciliation(event: { supervisorResult: string }): void {
    const unit = this.currentUnit();
    const batch = this.selectedBatch();
    const test = this.selectedTest();

    if (!unit || !batch || !test) {
      return;
    }

    const selectedTestData = this.tests().find(t => t.testId === test);

    const request: ReconcileResultsRequestDto = {
      tbId: batch,
      testId: test,
      antigenFlag: selectedTestData?.antigenFlag || 'N',
      units: [
        {
          tbSeqNo: unit.tbSeqNo,
          unitId: unit.unitId,
          supervisorResult: event.supervisorResult
        }
      ]
    };

    this.loading.set(true);

    this.service.reconcileResults(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.loading.set(false);
          this.sidePanelOpen.set(false);
          this.currentUnit.set(null);

          this.snackbarService.showSuccess(summary.message);

          this.refreshAfterReconciliation();
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(err?.error?.message);
        }
      });
  }

  private refreshAfterReconciliation(): void {
    const batch = this.selectedBatch();
    const test = this.selectedTest();

    if (batch && test) {
      this.service.getUnitsForReconciliation(batch, test)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (units) => {
            this.units.set(units);

            if (units.length === 0) {
              this.loadTestsForBatch(batch);
            }
          },
          error: (err) => {
            console.error('Failed to refresh units:', err);
          }
        });
    }
  }

  getCurrentUnit(): ReconciliationUnitDto | null {
    return this.currentUnit();
  }

  getCurrentTestDesc(): string {
    const test = this.selectedTest();
    if (!test) return '';

    const testData = this.tests().find(t => t.testId === test);
    return testData ? testData.testDesc : '';
  }
}
