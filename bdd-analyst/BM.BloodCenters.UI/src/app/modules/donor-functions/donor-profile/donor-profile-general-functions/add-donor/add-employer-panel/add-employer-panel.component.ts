import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  inject,
  ChangeDetectorRef,
  ElementRef,
  signal,
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs';

import { DonorEmployerService } from '../../../../registration/registration-maintenance/maintain-donor-employer/services/donor-employer.service';
import { CreateDonorEmployerRequest } from '../../../../registration/registration-maintenance/maintain-donor-employer/models/donor-employer.model';
import { CityStateResult } from '../models/add-donor.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { SnackbarService } from '@shared/services/snackbar.service';
import { AddDonorService } from '../services/add-donor.service';

@Component({
  selector: 'app-add-employer-panel',
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
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-employer-panel.component.html',
  styleUrls: ['./add-employer-panel.component.scss']
})
export class AddEmployerPanelComponent implements OnInit, OnDestroy {
  @Output() save = new EventEmitter<{ message: string; employerId: string; employerName: string }>();
  @Output() close = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private donorEmployerService = inject(DonorEmployerService);
  private addDonorService = inject(AddDonorService);
  private cdr = inject(ChangeDetectorRef);
  private readonly el = inject(ElementRef);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);

  form!: FormGroup;
  isLoading = false;
  isSaving = false;

  zipOptions = signal<{ code: string; description: string }[]>([]);
  cityResults = signal<CityStateResult[]>([]);
  countries: { code: string; description: string }[] = [];

  readonly countrySearchCtrl = new FormControl('');
  private readonly countrySearch = signal('');
  private readonly countriesSignal = signal<{ code: string; description: string }[]>([]);
  readonly filteredCountries = this.filterCountries.bind(this);

  private isSettingCityFromZip = false;

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
    this.form = this.fb.group({
      employerName: ['', [Validators.required, Validators.maxLength(50)]],
      addressType: ['N', Validators.required],
      city: ['', [Validators.maxLength(50)]],
      zipCode: ['', [Validators.maxLength(5)]],
      state: [''],
      intlCity: ['', [Validators.maxLength(50)]],
      intlState: ['', [Validators.maxLength(2)]],
      intlPostalCode: ['', [Validators.maxLength(15)]],
      intlCountryName: ['', [Validators.maxLength(50)]]
    });

    this.updateAddressValidators('N');

    this.form.get('addressType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type) => {
        this.updateAddressValidators(type);
      });
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
      intlStateControl?.setValidators([Validators.maxLength(2)]);
      intlPostalCodeControl?.setValidators([Validators.maxLength(15)]);
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

  private filterCountries(): { code: string; description: string }[] {
    const search = this.countrySearch();
    const items = this.countriesSignal();
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(item => item.description.toLowerCase().includes(lower) || item.code.toLowerCase().includes(lower));
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

  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.form.controls)
      .find(key => this.form.controls[key].invalid);
    if (firstInvalidControl) {
      const el = this.el.nativeElement.querySelector(
        `[formControlName="${firstInvalidControl}"]`
      ) as HTMLElement;
      if (el) {
        el.focus();
      }
    }
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
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

    const effDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone()).format('YYYY-MM-DD');

    const request: CreateDonorEmployerRequest = {
      employerName: formValue.employerName.trim(),
      effDate: effDate,
      termDate: null,
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
          this.snackbarService.showError(HttpErrorHandler.extractErrorMessage(error, 'An error occurred while saving'));
        }
      });
  }

  onCancel(): void {
    this.close.emit();
  }
}
