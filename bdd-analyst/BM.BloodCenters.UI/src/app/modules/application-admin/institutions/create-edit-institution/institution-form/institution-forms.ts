import { Component, Input, signal, EventEmitter, Output, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DD_MON_YYYY_FORMATS } from '../../../../../shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { SubmitErrorStateMatcher } from '../../../../../shared/error-state-matchers/submit-error-state.matcher';
import { MatSelectModule } from '@angular/material/select';
import { UI_INSTITUTION } from '../../../../../core/constants/ui.constants';
import { VALIDATION } from '../../../../../core/constants/validation.constants';
import { TranslateModule } from '@ngx-translate/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { CodabarScheme } from '@shared/enums/codabar-scheme.enum';
import { InstitutionService, LookupCode } from '../../service/institution.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment from 'moment';

@Component({
  selector: 'app-institution-form',
  standalone: true,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatCardModule,
    MatIconModule,
    ReactiveFormsModule,
    MatSelectModule,
    TranslateModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './institution-forms.html',
  styleUrls: ['./institution-forms.scss'],
})
export class InstitutionForms implements OnInit, OnDestroy {
  @Input({ required: true }) form!: FormGroup;
  @Input('submitted') isSubmitted = false;
  @Input() mode: 'create' | 'edit' = 'create';

  @Output() logoRemoved = new EventEmitter<void>();
  @Output() formResetRequested = new EventEmitter<void>()

  UI = UI_INSTITUTION;
  VALIDATION = VALIDATION;

  CodabarScheme = CodabarScheme;

  // Minimum date for effective date (today in CREATE mode, null in EDIT mode)
  minEffectiveDate: moment.Moment | null = null;

  // Default start date for calendar (chapter locale date)
  calendarStartDate: moment.Moment | null = null;

  private intlSub?: Subscription;
  private institutionService = inject(InstitutionService);
  private chapterTimezoneService = inject(ChapterTimezoneService);
  private destroy$ = new Subject<void>();

  stateOptions: LookupCode[] = [];
  filteredStateOptions: LookupCode[] = [];
  stateSearchControl = new FormControl('');
  countryOptions: LookupCode[] = [];

  isDragging = signal(false);

  selectedFile = signal<File | null>(null);
  uploadProgress = signal(0);
  uploading = signal(false);
  uploadCompleted = signal(false);
  fileUrl = signal<string | null>(null);

  uploadError = signal<string | null>(null);

  fileSizeMB = signal<number | null>(null);

  readonly MAX_FILE_SIZE_MB = 5;
  readonly ACCEPTED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

