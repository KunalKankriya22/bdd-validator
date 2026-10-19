import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface CloseBatchDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-close-batch-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './close-batch-dialog.html',
  styleUrls: ['./close-batch-dialog.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CloseBatchDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CloseBatchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CloseBatchDialogData
  ) {
    if (!data.confirmText) data.confirmText = 'CONFIRM';
    if (!data.cancelText) data.cancelText = 'CANCEL';
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
