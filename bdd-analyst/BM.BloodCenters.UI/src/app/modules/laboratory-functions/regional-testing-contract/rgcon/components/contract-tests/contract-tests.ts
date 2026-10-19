import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ErrorStateMatcher } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { RegionalTestingContractApiService } from '../../services/regional-testing-contract-api.service';
import { ConfirmatoryTestsQueryDialogComponent } from '../confirmatory-tests-query-dialog/confirmatory-tests-query-dialog';
import { SelectTestsDialogComponent } from '../select-tests-dialog/select-tests-dialog';
import {
  ProfileSetData,
  ProfileTestData,
  ProfileType,
  NonProfileTestData,
  CustomerOverrideData,
  ConfirmatoryOverrideTestData,
  TestLookup,
  ResultLookup,
  YES_NO_OPTIONS,
  PLATE_SEQUENCE_MAP,
  ReactiveTestResult,
  ConfirmatoryTestResult
} from '../../models/regional-testing-contract.model';
import { SelectMultipleTestPanelComponent } from '../select-multiple-test-panel/select-multiple-test-panel';
import { ConfirmatoryTestsQueryPanelComponent } from '../confirmatory-tests-query-panel/confirmatory-tests-query-panel';

type ContentSection = 'profile-tests' | 'non-profile-tests' | 'customer-override';

