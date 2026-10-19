import { Component, OnInit, OnDestroy, Output, EventEmitter, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment, { Moment } from 'moment';
import { Observable, Subject, forkJoin, distinctUntilChanged, takeUntil } from 'rxjs';

import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { HealthHistoryService } from '../../services/health-history.service';
import {
  HHTemplateQuestionDto,
  DropdownOption,
  QuestionDropdownOption,
  HHTemplateDetailModel,
  ReturnResult
} from '../../models/health-history.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

@Component({
  selector: 'app-add-edit-template',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    SearchBar
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-template.html',
  styleUrls: ['./add-edit-template.scss']
})
export class AddEditTemplate implements OnInit, OnDestroy {
  @Output() save = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  private hhService = inject(HealthHistoryService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private headerService = inject(HeaderService);

  templateForm!: FormGroup;
  donationTypes = signal<DropdownOption[]>([]);
  availableQuestions = signal<QuestionDropdownOption[]>([]);
  assignedQuestions: HHTemplateQuestionDto[] = [];
  isQuestionsSearchOpen = false;
  questionSearchText = '';
  isSaving = false;

  donationTypeSearchControl = new FormControl('');
  filteredDonationTypes: DropdownOption[] = [];
  generatedTemplateId = '';
  private static cachedTemplateId = '';
  private savedQuestionCodes = new Set<string>();

  questionSearchConfig: SearchBarConfig = {
    placeholder: 'Search by question code, or description',
    minLength: 1,
    ariaLabel: 'Search available questions',
    searchOnEnterOnly: false
  };
  chapterTimezone = '';
  minDate = moment();
  lastChangedDateField: 'effective' | 'termination' = 'effective';

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTermDateError());

  sexOptions: DropdownOption[] = [
    { code: 'A', description: 'All' },
    { code: 'M', description: 'Male' },
    { code: 'F', description: 'Female' }
  ];

  askOptions: DropdownOption[] = [
    { code: 'D', description: 'D' }
  ];

  abbrFlagOptions: DropdownOption[] = [
    { code: 'Y', description: 'Yes' },
    { code: 'N', description: 'No' }
  ];

  repeatedOptions: DropdownOption[] = [
    { code: 'Y', description: 'Yes' }
  ];

  responseFlagOptions: DropdownOption[] = [
    { code: 'Y', description: 'Yes' },
    { code: 'N', description: 'No' }
  ];

  subFlagOptions: DropdownOption[] = [
    { code: 'Y', description: 'Yes' },
    { code: 'N', description: 'No' },
    { code: 'B', description: 'B' }
  ];

  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  get termMinDate(): Moment {
    const effDate = this.templateForm?.get('effectiveDate')?.value;
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
    this.initializeForm();
    this.loadDropdowns();
    this.loadOrReuseTemplateId();

    this.donationTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => this.filterDonationTypesList(search || ''));
  }


  private loadOrReuseTemplateId(): void {
    if (AddEditTemplate.cachedTemplateId) {
      this.generatedTemplateId = AddEditTemplate.cachedTemplateId;
      this.templateForm.patchValue({ templateId: 'NEW' });
    } else {
      this.hhService.generateTemplateId()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (id) => {
            this.generatedTemplateId = id;
            AddEditTemplate.cachedTemplateId = id;
            this.templateForm.patchValue({ templateId: 'NEW' });
          },
          error: () => {
            this.snackBar.open('Failed to generate template ID', 'DISMISS', {
              duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
            });
          }
        });
    }
  }

  private filterDonationTypesList(search: string): void {
    if (!search) {
      this.filteredDonationTypes = this.donationTypes();
      return;
    }
    const lower = search.toLowerCase();
    this.filteredDonationTypes = this.donationTypes().filter(dt =>
      dt.code.toLowerCase().includes(lower) ||
      dt.description.toLowerCase().includes(lower)
    );
  }

  onDonationTypeSelectOpened(isOpen: boolean): void {
    if (!isOpen) {
      this.donationTypeSearchControl.setValue('');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.templateForm = this.fb.group({
      donationType: ['', [Validators.required]],
      templateId: ['', [Validators.required, Validators.maxLength(10)]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    DateFieldValidationUtility.setupAddModeValidators(this.templateForm, this.chapterOffset);

    this.templateForm.get('effectiveDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.lastChangedDateField = 'effective';
        this.syncDatesToQuestions();
      });

    this.templateForm.get('terminationDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.lastChangedDateField = 'termination';
        this.syncDatesToQuestions();
      });
  }

  private loadDropdowns(): void {
    this.hhService.getDonationTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(types => {
        this.donationTypes.set(types);
        this.filteredDonationTypes = types;
      });

    this.hhService.getAvailableQuestionsForTemplate()
      .pipe(takeUntil(this.destroy$))
      .subscribe(questions => this.availableQuestions.set(questions));
  }

  toggleQuestionsSearch(): void {
    this.isQuestionsSearchOpen = !this.isQuestionsSearchOpen;
    if (!this.isQuestionsSearchOpen) {
      this.questionSearchText = '';
    }
  }

  onQuestionSearch(searchText: string): void {
    this.questionSearchText = searchText || '';
  }

  getFilteredAvailableQuestions(): QuestionDropdownOption[] {
    const questions = this.availableQuestions();
    if (!this.questionSearchText) return questions;
    const search = this.questionSearchText.toLowerCase();
    return questions.filter(q =>
      q.code.toLowerCase().includes(search) ||
      q.description.toLowerCase().includes(search)
    );
  }

  addQuestionToTemplate(question: QuestionDropdownOption): void {
    const alreadyAdded = this.assignedQuestions.some(q => q.questionCode === question.code);
    if (alreadyAdded) return;

    const newQuestion: HHTemplateQuestionDto = {
      donationType: this.templateForm.get('donationType')?.value || '',
      questionCode: question.code,
      templateId: this.templateForm.get('templateId')?.value || '',
      questionDescription: question.description,
      screenerAsk: 'D',
      abbrFlag: 'N',
      abbrDispSeq: null,
      repeatHhFlag: 'Y',
      gender: 'A',
      displayOrder: null,
      sortSequence: '',
      parentQuestionCode: '',
      subQuestionFlag: 'N',
      parentRespFlag: 'N',
      gotoNotes: '',
      effDate: this.templateForm.get('effectiveDate')?.value
        ? moment(this.templateForm.get('effectiveDate')?.value).format('YYYY-MM-DD') : '',
      termDate: this.templateForm.get('terminationDate')?.value
        ? moment(this.templateForm.get('terminationDate')?.value).format('YYYY-MM-DD') : null,
      validCodeType: '',
      randomizationFlag: 'N',
      programId: '',
      insertDate: '',
      insertUser: '',
      auditKey: 0,
      chapterId: this.headerService.getCurrentChapterId()
    };
    this.assignedQuestions = [...this.assignedQuestions, newQuestion];
  }

  private syncDatesToQuestions(): void {
    if (this.assignedQuestions.length === 0) return;
    const effValue = this.templateForm.get('effectiveDate')?.value;
    const termValue = this.templateForm.get('terminationDate')?.value;
    const effDate = effValue && moment.isMoment(effValue) && effValue.isValid()
      ? effValue.format('YYYY-MM-DD') : '';
    const termDate = termValue && moment.isMoment(termValue) && termValue.isValid()
      ? termValue.format('YYYY-MM-DD') : null;

    this.assignedQuestions = this.assignedQuestions.map(q => ({
      ...q,
      effDate,
      termDate
    }));
  }

  removeQuestion(index: number): void {
    this.assignedQuestions = this.assignedQuestions.filter((_, i) => i !== index);
  }

  getEffDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.templateForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.templateForm.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  onGotoNotesInput(event: Event, q: HHTemplateQuestionDto): void {
    const input = event.target as HTMLInputElement;
    q.gotoNotes = input.value.toUpperCase();
    input.value = q.gotoNotes;
  }

  getTermDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.templateForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.templateForm.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onEffDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.templateForm.get('effectiveDate')
    );
  }

  onTermDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.templateForm.get('terminationDate'), false
    );
  }

  get isFormValid(): boolean {
    if (!this.templateForm.valid || this.templateForm.hasError('dateRangeInvalid') || this.assignedQuestions.length === 0) return false;
    return this.assignedQuestions.every(q =>
      q.displayOrder != null && q.displayOrder !== '' as unknown &&
      q.sortSequence?.trim()
    );
  }

  onSave(): void {
    this.templateForm.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.templateForm, 'terminationDate');

    if (this.templateForm.invalid) return;

    if (this.getEffDateError() || this.getTermDateError()) {
      this.templateForm.get('terminationDate')?.markAsTouched();
      return;
    }

    const invalidQuestion = this.assignedQuestions.find(q =>
      q.displayOrder == null || q.displayOrder === '' as unknown ||
      !q.sortSequence?.trim()
    );
    if (invalidQuestion) {
      this.snackBar.open('Display order and sequence are required for all questions', 'DISMISS', {
        duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
      });
      return;
    }

    const dupDisplayOrder = this.assignedQuestions.find((q, i) =>
      this.assignedQuestions.some((other, j) => i !== j && q.displayOrder != null && q.displayOrder === other.displayOrder)
    );
    if (dupDisplayOrder) {
      this.snackBar.open('Error: 13002 Duplicate sequence in template', 'DISMISS', {
        duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
      });
      return;
    }

    const dupSortSeq = this.assignedQuestions.find((q, i) =>
      this.assignedQuestions.some((other, j) => i !== j && q.sortSequence && q.sortSequence === other.sortSequence)
    );
    if (dupSortSeq) {
      this.snackBar.open('Error: 0319 Duplicate question number in template', 'DISMISS', {
        duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
      });
      return;
    }

    const dupAbbrSeq = this.assignedQuestions.find((q, i) =>
      this.assignedQuestions.some((other, j) => i !== j && q.abbrDispSeq != null && q.abbrDispSeq === other.abbrDispSeq)
    );
    if (dupAbbrSeq) {
      this.snackBar.open('Error: 13003 Duplicate abbreviated display sequence in template', 'DISMISS', {
        duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
      });
      return;
    }

    this.isSaving = true;

    this.saveTemplate(false);
  }

  private saveTemplate(resolveOverlaps: boolean): void {
    const formValue = this.templateForm.getRawValue();
    const templateId = this.generatedTemplateId;
    const effDate = DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '';
    const termDate = DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) || null;
    const donationType = formValue.donationType;

    const unsavedQuestions = this.assignedQuestions
      .filter(q => !this.savedQuestionCodes.has(q.questionCode))
      .map(q => ({
        ...q,
        donationType,
        templateId,
        effDate,
        termDate,
        screenerAsk: q.screenerAsk || '',
        abbrFlag: q.abbrFlag || '',
        abbrDispSeq: q.abbrDispSeq != null ? Number(q.abbrDispSeq) : null,
        repeatHhFlag: q.repeatHhFlag === 'Y' ? 'Y' : '',
        displayOrder: q.displayOrder != null ? Number(q.displayOrder) : null,
        parentQuestionCode: q.parentQuestionCode || '',
        subQuestionFlag: q.subQuestionFlag || '',
        parentRespFlag: q.parentRespFlag || '',
        randomizationFlag: q.randomizationFlag || 'N'
      }));

    if (unsavedQuestions.length === 0) {
      this.isSaving = false;
      AddEditTemplate.cachedTemplateId = '';
      this.save.emit(templateId);
      return;
    }

    const [firstQuestion, ...remainingQuestions] = unsavedQuestions;

    this.saveQuestion(firstQuestion as HHTemplateQuestionDto, resolveOverlaps)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success === false) {
            this.isSaving = false;
            this.showSaveError(result);
            return;
          }
          this.savedQuestionCodes.add(firstQuestion.questionCode);
          this.saveRemainingQuestions(remainingQuestions as HHTemplateQuestionDto[], templateId);
        },
        error: (error) => {
          this.isSaving = false;
          if (error.status === 409) {
            this.handle409Error(error);
            return;
          }
          this.showHttpError(error);
        }
      });
  }

  private saveRemainingQuestions(questions: HHTemplateQuestionDto[], templateId: string): void {
    if (questions.length === 0) {
      this.isSaving = false;
      this.savedQuestionCodes.clear();
      AddEditTemplate.cachedTemplateId = '';
      this.save.emit(templateId);
      return;
    }

    const requests = questions.map(q => this.saveQuestion(q, false));

    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.isSaving = false;
          const failed = results.find(r => r.success === false);
          if (failed) {
            questions.forEach((q, i) => {
              if (results[i].success !== false) this.savedQuestionCodes.add(q.questionCode);
            });
            this.showSaveError(failed);
            return;
          }
          questions.forEach(q => this.savedQuestionCodes.add(q.questionCode));
          this.savedQuestionCodes.clear();
          AddEditTemplate.cachedTemplateId = '';
          this.save.emit(templateId);
        },
        error: (error) => {
          this.isSaving = false;
          this.showHttpError(error);
        }
      });
  }

  private saveQuestion(
    question: HHTemplateQuestionDto,
    resolveOverlaps: boolean
  ): Observable<ReturnResult<HHTemplateQuestionDto>> {
    if (question.insertDate) {
      return this.hhService.updateTemplateQuestion(
        question.donationType, question.questionCode, question.templateId, question
      );
    }
    return this.hhService.createTemplateQuestion({ ...question, resolveOverlaps } as HHTemplateQuestionDto);
  }

  private handle409Error(error: { status: number; error?: { errorCode?: string; message?: string } }): void {
    const errorCode = error.error?.errorCode;
    const message = error.error?.message || 'Template date overlap detected.';
    if (errorCode === '17017') {
      this.snackBar.open(message, 'DISMISS', {
        duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
      });
    } else {
      this.showOverlapConfirmation(message);
    }
  }

  private showOverlapConfirmation(message: string): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '480px',
      disableClose: true,
      data: {
        title: 'Template Date Overlap',
        message,
        confirmText: 'Yes, Create',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.isSaving = true;
          this.saveTemplate(true);
        }
      });
  }

  private showSaveError(result: ReturnResult<HHTemplateQuestionDto>): void {
    const errResp = result.errorResponse;
    const errorMessage = errResp?.error
      ? `Error: ${errResp.errorCode ? errResp.errorCode + ' ' : ''}${errResp.error}`
      : (result.message || result.error || 'Error saving template');
    this.snackBar.open(errorMessage, 'DISMISS', {
      duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
    });
  }

  private showHttpError(error: Record<string, unknown>): void {
    const err = error['error'] as Record<string, unknown> | undefined;
    const errResp = err?.['errorResponse'] as { errorCode?: string; error?: string } | undefined;
    const errorMessage = errResp?.error
      ? `Error: ${errResp.errorCode ? errResp.errorCode + ' ' : ''}${errResp.error}`
      : ((err?.['message'] as string) || (error['message'] as string) || 'Error saving template');
    this.snackBar.open(errorMessage, 'DISMISS', {
      duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return moment.utc(dateStr).format('DD-MMM-YYYY').toUpperCase();
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
      default: return 'All';
    }
  }
}
