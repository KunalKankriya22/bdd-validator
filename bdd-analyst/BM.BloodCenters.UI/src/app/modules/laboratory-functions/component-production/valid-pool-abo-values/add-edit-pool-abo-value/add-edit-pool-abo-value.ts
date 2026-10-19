import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { A11yModule } from '@angular/cdk/a11y';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import {
  PoolAboValueTableModel,
  PoolAboValueFormValue,
  LookUpWithDescription
} from '../models/pool-abo-values.model';

@Component({
  selector: 'app-add-edit-pool-abo-value',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    NgxMatSelectSearchModule,
    A11yModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-pool-abo-value.html',
  styleUrls: ['./add-edit-pool-abo-value.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditPoolAboValueComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: PoolAboValueTableModel | null = null;
  @Input() poolSldOptions: LookUpWithDescription[] = [];

  @Output() save = new EventEmitter<PoolAboValueFormValue>();
  @Output() saveAndCreateAnother = new EventEmitter<PoolAboValueFormValue>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  // Search control for Pool SLD dropdown
  poolSldSearchCtrl = new FormControl('');
  filteredPoolSldOptions: LookUpWithDescription[] = [];

  // Search control for Description dropdown
  descriptionSearchCtrl = new FormControl('');
  filteredDescriptionOptions: LookUpWithDescription[] = [];
  availableDescriptions: LookUpWithDescription[] = [];

  minDate: Moment;
  minTerminationDate: Moment;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError(),
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError(),
  );

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  constructor() {
    this.minDate = this.getChapterMinDate();
    this.minTerminationDate = this.minDate.clone();

    effect(() => {
      this.minDate = this.getChapterMinDate();
      this.updateTerminationMinDate();
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupDateValidationListeners();
    this.setupSearchFilters();
    this.setupModeValidators();
    this.setupPoolSldDescriptionUpdater();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['poolSldOptions']) {
      this.filteredPoolSldOptions = this.poolSldOptions;
    }

    // Re-initialize form when mode or data changes (switching between add/edit or editing different rows)
    if ((changes['mode'] || changes['data']) && this.form) {
      this.initializeForm();
      this.setupModeValidators();
      this.setupPoolSldDescriptionUpdater();
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupModeValidators(): void {
    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);

      // Add termination date past validator for edit mode
      const termControl = this.form.get('termDate');
      if (termControl) {
        termControl.addValidators(DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset));
        termControl.updateValueAndValidity();
      }
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }
  }

  private setupSearchFilters(): void {
    this.filteredPoolSldOptions = this.poolSldOptions;

    this.poolSldSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredPoolSldOptions = this.filterList(
          this.poolSldOptions, search, (s) => `${s.value} - ${s.description}`
        );
        this.cdr.markForCheck();
      });

    this.descriptionSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredDescriptionOptions = this.filterList(
          this.availableDescriptions, search, (s) => s.description
        );
        this.cdr.markForCheck();
      });
  }

  private filterList<T>(list: T[], search: string | null, accessor: (item: T) => string): T[] {
    if (!search) return list;
    const term = search.toLowerCase();
    return list.filter((item) => accessor(item).toLowerCase().includes(term));
  }

  private setupPoolSldDescriptionUpdater(): void {
    this.form.get('poolSld')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedValue: string | null) => {
        if (selectedValue) {
          // Filter descriptions for the selected pool
          this.availableDescriptions = this.poolSldOptions.filter(
            (option) => option.value === selectedValue
          );
          this.filteredDescriptionOptions = this.availableDescriptions;

          // Reset description field when pool changes
          this.form.get('poolSldDesc')?.setValue(null);
        } else {
          this.availableDescriptions = [];
          this.filteredDescriptionOptions = [];
          this.form.get('poolSldDesc')?.setValue(null);
        }
        this.cdr.markForCheck();
      });

    // Set initial descriptions if data exists (edit mode or pre-filled)
    const initialPoolSld = this.form.get('poolSld')?.value;
    if (initialPoolSld) {
      this.availableDescriptions = this.poolSldOptions.filter(
        (option) => option.value === initialPoolSld
      );
      this.filteredDescriptionOptions = this.availableDescriptions;
    }
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      poolSld: [
        this.mode === 'edit' ? this.data?.poolSld : null,
        [Validators.required, Validators.maxLength(4)]
      ],
      poolSldDesc: [this.data?.poolSldDesc || null], // Optional - for display only
      unitSchemeType: [this.data?.unitSchemeType || null, [Validators.required]],
      rhLabelFlag: [this.data?.rhLabelFlag || null, [Validators.required]],
      opos: [this.data?.opos || null], // Optional - API defaults null to "N"
      oneg: [this.data?.oneg || null],
      apos: [this.data?.apos || null],
      aneg: [this.data?.aneg || null],
      bpos: [this.data?.bpos || null],
      bneg: [this.data?.bneg || null],
      abpos: [this.data?.abpos || null],
      abneg: [this.data?.abneg || null],
      effDate: [
        this.data?.effDate ? moment(this.data.effDate, 'DD-MMM-YYYY') : null,
        [Validators.required]
      ],
      termDate: [
        this.data?.termDate ? moment(this.data.termDate, 'DD-MMM-YYYY') : null
      ], // Optional
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')
      ]
    });

    // Track which date field was last changed for cross-field error display
    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
      });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });

    // Note: All fields except Effective Date are editable in edit mode
  }

  private setupDateValidationListeners(): void {
    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTerminationMinDate();
        // Revalidate termination date when effective date changes
        this.form.get('termDate')?.updateValueAndValidity();
        this.cdr.markForCheck();
      });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  private updateTerminationMinDate(): void {
    const effDate = this.form?.get('effDate')?.value;
    if (effDate && moment.isMoment(effDate) && effDate.isValid()) {
      // Termination date must be >= effective date and >= chapter date
      const utcToday = this.minDate;
      this.minTerminationDate = effDate.isAfter(utcToday) ? effDate.clone() : utcToday.clone();
    } else {
      this.minTerminationDate = this.minDate.clone();
    }
  }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  /** Format effective date for display in edit mode */
  get editEffectiveDateDisplay(): string {
    const effDate = this.form?.get('effDate')?.value;
    if (!effDate) return '-';
    return DateFieldValidationUtility.formatDateForUI(effDate)?.toUpperCase() || '-';
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'),
      'Effective Date',
      'Termination Date',
      formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'),
      'Termination Date',
      'Effective Date',
      formErrors
    );
  }

  onSave(): void {
    if (this.validateForm()) {
      this.isSubmitting = true;
      this.cdr.markForCheck();
      this.save.emit(this.getFormValue());
    }
  }

  onSaveAndCreateAnother(): void {
    if (this.validateForm()) {
      this.isSubmitting = true;
      this.cdr.markForCheck();
      this.saveAndCreateAnother.emit(this.getFormValue());
    }
  }

  /** Reset submitting state - called by parent when save completes (success or error) */
  resetSubmittingState(): void {
    this.isSubmitting = false;
    this.cdr.markForCheck();
  }

  private validateForm(): boolean {
    const termControl = this.form.get('termDate');
    const termWasTouched = this.mode === 'edit' && termControl?.touched;

    this.form.markAllAsTouched();

    if (this.mode === 'edit' && !termWasTouched && termControl) {
      termControl.markAsUntouched();
    }

    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    if (this.mode === 'edit') {
      return !this.getEffectiveDateError() && !this.getTerminationDateError();
    }

    return !this.form.invalid && !this.form.hasError('dateRangeInvalid');
  }

  onCancel(): void {
    this.close.emit();
  }

  // Input handlers for date fields
  onEffDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effDate')
    );
  }

  onTermDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('termDate'),
      this.mode === 'edit'
    );
  }

  private getFormValue(): PoolAboValueFormValue {
    const raw = this.form.getRawValue();
    return {
      poolSld: raw.poolSld,
      poolSldDesc: raw.poolSldDesc,
      unitSchemeType: raw.unitSchemeType,
      rhLabelFlag: raw.rhLabelFlag,
      opos: raw.opos,
      oneg: raw.oneg,
      apos: raw.apos,
      aneg: raw.aneg,
      bpos: raw.bpos,
      bneg: raw.bneg,
      abpos: raw.abpos,
      abneg: raw.abneg,
      effDate: raw.effDate,
      termDate: raw.termDate,
    };
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit') {
      return this.form.dirty && !this.getEffectiveDateError() && !this.getTerminationDateError();
    }

    const termControl = this.form.get('termDate');
    if (termControl?.hasError('invalidDate') ||
        termControl?.hasError('invalidDateFormat') ||
        termControl?.hasError('matDatepickerParse') ||
        this.form.hasError('dateRangeInvalid')) {
      return false;
    }

    return Object.keys(this.form.controls)
      .filter(key => key !== 'termDate')
      .every(key => {
        const control = this.form.get(key);
        return !control || control.disabled || control.valid;
      });
  }

  get dialogTitle(): string {
    return this.mode === 'add' ? 'Add New Pool ABO Value' : 'Edit Pool ABO Value';
  }

  get submitButtonLabel(): string {
    return this.mode === 'add' ? 'ADD' : 'SAVE';
  }

  get showCreateAnotherButton(): boolean {
    return this.mode === 'add';
  }
}
