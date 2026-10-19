import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

interface ManualUnitEntryData {
  tubeType: 'R' | 'P1' | 'P2';
}

@Component({
  selector: 'app-manual-unit-entry-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './manual-unit-entry-dialog.html',
  styleUrls: ['./manual-unit-entry-dialog.scss']
})
export class ManualUnitEntryDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ManualUnitEntryDialogComponent>);
  readonly data = inject<ManualUnitEntryData>(MAT_DIALOG_DATA);

  manualEntryForm: FormGroup;

  constructor() {
    this.manualEntryForm = this.fb.group({
      collectionId: ['', [Validators.required, Validators.maxLength(6)]],
      collectionYear: ['', [Validators.required, Validators.pattern(/^\d{2}$/)]],
      serialNumber: ['', [Validators.required, Validators.pattern(/^\d{1,6}$/)]],
    });
  }

  getTubeTypeLabel(): string {
    switch (this.data.tubeType) {
      case 'R': return 'Red Top';
      case 'P1': return 'Purple Top 1';
      case 'P2': return 'Purple Top 2';
      default: return '';
    }
  }

  getPreviewUnitId(): string {
    const collId = this.manualEntryForm.get('collectionId')?.value || '';
    const year = this.manualEntryForm.get('collectionYear')?.value || '';
    const serial = this.manualEntryForm.get('serialNumber')?.value || '';

    if (!collId || !year || !serial) return '';

    return `${collId}-${year}-${serial.padStart(6, '0')}`;
  }

  onSubmit(): void {
    if (this.manualEntryForm.invalid) return;

    const { collectionId, collectionYear, serialNumber } = this.manualEntryForm.value;

    // Format: COLLID-YY-SERIAL (e.g., ABC123-24-000001)
    const unitId = `${collectionId}-${collectionYear}-${serialNumber.padStart(6, '0')}`;

    this.dialogRef.close(unitId);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
