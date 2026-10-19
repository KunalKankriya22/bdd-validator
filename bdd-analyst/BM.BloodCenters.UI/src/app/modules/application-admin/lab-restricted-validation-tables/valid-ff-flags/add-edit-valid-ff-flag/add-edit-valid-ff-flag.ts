import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE
} from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ValidFfFlagService } from '../services/valid-ff-flag.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { TIMEZONE_OFFSET_MAP, TIMEZONE_OFFSET_REGEX } from 'src/app/core/constants/timezone.constants';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, finalize, Observable } from 'rxjs';
import {
  ValidFfFlagModel,
  ValidFfFlagDto,
  UpdateValidFfFlagDto,
  ReturnResult,
  DropdownOption
} from '../models/valid-ff-flag.model';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { noWhitespaceOnlyValidator } from '@shared/validators/input.validators';

@Component({
  selector: 'app-add-edit-valid-ff-flag',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-valid-ff-flag.html',
  styleUrls: ['./add-edit-valid-ff-flag.scss']
})
export class AddEditValidFfFlag implements OnInit, OnChanges, OnDestroy {

  @Input() mode: 'add' | 'edit' | 'view' = 'add';
  @Input() data: ValidFfFlagModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<'add' | 'edit' | 'view'>();

  form: FormGroup;
  panelTitle = '';
  lastModified = '';
  isSaving = false;

  readonly selectPanelLoadingValue = '__PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__PANEL_EMPTY__';

  chapterIdOptions = signal<DropdownOption[]>([]);
  collectionFacilityIdOptions = signal<DropdownOption[]>([]);
  sourceTypeOptions = signal<DropdownOption[]>([]);
  isLoadingChapters = false;
  isLoadingFacilities = false;
  isLoadingSourceTypes = false;

  readonly chapterIdSearchControl = new FormControl('');
  readonly collectionFacilitySearchControl = new FormControl('');
  readonly sourceTypeSearchControl = new FormControl('');

  readonly chapterIdSearch = signal('');
  readonly collectionFacilitySearch = signal('');
  readonly sourceTypeSearch = signal('');

  readonly filteredChapterIds = computed(() => {
    const search = this.chapterIdSearch().toLowerCase();
    const options = this.chapterIdOptions();
    if (!search) return options;
    return options.filter(o => o.value.toLowerCase().includes(search) || o.key.toLowerCase().includes(search));
  });

  readonly filteredCollectionFacilityIds = computed(() => {
    const search = this.collectionFacilitySearch().toLowerCase();
    const options = this.collectionFacilityIdOptions();
    if (!search) return options;
    return options.filter(o => o.value.toLowerCase().includes(search) || o.key.toLowerCase().includes(search));
  });

  readonly filteredSourceTypes = computed(() => {
    const search = this.sourceTypeSearch().toLowerCase();
    const options = this.sourceTypeOptions();
    if (!search) return options;
    return options.filter(o => o.value.toLowerCase().includes(search) || o.key.toLowerCase().includes(search));
  });

  minEffectiveDate = DateFieldValidationUtility.getMinDate();

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = this.chapterTimezoneService.getChapterLocalDate();

    if (checkDate.isBefore(today)) {
      return false;
    }

    const eff = this.form?.get('effectiveDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private originalChapterID: string | null = null;
  private originalCollectionFacilityId: string | null = null;
  private originalSourceType: string | null = null;
  private originalEffectiveDate: string | null = null;

  private destroy$ = new Subject<void>();
  private dropdownOptionsLoaded$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private validFfFlagService: ValidFfFlagService,
    private headerService: HeaderService,
    private chapterTimezoneService: ChapterTimezoneService,
    private snackbarService: SnackbarService
  ) {
    this.form = this.fb.group({
      chapterId: ['', Validators.required],
      collectionFacilityId: ['', Validators.required],
      sourceType: ['', Validators.required],
      ffFlagValue: ['', [Validators.required, Validators.maxLength(2), noWhitespaceOnlyValidator()]],
      effectiveDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator(this.headerService.chapterTimeZone())]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    this.chapterIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.chapterIdSearch.set(value || '');
      });

