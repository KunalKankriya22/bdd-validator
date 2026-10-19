import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { A11yModule } from '@angular/cdk/a11y';
import { GroupSitesService } from '../services/group-sites.service';
import moment from 'moment';
import { Subject, takeUntil, finalize, distinctUntilChanged } from 'rxjs';
import {
  GroupSitesModel,
  GroupSitesDto,
  UpdateGroupSitesDto,
  ChapterLookup
} from '../models/group-sites.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { noWhitespaceOnlyValidator, codeFieldValidator } from '@shared/validators/input.validators';

export interface GroupSitesFormData {
  chapterId: string;
  type: string;
  code: string;
  name: string;
  outOfState: boolean;
  effectiveDate: string;
  terminationDate?: string | null;
}

@Component({
  selector: 'app-add-edit-group-sites',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
    A11yModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-group-sites.html',
  styleUrls: ['./add-edit-group-sites.scss']
})
export class AddEditGroupSites implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: GroupSitesModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<GroupSitesFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form: FormGroup;
  panelTitle: string = '';

  editModeValues: {
    chapterId: string;
    code: string;
    effectiveDate: string;
    terminationDate: string | null;
  } = {
    chapterId: '',
    code: '',
    effectiveDate: '',
    terminationDate: null
  };

  // Gap 3: preserves the original OSOK_FLAG value (including null) from the loaded record
  private originalOsokFlag: string | null | undefined = undefined;

  chapterIdOptions: ChapterLookup[] = [];
  typeOptions: string[] = ['Group', 'Site'];
  minDate = DateFieldValidationUtility.getMinDate();
  minTermDate = DateFieldValidationUtility.getMinDate();
  chapterToday = DateFieldValidationUtility.getMinDate(); // Current chapter date for calendar display
  selectedChapterTimezone: string | undefined;

  // Search control for chapter ID dropdown (using ngx-mat-select-search)
  readonly chapterIdSearchControl = new FormControl('');

  // All chapter options loaded from API
  private allChapterIds = signal<ChapterLookup[]>([]);

  // Search term signal
  private chapterIdSearch = signal('');

  // Filtered options based on search
  readonly filteredChapterIds = computed(() => {
    const search = this.chapterIdSearch().toLowerCase();
    const options = this.allChapterIds();
    if (!search) return options;
    return options.filter(chapter =>
      chapter.chapterId.toLowerCase().includes(search) ||
      chapter.chapterName.toLowerCase().includes(search)
    );
  });

  // Track which date field was changed last for smart error placement
  private lastChangedDateField: 'effectiveDate' | 'terminationDate' | null = null;

  // Error state matchers for showing form-level cross-field validation errors
  effectiveDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      const touchedOrDirty = control.touched || control.dirty;

      // If there's a cross-field date range error, only show error on the last changed field
      if (this.form?.errors?.['dateRangeInvalid']) {
        return touchedOrDirty && this.lastChangedDateField === 'effectiveDate';
      }

      // Otherwise, show normal field-level errors
      return control.invalid && touchedOrDirty;
    }
  };

  terminationDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      const touchedOrDirty = control.touched || control.dirty;

      // If there's a cross-field date range error, only show error on the last changed field
      if (this.form?.errors?.['dateRangeInvalid']) {
        return touchedOrDirty && this.lastChangedDateField === 'terminationDate';
      }

      // Otherwise, show normal field-level errors
      return control.invalid && touchedOrDirty;
    }
  };

  /**
   * Date filter for termination date picker.
   * In edit mode: allows original past termination date but disables past dates for new selections.
   * In add mode: disables all past dates.
   */
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const chapterToday = DateFieldValidationUtility.getMinDate(this.selectedChapterTimezone).startOf('day');

    // In edit mode: allow the original termination date even if it's in the past
    if (this.mode === 'edit' && this.editModeValues.terminationDate) {
      const originalTermDate = moment(this.editModeValues.terminationDate).startOf('day');
      // If this is the original date, allow it
      if (checkDate.isSame(originalTermDate)) {
        return true;
      }
    }

    // For new selections: must be >= today
    if (checkDate.isBefore(chapterToday)) {
      return false;
    }

    // Must be >= effective date if set
    const effectiveDate = this.form?.get('effectiveDate')?.value;
    if (effectiveDate) {
      const effDay = moment(effectiveDate).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  isLoadingOptions = false;
  isSaving = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private groupSitesService: GroupSitesService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      chapterId: ['', [Validators.required]],
      type: ['', [Validators.required]],
      code: ['', [Validators.required, Validators.maxLength(7), noWhitespaceOnlyValidator(), codeFieldValidator()]],
      name: ['', [Validators.required, Validators.maxLength(50), noWhitespaceOnlyValidator()]],
      outOfState: [false],
      effectiveDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]],
      terminationDate: [null]
    }, { validators: [DateFieldValidationUtility.dateRangeValidator()] });
  }

  ngOnInit(): void {
    this.setupPanel();
    this.loadChapterIds();

    // Subscribe to search control changes
    this.chapterIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.chapterIdSearch.set(value || '');
      });
  }

  private loadChapterIds(): void {
    this.isLoadingOptions = true;

    // Use getActiveChapterIds to only show currently active chapters
    // A chapter is active if:
    // - effectiveDate <= today (started on or before today)
    // - terminationDate is null OR > today (not yet terminated)
    this.groupSitesService.getActiveChapterIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.chapterIdOptions = response || [];
          this.allChapterIds.set(response || []); // Update signal for search filtering
          this.isLoadingOptions = false;
        },
        error: (error) => {
          console.error('Error loading active chapter IDs:', error);
          this.allChapterIds.set([]); // Clear signal on error
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
      this.panelTitle = 'Add New Record';
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.selectedChapterTimezone);

      // Setup date field tracking for cross-field validation error display
      this.setupDateFieldTracking();

      // Keep minTermDate = max(effDate, utcToday) for datepicker
      this.form.get('effectiveDate')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(value => {
          const utcToday = DateFieldValidationUtility.getMinDate(this.selectedChapterTimezone);
          if (value && moment.isMoment(value) && value.isValid()) {
            this.minTermDate = value.isAfter(utcToday) ? value.clone() : utcToday;
          } else {
            this.minTermDate = utcToday;
          }
          const termControl = this.form.get('terminationDate');
          termControl?.updateValueAndValidity();
          // Trigger form-level validation for cross-field date range check
          this.form.updateValueAndValidity();
        });

      // Watch for chapter selection to update timezone
      this.form.get('chapterId')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(chapterId => {
          this.onChapterChange(chapterId);
        });
    } else {
      this.panelTitle = 'Edit Record';
      this.populateFormForEdit();
    }
  }

  /**
   * Track which date field was last changed for cross-field error display.
   * Uses distinctUntilChanged to filter spurious valueChanges emissions
   * and setTimeout to defer lastChangedDateField assignment to prevent race conditions.
   */
  private setupDateFieldTracking(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          // Only emit if date value actually changed (compare by YYYY-MM-DD format)
          if (!prev && !curr) return true;  // Both null/undefined - no change
          if (!prev || !curr) return false;  // One is null - changed
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Defer assignment to prevent race conditions with validation
        setTimeout(() => {
          this.lastChangedDateField = 'effectiveDate';
        }, 0);
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        setTimeout(() => {
          this.lastChangedDateField = 'terminationDate';
        }, 0);
      });
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      chapterId: '',
      code: '',
      effectiveDate: '',
      terminationDate: null
    };

    this.originalOsokFlag = undefined;
    this.lastChangedDateField = null;
    this.form.reset();
    this.form.patchValue({ outOfState: false });
    this.form.markAsUntouched();
    this.form.markAsPristine();

    this.form.get('chapterId')?.enable();
    this.form.get('code')?.enable();

    this.form.get('chapterId')?.setValidators([Validators.required]);
    this.form.get('code')?.setValidators([Validators.required, Validators.maxLength(7), noWhitespaceOnlyValidator(), codeFieldValidator()]);
    this.form.get('type')?.setValidators([Validators.required]);
    this.form.get('name')?.setValidators([Validators.required, Validators.maxLength(50), noWhitespaceOnlyValidator()]);

    // Use shared utility to setup date field validators for Add mode
    DateFieldValidationUtility.setupAddModeValidators(this.form, this.selectedChapterTimezone);

    this.form.get('chapterId')?.updateValueAndValidity();
    this.form.get('code')?.updateValueAndValidity();
    this.form.get('type')?.updateValueAndValidity();
    this.form.get('name')?.updateValueAndValidity();
  }

  private populateFormForEdit(): void {
    if (this.data) {
      // Map API fields to UI fields
      const code = this.data.groupSiteId || this.data.code || '';
      const type = this.mapGroupSiteIndToType(this.data.groupSiteInd || this.data.type || '');
      const name = this.data.siteName || this.data.name || '';
      const effectiveDate = this.data.effectiveDate;

      // Gap 3: preserve original OSOK_FLAG (null stays null, not coerced to 'N')
      this.originalOsokFlag = this.data.osokFlag;
      const outOfState = this.data.osokFlag === 'Y'; // null and 'N' both show as OFF

      const effMoment = effectiveDate ? moment(effectiveDate) : null;

      this.lastChangedDateField = null;
      this.editModeValues = {
        chapterId: this.data.chapterId || '',
        code: code,
        effectiveDate: effectiveDate ? this.formatDateForDisplay(effectiveDate) : '',
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate).format('YYYY-MM-DD') : null
      };

      this.form.get('chapterId')?.disable();
      this.form.get('code')?.disable();

      this.form.get('chapterId')?.clearValidators();
      this.form.get('code')?.clearValidators();

      this.form.get('chapterId')?.updateValueAndValidity();
      this.form.get('code')?.updateValueAndValidity();

      this.form.patchValue({
        chapterId: this.data.chapterId,
        type: type,
        code: code,
        name: name,
        outOfState: outOfState,
        effectiveDate: effMoment,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
      });

      // Set minTermDate for edit mode: allow existing past termination date
      if (this.data?.effectiveDate) {
        const eff = moment(this.data.effectiveDate);
        if (this.data.terminationDate) {
          const existingTermDate = moment(this.data.terminationDate);
          this.minTermDate = existingTermDate.isBefore(eff) ? existingTermDate : eff;
        } else {
          this.minTermDate = eff;
        }
      }

      // Set chapterToday for calendar display
      this.chapterToday = DateFieldValidationUtility.getMinDate(this.selectedChapterTimezone);

      // Gap 2: Effective Date is always editable in edit mode.
      // Legacy rules: required (5002), not-in-past (8044/5003), not-after-term-date (8045/5004).
      // The not-in-past validator uses a dirty check so it only fires AFTER the user changes
      // the field — existing past dates load without error and Save is enabled immediately.
      this.form.get('effectiveDate')?.enable();
      this.form.get('effectiveDate')?.setValidators([
        Validators.required,
        this.effectiveDateDirtyValidator()
      ]);
      this.form.get('effectiveDate')?.updateValueAndValidity();
      this.minDate = DateFieldValidationUtility.getMinDate(this.selectedChapterTimezone);

      // Setup terminationDate validators for edit mode only (dateFormat + validDate)
      const terminationDateControl = this.form.get('terminationDate');
      if (terminationDateControl) {
        terminationDateControl.clearValidators();
        terminationDateControl.setValidators([
          DateFieldValidationUtility.validDateValidator()
        ]);
        terminationDateControl.updateValueAndValidity();
      }
      // cross-field (eff_date <= term_date) is covered by dateRangeValidator() on the form group

      // Setup date field tracking for cross-field validation error display
      this.setupDateFieldTracking();

      this.form.markAsPristine();
      this.form.markAsUntouched();
    }
  }

  /**
   * Map API groupSiteInd (G/S) to UI-friendly display (Group/Site)
   */
  private mapGroupSiteIndToType(groupSiteInd: string): string {
    if (groupSiteInd === 'G') return 'Group';
    if (groupSiteInd === 'S') return 'Site';
    return groupSiteInd; // Return as-is if already in UI format
  }

  /**
   * Effective date validator for edit mode.
   * The not-in-past check only activates AFTER the user changes the field (dirty).
   * This allows existing records with past dates to load without errors — Save is
   * enabled as soon as the form is dirty. Error only appears if the user picks a past date.
   */
  private effectiveDateDirtyValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.dirty) return null;
      const pastValidator = DateFieldValidationUtility.effectiveDateNotPastValidator(this.selectedChapterTimezone);
      return pastValidator(control);
    };
  }

  /**
   * Map UI type (Group/Site) to API groupSiteInd (G/S)
   */
  private mapTypeToGroupSiteInd(type: string): string {
    if (type === 'Group') return 'G';
    if (type === 'Site') return 'S';
    return type; // Return as-is if already in API format
  }

  private formatDateForDisplay(date: string | Date | null | undefined): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY') : '';
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      // If there's a date range error and no field has been marked as last changed,
      // default to showing the error on termination date
      if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
        this.lastChangedDateField = 'terminationDate';
      }
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: GroupSitesDto = {
        chapterId: formValue.chapterId?.trim() || '',
        groupSiteInd: this.mapTypeToGroupSiteInd(formValue.type || ''),
        groupSiteId: formValue.code?.trim()?.toUpperCase() || '',
        siteName: formValue.name?.trim() || '',
        osokFlag: formValue.outOfState ? 'Y' : 'N',
        effectiveDate: formValue.effectiveDate ? moment(formValue.effectiveDate).format('YYYY-MM-DD') : null,
        terminationDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DD') : null
      };
      apiCall = this.groupSitesService.addGroupSite(addPayload);
    } else {
      // Gap 3: preserve original null OSOK_FLAG — only send Y/N if the toggle was explicitly changed
      const osokFlagControl = this.form.get('outOfState');
      const osokFlag = osokFlagControl?.dirty
        ? (formValue.outOfState ? 'Y' : 'N')
        : (this.originalOsokFlag ?? null);

      const updatePayload: UpdateGroupSitesDto = {
        currentChapterId: this.editModeValues.chapterId,
        currentGroupSiteId: this.editModeValues.code,
        groupSiteInd: this.mapTypeToGroupSiteInd(formValue.type || ''),
        siteName: formValue.name?.trim() || '',
        osokFlag: osokFlag ?? undefined,
        effectiveDate: formValue.effectiveDate ? moment(formValue.effectiveDate).format('YYYY-MM-DD') : null,
        terminationDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DD') : null
      };
      apiCall = this.groupSitesService.updateGroupSite(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || (this.mode === 'add'
            ? 'Record added successfully'
            : 'Record updated successfully');

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: GroupSitesFormData = {
            chapterId: formValue.chapterId?.trim() || this.editModeValues.chapterId,
            type: formValue.type || '',
            code: formValue.code?.trim() || this.editModeValues.code,
            name: formValue.name?.trim() || '',
            outOfState: formValue.outOfState || false,
            effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
            terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        },
        // Gap 1: show error message when save fails
        error: (error: any) => {
          const message = error?.error?.message || 'An error occurred. Please try again.';
          this.snackBar.open(message, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  get chapterIdControl() {
    return this.form.get('chapterId');
  }

  get typeControl() {
    return this.form.get('type');
  }

  get codeControl() {
    return this.form.get('code');
  }

  get nameControl() {
    return this.form.get('name');
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  getChapterIdError(): string {
    const control = this.chapterIdControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Chapter ID is required';
    }
    return '';
  }

  getTypeError(): string {
    const control = this.typeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Type is required';
    }
    return '';
  }

  getCodeError(): string {
    const control = this.codeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Code is required';
    }
    if (control.hasError('whitespaceOnly')) {
      return 'Code cannot contain only spaces';
    }
    if (control.hasError('noAlphanumeric')) {
      return 'Code must contain at least one letter or number';
    }
    if (control.hasError('maxlength')) {
      return 'Code must not exceed 7 characters';
    }
    return '';
  }

  getNameError(): string {
    const control = this.nameControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Name is required';
    }
    if (control.hasError('whitespaceOnly')) {
      return 'Name cannot contain only spaces';
    }
    if (control.hasError('maxlength')) {
      return 'Name must not exceed 50 characters';
    }
    return '';
  }

  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) {
      return '';
    }

    // Check matDatepickerParse first
    if (control.hasError('matDatepickerParse')) {
      return 'Effective date is invalid';
    }

    if (control.hasError('required')) {
      return 'Effective Date is required';
    }

    if (control.hasError('invalidDateFormat')) {
      return 'Effective date is invalid';
    }

    if (control.hasError('invalidDate')) {
      return 'Effective date is invalid';
    }

    if (control.hasError('effectiveDatePast')) {
      return 'Effective date cannot be past date';
    }

    // Show date range error ONLY if effective date was changed last
    const formErrors = this.lastChangedDateField === 'effectiveDate' ? this.form.errors : null;
    if (formErrors?.['dateRangeInvalid']) {
      return 'Effective Date must be less than or equal to Termination Date';
    }

    return '';
  }

  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) {
      return '';
    }

    if (control.hasError('invalidDateFormat')) {
      return 'Termination date is invalid';
    }

    if (control.hasError('invalidDate')) {
      return 'Termination date is invalid';
    }

    if (control.hasError('matDatepickerParse')) {
      return 'Termination date is invalid';
    }

    if (control.hasError('terminationDatePast')) {
      return 'Termination date cannot be past date';
    }

    // Skip matDatepickerMin error when there's a cross-field error on the OTHER field
    // This prevents showing field-level errors when effective date was last changed
    if (this.form.errors?.['dateRangeInvalid'] && this.lastChangedDateField !== 'terminationDate') {
      return '';
    }

    if (control.hasError('matDatepickerMin')) {
      return 'Termination Date must be greater than or equal to Effective Date';
    }

    // Show date range error ONLY if termination date was changed last
    if (this.form.errors?.['dateRangeInvalid'] && this.lastChangedDateField === 'terminationDate') {
      return 'Termination Date must be greater than or equal to Effective Date';
    }

    return '';
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit') {
      return this.form.valid && this.form.dirty;
    }
    return this.form.valid;
  }

  preventLeadingSpace(event: KeyboardEvent, controlName: string): void {
    if (event.key === ' ' && !this.form.get(controlName)?.value?.trim()) {
      event.preventDefault();
    }
  }

  /**
   * Handle effective date input event for proper validation when user types/clears the field.
   * This ensures that clearing an invalid date properly resets validation state.
   */
  onEffectiveDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    this.lastChangedDateField = 'effectiveDate';
    DateFieldValidationUtility.handleStartDateInput(
      inputValue,
      this.form.get('effectiveDate')
    );
    this.form.updateValueAndValidity();
  }

  /**
   * Handle termination date input event for proper validation when user types/clears the field.
   * This ensures that clearing an invalid date properly resets validation state.
   */
  onTerminationDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    this.lastChangedDateField = 'terminationDate';
    const isEditMode = this.mode === 'edit';
    DateFieldValidationUtility.handleEndDateInput(
      inputValue,
      this.form.get('terminationDate'),
      isEditMode
    );
    this.form.updateValueAndValidity();
  }

  /**
   * Handle effective date change from datepicker calendar selection.
   * Marks the changed field as touched and tracks it for smart error display.
   */
  onEffectiveDateChange(): void {
    this.form.get('effectiveDate')?.markAsTouched();
    this.form.get('effectiveDate')?.markAsDirty();
    // Trigger form-level validation for cross-field date range check
    this.form.updateValueAndValidity();
  }

  /**
   * Handle termination date change from datepicker calendar selection.
   * Marks the changed field as touched and tracks it for smart error display.
   */
  onTerminationDateChange(): void {
    this.form.get('terminationDate')?.markAsTouched();
    this.form.get('terminationDate')?.markAsDirty();
    // Trigger form-level validation for cross-field date range check
    this.form.updateValueAndValidity();
  }

  /**
   * Handle chapter selection change to update timezone-based date validation.
   * When a chapter is selected, we need to adjust minDate based on that chapter's timezone.
   */
  onChapterChange(chapterId: string): void {
    if (!chapterId) {
      this.selectedChapterTimezone = undefined;
      this.minDate = DateFieldValidationUtility.getMinDate();
      this.minTermDate = DateFieldValidationUtility.getMinDate();
      this.chapterToday = DateFieldValidationUtility.getMinDate();
      return;
    }

    // Find selected chapter to get timezone info
    const selectedChapter = this.chapterIdOptions.find(ch => ch.chapterId === chapterId);

    if (selectedChapter) {
      // Note: ChapterLookup model may need to be extended to include timezone information
      // For now, we use the default timezone handling in DateFieldValidationUtility
      // which falls back to ChapterTimezoneService if available

      // Update minDate based on chapter timezone
      this.minDate = DateFieldValidationUtility.getMinDate(this.selectedChapterTimezone);
      this.minTermDate = DateFieldValidationUtility.getMinDate(this.selectedChapterTimezone);
      this.chapterToday = DateFieldValidationUtility.getMinDate(this.selectedChapterTimezone);

      // Re-setup validators with new chapter timezone
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.selectedChapterTimezone);
    }
  }
}
