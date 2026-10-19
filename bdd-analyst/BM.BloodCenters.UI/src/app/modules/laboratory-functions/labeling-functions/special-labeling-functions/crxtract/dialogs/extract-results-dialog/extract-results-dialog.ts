import { Component, OnInit, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import moment, { Moment } from 'moment';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ExtractResultsDialogData, ExtractResultsDialogResult } from '../../models/confirmatory-extraction.model';

@Component({
  selector: 'app-extract-results-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatDatepickerModule,
    MatMomentDateModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './extract-results-dialog.html',
  styleUrl: './extract-results-dialog.scss'
})
export class ExtractResultsDialogComponent implements OnInit {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `extract-results-dialog-${ExtractResultsDialogComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ExtractResultsDialogComponent>);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  protected readonly submitted = signal<boolean>(false);

  form!: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ExtractResultsDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const now = this.chapterTimezoneService.getChapterLocalDateTime();

    this.form = this.fb.group({
      date: new FormControl<Moment | null>(now, [Validators.required]),
      time: new FormControl<string>(now.format('HH:mm'), [
        Validators.required,
        Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      ]),
      printTestSeriesReport: new FormControl<boolean>(true)
    });
  }

  get f() {
    return this.form.controls;
  }

  /**
   * Set current date and time
   */
  setCurrentTime(): void {
    const now = this.chapterTimezoneService.getChapterLocalDateTime();
    this.form.patchValue({
      date: now,
      time: now.format('HH:mm')
    });
  }

  /**
   * Check if the selected date/time is in the future
   * GAP FIX: Now uses chapter-local time instead of browser time (per gap analysis Section 4.3)
   */
  private isFutureDateTime(): boolean {
    const date = this.form.get('date')?.value as Moment | null;
    const timeStr = this.form.get('time')?.value as string;

    if (!date || !timeStr) {
      return false;
    }

    const [hours, minutes] = timeStr.split(':').map(Number);
    const selectedDateTime = moment(date).hours(hours).minutes(minutes).seconds(0);

    const now = this.chapterTimezoneService.getChapterLocalDateTime();
    return selectedDateTime.isAfter(now);
  }

  /**
   * Combine date and time into ISO string (chapter-local timezone)
   */
  private getAfterTime(): string | null {
    const date = this.form.get('date')?.value as Moment | null;
    const timeStr = this.form.get('time')?.value as string;

    if (!date || !timeStr) {
      return null;
    }

    const [hours, minutes] = timeStr.split(':').map(Number);
    const combined = moment(date).hours(hours).minutes(minutes).seconds(0);

    return combined.format('YYYY-MM-DDTHH:mm:ss');
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const afterTime = this.getAfterTime();
    const generateSeriesReport = this.form.get('printTestSeriesReport')?.value ?? true;

    // If future time, schedule extraction; otherwise execute immediately (afterTime = null)
    const result: ExtractResultsDialogResult = {
      afterTime: this.isFutureDateTime() ? afterTime : null,
      generateSeriesReport
    };

    this.dialogRef.close(result);
  }

  /**
   * Cancel and close dialog
   */
  onCancel(): void {
    this.dialogRef.close(null);
  }
}
