import { Component, EventEmitter, Input, OnInit, OnDestroy, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { TemplateLinkService } from '../services/template-link.service';
import {
  TemplateLinkDialogResult,
  CategoryCode,
  CategoryValue,
  TemplateLinkSavePayload,
  TemplateLinkModel
} from '../models/template-link.model';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { requiredTrimmedValidator } from '@shared/validators/input.validators';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

/**
 * AddEditLinkDialog
 * Side panel form for adding or editing template links (embedded under app header, same pattern as territories).
 */
@Component({
  selector: 'app-add-edit-link-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-link-dialog.html',
  styleUrls: ['./add-edit-link-dialog.scss']
})
export class AddEditLinkDialog implements OnInit, OnDestroy, OnChanges {

  /** Max chips shown in the Category Values trigger; remainder as +N */
  readonly maxVisibleChips = 3;

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() templateId = '';
  @Input() link?: TemplateLinkModel;
  @Input() resetFormToken = 0;
  @Input() isSubmitting = false;

  @Output() closePanel = new EventEmitter<void>();
  @Output() save = new EventEmitter<TemplateLinkDialogResult>();

  linkForm!: FormGroup;
  isEditMode = false;
  lastModified: string | null = null;

  categoryCodes: CategoryCode[] = [];
  categoryValues: CategoryValue[] = [];
  /** Filtered lists for ngx-mat-select-search (same pattern as Add Territory) */
  filteredCategoryCodes: CategoryCode[] = [];
  filteredCategoryValues: CategoryValue[] = [];
  categoryCodeSearchControl = new FormControl<string>('');
  categoryValuesSearchControl = new FormControl<string>('');
  selectedCategoryValues: string[] = [];
  private submitActionInProgress: 'save' | 'saveAndCreateAnother' | null = null;

  // Change tracking for edit mode
  private originalLink: TemplateLinkModel | null = null;

  isLoadingCategoryCodes = false;
  isLoadingCategoryValues = false;

  /**
   * Sentinel values for disabled mat-option rows in the panel (loading / empty).
   * Not valid API codes; options are disabled so they never become the control value.
   */
  readonly selectPanelLoadingValue = '__ADD_EDIT_LINK_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__ADD_EDIT_LINK_PANEL_EMPTY__';

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );

  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError()
  );

  /** Chapter-aware filter for Effective Date (add mode); edit mode does not use filter so historical dates stay valid */
  effectiveDateFilterFn: (date: Moment | null) => boolean = () => true;

  /** Termination: not before chapter today and not before Effective Date */
  terminationDateFilter = (date: Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = this.chapterTimezoneService.getChapterLocalDate();

    if (checkDate.isBefore(today)) {
      return false;
    }

    const eff = this.linkForm?.get('effDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private templateLinkService: TemplateLinkService,
    private headerService: HeaderService,
    private snackbarService: SnackbarService,
    private chapterTimezoneService: ChapterTimezoneService
  ) {}

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  get minDate(): Moment {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  ngOnInit(): void {
    this.isEditMode = this.mode === 'edit';
    this.effectiveDateFilterFn = DateFieldValidationUtility.createEffectiveDateFilter(this.chapterOffset);

    this.linkForm = this.createForm();

    this.setupDateValidationListeners();

    this.loadCategoryCodes();

    if (this.isEditMode && this.link) {
      this.populateFormForEdit();
      this.setupEditModeDateValidators();
    } else {
      this.setupAddModeDateValidators();
    }

    this.setupDropdownSearch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetFormToken'] && !changes['resetFormToken'].firstChange && !this.isEditMode) {
      this.resetFormForAddMode();
    }

    if (
      changes['isSubmitting'] &&
      !changes['isSubmitting'].firstChange &&
      !changes['isSubmitting'].currentValue
    ) {
      this.submitActionInProgress = null;
    }

    const modeChanged = changes['mode'] && !changes['mode'].firstChange;
    const linkChanged = changes['link'] && !changes['link'].firstChange;

    if ((modeChanged || linkChanged) && this.linkForm) {
      this.isEditMode = this.mode === 'edit';
      if (this.isEditMode && this.link) {
        this.populateFormForEdit();
        this.setupEditModeDateValidators();
      } else {
        this.resetFormForAddMode();
        this.setupAddModeDateValidators();
      }
    }
  }

  /** Same approach as Create and Maintain Territories → Add Territory (group/type dropdowns). */
  private setupDropdownSearch(): void {
    this.categoryCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredCategoryCodes = this.categoryCodes.filter(
          (c) =>
            c.code.toLowerCase().includes(term) ||
            (c.description ?? '').toLowerCase().includes(term)
        );
      });

    this.categoryValuesSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredCategoryValues = this.categoryValues.filter(
          (v) =>
            v.code.toLowerCase().includes(term) ||
            (v.description ?? '').toLowerCase().includes(term)
        );
      });
  }

  /**
   * Same date rules as Add Territories, with Effective Date required.
   */
  private setupAddModeDateValidators(): void {
    const effCtrl = this.linkForm.get('effDate');
    const termCtrl = this.linkForm.get('termDate');

    if (effCtrl) {
      effCtrl.clearValidators();
      effCtrl.setValidators([
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset)
      ]);
      effCtrl.updateValueAndValidity();
    }

    if (termCtrl) {
      termCtrl.clearValidators();
      termCtrl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
      ]);
      termCtrl.updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group(
      {
        groupId: ['', [requiredTrimmedValidator(), Validators.maxLength(5)]],
        categoryCode: [null, Validators.required],
        categoryValues: [{ value: [], disabled: true }],
        effDate: [null],
        termDate: [null]
      },
      {
        validators: [DateFieldValidationUtility.dateRangeValidator()]
      }
    );
  }

  /**
   * Edit link: both dates stay editable; do not apply “effective not in past” to effDate (historical rows).
   * Mirrors territory edit termination rules + shared date range / format checks.
   */
  private setupEditModeDateValidators(): void {
    const effCtrl = this.linkForm.get('effDate');
    const termCtrl = this.linkForm.get('termDate');

    if (effCtrl) {
      effCtrl.clearValidators();
      effCtrl.setValidators([
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator()
      ]);
      effCtrl.enable();
      effCtrl.updateValueAndValidity();
    }

    if (termCtrl) {
      termCtrl.clearValidators();
      termCtrl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
      ]);
      termCtrl.updateValueAndValidity();
    }
  }

  private populateFormForEdit(): void {
    if (!this.link) return;

    // Store original link for change tracking
    this.originalLink = JSON.parse(JSON.stringify(this.link));

    const link = this.link;
    this.lastModified = link.lastModified || null;

    // Parse category values from comma-separated string
    const categoryValuesArray = link.categoryValues
      ? link.categoryValues.split(',').map(v => v.trim())
      : [];

    this.linkForm.patchValue({
      groupId: link.groupId,
      categoryCode: link.categoryCode,
      categoryValues: categoryValuesArray,
      effDate: link.effDate ? moment(link.effDate).startOf('day') : null,
      termDate: link.termDate ? moment(link.termDate).startOf('day') : null,
    });

    this.selectedCategoryValues = [...categoryValuesArray];

    // Load category values for the selected category code
    if (link.categoryCode) {
      this.linkForm.get('categoryValues')?.enable({ emitEvent: false });
      this.loadCategoryValues(link.categoryCode);
    } else {
      this.linkForm.get('categoryValues')?.disable({ emitEvent: false });
    }

    // Mark form as pristine and untouched after populating
    this.linkForm.markAsPristine();
    this.linkForm.markAsUntouched();
  }

  /**
   * Load category codes dropdown
   */
  loadCategoryCodes(): void {
    this.isLoadingCategoryCodes = true;
    this.categoryCodes = [];
    this.filteredCategoryCodes = [];
    this.templateLinkService.getCategoryCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.categoryCodes = codes ?? [];
          this.filteredCategoryCodes = [...this.categoryCodes];
          this.categoryCodeSearchControl.setValue('', { emitEvent: false });
          this.isLoadingCategoryCodes = false;
        },
        error: () => {
          this.categoryCodes = [];
          this.filteredCategoryCodes = [];
          this.isLoadingCategoryCodes = false;
          this.snackbarService.showError('Failed to load category codes');
        }
      });
  }

  /**
   * Handle category code selection change
   */
  onCategoryCodeChange(categoryCode: string): void {
    const categoryValuesControl = this.linkForm.get('categoryValues');

    // Clear selected category values when category code changes
    this.linkForm.patchValue({
      categoryValues: []
    });
    this.selectedCategoryValues = [];
    this.categoryValuesSearchControl.setValue('', { emitEvent: false });

    if (categoryCode) {
      categoryValuesControl?.enable({ emitEvent: false });
      this.loadCategoryValues(categoryCode);
    } else {
      categoryValuesControl?.disable({ emitEvent: false });
      this.categoryValues = [];
      this.filteredCategoryValues = [];
    }
  }

  /**
   * Load category values for selected category code
   */
  loadCategoryValues(categoryCode: string): void {
    this.isLoadingCategoryValues = true;
    this.categoryValues = [];
    this.filteredCategoryValues = [];
    this.templateLinkService.getCategoryValues(categoryCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (values) => {
          this.categoryValues = values ?? [];
          this.filteredCategoryValues = [...this.categoryValues];
          this.categoryValuesSearchControl.setValue('', { emitEvent: false });
          this.isLoadingCategoryValues = false;
        },
        error: () => {
          this.categoryValues = [];
          this.filteredCategoryValues = [];
          this.isLoadingCategoryValues = false;
          this.snackbarService.showError('Failed to load category values');
        }
      });
  }

  /**
   * Handle category values selection change
   */
  onCategoryValuesChange(values: string[]): void {
    this.selectedCategoryValues = values;
  }

  /**
   * Remove a category value chip
   */
  removeCategoryValue(value: string, event?: Event): void {
    // Prevent the click from opening/closing the dropdown
    if (event) {
      event.stopPropagation();
    }

    const currentValues = this.linkForm.get('categoryValues')?.value || [];
    const updatedValues = currentValues.filter((v: string) => v !== value);
    this.linkForm.patchValue({
      categoryValues: updatedValues
    });
    this.selectedCategoryValues = updatedValues;
    this.linkForm.get('categoryValues')?.markAsTouched();
  }

  /** Chips shown in the select trigger (first N selections) */
  get displayedCategoryChips(): string[] {
    return this.selectedCategoryValues.slice(0, this.maxVisibleChips);
  }

  /** Count beyond visible chips, shown as +N */
  get overflowCategoryCount(): number {
    const n = this.selectedCategoryValues.length;
    return n > this.maxVisibleChips ? n - this.maxVisibleChips : 0;
  }

  /**
   * Handle save action
   */
  onSave(): void {
    if (this.linkForm.invalid) {
      this.linkForm.markAllAsTouched();
      return;
    }
    this.submitActionInProgress = 'save';

    const result: TemplateLinkDialogResult = {
      action: 'save',
      mode: this.isEditMode ? 'edit' : 'add',
      data: this.buildDto()
    };

    this.save.emit(result);
  }

  onSaveAndCreateAnother(): void {
    if (this.linkForm.invalid) {
      this.linkForm.markAllAsTouched();
      return;
    }
    this.submitActionInProgress = 'saveAndCreateAnother';

    const result: TemplateLinkDialogResult = {
      action: 'saveAndCreateAnother',
      mode: 'add',
      data: this.buildDto()
    };

    this.save.emit(result);
  }

  /**
   * Handle cancel action
   */
  onCancel(): void {
    this.closePanel.emit();
  }

  private resetFormForAddMode(): void {
    this.linkForm.reset({
      groupId: '',
      categoryCode: null,
      categoryValues: [],
      effDate: null,
      termDate: null
    });
    this.selectedCategoryValues = [];
    this.categoryValues = [];
    this.filteredCategoryValues = [];
    this.linkForm.get('categoryValues')?.disable({ emitEvent: false });
    this.categoryCodeSearchControl.setValue('', { emitEvent: false });
    this.categoryValuesSearchControl.setValue('', { emitEvent: false });
    this.linkForm.markAsPristine();
    this.linkForm.markAsUntouched();
  }

  /**
   * Build API body - only business data (chapterId / templateId are on the URL).
   * Metadata fields are set by BE controller from headers.
   *
   * For ADD mode:
   * - surveyGroupId/surveyCategoryCode = form values
   * - newSurveyGroupId/newSurveyCategoryCode = same as above (or can be omitted)
   *
   * For UPDATE mode:
   * - surveyGroupId/surveyCategoryCode = ORIGINAL values from this.link (WHERE clause)
   * - newSurveyGroupId/newSurveyCategoryCode = CURRENT form values (SET clause)
   */
  private buildDto(): TemplateLinkSavePayload {
    const formValue = this.linkForm.getRawValue();
    const currentGroupId = (formValue.groupId ?? '').toString().trim();
    const currentCategoryCode = formValue.categoryCode;

    if (this.isEditMode && this.link) {
      // EDIT mode: old values from original link, new values from form
      return {
        surveyGroupId: this.link.groupId,           // Original (WHERE)
        surveyCategoryCode: this.link.categoryCode, // Original (WHERE)
        newSurveyGroupId: currentGroupId,           // New (SET)
        newSurveyCategoryCode: currentCategoryCode, // New (SET)
        surveyCategoryValues: this.templateLinkService.categoryValuesToString(formValue.categoryValues),
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate),
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate)
      };
    } else {
      // ADD mode: use form values
      return {
        surveyGroupId: currentGroupId,
        surveyCategoryCode: currentCategoryCode,
        newSurveyGroupId: currentGroupId,
        newSurveyCategoryCode: currentCategoryCode,
        surveyCategoryValues: this.templateLinkService.categoryValuesToString(formValue.categoryValues),
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate),
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate)
      };
    }
  }

  /**
   * Get dialog title
   */
  get dialogTitle(): string {
    return this.isEditMode ? 'Edit Link' : 'Add New Link';
  }

  private setupDateValidationListeners(): void {
    this.linkForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.linkForm.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });
    this.linkForm.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.linkForm.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.linkForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.linkForm.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.linkForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.linkForm.get('termDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.linkForm.get('effDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.linkForm.get('termDate'), this.isEditMode
    );
  }

  /**
   * Check if form field has error
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.linkForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }

  /**
   * Get last modified display text
   */
  get lastModifiedText(): string {
    if (!this.lastModified) return '';
    const m = moment(this.lastModified);
    const time = m.format('HH:mm');
    if (m.isSame(moment(), 'day')) {
      return `Last Modified: Today, ${time}`;
    }
    return `Last Modified: ${m.format('ddd, MMM D, YYYY')}, ${time}`;
  }

  get isCategoryValueDisabled(): boolean {
    return !this.linkForm.get('categoryCode')?.value;
  }

  get isPrimaryButtonSubmitting(): boolean {
    return this.isSubmitting && this.submitActionInProgress === 'save';
  }

  get isAddAnotherButtonSubmitting(): boolean {
    return this.isSubmitting && this.submitActionInProgress === 'saveAndCreateAnother';
  }

  /**
   * Check if SAVE button should be enabled
   * - In ADD mode: form must be valid
   * - In EDIT mode: form must be valid AND at least one field must have changed
   */
  get canSave(): boolean {
    // Disable save button while save operation is in progress
    if (this.isSubmitting) return false;

    // Form must be valid
    if (this.linkForm.invalid) return false;

    // In ADD mode: just check if form is valid
    if (!this.isEditMode) return true;

    // In EDIT mode: form must be valid AND changes must have been made
    return this.hasLinkChanged();
  }

  /**
   * Get formatted effective date for edit mode display (uppercase month)
   */
  get formattedEffDateForEdit(): string {
    const effDate = this.linkForm.get('effDate')?.value;
    if (!effDate) return '';
    return this.templateLinkService.formatDate(effDate);
  }

  /**
   * Get formatted termination date for edit mode display (uppercase month)
   */
  get formattedTermDateForEdit(): string {
    const termDate = this.linkForm.get('termDate')?.value;
    if (!termDate) return '';
    return this.templateLinkService.formatDate(termDate);
  }

  /**
   * Restrict group ID input: remove spaces as user types
   * Same pattern as QA Library Question Code field
   */
  onGroupIdInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const originalValue = input.value;
    const sanitizedValue = originalValue.replace(/\s/g, '');

    if (originalValue !== sanitizedValue) {
      this.linkForm.patchValue({ groupId: sanitizedValue }, { emitEvent: false });
      input.value = sanitizedValue;
    }
  }

  /**
   * Compare two dates for equality (handles moment and Date objects)
   */
  private areDatesEqual(date1: any, date2: any): boolean {
    // Both null/undefined/empty - equal
    if (!date1 && !date2) return true;

    // One is null/undefined/empty, other is not - not equal
    if (!date1 || !date2) return false;

    // Parse both dates and compare
    const m1 = moment(date1);
    const m2 = moment(date2);

    // If either date is invalid after parsing, they're not equal
    if (!m1.isValid() || !m2.isValid()) return false;

    // Compare formatted dates
    return m1.format('YYYY-MM-DD') === m2.format('YYYY-MM-DD');
  }

  /**
   * Check if link fields have changed (for EDIT mode)
   * Compares current form values with original link values
   */
  private hasLinkChanged(): boolean {
    if (!this.originalLink) return false;

    const current = this.linkForm.getRawValue();

    // Compare group ID
    if (current.groupId !== this.originalLink.groupId) return true;

    // Compare category code
    if (current.categoryCode !== this.originalLink.categoryCode) return true;

    // Compare category values (convert to sorted string for comparison)
    const currentValues = (current.categoryValues || []).sort().join(',');
    const originalValues = this.originalLink.categoryValues
      ? this.originalLink.categoryValues.split(',').map(v => v.trim()).sort().join(',')
      : '';
    if (currentValues !== originalValues) return true;

    // Compare effective date
    if (!this.areDatesEqual(current.effDate, this.originalLink.effDate)) return true;

    // Compare termination date
    if (!this.areDatesEqual(current.termDate, this.originalLink.termDate)) return true;

    return false;
  }
}

