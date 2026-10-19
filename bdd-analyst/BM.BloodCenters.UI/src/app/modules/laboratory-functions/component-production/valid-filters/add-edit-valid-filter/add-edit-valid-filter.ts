import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
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
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { HeaderService } from '@shared/services/header.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import {
  ValidFilterModel,
  ValidFilterFormValue,
  CatalogDropdownItem,
  DropdownItem,
} from '../models/valid-filters.model';

@Component({
  selector: 'app-add-edit-valid-filter',
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
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-valid-filter.html',
  styleUrls: ['./add-edit-valid-filter.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditValidFilterComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ValidFilterModel | null = null;
  @Input() catalogOptions: CatalogDropdownItem[] = [];
  @Input() productTypeOptions: DropdownItem[] = [];

  @Output() save = new EventEmitter<ValidFilterFormValue>();
  @Output() saveAndCreateAnother = new EventEmitter<ValidFilterFormValue>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private originalTerminationDate: string | null = null;

  catalogSearchCtrl = new FormControl('');
  filteredCatalogOptions: CatalogDropdownItem[] = [];

  productTypeSearchCtrl = new FormControl('');
  filteredProductTypeOptions: DropdownItem[] = [];

  minDate: Moment;
  terminationMinDate: Moment;

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
    this.terminationMinDate = this.minDate;

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
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['catalogOptions']) {
      this.filteredCatalogOptions = this.catalogOptions;
    }
    if (changes['productTypeOptions']) {
      this.filteredProductTypeOptions = this.productTypeOptions;
    }
    if ((changes['data'] || changes['mode']) && this.form) {
      this.reinitializeForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupModeValidators(): void {
    if (this.mode === 'edit') {
      this.originalTerminationDate = this.data?.termDate
        ? moment(this.data.termDate).format('YYYY-MM-DD')
        : null;
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);

      const effControl = this.form.get('effDate');
      if (effControl) {
        effControl.enable();
        effControl.setValidators([
          Validators.required,
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator(),
        ]);
        effControl.updateValueAndValidity();
      }

      const termControl = this.form.get('termDate');
      if (termControl) {
        termControl.addValidators(
          DateFieldValidationUtility.editModeTerminationDateValidator(this.originalTerminationDate, this.chapterOffset)
        );
        termControl.updateValueAndValidity();
      }

      Promise.resolve().then(() => {
        this.clearMinValidatorForOriginalDate();
        this.cdr.markForCheck();
      });
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }
  }

  private setupSearchFilters(): void {
    this.filteredCatalogOptions = this.catalogOptions;
    this.filteredProductTypeOptions = this.productTypeOptions;

    this.catalogSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredCatalogOptions = this.filterCatalogList(this.catalogOptions, search);
        this.cdr.markForCheck();
      });

    this.productTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredProductTypeOptions = this.filterDropdownList(this.productTypeOptions, search);
        this.cdr.markForCheck();
      });
  }

  private filterCatalogList(list: CatalogDropdownItem[], search: string | null): CatalogDropdownItem[] {
    if (!search) return list;
    const term = search.toLowerCase();
    return list.filter((item) =>
      item.catalogNumber.toLowerCase().includes(term) ||
      item.vendorName.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term)
    );
  }

  private filterDropdownList(list: DropdownItem[], search: string | null): DropdownItem[] {
    if (!search) return list;
    const term = search.toLowerCase();
    return list.filter((item) =>
      item.code.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term)
    );
  }



  private reinitializeForm(): void {
    this.isSubmitting = false;
    this.errorMessage = null;
    this.lastChangedDateField = null;
    this.catalogSearchCtrl.setValue('');
    this.productTypeSearchCtrl.setValue('');

    this.form.get('vendorName')?.enable();
    this.form.get('catalogNumber')?.enable();

    this.form.reset({
      vendorName: this.data?.vendorName || null,
      catalogNumber: this.data?.catalogNumber || null,
      productType: this.data?.productType || null,
      numberOfDays: this.data?.numberOfDays ?? null,
      effDate: this.data?.effDate ? moment(this.data.effDate) : null,
      termDate: this.data?.termDate ? moment(this.data.termDate) : null,
    });

    if (this.mode === 'edit') {
      this.form.get('vendorName')?.disable();
      this.form.get('catalogNumber')?.disable();
    }

    this.form.clearValidators();
    this.form.addValidators(DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate'));

    const effControl = this.form.get('effDate');
    if (effControl) {
      effControl.clearValidators();
      effControl.addValidators(Validators.required);
    }

    const termControl = this.form.get('termDate');
    if (termControl) {
      termControl.clearValidators();
    }

    if (this.mode === 'edit') {
      this.originalTerminationDate = this.data?.termDate
        ? moment(this.data.termDate).format('YYYY-MM-DD')
        : null;
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);

      if (effControl) {
        effControl.enable();
        effControl.setValidators([
          Validators.required,
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator(),
        ]);
        effControl.updateValueAndValidity();
      }

      if (termControl) {
        termControl.addValidators(
          DateFieldValidationUtility.editModeTerminationDateValidator(this.originalTerminationDate, this.chapterOffset)
        );
        termControl.updateValueAndValidity();
      }

      Promise.resolve().then(() => {
        this.clearMinValidatorForOriginalDate();
        this.cdr.markForCheck();
      });
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }

    this.updateTerminationMinDate();
    this.form.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      vendorName: [
        this.data?.vendorName || null,
        [Validators.required, Validators.maxLength(50)]
      ],
      catalogNumber: [
        this.data?.catalogNumber || null,
        [Validators.required, Validators.maxLength(10)]
      ],
      productType: [
        this.data?.productType || null,
        [Validators.required, Validators.maxLength(6)]
      ],
      numberOfDays: [
        this.data?.numberOfDays ?? null,
        [Validators.required, Validators.min(0), Validators.max(9999)]
      ],
      effDate: [
        this.data?.effDate ? moment(this.data.effDate) : null,
        [Validators.required]
      ],
      termDate: [
        this.data?.termDate ? moment(this.data.termDate) : null
      ],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

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

    if (this.mode === 'edit') {
      this.form.get('vendorName')?.disable();
      this.form.get('catalogNumber')?.disable();
    }
  }

  private setupDateValidationListeners(): void {
    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTerminationMinDate();
        this.cdr.markForCheck();
      });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearMinValidatorForOriginalDate();
        this.cdr.markForCheck();
      });
  }

  private updateTerminationMinDate(): void {
    const effDate = this.form?.get('effDate')?.value;
    if (effDate && moment.isMoment(effDate) && effDate.isAfter(this.minDate)) {
      this.terminationMinDate = effDate.clone();
    } else {
      this.terminationMinDate = this.minDate;
    }
  }

  private clearMinValidatorForOriginalDate(): void {
    if (this.mode !== 'edit' || !this.originalTerminationDate) return;
    const termControl = this.form.get('termDate');
    if (!termControl?.hasError('matDatepickerMin')) return;
    const termValue = termControl.value;
    if (!termValue || !moment.isMoment(termValue)) return;
    const originalMoment = moment(this.originalTerminationDate, 'YYYY-MM-DD');
    if (termValue.isSame(originalMoment, 'day')) {
      const errors = { ...termControl.errors };
      delete errors['matDatepickerMin'];
      termControl.setErrors(Object.keys(errors).length ? errors : null);
    }
  }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  get lastModifiedDisplay(): string {
    if (!this.data?.lastModifiedDate) return '';
    const pst = moment.utc(this.data.lastModifiedDate).utcOffset(-8);
    if (!pst.isValid()) return '';
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(pst.date()).padStart(2, '0');
    const month = MONTHS[pst.month()];
    const year = pst.year();
    const hours = String(pst.hours()).padStart(2, '0');
    const minutes = String(pst.minutes()).padStart(2, '0');
    return `Last Modified: ${day}-${month}-${year}, ${hours}:${minutes} PST`;
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
      this.save.emit(this.getFormValue());
    }
  }

  onSaveAndCreateAnother(): void {
    if (this.validateForm()) {
      this.isSubmitting = true;
      this.saveAndCreateAnother.emit(this.getFormValue());
    }
  }

  private validateForm(): boolean {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    if (this.form.invalid) {
      return false;
    }

    if (this.hasDateValidationError()) {
      this.form.get('termDate')?.markAsTouched();
      return false;
    }

    return true;
  }

  private hasDateValidationError(): boolean {
    return this.form.hasError('dateRangeInvalid') ||
      !!this.getEffectiveDateError() ||
      !!this.getTerminationDateError();
  }

  onCancel(): void {
    this.close.emit();
  }

  onDaysKeyDown(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowed.includes(event.key) || (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase()))) {
      return;
    }
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onDaysPaste(event: ClipboardEvent): void {
    const paste = event.clipboardData?.getData('text') || '';
    if (!/^\d{1,4}$/.test(paste) || parseInt(paste, 10) > 9999) {
      event.preventDefault();
    }
  }

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

  private getFormValue(): ValidFilterFormValue {
    const raw = this.form.getRawValue();
    return {
      vendorName: raw.vendorName,
      catalogNumber: raw.catalogNumber,
      productType: raw.productType,
      numberOfDays: raw.numberOfDays === '' ? null : raw.numberOfDays,
      effDate: raw.effDate,
      termDate: raw.termDate,
    };
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit') {
      if (!this.form.dirty) return false;
      return this.form.valid && !this.hasDateValidationError();
    }
    return this.form.valid && !this.hasDateValidationError();
  }

  get dialogTitle(): string {
    return this.mode === 'add' ? 'Add Filter' : 'Edit Filters';
  }

  get submitButtonLabel(): string {
    return this.mode === 'add' ? 'ADD' : 'SAVE';
  }

  get showCreateAnotherButton(): boolean {
    return this.mode === 'add';
  }
}
