import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface DeleteConfirmationData {
  setId: number;
}

@Component({
  selector: 'app-delete-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule
  ],
  templateUrl: './delete-confirmation-dialog.html',
  styleUrls: ['./delete-confirmation-dialog.scss']
})
export class DeleteConfirmationDialog {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DeleteConfirmationData,
    private dialogRef: MatDialogRef<DeleteConfirmationDialog>
  ) {}

  onNo(): void {
    this.dialogRef.close(false);
  }

  onYes(): void {
    this.dialogRef.close(true);
  }
}
