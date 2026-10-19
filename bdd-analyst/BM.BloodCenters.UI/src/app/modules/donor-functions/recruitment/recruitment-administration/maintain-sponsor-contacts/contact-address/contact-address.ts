import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, switchMap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MaintainSponsorContactsService } from '../services/maintain-sponsor-contacts.service';
import { SponsorContactModel, ZipCodeLookupItem } from '../models/maintain-sponsor-contacts.model';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-contact-address',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './contact-address.html',
  styleUrls: ['./contact-address.scss']
})
export class ContactAddressComponent implements OnInit, OnDestroy {
  @Input() data: SponsorContactModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @ViewChild('citySelect') citySelect?: MatSelect;
  @ViewChild('zipCodeInput') zipCodeInput?: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  isSaving = false;
  isLoading = true;
  private destroy$ = new Subject<void>();
  private zipCodeLookupInProgress = false;
  private shouldFocusCityAfterLoad = false;
  private zipInput$ = new Subject<string>();

  contactDetail: any = null;
  cityOptions: ZipCodeLookupItem[] = [];
  hasInternationalAddress = false;
  private initialFormValue: Record<string, unknown> | null = null;

  readonly citySearchControl = new FormControl('');
  readonly citySearch = signal('');
  readonly cityOptionsSignal = signal<ZipCodeLookupItem[]>([]);
  readonly filteredCityOptions = computed(() => {
    const search = this.citySearch().toLowerCase();
    const options = this.cityOptionsSignal();
    if (!search) return options;
    return options.filter(c =>
      c.city.toLowerCase().includes(search) ||
      c.uspsId.toString().includes(search)
    );
  });

  constructor(
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private sponsorContactsService: MaintainSponsorContactsService,
    private headerService: HeaderService
  ) {}

