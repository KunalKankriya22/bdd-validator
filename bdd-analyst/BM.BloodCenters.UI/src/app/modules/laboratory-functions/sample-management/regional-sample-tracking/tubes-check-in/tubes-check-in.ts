import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  signal,
  computed,
  inject,
  effect,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Subject, Observable } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { A11yModule } from '@angular/cdk/a11y';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { UnitIdFieldComponent, UnitValidationResponse, UnitIdPostValidateEvent } from '@shared/components/unit-id-field';
import { ProfileTestsComponent } from '@shared/components/profile-tests/profile-tests';
import { UnitsInBatchComponent } from '@shared/components/units-in-batch/units-in-batch';
import { DonationNotesDialog } from '@shared/components/donation-notes/donation-notes';
import { DonationNotesDialogData } from '@shared/components/donation-notes/donation-notes.model';
import {
  DuplicateReasonDialogComponent,
  DuplicateReasonDialogData,
  DuplicateReasonDialogResult
} from './duplicate-reason-dialog/duplicate-reason-dialog';

import { TubesCheckInService } from './services/tubes-check-in.service';
import {
  TubesContract,
  ProfileSet,
  Shipment,
  TubeEntry,
  TubeCheckInEntry,
  CheckInRequestDto,
  TubeEntryDto,
  ValidateUnitRequestDto,
  DuplicateReasonDto,
  BatchLookupDto,
  TubeFormatDto,
} from './models/tubes-check-in.model';
import moment, { Moment } from 'moment';

/**
 * Tubes Check-In Component
 * Mnemonic: REGTUBES
 * Path: Laboratory Functions → Sample Management → Regional Sample Tracking → Tubes Check-In
 *
 * Progressive 3-section form:
 * Section 1: Contract & Profile Selection (Always visible)
 * Section 2: Shipment & Batch Details (Appears when Section 1 filled)
 * Section 3: Batch Details & Tube Entry (Appears when Section 2 filled)
 */
