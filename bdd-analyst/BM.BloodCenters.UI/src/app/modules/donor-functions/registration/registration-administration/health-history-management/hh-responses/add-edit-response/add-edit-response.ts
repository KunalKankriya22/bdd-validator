import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment, { Moment } from 'moment';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';

import { HHResponseModel, DropdownOption, PeriodTypeOption } from '../../models/health-history.model';
import { HealthHistoryService } from '../../services/health-history.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-add-edit-response',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-response.html',
  styleUrls: ['./add-edit-response.scss']
})
export class AddEditResponse implements OnInit, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: HHResponseModel | null = null;
  @Input() questionCode = '';
  @Input() questionDescription = '';
  @Output() save = new EventEmitter<{ response: HHResponseModel; keepOpen: boolean; message?: string }>();
  @Output() close = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  private hhService = inject(HealthHistoryService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private headerService = inject(HeaderService);

  responseForm!: FormGroup;
  isSaving = false;
  savingAction: 'save' | 'createAnother' | null = null;
  minDate: Moment;

  private lastChangedDateField: 'effective' | 'termination' = 'effective';

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTermDateError());

  // Dropdown options
  donorResponses: DropdownOption[] = [
    { code: 'Y', description: 'Yes' },
    { code: 'N', description: 'No' },
    { code: 'U', description: 'Unanswered' }
  ];
  readonly groupOptions = signal<DropdownOption[]>([]);
  readonly interdictionOptions = signal<DropdownOption[]>([]);
  deferralPeriods: DropdownOption[] = [
    { code: '1', description: '1' },
    { code: '2', description: '2' },
    { code: '3', description: '3' },
    { code: '5', description: '5' },
    { code: '7', description: '7' },
    { code: '10', description: '10' },
    { code: '14', description: '14' },
    { code: '21', description: '21' },
    { code: '28', description: '28' },
    { code: '30', description: '30' },
    { code: '56', description: '56' },
    { code: '90', description: '90' },
    { code: '180', description: '180' },
    { code: '365', description: '365' }
  ];
  readonly periodTypeOptions = signal<DropdownOption[]>([]);
  commentRequiredOptions: DropdownOption[] = [
    { code: 'Y', description: 'Yes' },
    { code: 'N', description: 'No' }
  ];
  manualAuditOptions: DropdownOption[] = [
    { code: 'Y', description: 'Yes' },
    { code: 'N', description: 'No' }
  ];
  additionalDateOptions: DropdownOption[] = [
    { code: 'Y', description: 'Yes' },
    { code: 'N', description: 'No' }
  ];

  // Search controls for searchable dropdowns
  readonly interdictionSearchCtrl = new FormControl('');
  readonly groupSearchCtrl = new FormControl('');
  readonly deferralPeriodSearchCtrl = new FormControl('');
  readonly periodTypeSearchCtrl = new FormControl('');

  private readonly interdictionSearch = signal('');
  private readonly groupSearch = signal('');
  private readonly deferralPeriodSearch = signal('');
  private readonly periodTypeSearch = signal('');

  readonly filteredInterdictions = computed(() =>
    this.filterItems(this.interdictionOptions(), this.interdictionSearch())
  );
  readonly filteredGroups = computed(() =>
    this.filterItems(this.groupOptions(), this.groupSearch())
  );
  readonly filteredDeferralPeriods = computed(() =>
    this.filterItems(this.deferralPeriods, this.deferralPeriodSearch())
  );
  readonly filteredPeriodTypes = computed(() =>
    this.filterItems(this.periodTypeOptions(), this.periodTypeSearch())
  );

  /**
   * Cross-field validator for deferral period and period type.
   * Business rule: If deferralPeriod is provided, periodType is required.
   * Note: periodType can exist without deferralPeriod (e.g., "Lifetime" deferrals).
   */
  private static deferralPeriodTypeValidator(control: AbstractControl): ValidationErrors | null {
    const deferralPeriod = control.get('deferralPeriod')?.value;
    const periodType = control.get('periodType')?.value;

    if (deferralPeriod && !periodType) {
      // Period type required when deferral period is provided
      return { periodTypeRequired: true };
    }

    // Note: Deferral period is NOT required when period type is provided
    // (e.g., "Lifetime" deferrals don't need a numeric period)

    return null;
  }

  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  get termMinDate(): Moment {
    const effDate = this.responseForm?.get('effectiveDate')?.value;
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
    this.initializeForm();
    this.setupSearchSubscriptions();
    this.loadDropdowns();

    if (this.mode === 'edit' && this.data) {
      this.populateForm();
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.responseForm, this.chapterOffset);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.responseForm = this.fb.group({
      donorResponse: ['', [Validators.required]],
      answerCode: ['', [Validators.required, Validators.maxLength(5)]],
      answerDescription: ['', [Validators.required, Validators.maxLength(1000)]],
      group: [''],
      interdiction: [''],
      deferralPeriod: [null],
      periodType: [''],
      commentRequired: ['N'],
      manualAudit: ['N'],
      additionalDate: ['N'],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate'),
        AddEditResponse.deferralPeriodTypeValidator
      ]
    });

    this.responseForm.get('effectiveDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.responseForm.get('terminationDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  private setupSearchSubscriptions(): void {
    this.interdictionSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.interdictionSearch.set(v || ''));

    this.groupSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.groupSearch.set(v || ''));

    this.deferralPeriodSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.deferralPeriodSearch.set(v || ''));

    this.periodTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.periodTypeSearch.set(v || ''));
  }

  private filterItems(items: DropdownOption[], search: string): DropdownOption[] {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(item =>
      (item.code || '').toLowerCase().includes(lower) ||
      (item.description || '').toLowerCase().includes(lower)
    );
  }

  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
  }

  private loadDropdowns(): void {
    this.hhService.getPeriodTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types: PeriodTypeOption[]) => {
          this.periodTypeOptions.set(types.map(t => ({ code: t.key, description: t.value })));
        }
      });

    this.hhService.getInterdictionCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.interdictionOptions.set(codes.map(c => ({ code: c.code, description: c.description })));
        }
      });

    // Load group codes - will reload when response changes
    this.loadGroupCodes();

    // Reload group codes when donorResponse changes
    this.responseForm.get('donorResponse')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadGroupCodes();
      });
  }

  private loadGroupCodes(): void {
    const response = this.responseForm.get('donorResponse')?.value;
    this.hhService.getGroupCodes(this.questionCode, response)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => {
          this.groupOptions.set(groups.map(g => ({ code: g.code, description: g.description })));
        }
      });
  }

  private populateForm(): void {
    if (!this.data) return;
    this.responseForm.patchValue({
      donorResponse: this.data.response || this.data.donorResponse,
      answerCode: this.data.answerCode,
      answerDescription: this.data.answerDescription,
      group: this.data.groupCode,
      interdiction: this.data.interdictionCode,
      deferralPeriod: this.data.deferralPeriod != null ? String(this.data.deferralPeriod) : null,
      periodType: this.data.periodType,
      commentRequired: this.data.commentRequired || 'N',
      manualAudit: this.data.manualAuditFlag || 'N',
      additionalDate: this.data.additionalDateFlag || 'N',
      effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
      terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
    });
    this.responseForm.markAsPristine();
    DateFieldValidationUtility.setupEditModeValidators(this.responseForm, this.chapterOffset);
  }

  onSubmit(keepOpen: boolean): void {
    this.responseForm.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.responseForm, 'terminationDate');

    if (this.responseForm.invalid) return;

    if (this.getEffDateError() || this.getTermDateError()) {
      this.responseForm.get('terminationDate')?.markAsTouched();
      return;
    }

    this.isSaving = true;
    this.savingAction = keepOpen ? 'createAnother' : 'save';
    const formValue = this.responseForm.getRawValue();

    const effDate = DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate);
    const termDate = DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate);

    const payload = {
      questionCode: this.questionCode,
      response: formValue.donorResponse,
      answerCode: formValue.answerCode,
      answerDescription: formValue.answerDescription,
      groupCode: formValue.group || '',
      interdictionCode: formValue.interdiction || '',
      deferralPeriod: formValue.deferralPeriod ? Number(formValue.deferralPeriod) : null,
      periodType: formValue.periodType || null,
      minimumPeriod: 0,
      commentRequired: formValue.commentRequired || 'N',
      manualAuditFlag: formValue.manualAudit === 'Y' ? 'Y' : null,
      additionalDateFlag: formValue.additionalDate === 'Y' ? 'Y' : null,
      effectiveDate: effDate,
      terminationDate: termDate
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const save$ = this.mode === 'add'
      ? this.hhService.createAnswer(payload as any)
      : this.hhService.updateAnswer(this.questionCode, payload.answerCode, payload as any);

    save$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isSaving = false;
          this.savingAction = null;
          if (result.success === false) {
            const errorCode = result.errorCode || result.errorResponse?.errorCode || '';
            const errorMsg = result.errorResponse?.error || result.message || 'An error occurred';
            const displayMsg = errorCode ? `Error: ${errorCode}: ${errorMsg}` : errorMsg;
            this.snackBar.open(displayMsg, 'DISMISS', {
              duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
            });
            return;
          }
          this.save.emit({ response: payload as any, keepOpen, message: result.message });
          if (keepOpen) {
            this.resetForm();
          }
        },
        error: (error) => {
          this.isSaving = false;
          this.savingAction = null;
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

  onAnswerCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    if (input.value !== upper) {
      input.value = upper;
      this.responseForm.get('answerCode')?.setValue(upper, { emitEvent: false });
    }
  }

  private resetForm(): void {
    this.responseForm.reset();
    this.responseForm.markAsUntouched();
    this.responseForm.markAsPristine();
    DateFieldValidationUtility.setupAddModeValidators(this.responseForm, this.chapterOffset);
  }

  onCancel(): void {
    this.close.emit();
  }

  get descriptionCharsRemaining(): number {
    const desc = this.responseForm.get('answerDescription')?.value || '';
    return 1000 - desc.length;
  }

  getTitle(): string {
    return this.mode === 'add' ? 'Add New Response' : 'Edit Response';
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit' && !this.responseForm.dirty) {
      return false;
    }
    return this.responseForm.valid && !this.responseForm.hasError('dateRangeInvalid') && !this.responseForm.hasError('periodTypeRequired');
  }

  // --- Date Validation (matching alternate-id pattern) ---
  getEffDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.responseForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.responseForm.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTermDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.responseForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.responseForm.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onEffDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.responseForm.get('effectiveDate')
    );
  }

  onTermDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.responseForm.get('terminationDate'), this.mode === 'edit'
    );
  }
}
