import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, effect, signal, computed } from '@angular/core';
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

import { CancelDriveDialogComponent } from '../cancel-drive-dialog/cancel-drive-dialog';
import { CancelDriveService } from '../services/cancel-drive.service';
import moment, { Moment } from 'moment';

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
  startTimeAfterChapterTimeValidator,
  projectedShowPositiveValidator,
  deferralRateRangeValidator
} from '../validators/special-drive.validators';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig, ActionButton } from '@shared/interfaces/page-header-with-breadcrumb.interface';
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

  get minDriveDate(): Moment {
    const chapterTimezone = this.headerService.chapterTimeZone();
    return DateFieldValidationUtility.getMinDate(chapterTimezone);
  }

  resources: ResourceRow[] = [];
  resourceErrors: Map<number, ResourceError> = new Map();
  initialRowCount = 4;

  comments: any[] = [];
  newComment = '';

  notesConfig: NotesConfig = {
    placeholder: 'Add Notes',
    textareaRows: 4,
    maxLength: 240,
    showUserInfo: true,
    allowEdit: true,
    allowDelete: true
  };

  driveIdSearchCtrl = new FormControl('');
  sponsorSearchCtrl = new FormControl('');
  locationSearchCtrl = new FormControl('');
  recruiterSearchCtrl = new FormControl('');
  categorySearchCtrl = new FormControl('');
  resourceSearchCtrl = new FormControl('');
  driveTypeSearchCtrl = new FormControl('');

  resourceRowSearchCtrls: FormControl[] = [];

  private driveDateRawInput: string = '';

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

  driveTypeOptions = [
    { value: 'F', label: 'Fixed' },
    { value: 'I', label: 'Inside' },
    { value: 'C', label: 'Coach' }
  ];

  readonly driveTypeSearch = signal('');
  readonly filteredDriveTypeOptions = computed(() => {
    const search = this.driveTypeSearch().toLowerCase();
    const options = this.driveTypeOptions;
    if (!search) return options;
    return options.filter(t => t.label.toLowerCase().includes(search));
  });

  readonly filteredCreateAsOptions = computed(() => {
    const search = this.driveTypeSearch().toLowerCase();
    const options = this.driveTypeOptions.filter(opt => opt.value === 'I' || opt.value === 'C');
    if (!search) return options;
    return options.filter(t => t.label.toLowerCase().includes(search));
  });

  statusOptions = [
    { value: 'CNFRM', label: 'Confirmed' },
    { value: 'HOLD', label: 'Hold' },
    { value: 'CANCL', label: 'Cancelled' }
  ];

  private sponsorCache = new Map<string, SponsorLookup[]>();
  private destroy$ = new Subject<void>();

  get noteItems(): NoteItem[] {
    return this.comments.map(c => ({
      id: c.noteSequence || c.id,
      text: c.note || c.text,
      userName: c.insertUserName || c.userName || c.insertUser || 'Unknown',
      timestamp: c.insertDate ? this.formatDate(c.insertDate.toString()) : c.timestamp || '',
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
      if (this.currentChapterId && newChapterId !== this.currentChapterId) {
        this.sponsorCache.clear();
      }
      this.currentChapterId = newChapterId;
    });
  }

  ngOnInit(): void {
    this.currentChapterId = this.headerService.chapterId();
    this.initializeForm();
    this.loadLookupData();
    this.setupSearchSubscriptions();
    this.setupFormValidationListener();

    this.driveIdOptionsSignal.set([]);
    this.comments = [];

    if ((this.mode === 'edit' || this.mode === 'duplicate') && this.data) {
      if (this.mode === 'duplicate' && this.data.driveId) {
        this.driveIdOptionsSignal.set([this.data.driveId]);
      }
      this.populateForm();
      if (this.mode === 'edit' || this.mode === 'duplicate') {
        this.driveForm.markAllAsTouched();
      }
    } else {
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
          this.recruiterOptionsSignal.set(recruiters);
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

    this.loadSponsors('');
  }

  private loadSponsors(searchText: string): void {
    if (searchText && searchText.trim().length > 0 && searchText.trim().length < 3) {
      return;
    }

    const normalizedSearch = searchText.toLowerCase().trim();

    if (this.sponsorCache.has(normalizedSearch)) {
      this.sponsorOptionsSignal.set(this.sponsorCache.get(normalizedSearch)!);
      return;
    }

    this.driveService.getSponsors(this.currentChapterId, searchText, 100, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sponsors) => {
          this.sponsorCache.set(normalizedSearch, sponsors);
          this.sponsorOptionsSignal.set(sponsors);
        },
        error: (error) => {
          console.error('Error loading sponsors:', error);
          const errorMessage = error?.message || 'Failed to load sponsors. Please try again.';
          this.snackBar.open(errorMessage, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          this.sponsorOptionsSignal.set([]);
        }
      });
  }

  private setupSearchSubscriptions(): void {
    this.driveIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.driveIdSearch.set(value || ''));

    this.sponsorSearchCtrl.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(value => {
        this.sponsorSearch.set(value || '');
        if (value && value.length >= 3) {
          this.loadSponsors(value);
        } else if (!value || value.length === 0) {
          this.loadSponsors('');
        }
      });

    this.locationSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.locationSearch.set(value || ''));

    this.recruiterSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.recruiterSearch.set(value || ''));

    this.categorySearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.categorySearch.set(value || ''));

    this.resourceSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.resourceSearch.set(value || ''));

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
      breadcrumbLabel = 'Manage Special Drive';
    } else {
      title = 'Create Special Drive';
      subtitle = 'Create new blood donation drive';
      breadcrumbLabel = 'Manage Special Drive';
    }

    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: breadcrumbLabel, link: null }
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
    this.driveForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
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
          Validators.max(999999),
          projectedShowPositiveValidator()
        ]
      ],
      deferralPercent: [
        18,
        [
          Validators.required,
          deferralRateRangeValidator()
        ]
      ],
      projectedDraw: [{ value: '', disabled: true }],
      driveDate: [
        '',
        [
          Validators.required,
          driveDateNotTooOldValidator(30),
          this.driveDateFormatValidator()
        ]
      ],
      driveType: ['', Validators.required],
      category: ['', Validators.required],
      startTime: ['', [Validators.required, timeFormatValidator()]],
      endTime: ['', [Validators.required, timeFormatValidator()]],
      locationId: ['', Validators.required],
      locationName: [''],
      recruiterId: ['', Validators.required],
      recruiterName: [''],
      status: ['CNFRM'],
      notes: ['']
    }, {
      validators: [
        endTimeAfterStartTimeValidator(),
        startTimeAfterChapterTimeValidator(this.chapterTimezoneService, this.headerService)
      ]
    });

    this.setupFormListeners();
  }

  private setupFormListeners(): void {
    this.driveForm.get('sponsorId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(sponsorId => {
        const sponsor = this.sponsorOptionsSignal().find(s => s.sponsorId === sponsorId);
        this.driveForm.patchValue({ sponsorName: sponsor?.name || '' }, { emitEvent: false });
      });

    this.driveForm.get('locationId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(locationId => {
        const location = this.locationOptionsSignal().find(l => l.locationId === locationId);
        this.driveForm.patchValue({ locationName: location?.locationName || '' }, { emitEvent: false });
      });

    this.driveForm.get('recruiterId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(recruiterId => {
        const recruiter = this.recruiterOptionsSignal().find(r => r.employeeId === recruiterId);
        this.driveForm.patchValue({ recruiterName: recruiter?.employeeName || '' }, { emitEvent: false });
      });

    combineLatest([
      this.driveForm.get('projectedShow')!.valueChanges.pipe(startWith(this.driveForm.get('projectedShow')!.value)),
      this.driveForm.get('deferralPercent')!.valueChanges.pipe(startWith(this.driveForm.get('deferralPercent')!.value))
    ])
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(([projectedShow, deferralPercent]) => {
        if (projectedShow && deferralPercent !== null && deferralPercent !== undefined) {
          const projectedDraw = Math.round(((100 - deferralPercent) / 100) * projectedShow);
          this.driveForm.patchValue({ projectedDraw }, { emitEvent: false });
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
      deferralPercent: firstSponsor?.projDeferralRate || 0,
      projectedDraw: firstSponsor?.projectedDraw || 0,
      driveDate: this.data.driveDate ? new Date(this.data.driveDate) : null,
      driveType: this.data.driveType,
      category: this.data.driveCategory,
      startTime: this.extractTimeFromDateTime(this.data.scheduleStartTime),
      endTime: this.extractTimeFromDateTime(this.data.scheduleEndTime),
      locationId: this.data.locationId || '',
      locationName: this.data.locationName || '',
      recruiterId: this.data.recruiterId || '',
      recruiterName: this.data.recruiterName || '',
      status: this.data.status || 'CNFRM',
      notes: ''
    });

    if (this.mode === 'edit' && this.data.resources && this.data.resources.length > 0) {
      this.resources = this.data.resources.map(r => ({
        resourceCode: r.resourceCode,
        resourceDescription: r.resourceDescription || '',
        number: r.numberRequired
      }));

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
      if (this.data.resources && this.data.resources.length > 0) {
        this.resources = this.data.resources.map(r => ({
          resourceCode: r.resourceCode,
          resourceDescription: r.resourceDescription || '',
          number: r.numberRequired
        }));

        if (this.resources.length < this.initialRowCount) {
          const emptyRows = Array.from({ length: this.initialRowCount - this.resources.length }, () => ({
            resourceCode: '',
            resourceDescription: '',
            number: 0
          }));
          this.resources = [...this.resources, ...emptyRows];
        }
      } else {
        this.resources = Array.from({ length: this.initialRowCount }, () => ({
          resourceCode: '',
          resourceDescription: '',
          number: 0
        }));
      }
    } else {
      this.resources = Array.from({ length: this.initialRowCount }, () => ({
        resourceCode: '',
        resourceDescription: '',
        number: 0
      }));
    }

    if ((this.mode === 'edit' || this.mode === 'duplicate') && this.data.notes && this.data.notes.length > 0) {
      this.comments = this.data.notes.map(n => ({
        id: n.noteSequence,
        noteSequence: n.noteSequence,
        noteId: n.noteId,
        userName: n.insertUserName || n.insertUser || 'Unknown',
        insertUser: n.insertUser,
        insertUserName: n.insertUserName,
        insertDate: n.insertDate,
        version: '1.0',
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
      data: { driveId: this.data.driveId }
    });
    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          const cancelReasonCode = result.cancelCode || '';
          const cancelReason = result.comments || '';
          this.cancelDriveService.cancelDrive(this.data!.driveId, {
            cancelReasonCode,
            cancelReason,
            confirmCancellation: true
          })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.snackBar.open('Drive cancelled successfully', '', {
                  horizontalPosition: 'end',
                  verticalPosition: 'top',
                  duration: 3000
                });
                this.saveSuccess.emit();
              },
              error: (error: any) => {
                const errorResponse = error.error?.errorResponse;
                const errorMessage = errorResponse
                  ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
                  : (error.error?.message || error.message || 'Error cancelling drive. Please try again.');
                this.snackBar.open(errorMessage, 'DISMISS', {
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
    this.resourceErrors.clear();
    this.resources = Array.from({ length: this.initialRowCount }, () => ({
      resourceCode: '',
      resourceDescription: '',
      number: 0
    }));
  }

  onResourceChange(index: number): void {
    const resource = this.resources[index];

    if (resource.resourceCode && typeof resource.resourceCode === 'string') {
      resource.resourceCode = resource.resourceCode.toUpperCase();
    }

    this.clearResourceError(index);

    if (resource.resourceCode && resource.resourceCode.trim() !== '') {
      if (!this.isValidResourceCode(resource.resourceCode)) {
        this.setResourceError(index, '11002', 'Invalid resource code.');
        return;
      }

      if (this.hasDuplicateResourceCode(resource.resourceCode, index)) {
        this.setResourceError(index, '13002', 'This resource has already been added to the drive.');
        return;
      }
    }

    if (resource.number !== null && resource.number !== undefined && resource.number < 0) {
      this.setResourceError(index, '11131', 'Number required cannot be negative.');
      return;
    }

    if (resource.number !== null && resource.number !== undefined && !Number.isInteger(resource.number)) {
      this.setResourceError(index, '11131', 'Number must be a whole number (no decimals allowed).');
      return;
    }

    if (resource.resourceCode && !resource.resourceDescription) {
      const resourceLookup = this.resourceOptionsSignal().find(r => r.code === resource.resourceCode);
      if (resourceLookup) {
        resource.resourceDescription = resourceLookup.description;
      }
    }

    const isRowComplete = resource.resourceCode &&
                          resource.resourceDescription &&
                          resource.number > 0 &&
                          !this.resourceErrors.has(index);
    const isLastRow = index === this.resources.length - 1;

    if (isRowComplete && isLastRow) {
      this.resources.push({ resourceCode: '', resourceDescription: '', number: 0 });
    }
  }

  private isValidResourceCode(code: string): boolean {
    if (!code || code.trim() === '') return true;
    const options = this.resourceOptionsSignal();
    if (!options || options.length === 0) return true;
    return options.some(r => r.code === code);
  }

  private hasDuplicateResourceCode(code: string, currentIndex: number): boolean {
    if (!code || code.trim() === '') return false;
    return this.resources.some((resource, index) =>
      index !== currentIndex &&
      resource.resourceCode &&
      resource.resourceCode.trim() === code.trim()
    );
  }

  private setResourceError(index: number, errorCode: string, message: string): void {
    this.resourceErrors.set(index, { hasError: true, errorCode, errorMessage: message });
  }

  private clearResourceError(index: number): void {
    this.resourceErrors.delete(index);
  }

  private hasAnyResourceErrors(): boolean {
    return this.resourceErrors.size > 0;
  }

  getResourceError(index: number, field: 'code' | 'number'): ResourceError | null {
    const error = this.resourceErrors.get(index);
    if (!error || !error.hasError) return null;
    if (field === 'code' && (error.errorCode === '11002' || error.errorCode === '13002')) return error;
    if (field === 'number' && error.errorCode === '11131') return error;
    return null;
  }

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

  onDriveDateChange(): void {
    const driveDate = this.driveForm.get('driveDate')?.value;
    if (moment.isMoment(driveDate) && driveDate.isValid()) {
      this.driveDateRawInput = '';
    }
  }

  private driveDateFormatValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (this.driveDateRawInput && !value) {
        return { invalidDriveDate: { message: 'Invalid Drive Date' } };
      }

      if (!value) return null;

      if (moment.isMoment(value)) {
        if (!value.isValid()) return { invalidDriveDate: { message: 'Invalid Drive Date' } };
        return null;
      }

      if (value instanceof Date) {
        if (isNaN(value.getTime())) return { invalidDriveDate: { message: 'Invalid Drive Date' } };
        const year = value.getFullYear();
        const month = value.getMonth();
        const day = value.getDate();
        if (year < 1900 || year > 2100) return { invalidDriveDate: { message: 'Invalid Drive Date' } };
        if (month < 0 || month > 11) return { invalidDriveDate: { message: 'Invalid Drive Date' } };
        if (day < 1 || day > 31) return { invalidDriveDate: { message: 'Invalid Drive Date' } };
        return null;
      }

      return { invalidDriveDate: { message: 'Invalid Drive Date' } };
    };
  }

  preventDecimalInput(event: KeyboardEvent): void {
    const key = event.key;
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                         'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(key)) return;
    if (event.ctrlKey && ['a', 'c', 'v', 'x', 'A', 'C', 'V', 'X'].includes(key)) return;
    if (key === '.' || key === '-' || key === '+' || key === 'e' || key === 'E') {
      event.preventDefault();
      return;
    }
    if (!/^\d$/.test(key)) {
      event.preventDefault();
    }
  }

  onNoteAction(event: NoteActionEvent): void {
    switch (event.action) {
      case 'add': this.handleAddNote(event.note); break;
      case 'update': this.handleUpdateNote(event.note); break;
      case 'delete': this.handleDeleteNote(event.note); break;
    }
  }

  private handleAddNote(note: NoteItem): void {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const year = now.getFullYear();
    const formattedDate = `${day.toString().padStart(2, '0')}-${month}-${year}`;
    const nextSequence = this.comments.reduce((max, c) => Math.max(max, c.noteSequence || 0), 0) + 1;

    const newComment = {
      id: Date.now(),
      note: note.text,
      text: note.text,
      userName: this.currentUserName,
      insertUser: this.currentUserId,
      insertDate: now.toISOString(),
      insertUserName: this.currentUserName,
      noteSequence: nextSequence,
      version: `${nextSequence}B | ${formattedDate}`
    };

    this.comments = [...this.comments, newComment];
    this.snackBar.open('Note added. Will be saved when saving the drive.', 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private handleUpdateNote(note: NoteItem): void {
    const index = this.comments.findIndex(c => (c.id === note.id) || (c.noteSequence === note.id));
    if (index !== -1) {
      this.comments[index] = { ...this.comments[index], note: note.text, text: note.text };
      this.comments = [...this.comments];
      this.snackBar.open('Note updated successfully', 'DISMISS', {
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });
    }
  }

  private handleDeleteNote(note: NoteItem): void {
    this.comments = this.comments.filter(c => c.id !== note.id && c.noteSequence !== note.id);
    this.snackBar.open('Note removed from list', 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['info-snackbar']
    });
  }

  private mapFormToCreateRequest(formValue: any): CreateSpecialDriveRequest {
    const sponsors: DriveSponsorDto[] = [{
      driveId: '',
      chapterId: this.currentChapterId,
      sponsorId: formValue.sponsorId,
      sponsorName: formValue.sponsorName,
      projectedShow: formValue.projectedShow,
      projectedDraw: formValue.projectedDraw,
      projDeferralRate: formValue.deferralPercent
    }];

    const resources: DriveResourceDto[] = this.resources
      .filter(r => r.resourceCode && r.resourceCode.trim() !== '' && r.number != null && r.number > 0)
      .map(r => ({
        driveId: '',
        chapterId: this.currentChapterId,
        resourceCode: r.resourceCode.trim(),
        resourceDescription: r.resourceDescription,
        numberRequired: r.number
      }));

    const notes = this.comments.map(c => ({
      note: c.note || c.text,
      insertUser: c.insertUser,
      insertUserName: c.insertUserName
    }));

    return {
      chapterId: this.currentChapterId,
      driveDate: this.formatDateForApi(formValue.driveDate),
      driveType: formValue.driveType,
      driveCategory: formValue.category,
      locationId: formValue.locationId,
      recruiterId: formValue.recruiterId,
      scheduleStartTime: this.convertTo24Hour(formValue.startTime),
      scheduleEndTime: this.convertTo24Hour(formValue.endTime),
      status: formValue.status || 'CNFRM',
      sponsors,
      resources,
      notes
    };
  }

  private mapFormToUpdateRequest(formValue: any): UpdateSpecialDriveRequest {
    const baseRequest = this.mapFormToCreateRequest(formValue);
    return {
      ...baseRequest,
      driveId: this.data!.driveId,
      sponsors: baseRequest.sponsors!.map(s => ({ ...s, driveId: this.data!.driveId })),
      resources: baseRequest.resources!.map(r => ({ ...r, driveId: this.data!.driveId })),
      auditKey: this.data?.auditKey || 0
    };
  }

  onSubmit(): void {
    if (this.hasAnyResourceErrors()) {
      this.snackBar.open('Please fix resource validation errors before submitting', 'DISMISS', {
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
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

    if (this.mode === 'edit' && this.data) {
      const updateRequest = this.mapFormToUpdateRequest(formValue);
      this.driveService.updateDrive(updateRequest)
        .pipe(takeUntil(this.destroy$), finalize(() => (this.isSubmitting = false)))
        .subscribe({
          next: (response) => {
            this.snackBar.open(response.message || 'Drive updated successfully', 'DISMISS', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
            this.saveSuccess.emit();
          },
          error: (error) => {
            console.error('Error updating drive:', error);
            const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Failed to update drive. Please try again.');
            this.snackBar.open(errorMessage, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
    } else {
      const createRequest = this.mapFormToCreateRequest(formValue);
      this.driveService.createDrive(createRequest)
        .pipe(takeUntil(this.destroy$), finalize(() => (this.isSubmitting = false)))
        .subscribe({
          next: (response) => {
            this.snackBar.open(response.message || 'Drive created successfully', 'DISMISS', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
            this.saveSuccess.emit();
          },
          error: (error) => {
            console.error('Error creating drive:', error);
            const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Failed to create drive. Please try again.');
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

  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.driveForm.controls)
      .find(key => this.driveForm.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }

  onTimeBlur(_controlName: string): void {
    this.driveForm.updateValueAndValidity();
  }
}
