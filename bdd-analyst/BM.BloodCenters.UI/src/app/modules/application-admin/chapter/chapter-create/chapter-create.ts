import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ViewChildren,
  QueryList,
  ElementRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import {
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from "@angular/forms";

import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from "@angular/material/core";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSnackBar } from "@angular/material/snack-bar";
import { NgxMatSelectSearchModule } from "ngx-mat-select-search";

import { CdkScrollable, ScrollingModule } from "@angular/cdk/scrolling";
import { HeaderService } from "@shared/services/header.service";
import { InstitutionService } from "../../institutions/service/institution.service";
import { Chapter, Chapters, LookupCode } from "../services/chapters";
import {
  noWhitespaceOnlyValidator,
  positiveIntegerValidator
} from "@shared/validators/input.validators";
import { DateFieldValidationUtility } from "@shared/components/DateFieldUtility/date-field-validation.utility";
import { ChapterAwareDateAdapter } from "@shared/date/chapter-aware-date-adapter";
import { DD_MON_YYYY_FORMATS } from "@shared/date/date-formats";

import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import moment from "moment";

moment.updateLocale("en", {
  monthsShort: [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ],
});

export function toIsoFromDDMMYYYY(value: string | null): string | null {
  if (!value) return null;

  // Supports both formats: "02-FEB-2025, 10:30" or "02-FEB-2025 10:30"
  let datePart: string;
  let timePart: string;

  if (value.includes(", ")) {
    // Format with comma: "02-FEB-2025, 10:30"
    [datePart, timePart] = value.split(", ");
  } else {
    // Format with space only: "02-FEB-2025 10:30"
    const parts = value.split(" ");
    datePart = parts[0];
    timePart = parts[1];
  }

  const [day, mon, year] = datePart.split("-");
  const [hour, minute] = timePart.split(":");

  const monthMap: Record<string, number> = {
    JAN: 0,
    FEB: 1,
    MAR: 2,
    APR: 3,
    MAY: 4,
    JUN: 5,
    JUL: 6,
    AUG: 7,
    SEP: 8,
    OCT: 9,
    NOV: 10,
    DEC: 11,
  };

  const monthIndex = monthMap[mon.toUpperCase()];
  if (monthIndex === undefined) {
    throw new Error(`Invalid month: ${mon}`);
  }

  return new Date(
    Date.UTC(
      Number(year),
      monthIndex,
      Number(day),
      Number(hour),
      Number(minute)
    )
  ).toISOString();
}

/* ======================================================
   CUSTOM VALIDATORS
====================================================== */

const alphaNumericValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  // Check for whitespace-only
  if (typeof value === 'string' && value.trim().length === 0) {
    return { whitespaceOnly: true };
  }
  return /^[a-zA-Z0-9 ]+$/.test(value) ? null : { alphaNumeric: true };
};

const numericValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  // Check for whitespace-only
  if (typeof value === 'string' && value.trim().length === 0) {
    return { whitespaceOnly: true };
  }
  return /^[0-9]+$/.test(value) ? null : { numeric: true };
};

const cityNameValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  if (/[^A-Za-z\s]/.test(value)) {
    return { alphabeticOnly: true };
  }
  return null;
};

const toleranceValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value;

  // allow blank
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return /^(-1|0|1|\+1)$/.test(String(value)) ? null : { invalidTolerance: true };
};

export const isbtDateTimeFormatValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value;

  if (!value) {
    return null; // handled by required validator
  }

  // DD-MON-YYYY HH:MI - Accepts both with comma (DD-MON-YYYY, HH:MI) or space only (DD-MON-YYYY HH:MI)
  const regex =
    /^(0[1-9]|[12][0-9]|3[01])-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4},?\s([01]\d|2[0-3]):[0-5]\d$/i;

  return regex.test(value) ? null : { invalidIsbtFormat: true };
};

export const cryoTimeLimitValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === "") {
    return { required: true };
  }

  // Must be number-like
  if (isNaN(value)) {
    return { invalidFormat: true };
  }

  const stringValue = value.toString();

  // If no decimal, treat as whole hours (e.g., 5 = 5 hours 0 minutes)
  if (!stringValue.includes(".")) {
    const hours = Number(stringValue);
    if (isNaN(hours) || hours < 0 || hours > 9999) {
      return { invalidFormat: true };
    }
    if (hours === 0) {
      return { minValue: true };
    }
    return null;
  }

  const [hoursStr, minutesStr] = stringValue.split(".");

  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  // Hours must be 0–9999
  if (hours < 0 || hours > 9999) {
    return { invalidFormat: true };
  }

  // Minutes must be 00–59
  if (minutes < 0 || minutes > 59 || minutesStr.length !== 2) {
    return { invalidMinutes: true };
  }

  // Minimum is 0.01 (1 minute)
  if (hours === 0 && minutes < 1) {
    return { minValue: true };
  }

  return null;
};

/* Effective Date < Termination Date - using shared validator from date.validators.ts */

/* ======================================================
   COMPONENT
====================================================== */