  // FILE SELECTION
  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.startUpload(input.files[0]);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.startUpload(file);
    }
  }

  // UPLOAD
  private startUpload(file: File): void {
    this.uploadError.set(null);

    if (!this.ACCEPTED_FILE_TYPES.includes(file.type)) {
      this.uploadError.set('Invalid file type. Only JPG, JPEG, PNG, GIF, and WEBP are allowed.');
      return;
    }

    if (file.size > this.MAX_FILE_SIZE_MB * 1024 * 1024) {
      this.uploadError.set(
        `Failed to upload document. File size is too large (max ${this.MAX_FILE_SIZE_MB} MB).`
      );
      return;
    }

    this.selectedFile.set(file);
    this.uploading.set(true);
    this.uploadCompleted.set(false);
    this.uploadProgress.set(0);

    const interval = setInterval(() => {
      const progress = this.uploadProgress() + 10;
      this.uploadProgress.set(progress);

      if (progress >= 100) {
        clearInterval(interval);
        this.uploading.set(false);
        this.uploadCompleted.set(true);
        this.fileUrl.set(URL.createObjectURL(file));
        this.fileSizeMB.set(file.size / 1024 / 1024);

        this.form.markAsDirty();
        this.form.updateValueAndValidity();
      }
    }, 300);
  }

  // DELETE
  removeFile(): void {
    this.selectedFile.set(null);
    this.uploadProgress.set(0);
    this.uploading.set(false);
    this.uploadCompleted.set(false);
    this.fileUrl.set(null);
    this.fileSizeMB.set(null);
    this.uploadError.set(null);

    // reset native file input
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    this.resetFormValidation(this.form);

    // In EDIT mode, mark form as dirty when logo is removed (it's a change from existing state)
    if (this.mode === 'edit') {
      this.form.markAsDirty();
    }

    this.logoRemoved.emit();
  }

  matcher = new SubmitErrorStateMatcher(() => this.isSubmitted);

  ngOnInit(): void {
    // Set minimum date to today ONLY for CREATE mode (matches Oracle Forms logic)
    // In EDIT mode, allow selecting any date including past dates
    this.minEffectiveDate = this.mode === 'create'
      ? DateFieldValidationUtility.getMinDate()
      : null;

    // Set calendar default start date to chapter locale date
    this.calendarStartDate = this.chapterTimezoneService.getChapterLocalDate();

    // Load state and country lookups
    this.loadStatesLookup();
    this.loadCountriesLookup();

    // Setup state search control
    this.setupStateSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupStateSearch(): void {
    this.stateSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredStateOptions = this.stateOptions.filter(option =>
          option.code.toLowerCase().includes(term) ||
          option.description.toLowerCase().includes(term)
        );
      });
  }

  private loadStatesLookup(): void {
    this.institutionService.getStatesLookup().subscribe({
      next: (states) => {
        this.stateOptions = states || [];
        this.filteredStateOptions = [...this.stateOptions];
      },
      error: (error) => {
        this.stateOptions = [];
        this.filteredStateOptions = [];
      }
    });
  }

  private loadCountriesLookup(): void {
    this.institutionService.getCountriesLookup().subscribe({
      next: (countries) => {
        this.countryOptions = countries || [];
      },
      error: (error) => {
        this.countryOptions = [];
      }
    });
  }

  public resetFormValidation(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      if (control instanceof FormGroup) {
        this.resetFormValidation(control);
      } else {
        control.markAsPristine();
        control.markAsUntouched();
        control.updateValueAndValidity({ onlySelf: true });
      }
    });
  }

  // DRAG STATE
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  // Format phone/fax number as XXX-XXX-XXXX
  formatPhoneNumber(event: FocusEvent, controlPath: string): void {
    const control = this.form.get(controlPath);

    if (!control) return;

    let value = control.value as string;
    if (!value) return;

    const digitsOnly = value.replace(/\D/g, '');

    if (digitsOnly.length === 10) {
      const formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
      control.setValue(formatted, { emitEvent: false });
    } else {
      control.setValue(digitsOnly, { emitEvent: false });
    }
  }

  // Strip spaces from international phone/fax fields in real-time
  onInternationalPhoneFaxInput(event: Event, controlPath: string): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get(controlPath);

    if (!control) return;

    const valueWithoutSpaces = input.value.replace(/\s/g, '');
    if (valueWithoutSpaces !== input.value) {
      control.setValue(valueWithoutSpaces, { emitEvent: false });
      input.value = valueWithoutSpaces;
    }
  }

  // Restrict input to maximum 10 digits in real-time
  onPhoneOrFaxInput(event: Event, controlPath: string): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get(controlPath);

    if (!control) return;

    const digitsOnly = input.value.replace(/\D/g, '');

    if (digitsOnly.length > 10) {
      const truncated = digitsOnly.substring(0, 10);
      control.setValue(truncated, { emitEvent: false });

      input.value = truncated;
    } else {
      control.setValue(digitsOnly, { emitEvent: false });
      input.value = digitsOnly;
    }
  }

  // Get character count for Institution Name field
  getInstitutionNameCharCount(): string {
    const control = this.form.get('institutionName');
    if (!control) return '';

    const currentLength = control.value?.length || 0;
    const maxLength = 50;

    return `characters remaining: ${maxLength - currentLength}`;
  }

  // Check if Institution Name has value to show character counter
  showInstitutionNameCounter(): boolean {
    const control = this.form.get('institutionName');
    return !!(control?.value && control.value.length > 0);
  }

  // Get character count for System Name field
  getSystemNameCharCount(): string {
    const control = this.form.get('systemName');
    if (!control) return '';

    const currentLength = control.value?.length || 0;
    const maxLength = 50;

    return `characters remaining: ${maxLength - currentLength}`;
  }

  // Check if System Name has value to show character counter
  showSystemNameCounter(): boolean {
    const control = this.form.get('systemName');
    return !!(control?.value && control.value.length > 0);
  }

  // Get character count for Print Header field
  getPrintHeaderCharCount(): string {
    const control = this.form.get('printHeader');
    if (!control) return '';

    const currentLength = control.value?.length || 0;
    const maxLength = 50;

    return `characters remaining: ${maxLength - currentLength}`;
  }

  // Check if Print Header has value to show character counter
  showPrintHeaderCounter(): boolean {
    const control = this.form.get('printHeader');
    return !!(control?.value && control.value.length > 0);
  }

  // Get character count for Address Line 1 field
  getAddr1CharCount(): string {
    const control = this.form.get('contactInfo.addr_1');
    if (!control) return '';

    const currentLength = control.value?.length || 0;
    const maxLength = 50;

    return `characters remaining: ${maxLength - currentLength}`;
  }

  // Check if Address Line 1 has value to show character counter
  showAddr1Counter(): boolean {
    const control = this.form.get('contactInfo.addr_1');
    return !!(control?.value && control.value.length > 0);
  }

  // Get character count for Address Line 2 field
  getAddr2CharCount(): string {
    const control = this.form.get('contactInfo.addr_2');
    if (!control) return '';

    const currentLength = control.value?.length || 0;
    const maxLength = 50;

    return `characters remaining: ${maxLength - currentLength}`;
  }

  // Check if Address Line 2 has value to show character counter
  showAddr2Counter(): boolean {
    const control = this.form.get('contactInfo.addr_2');
    return !!(control?.value && control.value.length > 0);
  }

  // Get character count for Address Line 3 field
  getAddr3CharCount(): string {
    const control = this.form.get('contactInfo.addr_3');
    if (!control) return '';

    const currentLength = control.value?.length || 0;
    const maxLength = 50;

    return `characters remaining: ${maxLength - currentLength}`;
  }

  // Check if Address Line 3 has value to show character counter
  showAddr3Counter(): boolean {
    const control = this.form.get('contactInfo.addr_3');
    return !!(control?.value && control.value.length > 0);
  }

  // Restrict input to alphanumeric and spaces only (for fields like System Name, Print Header, etc.)
  onAlphanumericSpaceInput(event: Event, controlPath: string): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get(controlPath);

    if (!control) return;

    let value = input.value;

    // Allow only letters, numbers, and spaces
    let sanitized = value.replace(/[^A-Za-z0-9\s]/g, '');

    // Remove leading spaces
    if (sanitized.startsWith(' ')) {
      sanitized = sanitized.trimStart();
    }

    if (sanitized !== value) {
      control.setValue(sanitized, { emitEvent: false });
      input.value = sanitized;
    }
  }

  // Restrict input to alphanumeric, spaces, and pipe (for Institution Name)
  onInstitutionNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get('institutionName');

    if (!control) return;

    // Allow only letters, numbers, spaces, and pipe |
    const sanitized = input.value.replace(/[^A-Za-z0-9\s|]/g, '');

    if (sanitized !== input.value) {
      control.setValue(sanitized, { emitEvent: false });
      input.value = sanitized;
    }
  }

  // Restrict input to alphanumeric only (no spaces) - for Registration Number, License Number
  onAlphanumericOnlyInput(event: Event, controlPath: string): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get(controlPath);

    if (!control) return;

    // Allow only letters and numbers (no spaces)
    const sanitized = input.value.replace(/[^A-Za-z0-9]/g, '');

    if (sanitized !== input.value) {
      control.setValue(sanitized, { emitEvent: false });
      input.value = sanitized;
    }
  }

  // Dynamic postal code input handler based on international flag
  onPostalCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get('contactInfo.zipCode');
    const isInternational = this.form.get('contactInfo.isInternational')?.value;

    if (!control) return;

    let sanitized: string;

    if (isInternational) {
      // International: Allow alphanumeric, spaces, and special characters (- . / , # +)
      sanitized = input.value.replace(/[^A-Za-z0-9\s\-./,#+]/g, '');
    } else {
      // US: Only digits
      sanitized = input.value.replace(/[^0-9]/g, '');
    }

    if (sanitized !== input.value) {
      control.setValue(sanitized, { emitEvent: false });
      input.value = sanitized;
    }
  }

  // Restrict input to alphabetic and spaces only (for City, Country, etc.)
  onAlphabeticSpaceInput(event: Event, controlPath: string): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get(controlPath);

    if (!control) return;

    let value = input.value;

    // Allow only letters and spaces
    let sanitized = value.replace(/[^A-Za-z\s]/g, '');

    // Remove leading spaces
    if (sanitized.startsWith(' ')) {
      sanitized = sanitized.trimStart();
    }

    if (sanitized !== value) {
      control.setValue(sanitized, { emitEvent: false });
      input.value = sanitized;
    }
  }

  // Prevent leading spaces for any field
  onInputPreventLeadingSpace(event: Event, controlPath: string): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get(controlPath);

    if (!control) return;

    let value = input.value;

    // If value starts with space(s), remove leading spaces
    if (value.startsWith(' ')) {
      const trimmed = value.trimStart();
      control.setValue(trimmed, { emitEvent: false });
      input.value = trimmed;
    }
  }

  /**
   * Oracle Forms WHEN-VALIDATE-ITEM trigger equivalent (FMB line 1011)
   * Validates address completeness when user navigates away from Institution Name field
   *
   * Oracle Forms Logic:
   *   :global.addr_field := 'INSTITUTIONS.ADDRESS_ID';
   *   check_address(:institutions.address_id);
   *
   * Angular Implementation:
   *   - Triggers addressCompletenessValidator on contactInfo FormGroup
   *   - Marks all address fields as touched to show validation errors
   *   - Provides early feedback about incomplete address data
   */
  onInstitutionNameBlur(): void {
    const contactInfoGroup = this.form.get('contactInfo');

    if (!contactInfoGroup) return;

    // Trigger validation on the contactInfo group
    contactInfoGroup.updateValueAndValidity();

    // If address validation fails, mark all address fields as touched
    // This displays error messages and provides early feedback
    if (contactInfoGroup.hasError('incompleteAddress')) {
      const addressFields = [
        'addr_1',
        'addr_2',
        'addr_3',
        'city',
        'state',
        'zipCode',
        'country'
      ];

      addressFields.forEach(fieldName => {
        const control = contactInfoGroup.get(fieldName);
        if (control) {
          control.markAsTouched();
          control.updateValueAndValidity({ emitEvent: false });
        }
      });
    }
  }
}
