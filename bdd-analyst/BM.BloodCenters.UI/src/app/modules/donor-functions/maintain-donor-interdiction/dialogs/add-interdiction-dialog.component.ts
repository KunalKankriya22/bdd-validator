import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoginService } from '@shared/services/login.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { MaintainDonorInterdictionService } from '../services/maintain-donor-interdiction.service';
import {
  ValidInterdictionCode,
  CollectionDate,
  PlaceInterdictionRequest
} from '../models/maintain-donor-interdiction.models';

export interface AddInterdictionDialogData {
  donorId: string;
}

@Component({
  selector: 'app-add-interdiction-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  template: `
    <div class="side-panel" role="dialog" aria-modal="true" aria-labelledby="add-interdiction-title">
      <!-- Header -->
      <div class="panel-header">
        <h2 id="add-interdiction-title">Add New Interdiction</h2>
        <button mat-icon-button (click)="onCancel()" aria-label="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Form -->
      <div class="panel-body">
        <form [formGroup]="form" class="panel-form">

          <!-- Row 1: Code (50%) + Description (50% view-only) -->
          <div class="form-row">
            <div class="form-col col-50">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Code</mat-label>
                <mat-select formControlName="interCode" (selectionChange)="onCodeChange()">
                  <mat-option>
                    <ngx-mat-select-search
                      [formControl]="codeSearchCtrl"
                      placeholderLabel="Search code..."
                      noEntriesFoundLabel="No matching codes">
                    </ngx-mat-select-search>
                  </mat-option>
                  @for (code of filteredCodes; track code.interCode) {
                    <mat-option [value]="code.interCode">{{ code.interCode }}{{ code.interDesc ? ' - ' + code.interDesc : '' }}</mat-option>
                  }
                </mat-select>
                @if (form.get('interCode')?.hasError('required') && form.get('interCode')?.touched) {
                  <mat-error>Code is required</mat-error>
                }
              </mat-form-field>
            </div>
            <div class="form-col col-50">
              <div class="readonly-field">
                <span class="readonly-label">Description</span>
                <span class="readonly-value">{{ form.getRawValue().interDesc || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- Row 2: Type (50% view-only) + Unit ID (50% input) -->
          <div class="form-row">
            <div class="form-col col-50">
              <div class="readonly-field">
                <span class="readonly-label">Type</span>
                <span class="readonly-value">{{ form.getRawValue().interType || '-' }}</span>
              </div>
            </div>
            <div class="form-col col-50">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Unit ID</mat-label>
                <input matInput formControlName="unitId" (blur)="onUnitIdBlur()">
                @if (form.get('unitId')?.hasError('invalidFormat')) {
                  <mat-error>Unit ID must be 15 (ISBT), 13, or 7 (Codabar) characters.</mat-error>
                }
                @if (form.get('unitId')?.hasError('unitNotFound')) {
                  <mat-error>Unit not found for this donor.</mat-error>
                }
              </mat-form-field>
            </div>
          </div>

          <!-- Row 3: Collection Date (50%) + empty -->
          <div class="form-row">
            <div class="form-col col-50">
              @if (collectionDates.length > 1) {
                <mat-form-field appearance="fill" class="full-width">
                  <mat-label>Collection Date</mat-label>
                  <mat-select formControlName="collDate" (selectionChange)="onCollDateChange()">
                    @for (cd of collectionDates; track cd.collDate) {
                      <mat-option [value]="cd.collDate">{{ formatDate(cd.collDate) }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              } @else {
                <div class="readonly-field">
                  <span class="readonly-label">Collection Date</span>
                  <span class="readonly-value">{{ collectionDateDisplay || '-' }}</span>
                </div>
              }
            </div>
            <div class="form-col col-50"></div>
          </div>

          <!-- Row 4: Effective Date (50%) + Termination Date (50%) -->
          <div class="form-row">
            <div class="form-col col-50">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Effective Date</mat-label>
                <input matInput [matDatepicker]="effPicker" formControlName="effDate"
                       [max]="maxEffDate" [errorStateMatcher]="effDateErrorMatcher"
                       required aria-required="true" (input)="onEffectiveDateInput($event)">
                <mat-datepicker-toggle matIconSuffix [for]="effPicker"></mat-datepicker-toggle>
                <mat-datepicker #effPicker [startAt]="maxEffDate"></mat-datepicker>
                <mat-error *ngIf="getEffectiveDateError()">{{ getEffectiveDateError() }}</mat-error>
              </mat-form-field>
            </div>
            <div class="form-col col-50">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Termination Date</mat-label>
                <input matInput [matDatepicker]="termPicker" formControlName="termDate"
                       [min]="termMinDate" [errorStateMatcher]="termDateErrorMatcher"
                       (input)="onTerminationDateInput($event)">
                <mat-datepicker-toggle matIconSuffix [for]="termPicker"></mat-datepicker-toggle>
                <mat-datepicker #termPicker [startAt]="termMinDate"></mat-datepicker>
                <mat-error *ngIf="getTerminationDateError()">{{ getTerminationDateError() }}</mat-error>
              </mat-form-field>
            </div>
          </div>

          <!-- Row 5: User ID (50% view-only) + empty -->
          <div class="form-row">
            <div class="form-col col-50">
              <div class="readonly-field">
                <span class="readonly-label">User ID</span>
                <span class="readonly-value">{{ currentUserId }}</span>
              </div>
            </div>
            <div class="form-col col-50"></div>
          </div>

          <!-- Row 6: Comments (100%) -->
          <div class="form-row">
            <div class="form-col col-100">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Comments</mat-label>
                <textarea matInput formControlName="notes" rows="3"
                          placeholder="Enter comments" maxlength="240"></textarea>
                <mat-hint align="end">{{ form.get('notes')?.value?.length || 0 }}/240</mat-hint>
              </mat-form-field>
            </div>
          </div>

        </form>
      </div>

      <!-- Footer -->
      <div class="panel-footer">
        <button mat-stroked-button type="button" (click)="onCancel()" class="cancel-button">
          CANCEL
        </button>
        <button mat-stroked-button type="button" (click)="onSubmit(true)"
                [disabled]="form.invalid || submitting"
                class="add-another-button">
          ADD & CREATE ANOTHER
        </button>
        <button mat-raised-button type="button" (click)="onSubmit(false)"
                [disabled]="form.invalid || submitting"
                class="add-button">
          ADD
        </button>
      </div>
    </div>
  `,
  styles: [`
    .side-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #ffffff;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      flex-shrink: 0;

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
      }

      button[mat-icon-button] {
        background: transparent;

        &:hover {
          background-color: rgba(0, 0, 0, 0.04);
        }

        ::ng-deep .mat-mdc-button-persistent-ripple,
        ::ng-deep .mat-mdc-focus-indicator {
          display: none;
        }
      }
    }

    .panel-body {
      flex: 1 1 0;
      overflow-y: auto;
      padding: 16px 24px;
      min-height: 0;
    }

    .panel-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .form-col {
      display: flex;
      flex-direction: column;
    }

    .col-20 { flex: 0 0 20%; max-width: 20%; }
    .col-40 { flex: 0 0 40%; max-width: 40%; }
    .col-50 { flex: 0 0 calc(50% - 8px); max-width: calc(50% - 8px); }
    .col-60 { flex: 0 0 calc(60% - 16px); max-width: calc(60% - 16px); }
    .col-80 { flex: 0 0 calc(80% - 16px); max-width: calc(80% - 16px); }
    .col-100 { flex: 0 0 100%; max-width: 100%; }

    .full-width { width: 100%; }

    /* View-only field — matches view dialog label/value style */
    .readonly-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 0;
      min-height: 56px;
      justify-content: center;
    }

    .readonly-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      font-weight: 500;
    }

    .readonly-value {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);
      font-weight: 400;
    }

    .panel-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
      flex-shrink: 0;
    }

    .cancel-button {
      color: #228189;
      border-color: #228189;
      font-weight: 500;
    }

    .add-another-button {
      color: #228189;
      border-color: #228189;
      font-weight: 500;
    }

    .add-button {
      background-color: #228189;
      color: #ffffff;
      font-weight: 500;
    }

    .add-button:hover { background-color: #1b6b72; }
    .add-button:disabled, .add-another-button:disabled, .inline-add-button:disabled {
      opacity: 0.5;
    }
  `]
})
export class AddInterdictionDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MaintainDonorInterdictionService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly loginService = inject(LoginService);
  private readonly dialogRef = inject(MatDialogRef<AddInterdictionDialogComponent>);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  readonly data = inject<AddInterdictionDialogData>(MAT_DIALOG_DATA);
  private readonly destroy$ = new Subject<void>();

  form!: FormGroup;
  validCodes: ValidInterdictionCode[] = [];
  filteredCodes: ValidInterdictionCode[] = [];
  codeSearchCtrl = new FormControl('');
  collectionDates: CollectionDate[] = [];
  submitting = false;
  currentUserId = '';
  collectionDateDisplay = '';
  maxEffDate: Moment = moment();

  private lastChangedDateField: 'effective' | 'termination' | null = null;
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  ngOnInit(): void {
    this.currentUserId = this.loginService.getStoredUsername();
    this.maxEffDate = this.chapterTimezoneService.getChapterLocalDate();
    this.initForm();
    this.loadValidCodes();
    this.codeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredCodes = this.filterCodeList(search);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.collectionDateDisplay = '';

    this.form = this.fb.group({
      interCode: ['', [Validators.required]],
      interDesc: [{ value: '', disabled: true }],
      interType: [{ value: '', disabled: true }],
      unitId: [''],
      collDate: [''],
      effDate: [null, [Validators.required]],
      termDate: [null],
      notes: ['', [Validators.maxLength(240)]]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

    const effDateCtrl = this.form.get('effDate');
    if (effDateCtrl) {
      effDateCtrl.clearValidators();
      effDateCtrl.setValidators([
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator()
      ]);
      effDateCtrl.updateValueAndValidity();
    }

    const termDateCtrl = this.form.get('termDate');
    if (termDateCtrl) {
      termDateCtrl.clearValidators();
      termDateCtrl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator()
      ]);
      termDateCtrl.updateValueAndValidity();
    }

    this.form.get('effDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('termDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  private loadValidCodes(): void {
    this.service.getValidCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.validCodes = codes;
          this.filteredCodes = codes;
        },
        error: () => this.snackbarService.showError('Failed to load interdiction codes')
      });
  }

  private filterCodeList(search: string | null): ValidInterdictionCode[] {
    if (!search) return this.validCodes;
    const term = search.toLowerCase();
    return this.validCodes.filter(c =>
      c.interCode.toLowerCase().includes(term) ||
      (c.interDesc && c.interDesc.toLowerCase().includes(term))
    );
  }

  onCodeChange(): void {
    const code = this.form.get('interCode')?.value;
    const selected = this.validCodes.find(c => c.interCode === code);
    if (selected) {
      this.form.patchValue({
        interDesc: selected.interDesc,
        interType: selected.interType
      });

      if (selected.periodType && selected.periodNumber) {
        const effDate = this.form.get('effDate')?.value;
        if (effDate) {
          this.calculateTermDate(effDate, selected.periodType, selected.periodNumber);
        }
      }
    }
  }

  onUnitIdBlur(): void {
    const unitId = this.form.get('unitId')?.value?.trim();
    const unitIdCtrl = this.form.get('unitId')!;

    if (unitId && this.data.donorId) {
      const len = unitId.length;
      if (len !== 15 && len !== 13 && len !== 7) {
        unitIdCtrl.setErrors({ invalidFormat: true });
        this.collectionDates = [];
        this.collectionDateDisplay = '';
        this.form.patchValue({ collDate: '' });
        return;
      }

      this.service.getCollectionDates(this.data.donorId, unitId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (dates) => {
            this.collectionDates = dates;
            if (dates.length === 0) {
              unitIdCtrl.setErrors({ unitNotFound: true });
              this.collectionDateDisplay = '';
              this.form.patchValue({ collDate: '' });
            } else {
              unitIdCtrl.setErrors(null);
              if (dates.length === 1) {
                this.form.patchValue({ collDate: dates[0].collDate });
                this.collectionDateDisplay = this.formatDate(dates[0].collDate);
              } else {
                this.collectionDateDisplay = '';
                this.form.patchValue({ collDate: '' });
              }
            }
          },
          error: () => {
            this.collectionDates = [];
            this.collectionDateDisplay = '';
            this.form.patchValue({ collDate: '' });
            unitIdCtrl.setErrors({ unitNotFound: true });
          }
        });
    } else {
      unitIdCtrl.setErrors(null);
      this.collectionDates = [];
      this.collectionDateDisplay = '';
      this.form.patchValue({ collDate: '' });
    }
  }

  onCollDateChange(): void {
    const collDate = this.form.get('collDate')?.value;
    this.collectionDateDisplay = collDate ? this.formatDate(collDate) : '';
  }

  private calculateTermDate(effDate: Moment | string, periodType: string, periodNumber: number): void {
    const eff = moment.isMoment(effDate) ? effDate.clone() : moment(effDate, 'YYYY-MM-DD');
    if (!eff.isValid()) return;

    let termDate: Moment;
    switch (periodType.toUpperCase()) {
      case 'D':
        termDate = eff.add(periodNumber, 'days');
        break;
      case 'W':
        termDate = eff.add(periodNumber, 'weeks');
        break;
      case 'M':
        termDate = eff.add(periodNumber, 'months');
        break;
      case 'Y':
        termDate = eff.add(periodNumber, 'years');
        break;
      default:
        return;
    }
    this.form.patchValue({ termDate });
  }

  onSubmit(addAnother: boolean): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    if (this.form.invalid) {
      return;
    }

    this.submitting = true;
    const formValue = this.form.getRawValue();

    const request: PlaceInterdictionRequest = {
      donorId: this.data.donorId,
      interCode: formValue.interCode,
      unitId: formValue.unitId || undefined,
      collDate: formValue.collDate || undefined,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || undefined,
      notes: formValue.notes || undefined
    };

    this.service.placeInterdiction(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting = false;
          this.dialogRef.close({ success: true, addAnother, interCode: formValue.interCode });
        },
        error: (err) => {
          this.submitting = false;
          const errorCode = err?.error?.errorCode;
          const message = err?.error?.message || err?.message || 'Failed to place interdiction';
          const msg = errorCode ? `${errorCode}: ${message}` : message;
          this.snackbarService.showError(msg);
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  formatDate(dateString: string): string {
    const m = moment(dateString, ['YYYY-MM-DD', moment.ISO_8601]);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }


  getEffectiveDateError(): string {
    const control = this.form.get('effDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse')) {
      return 'Effective date is invalid';
    }
    if (control.hasError('required')) {
      return 'Effective Date is required';
    }
    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Effective date is invalid';
    }
    if (control.hasError('matDatepickerMax')) {
      return 'Effective date cannot be a future date';
    }

    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    if (formErrors?.['dateRangeInvalid']) {
      return 'Effective Date must be less than or equal to Termination Date';
    }

    return '';
  }

  getTerminationDateError(): string {
    const control = this.form.get('termDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse')) {
      return 'Termination date is invalid';
    }
    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Termination date is invalid';
    }
    if (control.hasError('matDatepickerMin')) {
      return 'Termination Date must be greater than or equal to Effective Date';
    }
    if (this.form.errors?.['dateRangeInvalid']) {
      return 'Termination Date must be greater than or equal to Effective Date';
    }

    return '';
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('termDate'), false
    );
  }

  get termMinDate(): Moment | null {
    const effDate = this.form?.get('effDate')?.value;
    if (effDate && moment.isMoment(effDate) && effDate.isValid()) {
      return effDate;
    }
    return null;
  }
}
