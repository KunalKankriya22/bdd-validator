import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE
} from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HlaCrossReactiveGroupsService } from '../services/hla-cross-reactive-groups.service';
import { Subject, takeUntil, finalize } from 'rxjs';
import moment from 'moment';
import {
  HlaCrossReactiveGroupModel,
  CreateHlaCrossReactiveGroupDto,
  UpdateHlaCrossReactiveGroupDto,
  PublicEpitopeOption,
  AssociatedEpitopeOption
} from '../models/hla-cross-reactive-groups.model';

/**
 * Add/Edit side panel component for HLA Cross-Reactive Groups
 */
@Component({
  selector: 'app-add-edit-hla-cross-reactive-groups',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-hla-cross-reactive-groups.html',
  styleUrls: ['./add-edit-hla-cross-reactive-groups.scss']
})
export class AddEditHlaCrossReactiveGroups implements OnInit, OnChanges, OnDestroy {

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: HlaCrossReactiveGroupModel | null = null;
  @Input() hlaStandardOptions: { code: string; description: string }[] = [];
  @Input() publicEpitopeOptions: PublicEpitopeOption[] = [];
  @Input() associatedEpitopeOptions: AssociatedEpitopeOption[] = [];
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  form: FormGroup;
  panelTitle = '';
  isSaving = false;
  isEffectiveDateDisabled = false;

  // Filtered options for searchable dropdowns
  filteredPublicEpitopeOptions: PublicEpitopeOption[] = [];
  filteredHlaStandardOptions: { code: string; description: string }[] = [];
  filteredAssociatedEpitopeOptions: AssociatedEpitopeOption[] = [];

  // Search controls for dropdowns
  publicEpitopeSearchControl = new FormControl('');
  hlaStandardSearchControl = new FormControl('');
  associatedEpitopeSearchControl = new FormControl('');

