import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ScheduleDialogData, ScheduleDialogResult } from '../models/report-submission.model';
import moment from 'moment';

@Component({
  selector: 'app-schedule-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
  ],
  templateUrl: './schedule-dialog.html',
  styleUrls: ['./schedule-dialog.scss'],
})
export class ScheduleDialogComponent {
  readonly data = inject<ScheduleDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ScheduleDialogComponent>);

  readonly minDate = new Date();
  readonly maxDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  scheduleForm = new FormGroup({
    date: new FormControl<Date | null>(null, Validators.required),
    time: new FormControl('', Validators.required),
  });

  onSchedule(): void {
    if (this.scheduleForm.invalid) return;

    const dateValue = this.scheduleForm.value.date;
    const timeValue = this.scheduleForm.value.time;
    if (!dateValue || !timeValue) return;

    const [hours, minutes] = timeValue.split(':').map(Number);
    const scheduled = moment(dateValue).hours(hours).minutes(minutes).seconds(0);

    if (scheduled.isBefore(moment())) {
      this.scheduleForm.get('time')?.setErrors({ pastTime: true });
      return;
    }

    this.dialogRef.close({
      scheduledTime: scheduled.toISOString(),
    } as ScheduleDialogResult);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
