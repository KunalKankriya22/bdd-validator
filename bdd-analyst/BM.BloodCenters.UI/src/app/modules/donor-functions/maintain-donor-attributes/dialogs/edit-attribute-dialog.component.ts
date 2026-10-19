import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MaintainDonorAttributesService } from '../services/maintain-donor-attributes.service';
import { MaintainDonorAttribute, UpdateMaintainDonorAttributeRequest } from '../models/maintain-donor-attributes.models';

export interface EditAttributeDialogData {
  donorId: string;
  attribute: MaintainDonorAttribute;
  chapterToday: string;
}

@Component({
  selector: 'app-edit-attribute-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatMomentDateModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  template: `
    <div class="side-panel">
      <div class="panel-header">
        <h2 id="edit-attr-title">Edit Attribute</h2>
        <button mat-icon-button (click)="onCancel()" aria-label="Close">
          <mat-icon aria-hidden="true">close</mat-icon>
        </button>
      </div>
      <div class="panel-body">
        <form [formGroup]="form" class="panel-form">
          <div class="form-row">
            <div class="form-col col-30">
              <div class="readonly-field" role="group" aria-label="Code"><span class="readonly-label">Code</span><span class="readonly-value">{{ data.attribute.interCode }}</span></div>
            </div>
            <div class="form-col col-70">
              <div class="readonly-field" role="group" aria-label="Description"><span class="readonly-label">Description</span><span class="readonly-value">{{ data.attribute.interDesc || '-' }}</span></div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-col col-50">
              <div class="readonly-field" role="group" aria-label="Effective Date"><span class="readonly-label">Effective Date</span><span class="readonly-value">{{ formatDate(data.attribute.effDate) }}</span></div>
            </div>
            <div class="form-col col-50">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Termination Date</mat-label>
                <input matInput [matDatepicker]="termPicker" formControlName="termDate"
                       [min]="termMinDate" [errorStateMatcher]="termDateErrorMatcher"
                       aria-label="Termination date"
                       (input)="onTerminationDateInput($event)">
                <mat-datepicker-toggle matIconSuffix [for]="termPicker"></mat-datepicker-toggle>
                <mat-datepicker #termPicker [startAt]="termMinDate"></mat-datepicker>
                @if (getTerminationDateError()) {
                  <mat-error>{{ getTerminationDateError() }}</mat-error>
                }
              </mat-form-field>
            </div>
          </div>
          <div class="form-row">
            <div class="form-col col-50">
              <div class="readonly-field" role="group" aria-label="User ID"><span class="readonly-label">User ID</span><span class="readonly-value">{{ data.attribute.insertUser || '-' }}</span></div>
            </div>
          </div>
        </form>
      </div>
      <div class="panel-footer">
        <button mat-stroked-button (click)="onClearAll()" class="clear-button">CLEAR ALL</button>
        <button mat-raised-button (click)="onSave()" [disabled]="form.invalid || submitting" class="save-button">SAVE</button>
      </div>
    </div>
  `,
  styles: [`
    .side-panel { display: flex; flex-direction: column; height: 100%; background: #fff; overflow: hidden; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid rgba(0,0,0,0.12); flex-shrink: 0;
      h2 { margin: 0; font-size: 18px; font-weight: 600; color: rgba(0,0,0,0.87); }
      button[mat-icon-button] { background: transparent; &:hover { background-color: rgba(0,0,0,0.04); } ::ng-deep .mat-mdc-button-persistent-ripple { display: none; } &:focus-visible { outline: 2px solid #228189; outline-offset: 2px; } }
    }
    .panel-body { flex: 1 1 0; overflow-y: auto; padding: 16px 24px; min-height: 0; }
    .panel-form { display: flex; flex-direction: column; gap: 8px; }
    .form-row { display: flex; gap: 16px; align-items: flex-start; }
    .form-col { display: flex; flex-direction: column; }
    .col-30 { flex: 0 0 30%; max-width: 30%; }
    .col-50 { flex: 0 0 calc(50% - 8px); max-width: calc(50% - 8px); }
    .col-70 { flex: 0 0 calc(70% - 16px); max-width: calc(70% - 16px); }
    .full-width { width: 100%; }
    .readonly-field { display: flex; flex-direction: column; gap: 4px; padding: 8px 0; min-height: 56px; justify-content: center; }
    .readonly-label { font-size: 12px; color: rgba(0,0,0,0.6); font-weight: 500; }
    .readonly-value { font-size: 14px; color: rgba(0,0,0,0.87); }
    .panel-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; border-top: 1px solid rgba(0,0,0,0.12); flex-shrink: 0; }
    .clear-button { color: #228189; border-color: #228189; font-weight: 500; }
    .save-button { background-color: #228189; color: #fff; font-weight: 500; &:hover { background-color: #1b6b72; } &:disabled { opacity: 0.5; } }
  `]
})
export class EditAttributeDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MaintainDonorAttributesService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialogRef = inject(MatDialogRef<EditAttributeDialogComponent>);
  readonly data = inject<EditAttributeDialogData>(MAT_DIALOG_DATA);
  private readonly destroy$ = new Subject<void>();

  form!: FormGroup;
  submitting = false;
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  ngOnInit(): void {
    const existingTermDate = this.data.attribute.termDate ? moment(this.data.attribute.termDate, 'YYYY-MM-DD') : null;
    this.form = this.fb.group({ termDate: [existingTermDate] });
    const termDateCtrl = this.form.get('termDate');
    if (termDateCtrl) {
      termDateCtrl.setValidators([dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]);
      termDateCtrl.updateValueAndValidity();
    }
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  get termMinDate(): Moment {
    return moment.max(moment(this.data.attribute.effDate, 'YYYY-MM-DD'), moment(this.data.chapterToday, 'YYYY-MM-DD'));
  }

  onClearAll(): void { this.form.get('termDate')?.setValue(null); }

  onSave(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const termDateValue = this.form.get('termDate')?.value;
    if (!termDateValue) {
      this.snackbarService.showError('Termination date is required');
      return;
    }

    this.submitting = true;
    const request: UpdateMaintainDonorAttributeRequest = {
      termDate: DateFieldValidationUtility.serializeDateForApi(termDateValue) || '',
    };

    this.service.updateAttribute(this.data.donorId, this.data.attribute.interCode, this.data.attribute.effDate, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.submitting = false; this.dialogRef.close({ success: true }); },
        error: (err) => {
          this.submitting = false;
          this.snackbarService.showError(err?.error?.message || err?.message || 'Failed to update attribute');
        }
      });
  }

  onCancel(): void { this.dialogRef.close(); }

  formatDate(dateString: string): string {
    const m = moment(dateString, ['YYYY-MM-DD', moment.ISO_8601]);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }

  getTerminationDateError(): string {
    const control = this.form.get('termDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination date is invalid';
    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) return 'Termination date is invalid';
    if (control.hasError('matDatepickerMin')) return 'Termination Date must be greater than or equal to Effective Date';
    return '';
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput((event.target as HTMLInputElement).value, this.form.get('termDate'), false);
  }
}
