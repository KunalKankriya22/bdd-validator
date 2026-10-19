import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WarningDto } from '../models/verify-component-suitability-offline.model';

export interface WarningOverrideDialogData {
  title: string;
  warnings: WarningDto[];
  allowOverride: boolean;
}

export interface WarningOverrideDialogResult {
  override: boolean;
  codes: string[];
}

@Component({
  selector: 'app-suitability-offline-warning-override-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './warning-override-dialog.html',
  styleUrls: ['./warning-override-dialog.scss'],
})
export class WarningOverrideDialogComponent {
  readonly data = inject<WarningOverrideDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<WarningOverrideDialogComponent>);

  onOverride(): void {
    const result: WarningOverrideDialogResult = {
      override: true,
      codes: this.data.warnings.map((w) => w.code),
    };
    this.dialogRef.close(result);
  }

  onCancel(): void {
    const result: WarningOverrideDialogResult = {
      override: false,
      codes: [],
    };
    this.dialogRef.close(result);
  }
}
