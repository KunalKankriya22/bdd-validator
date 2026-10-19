import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, effect, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, FormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, combineLatest, debounceTime, finalize, startWith } from 'rxjs';
import moment, { Moment } from 'moment';

import { CancelDriveDialogComponent } from '../cancel-drive-dialog/cancel-drive-dialog';
import { CancelDriveService } from '../../../../post-donation-drive-analysis/coll-staff-documentation-errors/manage-special-drive/services/cancel-drive.service';
import { SpecialDriveService } from '../services/special-drive.service';
import {
  SpecialDriveDto,
  DriveCategoryLookup,
  ResourceLookup,
  SponsorLookup,
  LocationLookup,
  RecruiterLookup,
  CreateSpecialDriveRequest,
  UpdateSpecialDriveRequest,
  DriveSponsorDto,
  DriveResourceDto
} from '../models/special-drive.model';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import {
  driveDateNotTooOldValidator,
  timeFormatValidator,
  endTimeAfterStartTimeValidator,
  projectedShowPositiveValidator,
  deferralRateRangeValidator
} from '../validators/special-drive.validators';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig, ActionButton } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { effectiveDateNotPastValidator } from '@shared/validators/date.validators';
import { NotesManagerComponent, NoteItem, NoteActionEvent, NotesConfig } from '@shared/components';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

interface ResourceRow {
  resourceCode: string;
  resourceDescription: string;
  number: number;
}

interface ResourceError {
  hasError: boolean;
  errorCode: string;
  errorMessage: string;
}

interface Comment {
  id: number;
  userName: string;
  userAvatar?: string;
  timestamp: string;
  version: string;
  text: string;
}

interface DropdownOption {
  value: string;
  label: string;
  name?: string;
}

@Component({
  selector: 'app-add-edit-special-drive',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    NotesManagerComponent,
    CancelDriveDialogComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-special-drive.html',
  styleUrls: ['./add-edit-special-drive.scss']
})
export class AddEditSpecialDriveComponent implements OnInit, OnDestroy {
  @Input() mode: 'add' | 'edit' | 'duplicate' = 'add';
  @Input() data: SpecialDriveDto | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  driveForm!: FormGroup;
  isSubmitting = false;
  isLoadingLookups = false;
  currentChapterId = '';

  /** SPDR_LIMIT from VALID_PARAMETERS — how many days in the past a drive date is allowed. */
  readonly spdrLimit = signal(30);

  /**
   * Minimum date for drive date picker.
   * FMB BR-007: minDate = chapterLocalDate − SPDR_LIMIT days.
   * chapterLocalDate comes from ChapterTimezoneService; SPDR_LIMIT from the API.
   */
  get minDriveDate(): Moment {
    const chapterLocalDate = this.chapterTimezoneService.chapterLocalDate();
    return (chapterLocalDate ?? moment()).clone().startOf('day');
  }

  readonly pastDateFilter = (date: Moment | null): boolean => {
    const min = this.chapterTimezoneService.chapterLocalDate();
    if (!date) return false;
    if (!min) return true;
    return date.isSameOrAfter(min, 'day');
  };

  // Resources table
  resources: ResourceRow[] = [];
  resourceErrors: Map<number, ResourceError> = new Map();
  initialRowCount = 4;

  // Comments section
  comments: any[] = [];
  newComment = '';

  // Notes Manager configuration
  notesConfig: NotesConfig = {
    placeholder: 'Add Notes',
    textareaRows: 4,
    maxLength: 240,  // Matches CENTRAL_NOTES.NOTE column max length
    showUserInfo: true,
    allowEdit: true,
    allowDelete: true
  };

  // Search controls for dropdowns
  driveIdSearchCtrl = new FormControl('');
  sponsorSearchCtrl = new FormControl('');
  locationSearchCtrl = new FormControl('');
  recruiterSearchCtrl = new FormControl('');
  categorySearchCtrl = new FormControl('');
  resourceSearchCtrl = new FormControl('');
  driveTypeSearchCtrl = new FormControl('');

  // Per-row search controls for the resource code LOV dropdown
  resourceRowSearchCtrls: FormControl[] = [];

  // Track raw Drive Date input to distinguish empty field from invalid input
  private driveDateRawInput: string = '';

  // Signal-based lookup data
  readonly driveIdSearch = signal('');
  readonly driveIdOptionsSignal = signal<string[]>([]);
  readonly filteredDriveIdOptions = computed(() => {
    const search = this.driveIdSearch().toLowerCase();
    const options = this.driveIdOptionsSignal();
    if (!search) return options;
    return options.filter(id => id.toLowerCase().includes(search));
  });

  readonly sponsorSearch = signal('');
  readonly sponsorOptionsSignal = signal<SponsorLookup[]>([]);
  readonly filteredSponsorOptions = computed(() => {
    const search = this.sponsorSearch().toLowerCase();
    const options = this.sponsorOptionsSignal();
    if (!search) return options;
    return options.filter(s =>
      s.sponsorId.toLowerCase().includes(search) ||
      s.name.toLowerCase().includes(search)
    );
  });

  readonly locationSearch = signal('');
  readonly locationOptionsSignal = signal<LocationLookup[]>([]);
  readonly filteredLocationOptions = computed(() => {
    const search = this.locationSearch().toLowerCase();
    const options = this.locationOptionsSignal();
    if (!search) return options;
    return options.filter(l =>
      l.locationId.toLowerCase().includes(search) ||
      (l.locationName && l.locationName.toLowerCase().includes(search))
    );
  });

