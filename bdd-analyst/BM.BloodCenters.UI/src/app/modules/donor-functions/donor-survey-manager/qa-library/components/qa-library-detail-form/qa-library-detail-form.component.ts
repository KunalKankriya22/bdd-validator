import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, OnChanges, SimpleChanges, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import moment from 'moment';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { AnswerOptionsTableComponent } from '../answer-options-table/answer-options-table.component';
import { Question, Answer, CommentConfig, QuestionSaveEvent } from '../../models/qa-library.models';

@Component({
  selector: 'app-qa-library-detail-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AnswerOptionsTableComponent
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './qa-library-detail-form.component.html',
  styleUrls: ['./qa-library-detail-form.component.scss']
})
export class QaLibraryDetailFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() question: Question | null = null;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() isSaving: boolean = false;
  @Output() save = new EventEmitter<QuestionSaveEvent>();
  @Output() cancel = new EventEmitter<void>();
  @Output() clearAll = new EventEmitter<void>();

  @ViewChild(FormGroupDirective) private formGroupDirective?: FormGroupDirective;
  @ViewChild(AnswerOptionsTableComponent) answerOptionsTable?: AnswerOptionsTableComponent;

  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private lastChangedCommentDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );

  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError()
  );

  commentEffDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getCommentEffectiveDateError()
  );

  commentTermDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getCommentTerminationDateError()
  );

  form!: FormGroup;
  answerOptions: Answer[] = [];

  // Dirty tracking
  isDirty: boolean = false;
  private _isPopulating: boolean = false;

  // Change tracking
  private originalQuestion: Question | null = null;
  private originalAnswerCount: number = 0;

  // Track previous question dates for reactive sync to option rows
  private _prevQuestionEffDate: any = null;
  private _prevQuestionTermDate: any = null;

  private destroy$ = new Subject<void>();

  // Response Type to SVG path mapping
  private readonly RESPONSE_TYPE_ICONS: { [key: string]: string } = {
    'Single': '/assets/images/donor survey manager/radio-on.svg',
    'Multiple': '/assets/images/donor survey manager/checked.svg',
    'Comment': '/assets/images/donor survey manager/Comment.svg',
    'Ranking': '/assets/images/donor survey manager/Ranking.svg'
  };

  responseTypes = ['Single', 'Multiple', 'Comment', 'Ranking'];

  constructor(
    private fb: FormBuilder,
    private headerService: HeaderService,
    private chapterTimezoneService: ChapterTimezoneService,
    private cdr: ChangeDetectorRef
  ) {}

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }


  /**
   * Termination date filter: must be >= chapter's today AND >= effective date
   */
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = this.chapterTimezoneService.getChapterLocalDate();

    // Block dates before chapter's local date
    if (checkDate.isBefore(today)) {
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

  /**
   * Comment termination date filter: must be >= chapter's today AND >= comment effective date
   */
  commentTerminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = this.chapterTimezoneService.getChapterLocalDate();

    // Block dates before chapter's local date
    if (checkDate.isBefore(today)) {
      return false;
    }

    // Must be >= comment effective date if set
    const commentEffectiveDate = this.form?.get('commentEffectiveDate')?.value;
    if (commentEffectiveDate) {
      const effDay = moment(commentEffectiveDate).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When mode changes from ADD to EDIT, reset change tracking
    if (changes['mode'] && !changes['mode'].firstChange && this.form) {
      if (changes['mode'].currentValue === 'edit' && changes['mode'].previousValue === 'add') {
        // Reset change tracking when switching from ADD to EDIT mode
        this.isDirty = false;
        this.originalQuestion = null;
        this.originalAnswerCount = 0;
      }
      this.setupValidatorsBasedOnMode();
    }

    // When question input changes, update the form and answerOptions
    if (changes['question'] && !changes['question'].firstChange && this.form) {
      // Always reset original values when question changes (don't rely on cached values)
      this.originalQuestion = null;
      this.originalAnswerCount = 0;
      // Store original for change tracking
      this.storeOriginalValues();
      this.populateForm();
      this.cdr.detectChanges();
    }
  }

  /**
   * Store original question values for change detection
   */
  private storeOriginalValues(): void {
    if (this.question) {
      // Deep clone to avoid reference issues
      this.originalQuestion = JSON.parse(JSON.stringify(this.question));
      this.originalAnswerCount = this.question.answerOptions?.length || 0;
    }
  }

  private setupValidatorsBasedOnMode(): void {
    if (this.mode === 'add') {
      this.form.get('effectiveDate')?.setValidators([
        Validators.required,
        DateFieldValidationUtility.effectiveDateNotPastValidator(this.headerService.chapterTimeZone())
      ]);
    } else {
      this.form.get('effectiveDate')?.setValidators([Validators.required]);
    }
    this.form.get('effectiveDate')?.updateValueAndValidity({ emitEvent: false });
    this.form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
  }

  initForm(): void {
    this.form = this.fb.group({
      questionCode: ['', [Validators.required, Validators.maxLength(10)]],
      sex: ['', Validators.required],
      effectiveDate: [null, Validators.required],
      terminationDate: [null],
      questionText: ['', [Validators.required, Validators.maxLength(1000)]],
      responseType: ['', Validators.required],

      // Comment-specific fields (conditionally validated)
      characterLimit: [240],
      commentBoxText: [''],  // Preview only — not saved to backend
      commentAnswerCode: [''],
      commentEffectiveDate: [null],
      commentTerminationDate: [null]
    });

    this.form.get('terminationDate')?.setValidators([
      DateFieldValidationUtility.validDateValidator(),
      DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
    ]);

    this.form.get('commentTerminationDate')?.setValidators([
      DateFieldValidationUtility.validDateValidator(),
      DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
    ]);

    // Form-group-level cross-field range validators (blueprint pattern).
    // Keeping range validation at form level means control.updateValueAndValidity()
    // is never called on the other field, so manually-set invalidDate errors survive.
    const terminationDateRangeValidator: ValidatorFn = (fg: AbstractControl) => {
      const termDate = fg.get('terminationDate')?.value;
      const effDate = fg.get('effectiveDate')?.value;
      if (!termDate || !effDate) return null;
      const term = moment.isMoment(termDate) ? termDate.clone().startOf('day') : moment(termDate).startOf('day');
      const eff = moment.isMoment(effDate) ? effDate.clone().startOf('day') : moment(effDate).startOf('day');
      return term.isBefore(eff) ? { dateRangeInvalid: true } : null;
    };

    const commentTerminationDateRangeValidator: ValidatorFn = (fg: AbstractControl) => {
      const termDate = fg.get('commentTerminationDate')?.value;
      const effDate = fg.get('commentEffectiveDate')?.value;
      if (!termDate || !effDate) return null;
      const term = moment.isMoment(termDate) ? termDate.clone().startOf('day') : moment(termDate).startOf('day');
      const eff = moment.isMoment(effDate) ? effDate.clone().startOf('day') : moment(effDate).startOf('day');
      return term.isBefore(eff) ? { commentDateRangeInvalid: true } : null;
    };

    this.form.addValidators([terminationDateRangeValidator, commentTerminationDateRangeValidator]);

    // Track dirty state whenever any form field changes (suppressed during population)
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this._isPopulating) {
          this.isDirty = true;
        }
      });

    // Re-validate termination date when effective date changes + sync to option rows / comment
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((newDate) => {
        this.lastChangedDateField = 'effective';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });

        if (!this._isPopulating && this.mode === 'add') {
          // Sync question effective date to new option rows
          this.syncQuestionDateToOptions('effectiveDate', this._prevQuestionEffDate, newDate);

          // Sync question effective date to comment effective date (only when Comment is selected)
          if (this.form.get('responseType')?.value === 'Comment') {
            const commentEffDate = this.form.get('commentEffectiveDate')?.value;
            if (!commentEffDate || this.areDatesEqual(commentEffDate, this._prevQuestionEffDate)) {
              this.form.get('commentEffectiveDate')?.setValue(newDate, { emitEvent: false });
            }
          }
        }
        this._prevQuestionEffDate = newDate;
      });

    // Sync question termination date to option rows
    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((newDate) => {
        this.lastChangedDateField = 'termination';
        if (!this._isPopulating && this.mode === 'add') {
          this.syncQuestionDateToOptions('terminationDate', this._prevQuestionTermDate, newDate);
        }
        this._prevQuestionTermDate = newDate;
      });

    // Re-validate comment termination date when comment effective date changes
    this.form.get('commentEffectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedCommentDateField = 'effective';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });

    this.form.get('commentTerminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedCommentDateField = 'termination';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });

    // Mode-dependent validators (effectiveDateNotPastValidator only in ADD mode)
    this.setupValidatorsBasedOnMode();

    // IMPORTANT: Setup listener BEFORE populating form so it triggers on initial value
    this.setupResponseTypeListener();

    // Populate form with question data
    this.populateForm();
  }

  /**
   * Populate form with question data (called from ngOnInit and ngOnChanges)
   */
  private populateForm(): void {
    if (this.question) {
      // Store original values for change tracking (if not already stored)
      if (!this.originalQuestion) {
        this.storeOriginalValues();
      }

      // Suppress dirty tracking during population (patchValue + async setupResponseTypeListener)
      this._isPopulating = true;

      // Reset form state: clears submitted flag so red labels don't appear on a freshly opened form.
      // FormGroupDirective.submitted becomes true when the user presses Enter inside any text input
      // (browser fires a native form submit). The default ErrorStateMatcher treats submitted=true the
      // same as touched=true, so all invalid controls show red labels even without user interaction.
      // resetForm() resets submitted AND calls markAsUntouched/markAsPristine on all controls.
      // On first render (ngOnInit path) formGroupDirective is not yet set, so we fall back to manual reset.
      if (this.formGroupDirective) {
        this.formGroupDirective.resetForm();
      } else {
        this.form.markAsUntouched();
        this.form.markAsPristine();
      }

      // Set answerOptions BEFORE patchValue because setting responseType triggers
      // setupResponseTypeListener synchronously, which may push an initial empty row
      // when answerOptions is empty. If we set answerOptions after patchValue, it would
      // overwrite the row the listener just added.
      this.answerOptions = this.question.answerOptions ? [...this.question.answerOptions] : [];

      this.form.patchValue({
        questionCode: this.question.questionCode,
        sex: this.question.sex,
        effectiveDate: this.question.effectiveDate,
        terminationDate: this.question.terminationDate,
        questionText: this.question.questionText,
        responseType: this.question.responseType
      });

      // Always reset comment fields to defaults first — prevents stale values
      // persisting when switching from a Comment question to a new/different question
      this.form.patchValue({
        characterLimit: 240,
        commentBoxText: '',
        commentAnswerCode: '',
        commentEffectiveDate: null,
        commentTerminationDate: null
      });

      // Then repopulate comment fields if this is an existing Comment question
      if (this.question.responseType === 'Comment' && this.question.commentConfig) {
        this.form.patchValue({
          characterLimit: this.question.commentConfig.characterLimit,
          commentBoxText: this.question.commentConfig.answerDesc ?? '',
          commentAnswerCode: this.question.commentConfig.answerCode,
          commentEffectiveDate: this.question.commentConfig.effectiveDate,
          commentTerminationDate: this.question.commentConfig.terminationDate
        });
      }

      // Programmatically disable/enable question fields based on mode.
      // In EDIT mode: all question fields are read-only except Termination Date.
      // isEditable from backend only controls answer option rows, not question fields.
      if (this.mode === 'edit') {
        this.form.get('questionCode')?.disable({ emitEvent: false });
        this.form.get('questionText')?.disable({ emitEvent: false });
        this.form.get('sex')?.disable({ emitEvent: false });
        this.form.get('effectiveDate')?.disable({ emitEvent: false });
        this.form.get('responseType')?.disable({ emitEvent: false });
        // Only termination date stays editable in edit mode
        this.form.get('terminationDate')?.enable({ emitEvent: false });
      } else {
        // Add mode: all fields enabled
        this.form.get('questionCode')?.enable({ emitEvent: false });
        this.form.get('questionText')?.enable({ emitEvent: false });
        this.form.get('sex')?.enable({ emitEvent: false });
        this.form.get('effectiveDate')?.enable({ emitEvent: false });
        this.form.get('terminationDate')?.enable({ emitEvent: false });
        this.form.get('responseType')?.enable({ emitEvent: false });
      }

      // Reset form state after population — enable() calls above propagate
      // _updateAncestors() which can re-dirty/re-touch controls.
      this.form.markAsUntouched();
      this.form.markAsPristine();
      this._isPopulating = false;
      this.isDirty = false;
    }
  }

  /**
   * Listen to Response Type changes and show/hide sections
   */
  setupResponseTypeListener(): void {
    this.form.get('responseType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(responseType => {
        if (responseType === 'Comment') {
          // Enable comment fields, disable table
          this.form.get('characterLimit')?.setValidators([Validators.required]);
          this.form.get('characterLimit')?.updateValueAndValidity({ emitEvent: false });

          this.form.get('commentAnswerCode')?.setValidators([
            Validators.required,
            Validators.maxLength(10),
            Validators.pattern(/^[A-Za-z0-9]+$/)
          ]);
          this.form.get('commentAnswerCode')?.updateValueAndValidity({ emitEvent: false });

          this.form.get('commentEffectiveDate')?.setValidators([
            Validators.required,
            DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset)
          ]);

          // Sync question effective date to comment effective date (ADD mode only)
          if (!this._isPopulating && this.mode === 'add') {
            const questionEffDate = this.form.get('effectiveDate')?.value;
            const commentEffDate = this.form.get('commentEffectiveDate')?.value;
            if (questionEffDate && !commentEffDate) {
              this.form.get('commentEffectiveDate')?.setValue(questionEffDate, { emitEvent: false });
            }
          }

          this.form.get('commentEffectiveDate')?.updateValueAndValidity({ emitEvent: false });

          // Clear answer options
          this.answerOptions = [];
        } else if (['Single', 'Multiple', 'Ranking'].includes(responseType)) {
          // Disable comment fields, enable table
          this.form.get('characterLimit')?.clearValidators();
          this.form.get('characterLimit')?.updateValueAndValidity({ emitEvent: false });

          this.form.get('commentAnswerCode')?.clearValidators();
          this.form.get('commentAnswerCode')?.updateValueAndValidity({ emitEvent: false });

          this.form.get('commentEffectiveDate')?.clearValidators();
          this.form.get('commentEffectiveDate')?.updateValueAndValidity({ emitEvent: false });

          // Initialize one empty row if needed, pre-filled with question dates
          if (this.answerOptions.length === 0) {
            this.answerOptions.push({
              sequence: 1,
              answerCode: '',
              answerCodeDescription: '',
              effectiveDate: this.form.get('effectiveDate')?.value ?? null,
              terminationDate: this.form.get('terminationDate')?.value ?? null,
              auditKey: 0,
              isEditable: true, // NEW rows are always editable
              errors: {}
            });
          }
        }

        this.form.updateValueAndValidity({ emitEvent: false });
      });
  }

  get showAnswerOptionsTable(): boolean {
    const type = this.form.get('responseType')?.value;
    return ['Single', 'Multiple', 'Ranking'].includes(type);
  }

  get showCommentSection(): boolean {
    return this.form.get('responseType')?.value === 'Comment';
  }

  get remainingCharacters(): number {
    const limit = this.form.get('characterLimit')?.value || 240;
    return limit; // Would subtract current text length in real implementation
  }

  /**
   * Check if answer option rows can be edited in the answer options table.
   * Uses backend's isEditable flag which checks:
   * - Is question used in a survey template? (Error 17030)
   * - Does question have saved answers in database? (Error 16097)
   *
   * Note: Question-level fields (questionCode, sex, effectiveDate, questionText,
   * responseType) are always disabled in EDIT mode — only terminationDate stays
   * editable. This getter controls answer option row editability only.
   */
  get canEditQuestionFields(): boolean {
    if (this.mode === 'edit') {
      // Backend determines editability based on business rules
      return this.question?.isEditable ?? true;
    }

    // ADD mode: always editable
    return true;
  }

  /**
   * Cancel always enabled — in add mode discards the form, in edit mode jumps to first question
   */
  get canCancel(): boolean {
    return true;
  }

  /**
   * Clear All enabled: only when user has made changes (both modes)
   */
  get canClearAll(): boolean {
    return this.mode === 'add' && this.isDirty;
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

  getCommentEffectiveDateError(): string {
    const control = this.form.get('commentEffectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDate')) return 'Effective Date is invalid';
    if (control.hasError('required')) return 'Effective Date is required';
    if (control.hasError('effectiveDatePast')) return 'Effective Date cannot be past date';
    if (this.lastChangedCommentDateField === 'effective' && this.form.hasError('commentDateRangeInvalid')) {
      return 'Effective Date must be less than or equal to Termination Date';
    }
    return '';
  }

  getCommentTerminationDateError(): string {
    const control = this.form.get('commentTerminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDate')) return 'Termination Date is invalid';
    if (control.hasError('terminationDatePast')) return 'Termination Date cannot be past date';
    if (this.lastChangedCommentDateField === 'termination' && this.form.hasError('commentDateRangeInvalid')) {
      return 'Termination Date must be on or after Effective Date';
    }
    return '';
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

  onCommentEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('commentEffectiveDate')
    );
  }

  onCommentTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('commentTerminationDate'), this.mode === 'edit'
    );
  }

  /**
   * Check if question fields have changed (for EDIT mode)
   */
  private hasQuestionChanged(): boolean {
    if (!this.originalQuestion) return false;

    const current = this.form.getRawValue();

    // In edit mode only termination date is editable, so only check that
    return !this.areDatesEqual(current.terminationDate, this.originalQuestion.terminationDate);
  }

  /**
   * Check if answers have changed (for EDIT mode)
   */
  private hasAnswersChanged(): boolean {
    // Check if response type is one that has answers
    const responseType = this.form.get('responseType')?.value;
    const hasAnswerType = ['Single', 'Multiple', 'Ranking'].includes(responseType);

    if (!hasAnswerType) {
      // If changed FROM answer type TO Comment, answers changed (need to delete old rows)
      if (this.originalQuestion &&
          ['Single', 'Multiple', 'Ranking'].includes(this.originalQuestion.responseType)) {
        return true;
      }

      // For Comment type staying as Comment, check if comment config fields changed
      if (responseType === 'Comment') {
        const current = this.form.getRawValue();
        const orig = this.originalQuestion?.commentConfig;

        if (current.commentAnswerCode !== (orig?.answerCode ?? '')) return true;
        if (current.commentBoxText !== (orig?.answerDesc ?? '')) return true;
        if (!this.areDatesEqual(current.commentEffectiveDate, orig?.effectiveDate ?? null)) return true;
        if (!this.areDatesEqual(current.commentTerminationDate, orig?.terminationDate ?? null)) return true;
      }

      return false;
    }

    // New rows added with actual data.
    // Blank rows (auditKey === 0, code+description empty) are auto-added by setupResponseTypeListener
    // when a question with no saved options is loaded — they are UI scaffolding, not user changes.
    // Dates are excluded because they can be auto-populated from question dates.
    const hasNewRows = this.answerOptions.some(row =>
      row.auditKey === 0 && (
        (row.answerCode && row.answerCode.trim() !== '') ||
        (row.answerCodeDescription && row.answerCodeDescription.trim() !== '')
      )
    );

    // Rows deleted
    const currentCount = this.answerOptions.length;
    const hasDeletedRows = currentCount < this.originalAnswerCount;

    // Existing rows edited (tracked by child component)
    const hasEditedRows = (this.answerOptionsTable?.dirtyRows?.size ?? 0) > 0;

    return hasNewRows || hasDeletedRows || hasEditedRows;
  }

  /**
   * Compare two dates for equality (handles moment and Date objects)
   */
  private areDatesEqual(date1: any, date2: any): boolean {
    if (!date1 && !date2) return true;
    if (!date1 || !date2) return false;

    const d1 = moment(date1).format('YYYY-MM-DD');
    const d2 = moment(date2).format('YYYY-MM-DD');
    return d1 === d2;
  }

  /**
   * Sync a question date change to new answer option rows.
   * - Rows with null date → auto-populate with new question date
   * - Rows whose date matches the previous question date → update (was auto-populated)
   * - Rows with a different date → leave alone (user manually set it)
   * - Existing rows (auditKey > 0) → never touch
   */
  private syncQuestionDateToOptions(
    field: 'effectiveDate' | 'terminationDate',
    prevDate: any,
    newDate: any
  ): void {
    if (!this.answerOptions.length) return;

    this.answerOptions.forEach(row => {
      if (row.auditKey !== 0) return; // skip existing backend rows

      const rowDate = row[field];

      // Auto-populate if row date is null or matches previous question date
      if (!rowDate || this.areDatesEqual(rowDate, prevDate)) {
        row[field] = newDate;
      }
    });
  }

  /**
   * Returns true for a control that is either valid (enabled) or disabled.
   * Disabled controls in EDIT mode are pre-populated from the backend and cannot
   * be changed by the user, so they must be treated as valid for save-button logic.
   * Angular's control.valid returns false when status === 'DISABLED'.
   */
  private isControlValidOrDisabled(name: string): boolean {
    const ctrl = this.form.get(name);
    return ctrl ? (ctrl.disabled || ctrl.valid) : false;
  }

  /**
   * Check if answer options are valid for save (ADD mode).
   * For Single/Multiple/Ranking: at least 1 non-blank row with all required fields and no errors.
   * For Comment: always true (comment fields are validated separately via form controls).
   */
  private areAnswerOptionsValidForSave(): boolean {
    if (!this.showAnswerOptionsTable) return true;

    // Block save if any new rows are completely blank — user must fill or delete them
    const hasBlankNewRows = this.answerOptions.some(row =>
      row.auditKey === 0 &&
      (!row.answerCode || row.answerCode.trim() === '') &&
      (!row.answerCodeDescription || row.answerCodeDescription.trim() === '')
    );
    if (hasBlankNewRows) return false;

    // Filter out completely blank rows (no answerCode and no description)
    const nonBlankRows = this.answerOptions.filter(row => {
      if (row.auditKey !== 0) return true;
      return (row.answerCode && row.answerCode.trim() !== '') ||
             (row.answerCodeDescription && row.answerCodeDescription.trim() !== '');
    });

    if (nonBlankRows.length === 0) return false;

    // All non-blank rows must have required fields filled and no errors
    return nonBlankRows.every(row => {
      const hasRequiredFields =
        row.answerCode && row.answerCode.trim() !== '' &&
        row.answerCodeDescription && row.answerCodeDescription.trim() !== '' &&
        row.effectiveDate !== null;

      const hasNoErrors = !row.errors || Object.keys(row.errors).length === 0;

      return hasRequiredFields && hasNoErrors;
    });
  }

  get saveButtonLabel(): string {
    if (this.isSaving) return this.mode === 'add' ? 'ADDING...' : 'SAVING...';
    return this.mode === 'add' ? 'ADD' : 'SAVE';
  }

  /**
   * Check if SAVE button should be enabled
   * Required: questionCode, sex, effectiveDate, questionText, responseType
   * If responseType = Comment: commentAnswerCode and commentEffectiveDate also become required
   */
  get canSave(): boolean {
    // Disable save button while save operation is in progress
    if (this.isSaving) return false;

    // Check required base fields.
    // Use isControlValidOrDisabled because questionCode is always disabled in EDIT mode,
    // and all question fields are disabled when isEditable=false — Angular's .valid
    // returns false for disabled controls even if they have a valid value.
    const baseValid = this.isControlValidOrDisabled('questionCode') &&
                      this.isControlValidOrDisabled('sex') &&
                      this.isControlValidOrDisabled('effectiveDate') &&
                      this.isControlValidOrDisabled('questionText') &&
                      this.isControlValidOrDisabled('responseType');

    if (!baseValid) return false;

    // If Comment response type selected, validate comment-specific fields
    if (this.showCommentSection) {
      const commentAnswerCode = this.form.get('commentAnswerCode')?.valid ?? false;
      const commentEffectiveDate = this.form.get('commentEffectiveDate')?.valid ?? false;

      if (!commentAnswerCode || !commentEffectiveDate) return false;
    }

    // In ADD mode: base fields valid AND answer options valid
    if (this.mode === 'add') {
      return this.areAnswerOptionsValidForSave();
    }

    // In EDIT mode: base fields valid AND actual value changed AND answer options valid
    const hasChanges = this.hasQuestionChanged() || this.hasAnswersChanged();
    return hasChanges && this.areAnswerOptionsValidForSave();
  }

  onAnswerOptionsChange(options: any[]): void {
    this.answerOptions = options;
    this.isDirty = true;
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Remove blank rows and validate answer options if table mode
    if (this.showAnswerOptionsTable && this.answerOptionsTable) {
      // STEP 1: Remove blank rows silently
      this.answerOptionsTable.removeBlankRows();

      // STEP 2: Validate remaining rows
      if (!this.answerOptionsTable.validateAllRows()) {
        return;
      }
    }

    const formValue = this.form.getRawValue(); // getRawValue includes disabled controls (questionCode, questionText)

    // Convert moment objects to Date objects for Question dates
    const effectiveDate = formValue.effectiveDate
      ? (moment.isMoment(formValue.effectiveDate) ? formValue.effectiveDate.toDate() : formValue.effectiveDate)
      : null;
    const terminationDate = formValue.terminationDate
      ? (moment.isMoment(formValue.terminationDate) ? formValue.terminationDate.toDate() : formValue.terminationDate)
      : null;

    // Convert moment objects to Date objects for Comment dates
    const commentEffectiveDate = formValue.commentEffectiveDate
      ? (moment.isMoment(formValue.commentEffectiveDate) ? formValue.commentEffectiveDate.toDate() : formValue.commentEffectiveDate)
      : null;
    const commentTerminationDate = formValue.commentTerminationDate
      ? (moment.isMoment(formValue.commentTerminationDate) ? formValue.commentTerminationDate.toDate() : formValue.commentTerminationDate)
      : null;

    const questionData: Question = {
      questionCode: formValue.questionCode,
      questionText: formValue.questionText,
      sex: formValue.sex,
      responseType: formValue.responseType,
      effectiveDate: effectiveDate,
      terminationDate: terminationDate,
      isEditable: this.question?.isEditable ?? true,
      answerOptions: this.showAnswerOptionsTable ? this.answerOptions : [],
      commentConfig: this.showCommentSection ? {
        characterLimit: formValue.characterLimit,
        answerCode: formValue.commentAnswerCode,
        answerDesc: formValue.commentBoxText,
        effectiveDate: commentEffectiveDate,
        terminationDate: commentTerminationDate
      } : null
    };

    // Emit question data with change flags
    this.save.emit({
      question: questionData,
      questionChanged: this.hasQuestionChanged(),
      answersChanged: this.hasAnswersChanged()
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onClearAll(): void {
    this._isPopulating = true;
    this.form.reset({
      questionCode: '',
      sex: '',
      effectiveDate: null,
      terminationDate: null,
      questionText: '',
      responseType: '',
      characterLimit: 240,
      commentBoxText: '',
      commentAnswerCode: '',
      commentEffectiveDate: null,
      commentTerminationDate: null
    });
    this.answerOptions = [];
    this._prevQuestionEffDate = null;
    this._prevQuestionTermDate = null;
    this._isPopulating = false;
    this.isDirty = false;
    this.clearAll.emit();
  }

  getResponseTypeIcon(responseType: string): string {
    return this.RESPONSE_TYPE_ICONS[responseType] || '';
  }

  /**
   * Strip leading spaces from a form control as user types
   */
  onStripLeadingSpaces(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const originalValue = input.value;
    const sanitizedValue = originalValue.replace(/^\s+/, '');

    if (originalValue !== sanitizedValue) {
      this.form.patchValue({ [controlName]: sanitizedValue }, { emitEvent: false });
      input.value = sanitizedValue;
    }
  }

  /**
   * Restrict question code input to alphanumeric characters only
   */
  onQuestionCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const originalValue = input.value;
    const sanitizedValue = originalValue.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    if (originalValue !== sanitizedValue) {
      this.form.patchValue({ questionCode: sanitizedValue }, { emitEvent: false });
      input.value = sanitizedValue;
    }
  }

  /**
   * Restrict comment answer code input to alphanumeric characters only
   * Removes any special characters as user types
   */
  onCommentAnswerCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const originalValue = input.value;
    const sanitizedValue = originalValue.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    if (originalValue !== sanitizedValue) {
      this.form.patchValue({ commentAnswerCode: sanitizedValue }, { emitEvent: false });
      input.value = sanitizedValue;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
