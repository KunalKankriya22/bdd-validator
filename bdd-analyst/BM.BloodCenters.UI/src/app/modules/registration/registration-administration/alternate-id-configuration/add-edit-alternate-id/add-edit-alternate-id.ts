import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, inject, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { AlternateIdService } from '../services/alternate-id.service';
import {
  AlternateIdDonorGrade,
  AlternateIdForm,
  KEY_GRADE_OPTIONS,
  ALTID_MATCH_TYPE_OPTIONS,
  FINAL_GRADE_OPTIONS,
} from '../models/alternate-id.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-add-edit-alternate-id',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatMomentDateModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-alternate-id.html',
  styleUrls: ['./add-edit-alternate-id.scss']
})
export class AddEditAlternateId implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: AlternateIdDonorGrade | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  form: FormGroup;
  panelTitle: string = '';

  keyGradeOptions = KEY_GRADE_OPTIONS;
  altIdMatchOptions = ALTID_MATCH_TYPE_OPTIONS;
  finalGradeOptions = FINAL_GRADE_OPTIONS;

  readonly keyGradeSearchCtrl = new FormControl('');
  readonly finalGradeSearchCtrl = new FormControl('');

  private readonly keyGradeSearch = signal('');
  private readonly finalGradeSearch = signal('');

  readonly filteredKeyGrades = computed(() =>
    this.filterItems(this.keyGradeOptions, this.keyGradeSearch())
  );
  readonly filteredFinalGrades = computed(() =>
    this.filterItems(this.finalGradeOptions, this.finalGradeSearch())
  );

  isSaving = false;
  savingAction: 'save' | 'createAnother' | null = null;
  minDate: Moment;

  private originalEffDate: string | null = null;

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private readonly headerService = inject(HeaderService);
  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  private getChapterMinDate(): moment.Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: AlternateIdService,
    private snackBar: MatSnackBar
  ) {
    this.minDate = this.getChapterMinDate();

    this.form = this.fb.group({
      keyDataGrade: ['', [Validators.required]],
      altidMatchType: ['', [Validators.required]],
      finalGrade: ['', [Validators.required]],
      effDate: [null, [Validators.required]],
      termDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

    // Track which date field was last changed for cross-field error display
    this.form.get('effDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('termDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });

    effect(() => {
      this.minDate = this.getChapterMinDate();
    });
  }

  ngOnInit(): void {
    this.setupPanel();
    this.setupSearchSubscriptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.setupPanel();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add Alternate ID';
      this.resetFormForAddMode();
    } else {
      this.panelTitle = 'Edit Alternate ID';
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    this.form.get('keyDataGrade')?.enable();
    this.form.get('altidMatchType')?.enable();
    this.form.get('finalGrade')?.enable();
    this.form.get('effDate')?.enable();

    DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
  }

  private populateFormForEdit(): void {
    if (this.data) {
      this.originalEffDate = this.data.effDate
        ? moment(this.data.effDate).format('YYYY-MM-DD')
        : null;

      this.form.patchValue({
        keyDataGrade: this.data.keyDataGrade || '',
        altidMatchType: this.data.altidMatchType || '',
        finalGrade: this.data.finalGrade || '',
        effDate: this.data.effDate ? moment(this.data.effDate) : null,
        termDate: this.data.termDate ? moment(this.data.termDate) : null
      });
    }

    this.form.markAsPristine();

    const chapterOffset = this.chapterOffset;

    // Effective date: editable in edit mode — allows original past date, blocks new past dates
    const effDateControl = this.form.get('effDate');
    if (effDateControl) {
      effDateControl.clearValidators();
      effDateControl.enable();
      effDateControl.setValidators([
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        this.editModeEffectiveDateValidator(this.originalEffDate, chapterOffset)
      ]);
      effDateControl.updateValueAndValidity();
    }

    // Termination date: optional, allows any valid date including past
    const termDateControl = this.form.get('termDate');
    if (termDateControl) {
      termDateControl.clearValidators();
      termDateControl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator()
      ]);
      termDateControl.updateValueAndValidity();
    }
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    if (this.form.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('termDate')?.markAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSaving = true;
    this.savingAction = 'save';

    const formData: AlternateIdForm = {
      keyDataGrade: formValue.keyDataGrade,
      altidMatchType: formValue.altidMatchType,
      finalGrade: formValue.finalGrade,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || undefined
    };

    let apiCall;

    if (this.mode === 'add') {
      apiCall = this.service.create(formData);
    } else {
      apiCall = this.service.update(this.data?.auditKey || 0, formData);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isSaving = false; this.savingAction = null; })
      )
      .subscribe({
        next: () => {
          const message = this.mode === 'add'
            ? 'Alternate ID configuration added successfully'
            : 'Alternate ID configuration updated successfully';

          this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: () => {
          // Handled globally by authInterceptor
        }
      });
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    if (this.form.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('termDate')?.markAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSaving = true;
    this.savingAction = 'createAnother';

    const formData: AlternateIdForm = {
      keyDataGrade: formValue.keyDataGrade,
      altidMatchType: formValue.altidMatchType,
      finalGrade: formValue.finalGrade,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || undefined
    };

    this.service.create(formData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isSaving = false; this.savingAction = null; })
      )
      .subscribe({
        next: () => {
          this.snackBar.open(
            'Alternate ID configuration added successfully',
            'Close',
            { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['success-snackbar'] }
          );

          this.saveSuccess.emit();
          this.resetFormForAddMode();
        },
        error: () => {
          // Handled globally by authInterceptor
        }
      });
  }

  getEffectiveDateDisplay(): string {
    const effDate = this.form.getRawValue().effDate;
    if (!effDate) return '-';
    const m = moment.isMoment(effDate) ? effDate : moment(effDate);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('termDate'), this.mode === 'edit'
    );
  }

  private hasDateValidationError(): boolean {
    return this.form.hasError('dateRangeInvalid') || false;
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit' && !this.form.dirty) {
      return false;
    }
    return this.form.valid && !this.hasDateValidationError();
  }

  get termMinDate(): Moment {
    const effDate = this.form.get('effDate')?.value;
    if (effDate && moment.isMoment(effDate) && effDate.isValid()) {
      return effDate.isAfter(this.minDate) ? effDate : this.minDate;
    }
    return this.minDate;
  }

  /** Minimum selectable date for the effective date picker.
   *  In edit mode, pass null so matDatepickerMin doesn't fire for existing past dates.
   *  The editModeEffectiveDateValidator handles past-date blocking instead. */
  get effPickerMinDate(): Moment | null {
    return this.mode === 'edit' ? null : this.minDate;
  }

  private editModeEffectiveDateValidator(originalEffectiveDate: string | null, chapterTimezone?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const selectedDate = moment.isMoment(value) ? value : moment(value);
      if (!selectedDate.isValid()) return null;
      const selectedDateStr = selectedDate.format('YYYY-MM-DD');
      if (originalEffectiveDate && selectedDateStr === originalEffectiveDate) return null;
      const today = DateFieldValidationUtility.getMinDate(chapterTimezone);
      if (selectedDateStr < today.format('YYYY-MM-DD')) {
        return { effectiveDatePast: true };
      }
      return null;
    };
  }

  get selectedKeyGradeDisplay(): string {
    const val = this.form.get('keyDataGrade')?.value;
    if (!val) return '';
    const found = this.keyGradeOptions.find(o => o.value === val);
    return found ? found.label : val;
  }

  get selectedFinalGradeDisplay(): string {
    const val = this.form.get('finalGrade')?.value;
    if (!val) return '';
    const found = this.finalGradeOptions.find(o => o.value === val);
    return found ? found.label : val;
  }

  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
  }

  private setupSearchSubscriptions(): void {
    this.keyGradeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.keyGradeSearch.set(v || ''));
    this.finalGradeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.finalGradeSearch.set(v || ''));
  }

  private filterItems(items: { value: string; label: string }[], search: string): { value: string; label: string }[] {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(item => {
      const label = (item.label || '').toLowerCase();
      const value = (item.value || '').toLowerCase();
      return label.includes(lower) || value.includes(lower);
    });
  }
}
