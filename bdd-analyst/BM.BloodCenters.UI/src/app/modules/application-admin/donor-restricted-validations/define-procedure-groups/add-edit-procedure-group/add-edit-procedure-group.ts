import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { DefineProcedureGroupsService } from '../services/define-procedure-groups.service';
import { LoginService } from '@shared/services/login.service';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  DefineProcedureGroupsModel,
  DefineProcedureGroupsDto,
  UpdateDefineProcedureGroupsDto,
  ProcedureGroupLookup,
  ProcedureCodeLookup,
  UserContext
} from '../models/define-procedure-groups.model';

export interface ProcedureGroupDialogData {
  mode: 'add' | 'edit';
  data: DefineProcedureGroupsModel | null;
}

/**
 * Custom validator to ensure only whole numbers (integers) are allowed
 */
function wholeNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value && control.value !== 0) {
      return null; // Don't validate empty values (let required validator handle that)
    }
    const value = control.value;
    if (!Number.isInteger(Number(value))) {
      return { wholeNumber: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-add-edit-procedure-group',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMomentDateModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-procedure-group.html',
  styleUrls: ['./add-edit-procedure-group.scss']
})
export class AddEditProcedureGroup implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<AddEditProcedureGroup>);
  private dialogData: ProcedureGroupDialogData = inject(MAT_DIALOG_DATA);

  mode: 'add' | 'edit';
  data: DefineProcedureGroupsModel | null;
  private savedAtLeastOnce = false;

  form: FormGroup;
  panelTitle: string = '';
  lastUpdated: string = '';

  // Minimum date for datepickers - chapter-aware, updates reactively on chapter change
  minDate: Moment;
  terminationMinDate: Moment;

  private readonly headerService = inject(HeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  private updateTerminationMinDate(): void {
    const effectiveValue = this.form?.get('effectiveDate')?.value;
    let effectiveMoment: Moment | null = null;

    if (effectiveValue && moment.isMoment(effectiveValue) && effectiveValue.isValid()) {
      effectiveMoment = effectiveValue.clone();
    } else if (effectiveValue instanceof Date && !isNaN(effectiveValue.getTime())) {
      effectiveMoment = moment(effectiveValue);
    }

    if (effectiveMoment) {
      this.terminationMinDate = effectiveMoment.isAfter(this.minDate) ? effectiveMoment : this.minDate.clone();
    } else {
      this.terminationMinDate = this.minDate;
    }
  }

  // Dropdown options (loaded from cached service)
  procedureGroupOptions: ProcedureGroupLookup[] = [];
  procedureCodeOptions: ProcedureCodeLookup[] = [];

  // Search controls for searchable dropdowns
  procedureGroupSearchControl = new FormControl('');
  procedureCodeSearchControl = new FormControl('');

  // Filtered options for searchable dropdowns
  filteredProcedureGroupOptions: ProcedureGroupLookup[] = [];
  filteredProcedureCodeOptions: ProcedureCodeLookup[] = [];

  // User context (required for add/edit operations)
  userContext: UserContext | null = null;

  editModeValues: {
    procedureGroupCode: string;
    procedureGroupDescription: string;
    donationCredits: string;
    procedureCode: string;
    procedureCodeDescription: string;
    effectiveDate: string;
    terminationDate: string;
  } = {
      procedureGroupCode: '',
      procedureGroupDescription: '',
      donationCredits: '',
      procedureCode: '',
      procedureCodeDescription: '',
      effectiveDate: '',
      terminationDate: ''
    };

  isSaving = false;

  // Temporary error message for donation credits overflow
  showDonationCreditsOverflowError = false;
  private donationCreditsErrorTimeout: ReturnType<typeof setTimeout> | null = null;

  // Track which date field was last changed (for cross-field error display)
  lastChangedDateField: 'effective' | 'termination' | null = null;

  // Custom error state matchers for cross-field date validation
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  // Store original values for edit mode (needed for update API)
  private originalValues: {
    procedureGroupCode: string;
    procedureCode: string;
    effectiveDate: string;
  } = {
      procedureGroupCode: '',
      procedureCode: '',
      effectiveDate: ''
    };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private procedureGroupsService: DefineProcedureGroupsService,
    private loginService: LoginService,
    private snackBar: MatSnackBar
  ) {
    this.mode = this.dialogData.mode;
    this.data = this.dialogData.data;
    this.minDate = this.getChapterMinDate();
    this.terminationMinDate = this.minDate;

    this.form = this.fb.group({
      procedureGroupCode: ['', [Validators.required]],
      procedureGroupDescription: [''], // Auto-populated, no validator needed
      donationCredits: [null, [Validators.required, Validators.min(0), Validators.max(99999), wholeNumberValidator()]],
      procedureCode: ['', [Validators.required]],
      procedureCodeDescription: [''], // Auto-populated, no validator needed
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    // Setup reusable date validators for add mode
    DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);

    // Reactively update date validators and minDate when chapter timezone changes.
    // Note: this.mode is an @Input (not a signal) so it won't re-trigger this effect.
    // Mode changes are handled separately by ngOnChanges → resetFormForAddMode/populateFormForEdit.
    effect(() => {
      const tz = this.headerService.chapterTimeZone();
      this.minDate = this.getChapterMinDate();

      if (this.mode === 'add') {
        DateFieldValidationUtility.setupAddModeValidators(this.form, tz);
      } else {
        DateFieldValidationUtility.setupEditModeValidators(this.form);
      }

      this.updateTerminationMinDate();
      this.form.get('effectiveDate')?.updateValueAndValidity({ emitEvent: false });
      this.form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
    });

    // Track last changed date field for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
        this.cdr.detectChanges();
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });

    // Auto-populate descriptions when code/group is selected
    this.setupAutoPopulateDescriptions();

    // Setup search filters for searchable dropdowns
    this.setupDropdownSearchFilters();
  }

  /**
   * Set up auto-population of description fields when dropdown values change
   */
  private setupAutoPopulateDescriptions(): void {
    // Auto-populate Procedure Group Description when Procedure Group is selected
    this.form.get('procedureGroupCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code) => {
        if (code && this.procedureGroupOptions.length > 0) {
          const selectedGroup = this.procedureGroupOptions.find(g => g.code === code);
          if (selectedGroup) {
            this.form.get('procedureGroupDescription')?.setValue(selectedGroup.description, { emitEvent: false });
          }
        }
      });

    // Auto-populate Procedure Code Description when Procedure Code is selected
    this.form.get('procedureCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code) => {
        if (code && this.procedureCodeOptions.length > 0) {
          const selectedCode = this.procedureCodeOptions.find(c => c.procedureCode === code);
          if (selectedCode) {
            this.form.get('procedureCodeDescription')?.setValue(selectedCode.description, { emitEvent: false });
          }
        }
      });
  }

  /**
   * Set up search filters for searchable dropdowns
   */
  private setupDropdownSearchFilters(): void {
    this.procedureGroupSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredProcedureGroupOptions = this.procedureGroupOptions.filter(option =>
          option.code.toLowerCase().includes(term) ||
          option.description.toLowerCase().includes(term)
        );
      });

    this.procedureCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredProcedureCodeOptions = this.procedureCodeOptions.filter(option =>
          option.procedureCode.toLowerCase().includes(term) ||
          option.description.toLowerCase().includes(term)
        );
      });
  }

  ngOnInit(): void {
    this.setupPanel();
    this.loadLookupData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.donationCreditsErrorTimeout) {
      clearTimeout(this.donationCreditsErrorTimeout);
    }
  }

  /**
   * Load lookup data and user context from service
   * This data is shared with the filter panel and cached for performance
   */
  private loadLookupData(): void {
    const userId = this.loginService.getStoredUsername();

    forkJoin({
      procedureGroups: this.procedureGroupsService.getProcedureGroupsLookup(),
      procedureCodes: this.procedureGroupsService.getProcedureCodesLookup(),
      userContext: userId
        ? this.procedureGroupsService.getUserContext(userId).pipe(catchError(() => of(null)))
        : of(null)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responses) => {
          this.procedureGroupOptions = responses.procedureGroups.data || [];
          this.procedureCodeOptions = responses.procedureCodes.data || [];

          if (this.mode === 'edit' && this.data) {
            const currentGroupCode = this.data.procedureGroup || '';
            const currentGroupDesc = this.data.groupDescription || '';
            if (currentGroupCode && !this.procedureGroupOptions.some(g => g.code === currentGroupCode)) {
              this.procedureGroupOptions = [
                { code: currentGroupCode, description: currentGroupDesc },
                ...this.procedureGroupOptions
              ];
            }

            const currentProcCode = this.data.procedureCode || '';
            const currentProcDesc = this.data.procedureDescription || '';
            if (currentProcCode && !this.procedureCodeOptions.some(c => c.procedureCode === currentProcCode)) {
              this.procedureCodeOptions = [
                { procedureCode: currentProcCode, description: currentProcDesc },
                ...this.procedureCodeOptions
              ];
            }
          }

          this.filteredProcedureGroupOptions = [...this.procedureGroupOptions];
          this.filteredProcedureCodeOptions = [...this.procedureCodeOptions];

          this.userContext = responses.userContext ?? null;
        },
        error: () => {
          this.procedureGroupOptions = [];
          this.filteredProcedureGroupOptions = [];
          this.procedureCodeOptions = [];
          this.filteredProcedureCodeOptions = [];
          this.userContext = null;
        }
      });
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add Procedure Group Mapping';
      this.lastUpdated = '';
    } else {
      this.panelTitle = 'Edit Procedure Group Mapping';
      this.lastUpdated = `Last Updated: ${this.formatDateTime(new Date())}`;
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      procedureGroupCode: '',
      procedureGroupDescription: '',
      donationCredits: '',
      procedureCode: '',
      procedureCodeDescription: '',
      effectiveDate: '',
      terminationDate: ''
    };

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    // Enable Credit Value field in add mode
    this.form.get('donationCredits')?.enable();

    // Setup validators for add mode
    DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
  }

  private populateFormForEdit(): void {
    if (this.data) {
      const procedureGroupCode = this.data.procedureGroup || '';
      const procedureGroupDescription = this.data.groupDescription || '';
      const donationCredits = this.data.eligCreditCount || 0;
      const procedureCode = this.data.procedureCode || '';
      const procedureCodeDescription = this.data.procedureDescription || '';
      const effectiveDate = this.data.effDate ? moment(this.data.effDate).format('YYYY-MM-DD') : '';

      // Store original values for update API (needed for path parameters)
      this.originalValues = {
        procedureGroupCode,
        procedureCode,
        effectiveDate
      };

      this.editModeValues = {
        procedureGroupCode,
        procedureGroupDescription,
        donationCredits: donationCredits.toString(),
        procedureCode,
        procedureCodeDescription,
        effectiveDate: this.data.effDate ? this.formatDateForDisplay(this.data.effDate) : '',
        terminationDate: this.data.termDate ? this.formatDateForDisplay(this.data.termDate) : ''
      };

      // Setup validators for edit mode
      DateFieldValidationUtility.setupEditModeValidators(this.form);

      this.form.patchValue({
        procedureGroupCode,
        procedureGroupDescription,
        donationCredits,
        procedureCode,
        procedureCodeDescription,
        effectiveDate: this.data.effDate ? moment(this.data.effDate) : null,
        terminationDate: this.data.termDate ? moment(this.data.termDate) : null
      });

      // Disable Credit Value field in edit mode (read-only)
      this.form.get('donationCredits')?.disable();

      this.updateTerminationMinDate();
    }
  }

  private formatDateForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY') : '';
  }

  /**
   * Format date for API transmission (YYYY-MM-DD format)
   * Handles both Moment and native Date objects to avoid timezone issues
   */
  private formatDateForAPI(date: Date | Moment | null | undefined): string {
    if (!date) return '';
    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DD');
    }
    if (date instanceof Date) {
      return moment(date).format('YYYY-MM-DD');
    }
    return '';
  }

  onCancel(): void {
    this.dialogRef.close(this.savedAtLeastOnce ? { saved: true } : undefined);
  }

  private executeSave(afterSuccess: () => void): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    if (!this.userContext) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: DefineProcedureGroupsDto = {
        procedureGroup: formValue.procedureGroupCode?.trim() || '',
        procedureCode: formValue.procedureCode?.trim() || '',
        effDate: formValue.effectiveDate ? this.formatDateForAPI(formValue.effectiveDate) : '',
        termDate: formValue.terminationDate ? this.formatDateForAPI(formValue.terminationDate) : null,
        eligCreditCount: formValue.donationCredits || 0,
        chapterId: this.userContext.chapterId,
        programId: this.userContext.programId,
        insertUser: this.userContext.userId
      };
      apiCall = this.procedureGroupsService.addProcedureGroup(addPayload);
    } else {
      const updatePayload: UpdateDefineProcedureGroupsDto = {
        procedureGroup: formValue.procedureGroupCode?.trim() || '',
        procedureCode: formValue.procedureCode?.trim() || '',
        effDate: formValue.effectiveDate ? this.formatDateForAPI(formValue.effectiveDate) : '',
        termDate: formValue.terminationDate ? this.formatDateForAPI(formValue.terminationDate) : null,
        eligCreditCount: formValue.donationCredits || 0,
        programId: this.userContext.programId
      };
      apiCall = this.procedureGroupsService.updateProcedureGroup(
        this.originalValues.procedureGroupCode,
        this.originalValues.procedureCode,
        this.originalValues.effectiveDate,
        updatePayload
      );
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: () => {
          const procedureGroupCode = this.mode === 'add'
            ? formValue.procedureGroupCode?.trim()
            : this.originalValues.procedureGroupCode;

          const message = this.mode === 'add'
            ? `Procedure Group ${procedureGroupCode} has been added successfully.`
            : `Procedure Group ${procedureGroupCode} has been updated successfully.`;

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          this.savedAtLeastOnce = true;
          afterSuccess();
        },
        error: () => {
          // Errors are handled globally by HTTP interceptor
        }
      });
  }

  onSave(): void {
    this.executeSave(() => {
      this.dialogRef.close({ saved: true });
    });
  }

  onSaveAndCreateAnother(): void {
    this.executeSave(() => {
      if (this.mode === 'edit') {
        this.mode = 'add';
        this.data = null;
        this.resetFormForAddMode();
        this.setupPanel();
      } else {
        this.resetFormForAddMode();
      }
    });
  }

  formatDateTime(date: Date | null): string {
    if (!date) return '';
    const momentDate = moment(date);
    const isToday = momentDate.isSame(moment(), 'day');
    const tz = this.chapterOffset || 'UTC';

    if (isToday) {
      return `Today, ${momentDate.format('hh:mm A')} ${tz}`;
    } else {
      return `${momentDate.format('DD-MMM-YYYY, hh:mm A')} ${tz}`;
    }
  }

  get procedureGroupCodeControl() {
    return this.form.get('procedureGroupCode');
  }

  get procedureGroupDescriptionControl() {
    return this.form.get('procedureGroupDescription');
  }

  get donationCreditsControl() {
    return this.form.get('donationCredits');
  }

  get procedureCodeControl() {
    return this.form.get('procedureCode');
  }

  get procedureCodeDescriptionControl() {
    return this.form.get('procedureCodeDescription');
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  getProcedureGroupCodeError(): string {
    const control = this.procedureGroupCodeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Procedure Group is required';
    }
    return '';
  }

  getProcedureGroupDescriptionError(): string {
    // Auto-populated field, no errors
    return '';
  }

  /**
   * Prevent invalid characters (e, E, +, -, .) in number input
   * The 'e' character is used for scientific notation (e.g., 1e5) which we don't want
   */
  preventInvalidNumberInput(event: KeyboardEvent): void {
    const invalidChars = ['e', 'E', '+', '-', '.'];
    if (invalidChars.includes(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Prevent invalid characters from being pasted into number input
   * Filters out e, E, +, -, and . characters from pasted content
   */
  preventInvalidNumberPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    // Remove all invalid characters (e, E, +, -, .)
    const cleanedText = pastedText.replace(/[eE+\-.]/g, '');
    // Only paste if there's valid content left
    if (cleanedText) {
      const input = event.target as HTMLInputElement;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      input.value = input.value.substring(0, start) + cleanedText + input.value.substring(end);
      const newPos = start + cleanedText.length;
      input.setSelectionRange(newPos, newPos);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  onDonationCreditsInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Remove any non-digit characters
    inputValue = inputValue.replace(/[^\d]/g, '');

    // Limit to 5 digits max and show temporary error if exceeded
    if (inputValue.length > 5) {
      inputValue = inputValue.substring(0, 5);
      input.value = inputValue;
      // Update form control value to prevent max validator from triggering
      const truncatedValue = parseInt(inputValue, 10);
      this.form.get('donationCredits')?.setValue(truncatedValue || null, { emitEvent: false });
      this.form.get('donationCredits')?.updateValueAndValidity({ emitEvent: false });
      this.showTemporaryDonationCreditsError();
      return;
    }
  }

  private showTemporaryDonationCreditsError(): void {
    // Clear any existing timeout
    if (this.donationCreditsErrorTimeout) {
      clearTimeout(this.donationCreditsErrorTimeout);
    }

    // Show error by setting custom error on form control
    this.showDonationCreditsOverflowError = true;
    this.form.get('donationCredits')?.setErrors({ overflow: true });
    this.form.get('donationCredits')?.markAsTouched();

    // Hide error after 2 seconds
    this.donationCreditsErrorTimeout = setTimeout(() => {
      this.showDonationCreditsOverflowError = false;
      // Clear the overflow error
      const control = this.form.get('donationCredits');
      if (control?.hasError('overflow')) {
        control.setErrors(null);
        control.updateValueAndValidity({ emitEvent: false });
      }
    }, 2000);
  }

  getDonationCreditsError(): string {
    // Show temporary overflow error first
    if (this.showDonationCreditsOverflowError) {
      return 'Credit Value must be 99999 or less';
    }

    const control = this.donationCreditsControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Credit Value is required';
    }
    if (control.hasError('min')) {
      return 'Credit Value must be 0 or greater';
    }
    if (control.hasError('max')) {
      return 'Credit Value must be 99999 or less';
    }
    if (control.hasError('wholeNumber')) {
      return 'Credit Value must be a whole number';
    }
    return '';
  }

  getProcedureCodeError(): string {
    const control = this.procedureCodeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Procedure Code is required';
    }
    return '';
  }

  getProcedureCodeDescriptionError(): string {
    // Auto-populated field, no errors
    return '';
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

  private hasDateValidationError(): boolean {
    return this.form.hasError('dateRangeInvalid') || false;
  }

  get isFormValid(): boolean {
    // In edit mode, form must be valid AND modified (dirty)
    // In add mode, form just needs to be valid
    if (this.mode === 'edit' && !this.form.dirty) {
      return false;
    }
    return this.form.valid && !this.hasDateValidationError();
  }
}
