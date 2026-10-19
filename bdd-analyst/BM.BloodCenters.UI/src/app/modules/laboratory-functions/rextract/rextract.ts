import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { startWith } from 'rxjs/operators';

import { RextractApiService } from './rextract-api.service';
import {
  RextractContract,
  RextractParameter,
  RextractBatchSummary,
  RextractBatchTest,
  RextractUnitDetail,
  ExecuteExtractRequest,
  ExtractDialogData,
  ExtractDialogResult,
} from './rextract.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ExtractDialogComponent } from './extract-dialog/extract-dialog';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';

/**
 * Re-Extract Test Results
 * Contract → Parameter → Batch selection; per-batch extraction with schedule and RSM report options.
 * JIRA: MLT-13419  Mnemonic: REXTRACT
 */
@Component({
  selector: 'app-rextract',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './rextract.html',
  styleUrls: ['./rextract.scss']
})
export class RextractComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(RextractApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  protected readonly pageHeaderConfig: PageHeaderConfig = {
    title: 'Re-Extract Test Results',
    subtitle: 'Review information about lots used.',
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Re-Extract Test Results', link: null },
    ],
  };

  // Form controls
  protected readonly contractIdControl = new FormControl<string>('');
  protected readonly paramIdControl = new FormControl<string>({ value: '', disabled: true });
  protected readonly contractSearchCtrl = new FormControl('');

  // Signal mirrors used in computed() (FormControl values are not signal-tracked)
  private readonly _contractId = signal<string>('');
  private readonly _paramId = signal<string>('');

  // Loading states
  protected readonly contractsLoading = signal(false);
  protected readonly parametersLoading = signal(false);
  protected readonly batchesLoading = signal(false);
  protected readonly unitsLoading = signal(false);
  protected readonly extracting = signal(false);

  // Data
  protected readonly contracts = signal<RextractContract[]>([]);
  protected readonly filteredContracts = signal<RextractContract[]>([]);
  protected readonly parameters = signal<RextractParameter[]>([]);
  protected readonly batches = signal<RextractBatchSummary[]>([]);
  protected readonly batchTests = signal<RextractBatchTest[]>([]);
  protected readonly units = signal<RextractUnitDetail[]>([]);
  protected readonly selectedBatch = signal<RextractBatchSummary | null>(null);
  protected readonly hasResults = signal(false);
  protected readonly error = signal<string | null>(null);

  // Derived
  protected readonly contractDescription = computed(() =>
    this.contracts().find(c => c.contractId === this._contractId())?.company ?? ''
  );
  protected readonly batchTestCount = computed(() => this.batchTests().length);
  protected readonly canRetrieve = computed(() =>
    !!this._contractId() && !!this._paramId() && !this.batchesLoading()
  );

  protected readonly unitColumns = ['batchTestId', 'unitId', 'chkDigit', 'osUnitId', 'osChkDigit', 'testId', 'testSeqNo', 'resultStatus1', 'collDate'];

  ngOnInit(): void {
    this.loadContracts();

    this.contractSearchCtrl.valueChanges.pipe(
      startWith(''),
      takeUntil(this.destroy$)
    ).subscribe(() => this.filteredContracts.set(this.applyContractFilter()));

    this.contractIdControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(contractId => {
        this._contractId.set(contractId ?? '');
        this._paramId.set('');
        this.paramIdControl.setValue('', { emitEvent: false });
        this.parameters.set([]);
        this.batches.set([]);
        this.batchTests.set([]);
        this.units.set([]);
        this.selectedBatch.set(null);
        this.hasResults.set(false);
        this.error.set(null);

        if (contractId) {
          this.paramIdControl.enable({ emitEvent: false });
          this.loadParameters(contractId);
        } else {
          this.paramIdControl.disable({ emitEvent: false });
        }
      });

    this.paramIdControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(paramId => this._paramId.set(paramId ?? ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadContracts(): void {
    this.contractsLoading.set(true);
    this.apiService.getContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts) => {
          this.contracts.set(contracts);
          this.filteredContracts.set(this.applyContractFilter());
          this.contractsLoading.set(false);
        },
        error: () => {
          this.error.set('Failed to load contracts. Please refresh the page.');
          this.contractsLoading.set(false);
        }
      });
  }

  private applyContractFilter(): RextractContract[] {
    const all = this.contracts();
    const search = this.contractSearchCtrl.value?.toLowerCase() ?? '';
    if (!search) return all;
    return all.filter(c =>
      c.contractId.toLowerCase().includes(search) ||
      c.company.toLowerCase().includes(search)
    );
  }

  private loadParameters(contractId: string): void {
    this.parametersLoading.set(true);
    this.apiService.getParameters(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (params) => {
          this.parameters.set(params);
          this.parametersLoading.set(false);
        },
        error: () => {
          this.error.set('Failed to load parameters for the selected contract.');
          this.parametersLoading.set(false);
        }
      });
  }

  protected onRetrieve(): void {
    if (!this.canRetrieve()) return;

    this.batchesLoading.set(true);
    this.batches.set([]);
    this.batchTests.set([]);
    this.units.set([]);
    this.selectedBatch.set(null);
    this.hasResults.set(true);
    this.error.set(null);

    this.apiService.getBatches(this.contractIdControl.value!, this.paramIdControl.value!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batches) => {
          this.batches.set(batches);
          this.batchesLoading.set(false);
          if (batches.length > 0) {
            this.onSelectBatch(batches[0]);
          }
        },
        error: () => {
          this.error.set('Failed to load batches. Please try again.');
          this.batchesLoading.set(false);
        }
      });
  }

  protected onClearAll(): void {
    this.contractSearchCtrl.setValue('');
    this.contractIdControl.setValue('');
    // contractIdControl.valueChanges subscription clears the rest
  }

  protected onSelectBatch(batch: RextractBatchSummary): void {
    this.selectedBatch.set(batch);
    this.units.set([]);
    this.batchTests.set([]);
    this.unitsLoading.set(true);

    const contractId = this.contractIdControl.value!;

    forkJoin({
      tests: this.apiService.getBatchTests(batch.batchId, contractId, batch.profileSetId, batch.profileSeqNo),
      units: this.apiService.getBatchUnits(batch.batchId, contractId, batch.batchChapterId, batch.insertDats),
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ tests, units }) => {
        this.batchTests.set(tests);
        const merged: RextractUnitDetail[] = units.map((u, i) => ({
          ...u,
          batchTestId: tests[i]?.testId ?? '',
        }));
        this.units.set(merged);
        this.unitsLoading.set(false);
      },
      error: () => {
        this.snackbarService.showError('Failed to load batch details. Please try again.');
        this.unitsLoading.set(false);
      }
    });
  }

  protected onExtract(): void {
    const batch = this.selectedBatch();
    if (!batch || this.extracting()) return;

    const data: ExtractDialogData = {
      contractId: this.contractIdControl.value ?? undefined,
      resultParmId: this.paramIdControl.value ?? undefined,
    };

    const dialogRef = this.dialog.open(ExtractDialogComponent, {
      width: '560px',
      disableClose: true,
      data,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: ExtractDialogResult | undefined) => {
        if (!result?.success) return;
        this.executeExtract(result);
      });
  }

  private executeExtract(dialogResult: ExtractDialogResult): void {
    this.extracting.set(true);

    const request: ExecuteExtractRequest = {
      contractId: this.contractIdControl.value ?? '',
      resultParmId: this.paramIdControl.value ?? '',
      extractTime: dialogResult.extractDate ?? '',
      rsmAutoReport: dialogResult.generateRsmReport ? 'Y' : 'N',
    };

    this.apiService.executeExtract(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.extracting.set(false);
          if (response.success) {
            this.snackbarService.showSuccess('Re-extraction submitted successfully.');
            this.onRetrieve();
          } else {
            const msg = response.errors?.[0]?.message ?? 'Re-extraction failed.';
            this.snackbarService.showError(msg);
          }
        },
        error: (err) => {
          this.extracting.set(false);
          const msg = err?.error?.message ?? 'Failed to submit for re-extraction.';
          this.snackbarService.showError(msg);
        }
      });
  }
}
