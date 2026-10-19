import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-unsaved-changes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './unsaved-changes-dialog.component.html',
  styleUrl: './unsaved-changes-dialog.component.scss',
})
export class UnsavedChangesDialogComponent {
  private dialogRef = inject(MatDialogRef<UnsavedChangesDialogComponent>);

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
