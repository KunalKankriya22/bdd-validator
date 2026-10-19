import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import moment, { Moment } from 'moment';

import { ExtractDialogData, ExtractDialogResult } from '../rextract.model';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

/**
 * Extract Results Dialog Component
 * Modal dialog for setting extract date/time and RSM report generation option
 */
@Component({
  selector: 'app-extract-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatProgressSpinnerModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './extract-dialog.html',
  styleUrls: ['./extract-dialog.scss']
})
export class ExtractDialogComponent implements OnInit {
  // Unique ID generation for accessibility
  private static nextId = 0;
  readonly componentId = `extract-dialog-${ExtractDialogComponent.nextId++}`;

  // Generate unique IDs for form elements
  readonly elementId = (name: string) => `${this.componentId}-${name}`;
  readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ExtractDialogComponent>);
  private readonly dialogData = inject<ExtractDialogData>(MAT_DIALOG_DATA);

  // Signal-based state
  readonly isSubmitting = signal<boolean>(false);
  readonly submitted = signal<boolean>(false);

  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const now = moment();

    this.form = this.fb.group({
      extractDate: [now, [Validators.required]],
      extractTime: [now.format('HH:mm'), [Validators.required, this.timeValidator]],
      generateRsmReport: [true] // Default checked as per Figma
    });
  }

  /**
   * Validator for time input (HH:mm format)
   */
  private timeValidator(control: any): { [key: string]: any } | null {
    const value = control.value;
    if (!value) return null;

    const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(value)) {
      return { invalidTime: true };
    }
    return null;
  }

  get f() {
    return this.form.controls;
  }

  /**
   * Set current date and time
   */
  onSetCurrentTime(): void {
    const now = moment();
    this.form.patchValue({
      extractDate: now,
      extractTime: now.format('HH:mm')
    });
    this.form.markAsTouched();
  }

  /**
   * Handle extract button click
   */
  onExtract(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      // Focus first invalid field
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const extractDate = this.form.value.extractDate as Moment;
    const extractTime = this.form.value.extractTime as string;

    // Combine date and time
    const [hours, minutes] = extractTime.split(':');
    const combinedDateTime = extractDate.clone()
      .hours(parseInt(hours, 10))
      .minutes(parseInt(minutes, 10))
      .seconds(0);

    const result: ExtractDialogResult = {
      success: true,
      extractDate: combinedDateTime.toISOString(),
      generateRsmReport: this.form.value.generateRsmReport
    };

    this.dialogRef.close(result);
  }

  /**
   * Handle cancel button click
   */
  onCancel(): void {
    const result: ExtractDialogResult = {
      success: false
    };
    this.dialogRef.close(result);
  }
}
