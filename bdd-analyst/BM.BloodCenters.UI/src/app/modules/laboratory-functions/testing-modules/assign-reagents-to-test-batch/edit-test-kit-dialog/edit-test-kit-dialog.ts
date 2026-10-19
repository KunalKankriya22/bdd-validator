import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize } from 'rxjs';

import { SnackbarService } from '@shared/services/snackbar.service';
import { AssignReagentsToTestBatchService } from '../services/assign-reagents-to-test-batch.service';
import {
  EditTestKitDialogData,
  EditTestKitDialogResult,
  TestKitOption
} from '../models/assign-reagents-to-test-batch.model';

@Component({
  selector: 'app-edit-test-kit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './edit-test-kit-dialog.html',
  styleUrls: ['./edit-test-kit-dialog.scss']
})
export class EditTestKitDialogComponent implements OnInit, OnDestroy {

  form!: FormGroup;
  isSubmitting = false;
  isLoadingTestKits = false;

  testId = '';
  testDesc = '';

  testKitOptions: TestKitOption[] = [];
  filteredTestKitOptions: TestKitOption[] = [];
  testKitSearchControl = new FormControl('');

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: AssignReagentsToTestBatchService,
    private snackbarService: SnackbarService,
    private dialogRef: MatDialogRef<EditTestKitDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditTestKitDialogData
  ) {}

  ngOnInit(): void {
    this.initializeFromData();
    this.createForm();
    this.loadTestKitOptions();
    this.setupTestKitSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeFromData(): void {
    if (!this.data?.test) {
      this.dialogRef.close();
      return;
    }

    this.testId = this.data.test.testId;
    this.testDesc = this.data.test.testDesc || '';
  }

  private createForm(): void {
    this.form = this.fb.group({
      testKitId: [this.data?.test?.testKitId || null, Validators.required]
    });
  }

  private loadTestKitOptions(): void {
    if (!this.testId) {
      return;
    }

    this.isLoadingTestKits = true;
    this.service.getTestKitOptions(this.data.testBatchId, this.testId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingTestKits = false)
      )
      .subscribe({
        next: (options) => {
          this.testKitOptions = options;
          this.filteredTestKitOptions = [...options];
        },
        error: (err) => {
          this.testKitOptions = [];
          this.filteredTestKitOptions = [];
          this.snackbarService.showError(err?.error?.message);
        }
      });
  }

  private setupTestKitSearch(): void {
    this.testKitSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        const term = (searchTerm || '').toLowerCase();
        this.filteredTestKitOptions = this.testKitOptions.filter((kit) =>
          kit.testKitId.toLowerCase().includes(term) ||
          kit.displayName.toLowerCase().includes(term)
        );
      });
  }

  onTestKitDropdownOpened(opened: boolean): void {
    if (opened) {
      this.testKitSearchControl.setValue('');
      this.filteredTestKitOptions = [...this.testKitOptions];
    }
  }

  get isFormValid(): boolean {
    return this.form.valid && this.form.dirty;
  }

  onSave(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.isSubmitting = true;
    const testKitId = this.form.get('testKitId')?.value;

    this.service.assignReagentToTest(
      this.data.testBatchId,
      this.testId,
      { testKitId }
    )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackbarService.showSuccess(response.message);
            const result: EditTestKitDialogResult = { success: true, promptWorksheet: true };
            this.dialogRef.close(result);
          } else {
            this.snackbarService.showError(response.message);
          }
        },
        error: (err) => {
          this.snackbarService.showError(err?.error?.message);
        }
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