@Component({
  selector: 'app-contract-tests',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    SelectMultipleTestPanelComponent,
    ConfirmatoryTestsQueryPanelComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './contract-tests.html',
  styleUrl: './contract-tests.scss'
})
export class ContractTestsComponent implements OnInit, AfterViewInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `contract-tests-${ContractTestsComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  @Input() contractId = 'NEW';
  @Input() mode: 'add' | 'edit' = 'add';
  @Output() saveAndFinish = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(RegionalTestingContractApiService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();
  private sectionObserver: IntersectionObserver | null = null;

  protected readonly yesNoOptions = YES_NO_OPTIONS;
  protected readonly plateSequenceMap = PLATE_SEQUENCE_MAP;

  // State
  activeSection = signal<ContentSection>('profile-tests');
  profileSets = signal<ProfileSetData[]>([]);
  currentProfileSetIndex = signal<number>(-1);
  showProfileTerminated = new FormControl<string>('No');
  nonProfileTests = signal<NonProfileTestData[]>([]);
  customerOverrides = signal<CustomerOverrideData[]>([]);
  testLookups = signal<TestLookup[]>([]);
  reactiveTestLookups = signal<TestLookup[]>([]); // For reactive tests dropdown and description
  resultLookups = signal<ResultLookup[]>([]);
  loading = signal<boolean>(true);
  private dataLoadedOnce = false; // Track if initial data has been loaded

  // Profile Tests inline table
  profileRowForms: Map<number, FormGroup> = new Map();
  profileTestSearchControl = new FormControl<string>('');
  private profileTestSearchText = signal<string>('');

  // Non-Profile header
  nonProfileTestIdControl = new FormControl<string>('');
  nonProfileTestSearchControl = new FormControl<string>('');
  private nonProfileSearchText = signal<string>('');

  // Customer Override header
  reactiveTestIdControl = new FormControl<string>('');
  reactiveTestSearchControl = new FormControl<string>('');
  resultControl = new FormControl<string>('');
  private reactiveSearchText = signal<string>('');
  private selectedReactiveTestId = signal<string>('');
  private selectedResult = signal<string>('');

  // Customer Override inline table
  confirmatoryRowForms: Map<number, FormGroup> = new Map();
  confirmatoryTestSearchControl = new FormControl<string>('');
  private confirmatorySearchText = signal<string>('');

  // Date validation tracking (per row)
  private profileLastChanged: Map<number, 'effective' | 'termination' | null> = new Map();
  private profileEffMatchers: Map<number, ErrorStateMatcher> = new Map();
  private profileTermMatchers: Map<number, ErrorStateMatcher> = new Map();
  private confirmatoryLastChanged: Map<number, 'effective' | 'termination' | null> = new Map();
  private confirmatoryEffMatchers: Map<number, ErrorStateMatcher> = new Map();
  private confirmatoryTermMatchers: Map<number, ErrorStateMatcher> = new Map();

  // Computed
  currentProfileSet = computed(() => {
    const idx = this.currentProfileSetIndex();
    const sets = this.profileSets();
    return idx >= 0 && idx < sets.length ? sets[idx] : null;
  });

  currentProfileSetId = computed(() => this.currentProfileSet()?.profileSetId || '');

  currentProfileType = computed(() => this.currentProfileSet()?.profileType || null);

  currentProfileTests = computed(() => this.currentProfileSet()?.tests || []);

  allAssignedTestIds = computed(() => {
    const profileIds = this.profileSets().flatMap(ps => ps.tests.map(t => t.testId));
    const nonProfileIds = this.nonProfileTests().map(t => t.testId);
    return [...new Set([...profileIds, ...nonProfileIds])];
  });

  filteredTestLookups = computed(() => {
    const search = this.profileTestSearchText().toLowerCase();
    const lookups = this.testLookups();
    return !search ? lookups : lookups.filter(t =>
      t.testId.toLowerCase().includes(search) ||
      t.description.toLowerCase().includes(search)
    );
  });

  filteredNonProfileLookups = computed(() => {
    const search = this.nonProfileSearchText().toLowerCase();
    const excluded = new Set(this.allAssignedTestIds());
    return this.testLookups()
      .filter(t => !excluded.has(t.testId))
      .filter(t => !search ||
        t.testId.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search)
      );
  });

  nonProfileTestDescription = computed(() => {
    const testId = this.nonProfileTestIdControl.value;
    if (!testId) return '-';
    return this.testLookups().find(t => t.testId === testId)?.description || '-';
  });

  filteredReactiveTestLookups = computed(() => {
    const search = this.reactiveSearchText().toLowerCase();
    return this.reactiveTestLookups()
      .filter(t => !search ||
        t.testId.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search)
      );
  });

  reactiveTestDescription = computed(() => {
    const testId = this.reactiveTestIdControl.value;
    if (!testId) return '-';
    return this.reactiveTestLookups().find(t => t.testId === testId)?.description || '-';
  });

  currentCustomerOverride = computed(() => {
    const testId = this.selectedReactiveTestId();
    const result = this.selectedResult();
    if (!testId) return null;

    // Find override by testId first, then by result (empty result matches any override for that testId when result not yet selected)
    const overridesForTest = this.customerOverrides().filter(co => co.reactiveTestId === testId);

    // If result is selected, find exact match
    if (result) {
      return overridesForTest.find(co => co.result === result) || null;
    }

    // If no result selected yet, return the first override for this test (or the one with empty result)
    return overridesForTest.find(co => co.result === '') || overridesForTest[0] || null;
  });

  currentConfirmatoryTests = computed(() => this.currentCustomerOverride()?.confirmatoryTests || []);

  plateSequenceLabel = computed(() => {
    const override = this.currentCustomerOverride();
    return override ? (PLATE_SEQUENCE_MAP[override.plateSequence] || '-') : '-';
  });

  hasConfirmatoryQueryData = computed(() => this.currentConfirmatoryTests().length > 0);

  filteredConfirmatoryLookups = computed(() => {
    const search = this.confirmatorySearchText().toLowerCase();
    const reactiveId = this.reactiveTestIdControl.value;
    return this.testLookups()
      .filter(t => t.testId !== reactiveId)
      .filter(t => !search ||
        t.testId.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search)
      );
  });

  protected minDate = DateFieldValidationUtility.getMinDate();

  constructor() {
    effect(() => {
      const tz = this.headerService.chapterTimeZone();
      this.minDate = DateFieldValidationUtility.getMinDate(tz);
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.setupSearchSubscriptions();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.setupSectionObserver(), 500);
  }

  ngOnDestroy(): void {
    this.sectionObserver?.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    // Skip loading if data has already been loaded once (prevents overwriting user changes)
    if (this.dataLoadedOnce) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    // Load test lookups for profile tests
    this.apiService.getTestLookups(this.contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(lookups => this.testLookups.set(lookups));

    // Load reactive test lookups for Customer Override section
    this.apiService.getReactiveTestLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe(lookups => this.reactiveTestLookups.set(lookups));

    // Result lookups are loaded when a reactive test is selected
    // Placeholder empty for now
    this.resultLookups.set([]);

    // Load profile sets from API
    this.apiService.getProfileSets(this.contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(sets => {
        this.profileSets.set(sets);
        if (sets.length > 0) {
          this.currentProfileSetIndex.set(0);
          this.rebuildProfileRowForms();
        }
      });

    // Load non-profile tests
    this.apiService.getNonProfileTests(this.contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(tests => this.nonProfileTests.set(tests));

    // Load customer overrides
    this.apiService.getCustomerOverrides(this.contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(overrides => {
        this.customerOverrides.set(overrides);
        this.loading.set(false);
        this.dataLoadedOnce = true; // Mark that initial data has been loaded
      });
  }

  private setupSearchSubscriptions(): void {
    this.profileTestSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.profileTestSearchText.set(v || ''));

    this.nonProfileTestSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.nonProfileSearchText.set(v || ''));

    this.reactiveTestSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.reactiveSearchText.set(v || ''));

    this.confirmatoryTestSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.confirmatorySearchText.set(v || ''));
  }

  private setupSectionObserver(): void {
    this.sectionObserver?.disconnect();
    const sectionIds = ['profile-tests', 'non-profile-tests', 'customer-override'];

    this.sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.activeSection.set(entry.target.id as ContentSection);
            this.cdr.markForCheck();
            break;
          }
        }
      },
      {
        root: this.scrollContainer?.nativeElement,
        rootMargin: '-10% 0px -80% 0px',
        threshold: 0
      }
    );

    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) this.sectionObserver!.observe(el);
    });
  }

  scrollToSection(sectionId: string): void {
    this.activeSection.set(sectionId as ContentSection);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ── Profile Tests ───────────────────────────────────────────────

  onAddNewProfileSet(): void {
    const sets = this.profileSets();
    const prefix = this.contractId.length > 3 ? this.contractId.substring(3) : this.contractId;
    const existingNumbers = sets
      .map(s => s.profileSetId)
      .map(id => {
        const parts = id.split('-');
        return parts.length > 1 ? parseInt(parts[parts.length - 1], 10) : 0;
      })
      .filter(n => !isNaN(n));
    const next = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const newSetId = `${prefix}-${String(next).padStart(4, '0')}`;

    // Create new profile set with one empty test row
    const emptyTest: ProfileTestData = {
      testId: '',
      description: '',
      width: null,
      length: null,
      required: 'N',
      extract: 'N',
      electronicFile: 'N',
      effectiveDate: '',
      terminationDate: null,
      isNew: true
    };

    const newSet: ProfileSetData = {
      profileSetId: newSetId,
      profileType: null,
      effectiveDate: moment().format('YYYY-MM-DDTHH:mm:ss'), // Default to current date
      terminationDate: null,
      tests: [emptyTest] // Start with one empty row
    };

    this.profileSets.set([...sets, newSet]);
    this.currentProfileSetIndex.set(sets.length);
    this.rebuildProfileRowForms();
  }

  onProfileSetChange(index: number): void {
    this.currentProfileSetIndex.set(index);

    // Ensure the selected profile set has at least one empty row
    const current = this.currentProfileSet();
    if (current && current.tests.length === 0) {
      const emptyTest: ProfileTestData = {
        testId: '',
        description: '',
        width: null,
        length: null,
        required: 'N',
        extract: 'N',
        electronicFile: 'N',
        effectiveDate: '',
        terminationDate: null,
        isNew: true
      };
      this.updateCurrentProfileSet({ tests: [emptyTest] });
    }

    this.rebuildProfileRowForms();
  }

  onProfileTypeChange(type: ProfileType, checked: boolean): void {
    const current = this.currentProfileSet();
    if (!current || !checked) {
      this.updateCurrentProfileSet({ profileType: null });
      return;
    }

    // Only check for duplicates for Primary (P) and Ad-Hoc (A)
    // Secondary (S) profiles can have multiple instances
    if (type === 'P' || type === 'A') {
      const existingSet = this.profileSets().find(
        ps => ps.profileType === type &&
          ps.profileSetId !== current.profileSetId &&
          !ps.terminationDate
      );

      if (existingSet) {
        // Different messages for Primary vs Ad-Hoc
        const profileTypeName = type === 'P' ? 'primary' : 'ad-hoc';
        const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
          data: {
            title: 'Error: 9985',
            message: `There is already a ${profileTypeName} profile assigned. Do you wish to change? ${existingSet.profileSetId}`,
            confirmText: 'Yes',
            cancelText: 'No'
          }
        });

        dialogRef.afterClosed()
          .pipe(takeUntil(this.destroy$))
          .subscribe(result => {
            if (result === true) {
              // User confirmed - remove the profile type from the existing set
              const updated = this.profileSets().map(ps => {
                if (ps.profileSetId === existingSet.profileSetId) {
                  return { ...ps, profileType: null };
                }
                return ps;
              });
              this.profileSets.set(updated);
              this.updateCurrentProfileSet({ profileType: type });
            }
            // If user cancels, do nothing (keep existing profile type)
            this.cdr.markForCheck();
          });
        return;
      }
    }

    // No existing profile found, or type is Secondary - proceed with update
    this.updateCurrentProfileSet({ profileType: type });
  }

  private updateCurrentProfileSet(updates: Partial<ProfileSetData>): void {
    const idx = this.currentProfileSetIndex();
    const sets = [...this.profileSets()];
    if (idx >= 0 && idx < sets.length) {
      sets[idx] = { ...sets[idx], ...updates };
      this.profileSets.set(sets);
    }
  }

  onAddProfileTestRow(): void {
    const current = this.currentProfileSet();
    if (!current) return;

    const newTest: ProfileTestData = {
      testId: '',
      description: '',
      width: null,
      length: null,
      required: 'N',
      extract: 'N',
      electronicFile: 'N',
      effectiveDate: '',
      terminationDate: null,
      isNew: true
    };

    const tests = [...current.tests, newTest];
    this.updateCurrentProfileSet({ tests });
    this.rebuildProfileRowForms();
  }

  onDeleteProfileTestRow(index: number): void {
    const current = this.currentProfileSet();
    if (!current) return;

    const tests = [...current.tests];
    tests.splice(index, 1);
    this.updateCurrentProfileSet({ tests });
    this.rebuildProfileRowForms();
  }

  onProfileTestIdChange(index: number, testId: string): void {
    const lookup = this.testLookups().find(t => t.testId === testId);
    const descControl = this.profileRowForms.get(index)?.get('description');
    if (descControl && lookup) {
      descControl.setValue(lookup.description);
    }

    const current = this.currentProfileSet();
    if (current && testId) {
      const tests = [...current.tests];
      if (tests[index]) {
        tests[index] = {
          ...tests[index],
          testId: testId,
          description: lookup?.description || ''
        };
        this.updateCurrentProfileSet({ tests });
      }

      // If this is the last row and a test was selected, add a new empty row at the bottom
      if (index === tests.length - 1) {
        this.onAddProfileTestRow();
      }
    }
  }

  getProfileRowControl(index: number, field: string): FormControl {
    return this.profileRowForms.get(index)?.get(field) as FormControl;
  }

  // ── Profile Date Validation ─────────────────────────────────────

  getProfileEffMatcher(index: number): ErrorStateMatcher {
    if (!this.profileEffMatchers.has(index)) {
      this.profileEffMatchers.set(index,
        DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getProfileEffDateError(index))
      );
    }
    return this.profileEffMatchers.get(index)!;
  }

  getProfileTermMatcher(index: number): ErrorStateMatcher {
    if (!this.profileTermMatchers.has(index)) {
      this.profileTermMatchers.set(index,
        DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getProfileTermDateError(index))
      );
    }
    return this.profileTermMatchers.get(index)!;
  }

  onProfileEffDateInput(index: number, event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.profileRowForms.get(index)?.get('effectiveDate') ?? null
    );
  }

  onProfileTermDateInput(index: number, event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.profileRowForms.get(index)?.get('terminationDate') ?? null,
      this.mode === 'edit'
    );
  }

  onProfileEffDateChange(index: number): void {
    this.profileLastChanged.set(index, 'effective');
    const form = this.profileRowForms.get(index);
    form?.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
    form?.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  onProfileTermDateChange(index: number): void {
    this.profileLastChanged.set(index, 'termination');
    const form = this.profileRowForms.get(index);
    form?.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  onProfileEffDateBlur(index: number): void {
    setTimeout(() => {
      const control = this.profileRowForms.get(index)?.get('effectiveDate');
      control?.markAsTouched();
      control?.updateValueAndValidity();
      this.profileRowForms.get(index)?.updateValueAndValidity({ emitEvent: false });
      this.cdr.markForCheck();
    }, 0);
  }

  onProfileTermDateBlur(index: number): void {
    setTimeout(() => {
      const control = this.profileRowForms.get(index)?.get('terminationDate');
      control?.markAsTouched();
      control?.updateValueAndValidity();
      this.profileRowForms.get(index)?.updateValueAndValidity({ emitEvent: false });
      this.cdr.markForCheck();
    }, 0);
  }

  getProfileEffDateError(index: number): string {
    const control = this.profileRowForms.get(index)?.get('effectiveDate');
    if (!control) return '';
    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'Effective Date is invalid';
    }
    if (control.hasError('required') && (control.touched || control.dirty)) {
      return 'Effective Date is required';
    }
    if (control.hasError('matDatepickerMin')) {
      return 'Effective Date cannot be past date';
    }
    if (this.profileLastChanged.get(index) === 'effective' &&
        this.profileRowForms.get(index)?.hasError('dateRangeInvalid')) {
      return 'Effective Date must be less than or equal to Termination Date';
    }
    return '';
  }

  getProfileTermDateError(index: number): string {
    const control = this.profileRowForms.get(index)?.get('terminationDate');
    if (!control) return '';
    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }
    if (!(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerFilter')) {
      return 'Termination Date must be on or after Effective Date';
    }
    if (this.profileLastChanged.get(index) === 'termination' &&
        this.profileRowForms.get(index)?.hasError('dateRangeInvalid')) {
      return 'Termination Date must be on or after Effective Date';
    }
    return '';
  }

  getProfileTermDateFilter(index: number): (date: Moment | null) => boolean {
    return (date: Moment | null): boolean => {
      if (!date) return true;
      const eff = this.profileRowForms.get(index)?.get('effectiveDate')?.value;
      if (eff) {
        return !moment(date).startOf('day').isBefore(moment(eff).startOf('day'));
      }
      return true;
    };
  }

  /**
   * Sync form values back to underlying ProfileTestData before rebuilding forms
   * This prevents data loss when forms are recreated (e.g., when adding new rows)
   * Only syncs if form count matches data count (prevents syncing after programmatic data changes)
   * @param force If true, sync all forms even if counts don't match (used before save)
   */
  private syncProfileFormsToData(force: boolean = false): void {
    const current = this.currentProfileSet();
    if (!current) return;

    // Only sync if the number of forms matches the number of tests
    // If they don't match, it means the data was just modified programmatically (e.g., new row added)
    // and we shouldn't sync the old forms to the new data structure
    // Exception: if force=true (called before save), sync what we can
    if (!force && this.profileRowForms.size !== current.tests.length) {
      return;
    }

    const updatedTests = current.tests.map((test, index) => {
      const form = this.profileRowForms.get(index);
      if (!form) return test;

      const formValue = form.getRawValue();
      return {
        ...test,
        testId: formValue.testId || test.testId,
        description: formValue.description || test.description,
        width: formValue.width ?? test.width,
        length: formValue.length ?? test.length,
        required: formValue.required || test.required,
        extract: formValue.extract || test.extract,
        electronicFile: formValue.electronicFile || test.electronicFile,
        effectiveDate: formValue.effectiveDate ? moment(formValue.effectiveDate).format('YYYY-MM-DDTHH:mm:ss') : test.effectiveDate,
        terminationDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DDTHH:mm:ss') : test.terminationDate
      };
    });

    this.updateCurrentProfileSet({ tests: updatedTests });
  }

  private rebuildProfileRowForms(): void {
    // Sync current form values to data before clearing forms
    this.syncProfileFormsToData();

    this.profileRowForms.clear();
    this.profileLastChanged.clear();
    this.profileEffMatchers.clear();
    this.profileTermMatchers.clear();
    const tests = this.currentProfileTests();
    tests.forEach((test, index) => {
      this.profileRowForms.set(index, this.createProfileTestForm(test, index));
    });
  }

  private createProfileTestForm(test: ProfileTestData, index: number): FormGroup {
    const form = this.fb.group({
      testId: [test.testId, [Validators.required]],
      description: [{ value: test.description, disabled: true }],
      width: [test.width],
      length: [test.length],
      required: [test.required || 'N'],
      extract: [test.extract || 'N'],
      electronicFile: [test.electronicFile || 'N'],
      effectiveDate: [test.effectiveDate ? moment(test.effectiveDate) : null, [Validators.required]],
      terminationDate: [test.terminationDate ? moment(test.terminationDate) : null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')
      ]
    });

    if (test.isNew) {
      DateFieldValidationUtility.setupAddModeValidators(form, this.headerService.chapterTimeZone());
    }

    form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.profileLastChanged.set(index, 'effective');
        form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
        form.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.profileLastChanged.set(index, 'termination');
        form.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    return form;
  }

  // ── Non-Profile Tests ───────────────────────────────────────────

  onAddNonProfileTestSingle(): void {
    const testId = this.nonProfileTestIdControl.value;
    if (!testId) return;

    // Check if test already exists in the table
    const currentTests = this.nonProfileTests();
    const alreadyExists = currentTests.some(t => t.testId === testId);

    if (alreadyExists) {
      // Clear the dropdown and don't add duplicate
      this.nonProfileTestIdControl.setValue('');
      return;
    }

    const lookup = this.testLookups().find(t => t.testId === testId);
    if (!lookup) return;

    const newTest: NonProfileTestData = {
      testId: lookup.testId,
      description: lookup.description,
      effectiveDate: moment().format('YYYY-MM-DD'),
      terminationDate: null,
      lastModifiedUser: this.headerService.getCurrentUsername(),
      lastModifiedDate: moment().toISOString()
    };

    this.nonProfileTests.set([...currentTests, newTest]);
    this.nonProfileTestIdControl.setValue('');
  }

  onOpenSelectMultiplePanel(): void {
    const dialogRef = this.dialog.open(SelectTestsDialogComponent, {
      width: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'code-dialog-panel-right',
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      disableClose: false,
      data: {
        contractId: this.contractId,
        selectedTests: this.nonProfileTests().map(t => ({
          testId: t.testId,
          group: '', // NonProfileTestData doesn't have testGroup
          description: t.description
        }))
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.onMultipleTestsSelected(result);
        }
      });
  }

  onMultipleTestsSelected(selectedTests: any[]): void {
    const currentTests = this.nonProfileTests();
    const currentTestIds = new Set(currentTests.map(t => t.testId));

    // Only add tests that don't already exist in the table
    const newTests: NonProfileTestData[] = selectedTests
      .filter(test => !currentTestIds.has(test.testId))
      .map(test => {
        return {
          testId: test.testId,
          description: test.description,
          effectiveDate: moment().format('YYYY-MM-DD'),
          terminationDate: null,
          lastModifiedUser: this.headerService.getCurrentUsername(),
          lastModifiedDate: moment().toISOString()
        };
      });

    // Only update if there are new tests to add
    if (newTests.length > 0) {
      this.nonProfileTests.set([...currentTests, ...newTests]);
    }
  }

  // ── Customer Override ───────────────────────────────────────────

  onAddConfirmatoryTestRow(): void {
    const reactiveTestId = this.reactiveTestIdControl.value;
    const result = this.resultControl.value || '';

    if (!reactiveTestId) {
      this.snackbarService.showError('Please select a Reactive Test ID first');
      return;
    }

    const newTest: ConfirmatoryOverrideTestData = {
      testId: '',
      description: '',
      effectiveDate: '',
      terminationDate: null,
      isNew: true
    };

    let override = this.currentCustomerOverride();

    // If no override exists for this reactive test + result, create one
    if (!override) {
      const testLookup = this.reactiveTestLookups().find(t => t.testId === reactiveTestId);
      const newOverride: CustomerOverrideData = {
        reactiveTestId: reactiveTestId,
        description: testLookup?.description || '',
        result: result,
        plateSequence: 'R', // Default to 'R' (Reactive)
        confirmatoryTests: [newTest]
      };
      this.customerOverrides.set([...this.customerOverrides(), newOverride]);
    } else {
      // Add test to existing override at the top (beginning of array)
      const updated = this.customerOverrides().map(co => {
        if (co.reactiveTestId === override!.reactiveTestId && co.result === override!.result) {
          return { ...co, confirmatoryTests: [newTest, ...co.confirmatoryTests] };
        }
        return co;
      });
      this.customerOverrides.set(updated);
    }

    this.rebuildConfirmatoryRowForms();
  }

  onDeleteConfirmatoryTestRow(index: number): void {
    const override = this.currentCustomerOverride();
    if (!override) return;

    const updated = this.customerOverrides().map(co => {
      if (co.reactiveTestId === override.reactiveTestId && co.result === override.result) {
        const tests = [...co.confirmatoryTests];
        tests.splice(index, 1);
        return { ...co, confirmatoryTests: tests };
      }
      return co;
    });
    this.customerOverrides.set(updated);
    this.rebuildConfirmatoryRowForms();
  }

  onConfirmatoryTestIdChange(index: number, testId: string): void {
    const lookup = this.testLookups().find(t => t.testId === testId);
    const descControl = this.confirmatoryRowForms.get(index)?.get('description');
    if (descControl && lookup) {
      descControl.setValue(lookup.description);
    }

    // Update the ConfirmatoryOverrideTestData with the selected testId and description
    const override = this.currentCustomerOverride();
    if (override && testId) {
      const updated = this.customerOverrides().map(co => {
        if (co.reactiveTestId === override.reactiveTestId && co.result === override.result) {
          const tests = [...co.confirmatoryTests];
          if (tests[index]) {
            tests[index] = {
              ...tests[index],
              testId: testId,
              description: lookup?.description || ''
            };
          }
          return { ...co, confirmatoryTests: tests };
        }
        return co;
      });
      this.customerOverrides.set(updated);

      // If this is the first row (top row) and a test was selected, add a new empty row at the top
      if (index === 0) {
        this.onAddConfirmatoryTestRow();
      }
    }
  }

  getConfirmatoryRowControl(index: number, field: string): FormControl {
    return this.confirmatoryRowForms.get(index)?.get(field) as FormControl;
  }

  // ── Confirmatory Date Validation ────────────────────────────────

  getConfirmatoryEffMatcher(index: number): ErrorStateMatcher {
    if (!this.confirmatoryEffMatchers.has(index)) {
      this.confirmatoryEffMatchers.set(index,
        DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getConfirmatoryEffDateError(index))
      );
    }
    return this.confirmatoryEffMatchers.get(index)!;
  }

  getConfirmatoryTermMatcher(index: number): ErrorStateMatcher {
    if (!this.confirmatoryTermMatchers.has(index)) {
      this.confirmatoryTermMatchers.set(index,
        DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getConfirmatoryTermDateError(index))
      );
    }
    return this.confirmatoryTermMatchers.get(index)!;
  }

  onConfirmatoryEffDateInput(index: number, event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.confirmatoryRowForms.get(index)?.get('effectiveDate') ?? null
    );
  }

  onConfirmatoryTermDateInput(index: number, event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.confirmatoryRowForms.get(index)?.get('terminationDate') ?? null,
      this.mode === 'edit'
    );
  }

  onConfirmatoryEffDateChange(index: number): void {
    this.confirmatoryLastChanged.set(index, 'effective');
    const form = this.confirmatoryRowForms.get(index);
    form?.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
    form?.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  onConfirmatoryTermDateChange(index: number): void {
    this.confirmatoryLastChanged.set(index, 'termination');
    const form = this.confirmatoryRowForms.get(index);
    form?.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  onConfirmatoryEffDateBlur(index: number): void {
    setTimeout(() => {
      const control = this.confirmatoryRowForms.get(index)?.get('effectiveDate');
      control?.markAsTouched();
      control?.updateValueAndValidity();
      this.confirmatoryRowForms.get(index)?.updateValueAndValidity({ emitEvent: false });
      this.cdr.markForCheck();
    }, 0);
  }

  onConfirmatoryTermDateBlur(index: number): void {
    setTimeout(() => {
      const control = this.confirmatoryRowForms.get(index)?.get('terminationDate');
      control?.markAsTouched();
      control?.updateValueAndValidity();
      this.confirmatoryRowForms.get(index)?.updateValueAndValidity({ emitEvent: false });
      this.cdr.markForCheck();
    }, 0);
  }

  getConfirmatoryEffDateError(index: number): string {
    const control = this.confirmatoryRowForms.get(index)?.get('effectiveDate');
    if (!control) return '';
    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'Effective Date is invalid';
    }
    if (control.hasError('required') && (control.touched || control.dirty)) {
      return 'Effective Date is required';
    }
    if (control.hasError('matDatepickerMin')) {
      return 'Effective Date cannot be past date';
    }
    if (this.confirmatoryLastChanged.get(index) === 'effective' &&
        this.confirmatoryRowForms.get(index)?.hasError('dateRangeInvalid')) {
      return 'Effective Date must be less than or equal to Termination Date';
    }
    return '';
  }

  getConfirmatoryTermDateError(index: number): string {
    const control = this.confirmatoryRowForms.get(index)?.get('terminationDate');
    if (!control) return '';
    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }
    if (!(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerMin')) {
      return 'Termination Date cannot be past date';
    }
    if (this.confirmatoryLastChanged.get(index) === 'termination' &&
        this.confirmatoryRowForms.get(index)?.hasError('dateRangeInvalid')) {
      return 'Termination Date must be greater than or equal to Effective Date';
    }
    return '';
  }

  getConfirmatoryTermDateFilter(index: number): (date: Moment | null) => boolean {
    return (date: Moment | null): boolean => {
      if (!date) return true;
      const eff = this.confirmatoryRowForms.get(index)?.get('effectiveDate')?.value;
      if (eff) {
        return !moment(date).startOf('day').isBefore(moment(eff).startOf('day'));
      }
      return true;
    };
  }

  onReactiveTestOrResultChange(): void {
    const testId = this.reactiveTestIdControl.value;
    const result = this.resultControl.value;

    // Update signal to trigger computed reactivity
    this.selectedResult.set(result || '');

    if (!testId || !result) return;

    // Check if an override exists for this testId + result combination
    let override = this.currentCustomerOverride();

    if (!override) {
      // Create new override for this testId + result combination with one empty row
      const emptyTest: ConfirmatoryOverrideTestData = {
        testId: '',
        description: '',
        effectiveDate: '',
        terminationDate: null,
        isNew: true
      };

      const testLookup = this.reactiveTestLookups().find(t => t.testId === testId);
      const newOverride: CustomerOverrideData = {
        reactiveTestId: testId,
        description: testLookup?.description || '',
        result: result,
        plateSequence: 'R',
        confirmatoryTests: [emptyTest] // Start with one empty row
      };
      this.customerOverrides.set([...this.customerOverrides(), newOverride]);
    } else {
      // Update the result in the existing override
      const updated = this.customerOverrides().map(co => {
        if (co.reactiveTestId === override!.reactiveTestId &&
            (co.result === override!.result || co.result === '')) {
          return { ...co, result: result };
        }
        return co;
      });
      this.customerOverrides.set(updated);
    }

    this.rebuildConfirmatoryRowForms();
  }

  onReactiveTestChange(): void {
    const testId = this.reactiveTestIdControl.value;

    // Update signal to trigger computed reactivity
    this.selectedReactiveTestId.set(testId || '');

    // Clear result when test changes
    this.resultControl.setValue('');
    this.selectedResult.set('');
    this.resultLookups.set([]);

    if (!testId) {
      return;
    }

    // Create customer override as soon as test is selected (before result)
    let override = this.currentCustomerOverride();
    if (!override) {
      const emptyTest: ConfirmatoryOverrideTestData = {
        testId: '',
        description: '',
        effectiveDate: '',
        terminationDate: null,
        isNew: true
      };

      const testLookup = this.reactiveTestLookups().find(t => t.testId === testId);
      const newOverride: CustomerOverrideData = {
        reactiveTestId: testId,
        description: testLookup?.description || '',
        result: '', // Will be filled when user selects result
        plateSequence: 'R',
        confirmatoryTests: [emptyTest] // Start with one empty row
      };
      this.customerOverrides.set([...this.customerOverrides(), newOverride]);
      this.rebuildConfirmatoryRowForms();
    }

    // Load result codes for the selected test
    this.apiService.getResultCodesForTest(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        this.resultLookups.set(results);
      });

    this.rebuildConfirmatoryRowForms();
  }

  onOpenConfirmatoryQueryPanel(): void {
    const reactiveTestId = this.reactiveTestIdControl.value;

    // If no reactive test is selected, use the first one from customer overrides if available
    const effectiveReactiveTestId = reactiveTestId || this.customerOverrides()[0]?.reactiveTestId;

    if (!effectiveReactiveTestId) {
      this.snackbarService.showError('Please select a Reactive Test ID first');
      return;
    }

    // Open as side panel (right side, below application header)
    this.dialog.open(ConfirmatoryTestsQueryDialogComponent, {
      width: '60vw',
      height: 'calc(100vh - 64px)',
      panelClass: 'side-panel-dialog',
      position: { right: '0', top: '64px' },
      data: {
        contractId: this.contractId,
        reactiveTestId: effectiveReactiveTestId
      }
    });
  }

  /**
   * Sync confirmatory form values back to underlying ConfirmatoryOverrideTestData before rebuilding forms
   * This prevents data loss when forms are recreated (e.g., when adding new rows)
   * Only syncs if form count matches data count (prevents syncing after programmatic data changes)
   * @param force If true, sync all forms even if counts don't match (used before save)
   */
  private syncConfirmatoryFormsToData(force: boolean = false): void {
    const override = this.currentCustomerOverride();
    if (!override) return;

    // Only sync if the number of forms matches the number of tests
    // If they don't match, it means the data was just modified programmatically (e.g., new row added)
    // and we shouldn't sync the old forms to the new data structure
    // Exception: if force=true (called before save), sync what we can
    if (!force && this.confirmatoryRowForms.size !== override.confirmatoryTests.length) {
      return;
    }

    const updatedTests = override.confirmatoryTests.map((test, index) => {
      const form = this.confirmatoryRowForms.get(index);
      if (!form) return test;

      const formValue = form.getRawValue();
      return {
        ...test,
        testId: formValue.testId || test.testId,
        description: formValue.description || test.description,
        effectiveDate: formValue.effectiveDate ? moment(formValue.effectiveDate).format('YYYY-MM-DDTHH:mm:ss') : test.effectiveDate,
        terminationDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DDTHH:mm:ss') : test.terminationDate
      };
    });

    // Update the customer override with synced confirmatory tests
    const updated = this.customerOverrides().map(co => {
      if (co.reactiveTestId === override.reactiveTestId && co.result === override.result) {
        return { ...co, confirmatoryTests: updatedTests };
      }
      return co;
    });
    this.customerOverrides.set(updated);
  }

  private rebuildConfirmatoryRowForms(): void {
    // Sync current form values to data before clearing forms
    this.syncConfirmatoryFormsToData();

    this.confirmatoryRowForms.clear();
    this.confirmatoryLastChanged.clear();
    this.confirmatoryEffMatchers.clear();
    this.confirmatoryTermMatchers.clear();
    const tests = this.currentConfirmatoryTests();
    tests.forEach((test, index) => {
      this.confirmatoryRowForms.set(index, this.createConfirmatoryTestForm(test, index));
    });
  }

  private createConfirmatoryTestForm(test: ConfirmatoryOverrideTestData, index: number): FormGroup {
    const form = this.fb.group({
      testId: [test.testId, [Validators.required]],
      description: [{ value: test.description, disabled: true }],
      effectiveDate: [test.effectiveDate ? moment(test.effectiveDate) : null, [Validators.required]],
      terminationDate: [test.terminationDate ? moment(test.terminationDate) : null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')
      ]
    });

    if (test.isNew) {
      DateFieldValidationUtility.setupAddModeValidators(form, this.headerService.chapterTimeZone());
    }

    form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.confirmatoryLastChanged.set(index, 'effective');
        form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
        form.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.confirmatoryLastChanged.set(index, 'termination');
        form.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    return form;
  }

  // ── Save ────────────────────────────────────────────────────────

  /**
   * Public method to sync all form data to underlying signals before save
   * Called by parent component before building the DTO
   * This ensures all currently visible form data is persisted to the signals
   */
  syncAllFormsToData(): void {
    // Force sync current profile set and current confirmatory tests
    this.syncProfileFormsToData(true);
    this.syncConfirmatoryFormsToData(true);
  }

  /**
   * Validate that confirmatory tests with reactive test ID have at least one filled confirmatory test ID
   * Per FMB gap analysis: CONFIRM_TEST_ID is Required="true"
   */
  private validateConfirmatoryTests(): { valid: boolean; error?: string } {
    for (const override of this.customerOverrides()) {
      // Filter out the first empty row (used for adding new tests)
      const filledTests = override.confirmatoryTests.filter((test, index) =>
        index !== 0 && test.testId && test.testId.trim() !== ''
      );

      // If reactive test ID is set but no filled confirmatory tests exist (excluding first empty row)
      if (override.reactiveTestId && filledTests.length === 0) {
        // Check if there are any rows beyond the first one
        if (override.confirmatoryTests.length <= 1) {
          return {
            valid: false,
            error: `Reactive Test "${override.reactiveTestId}" requires at least one confirmatory test. Please add a confirmatory test or remove the reactive test.`
          };
        }
      }
    }
    return { valid: true };
  }

  onSaveAndFinish(): void {
    const primarySet = this.profileSets().find(ps => ps.profileType === 'P' && !ps.terminationDate);
    if (primarySet && primarySet.tests.length === 0) {
      this.snackbarService.showError('Primary profile must have at least one test assigned.');
      return;
    }

    // Validate confirmatory tests
    const validation = this.validateConfirmatoryTests();
    if (!validation.valid) {
      this.snackbarService.showError(validation.error || 'Invalid confirmatory tests configuration');
      return;
    }

    this.snackbarService.showSuccess(
      `Contract Tests for Contract ID ${this.contractId} have been saved.`
    );
    this.saveAndFinish.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  formatDateTime(date: string | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY, HH:mm').toUpperCase() : '-';
  }
}
