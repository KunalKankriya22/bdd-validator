import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { noWhitespaceOnlyValidator } from '@shared/validators/input.validators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import moment from 'moment';

import { ExternalBcDataTranslateService } from '../services/external-bc-data-translate.service';
import {
  ExternalBcDataTranslateModel,
  ExternalBcDataTranslateDto,
  UpdateExternalBcDataTranslateDto,
  CodeDescriptionOption
} from '../models/external-bc-data-translate.model';
import { EXTERNAL_BC_DATA_TRANSLATE_ERROR_MESSAGES } from '../constants/error-messages.constants';
import { ExternalBcDataTranslateErrorHandler } from '../utils/error-handler.utils';

export interface ConversionCodeFormData {
  sourceType: string;
  sourceValue: string;
  targetType: string;
  targetValue: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
}

@Component({
  selector: 'app-add-edit-conversion-code',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-conversion-code.html',
  styleUrls: ['./add-edit-conversion-code.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditConversionCode implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ExternalBcDataTranslateModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<ConversionCodeFormData>();

  form!: FormGroup;
  panelTitle = '';
  isSaving = false;
  isLoadingDropdowns = false;
  isLoadingTargetValues = signal<boolean>(false);

  // Min date for effective date picker (chapter local date)
  minDate!: moment.Moment;

  // Dropdown options - loaded from API
  sourceIdOptions: CodeDescriptionOption[] = [];
  sourceCodeTypeOptions: CodeDescriptionOption[] = [];
  targetTypeOptions: CodeDescriptionOption[] = [];
  targetValueOptions: CodeDescriptionOption[] = [];

  // Search controls for dropdowns
  sourceIdSearchCtrl = new FormControl('');
  sourceCodeTypeSearchCtrl = new FormControl('');
  targetTypeSearchCtrl = new FormControl('');
  targetValueSearchCtrl = new FormControl('');

  // Signals for filtered options
  sourceIdOptionsSignal = signal<CodeDescriptionOption[]>([]);
  sourceCodeTypeOptionsSignal = signal<CodeDescriptionOption[]>([]);
  targetTypeOptionsSignal = signal<CodeDescriptionOption[]>([]);
  targetValueOptionsSignal = signal<CodeDescriptionOption[]>([]);

  // Convert FormControl values to signals
  sourceIdSearchSignal = toSignal(this.sourceIdSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  sourceCodeTypeSearchSignal = toSignal(this.sourceCodeTypeSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  targetTypeSearchSignal = toSignal(this.targetTypeSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  targetValueSearchSignal = toSignal(this.targetValueSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  filteredSourceIdOptions = computed(() => {
    const searchTerm = this.sourceIdSearchSignal()?.toLowerCase() || '';
    const options = this.sourceIdOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.code.toLowerCase().includes(searchTerm) ||
      option.description.toLowerCase().includes(searchTerm)
    );
  });

  filteredSourceCodeTypeOptions = computed(() => {
    const searchTerm = this.sourceCodeTypeSearchSignal()?.toLowerCase() || '';
    const options = this.sourceCodeTypeOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.code.toLowerCase().includes(searchTerm) ||
      option.description.toLowerCase().includes(searchTerm)
    );
  });

  filteredTargetTypeOptions = computed(() => {
    const searchTerm = this.targetTypeSearchSignal()?.toLowerCase() || '';
    const options = this.targetTypeOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.code.toLowerCase().includes(searchTerm) ||
      option.description.toLowerCase().includes(searchTerm)
    );
  });

  filteredTargetValueOptions = computed(() => {
    const searchTerm = this.targetValueSearchSignal()?.toLowerCase() || '';
    const options = this.targetValueOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.code.toLowerCase().includes(searchTerm) ||
      option.description.toLowerCase().includes(searchTerm)
    );
  });

  editModeValues = {
    sourceCodeDescription: ''
  };

  minEffectiveDate: moment.Moment | null = null;
  minTerminationDate: moment.Moment | null = null;

  // Date filter functions for chapter-aware date pickers
  effectiveDateFilterFn!: (date: moment.Moment | null) => boolean;
  terminationDateFilterFn!: (date: moment.Moment | null) => boolean;

  private originalValues = {
    sourceId: '',
    targetId: '',
    sourceCodeType: '',
    targetCodeType: '',
    targetValue: '',
    sourceValue: '',
    effectiveDate: null as Date | null
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private externalBcDataTranslateService: ExternalBcDataTranslateService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService
  ) {}

  ngOnInit(): void {
    // Get chapter timezone and set minDate based on chapter local date
    const chapterTimezone = this.headerService.chapterTimeZone();
    this.minDate = DateFieldValidationUtility.getMinDate(chapterTimezone);

    // Create chapter-aware date filter for effective date picker
    this.effectiveDateFilterFn = DateFieldValidationUtility.createEffectiveDateFilter(chapterTimezone);

    // Create chapter-aware date filter for termination date picker
    // This filter ensures termination date is not in the past (based on chapter timezone)
    // and is not before the effective date
    this.terminationDateFilterFn = (date: moment.Moment | null): boolean => {
      if (!date) return true;

      const chapterToday = DateFieldValidationUtility.getMinDate(chapterTimezone);
      const checkDate = moment.isMoment(date) ? date : moment(date);

      // Check if date is not in the past (based on chapter timezone)
      if (checkDate.format('YYYY-MM-DD') < chapterToday.format('YYYY-MM-DD')) {
        return false;
      }

      // Check if date is not before effective date
      const effectiveDate = this.form?.get('effectiveDate')?.value;
      if (effectiveDate && moment.isMoment(effectiveDate)) {
        const effDay = moment(effectiveDate).startOf('day');
        if (checkDate.isBefore(effDay, 'day')) {
          return false;
        }
      }

      return true;
    };

    this.initializeForm();
    this.setupDateValidationListeners();
    this.updatePanelTitle();
    this.loadDropdowns();

    if (this.mode === 'add') {
      this.minEffectiveDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
      this.minTerminationDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
    } else {
      this.minEffectiveDate = null;
    }

    if (this.mode === 'edit' && this.data) {
      this.populateFormForEdit();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle changes to mode or data inputs after initial load
    // This ensures the form updates when switching between Add and Edit modes without closing the panel
    if ((changes['mode'] || changes['data']) && !changes['mode']?.firstChange) {
      const chapterTimezone = this.headerService.chapterTimeZone();

      // Update panel title when mode changes
      this.updatePanelTitle();

      if (this.mode === 'edit' && this.data) {
        // Switching to Edit mode - populate form with data
        this.minEffectiveDate = null;
        this.populateFormForEdit();
      } else if (this.mode === 'add') {
        // Switching to Add mode - reset form and validators
        this.minEffectiveDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
        this.minTerminationDate = DateFieldValidationUtility.getMinDate(chapterTimezone);

        // Enable all fields for Add mode
        this.form.get('sourceId')?.enable();
        this.form.get('targetId')?.enable();
        this.form.get('sourceCodeType')?.enable();
        this.form.get('sourceValue')?.enable();
        this.form.get('targetType')?.enable();
        this.form.get('procedureCount')?.enable();
        this.form.get('effectiveDate')?.enable();
        this.form.get('terminationDate')?.enable();
        // targetValue will be enabled when targetType is selected

        // Reset the form to initial state for Add mode, preserving sourceId/targetId from main page
        this.form.reset({
          sourceId: this.data?.sourceId || '',
          targetId: this.data?.targetId || '',
          sourceCodeType: '',
          sourceValue: '',
          targetType: '',
          targetValue: '',
          procedureCount: '',
          effectiveDate: null,
          terminationDate: null
        });

        // Clear source code description
        this.editModeValues.sourceCodeDescription = '';

        // Clear and reapply validators for Add mode - Effective Date
        this.form.get('effectiveDate')?.clearValidators();
        const effectiveDateValidators = [
          Validators.required,
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator(),
          DateFieldValidationUtility.effectiveDateNotPastValidator(chapterTimezone)
        ];
        this.form.get('effectiveDate')?.setValidators(effectiveDateValidators);
        this.form.get('effectiveDate')?.updateValueAndValidity();

        // Clear and reapply validators for Add mode - Termination Date
        this.form.get('terminationDate')?.clearValidators();
        const terminationDateValidators = [
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator(),
          DateFieldValidationUtility.terminationDateNotPastValidator(chapterTimezone)
        ];
        this.form.get('terminationDate')?.setValidators(terminationDateValidators);
        this.form.get('terminationDate')?.updateValueAndValidity();

        // Reapply form-level validators
        this.form.setValidators([DateFieldValidationUtility.dateRangeValidator()]);
        this.form.updateValueAndValidity();

        // Mark as untouched and pristine
        this.form.markAsUntouched();
        this.form.markAsPristine();

        this.cdr.markForCheck();
      }
    }
  }

  private loadDropdowns(): void {
    this.isLoadingDropdowns = true;
    this.externalBcDataTranslateService.getDropdowns()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingDropdowns = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          this.sourceIdOptions = response.sourceIds || [];
          this.sourceCodeTypeOptions = response.sourceCodeTypes || [];
          this.targetTypeOptions = response.targetCodeTypes || [];

          // Update signals for filtered dropdowns
          this.sourceIdOptionsSignal.set(this.sourceIdOptions);
          this.sourceCodeTypeOptionsSignal.set(this.sourceCodeTypeOptions);
          this.targetTypeOptionsSignal.set(this.targetTypeOptions);

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading dropdowns:', error);
          this.snackBar.open(EXTERNAL_BC_DATA_TRANSLATE_ERROR_MESSAGES.LOAD_DROPDOWNS_FAILED, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private loadTargetValuesByCodeType(targetCodeType: string, valueToSetAfterLoad?: string): void {
    // Only clear if not preserving a value for edit mode
    if (!valueToSetAfterLoad) {
      this.form.get('targetValue')?.setValue('');
    }
    this.form.get('targetValue')?.disable();

    this.isLoadingTargetValues.set(true);

    this.externalBcDataTranslateService.getTargetValuesByCodeType(targetCodeType)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingTargetValues.set(false);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          this.targetValueOptions = response || [];
          this.targetValueOptionsSignal.set(this.targetValueOptions);

          // If we have a value to set (edit mode), set it after options are loaded
          if (valueToSetAfterLoad) {
            this.form.get('targetValue')?.setValue(valueToSetAfterLoad);
          }

          // Enable target value dropdown after loading
          this.form.get('targetValue')?.enable();

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading target values by code type:', error);
          this.targetValueOptions = [];
          this.targetValueOptionsSignal.set([]);
          this.form.get('targetValue')?.disable();

          this.snackBar.open(
            'Failed to load target values. Please try again.',
            'DISMISS',
            {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            }
          );
        }
      });
  }

  private setupDateValidationListeners(): void {
    // Trigger change detection when form validation state changes (needed for OnPush)
    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const chapterTimezone = this.headerService.chapterTimeZone();
        const chapterToday = DateFieldValidationUtility.getMinDate(chapterTimezone);

        if (value && moment.isMoment(value) && value.isValid()) {
          // Normalize to start of day to ensure date-only comparison
          const effDay = value.clone().startOf('day');
          // minTerminationDate is the later of effective date or chapter's today
          this.minTerminationDate = effDay.isAfter(chapterToday) ? effDay : chapterToday;
        } else {
          // If no effective date, termination date can't be before chapter's today
          this.minTerminationDate = chapterToday;
        }
        // Re-validate termination date when effective date changes
        this.form.get('terminationDate')?.updateValueAndValidity();
        this.cdr.markForCheck(); // Trigger change detection to show errors
      });

    // Listen to target type changes to dynamically load target values
    this.form.get('targetType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((targetCodeType: string) => {
        if (targetCodeType) {
          this.loadTargetValuesByCodeType(targetCodeType);
        } else {
          // Clear target values when target type is cleared
          this.targetValueOptions = [];
          this.targetValueOptionsSignal.set([]);
          this.form.get('targetValue')?.setValue('');
          this.form.get('targetValue')?.disable();
          this.cdr.markForCheck();
        }
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck(); // Trigger change detection to show errors
      });

    // Listen to source code type changes to fetch description
    this.form.get('sourceCodeType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((codeType: string) => {
        if (codeType) {
          this.fetchSourceCodeDescription(codeType);
        } else {
          this.editModeValues.sourceCodeDescription = '';
          this.cdr.markForCheck();
        }
      });
  }

  private fetchSourceCodeDescription(code: string): void {
    this.externalBcDataTranslateService.getSourceCodeDescription(code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (description) => {
          this.editModeValues.sourceCodeDescription = description;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error fetching source code description:', error);
          this.editModeValues.sourceCodeDescription = '';
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const chapterTimezone = this.headerService.chapterTimeZone();
    const effectiveDateValidators = [
      Validators.required,
      dateFormatValidator(),
      DateFieldValidationUtility.validDateValidator()
    ];
    const terminationDateValidators = [
      dateFormatValidator(),
      DateFieldValidationUtility.validDateValidator()
    ];

    // Only apply past date validation in 'add' mode (using chapter timezone)
    if (this.mode === 'add') {
      effectiveDateValidators.push(DateFieldValidationUtility.effectiveDateNotPastValidator(chapterTimezone));
    }

    // Termination date should not be in the past (based on chapter timezone)
    terminationDateValidators.push(DateFieldValidationUtility.terminationDateNotPastValidator(chapterTimezone));

    this.form = this.fb.group({
      sourceId: [this.data?.sourceId || '', [Validators.required]],
      targetId: [this.data?.targetId || '', [Validators.required]],
      sourceCodeType: ['', [Validators.required]],
      sourceValue: ['', [Validators.required, noWhitespaceOnlyValidator(), Validators.maxLength(20)]],
      targetType: ['', [Validators.required]],
      targetValue: [{ value: '', disabled: true }, [Validators.required]],
      procedureCount: ['', [Validators.min(0), Validators.max(999)]],
      effectiveDate: [null, effectiveDateValidators],
      terminationDate: [null, terminationDateValidators]
    }, { validators: [DateFieldValidationUtility.dateRangeValidator()] });
  }
 

  private updatePanelTitle(): void {
    this.panelTitle = this.mode === 'add' ? 'Add New Conversion Code' : 'Edit Conversion Code';
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    this.originalValues.sourceId = this.data.sourceId || '';
    this.originalValues.targetId = this.data.targetId || '';
    this.originalValues.sourceCodeType = this.data.sourceCodeType || '';
    this.originalValues.targetCodeType = this.data.targetCodeType || '';
    this.originalValues.targetValue = this.data.targetValue || '';
    this.originalValues.sourceValue = this.data.sourceValue || '';
    this.originalValues.effectiveDate = this.data.effDate ? new Date(this.data.effDate) : null;

    this.editModeValues.sourceCodeDescription = '';

    // Disable non-editable fields in edit mode (sourceId, targetId, sourceCodeType)
    // These are key fields that identify the record and cannot be changed
    this.form.get('sourceId')?.disable();
    this.form.get('targetId')?.disable();
    this.form.get('sourceCodeType')?.disable();

    // Clear validators for disabled non-editable fields
    this.form.get('sourceId')?.clearValidators();
    this.form.get('targetId')?.clearValidators();
    this.form.get('sourceCodeType')?.clearValidators();

    // Use shared utility to setup date field validators for Edit mode (disables effectiveDate)
    const chapterTimezone = this.headerService.chapterTimeZone();
    DateFieldValidationUtility.setupEditModeValidators(this.form, chapterTimezone);

    // Re-add terminationDateNotPastValidator for Edit mode
    // Even in Edit mode, when user changes termination date, it should not be in the past
    const terminationDateControl = this.form.get('terminationDate');
    if (terminationDateControl) {
      terminationDateControl.setValidators([
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(chapterTimezone)
      ]);
      terminationDateControl.updateValueAndValidity();
    }

    // Update validity for non-editable fields
    this.form.get('sourceId')?.updateValueAndValidity();
    this.form.get('targetId')?.updateValueAndValidity();
    this.form.get('sourceCodeType')?.updateValueAndValidity();

    // Patch all fields except targetType and targetValue
    // targetType will be patched separately with emitEvent: false to prevent duplicate API calls
    // targetValue will be set after options load
    this.form.patchValue({
      sourceId: this.data.sourceId || '',
      targetId: this.data.targetId || '',
      sourceCodeType: this.data.sourceCodeType || '',
      sourceValue: this.data.sourceValue || '',
      procedureCount: this.data.convProcCall ? parseInt(this.data.convProcCall, 10) : null,
      effectiveDate: this.data.effDate ? moment(this.data.effDate) : null,
      terminationDate: this.data.termDate ? moment(this.data.termDate) : null
    });

    // Enable editable fields in edit mode (sourceValue, targetType, procedureCount, terminationDate)
    // Note: targetValue will be enabled when targetType is selected
    // These fields should remain enabled even when termination date is in the past
    this.form.get('sourceValue')?.enable();
    this.form.get('targetType')?.enable();
    this.form.get('procedureCount')?.enable();
    this.form.get('terminationDate')?.enable();

    // Patch targetType separately with emitEvent: false to prevent valueChanges listener from firing
    // This avoids duplicate API call (one from listener, one from explicit call below)
    if (this.data.targetCodeType) {
      this.form.patchValue(
        { targetType: this.data.targetCodeType },
        { emitEvent: false }
      );
    }

    // Mark form as pristine so SAVE button is disabled until user makes changes
    this.form.markAsPristine();

    // Set min termination date based on effective date and chapter timezone
    // minTerminationDate is the later of effective date or chapter's today
    const chapterToday = DateFieldValidationUtility.getMinDate(chapterTimezone);
    if (this.data.effDate) {
      const effDay = moment(this.data.effDate).startOf('day');
      this.minTerminationDate = effDay.isAfter(chapterToday) ? effDay : chapterToday;
    } else {
      this.minTerminationDate = chapterToday;
    }

    // Fetch description for existing source code type
    if (this.data.sourceCodeType) {
      this.fetchSourceCodeDescription(this.data.sourceCodeType);
    }

    // Load target values for the existing target type, preserving the existing value
    if (this.data.targetCodeType) {
      this.loadTargetValuesByCodeType(
        this.data.targetCodeType,
        this.data.targetValue || undefined
      );
    }

    this.cdr.markForCheck();
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    this.cdr.markForCheck(); // Trigger change detection to show validation errors

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const effectiveMoment = formValue.effectiveDate ? moment(formValue.effectiveDate) : null;
      const terminationMoment = formValue.terminationDate ? moment(formValue.terminationDate) : null;

      const addPayload: ExternalBcDataTranslateDto = {
        sourceId: formValue.sourceId?.trim() || '',
        targetId: formValue.targetId?.trim() || '',
        sourceCodeType: formValue.sourceCodeType?.trim() || '',
        targetCodeType: formValue.targetType?.trim() || '',
        sourceValue: formValue.sourceValue?.trim() || '',
        targetValue: formValue.targetValue?.trim() || '',
        sourceTable: '',
        sourceColumn: '',
        targetTable: '',
        targetColumn: '',
        conversionComment: '',
        effDate: effectiveMoment ? effectiveMoment.format('YYYY-MM-DD') + 'T12:00:00.000Z' : '',
        termDate: terminationMoment ? terminationMoment.format('YYYY-MM-DD') + 'T12:00:00.000Z' : '',
        convProcCall: formValue.procedureCount?.toString() || ''
      };
      apiCall = this.externalBcDataTranslateService.addConversionCode(addPayload);
    } else {
      const effectiveMoment = formValue.effectiveDate ? moment(formValue.effectiveDate) : null;
      const terminationMoment = formValue.terminationDate ? moment(formValue.terminationDate) : null;

      const updatePayload: UpdateExternalBcDataTranslateDto = {
        sourceId: this.originalValues.sourceId,
        targetId: this.originalValues.targetId,
        oldSourceCodeType: this.originalValues.sourceCodeType,
        oldSourceValue: this.originalValues.sourceValue,
        oldTargetCodeType: this.originalValues.targetCodeType,
        oldTargetValue: this.originalValues.targetValue,
        sourceCodeType: formValue.sourceCodeType?.trim() || '',
        targetCodeType: formValue.targetType?.trim() || '',
        sourceValue: formValue.sourceValue?.trim() || '',
        targetValue: formValue.targetValue?.trim() || '',
        sourceTable: '',
        sourceColumn: '',
        targetTable: '',
        targetColumn: '',
        conversionComment: '',
        effDate: effectiveMoment ? effectiveMoment.format('YYYY-MM-DD') + 'T12:00:00.000Z' : '',
        termDate: terminationMoment ? terminationMoment.format('YYYY-MM-DD') + 'T12:00:00.000Z' : '',
        convProcCall: formValue.procedureCount?.toString() || ''
      };
      apiCall = this.externalBcDataTranslateService.updateConversionCode(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = this.mode === 'add'
            ? EXTERNAL_BC_DATA_TRANSLATE_ERROR_MESSAGES.ADD_SUCCESS
            : EXTERNAL_BC_DATA_TRANSLATE_ERROR_MESSAGES.UPDATE_SUCCESS;

          this.snackBar.open(message, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: ConversionCodeFormData = {
            sourceType: formValue.sourceCodeType?.trim() || '',
            sourceValue: formValue.sourceValue?.trim() || '',
            targetType: formValue.targetType?.trim() || '',
            targetValue: formValue.targetValue?.trim() || '',
            effectiveDate: formValue.effectiveDate && moment.isMoment(formValue.effectiveDate)
              ? formValue.effectiveDate.toDate()
              : new Date(),
            terminationDate: formValue.terminationDate && moment.isMoment(formValue.terminationDate)
              ? formValue.terminationDate.toDate()
              : null
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        },
        error: (error) => {
          const errorMessage = ExternalBcDataTranslateErrorHandler.getErrorMessage(error);
          this.snackBar.open(errorMessage, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          this.cdr.markForCheck();
        }
      });
  }

  // Form control getters
  get sourceIdControl() { return this.form.get('sourceId'); }
  get targetIdControl() { return this.form.get('targetId'); }
  get sourceCodeTypeControl() { return this.form.get('sourceCodeType'); }
  get sourceValueControl() { return this.form.get('sourceValue'); }
  get targetTypeControl() { return this.form.get('targetType'); }
  get targetValueControl() { return this.form.get('targetValue'); }
  get procedureCountControl() { return this.form.get('procedureCount'); }
  get effectiveDateControl() { return this.form.get('effectiveDate'); }
  get terminationDateControl() { return this.form.get('terminationDate'); }

  // Validation error methods
  getSourceIdError(): string {
    const control = this.sourceIdControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Source ID is required';
    return '';
  }

  getTargetIdError(): string {
    const control = this.targetIdControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Target ID is required';
    return '';
  }

  getSourceCodeTypeError(): string {
    const control = this.sourceCodeTypeControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Source Code Type is required';
    return '';
  }

  getSourceValueError(): string {
    const control = this.sourceValueControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Source Value is required';
    if (control.hasError('whitespaceOnly')) return 'Source Value cannot contain only spaces';
    if (control.hasError('maxlength')) return 'Source Value must not exceed 20 characters';
    return '';
  }

  getTargetTypeError(): string {
    const control = this.targetTypeControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Target Type is required';
    return '';
  }

  getTargetValueError(): string {
    const control = this.targetValueControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Target Value is required';
    return '';
  }

  getProcedureCountError(): string {
    const control = this.procedureCountControl;
    if (!control || !control.touched) return '';
    if (control.hasError('min')) return 'Procedure Count must be 0 or greater';
    if (control.hasError('max')) return 'Procedure Count must be 999 or less';
    return '';
  }

  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getEffectiveDateError(this.form);
  }

  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');
    if (!control) {
      return '';
    }

    // Only show errors if touched or dirty
    if (!(control.touched || control.dirty)) {
      return '';
    }

    // Priority 1: Check for invalid date format errors FIRST (even when control.value is null)
    // This handles cases where user types unparseable text like "31-APR-2026"
    if (control.hasError('invalidDateFormat')) {
      return 'Termination date is invalid';
    }

    if (control.hasError('invalidDate')) {
      return 'Termination date is invalid';
    }

    if (control.hasError('matDatepickerParse')) {
      return 'Termination date is invalid';
    }

    // Priority 2: If field is truly empty (no errors), return empty (optional field)
    if (!control.value) {
      return '';
    }

    // Priority 3: Cross-field date range first (more specific than past-date)
    if (this.form.errors?.['dateRangeInvalid']) {
      return 'Termination Date must be greater than or equal to Effective Date';
    }

    if (control.hasError('matDatepickerMin')) {
      return 'Termination Date must be greater than or equal to Effective Date';
    }

    if (control.hasError('terminationDatePast')) {
      return 'Termination date cannot be past date';
    }

    return '';
  }

  get isFormValid(): boolean {
    // In edit mode, if termination date is in the past, disable save button
    if (this.mode === 'edit' && this.isTerminationDateInPast()) {
      return false;
    }

    if (this.mode === 'edit') {
      return this.form.valid && this.form.dirty;
    }
    return this.form.valid;
  }

  /**
   * Check if termination date is in the past based on chapter timezone
   */
  private isTerminationDateInPast(): boolean {
    const terminationDate = this.form.get('terminationDate')?.value;
    if (!terminationDate || !moment.isMoment(terminationDate)) {
      return false;
    }

    const chapterTimezone = this.headerService.chapterTimeZone();
    const chapterToday = DateFieldValidationUtility.getMinDate(chapterTimezone);
    const termDay = terminationDate.clone().startOf('day');

    return termDay.isBefore(chapterToday, 'day');
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    const effectiveMoment = formValue.effectiveDate ? moment(formValue.effectiveDate) : null;
    const terminationMoment = formValue.terminationDate ? moment(formValue.terminationDate) : null;

    const addPayload: ExternalBcDataTranslateDto = {
      sourceId: formValue.sourceId?.trim() || '',
      targetId: formValue.targetId?.trim() || '',
      sourceCodeType: formValue.sourceCodeType?.trim() || '',
      targetCodeType: formValue.targetType?.trim() || '',
      sourceValue: formValue.sourceValue?.trim() || '',
      targetValue: formValue.targetValue?.trim() || '',
      sourceTable: '',
      sourceColumn: '',
      targetTable: '',
      targetColumn: '',
      conversionComment: '',
      effDate: effectiveMoment ? effectiveMoment.format('YYYY-MM-DD') + 'T12:00:00.000Z' : '',
      termDate: terminationMoment ? terminationMoment.format('YYYY-MM-DD') + 'T12:00:00.000Z' : '',
      convProcCall: formValue.procedureCount?.toString() || ''
    };

    this.externalBcDataTranslateService.addConversionCode(addPayload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = EXTERNAL_BC_DATA_TRANSLATE_ERROR_MESSAGES.ADD_AND_CREATE_SUCCESS;

          this.snackBar.open(message, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: ConversionCodeFormData = {
            sourceType: formValue.sourceCodeType?.trim() || '',
            sourceValue: formValue.sourceValue?.trim() || '',
            targetType: formValue.targetType?.trim() || '',
            targetValue: formValue.targetValue?.trim() || '',
            effectiveDate: formValue.effectiveDate && moment.isMoment(formValue.effectiveDate)
              ? formValue.effectiveDate.toDate()
              : new Date(),
            terminationDate: formValue.terminationDate && moment.isMoment(formValue.terminationDate)
              ? formValue.terminationDate.toDate()
              : null
          };

          this.saveSuccess.emit(result);

          // Reset form for next entry, preserving sourceId/targetId from main page
          this.form.reset({
            sourceId: this.data?.sourceId || '',
            targetId: this.data?.targetId || '',
            sourceCodeType: '',
            sourceValue: '',
            targetType: '',
            targetValue: '',
            procedureCount: '',
            effectiveDate: null,
            terminationDate: null
          });
          this.form.markAsUntouched();
          this.form.markAsPristine();

          // Update validity to ensure validators run properly
          this.form.updateValueAndValidity();

          // Clear source code description
          this.editModeValues.sourceCodeDescription = '';

          this.cdr.markForCheck();
        },
        error: (error) => {
          const errorMessage = ExternalBcDataTranslateErrorHandler.getErrorMessage(error);
          this.snackBar.open(errorMessage, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          this.cdr.markForCheck();
        }
      });
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Handle input event on Procedure Count field to prevent negative values
   */
  onProcedureCountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Remove any non-numeric characters except decimal point
    inputValue = inputValue.replace(/[^\d]/g, '');

    // Limit to 3 digits (max 999)
    if (inputValue.length > 3) {
      inputValue = inputValue.substring(0, 3);
    }

    // Update input value
    input.value = inputValue;

    // Handle empty input
    if (inputValue === '') {
      this.form.get('procedureCount')?.setValue(null, { emitEvent: false });
      return;
    }

    const value = parseInt(inputValue, 10);

    // Validate range
    if (!isNaN(value)) {
      if (value < 0) {
        input.value = '0';
        this.form.get('procedureCount')?.setValue(0, { emitEvent: false });
      } else if (value > 999) {
        input.value = '999';
        this.form.get('procedureCount')?.setValue(999, { emitEvent: false });
      } else {
        this.form.get('procedureCount')?.setValue(value, { emitEvent: false });
      }
    }

    // Mark as touched to show validation errors
    this.form.get('procedureCount')?.markAsTouched();
  }

  /**
   * Handle input event on date fields for real-time validation
   * Prevents "required" error from showing when user is typing invalid date
   * Clears errors immediately when optional field is emptied
   */
  onDateFieldInput(fieldName: string): void {
    const control = this.form.get(fieldName);
    if (!control) return;

    setTimeout(() => {
      // Get the actual input element value
      const inputElement = document.querySelector(`input[formcontrolname="${fieldName}"]`) as HTMLInputElement;
      const inputValue = inputElement?.value?.trim() || '';

      // If input is empty and field is optional (terminationDate)
      if (!inputValue && fieldName === 'terminationDate') {
        // Clear all errors for empty optional field
        control.setErrors(null);
        control.updateValueAndValidity({ onlySelf: false, emitEvent: true });
      } else if (inputValue && !control.value) {
        // User typed something but it couldn't be parsed - set invalid error
        // This prevents "required" error from showing during typing
        control.setErrors({
          invalidDate: true,
          matDatepickerParse: { text: inputValue }
        });
        control.markAsDirty();
      }

      this.cdr.markForCheck();
    }, 0);
  }

  /**
   * Handle blur event on date fields to trigger final validation
   * Marks field as touched and validates input
   */
  onDateFieldBlur(fieldName: string): void {
    const control = this.form.get(fieldName);
    if (!control) return;

    control.markAsTouched();

    setTimeout(() => {
      // Get the actual input element value
      const inputElement = document.querySelector(`input[formcontrolname="${fieldName}"]`) as HTMLInputElement;
      const inputValue = inputElement?.value?.trim() || '';

      // If input is empty and field is optional (terminationDate)
      if (!inputValue && fieldName === 'terminationDate') {
        // Clear all errors for empty optional field
        control.setErrors(null);
        control.updateValueAndValidity({ onlySelf: false, emitEvent: true });
      } else if (inputValue && !control.value) {
        // User typed something but it couldn't be parsed - set error
        // Do NOT call updateValueAndValidity here as it would overwrite our manual error
        control.setErrors({
          invalidDate: true,
          matDatepickerParse: { text: inputValue }
        });
        control.markAsDirty();
      } else if (inputValue && control.value) {
        // Valid date entered - run all validators to check for past date, etc.
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: false, emitEvent: true });
      }

      this.cdr.detectChanges();
    }, 10);
  }
}
