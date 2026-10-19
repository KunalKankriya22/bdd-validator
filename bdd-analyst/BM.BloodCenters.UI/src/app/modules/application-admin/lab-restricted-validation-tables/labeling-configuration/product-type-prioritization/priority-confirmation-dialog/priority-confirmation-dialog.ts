import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface PriorityConfirmationData {
  prioritySeq: number;
  barcodeValue: string;
  productType: string;
  mode: 'add' | 'edit';
}

@Component({
  selector: 'app-priority-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './priority-confirmation-dialog.html',
  styleUrls: ['./priority-confirmation-dialog.scss']
})
export class PriorityConfirmationDialog {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PriorityConfirmationData,
    private dialogRef: MatDialogRef<PriorityConfirmationDialog>
  ) {}

  get confirmButtonLabel(): string {
    return this.data.mode === 'add' ? 'CONFIRM & ADD' : 'CONFIRM & SAVE';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close('confirm');
  }
}
