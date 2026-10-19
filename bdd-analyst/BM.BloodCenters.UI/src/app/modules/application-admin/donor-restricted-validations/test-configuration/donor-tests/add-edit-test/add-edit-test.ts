import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackbarService } from '@shared/services/snackbar.service';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { Subject, takeUntil, finalize, forkJoin, debounceTime, distinctUntilChanged } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment, { Moment } from 'moment';

import { DonorTestsApiService } from '../services/donor-tests-api.service';
import { DropdownOptions, DefineTestsDonorCreateDto, DefineTestsDonorUpdateDto } from '../models/donor-tests.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { LoginService } from '@shared/services/login.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { alphanumericCodeValidator, alphanumericWithHyphenValidator } from '@shared/validators/input.validators';

/**
 * Custom MomentDateAdapter for Donor Add/Edit Test Dialog
 * Extends MomentDateAdapter to override today() method to use chapter local date
 */
class DonorAddEditTestDateAdapter extends MomentDateAdapter {
  constructor(
    dateLocale: string,
    private chapterService: ChapterTimezoneService
  ) {
    super(dateLocale);
  }

  /**
   * Override today() to return chapter local date for datepicker highlighting
   */
  override today(): Moment {
    try {
      if (this.chapterService && this.chapterService.isChapterLocalDateAvailable()) {
        const chapterMoment = this.chapterService.getChapterLocalDate();
        if (chapterMoment && chapterMoment.isValid()) {
          return chapterMoment.clone().startOf('day');
        }
      }
    } catch (error) {
      // Fallback to system date
    }
    return super.today();
  }
}

export interface DonorTestDialogData {
  mode: 'add' | 'edit';
  testId?: string;
  description?: string;
  shortId?: string;
  profileTest?: string;
  antigenType?: string;
  antigenGroup?: string;
  testGroup?: string;
  viewLevel?: number | string;
  effectiveDate?: Date | string | null;
  terminationDate?: Date | string | null;
}

export interface DonorTestDialogResult {
  success: boolean;
}

@Component({
  selector: 'app-donor-add-edit-test',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    {
      provide: DateAdapter,
      useFactory: (dateLocale: string, chapterService: ChapterTimezoneService) => {
        return new DonorAddEditTestDateAdapter(dateLocale, chapterService);
      },
      deps: [MAT_DATE_LOCALE, ChapterTimezoneService]
    }
  ],
  templateUrl: './add-edit-test.html',
  styleUrls: ['./add-edit-test.scss']
})
export class DonorAddEditTestComponent implements OnInit, OnDestroy {
  dialogTitle: string;
  mode: 'add' | 'edit' = 'add';
  form: FormGroup;
  isSaving = false;

  // Searchable Test Group dropdown
  readonly testGroupSearchControl = new FormControl('');
  filteredTestGroupOptions: { value: string; display: string }[] = [];

  // Searchable View Level dropdown
  viewLevelLimit = 0;
  viewLevels: number[] = [];
  filteredViewLevels: number[] = [];
  readonly viewLevelSearchControl = new FormControl('');

  // Minimum date for datepickers (start of today)
  minDate = DateFieldValidationUtility.getMinDate();

  get minTerminationDate(): moment.Moment {
    const today = DateFieldValidationUtility.getMinDate();
    const effectiveDate = this.form?.get('effectiveDate')?.value;
    if (!effectiveDate) return today;
    const effDate = moment(effectiveDate).startOf('day');
    return effDate.isAfter(today) ? effDate : today;
  }

  // Dropdown options from API
  dropdownOptions: DropdownOptions = {
    profileTest: [],
    antigenType: [],
    antigenGroup: [],
    testGroup: [],
    viewLevel: []
  };
  isLoadingDropdowns = true;

