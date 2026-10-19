import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { noWhitespaceOnlyValidator, codeFieldValidator, noLeadingTrailingWhitespaceValidator } from '@shared/validators/input.validators';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, ErrorStateMatcher } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

import {
  DonorInterdictionsService,
  DonorInterdiction,
  InterdictionDropdownDto,
  InterdictionLookupItem,
  LabFlagLookup,
} from '../services/donor-interdictions';

/**
 * Local validator: Validates that a field contains no spaces at all.
 * Used for Code field where spaces should never be allowed.
 */
function noSpacesValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'string' && /\s/.test(value)) {
      return { noSpaces: true };
    }

    return null;
  };
}

@Component({
  selector: 'app-add-edit-donor-interdiction-codes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './add-edit-donor-interdiction-codes.html',
  styleUrls: ['./add-edit-donor-interdiction-codes.scss'],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
})
export class AddEditDonorInterdictionCodesComponent implements OnInit, OnChanges, OnDestroy {

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: DonorInterdiction | null = null;
  @Input() dropdowns: InterdictionDropdownDto | null = null;
  @Input() labFlagLookupOptions: LabFlagLookup[] = [];

  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  @ViewChild('effDateNativeInput') effDateNativeInput?: ElementRef;
  @ViewChild('termDateNativeInput') termDateNativeInput?: ElementRef;

