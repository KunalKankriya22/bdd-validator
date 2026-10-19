import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment from 'moment';

@Component({
  selector: 'app-extract-test-results-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './extract-test-results-dialog.html',
  styleUrl: './extract-test-results-dialog.scss',
})
export class ExtractTestResultsDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ExtractTestResultsDialogComponent>);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  protected readonly data = inject(MAT_DIALOG_DATA, { optional: true });

  protected readonly submitted = signal(false);
  protected readonly today = moment().startOf('day');

  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      extractDate: [null],
      extractTime: ['', [this.validateTimeFormat.bind(this)]],
      generateRsmReport: [false],
    });
  }

  private validateTimeFormat(control: AbstractControl): { [key: string]: boolean } | null {
    if (!control.value) return null;
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timePattern.test(control.value) ? null : { invalidTimeFormat: true };
  }

  onSetCurrentTime(): void {
    const now = this.chapterTimezoneService.isChapterLocalDateAvailable()
      ? this.chapterTimezoneService.getChapterLocalDateTime()
      : moment();

    this.form.patchValue({
      extractDate: now,
      extractTime: now.format('HH:mm'),
    });
    this.form.get('extractDate')?.markAsTouched();
    this.form.get('extractTime')?.markAsTouched();
  }

  onDateChange(): void {
    this.form.get('extractDate')?.updateValueAndValidity();
    this.form.get('extractDate')?.markAsTouched();
  }

  onSubmit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;

    const dateValue = this.form.get('extractDate')?.value;
    const timeValue = this.form.get('extractTime')?.value;

    let afterTime: string | null = null;

    if (dateValue && timeValue) {
      const [hours, minutes] = timeValue.split(':').map(Number);
      const chapterLocal = moment.utc(moment(dateValue).format('YYYY-MM-DD'))
        .hours(hours).minutes(minutes).seconds(0);
      afterTime = this.chapterTimezoneService.convertLocalToGmt(chapterLocal).toISOString();
    }

    this.dialogRef.close({
      afterTime,
      rsmAutoReport: this.form.get('generateRsmReport')?.value || false,
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  get f() {
    return this.form.controls;
  }
}
