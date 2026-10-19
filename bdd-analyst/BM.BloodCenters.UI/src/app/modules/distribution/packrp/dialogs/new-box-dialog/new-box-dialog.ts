import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface NewBoxDialogData {
  pickSlipId?: string;
  warning?: string;
}

/**
 * New Box Dialog Component
 * Prompts user to create a new box when current box is full
 * Shows warning if plasma count exceeds acceptable limit
 */
@Component({
  selector: 'app-new-box-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './new-box-dialog.html',
  styleUrls: ['./new-box-dialog.scss']
})
export class NewBoxDialogComponent {
  readonly data = inject<NewBoxDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<NewBoxDialogComponent>);

  /**
   * User confirms to create new box
   */
  onNewBox(): void {
    this.dialogRef.close({ action: 'new' });
  }

  /**
   * User cancels and goes back
   */
  onGoBack(): void {
    this.dialogRef.close({ action: 'cancel' });
  }
}