    this.collectionFacilitySearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.collectionFacilitySearch.set(value || '');
      });

    this.sourceTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.sourceTypeSearch.set(value || '');
      });
  }

  ngOnInit(): void {
    this.setupDateValidationListeners();
    this.setupChapterChangeListener();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      this.setupPanel();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.dropdownOptionsLoaded$.complete();
  }

  /* ---------------- PANEL SETUP ---------------- */

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add New ff Flag Value';
      this.lastModified = '';
      this.form.enable();
      this.form.reset();

      this.form.get('chapterId')?.setValidators(Validators.required);
      this.form.get('chapterId')?.updateValueAndValidity();
      this.form.get('collectionFacilityId')?.setValidators(Validators.required);
      this.form.get('collectionFacilityId')?.disable();
      this.form.get('sourceType')?.setValidators(Validators.required);
      this.form.get('sourceType')?.updateValueAndValidity();
      this.form.get('ffFlagValue')?.setValidators([Validators.required, Validators.maxLength(2), noWhitespaceOnlyValidator()]);
      this.form.get('ffFlagValue')?.updateValueAndValidity();

      this.loadChapters();
      this.loadSourceTypes();
      DateFieldValidationUtility.setupAddModeValidators(this.form);
    } else if (this.mode === 'edit' && this.data) {
      this.panelTitle = 'Edit ff Flag Value';
      this.lastModified = this.formatLastModified(this.data.modificationDate);
      this.populateForm();
      if (this.data.chapterID) {
        this.loadCollectionFacilities(this.data.chapterID);
      }
      this.loadSourceTypes();
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      const termCtrl = this.form.get('terminationDate');
      if (termCtrl) {
        termCtrl.addValidators(DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone()));
        termCtrl.updateValueAndValidity({ emitEvent: false });
      }
    } else if (this.mode === 'view' && this.data) {
      this.panelTitle = 'View ff Flag Value';
      this.lastModified = this.formatLastModified(this.data.modificationDate);
      this.populateFormForView();
    }
  }

  private populateFormForView(): void {
    if (!this.data) return;

    this.form.enable();

    const effectiveDate = this.data.effectiveDate ? moment(this.data.effectiveDate) : null;
    const terminationDate = this.data.terminationDate ? moment(this.data.terminationDate) : null;

    this.form.patchValue({
      chapterId: this.data.chapterID,
      collectionFacilityId: this.data.collectionFacilityId,
      sourceType: this.data.sourceType,
      ffFlagValue: this.data.ffFlagValue,
      effectiveDate,
      terminationDate
    });

    this.form.disable();
  }

  private populateForm(): void {
    if (!this.data) return;

    this.originalChapterID = this.data.chapterID || null;
    this.originalCollectionFacilityId = this.data.collectionFacilityId || null;
    this.originalSourceType = this.data.sourceType || null;
    this.originalEffectiveDate = this.data.effectiveDate || null;

    this.form.enable();

    this.form.get('chapterId')?.clearValidators();
    this.form.get('chapterId')?.updateValueAndValidity();

    const effectiveDate = this.data.effectiveDate ? moment(this.data.effectiveDate) : null;
    const terminationDate = this.data.terminationDate ? moment(this.data.terminationDate) : null;

    this.form.patchValue({
      chapterId: this.data.chapterID,
      collectionFacilityId: this.data.collectionFacilityId,
      sourceType: this.data.sourceType,
      ffFlagValue: this.data.ffFlagValue,
      effectiveDate,
      terminationDate
    });

    this.form.get('chapterId')?.disable();
  }

  /* ---------------- DATE VALIDATION ---------------- */

  private setupDateValidationListeners(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.form.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  get isFormValid(): boolean {
    if (this.mode === 'add') {
      return this.form?.valid;
    }
    if (!this.form?.dirty) {
      return false;
    }
    const collFac = this.form.get('collectionFacilityId');
    const srcType = this.form.get('sourceType');
    const ffFlag = this.form.get('ffFlagValue');
    // Dropdowns use touched && invalid (not error-getter methods) intentionally:
    // these fields have no dedicated error-getter and are simple required checks.
    // Date fields use error-getter methods because they have complex cross-field
    // and format validation that must respect the touched/dirty guard internally.
    const hasVisibleErrors =
      !!(collFac?.touched && collFac?.invalid) ||
      !!(srcType?.touched && srcType?.invalid) ||
      !!(ffFlag?.touched && ffFlag?.invalid) ||
      this.getEffectiveDateError() !== '' ||
      this.getTerminationDateError() !== '';
    return !hasVisibleErrors;
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

  onFfFlagValueInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const transformed = input.value.replace(/^\s+/, '').toUpperCase();
    if (input.value !== transformed) {
      input.value = transformed;
      this.form.get('ffFlagValue')?.setValue(transformed, { emitEvent: false });
    }
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
  }

  /* ---------------- LOAD DROPDOWNS ---------------- */

  private loadChapters(): void {
    this.isLoadingChapters = true;

    this.validFfFlagService.getAddDropdownChapters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.chapterIdOptions.set(res.data ?? []);
          this.isLoadingChapters = false;
          this.dropdownOptionsLoaded$.next();
        },
        error: () => {
          this.chapterIdOptions.set([]);
          this.isLoadingChapters = false;
          this.dropdownOptionsLoaded$.next();
        }
      });
  }

  private loadCollectionFacilities(chapterId: string): void {
    this.isLoadingFacilities = true;

    this.validFfFlagService.getAddDropdownCollectionFacilities(chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.collectionFacilityIdOptions.set(res.data ?? []);
          this.isLoadingFacilities = false;
        },
        error: () => {
          this.collectionFacilityIdOptions.set([]);
          this.isLoadingFacilities = false;
        }
      });
  }

  private loadSourceTypes(): void {
    this.isLoadingSourceTypes = true;

    this.validFfFlagService.getAddDropdownSourceTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.sourceTypeOptions.set(res.data ?? []);
          this.isLoadingSourceTypes = false;
        },
        error: () => {
          this.sourceTypeOptions.set([]);
          this.isLoadingSourceTypes = false;
        }
      });
  }

  private setupChapterChangeListener(): void {
    this.form.get('chapterId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(chapterId => {
        if (this.mode !== 'add') return;

        const facilityControl = this.form.get('collectionFacilityId');
        if (!chapterId) {
          facilityControl?.reset('');
          facilityControl?.disable();
          this.collectionFacilityIdOptions.set([]);
          return;
        }

        facilityControl?.reset('');
        facilityControl?.enable();
        this.loadCollectionFacilities(chapterId);
      });
  }

  /* ---------------- SAVE HANDLER ---------------- */

  onSave(closeAfterSave = true): void {
    this.form.markAllAsTouched();
    this.form.get('terminationDate')?.updateValueAndValidity();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) return;

    const raw = this.form.getRawValue();

    const effectiveDate = raw.effectiveDate as Moment;
    const terminationDate = raw.terminationDate as Moment;

    if (!effectiveDate || !effectiveDate.isValid()) {
      return;
    }

    if (terminationDate && !terminationDate.isValid()) {
      return;
    }

    this.isSaving = true;

    let apiCall: Observable<ReturnResult<ValidFfFlagModel>>;

    if (this.mode === 'add') {
      const payload: ValidFfFlagDto = {
        chapterID: raw.chapterId?.trim(),
        collectionFacilityId: raw.collectionFacilityId?.trim(),
        sourceType: raw.sourceType?.trim(),
        ffFlagValue: raw.ffFlagValue?.trim(),
        effectiveDate: effectiveDate.format('YYYY-MM-DDTHH:mm:ss.SSS') + 'Z'
      };

      if (terminationDate) {
        payload.terminationDate = terminationDate.format('YYYY-MM-DDTHH:mm:ss.SSS') + 'Z';
      }

      apiCall = this.validFfFlagService.addValidFfFlag(payload);
    } else {
      const effectiveDateToUse = this.originalEffectiveDate || '';

      const payload: UpdateValidFfFlagDto = {
        originalChapterID: this.originalChapterID || '',
        originalCollectionFacilityId: this.originalCollectionFacilityId || '',
        originalSourceType: this.originalSourceType || '',
        collectionFacilityId: raw.collectionFacilityId?.trim(),
        sourceType: raw.sourceType?.trim(),
        ffFlagValue: raw.ffFlagValue?.trim(),
        effectiveDate: effectiveDateToUse
      };

      if (terminationDate) {
        payload.terminationDate = terminationDate.format('YYYY-MM-DDTHH:mm:ss.SSS') + 'Z';
      }

      apiCall = this.validFfFlagService.updateValidFfFlag(payload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isSaving = false))
      )
      .subscribe({
        next: (res: any) => {
          this.snackbarService.showSuccess(res?.message);

          this.saveSuccess.emit();

          if (closeAfterSave) {
            this.closePanel.emit();
          } else {
            this.form.reset();
          }
        },
        error: (err: any) => {
          console.error('Error saving valid FF flag:', err);
        }
      });
  }

  onSaveAndCreateAnother(): void {
    this.onSave(false);
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  /* ---------------- FORMATTERS ---------------- */

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}-${d
      .toLocaleString('en-US', { month: 'short' })
      .toUpperCase()}-${d.getFullYear()}`;
  }

  private formatLastModified(date: string | null | undefined): string {
    if (!date) return '';

    const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!isoMatch) return '';

    const [, yearStr, monthStr, dayStr, hourStr, minuteStr] = isoMatch;

    let timeZone = this.headerService.chapterTimeZone();
    if (!timeZone || !TIMEZONE_OFFSET_REGEX.test(timeZone)) {
      timeZone = '+00:00';
    }
    const displayLabel = TIMEZONE_OFFSET_MAP[timeZone]?.abbr ?? `GMT${timeZone}`;

    const sign = timeZone[0] === '+' ? 1 : -1;
    const [tzHH, tzMM] = timeZone.slice(1).split(':').map(Number);
    const chapterNow = new Date(Date.now() + sign * (tzHH * 60 + tzMM) * 60000);
    const todayStr = `${chapterNow.getUTCFullYear()}-${String(chapterNow.getUTCMonth() + 1).padStart(2, '0')}-${String(chapterNow.getUTCDate()).padStart(2, '0')}`;

    const isToday = `${yearStr}-${monthStr}-${dayStr}` === todayStr;
    const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const datePart = isToday ? 'Today' : `${dayStr}-${MONTHS[parseInt(monthStr, 10) - 1]}-${yearStr}`;

    return `Last Modified: ${datePart}, ${hourStr}:${minuteStr} ${displayLabel}`;
  }
}
