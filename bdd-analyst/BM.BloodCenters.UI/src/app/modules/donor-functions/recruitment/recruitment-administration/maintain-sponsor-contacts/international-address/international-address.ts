import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MaintainSponsorContactsService } from '../services/maintain-sponsor-contacts.service';
import { SponsorContactModel, TitleLookupItem } from '../models/maintain-sponsor-contacts.model';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-international-address',
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
  templateUrl: './international-address.html',
  styleUrls: ['./international-address.scss']
})
export class InternationalAddressComponent implements OnInit, OnDestroy {
  @Input() data: SponsorContactModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  form!: FormGroup;
  isSaving = false;
  isLoading = true;
  contactDetail: any = null;
  hasRegularAddress = false;
  private initialFormValue: Record<string, unknown> | null = null;
  private destroy$ = new Subject<void>();

  // Searchable dropdown for Country
  readonly countrySearchControl = new FormControl('');
  readonly countrySearch = signal('');
  readonly countryOptionsSignal = signal<TitleLookupItem[]>([]);
  readonly filteredCountryOptions = computed(() => {
    const search = this.countrySearch().toLowerCase();
    const options = this.countryOptionsSignal();
    if (!search) return options;
    return options.filter(c =>
      c.code.toLowerCase().includes(search) ||
      c.description.toLowerCase().includes(search)
    );
  });

  countryOptions: TitleLookupItem[] = [];

  constructor(
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private sponsorContactsService: MaintainSponsorContactsService,
    private headerService: HeaderService
  ) {}

