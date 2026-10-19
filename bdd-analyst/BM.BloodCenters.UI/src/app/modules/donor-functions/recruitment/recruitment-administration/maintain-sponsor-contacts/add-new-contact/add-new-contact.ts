                                                                                                                                                                                                                                                       import { Component, OnInit, AfterViewInit, DestroyRef, ElementRef, ViewChild, inject, input, output, viewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, switchMap, of } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MaintainSponsorContactsService } from '../services/maintain-sponsor-contacts.service';
import { SponsorContactCreateDto, TitleLookupItem, ZipCodeLookupItem } from '../models/maintain-sponsor-contacts.model';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { InternationalAddressFormComponent } from '@shared/components/international-address-form/international-address-form.component';
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
  selector: 'app-add-new-contact',
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
    MatTabsModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule,
    InternationalAddressFormComponent
  ],
  templateUrl: './add-new-contact.html',
  styleUrls: ['./add-new-contact.scss']
})
export class AddNewContactComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly sponsorContactsService = inject(MaintainSponsorContactsService);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dateAdapter = inject<DateAdapter<moment.Moment>>(DateAdapter);
  private readonly loginService = inject(LoginService);

  readonly sponsorId = input('');
  readonly closePanel = output<void>();
  readonly saveSuccess = output<void>();
  readonly addAndContinue = output<void>();
  readonly intlAddressFormRef = viewChild.required<InternationalAddressFormComponent>('intlAddressFormRef');
  @ViewChild('effectiveDateInput') effectiveDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('terminationDateInput') terminationDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('citySelect') citySelect?: MatSelect;
  @ViewChild('zipCodeInput') zipCodeInput?: ElementRef<HTMLInputElement>;

  effDateErrorMatcher = {
    isErrorState: (control: AbstractControl | null): boolean => {
      if (!control) return false;
      return (control.touched || control.dirty) && !!this.getEffectiveDateError();
    }
  };

  termDateErrorMatcher = {
    isErrorState: (control: AbstractControl | null): boolean => {
      if (!control) return false;
      return (control.touched || control.dirty) && !!this.getTerminationDateError();
    }
  };

  activeTabIndex = 0;
  isSaving = false;
  minDate!: moment.Moment;
  minTerminationDate!: moment.Moment;
  chapterDate!: moment.Moment;
  chapterTimezone = '';
  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private zipCodeLookupInProgress = false;
  private shouldFocusCityAfterLoad = false;
  private zipInput$ = new Subject<string>();
  readonly showingIntlAddress = signal(false);
  readonly hasValidIntlAddress = signal(false);
  readonly hasPartialIntlAddress = signal(false);
  readonly hasPrimaryAddressData = signal(false);
  readonly pendingNotes = signal<Array<{ noteText: string; createdBy: string; createdDate: string }>>([]);
  readonly editingNoteIndex = signal<number | null>(null);

  // Searchable dropdown for Honorific
  readonly honorificSearchControl = new FormControl('');
  readonly honorificSearch = signal('');
  readonly honorificOptions = signal<TitleLookupItem[]>([]);
  readonly filteredHonorificOptions = computed(() => {
    const search = this.honorificSearch().toLowerCase();
    const options = this.honorificOptions();
    if (!search) return options;
    return options.filter(h =>
      h.code.toLowerCase().includes(search) ||
      h.description.toLowerCase().includes(search)
    );
  });

  // Searchable dropdown for Type
  readonly typeSearchControl = new FormControl('');
  readonly typeSearch = signal('');
  readonly typeOptions = signal<TitleLookupItem[]>([]);
  readonly filteredTypeOptions = computed(() => {
    const search = this.typeSearch().toLowerCase();
    const options = this.typeOptions();
    if (!search) return options;
    return options.filter(t =>
      t.code.toLowerCase().includes(search) ||
      t.description.toLowerCase().includes(search)
    );
  });

  // Searchable dropdown for Title
  readonly titleSearchControl = new FormControl('');
  readonly titleSearch = signal('');
  readonly titleOptions = signal<TitleLookupItem[]>([]);
  readonly filteredTitleOptions = computed(() => {
    const search = this.titleSearch().toLowerCase();
    const options = this.titleOptions();
    if (!search) return options;
    return options.filter(t =>
      t.code.toLowerCase().includes(search) ||
      t.description.toLowerCase().includes(search)
    );
  });

  // Searchable dropdown for City
  readonly citySearchControl = new FormControl('');
  readonly citySearch = signal('');
  readonly cityOptions = signal<ZipCodeLookupItem[]>([]);
  readonly filteredCityOptions = computed(() => {
    const search = this.citySearch().toLowerCase();
    const options = this.cityOptions();
    if (!search) return options;
    return options.filter(c =>
      c.city.toLowerCase().includes(search)
    );
  });

  readonly contactForm = this.fb.nonNullable.group({
    honorific: ['', [Validators.required]],
    firstName: [''],
    lastName: ['', [Validators.required, Validators.maxLength(30)]],
    type: ['', [Validators.required]],
    title: ['', [Validators.required]],
    effectiveDate: [null as moment.Moment | null, [
      dateFormatValidator(),
      DateFieldValidationUtility.validDateValidator(),
      Validators.required
    ]],
    terminationDate: [null as moment.Moment | null, [
      dateFormatValidator(),
      DateFieldValidationUtility.validDateValidator()
    ]]
  }, {
    validators: [DateFieldValidationUtility.dateRangeValidator()]
  });

  readonly addressForm = this.fb.nonNullable.group({
    street: ['', [Validators.required, Validators.maxLength(50)]],
    zipCode: ['', [Validators.required]],
    city: [{ value: null as number | null, disabled: true }, [Validators.required]],
    workPhone: ['', [this.phoneValidator()]],
    homePhone: ['', [this.phoneValidator()]],
    fax: ['', [this.phoneValidator()]],
    email: ['', [Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/), Validators.maxLength(128)]],
    website: ['', [Validators.maxLength(50), this.urlValidator()]]
  });

  readonly notesForm = this.fb.nonNullable.group({
    notes: ['']
  });

  ngOnInit(): void {
    this.chapterTimezone = this.headerService.getCurrentChapterTimezone();
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterTimezone);
    this.chapterDate = this.minDate.clone();
    this.minTerminationDate = this.minDate;

    // Set chapter timezone's current date as "today" for the datepicker
    if (this.dateAdapter instanceof ChapterTimezoneDateAdapter) {
      this.dateAdapter.setChapterMinDate(this.minDate);
    }

    // Add timezone-dependent validators after chapterTimezone is available
    this.contactForm.controls.effectiveDate.addValidators(
      DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterTimezone)
    );
    this.contactForm.controls.terminationDate.addValidators(
      DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterTimezone)
    );

    // Setup search control subscriptions
    this.honorificSearchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.honorificSearch.set(value || '');
      });

    this.typeSearchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.typeSearch.set(value || '');
      });

    this.titleSearchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.titleSearch.set(value || '');
      });

    this.citySearchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.citySearch.set(value || '');
      });

    this.loadDropdowns();
    this.setupEffectiveDateListener();
  }

  get isFormValid(): boolean {
    if (!this.contactForm?.valid) return false;

    // If user partially filled intl address (without required fields), block save
    if (this.hasPartialIntlAddress() && !this.hasValidIntlAddress()) return false;

    // Valid if: primary address is valid, OR intl address tab is valid
    return this.addressForm?.valid || this.hasValidIntlAddress();
  }

  ngAfterViewInit(): void {
    this.setupPrimaryAddressTracking();
    this.setupIntlAddressTracking();
    this.setupZipCodeLookup();
  }

  /**
   * Sets up zip code lookup with switchMap to auto-cancel in-flight requests.
   * Prevents race conditions when user types quickly or corrects zip code.
   */
  private setupZipCodeLookup(): void {
    const zipControl = this.addressForm.controls.zipCode;
    const cityControl = this.addressForm.controls.city;

    this.zipInput$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(zipCode => this.sponsorContactsService.getZipCodes(zipCode))
      )
      .subscribe({
        next: (data) => {
          this.zipCodeLookupInProgress = false;
          this.cityOptions.set(data);
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
          this.cityOptions.set([]);
          zipControl.setErrors({ zipNotFound: true });
          this.shouldFocusCityAfterLoad = false;
        }
      });
  }

  private setupPrimaryAddressTracking(): void {
    this.addressForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const values = this.addressForm.getRawValue();
        const hasData = !!(
          values.street?.trim() ||
          values.zipCode?.trim() ||
          values.city
        );
        this.hasPrimaryAddressData.set(hasData);
      });
  }

  private setupIntlAddressTracking(): void {
    const intlRef = this.intlAddressFormRef();
    intlRef.addressForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const controls = intlRef.addressForm.controls;
        const streetName = controls.addr1.value?.trim();
        const countryVal = controls.country.value as unknown;
        const country = typeof countryVal === 'string'
          ? countryVal.trim()
          : (countryVal as { description?: string })?.description || '';

        const wasValid = this.hasValidIntlAddress();
        const isNowValid = !!(streetName && country);
        this.hasValidIntlAddress.set(isNowValid);

        // Check if any field has data (partial fill)
        const anyFieldFilled = Object.values(controls).some(c => {
          const val = c.value as unknown;
          if (typeof val === 'string') return val.trim().length > 0;
          if (val && typeof val === 'object') return !!(val as { description?: string }).description;
          return false;
        });
        this.hasPartialIntlAddress.set(anyFieldFilled);

        if (!wasValid && isNowValid) {
          this.disableUsAddressFields();
        } else if (wasValid && !isNowValid) {
          this.enableUsAddressFields();
        }
      });
  }

  private disableUsAddressFields(): void {
    this.addressForm.controls.street.setValue('', { emitEvent: false });
    this.addressForm.controls.zipCode.setValue('', { emitEvent: false });
    this.addressForm.controls.city.setValue(null, { emitEvent: false });
    this.cityOptions.set([]);
    this.addressForm.controls.street.disable({ emitEvent: false });
    this.addressForm.controls.zipCode.disable({ emitEvent: false });
    this.addressForm.controls.city.disable({ emitEvent: false });
    this.hasPrimaryAddressData.set(false);
  }

  private enableUsAddressFields(): void {
    this.addressForm.controls.street.enable({ emitEvent: false });
    this.addressForm.controls.zipCode.enable({ emitEvent: false });
    // city remains disabled until zip lookup succeeds
  }

  private setupEffectiveDateListener(): void {
    this.contactForm.controls.effectiveDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(effectiveDate => {
        if (effectiveDate) {
          this.minTerminationDate = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
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
      this.contactForm.get(fieldName)?.setValue(normalized);
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

  effectiveDateFilter = (date: moment.Moment | null): boolean => {
    return DateFieldValidationUtility.createEffectiveDateFilter(this.chapterTimezone)(date);
  };

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    const effectiveDate = this.contactForm.controls.effectiveDate.value;
    return DateFieldValidationUtility.createTerminationDateFilter(effectiveDate)(date);
  };

  /**
   * Date class function for effective date picker.
   * Highlights the currently selected effective date in the calendar.
   * Note: Chapter timezone current date is highlighted automatically by the DateAdapter.
   */
  effectiveDateClass = (date: moment.Moment): string => {
    const effectiveDate = this.contactForm?.get('effectiveDate')?.value;
    if (effectiveDate) {
      const selected = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
      const dateStr = moment(date).format('YYYY-MM-DD');
      const selectedStr = selected.format('YYYY-MM-DD');
      if (dateStr === selectedStr) {
        return 'highlighted-effective-date';
      }
    }
    return '';
  };

  /**
   * Date class function for termination date picker.
   * Highlights the effective date and termination date in the calendar.
   * Note: Chapter timezone current date is highlighted automatically by the DateAdapter.
   */
  terminationDateClass = (date: moment.Moment): string => {
    const classes: string[] = [];

    const effectiveDate = this.contactForm?.get('effectiveDate')?.value;
    const terminationDate = this.contactForm?.get('terminationDate')?.value;

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

  onAddNote(): void {
    const text = this.notesForm.get('notes')?.value?.trim();
    if (!text) return;

    const idx = this.editingNoteIndex();
    if (idx !== null) {
      const updated = [...this.pendingNotes()];
      updated[idx] = { ...updated[idx], noteText: text };
      this.pendingNotes.set(updated);
      this.editingNoteIndex.set(null);
    } else {
      const createdBy = this.loginService.getStoredUsername() || '';
      const createdDate = this.chapterDate.format('DD-MMM-YYYY').toUpperCase();
      this.pendingNotes.update(notes => [...notes, { noteText: text, createdBy, createdDate }]);
    }

    this.notesForm.reset();
  }

  onEditNote(index: number): void {
    const note = this.pendingNotes()[index];
    this.notesForm.get('notes')?.setValue(note.noteText);
    this.editingNoteIndex.set(index);
  }

  onDeleteNote(index: number): void {
    this.pendingNotes.update(notes => notes.filter((_, i) => i !== index));
    if (this.editingNoteIndex() === index) {
      this.editingNoteIndex.set(null);
      this.notesForm.reset();
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  }

  /**
   * Handles Tab key on zip code field - waits for city to load before allowing tab through
   */
  onZipCodeKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab' && !event.shiftKey) {
      const zipControl = this.addressForm.controls.zipCode;
      const zipValue = zipControl.value || '';
      const cityControl = this.addressForm.controls.city;

      // If zip code has errors, prevent Tab (user must fix the error first)
      if (zipControl.errors) {
        event.preventDefault();
        zipControl.markAsTouched();
        return;
      }

      // If we have 5 digits and city is disabled (API in progress), prevent tab and wait
      if (zipValue.length === 5 && cityControl.disabled && this.zipCodeLookupInProgress) {
        event.preventDefault();
        this.shouldFocusCityAfterLoad = true;
      }
    }
  }

  filterZipCode(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filtered = input.value.replace(/\D/g, '');
    if (filtered !== input.value) {
      input.value = filtered;
      this.addressForm.controls.zipCode.setValue(filtered, { emitEvent: false });
    }

    // Trigger zip code lookup immediately when 5 digits are entered
    const zipControl = this.addressForm.controls.zipCode;
    const cityControl = this.addressForm.controls.city;

    // Reset city whenever zip changes
    cityControl.reset(null);
    cityControl.disable();
    this.cityOptions.set([]);
    this.zipCodeLookupInProgress = false;
    this.shouldFocusCityAfterLoad = false;

    // Emit zip code to Subject when we have exactly 5 digits
    // switchMap will auto-cancel any previous in-flight request
    if (filtered.length === 5) {
      this.zipCodeLookupInProgress = true;
      this.zipInput$.next(filtered);
    } else if (filtered.length > 0) {
      // Clear errors if user is still typing
      zipControl.setErrors(null);
    }
  }

  onZipCodeBlur(): void {
    // Mark the field as touched for validation display
    this.addressForm.controls.zipCode.markAsTouched();
    // The actual zip code lookup is now handled in filterZipCode() on input
  }

  private loadDropdowns(): void {
    this.sponsorContactsService.getSalutations().subscribe({
      next: (data) => this.honorificOptions.set(data),
      error: () => this.honorificOptions.set([])
    });

    this.sponsorContactsService.getContactTypes().subscribe({
      next: (data) => this.typeOptions.set(data),
      error: () => this.typeOptions.set([])
    });

    this.sponsorContactsService.getTitles().subscribe({
      next: (data) => this.titleOptions.set(data),
      error: () => this.titleOptions.set([])
    });
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  openIntlAddress(): void {
    this.showingIntlAddress.set(true);
  }

  onBackFromIntl(): void {
    this.showingIntlAddress.set(false);
  }

  onClearIntl(): void {
    this.intlAddressFormRef().addressForm.reset();
    this.hasValidIntlAddress.set(false);
    this.hasPartialIntlAddress.set(false);
    this.enableUsAddressFields();
  }

  onApplyIntl(): void {
    const intlRef = this.intlAddressFormRef();
    const controls = intlRef.addressForm.controls;
    const hasAnyData = !!(
      controls.addr1.value?.trim() ||
      controls.addr2.value?.trim() ||
      controls.addr3.value?.trim() ||
      controls.addr4.value?.trim() ||
      controls.country.value ||
      controls.postalCode.value?.trim() ||
      controls.workPhoneNo.value?.trim() ||
      controls.workPhoneExt.value?.trim() ||
      controls.homePhoneNo.value?.trim() ||
      controls.mobilePhoneNo.value?.trim() ||
      controls.faxNo.value?.trim() ||
      controls.email.value?.trim()
    );

    if (hasAnyData && intlRef.addressForm.invalid) {
      intlRef.addressForm.markAllAsTouched();
      return;
    }

    this.showingIntlAddress.set(false);
  }

  onAdd(): void {
    if (!this.validateForms()) return;
    this.saveContact(false);
  }

  onCreateAndAddAnother(): void {
    if (!this.validateForms()) return;
    this.saveContact(true);
  }

  private focusFirstInvalidField(): void {
    const forms = [this.contactForm, this.addressForm];
    for (const form of forms) {
      const firstInvalidControl = Object.keys(form.controls)
        .find(key => (form.controls as Record<string, any>)[key].invalid);
      if (firstInvalidControl) {
        const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
        if (el) {
          el.focus();
          return;
        }
      }
    }
  }

  private validateForms(): boolean {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      this.activeTabIndex = 0;
      this.focusFirstInvalidField();
      return false;
    }

    // If intl address partially filled but missing required fields, show errors
    if (this.hasPartialIntlAddress() && !this.hasValidIntlAddress()) {
      this.intlAddressFormRef().addressForm.markAllAsTouched();
      this.showingIntlAddress.set(true);
      return false;
    }

    if (this.addressForm.invalid && !this.hasValidIntlAddress()) {
      this.addressForm.markAllAsTouched();
      this.activeTabIndex = 1;
      this.focusFirstInvalidField();
      return false;
    }

    return true;
  }

  private saveContact(addAnother: boolean): void {
    const contactValues = this.contactForm.getRawValue();
    const addressValues = this.addressForm.getRawValue();
    const intlValues = this.intlAddressFormRef().getFormValue();
    const notesValues = this.notesForm.getRawValue();

    const selectedCity = this.cityOptions().find(c => c.uspsId === addressValues.city);

    const workPhone = this.splitPhoneNumber(addressValues.workPhone);
    const homePhone = this.splitPhoneNumber(addressValues.homePhone);
    const faxPhone = this.splitPhoneNumber(addressValues.fax);

    const payload: SponsorContactCreateDto = {
      sponsorId: this.sponsorId(),
      contactType: contactValues.type,
      lastName: contactValues.lastName?.trimStart()?.trim(),
      effDate: contactValues.effectiveDate ? moment(contactValues.effectiveDate).format('YYYY-MM-DD') : '',
      chapterId: this.headerService.getCurrentChapterId(),
      salutation: contactValues.honorific?.trimStart()?.trim() || undefined,
      firstName: contactValues.firstName?.trimStart()?.trim() || undefined,
      title: contactValues.title || undefined,
      termDate: contactValues.terminationDate ? moment(contactValues.terminationDate).format('YYYY-MM-DD') : undefined,
      address: {
        streetName: addressValues.street?.trimStart()?.trim() || undefined,
        uspsId: selectedCity?.uspsId || 0,
        dAreaCode: workPhone.areaCode || undefined,
        dPhoneNo: workPhone.phoneNo || undefined,
        hAreaCode: homePhone.areaCode || undefined,
        hPhoneNo: homePhone.phoneNo || undefined,
        fAreaCode: faxPhone.areaCode || undefined,
        fPhoneNo: faxPhone.phoneNo || undefined,
        email: addressValues.email?.trimStart()?.trim() || undefined,
        webAddress: addressValues.website?.trimStart()?.trim() || undefined,
        intlAddrFlag: intlValues.intlAddrFlag || 'N',
        intlAddress1: intlValues.addr1?.trimStart()?.trim() || undefined,
        intlAddress2: intlValues.addr2?.trimStart()?.trim() || undefined,
        intlAddress3: intlValues.addr3?.trimStart()?.trim() || undefined,
        intlAddress4: intlValues.addr4?.trimStart()?.trim() || undefined,
        countryName: intlValues.country || undefined,
        intlPostalCode: intlValues.postalCode?.trimStart()?.trim() || undefined,
        intlWorkPhoneExt: intlValues.workPhoneExt?.trimStart()?.trim() || undefined,
        intlWorkPhoneNo: intlValues.workPhoneNo?.trimStart()?.trim() || undefined,
        intlHomePhoneNo: intlValues.homePhoneNo?.trimStart()?.trim() || undefined,
        intlMobilePhoneNo: intlValues.mobilePhoneNo?.trimStart()?.trim() || undefined,
        intlFaxNo: intlValues.faxNo?.trimStart()?.trim() || undefined
      },
      notes: this.pendingNotes().length > 0
        ? this.pendingNotes().map(n => ({ noteText: n.noteText }))
        : undefined
    };

    this.isSaving = true;

    this.sponsorContactsService.createContact(payload).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        const salutation = payload.salutation ? `${payload.salutation} ` : '';
        const message = `${salutation}${payload.lastName} has been added to contacts successfully.`;
        this.snackBar.open(message, 'DISMISS', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });

        if (addAnother) {
          this.resetForms();
          this.addAndContinue.emit();
        } else {
          this.saveSuccess.emit();
        }
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

  private resetForms(): void {
    this.contactForm.reset();
    this.addressForm.reset();
    this.addressForm.controls.city.disable();
    this.cityOptions.set([]);
    this.intlAddressFormRef().addressForm.reset();
    this.notesForm.reset();
    this.pendingNotes.set([]);
    this.editingNoteIndex.set(null);
    this.activeTabIndex = 0;
    this.showingIntlAddress.set(false);

    // Reset search controls
    this.honorificSearchControl.setValue('');
    this.typeSearchControl.setValue('');
    this.titleSearchControl.setValue('');
    this.citySearchControl.setValue('');
  }

  getHonorificError(): string {
    const control = this.contactForm.controls.honorific;
    if (!control.touched) return '';
    if (control.hasError('required')) return 'Honorific is required';
    return '';
  }

  getLastNameError(): string {
    const control = this.contactForm.controls.lastName;
    if (!control.touched) return '';
    if (control.hasError('required')) return 'Last Name is required';
    if (control.hasError('maxlength')) return 'Last Name cannot exceed 30 characters';
    return '';
  }

  getTypeError(): string {
    const control = this.contactForm.controls.type;
    if (!control.touched) return '';
    if (control.hasError('required')) return 'Type is required';
    return '';
  }

  getTitleError(): string {
    const control = this.contactForm.controls.title;
    if (!control.touched) return '';
    if (control.hasError('required')) return 'Title is required';
    return '';
  }

  validateEffectiveDateInput(): void {
    this.lastChangedDateField = 'effective';
    const control = this.contactForm.get('effectiveDate');
    const inputElement = this.effectiveDateInput?.nativeElement;
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

  validateTerminationDateInput(): void {
    this.lastChangedDateField = 'termination';
    const control = this.contactForm.get('terminationDate');
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

  getEffectiveDateError(): string {
    const control = this.contactForm.controls.effectiveDate;
    if (!(control.touched || control.dirty)) return '';

    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'Effective Date is invalid';
    }

    const inputElement = this.effectiveDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value && control.hasError('required')) {
      return 'Effective Date is invalid';
    }

    if (control.hasError('required')) {
      return 'Effective Date is required';
    }

    if (control.hasError('effectiveDatePast')) {
      return 'Effective date cannot be past date';
    }

    if (this.lastChangedDateField === 'effective' && this.contactForm.errors?.['dateRangeInvalid']) {
      return 'Effective Date must be before or equal to Termination Date';
    }

    return '';
  }

  getTerminationDateError(): string {
    const control = this.contactForm.get('terminationDate');
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

    if (this.lastChangedDateField !== 'effective') {
      if (control.hasError('matDatepickerMin')) {
        return 'Termination Date must be greater than or equal to Effective Date';
      }

      if (this.contactForm.errors?.['dateRangeInvalid']) {
        return 'Termination Date must be greater than or equal to Effective Date';
      }
    }

    return '';
  }

  formatPhoneNumber(event: Event, controlName: string, formGroup?: AbstractControl): void {
    const input = event.target as HTMLInputElement;
    const selStart = input.selectionStart || 0;
    const prevDigits = (input.value.substring(0, selStart)).replace(/\D/g, '').length;
    const digits = input.value.replace(/\D/g, '').substring(0, 10);
    const formatted = this.buildPhoneFormat(digits);

    input.value = formatted;
    const form = formGroup || this.contactForm;
    const control = (form as FormGroup).get(controlName);
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

  private splitPhoneNumber(formatted: string): { areaCode: string; phoneNo: string } {
    const digits = (formatted || '').replace(/\D/g, '');
    return {
      areaCode: digits.substring(0, 3) || '',
      phoneNo: digits.substring(3) || ''
    };
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
  preventLeadingSpace(event: KeyboardEvent, controlName: string, formGroup: any = this.contactForm): void {
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
  trimLeadingSpace(event: Event, controlName: string, formGroup: any = this.contactForm): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    let value = input.value;

    // Remove all leading spaces
    if (value && value !== value.trimStart()) {
      const trimmedValue = value.trimStart();
      const cursorPosition = input.selectionStart || 0;
      const removedSpaces = value.length - trimmedValue.length;

      input.value = trimmedValue;
      formGroup.get(controlName)?.setValue(trimmedValue, { emitEvent: false });

      // Adjust cursor position
      const newPosition = Math.max(0, cursorPosition - removedSpaces);
      setTimeout(() => {
        input.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  }

  toUpperCaseAndTrim(event: Event, controlName: string, formGroup: any = this.contactForm): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value;
    const trimmed = raw.trimStart();
    const upper = trimmed.toUpperCase();

    if (raw !== upper) {
      const removedFromStart = raw.length - trimmed.length;
      const cursorPos = input.selectionStart || 0;
      input.value = upper;
      formGroup.get(controlName)?.setValue(upper, { emitEvent: false });
      formGroup.get(controlName)?.markAsTouched();
      const newPos = Math.max(0, cursorPos - removedFromStart);
      setTimeout(() => input.setSelectionRange(newPos, newPos), 0);
    }
  }

  /**
   * Handles paste events to prevent leading spaces.
   * Call this on paste event for text inputs.
   */
  onPaste(event: ClipboardEvent, controlName: string, formGroup: any = this.contactForm): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';

    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    const control = formGroup.get(controlName);

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
