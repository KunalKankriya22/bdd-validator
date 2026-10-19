import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';

import { SampleTypeSelectionDialogData } from '../../models/additional-test-scheduling.model';

@Component({
  selector: 'app-sample-type-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatRadioModule
  ],
  templateUrl: './sample-type-selection-dialog.html',
  styleUrl: './sample-type-selection-dialog.scss'
})
export class SampleTypeSelectionDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<SampleTypeSelectionDialogComponent>);
  protected readonly data = inject<SampleTypeSelectionDialogData>(MAT_DIALOG_DATA);

  protected selectedSampleType = signal<string | null>(null);

  // FMB: SELECT_FLAG can only have one row 'X' at a time (radio behaviour)
  onSelect(sampleType: string): void {
    this.selectedSampleType.set(sampleType);
  }

  onConfirm(): void {
    const selected = this.selectedSampleType();
    if (!selected) return;
    this.dialogRef.close(selected);
  }
}