  ngOnInit(): void {
    // Setup search control subscription
    this.countrySearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.countrySearch.set(value || '');
      });

    this.setupForm();
    this.loadCountries();
    this.loadAddress();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCountries(): void {
    this.sponsorContactsService.getCountries().subscribe({
      next: (data) => {
        this.countryOptions = data;
        this.countryOptionsSignal.set(data);
        this.matchCountryValue(data);
      },
      error: () => {
        this.countryOptions = [];
        this.countryOptionsSignal.set([]);
      }
    });
  }

  private matchCountryValue(countries: TitleLookupItem[]): void {
    const currentValue = this.form.get('country')?.value;
    if (!currentValue || !countries.length) return;

    const alreadyMatched = countries.find(c => c.code === currentValue);
    if (alreadyMatched) return;

    const match = countries.find(c =>
      c.description.toLowerCase() === currentValue.toLowerCase() ||
      c.code.toLowerCase() === currentValue.toLowerCase()
    );
    if (match) {
      this.form.patchValue({ country: match.code });
      this.form.markAsPristine();
      this.initialFormValue = this.form.getRawValue();
    }
  }

  get isFormValid(): boolean {
    if (!this.form) return false;
    const hasErrors = Object.keys(this.form.controls).some(key => {
      const control = this.form.get(key);
      return control?.errors && control?.touched;
    });
    if (hasErrors) return false;
    const isDirty = this.initialFormValue
      ? JSON.stringify(this.form.getRawValue()) !== JSON.stringify(this.initialFormValue)
      : this.form.dirty;
    return isDirty;
  }

  private setupForm(): void {
    this.form = this.fb.group({
      address1: ['', [Validators.required, Validators.maxLength(50)]],
      address2: ['', [Validators.maxLength(50)]],
      address3: ['', [Validators.maxLength(50)]],
      address4: ['', [Validators.maxLength(50)]],
      country: ['', [Validators.required]],
      postalCode: [''],
      extension: ['', [Validators.pattern(/^\d*$/)]],
      workPhone: ['', [Validators.pattern(/^\d*$/)]],
      homePhone: ['', [Validators.pattern(/^\d*$/)]],
      mobilePhone: ['', [Validators.pattern(/^\d*$/)]],
      fax: ['', [Validators.pattern(/^\d*$/)]],
      email: ['', [Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/), Validators.maxLength(128)]]
    });
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

        // Check if regular/primary address exists
        this.hasRegularAddress = this.checkHasRegularAddress(address);

        // Trim leading spaces when populating the form
        this.form.patchValue({
          address1: address.intlAddress1?.trimStart() || '',
          address2: address.intlAddress2?.trimStart() || '',
          address3: address.intlAddress3?.trimStart() || '',
          address4: address.intlAddress4?.trimStart() || '',
          country: address.countryName || '',
          postalCode: address.intlPostalCode?.trimStart() || '',
          extension: address.intlWorkPhoneExt?.trimStart() || '',
          workPhone: address.intlWorkPhoneNo?.trimStart() || '',
          homePhone: address.intlHomePhoneNo?.trimStart() || '',
          mobilePhone: address.intlMobilePhoneNo?.trimStart() || '',
          fax: address.intlFaxNo?.trimStart() || '',
          email: address.email?.trimStart() || ''
        });
        this.matchCountryValue(this.countryOptions);
        this.form.markAsPristine();
        this.initialFormValue = this.form.getRawValue();

        // Disable international address fields if regular address exists
        if (this.hasRegularAddress) {
          this.disableInternationalFields();
        }

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Checks if the contact has a regular/primary address.
   * A regular address is identified by having address1 or zip populated.
   */
  private checkHasRegularAddress(address: any): boolean {
    if (!address) return false;

    return !!(address.streetName?.trim() || address.zip?.trim());
  }

  /**
   * Disables international address input fields when regular address exists.
   */
  private disableInternationalFields(): void {
    this.form.get('address1')?.disable();
    this.form.get('address2')?.disable();
    this.form.get('address3')?.disable();
    this.form.get('address4')?.disable();
    this.form.get('country')?.disable();
    this.form.get('postalCode')?.disable();
    this.form.get('workPhone')?.disable();
    this.form.get('homePhone')?.disable();
    this.form.get('mobilePhone')?.disable();
    this.form.get('fax')?.disable();
    this.form.get('extension')?.disable();
    this.form.get('email')?.setValue('');
    this.form.get('email')?.disable();
  }

  getAddress1Error(): string {
    const control = this.form.get('address1');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Address 1 is required';
    if (control.hasError('maxlength')) return 'Address 1 can be maximum 50 characters';
    return '';
  }

  getCountryError(): string {
    const control = this.form.get('country');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Country is required';
    return '';
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
        address1: null,
        address2: null,
        address3: null,
        streetName: null,
        suiteApt: null,
        zip: null,
        uspsId: null,
        mapsco: null,
        dAreaCode: null,
        dPhoneNo: null,
        extension: null,
        dCountryCode: null,
        hAreaCode: null,
        hPhoneNo: null,
        hCountryCode: null,
        fPhoneNo: null,
        fAreaCode: null,
        fCountryCode: null,
        mAreaCode: null,
        mPhoneNo: null,
        pager: null,
        email: formValue.email?.trimStart()?.trim() || null,
        webAddress: address.webAddress || null,
        intlAddrFlag: 'Y',
        intlAddress1: formValue.address1?.trimStart()?.trim() || null,
        intlAddress2: formValue.address2?.trimStart()?.trim() || null,
        intlAddress3: formValue.address3?.trimStart()?.trim() || null,
        intlAddress4: formValue.address4?.trimStart()?.trim() || null,
        countryName: formValue.country || null,
        intlPostalCode: formValue.postalCode?.trimStart()?.trim() || null,
        intlHomePhoneNo: formValue.homePhone?.trimStart()?.trim() || null,
        intlWorkPhoneNo: formValue.workPhone?.trimStart()?.trim() || null,
        intlWorkPhoneExt: formValue.extension?.trimStart()?.trim() || null,
        intlMobilePhoneNo: formValue.mobilePhone?.trimStart()?.trim() || null,
        intlFaxNo: formValue.fax?.trimStart()?.trim() || null
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

  /**
   * Prevents leading spaces in input fields.
   * Call this on keydown event for text inputs.
   */
  preventLeadingSpace(event: KeyboardEvent, controlName: string): void {
    const input = event.target as HTMLInputElement;

    // If the input is empty or only contains spaces, prevent space key
    if (event.key === ' ' || event.code === 'Space') {
      const currentValue = input.value || '';
      const cursorPosition = input.selectionStart || 0;

      // Prevent space if field is empty or cursor is at the beginning and field only has spaces
      if (!currentValue || (cursorPosition === 0) || currentValue.trim() === '') {
        event.preventDefault();
        return;
      }
    }
  }

  /**
   * Removes leading spaces from input value.
   * Call this on input event for text inputs.
   * This handles both typing and pasting.
   */
  trimLeadingSpace(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove all leading spaces
    if (value && value !== value.trimStart()) {
      const trimmedValue = value.trimStart();
      const cursorPosition = input.selectionStart || 0;
      const removedSpaces = value.length - trimmedValue.length;

      input.value = trimmedValue;
      this.form.get(controlName)?.setValue(trimmedValue, { emitEvent: false });

      // Adjust cursor position
      const newPosition = Math.max(0, cursorPosition - removedSpaces);
      setTimeout(() => {
        input.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  }

  /**
   * Handles paste events to prevent leading spaces.
   * Call this on paste event for text inputs.
   */
  onPaste(event: ClipboardEvent, controlName: string): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';

    const input = event.target as HTMLInputElement;
    const control = this.form.get(controlName);

    if (control) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentValue = input.value || '';

      // If pasting at the beginning (position 0), trim leading spaces from pasted text
      const textToInsert = start === 0 ? pastedText.trimStart() : pastedText;

      // Insert text at cursor position
      const newValue = currentValue.substring(0, start) + textToInsert + currentValue.substring(end);

      // If the final value starts with space, trim it
      const finalValue = newValue.trimStart();

      control.setValue(finalValue);
      input.value = finalValue;

      // Set cursor position after pasted text
      setTimeout(() => {
        const newPosition = start + textToInsert.length - (newValue.length - finalValue.length);
        input.setSelectionRange(newPosition, newPosition);
      }, 0);
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
