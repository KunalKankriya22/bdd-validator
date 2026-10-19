import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ValidationWarning } from '../models/warehouse-checkin.model';

export interface WarningOverrideDialogData {
  title: string;
  warnings: ValidationWarning[];
  allowOverride: boolean;
}

export interface WarningOverrideDialogResult {
  override: boolean;
}

@Component({
  selector: 'app-wh-checkin-warning-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './warning-override-dialog.html',
  styleUrls: ['./warning-override-dialog.scss'],
})
export class WarningOverrideDialogComponent {
  readonly data = inject<WarningOverrideDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<WarningOverrideDialogComponent>);

  onProceed(): void {
    this.dialogRef.close({ override: true } as WarningOverrideDialogResult);
  }

  onCancel(): void {
    this.dialogRef.close({ override: false } as WarningOverrideDialogResult);
  }
}
