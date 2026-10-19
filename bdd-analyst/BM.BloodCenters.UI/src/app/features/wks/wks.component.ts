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
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { WksService } from './wks.service';
import {
  TestBatchDto,
  CreateTestBatchRequestDto,
  AddTestRequestDto,
  AddUnitRequestDto,
  TestRow,
  UnitRow,
  TestOptionDto,
  TestBatchOptionDto,
  LabCodeOptionDto,
  TestKitDto,
} from './wks.models';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PrintTestsDialogComponent } from './dialogs/print-tests-dialog/print-tests-dialog.component';
import { TestKitLookupDialogComponent } from './dialogs/test-kit-lookup-dialog/test-kit-lookup-dialog.component';
import {
  PrintTestsDialogData,
  PrintTestsDialogResult,
  TestKitLookupDialogData,
  TestKitLookupDialogResult,
} from './wks.models';

/**
 * Create Test Batch/Worksheet Component
 * Mnemonic: WKS
 * JIRA: MLT-13356
 */
@Component({
  selector: 'app-wks',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  templateUrl: './wks.component.html',
  styleUrl: './wks.component.scss',
})
export class WksComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `wks-${WksComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  protected headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  private readonly fb = inject(FormBuilder);
  private readonly wksService = inject(WksService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);

  private readonly headerEffect = effect(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    if (pageData) {
      this.headerConfig = {
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: pageData.title, link: null },
        ],
        title: pageData.title,
        subtitle: pageData.subtitle || 'Create a worksheet for a test batch or to add units to an existing worksheet.',
      };
    }
  });

  private readonly destroy$ = new Subject<void>();
  private nextTestRowId = 0;
  private nextUnitRowId = 0;

  // Signal-based state
  protected readonly currentBatchId = signal<string | null>(null);
  protected readonly tests = signal<TestRow[]>([]);
  protected readonly units = signal<UnitRow[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingBatch = signal<boolean>(false);
  protected readonly loadingTests = signal<boolean>(false);
  protected readonly loadingUnits = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);

  // Dropdown options
  protected readonly testBatchOptions = signal<TestBatchOptionDto[]>([]);
  protected readonly testOptions = signal<TestOptionDto[]>([]);
  protected readonly labCodeOptions = signal<LabCodeOptionDto[]>([]);

  // Computed states
  protected readonly hasTests = computed(() => this.tests().length > 0);
  protected readonly hasUnits = computed(() => this.units().length > 0);
  protected readonly hasData = computed(() => this.hasTests() || this.hasUnits());
  protected readonly canSave = computed(() =>
    !this.saving() &&
    this.form.valid &&
    (this.hasTests() || this.hasUnits())
  );
  protected readonly isEditMode = computed(() => this.currentBatchId() !== null);
  protected readonly showEmptyState = computed(() =>
    !this.loadingBatch() &&
    !this.hasData() &&
    !this.currentBatchId()
  );

  // Form
  form!: FormGroup;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  ngOnInit(): void {
    this.initForm();
    this.loadDropdownOptions();

    // Subscribe to chapter changes
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
        this.loadDropdownOptions();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      testBatchId: [null],
      startingSequence: [1, [Validators.required, Validators.min(1), Validators.max(9999)]],
      testingLabCode: ['', [Validators.required, Validators.maxLength(2)]],
    });
  }

  private loadDropdownOptions(): void {
    // Load test batches
    this.wksService.getTestBatches()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batches) => this.testBatchOptions.set(batches),
        error: (err) => {
          console.error('Failed to load test batches:', err);
          this.testBatchOptions.set([]);
        },
      });

    // Load available tests
    this.wksService.getAvailableTests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => this.testOptions.set(tests),
        error: (err) => {
          console.error('Failed to load available tests:', err);
          this.testOptions.set([]);
        },
      });

    // Load lab codes
    this.wksService.getLabCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => this.labCodeOptions.set(codes),
        error: (err) => {
          console.error('Failed to load lab codes:', err);
          this.labCodeOptions.set([]);
        },
      });
  }

  onRetrieve(): void {
    const tbId = this.form.get('testBatchId')?.value;
    if (!tbId) {
      this.snackbarService.showError('Please select a Test Batch/Worksheet to retrieve.');
      return;
    }

    this.loadingBatch.set(true);
    this.wksService.getTestBatch(tbId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batch) => {
          this.populateBatchData(batch);
          this.currentBatchId.set(tbId);
          this.loadingBatch.set(false);
        },
        error: () => {
          this.loadingBatch.set(false);
        },
      });
  }

  private populateBatchData(batch: TestBatchDto): void {
    // Populate form fields
    this.form.patchValue({
      startingSequence: batch.startWorkNumber || 1,
      testingLabCode: batch.testingLabCode || '',
    });

    // Populate tests
    const testRows: TestRow[] = batch.tests.map((test) => ({
      id: `test-${this.nextTestRowId++}`,
      testId: test.testId,
      testDesc: test.testDesc || '',
      testKitId: test.testKitId || null,
      isNew: false,
      availableTests: this.testOptions(),
      availableKits: [],
    }));
    this.tests.set(testRows);

    // Populate units
    const unitRows: UnitRow[] = batch.units.map((unit) => ({
      id: `unit-${this.nextUnitRowId++}`,
      seqNo: unit.seqNo,
      unitId: unit.unitId,
      collDate: unit.collDate || null,
      isNew: false,
    }));
    this.units.set(unitRows);
  }

  onCreateNewBatch(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.snackbarService.showError('Please fill in all required fields.');
      return;
    }

    if (!this.hasTests() && !this.hasUnits()) {
      this.snackbarService.showError('Please add at least one test or unit to the batch.');
      return;
    }

    const request: CreateTestBatchRequestDto = {
      startWorkNumber: this.form.get('startingSequence')?.value,
      testingLabCode: this.form.get('testingLabCode')?.value,
      tests: this.tests().map((t) => ({
        testId: t.testId,
        testKitId: t.testKitId,
      })),
      units: this.units().map((u) => ({
        unitId: u.unitId,
      })),
    };

    this.saving.set(true);
    this.wksService.createTestBatch(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batch) => {
          this.saving.set(false);
          this.currentBatchId.set(batch.tbId);
          this.snackbarService.showSuccess(`New Test Batch/Worksheet (${batch.tbId}) has been created.`);

          // Open print dialog
          this.openPrintTestsDialog(batch);
        },
        error: () => {
          this.saving.set(false);
        },
      });
  }

  onSave(): void {
    if (!this.isEditMode()) {
      this.onCreateNewBatch();
      return;
    }

    // For existing batch, save updates
    this.submitted.set(true);

    if (this.form.invalid) {
      this.snackbarService.showError('Please fill in all required fields.');
      return;
    }

    const tbId = this.currentBatchId();
    if (!tbId) return;

    this.saving.set(true);

    // Update start sequence if changed
    const startSeq = this.form.get('startingSequence')?.value;
    this.wksService.updateTestBatch(tbId, { startWorkNumber: startSeq })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbarService.showSuccess(`Test Batch/Worksheet (${tbId}) has been updated.`);
        },
        error: () => {
          this.saving.set(false);
        },
      });
  }

  onClear(): void {
    this.form.reset({
      testBatchId: null,
      startingSequence: 1,
      testingLabCode: '',
    });
    this.tests.set([]);
    this.units.set([]);
    this.currentBatchId.set(null);
    this.submitted.set(false);
    this.unitIdField?.clear();
  }

  onCancel(): void {
    this.onClear();
  }

  // Test management
  onAddTest(): void {
    const newTest: TestRow = {
      id: `test-${this.nextTestRowId++}`,
      testId: '',
      testDesc: '',
      testKitId: null,
      isNew: true,
      availableTests: this.testOptions(),
      availableKits: [],
    };

    this.tests.update((tests) => [...tests, newTest]);
  }

  onTestChange(row: TestRow, testId: string): void {
    const selectedTest = this.testOptions().find((t) => t.testId === testId);

    this.tests.update((tests) =>
      tests.map((t) =>
        t.id === row.id
          ? {
              ...t,
              testId,
              testDesc: selectedTest?.description || '',
              testKitId: null, // Reset kit when test changes
            }
          : t
      )
    );
  }

  onTestKitLookup(row: TestRow): void {
    if (!row.testId) {
      this.snackbarService.showError('Please select a test first.');
      return;
    }

    this.wksService.getTestKits(row.testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (kits) => {
          if (kits.length === 0) {
            this.snackbarService.showError('No test kits available for this test.');
            return;
          }

          const dialogData: TestKitLookupDialogData = {
            testId: row.testId,
            availableKits: kits,
          };

          const dialogRef = this.dialog.open(TestKitLookupDialogComponent, {
            width: '900px',
            maxHeight: '80vh',
            data: dialogData,
          });

          dialogRef.afterClosed().subscribe((result: TestKitLookupDialogResult) => {
            if (result && result.action === 'continue' && result.selectedKit) {
              this.tests.update((tests) =>
                tests.map((t) =>
                  t.id === row.id
                    ? { ...t, testKitId: result.selectedKit.kitId }
                    : t
                )
              );
            }
          });
        },
        error: () => {
          // interceptor handles error snackbar
        },
      });
  }

  onRemoveTest(row: TestRow): void {
    const tbId = this.currentBatchId();

    if (tbId && !row.isNew) {
      // Remove from existing batch via API
      this.wksService.removeTestFromBatch(tbId, row.testId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.tests.update((tests) => tests.filter((t) => t.id !== row.id));
            this.snackbarService.showSuccess('Test removed successfully.');
          },
          error: () => {
            // interceptor handles error snackbar
          },
        });
    } else {
      // Remove from UI only (new row not yet saved)
      this.tests.update((tests) => tests.filter((t) => t.id !== row.id));
    }
  }

  // Unit management
  onUnitValidated(data: UnitValidationResponse): void {
    const unitId = data.parsedUnitId;
    if (!unitId) return;

    const exists = this.units().some((u) => u.unitId === unitId);
    if (exists) {
      this.snackbarService.showError('This unit is already in the batch.');
      this.unitIdField.clear();
      return;
    }

    const tbId = this.currentBatchId();
    const startSeq = this.form.get('startingSequence')?.value || 1;
    const nextSeq = this.units().length > 0
      ? Math.max(...this.units().map((u) => u.seqNo)) + 1
      : startSeq;

    const newUnit: UnitRow = {
      id: `unit-${this.nextUnitRowId++}`,
      seqNo: nextSeq,
      unitId,
      collDate: null,
      isNew: true,
    };

    if (tbId) {
      this.wksService.addUnitToBatch(tbId, { unitId })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.units.update((units) => [...units, newUnit]);
            this.unitIdField.clear();
          },
          error: () => {
            this.unitIdField.clear();
          },
        });
    } else {
      this.units.update((units) => [...units, newUnit]);
      this.unitIdField.clear();
    }
  }

  onUnitCleared(): void {
    // No-op — unit field was cleared
  }

  onRemoveUnit(row: UnitRow): void {
    const tbId = this.currentBatchId();

    if (tbId && !row.isNew) {
      // Remove from existing batch via API
      this.wksService.removeUnitFromBatch(tbId, row.unitId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.units.update((units) => units.filter((u) => u.id !== row.id));
            this.snackbarService.showSuccess('Unit removed successfully.');
          },
          error: () => {
            // interceptor handles error snackbar
          },
        });
    } else {
      // Remove from UI only (new row not yet saved)
      this.units.update((units) => units.filter((u) => u.id !== row.id));
    }
  }

  private openPrintTestsDialog(batch: TestBatchDto): void {
    const dialogData: PrintTestsDialogData = {
      tests: batch.tests,
      tbId: batch.tbId,
    };

    const dialogRef = this.dialog.open(PrintTestsDialogComponent, {
      width: '800px',
      maxHeight: '80vh',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result: PrintTestsDialogResult) => {
      if (result && result.action === 'print') {
        // TODO: Implement actual print functionality
        console.log('Print tests:', result.selectedTestIds);
      }
    });
  }

  get f() {
    return this.form.controls;
  }
}