  // Store original values for change detection
  private originalValues: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: DonorTestsApiService,
    private snackbarService: SnackbarService,
    private loginService: LoginService,
    public dialogRef: MatDialogRef<DonorAddEditTestComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DonorTestDialogData
  ) {
    this.mode = data.mode;
    this.dialogTitle = data.mode === 'add' ? 'Add New Test' : 'Edit Test';

    this.form = this.fb.group({
      testId: ['', [Validators.required, Validators.maxLength(10)]],
      description: ['', [Validators.required, Validators.maxLength(50)]],
      shortId: ['', [Validators.required, Validators.maxLength(6), alphanumericWithHyphenValidator()]],
      profileTest: [null],
      antigenType: [null],
      antigenGroup: [null],
      testGroup: [null, Validators.required],
      viewLevel: [null, [Validators.required]],
      effectiveDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]],
      terminationDate: [null]
    }, { validators: [DateFieldValidationUtility.dateRangeValidator()] });

    if (data.mode === 'edit') {
      this.form.patchValue({
        testId: data.testId || '',
        description: data.description || '',
        shortId: data.shortId || '',
        profileTest: data.profileTest === 'Yes' ? true : data.profileTest === 'No' ? false : null,
        antigenType: data.antigenType || null,
        antigenGroup: data.antigenGroup || null,
        testGroup: data.testGroup || null,
        viewLevel: data.viewLevel != null ? Number(data.viewLevel) : null,
        effectiveDate: data.effectiveDate ? moment(data.effectiveDate) : null,
        terminationDate: data.terminationDate ? moment(data.terminationDate) : null
      });
      this.form.get('testId')?.disable();
    }
  }

  ngOnInit(): void {
    this.form.markAsPristine();
    this.loadDropdowns();
    this.setupTestGroupSearch();
    this.loadViewLevelLimit();
    this.setupViewLevelSearch();

    // Setup date validators based on mode
    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      // Store original values for change detection
      this.originalValues = this.form.getRawValue();
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form);
    }
  }

  private setupTestGroupSearch(): void {
    this.testGroupSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        this.filterTestGroupOptions(search || '');
      });
  }

  private filterTestGroupOptions(search: string): void {
    if (!search) {
      this.filteredTestGroupOptions = [...this.dropdownOptions.testGroup];
      return;
    }
    const lower = search.toLowerCase();
    this.filteredTestGroupOptions = this.dropdownOptions.testGroup.filter(opt =>
      opt.value.toLowerCase().includes(lower) || opt.display.toLowerCase().includes(lower)
    );
  }

  private loadViewLevelLimit(): void {
    this.service.getViewLevelLimit()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (limit: number) => {
          this.viewLevelLimit = limit;
          this.generateViewLevels();
        },
        error: () => {
          this.viewLevelLimit = 0;
          this.generateViewLevels();
        }
      });
  }

  private generateViewLevels(): void {
    this.viewLevels = [];
    for (let i = 1; i <= this.viewLevelLimit; i++) {
      this.viewLevels.push(i);
    }
    this.filteredViewLevels = [...this.viewLevels];
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDropdowns(): void {
    this.isLoadingDropdowns = true;

    // Static dropdown options that don't come from the API
    const profileTestOptions = [
      { value: true, display: 'Yes' },
      { value: false, display: 'No' }
    ];

    // Fetch dropdown options from individual APIs in parallel
    forkJoin({
      antigenTypes: this.service.getAntigenTypes(),
      antigenGroups: this.service.getAntigenGroups(),
      testGroups: this.service.getTestGroups()
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingDropdowns = false)
      )
      .subscribe({
        next: (results) => {
          this.dropdownOptions = {
            profileTest: profileTestOptions,
            antigenType: results.antigenTypes,
            antigenGroup: results.antigenGroups,
            testGroup: results.testGroups,
            viewLevel: []
          };
          this.filteredTestGroupOptions = [...results.testGroups];

          // In edit mode, resolve each select value against the loaded options.
          // The API may return the display label instead of the stored code, so
          // we try an exact code match first, then fall back to a display match.
          if (this.mode === 'edit') {
            const resolve = (
              raw: string | null | undefined,
              options: { value: string; display: string }[]
            ): string | null => {
              if (!raw) return null;
              return (
                options.find(o => o.value === raw)?.value ??
                options.find(o => o.display === raw)?.value ??
                raw
              );
            };

            this.form.patchValue({
              antigenType: resolve(this.data.antigenType, results.antigenTypes),
              antigenGroup: resolve(this.data.antigenGroup, results.antigenGroups),
              testGroup: resolve(this.data.testGroup, results.testGroups)
            }, { emitEvent: false });
            this.form.markAsPristine();
          }
        },
        error: (error) => console.error('Error loading dropdowns:', error)
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSaving = true;

    if (this.mode === 'add') {
      const currentUser = this.loginService.getStoredUsername() || 'DONSYS';
      const createDto: DefineTestsDonorCreateDto = {
        TestId: formValue.testId?.trim() || '',
        Description: formValue.description?.trim() || '',
        ShortId: formValue.shortId?.trim() || '',
        ProfileTest: formValue.profileTest ?? null,
        AntigenType: formValue.antigenType || undefined,
        AntigenGroup: formValue.antigenGroup || undefined,
        TestGroup: formValue.testGroup,
        ViewLevel: Number(formValue.viewLevel),
        EffectiveDate: moment(formValue.effectiveDate).format('YYYY-MM-DD'),
        TerminationDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DD') : null,
        InsertUser: currentUser
      };

      this.service.createTest(createDto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSaving = false)
        )
        .subscribe({
          next: (response) => {
            const message = response?.message || response?.Message || response?.data?.message || response?.data?.Message || 'Test created successfully';
            this.snackbarService.showSuccess(message);
            this.dialogRef.close({ success: true } as DonorTestDialogResult);
          },
          error: () => {
            // Error snackbar handled by global HTTP interceptor
          }
        });
    } else {
      const testId = formValue.testId;
      const updateDto: DefineTestsDonorUpdateDto = {
        Description: formValue.description?.trim() || '',
        ShortId: formValue.shortId?.trim() || '',
        ProfileTest: formValue.profileTest ?? null,
        AntigenType: formValue.antigenType || undefined,
        AntigenGroup: formValue.antigenGroup || undefined,
        TestGroup: formValue.testGroup,
        ViewLevel: Number(formValue.viewLevel),
        EffectiveDate: moment(formValue.effectiveDate).format('YYYY-MM-DD'),
        TerminationDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DD') : null
      };

      this.service.updateTest(testId, updateDto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSaving = false)
        )
        .subscribe({
          next: (response) => {
            const message = response?.message || response?.Message || response?.data?.message || response?.data?.Message || 'Test updated successfully';
            this.snackbarService.showSuccess(message);
            this.dialogRef.close({ success: true } as DonorTestDialogResult);
          },
          error: () => {
            // Error snackbar handled by global HTTP interceptor
          }
        });
    }
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      const labels: { [key: string]: string } = {
        testId: 'Test ID',
        description: 'Description',
        shortId: 'Short ID',
        testGroup: 'Test Group',
        viewLevel: 'View Level',
        effectiveDate: 'Effective Date'
      };
      return `${labels[fieldName] || fieldName} is required`;
    }

    if (control.hasError('whitespaceOnly')) {
      const labels: { [key: string]: string } = {
        testId: 'Test ID',
        description: 'Description',
        shortId: 'Short ID'
      };
      return `${labels[fieldName] || fieldName} cannot contain only spaces`;
    }

    if (control.hasError('alphanumericOnly')) {
      const labels: { [key: string]: string } = {
        testId: 'Test ID',
        shortId: 'Short ID'
      };
      return `${labels[fieldName] || fieldName} can only contain letters, numbers, and spaces`;
    }

    if (fieldName === 'terminationDate' && this.form.errors?.['dateRangeInvalid']) {
      return 'Termination Date must be on or after Effective Date';
    }

    return '';
  }

  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getEffectiveDateErrorMessage(
      this.form.get('effectiveDate'),
      this.form.errors
    );
  }

  getTerminationDateError(): string {
    return DateFieldValidationUtility.getTerminationDateErrorMessage(
      this.form.get('terminationDate'),
      this.form.errors
    );
  }

  preventSpaces(event: KeyboardEvent): void {
    if (event.key === ' ') {
      event.preventDefault();
    }
  }

  preventLeadingSpaces(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    if (event.key === ' ' && (input.selectionStart === 0 || input.value.length === 0)) {
      event.preventDefault();
    }
  }

  /**
   * Prevents special characters from being entered in input fields.
   * Allows only alphanumeric characters (A-Z, a-z, 0-9) and spaces.
   * Optionally allows hyphens.
   * Navigation keys (Backspace, Delete, Arrow keys, Tab, etc.) are allowed.
   *
   * @param event - Keyboard event
   * @param allowHyphen - Whether to allow hyphen character (default: false)
   */
  preventSpecialCharacters(event: KeyboardEvent, allowHyphen: boolean = false): void {
    const input = event.target as HTMLInputElement;

    // Allow navigation and control keys
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    ];

    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X (copy/paste/select all/cut)
    if (event.ctrlKey || event.metaKey) {
      return;
    }

    // Allow navigation keys
    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Build regex pattern based on whether hyphen is allowed
    const pattern = allowHyphen ? /^[a-zA-Z0-9 \-]$/ : /^[a-zA-Z0-9 ]$/;
    const isAllowed = pattern.test(event.key);

    // Prevent leading spaces
    if (event.key === ' ' && (input.selectionStart === 0 || input.value.length === 0)) {
      event.preventDefault();
      return;
    }

    // Block special characters
    if (!isAllowed) {
      event.preventDefault();
    }
  }

  /**
   * Prevents non-numeric characters from being entered in number fields.
   * Allows only digits (0-9).
   * Blocks letters (including 'e', 'E'), special characters, decimal points, plus/minus signs.
   * Navigation keys (Backspace, Delete, Arrow keys, Tab, etc.) are allowed.
   */
  preventNonNumericCharacters(event: KeyboardEvent): void {
    // Allow navigation and control keys
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    ];

    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X (copy/paste/select all/cut)
    if (event.ctrlKey || event.metaKey) {
      return;
    }

    // Allow navigation keys
    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Check if the key is a digit (0-9)
    const isDigit = /^[0-9]$/.test(event.key);

    // Block everything except digits
    if (!isDigit) {
      event.preventDefault();
    }
  }

  limitViewLevel(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value.length > 4) {
      input.value = input.value.slice(0, 4);
      this.form.get('viewLevel')?.setValue(Number(input.value));
    }
  }

  // Get character count for Description field
  getDescriptionCharCount(): string {
    const control = this.form.get('description');
    if (!control) return '';

    const currentLength = control.value?.length || 0;
    const maxLength = 50;

    return `characters remaining: ${maxLength - currentLength}/${maxLength}`;
  }

  // Check if Description has value to show character counter
  showDescriptionCounter(): boolean {
    const control = this.form.get('description');
    return !!(control?.value && control.value.length > 0);
  }
}
