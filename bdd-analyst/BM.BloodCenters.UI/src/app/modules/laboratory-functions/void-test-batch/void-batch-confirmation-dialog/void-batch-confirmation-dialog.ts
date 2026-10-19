import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-void-batch-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './void-batch-confirmation-dialog.html',
  styleUrl: './void-batch-confirmation-dialog.scss',
})
export class VoidBatchConfirmationDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<VoidBatchConfirmationDialogComponent>);
  protected readonly data: { hasQcUnits: boolean } = inject(MAT_DIALOG_DATA);

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