  ngOnInit(): void {
    this.citySearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.citySearch.set(value || ''));
    this.setupForm();
    this.setupZipCodeLookup();
    this.loadAddress();
  }

  /**
   * Sets up zip code lookup with switchMap to auto-cancel in-flight requests.
   * Prevents race conditions when user types quickly or corrects zip code.
   */
  private setupZipCodeLookup(): void {
    const zipControl = this.form.get('zipCode')!;
    const cityControl = this.form.get('city')!;

    this.zipInput$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(zipCode => this.sponsorContactsService.getZipCodes(zipCode))
      )
      .subscribe({
        next: (data) => {
          this.zipCodeLookupInProgress = false;
          this.cityOptions = data;
          this.cityOptionsSignal.set(data);
          if (data.length > 0) {
            zipControl.setErrors(null);
            cityControl.enable();

            // Auto-select city if only one option is available
            if (data.length === 1) {
              cityControl.setValue(data[0].uspsId);
            }

            // If user pressed Tab while waiting, focus city now
            if (this.shouldFocusCityAfterLoad && this.citySelect) {
              this.shouldFocusCityAfterLoad = false;
              setTimeout(() => {
                cityControl.markAsTouched();
                this.citySelect?.focus();
              }, 0);
            }
          } else {
            zipControl.setErrors({ zipNotFound: true });
            this.shouldFocusCityAfterLoad = false;
          }
        },
        error: () => {
          this.zipCodeLookupInProgress = false;
          this.cityOptions = [];
          this.cityOptionsSignal.set([]);
          zipControl.setErrors({ zipNotFound: true });
          this.shouldFocusCityAfterLoad = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isFormValid(): boolean {
    if (!this.form || !this.initialFormValue) return false;
    const hasChanges = JSON.stringify(this.form.getRawValue()) !== JSON.stringify(this.initialFormValue);
    return hasChanges && this.form.valid;
  }

  private setupForm(): void {
    this.form = this.fb.group({
      street: ['', [Validators.required, Validators.maxLength(50)]],
      zipCode: ['', [Validators.required]],
      city: [{ value: null as number | null, disabled: true }, [Validators.required]],
      workPhone: ['', [this.phoneValidator()]],
      homePhone: ['', [this.phoneValidator()]],
      fax: ['', [this.phoneValidator()]],
      email: ['', [Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/), Validators.maxLength(128)]],
      website: ['', [Validators.maxLength(50), this.urlValidator()]]
    });
  }

  /**
   * Custom validator for URL format
   * Validates http/https URLs with proper domain structure
   */
  private urlValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || control.value.trim() === '') {
        return null; // Website is optional
      }

      const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
      const valid = urlPattern.test(control.value.trim());

      return valid ? null : { invalidUrl: { value: control.value } };
    };
  }

  private loadAddress(): void {
    if (!this.data?.sponsorId || !this.data?.addressId) {
      this.isLoading = false;
      return;
    }

    this.sponsorContactsService.getContactDetail(this.data.sponsorId, this.data.addressId).subscribe({
      next: (detail) => {
        this.contactDetail = detail;
        const address = detail.address || {} as any;

        // Check if international address exists
        this.hasInternationalAddress = this.checkHasInternationalAddress(address);

        // Trim leading spaces when populating the form
        this.form.patchValue({
          street: address.streetName?.trimStart() || '',
          zipCode: address.zip?.trimStart() || '',
          workPhone: this.combinePhoneNumber(address.dAreaCode, address.dPhoneNo),
          homePhone: this.combinePhoneNumber(address.hAreaCode, address.hPhoneNo),
          fax: this.combinePhoneNumber(address.fAreaCode, address.fPhoneNo),
          email: address.email?.trimStart() || '',
          website: address.webAddress?.trimStart() || ''
        });

        // Load city options if zip code exists
        if (address.zip) {
          this.loadCityFromZip(address.zip, address.uspsId?.toString());
        }

        this.form.markAsPristine();
        if (!address.zip) {
          this.initialFormValue = this.form.getRawValue();
        }

        // Disable regular address fields if international address exists
        if (this.hasInternationalAddress) {
          this.disableRegularAddressFields();
        }

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Checks if the contact has an international address.
   * International address is identified by having any international address fields populated.
   */
  private checkHasInternationalAddress(address: any): boolean {
    if (!address) return false;

    return !!(
      address.intlAddress1?.trim() ||
      address.intlAddress2?.trim() ||
      address.intlAddress3?.trim() ||
      address.intlAddress4?.trim() ||
      address.countryName?.trim() ||
      address.intlPostalCode?.trim()
    );
  }

  /**
   * Disables regular address input fields when international address exists.
   */
  private disableRegularAddressFields(): void {
    this.form.get('street')?.disable();
    this.form.get('zipCode')?.disable();
    this.form.get('city')?.disable();
    this.form.get('workPhone')?.disable();
    this.form.get('homePhone')?.disable();
    this.form.get('fax')?.disable();
    this.form.get('website')?.disable();
    this.form.get('email')?.setValue('');
    this.form.get('email')?.disable();
  }

  private loadCityFromZip(zipCode: string, uspsId?: string): void {
    this.sponsorContactsService.getZipCodes(zipCode).subscribe({
      next: (data) => {
        this.cityOptions = data;
        this.cityOptionsSignal.set(data);
        if (data.length > 0) {
          this.form.get('city')!.enable();
          if (uspsId) {
            const uspsIdNum = Number(uspsId);
            const matchedCity = data.find(city => city.uspsId === uspsIdNum);
            if (matchedCity) {
              this.form.patchValue({ city: matchedCity.uspsId });
            }
          }
        }
        this.form.markAsPristine();
        this.initialFormValue = this.form.getRawValue();
      },
      error: () => {
        this.cityOptions = [];
        this.cityOptionsSignal.set([]);
        this.form.markAsPristine();
        this.initialFormValue = this.form.getRawValue();
      }
    });
  }

  /**
   * Handles Tab key on zip code field - waits for city to load before allowing tab through
   */
  onZipCodeKeydown(event: KeyboardEvent): void {
    // First handle numeric validation
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!allowedKeys.includes(event.key) &&
        !((event.key === 'a' || event.key === 'c' || event.key === 'v' || event.key === 'x') && (event.ctrlKey || event.metaKey)) &&
        !/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    // Handle Tab key specifically
    if (event.key === 'Tab' && !event.shiftKey) {
      const zipControl = this.form.get('zipCode');
      const zipValue = zipControl?.value || '';
      const cityControl = this.form.get('city');

      // If zip code has errors, prevent Tab (user must fix the error first)
      if (zipControl?.errors) {
        event.preventDefault();
        zipControl.markAsTouched();
        return;
      }

      // If we have 5 digits and city is disabled (API in progress), prevent tab and wait
      if (zipValue.length === 5 && cityControl?.disabled && this.zipCodeLookupInProgress) {
        event.preventDefault();
        this.shouldFocusCityAfterLoad = true;
      }
    }
  }

  onZipCodeChange(): void {
    const zipControl = this.form.get('zipCode')!;
    const cityControl = this.form.get('city')!;
    const raw = zipControl.value || '';
    const digitsOnly = raw.replace(/\D/g, '');
    if (digitsOnly !== raw) {
      zipControl.setValue(digitsOnly, { emitEvent: false });
    }
    const zipCode = digitsOnly.trim();

    // Reset city whenever zip code changes
    cityControl.reset(null);
    cityControl.disable();
    this.cityOptions = [];
    this.cityOptionsSignal.set([]);
    this.zipCodeLookupInProgress = false;
    this.shouldFocusCityAfterLoad = false;

    // Emit zip code to Subject when we have exactly 5 digits
    // switchMap will auto-cancel any previous in-flight request
    if (zipCode.length === 5) {
      this.zipCodeLookupInProgress = true;
      this.zipInput$.next(zipCode);
    } else if (zipCode.length > 0) {
      // Clear any previous errors if user is still typing
      zipControl.setErrors(null);
    }
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.form.controls)
      .find(key => this.form.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    const formValue = this.form.getRawValue();
    const detail = this.contactDetail || {} as any;
    const address = detail.address || {} as any;

    const selectedCity = this.cityOptions.find(c => c.uspsId === formValue.city);
    const wp = this.splitPhoneNumber(formValue.workPhone);
    const hp = this.splitPhoneNumber(formValue.homePhone);
    const fp = this.splitPhoneNumber(formValue.fax);

    const payload: any = {
      contactType: detail.contactType,
      lastName: detail.lastName,
      effDate: detail.effDate,
      salutation: detail.salutation || null,
      firstName: detail.firstName || null,
      middleName: detail.middleName || null,
      title: detail.title || null,
      termDate: detail.termDate || null,
      insertUser: detail.insertUser || null,
      noteId: detail.noteId || null,
      address: {
        addressId: address.addressId || null,
        address1: address.address1 || null,
        address2: address.address2 || null,
        address3: address.address3 || null,
        streetName: formValue.street?.trimStart()?.trim() || null,
        suiteApt: address.suiteApt || null,
        uspsId: formValue.city || address.uspsId || null,
        mapsco: address.mapsco || null,
        dAreaCode: wp.areaCode || null,
        dPhoneNo: wp.phoneNo || null,
        extension: address.extension || null,
        dCountryCode: address.dCountryCode || null,
        hAreaCode: hp.areaCode || null,
        hPhoneNo: hp.phoneNo || null,
        hCountryCode: address.hCountryCode || null,
        fAreaCode: fp.areaCode || null,
        fPhoneNo: fp.phoneNo || null,
        fCountryCode: address.fCountryCode || null,
        mAreaCode: address.mAreaCode || null,
        mPhoneNo: address.mPhoneNo || null,
        pager: address.pager || null,
        email: formValue.email?.trimStart()?.trim() || null,
        webAddress: formValue.website?.trimStart()?.trim() || null,
        intlAddrFlag: 'N',
        intlAddress1: null,
        intlAddress2: null,
        intlAddress3: null,
        intlAddress4: null,
        countryName: null,
        intlPostalCode: null,
        intlHomePhoneNo: null,
        intlWorkPhoneNo: null,
        intlWorkPhoneExt: null,
        intlMobilePhoneNo: null,
        intlFaxNo: null
      }
    };

    this.isSaving = true;

    const sponsorId = (this.contactDetail || this.data)!.sponsorId;
    const addressId = this.data!.addressId;
    const chapterId = this.headerService.getCurrentChapterId();

    this.sponsorContactsService.updateContact(sponsorId, addressId, chapterId, payload).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        const detail = this.contactDetail || {} as any;
        const salutation = detail.salutation ? detail.salutation + ' ' : '';
        const message = `Contact detail of ${salutation}${detail.lastName || ''} has been updated successfully.`;
        this.snackBar.open(message, 'DISMISS', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.saveSuccess.emit();
      },
      error: (error) => {
        this.isSaving = false;
        this.snackBar.open(this.getErrorMessage(error), 'DISMISS', {
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getStreetError(): string {
    const control = this.form.get('street');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Street is required';
    return '';
  }

  getZipCodeError(): string {
    const control = this.form.get('zipCode');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Zip Code is required';
    if (control.hasError('zipNotFound')) return 'Zip Code does not exist';
    return '';
  }

  getCityError(): string {
    const control = this.form.get('city');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'City is required';
    return '';
  }

  getEmailError(): string {
    const control = this.form.get('email');
    if (!control || !control.touched) return '';
    if (control.hasError('pattern')) return 'Please enter a valid email address';
    if (control.hasError('maxlength')) return 'Email can be maximum 128 characters';
    return '';
  }

  getWebsiteError(): string {
    const control = this.form.get('website');
    if (!control || !control.touched) return '';
    if (control.hasError('maxlength')) return 'Website can be maximum 128 characters';
    if (control.hasError('invalidUrl')) return 'Please enter a valid website URL (e.g., www.example.com or https://example.com)';
    return '';
  }

  getFaxError(): string {
    const control = this.form.get('fax');
    if (!control || !control.touched) return '';
    if (control.hasError('invalidPhone')) return 'Please enter a complete Fax number (XXX) XXX-XXXX';
    return '';
  }

  getWorkPhoneError(): string {
    const control = this.form.get('workPhone');
    if (!control || !control.touched) return '';
    if (control.hasError('invalidPhone')) return 'Please enter a complete Work Phone number (XXX) XXX-XXXX';
    return '';
  }

  getHomePhoneError(): string {
    const control = this.form.get('homePhone');
    if (!control || !control.touched) return '';
    if (control.hasError('invalidPhone')) return 'Please enter a complete Home Phone number (XXX) XXX-XXXX';
    return '';
  }

  formatPhoneNumber(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const selStart = input.selectionStart || 0;
    const prevDigits = (input.value.substring(0, selStart)).replace(/\D/g, '').length;
    const digits = input.value.replace(/\D/g, '').substring(0, 10);
    const formatted = this.buildPhoneFormat(digits);

    input.value = formatted;
    const control = this.form.get(controlName);
    control?.setValue(formatted, { emitEvent: false });
    control?.markAsTouched();
    control?.updateValueAndValidity();

    const newPos = this.getPhoneCursorPos(prevDigits);
    setTimeout(() => input.setSelectionRange(newPos, newPos));
  }

  private getPhoneCursorPos(digitIndex: number): number {
    if (digitIndex <= 0) return 0;
    if (digitIndex <= 3) return digitIndex + 1;
    if (digitIndex <= 6) return digitIndex + 3;
    return digitIndex + 4;
  }

  private buildPhoneFormat(digits: string): string {
    if (!digits || digits.length === 0) return '';
    if (digits.length < 3) return '(' + digits;
    let formatted = '(' + digits.substring(0, 3) + ') ';
    if (digits.length > 3) formatted += digits.substring(3, 6);
    if (digits.length >= 6) formatted += '-' + digits.substring(6, 10);
    return formatted;
  }

  private phoneValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || control.value.trim() === '') return null;
      const digits = control.value.replace(/\D/g, '');
      if (digits.length > 0 && digits.length !== 10) {
        return { invalidPhone: true };
      }
      return null;
    };
  }

  private combinePhoneNumber(areaCode: string | null | undefined, phoneNo: string | null | undefined): string {
    const area = (areaCode || '').trim();
    const phone = (phoneNo || '').trim();
    if (!area && !phone) return '';
    return this.buildPhoneFormat(area + phone);
  }

  private splitPhoneNumber(formatted: string): { areaCode: string; phoneNo: string } {
    const digits = (formatted || '').replace(/\D/g, '');
    return {
      areaCode: digits.substring(0, 3) || '',
      phoneNo: digits.substring(3) || ''
    };
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;
    if ((event.key === 'a' || event.key === 'c' || event.key === 'v' || event.key === 'x') && (event.ctrlKey || event.metaKey)) return;
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

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

  /**
   * Prevents leading spaces in input fields.
   * Call this on keydown event for text inputs.
   */
  preventLeadingSpace(event: KeyboardEvent, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get(controlName);

    // If the input is empty or only contains spaces, prevent space key
    if (event.key === ' ' && (!input.value || input.value.trim() === '')) {
      event.preventDefault();
    }
  }

  /**
   * Removes leading spaces from input value.
   * Call this on input event for text inputs.
   */
  trimLeadingSpace(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // If the input starts with a space, remove all leading spaces
    if (value && value.charAt(0) === ' ') {
      const trimmedValue = value.trimStart();
      input.value = trimmedValue;
      this.form.get(controlName)?.setValue(trimmedValue, { emitEvent: false });
    }
  }

  /**
   * Handles paste events to prevent leading spaces.
   * Call this on paste event for text inputs.
   */
  onPaste(event: ClipboardEvent, controlName: string): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const trimmedText = pastedText.trimStart();

    const input = event.target as HTMLInputElement;
    const control = this.form.get(controlName);

    if (control) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentValue = input.value || '';

      const newValue = currentValue.substring(0, start) + trimmedText + currentValue.substring(end);
      control.setValue(newValue);

      setTimeout(() => {
        const newPosition = start + trimmedText.length;
        input.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  }

  /**
   * Converts input to uppercase and trims leading spaces.
   * Call this on input event for text inputs that should be uppercase.
   */
  toUpperCaseAndTrim(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value;
    const trimmed = raw.trimStart();
    const upper = trimmed.toUpperCase();

    if (raw !== upper) {
      const removedFromStart = raw.length - trimmed.length;
      const cursorPos = input.selectionStart || 0;
      input.value = upper;
      this.form.get(controlName)?.setValue(upper, { emitEvent: false });
      this.form.get(controlName)?.markAsTouched();
      const newPos = Math.max(0, cursorPos - removedFromStart);
      setTimeout(() => input.setSelectionRange(newPos, newPos), 0);
    }
  }

  private getErrorMessage(error: any): string {
    let errorMessage = error?.error?.errorResponse?.error ||
                      error?.error?.message ||
                      error?.message ||
                      'An unexpected error occurred';
    const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;

    if (errorCode) {
      errorMessage = `Error: ${errorCode}: ${errorMessage}`;
    }

    return errorMessage;
  }
}
