import { Component, Inject, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { ISBTUnitCheckDigitService } from './isbt-unit-check-digit.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  ISBTUnitCheckDigitDialogData,
  ISBTUnitCheckDigitDialogResult,
  ISBTCheckDigitResult
} from './isbt-unit-check-digit.model';

@Component({
  selector: 'app-isbt-unit-check-digit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './isbt-unit-check-digit.html',
  styleUrls: ['./isbt-unit-check-digit.scss']
})
export class ISBTUnitCheckDigitDialog implements OnInit, OnDestroy, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly isbtService = inject(ISBTUnitCheckDigitService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('unitIdInput') unitIdInput!: ElementRef<HTMLInputElement>;

  unitIdForm!: FormGroup;
  results: ISBTCheckDigitResult[] = [];
  loading = false;
  statusAnnouncement = '';

  constructor(
    public dialogRef: MatDialogRef<ISBTUnitCheckDigitDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ISBTUnitCheckDigitDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();

    if (this.data?.prefilledUnitId) {
      this.unitIdForm.patchValue({ unitId: this.data.prefilledUnitId });
    }
  }

  ngAfterViewInit(): void {
    this.focusUnitIdInput();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.unitIdForm = this.fb.group({
      unitId: ['', [
        (control: AbstractControl): ValidationErrors | null => {
          if (!control.value) return null;
          const value = String(control.value);
          if (/\s/.test(value)) return { whitespace: true };
          return value.length === 13 ? null : { exactLength: true };
        }
      ]]
    });

    this.subscribeToInputTransform();
  }

  private subscribeToInputTransform(): void {
    const unitIdControl = this.unitIdForm.get('unitId');
    unitIdControl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (!value) return;
        const transformed = String(value).replace(/\s/g, '').toUpperCase();
        if (transformed !== value) {
          unitIdControl.setValue(transformed, { emitEvent: false });
        }
      });
  }

  onRetrieve(): void {
    if (this.unitIdForm.invalid) {
      this.unitIdForm.markAllAsTouched();
      this.focusUnitIdInput();
      return;
    }

    const unitId = this.unitIdForm.value.unitId;
    if (!unitId) {
      this.unitIdForm.get('unitId')?.setErrors({ required: true });
      this.unitIdForm.markAllAsTouched();
      this.focusUnitIdInput();
      return;
    }

    // Check for duplicate Unit ID
    const isDuplicate = this.results.some(result => result.unitId === unitId);
    if (isDuplicate) {
      this.snackbarService.showError('This Unit ID has already been added');
      return;
    }

    this.loading = true;

    this.isbtService.calculateCheckDigit({ unitId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.results.unshift(response.data);
            this.unitIdForm.patchValue({ unitId: '' });
            this.unitIdForm.markAsUntouched();
            this.announceStatus(`Check digit calculated. ${this.results.length} result${this.results.length === 1 ? '' : 's'} displayed`);
          } else if (response.errorResponse?.error) {
            this.snackbarService.showError(response.errorResponse.error);
          }
          this.loading = false;
          this.focusUnitIdInput();
        },
        error: (error) => {
          const errorMessage = error?.error?.errorResponse?.error ||
                               error?.error?.message ||
                               'Failed to calculate check digit';
          this.snackbarService.showError(errorMessage);
          this.loading = false;
          this.focusUnitIdInput();
        }
      });
  }

  onClearAll(): void {
    this.unitIdForm.reset();
    this.results = [];
    this.announceStatus('All results cleared');
    this.focusUnitIdInput();
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' } as ISBTUnitCheckDigitDialogResult);
  }

  private focusUnitIdInput(): void {
    setTimeout(() => this.unitIdInput?.nativeElement?.focus());
  }

  private announceStatus(message: string): void {
    this.statusAnnouncement = '';
    setTimeout(() => this.statusAnnouncement = message);
  }

  getUnitIdError(): string {
    const control = this.unitIdForm.get('unitId');
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Please enter a Unit ID';
    }
    if (control.hasError('whitespace')) {
      return 'Unit ID must not contain spaces';
    }
    if (control.hasError('exactLength')) {
      return 'Unit ID must be exactly 13 characters';
    }
    return '';
  }
}
