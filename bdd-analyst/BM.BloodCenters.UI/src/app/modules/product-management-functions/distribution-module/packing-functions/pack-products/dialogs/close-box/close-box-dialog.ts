import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { CloseBoxDialogData, CloseBoxDialogResult } from '../../models/pack.models';

/**
 * Close Box Confirmation Dialog
 * Confirms user wants to close the box and prevent further additions
 *
 * JIRA: MLT-14015
 */
@Component({
  selector: 'app-close-box-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './close-box-dialog.html',
  styleUrl: './close-box-dialog.scss'
})
export class CloseBoxDialogComponent {
  private static nextId = 0;
  protected readonly componentId = `close-box-${CloseBoxDialogComponent.nextId++}`;

  protected readonly dialogRef = inject(MatDialogRef<CloseBoxDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: CloseBoxDialogData) {}

  /**
   * Cancel and close dialog without confirming
   */
  onCancel(): void {
    const result: CloseBoxDialogResult = { confirmed: false };
    this.dialogRef.close(result);
  }

  /**
   * Confirm box closure
   */
  onConfirm(): void {
    const result: CloseBoxDialogResult = { confirmed: true };
    this.dialogRef.close(result);
  }
}