  // Custom error state matcher for termination date
  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      const hasTypedText = !!this.getNativeInputText(this.termDateNativeInput);
      return !control.value && hasTypedText;
    }
  };

  private service = inject(DonorInterdictionsService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private headerService = inject(HeaderService);

  private destroy$ = new Subject<void>();

  form!: FormGroup;
  isSaving = false;
  lastUpdated: string = '';
  private originalType: string = '';

  // Dropdown data
  private allTypes: InterdictionLookupItem[] = [];
  private allPeriods: InterdictionLookupItem[] = [];
  private allOwners: string[] = [];
  private allLabFlagOptions: LabFlagLookup[] = [];

  readonly types = signal<InterdictionLookupItem[]>([]);
  readonly periods = signal<InterdictionLookupItem[]>([]);
  readonly owners = signal<string[]>([]);
  readonly labFlagOptions = signal<LabFlagLookup[]>([]);

  readonly typeSearchControl = new FormControl('');
  readonly periodSearchControl = new FormControl('');
  readonly ownerSearchControl = new FormControl('');
  readonly labFlagSearchControl = new FormControl('');
  readonly viewLevelSearchControl = new FormControl('');

  viewLimit = 0;
  viewLevels: number[] = [];
  filteredViewLevels: number[] = [];

  fixedPeriods: string[] = [];
  labFlags: string[] = [];

  yesNoOptions = [
    { label: 'Yes', value: 'Y' },
    { label: 'No', value: 'N' },
  ];

  editModeValues = {
    effectiveDate: ''
  };

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  /**
   * Termination date filter: must be >= chapter's today AND >= effective date
   * Following venipuncture-attributes pattern for consistent behavior
   */
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const chapterToday = moment().utcOffset(this.chapterOffset).startOf('day');
    const today = moment(chapterToday.format('YYYY-MM-DD')).startOf('day');

    // Block dates before chapter's local date
    if (checkDate.isBefore(today)) {
      return false;
    }

    // Must be >= effective date if set
    const effectiveDate = this.form?.get('effectiveDate')?.value;
    if (effectiveDate) {
      const effDay = moment(effectiveDate).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  ngOnInit(): void {
    const chapterTimezone = this.headerService.chapterTimeZone();
    this.initializeForm(chapterTimezone);
    this.loadViewLimit();
    this.populateDropdownsFromInput();
    this.setupSearchFilters();
    this.setupViewLevelSearch();
    this.setupFormSubscriptions();
    this.setupPanel();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.form) return;

    if (changes['dropdowns'] || changes['labFlagLookupOptions']) {
      this.populateDropdownsFromInput();
    }

    if (changes['mode'] || changes['data']) {
      this.setupPanel();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(chapterTimezone: string): void {
    this.form = this.fb.group({
      panelMode: ['Donor', Validators.required],
      code: ['', [Validators.required, Validators.maxLength(5), codeFieldValidator(), noSpacesValidator()]],
      type: ['', [Validators.required, Validators.maxLength(5), noLeadingTrailingWhitespaceValidator()]],
      owner: ['', [Validators.required, Validators.maxLength(1), Validators.pattern(/^[UDB]$/)]],
      description: ['', [Validators.required, Validators.maxLength(50), noWhitespaceOnlyValidator(), noLeadingTrailingWhitespaceValidator()]],
      deferral: ['', Validators.required],
      fixedPeriod: [''],
      period: ['', Validators.maxLength(8)],
      value: this.fb.control<number | null>(null, [Validators.min(0), Validators.max(9999)]),
      minValue: this.fb.control<number | null>(null, [Validators.min(0), Validators.max(9999)]),
      terminationReason: ['', Validators.required],
      viewLevel: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
      multipleFlag: ['', [Validators.required, Validators.pattern(/^[YN]$/)]],
      upgradeFlag: ['', Validators.pattern(/^[YN]$/)],
      manualFlag: [''],
      labFlag: [''],
      effectiveDate: this.fb.control<moment.Moment | null>(null, [
        Validators.required,
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.effectiveDateNotPastValidator(chapterTimezone)
      ]),
      terminationDate: this.fb.control<moment.Moment | null>(null, [
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(chapterTimezone)
      ]),
      labInterdiction: ['', [Validators.maxLength(5), noLeadingTrailingWhitespaceValidator()]],
      oldInterdiction: ['', [Validators.maxLength(5), noLeadingTrailingWhitespaceValidator()]],
    }, { validators: [DateFieldValidationUtility.dateRangeValidator()] });
  }

  private setupFormSubscriptions(): void {
    // Re-validate termination date when effective date changes (for date range validation)
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.get('terminationDate')?.updateValueAndValidity();
      });

    this.form.get('period')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((periodValue: string | null) => {
        const valueControl = this.form.get('value');
        const minValueControl = this.form.get('minValue');

        if (periodValue === 'P' || !periodValue) {
          // P or empty: value and minValue are NOT required
          valueControl?.clearValidators();
          valueControl?.setValidators([Validators.min(0), Validators.max(9999)]);
          minValueControl?.clearValidators();
          minValueControl?.setValidators([Validators.min(0), Validators.max(9999)]);
        } else {
          // M, D, Y, etc.: value IS required, minValue is NOT required
          valueControl?.clearValidators();
          valueControl?.setValidators([Validators.required, Validators.min(0), Validators.max(9999)]);
          minValueControl?.clearValidators();
          minValueControl?.setValidators([Validators.min(0), Validators.max(9999)]);
        }

        valueControl?.updateValueAndValidity();
        minValueControl?.updateValueAndValidity();
      });
  }

  private populateDropdownsFromInput(): void {
    if (this.dropdowns) {
      this.allTypes = this.dropdowns.typeItems ?? [];
      this.types.set(this.allTypes);
      this.allPeriods = this.dropdowns.periodItems ?? [];
      this.periods.set(this.allPeriods);
      this.allOwners = ['B', 'U', 'D'];
      this.owners.set(this.allOwners);
      this.fixedPeriods = ['Y', 'N'];
      this.labFlags = this.dropdowns.labFlags ?? [];
      // viewLimit is now loaded from dedicated API endpoint in loadViewLimit()
    }
    if (this.labFlagLookupOptions) {
      this.allLabFlagOptions = this.labFlagLookupOptions;
      this.labFlagOptions.set(this.allLabFlagOptions);
    }
  }

  private loadViewLimit(): void {
    this.service.getViewLimit()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (limit: number) => {
          this.viewLimit = limit;
          this.generateViewLevels();
          this.updateViewLevelMaxValidator();
        },
        error: (error: any) => {
          console.error('Failed to load view limit:', error);
          this.viewLimit = 0;
          this.generateViewLevels();
        }
      });
  }

  private generateViewLevels(): void {
    this.viewLevels = [];
    // Generate 1 to viewLimit (inclusive)
    for (let i = 1; i <= this.viewLimit; i++) {
      this.viewLevels.push(i);
    }
    this.filteredViewLevels = [...this.viewLevels];
  }

  private updateViewLevelMaxValidator(): void {
    const control = this.form?.get('viewLevel');
    if (!control) return;
    control.clearValidators();
    control.setValidators([Validators.required, Validators.min(1), Validators.max(this.viewLimit)]);
    control.updateValueAndValidity();
  }

  private setupViewLevelSearch(): void {
    this.viewLevelSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredViewLevels = this.viewLevels.filter(level =>
          level.toString().includes(term)
        );
      });
  }

  private setupSearchFilters(): void {
    this.typeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        this.types.set(this.filterLookupItems(this.allTypes, search));
      });

    this.periodSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        this.periods.set(this.filterLookupItems(this.allPeriods, search));
      });

    this.ownerSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        this.owners.set(this.filterOwnerOptions(this.allOwners, search));
      });

    this.labFlagSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        this.labFlagOptions.set(this.filterLabFlagOptions(this.allLabFlagOptions, search));
      });
  }

  private filterLookupItems(options: InterdictionLookupItem[], search: string | null): InterdictionLookupItem[] {
    if (!search || search.length === 0) return options;
    const searchLower = search.toLowerCase();
    return options.filter(opt =>
      opt.code.toLowerCase().includes(searchLower) ||
      opt.description.toLowerCase().includes(searchLower)
    );
  }

  private filterOwnerOptions(options: string[], search: string | null): string[] {
    if (!search || search.length === 0) return options;
    const searchLower = search.toLowerCase();
    return options.filter(opt => {
      const displayName = this.getOwnerDisplayName(opt).toLowerCase();
      return displayName.includes(searchLower);
    });
  }

  private filterLabFlagOptions(options: LabFlagLookup[], search: string | null): LabFlagLookup[] {
    if (!search || search.length === 0) return options;
    const searchLower = search.toLowerCase();
    return options.filter(opt =>
      opt.code.toLowerCase().includes(searchLower) ||
      opt.description.toLowerCase().includes(searchLower)
    );
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.lastUpdated = '';
      this.resetFormForAddMode();
    } else {
      this.lastUpdated = this.data?.lastModifiedDate
        ? `Last Updated: ${this.formatDateTime(this.data.lastModifiedDate)}`
        : '';
      this.populateFormForEdit();
    }
  }

  formatDateTime(date: string | null | undefined): string {
    if (!date) return '';
    const momentDate = moment(date);
    if (!momentDate.isValid()) return '';
    const chapterToday = moment().utcOffset(this.chapterOffset).startOf('day');
    const isToday = momentDate.isSame(chapterToday, 'day');
    return isToday
      ? momentDate.format('[Today], HH:mm')
      : momentDate.format('DD-MMM-YYYY, HH:mm');
  }

  private resetFormForAddMode(): void {
    this.form.reset({ panelMode: 'Donor' });
    this.form.get('panelMode')?.enable();
    this.form.get('effectiveDate')?.enable();

    const valueControl = this.form.get('value');
    const minValueControl = this.form.get('minValue');
    valueControl?.clearValidators();
    valueControl?.setValidators([Validators.min(0), Validators.max(9999)]);
    minValueControl?.clearValidators();
    minValueControl?.setValidators([Validators.min(0), Validators.max(9999)]);
    valueControl?.updateValueAndValidity();
    minValueControl?.updateValueAndValidity();
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    this.originalType = this.data.type ?? '';
    this.form.get('panelMode')?.disable();

    this.form.reset({
      panelMode: this.data.owner === 'Lab' ? 'Lab' : 'Donor',
      code: this.data.code,
      type: this.data.type,
      owner: this.data.owner,
      description: this.data.description || null,
      deferral: this.data.deferral || null,
      fixedPeriod: this.data.fixedPeriod || null,
      period: this.data.period || null,
      value: this.data.value ?? null,
      minValue: this.data.minValue ?? null,
      terminationReason: this.data.terminationReason || null,
      viewLevel: this.data.viewLevel ?? null,
      multipleFlag: this.data.multipleFlag || 'N',
      upgradeFlag: this.data.upgradeFlag || '',
      manualFlag: this.data.manualFlag || '',
      labFlag: this.data.labFlag || '',
      effectiveDate: this.parseDate(this.data.effectiveDate),
      terminationDate: this.parseDate(this.data.terminationDate),
      labInterdiction: this.data.labInterdiction || null,
      oldInterdiction: this.data.oldInterdiction || null,
    });

    this.form.get('effectiveDate')?.disable();
    this.editModeValues.effectiveDate = this.formatDateForDisplay(this.data.effectiveDate);

    const periodValue = this.data.period;
    const valueControl = this.form.get('value');
    const minValueControl = this.form.get('minValue');

    if (periodValue === 'P' || !periodValue) {
      // P or empty: value and minValue are NOT required
      valueControl?.clearValidators();
      valueControl?.setValidators([Validators.min(0), Validators.max(9999)]);
      minValueControl?.clearValidators();
      minValueControl?.setValidators([Validators.min(0), Validators.max(9999)]);
    } else {
      // M, D, Y, etc.: value IS required, minValue is NOT required
      valueControl?.clearValidators();
      valueControl?.setValidators([Validators.required, Validators.min(0), Validators.max(9999)]);
      minValueControl?.clearValidators();
      minValueControl?.setValidators([Validators.min(0), Validators.max(9999)]);
    }
    valueControl?.updateValueAndValidity();
    minValueControl?.updateValueAndValidity();
  }

  onSave(): void {
    if (this.mode === 'add') {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }
    } else {
      if (this.hasVisibleDateError || this.hasVisibleFormErrors) {
        this.form.markAllAsTouched();
        return;
      }
    }

    const f = this.form.getRawValue();

    const payload: DonorInterdiction = {
      ...f,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(f.effectiveDate) ?? '',
      terminationDate: DateFieldValidationUtility.serializeDateForApi(f.terminationDate),
      multipleFlag: f.multipleFlag,
      upgradeFlag: f.upgradeFlag || null,
      manualFlag: f.manualFlag || null,
      labFlag: f.labFlag || null,
      oldType: this.mode === 'edit' ? this.originalType : undefined,
    } as DonorInterdiction;

    this.isSaving = true;

    const apiCall$ = this.mode === 'edit'
      ? this.service.update(payload)
      : this.service.create(payload);

    apiCall$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isSaving = false; })
      )
      .subscribe({
        next: () => {
          if (this.mode === 'edit') {
            this.showSuccess(
              `Donor interdiction with code ${payload.code} has been updated successfully`
            );
          } else {
            this.showSuccess(
              `A New Code '${payload.code}-${payload.type}' has been successfully added`
            );
          }

          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: (err) => {
          console.error('API Error:', err);
        }
      });
  }

  onEffDateInput(): void {
    this.form.get('effectiveDate')?.markAsTouched();
  }

  onTermDateInput(): void {
    this.form.get('terminationDate')?.markAsTouched();
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  goToAddLab(): void {
    this.router.navigate(
      ['/application-administration/lab-restricted/lab-interdiction-codes'],
      { state: { openLabAddMode: 'add' } }
    );
  }

  get isSystemControlled(): boolean {
    return this.data?.changeControlFlag === 'S';
  }

  getYesNoDisplay(value: string | null | undefined): string {
    if (value === 'Y') return 'Yes';
    if (value === 'N') return 'No';
    return '-';
  }

  getOwnerDisplayName(code: string): string {
    const ownerMap: { [key: string]: string } = {
      'D': 'Donor',
      'U': 'Unit',
      'B': 'Both'
    };
    const name = ownerMap[code] || code;
    return `${name} (${code})`;
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  get hasVisibleDateError(): boolean {
    return !!this.getTerminationDateError() || !!this.getEffectiveDateError();
  }

  get hasVisibleFormErrors(): boolean {
    return Object.values(this.form.controls).some(
      ctrl => (ctrl.touched || ctrl.dirty) && ctrl.invalid
    );
  }

  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (control.hasError('required')) {
      const hasText = this.getNativeInputText(this.effDateNativeInput);
      if (hasText) return 'Effective Date is invalid';
      return 'Effective Date is required';
    }
    if (control.hasError('matDatepickerMin')) return 'Effective Date cannot be in the past';
    if (control.hasError('effectiveDatePast')) return 'Effective Date cannot be in the past';
    return '';
  }

  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDate')) return 'Termination Date is invalid';
    if (!control.value && this.getNativeInputText(this.termDateNativeInput)) return 'Termination Date is invalid';
    if (control.hasError('terminationDatePast')) return 'Termination Date cannot be in the past';
    if (control.hasError('dateRangeInvalid') || this.form.errors?.['dateRangeInvalid']) return 'Termination Date must be on or after Effective Date';
    if (control.hasError('terminationBeforeEffective') || this.form.errors?.['terminationBeforeEffective']) return 'Termination Date must be on or after Effective Date';
    return '';
  }

  onIntegerKeyDown(event: KeyboardEvent): void {
    const allowedNavigationKeys = [
      'Backspace', 'Tab', 'Delete',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End',
    ];

    if (allowedNavigationKeys.includes(event.key)) return;

    const isCtrlOrMeta = event.ctrlKey || event.metaKey;
    if (isCtrlOrMeta) {
      const shortcutKeys = ['a', 'A', 'c', 'C', 'v', 'V', 'x', 'X'];
      if (shortcutKeys.includes(event.key)) return;
    }

    if (/^[0-9]$/.test(event.key)) return;

    event.preventDefault();
  }

  limitDigits(event: Event, controlName: string, maxDigits: number): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '');
    if (raw.length > maxDigits) {
      const truncated = parseInt(raw.slice(0, maxDigits), 10);
      this.form.get(controlName)?.setValue(truncated, { emitEvent: false });
      input.value = String(truncated);
    }
  }

  /**
   * Prevents space input entirely (for Code field)
   */
  preventSpaceInput(event: KeyboardEvent): void {
    if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
    }
  }

  /**
   * Prevents leading spaces and multiple consecutive spaces (for text fields)
   */
  preventLeadingAndMultipleSpaces(event: KeyboardEvent, controlName: string): void {
    if (event.key === ' ' || event.code === 'Space') {
      const control = this.form.get(controlName);
      const currentValue = control?.value || '';

      // Prevent space at the beginning
      if (currentValue.length === 0) {
        event.preventDefault();
        return;
      }

      // Prevent multiple consecutive spaces
      if (currentValue.endsWith(' ')) {
        event.preventDefault();
        return;
      }
    }
  }

  /**
   * Trims trailing spaces from a field on blur
   */
  trimTrailingSpaces(controlName: string): void {
    const control = this.form.get(controlName);
    const value = control?.value;

    if (typeof value === 'string') {
      const trimmed = value.trimEnd();
      if (trimmed !== value) {
        control?.setValue(trimmed);
      }
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  private parseDate(value: any): moment.Moment | null {
    if (!value) return null;
    const m = moment(value);
    return m.isValid() ? m : null;
  }

  private formatDateForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '';
    const momentDate = typeof date === 'string' ? moment(date) : moment(date);
    return DateFieldValidationUtility.formatDateForUI(momentDate);
  }
}
