import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule, FormArray } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import moment from 'moment';

// Angular Material imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatDialog } from '@angular/material/dialog';

import { ContractTestsComponent } from '../contract-tests/contract-tests';

// Shared components and services
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';

// Dialog components
import { RgAddressDialogComponent } from '../rg-address-dialog/rg-address-dialog';
import { ContactsDialogComponent } from '../../../../imported-blood-contract/contacts-dialog/contacts-dialog';
import { SelectChaptersDialogComponent } from '@shared/components/select-chapters-dialog/select-chapters-dialog';

// Validators
import {
  effectiveDateNotPastValidator,
  terminationAfterEffectiveValidator,
  getEffectiveDateErrorMessage,
  getTerminationDateErrorMessage
} from '@shared/validators/date.validators';

// API Service
import { RegionalTestingContractApiService } from '../../services/regional-testing-contract-api.service';

@Component({
  selector: 'app-contract-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatStepperModule,
    MatCheckboxModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    ContractTestsComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './contract-details.component.html',
  styleUrl: './contract-details.component.scss'
})
export class ContractDetailsComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `contract-details-${ContractDetailsComponent.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // View Children - Access to child components
  @ViewChild(ContractTestsComponent) contractTestsComponent?: ContractTestsComponent;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly snackbarService = inject(SnackbarService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly apiService = inject(RegionalTestingContractApiService);

  // Lifecycle
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly saving = signal<boolean>(false);
  protected readonly loading = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);
  protected readonly selectedStep = signal<number>(0);
  protected readonly contractId = signal<string | null>(null);

  // Computed values
  protected readonly today = computed(() => this.chapterTimezoneService.getChapterLocalDate()); // Use chapter timezone, not browser timezone
  protected readonly isEditMode = computed(() => this.contractId() !== null);

  // Loaded data from API
  protected readonly loadedChapters = signal<any[]>([]);
  protected readonly loadedProfiles = signal<any[]>([]);

  // Chapter validation errors
  protected readonly chapterErrors = signal<Map<number, { effDate?: string; termDate?: string }>>(new Map());

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Enter Regional Testing Contract', link: '/laboratory-functions/regional-testing-contract/enter-regional-testing-contract' },
      { label: 'Add New Contract ID', link: null }
    ],
    title: 'Add New Contract ID',
    subtitle: 'Create new contract ID and contract tests',
    showBackButton: true,
    actions: []
  };

  // Forms
  contractDetailsForm!: FormGroup;
  chaptersForm!: FormGroup;
  associatedProfileForm!: FormGroup;

  // Dropdown options - loaded from API
  protected readonly clientChapterOptions = signal<{ value: string; label: string }[]>([]);
  protected readonly checkDigitOptions = signal<{ value: string; label: string }[]>([]);
  protected readonly copyOsUnitsOptions = signal<{ value: string; label: string }[]>([]);
  protected readonly unitSchemeOptions = signal<{ value: string; label: string }[]>([]);
  protected readonly editChargesOptions = signal<{ value: string; label: string }[]>([]);
  protected readonly resultIndOptions = signal<{ value: string; label: string }[]>([]);
  protected readonly confirmatoryTestsOptions = signal<{ value: string; label: string }[]>([]);
  protected readonly reportOdOptions = signal<{ value: string; label: string }[]>([]);
  protected readonly resultsTypeOptions = signal<{ value: string; label: string }[]>([]);
  protected readonly ediInputOptions = signal<{ value: string; label: string }[]>([]);
  protected readonly duplicateCheckInOptions = signal<{ value: string; label: string }[]>([]);
  protected readonly npEfOptions = signal<{ value: string; label: string }[]>([]);

  // Address and Contacts data
  private savedAddressId = signal<number | null>(null);
  private savedAddress = signal<any>(null);
  private savedContacts = signal<any[]>([]);
  private loadedContractData = signal<any>(null); // Store original contract for fields we don't edit

  // Search controls for dropdowns
  clientChapterSearchControl = new FormControl('');
  filteredClientChapterOptions = signal<{ value: string; label: string }[]>([]);

  // Signal for client chapter description
  clientChapterDescription = signal<string>('-');

  // Computed signal for chapter datepicker start date (use contract effective date if available)
  chapterDatepickerStartDate = computed(() => {
    const contractEffDate = this.contractDetailsForm?.get('effectiveDate')?.value;
    return contractEffDate || null;
  });

  ngOnInit(): void {
    // Get contract ID from route params if editing
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('id');
        this.contractId.set(id);
        const title = id ? 'Edit Contract ID' : 'Add New Contract ID';

        // Update header config with proper breadcrumbs
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: 'Enter Regional Testing Contract', link: '/laboratory-functions/regional-testing-contract/enter-regional-testing-contract' },
            { label: title, link: null }
          ],
          title: title,
          subtitle: 'Create new contract ID and contract tests',
          showBackButton: true,
          onBackClick: this.onBackClick.bind(this),
          actions: []
        };
      });

    this.initForms();

    // Only validate effective date as "not past" for NEW contracts, not edit mode
    if (!this.isEditMode()) {
      const effectiveDateControl = this.contractDetailsForm.get('effectiveDate');
      effectiveDateControl?.setValidators([
        Validators.required,
        effectiveDateNotPastValidator(this.chapterTimezoneService)
      ]);
      effectiveDateControl?.updateValueAndValidity();
    }

    this.loadFilterOptions();
    this.setupSearchFilters();
    this.setupClientChapterListener();
    if (this.isEditMode()) {
      this.loadContractData();
    }
  }

  /**
   * Setup listener for client chapter changes to update description
   */
  private setupClientChapterListener(): void {
    this.contractDetailsForm.get('clientChapter')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: string | null) => {
        if (!value) {
          this.clientChapterDescription.set('-');
          return;
        }
        const option = this.clientChapterOptions().find(opt => opt.value === value);
        this.clientChapterDescription.set(option?.label || '-');
      });
  }

  /**
   * Handle back button click
   */
  onBackClick(): void {
    this.router.navigate(['/laboratory-functions/regional-testing-contract/enter-regional-testing-contract']);
  }

  /**
   * Load filter options from API
   */
  private loadFilterOptions(): void {
    this.loading.set(true);

    this.apiService.getFilterOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          // Load CBC Chapters (Client Chapter dropdown)
          this.clientChapterOptions.set(options.cbcChapters || []);
          this.filteredClientChapterOptions.set(options.cbcChapters || []);

          // Load Results Methods (Results Type dropdown)
          this.resultsTypeOptions.set(options.resultsMethods || []);

          // Load hardcoded Yes/No dropdowns
          const yesNoOptions = [
            { value: 'Y', label: 'Yes' },
            { value: 'N', label: 'No' }
          ];
          this.copyOsUnitsOptions.set(yesNoOptions);
          this.unitSchemeOptions.set(yesNoOptions);
          this.editChargesOptions.set(yesNoOptions);
          this.confirmatoryTestsOptions.set(yesNoOptions); // Changed from Y-only to Y/N per FMB
          this.reportOdOptions.set(yesNoOptions);
          this.ediInputOptions.set(yesNoOptions); // Changed from Y-only to Y/N per FMB
          this.duplicateCheckInOptions.set(yesNoOptions);

          // Load hardcoded dropdowns
          this.checkDigitOptions.set(yesNoOptions); // Changed from Y-only to Y/N per FMB
          this.resultIndOptions.set([
            { value: 'R', label: 'Hard Copy' },
            { value: 'B', label: 'Both' },
            { value: 'E', label: 'Electronic' }
          ]);
          this.npEfOptions.set([{ value: 'N', label: 'No' }]); // Must be N per docs

          // After options are loaded, update client chapter description if a value is already set
          const currentClientChapter = this.contractDetailsForm.get('clientChapter')?.value;
          if (currentClientChapter) {
            const option = this.clientChapterOptions().find(opt => opt.value === currentClientChapter);
            this.clientChapterDescription.set(option?.label || '-');
          }

          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading filter options:', error);
          this.snackbarService.showError('Failed to load filter options. Please try again.');
          this.loading.set(false);
        }
      });
  }

  /**
   * Setup search filters for dropdowns
   */
  private setupSearchFilters(): void {
    this.clientChapterSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchValue: string | null) => {
        const search = (searchValue || '').toLowerCase();
        const options = this.clientChapterOptions();
        if (!search) {
          this.filteredClientChapterOptions.set(options);
        } else {
          const filtered = options.filter(option =>
            option.label.toLowerCase().includes(search) ||
            option.value.toLowerCase().includes(search)
          );
          this.filteredClientChapterOptions.set(filtered);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize reactive forms
   */
  private initForms(): void {
    // Contract Details form
    this.contractDetailsForm = this.fb.group({
      // Contract Type (read-only, always 'Regular')
      contractType: [{ value: 'Regular', disabled: true }],

      // Facility Name Description - top section
      facilityNameDescription: ['', [Validators.required, Validators.maxLength(50)]], // Max 50 per FMB COMPANY field

      // Client Chapter section
      clientChapter: ['', [Validators.required]],
      checkDigit: [''],
      poNumber: ['', [Validators.maxLength(50)]],

      // Tax ID and other fields
      taxIdForm: ['', [Validators.maxLength(20), Validators.pattern(/^\d*$/)]],
      plateCapacity: [{ value: '9999', disabled: true }],
      copyOsUnits: ['', [Validators.required]], // Required per FMB (UNIT_ID_TYPE)
      unitScheme: [''],

      // Dropdowns row
      editCharges: [''],
      resultInd: [''],
      confirmatoryTests: [''],
      reportOd: [''],

      // Second row of dropdowns
      resultsType: [''],
      ediInput: [''],
      clientBloodCenterId: ['', [Validators.maxLength(50)]],
      duplicateCheckIn: [''],

      // Third row
      noOfDuplicate: [null, [Validators.min(1), Validators.max(99), Validators.pattern(/^\d*$/)]],
      npEf: [''],
      // Effective date: only validate "not past" for new contracts, not edit mode
      effectiveDate: [null, [Validators.required]],
      // Termination date: per FMB, no "past date" validation - only must be >= effective date
      terminationDate: [null]
    }, {
      validators: [terminationAfterEffectiveValidator()]
    });

    // Chapters form - this would be populated when user clicks "SELECT CHAPTERS"
    this.chaptersForm = this.fb.group({
      selectedChapters: this.fb.array([])
    });

    // Associated Profile form - read-only display
    this.associatedProfileForm = this.fb.group({
      profiles: this.fb.array([])
    });
  }

  /**
   * Load contract data for edit mode
   */
  private loadContractData(): void {
    const id = this.contractId();
    if (!id) return;

    this.loading.set(true);

    this.apiService.getContractById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contract) => {
          // Store the entire contract for reference
          this.loadedContractData.set(contract);

          // Store address data if present
          if (contract.addressId) {
            this.savedAddressId.set(contract.addressId);
          }
          if (contract.address) {
            this.savedAddress.set(contract.address);
          }

          // Map API response to form fields
          this.contractDetailsForm.patchValue({
            facilityNameDescription: contract.customerName || '',
            clientChapter: contract.chapterId || '',
            checkDigit: contract.dispChkdigitFlag || '',
            poNumber: contract.poNo || '',
            taxIdForm: contract.taxIdForm || '',
            plateCapacity: contract.plateCapacity?.toString() || '9999',
            copyOsUnits: contract.copyIsbtFlag || '',
            unitScheme: contract.unitIdType || '',
            editCharges: contract.sEditRates || '',
            resultInd: contract.resultOutputInd || '',
            confirmatoryTests: contract.confirmTestFlag || '',
            reportOd: contract.odReportingMethod || '',
            resultsType: contract.resultsMethod || '',
            ediInput: contract.ediInputInd || '',
            clientBloodCenterId: contract.cbcChapterId || '',
            duplicateCheckIn: contract.dupCheckinFlag || '',
            noOfDuplicate: contract.noOfDuplicates || 0,
            npEf: contract.nonProfileEf || '',
            effectiveDate: contract.effDate ? this.parseApiDate(contract.effDate) : null,
            terminationDate: contract.termDate ? this.parseApiDate(contract.termDate) : null
          });

          // Load linked chapters if available
          if (contract.chapters && contract.chapters.length > 0) {
            const chaptersArray = this.chaptersForm.get('selectedChapters') as FormArray;
            chaptersArray.clear();

            // Map chapters for display
            const chaptersData = contract.chapters.map(chapter => ({
              chapterId: chapter.chapterId,
              chapterName: chapter.chapterId, // TODO: Get actual chapter name from lookup
              effectiveDate: chapter.effDate ? new Date(chapter.effDate) : null, // Use Date object for datepicker
              terminationDate: chapter.termDate ? new Date(chapter.termDate) : null // Use Date object for datepicker
            }));
            this.loadedChapters.set(chaptersData);

            // Add to form array
            contract.chapters.forEach(chapter => {
              chaptersArray.push(this.fb.control(chapter.chapterId));
            });
          } else {
            this.loadedChapters.set([]);
          }

          // Load profiles if available
          if (contract.profiles && contract.profiles.length > 0) {
            const profilesArray = this.associatedProfileForm.get('profiles') as FormArray;
            profilesArray.clear();

            // Map profiles for display
            const profilesData = contract.profiles.map(profile => ({
              profileSetId: profile.profileSetId,
              type: this.getProfileTypeLabel(profile.profileType),
              sequence: profile.profileSetId.split('-').pop() || '0' // Extract sequence from ID
            }));
            this.loadedProfiles.set(profilesData);

            // Add to form array
            contract.profiles.forEach(profile => {
              profilesArray.push(this.fb.group({
                profileType: [profile.profileType],
                profileSetId: [profile.profileSetId],
                effDate: [this.parseApiDate(profile.effDate)],
                termDate: [profile.termDate ? this.parseApiDate(profile.termDate) : null]
              }));
            });
          } else {
            this.loadedProfiles.set([]);
          }

          // TODO: Load confirmatory tests when UI is available
          // contract.confirmTests

          // TODO: Load contacts when UI is available
          // contract.contacts

          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading contract data:', error);
          this.snackbarService.showError('Failed to load contract data. Please try again.');
          this.loading.set(false);
        }
      });
  }

  /**
   * Parse API date string to Date object for Angular Material datepicker
   */
  private parseApiDate(dateString: string): Date | null {
    if (!dateString) return null;
    const m = moment(dateString);
    return m.isValid() ? m.toDate() : null;
  }

  /**
   * Get profile type label from code
   */
  private getProfileTypeLabel(code: string): string {
    const typeMap: Record<string, string> = {
      'P': 'Primary',
      'A': 'Ad Hoc',
      'S': 'Secondary'
    };
    return typeMap[code] || code;
  }

  /**
   * Get form controls
   */
  get f() {
    return this.contractDetailsForm.controls;
  }

  /**
   * Get effective date error message
   */
  getEffectiveDateError(): string {
    return getEffectiveDateErrorMessage(
      this.contractDetailsForm.get('effectiveDate'),
      this.contractDetailsForm.errors
    );
  }

  /**
   * Get termination date error message
   */
  getTerminationDateError(): string {
    return getTerminationDateErrorMessage(
      this.contractDetailsForm.get('terminationDate'),
      this.contractDetailsForm.errors
    );
  }

  /**
   * Handle date change events (for validation)
   */
  onEffectiveDateChange(): void {
    this.contractDetailsForm.get('terminationDate')?.updateValueAndValidity();
    this.contractDetailsForm.get('effectiveDate')?.markAsTouched();
  }

  onTerminationDateChange(): void {
    this.contractDetailsForm.get('terminationDate')?.markAsTouched();
  }

  /**
   * Open chapter selection dialog
   */
  openChapterSelection(): void {
    // Load available chapters from API first
    this.apiService.getChaptersLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (availableChapters) => {
          // Map API response to dialog format
          const availableChaptersForDialog = availableChapters.map(c => ({
            chapterId: c.chapterId,
            chapterName: c.chapterName,
            selected: false,
            effectiveDate: undefined,
            terminationDate: null
          }));

          const dialogRef = this.dialog.open(SelectChaptersDialogComponent, {
            width: '700px',
            height: 'calc(100vh - 64px)',
            maxWidth: '100vw',
            maxHeight: 'calc(100vh - 64px)',
            position: { right: '0', top: '64px' },
            panelClass: 'code-dialog-panel-right',
            hasBackdrop: true,
            backdropClass: 'code-dialog-backdrop',
            disableClose: true,
            data: {
              contractId: this.contractId() || 'new',
              availableChapters: availableChaptersForDialog,
              selectedChapters: this.loadedChapters().map(c => ({
                chapterId: c.chapterId,
                chapterName: c.chapterName,
                selected: true,
                effectiveDate: c.effectiveDate,
                terminationDate: c.terminationDate
              }))
            }
          });

          dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(result => {
              if (result && Array.isArray(result)) {
                // Get contract effective date for new chapters
                // Use contract's effective date - if not set, leave it empty for user to fill
                const contractEffDate = this.contractDetailsForm.get('effectiveDate')?.value;
                const defaultEffDate = contractEffDate
                  ? moment(contractEffDate).format('DD-MMM-YYYY').toUpperCase()
                  : null;

                // Update the chapters table with selected chapters
                const chaptersData = result.map(chapter => ({
                  chapterId: chapter.chapterId,
                  chapterName: chapter.chapterName,
                  effectiveDate: chapter.effectiveDate || defaultEffDate,
                  terminationDate: chapter.terminationDate || null
                }));
                this.loadedChapters.set(chaptersData);

                // Also update the chaptersForm FormArray
                const chaptersFormArray = this.chaptersForm.get('selectedChapters') as FormArray;
                chaptersFormArray.clear();
                chaptersData.forEach(chapter => {
                  chaptersFormArray.push(this.fb.control(chapter.chapterId));
                });

                this.snackbarService.showSuccess('Chapters updated successfully');
              }
            });
        },
        error: (error) => {
          console.error('Error loading available chapters:', error);
          this.snackbarService.showError('Failed to load available chapters. Please try again.');
        }
      });
  }

  /**
   * Open Address Details dialog
   */
  openAddressDialog(): void {
    const dialogRef = this.dialog.open(RgAddressDialogComponent, {
      width: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'code-dialog-panel-right',
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      disableClose: true,
      data: {
        address: this.savedAddress(), // Pass existing address data if editing
        contractId: this.contractId() || 'new'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          // Store the full address object for later save
          this.savedAddress.set(result);
          // Store the addressId if it exists (edit mode)
          if (result.addressId) {
            this.savedAddressId.set(result.addressId);
          }
        }
      });
  }

  /**
   * Open Contacts Information dialog
   */
  openContactsDialog(): void {
    const dialogRef = this.dialog.open(ContactsDialogComponent, {
      width: '800px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'code-dialog-panel-right',
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      disableClose: true,
      data: {
        contractId: this.contractId() || 'new'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.snackbarService.showSuccess('Contacts saved');
          // Handle the saved contacts data
        }
      });
  }

  /**
   * Save and Exit
   */
  onSaveAndExit(): void {
    this.submitted.set(true);

    if (this.contractDetailsForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      this.snackbarService.showError('Please fill in all required fields');
      return;
    }

    this.saving.set(true);

    // Sync all form data to signals before building DTO
    if (this.contractTestsComponent) {
      this.contractTestsComponent.syncAllFormsToData();
    }

    const formValue = this.contractDetailsForm.getRawValue();
    const dto = this.buildContractDto(formValue);

    const saveObservable = this.isEditMode()
      ? this.apiService.updateContract(this.contractId()!, dto)
      : this.apiService.createContract(dto);

    saveObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const contractId = response?.contractId || this.contractId();
          this.snackbarService.showSuccess(`Contract ${contractId} saved successfully`);
          this.saving.set(false);
          // Navigate back to list
          this.router.navigate(['/laboratory-functions/regional-testing-contract/enter-regional-testing-contract']);
        },
        error: (error) => {
          const errorMessage = error.error?.message || error.message || 'Failed to save contract. Please try again.';
          this.snackbarService.showError(errorMessage);
          this.saving.set(false);
        }
      });
  }

  /**
   * Save and Next (go to Contract Tests step)
   */
  onSaveAndNext(): void {
    this.submitted.set(true);
    this.contractDetailsForm.markAllAsTouched();

    if (this.contractDetailsForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      this.snackbarService.showError('Please fix all validation errors before proceeding');
      return;
    }

    // Just validate and move to next step - don't call API yet
    this.selectedStep.set(1);
  }

  /**
   * Save and Finish from Step 2 (Contract Tests)
   */
  onSaveAndFinishFromStep2(): void {
    this.saving.set(true);

    // Sync all form data to signals before building DTO
    if (this.contractTestsComponent) {
      this.contractTestsComponent.syncAllFormsToData();
    }

    // Build the contract DTO with all data from both steps
    const formValue = this.contractDetailsForm.value;
    const dto = this.buildContractDto(formValue);

    const saveObservable = this.isEditMode()
      ? this.apiService.updateContract(this.contractId()!, dto)
      : this.apiService.createContract(dto);

    saveObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Contract save response:', response);
          const contractId = response?.contractId || this.contractId();
          this.snackbarService.showSuccess(`Contract ${contractId} saved successfully`);
          this.saving.set(false);
          this.router.navigate(['/laboratory-functions/regional-testing-contract/enter-regional-testing-contract']);
        },
        error: (error) => {
          console.error('Error saving contract:', error);
          const errorMessage = error.error?.message || error.message || 'Failed to save contract. Please try again.';
          this.snackbarService.showError(errorMessage);
          this.saving.set(false);
        }
      });
  }

  /**
   * Build Contract DTO from form values - matches new API structure
   */
  private buildContractDto(formValue: any): any {
    const dto: any = {
      // Contract ID (null for new, set for edit)
      contractId: this.isEditMode() ? this.contractId() : null,

      // Required fields
      contractType: 'RG', // Regional Testing Contract type (must match API format)
      chapterId: formValue.clientChapter || null, // Primary chapter ID (required)
      customerName: formValue.facilityNameDescription,
      customerId: formValue.clientBloodCenterId || null,
      exportCode: null,
      agreementDate: null,
      effDate: formValue.effectiveDate ? this.formatDateForApiWithTime(formValue.effectiveDate) : null,
      termDate: formValue.terminationDate ? this.formatDateForApiWithTime(formValue.terminationDate) : null,

      // Address - top-level addressId should match address.addressId
      // For new addresses, backend will generate ID and return it
      addressId: this.savedAddress()?.addressId || null,
      address: this.savedAddress() || null,

      // Required flags with defaults
      sTermFlag: 'Y',
      altELevel: null,
      dispChkdigitFlag: formValue.checkDigit || 'Y',
      taxIdForm: formValue.taxIdForm || null,
      unitIdType: formValue.copyOsUnits || 'Y',
      sEditRates: formValue.editCharges || null,
      resultOutputInd: formValue.resultInd || 'R',
      confirmTestFlag: formValue.confirmatoryTests || 'Y',
      odReportingMethod: formValue.reportOd || null,
      ediInputInd: formValue.ediInput || 'Y',
      barCodeProtocol: this.isEditMode() ? this.loadedContractData()?.barCodeProtocol : null,
      copyIsbtFlag: formValue.copyOsUnits || 'Y',
      noOfDuplicates: formValue.noOfDuplicate || null,
      nonProfileEf: formValue.npEf || 'N',
      contactType: 'C', // C=Contract, I=Institution (API error code 5161 if not C or I)
      cbcChapterId: formValue.clientChapter || null,
      altSeLevel: null,
      poNo: formValue.poNumber || null,
      plateCapacity: 9999,
      unitIdPattern: null,
      resultsMethod: formValue.resultsType || null,
      centerId: formValue.clientBloodCenterId || null,
      dupCheckinFlag: formValue.duplicateCheckIn || null,
      profileSeqNo: 0,

      // Child entities
      chapters: this.loadedChapters().map(ch => ({
        chapterId: ch.chapterId,
        effDate: ch.effectiveDate ? this.formatDateForApiWithTime(ch.effectiveDate) : null,
        termDate: ch.terminationDate ? this.formatDateForApiWithTime(ch.terminationDate) : null
      })),

      // Profile sets - from Contract Tests component (step 2)
      // Only include profile sets that have a profileType selected
      profiles: this.contractTestsComponent ? this.contractTestsComponent.profileSets()
        .filter(ps => ps.profileType !== null)
        .map(ps => ({
          profileType: ps.profileType,
          profileSetId: ps.profileSetId,
          effDate: ps.effectiveDate ? this.formatDateForApiWithTime(ps.effectiveDate) : null,
          termDate: ps.terminationDate ? this.formatDateForApiWithTime(ps.terminationDate) : null
        })) : [],

      // Contract Tests (profile tests) - from Contract Tests component (step 2)
      // Each test needs profileSetId to link it to a profile set
      // Only include tests from profile sets that have a profileType selected
      contractTests: this.contractTestsComponent ? (() => {
        const profileSets = this.contractTestsComponent.profileSets();

        const contractTests = profileSets
          .filter(ps => ps.profileType !== null) // Only include valid profile sets
          .flatMap(ps => {
            const filledTests = ps.tests.filter(test => test.testId && test.testId.trim() !== '');
            return filledTests.map(test => ({
              testId: test.testId,
              profileSetId: ps.profileSetId,
              interfaceColumn: test.width ?? null,
              interfaceLength: test.length ?? null,
              stopLabelFlag: test.required || 'N',
              extract: test.extract || 'N',
              electronicFileFlag: test.electronicFile || 'N',
              effDate: test.effectiveDate ? this.formatDateForApiWithTime(test.effectiveDate) : null,
              termDate: test.terminationDate ? this.formatDateForApiWithTime(test.terminationDate) : null
            }));
          });

        return contractTests;
      })() : [],

      // Confirmatory tests - from Contract Tests component (step 2)
      // Structure: reactiveTestId, reactiveTestResult, reactivePlateSeq, confirmTestId, effDate, termDate
      confirmTests: this.contractTestsComponent ? (() => {
        const overrides = this.contractTestsComponent.customerOverrides();
        const confirmTests = overrides.flatMap(override => {
          const filledTests = override.confirmatoryTests
            .filter(test => test.testId && test.testId.trim() !== '');
          return filledTests.map(test => ({
            reactiveTestId: override.reactiveTestId,
            reactiveTestResult: override.result, // From GET /reactive-test-results/{testId}/lookup
            reactivePlateSeq: override.plateSequence === 'R' ? 1 : 0, // R = Repeat (1), I = Initial (0)
            confirmTestId: test.testId,
            effDate: test.effectiveDate ? this.formatDateForApiWithTime(test.effectiveDate) : null,
            termDate: test.terminationDate ? this.formatDateForApiWithTime(test.terminationDate) : null
          }));
        });
        return confirmTests;
      })() : [],

      // Contacts - TODO: Add from contacts dialog
      contacts: [],

      // Non-profile tests - from Contract Tests component (step 2)
      // SIMPLIFIED structure: testId, testGroup, effDate, termDate
      nonProfileTests: this.contractTestsComponent ? this.contractTestsComponent.nonProfileTests().map(test => ({
        testId: test.testId,
        testGroup: 'MANUAL', // TODO: Get actual test group from test lookup when available
        effDate: test.effectiveDate ? this.formatDateForApiWithTime(test.effectiveDate) : null,
        termDate: test.terminationDate ? this.formatDateForApiWithTime(test.terminationDate) : null
      })) : []
    };

    return dto;
  }

  /**
   * Format date for API with time component (YYYY-MM-DDTHH:mm:ssZ)
   */
  private formatDateForApiWithTime(date: any): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('YYYY-MM-DDTHH:mm:ss') + 'Z' : '';
  }

  /**
   * Format date for API (YYYY-MM-DD format)
   */
  private formatDateForApi(date: any): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('YYYY-MM-DD') : '';
  }

  /**
   * Cancel and go back to landing screen
   */
  onCancel(): void {
    this.router.navigate(['/laboratory-functions/regional-testing-contract/enter-regional-testing-contract']);
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  /**
   * Scroll to a section when clicking sidebar navigation
   */
  scrollToSection(sectionId: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      // Update active link
      const links = document.querySelectorAll('.sidebar-link');
      links.forEach(link => link.classList.remove('active'));
      if (event?.target) {
        (event.target as HTMLElement).classList.add('active');
      }
    }
  }

  /**
   * Validate chapter effective date
   */
  validateChapterEffectiveDate(chapterIndex: number, date: any): void {
    const errors = new Map(this.chapterErrors());
    const chapterErrors = errors.get(chapterIndex) || {};

    if (!date) {
      chapterErrors.effDate = 'Effective date is required';
    } else {
      const effectiveDate = moment(date);
      if (!effectiveDate.isValid()) {
        chapterErrors.effDate = 'Invalid date';
      } else {
        // Check if date is in the past (per FMB: always validate, not just for new contracts)
        const today = this.chapterTimezoneService.getChapterLocalDate();
        if (effectiveDate.isBefore(today, 'day')) {
          chapterErrors.effDate = 'Effective date cannot be in the past';
        } else {
          delete chapterErrors.effDate;
        }
      }
    }

    errors.set(chapterIndex, chapterErrors);
    this.chapterErrors.set(errors);
  }

  /**
   * Validate chapter termination date
   */
  validateChapterTerminationDate(chapterIndex: number, effDate: any, termDate: any): void {
    const errors = new Map(this.chapterErrors());
    const chapterErrors = errors.get(chapterIndex) || {};

    if (termDate) {
      const effectiveDate = moment(effDate);
      const terminationDate = moment(termDate);

      if (!terminationDate.isValid()) {
        chapterErrors.termDate = 'Invalid date';
      } else if (!effectiveDate.isValid()) {
        chapterErrors.termDate = 'Set effective date first';
      } else if (terminationDate.isBefore(effectiveDate, 'day')) {
        chapterErrors.termDate = 'Termination date must be after effective date';
      } else {
        // Per FMB: No validation for past termination dates (allows retroactive termination)
        delete chapterErrors.termDate;
      }
    } else {
      delete chapterErrors.termDate;
    }

    errors.set(chapterIndex, chapterErrors);
    this.chapterErrors.set(errors);
  }

  /**
   * Get error message for chapter field
   */
  getChapterError(chapterIndex: number, field: 'effDate' | 'termDate'): string | undefined {
    return this.chapterErrors().get(chapterIndex)?.[field];
  }

  /**
   * Check if chapter has errors
   */
  hasChapterError(chapterIndex: number, field: 'effDate' | 'termDate'): boolean {
    return !!this.chapterErrors().get(chapterIndex)?.[field];
  }
}
