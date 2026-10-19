import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-antigen-test-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './delete-antigen-test-dialog.html',
  styleUrl: './delete-antigen-test-dialog.scss',
})
export class DeleteAntigenTestDialog {
  private dialogRef = inject(MatDialogRef<DeleteAntigenTestDialog>);

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onDelete(): void {
    this.dialogRef.close(true);
  }
}
