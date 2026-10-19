import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  effect,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment, { Moment } from 'moment';

import {
  DD_MON_YYYY_FORMATS,
  UppercaseMomentDateAdapter,
} from '@shared/date/date-formats';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import { AbbreviatedQuestionnaireSetupService } from './abbreviated-questionnaire-setup.service';
import {
  AbbreviatedQuestionnaireSetup,
  DonationTypeLookup,
  UpdateAbbreviatedQuestionnaireSetupPayload,
} from './abbreviated-questionnaire-setup.interface';

const FREQ_TYPE_OPTIONS = [
  { code: 'D', label: 'Days' },
  { code: 'W', label: 'Weeks' },
  { code: 'M', label: 'Months' },
  { code: 'Y', label: 'Years' },
];

@Component({
  selector: 'app-abbreviated-questionnaire-setup',
  standalone: true,
  providers: [
    {
      provide: MAT_DATE_FORMATS,
      useValue: DD_MON_YYYY_FORMATS,
    },
    {
      provide: DateAdapter,
      useClass: UppercaseMomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './abbreviated-questionnaire-setup.html',
  styleUrls: ['./abbreviated-questionnaire-setup.scss'],
})
export class AbbreviatedQuestionnaireSetupComponent
  implements OnInit, OnDestroy
{
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private setupService = inject(AbbreviatedQuestionnaireSetupService);
  private headerService = inject(HeaderService);
  private pageHeaderService = inject(PageHeaderService);

  private destroy$ = new Subject<void>();
  private skipAutoSave = false;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
    ],
    title: '',
    subtitle: '',
  };

  readonly freqTypeOptions = FREQ_TYPE_OPTIONS;

  isLoading = signal(true);
  isSaving = signal(false);
  donationTypes = signal<DonationTypeLookup[]>([]);
  selectedDonationTypes = signal<string[]>([]);

  // Donation Type search
  readonly donationTypeSearchControl = new FormControl<string>('', { nonNullable: true });
  private readonly donationTypeSearch = signal('');
  readonly filteredDonationTypes = computed(() => {
    const search = this.donationTypeSearch().toLowerCase();
    const options = this.donationTypes();
    if (!search) return options;
    return options.filter(opt =>
      opt.donationType.toLowerCase().includes(search) ||
      opt.description.toLowerCase().includes(search)
    );
  });
  readonly visibleDonationTypeCodes = computed(() =>
    new Set(this.filteredDonationTypes().map(t => t.donationType))
  );
  private originalEffectiveDate: string | null = null;

  minTerminationDate: Moment | null = null;

  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());
  minDonationsErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getMinDonationsError());

  form!: FormGroup;

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  private getChapterToday(): Moment {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  constructor() {
    // Populate page header from menu item
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });

    // Subscribe to donation type search changes
    this.donationTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.donationTypeSearch.set(value));

    // Reload data when chapter changes
    effect(() => {
      const chapterId = this.headerService.chapterId();
      if (chapterId) {
        this.loadData();
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      noOfDonations: [
        '',
        [Validators.required, Validators.pattern(/^[1-9][0-9]{0,2}$/)],
      ],
      minDonations: [
        '',
        [Validators.required, Validators.pattern(/^[1-9][0-9]{0,2}$/)],
      ],
      freqBetweenDonations: [
        '',
        [Validators.required, Validators.pattern(/^[1-9][0-9]{0,2}$/)],
      ],
      freqType: ['', Validators.required],
      deferralPeriod: [
        '',
        [Validators.required, Validators.pattern(/^[1-9][0-9]{0,2}$/)],
      ],
      donationType: [[] as string[], Validators.required],
      effectiveDate: [null, Validators.required],
      terminationDate: [null, [
        DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset),
      ]],
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate'),
        AbbreviatedQuestionnaireSetupComponent.minDonationsLessThanTotalValidator,
      ],
    });

    this.minTerminationDate = this.getChapterToday();
  }

  onSave(): void {
    this.save();
  }

  onClearAll(): void {
    this.skipAutoSave = true;
    this.form.get('effectiveDate')?.enable();
    this.form.reset({
      noOfDonations: '',
      minDonations: '',
      freqBetweenDonations: '',
      freqType: '',
      deferralPeriod: '',
      donationType: [],
      effectiveDate: null,
      terminationDate: null,
    });
    this.selectedDonationTypes.set([]);
    this.originalEffectiveDate = null;
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.skipAutoSave = false;
  }

  private save(): void {
    if (this.isSaving() || this.form.invalid) return;

    this.isSaving.set(true);

    const formValue = this.form.getRawValue();

    const effectiveDateControl = this.form.get('effectiveDate');
    const effectiveDateForPayload = effectiveDateControl?.disabled
      ? this.originalEffectiveDate
      : (formValue.effectiveDate
          ? DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate)
          : null);

    const payload: UpdateAbbreviatedQuestionnaireSetupPayload = {
      noOfDonations: formValue.noOfDonations,
      minDonations: formValue.minDonations,
      freqBetweenDonations: formValue.freqBetweenDonations,
      freqType: formValue.freqType,
      deferralPeriod: formValue.deferralPeriod,
      donationType: formValue.donationType.join(','),
      effectiveDate: effectiveDateForPayload,
      terminationDate: formValue.terminationDate
        ? DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
        : null,
      originalEffectiveDate: this.originalEffectiveDate,
    };

    this.setupService
      .updateSetup(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving.set(false);
          this.originalEffectiveDate = payload.effectiveDate;
          this.form.markAsPristine();
          this.snackBar.open(
            response.message || 'Setup updated successfully',
            'DISMISS',
            {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar'],
            }
          );
        },
        error: (err) => {
          this.isSaving.set(false);
          this.showError(err, 'Failed to save setup');
        },
      });
  }

  private loadData(): void {
    this.isLoading.set(true);

    this.setupService
      .getSetup()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.populateForm(data);
          this.loadDonationTypes();
        },
        error: (err) => {
          this.showError(err, 'Failed to load setup data');
          this.loadDonationTypes();
        },
      });
  }

  private loadDonationTypes(): void {
    this.setupService
      .getDonationTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.donationTypes.set(types);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.showError(err, 'Failed to load donation types');
          this.isLoading.set(false);
        },
      });
  }

  private populateForm(data: AbbreviatedQuestionnaireSetup): void {
    this.skipAutoSave = true;
    this.originalEffectiveDate = data.effectiveDate;

    const donationTypesList = data.donationType
      ? data.donationType
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t)
      : [];

    this.selectedDonationTypes.set(donationTypesList);

    this.form.patchValue({
      noOfDonations: data.noOfDonations || '',
      minDonations: data.minDonations || '',
      freqBetweenDonations: data.freqBetweenDonations || '',
      freqType: data.freqType || '',
      deferralPeriod: data.deferralPeriod || '',
      donationType: donationTypesList,
      effectiveDate: data.effectiveDate ? moment(data.effectiveDate) : null,
      terminationDate: data.terminationDate
        ? moment(data.terminationDate)
        : null,
    });

    // If effective date is in the past (chapter date), disable it
    const chapterToday = this.getChapterToday();
    if (data.effectiveDate && moment(data.effectiveDate).isBefore(chapterToday)) {
      this.form.get('effectiveDate')?.disable();
    }

    // Update min termination date based on effective date
    this.updateMinTerminationDate();

    // Re-apply termination date validators with current chapter offset
    const termControl = this.form.get('terminationDate');
    if (termControl) {
      termControl.clearValidators();
      termControl.setValidators([
        DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset),
      ]);
      termControl.updateValueAndValidity();
    }

    this.form.markAsPristine();
    this.skipAutoSave = false;
  }

  private updateMinTerminationDate(): void {
    const effDateValue = this.form.get('effectiveDate')?.value;
    const chapterToday = this.getChapterToday();

    if (effDateValue && moment.isMoment(effDateValue) && effDateValue.isValid()) {
      const effStr = effDateValue.format('YYYY-MM-DD');
      this.minTerminationDate = effStr > chapterToday.format('YYYY-MM-DD')
        ? effDateValue.clone().startOf('day')
        : chapterToday;
    } else {
      this.minTerminationDate = chapterToday;
    }
  }

  getFreqTypeLabel(code: string): string {
    return (
      FREQ_TYPE_OPTIONS.find((o) => o.code === code)?.label || code
    );
  }

  removeDonationType(type: string): void {
    const current = this.selectedDonationTypes();
    const updated = current.filter((t) => t !== type);
    this.selectedDonationTypes.set(updated);
    this.form.get('donationType')?.setValue(updated);
    this.form.get('donationType')?.markAsDirty();
  }

  onDonationTypeChange(selected: string[]): void {
    this.selectedDonationTypes.set(selected);
    this.form.get('donationType')?.markAsDirty();
  }

  preventNonNumericInput(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ];
    if (allowedKeys.includes(event.key)) return;

    if (event.key < '0' || event.key > '9') {
      event.preventDefault();
      return;
    }

    const input = event.target as HTMLInputElement;

    // Prevent leading zero: block '0' when it would be the first character
    if (event.key === '0' && (input.selectionStart ?? 0) === 0) {
      event.preventDefault();
      return;
    }

    if (
      input.value.length >= 3 &&
      input.selectionStart === input.selectionEnd
    ) {
      event.preventDefault();
    }
  }

  preventNonNumericPaste(event: ClipboardEvent): void {
    const pastedData = event.clipboardData?.getData('text') || '';
    if (!/^[1-9][0-9]{0,2}$/.test(pastedData)) {
      event.preventDefault();
    }
  }

  getFieldError(fieldName: string, label: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return `${label} is required`;
    if (control.hasError('pattern'))
      return `${label} must be a number between 1 and 999`;
    return '';
  }

  private static minDonationsLessThanTotalValidator(group: AbstractControl): ValidationErrors | null {
    const minDonations = group.get('minDonations')?.value;
    const noOfDonations = group.get('noOfDonations')?.value;
    if (!minDonations || !noOfDonations) return null;
    const min = parseInt(minDonations, 10);
    const total = parseInt(noOfDonations, 10);
    if (isNaN(min) || isNaN(total)) return null;
    return min > total ? { minDonationsExceedsTotal: true } : null;
  }

  getMinDonationsError(): string {
    const control = this.form.get('minDonations');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Min Donations is required';
    if (control.hasError('pattern')) return 'Min Donations must be a number between 1 and 999';
    if (this.form.hasError('minDonationsExceedsTotal')) return 'Min Donations must be less than No. of Donations';
    return '';
  }

  getTerminationDateError(): string {
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'),
      'Termination Date',
      'Effective Date',
      this.form.errors
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), true
    );
  }

  private showError(err: any, fallback: string): void {
    let message = fallback;
    if (err?.error?.errors && Array.isArray(err.error.errors)) {
      message = err.error.errors.join(', ');
    } else if (err?.error?.message) {
      message = err.error.message;
    } else if (err?.message) {
      message = err.message;
    }
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }
}
