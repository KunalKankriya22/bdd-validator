import { Component, inject, OnInit, DestroyRef, signal, input, output } from '@angular/core';
import { FormBuilder, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { InternationalAddressService } from '../../services/international-address.service';
import {
  InternationalAddressModel,
  CountryModel,
  SaveInternationalAddressRequest,
} from '../../models/international-address.model';

/**
 * International Address Form Component
 *
 * A reusable standalone form for capturing international address details.
 * Can be used inline in any template or inside a dialog via `InternationalAddressDialogComponent`.
 *
 * Supports two modes based on the `targetTable` input:
 * - **DB mode** (`targetTable` set): `onSubmit()` calls `InternationalAddressService.saveAddress()`
 *   and emits `saved` with the returned `ADDRESS_ID`.
 * - **Non-DB mode** (`targetTable` omitted/null): `onSubmit()` emits `applied` with the form data
 *   — no server call is made. Caller handles persistence.
 *
 * ──────────────────────────────────────────────────────────────
 *
 * @example
 * // ─── Example 1: DB Mode — Save to Backend (Inline) ───
 * // Use when the parent record already exists and you want the address saved immediately.
 *
 * // Template:
 * // <app-international-address-form
 * //   [existingAddress]="existingAddress"
 * //   [targetTable]="'SPONSOR_CONTACT'"
 * //   [recordKeyValues]="['SPON036567', 'SPCON92189']"
 * //   [chapterId]="chapterId"
 * //   [existingAddressId]="existingAddrId"
 * //   [showActions]="true"
 * //   [submitLabel]="'SAVE'"
 * //   [showCreateAndAddAnother]="true"
 * //   (saved)="onAddressSaved($event)"
 * //   (createdAndAddAnother)="onCreatedAndAddAnother($event)"
 * //   (cancelled)="onCancelled()"
 * //   (cleared)="onCleared()">
 * // </app-international-address-form>
 *
 * // Component class:
 * onAddressSaved(addressId: number): void {
 *   console.log('Saved ADDRESS_ID:', addressId);
 *   // Refresh data, close panel, etc.
 * }
 *
 * onCreatedAndAddAnother(address: InternationalAddressModel): void {
 *   console.log('Saved, form reset for next entry');
 * }
 *
 * @example
 * // ─── Example 2: Non-DB Mode — Local Only (Inline) ───
 * // Use when the parent record doesn't exist yet (e.g., "Add New" flow).
 * // The form emits data without making any API call.
 *
 * // Option A: With action buttons — form emits (applied) on submit
 * // <app-international-address-form
 * //   [existingAddress]="capturedAddress"
 * //   [showActions]="true"
 * //   [submitLabel]="'APPLY'"
 * //   (applied)="onAddressApplied($event)"
 * //   (cancelled)="onCancelled()">
 * // </app-international-address-form>
 *
 * // Option B: Without action buttons — parent controls submission
 * // <app-international-address-form
 * //   [existingAddress]="capturedAddress"
 * //   [showActions]="false"
 * //   #intlAddressFormRef>
 * // </app-international-address-form>
 * //
 * // Parent reads form data via ViewChild:
 * // const data = this.intlAddressFormRef.getFormValue();
 * // const isValid = this.intlAddressFormRef.addressForm.valid;
 *
 * // Component class:
 * onAddressApplied(address: InternationalAddressModel): void {
 *   this.capturedAddress = address;
 *   // Include in parent payload when saving later
 * }
 *
 * @example
 * // ─── Example 3: Via Dialog Wrapper ───
 * // Use `InternationalAddressDialogComponent` for popup usage.
 * // See InternationalAddressDialogComponent JSDoc for full DB and non-DB dialog examples.
 *
 * // DB mode dialog:
 * // this.dialog.open(InternationalAddressDialogComponent, {
 * //   data: { targetTable: 'SPONSOR_CONTACT', recordKeyValues: [...], chapterId: '...' }
 * // }).afterClosed().subscribe(result => { if (result?.addressId) { ... } });
 *
 * // Non-DB mode dialog:
 * // this.dialog.open(InternationalAddressDialogComponent, {
 * //   data: { existingAddress: this.intlAddressData() }
 * // }).afterClosed().subscribe((result: InternationalAddressModel) => { if (result) { ... } });
 */
@Component({
  selector: 'app-international-address-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './international-address-form.component.html',
  styleUrls: ['./international-address-form.component.scss']
})
export class InternationalAddressFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly internationalAddressService = inject(InternationalAddressService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  /** Pre-populate form with existing address */
  readonly existingAddress = input<InternationalAddressModel | null>(null);

  /** Show action buttons (Cancel, Clear, Apply) */
  readonly showActions = input(true);

  /** Show "CREATE AND ADD ANOTHER" button before Apply */
  readonly showCreateAndAddAnother = input(false);

  /** Customizable label for the submit/apply button */
  readonly submitLabel = input('APPLY');

  /** Target table constant for self-contained save (e.g., 'SPONSOR_CONTACTS') */
  readonly targetTable = input<string | null>(null);

  /** Primary key values in order matching backend PrimaryKeyColumns */
  readonly recordKeyValues = input<string[]>([]);

  /** Chapter ID for the address record */
  readonly chapterId = input('');

  /** Existing ADDRESS_ID to update (null for new address) */
  readonly existingAddressId = input<number | null>(null);

  /** Emitted when form is submitted with valid data (null when form is cleared and applied) */
  readonly applied = output<InternationalAddressModel | null>();

  /** Emitted after self-contained save completes with the ADDRESS_ID */
  readonly saved = output<number>();

  /** Emitted when "CREATE AND ADD ANOTHER" is clicked with valid data */
  readonly createdAndAddAnother = output<InternationalAddressModel>();

  /** Emitted when form is cancelled */
  readonly cancelled = output<void>();

  /** Emitted when form is cleared */
  readonly cleared = output<void>();

  readonly countries = signal<CountryModel[]>([]);
  readonly filteredCountries = signal<CountryModel[]>([]);
  readonly isLoadingCountries = signal(false);
  readonly isSubmitting = signal(false);
  readonly countrySearchControl = new FormControl<string>('', { nonNullable: true });
  readonly isFormCleared = signal(false);
  readonly hadExistingAddress = signal(false);

  /**
   * Show search in country dropdown if 3 or more options
   */
  get showCountrySearch(): boolean {
    return this.countries().length >= 3;
  }

  /**
   * Determine if apply button should be enabled
   * Enabled only when form is valid AND required fields (Address 1 and Country) are filled
   */
  get isApplyEnabled(): boolean {
    if (this.isSubmitting()) {
      return false;
    }

    if (this.isFormCleared() && this.hadExistingAddress()) {
      return true;
    }

    // Check if required fields have data
    const formValue = this.addressForm.getRawValue();
    const hasRequiredData = !!formValue.addr1?.trim() && !!formValue.country;

    // Enable only if form is valid AND has required data filled
    return this.addressForm.valid && hasRequiredData;
  }

  /**
   * Determine if clear button should be enabled
   * Enabled only when form has data or has been modified
   */
  get isClearEnabled(): boolean {
    if (this.isSubmitting()) {
      return false;
    }

    // Check if form has any data
    const formValue = this.addressForm.getRawValue();
    const hasData = formValue.addr1?.trim() ||
                    formValue.addr2?.trim() ||
                    formValue.addr3?.trim() ||
                    formValue.addr4?.trim() ||
                    formValue.country ||
                    formValue.postalCode?.trim() ||
                    formValue.homePhoneNo?.trim() ||
                    formValue.workPhoneNo?.trim() ||
                    formValue.workPhoneExt?.trim() ||
                    formValue.mobilePhoneNo?.trim() ||
                    formValue.faxNo?.trim() ||
                    formValue.email?.trim();

    return !!hasData;
  }

  readonly addressForm = this.fb.nonNullable.group({
    addr1: ['', [Validators.required, Validators.maxLength(50)]],
    addr2: ['', Validators.maxLength(50)],
    addr3: ['', Validators.maxLength(50)],
    addr4: ['', Validators.maxLength(50)],
    country: ['', [Validators.required, Validators.maxLength(50)]],
    postalCode: ['', Validators.maxLength(15)],
    homePhoneNo: ['', [Validators.maxLength(20), Validators.pattern(/^\d*$/)]],
    workPhoneNo: ['', [Validators.maxLength(20), Validators.pattern(/^\d*$/)]],
    workPhoneExt: ['', [Validators.maxLength(8), Validators.pattern(/^\d*$/)]],
    mobilePhoneNo: ['', [Validators.maxLength(20), Validators.pattern(/^\d*$/)]],
    faxNo: ['', [Validators.maxLength(20), Validators.pattern(/^\d*$/)]],
    email: ['', [Validators.maxLength(128), Validators.email]]
  });

  ngOnInit(): void {
    this.loadCountries();
    this.setupCountryAutocomplete();
    this.bindExistingAddress();
    this.setupFormChangeTracking();
  }

  /**
   * Track form changes to reset isFormCleared when user starts filling the form
   */
  private setupFormChangeTracking(): void {
    this.addressForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // If form has been cleared and user starts typing, reset the cleared flag
        // This ensures APPLY button logic switches to form validity checking
        if (this.isFormCleared() && this.addressForm.dirty) {
          const formValue = this.addressForm.getRawValue();
          // Check if user has started entering data (form is no longer empty)
          const hasData = formValue.addr1?.trim() ||
                          formValue.addr2?.trim() ||
                          formValue.addr3?.trim() ||
                          formValue.addr4?.trim() ||
                          formValue.country ||
                          formValue.postalCode?.trim();
          if (hasData) {
            this.isFormCleared.set(false);
          }
        }
      });
  }

  private bindExistingAddress(): void {
    const existing = this.existingAddress();
    if (!existing) {
      // No existing address - track this for CLEAR button logic
      this.hadExistingAddress.set(false);
      this.isFormCleared.set(false);
      return;
    }

    // Track that we had an existing address
    this.hadExistingAddress.set(true);

    this.addressForm.patchValue({
      addr1: existing.streetName ?? existing.addr1 ?? '',
      addr2: existing.addr2 ?? '',
      addr3: existing.addr3 ?? '',
      addr4: existing.addr4 ?? '',
      country: existing.country ?? '',
      postalCode: existing.postalCode ?? '',
      homePhoneNo: existing.homePhoneNo ?? '',
      workPhoneNo: existing.workPhoneNo ?? '',
      workPhoneExt: existing.workPhoneExt ?? '',
      mobilePhoneNo: existing.mobilePhoneNo ?? '',
      faxNo: existing.faxNo ?? '',
      email: existing.email ?? ''
    });

    // Existing address loaded - disable apply button initially
    this.isFormCleared.set(false);
  }

  private loadCountries(): void {
    this.isLoadingCountries.set(true);

    this.internationalAddressService.getCountries()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(error => {
          console.error('Error loading countries:', error);
          this.snackBar.open('Failed to load countries', 'Close', { duration: 5000 });
          return of([] as CountryModel[]);
        })
      )
      .subscribe(countries => {
        this.isLoadingCountries.set(false);
        this.countries.set(countries);
        this.filteredCountries.set(countries);
      });
  }

  private setupCountryAutocomplete(): void {
    this.countrySearchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.filterCountries(value || '');
      });
  }

  private filterCountries(searchValue: string): void {
    if (!searchValue) {
      this.filteredCountries.set(this.countries());
      return;
    }

    const filterValue = searchValue.toLowerCase();
    this.filteredCountries.set(
      this.countries().filter(country =>
        country.code.toLowerCase().includes(filterValue) ||
        country.description.toLowerCase().includes(filterValue)
      )
    );
  }

  onSubmit(): void {
    // Check if form is empty (all fields cleared)
    const formValue = this.addressForm.getRawValue();
    const isEmpty = !formValue.addr1?.trim() &&
                    !formValue.addr2?.trim() &&
                    !formValue.addr3?.trim() &&
                    !formValue.addr4?.trim() &&
                    !formValue.country &&
                    !formValue.postalCode?.trim();

    // If form is empty, emit null to indicate international address should be removed
    if (isEmpty) {
      this.isSubmitting.set(true);
      this.internationalAddressService.clearInternationalAddress();
      this.isSubmitting.set(false);
      this.isFormCleared.set(false); // Reset after applying
      this.snackBar.open('International address updated', 'DISMISS', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });
      this.applied.emit(null);
      return;
    }

    const addressData = this.validateAndGetFormValue();
    if (!addressData) return;

    // Self-contained save when targetTable is provided
    if (this.targetTable()) {
      this.saveToBackend(addressData);
      return;
    }

    // Fallback: emit data for parent to handle
    this.isSubmitting.set(true);
    this.internationalAddressService.setInternationalAddress(addressData);
    this.isSubmitting.set(false);
    this.isFormCleared.set(false); // Reset after applying
    this.snackBar.open('International address updated', 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
    this.applied.emit(addressData);
  }

  onCreateAndAddAnother(): void {
    const addressData = this.validateAndGetFormValue();
    if (!addressData) return;

    if (this.targetTable()) {
      this.saveToBackend(addressData, true);
      return;
    }

    this.internationalAddressService.setInternationalAddress(addressData);
    this.createdAndAddAnother.emit(addressData);
    this.addressForm.reset();
  }

  private saveToBackend(addressData: InternationalAddressModel, addAnother = false): void {
    this.isSubmitting.set(true);

    const request: SaveInternationalAddressRequest = {
      address: addressData,
      targetTable: this.targetTable()!,
      recordKeyValues: this.recordKeyValues(),
      chapterId: this.chapterId(),
      existingAddressId: this.existingAddressId()
    };

    this.internationalAddressService.saveAddress(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: { message?: string; item: number }) => {
          this.isSubmitting.set(false);
          this.internationalAddressService.setInternationalAddress(addressData);
          this.snackBar.open(response.message || 'Address saved', 'Close', { duration: 3000 });
          this.saved.emit(response.item);

          if (addAnother) {
            this.createdAndAddAnother.emit(addressData);
            this.addressForm.reset();
          }
        },
        error: (error) => {
          this.isSubmitting.set(false);
          const message = error?.error?.message || 'Failed to save international address';
          this.snackBar.open(message, 'Close', { duration: 5000 });
        }
      });
  }

  /** Extracts the country string regardless of whether value is a string or CountryModel object */
  private getCountryString(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return (value as CountryModel).description || '';
  }

  /** Returns the current form values mapped to InternationalAddressModel */
  getFormValue(): InternationalAddressModel {
    const formValue = this.addressForm.getRawValue();
    const country = this.getCountryString(formValue.country);
    return {
      streetName: formValue.addr1,
      addr1: formValue.addr1 || null,
      addr2: formValue.addr2 || null,
      addr3: formValue.addr3 || null,
      addr4: formValue.addr4 || null,
      country: country,
      postalCode: formValue.postalCode || null,
      homePhoneNo: formValue.homePhoneNo || null,
      workPhoneNo: formValue.workPhoneNo || null,
      workPhoneExt: formValue.workPhoneExt || null,
      mobilePhoneNo: formValue.mobilePhoneNo || null,
      faxNo: formValue.faxNo || null,
      email: formValue.email || null,
      intlAddrFlag: formValue.addr1 || formValue.addr2 || formValue.addr3 || formValue.addr4 ? 'Y' : 'N',
      modifiedFlag: 'Y'
    };
  }

  private validateAndGetFormValue(): InternationalAddressModel | null {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      this.snackBar.open('Please fix validation errors', 'Close', { duration: 3000 });
      return null;
    }
    return this.getFormValue();
  }

  onClear(): void {
    this.addressForm.reset();
    this.internationalAddressService.clearInternationalAddress();
    this.isFormCleared.set(true); // Enable apply button after clearing
    this.cleared.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  /**
   * Keypress handler to allow only numeric input for phone/fax/extension fields
   */
  onNumericKeyPress(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    // Allow: backspace, delete, tab, escape, enter
    if ([46, 8, 9, 27, 13].indexOf(charCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (charCode === 65 && event.ctrlKey === true) ||
        (charCode === 67 && event.ctrlKey === true) ||
        (charCode === 86 && event.ctrlKey === true) ||
        (charCode === 88 && event.ctrlKey === true)) {
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  stripNonNumeric(controlName: string): void {
    const control = this.addressForm.get(controlName);
    if (control) {
      const stripped = (control.value || '').replace(/\D/g, '');
      if (stripped !== control.value) {
        control.setValue(stripped);
      }
    }
  }
}
