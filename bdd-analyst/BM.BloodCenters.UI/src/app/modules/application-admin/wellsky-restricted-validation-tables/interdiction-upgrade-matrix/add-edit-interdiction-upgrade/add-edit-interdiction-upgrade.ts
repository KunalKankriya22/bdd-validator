import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { InterdictionUpgradeMatrixService } from '../services/interdiction-upgrade-matrix.service';
import { HeaderService } from '@shared/services/header.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import {
  InterdictionCodeOption,
  InterdictionUpgradeMatrixModel,
  InterdictionUpgradeMatrixDto,
  UpdateInterdictionUpgradeMatrixDto
} from '../models/interdiction-upgrade-matrix.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

export interface InterdictionUpgradeFormData {
  sourceInterdiction: string;
  existingInterdiction: string;
  actionInterdiction: string;
  action: string;
  effectiveDate: string | null;  // format: YYYY-MM-DD
  terminationDate?: string | null;  // format: YYYY-MM-DD
}

@Component({
  selector: 'app-add-edit-interdiction-upgrade',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-interdiction-upgrade.html',
  styleUrls: ['./add-edit-interdiction-upgrade.scss']
})
export class AddEditInterdictionUpgrade implements OnInit, OnChanges, OnDestroy {
  private readonly headerService = inject(HeaderService);

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: InterdictionUpgradeMatrixModel | null = null;
  @Input() interdictionCodes: InterdictionCodeOption[] = [];
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<InterdictionUpgradeFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form: FormGroup;
  panelTitle: string = '';

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  editModeValues: {
    sourceInterdiction: string;
  } = {
      sourceInterdiction: ''
    };

  sourceInterdictionOptions: InterdictionCodeOption[] = [];
  existingInterdictionOptions: InterdictionCodeOption[] = [];
  actionInterdictionOptions: InterdictionCodeOption[] = [];
  actionOptions: string[] = ['Place', 'Release'];

  // Search controls and filtered options
  sourceSearchControl = new FormControl('');
  filteredSourceOptions: InterdictionCodeOption[] = [];

  existingSearchControl = new FormControl('');
  filteredExistingOptions: InterdictionCodeOption[] = [];

  actionInterdictionSearchControl = new FormControl('');
  filteredActionInterdictionOptions: InterdictionCodeOption[] = [];

  isLoadingOptions = false;
  isSaving = false;
  isFormDirty = false;
  private initialFormSnapshot = '';
  private activeInterdictionCodes: InterdictionCodeOption[] = [];

  // Minimum date for datepickers (chapter-aware today)
  minDate!: moment.Moment;

  // Store original values for edit mode (needed for update API)
  private originalValues: {
    sourceInterdiction: string;
    existingInterdiction: string;
    actionInterdiction: string;
  } = {
    sourceInterdiction: '',
    existingInterdiction: '',
    actionInterdiction: ''
  };

  private destroy$ = new Subject<void>();

  /**
   * Date filter for termination date picker
   * Blocks dates before chapter's local date and ensures termination date >= effective date
   */
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const chapterToday = moment().utcOffset(this.chapterOffset).startOf('day');
    const today = moment(chapterToday.format('YYYY-MM-DD')).startOf('day');

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

