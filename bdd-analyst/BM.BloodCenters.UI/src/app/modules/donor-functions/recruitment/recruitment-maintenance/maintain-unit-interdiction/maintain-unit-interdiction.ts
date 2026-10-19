import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, ErrorStateMatcher } from '@angular/material/core';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';

import {
  DonorInfo,
  UnitInterdiction,
  UnitInterdictionFilterValue,
  SearchOption,
  SearchParams,
  InterdictionCode,
  TerminationReason
} from './models/unit-interdiction.model';
import { UnitInterdictionService } from './services/unit-interdiction.service';
import { UnitInterdictionFilterChipsUtils } from './utils/unit-interdiction-filter-chips.utils';
import { UnitInterdictionFilterPanelComponent } from './filter-panel/unit-interdiction-filter-panel';
import { InterdictionsTableComponent, InterdictionTableAction } from './interdictions-table/interdictions-table';
import { AddEditInterdictionComponent, AddEditInterdictionDialogData } from './add-edit-interdiction/add-edit-interdiction';
import { TerminateInterdictionComponent, TerminateInterdictionDialogData } from './terminate-interdiction/terminate-interdiction';
import { LoginService } from '@shared/services/login.service';
import { HeaderService } from '@shared/services/header.service';
import { normalizeDeferralId } from '@shared/utils/deferral-id.util';

@Component({
  selector: 'app-maintain-unit-interdiction',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips,
    InterdictionsTableComponent,
    UnitIdFieldComponent
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './maintain-unit-interdiction.html',
  styleUrls: ['./maintain-unit-interdiction.scss']
})
export class MaintainUnitInterdictionComponent implements OnInit, OnDestroy {
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild('collectionDateInput', { read: ElementRef }) collectionDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private fb = inject(FormBuilder);
  private service = inject(UnitInterdictionService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private overlay = inject(Overlay);
  private loginService = inject(LoginService);
  private headerService = inject(HeaderService);
  private dateAdapter = inject(DateAdapter);
  private destroy$ = new Subject<void>();

  private currentUserId = '';

  headerConfig!: PageHeaderConfig;
  searchForm!: FormGroup;
  searchOptions: SearchOption[] = [];
  filteredSearchOptions: SearchOption[] = [];
  optionSearchControl = new FormControl('');
  interdictionCodes: InterdictionCode[] = [];
  terminationReasons: TerminationReason[] = [];

  searchBarConfig: SearchBarConfig = {
    placeholder: 'Search by code or description',
    minLength: 2,
    ariaLabel: 'Search by code or description',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  // Signals
  donorInfo = signal<DonorInfo | null>(null);
  interdictions = signal<UnitInterdiction[]>([]);
  isLoading = signal<boolean>(false);
  isRetrieving = signal<boolean>(false);
  hasSearched = signal<boolean>(false);
  showTerminated = signal<boolean>(false);
  currentTransactionId = signal<string>('');
  searchErrorMessage = signal<string>('');
  terminatedInterdictionCount = signal<number>(0);
  highlightedInterdiction = signal<UnitInterdiction | null>(null);
  deferralIdInputType = signal<'password' | 'text'>('text'); // For concealment during entry

  // Computed: Show empty state when no search or no donation found
  get shouldShowEmptyState(): boolean {
    return !this.hasSearched() || (this.hasSearched() && !this.donorInfo());
  }

  get emptyStateTitle(): string {
    if (!this.hasSearched()) {
      return 'No Search Criteria Selected';
    }
    return this.searchErrorMessage() || 'No donation found matching the search criteria';
  }

  // Collection Date ErrorStateMatcher
  collectionDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      return (control.touched || control.dirty) && !!this.getCollectionDateError();
    }
  };

  // Filter state
  appliedFilters = signal<UnitInterdictionFilterValue | null>(null);
  filterChips = signal<FilterChip[]>([]);
  searchText = '';

  // Pagination
  pageSize = 25;
  pageIndex = 0;
  totalRecords = 0;

  // Store full dataset for client-side filtering/sorting
  private allInterdictions: UnitInterdiction[] = [];
  private currentSort: Sort = { active: '', direction: '' };

  // Overlay
  private filterOverlayRef: OverlayRef | null = null;

