import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WarningDto } from '../../models/create-test-batch.model';

export interface WarningDialogData {
  title: string;
  warnings: WarningDto[];
  allowOverride: boolean;
}

export interface WarningDialogResult {
  override: boolean;
}

@Component({
  selector: 'app-ctb-warning-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './warning-dialog.component.html',
  styleUrls: ['./warning-dialog.component.scss'],
})
export class WarningDialogComponent {
  readonly data = inject<WarningDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<WarningDialogComponent>);

  onProceed(): void {
    this.dialogRef.close({ override: true } as WarningDialogResult);
  }

  onCancel(): void {
    this.dialogRef.close({ override: false } as WarningDialogResult);
  }
}
