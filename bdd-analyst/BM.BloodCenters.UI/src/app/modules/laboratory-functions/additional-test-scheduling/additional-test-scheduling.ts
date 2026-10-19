import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, forkJoin, of, firstValueFrom } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';

import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { convertUTCToTimezone } from '@shared/date/timezone.util';
import { PageHeaderService } from '@shared/services/page-header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { TestLookupDialogComponent } from './components/test-lookup-dialog/test-lookup-dialog';
import { SampleTypeSelectionDialogComponent } from './components/sample-type-selection-dialog/sample-type-selection-dialog';
import { OverrideDialogComponent } from './components/override-dialog/override-dialog';
import { AdditionalTestSchedulingApiService } from './services/additional-test-scheduling-api.service';

import {
  ValidTestDto,
  ScannedUnit,
  ScheduleTestResponseDto,
  ScheduledTestWithStatus,
  SampleTypeSelectionDialogData,
  OverrideDialogData,
  SccStatusResponseDto
} from './models/additional-test-scheduling.model';

@Component({
  selector: 'app-additional-test-scheduling',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
    UnitIdFieldComponent
  ],
  templateUrl: './additional-test-scheduling.html',
  styleUrl: './additional-test-scheduling.scss'
})
export class AdditionalTestSchedulingComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `additional-test-scheduling-${AdditionalTestSchedulingComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild('unitIdField') unitIdField!: UnitIdFieldComponent;

  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly apiService = inject(AdditionalTestSchedulingApiService);
  private readonly destroy$ = new Subject<void>();
  private isDestroyed = false;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle,
          actions: []
        };
      }
    });
  }

  protected readonly selectedTests = signal<ValidTestDto[]>([]);
  protected readonly scannedUnits = signal<ScannedUnit[]>([]);
  protected readonly selectedUnitId = signal<string | null>(null);
  protected readonly selectedUnitTests = signal<ScheduledTestWithStatus[]>([]);
  protected readonly selectedTestsForScheduling = signal<Set<string>>(new Set());
  protected readonly searchKeyword = signal<string>('');
  protected readonly statusSortDirection = signal<'ASC' | 'DESC' | null>(null);
  protected readonly loadingTests = signal<boolean>(false);
  protected readonly schedulingTests = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  protected readonly hasSelectedTests = computed(() => this.selectedTests().length > 0);
  protected readonly hasScannedUnits = computed(() => this.scannedUnits().length > 0);
  protected readonly hasSelectedUnit = computed(() => this.selectedUnitId() !== null);
  protected readonly unscheduledTestsCount = computed(() =>
    this.filteredUnscheduledTests().filter(t => this.selectedTestsForScheduling().has(t.testId)).length
  );
  protected readonly canScheduleTests = computed(() =>
    this.hasSelectedUnit() && this.unscheduledTestsCount() > 0 && !this.schedulingTests()
  );

  protected readonly unscheduledTests = computed(() =>
    this.selectedUnitTests().filter(t => !t.isScheduled)
  );
  protected readonly filteredTests = computed(() => {
    const keyword = this.searchKeyword().toLowerCase();
    const direction = this.statusSortDirection();
    let tests = this.selectedUnitTests();
    if (keyword) {
      tests = tests.filter(test =>
        test.testId.toLowerCase().includes(keyword) ||
        (test.testDesc?.toLowerCase().includes(keyword) ?? false) ||
        (test.result || 'NR').toLowerCase().includes(keyword)
      );
    }
    if (direction) {
      tests = [...tests].sort((a, b) =>
        direction === 'ASC'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status)
      );
    }
    return tests;
  });
  protected readonly filteredUnscheduledTests = computed(() =>
    this.filteredTests().filter(t => !t.isScheduled)
  );
  protected readonly isAllUnscheduledSelected = computed(() => {
    const unscheduled = this.filteredUnscheduledTests();
    return unscheduled.length > 0 && unscheduled.every(t => this.selectedTestsForScheduling().has(t.testId));
  });
  protected readonly isSomeUnscheduledSelected = computed(() => {
    const unscheduled = this.filteredUnscheduledTests();
    return unscheduled.some(t => this.selectedTestsForScheduling().has(t.testId)) && !this.isAllUnscheduledSelected();
  });

  testsPerformedColumns = ['checkbox', 'status', 'testId', 'testDesc', 'sequence', 'result', 'testBatchId'];

  protected readonly scannedUnitsTableConfig: DataTableConfig<ScannedUnit> = {
    columns: [
      {
        key: 'sequence',
        header: 'Seq',
        sortable: false,
        width: '40px',
        valueFormatter: (_: any, row: ScannedUnit) => {
          const index = this.scannedUnits().findIndex(u => u.unitId === row.unitId);
          return index >= 0 ? String(index + 1) : '';
        },
      },
      { key: 'unitId', header: 'Unit ID', sortable: false },
      { key: 'catalogNumber', header: 'Catalog #', sortable: false, valueFormatter: (value: string | null) => value || '—' },
      {
        key: 'collectionDate',
        header: 'Collection Date',
        sortable: false,
        valueFormatter: (value: string | null) => this.formatDate(value),
      },
    ],
    rowActions: [
      { action: 'delete', icon: 'delete', color: 'warn' },
    ],
    showPagination: false,
    emptyMessage: 'No units scanned yet',
    emptySubMessage: 'Scan or enter a Unit ID to begin',
    enableRowHighlight: true,
  };

  protected readonly testSearchConfig: SearchBarConfig = {
    placeholder: 'Search by test ID or result',
    ariaLabel: 'Search tests performed on unit',
    minLength: 1,
    searchOnEnterOnly: true,
  };

  ngOnInit(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.selectedTests.set([]);
        this.scannedUnits.set([]);
        this.selectedUnitTests.set([]);
        this.selectedUnitId.set(null);
        this.selectedTestsForScheduling.set(new Set());
        this.unitIdField?.clear();
      });
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLookupTests(): void {
    const dialogRef = this.dialog.open(TestLookupDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { selectedTests: this.selectedTests() },
      disableClose: false
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result: ValidTestDto[] | null) => {
      if (result) {
        this.selectedTests.set(result);
        const currentUnit = this.selectedUnitId();
        if (currentUnit) {
          this.loadUnitTests(currentUnit);
        }
      }
    });
  }

  removeTest(testId: string): void {
    this.selectedTests.set(this.selectedTests().filter(t => t.testId !== testId));
    this.selectedTestsForScheduling.update(s => { const n = new Set(s); n.delete(testId); return n; });
    const currentUnit = this.selectedUnitId();
    if (currentUnit) {
      this.loadUnitTests(currentUnit);
    }
  }

  onClearAllTests(): void {
    this.selectedTests.set([]);
    this.selectedUnitTests.set([]);
    this.selectedTestsForScheduling.set(new Set());
  }

  /**
   * Called by UnitIdFieldComponent after shared validation passes.
   * We validate the unit against the chapter, then confirm or reject the field.
   */
  onPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;

    if (!unitId) {
      event.reject('Invalid unit ID');
      return;
    }

    // Already in list — select it and clear the field
    if (this.scannedUnits().some(u => u.unitId === unitId)) {
      this.error.set(null);
      event.confirm();
      setTimeout(() => this.unitIdField?.clear(), 0);
      this.onSelectUnit(unitId);
      return;
    }

    if (!this.hasSelectedTests()) {
      event.reject('Please select tests before scanning units');
      return;
    }

    this.apiService.validateUnit(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (unit) => {
          const currentChapterId = this.headerService.getCurrentChapterId();
          if (unit.chapterId && unit.chapterId !== currentChapterId) {
            event.reject('Unit belongs to a different chapter and cannot be scheduled here.');
            return;
          }
          const scannedUnit: ScannedUnit = {
            unitId: unit.unitId,
            chapterId: currentChapterId,
            collectionDate: unit.collDate || unit.collectionDate,
            catalogNumber: unit.catalogNumber,
            isValid: unit.isValid,
            scannedAt: new Date()
          };
          this.scannedUnits.update(units => [...units, scannedUnit]);
          this.error.set(null);
          event.confirm();
          setTimeout(() => this.unitIdField?.clear(), 0);
          if (unit.hasComponents && unit.componentCount > 0) {
            this.snackbarService.showInfo(
              `Unit ${unit.unitId} has ${unit.componentCount} component(s). Verify that additional testing applies to the whole unit.`
            );
          }
          this.onSelectUnit(scannedUnit.unitId);
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'Unit not found for current chapter';
          event.reject(msg);
        }
      });
  }

  onUnitIdCleared(): void {
    this.error.set(null);
  }

  onSelectUnit(unitId: string): void {
    this.selectedUnitId.set(unitId);
    this.selectedTestsForScheduling.set(new Set());
    this.searchKeyword.set('');
    this.statusSortDirection.set(null);
    this.loadUnitTests(unitId);
  }

  private loadUnitTests(unitId: string): void {
    if (!this.hasSelectedTests()) {
      this.selectedUnitTests.set([]);
      return;
    }

    const unit = this.scannedUnits().find(u => u.unitId === unitId);
    if (!unit) return;

    const testIds = this.selectedTests().map(t => t.testId);
    this.loadingTests.set(true);

    this.apiService.getExistingTests(unitId, unit.chapterId, testIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (existingTests) => {
          const existingMap = new Map(existingTests.map(t => [t.testId, t]));
          const merged: ScheduledTestWithStatus[] = this.selectedTests().map(test => {
            const existing = existingMap.get(test.testId);
            return {
              testId: test.testId,
              testDesc: test.testDesc,
              testSeqNo: existing?.testSeqNo ?? null,
              status: (existing?.status as 'Scheduled' | 'Unscheduled') ?? 'Unscheduled',
              result: existing?.result ?? null,
              testBatchId: existing?.testBatchId ?? null,
              isScheduled: existing?.status === 'Scheduled'
            };
          });
          this.selectedUnitTests.set(merged);
          this.loadingTests.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to load test statuses. Displayed statuses may be inaccurate — please refresh the unit.');
          this.selectedUnitTests.set(this.selectedTests().map(test => ({
            testId: test.testId,
            testDesc: test.testDesc,
            testSeqNo: null,
            status: 'Unscheduled' as const,
            result: null,
            testBatchId: null,
            isScheduled: false
          })));
          this.loadingTests.set(false);
        }
      });
  }

  onTestToggle(testId: string, isScheduled: boolean): void {
    if (isScheduled) return;
    const selected = new Set(this.selectedTestsForScheduling());
    if (selected.has(testId)) {
      selected.delete(testId);
    } else {
      selected.add(testId);
    }
    this.selectedTestsForScheduling.set(selected);
  }

  onToggleAllUnscheduled(checked: boolean): void {
    const selected = new Set(this.selectedTestsForScheduling());
    this.filteredUnscheduledTests().forEach(t => checked ? selected.add(t.testId) : selected.delete(t.testId));
    this.selectedTestsForScheduling.set(selected);
  }

  isTestSelectedForScheduling(testId: string): boolean {
    return this.selectedTestsForScheduling().has(testId);
  }

  onScheduleTests(): void {
    if (!this.canScheduleTests()) return;
    const unitId = this.selectedUnitId();
    if (!unitId) return;

    const dialogData: ConfirmActionDialogData = {
      title: 'Schedule Tests',
      message: 'Are you sure you want to schedule selected tests?',
      detail: `This action cannot be undone. The selected tests will be scheduled for unit ${unitId} and added to the testing workflow.`,
      confirmText: 'SCHEDULE SELECTION',
      cancelText: 'CANCEL'
    };

    this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      data: dialogData
    }).afterClosed().pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (confirmed) this.scheduleTestsConfirmed();
    });
  }

  private scheduleTestsConfirmed(): void {
    const unitId = this.selectedUnitId();
    if (!unitId) return;

    const unit = this.scannedUnits().find(u => u.unitId === unitId);
    if (!unit) return;

    const testIds = this.filteredUnscheduledTests()
      .filter(t => this.selectedTestsForScheduling().has(t.testId))
      .map(t => t.testId);
    if (!testIds.length) return;

    this.schedulingTests.set(true);

    const requests = testIds.map(testId =>
      this.apiService.scheduleTest(unit.unitId, unit.chapterId, testId).pipe(
        catchError((err: any) => of({ scheduled: false, message: (err?.error?.message || err?.message || null) as string | null }))
      )
    );

    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => { this.handleScheduleResults(results, testIds, unitId, unit); }
      });
  }

  private handleScheduleResults(
    results: Array<ScheduleTestResponseDto | { scheduled: boolean; message: string | null }>,
    testIds: string[],
    unitId: string,
    unit: ScannedUnit
  ): void {
    const failedEntries = testIds
      .map((id, i) => ({ id, scheduled: results[i]?.scheduled, message: results[i]?.message }))
      .filter(e => !e.scheduled);
    if (failedEntries.length) {
      const detail = failedEntries.map(e => e.id).join('; ');
      this.snackbarService.showError(`Failed to schedule: ${detail}`);
    }

    // FMB: POPULATE_UTRS only calls CREATE_SCC_RECORD for successfully inserted tests
    const anySucceeded = results.some(r => r?.scheduled);

    this.schedulingTests.set(false);
    this.selectedTestsForScheduling.set(new Set());
    this.loadUnitTests(unitId);

    if (anySucceeded) {
      void this.processConfirmatoryWorkflow(unitId, unit.chapterId);
    }
  }

  /**
   * FMB equivalent: CREATE_SCC_RECORD → HANDLE_MULTI_SAMPLE_TYPES → HANDLE_OVERRIDE
   * Called after all schedule API calls complete. Sequentially opens dialogs for any
   * SCC records that require user input (sample type selection or supervisor override).
   */
  private async processConfirmatoryWorkflow(unitId: string, chapterId: string): Promise<void> {
    let sccResponse: SccStatusResponseDto;
    try {
      sccResponse = await firstValueFrom(this.apiService.getSccStatus(unitId, chapterId));
    } catch {
      this.snackbarService.showError('Failed to retrieve confirmatory status. Please verify the unit manually.');
      return;
    }

    const sRecords = sccResponse.sccRecords.filter(r => r.statusFlag === 'S');

    // FMB HANDLE_MULTI_SAMPLE_TYPES: process each 'S' record (unit has multiple sample types)
    for (const record of sRecords) {
      if (this.isDestroyed) return;
      if (!record.availableSampleTypes?.length) {
        this.snackbarService.showError(`No sample types available for test ${record.testId}. Please contact support.`);
        continue;
      }
      const dialogData: SampleTypeSelectionDialogData = {
        unitId,
        testId: record.testId,
        availableSampleTypes: record.availableSampleTypes
      };
      const dialogRef = this.dialog.open(SampleTypeSelectionDialogComponent, {
        width: '400px',
        disableClose: true,
        data: dialogData
      });
      const selectedType = await firstValueFrom(dialogRef.afterClosed());
      if (selectedType) {
        try {
          await firstValueFrom(
            this.apiService.updateSccSampleType({ unitId, testId: record.testId, sampleType: selectedType, chapterId })
          );
        } catch (err: any) {
          this.snackbarService.showError(err?.error?.message || err?.message || `Failed to save sample type for test ${record.testId}. Please contact support.`);
        }
      }
    }

    // Re-query after sample-type updates: a selected sample type may not be in
    // valid_test_sample_types, causing the server to promote that record from 'S' to 'X'.
    // FMB HANDLE_OVERRIDE recurses after each sample-type commit, naturally catching these.
    if (sRecords.length > 0) {
      if (this.isDestroyed) return;
      try {
        sccResponse = await firstValueFrom(this.apiService.getSccStatus(unitId, chapterId));
      } catch {
        this.snackbarService.showError('Failed to retrieve confirmatory status after sample type update. Please verify the unit manually.');
        return;
      }
    }

    // FMB HANDLE_OVERRIDE: process each 'X' record (test not in valid_test_sample_types).
    // The dialog submits the override API call internally and stays open on credential failure,
    // matching FMB's behaviour of keeping OVR_BLK open until the commit succeeds.
    const xRecords = sccResponse.sccRecords.filter(r => r.statusFlag === 'X');
    for (const record of xRecords) {
      if (this.isDestroyed) return;
      const dialogRef = this.dialog.open(OverrideDialogComponent, {
        width: '480px',
        disableClose: true,
        data: { unitId, testId: record.testId, chapterId } as OverrideDialogData
      });
      await firstValueFrom(dialogRef.afterClosed());
    }
  }

  protected onScannedUnitRowAction(event: TableRowActionEvent<ScannedUnit>): void {
    if (event.action === 'delete') this.onRemoveUnit(event.row.unitId);
  }

  protected onScannedUnitRowClick(unit: ScannedUnit): void {
    this.onSelectUnit(unit.unitId);
  }

  protected onTestSearch(searchText: string): void {
    this.searchKeyword.set(searchText);
  }

  protected onSortByStatus(): void {
    const current = this.statusSortDirection();
    this.statusSortDirection.set(current === null ? 'ASC' : current === 'ASC' ? 'DESC' : null);
  }

  onRemoveUnit(unitId: string): void {
    this.scannedUnits.set(this.scannedUnits().filter(u => u.unitId !== unitId));
    if (this.selectedUnitId() === unitId) {
      this.selectedUnitId.set(null);
      this.selectedUnitTests.set([]);
      this.selectedTestsForScheduling.set(new Set());
    }
  }

  formatDate(value: string | null): string {
    if (!value) return 'N/A';
    const utc = new Date(value);
    if (isNaN(utc.getTime())) return 'N/A';
    const timezone = this.headerService.getCurrentChapterTimezone();
    const d = convertUTCToTimezone(utc, timezone);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    return `${day}-${month}-${d.getFullYear()}`;
  }
}
