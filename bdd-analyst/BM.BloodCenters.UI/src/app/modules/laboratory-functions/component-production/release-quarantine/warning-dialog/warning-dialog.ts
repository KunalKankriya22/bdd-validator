import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Warning } from '../models/release-quarantine.model';

/**
 * Warning Dialog Data
 */
export interface WarningDialogData {
  warnings: Warning[];
}

/**
 * Warning Dialog Result
 */
export type WarningDialogResult = 'cancel' | 'override';

/**
 * Warning Dialog Component
 * Displays warnings from the save API response and allows user to override or cancel
 * Based on KT document warning logic
 */
@Component({
  selector: 'app-warning-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './warning-dialog.html',
  styleUrl: './warning-dialog.scss'
})
export class WarningDialogComponent {
  private static nextId = 0;
  protected readonly componentId = `warning-dialog-${WarningDialogComponent.nextId++}`;

  readonly data = inject<WarningDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<WarningDialogComponent>);

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  /**
   * User clicked CANCEL button
   * Close dialog and return 'cancel' result
   */
  onCancel(): void {
    this.dialogRef.close('cancel');
  }

  /**
   * User clicked OVERRIDE button
   * Close dialog and return 'override' result
   */
  onOverride(): void {
    this.dialogRef.close('override');
  }
}
