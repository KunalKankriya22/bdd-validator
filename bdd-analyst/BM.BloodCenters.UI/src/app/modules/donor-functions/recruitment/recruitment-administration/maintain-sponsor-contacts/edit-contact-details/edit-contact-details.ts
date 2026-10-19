import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy, ViewChild, ElementRef, signal, computed } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MaintainSponsorContactsService } from '../services/maintain-sponsor-contacts.service';
import { SponsorContactModel, SponsorContactDetailModel, TitleLookupItem } from '../models/maintain-sponsor-contacts.model';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import moment from 'moment';

// Custom DateAdapter to use chapter timezone for "today" highlighting
class ChapterTimezoneDateAdapter extends UppercaseMomentDateAdapter {
  private chapterMinDate: moment.Moment | null = null;

  setChapterMinDate(date: moment.Moment): void {
    this.chapterMinDate = date;
  }

  override today(): moment.Moment {
    // Return chapter timezone's current date instead of browser's local date
    return this.chapterMinDate ? this.chapterMinDate.clone() : moment();
  }
}

@Component({
  selector: 'app-edit-contact-details',
  standalone: true,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterTimezoneDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './edit-contact-details.html',
  styleUrls: ['./edit-contact-details.scss']
})
export class EditContactDetailsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data: SponsorContactModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  @ViewChild('terminationDateInput') terminationDateInput?: ElementRef<HTMLInputElement>;

  termDateErrorMatcher = {
    isErrorState: (control: AbstractControl | null): boolean => {
      if (!control) return false;
      return (control.touched || control.dirty) && !!this.getTerminationDateError();
    }
  };

  form!: FormGroup;
  isSaving = false;
  isLoading = false;
  contactDetail: SponsorContactDetailModel | null = null;
  private initialFormValue: Record<string, unknown> | null = null;
  minDate!: moment.Moment;
  minTerminationDate!: moment.Moment;
  chapterDate!: moment.Moment;
  chapterTimezone = '';
  private destroy$ = new Subject<void>();

  // Searchable dropdown for Honorific
  readonly honorificSearchControl = new FormControl('');
  readonly honorificSearch = signal('');
  readonly honorificOptionsSignal = signal<TitleLookupItem[]>([]);
  readonly filteredHonorificOptions = computed(() => {
    const search = this.honorificSearch().toLowerCase();
    const options = this.honorificOptionsSignal();
    if (!search) return options;
    return options.filter(h =>
      h.code.toLowerCase().includes(search) ||
      h.description.toLowerCase().includes(search)
    );
  });

  // Searchable dropdown for Type
  readonly typeSearchControl = new FormControl('');
  readonly typeSearch = signal('');
  readonly typeOptionsSignal = signal<TitleLookupItem[]>([]);
  readonly filteredTypeOptions = computed(() => {
    const search = this.typeSearch().toLowerCase();
    const options = this.typeOptionsSignal();
    if (!search) return options;
    return options.filter(t =>
      t.code.toLowerCase().includes(search) ||
      t.description.toLowerCase().includes(search)
    );
  });

  // Searchable dropdown for Title
  readonly titleSearchControl = new FormControl('');
  readonly titleSearch = signal('');
  readonly titleOptionsSignal = signal<TitleLookupItem[]>([]);
  readonly filteredTitleOptions = computed(() => {
    const search = this.titleSearch().toLowerCase();
    const options = this.titleOptionsSignal();
    if (!search) return options;
    return options.filter(t =>
      t.code.toLowerCase().includes(search) ||
      t.description.toLowerCase().includes(search)
    );
  });

  // Keep old arrays for backward compatibility
  honorificOptions: TitleLookupItem[] = [];
  typeOptions: TitleLookupItem[] = [];
  titleOptions: TitleLookupItem[] = [];

  constructor(
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private sponsorContactsService: MaintainSponsorContactsService,
    private headerService: HeaderService,
    private chapterTimezoneService: ChapterTimezoneService,
    private dateAdapter: DateAdapter<moment.Moment>
  ) {}

  ngOnInit(): void {
    this.chapterTimezone = this.headerService.getCurrentChapterTimezone();
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterTimezone);
    this.chapterDate = this.minDate.clone();
    this.minTerminationDate = this.minDate;

    // Set chapter timezone's current date as "today" for the datepicker
    if (this.dateAdapter instanceof ChapterTimezoneDateAdapter) {
      this.dateAdapter.setChapterMinDate(this.minDate);
    }

    // Setup search control subscriptions
    this.honorificSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.honorificSearch.set(value || '');
      });

    this.typeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.typeSearch.set(value || '');
      });

    this.titleSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.titleSearch.set(value || '');
      });

    this.initForm();
    this.loadDropdowns();
    this.loadContactDetail();
    this.setupEffectiveDateListener();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      this.loadContactDetail();
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      honorific: ['', [Validators.required]],
      firstName: [''],
      lastName: ['', [Validators.required, Validators.maxLength(30)]],
      type: ['', [Validators.required]],
      title: ['', [Validators.required]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null, [
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterTimezone)
      ]]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });
  }

  private loadContactDetail(): void {
    if (!this.data?.sponsorId || !this.data?.addressId) {
      this.populateForm();
      return;
    }

    this.isLoading = true;
    this.sponsorContactsService.getContactDetail(this.data.sponsorId, this.data.addressId).subscribe({
      next: (detail) => {
        this.contactDetail = detail;
        this.isLoading = false;
        this.populateForm();
      },
      error: () => {
        this.isLoading = false;
        this.populateForm();
      }
    });
  }

  get initials(): string {
    const record = this.contactDetail || this.data;
    const first = record?.firstName?.charAt(0) || '';
    const last = record?.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  get isFormValid(): boolean {
    if (!this.form) return false;
    const hasErrors = Object.keys(this.form.controls).some(key => {
      const control = this.form.get(key);
      return control?.errors && control?.touched;
    });
    if (hasErrors) return false;
    if (!this.initialFormValue) return this.form.dirty;
    return JSON.stringify(this.form.getRawValue()) !== JSON.stringify(this.initialFormValue);
  }

  private populateForm(): void {
    const record = this.contactDetail || this.data || {} as any;
    const address = record.address || {} as any;

    const effectiveDateValue = this.toMomentOrNull(record.effDate);

    // Trim leading spaces from text fields when populating the form
    this.form.patchValue({
      honorific: record.salutation?.trimStart() || '',
      firstName: record.firstName?.trimStart() || '',
      lastName: record.lastName?.trimStart() || '',
      type: record.contactType || '',
      title: record.title || '',
      effectiveDate: effectiveDateValue,
      terminationDate: this.toMomentOrNull(record.termDate)
    });

    // Update min termination date based on effective date (use later of effective date or today)
    if (effectiveDateValue) {
      this.minTerminationDate = effectiveDateValue.isAfter(this.minDate) ? effectiveDateValue : this.minDate;
    }

    this.form.markAsPristine();
    this.initialFormValue = this.form.getRawValue();
  }

  /**
   * Get display value for firstName with WCAG compliance.
   * Returns hyphen (-) if value is empty.
   */
  getFirstNameDisplay(): string {
    const firstName = this.form?.get('firstName')?.value;
    return firstName?.trim() || '-';
  }

  /**
   * Get display value for lastName with WCAG compliance.
   * Returns hyphen (-) if value is empty.
   */
  getLastNameDisplay(): string {
    const lastName = this.form?.get('lastName')?.value;
    return lastName?.trim() || '-';
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

  private setupEffectiveDateListener(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(effectiveDate => {
        if (effectiveDate) {
          const effMoment = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
          // Use the later of effective date or today (minDate) to prevent termination in the past
          this.minTerminationDate = effMoment.isAfter(this.minDate) ? effMoment : this.minDate;
        } else {
          this.minTerminationDate = this.minDate;
        }
      });
  }

  onDateFieldBlur(fieldName: string, event: any): void {
    const inputValue = event.target.value;
    if (!inputValue || !inputValue.trim()) return;

    const normalized = this.normalizeDateInput(inputValue.trim());
    if (normalized) {
      this.form.get(fieldName)?.setValue(normalized);
      // Update the input field to show the corrected date format
      event.target.value = normalized.format('DD-MMM-YYYY').toUpperCase();
    }
  }

  private normalizeDateInput(input: string): moment.Moment | null {
    if (!input || !input.trim()) return null;

    let trimmed = input.trim().toUpperCase();

    // Auto-correct year to 4 characters if longer
    // Handle patterns like: DD-MON-YYYYYYY, YYYYYYY-MM-DD, etc.
    trimmed = this.truncateYearTo4Chars(trimmed);

    // Try various date formats
    const formats = [
      'DD-MMM-YYYY',     // 11-JAN-2020
      'MMM-DD-YYYY',     // JAN-11-2020
      'DD/MM/YYYY',      // 11/01/2020
      'MM/DD/YYYY',      // 01/11/2020
      'YYYY-MM-DD',      // 2020-01-11
      'DD-MM-YYYY',      // 11-01-2020
      'MM-DD-YYYY',      // 01-11-2020
      'YYYY/MM/DD',      // 2020/01/11
      'D-MMM-YYYY',      // 1-JAN-2020
      'MMM-D-YYYY',      // JAN-1-2020
      'D/M/YYYY',        // 1/1/2020
      'M/D/YYYY',        // 1/1/2020
      'DDMMMYYYY',       // 11JAN2020
      'MMMDDYYYY',       // JAN112020
      'DD-MMM-YY',       // 11-JAN-20
      'MMM-DD-YY',       // JAN-11-20
      'D-MMM-YY',        // 1-JAN-20
      'MMM-D-YY'         // JAN-1-20
    ];

    for (const format of formats) {
      const parsed = moment(trimmed, format, true);
      if (parsed.isValid()) {
        return parsed;
      }
    }

    // Try lenient parsing as last resort
    const lenient = moment(trimmed);
    if (lenient.isValid()) {
      return lenient;
    }

    return null;
  }

  private truncateYearTo4Chars(input: string): string {
    // Pattern 1: Year at the end (DD-MMM-YYYY or DD/MM/YYYY)
    // Match 4+ digit year at the end: 10-JAN-202000 -> 10-JAN-2020
    input = input.replace(/(\d{1,2}[-/][A-Z]{3}[-/])(\d{4})\d+$/i, '$1$2');
    input = input.replace(/(\d{1,2}[-/]\d{1,2}[-/])(\d{4})\d+$/i, '$1$2');

    // Pattern 2: Year at the beginning (YYYY-MM-DD or YYYY/MM/DD)
    // Match 4+ digit year at the start: 202000-01-10 -> 2020-01-10
    input = input.replace(/^(\d{4})\d+([-/]\d{1,2}[-/]\d{1,2})/, '$1$2');

    // Pattern 3: Continuous format (DDMMMYYYY)
    // Match pattern like 10JAN202000 -> 10JAN2020
    input = input.replace(/^(\d{1,2}[A-Z]{3})(\d{4})\d+$/i, '$1$2');

    return input;
  }

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    const effectiveDate = this.form?.get('effectiveDate')?.value;
    return DateFieldValidationUtility.createTerminationDateFilter(effectiveDate)(date);
  };

  /**
   * Date class function for termination date picker.
   * Highlights the effective date and termination date in the calendar.
   * Note: Chapter timezone current date is highlighted automatically by the DateAdapter.
   */
  terminationDateClass = (date: moment.Moment): string => {
    const classes: string[] = [];

    const effectiveDate = this.form?.get('effectiveDate')?.value;
    const terminationDate = this.form?.get('terminationDate')?.value;

    if (effectiveDate) {
      const effDate = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
      const dateStr = moment(date).format('YYYY-MM-DD');
      const effDateStr = effDate.format('YYYY-MM-DD');
      if (dateStr === effDateStr) {
        classes.push('highlighted-effective-date');
      }
    }

    if (terminationDate) {
      const termDate = moment.isMoment(terminationDate) ? terminationDate : moment(terminationDate);
      const dateStr = moment(date).format('YYYY-MM-DD');
      const termDateStr = termDate.format('YYYY-MM-DD');
      if (dateStr === termDateStr) {
        classes.push('highlighted-termination-date');
      }
    }

    return classes.join(' ');
  };

  private loadDropdowns(): void {
    this.sponsorContactsService.getSalutations().subscribe({
      next: (data) => {
        this.honorificOptions = data;
        this.honorificOptionsSignal.set(data);
      },
      error: () => {
        this.honorificOptions = [];
        this.honorificOptionsSignal.set([]);
      }
    });

    this.sponsorContactsService.getContactTypes().subscribe({
      next: (data) => {
        this.typeOptions = data;
        this.typeOptionsSignal.set(data);
      },
      error: () => {
        this.typeOptions = [];
        this.typeOptionsSignal.set([]);
      }
    });

    this.sponsorContactsService.getTitles().subscribe({
      next: (data) => {
        this.titleOptions = data;
        this.titleOptionsSignal.set(data);
      },
      error: () => {
        this.titleOptions = [];
        this.titleOptionsSignal.set([]);
      }
    });
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
      contactType: formValue.type,
      lastName: formValue.lastName?.trimStart()?.trim(),
      effDate: formValue.effectiveDate ? moment(formValue.effectiveDate).format('YYYY-MM-DDTHH:mm:ss') : '',
      salutation: formValue.honorific?.trimStart()?.trim() || null,
      firstName: formValue.firstName?.trimStart()?.trim() || null,
      middleName: detail.middleName || null,
      title: formValue.title || null,
      termDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DDTHH:mm:ss') : null,
      insertUser: detail.insertUser || null,
      noteId: detail.noteId || null,
      address: {
        addressId: address.addressId || null,
        address1: address.address1 || null,
        address2: address.address2 || null,
        address3: address.address3 || null,
        streetName: address.streetName || null,
        suiteApt: address.suiteApt || null,
        zip: address.zip || null,
        uspsId: address.uspsId || null,
        mapsco: address.mapsco || null,
        dAreaCode: address.dAreaCode || null,
        dPhoneNo: address.dPhoneNo || null,
        extension: address.extension || null,
        dCountryCode: address.dCountryCode || null,
        fAreaCode: address.fAreaCode || null,
        fPhoneNo: address.fPhoneNo || null,
        fCountryCode: address.fCountryCode || null,
        hAreaCode: address.hAreaCode || null,
        hPhoneNo: address.hPhoneNo || null,
        hCountryCode: address.hCountryCode || null,
        mAreaCode: address.mAreaCode || null,
        mPhoneNo: address.mPhoneNo || null,
        pager: address.pager || null,
        email: address.email || null,
        webAddress: address.webAddress || null,
        intlAddrFlag: address.intlAddrFlag || null,
        intlAddress1: address.intlAddress1 || null,
        intlAddress2: address.intlAddress2 || null,
        intlAddress3: address.intlAddress3 || null,
        intlAddress4: address.intlAddress4 || null,
        countryName: address.countryName || null,
        intlPostalCode: address.intlPostalCode || null,
        intlHomePhoneNo: address.intlHomePhoneNo || null,
        intlWorkPhoneNo: address.intlWorkPhoneNo || null,
        intlWorkPhoneExt: address.intlWorkPhoneExt || null,
        intlMobilePhoneNo: address.intlMobilePhoneNo || null,
        intlFaxNo: address.intlFaxNo || null
      }
    };

    this.isSaving = true;

    const sponsorId = (this.contactDetail || this.data)!.sponsorId;
    const addressId = this.data!.addressId;
    const chapterId = this.headerService.getCurrentChapterId();

    this.sponsorContactsService.updateContact(sponsorId, addressId, chapterId, payload).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        const salutation = payload.salutation ? payload.salutation + ' ' : '';
        const message = `Contact detail of ${salutation}${payload.lastName} has been updated successfully.`;
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

  getLastNameError(): string {
    const control = this.form.get('lastName');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Last Name is required';
    if (control.hasError('maxlength')) return 'Last Name cannot exceed 30 characters';
    return '';
  }

  getTypeError(): string {
    const control = this.form.get('type');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Type is required';
    return '';
  }

  getTitleError(): string {
    const control = this.form.get('title');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Title is required';
    return '';
  }

  getHonorificError(): string {
    const control = this.form.get('honorific');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Honorific is required';
    return '';
  }

  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';

    // Check for invalid date format errors first (before required)
    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'Effective date is invalid';
    }

    // Then check for required error (only when truly empty)
    if (control.hasError('required')) {
      return 'Effective Date is required';
    }

    if (control.hasError('effectiveDatePast')) {
      return 'Effective date cannot be past date';
    }

    if (this.form.errors?.['dateRangeInvalid']) {
      return 'Effective Date must be before or equal to Termination Date';
    }

    return '';
  }

  validateTerminationDateInput(): void {
    const control = this.form.get('terminationDate');
    const inputElement = this.terminationDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';
    control?.markAsTouched();

    if (inputValue && !control?.value && control) {
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');
    if (!control) return '';
    if (!(control.touched || control.dirty)) return '';

    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }

    const inputElement = this.terminationDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value) {
      return 'Termination Date is invalid';
    }

    if (control.hasError('terminationDatePast')) {
      return 'Termination date cannot be past date';
    }

    if (control.hasError('matDatepickerMin')) {
      return 'Termination Date must be greater than or equal to Effective Date';
    }

    if (this.form.errors?.['dateRangeInvalid']) {
      return 'Termination Date must be greater than or equal to Effective Date';
    }

    return '';
  }

  getFormattedEffectiveDate(): string {
    const effectiveDate = this.form?.get('effectiveDate')?.value;
    const formatted = DateFieldValidationUtility.formatDateForUI(effectiveDate);
    return formatted ? formatted.toUpperCase() : '-';
  }

  private toMomentOrNull(value: any): moment.Moment | null {
    if (!value || value === '-') return null;
    let parsed = moment(value, 'DD-MMM-YYYY', true);
    if (parsed.isValid()) return parsed;
    parsed = moment(value);
    return parsed.isValid() ? parsed : null;
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
