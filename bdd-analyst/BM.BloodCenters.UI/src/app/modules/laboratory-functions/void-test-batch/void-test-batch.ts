import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
} from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';

import { VoidTestBatchApiService } from './services/void-test-batch-api.service';
import { VoidBatchConfirmationDialogComponent } from './void-batch-confirmation-dialog/void-batch-confirmation-dialog';
import {
  TestBatchDto,
  TestInBatchDto,
  VoidReasonCodeDto,
  UnitInBatchDto,
  TechModeDto,
} from './models/void-test-batch.model';

@Component({
  selector: 'app-void-test-batch',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
  ],
  templateUrl: './void-test-batch.html',
  styleUrl: './void-test-batch.scss',
})
export class VoidTestBatchComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(VoidTestBatchApiService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  protected readonly testBatches = signal<TestBatchDto[]>([]);
  protected readonly testsInBatch = signal<TestInBatchDto[]>([]);
  protected readonly voidReasonCodes = signal<VoidReasonCodeDto[]>([]);
  protected readonly unitsInBatch = signal<UnitInBatchDto[]>([]);
  protected readonly selectedVoidCodeDescription = signal<string>('-');
  protected readonly techMode = signal<TechModeDto>({ techMode: '0', isTwoTechMode: false, isFirstTech: false });
  protected readonly loading = signal<boolean>(false);
  protected readonly hasResults = signal<boolean>(false);
  private readonly sortState = signal<{ column: string; direction: 'A' | 'D' | 'default' }>({ column: 'tbSeqNo', direction: 'default' });

  batchSearchCtrl = new FormControl('');
  testSearchCtrl = new FormControl('');
  voidCodeSearchCtrl = new FormControl('');

  private batchSearchText = signal('');
  private testSearchText = signal('');
  private voidCodeSearchText = signal('');

  protected readonly filteredBatches = computed(() => {
    const s = this.batchSearchText().toLowerCase();
    return !s ? this.testBatches() : this.testBatches().filter(b =>
      b.tbId.toLowerCase().includes(s) ||
      (b.testId ?? '').toLowerCase().includes(s)
    );
  });

  protected readonly filteredTests = computed(() => {
    const s = this.testSearchText().toLowerCase();
    const all: TestInBatchDto[] = [{ testId: 'ALL', testDesc: 'All Tests in Batch' }];
    const tests = this.testsInBatch();
    const combined = [...all, ...tests];
    return !s ? combined : combined.filter(t => t.testId.toLowerCase().includes(s) || (t.testDesc ?? '').toLowerCase().includes(s));
  });

  protected readonly filteredVoidCodes = computed(() => {
    const s = this.voidCodeSearchText().toLowerCase();
    return !s ? this.voidReasonCodes() : this.voidReasonCodes().filter(c => c.code.toLowerCase().includes(s) || c.codeDesc.toLowerCase().includes(s));
  });

  protected readonly headerConfig = computed<PageHeaderConfig>(() => {
    const data = this.pageHeaderService.pageHeaderData();
    return {
      title: data?.title || 'Void Test Batch',
      subtitle: data?.subtitle || 'Void unsuitable worksheets, plates, or test batches after results have been committed to the system.',
      breadcrumbs: [
        { label: 'Home', link: '/' },
        { label: 'Void Test Batch' },
      ],
    };
  });

  protected readonly tableConfig = computed<DataTableConfig>(() => {
    const count = this.unitsInBatch().length;
    const unitIdHeader = count > 0 ? `Unit ID (${count})` : 'Unit ID';
    const sort = this.sortState();
    return {
      columns: [
        { key: 'tbSeqNo', header: 'Sequence', sortable: true },
        { key: 'unitIdDisplay', header: unitIdHeader, sortable: false },
        { key: 'collDate', header: 'Collection Date', sortable: false, valueFormatter: (v: string) => this.formatDate(v) },
        { key: 'testId', header: 'Test ID', sortable: false },
        { key: 'resultStatus1', header: 'Result', sortable: false, valueFormatter: (v: string, row: any) => row.isReactive === 'Y' ? `${v} (Reactive)` : v },
        { key: 'resultDesc', header: 'Result Description', sortable: false },
        { key: 'tbId', header: 'Test Batch ID', sortable: false },
        { key: 'absorbance', header: 'Absorbance / Value / Channel', sortable: false },
      ],
      sortConfig: { column: sort.column, direction: sort.direction },
      emptyMessage: 'No Results to Display',
      emptySubMessage: 'Enter details to begin.',
      scrollable: true,
    };
  });

  protected readonly searchConfig: SearchBarConfig = {
    placeholder: 'Search by unit ID, test ID or result',
    minLength: 2,
  };

  protected dataSource: any[] = [];

  filterForm!: FormGroup;

  get f() {
    return this.filterForm.controls;
  }

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

  protected get isRetrieveEnabled(): boolean {
    return !!this.filterForm?.get('batchId')?.value && !!this.filterForm?.get('testId')?.value;
  }

  protected get isClearEnabled(): boolean {
    return !!this.filterForm?.get('batchId')?.value || !!this.filterForm?.get('testId')?.value || !!this.filterForm?.get('voidCode')?.value;
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      batchId: [null, Validators.required],
      testId: [null, Validators.required],
      voidCode: [null],
    });
  }

  private setupFormListeners(): void {
    this.filterForm.get('batchId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((batchId) => {
        if (batchId) {
          this.loadTestsInBatch(batchId);
        } else {
          this.testsInBatch.set([]);
        }
        this.filterForm.patchValue({ testId: null }, { emitEvent: false });
        this.clearResults();
      });

    this.filterForm.get('voidCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((voidCode) => {
        if (voidCode) {
          const selectedCode = this.voidReasonCodes().find((c) => c.code === voidCode);
          this.selectedVoidCodeDescription.set(selectedCode?.codeDesc || '-');
        } else {
          this.selectedVoidCodeDescription.set('-');
        }
      });
  }

  private setupSearchListeners(): void {
    this.batchSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.batchSearchText.set(v || ''));
    this.testSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.testSearchText.set(v || ''));
    this.voidCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.voidCodeSearchText.set(v || ''));
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadInitialData();
      });
  }

  private loadInitialData(): void {
    this.apiService.getTechMode()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (mode) => {
          this.techMode.set(mode);
          this.loadTestBatches(mode.techMode);
        },
        error: () => {
          this.techMode.set({ techMode: '0', isTwoTechMode: false, isFirstTech: false });
          this.loadTestBatches('0');
        },
      });

    this.apiService.getVoidReasonCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => this.voidReasonCodes.set(codes),
        error: (error) => this.handleError('Failed to load void reason codes', error),
      });
  }

  private loadTestBatches(techMode: string): void {
    this.apiService.getTestBatches(undefined, techMode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batches) => this.testBatches.set(batches),
        error: (error) => this.handleError('Failed to load test batches', error),
      });
  }

  private loadTestsInBatch(tbId: string): void {
    this.apiService.getTestsInBatch(tbId, this.techMode().techMode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => this.testsInBatch.set(tests),
        error: (error) => this.handleError('Failed to load tests in batch', error),
      });
  }

  onRetrieve(): void {
    Object.keys(this.filterForm.controls).forEach((key) => {
      this.filterForm.get(key)?.markAsTouched();
    });

    if (!this.filterForm.get('batchId')?.value || !this.filterForm.get('testId')?.value) {
      return;
    }

    const batchId = this.filterForm.value.batchId;
    const testId = this.filterForm.value.testId;

    this.loading.set(true);

    this.apiService.getUnitsInBatch(batchId, testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          if (units.length === 0) {
            this.snackbarService.showError('No voidable units found for the selected batch and test.');
            this.hasResults.set(false);
            this.loading.set(false);
            return;
          }
          const mapped = units.map(u => ({
            ...u,
            unitIdDisplay: u.chkDigit ? `${u.unitId}-${u.chkDigit}` : u.unitId,
          }));
          this.unitsInBatch.set(units);
          this.dataSource = mapped;
          this.hasResults.set(true);
          this.loading.set(false);
        },
        error: (error) => {
          this.handleError('Failed to retrieve units in batch', error);
          this.loading.set(false);
        },
      });
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.clearResults();
    this.selectedVoidCodeDescription.set('-');
  }

  private clearResults(): void {
    this.unitsInBatch.set([]);
    this.dataSource = [];
    this.hasResults.set(false);
  }

  onSearch(searchTerm: string): void {
    const units = this.unitsInBatch();
    if (!searchTerm) {
      this.dataSource = units.map(u => ({
        ...u,
        unitIdDisplay: u.chkDigit ? `${u.unitId}-${u.chkDigit}` : u.unitId,
      }));
      return;
    }
    const term = searchTerm.toLowerCase();
    this.dataSource = units
      .filter(u =>
        u.unitId.toLowerCase().includes(term) ||
        u.testId.toLowerCase().includes(term) ||
        (u.resultStatus1 ?? '').toLowerCase().includes(term)
      )
      .map(u => ({
        ...u,
        unitIdDisplay: u.chkDigit ? `${u.unitId}-${u.chkDigit}` : u.unitId,
      }));
  }

  onSortChange(event: { column: string; direction: 'A' | 'D' | 'default' }): void {
    this.sortState.set({ column: event.column, direction: event.direction });
    if (event.column === 'tbSeqNo') {
      this.dataSource = [...this.dataSource].sort((a, b) => {
        const aVal = a.tbSeqNo ?? 0;
        const bVal = b.tbSeqNo ?? 0;
        return event.direction === 'A' ? aVal - bVal : bVal - aVal;
      });
    }
  }

  onVoidBatch(): void {
    if (!this.filterForm.get('voidCode')?.value) {
      this.filterForm.get('voidCode')?.markAsTouched();
      this.snackbarService.showError('Please select a void reason code before voiding the batch.');
      return;
    }

    const batchId = this.filterForm.value.batchId;

    this.apiService.checkQcUnits(batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (hasQcUnits) => {
          this.openConfirmDialog(hasQcUnits);
        },
        error: () => {
          this.openConfirmDialog(false);
        },
      });
  }

  private openConfirmDialog(hasQcUnits: boolean): void {
    const dialogRef = this.dialog.open(VoidBatchConfirmationDialogComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: true,
      data: { hasQcUnits },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.performVoid();
        }
      });
  }

  private performVoid(): void {
    const batchId = this.filterForm.value.batchId;
    const testId = this.filterForm.value.testId;
    const voidCode = this.filterForm.value.voidCode;

    this.loading.set(true);

    this.apiService.voidTestBatch({
      tbId: batchId,
      testId: testId,
      voidReasonCode: voidCode,
      isTwoTechMode: this.techMode().isTwoTechMode,
      isFirstTech: this.techMode().isFirstTech,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response?.isStagedForSecondTech) {
            this.snackbarService.showSuccess('Void staged for second technician approval.');
          } else {
            this.snackbarService.showSuccess('The batch has been voided.');
          }
          this.onClearAll();
          this.loadInitialData();
        },
        error: (error) => {
          this.loading.set(false);
          this.handleVoidError(error);
        },
      });
  }

  private handleError(context: string, error: any): void {
    console.error(context, error);
    const errorMessage = error?.error?.message || error?.message || 'An unexpected error occurred. Please try again.';
    this.snackbarService.showError(errorMessage);
  }

  private handleVoidError(error: any): void {
    console.error('Void operation failed:', error);

    if (error?.error?.message) {
      this.snackbarService.showError(error.error.message);
      return;
    }

    const fallbackMessages: Record<string, string> = {
      '1233': 'No valid test batch found for voiding.',
      '1227': 'Test not found in batch or not valid.',
      '1232': 'Invalid void reason code selected.',
      '1209': 'Same technician cannot perform both voids in two-tech mode.',
      '1208': 'No first void found in staging.',
      '1204': 'No valid VOID interdiction type configured.',
    };

    const errorCode = error?.error?.errorCode;
    const errorMessage = (errorCode && fallbackMessages[errorCode])
      || 'Failed to void the batch. Please try again.';

    this.snackbarService.showError(errorMessage);
  }

  protected formatDate(value: string | Date | null | undefined): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }
}
