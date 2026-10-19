import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { MessageDialog } from '@shared/components/message-dialog/message-dialog';
import { MessageDialogData } from '@shared/interfaces/auth.interface';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { FirstTechTestResultApiService } from './services';
import {
  TestBatchWorksheet,
  TestIdOption,
  TestKitOption,
  ResultCodeOption,
  TestResultRow,
  TestResultData,
  SaveResultsRequest,
  SaveResultItem,
  SaveResultsResponse
} from './models';

@Component({
  selector: 'app-first-tech-test-result',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatPaginatorModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './first-tech-test-result.html',
  styleUrls: ['./first-tech-test-result.scss']
})
export class FirstTechTestResultComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `first-tech-test-result-${FirstTechTestResultComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(FirstTechTestResultApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);
  private readonly pageHeaderService = inject(PageHeaderService);

  // Form
  filterForm!: FormGroup;

  // Batch mode
  isNewBatchMode = signal(false);
  private nextSeqNo = 1;

  // Dropdown options
  tbWsNumbers = signal<TestBatchWorksheet[]>([]);
  testIds = signal<TestIdOption[]>([]);
  testKits = signal<TestKitOption[]>([]);
  resultCodes = signal<ResultCodeOption[]>([]);

  // Loading states
  isLoadingDropdowns = signal(false);
  isLoadingTestKits = signal(false);
  isLoadingResultCodes = signal(false);
  isSearching = signal(false);
  isSaving = signal(false);

  // Test results
  testResults = signal<TestResultRow[]>([]);
  allTestResults = signal<TestResultData[]>([]); // Store all results from API
  hasSearched = signal(false);

  // Pagination
  pageSize = signal(50);
  pageIndex = signal(0);
  totalCount = signal(0);
  pageSizeOptions = [25, 50, 100, 200];

  // Sentinel values for disabled mat-option rows
  readonly selectPanelLoadingValue = '__SELECT_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__SELECT_PANEL_EMPTY__';

  // Computed properties
  hasResults = computed(() => {
    if (this.isNewBatchMode()) {
      return this.testResults().length > 0;
    }
    return this.hasSearched() && this.testResults().length > 0;
  });
  canSave = computed(() => this.hasResults() && !this.isSaving());
  testDescription = computed(() => {
    const testId = this.filterForm?.get('testId')?.value;
    const test = this.testIds().find(t => t.testId === testId);
    return test?.testDesc || '-';
  });

  // Page header configuration
  pageHeaderConfig: PageHeaderConfig = this.getPageHeaderConfig();

  private getPageHeaderConfig(): PageHeaderConfig {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    const title = menuItem?.label || 'First Tech Test Result';
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: title, link: null }
      ]
    };
  }

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadInitialFilterOptions();
    this.setupFormWatchers();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      tbWsNumber: ['', Validators.required],
      testId: [{ value: '', disabled: true }, Validators.required],
      testKit: [{ value: '', disabled: true }, Validators.required]
    });
  }

  /**
   * Switch to New Batch mode (Gap #1)
   */
  switchToNewBatchMode(): void {
    this.isNewBatchMode.set(true);
    this.clearFormData();
    this.filterForm.get('tbWsNumber')?.clearValidators();
    this.filterForm.get('tbWsNumber')?.updateValueAndValidity({ emitEvent: false });
    this.filterForm.get('tbWsNumber')?.disable({ emitEvent: false });
    this.filterForm.get('testId')?.enable({ emitEvent: false });
    this.nextSeqNo = 1;
    this.loadTestIdOptions();
  }

  /**
   * Switch to Existing Batch mode
   */
  switchToExistingBatchMode(): void {
    this.isNewBatchMode.set(false);
    this.clearFormData();
    this.filterForm.get('tbWsNumber')?.setValidators(Validators.required);
    this.filterForm.get('tbWsNumber')?.updateValueAndValidity({ emitEvent: false });
    this.filterForm.get('tbWsNumber')?.enable({ emitEvent: false });
    this.filterForm.get('testId')?.disable({ emitEvent: false });
    this.filterForm.get('testKit')?.disable({ emitEvent: false });
    this.nextSeqNo = 1;
    this.loadInitialFilterOptions();
  }

  /**
   * Load initial dropdown data (TB/WS numbers only)
   */
  private loadInitialFilterOptions(): void {
    this.isLoadingDropdowns.set(true);

    this.apiService.getTbWsOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.tbWsNumbers.set(response.data.map(item => ({
              tbId: item.tbId,
              tbWsNumber: item.tbId,
              insertDate: this.formatDateForDropdown(item.insertDate),
              testId: item.testId,
              testKitId: item.testKitId // Store testKitId from TEST_BATCH_DET
            })));
          }
          this.isLoadingDropdowns.set(false);
        },
        error: (error) => {
          this.handleError('Failed to load TB/WS options', error);
          this.isLoadingDropdowns.set(false);
        }
      });
  }

  /**
   * Setup form field watchers for cascading dropdowns
   */
  private setupFormWatchers(): void {
    // Watch TB/WS# changes
    // Oracle Forms: TEST_BATCH_LOV auto-fills both TB_ID and TEST_ID via column mapping,
    // then VALIDATE_FIELD auto-fills TEST_KIT_ID via SELECT INTO from TEST_BATCH_DET.
    // No separate dropdowns — all three values set from one LOV selection.
    this.filterForm.get('tbWsNumber')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(100),
        distinctUntilChanged()
      )
      .subscribe((tbWsNumber: string) => {
        if (this.isNewBatchMode()) return;

        if (tbWsNumber) {
          const selectedBatch = this.tbWsNumbers().find(b => b.tbWsNumber === tbWsNumber);
          if (selectedBatch?.testId) {
            // Auto-fill Test ID and Test Kit from batch data (matches Oracle Forms LOV behavior)
            // Oracle Forms: LOV auto-fills TB_ID+TEST_ID, VALIDATE_FIELD auto-fills TEST_KIT_ID
            this.filterForm.get('testId')?.enable({ emitEvent: false });
            this.filterForm.patchValue({ testId: selectedBatch.testId }, { emitEvent: false });

            if (selectedBatch.testKitId) {
              this.testKits.set([{ testKitId: selectedBatch.testKitId, testId: selectedBatch.testId, kitCode: selectedBatch.testKitId, qcExpiryDate: '' }]);
              this.filterForm.get('testKit')?.enable({ emitEvent: false });
              this.filterForm.patchValue({ testKit: selectedBatch.testKitId }, { emitEvent: false });
            }

            // Load test details (description, noOfTech, antigenFlag) then result codes
            // Result codes depend on antigenFlag, so must load AFTER test details
            this.loadTestIdOptionsForBatch(tbWsNumber, selectedBatch.testId);

            // Auto-search immediately (Oracle Forms: KEY-NEXT-ITEM fires execute_query)
            this.onSearch();
          } else {
            this.loadTestIdOptions(tbWsNumber);
          }
        } else {
          this.testIds.set([]);
          this.testKits.set([]);
          this.resultCodes.set([]);
          this.filterForm.get('testId')?.disable({ emitEvent: false });
          this.filterForm.get('testKit')?.disable({ emitEvent: false });
          this.filterForm.patchValue({ testId: '', testKit: '' }, { emitEvent: false });
        }
      });

    // Watch Test ID changes to load Test Kits and Result Codes (new batch mode only)
    this.filterForm.get('testId')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(100),
        distinctUntilChanged()
      )
      .subscribe((testId: string) => {
        if (testId) {
          // In existing batch mode, test kit and result codes are already loaded by TB/WS watcher
          if (this.isNewBatchMode()) {
            this.loadTestKitOptions(testId);
          }
          this.loadResultCodes(testId);
        } else {
          this.testKits.set([]);
          this.resultCodes.set([]);
          this.filterForm.get('testKit')?.disable({ emitEvent: false });
          this.filterForm.patchValue({ testKit: '' }, { emitEvent: false });
        }
      });

    // Auto-search when all three dropdowns have values (fallback for manual dropdown changes)
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300)
      )
      .subscribe(() => {
        const { tbWsNumber, testId, testKit } = this.filterForm.getRawValue();
        if (!this.isNewBatchMode() && tbWsNumber && testId && testKit && !this.isSearching()) {
          this.onSearch();
        }
      });
  }

  /**
   * Subscribe to chapter changes from header
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearForm();
        this.loadInitialFilterOptions();
      });
  }

  /**
   * Load Test IDs — with tbId for existing batch, without for new batch
   */
  private loadTestIdOptions(tbWsNumber?: string): void {
    this.isLoadingDropdowns.set(true);

    this.apiService.getTestIdOptions(tbWsNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.testIds.set(response.data);
            this.filterForm.get('testId')?.enable({ emitEvent: false });

            if (!this.isNewBatchMode()) {
              // Existing batch: auto-select test ID if only one option or matches batch
              if (response.data.length === 1) {
                this.filterForm.patchValue({ testId: response.data[0].testId }, { emitEvent: true });
              } else if (tbWsNumber) {
                const selectedBatch = this.tbWsNumbers().find(b => b.tbWsNumber === tbWsNumber);
                if (selectedBatch?.testId) {
                  const matchingTest = response.data.find(t => t.testId === selectedBatch.testId);
                  if (matchingTest) {
                    this.filterForm.patchValue({ testId: matchingTest.testId }, { emitEvent: true });
                  }
                }
              }
            }
          }
          this.isLoadingDropdowns.set(false);
        },
        error: (error) => {
          this.handleError('Failed to load test IDs', error);
          this.isLoadingDropdowns.set(false);
        }
      });
  }

  /**
   * Load test details in background for existing batch (description, noOfTech, antigenFlag).
   * Oracle Forms: TEST_ID VALIDATE_FIELD fetches test_desc, no_of_tech, antigen_flag
   * from VALID_TESTS after LOV auto-fills TEST_ID.
   */
  private loadTestIdOptionsForBatch(tbWsNumber: string, preselectedTestId: string): void {
    this.apiService.getTestIdOptions(tbWsNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const matchingTest = response.data.find(t => t.testId === preselectedTestId);
            if (matchingTest) {
              this.testIds.set([matchingTest]);
              // Load result codes AFTER test details are available (antigenFlag needed for correct plate_seq filtering)
              this.loadResultCodes(preselectedTestId);
            }
          }
        },
        error: () => {}
      });
  }

  /**
   * Load Test Kits — auto-selects based on batch data or if single option available
   * Oracle Forms logic: When TB/WS + Test ID selected, auto-populate test_kit_id from TEST_BATCH_DET
   */
  private loadTestKitOptions(testId: string): void {
    this.isLoadingTestKits.set(true);

    this.apiService.getTestKitOptions(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.testKits.set(response.data.map(item => ({
              ...item,
              kitCode: item.testKitId
            })));
            this.filterForm.get('testKit')?.enable({ emitEvent: false });

            // Auto-select logic:
            // 1. In existing batch mode: Use testKitId from selected batch (from TEST_BATCH_DET)
            // 2. Fallback: Auto-select if only 1 option available
            if (!this.isNewBatchMode()) {
              const tbWsNumber = this.filterForm.get('tbWsNumber')?.value;
              const selectedBatch = this.tbWsNumbers().find(b => b.tbWsNumber === tbWsNumber);

              if (selectedBatch?.testKitId) {
                // Oracle Forms: test_kit_id comes from TEST_BATCH_DET for the selected batch
                const matchingKit = response.data.find(kit => kit.testKitId === selectedBatch.testKitId);
                if (matchingKit) {
                  this.filterForm.patchValue({ testKit: matchingKit.testKitId }, { emitEvent: true });
                  this.isLoadingTestKits.set(false);
                  return;
                }
              }
            }

            // Fallback: auto-select if only one option available
            if (response.data.length === 1) {
              this.filterForm.patchValue({ testKit: response.data[0].testKitId }, { emitEvent: true });
            }
          }
          this.isLoadingTestKits.set(false);
        },
        error: (error) => {
          this.handleError('Failed to load test kits', error);
          this.isLoadingTestKits.set(false);
        }
      });
  }

  /**
   * Load Result Codes based on selected Test ID
   */
  private loadResultCodes(testId: string): void {
    this.isLoadingResultCodes.set(true);

    const test = this.testIds().find(t => t.testId === testId);
    const antigenFlag = test?.antigenFlag;

    this.apiService.getResultCodes(testId, antigenFlag)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Map API response to add template-expected properties
            this.resultCodes.set(response.data.map(item => ({
              ...item,
              code: item.resultCode // Map resultCode to code for template
            })));
          }
          this.isLoadingResultCodes.set(false);
        },
        error: (error) => {
          this.handleError('Failed to load result codes', error);
          this.isLoadingResultCodes.set(false);
        }
      });
  }

  // ── New Batch Mode: Unit Row Management (Gap #1) ──

  addUnitRow(): void {
    const currentResults = this.testResults();
    const newRow: TestResultRow = {
      tbSeqNo: this.nextSeqNo,
      sequenceNumber: this.nextSeqNo,
      unitId: '',
      collectionDate: '-',
      resultCode: '',
      resultDescription: '',
      description: '',
      isEditable: true,
      isValid: false,
      isValidating: false,
      validationError: undefined
    };
    this.nextSeqNo++;
    this.testResults.set([...currentResults, newRow]);
    this.totalCount.set(this.testResults().length);
  }

  removeUnitRow(index: number): void {
    const currentResults = [...this.testResults()];
    currentResults.splice(index, 1);
    currentResults.forEach((row, i) => {
      row.tbSeqNo = i + 1;
      row.sequenceNumber = i + 1;
    });
    this.nextSeqNo = currentResults.length + 1;
    this.testResults.set(currentResults);
    this.totalCount.set(currentResults.length);
  }

  onUnitIdChange(row: TestResultRow, newValue: string): void {
    row.unitId = newValue;
    row.isValid = false;
    row.validationError = undefined;
    row.collectionDate = '-';
  }

  onUnitIdBlur(row: TestResultRow, index: number): void {
    if (!row.unitId || row.unitId.trim() === '') {
      row.isValid = false;
      row.validationError = undefined;
      this.testResults.update(rows => [...rows]);
      return;
    }

    const unitId = row.unitId.trim();

    // Check for duplicate within current rows
    const duplicate = this.testResults().find(
      (r, i) => i !== index && r.unitId === unitId
    );
    if (duplicate) {
      row.isValid = false;
      row.validationError = 'Duplicate unit in batch (9307)';
      this.testResults.update(rows => [...rows]);
      return;
    }

    row.isValidating = true;
    row.validationError = undefined;
    this.testResults.update(rows => [...rows]);

    this.apiService.validateUnit(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          row.isValidating = false;
          if (response.success && response.data) {
            row.isValid = true;
            row.unitId = response.data.unitId || unitId;
            row.collectionDate = response.data.collDate
              ? this.formatDate(response.data.collDate)
              : '-';
            row.chapterId = response.data.chapterId;
            row.validationError = undefined;

            if (response.warnings && response.warnings.length > 0) {
              row.validationError = response.warnings.map(w => w.message).join('; ');
            }
          } else {
            row.isValid = false;
            row.validationError = response.message || `Invalid unit ID (${response.errorCode || 'unknown'})`;
          }
          this.testResults.update(rows => [...rows]);
        },
        error: (error) => {
          row.isValidating = false;
          row.isValid = false;
          row.validationError = error?.error?.message || 'Unit validation failed';
          this.testResults.update(rows => [...rows]);
        }
      });
  }

  openManualUnitEntry(row: TestResultRow, rowIndex: number): void {
    import('./manual-unit-entry-dialog').then(m => {
      const dialogRef = this.dialog.open(m.ManualUnitEntryDialogComponent, {
        width: '400px',
        disableClose: true
      });

      dialogRef.afterClosed().subscribe((unitId: string | undefined) => {
        if (unitId) {
          row.unitId = unitId;
          this.testResults.update(rows => [...rows]);
          this.onUnitIdBlur(row, rowIndex);
        }
      });
    });
  }

  /**
   * Search for test results
   */
  onSearch(): void {
    if (this.isNewBatchMode()) return;

    const { tbWsNumber, testId, testKit } = this.filterForm.getRawValue();
    if (!tbWsNumber || !testId || !testKit) {
      this.filterForm.markAllAsTouched();
      this.snackbarService.showError('Please fill in all required filter fields');
      return;
    }

    this.isSearching.set(true);

    this.apiService.getTestResults({
      tbId: tbWsNumber,
      testId: testId
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.allTestResults.set(response.data);
            this.totalCount.set(response.totalRecords || response.data.length);
            this.pageIndex.set(0);
            this.updatePaginatedResults();
          } else {
            this.allTestResults.set([]);
            this.testResults.set([]);
            this.totalCount.set(0);
          }
          this.hasSearched.set(true);
          this.isSearching.set(false);
        },
        error: (error) => {
          this.handleError('Failed to search test results', error);
          this.isSearching.set(false);
          this.hasSearched.set(true);
          this.allTestResults.set([]);
          this.testResults.set([]);
        }
      });
  }

  /**
   * Update paginated results based on current page
   */
  private updatePaginatedResults(): void {
    const start = this.pageIndex() * this.pageSize();
    const end = start + this.pageSize();
    const paginatedData = this.allTestResults().slice(start, end);

    // Convert API data to UI model
    const uiResults: TestResultRow[] = paginatedData.map(item => {
      const resultDescription = this.getResultDescription(item.resultCode);
      return {
        tbSeqNo: item.tbSeqNo,
        sequenceNumber: item.tbSeqNo, // Map for template compatibility
        unitId: item.unitId,
        collectionDate: this.formatDate(item.collDate || item.resultDate),
        resultCode: item.resultCode,
        resultDescription: resultDescription,
        description: resultDescription, // Map for template compatibility
        testKitId: item.testKitId,
        chapterId: item.chapterId,
        remark: item.remark
      };
    });

    this.testResults.set(uiResults);
  }

  /**
   * Format date for dropdown display (DD-MMM-YYYY)
   */
  private formatDateForDropdown(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Format date for display
   */
  private formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
  }

  /**
   * Get result description from code
   */
  private getResultDescription(code: string): string {
    const result = this.resultCodes().find(rc => rc.resultCode === code);
    return result?.resultDesc || '-';
  }

  /**
   * Handle page change event
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.updatePaginatedResults();
  }

  /**
   * Handle result code change in table
   */
  onResultCodeChange(row: TestResultRow, newCode: string): void {
    row.resultCode = newCode;
    row.resultDescription = this.getResultDescription(newCode);
    row.description = row.resultDescription;
  }

  /**
   * Save test results
   */
  async onSave(): Promise<void> {
    if (!this.hasResults()) {
      this.snackbarService.showError('No results to save');
      return;
    }

    const results = this.testResults();

    // New batch mode: validate all unit IDs are entered and valid (Gap #1)
    if (this.isNewBatchMode()) {
      const emptyUnits = results.filter(r => !r.unitId || r.unitId.trim() === '');
      if (emptyUnits.length > 0) {
        this.snackbarService.showError('Please enter unit IDs for all rows');
        return;
      }
      const invalidUnits = results.filter(r => !r.isValid);
      if (invalidUnits.length > 0) {
        this.snackbarService.showError('Please fix invalid unit IDs before saving');
        return;
      }
    }

    // Validate that all result codes are filled
    const invalidRows = results.filter(r => !r.resultCode);
    if (invalidRows.length > 0) {
      this.snackbarService.showError('Please select result codes for all rows');
      return;
    }

    // Gap #7: Pre-save duplicate result warning
    const preSaveWarnings = await this.checkPreSaveWarnings(results);
    const shouldContinue = await this.showSaveConfirmation(preSaveWarnings);
    if (!shouldContinue) {
      return;
    }

    this.saveResults();
  }

  /**
   * Gap #7: Check for duplicate/existing results before save
   */
  private checkPreSaveWarnings(results: TestResultRow[]): Promise<string[]> {
    const testId = this.filterForm.get('testId')?.value;
    if (!testId) return Promise.resolve([]);

    const rowsToCheck = results.filter(r => r.unitId && r.resultCode);
    if (rowsToCheck.length === 0) return Promise.resolve([]);

    return new Promise<string[]>((resolve) => {
      const warnings: string[] = [];
      let completed = 0;

      rowsToCheck.forEach(r => {
        this.apiService.validateUnit(r.unitId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              if (response.warnings?.some(w => w.code === '9324')) {
                warnings.push(`Unit ${r.unitId}: Result already exists (9324)`);
              }
              completed++;
              if (completed === rowsToCheck.length) resolve(warnings);
            },
            error: () => {
              completed++;
              if (completed === rowsToCheck.length) resolve(warnings);
            }
          });
      });
    });
  }

  private showSaveConfirmation(preSaveWarnings: string[] = []): Promise<boolean> {
    const results = this.testResults();
    const summary = this.buildResultSummary(results);

    let message = `Results Entered - ${summary}. Do you want to continue?`;
    if (preSaveWarnings.length > 0) {
      message = `Warnings:\n${preSaveWarnings.join('\n')}\n\n${message}`;
    }

    return new Promise((resolve) => {
      const dialogData: ConfirmActionDialogData = {
        title: 'Confirm Save',
        message: message,
        confirmText: 'Yes',
        cancelText: 'No'
      };

      const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
        width: '500px',
        data: dialogData,
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        resolve(result === true);
      });
    });
  }

  private buildResultSummary(results: TestResultRow[]): string {
    const countsByCode = results.reduce((acc, row) => {
      if (row.resultCode) {
        acc[row.resultCode] = (acc[row.resultCode] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countsByCode)
      .map(([code, count]) => `${count}:${code}`)
      .join('; ');
  }

  /**
   * Save results to API
   */
  private saveResults(): void {
    this.isSaving.set(true);

    const { tbWsNumber, testId, testKit } = this.filterForm.getRawValue();

    const resultItems: SaveResultItem[] = this.testResults().map(row => ({
      unitId: row.unitId,
      resultCode: row.resultCode,
      tbSeqNo: row.tbSeqNo,
      remark: row.remark
    }));

    const request: SaveResultsRequest = {
      tbId: this.isNewBatchMode() ? '' : (tbWsNumber || ''), // Empty string for new batch, backend uses this to determine isNewBatch
      testId: testId,
      testKitId: testKit,
      isNewBatch: this.isNewBatchMode(),
      results: resultItems
    };

    this.apiService.saveResults(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving.set(false);

          if (response.success) {
            this.handleSaveSuccess(response);
          } else {
            this.handleSaveErrors(response);
          }
        },
        error: (error) => {
          this.handleError('Failed to save test results', error);
          this.isSaving.set(false);
        }
      });
  }

  /**
   * Handle successful save
   * Oracle Forms shows warnings inline, not in a dialog
   */
  private handleSaveSuccess(response: SaveResultsResponse): void {
    // Build success message - Oracle Forms shows this inline, not in a dialog
    let message = '';

    // Results summary (matches Oracle Forms 9200 message format)
    // Backend returns string like "Results Entered - 2:POS; 1:NEG"
    if (response.resultsSummary) {
      message = response.resultsSummary;
    }

    // Test Batch ID (matches Oracle Forms 9300 message format for new batches)
    if (response.tbId) {
      const tbIdNote = ` Test Batch ID: ${response.tbId}`;
      message = message ? `${message}. ${tbIdNote}` : tbIdNote;
    }

    // Records saved count
    if (response.recordsSaved > 0) {
      message += `. Saved: ${response.recordsSaved}`;
    }

    // Warnings - append to message
    // Filter out 9200 (results summary) and 9300 (TB ID) since they're already shown above
    if (response.warnings && response.warnings.length > 0) {
      const warningTexts = response.warnings
        .filter(w => w.code !== '9200' && w.code !== '9300')  // Exclude duplicate messages
        .map(w => w.message || '')
        .filter(msg => msg.trim() !== '')
        .join('; ');

      if (warningTexts) {
        message = message ? `${message}. Warnings: ${warningTexts}` : `Warnings: ${warningTexts}`;
      }
    }

    // Show success snackbar instead of dialog (Oracle Forms shows inline)
    this.snackbarService.showSuccess(message);

    // Clear form after save and refresh TB/WS dropdown
    // Oracle Forms: clear_form(NO_VALIDATE, FULL_ROLLBACK) clears everything,
    // then LOV re-queries on open — saved batches disappear from dropdown
    this.clearForm();
    this.loadInitialFilterOptions();
  }

  /**
   * Handle save errors
   */
  private handleSaveErrors(response: any): void {
    let message = response.message || 'Failed to save test results';

    if (response.errors && response.errors.length > 0) {
      message += '\n\nErrors:\n' + response.errors.map((e: any) => `${e.code}: ${e.message}`).join('\n');
    }

    this.snackbarService.showError(message);
  }

  private clearFormData(): void {
    this.filterForm.patchValue({ tbWsNumber: '', testId: '', testKit: '' }, { emitEvent: false });
    this.testResults.set([]);
    this.allTestResults.set([]);
    this.hasSearched.set(false);
    this.testIds.set([]);
    this.testKits.set([]);
    this.resultCodes.set([]);
    this.nextSeqNo = 1;
  }

  private clearForm(): void {
    this.isNewBatchMode.set(false);
    this.filterForm.reset();
    this.filterForm.get('tbWsNumber')?.setValidators(Validators.required);
    this.filterForm.get('tbWsNumber')?.updateValueAndValidity({ emitEvent: false });
    this.filterForm.get('tbWsNumber')?.enable({ emitEvent: false });
    this.filterForm.get('testId')?.disable({ emitEvent: false });
    this.filterForm.get('testKit')?.disable({ emitEvent: false });
    this.testResults.set([]);
    this.allTestResults.set([]);
    this.hasSearched.set(false);
    this.testIds.set([]);
    this.testKits.set([]);
    this.resultCodes.set([]);
    this.nextSeqNo = 1;
  }

  /**
   * Handle errors
   */
  private handleError(message: string, error: any): void {
    console.error(message, error);
    const errorMessage = error?.error?.message || error?.message || message;
    this.snackbarService.showError(errorMessage);
  }

  /**
   * Get form control helper
   */
  getFormControl(controlName: string) {
    return this.filterForm.get(controlName);
  }
}
