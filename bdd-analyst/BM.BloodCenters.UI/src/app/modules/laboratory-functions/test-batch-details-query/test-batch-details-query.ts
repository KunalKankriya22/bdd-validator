import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { TestBatchDetailsApiService } from './services/test-batch-details-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  TestBatchDetailsResult,
  TestIdLovDto,
  ReagentInfoDto,
  WorksheetLovDto
} from './models/test-batch-details.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';

// Dialog components
import { ViewTestsDialog, ViewTestsType } from './components/view-tests-dialog/view-tests-dialog';
import { TestBatchParametersDialog } from './components/test-batch-parameters-dialog/test-batch-parameters-dialog';
import { BatchNotesDialog } from './components/batch-notes-dialog/batch-notes-dialog';

@Component({
  selector: 'app-test-batch-details-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './test-batch-details-query.html',
  styleUrl: './test-batch-details-query.scss'
})
export class TestBatchDetailsQuery implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(TestBatchDetailsApiService);
  private readonly dialog = inject(MatDialog);
  private readonly loggingService = inject(LoggingService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private destroy$ = new Subject<void>();

  // Unique ID generation
  private static nextId = 0;
  protected readonly componentId = `test-batch-details-query-${TestBatchDetailsQuery.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  constructor() {
    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || 'View test batch header, reagents, and unit test results',
          actions: []
        };
      }
    });
  }

  // Signal-based state
  protected readonly testBatchDetails = signal<TestBatchDetailsResult | null>(null);
  protected readonly worksheets = signal<WorksheetLovDto[]>([]);
  protected readonly worksheetsLoading = signal<boolean>(false);
  private readonly worksheetFilter = signal('');
  protected readonly availableTests = signal<TestIdLovDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingTests = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);

  // Worksheet dropdown search
  worksheetSearchControl = new FormControl('');
  protected readonly filteredWorksheets = computed(() => {
    const filter = this.worksheetFilter().toLowerCase();
    return filter
      ? this.worksheets().filter(w =>
          w.tbId.toLowerCase().includes(filter) ||
          w.testId?.toLowerCase().includes(filter))
      : this.worksheets();
  });

  // Reagents table
  reagentsDataSource = new MatTableDataSource<ReagentInfoDto>([]);
  reagentColumns = ['reagentType', 'reagentTypeDesc', 'reagentName', 'expiryDate', 'channel', 'supplierName', 'lotNumber'];

  // Form
  searchForm!: FormGroup;

  // Computed values
  protected readonly hasData = computed(() => this.testBatchDetails() !== null);
  protected readonly isEmpty = computed(() => !this.loading() && !this.hasData() && !this.error());
  protected readonly hasReagents = computed(() => {
    const details = this.testBatchDetails();
    return !!details && !!details.reagents?.length;
  });

  ngOnInit(): void {
    this.initForm();
    this.loadWorksheets();
    this.worksheetSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.worksheetFilter.set((v ?? '').toLowerCase()));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      worksheetId: ['', [Validators.required]],
      testId: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(10)]],
      testDescription: [{ value: '', disabled: true }]
    });

    // Watch for test ID changes to update description
    this.searchForm.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(testId => {
        const test = this.availableTests().find(t => t.testId === testId);
        this.searchForm.patchValue({
          testDescription: test?.testDesc || ''
        }, { emitEvent: false });
      });
  }

  get f() {
    return this.searchForm.controls;
  }

  private loadTestsForWorksheet(worksheetId: string, preselectedTestId?: string): void {
    if (!preselectedTestId) {
      this.loadingTests.set(true);
      this.searchForm.get('testId')?.disable();
      this.searchForm.patchValue({ testId: '', testDescription: '' }, { emitEvent: false });
    }

    this.apiService.getTestsForWorksheet(worksheetId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => {
          this.availableTests.set(tests);
          this.loadingTests.set(false);

          if (tests.length > 0) {
            this.searchForm.get('testId')?.enable();
            let testToSelect: string | null = null;
            if (preselectedTestId && tests.find(t => t.testId === preselectedTestId)) {
              testToSelect = preselectedTestId;
            } else if (tests.length === 1) {
              testToSelect = tests[0].testId;
            }
            if (testToSelect) {
              this.searchForm.patchValue({ testId: testToSelect });
            }
          }
        },
        error: (err) => {
          this.loggingService.error('Error loading tests for worksheet', err);
          this.loadingTests.set(false);
          if (!preselectedTestId) {
            this.availableTests.set([]);
          }
        }
      });
  }

  private loadWorksheets(): void {
    this.worksheetsLoading.set(true);
    this.apiService.getRecentWorksheets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.worksheets.set(data);
          this.worksheetsLoading.set(false);
        },
        error: (err) => {
          this.loggingService.error('Error loading worksheets', err);
          this.worksheetsLoading.set(false);
        }
      });
  }

  onWorksheetSelectionChange(worksheet: WorksheetLovDto): void {
    if (!worksheet) return;
    const tbId = worksheet.tbId;
    const preselectedTestId = worksheet.testId;
    if (preselectedTestId) {
      this.searchForm.get('testId')?.enable();
      this.availableTests.set([{ testId: preselectedTestId, testDesc: null }]);
      this.searchForm.patchValue({ testId: preselectedTestId }, { emitEvent: false });
    }
    this.loadTestsForWorksheet(tbId, preselectedTestId);
    this.onSearch();
  }

  onSearch(): void {
    this.submitted.set(true);

    if (this.searchForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const worksheetValue: WorksheetLovDto | null = this.searchForm.get('worksheetId')?.value;
    const worksheetId = worksheetValue?.tbId?.trim();
    const testId = this.searchForm.get('testId')?.value?.trim();

    if (!worksheetId || !testId) {
      return;
    }

    this.loadTestBatchDetails(worksheetId, testId);
  }

  private loadTestBatchDetails(worksheetId: string, testId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getTestBatchDetails(worksheetId, testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.testBatchDetails.set(data);
          this.reagentsDataSource.data = data.reagents ?? [];
          this.loading.set(false);
        },
        error: (err) => {
          this.loggingService.error('Error loading test batch details', err);
          const errorMessage = err.status === 404
            ? 'Worksheet or test not found. Please verify the IDs.'
            : 'Failed to load test batch details. Please try again.';
          this.error.set(errorMessage);
          this.loading.set(false);
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  onClearAll(): void {
    this.searchForm.reset();
    this.worksheetSearchControl.reset('', { emitEvent: false });
    this.worksheetFilter.set('');
    this.searchForm.get('testId')?.disable();
    this.testBatchDetails.set(null);
    this.reagentsDataSource.data = [];
    this.availableTests.set([]);
    this.error.set(null);
    this.submitted.set(false);
  }

  onRetry(): void {
    const worksheetValue: WorksheetLovDto | null = this.searchForm.get('worksheetId')?.value;
    const worksheetId = worksheetValue?.tbId?.trim();
    const testId = this.searchForm.get('testId')?.value?.trim();

    if (worksheetId && testId) {
      this.loadTestBatchDetails(worksheetId, testId);
    }
  }

  // Dialog actions
  onOpenScheduledTests(): void {
    this.openViewTestsDialog('scheduled');
  }

  onOpenUnscheduledTests(): void {
    this.openViewTestsDialog('unscheduled');
  }

  onOpenHoldingTests(): void {
    this.openViewTestsDialog('holding');
  }

  private openViewTestsDialog(type: ViewTestsType): void {
    const details = this.testBatchDetails();
    if (!details) return;

    this.dialog.open(ViewTestsDialog, {
      data: { worksheetId: details.worksheetId, testId: details.testId, type },
      width: '1184px',
      height: '100vh',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '0' },
      autoFocus: true
    });
  }

  onOpenTestBatchParameters(): void {
    const details = this.testBatchDetails();
    if (!details) return;

    this.dialog.open(TestBatchParametersDialog, {
      data: { worksheetId: details.worksheetId, testId: details.testId },
      width: '1184px',
      height: '100vh',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '0' },
      autoFocus: true
    });
  }

  onOpenTestBatchNotes(): void {
    const details = this.testBatchDetails();
    if (!details) return;

    this.dialog.open(BatchNotesDialog, {
      data: { worksheetId: details.worksheetId, testId: details.testId },
      width: '1184px',
      height: '100vh',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '0' },
      autoFocus: true
    });
  }

  onOpenTestBatchDocuments(): void {
    // TODO: Implement when documents API is available
    this.snackbarService.showError('Test Batch Documents feature coming soon');
  }

  compareWorksheets(a: WorksheetLovDto, b: WorksheetLovDto): boolean {
    return a?.tbId === b?.tbId && a?.testId === b?.testId;
  }

  // Helper methods
  formatUnitId(unitId: string | null, checkDigit: string | null): string {
    if (!unitId) return '-';
    return checkDigit ? `${unitId} - ${checkDigit}` : unitId;
  }

  formatValue(value: string | null | undefined): string {
    return value || '-';
  }

  private readonly monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // Parse ISO string parts directly — the API already returns dates in chapter local time,
  // so using new Date() would re-apply browser timezone and produce a wrong result.
  formatDate(date: string | null): string {
    if (!date) return '-';
    const parts = date.split('T')[0]?.split('-');
    if (!parts || parts.length !== 3) return date;
    const month = this.monthNames[parseInt(parts[1], 10) - 1];
    return `${parts[2]}-${month}-${parts[0]}`;
  }
}
