import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { Subject, takeUntil, finalize, debounceTime, distinctUntilChanged } from 'rxjs';
import moment from 'moment';
import { LabUserAccessService } from '../services/lab-user-access.service';
import {
  AccessClass,
  AccessLevelOption,
  AddAccessClassRequest,
  UpdateAccessClassRequest,
  AccessClassOption
} from '../models/lab-user-access.model';

@Component({
  selector: 'app-add-edit-access-class-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-access-class-panel.html',
  styleUrls: ['./add-edit-access-class-panel.scss']
})
export class AddEditAccessClassPanelComponent implements OnInit, OnChanges, OnDestroy {
  private readonly headerService = inject(HeaderService);

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: AccessClass | null = null;
  @Input() userId: string = '';
  @Input() userName: string = '';
  @Input() department: string = '';
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form: FormGroup;
  panelTitle: string = '';

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  /** Tracks whether date inputs contain unparseable text, so errors survive updateValueAndValidity() */
  private _effectiveDateHasInvalidInput = false;
  private _terminationDateHasInvalidInput = false;

  effectiveDateError = '';
  terminationDateError = '';

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.effectiveDateError);
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.terminationDateError);

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  readonly DESCRIPTION_MAX_LENGTH = 500;

  editModeValues: {
    accessClass: string;
    description: string;
    effectiveDate: string;
  } = {
      accessClass: '',
      description: '',
      effectiveDate: ''
    };

  accessClassOptions: AccessClassOption[] = [];
  filteredAccessClassOptions: AccessClassOption[] = [];
  accessClassSearchControl = new FormControl('');

  accessLevelOptions: AccessLevelOption[] = [];

  accessLevelSearchControl = new FormControl('');
  filteredAccessLevelOptions: AccessLevelOption[] = [];

  minDate!: moment.Moment;

  isLoadingOptions = false;
  isSaving = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private labUserAccessService: LabUserAccessService,
    private snackbarService: SnackbarService
  ) {
    this.form = this.fb.group({
      accessClass: ['', [Validators.required]],
      description: [{value: '', disabled: true}, [Validators.maxLength(500)]],
      accessLevel: ['', Validators.required],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });
  }

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);

    this.setupDateValidationListeners();
    this.setupPanel();
    if (this.mode === 'add') {
      this.loadAccessClassOptions();
    }
    this.loadAccessLevelOptions();
    this.setupAccessClassSearch();
    this.setupAccessLevelSearch();
    this.updateDateErrors();
  }

  private setupAccessClassSearch(): void {
    this.accessClassSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredAccessClassOptions = this.accessClassOptions.filter(option =>
          option.code.toLowerCase().includes(term) ||
          (option.description && option.description.toLowerCase().includes(term))
        );
      });
  }

  private setupAccessLevelSearch(): void {
    this.filteredAccessLevelOptions = [...this.accessLevelOptions];

    this.accessLevelSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredAccessLevelOptions = this.accessLevelOptions.filter(option =>
          option.label.toLowerCase().includes(term)
        );
      });
  }

  private setupModeValidators(): void {
    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.setupPanel();

        if (this.mode === 'add') {
          this.resetFormForAddMode();
          this.loadAccessClassOptions();
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    this._effectiveDateHasInvalidInput = false;
    this._terminationDateHasInvalidInput = false;

    if (this.mode === 'add') {
      this.panelTitle = 'Add Access Class';
    } else {
      this.panelTitle = `Edit Class ${this.data?.accessClass || ''}`;
      this.populateFormForEdit();
    }
    this.setupModeValidators();
  }

  private setupDateValidationListeners(): void {
    const compareDates = (prev: any, curr: any): boolean => {
      const p = prev && moment.isMoment(prev) ? prev.format('YYYY-MM-DD') : String(prev);
      const c = curr && moment.isMoment(curr) ? curr.format('YYYY-MM-DD') : String(curr);
      return p === c;
    };

    this.form.get('effectiveDate')?.valueChanges
      .pipe(distinctUntilChanged(compareDates), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.lastChangedDateField = 'effective';
        if (value && moment.isMoment(value) && value.isValid()) {
          this._effectiveDateHasInvalidInput = false;
        }
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(distinctUntilChanged(compareDates), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.lastChangedDateField = 'termination';
        if (value && moment.isMoment(value) && value.isValid()) {
          this._terminationDateHasInvalidInput = false;
        }
      });

    this.form.statusChanges
      .pipe(debounceTime(0), takeUntil(this.destroy$))
      .subscribe(() => { this.updateDateErrors(); });
  }

  updateDateErrors(): void {
    const effFormErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    this.effectiveDateError = DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', effFormErrors
    );

    if (!this.effectiveDateError && this._effectiveDateHasInvalidInput) {
      const effControl = this.form.get('effectiveDate');
      if (effControl && (effControl.touched || effControl.dirty) && !effControl.value) {
        this.effectiveDateError = 'Effective Date is invalid';
      }
    }

    const termFormErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    this.terminationDateError = DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'), 'Termination Date', 'Effective Date', termFormErrors
    );

    if (!this.terminationDateError && this._terminationDateHasInvalidInput) {
      const termControl = this.form.get('terminationDate');
      if (termControl && (termControl.touched || termControl.dirty) && !termControl.value) {
        this.terminationDateError = 'Termination Date is invalid';
      }
    }

    if (this.mode === 'edit' && !this.terminationDateError) {
      const termControl = this.form.get('terminationDate');
      if (termControl && (termControl.touched || termControl.dirty) && termControl.value) {
        const selectedDate = moment.isMoment(termControl.value) ? termControl.value : moment(termControl.value);
        if (selectedDate.isValid()) {
          const today = DateFieldValidationUtility.getMinDate(this.chapterOffset);
          if (selectedDate.format('YYYY-MM-DD') < today.format('YYYY-MM-DD')) {
            this.terminationDateError = 'Termination date cannot be past date';
          }
        }
      }
    }
  }

  private loadAccessClassOptions(): void {
    this.isLoadingOptions = true;

    this.labUserAccessService
      .getAccessClassOptions(this.headerService.getCurrentChapterId())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoadingOptions = false))
      )
      .subscribe({
        next: (response) => {
          this.accessClassOptions = response || [];
          this.filteredAccessClassOptions = [...this.accessClassOptions];
        },
        error: () => {
          this.accessClassOptions = [];
          this.filteredAccessClassOptions = [];
        }
      });
  }

  private loadAccessLevelOptions(): void {
    this.isLoadingOptions = true;

    this.labUserAccessService
      .getAccessLevelOptions(this.headerService.getCurrentChapterId())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoadingOptions = false))
      )
      .subscribe({
        next: (options) => {
          this.accessLevelOptions = options || [];
          this.filteredAccessLevelOptions = [...this.accessLevelOptions];
        },
        error: () => {
          this.accessLevelOptions = [];
          this.filteredAccessLevelOptions = [];
        }
      });
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      accessClass: '',
      description: '',
      effectiveDate: ''
    };

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    // Update minDate for add mode with current chapter offset
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);

    // Enable all fields for add mode (description stays disabled - auto-populated from class)
    this.form.get('accessClass')?.enable();
    this.form.get('effectiveDate')?.enable();
    this.form.get('description')?.disable();

    // Restore validators for add mode (with effectiveDateNotPastValidator)
    this.form.get('accessClass')?.setValidators([Validators.required]);
    this.form.get('accessLevel')?.setValidators([Validators.required]);
    this.form.get('effectiveDate')?.setValidators([Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset)]);
    this.form.get('description')?.setValidators([Validators.maxLength(this.DESCRIPTION_MAX_LENGTH)]);

    this.form.get('accessClass')?.updateValueAndValidity();
    this.form.get('accessLevel')?.updateValueAndValidity();
    this.form.get('effectiveDate')?.updateValueAndValidity();
    this.form.get('description')?.updateValueAndValidity();
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    this.editModeValues = {
      accessClass: this.data.accessClass,
      description: this.data.description,
      effectiveDate: this.data.effectiveDate ? this.formatDateForDisplay(this.data.effectiveDate) : ''
    };

    // Disable non-editable fields in edit mode
    this.form.get('accessClass')?.disable();

    // Clear validators for disabled fields
    this.form.get('accessClass')?.clearValidators();
    this.form.get('accessClass')?.updateValueAndValidity();


    this.form.patchValue({
      accessClass: this.data.accessClass,
      description: this.data.description,
      accessLevel: this.data.accessLevel,
      effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
      terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
    });

    this.form.markAsPristine();
  }

  private formatDateForDisplay(date: string | null | undefined): string {
    if (!date) return '';
    return moment(date).format('DD-MMM-YYYY').toUpperCase();
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

    this.isSaving = true;

    const formValue = this.form.getRawValue();

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: AddAccessClassRequest = {
        userId: this.userId?.toUpperCase(),
        accessClass: formValue.accessClass,
        description: formValue.description || '',
        accessLevel: formValue.accessLevel,
        effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate)
          || DateFieldValidationUtility.getMinDate(this.chapterOffset).format('YYYY-MM-DD'),
        terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
      };
      apiCall = this.labUserAccessService.addUserAccessClass(addPayload, this.headerService.getCurrentChapterId());
    } else {
      const updatePayload: UpdateAccessClassRequest = {
        userId: this.userId?.toUpperCase(),
        description: this.data?.description || '',
        accessLevel: formValue.accessLevel,
        effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate)
          || DateFieldValidationUtility.getMinDate(this.chapterOffset).format('YYYY-MM-DD'),
        terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
      };
      apiCall = this.labUserAccessService.updateUserAccessClass(
        this.data?.accessClass || '',
        updatePayload,
        this.headerService.getCurrentChapterId()
      );
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
          const accessClass = this.mode === 'add'
            ? formValue.accessClass
            : this.data?.accessClass || '';
          const message = this.mode === 'add'
            ? `New Access class ${accessClass} has been assigned successfully to ${this.userName}.`
            : `Access class ${accessClass} has been updated successfully.`;
          this.snackbarService.showSuccess(message);
          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: (error: any) => {
           this.isSaving = false;
        }
      });
  }

  onAccessClassChange(selectedCode: string): void {
    const selectedOption = this.accessClassOptions.find(opt => opt.code === selectedCode);
    if (selectedOption) {
      this.form.patchValue({
        description: selectedOption.description
      });
    }
  }

  getSelectedDescription(): string {
    const accessClass = this.form.get('accessClass')?.value;
    if (!accessClass) return '';
    const selectedOption = this.accessClassOptions.find(opt => opt.code === accessClass);
    return selectedOption?.description || '';
  }

  private hasDateValidationError(): boolean {
    return this.form.hasError('dateRangeInvalid') || false;
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit') {
      if (!this.form.dirty) return false;

      const termControl = this.form.get('terminationDate');
      const termHasRealError = termControl &&
        (termControl.hasError('invalidDate') || termControl.hasError('invalidDateFormat') || termControl.hasError('matDatepickerParse'));
      if (termHasRealError) return false;

      if (this.effectiveDateError || this.terminationDateError) return false;

      const otherControlsValid = Object.keys(this.form.controls)
        .filter(key => key !== 'terminationDate')
        .every(key => {
          const control = this.form.get(key);
          return !control || control.disabled || control.valid;
        });

      return otherControlsValid && !this.hasDateValidationError();
    }

    return this.form.valid && !this.hasDateValidationError();
  }

  get accessClassControl() {
    return this.form.get('accessClass');
  }

  get descriptionControl() {
    return this.form.get('description');
  }

  get accessLevelControl() {
    return this.form.get('accessLevel');
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  get terminationDateMin(): moment.Moment {
    const effDate = this.form.get('effectiveDate')?.value;
    if (effDate && moment.isMoment(effDate) && effDate.isValid()) {
      if (this.mode === 'edit') {
        return effDate.clone().startOf('day');
      }
      return effDate.isAfter(this.minDate, 'day') ? effDate.clone().startOf('day') : this.minDate;
    }
    return this.minDate;
  }


  onEffectiveDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleStartDateInput(inputValue, this.form.get('effectiveDate'));
    this._effectiveDateHasInvalidInput = !!inputValue?.trim() && !this.form.get('effectiveDate')?.value;
  }

  onTerminationDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleEndDateInput(inputValue, this.form.get('terminationDate'), this.mode === 'edit');
    this._terminationDateHasInvalidInput = !!inputValue?.trim() && !this.form.get('terminationDate')?.value;
  }

  getDescriptionRemainingCharacters(): string {
    const length = this.descriptionControl?.value?.length || 0;
    const remaining = this.DESCRIPTION_MAX_LENGTH - length;
    return `${remaining}/${this.DESCRIPTION_MAX_LENGTH}`;
  }
}