@Component({
  selector: 'app-tubes-check-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
    ProfileTestsComponent,
    UnitsInBatchComponent,
    A11yModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './tubes-check-in.html',
  styleUrls: ['./tubes-check-in.scss'],
})
export class TubesCheckInComponent implements OnInit, OnDestroy {
  // ── Dependency injection ──────────────────────────────────────────────────────
  private readonly fb = inject(FormBuilder);
  private readonly snackbarService = inject(SnackbarService);
  private readonly tubesService = inject(TubesCheckInService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly dialog = inject(MatDialog);

  // ── Page header config ────────────────────────────────────────────────────────
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: 'Tubes Check-In',
    subtitle: 'Use the Tubes Check-In screen to check in sample tubes received for testing under a fixed profile contract. Each unit is checked in individually, and every check-in is automatically saved.',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [{ label: 'Home', link: '/home' }, { label: pageData.title, link: null }],
          title: pageData.title,
          subtitle: pageData.subtitle || this.headerConfig.subtitle,
        };
      }
    });
  }

  // ── Loading signals ───────────────────────────────────────────────────────────
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);

  // ── Section 1: Contract & Profile data ────────────────────────────────────────
  readonly contractOptions = signal<TubesContract[]>([]);
  readonly filteredContractOptions = signal<TubesContract[]>([]);
  contractSearchControl = new FormControl('');
  readonly selectedContract = signal<TubesContract | null>(null);

  readonly profileSetOptions = signal<ProfileSet[]>([]);
  readonly filteredProfileSetOptions = signal<ProfileSet[]>([]);
  profileSetSearchControl = new FormControl('');
  readonly selectedProfileSet = signal<ProfileSet | null>(null);

  readonly shipmentOptions = signal<Shipment[]>([]);

  // Track section 1 completion
  readonly section1ContractId = signal<string | null>(null);
  readonly section1ProfileSetId = signal<string | null>(null);

  section1Form!: FormGroup;
  private formValuesSubject = new Subject<any>();
  section1FormValues = toSignal(this.formValuesSubject, { initialValue: {} });

  // ── Section 2: Shipment & Option data ─────────────────────────────────────────
  readonly optionOptions = signal<TubeFormatDto[]>([]);
  readonly filteredOptionOptions = signal<TubeFormatDto[]>([]);
  optionSearchControl = new FormControl('');
  readonly selectedOption = signal<TubeFormatDto | null>(null);

  // Track section 2 completion
  readonly section2OptionCode = signal<string | null>(null);

  // Track if RETRIEVE button has been clicked
  readonly hasRetrieved = signal<boolean>(false);

  section2Form!: FormGroup;

  // ── Section 3: Batch & Tube Entry data ────────────────────────────────────────
  readonly batchOptions = signal<BatchLookupDto[]>([]); // Store full batch objects
  readonly batchIdOptions = signal<string[]>([]);
  readonly filteredBatchIdOptions = signal<string[]>([]);
  batchIdSearchControl = new FormControl('');
  readonly selectedBatch = signal<{ collectionDate: string; sequence: string } | null>(null);
  readonly selectedBatchProfileSeqNo = signal<number | null>(null); // Store profileSeqNo from selected batch

  section3Form!: FormGroup;

  // ── Computed: Enabled/Disabled state for each tube field based on Option ─────
  readonly isTubeFieldEnabled = computed(() => {
    const optionCode = this.section2OptionCode()?.toUpperCase();

    // Default: All enabled when no option selected
    if (!optionCode) {
      return {
        outsideRed: true,
        red: true,
        osPurple1: true,
        purple1: true,
        osPurple2: true,
        purple2: true
      };
    }

    // Map option codes to enabled fields
    switch (optionCode) {
      case 'A':
        // Check-In All Tubes: All 6 fields enabled
        return {
          outsideRed: true,
          red: true,
          osPurple1: true,
          purple1: true,
          osPurple2: true,
          purple2: true
        };

      case 'P*':
        // Purple Tubes Only: Only OS Purple 1, Purple 1, OS Purple 2, Purple 2 enabled
        return {
          outsideRed: false,
          red: false,
          osPurple1: true,
          purple1: true,
          osPurple2: true,
          purple2: true
        };

      case 'P1':
        // Purple 1 Only: Only OS Purple 1 and Purple 1 enabled
        return {
          outsideRed: false,
          red: false,
          osPurple1: true,
          purple1: true,
          osPurple2: false,
          purple2: false
        };

      case 'P2':
        // Purple 2 Only: Only OS Purple 2 and Purple 2 enabled
        return {
          outsideRed: false,
          red: false,
          osPurple1: false,
          purple1: false,
          osPurple2: true,
          purple2: true
        };

      case 'R1':
      case 'R2':
        // Red Only (R1 or R2): Only OS Red and Red enabled
        return {
          outsideRed: true,
          red: true,
          osPurple1: false,
          purple1: false,
          osPurple2: false,
          purple2: false
        };

      default:
        // Unknown option: Enable all fields
        return {
          outsideRed: true,
          red: true,
          osPurple1: true,
          purple1: true,
          osPurple2: true,
          purple2: true
        };
    }
  });


  // ── ViewChild references to unit-id-field components ──────────────────────────
  @ViewChild('outsideRedField') outsideRedField: any;
  @ViewChild('redField') redField: any;
  @ViewChild('osPurple1Field') osPurple1Field: any;
  @ViewChild('purple1Field') purple1Field: any;
  @ViewChild('osPurple2Field') osPurple2Field: any;
  @ViewChild('purple2Field') purple2Field: any;

  // ── Current entry for unit tubes (validated tube IDs) ───────────────────────
  currentUnitEntry = signal<TubeEntry>({
    outsideRed: '',
    red: '',
    osPurple1: '',
    purple1: '',
    osPurple2: '',
    purple2: ''
  });

  // ── Track if tube has been validated ─────────────────────────────────────────
  tubeValidationState = signal<Record<string, boolean>>({
    outsideRed: false,
    red: false,
    osPurple1: false,
    purple1: false,
    osPurple2: false,
    purple2: false
  });

  // ── Panel visibility and data ─────────────────────────────────────────────────
  showProfileTestsPanel = signal<boolean>(false);
  showUnitsInBatchPanel = signal<boolean>(false);

  // ── Duplicate reason codes (loaded once on init) ──────────────────────────────
  duplicateReasonCodes = signal<DuplicateReasonDto[]>([]);

  // ── Dynamic tube rows ─────────────────────────────────────────────────────────
  readonly tubeRows = signal<TubeEntry[]>([]);

  // ── Computed table data with sequence numbers ─────────────────────────────────
  // Shows only saved rows (data added after SAVE button click)
  readonly tableData = computed<TubeCheckInEntry[]>(() => {
    const saved = this.tubeRows();

    // Only show saved entries (not currentUnitEntry until SAVE is clicked)
    return saved.map((row, index) => ({
      sequence: index + 1,
      outsideRed: row.outsideRed || '',
      red: row.red || '',
      osPurple1: row.osPurple1 || '',
      purple1: row.purple1 || '',
      osPurple2: row.osPurple2 || '',
      purple2: row.purple2 || ''
    }));
  });

  // ── Computed DataTable configuration (dynamic based on option, no delete icons) ──
  unitTableConfig = computed<DataTableConfig<TubeCheckInEntry>>(() => {
    // Get option code from reactive signal
    const optionCode = this.section2OptionCode()?.toUpperCase() || '';
    const isR2Option = optionCode === 'R2';

    // For R2: Show Sequence (red), OS Red, Red only
    if (isR2Option) {
      return {
        columns: [
          { key: 'sequence', header: 'Sequence', width: '80px', type: 'number', cssClass: 'sequence-red' },
          { key: 'outsideRed', header: 'OS Red', sortable: false },
          { key: 'red', header: 'Red', sortable: false },
        ],
        showPagination: false,
        stickyHeader: false,
        showActionsAsMenu: false,
        emptyMessage: 'No tube entries',
        emptySubMessage: 'Start entering tube data',
        enableRowHighlight: false
      };
    }

    // Default: All columns with sequence (no delete icon)
    return {
      columns: [
        { key: 'sequence', header: 'Sequence', width: '80px', type: 'number' },
        { key: 'outsideRed', header: 'OS Red', sortable: false },
        { key: 'red', header: 'Red', sortable: false },
        { key: 'osPurple1', header: 'OS Purple 1', sortable: false },
        { key: 'purple1', header: 'Purple 1', sortable: false },
        { key: 'osPurple2', header: 'OS Purple 2', sortable: false },
        { key: 'purple2', header: 'Purple 2', sortable: false },
      ],
      showPagination: false,
      stickyHeader: false,
      showActionsAsMenu: false,
      emptyMessage: 'No tube entries',
      emptySubMessage: 'Start entering tube data',
      enableRowHighlight: false
    };
  });

  // ── Section visibility ────────────────────────────────────────────────────────
  readonly showSection2 = computed(() => {
    return !!(this.section1ContractId() && this.section1ProfileSetId());
  });

  readonly showSection3 = computed(() => {
    return this.showSection2() && this.hasRetrieved();
  });

  readonly canRetrieve = computed(() => {
    const formValues = this.section1FormValues();
    const contractId = formValues.contractId;
    const profileSetId = formValues.profileSetId;
    const batchId = formValues.batchId;
    const optionCode = formValues.optionCode;
    const collectionDate = formValues.collectionDate;

    // Enable RETRIEVE only when all required fields are selected:
    // Contract ID, Profile Set ID, Batch ID, and Option
    // AND if Batch ID is "NEW", Collection Date must also be selected
    if (contractId && profileSetId && batchId && optionCode) {
      if (batchId.toUpperCase() === 'NEW') {
        return !!collectionDate; // Collection Date required when Batch ID is NEW
      }
      return true; // All required fields present, Batch ID is not NEW
    }

    return false;
  });

  readonly canClearAll = computed(() => {
    const formValues = this.section1FormValues();
    const contractId = formValues.contractId;
    const profileSetId = formValues.profileSetId;
    const batchId = formValues.batchId;
    const shipmentRfid = formValues.shipmentRfid;
    const shipmentDate = formValues.shipmentDate;
    const collectionDate = formValues.collectionDate;

    // Enable CLEAR ALL if any field has a value OR if data has been retrieved
    const hasAnyFieldValue = !!(
      contractId ||
      profileSetId ||
      batchId ||
      shipmentRfid ||
      shipmentDate ||
      collectionDate
    );

    return hasAnyFieldValue || this.hasRetrieved();
  });

  private readonly destroy$ = new Subject<void>();

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.initForms();
    this.subscribeToChapterChanges();
    this.initializeSearchControls();
    this.loadContracts();
    this.loadCheckInOptions();
    this.loadDuplicateReasons();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Form initialization ───────────────────────────────────────────────────────
  private initForms(): void {
    // Single form with all fields
    // Note: receivedDate and receivedTime will be populated when Profile Set ID is selected
    this.section1Form = this.fb.group({
      contractId: [null, Validators.required],
      profileSetId: [null, Validators.required],
      receivedDate: [null], // Will be set when Profile Set ID is selected
      receivedTime: [null, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)], // HH:mm format
      // FMB SHIPMENT_NO.WHEN-VALIDATE-ITEM: alphanumeric + hyphen + underscore only (error 5193)
      shipmentRfid: [null, [Validators.maxLength(50), Validators.pattern(/^[A-Za-z0-9\-_]*$/)]],
      shipmentDate: [null],
      shipmentTime: [null, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)], // HH:mm format
      batchId: [null, Validators.required],
      collectionDate: [null, this.collectionDateValidator.bind(this)],
      optionCode: [null, Validators.required],  // Required field, no default value
    });

    // Keep section2Form and section3Form for now to avoid errors
    this.section2Form = this.fb.group({});
    this.section3Form = this.fb.group({});

    // Subscribe to form value changes to update signal
    this.section1Form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(values => {
        this.formValuesSubject.next(values);
      });

    // Add validator re-trigger when batchId or receivedDate changes
    this.section1Form.get('batchId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.section1Form.get('collectionDate')?.updateValueAndValidity({ emitEvent: false });
      });

    this.section1Form.get('receivedDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.section1Form.get('collectionDate')?.updateValueAndValidity({ emitEvent: false });
      });

    // Note: Default option will be set in loadCheckInOptions() after API call
  }

  // ── Collection Date Validator ─────────────────────────────────────────────────
  private collectionDateValidator(control: FormControl): { [key: string]: any } | null {
    const collectionDate = control.value;
    const batchId = this.section1Form?.get('batchId')?.value;
    const receivedDate = this.section1Form?.get('receivedDate')?.value;

    // Only validate when Batch ID is "NEW"
    if (!batchId || batchId.toUpperCase() !== 'NEW') {
      return null;
    }

    // Collection Date is required when Batch ID is NEW
    if (!collectionDate) {
      return null; // Let required validator handle this
    }

    // Convert to moment for comparison
    const collectionMoment = moment(collectionDate);
    const today = moment().startOf('day');

    // Collection Date cannot be greater than today
    if (collectionMoment.isAfter(today)) {
      return { futureDate: true };
    }

    // Collection Date must be >= Received Date
    if (receivedDate) {
      const receivedMoment = moment(receivedDate).startOf('day');
      if (collectionMoment.isBefore(receivedMoment)) {
        return { beforeReceivedDate: true };
      }
    }

    return null;
  }

  // FMB RECEIVED_DATE.KEY-NEXT-ITEM: received_date < trunc(local) - 9 → error 7020 (hardcoded 9 in FMB)
  get minReceivedDate(): Date {
    return moment().startOf('day').subtract(9, 'days').toDate();
  }

  // FMB RECEIVED_DATE.KEY-NEXT-ITEM: received_date > local_time → error 0055
  get maxReceivedDate(): Date {
    return moment().startOf('day').toDate();
  }

  onReceivedDateChange(): void {
    this.section1Form.get('receivedDate')?.markAsTouched();
    // Re-evaluate collection date's min constraint now that received date changed
    const collDateCtrl = this.section1Form.get('collectionDate');
    if (collDateCtrl?.value) {
      collDateCtrl.markAsTouched();
      collDateCtrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  onDateInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const ctrl = this.section1Form.get(controlName);
    if (!ctrl) return;
    ctrl.markAsTouched();
    ctrl.markAsDirty();
    // If user typed text but datepicker couldn't parse it (value is null) → set explicit error
    if (input.value?.trim() && !ctrl.value) {
      ctrl.setErrors({ ...(ctrl.errors || {}), invalidDate: true });
    } else if (ctrl.errors?.['invalidDate']) {
      const errs = { ...ctrl.errors };
      delete errs['invalidDate'];
      ctrl.setErrors(Object.keys(errs).length ? errs : null);
    }
  }

  onTimeInput(event: Event, controlName: string): void {
    const ctrl = this.section1Form.get(controlName);
    if (!ctrl) return;
    ctrl.markAsTouched();
    ctrl.markAsDirty();
  }

  // Min date for collection date picker: same as received_date (coll_date must be >= received_date per FMB)
  get minCollDate(): Date | null {
    const received = this.section1Form?.get('receivedDate')?.value;
    return received ? moment(received).startOf('day').toDate() : null;
  }

  // Max date for collection date picker: today (coll_date must not be in future per FMB)
  get maxCollDate(): Date {
    return moment().startOf('day').toDate();
  }

  // FMB SHIPMENT_ARRIVAL_DATE.KEY-NEXT-ITEM: shipment_arrival_date > local_time → error 8030
  get maxShipmentDate(): Date {
    return moment().startOf('day').toDate();
  }

  // ── Chapter change handler ────────────────────────────────────────────────────
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetAll();
        this.loadContracts(); // Reload contracts for new chapter
      });
  }

  // ── Search control initialization ─────────────────────────────────────────────
  private initializeSearchControls(): void {
    // Contract ID search with debounce
    this.contractSearchControl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredContractOptions.set(
          this.contractOptions().filter(
            (contract) =>
              (contract.contractId || '').toLowerCase().includes(search) ||
              (contract.description || '').toLowerCase().includes(search),
          ),
        );
      });

    // Profile Set ID search with debounce
    this.profileSetSearchControl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredProfileSetOptions.set(
          this.profileSetOptions().filter(
            (profile) =>
              (profile.profileSetId || '').toLowerCase().includes(search),
          ),
        );
      });

    // Option search with debounce
    this.optionSearchControl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredOptionOptions.set(
          this.optionOptions().filter(
            (option) =>
              (option.code || '').toLowerCase().includes(search) ||
              (option.description || '').toLowerCase().includes(search),
          ),
        );
      });

    // Batch ID search with debounce
    this.batchIdSearchControl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredBatchIdOptions.set(
          this.batchIdOptions().filter((batchId) =>
            (batchId || '').toLowerCase().includes(search),
          ),
        );
      });
  }

  // ── Data loading methods ──────────────────────────────────────────────────────
  private loadContracts(): void {
    this.isLoading.set(true);
    this.tubesService.getContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts) => {
          this.contractOptions.set(contracts);
          this.filteredContractOptions.set(contracts); // Initialize filtered list
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading contracts:', error);
          this.snackbarService.showError('Failed to load contracts');
          this.isLoading.set(false);
        }
      });
  }

  private loadCheckInOptions(): void {
    // Load tube formats from API
    this.tubesService.getTubeFormats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tubeFormats) => {
          this.optionOptions.set(tubeFormats);
          this.filteredOptionOptions.set(tubeFormats);
          // Do not set default option - user must select it manually
        },
        error: (error) => {
          console.error('Error loading tube formats:', error);
          this.snackbarService.showError('Failed to load tube formats');
        }
      });
  }

  private loadDuplicateReasons(): void {
    this.tubesService.getDuplicateReasons()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reasons) => {
          this.duplicateReasonCodes.set(reasons);
        },
        error: (error) => {
          console.error('Error loading duplicate reasons:', error);
          // Don't show error to user - not critical for initial load
        }
      });
  }

  // ── Section 1 handlers ────────────────────────────────────────────────────────
  onSection1ContractChange(contractId: string): void {
    const contract = this.contractOptions().find(c => c.contractId === contractId);
    this.selectedContract.set(contract || null);
    this.section1ContractId.set(contractId || null);

    // Reset dependent sections
    this.section1Form.patchValue({ profileSetId: null, batchId: null });
    this.section1ProfileSetId.set(null);
    this.profileSetOptions.set([]);
    this.filteredProfileSetOptions.set([]);
    this.batchIdOptions.set([]);
    this.filteredBatchIdOptions.set([]);

    if (!contractId) return;

    // Load profile sets from API
    this.isLoading.set(true);
    this.tubesService.getProfileSets(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profileSets) => {
          this.profileSetOptions.set(profileSets);
          this.filteredProfileSetOptions.set(profileSets);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading profile sets:', error);
          this.snackbarService.showError('Failed to load profile sets');
          this.isLoading.set(false);
        }
      });
  }

  onSection1ProfileChange(profileSetId: string): void {
    const profile = this.profileSetOptions().find(p => p.profileSetId === profileSetId);
    this.selectedProfileSet.set(profile || null);
    this.section1ProfileSetId.set(profileSetId || null);

    // Reset batch selection
    this.section1Form.patchValue({ batchId: null });
    this.batchOptions.set([]);
    this.batchIdOptions.set([]);
    this.filteredBatchIdOptions.set([]);

    // Auto-populate received date/time when profile set is selected
    if (profileSetId) {
      // Get current chapter ID from HeaderService
      const currentChapter = this.headerService.getCurrentChapterId();

      if (currentChapter) {
        // Fetch latest chapter timezone from API to ensure accurate time
        this.chapterTimezoneService.fetchChapterTimezone(currentChapter)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // Now get the accurate chapter date/time
              const chapterDateTime = this.chapterTimezoneService.getChapterLocalDateTime();
              const defaultReceivedDate = chapterDateTime.clone().startOf('day');
              const defaultReceivedTime = chapterDateTime.format('HH:mm');

              this.section1Form.patchValue({
                receivedDate: defaultReceivedDate,
                receivedTime: defaultReceivedTime
              });
            },
            error: (error) => {
              console.error('Error fetching chapter timezone:', error);
              // Fallback: use service's cached value (may be stale or system time)
              const chapterDateTime = this.chapterTimezoneService.getChapterLocalDateTime();
              const defaultReceivedDate = chapterDateTime.clone().startOf('day');
              const defaultReceivedTime = chapterDateTime.format('HH:mm');

              this.section1Form.patchValue({
                receivedDate: defaultReceivedDate,
                receivedTime: defaultReceivedTime
              });
            }
          });
      }
    }

    // Load batches from API when profile is selected
    const contractId = this.section1ContractId();
    if (profileSetId && contractId) {
      this.isLoading.set(true);
      this.tubesService.getBatches(contractId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (batches) => {
            // Store full batch objects for later use
            this.batchOptions.set(batches);

            // Extract batch IDs for dropdown
            const batchIds = batches.map(b => b.batchId);
            this.batchIdOptions.set(batchIds);
            this.filteredBatchIdOptions.set(batchIds);
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Error loading batches:', error);
            this.snackbarService.showError('Failed to load batches');
            this.isLoading.set(false);
          }
        });
    }
  }

  // ── Section 2 handlers ────────────────────────────────────────────────────────
  onSection2OptionChange(optionCode: string): void {
    const option = this.optionOptions().find(o => o.code === optionCode);
    this.selectedOption.set(option || null);
    this.section2OptionCode.set(optionCode || null);
  }

  // ── RETRIEVE button handler ──────────────────────────────────────────────────
  onRetrieve(): void {
    // Validate that Collection Date is provided if Batch ID is "NEW"
    const batchId = this.section1Form.get('batchId')?.value;
    const collectionDate = this.section1Form.get('collectionDate')?.value;

    if (batchId && batchId.toUpperCase() === 'NEW' && !collectionDate) {
      this.snackbarService.showError('Collection Date should be entered if Batch ID is NEW');
      return;
    }

    // Reset tube entry area for fresh start (handles both first and subsequent clicks)
    this.resetTubeEntry();
    this.tubeRows.set([
      { outsideRed: '', red: '', osPurple1: '', purple1: '', osPurple2: '', purple2: '' }
    ]);

    // Show data entry section
    this.hasRetrieved.set(true);
  }

  // ── Section 3 handlers ────────────────────────────────────────────────────────
  onSection3BatchChange(batchId: string): void {
    const collectionDateControl = this.section1Form.get('collectionDate');

    if (batchId) {
      // Check if "NEW" batch is selected
      if (batchId.toUpperCase() === 'NEW') {
        // Call API to generate batch ID IMMEDIATELY
        this.isLoading.set(true);
        this.tubesService.generateBatchId()
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (generatedBatchId) => {
              // Create a BatchLookupDto object for the newly generated batch
              const contractId = this.section1ContractId();
              const profileSetId = this.section1ProfileSetId();
              const receivedDate = this.section1Form.get('receivedDate')?.value;

              const newBatch: BatchLookupDto = {
                batchId: generatedBatchId,
                receivedDate: receivedDate ? receivedDate.toISOString() : new Date().toISOString(),
                contractId: contractId || '',
                profileSetId: profileSetId,
                profileSeqNo: null,
                checkinUserId: '', // Will be set by backend
                qcDate: null // New batch is always open
              };

              // Add the new batch to batchOptions array
              const currentBatches = this.batchOptions();
              if (!currentBatches.some(b => b.batchId === generatedBatchId)) {
                this.batchOptions.set([newBatch, ...currentBatches]);
              }

              // Add the generated batch ID to the dropdown options
              const currentBatchIds = this.batchIdOptions();
              if (!currentBatchIds.includes(generatedBatchId)) {
                // Add to beginning of list so it's the first option
                const updatedBatchIds = [generatedBatchId, ...currentBatchIds];
                this.batchIdOptions.set(updatedBatchIds);
                this.filteredBatchIdOptions.set(updatedBatchIds);
              }

              // Update form with actual generated batch ID
              this.section1Form.patchValue({ batchId: generatedBatchId }, { emitEvent: false });
              this.isLoading.set(false);

              // Make Collection Date required for NEW batch
              collectionDateControl?.setValidators(Validators.required);
              collectionDateControl?.updateValueAndValidity();

              // Clear sequence for NEW batch (will be 1 for new batch)
              this.selectedBatch.set({
                collectionDate: '',
                sequence: '1'
              });
            },
            error: (error) => {
              console.error('Error generating batch ID:', error);
              this.snackbarService.showError('Failed to generate batch ID');
              this.isLoading.set(false);

              // Reset selection on error
              this.section1Form.patchValue({ batchId: null }, { emitEvent: false });
            }
          });

        return; // Exit early - rest of logic handled after batch ID is generated
      } else {
        // Remove required validator for existing batches
        collectionDateControl?.clearValidators();
        collectionDateControl?.updateValueAndValidity();

        // Fetch batch units to get dates and unit count
        this.tubesService.getBatchUnits(batchId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (units) => {
              const unitCount = units?.length || 0;

              // Extract dates from first unit in the batch (if available)
              if (units && units.length > 0) {
                const firstUnit = units[0];

                // Auto-populate Collection Date from unit's collDate
                if (firstUnit.collDate) {
                  const collectionDate = moment(firstUnit.collDate).startOf('day');
                  this.section1Form.patchValue({
                    collectionDate: collectionDate
                  });
                }

                // Auto-populate Received Date and Time from unit's receivedDate
                if (firstUnit.receivedDate) {
                  const receivedDateTime = moment(firstUnit.receivedDate);
                  const receivedDate = receivedDateTime.clone().startOf('day');
                  const receivedTime = receivedDateTime.format('HH:mm');

                  this.section1Form.patchValue({
                    receivedDate: receivedDate,
                    receivedTime: receivedTime
                  });
                }

                // Update sequence display (next unit number = current count + 1)
                this.selectedBatch.set({
                  collectionDate: firstUnit.collDate
                    ? moment(firstUnit.collDate).format('DD-MMM-YYYY')
                    : '',
                  sequence: (unitCount + 1).toString()
                });
              } else {
                // No units in batch - start from sequence 1
                this.selectedBatch.set({
                  collectionDate: '',
                  sequence: '0'
                });
              }

            },
            error: (error) => {
              console.error('Error fetching batch units:', error);
              // Set sequence to 1 on error (unknown count, start from 1)
              this.selectedBatch.set({
                collectionDate: '',
                sequence: '1'
              });
            }
          });
      }
    } else {
      this.selectedBatch.set(null);
      // Remove required validator when batch is deselected
      collectionDateControl?.clearValidators();
      collectionDateControl?.updateValueAndValidity();
      // Clear collection date when batch is deselected
      this.section1Form.patchValue({
        collectionDate: null
      });
    }
  }

  // ── Tube row management ───────────────────────────────────────────────────────
  onRowInput(rowIndex: number, field: keyof TubeEntry, value: string): void {
    const rows = this.tubeRows();
    (rows[rowIndex] as any)[field] = value;
    this.tubeRows.set([...rows]);

    // Check if current row is filled and it's the last row
    const currentRow = rows[rowIndex];
    const isRowFilled = this.isRowFilled(currentRow);
    const isLastRow = rowIndex === rows.length - 1;

    // Add 2 new rows if current row is filled and it's the last row
    if (isRowFilled && isLastRow && rows.length < 10) {
      this.tubeRows.set([
        ...rows,
        { outsideRed: '', red: '', osPurple1: '', purple1: '', osPurple2: '', purple2: '' },
        { outsideRed: '', red: '', osPurple1: '', purple1: '', osPurple2: '', purple2: '' }
      ]);
    }
  }

  private isRowFilled(row: TubeEntry): boolean {
    return !!(row.outsideRed || row.red || row.osPurple1 || row.purple1 || row.osPurple2 || row.purple2);
  }

  deleteRow(rowIndex: number): void {
    const rows = this.tubeRows();
    if (rows.length > 1) {
      rows.splice(rowIndex, 1);
      this.tubeRows.set([...rows]);
    } else {
      // Last row - just clear it
      this.tubeRows.set([{ outsideRed: '', red: '', osPurple1: '', purple1: '', osPurple2: '', purple2: '' }]);
    }
  }

  onClearAll(): void {
    // Clear Collection Date validator before resetting (it might have required validator from NEW batch)
    const collectionDateControl = this.section1Form.get('collectionDate');
    collectionDateControl?.clearValidators();
    collectionDateControl?.updateValueAndValidity();

    // Reset all form fields
    this.section1Form.reset();
    this.section2Form.reset();
    this.section3Form.reset();

    // Reset all selections
    this.selectedContract.set(null);
    this.selectedProfileSet.set(null);
    this.selectedOption.set(null);
    this.selectedBatch.set(null);
    this.selectedBatchProfileSeqNo.set(null);

    // Reset section signals
    this.section1ContractId.set(null);
    this.section1ProfileSetId.set(null);
    this.section2OptionCode.set(null);
    this.hasRetrieved.set(false);

    // Reset dropdown options
    this.profileSetOptions.set([]);
    this.filteredProfileSetOptions.set([]);
    this.shipmentOptions.set([]);
    this.batchOptions.set([]);
    this.batchIdOptions.set([]);
    this.filteredBatchIdOptions.set([]);

    // Reset tube rows
    this.tubeRows.set([
      { outsideRed: '', red: '', osPurple1: '', purple1: '', osPurple2: '', purple2: '' }
    ]);

    // Reset tube entry state
    this.resetTubeEntry();

    // Do not re-set any default option - user must select it manually
  }

  // ── DataTable row action handler ──────────────────────────────────────────────
  onTableRowAction(event: { action: string; row: TubeCheckInEntry }): void {
    if (event.action === 'delete') {
      const sequenceNumber = event.row.sequence;
      const current = this.currentUnitEntry();
      const hasCurrentTube = !!(
        current.outsideRed ||
        current.red ||
        current.osPurple1 ||
        current.purple1 ||
        current.osPurple2 ||
        current.purple2
      );

      // If currentUnitEntry is shown as row 1
      if (hasCurrentTube) {
        if (sequenceNumber === 1) {
          // Delete current entry (row 1)
          this.resetTubeEntry();
        } else {
          // Delete from saved rows (sequenceNumber - 2 because row 1 is current entry)
          const savedIndex = sequenceNumber - 2;
          this.deleteRow(savedIndex);
        }
      } else {
        // No current entry, all rows are from tubeRows
        const index = sequenceNumber - 1;
        this.deleteRow(index);
      }
    }
  }

  // ── Action handlers ───────────────────────────────────────────────────────────
  onCancel(): void {
    this.resetAll();
  }

  private _profileTestsTrigger: HTMLElement | null = null;
  private _unitsInBatchTrigger: HTMLElement | null = null;

  onViewProfileTests(): void {
    const contractId = this.section1ContractId();

    if (!contractId) {
      this.snackbarService.showError('Please select a contract first');
      return;
    }

    this._profileTestsTrigger = document.activeElement as HTMLElement;
    this.showProfileTestsPanel.set(true);
  }

  onViewUnitsInBatch(): void {
    const batchId = this.section1Form.get('batchId')?.value;

    if (!batchId) {
      this.snackbarService.showError('Please select a batch first');
      return;
    }

    this._unitsInBatchTrigger = document.activeElement as HTMLElement;
    this.showUnitsInBatchPanel.set(true);
  }

  onEnterNotes(): void {
    // Get current batch ID and collection date from form
    const batchId = this.section1Form.get('batchId')?.value;
    const collectionDate = this.section1Form.get('collectionDate')?.value;

    if (!batchId || batchId === 'NEW') {
      this.snackbarService.showError('Please select an existing batch to view notes');
      return;
    }

    if (!collectionDate) {
      this.snackbarService.showError('Collection Date is required to view batch notes');
      return;
    }

    // Open donation notes dialog positioned on the right side
    this.dialog.open(DonationNotesDialog, {
      width: '600px',
      height: '100vh',
      maxWidth: '600px',
      maxHeight: '100vh',
      position: { right: '0', top: '0' },
      panelClass: 'side-panel-dialog',
      disableClose: false,
      data: {
        title: 'Batch Notes',
        contextLabel: 'BATCH ID',
        contextValue: batchId,
        valueLabel: 'COLLECTION DATE',
        valueDisplay: moment(collectionDate).format('DD-MMM-YYYY'),
        unitId: batchId, // Use batchId as unitId for notes lookup
        collectionDate: moment(collectionDate).toISOString(),
        transactionId: undefined,
        context: 'RGITUBES', // Regional sample context for API routing
      } as DonationNotesDialogData,
    });
  }

  onCloseProfileTests(): void {
    this.showProfileTestsPanel.set(false);
    setTimeout(() => this._profileTestsTrigger?.focus(), 0);
  }

  onCloseUnitsInBatch(): void {
    this.showUnitsInBatchPanel.set(false);
    setTimeout(() => this._unitsInBatchTrigger?.focus(), 0);
  }

  onSave(): void {
    // Validate required fields
    if (this.section1Form.invalid) {
      this.section1Form.markAllAsTouched();
      this.snackbarService.showError('Please fill in all required fields (Contract ID and Profile Set ID).');
      return;
    }

    // Observation Fix #1: Save only NEW (unsaved) records
    // Include currentUnitEntry if it has data
    const current = this.currentUnitEntry();
    const savedRows = this.tubeRows();

    // Combine current entry (if filled) + saved rows
    const hasCurrentTube = this.isRowFilled(current);
    const allRows = hasCurrentTube ? [current, ...savedRows] : savedRows;

    const filledRows = allRows.filter(row => this.isRowFilled(row));

    if (filledRows.length === 0) {
      this.snackbarService.showError('No unit has been scanned. Please scan at least 1 tube before saving.');
      return;
    }

    const unsavedRows = filledRows.filter(row => !row.isSaved);

    if (unsavedRows.length === 0) {
      this.snackbarService.showError('No new entries to save. All entries have already been saved.');
      return;
    }


    // Build check-in request
    const formValues = this.section1Form.value;

    // Convert tube rows to TubeEntryDto format - ONLY unsaved rows
    // Gap Analysis #13: Include duplicate reason codes from tube entries
    const tubeEntries: TubeEntryDto[] = unsavedRows.map(row => {
      // Determine if any tube in this row has a duplicate reason
      const hasDuplicateReason = !!(
        row.outsideRedDuplicateReason ||
        row.redDuplicateReason ||
        row.osPurple1DuplicateReason ||
        row.purple1DuplicateReason ||
        row.osPurple2DuplicateReason ||
        row.purple2DuplicateReason
      );

      // Use the first available duplicate reason (priority: red > purple1 > purple2)
      const duplicateReasonCode =
        row.redDuplicateReason ||
        row.outsideRedDuplicateReason ||
        row.purple1DuplicateReason ||
        row.osPurple1DuplicateReason ||
        row.purple2DuplicateReason ||
        row.osPurple2DuplicateReason ||
        null;

      // Parse unit IDs to separate base unit ID from check digit
      const outsideRed = this.parseUnitIdWithCheckDigit(row.outsideRed);
      const red = this.parseUnitIdWithCheckDigit(row.red);
      const osPurple1 = this.parseUnitIdWithCheckDigit(row.osPurple1);
      const purple1 = this.parseUnitIdWithCheckDigit(row.purple1);
      const osPurple2 = this.parseUnitIdWithCheckDigit(row.osPurple2);
      const purple2 = this.parseUnitIdWithCheckDigit(row.purple2);

      return {
        osUnitIdRed: outsideRed.unitId,
        unitIdRed: red.unitId,
        redChkDigit: red.checkDigit,
        osRedChkDigit: outsideRed.checkDigit,
        osUnitIdPurple: osPurple1.unitId,
        unitIdPurple: purple1.unitId,
        purpleChkDigit: purple1.checkDigit,
        osPurpleChkDigit: osPurple1.checkDigit,
        osUnitIdSerum: osPurple2.unitId,
        unitIdSerum: purple2.unitId,
        serumChkDigit: purple2.checkDigit,
        osSerumChkDigit: osPurple2.checkDigit,
        duplicateReasonCode,
        duplicateAllowed: hasDuplicateReason
      };
    });

    // Build request DTO
    const request: CheckInRequestDto = {
      contractId: formValues.contractId!,
      profileSetId: formValues.profileSetId || null,
      profileSeqNo: null,
      receivedDate: formValues.receivedDate ? this.convertMomentToIso(
        formValues.receivedDate,
        formValues.receivedTime || '00:00'
      ) : new Date().toISOString(),
      shipmentNo: formValues.shipmentRfid || null,
      shipmentArrivalDate: formValues.shipmentDate ? this.convertMomentToIso(
        formValues.shipmentDate,
        formValues.shipmentTime || '00:00'
      ) : null,
      batchId: formValues.batchId || null,
      collDate: formValues.collectionDate ? this.convertMomentToIso(
        formValues.collectionDate,
        '00:00'
      ) : null,
      tubeFormat: this.determineTubeFormat(tubeEntries), // ✅ Dynamic tube format based on filled columns
      units: tubeEntries
    };

    this.isSaving.set(true);

    // Call API
    this.tubesService.checkIn(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving.set(false);

          if (response.success) {
            // Batch ID is already set from pre-generation call - no need to update it here

            // Add currentUnitEntry to tubeRows if it has data
            const current = this.currentUnitEntry();
            const hasCurrentTube = this.isRowFilled(current);
            const savedRows = this.tubeRows();

            if (hasCurrentTube) {
              // Add current entry to saved rows and mark as saved
              this.tubeRows.set([...savedRows, { ...current, isSaved: true }]);
            } else {
              // Just mark existing unsaved rows as saved
              const updatedRows = savedRows.map(row => {
                if (!row.isSaved) {
                  return { ...row, isSaved: true };
                }
                return row;
              });
              this.tubeRows.set(updatedRows);
            }

            // Reset current entry for next tube
            this.resetTubeEntry();

            // Show success message
            this.snackbarService.showSuccess(response.message || 'Check-in completed successfully');
          } else {
            this.snackbarService.showError(response.message || 'Check-in failed');
          }
        },
        error: (error) => {
          this.isSaving.set(false);
          console.error('Check-in error:', error);

          // Handle field-level validation errors
          if (error.error?.errors && Array.isArray(error.error.errors)) {
            const errorMessages = error.error.errors.map((e: any) => `${e.field}: ${e.message}`).join('\n');
            this.snackbarService.showError(`Validation errors:\n${errorMessages}`);
          } else {
            this.snackbarService.showError(error.error?.message || 'Failed to check in tubes. Please try again.');
          }
        }
      });
  }

  // ── Utility methods ───────────────────────────────────────────────────────────

  /**
   * Parse unit ID to separate base unit ID from check digit
   * Example: "W633326062099-5" → { unitId: "W633326062099", checkDigit: "5" }
   * Example: "W633326062099" → { unitId: "W633326062099", checkDigit: null }
   *
   * @param fullUnitId - Full unit ID with or without check digit
   * @returns Object with unitId and checkDigit
   */
  private parseUnitIdWithCheckDigit(fullUnitId: string | null | undefined): { unitId: string | null; checkDigit: string | null } {
    if (!fullUnitId || fullUnitId.trim() === '') {
      return { unitId: null, checkDigit: null };
    }

    // Check if unit ID contains a hyphen (indicating check digit)
    const lastHyphenIndex = fullUnitId.lastIndexOf('-');
    if (lastHyphenIndex > 0 && lastHyphenIndex < fullUnitId.length - 1) {
      // Extract base unit ID and check digit
      const unitId = fullUnitId.substring(0, lastHyphenIndex);
      const checkDigit = fullUnitId.substring(lastHyphenIndex + 1);
      return { unitId, checkDigit };
    }

    // No check digit found, return full unit ID as-is
    return { unitId: fullUnitId, checkDigit: null };
  }

  /**
   * Check if the given field is the last enabled field based on current option
   * Used for auto-commit functionality when user fills the last enabled field
   *
   * @param controlName - The field name to check
   * @returns true if this is the last enabled field, false otherwise
   */
  private getFieldRef(controlName: string): any {
    const map: Record<string, any> = {
      outsideRed: this.outsideRedField,
      red: this.redField,
      osPurple1: this.osPurple1Field,
      purple1: this.purple1Field,
      osPurple2: this.osPurple2Field,
      purple2: this.purple2Field,
    };
    return map[controlName];
  }

  private focusNextEnabledField(afterControlName: string): void {
    const enabledFields = this.isTubeFieldEnabled();
    const fieldOrder = [
      { name: 'outsideRed', enabled: enabledFields.outsideRed },
      { name: 'red',        enabled: enabledFields.red },
      { name: 'osPurple1', enabled: enabledFields.osPurple1 },
      { name: 'purple1',   enabled: enabledFields.purple1 },
      { name: 'osPurple2', enabled: enabledFields.osPurple2 },
      { name: 'purple2',   enabled: enabledFields.purple2 },
    ];

    const currentIndex = fieldOrder.findIndex(f => f.name === afterControlName);
    if (currentIndex === -1) return;

    for (let i = currentIndex + 1; i < fieldOrder.length; i++) {
      if (fieldOrder[i].enabled) {
        const ref = this.getFieldRef(fieldOrder[i].name);
        if (ref) {
          setTimeout(() => ref.focus(), 50);
        }
        return;
      }
    }
  }

  private isLastEnabledField(controlName: string): boolean {
    const enabledFields = this.isTubeFieldEnabled();

    // Define field order from first to last
    const fieldOrder: Array<{ name: string; enabled: boolean }> = [
      { name: 'outsideRed', enabled: enabledFields.outsideRed },
      { name: 'red', enabled: enabledFields.red },
      { name: 'osPurple1', enabled: enabledFields.osPurple1 },
      { name: 'purple1', enabled: enabledFields.purple1 },
      { name: 'osPurple2', enabled: enabledFields.osPurple2 },
      { name: 'purple2', enabled: enabledFields.purple2 },
    ];

    // Find all enabled fields
    const enabledFieldNames = fieldOrder
      .filter(field => field.enabled)
      .map(field => field.name);

    // Check if current field is the last one in the enabled list
    if (enabledFieldNames.length === 0) {
      return false;
    }

    const lastEnabledField = enabledFieldNames[enabledFieldNames.length - 1];
    return controlName === lastEnabledField;
  }

  /**
   * Determine tube format based on filled columns in tube entries
   * Valid formats: R, R1, R2, P*, P1, P2, or A
   *
   * @param tubeEntries - Array of tube entries to analyze
   * @returns Tube format code
   */
  private determineTubeFormat(tubeEntries: TubeEntryDto[]): string {
    if (tubeEntries.length === 0) {
      return 'R'; // Default to Red if no entries
    }

    // Count which tube types are used across all entries
    let hasRed = false;
    let hasPurple1 = false;
    let hasPurple2 = false;

    tubeEntries.forEach(entry => {
      if (entry.unitIdRed || entry.osUnitIdRed) {
        hasRed = true;
      }
      if (entry.unitIdPurple || entry.osUnitIdPurple) {
        hasPurple1 = true;
      }
      if (entry.unitIdSerum || entry.osUnitIdSerum) {
        hasPurple2 = true;
      }
    });

    // Determine format based on combination
    if (hasRed && hasPurple1 && hasPurple2) {
      return 'A'; // All tubes
    } else if (hasRed && hasPurple1) {
      return 'R1'; // Red + Purple 1
    } else if (hasRed && hasPurple2) {
      return 'R2'; // Red + Purple 2
    } else if (hasRed) {
      return 'R'; // Red only
    } else if (hasPurple1 && hasPurple2) {
      return 'P*'; // Both purple tubes
    } else if (hasPurple1) {
      return 'P1'; // Purple 1 only
    } else if (hasPurple2) {
      return 'P2'; // Purple 2 only
    }

    // Default to Red if no tubes detected
    return 'R';
  }

  /**
   * Convert Moment object (from datepicker) to ISO datetime string in GMT
   * Gap Analysis #4, #5: Dates must be converted to GMT using chapter timezone
   *
   * Flow: User enters date in chapter timezone → Convert to GMT → Send to API
   *
   * @param dateMoment - Moment object from datepicker (in chapter timezone)
   * @param time - Time string in HH:mm format (default: '00:00')
   * @returns ISO 8601 datetime string in GMT
   */
  private convertMomentToIso(dateMoment: Moment | string, time: string = '00:00'): string {
    // If already a string (unlikely but handle it), parse as DD-MMM-YYYY
    if (typeof dateMoment === 'string') {
      return this.tubesService.convertToIsoDateTime(dateMoment, time);
    }

    // If Moment object, format to DD-MMM-YYYY first, then convert to ISO
    // NOTE: The service method convertToIsoDateTime should handle timezone conversion
    // It receives DD-MMM-YYYY format and returns GMT ISO string
    const dateStr = dateMoment.format('DD-MMM-YYYY');
    return this.tubesService.convertToIsoDateTime(dateStr, time);
  }

  /**
   * Show duplicate reason dialog
   * @param unitId - Full unit ID (e.g., RC1234567890)
   * @param errorMessage - Error message from backend
   * @returns Observable of dialog result
   */
  private showDuplicateReasonDialog(
    unitId: string,
    errorMessage: string
  ): Observable<DuplicateReasonDialogResult> {
    const osUnitId = unitId.replace(/^[A-Z]C/, ''); // Remove prefix

    // First, load duplicate history from API
    return new Observable<DuplicateReasonDialogResult>(observer => {
      this.tubesService.getDuplicateUnits(osUnitId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (history) => {
            // Open dialog with complete data including history
            const dialogRef = this.dialog.open(DuplicateReasonDialogComponent, {
              width: '600px',
              disableClose: true,
              ariaDescribedBy: 'dup-dialog-context',
              data: {
                unitId: unitId,
                osUnitId: osUnitId,
                errorMessage: errorMessage,
                duplicateReasons: this.duplicateReasonCodes(),
                duplicateHistory: history
              } as DuplicateReasonDialogData
            });

            // Subscribe to dialog close event
            dialogRef.afterClosed().subscribe(result => {
              observer.next(result);
              observer.complete();
            });
          },
          error: (error) => {
            console.error('Error loading duplicate history:', error);

            // Open dialog without history if API fails
            const dialogRef = this.dialog.open(DuplicateReasonDialogComponent, {
              width: '600px',
              disableClose: true,
              ariaDescribedBy: 'dup-dialog-context',
              data: {
                unitId: unitId,
                osUnitId: osUnitId,
                errorMessage: errorMessage,
                duplicateReasons: this.duplicateReasonCodes(),
                duplicateHistory: []
              } as DuplicateReasonDialogData
            });

            // Subscribe to dialog close event
            dialogRef.afterClosed().subscribe(result => {
              observer.next(result);
              observer.complete();
            });
          }
        });
    });
  }

  private resetAll(): void {
    this.section1Form.reset();
    this.section2Form.reset();
    this.section3Form.reset();

    this.selectedContract.set(null);
    this.selectedProfileSet.set(null);
    this.selectedOption.set(null);
    this.selectedBatch.set(null);

    this.section1ContractId.set(null);
    this.section1ProfileSetId.set(null);
    this.section2OptionCode.set(null);
    this.hasRetrieved.set(false);

    this.profileSetOptions.set([]);
    this.filteredProfileSetOptions.set([]);
    this.shipmentOptions.set([]);
    this.batchIdOptions.set([]);
    this.filteredBatchIdOptions.set([]);

    this.tubeRows.set([
      { outsideRed: '', red: '', osPurple1: '', purple1: '', osPurple2: '', purple2: '' }
    ]);

    // Reset tube entry state
    this.resetTubeEntry();

    // Do not re-set any default option - user must select it manually
  }

  // ── Tube validation handlers (By Units tab) ──────────────────────────────────
  onTubePostValidate(event: UnitIdPostValidateEvent, controlName: string): void {
    // After unit-id-field component validation, call backend validation API
    const contractId = this.section1ContractId();
    const batchId = this.section1Form.get('batchId')?.value;
    const collDate = this.section1Form.get('collectionDate')?.value;

    if (!contractId || !event.data.parsedUnitId) {
      return;
    }

    // Determine tube type from control name
    let tubeType: 'RED' | 'PURPLE' | 'SERUM' | 'RED2';
    if (controlName.includes('Red')) {
      tubeType = 'RED';
    } else if (controlName.includes('Purple')) {
      tubeType = 'PURPLE';
    } else {
      tubeType = 'SERUM';
    }

    // Build validation request
    const validationRequest: ValidateUnitRequestDto = {
      contractId: contractId,
      unitId: event.data.parsedUnitId,
      osUnitId: event.data.parsedUnitId.replace(/^[A-Z]C/, ''), // Remove prefix for OS unit ID
      tubeType: tubeType,
      entryMode: 'SCAN',
      barcodeScheme: event.data.codeScheme || null,
      batchId: batchId || null,
      collDate: collDate ? this.convertMomentToIso(collDate, '00:00') : null
    };

    // Call backend validation API
    this.tubesService.validateUnit(validationRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Extract validation data from response.item (not response.data)
          const validationData = response?.item;

          if (!validationData) {
            // No validation data returned
            const errorMsg = 'No validation data received from server';
            this.snackbarService.showError(errorMsg);
            event.reject(errorMsg);
            return;
          }

          // Check for duplicate-related error codes in validation response
          // Error codes that should trigger duplicate dialog:
          // 2058: Duplicate unit already checked in
          // 2508: Unit exists in a different batch for INTERNAL contract
          // Note: 1099 should NOT trigger duplicate dialog - it's handled as a regular error
          const errorCode = validationData.errorCode;
          const isDuplicateError = errorCode === '2058' || errorCode === '2508';

          // Error code 1099 should never show duplicate dialog
          const isExcludedError = errorCode === '1099';

          // Handle duplicate scenarios
          if (validationData.isDuplicate && validationData.requiresReason && !isExcludedError) {
            // Explicit duplicate flag set by backend (but not for excluded error codes)
            this.showDuplicateReasonDialog(
              event.data.parsedUnitId,
              validationData.errorMessage || 'Unit already checked in'
            ).subscribe((result: DuplicateReasonDialogResult) => {
              if (result.proceed) {
                // Gap Analysis #13: Store duplicate reason code per tube entry
                event.confirm();

                const current = this.currentUnitEntry();
                const key = controlName as keyof TubeEntry;
                const reasonKey = `${controlName}DuplicateReason` as keyof TubeEntry;

                this.currentUnitEntry.set({
                  ...current,
                  [key]: validationData.decodedUnitId || event.data.parsedUnitId,
                  [reasonKey]: result.reasonCode
                });

              } else {
                // User cancelled - reject the validation
                event.reject('Duplicate check-in cancelled');
              }
            });
          } else if (isDuplicateError) {
            // Error code indicates duplicate (even if isDuplicate flag not set)
            this.showDuplicateReasonDialog(
              event.data.parsedUnitId,
              validationData.errorMessage || response?.message || 'Unit already checked in'
            ).subscribe((result: DuplicateReasonDialogResult) => {
              if (result.proceed) {
                event.confirm();

                const current = this.currentUnitEntry();
                const key = controlName as keyof TubeEntry;
                const reasonKey = `${controlName}DuplicateReason` as keyof TubeEntry;

                this.currentUnitEntry.set({
                  ...current,
                  [key]: validationData.decodedUnitId || event.data.parsedUnitId,
                  [reasonKey]: result.reasonCode
                });

              } else {
                event.reject('Duplicate check-in cancelled');
              }
            });
          } else if (!response.success || !validationData.isValid) {
            // Show validation error and reject
            const errorMsg = validationData.errorMessage || response?.message || 'Unit validation failed';
            this.snackbarService.showError(errorMsg);
            event.reject(errorMsg);
          } else {
            // Validation passed - confirm and update with decoded values if available
            event.confirm();

            if (validationData.decodedUnitId) {
              const current = this.currentUnitEntry();
              const key = controlName as keyof TubeEntry;
              this.currentUnitEntry.set({
                ...current,
                [key]: validationData.decodedUnitId
              });
            }
          }
        },
        error: (error) => {
          console.error('Backend validation error:', error);

          // Check for duplicate-related error codes - show duplicate reason dialog
          const errorCode = String(error?.error?.errorCode || error?.error?.errorResponse?.errorCode || '');
          const errorMsg = error?.error?.message || error?.error?.errorResponse?.error || error?.message || 'Failed to validate unit with backend';

          // Error codes that should trigger duplicate dialog:
          // 2058: Duplicate unit already checked in
          // 2508: Unit exists in a different batch for INTERNAL contract
          // Note: 1099 should NOT trigger duplicate dialog - it's handled as a regular error
          const isDuplicateError = errorCode === '2058' || errorCode === '2508';

          if (isDuplicateError) {
            // Show duplicate reason dialog
            this.showDuplicateReasonDialog(
              event.data.parsedUnitId,
              errorMsg || 'Unit already checked in'
            ).subscribe((result: DuplicateReasonDialogResult) => {
              if (result.proceed) {
                // User selected a reason - confirm validation
                event.confirm();

                const current = this.currentUnitEntry();
                const key = controlName as keyof TubeEntry;
                const reasonKey = `${controlName}DuplicateReason` as keyof TubeEntry;

                this.currentUnitEntry.set({
                  ...current,
                  [key]: event.data.parsedUnitId,
                  [reasonKey]: result.reasonCode
                });
              } else {
                // User cancelled - reject the validation
                event.reject('Duplicate check-in cancelled');
              }
            });
            return;
          }

          // Handle other errors
          let displayMsg = errorMsg;
          if (error?.status === 0) {
            displayMsg = 'Unable to connect to server. Please check your connection.';
          } else if (error?.status === 404) {
            displayMsg = 'Validation endpoint not found. Please contact support.';
          }

          this.snackbarService.showError(displayMsg);
          event.reject(displayMsg);
        }
      });
  }

  onTubeValidated(response: UnitValidationResponse, controlName: string): void {
    // Update current entry with validated tube ID from unit-id-field component
    // Use manualUnitId which includes the check digit (e.g., "W619126061910-B")
    const current = this.currentUnitEntry();
    const key = controlName as keyof TubeEntry;
    const unitId = response.manualUnitId || response.parsedUnitId || '';

    // Check if contract has copyIsbtFlag='Y' (all tubes in row must have same ISBT)
    const selectedContract = this.selectedContract();
    const hasCopyIsbtFlag = selectedContract?.copyIsbtFlag === 'Y';

    // Get current enabled fields based on option
    const enabledFields = this.isTubeFieldEnabled();

    // ALWAYS validate that OS fields match each other and Internal fields match each other
    // This validation applies regardless of copyIsbtFlag
    {
      // Separate OS (Outside) fields from normal (inside) fields
      // OS fields: outsideRed (1), osPurple1 (3), osPurple2 (5)
      // Internal fields: red (2), purple1 (4), purple2 (6)
      const osFields = [
        enabledFields.outsideRed && current.outsideRed ? { field: 'outsideRed', id: current.outsideRed, position: 1 } : null,
        enabledFields.osPurple1 && current.osPurple1 ? { field: 'osPurple1', id: current.osPurple1, position: 3 } : null,
        enabledFields.osPurple2 && current.osPurple2 ? { field: 'osPurple2', id: current.osPurple2, position: 5 } : null,
      ].filter((item): item is { field: string; id: string; position: number } => item !== null && item.id.trim() !== '');

      const normalFields = [
        enabledFields.red && current.red ? { field: 'red', id: current.red, position: 2 } : null,
        enabledFields.purple1 && current.purple1 ? { field: 'purple1', id: current.purple1, position: 4 } : null,
        enabledFields.purple2 && current.purple2 ? { field: 'purple2', id: current.purple2, position: 6 } : null,
      ].filter((item): item is { field: string; id: string; position: number } => item !== null && item.id.trim() !== '');

      // Determine if current field is OS or normal
      const isOsField = controlName === 'outsideRed' || controlName === 'osPurple1' || controlName === 'osPurple2';

      // Get current field position
      let currentPosition = 0;
      if (controlName === 'outsideRed') currentPosition = 1;
      else if (controlName === 'red') currentPosition = 2;
      else if (controlName === 'osPurple1') currentPosition = 3;
      else if (controlName === 'purple1') currentPosition = 4;
      else if (controlName === 'osPurple2') currentPosition = 5;
      else if (controlName === 'purple2') currentPosition = 6;

      // Step 1: Validate within the same group (OS or normal)
      // Validate when entering 3rd, 4th, 5th, or 6th field
      if (currentPosition >= 3) {
        if (isOsField) {
          // Validate against other OS fields (outsideRed, osPurple1, osPurple2)
          const firstOsId = osFields.length > 0 ? osFields[0].id : null;
          if (firstOsId && unitId !== firstOsId) {
            // Build user-friendly error message
            const firstField = osFields[0];
            const firstFieldName = firstField.field === 'outsideRed' ? 'OS Red (Field 1)' :
                                   firstField.field === 'osPurple1' ? 'OS Purple 1 (Field 3)' :
                                   'OS Purple 2 (Field 5)';

            const currentFieldName = controlName === 'outsideRed' ? 'OS Red (Field 1)' :
                                     controlName === 'osPurple1' ? 'OS Purple 1 (Field 3)' :
                                     'OS Purple 2 (Field 5)';

            this.snackbarService.showError(
              `Please enter the same ID for all OS fields.`,
              'DISMISS',
              6000
            );
            this.onTubeCleared(controlName);
            return;
          }
        } else {
          // Validate against other normal/internal fields (red, purple1, purple2)
          const firstNormalId = normalFields.length > 0 ? normalFields[0].id : null;
          if (firstNormalId && unitId !== firstNormalId) {
            // Build user-friendly error message
            const firstField = normalFields[0];
            const firstFieldName = firstField.field === 'red' ? 'Red (Field 2)' :
                                   firstField.field === 'purple1' ? 'Purple 1 (Field 4)' :
                                   'Purple 2 (Field 6)';

            const currentFieldName = controlName === 'red' ? 'Red (Field 2)' :
                                     controlName === 'purple1' ? 'Purple 1 (Field 4)' :
                                     'Purple 2 (Field 6)';

            this.snackbarService.showError(
              `Please enter the same ID for all Internal fields.`,
              'DISMISS',
              6000
            );
            this.onTubeCleared(controlName);
            return;
          }
        }
      }

      // Step 2: Auto-paste logic - ONLY when copyIsbtFlag='Y'
      // ONE-WAY ONLY: OS (Outside) fields → Internal fields
      // Scanning OS Red → auto-fills Red
      // Scanning OS Purple 1 → auto-fills Purple 1
      // Scanning OS Purple 2 → auto-fills Purple 2
      // Scanning Internal fields (Red, Purple1, Purple2) → NO auto-fill
      if (hasCopyIsbtFlag) {
        const fieldsToUpdate: Array<{ field: string; ref: any }> = [];

        // Define ONE-WAY mapping: OS field → corresponding internal field ONLY
        const osToInternalMap: Record<string, { field: string; ref: any } | null> = {
          'outsideRed': enabledFields.red && this.redField ? { field: 'red', ref: this.redField } : null,
          'osPurple1': enabledFields.purple1 && this.purple1Field ? { field: 'purple1', ref: this.purple1Field } : null,
          'osPurple2': enabledFields.purple2 && this.purple2Field ? { field: 'purple2', ref: this.purple2Field } : null,
        };

        // Get the target internal field ONLY if scanning an OS field
        const targetField = osToInternalMap[controlName];
        if (targetField) {
          fieldsToUpdate.push(targetField);
        }

        // Auto-paste if there are target fields
        if (fieldsToUpdate.length > 0) {

          // Build updated entry with all auto-pasted values
          const updatedEntry: any = { ...current, [key]: unitId };
          const validationUpdates: any = { ...this.tubeValidationState(), [controlName]: true };

          fieldsToUpdate.forEach(({ field, ref }) => {
            updatedEntry[field] = unitId;
            validationUpdates[field] = true;

            // Programmatically set the target field value and mark as valid
            ref.unitIdControl.setValue(unitId, { emitEvent: false });
            ref.validationState = 'valid';
            ref['_parsedUnitData'] = response;
            ref.validationError = null;
            ref.unitIdControl.setErrors(null);
          });

          this.currentUnitEntry.set(updatedEntry);
          this.tubeValidationState.set(validationUpdates);

          // Check if the last updated field was the last enabled field - if so, auto-commit
          const lastUpdatedField = fieldsToUpdate[fieldsToUpdate.length - 1]?.field;
          if (lastUpdatedField && this.isLastEnabledField(lastUpdatedField)) {
            this.onSave();
          } else if (lastUpdatedField) {
            this.focusNextEnabledField(lastUpdatedField);
          }

          return;
        }
      }
    }

    // Standard flow: Just update the field
    this.currentUnitEntry.set({
      ...current,
      [key]: unitId
    });

    // Mark as validated
    this.tubeValidationState.set({
      ...this.tubeValidationState(),
      [controlName]: true
    });

    // Check if this is the last enabled field - if so, auto-commit; otherwise move focus forward
    if (this.isLastEnabledField(controlName)) {
      this.onSave();
    } else {
      this.focusNextEnabledField(controlName);
    }
  }

  onTubeCleared(controlName: string): void {
    // Clear the tube entry
    const current = this.currentUnitEntry();
    const key = controlName as keyof TubeEntry;

    this.currentUnitEntry.set({
      ...current,
      [key]: ''
    });

    // Mark as not validated
    this.tubeValidationState.set({
      ...this.tubeValidationState(),
      [controlName]: false
    });

  }

  onTubeFieldBlur(controlName: string): void {
    // When user leaves (tabs out of) the last enabled field, trigger auto-commit
    if (this.isLastEnabledField(controlName)) {
      // Only save if there's any data to save
      const current = this.currentUnitEntry();
      const hasAnyData = this.isRowFilled(current) || this.tubeRows().some(row => this.isRowFilled(row));

      if (hasAnyData) {
        this.onSave();
      }
    }
  }

  onTubeEnterSubmit(): void {
    // Enter key pressed - do nothing until SAVE button is clicked
    // Data stays in currentUnitEntry and will be saved when user clicks SAVE
    // No longer adding to table immediately
  }


  private resetTubeEntry(): void {
    // Reset currentUnitEntry signal
    this.currentUnitEntry.set({
      outsideRed: '',
      red: '',
      osPurple1: '',
      purple1: '',
      osPurple2: '',
      purple2: ''
    });

    // Reset validation state
    this.tubeValidationState.set({
      outsideRed: false,
      red: false,
      osPurple1: false,
      purple1: false,
      osPurple2: false,
      purple2: false
    });

    // Clear the visual input fields by calling their clear methods
    if (this.outsideRedField) this.outsideRedField.clear();
    if (this.redField) this.redField.clear();
    if (this.osPurple1Field) this.osPurple1Field.clear();
    if (this.purple1Field) this.purple1Field.clear();
    if (this.osPurple2Field) this.osPurple2Field.clear();
    if (this.purple2Field) this.purple2Field.clear();
  }
}
