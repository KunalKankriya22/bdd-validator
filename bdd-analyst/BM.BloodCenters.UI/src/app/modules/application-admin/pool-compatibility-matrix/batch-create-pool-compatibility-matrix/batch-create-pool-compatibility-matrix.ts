import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';

import { PoolCompatibilityMatrixService } from '../services/pool-compatibility-matrix.service';
import { VALIDATION_POOL_COMPATIBILITY_MATRIX } from 'src/app/core/constants/validation.constants';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT } from 'src/app/core/utils/date-adapter.util';
import {
  ProductTypeOption,
  WorkOptionModel,
  PoolCompatibilityMatrixBatchResponse,
  BatchCreateResultItem
} from '../models/pool-compatibility-matrix.model';

@Component({
  selector: 'app-batch-create-pool-compatibility-matrix',
  standalone: true,
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './batch-create-pool-compatibility-matrix.html',
  styleUrls: ['./batch-create-pool-compatibility-matrix.scss'],
})
export class BatchCreatePoolCompatibilityMatrix implements OnInit {
  form!: FormGroup;
  readonly VALIDATION = VALIDATION_POOL_COMPATIBILITY_MATRIX.POOL_COMPATIBILITY_MATRIX_TABLE;

  workOptionOptions: WorkOptionModel[] = [];
  inventoryProductTypeOptions: ProductTypeOption[] = [];
  finishedProductTypeOptions: ProductTypeOption[] = [];

  isLoading = false;
  showResults = false;
  batchResults: PoolCompatibilityMatrixBatchResponse | null = null;

  constructor(
    public dialogRef: MatDialogRef<BatchCreatePoolCompatibilityMatrix>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private poolCompatibilityMatrixService: PoolCompatibilityMatrixService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      records: this.fb.array([])
    });

    this.loadDropdowns();
    this.addRecord(); // Add one initial record
  }

  get records(): FormArray {
    return this.form.get('records') as FormArray;
  }

  createRecordFormGroup(): FormGroup {
    return this.fb.group({
      workOption: ['', [Validators.required, Validators.maxLength(this.VALIDATION.LIMITS.WORK_OPTION_MAX_LENGTH)]],
      inventoryProductType: ['', [Validators.required, Validators.maxLength(this.VALIDATION.LIMITS.PRODUCT_TYPE_MAX_LENGTH)]],
      finishedInventoryProductType: ['', [Validators.required, Validators.maxLength(this.VALIDATION.LIMITS.PRODUCT_TYPE_MAX_LENGTH)]],
      effectiveDate: [null, Validators.required],
      terminationDate: [null]
    });
  }

  addRecord(): void {
    this.records.push(this.createRecordFormGroup());
  }

  removeRecord(index: number): void {
    if (this.records.length > 1) {
      this.records.removeAt(index);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSaveAll(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open(
        'Please correct the highlighted errors before saving.',
        'DISMISS',
        { duration: 5000 }
      );
      return;
    }

    const records = this.records.value.map((record: any) => ({
      workOption: record.workOption,
      inventoryProductType: record.inventoryProductType,
      finishedInventoryProductType: record.finishedInventoryProductType,
      effectiveDate: record.effectiveDate ? this.formatDate(record.effectiveDate) : '',
      terminationDate: record.terminationDate ? this.formatDate(record.terminationDate) : undefined
    }));

    this.isLoading = true;

    this.poolCompatibilityMatrixService.batchCreatePoolCompatibilityMatrix({ records }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showResults = true;
        this.batchResults = response;

        if (response.failureCount === 0) {
          this.snackBar.open(
            response.message || this.VALIDATION.MESSAGES.BATCH_SUCCESS,
            'DISMISS',
            {
              duration: 5000,
              horizontalPosition: 'right',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            }
          );
        } else {
          const message = `${response.successCount} ${this.VALIDATION.MESSAGES.BATCH_PARTIAL_SUCCESS}, ${response.failureCount} ${this.VALIDATION.MESSAGES.BATCH_PARTIAL_FAILED}`;
          this.snackBar.open(
            message,
            'DISMISS',
            {
              duration: 5000,
              horizontalPosition: 'right',
              verticalPosition: 'top',
              panelClass: ['warning-snackbar']
            }
          );
        }
      },
      error: (error) => {
        this.isLoading = false;
        // Prioritize detailed error message, fallback to message, then default
        const errorMessage = error?.error?.error || error?.error?.message || 'Failed to create records. Please try again.';
      }
    });
  }

  onClose(): void {
    // Only close as successful if there were some successes
    const hasSuccesses = this.batchResults && this.batchResults.successCount > 0;
    this.dialogRef.close(hasSuccesses);
  }

  loadDropdowns(): void {
    forkJoin({
      workOptions: this.poolCompatibilityMatrixService.getWorkOptions(),
      inventoryTypes: this.poolCompatibilityMatrixService.getInventoryProductTypes(),
      finishedTypes: this.poolCompatibilityMatrixService.getFinishedProductTypes()
    }).subscribe({
      next: (res) => {
        this.workOptionOptions = res.workOptions || [];
        this.inventoryProductTypeOptions = res.inventoryTypes || [];
        this.finishedProductTypeOptions = res.finishedTypes || [];
      },
      error: () => {
      }
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  }
}