@Component({
  selector: "app-chapter-create",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatCardModule,
    MatCheckboxModule,
    ScrollingModule,
    RouterLink,
    NgxMatSelectSearchModule,
  ],
  templateUrl: "./chapter-create.html",
  styleUrls: ["./chapter-create.scss"],
  providers: [
    {
      provide: DateAdapter,
      useClass: ChapterAwareDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
})
export class ChapterCreate implements OnInit, AfterViewInit, OnDestroy {
  /* ======================================================
     VIEW REFERENCES
  ====================================================== */

  @ViewChildren("sectionRef")
  sections!: QueryList<ElementRef<HTMLElement>>;

  @ViewChild(CdkScrollable)
  scrollContainer!: CdkScrollable;

  timeZoneOptions: LookupCode[] = [];

  isEditMode = false;
  activeSection = "basic-info";
  private institutionCountry = '';
  private destroy$ = new Subject<void>();

  chapterForm!: FormGroup;

  chapterName = "";
  lastUpdatedBy: any;
  lastUpdatedAt: any;

  isTimeZoneEnabled = true;

  // Track which date field was last changed for cross-field error display
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  // Custom error state matchers for date fields
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  // Date filter for effective date - blocks past dates from selection (add mode only)
  effectiveDateFilter = (date: moment.Moment | null): boolean => {
    if (!date || this.isEditMode) return true;
    const checkDate = moment(date).startOf('day');
    const today = DateFieldValidationUtility.getMinDate();
    return !checkDate.isBefore(today);
  };

  // Date filter for termination date - blocks past dates and dates before effective date
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = DateFieldValidationUtility.getMinDate();

    // Block past dates (must be today or future)
    if (checkDate.isBefore(today)) {
      return false;
    }

    // Must be >= effective date if set
    const effectiveDate = this.chapterForm?.get('effectiveDate')?.value;
    if (effectiveDate) {
      const effDate = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
      const effDay = moment(effDate).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  /* ======================================================
     DROPDOWN OPTIONS
  ====================================================== */

  unitSchemeOptions = [
    { label: "A (Alphanumeric)", value: "A" },
    { label: "N (Numeric)", value: "N" },
  ];

  yesNoOptions = [
    { label: "Yes", value: true },
    { label: "No", value: false },
  ];

  sequenceCheckInOptions = this.yesNoOptions;
  qcForLabelOptions = this.yesNoOptions;
  nursingAuditOptions = this.yesNoOptions;
  testingChapterOptions = this.yesNoOptions;
  donorCueScannedOptions = this.yesNoOptions;

  labelReviewOptions = this.yesNoOptions;
  acceptExpiredReturnsOptions = this.yesNoOptions;
  pltHlaMatchReturnOptions = this.yesNoOptions;
  pltDesignatedReturnOptions = this.yesNoOptions;
  rbcDesignatedReturnOptions = this.yesNoOptions;
  InstitutionID: any = "INST";
  stateOptions: LookupCode[] = [];
  filteredStateOptions: LookupCode[] = [];
  stateSearchControl = new FormControl('');

  countryOptions: LookupCode[] = [];
  filteredCountryOptions: LookupCode[] = [];
  countrySearchControl = new FormControl('');

  filteredTimeZoneOptions: LookupCode[] = [];
  timeZoneSearchControl = new FormControl('');

  /* ======================================================
     CONSTRUCTOR
  ====================================================== */

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private Chapters: Chapters,
    private route: ActivatedRoute,
    private router: Router,
    private headerService: HeaderService,
    private institutionService: InstitutionService
  ) { }

  /* ======================================================
     LIFECYCLE
  ====================================================== */

  ngOnInit(): void {
    // Check if we're in edit mode based on route params
    const chapterId = this.route.snapshot.paramMap.get('chapterId');
    if (chapterId) {
      this.isEditMode = true;
    }

    this.buildForm();
    this.setupModeValidators();
    this.setupDateValidationListeners();
    this.loadStatesLookup();
    this.loadCountriesLookup();
    this.loadTimeZonesLookup();
    this.setupDropdownSearch();
    this.loadInstitutionCountry();
    this.subscribeToChapterChanges();

    if (this.isEditMode && chapterId) {
      this.loadChapterForEdit(chapterId);
    } else {
      this.setupStateValidation();
      this.setupZipCodeValidation();
      this.setupTimeZoneValidation();
    }

  }

  ngAfterViewInit(): void {
    const scrollRoot = this.scrollContainer.getElementRef().nativeElement;
    const sections = document.querySelectorAll<HTMLElement>(".section");
    const sectionIds = Array.from(sections).map(s => s.id);
    const visibleSections = new Set<string>();

    const pickActiveSection = (): string | undefined => {
      const atBottom = Math.abs(scrollRoot.scrollHeight - scrollRoot.scrollTop - scrollRoot.clientHeight) < 2;
      if (atBottom) {
        return [...sectionIds].reverse().find(id => visibleSections.has(id));
      }
      return sectionIds.find(id => visibleSections.has(id));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleSections.add(entry.target.id);
          } else {
            visibleSections.delete(entry.target.id);
          }
        });

        const active = pickActiveSection();
        if (active) {
          setTimeout(() => {
            this.activeSection = active;
          });
        }
      },
      {
        root: scrollRoot,
        threshold: 0.35,
      }
    );

    sections.forEach((section) => observer.observe(section));

    let scrollTimer: ReturnType<typeof setTimeout>;
    scrollRoot.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const active = pickActiveSection();
        if (active) {
          this.activeSection = active;
        }
      }, 50);
    }, { passive: true });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.chapterForm.reset();
        this.chapterForm.patchValue({
          isInternational: false,
          country: null,
          sequenceCheckIn: null,
          qcForLabel: null,
          nursingAudit: null,
          testingChapter: null,
          donorCueScanned: null,
          labelReview: null,
          acceptExpiredReturns: null,
          pltHlaMatchReturn: null,
          pltDesignatedReturn: null,
          rbcDesignatedReturn: null,
          ffFlag: false,
          autoCross: false,
          directedCross: false,
        });
        this.loadStatesLookup();
        this.loadCountriesLookup();
        this.loadTimeZonesLookup();
        this.loadInstitutionCountry();
      });
  }

  private loadStatesLookup(): void {
    this.Chapters.getStatesLookup().subscribe({
      next: (states) => {
        this.stateOptions = states || [];
        this.filteredStateOptions = [...this.stateOptions];
      },
      error: () => {
        this.stateOptions = [];
        this.filteredStateOptions = [];
      }
    });
  }

  private loadCountriesLookup(): void {
    this.Chapters.getCountriesLookup().subscribe({
      next: (countries) => {
        this.countryOptions = countries || [];
        this.filteredCountryOptions = [...this.countryOptions];
      },
      error: () => {
        this.countryOptions = [];
        this.filteredCountryOptions = [];
      }
    });
  }

  private loadTimeZonesLookup(): void {
    this.Chapters.getTimeZonesLookup().subscribe({
      next: (timezones) => {
        this.timeZoneOptions = timezones || [];
        this.filteredTimeZoneOptions = [...this.timeZoneOptions];
      },
      error: () => {
        this.timeZoneOptions = [];
        this.filteredTimeZoneOptions = [];
      }
    });
  }

  private loadInstitutionCountry(): void {
    this.institutionService.getInstitution().subscribe({
      next: (institution) => {
        if (institution?.country) {
          this.institutionCountry = institution.country;
        }
      }
    });
  }

  private setupDropdownSearch(): void {
    this.stateSearchControl.valueChanges.subscribe(search => {
      const term = (search as string || '').toLowerCase();
      this.filteredStateOptions = this.stateOptions.filter(o =>
        o.code.toLowerCase().includes(term) ||
        (o.description && o.description.toLowerCase().includes(term))
      );
    });

    this.countrySearchControl.valueChanges.subscribe(search => {
      const term = (search as string || '').toLowerCase();
      this.filteredCountryOptions = this.countryOptions.filter(o =>
        o.code.toLowerCase().includes(term)
      );
    });

    this.timeZoneSearchControl.valueChanges.subscribe(search => {
      const term = (search as string || '').toLowerCase();
      this.filteredTimeZoneOptions = this.timeZoneOptions.filter(o =>
        o.code.toLowerCase().includes(term) ||
        (o.description && o.description.toLowerCase().includes(term))
      );
    });
  }

  /**
   * Validator: phone number must have exactly 10 digits (excluding country code).
   */
  private phoneDigitsValidator(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const digits = this.extractRawDigits(control.value);
      if (digits.length === 0) return null;
      if (digits.length !== 10) {
        return { phoneDigits: true };
      }
      return null;
    };
  }

  /**
   * Validator: international phone/fax must have at most 15 digits.
   */
  private intlPhoneDigitsValidator(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const digits = control.value.replace(/\D/g, '');
      if (digits.length === 0) return null;
      if (digits.length > 15) {
        return { intlPhoneDigits: true };
      }
      return null;
    };
  }

  /**
   * Extract raw number digits from a value, stripping any existing (+X) country code prefix.
   */
  private extractRawDigits(value: string): string {
    // If already formatted like "(+1) 123-456-7890", strip the country code part
    const formatted = value.match(/^\(\+(\d+)\)\s*(.*)$/);
    if (formatted) {
      // Return only the number part digits (without country code)
      return formatted[2].replace(/\D/g, '');
    }
    // Otherwise just return all digits
    return value.replace(/\D/g, '');
  }

  /**
   * Format raw number digits into (+1) XXX-XXX-XXXX display format.
   */
  formatPhoneNumber(value: string | null): string {
    if (!value) return '';
    const digits = this.extractRawDigits(value);
    if (digits.length === 0) return '';

    const area = digits.slice(0, 3);
    const mid = digits.slice(3, 6);
    const last = digits.slice(6, 10);
    let result = '(+1) ';
    if (area) result += area;
    if (mid) result += '-' + mid;
    if (last) result += '-' + last;
    return result;
  }

  /**
   * Format phone/fax field on blur.
   */
  onPhoneBlur(controlName: string): void {
    const control = this.chapterForm.get(controlName);
    if (!control?.value) return;
    const formatted = this.formatPhoneNumber(control.value);
    control.setValue(formatted, { emitEvent: false });
  }

  /**
   * Strip formatting on focus so user can edit raw digits.
   */
  onPhoneFocus(controlName: string): void {
    const control = this.chapterForm.get(controlName);
    if (!control?.value) return;
    const digits = this.extractRawDigits(control.value);
    control.setValue(digits, { emitEvent: false });
  }

  /**
   * Restrict input to digits only, max 10.
   */
  onPhoneInput(controlName: string): void {
    const control = this.chapterForm.get(controlName);
    if (!control?.value) return;
    const digits = control.value.replace(/\D/g, '').slice(0, 10);
    if (digits !== control.value) {
      control.setValue(digits, { emitEvent: false });
    }
  }

  /**
   * Force Chapter ID to uppercase as user types.
   */
  onChapterIdInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;
    const upperValue = currentValue.toUpperCase();

    if (currentValue !== upperValue) {
      this.chapterForm.get('chapterId')?.setValue(upperValue, { emitEvent: false });
      input.value = upperValue;
    }
  }

  /**
   * Auto-append .00 to decimal fields on blur.
   */
  onDecimalBlur(controlName: string, decimals: number = 4): void {
    const control = this.chapterForm.get(controlName);
    if (control?.value === null || control?.value === undefined || control?.value === '') return;

    const value = parseFloat(control.value);
    if (!isNaN(value)) {
      const formatted = value.toFixed(decimals);
      control.setValue(formatted);
      this.chapterForm.updateValueAndValidity();
    }
  }

  onCityKeypress(event: KeyboardEvent): void {
    const char = event.key;
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(char)) {
      return;
    }
    if (!/^[A-Za-z\s]$/.test(char)) {
      event.preventDefault();
    }
  }

  onCityInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/[^A-Za-z\s]/g, '');
    if (cleaned !== input.value) {
      const control = this.chapterForm.get('city');
      control?.setValue(cleaned, { emitEvent: false });
      input.value = cleaned;
    }
  }

  /**
   * Prevent non-numeric characters in integer number fields.
   * Blocks: e, E, +, -, .
   */
  onNumberKeypress(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    const char = String.fromCharCode(charCode);

    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(charCode) !== -1) {
      return;
    }

    // Block: e, E, +, -, .
    if (char === 'e' || char === 'E' || char === '+' || char === '-' || char === '.') {
      event.preventDefault();
      return;
    }

    // Allow only digits (0-9)
    if (char < '0' || char > '9') {
      event.preventDefault();
    }
  }

  onMaxDigitsInput(event: Event, maxDigits: number): void {
    const input = event.target as HTMLInputElement;
    if (input.value.length > maxDigits) {
      input.value = input.value.slice(0, maxDigits);
      this.chapterForm.get((input as HTMLInputElement).getAttribute('formControlName')!)
        ?.setValue(+input.value, { emitEvent: false });
    }
  }

  /**
   * Prevent entering more than 7 digits in ABO Batch Size field
   */
  onAboBatchSizeKeypress(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    const char = String.fromCharCode(charCode);
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;

    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(charCode) !== -1) {
      return;
    }

    // Block: e, E, +, -, .
    if (char === 'e' || char === 'E' || char === '+' || char === '-' || char === '.') {
      event.preventDefault();
      return;
    }

    // Block if already at 6 characters
    if (currentValue.length >= 6) {
      event.preventDefault();
      return;
    }

    // Allow only digits (0-9)
    if (char < '0' || char > '9') {
      event.preventDefault();
    }
  }

  /**
   * Prevent entering more than 2 digits in Company Number field
   */
  onCompanyNumberKeypress(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    const char = String.fromCharCode(charCode);
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;

    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(charCode) !== -1) {
      return;
    }

    // Block: e, E, +, -, .
    if (char === 'e' || char === 'E' || char === '+' || char === '-' || char === '.') {
      event.preventDefault();
      return;
    }

    // Block if already at 2 characters
    if (currentValue.length >= 2) {
      event.preventDefault();
      return;
    }

    // Allow only digits (0-9)
    if (char < '0' || char > '9') {
      event.preventDefault();
    }
  }

  /**
   * Prevent entering more than 2 digits in Sample Age field
   */
  onSampleAgeKeypress(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    const char = String.fromCharCode(charCode);
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;

    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(charCode) !== -1) {
      return;
    }

    // Block: e, E, +, -, .
    if (char === 'e' || char === 'E' || char === '+' || char === '-' || char === '.') {
      event.preventDefault();
      return;
    }

    // Block if already at 2 characters
    if (currentValue.length >= 2) {
      event.preventDefault();
      return;
    }

    // Allow only digits (0-9)
    if (char < '0' || char > '9') {
      event.preventDefault();
    }
  }

  /**
   * Prevent non-numeric characters in decimal number fields.
   * Blocks: e, E, +, -
   * Allows: digits and one decimal point
   */
  onDecimalKeypress(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    const char = String.fromCharCode(charCode);
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;

    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(charCode) !== -1) {
      return;
    }

    // Block: e, E, +, -
    if (char === 'e' || char === 'E' || char === '+' || char === '-') {
      event.preventDefault();
      return;
    }

    // Allow decimal point only if not already present
    if (char === '.') {
      if (currentValue.includes('.')) {
        event.preventDefault();
      }
      return;
    }

    // Allow only digits (0-9)
    if (char < '0' || char > '9') {
      event.preventDefault();
    }
  }

  onMaxDiscountKeypress(event: KeyboardEvent): void {
    const char = event.key;
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;

    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(char)) {
      return;
    }

    if (char === 'e' || char === 'E' || char === '+' || char === '-') {
      event.preventDefault();
      return;
    }

    if (char === '.') {
      if (currentValue.includes('.')) {
        event.preventDefault();
      }
      return;
    }

    if (char < '0' || char > '9') {
      event.preventDefault();
      return;
    }

    if (currentValue.includes('.')) {
      const [intPart, decPart] = currentValue.split('.');
      const cursorPos = input.selectionStart ?? currentValue.length;
      const dotIndex = currentValue.indexOf('.');
      if (cursorPos <= dotIndex) {
        if (intPart.length >= 3) {
          event.preventDefault();
        }
      } else {
        if (decPart.length >= 2) {
          event.preventDefault();
        }
      }
    } else {
      if (currentValue.length >= 3 && char !== '.') {
        event.preventDefault();
      }
    }
  }

  onMaxDiscountBlur(controlName: string): void {
    const control = this.chapterForm.get(controlName);
    if (control?.value === null || control?.value === undefined || control?.value === '') return;

    const value = parseFloat(control.value);
    if (!isNaN(value)) {
      control.setValue(value.toFixed(2));
    }
  }

  /**
   * Restrict FFP Freeze Duration: max 5 whole digits, or 3 before decimal + 2 after.
   */
  onPercentKeypress(event: KeyboardEvent): void {
    const char = event.key;
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;

    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(char)) {
      return;
    }

    if (char === 'e' || char === 'E' || char === '+' || char === '-') {
      event.preventDefault();
      return;
    }

    if (char === '.') {
      if (currentValue.includes('.')) {
        event.preventDefault();
      }
      return;
    }

    if (char < '0' || char > '9') {
      event.preventDefault();
      return;
    }

    if (currentValue.includes('.')) {
      const [intPart, decPart] = currentValue.split('.');
      const cursorPos = input.selectionStart ?? currentValue.length;
      const dotIndex = currentValue.indexOf('.');
      if (cursorPos <= dotIndex) {
        if (intPart.length >= 2) {
          event.preventDefault();
        }
      } else {
        if (decPart.length >= 4) {
          event.preventDefault();
        }
      }
    } else {
      if (currentValue.length >= 2 && char !== '.') {
        event.preventDefault();
      }
    }
  }

  onAltLevelKeypress(event: KeyboardEvent): void {
    const char = event.key;
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;

    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(char)) {
      return;
    }

    if (char === 'e' || char === 'E' || char === '+' || char === '-') {
      event.preventDefault();
      return;
    }

    if (char === '.') {
      if (currentValue.includes('.')) {
        event.preventDefault();
      }
      return;
    }

    if (char < '0' || char > '9') {
      event.preventDefault();
      return;
    }

    if (currentValue.includes('.')) {
      const [intPart, decPart] = currentValue.split('.');
      const cursorPos = input.selectionStart ?? currentValue.length;
      const dotIndex = currentValue.indexOf('.');
      if (cursorPos <= dotIndex) {
        if (intPart.length >= 3) {
          event.preventDefault();
        }
      } else {
        if (decPart.length >= 2) {
          event.preventDefault();
        }
      }
    } else {
      if (currentValue.length >= 3 && char !== '.') {
        event.preventDefault();
      }
    }
  }

  onFfpKeypress(event: KeyboardEvent): void {
    const char = event.key;
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;

    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(char)) {
      return;
    }

    if (char === 'e' || char === 'E' || char === '+' || char === '-') {
      event.preventDefault();
      return;
    }

    if (char === '.') {
      if (currentValue.includes('.')) {
        event.preventDefault();
      }
      return;
    }

    if (char < '0' || char > '9') {
      event.preventDefault();
      return;
    }

    if (currentValue.includes('.')) {
      const [intPart, decPart] = currentValue.split('.');
      const cursorPos = input.selectionStart ?? currentValue.length;
      const dotIndex = currentValue.indexOf('.');
      if (cursorPos <= dotIndex) {
        if (intPart.length >= 4) {
          event.preventDefault();
        }
      } else {
        if (decPart.length >= 2) {
          event.preventDefault();
        }
      }
    } else {
      if (currentValue.length >= 4 && char !== '.') {
        event.preventDefault();
      }
    }
  }

  /**
   * Strip negative signs and decimal points from integer-only fields on input (handles paste/spinner).
   */
  onIntegerInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const control = this.chapterForm.get(controlName);
    if (!control) return;

    const sanitized = input.value.replace(/[^0-9]/g, '');
    if (sanitized !== input.value) {
      control.setValue(sanitized ? Number(sanitized) : null, { emitEvent: true });
      input.value = sanitized;
    }
  }

  /**
   * Prevent comma from being entered in ISBT Start Date field
   */
  preventComma(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    const char = String.fromCharCode(charCode);

    // Block comma character
    if (char === ',') {
      event.preventDefault();
    }
  }

  /**
   * Auto-convert ISBT Start Date to uppercase and clear errors when field is cleared.
   */
  onIsbtStartDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;
    const upperValue = currentValue.toUpperCase();
    const control = this.chapterForm.get('isbtStartDate');

    if (currentValue !== upperValue) {
      control?.setValue(upperValue, { emitEvent: false });
      input.value = upperValue;
    }

    if (control && !control.value) {
      // Clear errors when field is empty
      control.setErrors(null);
    }
  }

  /**
   * Strip formatting from phone/fax value, returning only the raw number digits.
   */
  stripPhoneFormatting(value: string | null): string {
    if (!value) return '';
    return this.extractRawDigits(value);
  }

  loadChapterForEdit(chapterId: string): void {
    this.Chapters.getChapterById(chapterId).subscribe({
      next: (chapter: Chapter) => {
        // Keep header info
        this.chapterName = chapter.chapterName;
        this.lastUpdatedAt = chapter.LastModifiedDate;

        // Patch form values
        this.chapterForm.patchValue({
          ...chapter,

          // Convert ISO → UI format (DD-MMM-YYYY, HH:mm)
          isbtStartDate: chapter.isbtStartDate
            ? moment(chapter.isbtStartDate).format("DD-MMM-YYYY, HH:mm")
            : null,

          effectiveDate: chapter.effectiveDate
            ? new Date(chapter.effectiveDate)
            : null,

          terminationDate: chapter.terminationDate
            ? new Date(chapter.terminationDate)
            : null,
        });

        // Format phone/fax fields for display
        ['phoneNumber', 'intlPhoneNumber', 'fax', 'intlFax'].forEach(field => {
          const val = this.chapterForm.get(field)?.value;
          if (val) {
            this.chapterForm.get(field)?.setValue(this.formatPhoneNumber(val), { emitEvent: false });
          }
        });

        this.chapterForm.get("chapterId")?.disable();
        DateFieldValidationUtility.setupEditModeValidators(this.chapterForm);

        // Set up zip code validation after loading data
        this.setupStateValidation();
        this.setupZipCodeValidation();
        this.setupTimeZoneValidation();
      },

      error: (error) => {
      },
    });
  }

  /* ======================================================
     NAVIGATION
  ====================================================== */

  scrollTo(sectionId: string): void {
    this.activeSection = sectionId;
    const section = document.getElementById(sectionId);
    const scrollEl = this.scrollContainer?.getElementRef().nativeElement;
    if (section && scrollEl) {
      const offsetTop = section.offsetTop - scrollEl.offsetTop - 16;
      scrollEl.scrollTo({ top: offsetTop, behavior: 'smooth' });
      setTimeout(() => {
        const focusable = section.querySelector<HTMLElement>(
          'input:not([type="hidden"]), mat-select, textarea, [matInput]'
        );
        focusable?.focus();
      }, 400);
    }
  }

  /* ======================================================
     FORM SETUP
  ====================================================== */

  /**
   * Custom validator: ALT Level must not be greater than Super ALT Level
   */
  altLevelValidator = (group: AbstractControl): ValidationErrors | null => {
    const altLevelControl = group.get('altLevel');
    const supAltLevelControl = group.get('supAltLevel');

    if (!altLevelControl || !supAltLevelControl) {
      return null;
    }

    const altLevelValue = altLevelControl.value;
    const supAltLevelValue = supAltLevelControl.value;

    // Skip validation if either field is empty, null, or undefined
    if (altLevelValue === null || altLevelValue === undefined || altLevelValue === '' ||
        supAltLevelValue === null || supAltLevelValue === undefined || supAltLevelValue === '') {
      // Clear any existing comparison errors
      const altErrors = altLevelControl.errors;

      const supClearErrors = supAltLevelControl.errors;
      if (supClearErrors?.['altLevelTooHigh']) {
        delete supClearErrors['altLevelTooHigh'];
        supAltLevelControl.setErrors(Object.keys(supClearErrors).length > 0 ? supClearErrors : null);
      }

      return null;
    }

    const altLevel = Number(altLevelValue);
    const supAltLevel = Number(supAltLevelValue);

    // Check if ALT Level is greater than Super ALT Level
    if (!isNaN(altLevel) && !isNaN(supAltLevel) && altLevel > supAltLevel) {
      // Set error only on SUP ALT Level control (matches FMB: error 2400 on ALT_SE_LEVEL only)
      supAltLevelControl.setErrors({ ...supAltLevelControl.errors, altLevelTooHigh: true });
      return { altLevelTooHigh: true };
    } else {
      // Clear the comparison error if it exists
      const supErrors = supAltLevelControl.errors;

      if (supErrors?.['altLevelTooHigh']) {
        delete supErrors['altLevelTooHigh'];
        supAltLevelControl.setErrors(Object.keys(supErrors).length > 0 ? supErrors : null);
      }
    }

    return null;
  }

  private buildForm(): void {
    this.chapterForm = this.fb.group(
      {
        chapterId: [
          null,
          [Validators.required, Validators.maxLength(3), noWhitespaceOnlyValidator(), alphaNumericValidator],
        ],
        chapterName: [
          null,
          [
            Validators.required,
            Validators.maxLength(50),
            noWhitespaceOnlyValidator(),
          ],
        ],
        shortName: [
          null,
          [
            Validators.required,
            Validators.maxLength(10),
            noWhitespaceOnlyValidator(),
          ],
        ],
        printHeader: [null, [Validators.required, Validators.maxLength(50), noWhitespaceOnlyValidator()]],
        isbtStartDate: [
          null,
          [isbtDateTimeFormatValidator],
        ],
        taxId: [null, [Validators.maxLength(9), noWhitespaceOnlyValidator()]],

        unitScheme: [null], // Hidden field - not required
        sequenceCheckIn: [null, Validators.required],
        qcForLabel: [null, Validators.required],
        nursingAudit: [null, Validators.required],
        testingChapter: [null, Validators.required],
        donorCueScanned: [null, Validators.required],

        effectiveDate: [null, [Validators.required]],
        terminationDate: [null],

        isInternational: [false],
        addressLine1: [null, [Validators.required, Validators.maxLength(50), noWhitespaceOnlyValidator()]],
        addressLine2: [null, [Validators.maxLength(50)]],
        addressLine3: [null, [Validators.maxLength(50)]],
        city: [
          null,
          [
            Validators.required,
            Validators.maxLength(75),
            noWhitespaceOnlyValidator(),
            cityNameValidator,
          ],
        ],
        state: [null],
        zipCode: [
          null,
          [
            Validators.required,
            Validators.maxLength(9),
            noWhitespaceOnlyValidator(),
          ],
        ],
        country: [
          null,
          [Validators.required],
        ],

        phoneNumber: [null, [this.phoneDigitsValidator()]],
        intlPhoneNumber: [null, [this.intlPhoneDigitsValidator()]],
        fax: [null, [this.phoneDigitsValidator()]],
        intlFax: [null, [this.intlPhoneDigitsValidator()]],

        maxBleedTime: [
          null,
          [Validators.required, Validators.min(0), Validators.max(60), positiveIntegerValidator()],
        ],
        slowBleedTime: [
          null,
          [Validators.required, Validators.min(0), Validators.max(60), positiveIntegerValidator()],
        ],
        timeZone: [],
        ffpFreezeDuration: [
          null,
          [
            cryoTimeLimitValidator,
          ],
        ],
        aboBatchSize: [null, [Validators.max(999999), positiveIntegerValidator()]],
        sampleAge: [
          null,
          [Validators.required, Validators.min(0), Validators.max(9999), positiveIntegerValidator()],
        ],
        companyNumber: [
          null,
          [
            Validators.required,
            Validators.min(1),
            Validators.max(99),
            numericValidator,
          ],
        ],
        cryoTimeLimit: [
          null,
          [
            cryoTimeLimitValidator,
          ],
        ],
        altLevel: [
          null,
          [
            Validators.required,
            Validators.min(0),
            Validators.max(999.99),
            Validators.pattern(/^\d{1,3}(\.\d{1,2})?$/),
          ],
        ],
        supAltLevel: [
          null,
          [
            Validators.required,
            Validators.min(0),
            Validators.max(999.99),
            Validators.pattern(/^\d{1,3}(\.\d{1,2})?$/),
          ],
        ],

        batchSequence: [
          null,
          [Validators.required, Validators.min(0), Validators.max(9999999), positiveIntegerValidator()],
        ],
        cryoSequence: [
          null,
          [Validators.required, Validators.min(0), Validators.max(9999999), positiveIntegerValidator()],
        ],
        testBatchSequence: [
          null,
          [Validators.required, Validators.min(0), Validators.max(9999999), positiveIntegerValidator()],
        ],
        testKitSequence: [
          null,
          [Validators.required, Validators.min(0), Validators.max(9999999), positiveIntegerValidator()],
        ],
        sterileDocSequence: [
          null,
          [Validators.required, Validators.min(0), Validators.max(9999999), positiveIntegerValidator()],
        ],
        workNoSequence: [
          null,
          [Validators.required, Validators.min(0), Validators.max(9999999), positiveIntegerValidator()],
        ],
        driveSequence: [
          null,
          [Validators.required, Validators.min(0), Validators.max(9999999), positiveIntegerValidator()],
        ],
        groupSiteSequence: [
          null,
          [Validators.required, Validators.min(0), Validators.max(9999999), positiveIntegerValidator()],
        ],
        poolSequence: [
          null,
          [Validators.required, Validators.min(0), Validators.max(9999999), positiveIntegerValidator()],
        ],
        controlNumber: [
          null,
          [Validators.min(0), Validators.max(99999), positiveIntegerValidator()],
        ],

        tolerance: [null, toleranceValidator],

        labelReview: [null],
        acceptExpiredReturns: [null],
        pltHlaMatchReturn: [null],
        rbcReducedPriceDays: [null, [Validators.min(0), Validators.max(99)]],
        pltReturnableHrs: [
          null,
          [Validators.required, Validators.min(0), Validators.max(99)],
        ],
        rbcReturnableDays: [
          null,
          [Validators.required, Validators.min(0), Validators.max(99)],
        ],
        pltDesignatedReturn: [null],
        rbcDesignatedReturn: [null],
        orderLifetime: [null, [Validators.min(0), Validators.max(99999), positiveIntegerValidator()]],
        maxDiscount: [null, [Validators.min(0), Validators.max(999.99)]],
        rarityPercent: [
          null,
          [
            Validators.required,
            Validators.min(0),
            Validators.max(100),
            Validators.pattern(/^\d{1,2}(\.\d{1,4})?$/),
          ],
        ],
        veryRarePercent: [
          null,
          [
            Validators.min(0),
            Validators.max(100),
            Validators.pattern(/^\d{1,2}(\.\d{1,4})?$/),
          ],
        ],
        quarantineAlertTime: [null, [Validators.min(0), Validators.max(99), positiveIntegerValidator()]],
        maxInventoryCheckIn: [null, [Validators.required, Validators.min(0), Validators.max(99), positiveIntegerValidator()]],

        ffFlag: [false],
        autoCross: [false],
        directedCross: [false],
      },
      { validators: [this.altLevelValidator, DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')] }
    );

    // Re-validate when either ALT field changes
    this.chapterForm.get('altLevel')?.valueChanges.subscribe(() => {
      this.chapterForm.updateValueAndValidity({ onlySelf: false });
    });
    this.chapterForm.get('supAltLevel')?.valueChanges.subscribe(() => {
      this.chapterForm.updateValueAndValidity({ onlySelf: false });
    });
  }

  /* ======================================================
     CONDITIONAL VALIDATION
  ====================================================== */

  private setupStateValidation(): void {
    const isIntl = this.chapterForm.get("isInternational")?.value;
    this.toggleStateValidation(isIntl);
    this.toggleCountryForDomestic(isIntl);
    this.chapterForm
      .get("isInternational")
      ?.valueChanges.subscribe((val) => {
        this.toggleStateValidation(val);
        this.toggleZipCodeValidation(val);
        this.toggleCountryForDomestic(val);
      });
  }

  private toggleCountryForDomestic(isInternational: boolean): void {
    const countryCtrl = this.chapterForm.get("country");
    if (!countryCtrl) return;

    if (!isInternational && this.institutionCountry && countryCtrl.value) {
      countryCtrl.setValue(this.institutionCountry, { emitEvent: false });
    }
  }

  private toggleStateValidation(isInternational: boolean): void {
    const stateCtrl = this.chapterForm.get("state");
    if (!stateCtrl) return;

    isInternational
      ? stateCtrl.clearValidators()
      : stateCtrl.setValidators([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(2),
      ]);

    stateCtrl.updateValueAndValidity();
  }

  private setupZipCodeValidation(): void {
    this.toggleZipCodeValidation(this.chapterForm.get("isInternational")?.value);
  }

  private toggleZipCodeValidation(_isInternational?: boolean): void {
    const zipCodeCtrl = this.chapterForm.get("zipCode");
    if (!zipCodeCtrl) return;

    zipCodeCtrl.setValidators([
      Validators.required,
      Validators.maxLength(9),
      noWhitespaceOnlyValidator(),
    ]);

    const currentValue = zipCodeCtrl.value;
    if (currentValue && currentValue.length > 9) {
      zipCodeCtrl.setValue(currentValue.substring(0, 9));
    }

    zipCodeCtrl.updateValueAndValidity();
  }

  private setupTimeZoneValidation(): void {
    const ctrl = this.chapterForm.get("timeZone");
    if (!ctrl) return;

    this.isTimeZoneEnabled
      ? ctrl.setValidators([Validators.required])
      : ctrl.clearValidators();

    ctrl.updateValueAndValidity();
  }

  private setupModeValidators(): void {
    if (this.isEditMode) {
      DateFieldValidationUtility.setupEditModeValidators(this.chapterForm);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.chapterForm);
    }
  }

  private setupDateValidationListeners(): void {
    this.chapterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.chapterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  /* ======================================================
     ACTIONS
  ====================================================== */

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.chapterForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.chapterForm.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.chapterForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.chapterForm.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.chapterForm.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.chapterForm.get('terminationDate'), this.isEditMode
    );
  }

  private hasDateValidationError(): boolean {
    return this.chapterForm.hasError('dateRangeInvalid') || false;
  }

  private formatDateToDDMMMYYYY(date: any): string | null {
    if (!date) return null;
    const m = moment.isMoment(date) ? date : moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : null;
  }

  onCancel(): void {
    this.router.navigate(['/application-administration/common-validation/view-institution']);
  }

  onClear(): void {
    this.chapterForm.reset();
    this.chapterForm.patchValue({ isInternational: false, country: this.institutionCountry || null });
  }

  onUpdate(): void {
    this.chapterForm.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.chapterForm, 'terminationDate');

    if (this.chapterForm.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.chapterForm.get('terminationDate')?.markAsTouched();
      return;
    }

    // 1️⃣ ChapterId must come from route / edit context
    const chapterId = this.chapterForm.get("chapterId")?.value;

    if (!chapterId) {
      this.snackBar.open('Chapter ID is missing', 'DISMISS', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    const payload = this.buildPayload();

    // 4️⃣ API CALL
    this.Chapters.updateChapter(chapterId, payload).subscribe({
      next: () => {
        this.snackBar.open(
          `Chapter “${payload.chapterName}” is successfully updated`,
          'DISMISS',
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
          }
        );

        if (chapterId === this.headerService.chapterId() && payload.timeZone) {
          this.headerService.chapterTimeZone.set(payload.timeZone);
        }

        // Navigate back to view institution page after successful save
        setTimeout(() => {
          this.router.navigate(['/application-administration/common-validation/view-institution']);
        }, 500);
      },
      error: (error) => {

        // Extract error message and error code from backend response
        let errorMessage = error.error?.errorResponse?.error ||
                          error.error?.message ||
                          'Failed to update chapter';
        const errorCode = error.error?.errorCode || error.error?.errorResponse?.errorCode;

        // Append error code if available
        if (errorCode) {
          errorMessage = `Error: ${errorCode}: ${errorMessage}`;
        }

        this.snackBar.open(
          errorMessage,
          'DISMISS',
          {
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          }
        );
      },
    });
  }

  private buildPayload() {
    const formValue = this.chapterForm.getRawValue();
    return {
      ...formValue,
      isbtStartDate: formValue.isbtStartDate
        ? toIsoFromDDMMYYYY(formValue.isbtStartDate)
        : null,
      effectiveDate: this.formatDateToDDMMMYYYY(formValue.effectiveDate),
      terminationDate: this.formatDateToDDMMMYYYY(formValue.terminationDate),
      phoneNumber: this.stripPhoneFormatting(formValue.phoneNumber),
      intlPhoneNumber: this.stripPhoneFormatting(formValue.intlPhoneNumber),
      fax: this.stripPhoneFormatting(formValue.fax),
      intlFax: this.stripPhoneFormatting(formValue.intlFax),
      InstitutionID: this.InstitutionID,
    };
  }

  onCreate(): void {
    this.chapterForm.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.chapterForm, 'terminationDate');

    if (this.chapterForm.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.chapterForm.get('terminationDate')?.markAsTouched();
      return;
    }

    const payload = this.buildPayload();

    this.Chapters.createChapter(payload).subscribe({
      next: () => {
        const chapterName = payload.chapterName;

        this.snackBar.open(
          `Chapter “${chapterName}” is successfully created`,
          'DISMISS',
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
          }
        );

        // Navigate back to view institution page after successful save
        setTimeout(() => {
          this.router.navigate(['/application-administration/common-validation/view-institution']);
        }, 500);
      },

      error: (error) => {

        // Extract error message and error code from backend response
        let errorMessage = error.error?.errorResponse?.error ||
                          error.error?.message ||
                          'Failed to create chapter';
        const errorCode = error.error?.errorCode || error.error?.errorResponse?.errorCode;

        // Append error code if available
        if (errorCode) {
          errorMessage = `Error: ${errorCode}: ${errorMessage}`;
        }

        // Check for duplicate chapter ID error and mark field
        if (error.status === 409 || errorCode === '9753' || errorCode === 9753) {
          this.chapterForm.get('chapterId')?.setErrors({ duplicate: true });
        }

        this.snackBar.open(
          errorMessage,
          'DISMISS',
          {
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          }
        );
      },
    });
  }

  onCreateAndAddAnother(): void {
    this.chapterForm.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.chapterForm, 'terminationDate');

    if (this.chapterForm.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.chapterForm.get('terminationDate')?.markAsTouched();
      return;
    }

    const payload = this.buildPayload();

    this.Chapters.createChapter(payload).subscribe({
      next: () => {
        const chapterName = payload.chapterName;

        this.snackBar.open(
          `Chapter "${chapterName}" is successfully created`,
          'DISMISS',
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
          }
        );

        // Reset form for adding another chapter
        this.chapterForm.reset();
        this.chapterForm.patchValue({
          isInternational: false,
          country: this.institutionCountry || null,
          sequenceCheckIn: false,
          qcForLabel: false,
          nursingAudit: false,
          testingChapter: false,
          donorCueScanned: false,
          labelReview: false,
          acceptExpiredReturns: false,
          pltHlaMatchReturn: false,
          pltDesignatedReturn: false,
          rbcDesignatedReturn: false,
          ffFlag: false,
          autoCross: false,
          directedCross: false,
        });
      },

      error: (error) => {

        // Extract error message and error code from backend response
        let errorMessage = error.error?.errorResponse?.error ||
                          error.error?.message ||
                          'Failed to create chapter';
        const errorCode = error.error?.errorCode || error.error?.errorResponse?.errorCode;

        // Append error code if available
        if (errorCode) {
          errorMessage = `Error: ${errorCode}: ${errorMessage}`;
        }

        // Check for duplicate chapter ID error and mark field
        if (error.status === 409 || errorCode === '9753' || errorCode === 9753) {
          this.chapterForm.get('chapterId')?.setErrors({ duplicate: true });
        }

        this.snackBar.open(
          errorMessage,
          'DISMISS',
          {
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          }
        );
      },
    });
  }
}