  readonly recruiterSearch = signal('');
  readonly recruiterOptionsSignal = signal<RecruiterLookup[]>([]);
  readonly filteredRecruiterOptions = computed(() => {
    const search = this.recruiterSearch().toLowerCase();
    const options = this.recruiterOptionsSignal();
    if (!search) return options;
    return options.filter(r =>
      r.employeeId.toLowerCase().includes(search) ||
      (r.employeeName && r.employeeName.toLowerCase().includes(search))
    );
  });

  readonly categorySearch = signal('');
  readonly categoryOptionsSignal = signal<DriveCategoryLookup[]>([]);
  readonly filteredCategoryOptions = computed(() => {
    const search = this.categorySearch().toLowerCase();
    const options = this.categoryOptionsSignal();
    if (!search) return options;
    return options.filter(c =>
      c.code.toLowerCase().includes(search) ||
      c.description.toLowerCase().includes(search)
    );
  });

  readonly resourceSearch = signal('');
  readonly resourceOptionsSignal = signal<ResourceLookup[]>([]);
  readonly filteredResourceOptions = computed(() => {
    const search = this.resourceSearch().toLowerCase();
    const options = this.resourceOptionsSignal();
    if (!search) return options;
    return options.filter(r =>
      r.code.toLowerCase().includes(search) ||
      r.description.toLowerCase().includes(search)
    );
  });

  // Static drive type options
  driveTypeOptions = [
    { value: 'F', label: 'Fixed' },
    { value: 'I', label: 'Inside' },
    { value: 'C', label: 'Coach' }
  ];

  readonly driveTypeSearch = signal('');
  readonly filteredDriveTypeOptions = computed(() => {
    const search = this.driveTypeSearch().toLowerCase();
    const options = this.driveTypeOptions;

    // Apply search filter
    if (!search) return options;
    return options.filter(t => t.label.toLowerCase().includes(search));
  });

  // Filtered options for "Create As" dropdown in duplicate mode (Inside and Coach only)
  readonly filteredCreateAsOptions = computed(() => {
    const search = this.driveTypeSearch().toLowerCase();
    // Only show Inside and Coach for "Create As" in duplicate mode
    const options = this.driveTypeOptions.filter(opt => opt.value === 'I' || opt.value === 'C');

    // Apply search filter
    if (!search) return options;
    return options.filter(t => t.label.toLowerCase().includes(search));
  });

  // Status options
  statusOptions = [
    { value: 'CNFRM', label: 'Confirmed' },
    { value: 'HOLD', label: 'Hold' },
    { value: 'CANCL', label: 'Cancelled' }
  ];

  // Sponsor caching
  private sponsorCache = new Map<string, SponsorLookup[]>();

  private destroy$ = new Subject<void>();

  // Transform comments to NoteItem format for notes-manager
  get noteItems(): NoteItem[] {
    return this.comments.map(c => ({
      id: c.noteSequence || c.id,
      text: c.note || c.text,
      // Priority: 1) insertUserName (full name), 2) userName (fallback), 3) insertUser (username)
      userName: c.insertUserName || c.userName || c.insertUser || 'Unknown',
      timestamp: c.timestamp || (c.insertDate ? this.formatDate(c.insertDate.toString()) : ''),
      version: c.version || '1.0',
      metadata: {
        noteId: c.noteId,
        insertDate: c.insertDate,
        insertUser: c.insertUser
      }
    }));
  }

  get currentUserName(): string {
    return this.headerService.headerConfig().user?.name || 'Current User';
  }

  get currentUserId(): string {
    return this.headerService.headerConfig().user?.id || '';
  }

  get isFormValid(): boolean {
    return this.driveForm?.valid || false;
  }

  constructor(
    private fb: FormBuilder,
    private driveService: SpecialDriveService,
    private cancelDriveService: CancelDriveService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService,
    private chapterTimezoneService: ChapterTimezoneService,
    private dialog: MatDialog
  ) {
    effect(() => {
      const newChapterId = this.headerService.chapterId();

      // Clear sponsor cache when chapter changes
      if (this.currentChapterId && newChapterId !== this.currentChapterId) {
        this.sponsorCache.clear();
      }

      this.currentChapterId = newChapterId;
    });
  }

  ngOnInit(): void {
    // Set chapter ID from header service before loading lookups
    this.currentChapterId = this.headerService.chapterId();

    // Clear sponsor cache on each panel open so newly added sponsors are always visible
    this.sponsorCache.clear();

    this.initializeForm();
    this.loadLookupData();
    this.setupSearchSubscriptions();
    this.setupFormValidationListener();

    // ChapterAwareDateAdapter automatically handles "today" highlighting in calendar
    // using the chapter timezone from HeaderService (no [startAt] binding needed)

    // Initialize Drive ID options (empty for create mode - ID is auto-generated)
    this.driveIdOptionsSignal.set([]);

    // Initialize empty comments array for all modes
    this.comments = [];

    if ((this.mode === 'edit' || this.mode === 'duplicate') && this.data) {
      // In duplicate mode, show source drive ID as reference
      if (this.mode === 'duplicate' && this.data.driveId) {
        this.driveIdOptionsSignal.set([this.data.driveId]);
      }
      this.populateForm();

      // In edit/duplicate mode, mark form as touched to show validation errors immediately
      if (this.mode === 'edit' || this.mode === 'duplicate') {
        this.driveForm.markAllAsTouched();
      }
    } else {
      // For add mode, initialize 4 empty rows
      this.resources = Array.from({ length: this.initialRowCount }, () => ({
        resourceCode: '',
        resourceDescription: '',
        number: 0
      }));
    }
    this.initializeHeaderConfig();
  }