  minDate = DateFieldValidationUtility.getMinDate();
  terminationMinDate = DateFieldValidationUtility.getMinDate();

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );

  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError()
  );

  private initialFormValues: any = null;
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: HlaCrossReactiveGroupsService,
    private snackbarService: SnackbarService,
    private headerService: HeaderService
  ) {
    this.form = this.fb.group({
      publicEpitopeId: ['', [Validators.required, Validators.maxLength(5)]],
      description: [{ value: '', disabled: true }],
      associatedEpitopeId: ['', [Validators.required]],
      hlaStandard: ['', Validators.required],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });
  }

  /* -------------------------------- LIFECYCLE -------------------------------- */

  ngOnInit(): void {
    // Initialize filtered options from @Input
    this.filteredPublicEpitopeOptions = [...this.publicEpitopeOptions];
    this.filteredHlaStandardOptions = [...this.hlaStandardOptions];
    this.filteredAssociatedEpitopeOptions = [...this.associatedEpitopeOptions];

    this.setupPublicEpitopeListener();
    this.setupPublicEpitopeSearch();
    this.setupHlaStandardSearch();
    this.setupAssociatedEpitopeSearch();
    this.setupPanel();

    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['publicEpitopeOptions'] && this.publicEpitopeOptions) {
      this.filteredPublicEpitopeOptions = [...this.publicEpitopeOptions];
    }
    if (changes['hlaStandardOptions'] && this.hlaStandardOptions) {
      this.filteredHlaStandardOptions = [...this.hlaStandardOptions];
    }
    if (changes['associatedEpitopeOptions'] && this.associatedEpitopeOptions) {
      this.filteredAssociatedEpitopeOptions = [...this.associatedEpitopeOptions];
    }
    if (changes['mode'] || changes['data']) {
      this.setupPanel();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* -------------------------------- DATE MIN UPDATE -------------------------------- */

  /**
   * Update the minimum allowed date for termination date based on effective date
   */
  private updateTerminationMinDate(): void {
    const effectiveValue = this.form?.get('effectiveDate')?.value;
    const chapterToday = DateFieldValidationUtility.getMinDate();

    if (effectiveValue && moment.isMoment(effectiveValue) && effectiveValue.isValid()) {
      this.terminationMinDate = effectiveValue.isAfter(chapterToday, 'day')
        ? effectiveValue.clone()
        : chapterToday;
    } else {
      this.terminationMinDate = chapterToday;
    }
  }

  /* -------------------------------- PANEL SETUP -------------------------------- */

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add New Cross-Reactive Group';
      this.form.enable();
      this.form.reset();
      // Description is always disabled (read-only)
      this.form.get('description')?.disable();
      // Default HLA Standard to 'CREG' (matches Oracle Forms WHEN-VALIDATE-ITEM trigger)
      this.form.patchValue({ hlaStandard: 'CREG' });
      // Setup add mode validators
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    } else if (this.mode === 'edit' && this.data) {
      this.panelTitle = 'Edit Cross-Reactive Group';
      this.populateForm();
    }
  }

  private populateForm(): void {
    if (!this.data) return;

    const effectiveDateMoment = this.data.effectiveDate ? moment(this.data.effectiveDate) : null;
    const terminationDateMoment = this.data.terminationDate ? moment(this.data.terminationDate) : null;

    this.form.patchValue({
      publicEpitopeId: this.data.publicEpitopeId,
      description: this.data.publicEpitopeDescription || this.data.description || '',
      associatedEpitopeId: this.data.associatedEpitopeId,
      hlaStandard: this.data.hlaStandard,
      effectiveDate: effectiveDateMoment,
      terminationDate: terminationDateMoment
    });

    // Store initial values for change detection in edit mode
    // Dates stored as formatted strings (YYYY-MM-DD) to avoid timezone/time-component issues
    this.initialFormValues = {
      publicEpitopeId: this.data.publicEpitopeId || '',
      associatedEpitopeId: this.data.associatedEpitopeId || '',
      hlaStandard: this.data.hlaStandard || '',
      effectiveDate: effectiveDateMoment ? effectiveDateMoment.format('YYYY-MM-DD') : null,
      terminationDate: terminationDateMoment ? terminationDateMoment.format('YYYY-MM-DD') : null
    };

    // Description is always disabled (read-only)
    this.form.get('description')?.disable();

    // Business rule: If Effective Date < chapter local date (today), disable it
    const effectiveDateValue = this.data.effectiveDate ? moment(this.data.effectiveDate) : null;

    if (DateFieldValidationUtility.isPastDate(effectiveDateValue)) {
      this.form.get('effectiveDate')?.disable();
      this.isEffectiveDateDisabled = true;
    } else {
      this.isEffectiveDateDisabled = false;
    }

    // Add past-date validator on termination date in edit mode
    const terminationDateControl = this.form.get('terminationDate');
    if (terminationDateControl) {
      terminationDateControl.addValidators(
        DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone())
      );
      terminationDateControl.updateValueAndValidity();
    }

    // Update termination min date based on effective date
    this.updateTerminationMinDate();
  }

  /* -------------------------------- PUBLIC EPITOPE LISTENER -------------------------------- */

  private setupPublicEpitopeListener(): void {
    // Listen to Public Epitope ID changes and auto-populate Description
    this.form.get('publicEpitopeId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((publicEpitopeId: string) => {
        if (publicEpitopeId) {
          const epitope = this.publicEpitopeOptions.find(e => e.code === publicEpitopeId);
          if (epitope) {
            this.form.patchValue({
              description: epitope.description
            }, { emitEvent: false });
          }
        } else {
          this.form.patchValue({
            description: ''
          }, { emitEvent: false });
        }
      });
  }

  private setupPublicEpitopeSearch(): void {
    this.publicEpitopeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredPublicEpitopeOptions = this.publicEpitopeOptions.filter(epitope =>
          epitope.code.toLowerCase().includes(term) ||
          epitope.description.toLowerCase().includes(term)
        );
      });
  }

  onPublicEpitopeDropdownOpened(opened: boolean): void {
    if (opened) {
      this.publicEpitopeSearchControl.setValue('');
      this.filteredPublicEpitopeOptions = [...this.publicEpitopeOptions];
    }
  }

  /* -------------------------------- ASSOCIATED EPITOPE SEARCH -------------------------------- */

  private setupAssociatedEpitopeSearch(): void {
    this.associatedEpitopeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredAssociatedEpitopeOptions = this.associatedEpitopeOptions.filter(option =>
          option.epitopeId.toLowerCase().includes(term) ||
          option.locus.toLowerCase().includes(term)
        );
      });
  }

  onAssociatedEpitopeDropdownOpened(opened: boolean): void {
    if (opened) {
      this.associatedEpitopeSearchControl.setValue('');
      this.filteredAssociatedEpitopeOptions = [...this.associatedEpitopeOptions];
    }
  }

  /* -------------------------------- HLA STANDARD SEARCH -------------------------------- */

  private setupHlaStandardSearch(): void {
    this.hlaStandardSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredHlaStandardOptions = this.hlaStandardOptions.filter(option =>
          option.code.toLowerCase().includes(term) ||
          option.description.toLowerCase().includes(term)
        );
      });
  }

  onHlaStandardDropdownOpened(opened: boolean): void {
    if (opened) {
      this.hlaStandardSearchControl.setValue('');
      this.filteredHlaStandardOptions = [...this.hlaStandardOptions];
    }
  }

  /* -------------------------------- SAVE HANDLERS -------------------------------- */

  onSave(closeAfterSave = true): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    this.isSaving = true;
    const formValue = this.form.getRawValue();

    const payload: CreateHlaCrossReactiveGroupDto | UpdateHlaCrossReactiveGroupDto = {
      publicEpitopeId: formValue.publicEpitopeId?.trim(),
      associatedEpitopeId: formValue.associatedEpitopeId?.trim(),
      hlaStandard: formValue.hlaStandard,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
      chapterId: this.headerService.getCurrentChapterId()
    };

    const apiCall = this.mode === 'add'
      ? this.service.createHlaCrossReactiveGroup(payload as CreateHlaCrossReactiveGroupDto)
      : this.service.updateHlaCrossReactiveGroup(
          this.data!.publicEpitopeId,  // OLD value (to identify record in URL)
          this.data!.associatedEpitopeId,  // OLD value (to identify record in URL)
          payload as UpdateHlaCrossReactiveGroupDto  // NEW values (to update record)
        );

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isSaving = false))
      )
      .subscribe({
        next: (response) => {
          // API may return HTTP 200 or 400 with success: false for business logic errors
          if (response?.success === false) {
            const errorCode = response?.errorCode || response?.errorResponse?.errorCode;
            const errorMessage = response?.error ||
                                 response?.errorResponse?.error ||
                                 response?.message ||
                                 'Failed to save Cross-Reactive Group';

            this.snackbarService.showError(this.formatErrorMessage(errorCode, errorMessage));
            return;
          }

          const successMessage =
            response?.message ||
            (this.mode === 'add'
              ? 'New Cross-Reactive Group has been added successfully.'
              : 'Cross-Reactive Group updated successfully.');

          this.snackbarService.showSuccess(successMessage);
          this.saveSuccess.emit();

          if (closeAfterSave) {
            this.closePanel.emit();
          } else {
            this.form.reset();
            this.form.get('description')?.disable();
          }
        },
        error: (error: HttpErrorResponse) => {
          this.handleSaveError(error);
        }
      });
  }

  /**
   * Format error message with optional error code
   * @param errorCode Optional error code (e.g., '0319')
   * @param errorMessage Error message text
   * @returns Formatted error message (e.g., 'Error 0319: Duplicate entry not allowed')
   */
  private formatErrorMessage(errorCode: string | undefined, errorMessage: string): string {
    return errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;
  }

  /**
   * Handle save error
   * Displays error message with code if available
   */
  private handleSaveError(error: HttpErrorResponse): void {
    const errorResponse = error?.error?.errorResponse || error?.error;
    const errorCode = errorResponse?.errorCode;
    const errorMessage =
      errorResponse?.error || error?.message || 'Failed to save Cross-Reactive Group';

    this.snackbarService.showError(this.formatErrorMessage(errorCode, errorMessage));
  }

  onSaveAndAddAnother(): void {
    this.onSave(false);
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  /* -------------------------------- FOCUS MANAGEMENT -------------------------------- */

  /**
   * Focus the first invalid form field for accessibility (WCAG 3.3.1)
   */
  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.form.controls)
      .find(key => this.form.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) {
        el.focus();
      }
    }
  }

  /* -------------------------------- VALIDATION HELPERS -------------------------------- */

  /**
   * Check if form data has changed from initial values (for edit mode)
   */
  private hasFormChanged(): boolean {
    if (this.mode !== 'edit' || !this.initialFormValues) {
      return true; // In add mode, always allow save if valid
    }

    const currentPublicEpitopeId = this.form.get('publicEpitopeId')?.value || '';
    const currentAssociatedEpitopeId = this.form.get('associatedEpitopeId')?.value || '';
    const currentHlaStandard = this.form.get('hlaStandard')?.value || '';
    const currentEffectiveDate = this.form.get('effectiveDate')?.value;
    const currentTerminationDate = this.form.get('terminationDate')?.value;

    // Compare dates as formatted strings (YYYY-MM-DD) to avoid timezone/time-component issues
    const currentEffectiveValue = currentEffectiveDate && moment.isMoment(currentEffectiveDate)
      ? currentEffectiveDate.format('YYYY-MM-DD')
      : null;
    const currentTerminationValue = currentTerminationDate && moment.isMoment(currentTerminationDate)
      ? currentTerminationDate.format('YYYY-MM-DD')
      : null;

    return currentPublicEpitopeId !== this.initialFormValues.publicEpitopeId ||
           currentAssociatedEpitopeId !== this.initialFormValues.associatedEpitopeId ||
           currentHlaStandard !== this.initialFormValues.hlaStandard ||
           currentEffectiveValue !== this.initialFormValues.effectiveDate ||
           currentTerminationValue !== this.initialFormValues.terminationDate;
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit') {
      return this.form.valid && this.hasFormChanged();
    }
    return this.form.valid;
  }

  /* -------------------------------- ERROR MESSAGES -------------------------------- */

  getPublicEpitopeIdError(): string {
    const control = this.form.get('publicEpitopeId');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) return 'Public Epitope ID is required';
    if (control.hasError('maxlength')) return 'Public Epitope ID cannot exceed 5 characters';
    return '';
  }

  getAssociatedEpitopeIdError(): string {
    const control = this.form.get('associatedEpitopeId');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) return 'Associated Epitope ID is required';
    return '';
  }

  getHlaStandardError(): string {
    const control = this.form.get('hlaStandard');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) return 'Reference is required';
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

  /* -------------------------------- DATE INPUT HANDLERS -------------------------------- */

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
}
