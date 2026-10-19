import { Component, OnInit, OnDestroy, Inject, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import moment, { Moment } from 'moment';
import { Subject, forkJoin, distinctUntilChanged, takeUntil } from 'rxjs';

import { HHResponseCommentModel, HHResponseCommentContext } from '../../models/health-history.model';
import { HealthHistoryService } from '../../services/health-history.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-response-comments',
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
    MatDialogModule,
    MatSnackBarModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './response-comments.html',
  styleUrls: ['./response-comments.scss']
})
export class ResponseComments implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private hhService = inject(HealthHistoryService);
  private headerService = inject(HeaderService);
  private snackBar = inject(MatSnackBar);

  comments: HHResponseCommentModel[] = [];
  isAddingNew = false;
  isSaving = false;
  newCommentForm!: FormGroup;
  minDate: Moment;
  pendingTermDates = new Map<string, string>();
  pendingCommentEdits = new Map<string, string>();

  private lastChangedDateField: 'effective' | 'termination' = 'effective';

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTermDateError());

  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  get termMinDate(): Moment {
    const effDate = this.newCommentForm?.get('effDate')?.value;
    if (effDate && moment.isMoment(effDate) && effDate.isValid()) {
      return effDate.isAfter(this.minDate) ? effDate : this.minDate;
    }
    return this.minDate;
  }

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ResponseComments>,
    @Inject(MAT_DIALOG_DATA) public context: HHResponseCommentContext
  ) {
    this.minDate = this.getChapterMinDate();

    effect(() => {
      this.minDate = this.getChapterMinDate();
    });

    this.newCommentForm = this.fb.group({
      commentCode: ['', [Validators.required, Validators.maxLength(5)]],
      commentDet: ['', [Validators.required, Validators.maxLength(240)]],
      effDate: [null, [Validators.required]],
      termDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

    this.newCommentForm.get('effDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.newCommentForm.get('termDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  ngOnInit(): void {
    this.loadComments();
    DateFieldValidationUtility.setupAddModeValidators(this.newCommentForm, this.chapterOffset);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadComments(): void {
    this.hhService.getResponseComments(this.context.questionCode, this.context.answerCode, this.context.response)
      .pipe(takeUntil(this.destroy$))
      .subscribe(comments => {
        this.comments = comments;
      });
  }

  onAddNewComment(): void {
    this.isAddingNew = true;
    this.newCommentForm.reset();
    this.newCommentForm.markAsUntouched();
    DateFieldValidationUtility.setupAddModeValidators(this.newCommentForm, this.chapterOffset);
  }

  onCommentCodeInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value?.toUpperCase();
    this.newCommentForm.get('commentCode')?.setValue(value, { emitEvent: false });
    this.validateCommentCodeUniqueness(value);
  }

  private validateCommentCodeUniqueness(code: string): void {
    const ctrl = this.newCommentForm.get('commentCode');
    if (!ctrl || !code) return;
    const isDuplicate = this.comments.some(c => c.commentCode?.toUpperCase() === code.toUpperCase());
    if (isDuplicate) {
      ctrl.setErrors({ ...ctrl.errors, duplicateCommentCode: true });
    } else if (ctrl.hasError('duplicateCommentCode')) {
      const errors = { ...ctrl.errors };
      delete errors['duplicateCommentCode'];
      ctrl.setErrors(Object.keys(errors).length ? errors : null);
    }
  }

  onExistingTermDateChange(comment: HHResponseCommentModel, event: Moment | null): void {
    if (!comment.commentCode || !event) return;
    this.pendingTermDates.set(comment.commentCode, event.format('YYYY-MM-DD') + 'T00:00:00Z');
  }

  onCommentTextChange(comment: HHResponseCommentModel, event: Event): void {
    if (!comment.commentCode) return;
    const value = (event.target as HTMLInputElement).value;
    this.pendingCommentEdits.set(comment.commentCode, value);
  }

  getCommentValue(comment: HHResponseCommentModel): string {
    if (comment.commentCode && this.pendingCommentEdits.has(comment.commentCode)) {
      return this.pendingCommentEdits.get(comment.commentCode) || '';
    }
    return comment.commentDet || '';
  }

  get isFormValid(): boolean {
    if (!this.isAddingNew && this.pendingTermDates.size === 0 && this.pendingCommentEdits.size === 0) return false;
    if (!this.isAddingNew) return true;
    return this.newCommentForm.valid && !this.newCommentForm.hasError('dateRangeInvalid');
  }

  get hasPendingChanges(): boolean {
    return this.pendingTermDates.size > 0 || this.pendingCommentEdits.size > 0 || this.isAddingNew;
  }

  onSave(): void {
    if (!this.isAddingNew && this.pendingTermDates.size === 0 && this.pendingCommentEdits.size === 0) {
      this.dialogRef.close();
      return;
    }

    if ((this.pendingTermDates.size > 0 || this.pendingCommentEdits.size > 0) && !this.isAddingNew) {
      this.saveExistingCommentChanges();
      return;
    }

    if ((this.pendingTermDates.size > 0 || this.pendingCommentEdits.size > 0) && this.isAddingNew) {
      this.saveNewCommentThenExistingChanges();
      return;
    }

    this.newCommentForm.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.newCommentForm, 'termDate');

    const commentCode = this.newCommentForm.get('commentCode')?.value;
    if (commentCode) {
      this.validateCommentCodeUniqueness(commentCode);
    }

    if (this.newCommentForm.invalid) return;
    if (this.getEffDateError() || this.getTermDateError()) return;

    this.isSaving = true;
    const formValue = this.newCommentForm.getRawValue();
    const comment: HHResponseCommentModel = {
      commentCode: formValue.commentCode,
      commentDet: formValue.commentDet,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) ?? undefined
    };

    this.hhService.createResponseComment(this.context.questionCode, this.context.answerCode, this.context.response, comment)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isSaving = false;
          if (result.success === false) {
            const errorCode = result.errorCode || result.errorResponse?.errorCode || '';
            const errorMsg = result.errorResponse?.error || result.message || 'An error occurred';
            const displayMsg = errorCode ? `Error: ${errorCode}: ${errorMsg}` : errorMsg;
            this.snackBar.open(displayMsg, 'DISMISS', {
              duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
            });
            return;
          }
          this.snackBar.open('Comment saved successfully', 'DISMISS', {
            duration: 3000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['success-snackbar']
          });
          this.dialogRef.close({ saved: true });
        },
        error: (error) => {
          this.isSaving = false;
          const errResp = error?.error;
          const errorCode = errResp?.errorCode || errResp?.errorResponse?.errorCode || '';
          const errorMsg = errResp?.errorResponse?.error || errResp?.message || 'An error occurred while saving';
          const displayMsg = errorCode ? `Error: ${errorCode}: ${errorMsg}` : errorMsg;
          this.snackBar.open(displayMsg, 'DISMISS', {
            duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
          });
        }
      });
  }

  private saveExistingCommentChanges(): void {
    this.isSaving = true;
    const allCommentCodes = new Set([
      ...this.pendingTermDates.keys(),
      ...this.pendingCommentEdits.keys()
    ]);

    const updates = Array.from(allCommentCodes).map(commentCode => {
      const comment = this.comments.find(c => c.commentCode === commentCode);
      const payload: HHResponseCommentModel = {
        commentCode,
        commentDet: this.pendingCommentEdits.has(commentCode)
          ? this.pendingCommentEdits.get(commentCode) || ''
          : comment?.commentDet || '',
        effDate: comment?.effDate || '',
        termDate: this.pendingTermDates.has(commentCode)
          ? this.pendingTermDates.get(commentCode)
          : comment?.termDate
      };
      return this.hhService.updateResponseComment(
        this.context.questionCode, this.context.answerCode, this.context.response, commentCode, payload
      );
    });

    forkJoin(updates)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.isSaving = false;
          const failedResults = results.filter(r => r.success === false);
          if (failedResults.length > 0) {
            const failed = failedResults[0];
            const errorCode = failed.errorResponse?.errorCode || failed.errorCode || failed.statusCode || '';
            const errMsg = failed.errorResponse?.error || failed.message || failed.error || 'Error updating comment';
            const displayMsg = errorCode ? `Error: ${errorCode} ${errMsg}` : errMsg;
            this.snackBar.open(displayMsg, 'DISMISS', {
              duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
            });
            this.pendingTermDates.clear();
            this.pendingCommentEdits.clear();
                        this.loadComments();
            return;
          }
          this.pendingTermDates.clear();
          this.pendingCommentEdits.clear();
                    this.snackBar.open('Comment updated successfully', 'DISMISS', {
            duration: 3000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['success-snackbar']
          });
          this.dialogRef.close({ saved: true });
        },
        error: (error) => {
          this.isSaving = false;
          this.pendingTermDates.clear();
          this.pendingCommentEdits.clear();
                    this.loadComments();
          const body = error.error;
          const errorCode = body?.errorResponse?.errorCode || body?.errorCode || body?.statusCode || error.status || '';
          const errMsg = body?.errorResponse?.error || body?.message || body?.error || error.message || 'Error updating comment';
          const displayMsg = errorCode ? `Error: ${errorCode} ${errMsg}` : errMsg;
          this.snackBar.open(displayMsg, 'DISMISS', {
            duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
          });
        }
      });
  }

  private saveNewCommentThenExistingChanges(): void {
    this.newCommentForm.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.newCommentForm, 'termDate');

    const commentCode = this.newCommentForm.get('commentCode')?.value;
    if (commentCode) {
      this.validateCommentCodeUniqueness(commentCode);
    }

    if (this.newCommentForm.invalid) return;
    if (this.getEffDateError() || this.getTermDateError()) return;

    this.isSaving = true;
    const formValue = this.newCommentForm.getRawValue();
    const comment: HHResponseCommentModel = {
      commentCode: formValue.commentCode,
      commentDet: formValue.commentDet,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) ?? undefined
    };

    this.hhService.createResponseComment(this.context.questionCode, this.context.answerCode, this.context.response, comment)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success === false) {
            this.isSaving = false;
            const errorCode = result.errorCode || result.errorResponse?.errorCode || '';
            const errorMsg = result.errorResponse?.error || result.message || 'An error occurred';
            const displayMsg = errorCode ? `Error: ${errorCode}: ${errorMsg}` : errorMsg;
            this.snackBar.open(displayMsg, 'DISMISS', {
              duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
            });
            return;
          }
          this.saveExistingCommentChanges();
        },
        error: (error) => {
          this.isSaving = false;
          const errResp = error?.error;
          const errorCode = errResp?.errorCode || errResp?.errorResponse?.errorCode || '';
          const errorMsg = errResp?.errorResponse?.error || errResp?.message || 'An error occurred while saving';
          const displayMsg = errorCode ? `Error: ${errorCode}: ${errorMsg}` : errorMsg;
          this.snackBar.open(displayMsg, 'DISMISS', {
            duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
          });
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    return moment(dateStr).format('DD-MMM-YYYY').toUpperCase();
  }

  parseDate(dateStr: string): Moment {
    return moment(dateStr);
  }

  getEffDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.newCommentForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.newCommentForm.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTermDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.newCommentForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.newCommentForm.get('termDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onEffDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.newCommentForm.get('effDate')
    );
  }

  onTermDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.newCommentForm.get('termDate')
    );
  }
}
