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
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { TestMessageMappingService } from '../services/test-message-mapping.service';
import { LoginService } from '@shared/services/login.service';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import {
  TestMessageMappingModel,
  TestMessageMappingCreateDto,
  TestMessageMappingUpdateDto,
  LookupItem
} from '../models/test-message-mapping.model';

export interface TestMessageMappingFormData {
  ltTestId: string;
  resultCode: string;
  displyTestId: string;
  messageDesc: string;
  effDate: Date;
  termDate?: Date | null;
}

@Component({
  selector: 'app-add-edit-test-message-mapping',
  standalone: true,
  imports: [
    CommonModule,
    A11yModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatSnackBarModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-test-message-mapping.html',
  styleUrls: ['./add-edit-test-message-mapping.scss']
})
export class AddEditTestMessageMapping implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: TestMessageMappingModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<TestMessageMappingFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();
  @ViewChild('closeBtn', { read: ElementRef }) closeBtnRef!: ElementRef<HTMLButtonElement>;

  public focus(): void {
    setTimeout(() => this.closeBtnRef?.nativeElement?.focus(), 50);
  }

  form: FormGroup;
  panelTitle: string = '';
  lastModified: string = '';

  editModeValues: {
    ltTestId: string;
    resultCode: string;
    displyTestId: string;
    effectiveDate: string;
  } = {
    ltTestId: '',
    resultCode: '',
    displyTestId: '',
    effectiveDate: ''
  };

  allTestIdOptions: { value: string; display: string }[] = [];
  testIdOptions: { value: string; display: string }[] = [];
  testIdSearchControl = new FormControl('');

  allResultCodeOptions: { value: string; display: string }[] = [];
  resultCodeOptions: { value: string; display: string }[] = [];
  resultCodeSearchControl = new FormControl('');

  allMessageTypeOptions: { value: string; display: string }[] = [];
  messageTypeOptions: { value: string; display: string }[] = [];
  messageTypeSearchControl = new FormControl('');

  antibodyFlagOptions = [
    { value: 'Y', display: 'Yes' },
    { value: 'N', display: 'No' }
  ];

  isLoadingOptions = false;
  isSaving = false;
  savingAction: 'save' | 'saveAndCreate' | null = null;
  noResultCodesAvailable = false;
  minDate = DateFieldValidationUtility.getMinDate('');
  terminationMinDate = DateFieldValidationUtility.getMinDate('');

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTermDateError());

  private destroy$ = new Subject<void>();

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  constructor(
    private fb: FormBuilder,
    private mappingService: TestMessageMappingService,
    private snackBar: MatSnackBar,
    private loginService: LoginService,
    private headerService: HeaderService
  ) {
    this.form = this.fb.group({
      ltTestId: ['', [Validators.required]],
      resultCode: ['', [Validators.required]],
      displyTestId: ['', [Validators.required, Validators.maxLength(20)]],
      antibodyFlag: ['', [Validators.required]],
      messageDesc: [''],
      effDate: [null, [Validators.required]],
      termDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });
  }

  ngOnInit(): void {
    this.loadTestIdLookups();
    this.loadMessageTypeLookups();
    this.setupPanel();
    this.setupAutoPopulate();
    this.setupTestIdSearch();
    this.setupResultCodeSearch();
    this.setupMessageTypeSearch();
  }

  private setupAutoPopulate(): void {
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

    // Reload result code dropdown when ltTestId changes (only in add mode)
    this.form.get('ltTestId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((ltTestId: string) => {
        // Only handle changes in add mode (in edit mode, ltTestId is disabled)
        if (this.mode === 'add') {
          if (ltTestId && ltTestId.trim().length > 0) {
            this.loadResultCodeLookups(ltTestId.trim());
          } else {
            this.resultCodeOptions = [];
            this.noResultCodesAvailable = false;
            this.form.get('resultCode')?.reset();
            this.form.get('resultCode')?.enable();
            this.form.get('resultCode')?.markAsUntouched();
          }
        }
      });
  }

  private loadTestIdLookups(): void {
    this.mappingService.getTestIdLookups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lookups: LookupItem[]) => {
          this.allTestIdOptions = lookups.map((item) => ({
            value: item.code,
            display: item.code
          }));
          this.testIdOptions = [...this.allTestIdOptions];
        },
        error: (error) => {
          console.error('Error loading test ID lookups:', error);
          this.snackBar.open(
            'Failed to load AP Test ID options. Please refresh and try again.',
            'DISMISS',
            { horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'], duration: 5000 }
          );
        }
      });
  }

  private loadMessageTypeLookups(): void {
    this.mappingService.getMessageTypeLookups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lookups: LookupItem[]) => {
          this.allMessageTypeOptions = lookups.map((item) => ({
            value: item.code,
            display: item.code
          }));
          this.messageTypeOptions = [...this.allMessageTypeOptions];
        },
        error: (error) => {
          console.error('Error loading message type lookups:', error);
          this.snackBar.open(
            'Failed to load Message Type options. Please refresh and try again.',
            'DISMISS',
            { horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'], duration: 5000 }
          );
        }
      });
  }

  private loadResultCodeLookups(ltTestId: string): void {
    this.isLoadingOptions = true;
    this.noResultCodesAvailable = false;

    this.mappingService.getResultCodeLookups(ltTestId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lookups: LookupItem[]) => {
          if (!lookups || lookups.length === 0) {
            // No result codes available for this AP Test ID
            this.allResultCodeOptions = [];
            this.resultCodeOptions = [];
            this.noResultCodesAvailable = true;
            this.form.get('resultCode')?.reset();
            this.form.get('resultCode')?.disable();
            this.form.get('resultCode')?.markAsTouched();

            this.snackBar.open(
              'No result codes available for this AP Test ID. Please select another AP Test ID.',
              'DISMISS',
              {
                  horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['warning-snackbar']
              }
            );
          } else {
            this.allResultCodeOptions = lookups.map((item) => ({
              value: item.code,
              display: item.description ? `${item.code} - ${item.description}` : item.code
            }));
            this.resultCodeOptions = [...this.allResultCodeOptions];
            this.noResultCodesAvailable = false;

            // Only enable resultCode in add mode
            if (this.mode === 'add') {
              this.form.get('resultCode')?.enable();
            } else {
              // In edit mode, keep it disabled and re-apply form values after options load
              this.form.patchValue({
                resultCode: this.editModeValues.resultCode || ''
              }, { emitEvent: false });
            }
          }

          this.isLoadingOptions = false;
        },
        error: (error) => {
          console.error('Error loading result code lookups:', error);
          this.allResultCodeOptions = [];
          this.resultCodeOptions = [];
          this.noResultCodesAvailable = true;
          this.form.get('resultCode')?.reset();
          this.form.get('resultCode')?.disable();
          this.form.get('resultCode')?.markAsTouched();
          this.isLoadingOptions = false;
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
      this.panelTitle = 'Add New Test Message';
      this.lastModified = '';
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    } else {
      this.panelTitle = 'Edit Test Message';
      this.lastModified = this.data?.insertDate
        ? 'Last Modified: ' + DateFieldValidationUtility.formatDateForUI(moment(this.data.insertDate))?.toUpperCase()
        : '';
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      ltTestId: '',
      resultCode: '',
      displyTestId: '',
      effectiveDate: ''
    };

    this.form.reset();
    this.terminationMinDate = this.minDate;
    this.form.markAsUntouched();
    this.form.markAsPristine();

    // Enable all fields in add mode
    this.form.get('ltTestId')?.enable();
    this.form.get('resultCode')?.enable();
    this.form.get('displyTestId')?.enable();
    this.form.get('antibodyFlag')?.enable();
    this.form.get('messageDesc')?.enable();
    this.form.get('effDate')?.enable();

    // Restore required validators for add mode
    this.form.get('ltTestId')?.setValidators([Validators.required]);
    this.form.get('resultCode')?.setValidators([Validators.required]);
    this.form.get('displyTestId')?.setValidators([Validators.required, Validators.maxLength(20)]);
    this.form.get('antibodyFlag')?.setValidators([Validators.required]);
    this.form.get('effDate')?.setValidators([Validators.required]);
    this.form.get('messageDesc')?.setValidators([]); // Not required in add mode

    // Update validity
    this.form.get('ltTestId')?.updateValueAndValidity();
    this.form.get('resultCode')?.updateValueAndValidity();
    this.form.get('displyTestId')?.updateValueAndValidity();
    this.form.get('antibodyFlag')?.updateValueAndValidity();
    this.form.get('effDate')?.updateValueAndValidity();
    this.form.get('messageDesc')?.updateValueAndValidity();

    // Setup add mode date validators
    DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);

    // Clear result code options and reset flags
    this.allResultCodeOptions = [];
    this.resultCodeOptions = [];
    this.noResultCodesAvailable = false;
  }

  private populateFormForEdit(): void {
    if (this.data) {
      const ltTestId = this.data.ltTestId || '';
      const resultCode = this.data.resultCode || '';
      const displyTestId = this.data.displyTestId || '';

      // Display values for read-only cards (PK fields + effective date)
      this.editModeValues = {
        ltTestId,
        resultCode,
        displyTestId,
        effectiveDate: this.data.effDate ? moment.utc(this.data.effDate).format('DD-MMM-YYYY').toUpperCase() : ''
      };

      this.form.patchValue({
        ltTestId,
        resultCode,
        displyTestId,
        antibodyFlag: this.data.antibodyFlag || 'N',
        messageDesc: this.data.messageDesc || '',
        effDate: this.data.effDate ? moment(moment.utc(this.data.effDate).format('YYYY-MM-DD')) : null,
        termDate: this.data.termDate ? moment(moment.utc(this.data.termDate).format('YYYY-MM-DD')) : null
      });

      this.updateTerminationMinDate();

      // Disable PK fields (ltTestId, resultCode, displyTestId) and effective date in edit mode
      this.form.get('ltTestId')?.disable();
      this.form.get('resultCode')?.disable();
      this.form.get('displyTestId')?.disable();
      this.form.get('effDate')?.disable();

      this.form.get('messageDesc')?.setValidators([]);
      this.form.get('messageDesc')?.updateValueAndValidity();

      // Load result codes for the current ltTestId (for display purposes)
      if (ltTestId) {
        this.loadResultCodeLookups(ltTestId);
      }
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
      const addPayload: TestMessageMappingCreateDto = {
        ltTestId: formValue.ltTestId?.trim() || '',
        resultCode: formValue.resultCode?.trim() || '',
        displyTestId: formValue.displyTestId?.trim() || '',
        antibodyFlag: formValue.antibodyFlag || 'N',
        messageDesc: formValue.messageDesc?.trim() || null,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate),
        loggedInUserName: this.loginService.getStoredUsername()
      };
      apiCall = this.mappingService.createRecord(addPayload);
    } else {
      const updatePayload: TestMessageMappingUpdateDto = {
        resultCode: this.editModeValues.resultCode,
        displyTestId: this.editModeValues.displyTestId,
        antibodyFlag: formValue.antibodyFlag || 'N',
        messageDesc: formValue.messageDesc?.trim() || null,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate)
      };
      apiCall = this.mappingService.updateRecord(
        this.editModeValues.ltTestId,
        this.editModeValues.resultCode,
        this.editModeValues.displyTestId,
        updatePayload
      );
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
            ? 'Test message added successfully'
            : 'Test message updated successfully');

          this.snackBar.open(message, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
            duration: 3000
          });

          const result: TestMessageMappingFormData = {
            ltTestId: this.mode === 'add' ? (formValue.ltTestId?.trim() || '') : this.editModeValues.ltTestId,
            resultCode: this.mode === 'add' ? (formValue.resultCode?.trim() || '') : this.editModeValues.resultCode,
            displyTestId: this.mode === 'add' ? (formValue.displyTestId?.trim() || '') : this.editModeValues.displyTestId,
            messageDesc: formValue.messageDesc?.trim() || '',
            effDate: formValue.effDate?.toDate() || new Date(),
            termDate: formValue.termDate?.toDate() || null
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        },
        error: (error) => {
          console.error('Error saving test message:', error);
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
      const addPayload: TestMessageMappingCreateDto = {
        ltTestId: formValue.ltTestId?.trim() || '',
        resultCode: formValue.resultCode?.trim() || '',
        displyTestId: formValue.displyTestId?.trim() || '',
        antibodyFlag: formValue.antibodyFlag || 'N',
        messageDesc: formValue.messageDesc?.trim() || null,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate),
        loggedInUserName: this.loginService.getStoredUsername()
      };
      apiCall = this.mappingService.createRecord(addPayload);
    } else {
      const updatePayload: TestMessageMappingUpdateDto = {
        resultCode: this.editModeValues.resultCode,
        displyTestId: this.editModeValues.displyTestId,
        antibodyFlag: formValue.antibodyFlag || 'N',
        messageDesc: formValue.messageDesc?.trim() || null,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate)
      };
      apiCall = this.mappingService.updateRecord(
        this.editModeValues.ltTestId,
        this.editModeValues.resultCode,
        this.editModeValues.displyTestId,
        updatePayload
      );
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

          const result: TestMessageMappingFormData = {
            ltTestId: this.mode === 'add' ? (formValue.ltTestId?.trim() || '') : this.editModeValues.ltTestId,
            resultCode: this.mode === 'add' ? (formValue.resultCode?.trim() || '') : this.editModeValues.resultCode,
            displyTestId: this.mode === 'add' ? (formValue.displyTestId?.trim() || '') : this.editModeValues.displyTestId,
            messageDesc: formValue.messageDesc?.trim() || '',
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
          console.error('Error saving test message:', error);
          this.snackBar.open(
            error?.error?.message || 'Save failed. Please try again.',
            'DISMISS',
            { horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'], duration: 5000 }
          );
        }
      });
  }

  get ltTestIdControl() {
    return this.form.get('ltTestId');
  }

  get resultCodeControl() {
    return this.form.get('resultCode');
  }

  get displyTestIdControl() {
    return this.form.get('displyTestId');
  }

  get messageDescControl() {
    return this.form.get('messageDesc');
  }

  get effDateControl() {
    return this.form.get('effDate');
  }

  get termDateControl() {
    return this.form.get('termDate');
  }

  getLtTestIdError(): string {
    const control = this.ltTestIdControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'AP Test ID is required';
    return '';
  }

  getResultCodeError(): string {
    const control = this.resultCodeControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Result is required';
    return '';
  }

  getDisplyTestIdError(): string {
    const control = this.displyTestIdControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Label Test ID is required';
    if (control.hasError('maxlength')) return 'Label Test ID must not exceed 20 characters';
    return '';
  }

  getMessageDescError(): string {
    const control = this.messageDescControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Message Type is required';
    return '';
  }

  getEffDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.effDateControl, 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTermDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.termDateControl, 'Termination Date', 'Effective Date', formErrors
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

  private setupTestIdSearch(): void {
    this.testIdSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        if (search && search.length >= 1) {
          this.testIdOptions = this.allTestIdOptions.filter(o =>
            o.display.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.testIdOptions = [...this.allTestIdOptions];
        }
      });
  }

  private setupResultCodeSearch(): void {
    this.resultCodeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        if (search && search.length >= 1) {
          this.resultCodeOptions = this.allResultCodeOptions.filter(o =>
            o.display.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.resultCodeOptions = [...this.allResultCodeOptions];
        }
      });
  }

  private setupMessageTypeSearch(): void {
    this.messageTypeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        if (search && search.length >= 1) {
          this.messageTypeOptions = this.allMessageTypeOptions.filter(o =>
            o.display.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.messageTypeOptions = [...this.allMessageTypeOptions];
        }
      });
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
