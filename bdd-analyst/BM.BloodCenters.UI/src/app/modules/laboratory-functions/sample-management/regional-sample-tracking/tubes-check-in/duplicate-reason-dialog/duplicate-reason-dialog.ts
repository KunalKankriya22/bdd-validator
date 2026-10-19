import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { DuplicateReasonDto, DuplicateUnitDto } from '../models/tubes-check-in.model';

/**
 * Dialog data interface
 */
export interface DuplicateReasonDialogData {
  unitId: string;
  osUnitId: string;
  errorMessage: string;
  duplicateReasons: DuplicateReasonDto[];
  duplicateHistory?: DuplicateUnitDto[];
}

/**
 * Dialog result interface
 */
export interface DuplicateReasonDialogResult {
  proceed: boolean;
  reasonCode?: string;
  reasonDescription?: string;
}

/**
 * Duplicate Tubes Check-In Dialog
 * Shown when a duplicate unit is detected during check-in
 * Allows user to select a reason and proceed or cancel
 */
@Component({
  selector: 'app-duplicate-reason-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './duplicate-reason-dialog.html',
  styleUrls: ['./duplicate-reason-dialog.scss'],
})
export class DuplicateReasonDialogComponent {
  readonly dialogRef = inject(MatDialogRef<DuplicateReasonDialogComponent>);
  readonly data = inject<DuplicateReasonDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  reasonForm: FormGroup;
  selectedReasonDescription = signal<string | null>(null);

  constructor() {
    // Initialize form
    this.reasonForm = this.fb.group({
      reasonCode: [null, Validators.required]
    });

    // Watch for reason selection changes
    this.reasonForm.get('reasonCode')?.valueChanges.subscribe(code => {
      const selectedReason = this.data.duplicateReasons.find(r => r.code === code);
      this.selectedReasonDescription.set(selectedReason?.description || null);
    });
  }

  onCancel(): void {
    this.dialogRef.close({ proceed: false } as DuplicateReasonDialogResult);
  }

  onProceed(): void {
    if (this.reasonForm.valid) {
      const reasonCode = this.reasonForm.get('reasonCode')?.value;
      const selectedReason = this.data.duplicateReasons.find(r => r.code === reasonCode);

      this.dialogRef.close({
        proceed: true,
        reasonCode: reasonCode,
        reasonDescription: selectedReason?.description
      } as DuplicateReasonDialogResult);
    }
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${day}-${month}-${year}`;
  }
}
