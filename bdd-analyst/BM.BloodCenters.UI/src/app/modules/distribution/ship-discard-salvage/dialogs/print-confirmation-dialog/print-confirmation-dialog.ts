import { Component, Inject, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface PrintConfirmationDialogData {
  shipmentNo: string;
  defaultPrinterId?: string;
}

export interface PrintConfirmationResult {
  confirmed: boolean;
  printerId?: string;
}

@Component({
  selector: 'app-print-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './print-confirmation-dialog.html',
  styleUrl: './print-confirmation-dialog.scss',
})
export class PrintConfirmationDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<PrintConfirmationDialogComponent>);

  printerIdCtrl = new FormControl('');

  constructor(@Inject(MAT_DIALOG_DATA) public data: PrintConfirmationDialogData) {
    if (data.defaultPrinterId) {
      this.printerIdCtrl.setValue(data.defaultPrinterId);
    }
  }

  onNo(): void {
    this.dialogRef.close({ confirmed: false } as PrintConfirmationResult);
  }

  onYesShip(): void {
    this.dialogRef.close({
      confirmed: true,
      printerId: this.printerIdCtrl.value || undefined,
    } as PrintConfirmationResult);
  }
}
