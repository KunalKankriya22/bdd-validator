import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { formatTableDate, formatTableDateTime } from '@shared/utils/date-format.util';

import { ExtractTestResultsApiService } from './services/extract-test-results-api.service';
import { ExtractTestResultsDialogComponent } from './extract-test-results-dialog/extract-test-results-dialog';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import {
  ContractDto,
  BatchDto,
  UnitDto,
  RESULT_TYPES,
  ResultType,
  BatchWithSelection,
} from './models/extract-test-results.model';

@Component({
  selector: 'app-extract-test-results',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatDividerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './extract-test-results.html',
  styleUrl: './extract-test-results.scss',
})
export class ExtractTestResultsComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ExtractTestResultsApiService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/' }],
  };

  // Contract search
  contractSearchCtrl = new FormControl('');
  private contractSearchText = signal('');
  private selectedContractId = signal('');
  readonly filteredContracts = computed(() => {
    const s = this.contractSearchText().toLowerCase();
    return !s
      ? this.contracts()
      : this.contracts().filter(
          (c) =>
            c.contractId.toLowerCase().includes(s) ||
            c.contractName.toLowerCase().includes(s),
        );
  });

  readonly contractDescription = computed(() => {
    const id = this.selectedContractId();
    if (!id) return '-';
    const c = this.contracts().find((x) => x.contractId === id);
    return c ? c.contractName : '-';
  });

  protected readonly selectedContract = computed(() => {
    const id = this.selectedContractId();
    if (!id) return null;
    return this.contracts().find((x) => x.contractId === id) ?? null;
  });

  // State
  protected readonly contracts = signal<ContractDto[]>([]);
  protected readonly batches = signal<BatchWithSelection[]>([]);
  protected readonly units = signal<UnitDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadingUnits = signal(false);
  protected readonly batchesRetrieved = signal(false);
  protected readonly parameterIdGenerated = signal<string | null>(null);
  protected readonly selectedBatch = signal<BatchDto | null>(null);
  protected readonly selectedBatchIds = signal<string[]>([]);
  protected readonly selectedUnitIds = signal<string[]>([]);
  protected readonly focusedUnit = signal<UnitDto | null>(null);
  protected readonly currentBatchPage = signal(1);
  protected readonly totalBatchPages = signal(0);

  // Computed
  protected readonly showResults = computed(
    () => this.batchesRetrieved() && this.batches().length > 0,
  );

  // Forms
  filterForm!: FormGroup;
  protected readonly resultTypes: ResultType[] = RESULT_TYPES;

  // Table configs
  batchTableConfig: DataTableConfig<BatchWithSelection> = this.buildBatchTableConfig(0);
  unitTableConfig: DataTableConfig<UnitDto> = this.buildUnitTableConfig(0);

  emptyTableConfig: DataTableConfig = {
    columns: [],
    noDataIcon: 'search',
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter search criteria to view results',
    showPagination: false,
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/' },
            { label: pageData.title, link: null },
          ],
        };
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadContracts();
    this.setupSearchControls();

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadContracts();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      contractId: ['', [Validators.required]],
      resultType: ['', [Validators.required]],
    });
  }

  private setupSearchControls(): void {
    this.contractSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.contractSearchText.set(v || ''));

    this.filterForm
      .get('contractId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.selectedContractId.set(val || ''));
  }

  private loadContracts(): void {
    this.apiService
      .getActiveContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts) => {
          this.contracts.set(contracts);
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
        },
      });
  }

  onDropdownOpened(opened: boolean): void {
    if (!opened) {
      this.contractSearchCtrl.setValue('');
    }
  }

  onRetrieve(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    const chapterId = this.headerService.getCurrentChapterId();
    const contractId = this.filterForm.get('contractId')?.value;
    const resultType = this.filterForm.get('resultType')?.value;

    this.loading.set(true);
    this.batchesRetrieved.set(false);
    this.batches.set([]);
    this.units.set([]);
    this.selectedBatch.set(null);
    this.selectedBatchIds.set([]);
    this.selectedUnitIds.set([]);

    this.apiService
      .getBatches(100, 0, { contractId, resultType, chapterId: chapterId || '' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const batchesWithSelection: BatchWithSelection[] = response.data.map(
            (batch) => ({ ...batch, selected: false }),
          );
          this.batches.set(batchesWithSelection);
          this.totalBatchPages.set(batchesWithSelection.length);
          this.currentBatchPage.set(1);
          this.batchTableConfig = this.buildBatchTableConfig(response.data.length);
          this.batchesRetrieved.set(true);
          this.loading.set(false);

          if (response.data.length > 0) {
            this.onBatchClick(batchesWithSelection[0]);
          }

          this.cdr.markForCheck();
        },
        error: () => {
          this.loading.set(false);
          this.batchesRetrieved.set(true);
          this.cdr.markForCheck();
        },
      });
  }

  onClearAll(): void {
    this.filterForm.reset({ contractId: '', resultType: '' });
    this.contractSearchCtrl.setValue('');
    this.selectedContractId.set('');
    this.batches.set([]);
    this.units.set([]);
    this.selectedBatch.set(null);
    this.selectedBatchIds.set([]);
    this.selectedUnitIds.set([]);
    this.focusedUnit.set(null);
    this.parameterIdGenerated.set(null);
    this.batchesRetrieved.set(false);
    this.currentBatchPage.set(1);
    this.totalBatchPages.set(0);
  }

  onBatchClick(batch: BatchWithSelection): void {
    this.selectedBatch.set(batch);
    this.focusedUnit.set(null);
    const index = this.batches().findIndex((b) => b.batchId === batch.batchId);
    if (index >= 0) {
      this.currentBatchPage.set(index + 1);
    }
    this.loadUnitsForBatch(batch.batchId);
  }

  onUnitClick(unit: UnitDto): void {
    this.focusedUnit.set(unit);
  }

  onBatchSelectionChange(selected: BatchWithSelection[]): void {
    this.selectedBatchIds.set(selected.map((b) => b.batchId));
  }

  private loadUnitsForBatch(batchId: string): void {
    const chapterId = this.headerService.getCurrentChapterId();
    const contractId = this.filterForm.get('contractId')?.value;
    this.loadingUnits.set(true);

    this.apiService
      .getUnits(100, 0, {
        batchIds: [batchId],
        chapterId: chapterId || '',
        contractId: contractId || '',
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.units.set(response.data);
          this.unitTableConfig = this.buildUnitTableConfig(response.total);
          this.loadingUnits.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.units.set([]);
          this.loadingUnits.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  async onExtract(): Promise<void> {
    const dialogRef = this.dialog.open(ExtractTestResultsDialogComponent, {
      width: '600px',
      disableClose: true,
      autoFocus: true,
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (!result) return;

    const chapterId = this.headerService.getCurrentChapterId();
    const contractId = this.filterForm.get('contractId')?.value;
    const resultType = this.filterForm.get('resultType')?.value;
    const contract = this.selectedContract();

    this.loading.set(true);

    this.apiService
      .createExtraction({
        contractId,
        resultType,
        chapterId: chapterId || '',
        centerId: contract?.centerId ?? null,
        resultsMethod: contract?.resultsMethod ?? null,
        selectedBatches: this.selectedBatchIds(),
        selectedUnits: this.selectedUnitIds(),
        afterTime: result.afterTime,
        rsmAutoReport: result.rsmAutoReport,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.parameterIdGenerated.set(response.resultParmId);
          this.snackbarService.showSuccess(
            `Extract is successful and here is the parameter ID that is generated "${response.resultParmId}"`
          );
          this.batches.set(
            this.batches().map((b) => ({ ...b, selected: false })),
          );
          this.selectedBatchIds.set([]);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  onPrevBatch(): void {
    const page = this.currentBatchPage();
    if (page > 1) {
      const prevBatch = this.batches()[page - 2];
      if (prevBatch) {
        this.onBatchClick(prevBatch);
      }
    }
  }

  onNextBatch(): void {
    const page = this.currentBatchPage();
    if (page < this.totalBatchPages()) {
      const nextBatch = this.batches()[page];
      if (nextBatch) {
        this.onBatchClick(nextBatch);
      }
    }
  }

  onNonExtractedBatches(): void {
    const contractId = this.filterForm.get('contractId')?.value;
    this.router.navigate(['/laboratory-functions/non-extracted-batches-query'], {
      queryParams: contractId ? { contractId } : {},
    });
  }

  onBatchesInProgress(): void {
    const contractId = this.filterForm.get('contractId')?.value;
    this.router.navigate(['/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/batch-in-progress-query'], {
      queryParams: contractId ? { contractId } : {},
    });
  }

  onSamplesQuery(): void {
    const unitId = this.focusedUnit()?.unitId ?? null;
    this.router.navigate(['/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/samples-query'], {
      queryParams: unitId ? { unitId } : {},
      state: { alreadyParsed: true, fromExtractTestResults: true },
    });
  }

  private buildBatchTableConfig(count: number): DataTableConfig<BatchWithSelection> {
    return {
      columns: [
        { key: 'batchId', header: `Batch ID (${count})`, sortable: false, type: 'text', minWidth: '140px' },
        { key: 'chapterId', header: 'Chapter', sortable: false, type: 'text', minWidth: '80px' },
        { key: 'unitCount', header: 'Count', sortable: false, type: 'number', minWidth: '60px' },
      ],
      enableSelection: true,
      selectionKey: 'batchId' as keyof BatchWithSelection,
      stickyHeader: true,
      showPagination: false,
      emptyMessage: 'No batches found',
      enableRowHighlight: true,
    };
  }

  private buildUnitTableConfig(count: number): DataTableConfig<UnitDto> {
    return {
      columns: [
        { key: 'unitId', header: `Unit ID (${count})`, sortable: false, type: 'text', minWidth: '160px' },
        { key: 'osUnitId', header: 'Outside Unit ID', sortable: false, type: 'text', minWidth: '160px',
          valueFormatter: (v: string | null) => v || '-' },
        { key: 'receivedDate', header: 'Received Date', sortable: false, type: 'text', minWidth: '130px',
          valueFormatter: (v: string | null) => formatTableDate(v) },
        { key: 'qcCheckinDate', header: 'QC Date', sortable: false, type: 'text', minWidth: '170px',
          valueFormatter: (v: string | null) => formatTableDateTime(v) },
      ],
      stickyHeader: true,
      showPagination: false,
      emptyMessage: 'Select a batch to view units',
      enableRowHighlight: true,
    };
  }

  get f() {
    return this.filterForm.controls;
  }
}
