import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface CmcDialogData {
  title: string;
  cmcCodes: Array<{ code: string; description: string }>;
}

@Component({
  selector: 'app-cmc-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './cmc-dialog.html',
  styleUrls: ['./cmc-dialog.scss'],
})
export class CmcDialogComponent {
  readonly dialogRef = inject(MatDialogRef<CmcDialogComponent>);
  readonly data = inject<CmcDialogData>(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }
}
