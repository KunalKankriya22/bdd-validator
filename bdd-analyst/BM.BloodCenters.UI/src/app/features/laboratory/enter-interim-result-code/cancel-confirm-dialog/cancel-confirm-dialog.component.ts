import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-cancel-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './cancel-confirm-dialog.component.html',
  styleUrl: './cancel-confirm-dialog.component.scss',
})
export class CancelConfirmDialogComponent {
  private dialogRef = inject(MatDialogRef<CancelConfirmDialogComponent>);

  onNo(): void {
    this.dialogRef.close(false);
  }

  onYes(): void {
    this.dialogRef.close(true);
  }
}
