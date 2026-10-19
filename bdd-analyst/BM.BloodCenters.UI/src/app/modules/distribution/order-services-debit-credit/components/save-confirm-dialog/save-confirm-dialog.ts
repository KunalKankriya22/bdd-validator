import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface SaveConfirmData {
  tranTypeLabel: string; // 'Credited' or 'Debited'
  customerName: string;
}

@Component({
  selector: 'app-save-confirm-dialog',
  standalone: true,
  imports: [CommonModule, A11yModule, MatButtonModule, MatDialogModule],
  templateUrl: './save-confirm-dialog.html',
  styleUrl: './save-confirm-dialog.scss'
})
export class SaveConfirmDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<SaveConfirmDialogComponent>);
  readonly data = inject<SaveConfirmData>(MAT_DIALOG_DATA);

  onNoCancel(): void { this.dialogRef.close(false); }
  onYesConfirm(): void { this.dialogRef.close(true); }
}
