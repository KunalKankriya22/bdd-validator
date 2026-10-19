import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';

export interface CloseBoxConfirmationDialogData {
  boxId: string;
  productCount: number;
}

export interface CloseBoxConfirmationDialogResult {
  confirmed: boolean;
  closeCurrentBox: boolean;
  allProductsProperlyPacked: boolean;
}

@Component({
  selector: 'app-close-box-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatRadioModule
  ],
  templateUrl: './close-box-confirmation-dialog.component.html',
  styleUrls: ['./close-box-confirmation-dialog.component.scss']
})
export class CloseBoxConfirmationDialogComponent {
  readonly data = inject<CloseBoxConfirmationDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CloseBoxConfirmationDialogComponent>);

  protected closeCurrentBox: boolean | null = null;
  protected allProductsPacked: boolean | null = null;

  get canConfirm(): boolean {
    return this.closeCurrentBox !== null && this.allProductsPacked !== null;
  }

  onConfirm(): void {
    if (!this.canConfirm) return;
    this.dialogRef.close({
      confirmed: true,
      closeCurrentBox: this.closeCurrentBox!,
      allProductsProperlyPacked: this.allProductsPacked!
    } as CloseBoxConfirmationDialogResult);
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false, closeCurrentBox: false, allProductsProperlyPacked: false });
  }
}
