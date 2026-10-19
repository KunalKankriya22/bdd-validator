import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { WarningDto } from '../models/lab-warehouse-check-in.model';

export interface WarningOverrideDialogData {
  title: string;
  warnings: WarningDto[];
  allowOverride: boolean;
}

export interface WarningOverrideDialogResult {
  override: boolean;
  codes: string[];
}

/**
 * Warning Override Dialog Component
 * Displays validation warnings and allows user to override them
 */
@Component({
  selector: 'app-warning-override-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatListModule],
  templateUrl: './warning-override-dialog.html',
  styleUrls: ['./warning-override-dialog.scss'],
})
export class WarningOverrideDialogComponent {
  readonly data = inject<WarningOverrideDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<WarningOverrideDialogComponent>);

  /**
   * User chooses to override warnings
   */
  onOverride(): void {
    const result: WarningOverrideDialogResult = {
      override: true,
      codes: this.data.warnings.map((w) => w.code),
    };
    this.dialogRef.close(result);
  }

  /**
   * User cancels and does not override warnings
   */
  onCancel(): void {
    const result: WarningOverrideDialogResult = {
      override: false,
      codes: [],
    };
    this.dialogRef.close(result);
  }
}
