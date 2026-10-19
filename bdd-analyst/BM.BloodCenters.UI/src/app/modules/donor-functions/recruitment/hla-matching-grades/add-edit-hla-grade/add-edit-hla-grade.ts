import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { A11yModule } from '@angular/cdk/a11y';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { HlaGradingService } from '../services/hla-grading.service';
import {
  DropdownOption,
  CreateHlaGradingDto,
  UpdateHlaGradingDto,
  HlaGradingDialogData,
  HlaGradingDialogResult
} from '../models/hla-grading.model';

@Component({
  selector: 'app-add-edit-hla-grade',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    MatMomentDateModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    A11yModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-hla-grade.html',
  styleUrls: ['./add-edit-hla-grade.scss']
})
export class AddEditHlaGrade implements OnInit, OnDestroy {
  mode: 'add' | 'edit';
  gradeOptions: DropdownOption[];
  hlaCodeOptions: DropdownOption[];
  nextGradeId: number;

  form!: FormGroup;
  isSaving = false;
  formSubmitted = false;
  private hasSavedRecord = false;
  private originalFormValues: Record<string, unknown> | null = null;

  minEffectiveDate = DateFieldValidationUtility.getMinDate();
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const today = this.chapterTimezoneService.getChapterLocalDate();
    if (checkDate.isBefore(today)) return false;
    const eff = this.form?.get('effectiveDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) return false;
    }
    return true;
  };

  gradeSearchControl = new FormControl('');
  a1SearchControl = new FormControl('');
  a2SearchControl = new FormControl('');
  b1SearchControl = new FormControl('');
  b2SearchControl = new FormControl('');

  filteredGradeOptions: DropdownOption[] = [];
  filteredA1Options: DropdownOption[] = [];
  filteredA2Options: DropdownOption[] = [];
  filteredB1Options: DropdownOption[] = [];
  filteredB2Options: DropdownOption[] = [];

  effDateErrorMatcher!: ErrorStateMatcher;
  termDateErrorMatcher!: ErrorStateMatcher;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: HlaGradingService,
    private snackbarService: SnackbarService,
    private headerService: HeaderService,
    private chapterTimezoneService: ChapterTimezoneService,
    private dialogRef: MatDialogRef<AddEditHlaGrade>,
    @Inject(MAT_DIALOG_DATA) public dialogData: HlaGradingDialogData
  ) {
    this.mode = dialogData.mode;
    this.gradeOptions = dialogData.gradeOptions;
    this.hlaCodeOptions = dialogData.hlaCodeOptions;
    this.nextGradeId = dialogData.nextGradeId;

    this.filteredGradeOptions = this.gradeOptions;
    this.filteredA1Options = this.hlaCodeOptions;
    this.filteredA2Options = this.hlaCodeOptions;
    this.filteredB1Options = this.hlaCodeOptions;
    this.filteredB2Options = this.hlaCodeOptions;
  }

  ngOnInit(): void {
    this.buildForm();
    this.setupSearchFilters();
    this.setupErrorMatchers();
    this.setupDateValidationListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      grade: ['', Validators.required],
      gradeLevel: [null, [Validators.required, Validators.min(1)]],
      a1: ['', Validators.required],
      a2: ['', Validators.required],
      b1: ['', Validators.required],
      b2: ['', Validators.required],
      effectiveDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator(this.headerService.chapterTimeZone())]],
      terminationDate: [null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate'),
        this.duplicateHlaCodeValidator()
      ]
    });

    if (this.mode === 'edit' && this.dialogData.record) {
      const record = this.dialogData.record;
      this.form.patchValue({
        grade: record.grade,
        gradeLevel: record.gradeLevel,
        a1: record.a1,
        a2: record.a2,
        b1: record.b1,
        b2: record.b2,
        effectiveDate: record.effectiveDate ? moment(record.effectiveDate) : null,
        terminationDate: record.terminationDate ? moment(record.terminationDate) : null
      });
      this.form.markAsPristine();
      this.originalFormValues = this.form.getRawValue();
      this.isGradeInOptions = this.gradeOptions.some(o => o.key === record.grade);
      this.isA1InOptions = this.hlaCodeOptions.some(o => o.key === record.a1);
      this.isA2InOptions = this.hlaCodeOptions.some(o => o.key === record.a2);
      this.isB1InOptions = this.hlaCodeOptions.some(o => o.key === record.b1);
      this.isB2InOptions = this.hlaCodeOptions.some(o => o.key === record.b2);
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      const termCtrl = this.form.get('terminationDate');
      if (termCtrl) {
        termCtrl.addValidators(DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone()));
        termCtrl.updateValueAndValidity({ emitEvent: false });
      }
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form);
    }
  }

  private setupSearchFilters(): void {
    this.gradeSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(search => {
      this.filteredGradeOptions = this.filterOptions(this.gradeOptions, search);
    });
    this.a1SearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(search => {
      this.filteredA1Options = this.filterOptions(this.hlaCodeOptions, search);
    });
    this.a2SearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(search => {
      this.filteredA2Options = this.filterOptions(this.hlaCodeOptions, search);
    });
    this.b1SearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(search => {
      this.filteredB1Options = this.filterOptions(this.hlaCodeOptions, search);
    });
    this.b2SearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(search => {
      this.filteredB2Options = this.filterOptions(this.hlaCodeOptions, search);
    });
  }

  private filterOptions(options: DropdownOption[], search: string | null): DropdownOption[] {
    if (!search) return options;
    const term = search.toLowerCase().trim();
    return options.filter(o => o.key.toLowerCase().includes(term) || o.value.toLowerCase().includes(term));
  }

  private setupErrorMatchers(): void {
    this.effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
      () => this.getEffectiveDateError()
    );
    this.termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
      () => this.getTerminationDateError()
    );
  }

  private setupDateValidationListeners(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });

    // Trigger validation when HLA codes change
    ['a1', 'a2', 'b1', 'b2'].forEach(field => {
      this.form.get(field)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        });
    });
  }

  private duplicateHlaCodeValidator(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      const a1Control = control.get('a1');
      const a2Control = control.get('a2');
      const b1Control = control.get('b1');
      const b2Control = control.get('b2');

      const a1 = a1Control?.value;
      const a2 = a2Control?.value;
      const b1 = b1Control?.value;
      const b2 = b2Control?.value;

      // Clear previous errors
      if (a2Control?.hasError('duplicateA')) {
        const errors = { ...a2Control.errors };
        delete errors['duplicateA'];
        a2Control.setErrors(Object.keys(errors).length ? errors : null);
      }
      if (b2Control?.hasError('duplicateB')) {
        const errors = { ...b2Control.errors };
        delete errors['duplicateB'];
        b2Control.setErrors(Object.keys(errors).length ? errors : null);
      }

      // Check for duplicates and set field-level errors
      if (a1 && a2 && a1 === a2) {
        a2Control?.setErrors({ ...a2Control.errors, duplicateA: true });
        return { duplicateA: true };
      }

      if (b1 && b2 && b1 === b2) {
        b2Control?.setErrors({ ...b2Control.errors, duplicateB: true });
        return { duplicateB: true };
      }

      return null;
    };
  }

  onGradeDropdownOpened(opened: boolean): void {
    if (opened) {
      this.gradeSearchControl.setValue('');
      this.filteredGradeOptions = this.gradeOptions;
    }
  }

  onHlaCodeDropdownOpened(field: string, opened: boolean): void {
    if (!opened) return;
    switch (field) {
      case 'a1': this.a1SearchControl.setValue(''); this.filteredA1Options = this.hlaCodeOptions; break;
      case 'a2': this.a2SearchControl.setValue(''); this.filteredA2Options = this.hlaCodeOptions; break;
      case 'b1': this.b1SearchControl.setValue(''); this.filteredB1Options = this.hlaCodeOptions; break;
      case 'b2': this.b2SearchControl.setValue(''); this.filteredB2Options = this.hlaCodeOptions; break;
    }
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  isGradeInOptions = true;
  isA1InOptions = true;
  isA2InOptions = true;
  isB1InOptions = true;
  isB2InOptions = true;

  isGradeTruncated = false;
  isA1Truncated = false;
  isA2Truncated = false;
  isB1Truncated = false;
  isB2Truncated = false;

  getSelectedLabel(field: string): string {
    const value = this.form.get(field)?.value;
    if (!value) return '';
    const options = field === 'grade' ? this.gradeOptions : this.hlaCodeOptions;
    const option = options.find(o => o.key === value);
    return option ? option.key : value;
  }

  checkGradeTruncation(el: HTMLElement): void { this.isGradeTruncated = el.scrollWidth > el.clientWidth; }
  checkA1Truncation(el: HTMLElement): void { this.isA1Truncated = el.scrollWidth > el.clientWidth; }
  checkA2Truncation(el: HTMLElement): void { this.isA2Truncated = el.scrollWidth > el.clientWidth; }
  checkB1Truncation(el: HTMLElement): void { this.isB1Truncated = el.scrollWidth > el.clientWidth; }
  checkB2Truncation(el: HTMLElement): void { this.isB2Truncated = el.scrollWidth > el.clientWidth; }

  preventInvalidInput(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    if (!/^\d$/.test(event.key)) { event.preventDefault(); return; }
    const input = event.target as HTMLInputElement;
    const currentValue = input.value.replace(/[^0-9]/g, '');
    if (currentValue.length >= 5) event.preventDefault();
  }

  get hasActualChanges(): boolean {
    if (!this.originalFormValues) return true;
    const current = this.form.getRawValue();
    if (current.grade !== this.originalFormValues['grade']) return true;
    if (current.gradeLevel !== this.originalFormValues['gradeLevel']) return true;
    if (current.a1 !== this.originalFormValues['a1']) return true;
    if (current.a2 !== this.originalFormValues['a2']) return true;
    if (current.b1 !== this.originalFormValues['b1']) return true;
    if (current.b2 !== this.originalFormValues['b2']) return true;
    if (!this.datesEqual(current.effectiveDate, this.originalFormValues['effectiveDate'] as Moment | null)) return true;
    if (!this.datesEqual(current.terminationDate, this.originalFormValues['terminationDate'] as Moment | null)) return true;
    return false;
  }

  private datesEqual(a: Moment | null, b: Moment | null): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return moment.isMoment(a) && moment.isMoment(b) && a.isSame(b, 'day');
  }

  get isFormValid(): boolean {
    if (this.mode === 'add') {
      const hasDuplicateErrors = this.form.hasError('duplicateA') || this.form.hasError('duplicateB');
      return this.form.valid && !hasDuplicateErrors;
    }
    if (!this.hasActualChanges) return false;
    const hasDateErrors = this.getEffectiveDateError() !== '' || this.getTerminationDateError() !== '';
    const hasDuplicateErrors = this.form.hasError('duplicateA') || this.form.hasError('duplicateB');
    return this.form.valid && !hasDateErrors && !hasDuplicateErrors;
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const d = new Date(date as string);
    return `${d.getDate().toString().padStart(2, '0')}-${d
      .toLocaleString('en-US', { month: 'short' })
      .toUpperCase()}-${d.getFullYear()}`;
  }

  onSave(): void {
    this.submitForm(false);
  }

  onSaveAndAddAnother(): void {
    this.submitForm(true);
  }

  onCancel(): void {
    this.dialogRef.close(this.hasSavedRecord ? { success: true } as HlaGradingDialogResult : undefined);
  }

  private submitForm(addAnother: boolean): void {
    this.formSubmitted = true;
    this.form.markAllAsTouched();
    this.form.get('terminationDate')?.updateValueAndValidity();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    const hasDateErrors = this.getEffectiveDateError() !== '' || this.getTerminationDateError() !== '';
    if (!this.form.valid || hasDateErrors || this.isSaving) return;

    const formValue = this.form.getRawValue();
    const effectiveDate = formValue.effectiveDate as Moment;
    const terminationDate = formValue.terminationDate as Moment;

    if (!effectiveDate || !effectiveDate.isValid()) return;
    if (terminationDate && !terminationDate.isValid()) return;

    this.isSaving = true;

    if (this.mode === 'add') {
      const dto: CreateHlaGradingDto = {
        grade: formValue.grade,
        a1: formValue.a1,
        a2: formValue.a2,
        b1: formValue.b1,
        b2: formValue.b2,
        gradeLevel: formValue.gradeLevel,
        effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate),
        terminationDate: formValue.terminationDate
          ? DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) : null
      };

      this.service.createHlaGrading(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isSaving = false;
            if (response.success) {
              this.hasSavedRecord = true;
              this.snackbarService.showSuccess(response.message);
              if (addAnother) {
                this.nextGradeId = this.nextGradeId + 1;
                this.buildForm();
                this.setupDateValidationListeners();
              } else {
                this.dialogRef.close({ success: true } as HlaGradingDialogResult);
              }
            }
          },
          error: () => { this.isSaving = false; }
        });
    } else {
      const record = this.dialogData.record!;
      const dto: UpdateHlaGradingDto = {
        originalGradeId: record.gradeId,
        originalGrade: record.grade,
        originalA1: record.a1,
        originalA2: record.a2,
        originalB1: record.b1,
        originalB2: record.b2,
        grade: formValue.grade,
        a1: formValue.a1,
        a2: formValue.a2,
        b1: formValue.b1,
        b2: formValue.b2,
        gradeLevel: formValue.gradeLevel,
        effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate),
        terminationDate: formValue.terminationDate
          ? DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) : null
      };

      this.service.updateHlaGrading(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isSaving = false;
            if (response.success) {
              this.snackbarService.showSuccess(response.message);
              this.dialogRef.close({ success: true } as HlaGradingDialogResult);
            }
          },
          error: () => { this.isSaving = false; }
        });
    }
  }
}
