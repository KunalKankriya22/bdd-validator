import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  inject,
  ChangeDetectorRef,
  signal,
  computed
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
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, distinctUntilChanged, debounceTime, filter, switchMap, tap } from 'rxjs';
import moment, { Moment } from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DonorEmployerService } from '../services/donor-employer.service';
import { CreateDonorEmployerRequest } from '../models/donor-employer.model';
import { CityStateResult } from '../../../../donor-profile/donor-profile-general-functions/add-donor/models/add-donor.model';
import { AddDonorService } from '../../../../donor-profile/donor-profile-general-functions/add-donor/services/add-donor.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';

@Component({
  selector: 'app-add-employer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-employer-dialog.html',
  styleUrls: ['./add-employer-dialog.scss']
})
export class AddEmployerDialog implements OnInit, OnDestroy {
  @Output() save = new EventEmitter<{ message: string; employerId: string; employerName: string }>();
  @Output() close = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private donorEmployerService = inject(DonorEmployerService);
  private addDonorService = inject(AddDonorService);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);

  form!: FormGroup;
  isLoading = false;
  isSaving = false;

  minDate: Moment;
  terminationMinDate: Moment;
  private lastChangedDateField: 'effective' | 'termination' | null = null;
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  zipOptions = signal<{ code: string; description: string }[]>([]);
  cityResults = signal<CityStateResult[]>([]);
  countries: { code: string; description: string }[] = [];

  readonly countrySearchCtrl = new FormControl('');
  private readonly countrySearch = signal('');
  private readonly countriesSignal = signal<{ code: string; description: string }[]>([]);
  readonly filteredCountries = computed(() => {
    const search = this.countrySearch();
    const items = this.countriesSignal();
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(item => item.description.toLowerCase().includes(lower) || item.code.toLowerCase().includes(lower));
  });

  private isSettingCityFromZip = false;

  constructor() {
    this.minDate = this.getChapterMinDate();
    this.terminationMinDate = this.minDate;
  }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  private updateTerminationMinDate(): void {
    const effectiveValue = this.form?.get('effDate')?.value;
    let effectiveMoment: Moment | null = null;
    if (effectiveValue && moment.isMoment(effectiveValue) && effectiveValue.isValid()) {
      effectiveMoment = effectiveValue.clone();
    } else if (effectiveValue instanceof Date && !isNaN(effectiveValue.getTime())) {
      effectiveMoment = moment(effectiveValue);
    }
    if (effectiveMoment) {
      this.terminationMinDate = effectiveMoment.isAfter(this.minDate) ? effectiveMoment : this.minDate.clone();
    } else {
      this.terminationMinDate = this.minDate;
    }
  }

  ngOnInit(): void {
    this.isLoading = false;
    this.initializeForm();
    this.setupCityToZipLookup();
    this.setupZipToCityLookup();
    this.loadCountries();
    this.countrySearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.countrySearch.set(val || ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const defaultEffDate = this.getChapterMinDate();

    this.form = this.fb.group({
      employerName: ['', [Validators.required, Validators.maxLength(50)]],
      addressType: ['N', Validators.required],
      city: ['', [Validators.maxLength(50)]],
      zipCode: ['', [Validators.maxLength(5)]],
      state: [''],
      intlCity: ['', [Validators.maxLength(50)]],
      intlState: ['', [Validators.maxLength(2)]],
      intlPostalCode: ['', [Validators.maxLength(15)]],
      intlCountryName: ['', [Validators.maxLength(50)]],
      effDate: [defaultEffDate, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]],
      termDate: [null]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')] });

    this.updateAddressValidators('N');
    this.setupDateListeners();

    this.form.get('addressType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type) => {
        this.updateAddressValidators(type);
      });
  }

  private setupDateListeners(): void {
    this.form.get('effDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
      });

    this.form.get('termDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.form.get('termDate')?.markAsTouched();
        this.form.get('termDate')?.markAsDirty();
        this.form.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effDate')
    );
  }

  onEffectiveDateChange(): void {
    this.form.get('effDate')?.markAsTouched();
    this.form.get('effDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('termDate'),
      true
    );
    this.form.get('termDate')?.markAsTouched();
    this.form.get('termDate')?.markAsDirty();
    this.form.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  onTerminationDateChange(): void {
    this.form.get('termDate')?.markAsTouched();
    this.form.get('termDate')?.markAsDirty();
    this.form.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  private updateAddressValidators(addressType: string): void {
    const cityControl = this.form.get('city');
    const zipCodeControl = this.form.get('zipCode');
    const stateControl = this.form.get('state');
    const intlCityControl = this.form.get('intlCity');
    const intlStateControl = this.form.get('intlState');
    const intlPostalCodeControl = this.form.get('intlPostalCode');
    const intlCountryControl = this.form.get('intlCountryName');

    if (addressType === 'N') {
      cityControl?.setValidators([Validators.required, Validators.maxLength(50)]);
      zipCodeControl?.setValidators([Validators.required, Validators.maxLength(5)]);
      stateControl?.clearValidators();
      intlCityControl?.clearValidators();
      intlStateControl?.clearValidators();
      intlPostalCodeControl?.clearValidators();
      intlCountryControl?.clearValidators();
    } else {
      cityControl?.clearValidators();
      zipCodeControl?.clearValidators();
      stateControl?.clearValidators();
      intlCityControl?.setValidators([Validators.required, Validators.maxLength(50)]);
      intlStateControl?.setValidators([Validators.required, Validators.maxLength(2)]);
      intlPostalCodeControl?.setValidators([Validators.required, Validators.maxLength(15)]);
      intlCountryControl?.setValidators([Validators.required, Validators.maxLength(50)]);
    }

    cityControl?.updateValueAndValidity();
    zipCodeControl?.updateValueAndValidity();
    stateControl?.updateValueAndValidity();
    intlCityControl?.updateValueAndValidity();
    intlStateControl?.updateValueAndValidity();
    intlPostalCodeControl?.updateValueAndValidity();
    intlCountryControl?.updateValueAndValidity();
  }

  get isDomestic(): boolean {
    return this.form.get('addressType')?.value === 'N';
  }

  convertToUpperCase(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const upperValue = value.toUpperCase();

    if (value !== upperValue) {
      const control = this.form.get(controlName);
      control?.setValue(upperValue, { emitEvent: false });

      const cursorPosition = input.selectionStart || 0;
      setTimeout(() => {
        input.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    }
  }

  onlyNumbers(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  private setupCityToZipLookup(): void {
    this.form.get('city')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        filter(() => !this.isSettingCityFromZip),
        filter((city) => {
          const val = (city || '').toString().trim();
          return val.length >= 3;
        }),
        switchMap((city) => this.donorEmployerService.getZipsByCity((city || '').toString().trim().toUpperCase()))
      )
      .subscribe(results => {
        if (results.length > 0) {
          const currentZip = (this.form.get('zipCode')?.value || '').toString().trim();
          const validZips = results.map(z => z.code);
          if (currentZip && !validZips.includes(currentZip)) {
            this.form.patchValue({ zipCode: '', state: '' }, { emitEvent: false });
            this.form.get('zipCode')?.setErrors(null);
          }
          this.zipOptions.set(results);
          this.form.get('city')?.setErrors(null);
        } else {
          this.zipOptions.set([]);
        }
        this.cdr.markForCheck();
      });
  }

  private setupZipToCityLookup(): void {
    this.form.get('zipCode')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        tap((zip) => {
          const zipVal = (zip || '').toString().trim();
          if (!zipVal) {
            this.zipOptions.set([]);
            this.form.patchValue({ state: '' }, { emitEvent: false });
            const city = (this.form.get('city')?.value || '').toString().trim().toUpperCase();
            if (city.length >= 3) {
              this.donorEmployerService.getZipsByCity(city)
                .pipe(takeUntil(this.destroy$))
                .subscribe(zips => {
                  if (zips.length > 0) {
                    this.zipOptions.set(zips);
                  }
                  this.cdr.markForCheck();
                });
            }
            this.cdr.markForCheck();
          }
        }),
        filter((zip) => !!zip && (zip || '').toString().trim().length === 5),
        switchMap((zip) => this.addDonorService.getCitiesByZip((zip || '').toString().trim()))
      )
      .subscribe(results => {
        this.zipOptions.set([]);
        if (results.length > 0) {
          this.form.get('zipCode')?.setErrors(null);
          if (results.length === 1) {
            this.isSettingCityFromZip = true;
            this.cityResults.set([]);
            this.form.patchValue({
              city: results[0].city,
              state: results[0].state,
            }, { emitEvent: false });
            setTimeout(() => this.isSettingCityFromZip = false, 0);
          } else {
            this.cityResults.set(results);
            this.form.patchValue({ city: '', state: '' }, { emitEvent: false });
          }
        } else {
          this.cityResults.set([]);
          this.form.patchValue({ city: '', state: '' }, { emitEvent: false });
          this.form.get('zipCode')?.setErrors({ invalidZip: true });
          this.form.get('zipCode')?.markAsTouched();
        }
        this.cdr.markForCheck();
      });
  }

  onZipOptionSelected(option: { code: string; description: string }): void {
    const parts = option.description.split(' - ');
    const state = parts.length > 1 ? parts[1].trim() : '';
    this.form.patchValue({
      zipCode: option.code,
      state,
    }, { emitEvent: false });
    this.addDonorService.getCitiesByZip(option.code)
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        if (results.length > 1) {
          this.cityResults.set(results);
        } else {
          this.cityResults.set([]);
        }
        this.cdr.markForCheck();
      });
  }

  onCityOptionSelected(result: CityStateResult): void {
    this.isSettingCityFromZip = true;
    this.form.patchValue({
      city: result.city,
      state: result.state,
      zipCode: result.zip,
    }, { emitEvent: false });
    setTimeout(() => this.isSettingCityFromZip = false, 0);
    this.cdr.markForCheck();
  }

  onCityBlur(): void {
    const city = (this.form.get('city')?.value || '').toString().trim().toUpperCase();
    if (city) {
      this.form.patchValue({ city }, { emitEvent: false });
    } else {
      this.zipOptions.set([]);
      this.form.patchValue({ state: '' }, { emitEvent: false });
    }
  }

  private loadCountries(): void {
    this.donorEmployerService.getCountries()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (countries) => {
          this.countries = countries.map(c => ({
            code: c.code,
            description: c.description
          }));
          this.countriesSignal.set(this.countries);
          this.cdr.markForCheck();
        },
        error: () => {
          this.countries = [];
          this.countriesSignal.set([]);
          this.cdr.markForCheck();
        }
      });
  }

  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    this.cdr.markForCheck();

    if (this.form.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    this.isSaving = true;
    const formValue = this.form.getRawValue();
    const isDomestic = formValue.addressType === 'N';

    const cityValue = isDomestic ? (formValue.city?.trim() || '') : '';
    const zipValue = isDomestic ? (formValue.zipCode?.trim() || '') : '';

    const request: CreateDonorEmployerRequest = {
      employerName: formValue.employerName.trim(),
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate),
      uspsId: 0,
      city: cityValue,
      zip: zipValue,
      intlAddrFlag: isDomestic ? 'N' : 'Y',
      intlCity: !isDomestic ? (formValue.intlCity?.trim() || '') : '',
      intlState: !isDomestic ? (formValue.intlState?.trim() || '') : '',
      intlPostalCode: !isDomestic ? (formValue.intlPostalCode?.trim() || '') : '',
      intlCountryName: !isDomestic ? (formValue.intlCountryName?.trim() || '') : '',
      insertUser: this.loginService.getStoredUsername(),
      insertDate: DateFieldValidationUtility.getChapterLocalDateForInsertISO(),
      currentChapterId: this.headerService.chapterId(),
      currentWarehouseId: this.headerService.warehouseId()
    };

    this.donorEmployerService.create(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          const employerId = (response as any).data?.employerId || (response as any).item?.employerId || '';
          const employerName = formValue.employerName.trim();
          this.save.emit({
            message: `New employer ${employerId} added successfully.`,
            employerId,
            employerName
          });
        },
        error: (error) => {
          this.isSaving = false;
          this.snackBar.open(HttpErrorHandler.extractErrorMessage(error, 'An error occurred while saving'), 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.form.controls)
      .find(key => this.form.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}