  private loadLookupData(): void {
    this.isLoadingLookups = true;

    // Load all lookups in parallel
    combineLatest([
      this.driveService.getDriveCategories(),
      this.driveService.getResources(this.currentChapterId),
      this.driveService.getLocations(this.currentChapterId),
      this.driveService.getRecruiters(this.currentChapterId)
    ])
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoadingLookups = false))
      )
      .subscribe({
        next: ([categories, resources, locations, recruiters]) => {
          this.categoryOptionsSignal.set(categories);
          this.resourceOptionsSignal.set(resources);
          this.locationOptionsSignal.set(locations);

          // In edit mode, ensure the existing recruiter appears in the dropdown even if
          // they are not in the active-recruiter list (e.g. deactivated). Without this,
          // the mat-select shows empty while the form control still holds the old ID,
          // making the form "valid" but the API reject it with error 11104.
          const currentRecruiterId = this.driveForm.get('recruiterId')?.value;
          if (this.mode === 'edit' && currentRecruiterId &&
              !recruiters.some(r => r.employeeId === currentRecruiterId)) {
            const existingRecruiter: RecruiterLookup = {
              employeeId: currentRecruiterId,
              employeeName: this.data?.recruiterName || currentRecruiterId
            };
            this.recruiterOptionsSignal.set([existingRecruiter, ...recruiters]);
          } else {
            this.recruiterOptionsSignal.set(recruiters);
          }
        },
        error: (error) => {
          console.error('Error loading lookup data:', error);
          this.snackBar.open('Error loading form options', 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });

    // Load default deferral rate from API and apply only in add mode
    if (this.mode === 'add') {
      this.driveService.getDefaultDeferralRate()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (rate) => {
            this.driveForm.get('projDeferralRate')?.setValue(rate);
          },
          error: () => {
            this.driveForm.get('projDeferralRate')?.setValue(18);
          }
        });
    }

    // Load SPDR_LIMIT — controls how far in the past a drive date may be set (BR-007)
    this.driveService.getSpdrLimit()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (limit) => {
          this.spdrLimit.set(limit);
          this.driveForm.get('driveDate')?.updateValueAndValidity();
        },
        error: () => {
          // Keep default of 30 days on API failure
        }
      });

    // Load sponsors with empty search initially
    this.loadSponsors('');
  }

  private loadSponsors(searchText: string): void {
    // Skip if search text is provided but less than 3 characters
    if (searchText && searchText.trim().length > 0 && searchText.trim().length < 3) {
      return;
    }

    const normalizedSearch = searchText.toLowerCase().trim();

    // Check cache first
    if (this.sponsorCache.has(normalizedSearch)) {
      this.sponsorOptionsSignal.set(this.sponsorCache.get(normalizedSearch)!);
      return;
    }

    // Fetch sponsors with proper pagination (up to 100 results)
    this.driveService.getSponsors(this.currentChapterId, searchText, 100, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sponsors) => {
          // Cache the results
          this.sponsorCache.set(normalizedSearch, sponsors);
          this.sponsorOptionsSignal.set(sponsors);
        },
        error: (error) => {
          console.error('Error loading sponsors:', error);

          // Show user-friendly error message
          const errorMessage = error?.message || 'Failed to load sponsors. Please try again.';
          this.snackBar.open(errorMessage, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });

          // Clear sponsors on error
          this.sponsorOptionsSignal.set([]);
        }
      });
  }

  private setupSearchSubscriptions(): void {
    // Drive ID search
    this.driveIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.driveIdSearch.set(value || ''));

    // Sponsor search
    this.sponsorSearchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.sponsorSearch.set(value || '');
        if (value && value.length >= 3) {
          this.loadSponsors(value);
        } else if (!value || value.length === 0) {
          // When search is cleared, reload the full sponsor list
          this.loadSponsors('');
        }
      });

    // Location search
    this.locationSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.locationSearch.set(value || ''));

    // Recruiter search
    this.recruiterSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.recruiterSearch.set(value || ''));

    // Category search
    this.categorySearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.categorySearch.set(value || ''));

    // Resource search
    this.resourceSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.resourceSearch.set(value || ''));

    // Drive Type search
    this.driveTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.driveTypeSearch.set(value || ''));
  }

  private initializeHeaderConfig(): void {
    const isEditMode = this.mode === 'edit';
    const isDuplicateMode = this.mode === 'duplicate';

    let title: string;
    let subtitle: string;
    let breadcrumbLabel: string;

    if (isEditMode && this.data) {
      title = this.data.driveId;
      const lastModDate = this.data.lastModifiedDate || this.data.insertDate;
      subtitle = lastModDate
        ? `Last Updated: ${this.formatDate(lastModDate.toString())}`
        : 'Manage Special Drive';
      breadcrumbLabel = 'Manage Special Drive';
    } else if (isDuplicateMode && this.data) {
      title = `Duplicate of ${this.data.driveId}`;
      subtitle = 'Creating new drive from template';
      breadcrumbLabel = 'Create or Modify Special Drive';
    } else {
      title = 'Create Special Drive';
      subtitle = 'Create new blood donation drive';
      breadcrumbLabel = 'Create or Modify Special Drive';
    }

    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/home'
        },
        {
          label: breadcrumbLabel,
          link: null
        }
      ],
      title: title,
      subtitle: subtitle,
      showBackButton: true,
      onBackClick: () => this.onClose(),
      actions: this.getHeaderActions()
    };
  }

  private getHeaderActions(): ActionButton[] {
    const actions: ActionButton[] = [
      {
        label: 'CLEAR ALL',
        icon: '',
        variant: 'text',
        ariaLabel: 'Clear all fields',
        onClick: () => this.onClearAll()
      }
    ];

    if (this.mode === 'edit') {
      actions.push({
        label: 'CANCEL SPECIAL DRIVE',
        icon: '',
        variant: 'outlined',
        ariaLabel: 'Cancel this special drive',
        onClick: () => this.onCancelDrive()
      });
    }

    actions.push({
      label: 'SAVE & CREATE DRIVE',
      icon: '',
      variant: 'filled',
      ariaLabel: 'Save and create drive',
      disabled: !this.isFormValid,
      onClick: () => this.onSubmit()
    });

    return actions;
  }

  private setupFormValidationListener(): void {
    // Update header actions when form validity changes
    this.driveForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Update only the disabled property of the SAVE button
        const saveButton = this.headerConfig.actions?.find(a => a.label === 'SAVE & CREATE DRIVE');
        if (saveButton) {
          saveButton.disabled = !this.isFormValid;
        }
      });
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.driveForm = this.fb.group({
      createAs: [''],
      driveId: [''],
      sponsorId: ['', Validators.required],
      sponsorName: [''],
      projectedShow: [
        '',
        [
          Validators.required,
          Validators.min(1),
          Validators.max(999999), // Max for NUMBER(6) in database
          projectedShowPositiveValidator()
        ]
      ],
      projDeferralRate: [
        null,
        [
          Validators.required,
          deferralRateRangeValidator()
        ]
      ],
      projectedDraw: [{ value: '', disabled: true }], // Calculated field
      driveDate: [
        '',
        [
          Validators.required,
          driveDateNotTooOldValidator(() => this.spdrLimit(), () => this.chapterTimezoneService.chapterLocalDate()),
          this.driveDateFormatValidator()
        ]
      ],
      driveType: ['', Validators.required],
      category: ['', Validators.required],
      scheduleStartTime: [
        '',
        [
          Validators.required,
          timeFormatValidator()
        ]
      ],
      scheduleEndTime: [
        '',
        [
          Validators.required,
          timeFormatValidator()
        ]
      ],
      locationId: ['', Validators.required],
      locationName: [''],
      recruiterId: ['', Validators.required],
      recruiterName: [''],
      status: ['CNFRM', Validators.required],
      notes: ['']
    }, {
      validators: [
        endTimeAfterStartTimeValidator()
      ]
    });

    // Set up auto-population listeners
    this.setupFormListeners();
  }

  private setupFormListeners(): void {
    // Auto-populate Sponsor Name when Sponsor ID changes
    this.driveForm.get('sponsorId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(sponsorId => {
        const sponsor = this.sponsorOptionsSignal().find(s => s.sponsorId === sponsorId);
        this.driveForm.patchValue({
          sponsorName: sponsor?.name || ''
        }, { emitEvent: false });
      });

    // Auto-populate Location Name when Location ID changes
    this.driveForm.get('locationId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(locationId => {
        const location = this.locationOptionsSignal().find(l => l.locationId === locationId);
        this.driveForm.patchValue({
          locationName: location?.locationName || ''
        }, { emitEvent: false });
      });

    // Auto-populate Recruiter Name when Recruiter ID changes
    this.driveForm.get('recruiterId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(recruiterId => {
        const recruiter = this.recruiterOptionsSignal().find(r => r.employeeId === recruiterId);
        this.driveForm.patchValue({
          recruiterName: recruiter?.employeeName || ''
        }, { emitEvent: false });
      });

    // BR-013/BR-014: Calculate Projected Draw
    // Formula: ((100 - deferralRate) / 100) * projectedShow
    combineLatest([
      this.driveForm.get('projectedShow')!.valueChanges.pipe(
        startWith(this.driveForm.get('projectedShow')!.value)
      ),
      this.driveForm.get('projDeferralRate')!.valueChanges.pipe(
        startWith(this.driveForm.get('projDeferralRate')!.value)
      )
    ])
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(([projectedShow, projDeferralRate]) => {
        if (projectedShow && projDeferralRate !== null && projDeferralRate !== undefined) {
          const projectedDraw = Math.round(((100 - projDeferralRate) / 100) * projectedShow);
          this.driveForm.patchValue(
            { projectedDraw },
            { emitEvent: false }
          );
        }
      });
  }

  private populateForm(): void {
    if (!this.data) return;

    const firstSponsor = this.data.sponsors && this.data.sponsors[0];

    this.driveForm.patchValue({
      driveId: this.data.driveId,
      sponsorId: firstSponsor?.sponsorId || '',
      sponsorName: firstSponsor?.sponsorName || '',
      projectedShow: firstSponsor?.projectedShow || 0,
      projDeferralRate: firstSponsor?.projDeferralRate || 0,
      projectedDraw: firstSponsor?.projectedDraw || 0,
      driveDate: this.data.driveDate ? moment(String(this.data.driveDate).substring(0, 10), 'YYYY-MM-DD') : null,
      driveType: this.data.driveType,
      category: this.data.driveCategory,
      scheduleStartTime: this.extractTimeFromDateTime(this.data.scheduleStartTime),
      scheduleEndTime: this.extractTimeFromDateTime(this.data.scheduleEndTime),
      locationId: this.data.locationId || '',
      locationName: this.data.locationName || '',
      recruiterId: this.data.recruiterId || '',
      recruiterName: this.data.recruiterName || '',
      status: this.data.status || 'CNFRM',
      notes: ''
    });

    // Populate resources from data
    if (this.mode === 'edit' && this.data.resources && this.data.resources.length > 0) {
      // Load existing resources
      this.resources = this.data.resources.map(r => ({
        resourceCode: r.resourceCode,
        resourceDescription: r.resourceDescription || '',
        number: r.numberRequired
      }));

      // Add empty rows to ensure minimum of initialRowCount (4) total rows
      // This allows users to add new resources while editing
      const currentRowCount = this.resources.length;
      if (currentRowCount < this.initialRowCount) {
        const emptyRowsNeeded = this.initialRowCount - currentRowCount;
        const emptyRows = Array.from({ length: emptyRowsNeeded }, () => ({
          resourceCode: '',
          resourceDescription: '',
          number: 0
        }));
        this.resources = [...this.resources, ...emptyRows];
      }
    } else if (this.mode === 'duplicate') {
      // For duplicate mode, copy resources from source drive
      if (this.data.resources && this.data.resources.length > 0) {
        this.resources = this.data.resources.map(r => ({
          resourceCode: r.resourceCode,
          resourceDescription: r.resourceDescription || '',
          number: r.numberRequired
        }));

        // Always ensure minimum number of rows (4) for duplicate mode
        if (this.resources.length < this.initialRowCount) {
          const emptyRows = Array.from({ length: this.initialRowCount - this.resources.length }, () => ({
            resourceCode: '',
            resourceDescription: '',
            number: 0
          }));
          this.resources = [...this.resources, ...emptyRows];
        }
      } else {
        // If no resources, initialize empty rows
        this.resources = Array.from({ length: this.initialRowCount }, () => ({
          resourceCode: '',
          resourceDescription: '',
          number: 0
        }));
      }

      // Copy notes for duplicate mode (consistent with resource copying behavior)
      // Keep driveId populated to show which drive is being duplicated
      // (A new ID will be auto-generated when saved)
    } else {
      // For add mode, initialize empty rows
      this.resources = Array.from({ length: this.initialRowCount }, () => ({
        resourceCode: '',
        resourceDescription: '',
        number: 0
      }));
    }

    // Populate notes from data (for edit and duplicate modes)
    if ((this.mode === 'edit' || this.mode === 'duplicate') && this.data.notes && this.data.notes.length > 0) {
      this.comments = this.data.notes.map(n => ({
        id: n.noteSequence,
        noteSequence: n.noteSequence,
        noteId: n.noteId,
        userName: n.insertUserName || n.insertUser || 'Unknown',
        insertUser: n.insertUser,
        insertUserName: n.insertUserName,
        insertDate: n.insertDate,
        version: n.insertDate ? `${n.noteSequence}.0 | ${this.formatDate(n.insertDate.toString())}` : `${n.noteSequence}.0`,
        timestamp: n.insertDate ? this.formatDate(n.insertDate.toString()) : '',
        text: n.note,
        note: n.note
      }));
    }
  }

  getSelectedSponsorName(): string {
    const sponsorId = this.driveForm.get('sponsorId')?.value;
    if (!sponsorId) return '';
    const sponsor = this.sponsorOptionsSignal().find(s => s.sponsorId === sponsorId);
    return sponsor?.name || '';
  }

  getResourceSearchCtrl(index: number): FormControl {
    if (!this.resourceRowSearchCtrls[index]) {
      this.resourceRowSearchCtrls[index] = new FormControl('');
    }
    return this.resourceRowSearchCtrls[index];
  }

  filteredResourceOptionsForRow(index: number): ResourceLookup[] {
    const search = (this.resourceRowSearchCtrls[index]?.value || '').toLowerCase();
    const options = this.resourceOptionsSignal();
    if (!search) return options;
    return options.filter(r =>
      r.code.toLowerCase().includes(search) ||
      r.description.toLowerCase().includes(search)
    );
  }

  onResourceCodeSelect(index: number, code: string): void {
    const resourceLookup = this.resourceOptionsSignal().find(r => r.code === code);
    if (resourceLookup) {
      this.resources[index].resourceDescription = resourceLookup.description;
    }
    this.clearResourceError(index);

    if (this.hasDuplicateResourceCode(code, index)) {
      this.setResourceError(index, '13002', 'This resource has already been added to the drive.');
      return;
    }

    if (code && code.trim() !== '' && (this.resources[index].number === null || this.resources[index].number === undefined)) {
      this.setResourceError(index, 'numberRequired', 'Number is required.');
    }
  }

  addNewResource(): void {
    this.resources.push({ resourceCode: '', resourceDescription: '', number: 0 });
  }

  deleteResource(index: number): void {
    this.resources.splice(index, 1);
    this.resourceRowSearchCtrls.splice(index, 1);
    this.resourceErrors.delete(index);
    const newErrors = new Map<number, ResourceError>();
    this.resourceErrors.forEach((value, key) => {
      if (key > index) newErrors.set(key - 1, value);
      else if (key < index) newErrors.set(key, value);
    });
    this.resourceErrors = newErrors;
  }

  onClose(): void {
    this.closePanel.emit();
  }

  onCancelDrive(): void {
    if (!this.data?.driveId) return;
    const dialogRef = this.dialog.open(CancelDriveDialogComponent, {
      width: '560px',
      data: {
        driveId: this.data.driveId,
        driveDate: this.data.driveDate ? String(this.data.driveDate) : undefined,
        sponsorName: (this.data as any).sponsorName || undefined
      }
    });
    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          const cancelReasonCode = result.cancelCode || undefined;
          const cancelReason = result.comments || undefined;
          this.cancelDriveService.cancelDrive(this.data!.driveId, {
            cancelReasonCode,
            cancelReason,
            confirmCancellation: true
          })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.snackBar.open('Drive cancelled successfully', 'DISMISS', {
                  horizontalPosition: 'end',
                  verticalPosition: 'top',
                  duration: 3000
                });
                this.saveSuccess.emit();
              },
              error: () => {
                this.snackBar.open('Error cancelling drive. Please try again.', 'DISMISS', {
                  horizontalPosition: 'end',
                  verticalPosition: 'top'
                });
              }
            });
        }
      });
  }

  onClearAll(): void {
    this.driveForm.reset();
    this.resourceErrors.clear(); // Clear error state
    // Re-initialize 4 empty rows after clearing
    this.resources = Array.from({ length: this.initialRowCount }, () => ({
      resourceCode: '',
      resourceDescription: '',
      number: 0
    }));
  }

  onResourceChange(index: number): void {
    const resource = this.resources[index];

    // Convert resource code to uppercase
    if (resource.resourceCode && typeof resource.resourceCode === 'string') {
      resource.resourceCode = resource.resourceCode.toUpperCase();
    }

    // Clear previous errors for this row
    this.clearResourceError(index);

    // Validation #17: Invalid resource code
    if (resource.resourceCode && resource.resourceCode.trim() !== '') {
      if (!this.isValidResourceCode(resource.resourceCode)) {
        this.setResourceError(index, '11002', 'Invalid resource code.');
        return; // Don't auto-populate for invalid codes
      }

      // Validation #18: Duplicate resource code
      if (this.hasDuplicateResourceCode(resource.resourceCode, index)) {
        this.setResourceError(index, '13002', 'This resource has already been added to the drive.');
        return; // Don't auto-populate for duplicates
      }
    }

    // Number is required when resource code is set
    if (resource.resourceCode && resource.resourceCode.trim() !== '' &&
        (resource.number === null || resource.number === undefined)) {
      this.setResourceError(index, 'numberRequired', 'Number is required.');
      return;
    }

    // Validation #19: Negative number
    if (resource.number !== null && resource.number !== undefined && resource.number < 0) {
      this.setResourceError(index, '11131', 'Number required cannot be negative.');
      return;
    }

    // Validation #20: Decimal number (must be whole number only)
    if (resource.number !== null && resource.number !== undefined && !Number.isInteger(resource.number)) {
      this.setResourceError(index, '11131', 'Number must be a whole number (no decimals allowed).');
      return;
    }

    // Auto-populate resource description (existing logic)
    if (resource.resourceCode && !resource.resourceDescription) {
      const resourceLookup = this.resourceOptionsSignal().find(
        r => r.code === resource.resourceCode
      );
      if (resourceLookup) {
        resource.resourceDescription = resourceLookup.description;
      }
    }

    // Add new row if current row is complete and has no errors
    const isRowComplete = resource.resourceCode &&
                          resource.resourceDescription &&
                          resource.number !== null && resource.number !== undefined &&
                          !this.resourceErrors.has(index);
    const isLastRow = index === this.resources.length - 1;

    if (isRowComplete && isLastRow) {
      this.resources.push({
        resourceCode: '',
        resourceDescription: '',
        number: 0
      });
    }
  }

  /**
   * Validates if resource code exists in lookup data
   * Requirement #17: Invalid resource code validation
   */
  private isValidResourceCode(code: string): boolean {
    if (!code || code.trim() === '') {
      return true; // Empty is valid (not required)
    }

    const options = this.resourceOptionsSignal();
    if (!options || options.length === 0) {
      return true; // Can't validate without lookup data, assume valid
    }

    return options.some(r => r.code === code);
  }

  /**
   * Checks for duplicate resource codes
   * Requirement #18: Duplicate resource code validation
   */
  private hasDuplicateResourceCode(code: string, currentIndex: number): boolean {
    if (!code || code.trim() === '') {
      return false;
    }
    return this.resources.some((resource, index) =>
      index !== currentIndex &&
      resource.resourceCode &&
      resource.resourceCode.trim() === code.trim()
    );
  }

  /**
   * Sets error for specific resource row
   */
  private setResourceError(index: number, errorCode: string, message: string): void {
    this.resourceErrors.set(index, {
      hasError: true,
      errorCode,
      errorMessage: message
    });
  }

  /**
   * Clears errors for specific resource row
   */
  private clearResourceError(index: number): void {
    this.resourceErrors.delete(index);
  }

  /**
   * Checks if any resource has errors
   */
  private hasAnyResourceErrors(): boolean {
    return this.resourceErrors.size > 0;
  }

  /**
   * Gets error for specific field (template helper)
   */
  getResourceError(index: number, field: 'code' | 'number'): ResourceError | null {
    const error = this.resourceErrors.get(index);
    if (!error || !error.hasError) {
      return null;
    }

    // Return error only if it matches the field
    if (field === 'code' && (error.errorCode === '11002' || error.errorCode === '13002')) {
      return error;
    }
    if (field === 'number' && (error.errorCode === '11131' || error.errorCode === 'numberRequired')) {
      return error;
    }

    return null;
  }

  isNumberRequiredError(index: number): boolean {
    return this.resourceErrors.get(index)?.errorCode === 'numberRequired';
  }

  /**
   * Tracks the raw text input for Drive Date field before parsing.
   * This allows the validator to distinguish between empty field vs invalid input.
   */
  onDriveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.driveDateRawInput = input.value?.trim() || '';

    setTimeout(() => {
      this.driveForm.get('driveDate')?.updateValueAndValidity({ emitEvent: false });
      // Emit form-level status change so cross-field error bindings (startTimeBeforeChapterTime,
      // endTimeBeforeStart) refresh when the drive date becomes invalid or is cleared.
      this.driveForm.updateValueAndValidity();
    }, 0);
  }

  /**
   * Clears the raw input tracking when a valid date is selected from the calendar picker.
   */
  onDriveDateChange(): void {
    const driveDate = this.driveForm.get('driveDate')?.value;
    if (moment.isMoment(driveDate) && driveDate.isValid()) {
      // Clear raw input when valid date is set (e.g., from calendar picker)
      this.driveDateRawInput = '';
    }
  }

  /**
   * Custom validator for Drive Date field that validates:
   * - Invalid formats (special characters, alphabetic characters)
   * - Invalid dates (Feb 30/31, Apr 31, Jun 31, Sep 31, Nov 31)
   * - Invalid day values (0, 32+)
   * - Invalid month values (0, 13+)
   *
   * Note: Angular Material datepicker prevents most invalid date entry through its UI,
   * but this validator provides an additional layer of protection for:
   * - Programmatic date setting
   * - Copy/paste operations
   * - Edge cases
   */
  private driveDateFormatValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      // Check if there's raw input text but no parsed value
      // This indicates a parse error (invalid input like @, special chars, impossible dates)
      if (this.driveDateRawInput && !value) {
        return { invalidDriveDate: { message: 'Invalid Drive Date' } };
      }

      // If no raw input and no value, it's an empty field
      // Let the required validator handle this
      if (!value) {
        return null;
      }

      // Check if value is a valid Moment object (from date adapter)
      if (moment.isMoment(value)) {
        // Check if it's a valid moment
        if (!value.isValid()) {
          return { invalidDriveDate: { message: 'Invalid Drive Date' } };
        }

        // All valid Moment objects from the date adapter are already validated
        // The date adapter's parse() method handles:
        // 1. Format validation (DD-MMM-YYYY, etc.)
        // 2. Impossible date detection (Feb 30, Apr 31, etc.)
        // 3. Invalid character rejection (@, special chars, etc.)
        // So if we get a valid Moment here, it's a valid date
        return null;
      }

      // Check if value is a valid Date object (fallback for programmatic setting)
      if (value instanceof Date) {
        // Check if it's a valid date (not Invalid Date)
        if (isNaN(value.getTime())) {
          return { invalidDriveDate: { message: 'Invalid Drive Date' } };
        }

        // For programmatic validation, check the date is reasonable
        const year = value.getFullYear();
        const month = value.getMonth(); // 0-indexed (0-11)
        const day = value.getDate();

        // Validate year is reasonable (not too far in past/future)
        if (year < 1900 || year > 2100) {
          return { invalidDriveDate: { message: 'Invalid Drive Date' } };
        }

        // Validate month (0-11 for JavaScript Date)
        if (month < 0 || month > 11) {
          return { invalidDriveDate: { message: 'Invalid Drive Date' } };
        }

        // Validate day (1-31 depending on month)
        if (day < 1 || day > 31) {
          return { invalidDriveDate: { message: 'Invalid Drive Date' } };
        }

        return null; // Valid date
      }

      // If not a Moment or Date object, it's invalid
      return { invalidDriveDate: { message: 'Invalid Drive Date' } };
    };
  }

  /**
   * Prevents decimal point and other non-integer characters from being entered in number fields
   */
  preventDecimalInput(event: KeyboardEvent): void {
    const key = event.key;

    // Allow: backspace, delete, tab, escape, enter, arrow keys, home, end
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                         'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                         'Home', 'End'];

    if (allowedKeys.includes(key)) {
      return;
    }

    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X (copy/paste/select all)
    if (event.ctrlKey && ['a', 'c', 'v', 'x', 'A', 'C', 'V', 'X'].includes(key)) {
      return;
    }

    // Prevent: decimal point (.), minus sign (-), plus sign (+), e/E (scientific notation)
    if (key === '.' || key === '-' || key === '+' || key === 'e' || key === 'E') {
      event.preventDefault();
      return;
    }

    // Allow only digits 0-9
    if (!/^\d$/.test(key)) {
      event.preventDefault();
    }
  }

  // Notes Manager event handler
  onNoteAction(event: NoteActionEvent): void {
    switch (event.action) {
      case 'add':
        this.handleAddNote(event.note);
        break;
      case 'update':
        this.handleUpdateNote(event.note);
        break;
      case 'delete':
        this.handleDeleteNote(event.note);
        break;
    }
  }

  private handleAddNote(note: NoteItem): void {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate() ?? moment();
    const displayDate = chapterDate.format('DD-MMM-YYYY').toUpperCase();
    const nextSequence = this.comments.reduce((max, c) => Math.max(max, c.noteSequence || 0), 0) + 1;

    const newComment = {
      id: Date.now(),
      note: note.text,
      text: note.text,
      userName: this.currentUserName,
      insertUser: this.currentUserId,
      insertDate: chapterDate.toISOString(),
      insertUserName: this.currentUserName,
      noteSequence: nextSequence,
      timestamp: displayDate,
      version: `${nextSequence}.0 | ${displayDate}`
    };

    this.comments = [...this.comments, newComment];
  }

  private handleUpdateNote(note: NoteItem): void {
    const index = this.comments.findIndex(c => (c.id === note.id) || (c.noteSequence === note.id));
    if (index !== -1) {
      this.comments[index] = {
        ...this.comments[index],
        note: note.text,
        text: note.text
      };
      this.comments = [...this.comments];

      this.snackBar.open('Note updated successfully', 'DISMISS', {
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar'],
        duration: 3000
      });
    }
  }

  private handleDeleteNote(note: NoteItem): void {
    this.comments = this.comments.filter(c => c.id !== note.id && c.noteSequence !== note.id);

    this.snackBar.open('Note removed from list', 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['info-snackbar'],
      duration: 3000
    });
  }

  private mapFormToCreateRequest(formValue: any): CreateSpecialDriveRequest {
    // Build sponsors array (currently only one sponsor, but structure supports multiple)
    const sponsors: DriveSponsorDto[] = [{
      driveId: '',
      chapterId: this.currentChapterId,
      sponsorId: formValue.sponsorId,
      sponsorName: formValue.sponsorName,
      projectedShow: formValue.projectedShow,
      projectedDraw: formValue.projectedDraw,
      projDeferralRate: formValue.projDeferralRate
    }];

    // Build resources array (filter out empty rows), preserving user-defined display order via sortSeq
    const resources: DriveResourceDto[] = this.resources
      .filter(r =>
        r.resourceCode &&
        r.resourceCode.trim() !== '' &&
        r.number != null &&
        r.number > 0
      )
      .map((r, index) => ({
        driveId: '',
        chapterId: this.currentChapterId,
        resourceCode: r.resourceCode.trim(),
        resourceDescription: r.resourceDescription,
        numberRequired: r.number,
        sortSeq: index + 1
      }));

    // Build notes array
    const notes = this.comments.map(c => ({
      note: c.note || c.text,
      insertUser: c.insertUser,
      insertUserName: c.insertUserName,
      insertDate: c.insertDate ? c.insertDate.toString() : undefined
    }));

    return {
      chapterId: this.currentChapterId,
      driveDate: this.formatDateForApi(formValue.driveDate),
      driveType: formValue.driveType,
      driveCategory: formValue.category,
      locationId: formValue.locationId,
      recruiterId: formValue.recruiterId,
      scheduleStartTime: this.convertTo24Hour(formValue.scheduleStartTime),
      scheduleEndTime: this.convertTo24Hour(formValue.scheduleEndTime),
      status: formValue.status || 'CNFRM',
      sponsors,
      resources,
      notes
    };
  }

  private mapFormToUpdateRequest(formValue: any): UpdateSpecialDriveRequest {
    const baseRequest = this.mapFormToCreateRequest(formValue);

    // Add update-specific fields
    return {
      ...baseRequest,
      driveId: this.data!.driveId,
      sponsors: baseRequest.sponsors!.map(s => ({
        ...s,
        driveId: this.data!.driveId
      })),
      resources: baseRequest.resources!.map(r => ({
        ...r,
        driveId: this.data!.driveId
      })),
      auditKey: this.data?.auditKey || 0
    };
  }

  onSubmit(): void {
    // Ensure rows with a resource code also have a number
    this.resources.forEach((resource, index) => {
      if (resource.resourceCode && resource.resourceCode.trim() !== '' &&
          (resource.number === null || resource.number === undefined)) {
        this.setResourceError(index, 'numberRequired', 'Number is required.');
      }
    });

    // Check for resource validation errors
    if (this.hasAnyResourceErrors()) {
      this.snackBar.open(
        'Please fix resource validation errors before submitting',
        'DISMISS',
        {
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        }
      );
      return;
    }

    if (this.driveForm.invalid) {
      this.driveForm.markAllAsTouched();
      this.focusFirstInvalidField();
      this.snackBar.open('Please fill in all required fields', 'DISMISS', {
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isSubmitting = true;
    const formValue = this.driveForm.getRawValue();

    // Build request based on mode using mapper functions
    if (this.mode === 'edit' && this.data) {
      const updateRequest = this.mapFormToUpdateRequest(formValue);

      this.driveService.updateDrive(updateRequest)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => (this.isSubmitting = false))
        )
        .subscribe({
          next: (response) => {
            this.snackBar.open(
              response.message || 'Drive updated successfully',
              'DISMISS',
              {
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['success-snackbar'],
                duration: 3000
              }
            );
            this.saveSuccess.emit();
          },
          error: (error) => {
            console.error('Error updating drive:', error);
            const errorMessage = HttpErrorHandler.extractErrorMessage(
              error,
              'Failed to update drive. Please try again.'
            );
            this.snackBar.open(errorMessage, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
    } else {
      // Create or duplicate mode
      const createRequest = this.mapFormToCreateRequest(formValue);

      this.driveService.createDrive(createRequest)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => (this.isSubmitting = false))
        )
        .subscribe({
          next: (response) => {
            this.snackBar.open(
              response.message || 'Drive created successfully',
              'DISMISS',
              {
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['success-snackbar'],
                duration: 3000
              }
            );
            this.saveSuccess.emit();
          },
          error: (error) => {
            console.error('Error creating drive:', error);
            const errorMessage = HttpErrorHandler.extractErrorMessage(
              error,
              'Failed to create drive. Please try again.'
            );
            this.snackBar.open(errorMessage, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }

  private formatDateForApi(date: Date | string): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return DateFieldValidationUtility.serializeDateForApi(d) || '';
  }

  private extractTimeFromDateTime(dateTime: string | undefined | null): string {
    if (!dateTime) return '';

    if (/^\d{2}:\d{2}$/.test(dateTime)) return dateTime;

    // Legacy 12-hour format from existing data
    const match12 = dateTime.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = parseInt(match12[2], 10);
      if (match12[3] === 'AM') {
        if (hours === 12) hours = 0;
      } else {
        if (hours !== 12) hours += 12;
      }
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    const date = new Date(dateTime);
    if (isNaN(date.getTime())) return '';
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  private convertTo24Hour(time: string): string {
    return time?.trim() || '';
  }

  onTimeInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/[^0-9]/g, '');

    let formatted = '';
    if (digits.length <= 2) {
      formatted = digits;
    } else {
      formatted = digits.substring(0, 2) + ':' + digits.substring(2, 4);
    }

    this.driveForm.get(controlName)?.setValue(formatted, { emitEvent: false });
    this.driveForm.updateValueAndValidity();
    input.value = formatted;

    setTimeout(() => {
      if (document.activeElement === input) {
        input.setSelectionRange(formatted.length, formatted.length);
      }
    }, 0);
  }

  onTimeBlur(_controlName: string): void {
    this.driveForm.updateValueAndValidity();
  }

  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.driveForm.controls)
      .find(key => this.driveForm.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }
}
