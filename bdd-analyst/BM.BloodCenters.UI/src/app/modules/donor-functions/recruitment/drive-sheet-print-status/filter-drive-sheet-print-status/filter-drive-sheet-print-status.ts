import { Component, OnInit, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { DriveSheetPrintStatusFilter, STATUS_OPTIONS } from '../models/drive-sheet-print-status.model';

export const DD_MMM_YYYY_FORMAT = {
  parse: { dateInput: 'DD-MMM-YYYY' },
  display: {
    dateInput: 'DD-MMM-YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD-MMM-YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-filter-drive-sheet-print-status',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
  ],
  templateUrl: './filter-drive-sheet-print-status.html',
  styleUrls: ['./filter-drive-sheet-print-status.scss'],
  providers: [
    provideMomentDateAdapter(DD_MMM_YYYY_FORMAT),
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT },
  ],
})
export class FilterDriveSheetPrintStatusComponent implements OnInit {
  filterForm!: FormGroup;
  statusOptions = STATUS_OPTIONS;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FilterDriveSheetPrintStatusComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DriveSheetPrintStatusFilter
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      status: [this.data?.status || ''],
      driveDate: [this.data?.driveDate ? new Date(this.data.driveDate) : null],
    });
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    const filters: DriveSheetPrintStatusFilter = {};

    if (formValue.status) {
      filters.status = formValue.status;
    }
    if (formValue.driveDate) {
      filters.driveDate = this.formatDateWithoutTimezone(formValue.driveDate);
    }

    this.dialogRef.close(filters);
  }

  private formatDateWithoutTimezone(date: any): string {
    let year: number, month: number, day: number;

    if (date && typeof date.year === 'function') {
      year = date.year();
      month = date.month() + 1;
      day = date.date();
    } else if (date instanceof Date) {
      year = date.getFullYear();
      month = date.getMonth() + 1;
      day = date.getDate();
    } else {
      return '';
    }

    const monthStr = String(month).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}T00:00:00`;
  }

  onClearAll(): void {
    this.filterForm.reset({
      status: '',
      driveDate: null,
    });
  }

  hasSelection(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) return false;
    return !!formValue.status || !!formValue.driveDate;
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
