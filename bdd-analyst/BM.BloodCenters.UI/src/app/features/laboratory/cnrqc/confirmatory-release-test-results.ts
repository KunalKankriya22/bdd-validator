import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';

import { RouteKey } from '@core/constants/route-keys';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';

import { ConfirmatoryQcService, CnrqcPageState } from './services/confirmatory-qc.service';
import { LegendDialogComponent } from './components/legend-dialog/legend-dialog';
import { ConfirmSaveDialogComponent } from './components/confirm-save-dialog/confirm-save-dialog';
import { QueryQcUnitsRequest } from './models/qc-query-request.model';
import { SummaryStats } from './models/qc-query-response.model';
import { QcUnitListItem } from './models/qc-unit-list-item.model';
import { QcUnitDetail } from './models/qc-unit-detail.model';
import { SaveQcFlagsRequest, UnitQcFlag } from './models/qc-save-request.model';
import {
  TestSeriesDropdownItem,
  TestDropdownItem,
} from './models/dropdown-options.model';

@Component({
  selector: 'app-confirmatory-release-test-results',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatCardModule,
    MatDialogModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './confirmatory-release-test-results.html',
  styleUrl: './confirmatory-release-test-results.scss',
})
export class ConfirmatoryReleaseTestResultsComponent
  implements OnInit, OnDestroy
{
  private static nextId = 0;
  protected readonly componentId = `cnrqc-${ConfirmatoryReleaseTestResultsComponent.nextId++}`;
  protected readonly elementId = (name: string) =>
    `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) =>
    `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) =>
    `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly qcService = inject(ConfirmatoryQcService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();
  private _preserveState = false;

  protected headerConfig = computed<PageHeaderConfig>(() => {
    const data = this.pageHeaderService.pageHeaderData();
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: data?.title || 'Confirmatory Release Test Results', link: null },
      ],
    };
  });

  protected readonly sessionId = signal<string | null>(null);
  protected readonly units = signal<QcUnitListItem[]>([]);
  protected readonly selectedUnit = signal<QcUnitListItem | null>(null);
  protected readonly unitDetail = signal<QcUnitDetail | null>(null);
  protected readonly currentUnitIndex = signal<number>(-1);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly summaryStats = signal<SummaryStats | null>(null);
  protected readonly qcChanges = signal<Map<string, string>>(new Map());
  protected readonly reconciled = signal<boolean>(false);

  protected readonly testSeriesLov = signal<TestSeriesDropdownItem[]>([]);
  protected readonly testsLov = signal<TestDropdownItem[]>([]);
  protected readonly allResultsOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' },
  ];
  protected readonly qcOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' },
  ];

  private readonly selectedSeriesId = signal<string | null>(null);
  private readonly selectedTestId = signal<string | null>(null);

  protected readonly testSeriesSearchCtrl = new FormControl('');
  private readonly testSeriesSearchText = signal('');
  protected readonly filteredTestSeries = computed(() => {
    const s = this.testSeriesSearchText().toLowerCase();
    return !s
      ? this.testSeriesLov()
      : this.testSeriesLov().filter((ts) =>
          ts.testSeriesId.toLowerCase().includes(s)
        );
  });

  protected readonly testSearchCtrl = new FormControl('');
  private readonly testSearchText = signal('');
  protected readonly filteredTests = computed(() => {
    const s = this.testSearchText().toLowerCase();
    return !s
      ? this.testsLov()
      : this.testsLov().filter((t) => t.testId.toLowerCase().includes(s));
  });

  protected readonly hasUnits = computed(() => this.units().length > 0);
  protected readonly canSave = computed(() => this.qcChanges().size > 0 || this.reconciled());
  protected readonly totalUnits = computed(
    () => this.summaryStats()?.totalUnits ?? 0
  );
  protected readonly currentUnitDisplay = computed(() => {
    const index = this.currentUnitIndex();
    const total = this.units().length;
    return index >= 0 && total > 0 ? `Unit ${index + 1} of ${total}` : '';
  });
  protected readonly canNavigatePrev = computed(
    () => this.currentUnitIndex() > 0
  );
  protected readonly canNavigateNext = computed(
    () => this.currentUnitIndex() < this.units().length - 1
  );

  protected readonly unitsTableColumns = computed(() => {
    return ['unitId', 'tubeCheckIn', 'collectionDate', 'reason', 'qc'];
  });

  protected readonly testResultsTableColumns = computed(() => {
    return ['sequence', 'testId', 'result', 'description'];
  });

  filterForm!: FormGroup;
  protected readonly submitted = signal<boolean>(false);

  protected readonly selectedTestSeriesDescription = computed(() => {
    const seriesId = this.selectedSeriesId();
    if (!seriesId) return '-';
    const series = this.testSeriesLov().find((s) => s.testSeriesId === seriesId);
    return series?.description || '-';
  });

  protected readonly selectedTestDescription = computed(() => {
    const testId = this.selectedTestId();
    if (!testId) return '-';
    const test = this.testsLov().find((t) => t.testId === testId);
    return test?.testDescription || '-';
  });

  protected readonly selectedUnitDisplay = computed(() => {
    const unit = this.selectedUnit();
    const detail = this.unitDetail();
    if (!unit) return '';
    const checkDigit = detail?.checkDigit || unit.checkDigit;
    return checkDigit ? `${unit.unitId}-${checkDigit}` : unit.unitId;
  });

  ngOnInit(): void {
    this.initFilterForm();
    this.setupFormListeners();
    this.setupSearchListeners();
    this.subscribeToChapterChanges();

    const saved = this.qcService.savedState;
    if (saved) {
      this.restoreState(saved);
      this.qcService.clearState();
    } else {
      this.loadDropdownData();
    }
  }

  ngOnDestroy(): void {
    if (this._preserveState && this.hasUnits()) {
      this.qcService.saveState(this.captureState());
    } else {
      this.qcService.clearState();
      const session = this.sessionId();
      if (session) {
        this.qcService.clearSession(session).pipe(take(1)).subscribe();
      }
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private captureState(): CnrqcPageState {
    return {
      formValues: this.filterForm.getRawValue(),
      sessionId: this.sessionId(),
      units: this.units(),
      selectedUnit: this.selectedUnit(),
      unitDetail: this.unitDetail(),
      currentUnitIndex: this.currentUnitIndex(),
      summaryStats: this.summaryStats(),
      qcChanges: this.qcChanges(),
      testSeriesLov: this.testSeriesLov(),
      testsLov: this.testsLov(),
    };
  }

  private restoreState(state: CnrqcPageState): void {
    this.filterForm.patchValue(state.formValues, { emitEvent: false });
    this.sessionId.set(state.sessionId);
    this.units.set(state.units);
    this.selectedUnit.set(state.selectedUnit);
    this.unitDetail.set(state.unitDetail);
    this.currentUnitIndex.set(state.currentUnitIndex);
    this.summaryStats.set(state.summaryStats);
    this.qcChanges.set(state.qcChanges);
    this.testSeriesLov.set(state.testSeriesLov);
    this.testsLov.set(state.testsLov);
  }

  private initFilterForm(): void {
    this.filterForm = this.fb.group({
      allResults: ['Y'],
      testSeriesId: [null],
      testId: [null],
    });
  }

  private loadDropdownData(): void {
    this.loading.set(true);

    this.qcService
      .getTestSeries()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (series) => {
          this.testSeriesLov.set(series);
          this.loading.set(false);
        },
        error: (err) => {
          this.snackbarService.showError(err.message || 'Failed to load test series');
          this.loading.set(false);
        },
      });

    this.qcService
      .getTests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => this.testsLov.set(tests),
        error: (err) =>
          this.snackbarService.showError(err.message || 'Failed to load tests'),
      });
  }

  private setupFormListeners(): void {
    this.filterForm
      .get('testSeriesId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.selectedSeriesId.set(value));

    this.filterForm
      .get('testId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.selectedTestId.set(value));
  }

  private setupSearchListeners(): void {
    this.testSeriesSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.testSeriesSearchText.set(v || ''));

    this.testSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.testSearchText.set(v || ''));
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadDropdownData();
      });
  }

  protected onRetrieve(): void {
    this.submitted.set(true);

    const formValue = this.filterForm.value;

    const request: QueryQcUnitsRequest = {
      allResults: formValue.allResults,
      testSeriesId: formValue.testSeriesId,
      testId: formValue.testId,
      contractId: null,
      batchId: null,
    };

    this.loading.set(true);
    this.error.set(null);

    this.qcService
      .queryUnits(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.sessionId.set(response.sessionId);
          this.units.set(response.units);
          this.summaryStats.set(response.summaryStats);
          this.loading.set(false);

          if (response.units.length > 0) {
            this.selectUnit(response.units[0], 0);
          }
        },
        error: (err) => {
          this.error.set(
            err.error?.message || 'Failed to retrieve QC units'
          );
          this.loading.set(false);
        },
      });
  }

  protected onClearAll(): void {
    this.filterForm.reset({ allResults: 'Y' });
    this.selectedSeriesId.set(null);
    this.selectedTestId.set(null);
    this.submitted.set(false);
    this.units.set([]);
    this.selectedUnit.set(null);
    this.unitDetail.set(null);
    this.currentUnitIndex.set(-1);
    this.summaryStats.set(null);
    this.qcChanges.set(new Map());
    this.reconciled.set(false);
    this.error.set(null);

    const session = this.sessionId();
    if (session) {
      this.qcService
        .clearSession(session)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
      this.sessionId.set(null);
    }
  }

  protected selectUnit(unit: QcUnitListItem, index: number): void {
    const session = this.sessionId();
    if (!session) return;

    this.selectedUnit.set(unit);
    this.currentUnitIndex.set(index);
    this.loading.set(true);

    this.qcService
      .getUnitDetail(session, unit.unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          this.unitDetail.set(detail);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(
            err.error?.message || 'Failed to load unit detail'
          );
          this.loading.set(false);
        },
      });
  }

  protected onPreviousUnit(): void {
    const index = this.currentUnitIndex();
    if (index > 0) {
      const unit = this.units()[index - 1];
      this.selectUnit(unit, index - 1);
    }
  }

  protected onNextUnit(): void {
    const index = this.currentUnitIndex();
    const total = this.units().length;
    if (index < total - 1) {
      const unit = this.units()[index + 1];
      this.selectUnit(unit, index + 1);
    }
  }

  protected onQcChange(unitId: string, qcValue: string): void {
    if (qcValue === 'Y') {
      const unit = this.units().find((u) => u.unitId === unitId);
      if (unit?.hasWarning) {
        this.snackbarService.showInfo(
          `Unit ${unitId} has unresolved issues (${unit.reason}). Review before saving.`
        );
      }
    }

    const changes = new Map(this.qcChanges());
    changes.set(unitId, qcValue);
    this.qcChanges.set(changes);

    const updatedUnits = this.units().map((unit) =>
      unit.unitId === unitId ? { ...unit, qcFlag: qcValue } : unit
    );
    this.units.set(updatedUnits);
  }

  protected onReconcileAll(): void {
    const session = this.sessionId();
    if (!session) return;

    this.loading.set(true);

    this.qcService
      .reconcileAll(session)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess(
            `All units in session ${session} have been successfully reconciled.`
          );
          this.loading.set(false);
          this.reconciled.set(true);
          this.reloadUnitsList();
        },
        error: (err) => {
          this.snackbarService.showError(
            err.error?.message || 'Failed to reconcile units'
          );
          this.loading.set(false);
        },
      });
  }

  private reloadUnitsList(): void {
    const session = this.sessionId();
    if (!session) return;

    this.qcService
      .getUnits(session)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          this.units.set(units);
          this.qcChanges.set(new Map());
        },
        error: (err) => {
          this.snackbarService.showError(err.message || 'Failed to reload units');
        },
      });
  }

  protected onSave(): void {
    const session = this.sessionId();
    if (!session) return;

    const allUnits = this.units();
    const allReconciled = allUnits.every(
      (u) => u.qcFlag === 'Y' || u.qcFlag === 'N'
    );
    const allApproved = allUnits.every((u) => u.qcFlag === 'Y');

    if (!allReconciled || !allApproved) {
      const dialogRef = this.dialog.open(ConfirmSaveDialogComponent, {
        width: '400px',
        disableClose: true,
      });

      dialogRef
        .afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((confirmed: boolean) => {
          if (confirmed) {
            this.executeSave(session, true);
          }
        });
    } else {
      this.executeSave(session, false);
    }
  }

  private executeSave(session: string, confirmPartial: boolean): void {
    const unitQcFlags: UnitQcFlag[] = this.units().map((unit) => ({
      unitId: unit.unitId,
      qcFlag: unit.qcFlag || 'N',
      qcReason: unit.reason ?? null,
    }));

    const request: SaveQcFlagsRequest = {
      sessionId: session,
      unitQcFlags,
      confirmPartialReconciliation: confirmPartial,
    };

    this.loading.set(true);

    this.qcService
      .save(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess(
            'QC flags have been successfully saved.'
          );
          this.loading.set(false);
          this.qcChanges.set(new Map());
          this.sessionId.set(null);
          this.onClearAll();
        },
        error: (err) => {
          this.snackbarService.showError(
            err.error?.message || 'Failed to save QC flags'
          );
          this.loading.set(false);
        },
      });
  }

  protected onShowLegend(): void {
    this.dialog.open(LegendDialogComponent, {
      width: '500px',
      disableClose: false,
    });
  }

  protected onHoldsQuery(): void {
    this._preserveState = true;
    this.router.navigate([ROUTE_REGISTRY[RouteKey.TestBatchesInHoldingAreaQuery].path]);
  }

  protected onSamplesQuery(): void {
    const unit = this.selectedUnit();
    if (unit) {
      this._preserveState = true;
      this.router.navigate([ROUTE_REGISTRY[RouteKey.SamplesQuery].path], {
        queryParams: { unitId: unit.unitId },
        state: { alreadyParsed: true, fromConfirmatoryRelease: true },
      });
    }
  }

  protected getCollectionDateClass(color: string | null | undefined): string {
    if (!color) return '';
    switch (color.toUpperCase()) {
      case 'WHITE':
        return 'collection-date-white';
      case 'YELLOW':
        return 'collection-date-yellow';
      case 'GREEN':
        return 'collection-date-green';
      case 'RED':
        return 'collection-date-red';
      case 'BLUE':
        return 'collection-date-blue';
      default:
        return '';
    }
  }

  protected getCollectionDateAgeLabel(color: string | null | undefined): string {
    if (!color) return '';
    switch (color.toUpperCase()) {
      case 'WHITE':
        return '0-2 days';
      case 'YELLOW':
        return '3-4 days';
      case 'GREEN':
        return '5 days';
      case 'RED':
        return '6-7 days';
      case 'BLUE':
        return '8+ days';
      default:
        return '';
    }
  }

  get f() {
    return this.filterForm.controls;
  }
}
