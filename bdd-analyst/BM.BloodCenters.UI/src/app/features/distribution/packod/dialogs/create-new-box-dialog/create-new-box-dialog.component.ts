import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';

export interface CreateNewBoxDialogData {
  currentBoxId: string | null;
}

export interface CreateNewBoxDialogResult {
  confirmed: boolean;
  closeCurrentBox: boolean;
  allProductsProperlyPacked: boolean;
}

@Component({
  selector: 'app-create-new-box-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatRadioModule
  ],
  templateUrl: './create-new-box-dialog.component.html',
  styleUrls: ['./create-new-box-dialog.component.scss']
})
export class CreateNewBoxDialogComponent {
  readonly data = inject<CreateNewBoxDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CreateNewBoxDialogComponent>);

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
    } as CreateNewBoxDialogResult);
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false, closeCurrentBox: false, allProductsProperlyPacked: false });
  }
}
