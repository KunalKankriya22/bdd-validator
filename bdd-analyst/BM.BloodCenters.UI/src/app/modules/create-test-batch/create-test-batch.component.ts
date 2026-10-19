import { Component, computed, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { CreateTestBatchService } from './services/create-test-batch.service';
import {
  OpenBatch, ValidTest, TestRow, UnitRow, PrintableTest,
  CreateTestBatchRequest, AddTestDto, AddUnitDto
} from './models/create-test-batch.model';
import { TestGridComponent } from './components/test-grid/test-grid.component';
import { UnitGridComponent } from './components/unit-grid/unit-grid.component';
import { PrintPanelComponent } from './components/print-panel/print-panel.component';

@Component({
  selector: 'app-create-test-batch',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    TestGridComponent,
    UnitGridComponent,
    PrintPanelComponent,
  ],
  templateUrl: './create-test-batch.component.html',
  styleUrls: ['./create-test-batch.component.scss'],
})
export class CreateTestBatchComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly service = inject(CreateTestBatchService);

  readonly selectPanelLoadingValue = '__loading__';
  readonly selectPanelEmptyValue = '__empty__';

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
    return { breadcrumbs: [{ label: 'Home', link: '/home' }], title: '', subtitle: '' };
  });

  readonly batchControl = new FormControl<OpenBatch | null>(null);
  readonly batchSearchControl = new FormControl('');
  readonly startSeqControl = new FormControl<number | null>({ value: null, disabled: true }, { validators: [Validators.required, Validators.min(1)] });

  readonly isLoading = signal(false);
  readonly isLoadingBatches = signal(false);
  readonly isLoadingTests = signal(false);
  readonly batchMode = signal<'none' | 'new' | 'existing'>('none');
  readonly currentBatchId = signal<string | null>(null);
  readonly openBatches = signal<OpenBatch[]>([]);
  readonly validTests = signal<ValidTest[]>([]);
  readonly tests = signal<TestRow[]>([]);
  readonly units = signal<UnitRow[]>([]);
  readonly showPrintPanel = signal(false);
  readonly printableTests = signal<PrintableTest[]>([]);
  readonly savedBatchId = signal<string | null>(null);

  readonly filteredBatches = computed(() => {
    const q = this.batchSearchControl.value?.toLowerCase() ?? '';
    const all = this.openBatches();
    return q ? all.filter(b => b.tbId.toLowerCase().includes(q) || b.insertDate?.toLowerCase().includes(q)) : all;
  });

  readonly showContent = computed(() => this.batchMode() !== 'none');
  readonly canSave = computed(() => {
    const seqVal = Number(this.startSeqControl.value ?? this.startSeqControl.getRawValue()) || 0;
    return this.tests().length > 0
      && this.tests().every(t => !!t.testId)
      && this.units().length > 0
      && seqVal >= 1
      && !this.isLoading();
  });

  compareBatch = (a: OpenBatch | null, b: OpenBatch | null): boolean =>
    a?.tbId === b?.tbId;

  ngOnInit(): void {
    this.loadOpenBatches();
    this.loadValidTests();
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
        this.onClear();
        this.openBatches.set([]);
        this.validTests.set([]);
        this.loadOpenBatches();
        this.loadValidTests();
      });
  }

  private loadOpenBatches(): void {
    this.isLoadingBatches.set(true);
    this.service.getOpenBatches()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.openBatches.set(res.success && res.data ? res.data : []);
          this.isLoadingBatches.set(false);
        },
        error: () => this.isLoadingBatches.set(false),
      });
  }

  private loadValidTests(): void {
    this.isLoadingTests.set(true);
    this.service.getValidTests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.validTests.set(res.success && res.data ? res.data : []);
          this.isLoadingTests.set(false);
        },
        error: () => this.isLoadingTests.set(false),
      });
  }

  onRetrieve(): void {
    const batch = this.batchControl.value;
    if (!batch) return;

    this.isLoading.set(true);
    this.service.getBatchById(batch.tbId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.item) {
            this.batchMode.set('existing');
            this.currentBatchId.set(batch.tbId);
            this.startSeqControl.enable({ emitEvent: false });
            this.startSeqControl.setValue(res.item.startWorkNumber ?? 1);
            this.startSeqControl.disable({ emitEvent: false });
            this.tests.set(res.item.tests.map(t => ({
              testId: t.testId,
              testDesc: t.testDesc ?? '',
              testKitId: t.testKitId,
              testGroup: t.testGroup,
              autoSchedule: t.autoSchedule,
              antigenFlag: t.antigenFlag,
            })));
            this.units.set(res.item.units.map(u => ({
              seqNo: u.seqNo ?? 0,
              unitId: u.unitId,
              collDate: u.collDate,
              chapterId: u.chapterId,
            })));
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  onCreateNewBatch(): void {
    this.batchMode.set('new');
    this.currentBatchId.set(null);
    this.batchControl.setValue(null, { emitEvent: false });
    this.batchControl.disable({ emitEvent: false });
    this.startSeqControl.enable({ emitEvent: false });
    this.startSeqControl.setValue(null);
    this.tests.set([]);
    this.units.set([]);
  }

  onClear(): void {
    this.batchMode.set('none');
    this.currentBatchId.set(null);
    this.batchControl.enable({ emitEvent: false });
    this.batchControl.setValue(null, { emitEvent: false });
    this.batchSearchControl.setValue('', { emitEvent: false });
    this.startSeqControl.setValue(null);
    this.startSeqControl.disable({ emitEvent: false });
    this.tests.set([]);
    this.units.set([]);
    this.showPrintPanel.set(false);
  }

  onSeqKeyDown(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowed.includes(event.key)) return;
    if (event.key < '0' || event.key > '9') {
      event.preventDefault();
    }
  }

  onTestsChanged(tests: TestRow[]): void {
    this.tests.set(tests);
  }

  onUnitsChanged(units: UnitRow[]): void {
    this.units.set(units);
  }

  onSave(): void {
    const testDtos: AddTestDto[] = this.tests().map(t => ({
      testId: t.testId,
      testKitId: t.testKitId,
    }));
    const startSeq = Number(this.startSeqControl.getRawValue()) || 1;
    const unitDtos: AddUnitDto[] = this.units().map((u, i) => ({
      unitId: u.unitId,
      collDate: u.collDate,
      chapterId: u.chapterId,
      seqNo: Number(u.seqNo) || (startSeq + i),
    }));

    const request: CreateTestBatchRequest = {
      tbId: this.batchMode() === 'existing' ? this.currentBatchId() : 'NEW',
      startWorkNumber: startSeq,
      tests: testDtos,
      units: unitDtos,
      overrides: [],
    };

    this.isLoading.set(true);
    this.service.createOrUpdateBatch(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.item) {
            if (res.item.status === 'WARNING' && res.item.warnings?.length) {
              return;
            }
            this.savedBatchId.set(res.item.tbId);
            this.snackbarService.showSuccess(res.message || `New Test Batch/Worksheet (${res.item.tbId}) has been created.`);
            this.loadPrintableTests(res.item.tbId);
          }
        },
        error: () => this.isLoading.set(false),
      });
  }

  private loadPrintableTests(tbId: string): void {
    this.service.getPrintableTests(tbId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data && res.data.length > 0) {
            this.printableTests.set(res.data);
            this.showPrintPanel.set(true);
          } else {
            this.onClear();
          }
        },
      });
  }

  onPrintComplete(): void {
    this.showPrintPanel.set(false);
    this.onClear();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showPrintPanel()) {
      this.onPrintCancel();
    }
  }

  onPrintCancel(): void {
    this.showPrintPanel.set(false);
    this.onClear();
  }
}
