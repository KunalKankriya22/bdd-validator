import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PrintRange, DPAQ_ERROR_MESSAGES } from '../../models/donor-profile-audit-query.model';
import { SnackbarService } from '@shared/services/snackbar.service';

export interface PrintSelectedDialogData {
  recordNumbers: number[];
}

@Component({
  selector: 'app-print-selected-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './print-selected-dialog.html',
  styleUrls: ['./print-selected-dialog.scss']
})
export class PrintSelectedDialog {
  private readonly fb: FormBuilder;
  private readonly dialogRef: MatDialogRef<PrintSelectedDialog>;
  private readonly snackbarService: SnackbarService;

  printForm: FormGroup;
  recordNumberOptions = signal<number[]>([]);

  constructor(
    fb: FormBuilder,
    dialogRef: MatDialogRef<PrintSelectedDialog>,
    snackbarService: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: PrintSelectedDialogData
  ) {
    this.fb = fb;
    this.dialogRef = dialogRef;
    this.snackbarService = snackbarService;

    const sortedRecords = data.recordNumbers.sort((a, b) => a - b);
    this.recordNumberOptions.set(sortedRecords);

    // Default to min and max of selected record numbers
    const minRecord = sortedRecords.length > 0 ? sortedRecords[0] : null;
    const maxRecord = sortedRecords.length > 0 ? sortedRecords[sortedRecords.length - 1] : null;

    this.printForm = this.fb.group({
      fromRecordNumber: [minRecord],
      toRecordNumber: [maxRecord]
    });
  }

  onPrint(): void {
    const form = this.printForm.getRawValue();

    // Check if both values are selected
    if (form.fromRecordNumber === null || form.fromRecordNumber === undefined ||
        form.toRecordNumber === null || form.toRecordNumber === undefined) {
      this.snackbarService.showError('Please select both from and to record numbers');
      return;
    }

    if (form.toRecordNumber < form.fromRecordNumber) {
      this.snackbarService.showError(DPAQ_ERROR_MESSAGES.PRINT_INVALID_RANGE);
      return;
    }

    const printRange: PrintRange = {
      fromRecordNumber: form.fromRecordNumber,
      toRecordNumber: form.toRecordNumber
    };

    this.dialogRef.close(printRange);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  get f() {
    return this.printForm.controls;
  }
}
