import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { Subject, from } from 'rxjs';
import { takeUntil, concatMap, toArray } from 'rxjs/operators';
import moment from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { MatSidenavModule } from '@angular/material/sidenav';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';

import { VoidCancelTestResultsApiService } from './services/void-cancel-test-results-api.service';
import { VoidCancelConfirmationDialogComponent } from './void-cancel-confirmation-dialog/void-cancel-confirmation-dialog';
import { SelectTestsDialogComponent } from './select-tests-dialog/select-tests-dialog';
import {
  ActionTypeDto,
  ActiveTestDto,
  TestGroupDto,
  VoidReasonCodeDto,
  TestResultForVoidDto,
  ScannedUnit,
  TestResultRow,
  VoidCancelConfirmationDialogData,
  VoidCancelConfirmationDialogResult,
  SelectTestsDialogData,
  SelectTestsDialogResult,
  TestResultDetailDto,
} from './models/void-cancel-test-results.model';

@Component({
  selector: 'app-void-cancel-test-results',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCheckboxModule,
    MatChipsModule,
    MatInputModule,
    MatSidenavModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    DataTable,
    SelectTestsDialogComponent,
  ],
  templateUrl: './void-cancel-test-results.html',
  styleUrl: './void-cancel-test-results.scss',
})
export class VoidCancelTestResultsComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(VoidCancelTestResultsApiService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

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
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  // --- Signals for data ---
  protected readonly actions = signal<ActionTypeDto[]>([]);
  protected readonly availableTests = signal<ActiveTestDto[]>([]);
  protected readonly testGroups = signal<TestGroupDto[]>([]);
  protected readonly voidReasonCodes = signal<VoidReasonCodeDto[]>([]);
  protected readonly selectedTests = signal<ActiveTestDto[]>([]);
  protected readonly scannedUnits = signal<ScannedUnit[]>([]);
  protected readonly selectedUnitId = signal<string | null>(null);
  protected readonly testResults = signal<TestResultRow[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly scheduledSelectedRows = signal<TestResultRow[]>([]);
  protected readonly unscheduledSelectedRows = signal<TestResultRow[]>([]);

  // --- Search controls for ngx-mat-select-search ---
  actionSearchCtrl = new FormControl('');
  testSearchCtrl = new FormControl('');
  reasonSearchCtrl = new FormControl('');

  private actionSearchText = signal('');
  private testSearchText = signal('');
  private reasonSearchText = signal('');

  // --- Form ---
  filterForm!: FormGroup;

  get f() {
    return this.filterForm.controls;
  }

  // --- Computed values ---
  protected readonly filteredActions = computed(() => {
    const s = this.actionSearchText().toLowerCase();
    return !s ? this.actions() : this.actions().filter(a =>
      a.code.toLowerCase().includes(s) || a.description.toLowerCase().includes(s)
    );
  });

  protected readonly filteredTests = computed(() => {
    const s = this.testSearchText().toLowerCase();
    return !s ? this.availableTests() : this.availableTests().filter(t =>
      t.testId.toLowerCase().includes(s) || t.testDesc.toLowerCase().includes(s)
    );
  });

  protected readonly filteredReasonCodes = computed(() => {
    const s = this.reasonSearchText().toLowerCase();
    return !s ? this.voidReasonCodes() : this.voidReasonCodes().filter(c =>
      c.code.toLowerCase().includes(s) || c.codeDesc.toLowerCase().includes(s)
    );
  });

  protected readonly selectedVoidCodeDescription = signal<string>('-');

  protected readonly selectedAction = computed(() => {
    const code = this.filterForm?.get('action')?.value;
    return this.actions().find(a => a.code === code) || null;
  });

  protected readonly isCancel = computed(() => {
    return this.filterForm?.get('action')?.value === 'CANCEL';
  });

  protected readonly isSupervisorVoid = computed(() => {
    return this.filterForm?.get('action')?.value === 'SUPVOID';
  });

  protected readonly scheduledTests = computed(() => {
    return this.testResults().filter(r => r.isScheduled === 'Y');
  });

  protected readonly unscheduledTests = computed(() => {
    return this.testResults().filter(r => r.isScheduled !== 'Y');
  });

  protected readonly selectedResultCount = computed(() => {
    return this.scheduledSelectedRows().length + this.unscheduledSelectedRows().length;
  });

  protected readonly actionLabel = computed(() => {
    const action = this.filterForm?.get('action')?.value;
    if (action === 'CANCEL') return 'CANCEL';
    if (action === 'SUPVOID') return 'SUPVOID';
    return 'VOID';
  });

  protected readonly hasScannedUnits = computed(() => this.scannedUnits().length > 0);

  protected readonly hasTestResults = computed(() => this.testResults().length > 0);

  protected readonly testResultCount = computed(() => this.testResults().length);

  protected readonly selectedTestIds = computed(() => this.selectedTests().map(t => t.testId));

  protected readonly selectedScannedUnit = computed(() => {
    const id = this.selectedUnitId();
    return this.scannedUnits().find(u => u.unitId === id) || null;
  });

  // --- Select Test Panel ---
  protected selectTestPanelOpen = signal(false);

  // --- View Full Details Panel ---
  protected detailPanelOpen = signal(false);
  protected readonly detailResults = signal<TestResultDetailDto[]>([]);
  protected readonly detailScheduled = computed(() => this.detailResults().filter(r => r.isScheduled === 'Y'));
  protected readonly detailUnscheduled = computed(() => this.detailResults().filter(r => r.isScheduled !== 'Y'));
  protected readonly detailLoading = signal(false);

  protected readonly detailTableConfig: DataTableConfig<TestResultDetailDto> = {
    columns: [
      { key: 'testId', header: 'Test ID', sortable: false },
      { key: 'testSeqNo', header: 'Seq No', sortable: false },
      { key: 'resultCode', header: 'Result', sortable: false },
      { key: 'tbId', header: 'Test Batch ID', sortable: false },
      { key: 'tbSeqNo', header: 'Batch Seq No', sortable: false },
      { key: 'absorbance', header: 'Absorbance', sortable: false },
      { key: 'ratio', header: 'Ratio', sortable: false },
      { key: 'wellNumber', header: 'Well Number', sortable: false },
      { key: 'testChapterId', header: 'Test Chapter', sortable: false },
      { key: 'resultDats', header: 'Result Date', sortable: false, valueFormatter: (v: string) => this.formatDate(v) },
      { key: 'testMode', header: 'Test Mode', sortable: false, valueFormatter: (v: string) => v === 'M' ? 'Manual' : v === 'A' ? 'Automated' : v || '-' },
    ],
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No test result details',
    showTableOnEmpty: true,
  };

  // --- DataTable Configs ---
  protected readonly scheduledTableConfig: DataTableConfig<TestResultRow> = {
    columns: [
      { key: 'testId', header: 'Test ID', sortable: false },
      { key: 'testSeqNo', header: 'Sequence Number', sortable: false },
      { key: 'resultCode', header: 'Result', sortable: false },
      { key: 'tbId', header: 'Test Batch ID', sortable: false },
      { key: 'voidReason', header: 'Reason', sortable: false },
      { key: 'voidReasonDesc', header: 'Description', sortable: false },
    ],
    enableSelection: true,
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No scheduled test results',
    showTableOnEmpty: true,
  };

  protected readonly unscheduledTableConfig: DataTableConfig<TestResultRow> = {
    columns: [
      { key: 'testId', header: 'Test ID', sortable: false },
      { key: 'testSeqNo', header: 'Sequence Number', sortable: false },
      { key: 'resultCode', header: 'Result', sortable: false },
      { key: 'tbId', header: 'Test Batch ID', sortable: false },
      { key: 'voidReason', header: 'Reason', sortable: false },
      { key: 'voidReasonDesc', header: 'Description', sortable: false },
    ],
    enableSelection: true,
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No unscheduled test results',
    showTableOnEmpty: true,
  };

  protected readonly scannedUnitsTableConfig: DataTableConfig<ScannedUnit> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: false },
      { key: 'collDate', header: 'Collection Date', sortable: false,
        valueFormatter: (v: string) => this.formatDate(v) },
    ],
    rowActions: [
      { icon: 'delete', label: 'Remove unit', action: 'delete' },
    ],
    showPagination: false,
    stickyHeader: true,
    enableRowHighlight: true,
    emptyMessage: 'No units scanned',
    emptySubMessage: 'Scan or type a unit ID above to begin.',
    showTableOnEmpty: true,
  };

  // --- Lifecycle ---
  ngOnInit(): void {
    this.initForm();
    this.loadInitialData();
    this.setupFormListeners();
    this.setupSearchListeners();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Form Initialization ---
  private initForm(): void {
    this.filterForm = this.fb.group({
      action: [null, Validators.required],
      testId: [null],
      reasonCode: [null, Validators.required],
    });
  }

  private setupFormListeners(): void {
    this.filterForm.get('action')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearResults();
      });

    this.filterForm.get('reasonCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((reasonCode) => {
        if (reasonCode) {
          const selectedCode = this.voidReasonCodes().find(c => c.code === reasonCode);
          this.selectedVoidCodeDescription.set(selectedCode?.codeDesc || '-');
        } else {
          this.selectedVoidCodeDescription.set('-');
        }
      });
  }

  private setupSearchListeners(): void {
    this.actionSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.actionSearchText.set(v || ''));
    this.testSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.testSearchText.set(v || ''));
    this.reasonSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.reasonSearchText.set(v || ''));
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadInitialData();
      });
  }

  // --- Data Loading ---
  private loadInitialData(): void {
    this.apiService.getActions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (actions) => this.actions.set(actions),
        error: (error) => this.handleError('Failed to load permitted actions', error),
      });

    this.apiService.getTests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => this.availableTests.set(tests),
        error: (error) => this.handleError('Failed to load tests', error),
      });

    this.apiService.getTestGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => this.testGroups.set(groups),
        error: (error) => this.handleError('Failed to load test groups', error),
      });

    this.apiService.getVoidReasonCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => this.voidReasonCodes.set(codes),
        error: (error) => this.handleError('Failed to load void reason codes', error),
      });
  }

  // --- Test Selection ---
  onTestSelected(testId: string): void {
    const test = this.availableTests().find(t => t.testId === testId);
    if (test && !this.selectedTests().some(t => t.testId === testId)) {
      this.selectedTests.set([...this.selectedTests(), test]);
      this.reloadCurrentUnit();
    }
    this.filterForm.patchValue({ testId: null }, { emitEvent: false });
  }

  removeSelectedTest(testId: string): void {
    this.selectedTests.set(this.selectedTests().filter(t => t.testId !== testId));
    this.reloadCurrentUnit();
  }

  openSelectTestsPanel(): void {
    this.selectTestPanelOpen.set(true);
  }

  onSidenavClosed(): void {
    this.selectTestPanelOpen.set(false);
  }

  onSelectTestsPanelClose(result: SelectTestsDialogResult | null): void {
    this.selectTestPanelOpen.set(false);
    if (result?.selectedTests) {
      this.selectedTests.set(result.selectedTests);
      this.reloadCurrentUnit();
    }
  }

  onScheduledSelectionChange(selectedRows: TestResultRow[]): void {
    this.scheduledSelectedRows.set(selectedRows);
  }

  onUnscheduledSelectionChange(selectedRows: TestResultRow[]): void {
    this.unscheduledSelectedRows.set(selectedRows);
  }

  onScannedUnitAction(event: TableRowActionEvent<ScannedUnit>): void {
    if (event.action === 'delete') {
      this.removeScannedUnit(event.row.unitId);
    }
  }

  onScannedUnitClick(unit: ScannedUnit): void {
    this.selectUnit(unit.unitId);
  }

  // --- Unit Scanning ---
  onUnitIdValidated(event: any): void {
    const unitId = event.parsedUnitId;
    if (!unitId) return;

    // Prevent duplicate scans
    if (this.scannedUnits().some(u => u.unitId === unitId)) {
      this.snackbarService.showError('This unit has already been scanned.');
      this.unitIdField?.clear();
      return;
    }

    const newUnit: ScannedUnit = {
      unitId,
      collDate: null,
    };
    this.scannedUnits.set([...this.scannedUnits(), newUnit]);

    // Auto-select the newly scanned unit
    this.selectUnit(unitId);
    this.unitIdField?.clear();
    this.unitIdField?.focus();
  }

  removeScannedUnit(unitId: string): void {
    this.scannedUnits.set(this.scannedUnits().filter(u => u.unitId !== unitId));
    if (this.selectedUnitId() === unitId) {
      this.selectedUnitId.set(null);
      this.testResults.set([]);
    }
  }

  selectUnit(unitId: string): void {
    this.selectedUnitId.set(unitId);
    this.loadTestResultsForUnit(unitId);
  }

  private reloadCurrentUnit(): void {
    const unitId = this.selectedUnitId();
    if (unitId) {
      this.loadTestResultsForUnit(unitId);
    }
  }

  private loadTestResultsForUnit(unitId: string): void {
    this.loading.set(true);

    const action = this.filterForm.get('action')?.value || 'VOID';
    const tests = this.selectedTests();
    const testIds = tests.length > 0 ? tests.map(t => t.testId).join(',') : null;

    this.apiService.getTestResultsByUnit(unitId, testIds, action)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          const rows: TestResultRow[] = results.map(r => ({
            ...r,
            selected: false,
            rowKey: `${r.unitId}-${r.testId}-${r.testSeqNo}`,
          }));
          this.scheduledSelectedRows.set([]);
          this.unscheduledSelectedRows.set([]);
          this.testResults.set(rows);

          if (results.length > 0 && results[0].collDate) {
            const units = this.scannedUnits().map(u =>
              u.unitId === unitId ? { ...u, collDate: results[0].collDate } : u
            );
            this.scannedUnits.set(units);
          }

          this.loading.set(false);
        },
        error: (error) => {
          this.handleError('Failed to retrieve test results', error);
          this.loading.set(false);
        },
      });
  }

  // --- Test Result Selection ---
  toggleTestResult(index: number, isScheduled: boolean): void {
    const results = this.testResults().map((r, i) => {
      const matchIndex = isScheduled
        ? this.scheduledTests().indexOf(r)
        : this.unscheduledTests().indexOf(r);
      if (matchIndex === index) {
        return { ...r, selected: !r.selected };
      }
      return r;
    });
    this.testResults.set(results);
  }

  toggleResultByRow(row: TestResultRow): void {
    const results = this.testResults().map(r => {
      if (r.testId === row.testId && r.testSeqNo === row.testSeqNo && r.unitId === row.unitId) {
        return { ...r, selected: !r.selected };
      }
      return r;
    });
    this.testResults.set(results);
  }

  toggleAllScheduled(checked: boolean): void {
    const results = this.testResults().map(r => {
      if (r.isScheduled === 'Y') {
        return { ...r, selected: checked };
      }
      return r;
    });
    this.testResults.set(results);
  }

  toggleAllUnscheduled(checked: boolean): void {
    const results = this.testResults().map(r => {
      if (r.isScheduled !== 'Y') {
        return { ...r, selected: checked };
      }
      return r;
    });
    this.testResults.set(results);
  }

  get allScheduledSelected(): boolean {
    const scheduled = this.scheduledTests();
    return scheduled.length > 0 && scheduled.every(r => r.selected);
  }

  get someScheduledSelected(): boolean {
    const scheduled = this.scheduledTests();
    return scheduled.some(r => r.selected) && !this.allScheduledSelected;
  }

  get allUnscheduledSelected(): boolean {
    const unscheduled = this.unscheduledTests();
    return unscheduled.length > 0 && unscheduled.every(r => r.selected);
  }

  get someUnscheduledSelected(): boolean {
    const unscheduled = this.unscheduledTests();
    return unscheduled.some(r => r.selected) && !this.allUnscheduledSelected;
  }

  // --- Actions ---
  onClearAll(): void {
    this.filterForm.reset();
    this.selectedTests.set([]);
    this.clearResults();
    this.selectedVoidCodeDescription.set('-');
  }

  private clearResults(): void {
    this.scannedUnits.set([]);
    this.selectedUnitId.set(null);
    this.testResults.set([]);
    this.scheduledSelectedRows.set([]);
    this.unscheduledSelectedRows.set([]);
  }

  onViewFullDetails(): void {
    const unitId = this.selectedUnitId();
    if (!unitId) return;

    const action = this.filterForm.get('action')?.value || 'VOID';
    const tests = this.selectedTests();
    const testIds = tests.length > 0 ? tests.map(t => t.testId).join(',') : null;

    this.detailLoading.set(true);
    this.detailPanelOpen.set(true);

    this.apiService.getTestResultDetails(unitId, testIds, action)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.detailResults.set(results);
          this.detailLoading.set(false);
        },
        error: (error) => {
          this.handleError('Failed to load test result details', error);
          this.detailLoading.set(false);
          this.detailPanelOpen.set(false);
        },
      });
  }

  onDetailPanelClose(): void {
    this.detailPanelOpen.set(false);
    this.detailResults.set([]);
  }

  onMoveToUnitScan(): void {
    this.selectedUnitId.set(null);
    this.testResults.set([]);
    this.unitIdField?.focus();
  }

  onVoidCancel(): void {
    if (!this.filterForm.get('action')?.value) {
      this.filterForm.get('action')?.markAsTouched();
      this.snackbarService.showError('Please select an action.');
      return;
    }

    if (!this.filterForm.get('reasonCode')?.value) {
      this.filterForm.get('reasonCode')?.markAsTouched();
      this.snackbarService.showError('Please select a reason code.');
      return;
    }

    if (this.selectedResultCount() === 0) {
      this.snackbarService.showError('Please select at least one test result.');
      return;
    }

    this.openConfirmDialog();
  }

  private openConfirmDialog(): void {
    const action = this.filterForm.get('action')?.value;
    const reasonCode = this.filterForm.get('reasonCode')?.value;
    const selectedAction = this.actions().find(a => a.code === action);
    const selectedReason = this.voidReasonCodes().find(c => c.code === reasonCode);

    const dialogRef = this.dialog.open(VoidCancelConfirmationDialogComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: true,
      data: {
        action,
        actionDescription: action,
        selectedCount: this.selectedResultCount(),
        voidReasonCode: reasonCode,
        voidReasonDescription: selectedReason?.codeDesc || '-',
        voidReasonCodes: this.voidReasonCodes(),
      } as VoidCancelConfirmationDialogData,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: VoidCancelConfirmationDialogResult | null) => {
        if (result?.confirmed) {
          this.performAction(result.voidReasonCode);
        }
      });
  }

  private performAction(voidReasonCode: string): void {
    const action = this.filterForm.get('action')?.value;
    const selectedResults = [...this.scheduledSelectedRows(), ...this.unscheduledSelectedRows()];
    this.loading.set(true);

    if (action === 'CANCEL') {
      const requests = selectedResults.map(r => ({
        unitId: r.unitId,
        testId: r.testId,
        testSeqNo: r.testSeqNo,
        collDate: r.collDate,
        cancelReason: voidReasonCode,
        isScheduled: r.isScheduled || 'Y',
      }));

      from(requests).pipe(
        concatMap(req => this.apiService.cancelTestResults(req)),
        toArray(),
        takeUntil(this.destroy$),
      ).subscribe({
          next: () => {
            this.loading.set(false);
            this.snackbarService.showSuccess(`${selectedResults.length} test result(s) have been cancelled.`);
            this.refreshAfterAction();
          },
          error: (error) => {
            this.loading.set(false);
            this.handleError('Cancel operation failed', error);
          },
        });
    } else {
      const isSupervisor = action === 'SUPVOID';
      const requests = selectedResults.map(r => ({
        unitId: r.unitId,
        testId: r.testId,
        testSeqNo: r.testSeqNo,
        collDate: r.collDate,
        voidReason: voidReasonCode,
        isScheduled: r.isScheduled || 'Y',
      }));

      from(requests).pipe(
        concatMap(req => this.apiService.voidTestResults(req, isSupervisor)),
        toArray(),
        takeUntil(this.destroy$),
      ).subscribe({
          next: () => {
            this.loading.set(false);
            const actionLabel = isSupervisor ? 'supervisor voided' : 'voided';
            this.snackbarService.showSuccess(`${selectedResults.length} test result(s) have been ${actionLabel}.`);
            this.refreshAfterAction();
          },
          error: (error) => {
            this.loading.set(false);
            this.handleError('Void operation failed', error);
          },
        });
    }
  }

  private refreshAfterAction(): void {
    this.scheduledSelectedRows.set([]);
    this.unscheduledSelectedRows.set([]);
    const unitId = this.selectedUnitId();
    if (unitId) {
      this.loadTestResultsForUnit(unitId);
    } else {
      this.testResults.set([]);
    }
  }

  // --- Utilities ---
  protected formatDate(value: string | null): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  private handleError(context: string, error: any): void {
    console.error(context, error);
    const errorMessage = error?.error?.message || error?.message || 'An unexpected error occurred. Please try again.';
    this.snackbarService.showError(errorMessage);
  }
}