  constructor(
    private fb: FormBuilder,
    private interdictionUpgradeService: InterdictionUpgradeMatrixService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      sourceInterdiction: ['', [Validators.required]],
      existingInterdiction: ['', [Validators.required]],
      actionInterdiction: [''],  // Optional in both modes
      action: [''],  // Optional in both modes
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')] });
  }

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);

    this.populateFromInputCodes();
    this.setupDateValidationListeners();
    this.setupSearchControls();
    this.setupFormChangeTracking();

    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }
  }

  private populateFromInputCodes(): void {
    const codes = this.interdictionCodes || [];
    this.activeInterdictionCodes = codes;
    this.sourceInterdictionOptions = [...codes];
    this.existingInterdictionOptions = [...codes];
    this.actionInterdictionOptions = [...codes];
    this.filteredSourceOptions = [...this.sourceInterdictionOptions];
    this.filteredExistingOptions = [...this.existingInterdictionOptions];
    this.filteredActionInterdictionOptions = [...this.actionInterdictionOptions];
    this.isLoadingOptions = false;
    this.setupPanel();
  }

  private setupDateValidationListeners(): void {
    // Track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  private setupFormChangeTracking(): void {
    // Track form changes by comparing current value with initial snapshot
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isFormDirty = this.normalizeFormValue() !== this.initialFormSnapshot;
      });
  }

  private normalizeFormValue(): string {
    // Use getRawValue() to include disabled controls (like sourceInterdiction and effectiveDate in edit mode)
    const formValue = this.form.getRawValue();
    return JSON.stringify({
      sourceInterdiction: formValue.sourceInterdiction?.trim() || '',
      existingInterdiction: formValue.existingInterdiction?.trim() || '',
      actionInterdiction: formValue.actionInterdiction?.trim() || '',
      action: formValue.action || '',
      effectiveDate: formValue.effectiveDate ? String(formValue.effectiveDate) : null,
      terminationDate: formValue.terminationDate ? String(formValue.terminationDate) : null
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['interdictionCodes'] && !changes['interdictionCodes'].firstChange) {
      this.populateFromInputCodes();
    }
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
      this.panelTitle = 'Add New Interdiction Upgrade';
    } else {
      this.panelTitle = 'Edit Interdiction Upgrade';
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      sourceInterdiction: ''
    };

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    // Update minDate for add mode with current chapter offset
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);

    this.form.get('sourceInterdiction')?.enable();
    this.form.get('effectiveDate')?.enable();

    // Reset dropdown options to active codes only (remove any terminated codes added during edit)
    this.sourceInterdictionOptions = [...this.activeInterdictionCodes];
    this.existingInterdictionOptions = [...this.activeInterdictionCodes];
    this.actionInterdictionOptions = [...this.activeInterdictionCodes];
    this.filteredSourceOptions = [...this.activeInterdictionCodes];
    this.filteredExistingOptions = [...this.activeInterdictionCodes];
    this.filteredActionInterdictionOptions = [...this.activeInterdictionCodes];

    // Restore required validators for add mode
    // Only sourceInterdiction, existingInterdiction, and effectiveDate are required
    this.form.get('sourceInterdiction')?.setValidators([Validators.required]);
    this.form.get('existingInterdiction')?.setValidators([Validators.required]);
    this.form.get('effectiveDate')?.setValidators([Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]);
    // actionInterdiction and action are optional
    this.form.get('actionInterdiction')?.clearValidators();
    this.form.get('action')?.clearValidators();

    // Restore form-level validators for date range
    this.form.setValidators([DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]);

    // Update validity
    this.form.get('sourceInterdiction')?.updateValueAndValidity();
    this.form.get('existingInterdiction')?.updateValueAndValidity();
    this.form.get('actionInterdiction')?.updateValueAndValidity();
    this.form.get('action')?.updateValueAndValidity();
    this.form.get('effectiveDate')?.updateValueAndValidity();

    // Set initial snapshot and mark as not dirty
    this.initialFormSnapshot = this.normalizeFormValue();
    this.isFormDirty = false;
  }

  private populateFormForEdit(): void {
    if (this.data) {
      // Read data from API response (uses correct property names)
      const sourceInterdiction = this.data.sourceInterdiction || '';
      const existingInterdiction = this.data.existingInterdiction || '';
      const actionInterdiction = this.data.actionInterdiction || '';
      // Map backend Action (P/R) to frontend display (Place/Release)
      const backendAction = this.data.action || '';
      const action = this.mapBackendActionToFrontend(backendAction);

      // Store original values for update API (with backend typo property names for DTO)
      this.originalValues = {
        sourceInterdiction: sourceInterdiction,
        existingInterdiction: existingInterdiction,
        actionInterdiction: actionInterdiction
      };

      this.editModeValues = {
        sourceInterdiction
      };

      // Source interdiction is never editable in edit mode
      this.form.get('sourceInterdiction')?.disable();
      this.form.get('sourceInterdiction')?.clearValidators();

      // Effective date: only disable if the value is in the past (matches legacy FMB behavior)
      const effDate = this.data.effectiveDate ? moment(this.data.effectiveDate) : null;
      const chapterToday = moment().utcOffset(this.chapterOffset).startOf('day');
      if (effDate && effDate.clone().startOf('day').isBefore(chapterToday)) {
        this.form.get('effectiveDate')?.disable();
        this.form.get('effectiveDate')?.clearValidators();
      } else {
        this.form.get('effectiveDate')?.enable();
        this.form.get('effectiveDate')?.setValidators([Validators.required]);
      }

      this.form.get('existingInterdiction')?.setValidators([Validators.required]);
      this.form.get('actionInterdiction')?.clearValidators();
      this.form.get('action')?.clearValidators();
      this.form.get('terminationDate')?.clearValidators();

      // Update validity for all fields
      this.form.get('sourceInterdiction')?.updateValueAndValidity();
      this.form.get('existingInterdiction')?.updateValueAndValidity();
      this.form.get('effectiveDate')?.updateValueAndValidity();
      this.form.get('actionInterdiction')?.updateValueAndValidity();
      this.form.get('action')?.updateValueAndValidity();
      this.form.get('terminationDate')?.updateValueAndValidity();

      // Ensure current codes are in dropdown options even if terminated/inactive
      this.ensureCodeInOptions(existingInterdiction, 'existingInterdictionOptions');
      this.ensureCodeInOptions(actionInterdiction, 'actionInterdictionOptions');
      this.filteredExistingOptions = [...this.existingInterdictionOptions];
      this.filteredActionInterdictionOptions = [...this.actionInterdictionOptions];

      this.form.patchValue({
        sourceInterdiction,
        existingInterdiction,
        actionInterdiction,
        action,
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
      });

      this.form.markAsPristine();

      // Set initial snapshot and mark as not dirty - form should be pristine in edit mode initially
      this.initialFormSnapshot = this.normalizeFormValue();
      this.isFormDirty = false;
    }
  }

  private ensureCodeInOptions(code: string, optionsKey: 'existingInterdictionOptions' | 'actionInterdictionOptions'): void {
    if (code && !this[optionsKey].some(o => o.interCode === code)) {
      this[optionsKey] = [...this[optionsKey], { interCode: code, interDesc: '' }];
    }
  }

  private setupSearchControls(): void {
    // Source Interdiction search
    this.sourceSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredSourceOptions = this.sourceInterdictionOptions.filter(option =>
          option.interCode.toLowerCase().includes(term) || option.interDesc.toLowerCase().includes(term)
        );
      });

    // Existing Interdiction search
    this.existingSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredExistingOptions = this.existingInterdictionOptions.filter(option =>
          option.interCode.toLowerCase().includes(term) || option.interDesc.toLowerCase().includes(term)
        );
      });

    // Action Interdiction search
    this.actionInterdictionSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredActionInterdictionOptions = this.actionInterdictionOptions.filter(option =>
          option.interCode.toLowerCase().includes(term) || option.interDesc.toLowerCase().includes(term)
        );
      });
  }

  /**
   * Map backend Action value to frontend display value
   * Backend: P or R
   * Frontend: Place or Release
   */
  private mapBackendActionToFrontend(action: string): string {
    if (action === 'P') return 'Place';
    if (action === 'R') return 'Release';
    return action;
  }

  /**
   * Map frontend Action value to backend value
   * Frontend: Place or Release
   * Backend: P or R
   */
  private mapFrontendActionToBackend(action: string): string {
    if (action === 'Place') return 'P';
    if (action === 'Release') return 'R';
    return action;
  }

  /**
   * Format date for API - returns YYYY-MM-DD string without timezone
   */
  private formatDateForApi(date: moment.Moment | Date): string {
    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DD');
    }
    return moment(date).format('YYYY-MM-DD');
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.performSave(true);
  }

  onSaveAndCreateAnother(): void {
    this.performSave(false);
  }

  /**
   * Shared save logic for both onSave and onSaveAndCreateAnother
   * @param closeAfterSave - true: close panel after save, false: reset form for new entry
   */
  private performSave(closeAfterSave: boolean): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    // Map frontend Action (Place/Release) to backend (P/R)
    const backendAction = this.mapFrontendActionToBackend(formValue.action || '');

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: InterdictionUpgradeMatrixDto = {
        sourceInterdiction: (formValue.sourceInterdiction || '').trim(),
        existingInterdiction: (formValue.existingInterdiction || '').trim(),
        actionInterdiction: (formValue.actionInterdiction || '').trim(),
        action: backendAction,
        effectiveDate: formValue.effectiveDate ? this.formatDateForApi(formValue.effectiveDate) : null,
        terminationDate: formValue.terminationDate ? this.formatDateForApi(formValue.terminationDate) : null
      };
      apiCall = this.interdictionUpgradeService.addInterdictionUpgrade(addPayload);
    } else {
      const updatePayload: UpdateInterdictionUpgradeMatrixDto = {
        currentSourceInterdiction: this.originalValues.sourceInterdiction,
        currentExistingInterdiction: this.originalValues.existingInterdiction,
        currentActionInterdiction: this.originalValues.actionInterdiction,
        existingInterdiction: (formValue.existingInterdiction || '').trim(),
        actionInterdiction: (formValue.actionInterdiction || '').trim(),
        action: backendAction,
        effectiveDate: formValue.effectiveDate ? this.formatDateForApi(formValue.effectiveDate) : null,
        terminationDate: formValue.terminationDate ? this.formatDateForApi(formValue.terminationDate) : null
      };
      apiCall = this.interdictionUpgradeService.updateInterdictionUpgrade(updatePayload);
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
          const message = response?.message || 'Operation completed successfully';

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: InterdictionUpgradeFormData = {
            sourceInterdiction: (formValue.sourceInterdiction || '').trim(),
            existingInterdiction: (formValue.existingInterdiction || '').trim(),
            actionInterdiction: (formValue.actionInterdiction || '').trim(),
            action: formValue.action || '',
            effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate),
            terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
          };

          this.saveSuccess.emit(result);

          if (closeAfterSave) {
            this.closePanel.emit();
          } else {
            if (this.mode === 'edit') {
              this.mode = 'add';
              this.modeChange.emit('add');
              this.resetFormForAddMode();
              this.setupPanel();
            } else {
              this.resetFormForAddMode();
            }
          }
        },
        error: () => {
          // Error handling is done by auth interceptor
        }
      });
  }

  getSourceInterdictionError(): string {
    const control = this.form.get('sourceInterdiction');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Source Interdiction is required';
    }
    if (control.hasError('invalidOption')) {
      return 'Please select a valid Source Interdiction';
    }
    return '';
  }

  getExistingInterdictionError(): string {
    const control = this.form.get('existingInterdiction');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Existing Interdiction is required';
    }
    if (control.hasError('invalidOption')) {
      return 'Please select a valid Existing Interdiction';
    }
    return '';
  }

  getActionInterdictionError(): string {
    const control = this.form.get('actionInterdiction');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Action Interdiction is required';
    }
    if (control.hasError('invalidOption')) {
      return 'Please select a valid Action Interdiction';
    }
    return '';
  }

  getActionError(): string {
    const control = this.form.get('action');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Action is required';
    }
    return '';
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'),
      'Effective Date',
      'Termination Date',
      formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'),
      'Termination Date',
      'Effective Date',
      formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('terminationDate'),
      this.mode === 'edit'
    );
  }

  formatEffectiveDate(): string {
    const effDate = this.form.getRawValue().effectiveDate;
    if (!effDate) return '-';
    return moment(effDate).utcOffset(this.chapterOffset).format('DD-MMM-YYYY').toUpperCase();
  }

  get isFormValid(): boolean {
    return this.form?.valid ?? false;
  }
}