  async ngOnInit(): Promise<void> {
    this.initializeHeader();
    this.initializeSearchForm();
    this.loadSearchOptions();
    this.loadInterdictionCodes();
    this.loadTerminationReasons();
    this.setupOptionSearch();
    await this.loadCurrentUser();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset to initial state when chapter changes
        this.resetViewState();

        // Reset search form to initial state
        this.searchForm.reset();
        this.searchForm.get('option')?.setValue('');

        // Reload dropdown data for new chapter
        this.loadSearchOptions();
        this.loadInterdictionCodes();
        this.loadTerminationReasons();
      });
  }

  private async loadCurrentUser(): Promise<void> {
    // Get username from LoginService (stored in cookie)
    this.currentUserId = this.loginService.getStoredUsername();

    if (!this.currentUserId) {
      this.currentUserId = 'UNKNOWN';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.filterOverlayRef?.dispose();
  }

  private initializeHeader(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Maintain Unit Interdiction', link: null }
      ],
      title: 'Maintain Unit Interdiction',
      subtitle: 'Manage unit interdictions by placing new restrictions or terminating existing ones to ensure compliance, safety, and accurate unit eligibility.'
    };
  }

  private initializeSearchForm(): void {
    this.searchForm = this.fb.group({
      option: ['', Validators.required],
      collectionDate: [{ value: null, disabled: true }], // No longer required - auto-populated
      deferralId: [{ value: '', disabled: true }],
      transactionId: [{ value: '', disabled: true }, Validators.maxLength(10)]
    });

    // Handle option changes to enable/disable fields
    this.searchForm.get('option')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(option => {
        this.handleOptionChange(option);
      });
  }

  private handleOptionChange(option: string): void {
    const collectionDateControl = this.searchForm.get('collectionDate');
    const deferralIdControl = this.searchForm.get('deferralId');
    const transactionIdControl = this.searchForm.get('transactionId');

    // Reset view to initial state when option changes
    this.resetViewState();

    if (option === 'N') {
      // Donation mode: Enable Unit ID field component
      // Collection Date is auto-populated (no longer required as validation)
      collectionDateControl?.clearValidators(); // Removed required validator
      deferralIdControl?.clearValidators();
      transactionIdControl?.clearValidators();

      collectionDateControl?.enable();
      deferralIdControl?.disable();
      transactionIdControl?.disable();

      // Clear disabled field values
      deferralIdControl?.setValue('');
      transactionIdControl?.setValue('');

      // Reset validation state to prevent error messages from showing
      collectionDateControl?.markAsUntouched();
      collectionDateControl?.markAsPristine();
      deferralIdControl?.markAsUntouched();
      deferralIdControl?.markAsPristine();
      transactionIdControl?.markAsUntouched();
      transactionIdControl?.markAsPristine();

      collectionDateControl?.updateValueAndValidity();
      deferralIdControl?.updateValueAndValidity();
      transactionIdControl?.updateValueAndValidity();
    } else if (option === 'D') {
      // Deferral mode: Enable Deferral ID and Transaction ID (at least one required)
      // Deferral ID pattern: C########C or c########c or ########
      collectionDateControl?.clearValidators();
      deferralIdControl?.setValidators([Validators.pattern(/^([Cc]\d{8}[Cc]|\d{8})$/)]);
      transactionIdControl?.setValidators([Validators.maxLength(10)]);

      deferralIdControl?.enable();
      transactionIdControl?.enable();

      // Clear the unit ID field component
      if (this.unitIdField) {
        this.unitIdField.clear();
      }

      collectionDateControl?.disable();

      // Clear disabled field values
      collectionDateControl?.setValue(null);

      // Reset validation state to prevent error messages from showing
      collectionDateControl?.markAsUntouched();
      collectionDateControl?.markAsPristine();
      deferralIdControl?.markAsUntouched();
      deferralIdControl?.markAsPristine();
      transactionIdControl?.markAsUntouched();
      transactionIdControl?.markAsPristine();

      collectionDateControl?.updateValueAndValidity();
      deferralIdControl?.updateValueAndValidity();
      transactionIdControl?.updateValueAndValidity();
    } else {
      // No option selected: Clear unit ID and disable all form fields
      if (this.unitIdField) {
        this.unitIdField.clear();
      }
      collectionDateControl?.disable();
      deferralIdControl?.disable();
      transactionIdControl?.disable();
    }
  }

  private resetViewState(): void {
    // Close filter overlay if open
    if (this.filterOverlayRef) {
      this.filterOverlayRef.dispose();
      this.filterOverlayRef = null;
    }

    // Reset all view state to initial empty state
    this.donorInfo.set(null);
    this.hasSearched.set(false);
    this.currentTransactionId.set('');
    this.searchErrorMessage.set('');
    this.terminatedInterdictionCount.set(0);
    this.allInterdictions = [];
    this.interdictions.set([]);
    this.totalRecords = 0;
    this.pageIndex = 0;
    this.searchText = '';
    this.appliedFilters.set(null);
    this.filterChips.set([]);
    this.showTerminated.set(false);
    this.currentSort = { active: '', direction: '' };
    this.optionSearchControl.setValue('');
  }

  get isFormValid(): boolean {
    const option = this.searchForm.get('option')?.value;

    if (!option) {
      return false;
    }

    if (option === 'N') {
      // For Donation mode: Only Unit ID is required
      // Collection Date is auto-populated (not required for form validation)
      const isUnitIdValid = this.unitIdField?.isValid ?? false;
      return !!isUnitIdValid;
    } else if (option === 'D') {
      // For Deferral mode: At least one of Deferral ID or Transaction ID required
      const deferralId = this.searchForm.get('deferralId')?.value;
      const transactionId = this.searchForm.get('transactionId')?.value;
      return !!(deferralId || transactionId);
    }

    return false;
  }

  private loadSearchOptions(): void {
    this.service.getSearchOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.searchOptions = options;
          this.filteredSearchOptions = options;
        },
        error: () => {
          this.showError('Failed to load search options');
        }
      });
  }

  private loadInterdictionCodes(): void {
    this.service.getInterdictionCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.interdictionCodes = codes;
        },
        error: () => {
          this.showError('Failed to load interdiction codes');
        }
      });
  }

  private loadTerminationReasons(): void {
    this.service.getTerminationReasons()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reasons) => {
          this.terminationReasons = reasons;
        },
        error: () => {
          this.showError('Failed to load termination reasons');
        }
      });
  }

  private setupOptionSearch(): void {
    this.optionSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterOptions();
      });
  }

  private filterOptions(): void {
    const searchTerm = (this.optionSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredSearchOptions = this.searchOptions;
    } else {
      this.filteredSearchOptions = this.searchOptions.filter(option =>
        (option.value?.toLowerCase() || '').includes(searchTerm) ||
        (option.label?.toLowerCase() || '').includes(searchTerm)
      );
    }
  }

  /**
   * Auto-populate Collection Date and Transaction ID when Unit ID is validated
   */
  onUnitIdValidated(validationResponse: UnitValidationResponse): void {
    // Auto-fetch collection date and transaction ID for Unit ID
    // Backend now returns most recent donation when collectionDate is omitted
    const params: SearchParams = {
      option: 'N',
      unitId: validationResponse.parsedUnitId,
      collectionDate: undefined, // Omit to get most recent donation
      deferralId: undefined,
      transactionId: undefined,
      chapterId: this.headerService.getCurrentChapterId() || '',
      userId: this.currentUserId
    };

    this.isLoading.set(true);

    this.service.searchDonation(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success && response.item) {
          // Auto-populate collection date and transaction ID from the most recent donation
          const collectionDate = moment(response.item.collectionDate);
          this.searchForm.patchValue({
            collectionDate: collectionDate,
            transactionId: response.item.transactionId
          }, { emitEvent: false });

          // Store transaction ID (will be used when user clicks RETRIEVE)
          this.currentTransactionId.set(response.item.transactionId);

          this.isLoading.set(false);
        } else {
          // No donation found or error
          const errorMessage = response.errorResponse?.error || response.message || 'No donation found for this Unit ID';
          this.showError(errorMessage);
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.showError('Failed to retrieve collection date for Unit ID');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Clear auto-populated fields when Unit ID is cleared
   */
  onUnitIdCleared(): void {
    this.searchForm.patchValue({
      collectionDate: null,
      transactionId: ''
    }, { emitEvent: false });
    this.currentTransactionId.set('');
  }

  /**
   * Conceal deferral ID when user starts typing (CONCEAL_DATA = PROPERTY_TRUE)
   * Added per Oracle Forms PRE-TEXT-ITEM trigger (IM 9778 - Kishore 11/05/2013)
   */
  onDeferralIdFocus(): void {
    // Mask input during entry (like password field)
    this.deferralIdInputType.set('password');
  }

  /**
   * Auto-populate Collection Date and Transaction ID when Deferral ID is entered
   * Also reveals and normalizes the text after validation
   *
   * Oracle Forms behavior:
   * 1. PRE-TEXT-ITEM: CONCEAL_DATA = PROPERTY_TRUE (masks input during typing)
   * 2. POST-TEXT-ITEM: CONCEAL_DATA = PROPERTY_FALSE (reveals normalized value)
   * 3. Normalization: C12345678C → 12345678 (removes prefix/suffix 'C')
   */
  onDeferralIdBlur(): void {
    // Reveal text after user finishes typing (POST-TEXT-ITEM trigger)
    this.deferralIdInputType.set('text');

    const deferralIdControl = this.searchForm.get('deferralId');
    const deferralIdValue = deferralIdControl?.value?.trim();

    // Only auto-fetch if deferral ID is valid and in Deferral mode
    if (!deferralIdValue || this.searchForm.get('option')?.value !== 'D') {
      return;
    }

    // Check if deferral ID matches the expected pattern
    if (deferralIdControl?.hasError('pattern')) {
      return; // Don't auto-fetch for invalid format
    }

    // Normalize deferral ID (converts C########C to ########)
    const normalizedDeferralId = normalizeDeferralId(deferralIdValue);
    if (!normalizedDeferralId) {
      return;
    }

    const params: SearchParams = {
      option: 'D',
      unitId: undefined,
      collectionDate: undefined,
      deferralId: normalizedDeferralId,
      transactionId: undefined,
      chapterId: this.headerService.getCurrentChapterId() || '',
      userId: this.currentUserId
    };

    this.isLoading.set(true);

    this.service.searchDonation(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success && response.item) {
          // Auto-populate collection date (read-only in Deferral mode)
          const collectionDate = moment(response.item.collectionDate);
          this.searchForm.patchValue({
            deferralId: normalizedDeferralId, // Update field with normalized value (removes 'C' prefix/suffix)
            collectionDate: collectionDate,
            transactionId: response.item.transactionId
          }, { emitEvent: false });

          // Store transaction ID
          this.currentTransactionId.set(response.item.transactionId);

          this.isLoading.set(false);
        } else {
          // No donation found or error
          const errorMessage = response.errorResponse?.error || response.message || 'No donation found for this Deferral ID';
          this.showError(errorMessage);
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.showError('Failed to retrieve collection date for Deferral ID');
        this.isLoading.set(false);
      }
    });
  }

  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.searchForm.controls)
      .find(key => this.searchForm.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }

  onRetrieve(): void {
    if (!this.isFormValid) {
      this.searchForm.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    // Reset table state before new search
    this.showTerminated.set(false);
    this.searchText = '';
    this.pageIndex = 0;
    this.appliedFilters.set(null);
    this.filterChips.set([]);
    this.currentSort = { active: '', direction: '' };

    const formValue = this.searchForm.value;
    this.isLoading.set(true);
    this.isRetrieving.set(true);

    // Normalize deferral ID if present (converts C########C to ########)
    let normalizedDeferralId: string | undefined;
    if (formValue.deferralId) {
      const normalized = normalizeDeferralId(formValue.deferralId);
      normalizedDeferralId = normalized || undefined;
    }

    const params: SearchParams = {
      option: formValue.option,
      unitId: this.unitIdField?.parsedUnitId || undefined,
      collectionDate: formValue.collectionDate
        ? this.formatDateForApiISO(formValue.collectionDate)
        : undefined,
      deferralId: normalizedDeferralId,
      transactionId: formValue.transactionId || undefined,
      chapterId: this.headerService.getCurrentChapterId() || '',
      userId: this.currentUserId
    };

    this.service.searchDonation(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        // Check for error response first
        if (!response.success || (response.errorResponse && response.errorResponse.error)) {
          const baseError = response.errorResponse?.error || response.message || 'Failed to retrieve donation/deferral information';
          const errorCode = response.errorResponse?.errorCode;
          const errorMessage = errorCode ? `Error : ${errorCode} - ${baseError}` : `Error : ${baseError}`;

          this.searchErrorMessage.set(errorMessage);
          this.showError(errorMessage);
          this.donorInfo.set(null);
          this.currentTransactionId.set('');
          this.terminatedInterdictionCount.set(0);
          this.hasSearched.set(true);
          this.allInterdictions = [];
          this.applyFiltersAndSearch();
          this.isLoading.set(false);
          this.isRetrieving.set(false);
          return;
        }

        // Check if item exists (donation found)
        if (!response.item) {
          // No donation found - show empty state (not an error, don't show snackbar)
          this.searchErrorMessage.set(response.message || 'No donation found matching the search criteria');
          this.donorInfo.set(null);
          this.currentTransactionId.set('');
          this.terminatedInterdictionCount.set(0);
          this.hasSearched.set(true);
          this.allInterdictions = [];
          this.applyFiltersAndSearch();
          this.isLoading.set(false);
          this.isRetrieving.set(false);
          return;
        }

        // Clear any previous error message
        this.searchErrorMessage.set('');

        // Map API response to DonorInfo
        const donorInfo: DonorInfo = {
          donationType: response.item.donationTypeDesc,
          bloodCollectionType: response.item.procedureDesc,
          plantId: response.item.driveId,
          donorChf: response.item.unitId,
          numberOfOtherInterdictions: response.item.otherInterdictionCount,
          name: response.item.donorName,
          abo: response.item.bloodTypeDesc || 'N/A',
          dateOfBirth: this.formatDateForDisplay(response.item.dateOfBirth),
          sex: this.formatGender(response.item.gender),
          donorId: response.item.donorId
        };

        this.donorInfo.set(donorInfo);
        this.currentTransactionId.set(response.item.transactionId);
        this.hasSearched.set(true);
        this.terminatedInterdictionCount.set(response.item.terminatedInterdictionCount || 0);

        // Map active interdictions directly from response
        const interdictions = this.service.mapActiveInterdictionsToUnitInterdictions(
          response.item.activeInterdictions,
          response.item.transactionId
        );
        this.allInterdictions = interdictions;
        this.applyFiltersAndSearch();
        this.isLoading.set(false);
        this.isRetrieving.set(false);
      },
      error: () => {
        this.searchErrorMessage.set('Failed to retrieve donation/deferral information');
        this.showError('Failed to retrieve donation/deferral information');
        this.isLoading.set(false);
        this.isRetrieving.set(false);
      }
    });
  }

  private loadInterdictions(): void {
    this.isLoading.set(true);

    const params = {
      transactionId: this.currentTransactionId(),
      includeTerminated: this.showTerminated()
    };

    this.service.getInterdictions(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (interdictions) => {
        this.allInterdictions = interdictions;
        this.applyFiltersAndSearch();
        this.isLoading.set(false);
      },
      error: () => {
        this.showError('Failed to load interdictions');
        this.isLoading.set(false);
      }
    });
  }

  onToggleTerminated(): void {
    this.showTerminated.set(!this.showTerminated());
    this.pageIndex = 0; // Reset to first page when toggling terminated records
    if (this.hasSearched()) {
      this.loadInterdictions();
    }
  }

  onSearch(searchTerm: string): void {
    this.searchText = searchTerm;
    this.pageIndex = 0; // Reset to first page when searching
    this.applyFiltersAndSearch();
  }

  onAddNew(): void {
    const dialogData: AddEditInterdictionDialogData = {
      mode: 'add',
      transactionId: this.currentTransactionId(),
      currentUserId: this.currentUserId,
      interdictionCodes: this.interdictionCodes
    };

    const dialogRef = this.dialog.open(AddEditInterdictionComponent, {
      width: '600px',
      maxWidth: '90vw',
      height: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'side-panel-dialog',
      data: dialogData,
      disableClose: true,
      autoFocus: false,
      hasBackdrop: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.success) {
          // Reload interdictions after successful creation
          this.loadInterdictions();
        }
      });
  }

  onTableAction(action: InterdictionTableAction): void {
    switch (action.type) {
      case 'terminate':
        this.onTerminate(action.interdiction);
        break;
      case 'release':
        this.onRelease(action.interdiction);
        break;
    }
  }

  private onTerminate(interdiction: UnitInterdiction): void {
    // Highlight the row
    this.highlightedInterdiction.set(interdiction);

    // Show confirmation dialog first
    const confirmData: ConfirmActionDialogData = {
      title: 'Interdiction termination alert',
      message: 'Are you certain you want to terminate this Interdiction?',
      confirmText: 'YES',
      cancelText: 'NO, CANCEL'
    };

    const confirmDialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '380px',
      maxWidth: '90vw',
      data: confirmData,
      autoFocus: false,
      restoreFocus: false,
      disableClose: true,
      panelClass: 'centered-dialog'
    });

    confirmDialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          // Open terminate panel after confirmation
          this.openTerminatePanel(interdiction);
        } else {
          // Clear highlight if user cancels
          this.highlightedInterdiction.set(null);
        }
      });
  }

  private openTerminatePanel(interdiction: UnitInterdiction): void {
    const dialogData: TerminateInterdictionDialogData = {
      interdiction: interdiction,
      terminationReasons: this.terminationReasons
    };

    const dialogRef = this.dialog.open(TerminateInterdictionComponent, {
      width: '600px',
      maxWidth: '90vw',
      height: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'side-panel-dialog',
      data: dialogData,
      disableClose: true,
      autoFocus: false,
      hasBackdrop: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        // Clear highlight when panel closes
        this.highlightedInterdiction.set(null);

        if (result?.success) {
          // Increment terminated count after successful termination
          this.terminatedInterdictionCount.set(this.terminatedInterdictionCount() + 1);
          // Reload interdictions after successful termination
          this.loadInterdictions();
        }
      });
  }

  private onRelease(interdiction: UnitInterdiction): void {
    // Highlight the row
    this.highlightedInterdiction.set(interdiction);

    const confirmData: ConfirmActionDialogData = {
      title: 'Interdiction release alert',
      message: 'Do you want to release the Interdiction?',
      confirmText: 'YES',
      cancelText: 'NO, CANCEL'
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '380px',
      maxWidth: '90vw',
      data: confirmData,
      autoFocus: false,
      restoreFocus: false,
      disableClose: true,
      panelClass: 'centered-dialog'
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          // Show loading overlay
          this.isLoading.set(true);

          // Use existing termination date if available
          let terminationDate: string | undefined;
          if (interdiction.terminationDate) {
            // Parse existing termination date and format as YYYY-MM-DD
            terminationDate = moment(interdiction.terminationDate).format('YYYY-MM-DD');
          }

          const releaseData = {
            transactionId: interdiction.transactionId,
            interCode: interdiction.code,
            interType: interdiction.type,
            insertDate: interdiction.effectiveDate
              ? moment(interdiction.effectiveDate).format('YYYY-MM-DD')
              : '',
            terminationDate: terminationDate,
            originatedFrom: interdiction.originated || null,
            reasonCode: interdiction.reason || null,
            groupId: interdiction.groupId || null,
            groupMode: interdiction.groupMode || null
          };

          this.service.releaseInterdiction(releaseData).pipe(
            takeUntil(this.destroy$)
          ).subscribe({
            next: () => {
              this.showSuccess('Interdiction released successfully');
              this.highlightedInterdiction.set(null);
              this.loadInterdictions();
            },
            error: () => {
              this.showError('Failed to release interdiction');
              this.highlightedInterdiction.set(null);
              this.isLoading.set(false);
            }
          });
        } else {
          // Clear highlight if user cancels
          this.highlightedInterdiction.set(null);
        }
      });
  }

  onOpenFilter(): void {
    if (this.filterOverlayRef) {
      this.filterOverlayRef.dispose();
      this.filterOverlayRef = null;
      return;
    }

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterBtn)
      .withPositions([
        { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' }
      ]);

    this.filterOverlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop'
    });

    const portal = new ComponentPortal(UnitInterdictionFilterPanelComponent);
    const componentRef = this.filterOverlayRef.attach(portal);

    // Pass data to avoid duplicate API calls
    componentRef.instance.interdictionCodes = this.interdictionCodes;
    componentRef.instance.terminationReasons = this.terminationReasons;

    componentRef.instance.applyFilters
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.appliedFilters.set(filters);
        this.filterChips.set(UnitInterdictionFilterChipsUtils.generateFilterChips(filters));
      });

    componentRef.instance.clearFilters
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.appliedFilters.set(null);
        this.filterChips.set([]);
      });

    componentRef.instance.closePanel
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterOverlayRef?.dispose();
        this.filterOverlayRef = null;
      });

    this.filterOverlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterOverlayRef?.dispose();
        this.filterOverlayRef = null;
      });
  }

  onRemoveFilterChip(chipKey: string): void {
    const currentFilters = this.appliedFilters();
    if (currentFilters) {
      const chip = this.filterChips().find(c => c.key === chipKey);
      if (chip) {
        const updatedFilters = UnitInterdictionFilterChipsUtils.removeFilterChip(currentFilters, chip);
        this.appliedFilters.set(updatedFilters);
        this.filterChips.set(UnitInterdictionFilterChipsUtils.generateFilterChips(updatedFilters));
      }
    }
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyFiltersAndSearch();
  }

  onSortChange(sort: Sort): void {
    this.currentSort = sort;
    this.pageIndex = 0; // Reset to first page when sorting
    this.applyFiltersAndSearch();
  }

  private applyFiltersAndSearch(): void {
    let filtered = [...this.allInterdictions];

    // Apply search filter
    if (this.searchText && this.searchText.trim()) {
      const searchLower = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.code?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (this.currentSort.active && this.currentSort.direction) {
      filtered = this.sortData(filtered, this.currentSort);
    }

    // Set total records before pagination
    this.totalRecords = filtered.length;

    // Apply pagination
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const paginated = filtered.slice(startIndex, endIndex);

    this.interdictions.set(paginated);
  }

  private sortData(data: UnitInterdiction[], sort: Sort): UnitInterdiction[] {
    if (!sort.active || sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      const aValue = a[sort.active as keyof UnitInterdiction];
      const bValue = b[sort.active as keyof UnitInterdiction];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return isAsc
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return isAsc
        ? (aValue < bValue ? -1 : 1)
        : (bValue < aValue ? -1 : 1);
    });
  }

  private formatDateForApiISO(date: Date | moment.Moment): string {
    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DDTHH:mm:ss');
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  }

  onCollectionDateInput(): void {
    const control = this.searchForm.get('collectionDate');
    const inputElement = this.collectionDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    if (!control) return;

    // Mark as touched and dirty to show errors immediately
    control.markAsTouched();
    control.markAsDirty();

    if (!inputValue) {
      // Clear errors if input is empty
      if (control.hasError('invalidDate')) {
        control.setErrors(null);
      }
      return;
    }

    // Try to parse the input
    const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
      ? DD_MON_YYYY_FORMATS.parse.dateInput
      : [DD_MON_YYYY_FORMATS.parse.dateInput];

    const parsed = this.dateAdapter.parse(inputValue, formats);

    if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
      // Valid date - clear any invalid errors
      if (control.hasError('invalidDate')) {
        control.setErrors(null);
      }
    }
  }

  onCollectionDateBlur(): void {
    // Trigger validation after blur to ensure Material datepicker has parsed the input
    setTimeout(() => {
      const control = this.searchForm.get('collectionDate');
      const inputElement = this.collectionDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      // Mark as touched to ensure error state is displayed
      control?.markAsTouched();

      // If there's input text but no parsed value, try to manually parse it
      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = this.dateAdapter.parse(inputValue, formats);

        if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
          // Successfully parsed and valid date - set the value
          control?.setValue(parsed);
        } else {
          // Invalid date input - set custom error
          control?.setErrors({ invalidDate: true });
        }
      } else if (control?.value) {
        // If there's already a value, ensure it's valid
        const dateValue = moment.isMoment(control.value) ? control.value : moment(control.value);
        if (!dateValue.isValid()) {
          control?.setErrors({ invalidDate: true });
        }
      }
    }, 100);
  }

  getCollectionDateError(): string {
    const control = this.searchForm.get('collectionDate');
    if (!control) return '';

    // Check if the native input has text
    const inputElement = this.collectionDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';

    // If there's input text but control value is null/invalid, it's an invalid date (not missing)
    if (hasInputValue && !control.value) {
      return 'Collection Date is invalid';
    }

    // Check for parse errors
    if (control.hasError('matDatepickerParse')) {
      return 'Collection Date is invalid';
    }

    // Check for custom invalid date error
    if (control.hasError('invalidDate')) {
      return 'Collection Date is invalid';
    }

    // Check for required error only if input is actually empty
    if (control.hasError('required') && !hasInputValue) {
      return 'Collection Date is required';
    }

    return '';
  }

  private formatDateForDisplay(isoDate: string): string {
    if (!isoDate) return '';
    return moment(isoDate).format('DD-MMM-YYYY').toUpperCase();
  }

  private formatGender(genderCode: string): string {
    const genderMap: { [key: string]: string } = {
      'F': 'Female',
      'M': 'Male',
      'U': 'Unknown',
      'O': 'Other'
    };
    return genderMap[genderCode?.toUpperCase()] || genderCode || 'N/A';
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
