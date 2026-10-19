import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface WarningDto {
  code: string;
  message: string;
}

export interface BandValuesWarningDialogData {
  title: string;
  warnings: WarningDto[];
}

export interface BandValuesWarningDialogResult {
  override: boolean;
  codes: string[];
}

@Component({
  selector: 'app-band-values-warning-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './band-values-warning-dialog.html',
  styleUrl: './band-values-warning-dialog.scss',
})
export class BandValuesWarningDialogComponent {
  readonly data = inject<BandValuesWarningDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<BandValuesWarningDialogComponent>);

  onOverride(): void {
    const result: BandValuesWarningDialogResult = {
      override: true,
      codes: this.data.warnings.map((w) => w.code),
    };
    this.dialogRef.close(result);
  }

  onCancel(): void {
    const result: BandValuesWarningDialogResult = {
      override: false,
      codes: [],
    };
    this.dialogRef.close(result);
  }
}
