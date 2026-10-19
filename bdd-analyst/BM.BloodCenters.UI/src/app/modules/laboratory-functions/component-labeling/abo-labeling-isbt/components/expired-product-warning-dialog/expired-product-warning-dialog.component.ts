import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface WarningDto {
  code: string;
  message: string;
}

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
  selector: 'app-expired-product-warning-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './expired-product-warning-dialog.component.html',
  styleUrls: ['./expired-product-warning-dialog.component.scss'],
})
export class ExpiredProductWarningDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ExpiredProductWarningDialogComponent>);
  protected readonly data: WarningOverrideDialogData = inject(MAT_DIALOG_DATA);

  onCancel(): void {
    const result: WarningOverrideDialogResult = { override: false, codes: [] };
    this.dialogRef.close(result);
  }

  onOverride(): void {
    const result: WarningOverrideDialogResult = {
      override: true,
      codes: this.data.warnings.map((w) => w.code),
    };
    this.dialogRef.close(result);
  }
}
