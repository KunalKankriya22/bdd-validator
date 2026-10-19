import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
  computed,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { Observable, Subject, of } from 'rxjs';
import { takeUntil, map, catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import moment, { Moment } from 'moment';
import { convertUTCToTimezone } from '@shared/date/timezone.util';

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { MasterServiceCodeService } from '../../services/master-service-code.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import {
  MasterServiceCodeDto,
  CreateMasterServiceCodeDto,
  UpdateMasterServiceCodeDto
} from '../../models/master-service-code.model';

export interface FcodeDialogData {
  record: MasterServiceCodeDto | null;
}

export interface FcodeDialogResult {
  saved: boolean;
  addAnother?: boolean;
}

@Component({
  selector: 'app-fcode-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatProgressSpinnerModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './fcode-form-dialog.component.html',
  styleUrl: './fcode-form-dialog.component.scss'
})
export class FcodeFormDialogComponent implements OnInit, OnChanges, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `fcode-form-dialog-${FcodeFormDialogComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MasterServiceCodeService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: MasterServiceCodeDto | null = null;
  @Output() panelClosed = new EventEmitter<FcodeDialogResult>();

  private readonly destroy$ = new Subject<void>();

  protected readonly loading = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);
  protected readonly currentEffectiveDate = signal<Moment | null>(null);
  protected readonly minDate = DateFieldValidationUtility.getMinDate();
  private lastChangedDateField: 'effective' | 'termination' | null = null;
  protected effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  protected termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  // Tracks form validity reactively for button disabled state
  protected readonly formValid = signal<boolean>(false);
  // Tracks whether the form has been modified (drives Save disabled in edit mode)
  protected readonly formDirty = signal<boolean>(false);
  // Tracks whether editable fields have any value (drives Clear All disabled)
  protected readonly editableFieldsFilled = signal<boolean>(false);

  form!: FormGroup;

  get isEditMode(): boolean {
    return this.mode === 'edit';
  }

  get isAddMode(): boolean {
    return this.mode === 'add';
  }

  get panelTitle(): string {
    return this.isEditMode ? 'Edit Master Service Code Details' : 'Add New Master Service Code';
  }

  protected readonly lastModifiedText = signal<string>('');

  ngOnInit(): void {
    this.initializeForm();
    this.setupModeValidators();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-initialize form when data or mode input changes
    if ((changes['data'] || changes['mode']) && this.form) {
      this.initializeForm();
      this.setupModeValidators();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    // Reset signals
    this.submitted.set(false);
    this.saving.set(false);
    this.lastModifiedText.set('');
    this.currentEffectiveDate.set(null);

    const effDate = this.data?.effDate ? moment(this.data.effDate) : null;
    const termDate = this.data?.termDate ? moment(this.data.termDate) : null;

    this.form = this.fb.group({
      billingCode: [
        this.data?.billingCode || '',
        [Validators.required, Validators.maxLength(12)],
        [this.billingCodeDuplicateValidator()]
      ],
      codeDesc: [this.data?.codeDesc || '', [Validators.required, Validators.maxLength(50)]],
      effectiveDate: [effDate],
      terminationDate: [termDate]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    // Update last modified text for edit mode
    if (this.isEditMode && this.data?.lastModifiedDate) {
      const timezone = this.headerService.getCurrentChapterTimezone() || 'UTC';
      const convertedDate = convertUTCToTimezone(this.data.lastModifiedDate, timezone);
      const formattedDate = moment(convertedDate).format('DD-MMM-YYYY, HH:mm').toUpperCase();
      const timezoneAbbr = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' })
        .formatToParts(new Date(this.data.lastModifiedDate))
        .find(p => p.type === 'timeZoneName')?.value || timezone;

      this.lastModifiedText.set(`Last Modified: ${formattedDate} ${timezoneAbbr}`);
    }
  }

  private setupModeValidators(): void {
    if (this.isEditMode) {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    }

    // Keep formValid and editableFieldsFilled signals in sync with form state
    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.formValid.set(this.form.valid));

    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formDirty.set(this.form.dirty);
        const v = this.form.value;
        this.editableFieldsFilled.set(!!(v.codeDesc || v.effectiveDate || v.terminationDate));
      });

    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: Moment | null) => {
        this.currentEffectiveDate.set(value);
        this.lastChangedDateField = 'effective';
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
  }

  /**
   * Async validator to check for duplicate billing codes
   * Only runs in add mode, not edit mode
   * Debounces to avoid excessive API calls
   */
  private billingCodeDuplicateValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      // Skip validation if no value or in edit mode
      if (!control.value || this.isEditMode) {
        return of(null);
      }

      // Debounce to avoid excessive API calls while user is typing
      return of(control.value).pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(billingCode =>
          this.service.getByCode(billingCode).pipe(
            map(response => {
              // If record exists, return duplicate error
              if (response.success && response.data && response.data.length > 0) {
                return { duplicate: true };
              }
              return null;
            }),
            catchError(() => of(null)) // On error, allow validation to pass
          )
        ),
        takeUntil(this.destroy$)
      );
    };
  }

  get f() {
    return this.form.controls;
  }

  get editBillingCodeDisplay(): string {
    return this.data?.billingCode || '—';
  }

  get editEffectiveDateDisplay(): string {
    const effDate = this.data?.effDate;
    if (!effDate) return '—';
    return moment(effDate).format('DD-MMM-YYYY').toUpperCase();
  }

  onBillingCodeInput(event: Event): void {
    if (this.isAddMode) {
      const input = event.target as HTMLInputElement;
      const uppercased = input.value.toUpperCase();
      if (input.value !== uppercased) {
        this.form.patchValue({ billingCode: uppercased }, { emitEvent: false });
        const cursorPos = input.selectionStart || 0;
        setTimeout(() => input.setSelectionRange(cursorPos, cursorPos));
      }
    }
  }

  getRemainingChars(fieldName: string, maxLength: number): string {
    const value = this.form.get(fieldName)?.value || '';
    return `Characters Remaining: ${maxLength - value.length}/${maxLength}`;
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
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.isEditMode
    );
  }

  onEffectiveDateChange(): void {
    this.form.get('terminationDate')?.updateValueAndValidity();
  }

  onCancel(): void {
    this.panelClosed.emit({ saved: false });
  }

  onClearAll(): void {
    this.form.patchValue({ codeDesc: '', terminationDate: null });
    this.form.markAsPristine();
    this.formDirty.set(false);
    this.submitted.set(false);
  }

  onSave(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');
    if (this.form.invalid) { this.focusFirstInvalidField(); return; }

    const rawValues = this.form.getRawValue();
    const billingCode = rawValues.billingCode;
    const dto: UpdateMasterServiceCodeDto = {
      codeDesc: this.form.value.codeDesc,
      effDate: DateFieldValidationUtility.serializeDateForApi(rawValues.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(rawValues.terminationDate)
    };

    this.saving.set(true);
    this.service.update(billingCode, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbarService.showSuccess(`Changes in master code ${billingCode} have been saved.`);
          this.panelClosed.emit({ saved: true });
        },
        error: (error) => {
          this.saving.set(false);
          this.snackbarService.showError(error?.error?.message || error?.message || 'Failed to update master service code');
        }
      });
  }

  onAdd(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');
    if (this.form.invalid) { this.focusFirstInvalidField(); return; }

    const dto: CreateMasterServiceCodeDto = {
      billingCode: this.form.value.billingCode,
      codeDesc: this.form.value.codeDesc,
      effDate: DateFieldValidationUtility.serializeDateForApi(this.form.value.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(this.form.value.terminationDate)
    };

    this.saving.set(true);
    this.service.create(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbarService.showSuccess(`New master code ${dto.billingCode} has been added.`);
          this.panelClosed.emit({ saved: true });
        },
        error: (error) => {
          this.saving.set(false);
          this.snackbarService.showError(error?.error?.message || error?.message || 'Failed to create master service code');
        }
      });
  }

  onAddAnother(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');
    if (this.form.invalid) { this.focusFirstInvalidField(); return; }

    const dto: CreateMasterServiceCodeDto = {
      billingCode: this.form.value.billingCode,
      codeDesc: this.form.value.codeDesc,
      effDate: DateFieldValidationUtility.serializeDateForApi(this.form.value.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(this.form.value.terminationDate)
    };

    this.saving.set(true);
    this.service.create(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbarService.showSuccess(`New master code ${dto.billingCode} has been added.`);
          this.panelClosed.emit({ saved: true, addAnother: true });
        },
        error: (error) => {
          this.saving.set(false);
          this.snackbarService.showError(error?.error?.message || error?.message || 'Failed to create master service code');
        }
      });
  }

  private focusFirstInvalidField(): void {
    const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
    if (firstInvalid) (firstInvalid as HTMLElement).focus();
  }

  onDateFieldKeyPress(event: KeyboardEvent): void {
    if (
      event.key === 'Backspace' || event.key === 'Delete' ||
      event.key === 'Tab'       || event.key === 'Escape' ||
      event.key === 'Enter'     || event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight'|| event.key === 'ArrowUp' ||
      event.key === 'ArrowDown' || event.key === 'Home' ||
      event.key === 'End'       || event.ctrlKey || event.metaKey
    ) {
      return;
    }
    if (!/^[0-9a-zA-Z\-]$/.test(event.key)) {
      event.preventDefault();
    }
  }
}
