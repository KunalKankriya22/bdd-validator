import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import moment from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { NewZipCodeService } from './new-zip-code.service';
import {
  ZipCodeStateLookup,
  ZipCodeCountyLookup,
  ZipCodeCityLookup,
  NewZipCodeDialogResult,
  CreateZipCodeRequest,
  UpdateZipCodeRequest,
  ZipCodeRecord,
} from './new-zip-code.model';

@Component({
  selector: 'app-new-zip-code',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './new-zip-code.html',
  styleUrls: ['./new-zip-code.scss'],
})
export class NewZipCodeDialog implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<NewZipCodeDialog>);
  readonly dialogData: { title?: string; record?: ZipCodeRecord } | null = inject(MAT_DIALOG_DATA, { optional: true });

  get dialogTitle(): string {
    return this.dialogData?.title ?? 'New Zip Code';
  }

  get isEditMode(): boolean {
    return !!this.dialogData?.record;
  }
  private readonly newZipCodeService = inject(NewZipCodeService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  form!: FormGroup;
  states: ZipCodeStateLookup[] = [];
  counties: ZipCodeCountyLookup[] = [];
  cities: ZipCodeCityLookup[] = [];
  filteredStates: ZipCodeStateLookup[] = [];
  filteredCounties: ZipCodeCountyLookup[] = [];
  filteredCities: ZipCodeCityLookup[] = [];
  saving = false;
  loadingStates = false;
  loadingCounties = false;
  loadingCities = false;
  isAddingNewCity = false;
  isAddingNewCounty = false;

  stateSearchCtrl = new FormControl('');
  countySearchCtrl = new FormControl('');
  citySearchCtrl = new FormControl('');

  elementId(field: string): string {
    return `new-zip-code-${field}`;
  }

  minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  ngOnInit(): void {
    this.buildForm();
    this.loadStates();
    if (this.isEditMode) {
      this.populateFormForEdit(this.dialogData!.record!);
    } else {
      this.listenStateChange();
    }
    this.listenSearchChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      state: [null, Validators.required],
      city: [null, Validators.required],
      zipCode: ['', [Validators.required, Validators.maxLength(5), Validators.pattern(/^\d+$/)]],
      county: [null, Validators.required],
      effectiveDate: [null, Validators.required],
      terminationDate: [null],
      commonlyUsedFlag: [''],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')],
    });

    DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());

    this.form.get('effectiveDate')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  private listenSearchChanges(): void {
    this.stateSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term || '').toLowerCase();
        this.filteredStates = t
          ? this.states.filter(s => s.code.toLowerCase().includes(t) || s.description.toLowerCase().includes(t))
          : [...this.states];
      });

    this.countySearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term || '').toLowerCase();
        this.filteredCounties = t
          ? this.counties.filter(c => c.code.toLowerCase().includes(t) || c.description.toLowerCase().includes(t))
          : [...this.counties];
      });

    this.citySearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term || '').toLowerCase();
        this.filteredCities = t
          ? this.cities.filter(c => c.code.toLowerCase().includes(t) || c.description.toLowerCase().includes(t))
          : [...this.cities];
      });
  }

  onStateDropdownOpened(opened: boolean): void {
    if (opened) {
      this.stateSearchCtrl.setValue('');
      this.filteredStates = [...this.states];
    }
  }

  onCountyDropdownOpened(opened: boolean): void {
    if (opened) {
      this.countySearchCtrl.setValue('');
      this.filteredCounties = [...this.counties];
    }
  }

  onCityDropdownOpened(opened: boolean): void {
    if (opened) {
      this.citySearchCtrl.setValue('');
      this.filteredCities = [...this.cities];
    }
  }

  toggleAddNewCity(): void {
    this.isAddingNewCity = !this.isAddingNewCity;
    this.form.get('city')!.setValue(null);
    this.form.get('city')!.markAsUntouched();
  }

  toggleAddNewCounty(): void {
    this.isAddingNewCounty = !this.isAddingNewCounty;
    this.form.get('county')!.setValue(null);
    this.form.get('county')!.markAsUntouched();
  }

  onUppercaseInput(controlName: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    if (input.value !== upper) {
      this.form.get(controlName)!.setValue(upper, { emitEvent: false });
    }
  }

  private loadStates(): void {
    this.loadingStates = true;
    this.newZipCodeService
      .getStates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (states) => {
          this.states = states;
          this.filteredStates = [...states];
          this.loadingStates = false;
        },
        error: () => {
          this.snackbarService.showError('Failed to load states.');
          this.loadingStates = false;
        },
      });
  }

  private listenStateChange(): void {
    this.form
      .get('state')!
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((stateCode: string | null) => {
        this.form.patchValue({ county: null, city: null });
        this.counties = [];
        this.cities = [];
        this.isAddingNewCity = false;
        this.isAddingNewCounty = false;
        if (stateCode) {
          this.loadCounties(stateCode);
          this.loadCities(stateCode);
        }
      });
  }

  private populateFormForEdit(record: ZipCodeRecord): void {
    const stateCode = (record.state || '').trim();

    DateFieldValidationUtility.setupEditModeValidators(this.form);

    this.form.patchValue({
      state: stateCode || null,
      zipCode: (record.zip || '').trim(),
      effectiveDate: record.effectiveDate ? moment(record.effectiveDate) : null,
      terminationDate: record.terminationDate ? moment(record.terminationDate) : null,
      commonlyUsedFlag: record.commonlyUsedFlag || '',
    }, { emitEvent: false });

    if (stateCode) {
      forkJoin({
        cities: this.newZipCodeService.getCities(stateCode),
        counties: this.newZipCodeService.getCounties(stateCode),
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: ({ cities, counties }) => {
          this.cities = cities;
          this.filteredCities = [...cities];
          this.counties = counties;
          this.filteredCounties = [...counties];

          this.form.patchValue({
            city: (record.city || '').trim() || null,
            county: (record.county || '').trim() || null,
          }, { emitEvent: false });

          this.listenStateChange();
        },
        error: () => {
          this.snackbarService.showError('Failed to load cities or counties.');
          this.listenStateChange();
        },
      });
    } else {
      this.listenStateChange();
    }
  }

  private loadCounties(stateCode: string): void {
    this.loadingCounties = true;
    this.newZipCodeService
      .getCounties(stateCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (counties) => {
          this.counties = counties;
          this.filteredCounties = [...counties];
          this.loadingCounties = false;
        },
        error: () => {
          this.snackbarService.showError('Failed to load counties.');
          this.loadingCounties = false;
        },
      });
  }

  private loadCities(stateCode: string): void {
    this.loadingCities = true;
    this.newZipCodeService
      .getCities(stateCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cities) => {
          this.cities = cities;
          this.filteredCities = [...cities];
          this.loadingCities = false;
        },
        error: () => {
          this.snackbarService.showError('Failed to load cities.');
          this.loadingCities = false;
        },
      });
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: CreateZipCodeRequest = {
      state: raw.state,
      city: raw.city,
      zip: raw.zipCode.trim(),
      county: raw.county,
      effDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate),
      commonlyUsedFlag: raw.commonlyUsedFlag || null,
    };

    this.saving = true;

    const save$ = this.isEditMode && this.dialogData?.record?.uspsId
      ? this.newZipCodeService.updateZipCode(this.dialogData.record.uspsId, payload)
      : this.newZipCodeService.createZipCode(payload);

    save$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (zipCode) => {
          this.saving = false;
          this.snackbarService.showSuccess(`ZIP code '${zipCode.zip}' saved successfully.`);
          const result: NewZipCodeDialogResult = { action: 'save', zipCode };
          this.dialogRef.close(result);
        },
        error: (err: HttpErrorResponse) => {
          this.saving = false;
          const apiErr = err?.error;
          const errorCode = apiErr?.errorResponse?.errorCode?.trim() || apiErr?.errorCode?.trim();
          const errorMsg = apiErr?.errorResponse?.error || apiErr?.message || 'Failed to save zip code. Please try again.';
          const message = errorCode ? `Error ${errorCode}: ${errorMsg}` : errorMsg;
          this.snackbarService.showError(message);
        },
      });
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), false
    );
  }

  private hasDateValidationError(): boolean {
    return this.form.hasError('dateRangeInvalid') || false;
  }

  onZipInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '');
    if (input.value !== digitsOnly) {
      this.form.get('zipCode')!.setValue(digitsOnly, { emitEvent: false });
    }
  }

  onClose(): void {
    const result: NewZipCodeDialogResult = { action: 'close' };
    this.dialogRef.close(result);
  }

}
