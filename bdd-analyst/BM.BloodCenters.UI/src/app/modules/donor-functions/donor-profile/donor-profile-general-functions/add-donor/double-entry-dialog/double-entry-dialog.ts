import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import moment from 'moment';

export interface DoubleEntryDialogData {
  requireLastName: boolean;
  requireDob: boolean;
  originalLastName: string;
  originalDob: string;
}

@Component({
  selector: 'app-double-entry-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
  ],
  providers: [{ provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }],
  templateUrl: './double-entry-dialog.html',
  styleUrls: ['./double-entry-dialog.scss'],
})
export class DoubleEntryDialogComponent {
  readonly data = inject<DoubleEntryDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<DoubleEntryDialogComponent>);
  private readonly fb = inject(FormBuilder);

  verifyForm: FormGroup;
  errorMessage = '';

  constructor() {
    this.verifyForm = this.fb.group({
      lastName: ['', this.data.requireLastName ? Validators.required : []],
      dateOfBirth: [null, this.data.requireDob ? Validators.required : []],
    });
  }

  onVerify(): void {
    if (this.verifyForm.invalid) return;

    const val = this.verifyForm.value;
    let match = true;

    if (this.data.requireLastName) {
      if ((val.lastName || '').toUpperCase().trim() !== this.data.originalLastName.toUpperCase().trim()) {
        match = false;
      }
    }

    if (this.data.requireDob) {
      const enteredDob = moment(val.dateOfBirth).format('MM/DD/YYYY');
      const originalDob = moment(this.data.originalDob).format('MM/DD/YYYY');
      if (enteredDob !== originalDob) {
        match = false;
      }
    }

    if (match) {
      this.dialogRef.close(true);
    } else {
      this.errorMessage = 'Entered values do not match. Please re-enter.';
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
