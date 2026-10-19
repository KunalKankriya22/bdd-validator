import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { AccessManagementService } from '../services/access-management.service';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import {
  AccessManagementModel,
  AccessManagementDto,
  UpdateAccessManagementDto
} from '../models/access-management.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

export interface AccessManagementFormData {
  chapterId: string;
  type: string;
  functionName: string;
  alertRequired: string;
  effectiveDate: string | null;
  terminationDate?: string | null;
}

@Component({
  selector: 'app-add-edit-access-management',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-access-management.html',
  styleUrls: ['./add-edit-access-management.scss']
})
export class AddEditAccessManagement implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: AccessManagementModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<AccessManagementFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form: FormGroup;
  panelTitle: string = '';

  allChapterIdOptions: string[] = [];
  chapterIdOptions: string[] = [];
  chapterIdSearchControl = new FormControl('');

  typeOptions: string[] = [];

  allFunctionNameOptions: string[] = [];
  functionNameOptions: string[] = [];
  functionNameSearchControl = new FormControl('');

  alertRequiredOptions: string[] = [];

  isLoadingOptions = false;
  isSaving = false;

  /** Sentinel values for disabled mat-option rows in the panel (loading / empty). */
  readonly selectPanelLoadingValue = '__ACCESS_MGMT_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__ACCESS_MGMT_PANEL_EMPTY__';

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );

  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError()
  );

  // Store original values for edit mode
  private originalValues: {
    chapterId: string;
    type: string;
    functionName: string;
    alertRequired: string;
    effectiveDate: string | Date | null;
    terminationDate: string | Date | null;
  } = {
    chapterId: '',
    type: '',
    functionName: '',
    alertRequired: '',
    effectiveDate: null,
    terminationDate: null
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private accessManagementService: AccessManagementService,
    private snackbarService: SnackbarService,
    private headerService: HeaderService,
    private chapterTimezoneService: ChapterTimezoneService
  ) {
    this.form = this.fb.group({
      chapterId: ['', [Validators.required]],
      type: ['', [Validators.required]],
      functionName: ['', [Validators.required]],
      alertRequired: ['', [Validators.required]],
      effectiveDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]],
      terminationDate: [null]
    }, { validators: [DateFieldValidationUtility.dateRangeValidator()] });
  }

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

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

  ngOnInit(): void {
    this.loadFormOptions();
    this.setupChapterIdSearch();
    this.setupFunctionNameSearch();
    this.setupDateValidationListeners();

    if (this.mode === 'edit') {
      this.setupEditModeValidators();
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }
  }

  /**
   * Load form options from service
   */
  private loadFormOptions(): void {
    this.isLoadingOptions = true;

    this.accessManagementService.getFormOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allChapterIdOptions = response.chapterIds || [];
          this.chapterIdOptions = [...this.allChapterIdOptions];

          this.typeOptions = response.types || [];

          this.allFunctionNameOptions = response.functionNames || [];
          this.functionNameOptions = [...this.allFunctionNameOptions];

          this.alertRequiredOptions = response.alertRequiredOptions || [];

          this.isLoadingOptions = false;
          this.setupPanel();
        },
        error: () => {
          this.isLoadingOptions = false;
          this.setupPanel();
        }
      });
  }

  /**
   * Setup Chapter ID search
   */
  private setupChapterIdSearch(): void {
    this.chapterIdSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        if (search && search.length >= 1) {
          this.chapterIdOptions = this.allChapterIdOptions.filter(o =>
            o.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.chapterIdOptions = [...this.allChapterIdOptions];
        }
      });
  }

  /**
   * Setup Function Name search
   */
  private setupFunctionNameSearch(): void {
    this.functionNameSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        if (search && search.length >= 1) {
          this.functionNameOptions = this.allFunctionNameOptions.filter(o =>
            o.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.functionNameOptions = [...this.allFunctionNameOptions];
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
      this.panelTitle = 'Add Survey Access';
    } else {
      this.panelTitle = 'Edit Survey Access';
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    // Re-enable fields that were disabled in edit mode
    this.form.get('chapterId')?.enable();
    this.form.get('effectiveDate')?.enable();

    DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
  }

  /**
   * Setup validators for Edit mode.
   * Termination Date is optional and can be cleared.
   */
  private setupEditModeValidators(): void {
    const effectiveDateControl = this.form.get('effectiveDate');
    const terminationDateControl = this.form.get('terminationDate');

    // Effective Date is disabled in edit mode
    if (effectiveDateControl) {
      effectiveDateControl.clearValidators();
      effectiveDateControl.disable();
      effectiveDateControl.updateValueAndValidity();
    }

    // Termination Date is optional in edit mode
    if (terminationDateControl) {
      terminationDateControl.clearValidators();
      terminationDateControl.setValidators([
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
      ]);
      terminationDateControl.updateValueAndValidity();
    }
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    this.originalValues = {
      chapterId: this.data.chapterId || '',
      type: this.data.type || '',
      functionName: this.data.functionName || '',
      alertRequired: this.data.alertRequired || '',
      effectiveDate: this.data.effectiveDate || null,
      terminationDate: this.data.terminationDate || null
    };

    const effectiveDate = this.data.effectiveDate
      ? moment(this.data.effectiveDate, 'YYYY-MM-DD')
      : null;
    const terminationDate = this.data.terminationDate
      ? moment(this.data.terminationDate, 'YYYY-MM-DD')
      : null;

    this.form.patchValue({
      chapterId: this.data.chapterId || '',
      type: this.data.type || '',
      functionName: this.data.functionName || '',
      alertRequired: this.data.alertRequired || '',
      effectiveDate: effectiveDate,
      terminationDate: terminationDate
    });

    // Disable non-editable fields in edit mode
    this.form.get('chapterId')?.disable();
    this.form.get('effectiveDate')?.disable();
  }

  onSave(): void {
    if (this.form.invalid || this.isSaving) return;

    this.isSaving = true;
    const formValue = this.form.getRawValue(); // Use getRawValue to include disabled fields

    const effectiveDate = DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate);
    const terminationDate = DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate);

    if (this.mode === 'add') {
      this.addRecord(effectiveDate, terminationDate);
    } else {
      this.updateRecord(effectiveDate, terminationDate);
    }
  }

  private addRecord(effectiveDate: string | null, terminationDate: string | null): void {
    const formValue = this.form.value;

    const dto: AccessManagementDto = {
      chapterId: formValue.chapterId,
      type: formValue.type,
      functionName: formValue.functionName,
      alertRequired: formValue.alertRequired,
      effectiveDate: effectiveDate,
      terminationDate: terminationDate
    };

    this.accessManagementService.addAccessManagement(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.snackbarService.showSuccess('Survey access added successfully');
          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: () => {
          this.isSaving = false;
        }
      });
  }

  private updateRecord(effectiveDate: string | null, terminationDate: string | null): void {
    const formValue = this.form.getRawValue(); // Use getRawValue to include disabled fields

    const dto: UpdateAccessManagementDto = {
      currentChapterId: this.originalValues.chapterId,
      currentType: this.originalValues.type,
      currentFunctionName: this.originalValues.functionName,
      chapterId: formValue.chapterId,
      type: formValue.type,
      functionName: formValue.functionName,
      alertRequired: formValue.alertRequired,
      effectiveDate: effectiveDate,
      terminationDate: terminationDate
    };

    this.accessManagementService.updateAccessManagement(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.snackbarService.showSuccess('Survey access updated successfully');
          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: () => {
          this.isSaving = false;
        }
      });
  }

  onSaveAndCreateAnother(): void {
    if (this.form.invalid || this.isSaving) return;

    this.isSaving = true;
    const formValue = this.form.value;

    const effectiveDate = DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate);
    const terminationDate = DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate);

    const dto: AccessManagementDto = {
      chapterId: formValue.chapterId,
      type: formValue.type,
      functionName: formValue.functionName,
      alertRequired: formValue.alertRequired,
      effectiveDate: effectiveDate,
      terminationDate: terminationDate
    };

    this.accessManagementService.addAccessManagement(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.snackbarService.showSuccess('Survey access added successfully');
          this.saveSuccess.emit();
          this.resetFormForAddMode();
        },
        error: () => {
          this.isSaving = false;
        }
      });
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  get isFormValid(): boolean {
    if (!this.form.valid) {
      return false;
    }

    // In edit mode, also check if there are any changes
    if (this.mode === 'edit') {
      return this.hasFormChanged();
    }

    return true;
  }

  /**
   * Check if form values have changed from original values in edit mode
   */
  private hasFormChanged(): boolean {
    const currentValues = this.form.getRawValue();

    // Check if type changed
    if (currentValues.type !== this.originalValues.type) {
      return true;
    }

    // Check if functionName changed
    if (currentValues.functionName !== this.originalValues.functionName) {
      return true;
    }

    // Check if alertRequired changed
    if (currentValues.alertRequired !== this.originalValues.alertRequired) {
      return true;
    }

    const normalizeDate = (date: any) =>
    date && moment(date).isValid() ? moment(date).format('YYYY-MM-DD') : null;

    const currentTerminationDate = normalizeDate(currentValues.terminationDate);
    const originalTerminationDate = normalizeDate(this.originalValues.terminationDate);

    if (currentTerminationDate !== originalTerminationDate) {
      return true;
    }

    return false;
  }

  // Error getters
  getChapterIdError(): string {
    const control = this.form.get('chapterId');
    if (control?.hasError('required')) return 'Chapter ID is required';
    return '';
  }

  getTypeError(): string {
    const control = this.form.get('type');
    if (control?.hasError('required')) return 'Type is required';
    return '';
  }

  getFunctionNameError(): string {
    const control = this.form.get('functionName');
    if (control?.hasError('required')) return 'Function Name is required';
    return '';
  }

  getAlertRequiredError(): string {
    const control = this.form.get('alertRequired');
    if (control?.hasError('required')) return 'Alert Required is required';
    return '';
  }

  private setupDateValidationListeners(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });
    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });
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

  /**
   * Format date for display in readonly fields
   */
  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}-${d
      .toLocaleString('en-US', { month: 'short' })
      .toUpperCase()}-${d.getFullYear()}`;
  }
}
