import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import moment, { Moment } from 'moment';
import { ChapterAwareDateAdapter } from '../../../../../../shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '../../../../../../shared/date/date-formats';

export interface DateTimePickerData {
  currentDateTime: Moment;
  minDate: Moment;
}

@Component({
  selector: 'app-datetime-picker-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  template: `
    <h2 mat-dialog-title>Select Date and Time</h2>
    <mat-dialog-content>
      <div class="datetime-picker-content">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Date</mat-label>
          <input
            matInput
            [matDatepicker]="picker"
            [formControl]="dateControl"
            [min]="data.minDate"
            placeholder="Select date">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <div class="time-inputs">
          <mat-form-field appearance="fill" class="time-field">
            <mat-label>Hour (00-23)</mat-label>
            <input
              matInput
              type="number"
              [formControl]="hourControl"
              min="0"
              max="23"
              placeholder="HH">
          </mat-form-field>

          <mat-form-field appearance="fill" class="time-field">
            <mat-label>Minute (00-59)</mat-label>
            <input
              matInput
              type="number"
              [formControl]="minuteControl"
              min="0"
              max="59"
              placeholder="mm">
          </mat-form-field>
        </div>

        <div class="preview">
          <strong>Preview:</strong> {{ getPreviewDateTime() }}
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onConfirm()" [disabled]="!isValid()">
        OK
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .datetime-picker-content {
      min-width: 300px;
      padding: 16px 0;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .time-inputs {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }

    .time-field {
      flex: 1;
    }

    .preview {
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 4px;
      font-size: 14px;
      text-align: center;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
    }
  `]
})
export class DateTimePickerDialogComponent {
  dateControl: FormControl;
  hourControl: FormControl;
  minuteControl: FormControl;

  constructor(
    public dialogRef: MatDialogRef<DateTimePickerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DateTimePickerData
  ) {
    this.dateControl = new FormControl(data.currentDateTime, Validators.required);
    this.hourControl = new FormControl(data.currentDateTime.hours(), [
      Validators.required,
      Validators.min(0),
      Validators.max(23)
    ]);
    this.minuteControl = new FormControl(data.currentDateTime.minutes(), [
      Validators.required,
      Validators.min(0),
      Validators.max(59)
    ]);
  }

  getPreviewDateTime(): string {
    if (!this.isValid()) {
      return 'Invalid date/time';
    }

    const combined = this.getCombinedDateTime();
    return combined ? combined.format('DD-MMM-YY HH:mm') : 'Invalid date/time';
  }

  getCombinedDateTime(): Moment | null {
    if (!this.dateControl.valid || !this.hourControl.valid || !this.minuteControl.valid) {
      return null;
    }

    const date = this.dateControl.value;
    const hour = this.hourControl.value;
    const minute = this.minuteControl.value;

    if (!date) return null;

    const dateMoment = moment.isMoment(date) ? date : moment(date);
    return dateMoment.clone().hours(hour).minutes(minute).seconds(0);
  }

  isValid(): boolean {
    return this.dateControl.valid && this.hourControl.valid && this.minuteControl.valid;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.isValid()) {
      this.dialogRef.close(this.getCombinedDateTime());
    }
  }
}
