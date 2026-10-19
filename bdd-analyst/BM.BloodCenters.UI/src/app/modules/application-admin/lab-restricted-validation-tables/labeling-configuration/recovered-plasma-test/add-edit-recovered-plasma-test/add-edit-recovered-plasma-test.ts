import { Component, ElementRef, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import { RecoveredPlasmaTestService } from '../services/recovered-plasma-test.service';
import { LoginService } from '@shared/services/login.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import {
  RecoveredPlasmaTestModel,
  RecoveredPlasmaTestCreateDto,
  RecoveredPlasmaTestUpdateDto,
  LookupItem
} from '../models/recovered-plasma-test.model';

export interface RecoveredPlasmaTestFormData {
  testId: string;
  effDate: Date;
  termDate?: Date | null;
}

@Component({
  selector: 'app-add-edit-recovered-plasma-test',
  standalone: true,
  imports: [
    CommonModule,
    A11yModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-recovered-plasma-test.html',
  styleUrls: ['./add-edit-recovered-plasma-test.scss']
})
export class AddEditRecoveredPlasmaTest implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: RecoveredPlasmaTestModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<RecoveredPlasmaTestFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();
  @ViewChild('closeBtn', { read: ElementRef }) closeBtnRef!: ElementRef<HTMLButtonElement>;

  public focus(): void {
    setTimeout(() => this.closeBtnRef?.nativeElement?.focus(), 50);
  }

  form: FormGroup;
  panelTitle: string = '';
  lastModified: string = '';

  editModeValues: {
    testId: string;
    effectiveDate: string;
  } = {
    testId: '',
    effectiveDate: ''
  };

  testIdOptions: { value: string; display: string }[] = [];
  filteredTestIdOptions: { value: string; display: string }[] = [];
  testIdSearchControl = new FormControl('');

  isLoadingOptions = false;
  isSaving = false;
  savingAction: 'save' | 'saveAndCreate' | null = null;
  minDate = DateFieldValidationUtility.getMinDate();
  terminationMinDate = DateFieldValidationUtility.getMinDate();

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTermDateError());

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private plasmaTestService: RecoveredPlasmaTestService,
    private snackBar: MatSnackBar,
    private loginService: LoginService,
    private headerService: HeaderService
  ) {
    this.form = this.fb.group({
      testId: ['', [Validators.required]],
      effDate: [null, [Validators.required]],
      termDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });
  }

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  ngOnInit(): void {
    this.setupPanel();
    this.loadDropdowns();
    this.setupAutoPopulate();
    this.setupTestIdSearch();
  }

  private setupAutoPopulate(): void {
    // Track which date field was last changed for cross-field error display
    this.form.get('effDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        const termControl = this.form.get('termDate');
        const hadInvalidDate = termControl?.hasError('invalidDate');
        this.updateTerminationMinDate();
        if (hadInvalidDate && !termControl?.value) {
          setTimeout(() => termControl?.setErrors({ invalidDate: true }));
        }
      });

    this.form.get('termDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
  }

  private setupTestIdSearch(): void {
    this.testIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        if (!search) {
          this.filteredTestIdOptions = this.testIdOptions;
          return;
        }
        const lowerSearch = search.toLowerCase();
        this.filteredTestIdOptions = this.testIdOptions.filter(option =>
          option.value.toLowerCase().includes(lowerSearch) ||
          option.display.toLowerCase().includes(lowerSearch)
        );
      });
  }

  private loadDropdowns(): void {
    this.isLoadingOptions = true;

    this.plasmaTestService.getTestIdLookups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lookups: LookupItem[]) => {
          this.testIdOptions = lookups.map((item) => ({
            value: item.code,
            display: item.description ? `${item.code} - ${item.description}` : item.code
          }));
          this.filteredTestIdOptions = this.testIdOptions;

          // In edit mode, re-apply form values after options load so mat-select displays them
          if (this.mode === 'edit' && this.data) {
            this.form.patchValue({
              testId: this.data.testId || ''
            }, { emitEvent: false });
          }

          this.isLoadingOptions = false;
        },
        error: (error) => {
          console.error('Error loading dropdowns:', error);
          this.isLoadingOptions = false;
          this.snackBar.open(
            'Failed to load Test ID options. Please refresh and try again.',
            'DISMISS',
            { horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'], duration: 5000 }
          );
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.setupPanel();

        if (this.mode === 'add') {
          this.resetFormForAddMode();
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add New Test ID';
      this.lastModified = '';
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    } else {
      this.panelTitle = 'Edit Test ID';
      this.lastModified = this.data?.insertDate
        ? 'Last Modified: ' + DateFieldValidationUtility.formatDateForUI(moment(this.data.insertDate))?.toUpperCase()
        : '';
      this.populateFormForEdit();
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      testId: '',
      effectiveDate: ''
    };

    this.form.reset();
    this.terminationMinDate = this.minDate;
    this.form.markAsUntouched();
    this.form.markAsPristine();

    // Enable all fields in add mode
    this.form.get('testId')?.enable();

    // Restore required validators for add mode
    this.form.get('testId')?.setValidators([Validators.required]);

    // Update validity
    this.form.get('testId')?.updateValueAndValidity();
  }

  private populateFormForEdit(): void {
    if (this.data) {
      const testId = this.data.testId || '';

      // Display values for read-only cards (PK field + effective date)
      this.editModeValues = {
        testId,
        effectiveDate: this.data.effDate ? moment.utc(this.data.effDate).format('DD-MMM-YYYY').toUpperCase() : ''
      };

      this.form.patchValue({
        testId,
        effDate: this.data.effDate ? moment(moment.utc(this.data.effDate).format('YYYY-MM-DD')) : null,
        termDate: this.data.termDate ? moment(moment.utc(this.data.termDate).format('YYYY-MM-DD')) : null
      });

      this.updateTerminationMinDate();

      // Disable non-editable fields in edit mode (testId is PK, effDate is readonly)
      this.form.get('testId')?.disable();
      this.form.get('effDate')?.disable();
    }
  }

  private updateTerminationMinDate(): void {
    const effDateValue = this.form.get('effDate')?.value;
    let newMin = this.minDate;
    if (effDateValue) {
      const effMoment = moment(effDateValue);
      if (effMoment.isValid() && effMoment.isSameOrAfter(this.minDate, 'day')) {
        newMin = effMoment;
      }
    }
    if (!this.terminationMinDate.isSame(newMin, 'day')) {
      this.terminationMinDate = newMin;
    }
  }

  /** Focuses the first invalid form field for screen reader announcement (WCAG 3.3.1) */
  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.form.controls)
      .find(key => this.form.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) {
        setTimeout(() => el.focus(), 100);
      }
    }
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;
    this.savingAction = 'save';

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: RecoveredPlasmaTestCreateDto = {
        testId: formValue.testId?.trim() || '',
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate),
        loggedInUserName: this.loginService.getStoredUsername()
      };
      apiCall = this.plasmaTestService.createRecord(addPayload);
    } else {
      const updatePayload: RecoveredPlasmaTestUpdateDto = {
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate)
      };
      apiCall = this.plasmaTestService.updateRecord(formValue.testId?.trim() || '', updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
          this.savingAction = null;
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || (this.mode === 'add'
            ? 'Plasma test added successfully'
            : 'Plasma test updated successfully');

          this.snackBar.open(message, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
            duration: 3000
          });

          const result: RecoveredPlasmaTestFormData = {
            testId: formValue.testId?.trim() || '',
            effDate: formValue.effDate?.toDate() || new Date(),
            termDate: formValue.termDate?.toDate() || null
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        },
        error: (error) => {
          console.error('Error saving plasma test:', error);
          this.snackBar.open(
            error?.error?.message || 'Save failed. Please try again.',
            'DISMISS',
            { horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'], duration: 5000 }
          );
        }
      });
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;
    this.savingAction = 'saveAndCreate';

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: RecoveredPlasmaTestCreateDto = {
        testId: formValue.testId?.trim() || '',
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate),
        loggedInUserName: this.loginService.getStoredUsername()
      };
      apiCall = this.plasmaTestService.createRecord(addPayload);
    } else {
      const updatePayload: RecoveredPlasmaTestUpdateDto = {
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate)
      };
      apiCall = this.plasmaTestService.updateRecord(formValue.testId?.trim() || '', updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
          this.savingAction = null;
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || 'Operation completed successfully';

          this.snackBar.open(message, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
            duration: 3000
          });

          const result: RecoveredPlasmaTestFormData = {
            testId: formValue.testId?.trim() || '',
            effDate: formValue.effDate?.toDate() || new Date(),
            termDate: formValue.termDate?.toDate() || null
          };

          this.saveSuccess.emit(result);

          if (this.mode === 'edit') {
            this.mode = 'add';
            this.modeChange.emit('add');
            this.resetFormForAddMode();
            this.setupPanel();
          } else {
            this.resetFormForAddMode();
          }
        },
        error: (error) => {
          console.error('Error saving plasma test:', error);
          this.snackBar.open(
            error?.error?.message || 'Save failed. Please try again.',
            'DISMISS',
            { horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'], duration: 5000 }
          );
        }
      });
  }

  get testIdControl() {
    return this.form.get('testId');
  }

  get effDateControl() {
    return this.form.get('effDate');
  }

  get termDateControl() {
    return this.form.get('termDate');
  }

  getTestIdError(): string {
    const control = this.testIdControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Test ID is required';
    return '';
  }

  getEffDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.effDateControl,
      'Effective Date',
      'Termination Date',
      formErrors
    );
  }

  getTermDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.termDateControl,
      'Termination Date',
      'Effective Date',
      formErrors
    );
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }

  get isSaveEnabled(): boolean {
    // In add mode: form must be valid
    // In edit mode: form must be valid AND dirty (changed)
    if (this.mode === 'add') {
      return this.form.valid;
    } else {
      return this.form.valid && this.form.dirty;
    }
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
}
