import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, debounceTime, distinctUntilChanged, filter, map, merge, switchMap, takeUntil, tap } from 'rxjs';
import { AlternateDemographicsService } from '../../services/alternate-demographics.service';
import { SnackbarService } from '../../services/snackbar.service';
import {
  AlternateDemographicsDialogData,
  AlternateDemographicsModel,
  CityStateResult,
  PREFERRED_CONTACT_PHONE_OPTIONS,
  PREFERRED_CONTACT_ADDRESS_OPTIONS
} from '../../models/alternate-demographics.model';
import { CountryModel } from '../../models/international-address.model';

@Component({
  selector: 'app-alternate-demographics-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './alternate-demographics-dialog.component.html',
  styleUrl: './alternate-demographics-dialog.component.scss'
})
export class AlternateDemographicsDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AlternateDemographicsDialogComponent>);
  readonly data = inject<AlternateDemographicsDialogData>(MAT_DIALOG_DATA);
  private readonly service = inject(AlternateDemographicsService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  readonly form: FormGroup;
  readonly countries = signal<CountryModel[]>([]);
  readonly cityStateResults = signal<CityStateResult[]>([]);
  readonly zipOptions = signal<{ code: string; description: string }[]>([]);
  readonly preferredContactPhoneOptions = PREFERRED_CONTACT_PHONE_OPTIONS;
  readonly preferredContactAddressOptions = PREFERRED_CONTACT_ADDRESS_OPTIONS;
  readonly isReadOnly = signal(false);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isFormDirty = signal(false);
  readonly isFormCleared = signal(false);

  private savedLocalValues: Record<string, string | number | null> = {};
  private savedIntlValues: Record<string, string> = {};

  constructor() {
    this.form = this.fb.group({
      addressType: ['L'],
      streetName: ['', [Validators.required, Validators.maxLength(50)]],
      suiteApt: ['', [Validators.maxLength(10)]],
      city: ['', [Validators.maxLength(50)]],
      state: [{ value: '', disabled: true }, [Validators.maxLength(2)]],
      zip: ['', [Validators.required, Validators.maxLength(5)]],
      uspsId: [null as number | null],
      intlAddress1: ['', [Validators.required, Validators.maxLength(50)]],
      intlAddress2: ['', [Validators.maxLength(50)]],
      intlAddress3: ['', [Validators.maxLength(50)]],
      intlAddress4: ['', [Validators.maxLength(50)]],
      intlCity: ['', [Validators.maxLength(50)]],
      countryName: ['', [Validators.required, Validators.maxLength(50)]],
      intlPostalCode: ['', [Validators.maxLength(15)]],
      mobilePhoneNumber: ['', [Validators.maxLength(14)]],
      otherContactNumber: ['', [Validators.maxLength(20), Validators.pattern(/^\d*$/)]],
      altIntlPhoneNumber: ['', [Validators.maxLength(20), Validators.pattern(/^\d*$/)]],
      preferredContactPhone: [''],
      preferredContactAddress: ['']
    });
  }

  ngOnInit(): void {
    this.loadCountries();
    this.setupCityLookup();
    this.setupCityToZipLookup();
    this.setupPreferredPhoneValidation();
    this.loadDonorData();

    if (this.data.readOnly) {
      this.isReadOnly.set(true);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDonorData(): void {
    if (!this.data.donorId) {
      if (this.data.existingData) {
        this.patchForm(this.data.existingData);
      }
      this.toggleAddressFields(this.form.get('addressType')?.value ?? 'L');
      if (!this.data.readOnly) {
        this.setupAddressTypeToggle();
      }
      this.setupDirtyTracking();
      this.isLoading.set(false);
      return;
    }

    this.service.getByDonorId(this.data.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (model) => {
          if (model) {
            this.patchForm(model);
          }
          this.toggleAddressFields(this.form.get('addressType')?.value ?? 'L');

          if (this.data.readOnly) {
            this.form.disable();
          } else {
            this.setupAddressTypeToggle();
          }

          this.setupDirtyTracking();
          this.isLoading.set(false);
        },
        error: () => {
          this.toggleAddressFields('L');
          if (!this.data.readOnly) {
            this.setupAddressTypeToggle();
          }
          this.setupDirtyTracking();
          this.isLoading.set(false);
        }
      });
  }

  private setupAddressTypeToggle(): void {
    this.form.get('addressType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => this.toggleAddressFields(type));
  }

  private setupDirtyTracking(): void {
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.isFormDirty.set(this.form.dirty));
  }

  private setupPreferredPhoneValidation(): void {
    const phoneFields = ['mobilePhoneNumber', 'otherContactNumber', 'altIntlPhoneNumber'];

    merge(
      ...phoneFields.map(f => this.form.get(f)!.valueChanges)
    ).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updatePreferredPhoneRequired();
    });
  }

  private loadCountries(): void {
    this.service.getCountries()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (countries) => this.countries.set(countries)
      });
  }

  private setupCityLookup(): void {
    const zipControl = this.form.get('zip');
    if (!zipControl) return;

    zipControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(400),
      distinctUntilChanged(),
      map((zip) => (typeof zip === 'string' ? zip : zip?.code || zip?.zip || '').toString().trim()),
      tap((zipVal: string) => {
        if (!zipVal) {
          this.cityStateResults.set([]);
          this.zipOptions.set([]);
          this.form.patchValue({ state: '', uspsId: null }, { emitEvent: false });
          const rawCity = this.form.get('city')?.value;
          const city = (typeof rawCity === 'string' ? rawCity : rawCity?.city || '').trim().toUpperCase();
          if (city.length >= 3) {
            this.service.getZipsByCity(city)
              .pipe(takeUntil(this.destroy$))
              .subscribe(zips => {
                if (zips.length > 0) {
                  this.zipOptions.set(zips);
                }
              });
          }
        }
      }),
      filter((zipVal: string) => zipVal.length >= 3),
      switchMap((zipVal: string) => this.service.getCityStateByZip(zipVal))
    ).subscribe({
      next: (results) => {
        this.cityStateResults.set(results);
        this.zipOptions.set([]);
        if (results.length === 1) {
          this.form.patchValue({
            city: results[0].city,
            state: results[0].state,
            uspsId: results[0].uspsId
          }, { emitEvent: false });
        } else if (results.length > 1) {
          this.form.patchValue({ city: '', state: '', uspsId: null }, { emitEvent: false });
        } else {
          this.form.patchValue({ city: '', state: '', uspsId: null }, { emitEvent: false });
        }
      }
    });
  }

  onZipSelected(result: CityStateResult): void {
    this.form.patchValue({
      zip: result.zip,
      city: result.city,
      state: result.state,
      uspsId: result.uspsId
    }, { emitEvent: false });
  }

  private setupCityToZipLookup(): void {
    const cityControl = this.form.get('city');
    if (!cityControl) return;

    cityControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(400),
      map((city) => (typeof city === 'string' ? city : city?.city || '').trim().toUpperCase()),
      distinctUntilChanged(),
      filter((city: string) => city.length >= 3),
      switchMap((city: string) => this.service.getZipsByCity(city))
    ).subscribe({
      next: (results) => {
        if (results.length > 0) {
          const validZips = results.map(z => z.code);
          const currentZip = (this.form.get('zip')?.value || '').toString().trim();
          if (currentZip && !validZips.includes(currentZip)) {
            this.form.patchValue({ zip: '', state: '', uspsId: null }, { emitEvent: false });
            this.form.get('zip')?.setErrors(null);
          }
          this.zipOptions.set(results);
          this.cityStateResults.set([]);
        } else {
          this.zipOptions.set([]);
        }
      }
    });
  }

  onCityBlur(): void {
    const rawCity = this.form.get('city')?.value;
    const city = (typeof rawCity === 'string' ? rawCity : rawCity?.city || '').trim().toUpperCase();
    if (city) {
      this.form.patchValue({ city }, { emitEvent: false });
    } else {
      this.zipOptions.set([]);
      this.form.patchValue({ state: '', uspsId: null }, { emitEvent: false });
    }
  }

  onCityOptionSelected(result: CityStateResult): void {
    this.form.patchValue({
      city: result.city,
      state: result.state,
      uspsId: result.uspsId
    }, { emitEvent: false });
  }

  onZipOptionSelected(option: { code: string; description: string }): void {
    const parts = option.description.split(' - ');
    const state = parts.length > 1 ? parts[1].trim() : '';
    this.form.patchValue({
      zip: option.code,
      state,
    }, { emitEvent: false });
    this.service.getCityStateByZip(option.code)
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        if (results.length > 1) {
          this.cityStateResults.set(results);
        } else {
          this.cityStateResults.set([]);
        }
      });
  }

  onZipAutoSelected(event: { option: { value: CityStateResult | { code: string; description: string } } }): void {
    const value = event.option.value;
    if ('uspsId' in value) {
      this.onZipSelected(value as CityStateResult);
    } else {
      this.onZipOptionSelected(value as { code: string; description: string });
    }
  }

  private toggleAddressFields(addressType: string): void {
    const localFields = ['streetName', 'suiteApt', 'zip'];
    const localExtraFields = ['city', 'state', 'uspsId'];
    const localRequired = ['streetName', 'zip'];
    const intlFields = ['intlAddress1', 'intlAddress2', 'intlAddress3', 'intlAddress4', 'intlCity', 'countryName', 'intlPostalCode'];
    const intlRequired = ['intlAddress1', 'countryName'];

    if (addressType === 'L') {
      // Save international values before switching
      intlFields.forEach(f => {
        this.savedIntlValues[f] = this.form.getRawValue()[f] || '';
      });

      // Restore local values
      localFields.forEach(f => this.form.get(f)?.enable());
      localRequired.forEach(f => {
        const ctrl = this.form.get(f);
        ctrl?.addValidators(Validators.required);
        ctrl?.updateValueAndValidity({ onlySelf: true });
      });

      if (Object.keys(this.savedLocalValues).length > 0) {
        const restoreValues: Record<string, unknown> = {};
        [...localFields, ...localExtraFields].forEach(f => {
          if (this.savedLocalValues[f] !== undefined) {
            restoreValues[f] = this.savedLocalValues[f];
          }
        });
        this.form.patchValue(restoreValues, { emitEvent: false });
      }

      intlFields.forEach(f => {
        this.form.get(f)?.clearValidators();
        this.form.get(f)?.addValidators(Validators.maxLength(f === 'intlPostalCode' ? 15 : 50));
        this.form.get(f)?.disable();
      });

      this.form.get('city')?.enable();
    } else {
      // Save local values before switching
      [...localFields, ...localExtraFields].forEach(f => {
        this.savedLocalValues[f] = this.form.getRawValue()[f] ?? '';
      });

      // Restore international values
      intlFields.forEach(f => this.form.get(f)?.enable());
      intlRequired.forEach(f => {
        const ctrl = this.form.get(f);
        ctrl?.addValidators(Validators.required);
        ctrl?.updateValueAndValidity({ onlySelf: true });
      });

      if (Object.keys(this.savedIntlValues).length > 0) {
        this.form.patchValue(this.savedIntlValues, { emitEvent: false });
      }

      localFields.forEach(f => {
        this.form.get(f)?.clearValidators();
        this.form.get(f)?.addValidators(Validators.maxLength(f === 'zip' ? 5 : f === 'suiteApt' ? 10 : 50));
        this.form.get(f)?.disable();
      });
      this.form.get('city')?.disable();
    }

    this.form.get('state')?.disable();
    this.form.updateValueAndValidity();
  }

  private patchForm(data: AlternateDemographicsModel): void {
    this.form.patchValue({
      addressType: data.addressType ?? 'L',
      streetName: data.streetName ?? '',
      suiteApt: data.suiteApt ?? '',
      city: data.city ?? '',
      state: data.state ?? '',
      zip: data.zip ?? '',
      uspsId: data.uspsId,
      intlAddress1: data.intlAddress1 ?? '',
      intlAddress2: data.intlAddress2 ?? '',
      intlAddress3: data.intlAddress3 ?? '',
      intlAddress4: data.intlAddress4 ?? '',
      intlCity: data.intlCity ?? '',
      countryName: data.countryName ?? '',
      intlPostalCode: data.intlPostalCode ?? '',
      mobilePhoneNumber: data.mobilePhoneNumber ?? '',
      otherContactNumber: data.otherContactNumber ?? '',
      altIntlPhoneNumber: data.altIntlPhoneNumber ?? '',
      preferredContactPhone: data.preferredContactPhone ?? '',
      preferredContactAddress: data.preferredContactAddress ?? ''
    }, { emitEvent: false });

    this.updatePreferredPhoneRequired();
  }

  private updatePreferredPhoneRequired(): void {
    const phoneFields = ['mobilePhoneNumber', 'otherContactNumber', 'altIntlPhoneNumber'];
    const preferredCtrl = this.form.get('preferredContactPhone');
    if (!preferredCtrl) return;

    const hasPhone = phoneFields.some(f => !!this.form.get(f)?.value?.trim());
    if (hasPhone) {
      preferredCtrl.addValidators(Validators.required);
    } else {
      preferredCtrl.removeValidators(Validators.required);
    }
    preferredCtrl.updateValueAndValidity({ onlySelf: true });
  }

  private buildResult(): AlternateDemographicsModel {
    const rawValue = this.form.getRawValue();
    const addressType = rawValue.addressType;

    return {
      addressType,
      streetName: addressType === 'L' ? rawValue.streetName || null : null,
      suiteApt: addressType === 'L' ? rawValue.suiteApt || null : null,
      city: addressType === 'L' ? rawValue.city || null : null,
      state: addressType === 'L' ? rawValue.state || null : null,
      zip: addressType === 'L' ? rawValue.zip || null : null,
      uspsId: addressType === 'L' ? rawValue.uspsId : null,
      intlAddress1: addressType === 'I' ? rawValue.intlAddress1 || null : null,
      intlAddress2: addressType === 'I' ? rawValue.intlAddress2 || null : null,
      intlAddress3: addressType === 'I' ? rawValue.intlAddress3 || null : null,
      intlAddress4: addressType === 'I' ? rawValue.intlAddress4 || null : null,
      intlCity: addressType === 'I' ? rawValue.intlCity || null : null,
      countryName: addressType === 'I' ? rawValue.countryName || null : null,
      intlPostalCode: addressType === 'I' ? rawValue.intlPostalCode || null : null,
      intlAddrFlag: addressType === 'I' ? 'Y' : 'N',
      mobilePhoneNumber: rawValue.mobilePhoneNumber || null,
      otherContactNumber: rawValue.otherContactNumber || null,
      altIntlPhoneNumber: rawValue.altIntlPhoneNumber || null,
      preferredContactPhone: rawValue.preferredContactPhone || null,
      preferredContactAddress: rawValue.preferredContactAddress || null
    };
  }

  onApply(): void {
    if (this.isFormCleared()) {
      this.isFormCleared.set(false);
      this.dialogRef.close(null);
      return;
    }

    this.form.markAllAsTouched();

    if (this.isLocal) {
      const zip = (this.form.get('zip')?.value || '').trim();
      const city = (this.form.getRawValue().city || '').trim();
      if (zip && !city) {
        this.snackbar.showError('Please select a city for the entered zip code.');
        return;
      }
    }

    if (this.form.invalid) return;

    const result = this.buildResult();

    if (!this.data.donorId) {
      this.dialogRef.close(result);
      return;
    }

    this.isSaving.set(true);

    this.service.update(this.data.donorId, result)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.snackbar.showSuccess('Alternate demographics saved successfully.');
          this.dialogRef.close(result);
        },
        error: () => {
          this.isSaving.set(false);
          this.snackbar.showError('Failed to save alternate demographics. Please try again.');
        }
      });
  }

  onClear(): void {
    const currentAddressType = this.form.get('addressType')?.value;
    this.form.reset();
    this.form.patchValue({ addressType: currentAddressType ?? 'L' });
    this.toggleAddressFields(currentAddressType ?? 'L');
    this.form.markAsDirty();
    this.isFormDirty.set(true);
    this.isFormCleared.set(true);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onCloseAll(): void {
    this.dialogRef.close('closeAll');
  }

  get isLocal(): boolean {
    return this.form.get('addressType')?.value === 'L';
  }

  get isInternational(): boolean {
    return this.form.get('addressType')?.value === 'I';
  }

  onNumericKeyPress(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (!/\d/.test(event.key)) {
      event.preventDefault();
    }
  }

  formatPhoneInput(fieldName: string): void {
    const ctrl = this.form.get(fieldName);
    if (!ctrl) return;
    const stripped = (ctrl.value || '').replace(/\D/g, '').substring(0, 10);
    if (stripped !== ctrl.value) {
      ctrl.setValue(stripped, { emitEvent: false });
    }
  }

  private formatPhoneDisplay(fieldName: string): void {
    const ctrl = this.form.get(fieldName);
    if (!ctrl) return;
    const digits = (ctrl.value || '').replace(/\D/g, '');
    if (digits.length === 10) {
      ctrl.setValue(`(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`, { emitEvent: false });
    }
  }

  validatePhoneField(fieldName: string): void {
    const ctrl = this.form.get(fieldName);
    if (!ctrl) return;
    const value = (ctrl.value || '').replace(/\D/g, '');

    if (!value) {
      ctrl.setErrors(null);
      return;
    }

    if (value.length < 10 || parseInt(value, 10) <= 0) {
      ctrl.setErrors({ invalidPhone: true });
    } else {
      this.formatPhoneDisplay(fieldName);
      ctrl.setErrors(null);
      this.validatePhoneAreaCode(fieldName);
    }
  }

  private validatePhoneAreaCode(fieldName: string): void {
    const ctrl = this.form.get(fieldName);
    if (!ctrl?.value) return;

    const digits = (ctrl.value || '').replace(/\D/g, '');
    if (digits.length < 10) return;

    const areaCode = digits.substring(0, 3);
    this.service.validateAreaCode(areaCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe(valid => {
        if (!valid) {
          ctrl.setErrors({ ...ctrl.errors, areaCodeNotFound: true });
          ctrl.markAsTouched();
        } else if (ctrl.errors?.['areaCodeNotFound']) {
          const { areaCodeNotFound, ...rest } = ctrl.errors;
          ctrl.setErrors(Object.keys(rest).length ? rest : null);
        }
      });
  }

  convertToUpperCase(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.toUpperCase();
    this.form.get(controlName)?.setValue(input.value, { emitEvent: false });
    input.setSelectionRange(start, end);
  }
}
