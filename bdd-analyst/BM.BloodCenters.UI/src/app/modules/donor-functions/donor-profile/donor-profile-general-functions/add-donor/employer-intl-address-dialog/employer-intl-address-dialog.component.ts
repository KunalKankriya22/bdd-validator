import { Component, inject, OnInit, DestroyRef, signal } from '@angular/core';
import { FormBuilder, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { InternationalAddressService } from '@shared/services/international-address.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { CountryModel } from '@shared/models/international-address.model';

export interface EmployerIntlAddressResult {
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  intlAddrFlag: string;
  modifiedFlag: string;
}

export interface EmployerIntlAddressDialogData {
  existingAddress?: EmployerIntlAddressResult | null;
}

@Component({
  selector: 'app-employer-intl-address-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './employer-intl-address-dialog.component.html',
  styleUrls: ['./employer-intl-address-dialog.component.scss'],
})
export class EmployerIntlAddressDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<EmployerIntlAddressDialogComponent>);
  private readonly internationalAddressService = inject(InternationalAddressService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);
  readonly data = inject<EmployerIntlAddressDialogData>(MAT_DIALOG_DATA);

  readonly countries = signal<CountryModel[]>([]);
  readonly filteredCountries = signal<CountryModel[]>([]);
  readonly isLoadingCountries = signal(false);
  readonly countrySearchControl = new FormControl<string>('', { nonNullable: true });

  private isFormCleared = false;
  private hadExistingAddress = false;

  readonly addressForm = this.fb.nonNullable.group({
    city: ['', [Validators.required, Validators.maxLength(50)]],
    postalCode: ['', Validators.maxLength(15)],
    state: ['', Validators.maxLength(50)],
    country: ['', [Validators.required, Validators.maxLength(50)]],
  });

  get showCountrySearch(): boolean {
    return this.countries().length >= 3;
  }

  get isApplyEnabled(): boolean {
    if (this.isFormCleared && this.hadExistingAddress) {
      return true;
    }
    const formValue = this.addressForm.getRawValue();
    const hasRequiredData = !!formValue.city?.trim() && !!formValue.country;
    return this.addressForm.valid && hasRequiredData;
  }

  get isClearEnabled(): boolean {
    const formValue = this.addressForm.getRawValue();
    return !!(
      formValue.city?.trim() ||
      formValue.state?.trim() ||
      formValue.postalCode?.trim() ||
      formValue.country
    );
  }

  ngOnInit(): void {
    this.loadCountries();
    this.setupCountrySearch();
    this.bindExistingAddress();
  }

  private loadCountries(): void {
    this.isLoadingCountries.set(true);
    this.internationalAddressService.getCountries()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of([] as CountryModel[]))
      )
      .subscribe(countries => {
        this.isLoadingCountries.set(false);
        this.countries.set(countries);
        this.filteredCountries.set(countries);
      });
  }

  private setupCountrySearch(): void {
    this.countrySearchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        if (!value) {
          this.filteredCountries.set(this.countries());
          return;
        }
        const filter = value.toLowerCase();
        this.filteredCountries.set(
          this.countries().filter(c =>
            c.code.toLowerCase().includes(filter) ||
            c.description.toLowerCase().includes(filter)
          )
        );
      });
  }

  private bindExistingAddress(): void {
    const existing = this.data?.existingAddress;
    if (!existing) {
      this.hadExistingAddress = false;
      return;
    }
    this.hadExistingAddress = true;
    this.addressForm.patchValue({
      city: existing.city ?? '',
      postalCode: existing.postalCode ?? '',
      state: existing.state ?? '',
      country: existing.country ?? '',
    });
  }

  onApply(): void {
    const formValue = this.addressForm.getRawValue();
    const isEmpty =
      !formValue.city?.trim() &&
      !formValue.state?.trim() &&
      !formValue.postalCode?.trim() &&
      !formValue.country;

    if (isEmpty) {
      this.snackbarService.showSuccess('International address updated');
      this.dialogRef.close(null);
      return;
    }

    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const result: EmployerIntlAddressResult = {
      city: formValue.city,
      state: formValue.state || null,
      postalCode: formValue.postalCode || null,
      country: formValue.country,
      intlAddrFlag: formValue.city ? 'Y' : 'N',
      modifiedFlag: 'Y',
    };

    this.snackbarService.showSuccess('International address updated');
    this.dialogRef.close(result);
  }

  onClear(): void {
    this.addressForm.reset();
    this.isFormCleared = true;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  convertToUpperCase(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const upperValue = value.toUpperCase();
    if (value !== upperValue) {
      const control = this.addressForm.get(controlName);
      control?.setValue(upperValue, { emitEvent: false });
      const cursorPosition = input.selectionStart || 0;
      setTimeout(() => {
        input.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    }
  }
}
