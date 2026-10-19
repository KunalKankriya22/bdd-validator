import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { DefineProcedureExclusionsService } from '../services/define-procedure-exclusions.service';
import moment from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import {
  DefineProcedureExclusionsModel,
  DefineProcedureExclusionsDto,
  UpdateDefineProcedureExclusionsDto
} from '../models/define-procedure-exclusions.model';

export interface ProcedureExclusionFormData {
  donationType: string;
  procedure: string;
  interdiction: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
}

@Component({
  selector: 'app-add-edit-procedure-exclusion',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-procedure-exclusion.html',
  styleUrls: ['./add-edit-procedure-exclusion.scss']
})
export class AddEditProcedureExclusion implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: DefineProcedureExclusionsModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<ProcedureExclusionFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form: FormGroup;
  panelTitle: string = '';

  private readonly donationTypesSignal = signal<{ key: string; value: string }[]>([]);
  private readonly procedureCodesSignal = signal<{ key: string; value: string }[]>([]);
  private readonly interdictionsSignal = signal<{ key: string; value: string }[]>([]);

  readonly donationTypeSearchCtrl = new FormControl('');
  readonly procedureSearchCtrl = new FormControl('');
  readonly interdictionSearchCtrl = new FormControl('');

  private readonly donationTypeSearch = signal('');
  private readonly procedureSearch = signal('');
  private readonly interdictionSearch = signal('');

  readonly filteredDonationTypes = computed(() => this.filterItems(this.donationTypesSignal(), this.donationTypeSearch()));
  readonly filteredProcedures = computed(() => this.filterItems(this.procedureCodesSignal(), this.procedureSearch()));
  readonly filteredInterdictions = computed(() => this.filterItems(this.interdictionsSignal(), this.interdictionSearch()));

  isLoadingOptions = false;
  isSaving = false;
  errorMessage = '';
  terminationMinDateValue = DateFieldValidationUtility.getMinDate();

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError()
  );

  // Minimum date for effective date picker (today in chapter timezone)
  minDate = DateFieldValidationUtility.getMinDate();

  // Store original values for edit mode (needed for update API)
  private originalValues: {
    donationType: string;
    procedure: string;
    interdiction: string;
    effectiveDate: string;
  } = {
      donationType: '',
      procedure: '',
      interdiction: '',
      effectiveDate: ''
    };

  // Store initial form values for change detection in edit mode
  private initialFormValues: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private procedureExclusionsService: DefineProcedureExclusionsService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService
  ) {
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    this.form = this.fb.group({
      donationType: ['', [Validators.required]],
      procedure: ['', [Validators.required]],
      interdiction: ['', [Validators.required]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')] });
  }

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  ngOnInit(): void {
    this.setupPanel();
    this.loadLookupData();
    this.setupSearchSubscriptions();
    this.setupDateValidationListeners();
    this.setupDonationTypeListener();
  }

  /**
   * Load lookup data from API for dropdown options
   */
  private loadLookupData(): void {
    this.isLoadingOptions = true;

    this.procedureExclusionsService.getLookups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let lookupData = null;

          if (response.data && response.data.length > 0) {
            lookupData = response.data[0];
          }

          if (lookupData) {
            this.donationTypesSignal.set((lookupData.donationTypes || []).map(item => ({
              key: item.key,
              value: item.value
            })));

            this.interdictionsSignal.set((lookupData.interdictionCodes || []).map(item => ({
              key: item.key,
              value: item.value
            })));
          }

          this.isLoadingOptions = false;

        },
        error: () => {
          this.isLoadingOptions = false;

          this.snackBar.open('Failed to load dropdown options. Please refresh the page.', 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
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
      this.panelTitle = 'Add New Procedures Exclusions';
      // Enable all fields in add mode
      this.form.enable();
      // Setup date validators for add mode (matches physical findings pattern)
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    } else {
      this.panelTitle = 'Edit Procedure Exclusion';
      // Setup date validators for edit mode (disables effective date)
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
      this.populateFormForEdit();
    }
  }

  private setupDateValidationListeners(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        const termControl = this.form.get('terminationDate');
        const hadInvalidDate = termControl?.hasError('invalidDate');
        this.updateTerminationMinDate();
        if (hadInvalidDate && !termControl?.value) {
          setTimeout(() => termControl?.setErrors({ invalidDate: true }));
        }
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  private setupDonationTypeListener(): void {
    this.form.get('donationType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((donationType: string) => {
        if (donationType) {
          this.loadProcedureCodes(donationType);
        } else {
          this.procedureCodesSignal.set([]);
          this.form.get('procedure')?.setValue(null);
        }
      });
  }

  private loadProcedureCodes(donationType: string): void {
    this.procedureExclusionsService.getProcedureCodesByDonationType(donationType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const data = response.data;
          if (Array.isArray(data)) {
            this.procedureCodesSignal.set(data.map((item: any) => ({
              key: item.key,
              value: item.value
            })));
          } else {
            this.procedureCodesSignal.set([]);
          }
          this.procedureSearchCtrl.setValue('');
          if (this.mode === 'add') {
            this.form.get('procedure')?.setValue(null);
          }
        },
        error: () => {
          this.procedureCodesSignal.set([]);
        }
      });
  }

  private loadProcedureCodesForEdit(donationType: string, procedureCode: string): void {
    this.procedureExclusionsService.getProcedureCodesByDonationType(donationType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const data = response.data;
          if (Array.isArray(data)) {
            const options = data.map((item: any) => ({
              key: item.key,
              value: item.value
            }));
            if (procedureCode && !options.some((o: any) => o.value === procedureCode)) {
              options.unshift({ key: procedureCode, value: procedureCode });
            }
            this.procedureCodesSignal.set(options);
          }
          this.procedureSearchCtrl.setValue('');
          this.form.get('procedure')?.setValue(procedureCode, { emitEvent: false });
        },
        error: () => {
          this.procedureCodesSignal.set([]);
        }
      });
  }

  private hasDateValidationError(): boolean {
    return this.form.hasError('dateRangeInvalid') || false;
  }

  private resetFormForAddMode(): void {
    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();
    this.errorMessage = '';
  }

  private populateFormForEdit(): void {
    if (this.data) {
      const donationType = this.data.donationType || '';
      const procedure = this.data.procedure || '';
      const interdiction = this.data.interdiction || '';

      // Store original values for update API
      this.originalValues = {
        donationType,
        procedure,
        interdiction,
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate).format('YYYY-MM-DD') : ''
      };

      // Populate form values — set donationType with emitEvent:false to avoid
      // the cascading listener clearing the procedure selection
      this.form.patchValue({
        donationType,
        interdiction,
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
      }, { emitEvent: false });

      // Load procedure codes for the donation type and set the current procedure
      if (donationType) {
        this.loadProcedureCodesForEdit(donationType, procedure);
      }

      // Store initial form values for change detection
      this.initialFormValues = {
        donationType,
        procedure,
        interdiction,
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate).valueOf() : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate).valueOf() : null
      };
    }
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;
    this.errorMessage = '';

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: DefineProcedureExclusionsDto = {
        donationType: formValue.donationType?.trim() || '',
        procedureCode: formValue.procedure?.trim() || '',
        interdictionCode: (formValue.interdiction?.trim() || '').toUpperCase(),
        effectiveDate: formValue.effectiveDate ? moment(formValue.effectiveDate).format('YYYY-MM-DD') + 'T00:00:00.000Z' : null,
        terminationDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DD') + 'T00:00:00.000Z' : null
      };
      apiCall = this.procedureExclusionsService.addProcedureExclusion(addPayload);
    } else {
      const updatePayload: UpdateDefineProcedureExclusionsDto = {
        originalDonationType: this.originalValues.donationType,
        originalProcedureCode: this.originalValues.procedure,
        originalInterdictionCode: this.originalValues.interdiction,
        donationType: formValue.donationType?.trim() || '',
        procedureCode: formValue.procedure?.trim() || '',
        interdictionCode: (formValue.interdiction?.trim() || '').toUpperCase(),
        effectiveDate: formValue.effectiveDate ? moment(formValue.effectiveDate).format('YYYY-MM-DD') + 'T00:00:00.000Z' : null,
        terminationDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DD') + 'T00:00:00.000Z' : null
      };
      apiCall = this.procedureExclusionsService.updateProcedureExclusion(updatePayload);
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
          const message = response?.message || (this.mode === 'add'
            ? 'Procedure Exclusion added successfully'
            : 'Procedure Exclusion updated successfully');

          this.showNotification(message, 'success');

          const result: ProcedureExclusionFormData = {
            donationType: formValue.donationType?.trim() || '',
            procedure: formValue.procedure?.trim() || '',
            interdiction: formValue.interdiction?.trim() || '',
            effectiveDate: formValue.effectiveDate?.toDate() || new Date(),
            terminationDate: formValue.terminationDate?.toDate() || null
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        },
        error: (error) => {
          const errorText = error?.error?.errorResponse?.error || error?.error?.message || error?.error?.error || error?.message || 'An error occurred while saving';
          const errorCode = error?.error?.errorResponse?.errorCode || error?.error?.errorCode || '';
          let errorMsg: string;
          if (errorCode) {
            errorMsg = `Error ${errorCode} : ${errorText}`;
          } else {
            const match = errorText.match(/^(\d+)\s*-\s*(.+)$/);
            errorMsg = match ? `Error ${match[1]} : ${match[2]}` : errorText;
          }
          this.errorMessage = errorMsg;
          this.showNotification(errorMsg, 'error');
              }
      });
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;
    this.errorMessage = '';

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: DefineProcedureExclusionsDto = {
        donationType: formValue.donationType?.trim() || '',
        procedureCode: formValue.procedure?.trim() || '',
        interdictionCode: (formValue.interdiction?.trim() || '').toUpperCase(),
        effectiveDate: formValue.effectiveDate ? moment(formValue.effectiveDate).format('YYYY-MM-DD') + 'T00:00:00.000Z' : null,
        terminationDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DD') + 'T00:00:00.000Z' : null
      };
      apiCall = this.procedureExclusionsService.addProcedureExclusion(addPayload);
    } else {
      const updatePayload: UpdateDefineProcedureExclusionsDto = {
        originalDonationType: this.originalValues.donationType,
        originalProcedureCode: this.originalValues.procedure,
        originalInterdictionCode: this.originalValues.interdiction,
        donationType: formValue.donationType?.trim() || '',
        procedureCode: formValue.procedure?.trim() || '',
        interdictionCode: (formValue.interdiction?.trim() || '').toUpperCase(),
        effectiveDate: formValue.effectiveDate ? moment(formValue.effectiveDate).format('YYYY-MM-DD') + 'T00:00:00.000Z' : null,
        terminationDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DD') + 'T00:00:00.000Z' : null
      };
      apiCall = this.procedureExclusionsService.updateProcedureExclusion(updatePayload);
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

          this.showNotification(message, 'success');

          const result: ProcedureExclusionFormData = {
            donationType: formValue.donationType?.trim() || '',
            procedure: formValue.procedure?.trim() || '',
            interdiction: formValue.interdiction?.trim() || '',
            effectiveDate: formValue.effectiveDate?.toDate() || new Date(),
            terminationDate: formValue.terminationDate?.toDate() || null
          };

          this.saveSuccess.emit(result);

          if (this.mode === 'edit') {
            this.mode = 'add';
            this.modeChange.emit('add');
            this.resetFormForAddMode();
            this.setupPanel();
          } else {
            this.resetFormForAddMode();
          }
              },
        error: (error) => {
          const errorText = error?.error?.errorResponse?.error || error?.error?.message || error?.error?.error || error?.message || 'An error occurred while saving';
          const errorCode = error?.error?.errorResponse?.errorCode || error?.error?.errorCode || '';
          let errorMsg: string;
          if (errorCode) {
            errorMsg = `Error ${errorCode} : ${errorText}`;
          } else {
            const match = errorText.match(/^(\d+)\s*-\s*(.+)$/);
            errorMsg = match ? `Error ${match[1]} : ${match[2]}` : errorText;
          }
          this.errorMessage = errorMsg;
          this.showNotification(errorMsg, 'error');
              }
      });
  }

  formatDateTime(date: Date | null): string {
    if (!date) return '';
    const momentDate = moment(date);
    const isToday = momentDate.isSame(moment(), 'day');

    if (isToday) {
      return momentDate.format('[Today], hh:mm A [PT]');
    } else {
      return momentDate.format('DD-MMM-YYYY, hh:mm A [PT]');
    }
  }

  get donationTypeControl() {
    return this.form.get('donationType');
  }

  get procedureControl() {
    return this.form.get('procedure');
  }

  get interdictionControl() {
    return this.form.get('interdiction');
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  getDonationTypeError(): string {
    const control = this.donationTypeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Donation Type is required';
    }
    return '';
  }

  getProcedureError(): string {
    const control = this.procedureControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Procedure is required';
    }
    return '';
  }

  getInterdictionError(): string {
    const control = this.interdictionControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Interdiction is required';
    }
    return '';
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

  get editEffectiveDateDisplay(): string {
    const date = this.form.get('effectiveDate')?.value;
    if (!date) return '-';
    return DateFieldValidationUtility.formatDateForUI(date)?.toUpperCase() || '-';
  }

  /**
   * Check if form values have changed from initial values (for edit mode)
   */
  private hasFormChanged(): boolean {
    if (this.mode !== 'edit' || !this.initialFormValues) {
      return true;
    }

    const currentDonationType = this.form.get('donationType')?.value || '';
    const currentProcedure = this.form.get('procedure')?.value || '';
    const currentInterdiction = this.form.get('interdiction')?.value || '';

    const currentEffectiveDate = this.form.get('effectiveDate')?.value;
    const currentEffectiveDateValue = currentEffectiveDate && moment.isMoment(currentEffectiveDate)
      ? currentEffectiveDate.valueOf()
      : null;

    const currentTerminationDate = this.form.get('terminationDate')?.value;
    const currentTerminationDateValue = currentTerminationDate && moment.isMoment(currentTerminationDate)
      ? currentTerminationDate.valueOf()
      : null;

    return (
      currentDonationType !== this.initialFormValues.donationType ||
      currentProcedure !== this.initialFormValues.procedure ||
      currentInterdiction !== this.initialFormValues.interdiction ||
      currentEffectiveDateValue !== this.initialFormValues.effectiveDate ||
      currentTerminationDateValue !== this.initialFormValues.terminationDate
    );
  }

  get terminationMinDate(): moment.Moment {
    return this.terminationMinDateValue;
  }

  private updateTerminationMinDate(): void {
    const effectiveDate = this.form.get('effectiveDate')?.value;
    let newMin = this.minDate;
    if (effectiveDate) {
      const effDate = moment(effectiveDate).startOf('day');
      if (effDate.isAfter(this.minDate)) {
        newMin = effDate;
      }
    }
    if (!this.terminationMinDateValue.isSame(newMin, 'day')) {
      this.terminationMinDateValue = newMin;
    }
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit') {
      return this.form.valid && this.hasFormChanged() && !this.hasDateValidationError();
    }
    return this.form.valid && !this.hasDateValidationError();
  }

  // --- Searchable dropdown support ---

  get selectedDonationTypeDisplay(): string {
    const val = this.form.get('donationType')?.value;
    if (!val) return '';
    const found = this.donationTypesSignal().find(o => o.value === val);
    return found ? found.key : val;
  }

  get selectedProcedureDisplay(): string {
    const val = this.form.get('procedure')?.value;
    if (!val) return '';
    const found = this.procedureCodesSignal().find(o => o.value === val);
    return found ? found.key : val;
  }

  get selectedInterdictionDisplay(): string {
    const val = this.form.get('interdiction')?.value;
    if (!val) return '';
    const found = this.interdictionsSignal().find(o => o.value === val);
    return found ? found.key : val;
  }

  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'DISMISS', {
      ...(type === 'success' ? { duration: 5000 } : {}),
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar'
    });
  }

  private setupSearchSubscriptions(): void {
    this.donationTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.donationTypeSearch.set(v || ''));
    this.procedureSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.procedureSearch.set(v || ''));
    this.interdictionSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.interdictionSearch.set(v || ''));
  }

  private filterItems(items: { key: string; value: string }[], search: string): { key: string; value: string }[] {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(item => {
      const key = (item.key || '').toLowerCase();
      const value = (item.value || '').toLowerCase();
      return key.includes(lower) || value.includes(lower);
    });
  }
}
