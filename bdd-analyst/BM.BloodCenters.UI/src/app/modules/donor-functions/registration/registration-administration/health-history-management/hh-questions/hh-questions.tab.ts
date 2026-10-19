import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import moment, { Moment } from 'moment';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';

import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { HealthHistoryService } from '../services/health-history.service';
import { HHQuestionModel, HHQuestionFilterValue, HHQuestionSearchParams, GenderDropdownOption } from '../models/health-history.model';
import { HHQuestionsFilterPanel } from './hh-questions-filter-panel/hh-questions-filter-panel';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-hh-questions-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatTooltipModule,
    SearchBar
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './hh-questions.tab.html',
  styleUrls: ['./hh-questions.tab.scss']
})
export class HHQuestionsTab implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('sidebarCard', { read: ElementRef }) sidebarCard!: ElementRef<HTMLElement>;

  private destroy$ = new Subject<void>();
  private hhService = inject(HealthHistoryService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private headerService = inject(HeaderService);
  private overlay = inject(Overlay);
  private overlayRef: OverlayRef | null = null;

  questions = signal<HHQuestionModel[]>([]);
  totalRecords = 0;
  emptyMessage = 'No questions found';
  selectedQuestion: HHQuestionModel | null = null;
  searchText = '';
  isFilterOpen = false;
  appliedFilters: HHQuestionFilterValue | null = null;
  filterChips: FilterChip[] = [];
  isAddMode = false;
  isSaving = false;
  savingAction: 'save' | 'createAnother' | null = null;

  questionForm!: FormGroup;
  chapterTimezone = '';
  minDate = moment();

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by question code or question',
    minLength: 1,
    ariaLabel: 'Search health history questions',
    searchOnEnterOnly: true
  };

  sexOptions: GenderDropdownOption[] = [];
  readMoreFlagOptions: GenderDropdownOption[] = [
    { code: 'Y', description: 'Yes' },
    { code: 'N', description: 'No' }
  ];
  manualAuditFlagOptions: GenderDropdownOption[] = [
    { code: 'N', description: 'No' },
    { code: 'Y', description: 'Yes' }
  ];
  validateLookBackOptions: GenderDropdownOption[] = [
    { code: 'Y', description: 'Yes' },
    { code: 'N', description: 'No' }
  ];
  periodTypeOptions: GenderDropdownOption[] = [];

  lastChangedDateField: 'effective' | 'termination' = 'effective';

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTermDateError());

  refCodeErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      return (control.dirty || control.touched) && control.invalid;
    }
  };

  static refCodeValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value || value.length < 2) return null;
    if (!/^\d{2}/.test(value)) {
      return { refCodePrefix: true };
    }
    return null;
  }

  static lookBackPeriodValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const validateFlag = control.get('validateLookBackDate')?.value;
      const periodType = control.get('periodTypeForLookBack')?.value;
      const periodNumber = control.get('periodNumberForLookBack')?.value;

      if (validateFlag === 'Y' && (!periodType || !periodNumber)) {
        return { lookBackPeriodRequired: true };
      }
      return null;
    };
  }

  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  get termMinDate(): Moment {
    const effDate = this.questionForm?.get('effectiveDate')?.value;
    if (effDate && moment.isMoment(effDate) && effDate.isValid()) {
      return effDate.isAfter(this.minDate) ? effDate : this.minDate;
    }
    return this.minDate;
  }

  constructor() {
    this.minDate = this.getChapterMinDate();

    effect(() => {
      this.minDate = this.getChapterMinDate();
    });
  }

  ngOnInit(): void {
    this.chapterTimezone = this.chapterOffset;
    this.isAddMode = true;
    this.initializeForm();
    this.loadGenderDropdown();
    this.loadPeriodTypes();
    this.loadQuestions();
    this.subscribeToChapterChanges();
    DateFieldValidationUtility.setupAddModeValidators(this.questionForm, this.chapterOffset);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.chapterTimezone = this.headerService.chapterTimeZone();
        this.minDate = this.getChapterMinDate();
        this.searchText = '';
        if (this.searchBarComponent) {
          this.searchBarComponent.clearSearch();
        }
        this.appliedFilters = null;
        this.filterChips = [];
        this.selectedQuestion = null;
        this.isAddMode = false;
        this.questionForm.reset();
        this.questionForm.markAsUntouched();
        this.questionForm.markAsPristine();
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
        this.loadPeriodTypes();
        this.loadQuestions();
      });
  }

  private initializeForm(): void {
    this.questionForm = this.fb.group({
      questionCode: ['', [Validators.required, Validators.maxLength(10)]],
      refCode: ['', [Validators.required, Validators.maxLength(10), HHQuestionsTab.refCodeValidator]],
      gender: ['', [Validators.required]],
      questionDescription: ['', [Validators.required, Validators.maxLength(1000)]],
      readMoreFlag: [''],
      manualAuditFlag: [''],
      manualAuditHistFlag: [''],
      validateLookBackDate: [''],
      periodTypeForLookBack: [''],
      periodNumberForLookBack: [null, [
        Validators.min(1),
        Validators.max(9999),
        Validators.pattern(/^\d+$/)
      ]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate'),
        HHQuestionsTab.lookBackPeriodValidator()
      ]
    });

    this.questionForm.get('effectiveDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.questionForm.get('terminationDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  private loadGenderDropdown(): void {
    this.hhService.getGenderDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.sexOptions = options;
        }
      });
  }

  private loadPeriodTypes(): void {
    this.hhService.getPeriodTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.periodTypeOptions = options.map(opt => ({
            code: opt.key,
            description: opt.value
          }));
        },
        error: (err) => {
          console.error('Error loading period types:', err);
          // Fallback to hardcoded values if API fails
          this.periodTypeOptions = [
            { code: 'Days', description: 'Days' },
            { code: 'Months', description: 'Months' },
            { code: 'Years', description: 'Years' }
          ];
        }
      });
  }

  private loadQuestions(): void {
    const params: HHQuestionSearchParams = { activeOnly: false, sortBy: 'QuestionCode', sortDir: 'ASC' };
    if (this.searchText) {
      params.searchFor = this.searchText;
    }
    if (this.appliedFilters) {
      if (this.appliedFilters.sex) params.gender = this.appliedFilters.sex;
      if (this.appliedFilters.validateLookBackDate) params.validateLookBackDate = this.appliedFilters.validateLookBackDate;
      if (this.appliedFilters.periodTypeForLookBack) params.periodTypeForLookBack = this.appliedFilters.periodTypeForLookBack;
      if (this.appliedFilters.effectiveDate) {
        params.effectiveDatePeriod = this.appliedFilters.effectiveDatePeriod;
        params.effectiveDate = this.appliedFilters.effectiveDate;
      }
      if (this.appliedFilters.terminationDate) {
        params.terminationDatePeriod = this.appliedFilters.terminationDatePeriod;
        params.terminationDate = this.appliedFilters.terminationDate;
      }
    }

    this.hhService.searchQuestions(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.questions.set(result.data);
          this.totalRecords = result.totalRecords;
          if (result.data.length === 0 && result.message) {
            this.emptyMessage = result.message;
          } else {
            this.emptyMessage = 'No questions found';
          }
        },
        error: (err) => {
          this.questions.set([]);
          this.totalRecords = 0;
          const msg = err?.error?.message || err?.message || 'No health history questions found.';
          this.emptyMessage = msg;
        }
      });
  }

  selectQuestion(question: HHQuestionModel): void {
    this.hhService.getQuestionByCode(question.questionCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fullQuestion) => {
          const resolved = fullQuestion || question;
          this.selectedQuestion = resolved;
          this.isAddMode = false;
          this.populateForm(resolved);
        },
        error: () => {
          this.selectedQuestion = question;
          this.isAddMode = false;
          this.populateForm(question);
        }
      });
  }

  private populateForm(question: HHQuestionModel): void {
    this.questionForm.patchValue({
      questionCode: question.questionCode,
      refCode: question.refCode,
      gender: question.gender,
      questionDescription: question.questionDescription,
      readMoreFlag: question.readMoreFlag || 'N',
      manualAuditFlag: question.manualAuditFlag === 'Y' ? 'Y' : 'N',
      manualAuditHistFlag: question.manualAuditHistFlag === 'Y' ? 'Y' : 'N',
      validateLookBackDate: question.validateLookBackDate || 'N',
      periodTypeForLookBack: question.periodTypeForLookBack || '',
      periodNumberForLookBack: question.periodNumberForLookBack,
      effectiveDate: question.effectiveDate ? moment(question.effectiveDate) : null,
      terminationDate: question.terminationDate ? moment(question.terminationDate) : null
    });
    this.questionForm.markAsPristine();
    DateFieldValidationUtility.setupEditModeValidators(this.questionForm, this.chapterOffset);
  }

  onAddNew(): void {
    this.isAddMode = true;
    this.selectedQuestion = null;
    this.questionForm.reset();
    this.questionForm.markAsUntouched();
    this.questionForm.markAsPristine();
    DateFieldValidationUtility.setupAddModeValidators(this.questionForm, this.chapterOffset);
  }

  get isFormValid(): boolean {
    if (!this.isAddMode && !this.questionForm.dirty) {
      return false;
    }
    return this.questionForm.valid && !this.questionForm.hasError('dateRangeInvalid');
  }

  onSave(): void {
    this.questionForm.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.questionForm, 'terminationDate');

    if (this.questionForm.invalid) return;

    if (this.getEffDateError() || this.getTermDateError()) {
      this.questionForm.get('terminationDate')?.markAsTouched();
      return;
    }

    this.isSaving = true;
    this.savingAction = 'save';

    const formValue = this.questionForm.getRawValue();
    const question: HHQuestionModel = {
      ...formValue,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate),
      terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };

    // Use original question code from selectedQuestion for URL (to identify which record to update)
    // The new question code (if changed) is in the question payload
    const originalQuestionCode = this.selectedQuestion?.questionCode || question.questionCode;
    const save$ = this.isAddMode
      ? this.hhService.createQuestion(question)
      : this.hhService.updateQuestion(originalQuestionCode, question);

    save$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isSaving = false;
          this.savingAction = null;
          if (result.success === false) {
            this.showErrorSnackbar(result);
            return;
          }
          this.snackBar.open(result.message || 'Saved successfully', 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.loadQuestions();
        },
        error: (error) => {
          this.isSaving = false;
          this.savingAction = null;
          this.showErrorSnackbar(error?.error);
        }
      });
  }

  onSaveAndAddAnother(): void {
    this.questionForm.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.questionForm, 'terminationDate');

    if (this.questionForm.invalid) return;

    if (this.getEffDateError() || this.getTermDateError()) {
      this.questionForm.get('terminationDate')?.markAsTouched();
      return;
    }

    this.isSaving = true;
    this.savingAction = 'createAnother';

    const formValue = this.questionForm.getRawValue();
    const question: HHQuestionModel = {
      ...formValue,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate),
      terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };

    this.hhService.createQuestion(question)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isSaving = false;
          this.savingAction = null;
          if (result.success === false) {
            this.showErrorSnackbar(result);
            return;
          }
          this.snackBar.open(result.message || 'Saved successfully', 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.onAddNew();
          this.loadQuestions();
        },
        error: (error) => {
          this.isSaving = false;
          this.savingAction = null;
          this.showErrorSnackbar(error?.error);
        }
      });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private showErrorSnackbar(response: any): void {
    const errorResponse = response?.errorResponse;
    const errorCode = response?.errorCode || errorResponse?.errorCode || '';
    const errorMessage = errorResponse?.error || response?.message || 'An error occurred while saving';
    const displayMsg = errorCode ? `Error: ${errorCode}: ${errorMessage}` : errorMessage;

    this.snackBar.open(displayMsg, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  onCancel(): void {
    if (this.isAddMode) {
      this.questionForm.reset();
      this.questionForm.markAsUntouched();
      this.questionForm.markAsPristine();
      DateFieldValidationUtility.setupAddModeValidators(this.questionForm, this.chapterOffset);
    } else if (this.selectedQuestion) {
      this.populateForm(this.selectedQuestion);
    }
  }

  onSearch(searchText: string): void {
    this.searchText = searchText || '';
    this.selectedQuestion = null;
    this.loadQuestions();
  }

  getFilteredQuestions(): HHQuestionModel[] {
    return this.questions();
  }

  onQuestionCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.questionForm.get('questionCode')?.setValue(input.value, { emitEvent: false });
  }

  // --- Filter Overlay ---
  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.sidebarCard)
      .withPositions([
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 56
        }
      ])
      .withPush(true)
      .withViewportMargin(16)
      .withFlexibleDimensions(false)
      .withGrowAfterOpen(false);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      width: '320px',
      minWidth: '320px',
      maxWidth: '320px'
    });

    const portal = new ComponentPortal(HHQuestionsFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    componentRef.instance.clearAll
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAllFilters();
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });
  }

  applyFilters(filters: HHQuestionFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = this.convertFiltersToChips(filters);
    this.selectedQuestion = null;
    this.loadQuestions();
  }

  onRemoveFilterChip(chipKey: string): void {
    if (!this.appliedFilters) return;
    const updated = { ...this.appliedFilters };
    switch (chipKey) {
      case 'sex': delete updated.sex; break;
      case 'validateLookBackDate': delete updated.validateLookBackDate; break;
      case 'periodTypeForLookBack': delete updated.periodTypeForLookBack; break;
      case 'effectiveDate': delete updated.effectiveDate; delete updated.effectiveDatePeriod; break;
      case 'terminationDate': delete updated.terminationDate; delete updated.terminationDatePeriod; break;
    }
    const hasFilters = Object.keys(updated).length > 0;
    this.appliedFilters = hasFilters ? updated : null;
    this.filterChips = hasFilters ? this.convertFiltersToChips(updated) : [];
    this.selectedQuestion = null;
    this.loadQuestions();
  }

  hasActiveFilters(): boolean {
    if (!this.appliedFilters) return false;
    return Object.values(this.appliedFilters).some(v => v !== undefined && v !== null && v !== '');
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.selectedQuestion = null;
    this.loadQuestions();
  }

  private convertFiltersToChips(filters: HHQuestionFilterValue): FilterChip[] {
    const chips: FilterChip[] = [];
    if (filters.sex) {
      chips.push({ key: 'sex', label: 'Sex', value: filters.sex, removable: true });
    }
    if (filters.validateLookBackDate) {
      chips.push({ key: 'validateLookBackDate', label: 'Look Back', value: filters.validateLookBackDate, removable: true });
    }
    if (filters.periodTypeForLookBack) {
      chips.push({ key: 'periodTypeForLookBack', label: 'Period Type', value: filters.periodTypeForLookBack, removable: true });
    }
    if (filters.effectiveDate) {
      const period = filters.effectiveDatePeriod || 'After';
      chips.push({ key: 'effectiveDate', label: 'Eff. Date', value: `${period} ${moment(filters.effectiveDate).format('DD-MMM-YYYY').toUpperCase()}`, removable: true });
    }
    if (filters.terminationDate) {
      const period = filters.terminationDatePeriod || 'Before';
      chips.push({ key: 'terminationDate', label: 'Term. Date', value: `${period} ${moment(filters.terminationDate).format('DD-MMM-YYYY').toUpperCase()}`, removable: true });
    }
    return chips;
  }

  // --- Date Validation (matching alternate-id pattern) ---
  getEffDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.questionForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.questionForm.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTermDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.questionForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.questionForm.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onEffDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.questionForm.get('effectiveDate')
    );
  }

  onRefCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    if (input.value !== upper) {
      input.value = upper;
      this.questionForm.get('refCode')?.setValue(upper, { emitEvent: false });
    }
  }

  onTermDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.questionForm.get('terminationDate'), !this.isAddMode
    );
  }

  getEffectiveDateDisplay(): string {
    const effDate = this.questionForm.getRawValue().effectiveDate;
    if (!effDate) return '-';
    const m = moment.isMoment(effDate) ? effDate : moment(effDate);
    return m.isValid() ? DateFieldValidationUtility.formatDateForUI(m) : '-';
  }

  get descriptionCharsRemaining(): number {
    const desc = this.questionForm.get('questionDescription')?.value || '';
    return 1000 - desc.length;
  }

  get lookBackPeriodError(): boolean {
    return !!(this.questionForm.hasError('lookBackPeriodRequired') &&
              this.questionForm.get('validateLookBackDate')?.value === 'Y' &&
              (this.questionForm.get('periodTypeForLookBack')?.touched ||
               this.questionForm.get('periodNumberForLookBack')?.touched));
  }

  getGenderIconPath(gender: string): string {
    switch (gender) {
      case 'M': return 'assets/images/icons/gender-male.svg';
      case 'F': return 'assets/images/icons/gender-female.svg';
      case 'A':
      default: return 'assets/images/icons/gender-all.svg';
    }
  }

  getGenderLabel(gender: string): string {
    switch (gender) {
      case 'M': return 'Male';
      case 'F': return 'Female';
      case 'A':
      default: return 'All Genders';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return moment(dateStr).format('DD-MMM-YYYY').toUpperCase();
  }
}
