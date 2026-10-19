import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';
import { Router } from '@angular/router';
import moment from 'moment';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ReleaseTestResultsService, ReleaseTestResultsState } from './services/release-test-results.service';
import {
  ReleaseTestResultSearchRequest,
  ReleaseTestResultSearchResponse,
  ReleaseTestResultUnit,
  AutoDetermineQcFlagRequest,
  ReleaseTestResultsRequest,
  ContractOption,
  BatchOption,
  TestResult,
  CollectionDayLegendItem,
  SampleAgeConfig
} from './models/release-test-results.models';
import { LegendDialogComponent } from './components/legend-dialog/legend-dialog.component';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { MessageDialog } from '@shared/components/message-dialog/message-dialog';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';

@Component({
  selector: 'app-release-test-results',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatSidenavModule,
    MatDialogModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './release-test-results.component.html',
  styleUrl: './release-test-results.component.scss'
})
export class ReleaseTestResultsComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  readonly componentId = `release-test-results-${ReleaseTestResultsComponent.nextId++}`;
  readonly elementId = (name: string) => `${this.componentId}-${name}`;
  readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly releaseTestResultsService = inject(ReleaseTestResultsService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // State signals
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly searchResults = signal<ReleaseTestResultSearchResponse | null>(null);
  readonly selectedUnit = signal<ReleaseTestResultUnit | null>(null);
  readonly selectedUnitIndex = signal<number>(0);
  readonly testResults = signal<TestResult[]>([]);
  readonly testResultsLoading = signal<boolean>(false);
  readonly contractOptions = signal<ContractOption[]>([]);
  readonly batchOptions = signal<BatchOption[]>([]);
  readonly legendData = signal<CollectionDayLegendItem[]>([]);
  readonly sampleAgeConfig = signal<SampleAgeConfig[]>([]);
  readonly showSidePanel = signal<boolean>(false);
  readonly submitted = signal<boolean>(false);
  readonly reconciling = signal<boolean>(false);
  readonly reconciled = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  private _preserveState = false;
  readonly sortColumn = signal<string>('CollDate');
  readonly sortDirection = signal<'ASC' | 'DESC'>('ASC');

  // Computed values
  readonly hasResults = computed(() => (this.searchResults()?.units.length ?? 0) > 0);
  readonly totalUnits = computed(() => this.searchResults()?.totalUnits ?? 0);
  readonly skippedUnits = computed(() => this.searchResults()?.skippedUnits ?? 0);
  readonly noResultUnits = computed(() => {
    const units = this.searchResults()?.units ?? [];
    return units.filter(u => !u.qcTestFlag || u.qcTestFlag === 'N').length;
  });
  readonly sqcUnits = computed(() => this.searchResults()?.sqcReasonUnits ?? 0);
  readonly canSave = computed(() => this.hasResults() && !this.loading() && !this.saving());
  readonly canReconcile = computed(() => this.hasResults() && !this.reconciling() && !this.reconciled());

  // Page header
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/' },
      { label: 'Release Test Results', link: null }
    ],
    title: '',
    subtitle: ''
  };

  // Forms
  searchForm!: FormGroup;

  // Table data
  displayedColumns: string[] = [
    'unitId',
    'tubeCheckIn',
    'collectionDate',
    'redTube',
    'redTube2',
    'purpleTube',
    'qc'
  ];
  unitsData = signal<ReleaseTestResultUnit[]>([]);
  selection = new SelectionModel<ReleaseTestResultUnit>(true, []);

  // Test results table columns
  testResultColumns: string[] = ['sequence', 'testId', 'resultCode', 'resultDescription', 'description', 'interimResult'];

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          title: pageData.title,
          subtitle: pageData.subtitle || '',
          breadcrumbs: [
            { label: 'Home', link: '/' },
            { label: pageData.title, link: null }
          ]
        };
      }
    });
  }

  ngOnInit(): void {
    this.initForm();

    const saved = this.releaseTestResultsService.savedState;
    if (saved) {
      this.restoreState(saved);
      this.releaseTestResultsService.clearState();
    } else {
      this.loadContractOptions();
      this.loadLegendData();
      this.loadSampleAgeConfig();
    }

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadContractOptions();
        this.loadLegendData();
        this.loadSampleAgeConfig();
      });
  }

  ngOnDestroy(): void {
    if (this._preserveState && this.hasResults()) {
      this.releaseTestResultsService.saveState(this.captureState());
    } else {
      this.releaseTestResultsService.clearState();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private captureState(): ReleaseTestResultsState {
    return {
      formValues: {
        contractId: this.searchForm.value.contractId || '',
        contractIdDescription: this.searchForm.get('contractIdDescription')?.value || '',
        batchId: this.searchForm.value.batchId || ''
      },
      searchResults: this.searchResults(),
      unitsData: this.unitsData(),
      selectedUnit: this.selectedUnit(),
      selectedUnitIndex: this.selectedUnitIndex(),
      testResults: this.testResults(),
      showSidePanel: this.showSidePanel(),
      sortColumn: this.sortColumn(),
      sortDirection: this.sortDirection(),
      contractOptions: this.contractOptions(),
      batchOptions: this.batchOptions(),
      legendData: this.legendData(),
      sampleAgeConfig: this.sampleAgeConfig(),
      reconciled: this.reconciled()
    };
  }

  private restoreState(state: ReleaseTestResultsState): void {
    this.searchForm.patchValue(state.formValues, { emitEvent: false });
    this.searchResults.set(state.searchResults);
    this.unitsData.set(state.unitsData);
    this.selectedUnit.set(state.selectedUnit);
    this.selectedUnitIndex.set(state.selectedUnitIndex);
    this.testResults.set(state.testResults);
    this.showSidePanel.set(state.showSidePanel);
    this.sortColumn.set(state.sortColumn);
    this.sortDirection.set(state.sortDirection);
    this.contractOptions.set(state.contractOptions);
    this.batchOptions.set(state.batchOptions);
    this.legendData.set(state.legendData);
    this.sampleAgeConfig.set(state.sampleAgeConfig);
    this.reconciled.set(state.reconciled);
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      contractId: [''],
      contractIdDescription: [{ value: '', disabled: true }],
      batchId: ['']
    });

    this.searchForm.get('contractId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(contractId => {
        this.updateContractDescription(contractId);
        this.loadBatchOptions(contractId);
      });
  }

  private loadContractOptions(): void {
    this.releaseTestResultsService.getContractOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => this.contractOptions.set(options),
        error: (err) => console.error('Failed to load contract options:', err)
      });
  }

  private loadBatchOptions(contractId: string): void {
    if (!contractId) {
      this.batchOptions.set([]);
      return;
    }
    this.releaseTestResultsService.getBatchOptions(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => this.batchOptions.set(options),
        error: (err) => console.error('Failed to load batch options:', err)
      });
  }

  private readonly defaultLegendData: CollectionDayLegendItem[] = [
    { code: 'WHITE',  description: '0-2 Days Old' },
    { code: 'YELLOW', description: '3-4 Days Old' },
    { code: 'GREEN',  description: '5 Days Old' },
    { code: 'RED',    description: '6-7 Days Old' },
    { code: 'BLUE',   description: '8+ Days Old' }
  ];

  private loadLegendData(): void {
    this.releaseTestResultsService.getCollectionDayLegend()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => this.legendData.set(items.length > 0 ? items : this.defaultLegendData),
        error: () => this.legendData.set(this.defaultLegendData)
      });
  }

  private loadSampleAgeConfig(): void {
    this.releaseTestResultsService.getSampleAgeConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => this.sampleAgeConfig.set(config),
        error: (err) => console.error('Failed to load sample age config:', err)
      });
  }

  private updateContractDescription(contractId: string): void {
    const contract = this.contractOptions().find(c => c.contractId === contractId);
    this.searchForm.patchValue(
      { contractIdDescription: contract?.company || '' },
      { emitEvent: false }
    );
  }

  get f() {
    return this.searchForm.controls;
  }

  onRetrieve(): void {
    this.submitted.set(true);

    if (!this.searchForm.value.contractId) {
      this.snackbarService.showError('Contract ID is required');
      return;
    }

    const request: ReleaseTestResultSearchRequest = {
      contractId: this.searchForm.value.contractId,
      batchId: this.searchForm.value.batchId || null,
      sortColumn: this.sortColumn(),
      sortOrder: this.sortDirection()
    };

    this.loading.set(true);
    this.error.set(null);
    this.selection.clear();
    this.reconciled.set(false);

    this.releaseTestResultsService.searchUnits(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.searchResults.set(response);
          this.unitsData.set(response.units);
          this.loading.set(false);
          if (response.units?.length > 0) {
            this.onRowClick(response.units[0], 0);
          } else {
            this.showSidePanel.set(false);
            this.selectedUnit.set(null);
            this.testResults.set([]);
          }
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'An error occurred';
          this.error.set(msg);
          this.loading.set(false);
          this.snackbarService.showError(msg, 'DISMISS');
        }
      });
  }

  onClearAll(): void {
    this.releaseTestResultsService.clearState();
    this.searchForm.patchValue({
      contractId: '',
      contractIdDescription: '',
      batchId: ''
    });
    this.batchOptions.set([]);
    this.searchResults.set(null);
    this.unitsData.set([]);
    this.selection.clear();
    this.showSidePanel.set(false);
    this.selectedUnit.set(null);
    this.testResults.set([]);
    this.submitted.set(false);
    this.error.set(null);
    this.reconciled.set(false);
  }

  onRowClick(unit: ReleaseTestResultUnit, index: number): void {
    this.selectedUnit.set(unit);
    this.selectedUnitIndex.set(index);
    this.showSidePanel.set(true);
    this.loadTestResults(unit.unitId, unit.collDate);
  }

  private loadTestResults(unitId: string, collDate: string): void {
    this.testResultsLoading.set(true);
    const dateStr = moment(collDate).format('YYYY-MM-DD');

    this.releaseTestResultsService.getUnitTestResults(unitId, dateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.testResults.set(results);
          this.testResultsLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load test results:', err);
          this.testResults.set([]);
          this.testResultsLoading.set(false);
        }
      });
  }

  onPreviousUnit(): void {
    const currentIndex = this.selectedUnitIndex();
    if (currentIndex > 0) {
      const units = this.searchResults()?.units ?? [];
      this.onRowClick(units[currentIndex - 1], currentIndex - 1);
    }
  }

  onNextUnit(): void {
    const currentIndex = this.selectedUnitIndex();
    const units = this.searchResults()?.units ?? [];
    if (currentIndex < units.length - 1) {
      this.onRowClick(units[currentIndex + 1], currentIndex + 1);
    }
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.unitsData().length;
    return numSelected === numRows && numRows > 0;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.unitsData().forEach(row => this.selection.select(row));
    }
  }

  onReconcileAllUnits(): void {
    const units = this.searchResults()?.units ?? [];
    if (units.length === 0) return;

    const unitsToEvaluate = units.filter(u => !u.qcTestFlag || u.qcTestFlag === 'N');
    if (unitsToEvaluate.length === 0) {
      this.reconciled.set(true);
      this.snackbarService.showSuccess('All units already have QC flags assigned.', 'DISMISS');
      return;
    }

    const request: AutoDetermineQcFlagRequest = {
      contractId: this.searchForm.value.contractId || '',
      batchId: this.searchForm.value.batchId || null,
      units: unitsToEvaluate.map(u => ({ unitId: u.unitId, collDate: u.collDate }))
    };

    this.reconciling.set(true);

    this.releaseTestResultsService.autoDetermineQcFlags(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const updatedUnits = units.map(unit => {
            if (unit.qcTestFlag === 'Y' || unit.qcTestFlag === 'T') {
              return unit;
            }
            const determined = response.units.find(u => u.unitId === unit.unitId);
            if (determined) {
              return {
                ...unit,
                qcTestFlag: determined.qcTestFlag,
                serumPlasmaInd: determined.serumPlasmaInd,
                redTubeFlag: determined.redTubeFlag,
                redTube2Flag: determined.redTube2Flag,
                purpleTubeFlag: determined.purpleTubeFlag
              };
            }
            return unit;
          });

          const currentResults = this.searchResults();
          if (currentResults) {
            this.searchResults.set({ ...currentResults, units: updatedUnits });
            this.unitsData.set(updatedUnits);
          }

          this.reconciling.set(false);
          this.reconciled.set(true);
          const successMsg = response.message || `All units in [${this.searchForm.value.batchId || 'batch'}] have been successfully reconciled.`;
          this.snackbarService.showSuccess(successMsg, 'DISMISS');
        },
        error: (err) => {
          this.reconciling.set(false);
          this.snackbarService.showError(err.message, 'DISMISS');
        }
      });
  }

  async onSave(): Promise<void> {
    const units = this.searchResults()?.units ?? [];
    if (units.length === 0) return;

    const confirmed = await this.confirmPartialSave();
    if (!confirmed) return;

    const contractId = this.searchForm.value.contractId || '';
    const batchId = this.searchForm.value.batchId || null;

    const request: ReleaseTestResultsRequest = {
      contractId,
      batchId,
      performCommit: true,
      units: units.map(u => ({
        unitId: u.unitId,
        collDate: u.collDate,
        qcTestFlag: u.qcTestFlag || 'N'
      }))
    };

    this.saving.set(true);

    this.releaseTestResultsService.releaseTestResults(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          const successMsg = response.message || `QC for [${batchId || 'batch'}] have been successfully saved.`;
          this.snackbarService.showSuccess(successMsg, 'DISMISS');
          this.searchResults.set(null);
          this.unitsData.set([]);
          this.selectedUnit.set(null);
          this.testResults.set([]);
          this.showSidePanel.set(false);
          this.reconciled.set(false);
        },
        error: (err) => {
          this.saving.set(false);
          this.snackbarService.showError(err.message, 'DISMISS');
        }
      });
  }

  private async confirmPartialSave(): Promise<boolean> {
    const units = this.searchResults()?.units ?? [];
    const unreconciledCount = units.filter(u => !u.qcTestFlag || u.qcTestFlag === '').length;

    if (unreconciledCount === 0) return true;

    const dialogRef = this.dialog.open(MessageDialog, {
      width: '400px',
      data: {
        title: 'Confirm Save',
        message: `There are ${unreconciledCount} units which are not reconciled. Do you want to proceed?`,
        icon: 'warning',
        primaryAction: { label: 'Save', action: 'save' },
        secondaryAction: { label: 'Cancel', action: 'cancel' }
      }
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    return result === 'save';
  }

  onShowLegend(): void {
    this.dialog.open(LegendDialogComponent, {
      width: '500px',
      autoFocus: true,
      disableClose: false,
      data: { legendData: this.legendData() }
    });
  }

  onHoldsQuery(): void {
    this._preserveState = true;
    this.router.navigate([ROUTE_REGISTRY[RouteKey.TestBatchesInHoldingAreaQuery].path]);
  }

  onSamplesQuery(): void {
    const unit = this.selectedUnit();
    if (unit) {
      this._preserveState = true;
      this.router.navigate([ROUTE_REGISTRY[RouteKey.SamplesQuery].path], {
        queryParams: { unitId: unit.unitId, chapterId: unit.chapterId }
      });
    }
  }

  onPrintReport(): void {
    const unit = this.selectedUnit();
    if (!unit) {
      this.snackbarService.showError('Select a unit to print report');
      return;
    }
    this.releaseTestResultsService.submitReport(unit.unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => this.snackbarService.showSuccess(
          `Report submitted (Job ID: ${result?.jobId})`, 'DISMISS'),
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'Failed to submit report';
          this.snackbarService.showError(msg, 'DISMISS');
        }
      });
  }

  onSortChange(): void {
    this.sortDirection.update(d => d === 'ASC' ? 'DESC' : 'ASC');
    this.onRetrieve();
  }

  getCollectionDateClass(collDate: string): string {
    if (!collDate) return '';
    const chapterToday = this.chapterTimezoneService.isChapterLocalDateAvailable()
      ? this.chapterTimezoneService.getChapterLocalDate()
      : moment();
    const collection = moment(collDate);
    const daysDiff = chapterToday.diff(collection, 'days');

    const config = this.sampleAgeConfig();
    if (config.length > 0) {
      const match = config.find(c => daysDiff >= c.minDays && daysDiff <= c.maxDays);
      return match ? `date-${match.code.toLowerCase()}` : '';
    }
    // Fallback if config not loaded
    if (daysDiff <= 2) return 'date-white';
    if (daysDiff <= 4) return 'date-yellow';
    if (daysDiff === 5) return 'date-green';
    if (daysDiff <= 7) return 'date-red';
    return 'date-blue';
  }

  formatDate(value: string): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  closeSidePanel(): void {
    this.showSidePanel.set(false);
    this.selectedUnit.set(null);
    this.testResults.set([]);
  }
}
