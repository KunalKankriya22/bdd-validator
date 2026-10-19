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
import { MaintainDonorAttributesService } from '../services/maintain-donor-attributes.service';
import { MaintainDonorAttributeProperty, CreateMaintainDonorAttributeRequest } from '../models/maintain-donor-attributes.models';

export interface AddAttributeDialogData {
  donorId: string;
}

@Component({
  selector: 'app-add-attribute-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatMomentDateModule, NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  template: `
    <div class="side-panel">
      <div class="panel-header">
        <h2 id="add-attr-title">Add New Attribute</h2>
        <button mat-icon-button (click)="onCancel()" aria-label="Close">
          <mat-icon aria-hidden="true">close</mat-icon>
        </button>
      </div>
      <div class="panel-body">
        <form [formGroup]="form" class="panel-form">
          <div class="form-row">
            <div class="form-col col-30">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Code</mat-label>
                <mat-select formControlName="interCode" (selectionChange)="onCodeChange()">
                  <mat-option>
                    <ngx-mat-select-search [formControl]="codeSearchCtrl"
                      placeholderLabel="Search code..." noEntriesFoundLabel="No matching codes">
                    </ngx-mat-select-search>
                  </mat-option>
                  @if (filteredCodes.length === 0) {
                    <mat-option disabled>No data available</mat-option>
                  }
                  @for (code of filteredCodes; track code.interCode) {
                    <mat-option [value]="code.interCode">{{ code.interCode }}{{ code.interDesc ? ' — ' + code.interDesc : '' }}</mat-option>
                  }
                </mat-select>
                @if (form.get('interCode')?.hasError('required') && form.get('interCode')?.touched) {
                  <mat-error>Code is required</mat-error>
                }
              </mat-form-field>
            </div>
            <div class="form-col col-70">
              <div class="readonly-field" role="group" aria-label="Description">
                <span class="readonly-label">Description</span>
                <span class="readonly-value">{{ selectedDesc || '-' }}</span>
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-col col-50">
              <div class="readonly-field" role="group" aria-label="Effective Date">
                <span class="readonly-label">Effective Date</span>
                <span class="readonly-value">{{ chapterTodayDisplay }}</span>
              </div>
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
              <div class="readonly-field" role="group" aria-label="User ID">
                <span class="readonly-label">User ID</span>
                <span class="readonly-value">{{ currentUserId }}</span>
              </div>
            </div>
          </div>
        </form>
      </div>
      <div class="panel-footer">
        <button mat-stroked-button (click)="onCancel()" class="cancel-button">CANCEL</button>
        <button mat-raised-button (click)="onSubmit()" [disabled]="form.invalid || submitting" class="add-button">ADD</button>
      </div>
    </div>
  `,
  styles: [`
    .side-panel { display: flex; flex-direction: column; height: 100%; background: #fff; overflow: hidden; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid rgba(0,0,0,0.12); flex-shrink: 0; height: 81px; box-sizing: border-box; overflow: hidden;
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
    .cancel-button { color: #228189; border-color: #228189; font-weight: 500; }
    .add-button { background-color: #228189; color: #fff; font-weight: 500; &:hover { background-color: #1b6b72; } &:disabled { opacity: 0.5; } }
  `]
})
export class AddAttributeDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MaintainDonorAttributesService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly loginService = inject(LoginService);
  private readonly dialogRef = inject(MatDialogRef<AddAttributeDialogComponent>);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  readonly data = inject<AddAttributeDialogData>(MAT_DIALOG_DATA);
  private readonly destroy$ = new Subject<void>();

  form!: FormGroup;
  validCodes: MaintainDonorAttributeProperty[] = [];
  filteredCodes: MaintainDonorAttributeProperty[] = [];
  codeSearchCtrl = new FormControl('');
  submitting = false;
  currentUserId = '';
  selectedDesc = '';
  chapterToday!: Moment;
  chapterTodayDisplay = '';

  private lastChangedDateField: 'effective' | 'termination' | null = null;
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  ngOnInit(): void {
    this.currentUserId = this.loginService.getStoredUsername();
    this.chapterToday = this.chapterTimezoneService.getChapterLocalDate().startOf('day');
    this.chapterTodayDisplay = this.chapterToday.format('DD-MMM-YYYY').toUpperCase();
    this.initForm();
    this.loadValidCodes();
    this.codeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((search) => {
      this.filteredCodes = this.filterCodeList(search);
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private initForm(): void {
    this.form = this.fb.group({
      interCode: ['', [Validators.required]],
      effDate: [this.chapterToday],
      termDate: [null],
    });

    const termDateCtrl = this.form.get('termDate');
    if (termDateCtrl) {
      termDateCtrl.clearValidators();
      termDateCtrl.setValidators([dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]);
      termDateCtrl.updateValueAndValidity();
    }
    this.form.get('termDate')?.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  private loadValidCodes(): void {
    this.service.getPropertiesDropdown().pipe(takeUntil(this.destroy$)).subscribe({
      next: (codes) => { this.validCodes = codes; this.filteredCodes = codes; },
      error: () => this.snackbarService.showError('Failed to load attribute codes')
    });
  }

  private filterCodeList(search: string | null): MaintainDonorAttributeProperty[] {
    if (!search) return this.validCodes;
    const term = search.toLowerCase();
    return this.validCodes.filter(c => c.interCode.toLowerCase().includes(term) || (c.interDesc && c.interDesc.toLowerCase().includes(term)));
  }

  onCodeChange(): void {
    const code = this.form.get('interCode')?.value;
    const selected = this.validCodes.find(c => c.interCode === code);
    this.selectedDesc = selected?.interDesc || '';
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    if (this.form.invalid) return;

    this.submitting = true;
    const formValue = this.form.getRawValue();
    const request: CreateMaintainDonorAttributeRequest = {
      donorId: this.data.donorId,
      interCode: formValue.interCode,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || undefined,
    };

    this.service.createAttribute(this.data.donorId, request).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.submitting = false; this.dialogRef.close({ success: true, interCode: formValue.interCode }); },
      error: (err) => {
        this.submitting = false;
        this.snackbarService.showError(err?.error?.message || err?.message || 'Failed to add attribute');
      }
    });
  }

  onCancel(): void { this.dialogRef.close(); }

  get termMinDate(): Moment {
    return this.chapterToday;
  }

  getTerminationDateError(): string {
    const control = this.form.get('termDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination date is invalid';
    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) return 'Termination date is invalid';
    if (control.hasError('matDatepickerMin')) return 'Termination Date must be greater than or equal to Effective Date';
    if (this.form.errors?.['dateRangeInvalid']) return 'Termination Date must be greater than or equal to Effective Date';
    return '';
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput((event.target as HTMLInputElement).value, this.form.get('termDate'), false);
  }
}
