import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MaintainDriveLocationService } from '../services/maintain-drive-location.service';
import { UppercaseInputDirective } from '@shared/directives/uppercase-input.directive';

interface CountryOption {
  code: string;
  description: string;
}

@Component({
  selector: 'app-drive-location-international-address',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    NgxMatSelectSearchModule,
    UppercaseInputDirective
  ],
  templateUrl: './international-address.html',
  styleUrls: ['./international-address.scss']
})
export class DriveLocationInternationalAddressComponent implements OnInit, OnChanges {
  @Input() locationId: string | null = null;
  @Input() hasUSAddressData: boolean = false;
  @Input() existingData: any = null; // Pre-filled data if already applied
  @Output() closePanel = new EventEmitter<void>();
  @Output() applyData = new EventEmitter<any>(); // Emit data without saving

  form!: FormGroup;
  isLoading = true;
  countryOptions: CountryOption[] = [];
  filteredCountryOptions = signal<CountryOption[]>([]);
  countrySearchControl = new FormControl('');
  showBlockedWarning = false;
  private countriesLoaded = false;

  constructor(
    private fb: FormBuilder,
    private maintainDriveLocationService: MaintainDriveLocationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setupForm();
    this.loadCountries();
    this.loadAddress();
    this.setupCountrySearch();

    // Show warning if US address fields contain data
    this.showBlockedWarning = this.hasUSAddressData;

    // Disable form if blocked
    if (this.showBlockedWarning) {
      this.form.disable();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When existingData changes and countries are loaded with actual data, populate the form
    if (changes['existingData'] && this.countriesLoaded && this.countryOptions.length > 0) {
      // Use setTimeout to ensure mat-select options are rendered
      setTimeout(() => {
        this.populateFormWithExistingData();
      }, 100);
    }
  }

  private setupForm(): void {
    this.form = this.fb.group({
      address1: ['', [Validators.required, Validators.maxLength(50)]],
      address2: ['', [Validators.maxLength(50)]],
      address3: ['', [Validators.maxLength(50)]],
      address4: ['', [Validators.maxLength(50)]],
      country: ['', [Validators.required, Validators.maxLength(50)]],
      postalCode: ['', [Validators.maxLength(15)]],
      extension: ['', [Validators.pattern(/^\d*$/), Validators.maxLength(8)]],
      workPhone: ['', [Validators.pattern(/^\d*$/), Validators.maxLength(20)]],
      homePhone: ['', [Validators.pattern(/^\d*$/), Validators.maxLength(20)]],
      mobilePhone: ['', [Validators.pattern(/^\d*$/), Validators.maxLength(20)]],
      fax: ['', [Validators.pattern(/^\d*$/), Validators.maxLength(20)]],
      email: ['', [Validators.pattern(/^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/), Validators.maxLength(128)]]
    });
  }

  private loadCountries(): void {
    this.maintainDriveLocationService.getCountries().subscribe({
      next: (data) => {
        this.countryOptions = data || [];
        this.filteredCountryOptions.set(data || []);
        this.countriesLoaded = true;

        // Populate form with existing data after countries are loaded
        // Use setTimeout to ensure mat-select options are rendered
        setTimeout(() => {
          this.populateFormWithExistingData();
        }, 100);
      },
      error: (error) => {
        console.error('Error loading countries:', error);
        this.countryOptions = [];
        this.filteredCountryOptions.set([]);
        this.countriesLoaded = false;
      }
    });
  }

  private populateFormWithExistingData(): void {
    if (!this.existingData) {
      return;
    }

    // Find the country code that matches the country name
    let countryCode = '';
    if (this.existingData.countryName) {
      const searchName = (this.existingData.countryName || '').toString().trim().toLowerCase();
      const matchingCountry = this.countryOptions.find(
        c => c.description.trim().toLowerCase() === searchName || c.code.trim().toLowerCase() === searchName
      );
      countryCode = matchingCountry ? matchingCountry.code : '';
    }

    const patchData = {
      address1: this.existingData.intlAddress1 || '',
      address2: this.existingData.intlAddress2 || '',
      address3: this.existingData.intlAddress3 || '',
      address4: this.existingData.intlAddress4 || '',
      country: countryCode,
      postalCode: this.existingData.intlPostalCode || '',
      extension: this.existingData.intlWorkPhoneExt || '',
      workPhone: this.existingData.intlWorkPhoneNo || '',
      homePhone: this.existingData.intlHomePhoneNo || '',
      mobilePhone: this.existingData.intlMobilePhoneNo || '',
      fax: this.existingData.intlFaxNo || '',
      email: this.existingData.intlEmail || ''
    };

    // First patch all fields except country
    const { country, ...otherFields } = patchData;
    this.form.patchValue(otherFields);

    // Then set country separately with explicit setValue
    if (countryCode) {
      const countryControl = this.form.get('country');
      if (countryControl) {
        countryControl.setValue(countryCode);
        countryControl.updateValueAndValidity();
      }
    }

    // Trigger change detection
    this.cdr.detectChanges();
  }

  private setupCountrySearch(): void {
    this.countrySearchControl.valueChanges.subscribe(searchTerm => {
      this.filterCountries(searchTerm || '');
    });
  }

  private filterCountries(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredCountryOptions.set(this.countryOptions);
      return;
    }

    const filterValue = searchTerm.toLowerCase();
    const filtered = this.countryOptions.filter(option =>
      option.description.toLowerCase().includes(filterValue) ||
      option.code.toLowerCase().includes(filterValue)
    );
    this.filteredCountryOptions.set(filtered);
  }

  private loadAddress(): void {
    if (!this.locationId) {
      this.isLoading = false;
      return;
    }

    // TODO: Implement API call to load existing international address
    // For now, just mark loading as complete
    this.isLoading = false;
  }

  get isFormValid(): boolean {
    // Form is invalid if blocked by US address data
    if (this.showBlockedWarning) {
      return false;
    }
    return this.form?.valid;
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

  onApply(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    const formValue = this.form.getRawValue();

    // Find the country name from the country code
    const selectedCountry = this.countryOptions.find(c => c.code === formValue.country);
    const countryName = selectedCountry ? selectedCountry.description : formValue.country;

    const internationalAddressData = {
      intlAddrFlag: 'Y',
      intlAddress1: formValue.address1?.trim() || null,
      intlAddress2: formValue.address2?.trim() || null,
      intlAddress3: formValue.address3?.trim() || null,
      intlAddress4: formValue.address4?.trim() || null,
      countryName: countryName || null,
      intlPostalCode: formValue.postalCode?.trim() || null,
      intlHomePhoneNo: formValue.homePhone?.trim() || null,
      intlWorkPhoneNo: formValue.workPhone?.trim() || null,
      intlWorkPhoneExt: formValue.extension?.trim() || null,
      intlMobilePhoneNo: formValue.mobilePhone?.trim() || null,
      intlFaxNo: formValue.fax?.trim() || null,
      intlEmail: formValue.email?.trim() || null
    };

    this.applyData.emit(internationalAddressData);
    this.closePanel.emit();
  }
}
