import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig, ActionButton } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { AuthService } from '@shared/services/auth.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { NotesManagerComponent, NoteItem, NoteActionEvent } from '@shared/components';

import { TemporaryDriveService } from '../services/temporary-drive.service';
import { LookupService } from '../services/lookup.service';
import { TemporaryDrive, ResourceCalculation, StaffSchedule, SuitableDate } from '../models/temporary-drive.model';
import { PastDrivesDialog } from '../dialogs/past-drives-dialog';

@Component({
  selector: 'app-create-edit-drive',
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
    MatNativeDateModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    NotesManagerComponent
  ],
  templateUrl: './create-edit-drive.html',
  styleUrls: ['./create-edit-drive.scss']
})
export class CreateEditDriveComponent implements OnInit, OnDestroy, OnChanges {
  @Input() selectedDrive: TemporaryDrive | null = null;
  @Output() closeForm = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  driveForm!: FormGroup;
  isSubmitting = false;
  currentChapterId = '';
  confirmedDriveId: string | null = null; // Set after successful drive creation

  // Resource calculations - initialized with zeros, populated from TEMP_DRIVES or DRIVE_ESTIMATED_RESOURCES
  resources: ResourceCalculation[] = [
    { resource: 'Staff', number: 0 },
    { resource: 'Coaches', number: 0 },
    { resource: 'RBC Vans', number: 0 },
    { resource: 'Beds', number: 0 }
  ];

  // Staff schedule - loaded from VALID_MASTER_CODES where CODE_TYPE='FACLT'
  staffList: StaffSchedule[] = [];

  // Comments - loaded from CENTRAL_NOTES table via backend
  comments: any[] = [];
  isLoadingNotes = false;

  // Transform comments to NoteItem format for shared component
  get noteItems(): NoteItem[] {
    return this.comments.map(c => ({
      id: c.id,
      text: c.text,
      userName: c.userName,
      version: c.version,
      timestamp: c.insertDate
    }));
  }

  // Configuration for notes manager component
  notesConfig = {
    placeholder: 'Add Notes',
    textareaRows: 4,
    maxLength: 500,
    showUserInfo: true,
    allowEdit: true,
    allowDelete: true
  };

  // Suitable dates
  suitableDates: SuitableDate[] = [];
  showSuitableDates = true;
  fromDate = new Date(); // Current date (SYSDATE)
  toDate = new Date(new Date().setDate(new Date().getDate() + 30)); // Current date + 30 days
  currentDate = new Date();

  // Dropdown options - loaded from backend
  driveTypeOptions: any[] = [];
  categoryOptions: any[] = [];
  recruiterOptions: any[] = [];
  locationOptions: any[] = [];
  territoryOptions: any[] = [];

  // Static options
  openDriveOptions = [
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' }
  ];

  isLoadingLookups = false;

  // Efficiency range parameter from VALID_PARAMETERS (EFRNG)
  // Used for staff calculation: staff_req = round((projected_show / total_hrs) / eff_range)
  efficiencyRange: number = 1.0; // Default to 1.0

  private destroy$ = new Subject<void>();
  private dialog = inject(MatDialog);

  /**
   * Extract error message from backend response
   * Handles error codes like 11147 and custom error messages
   */
  private getErrorMessage(error: any, fallbackMessage: string): string {
    return error?.error?.message || error?.error?.Message || error?.message || fallbackMessage;
  }

  constructor(
    private fb: FormBuilder,
    private temporaryDriveService: TemporaryDriveService,
    private lookupService: LookupService,
    private snackBar: MatSnackBar,
    public headerService: HeaderService,
    private authService: AuthService,
    private chapterTimezoneService: ChapterTimezoneService
  ) {
    effect(() => {
      this.currentChapterId = this.headerService.chapterId();
      // Load lookups and suitable dates when chapter changes
      if (this.currentChapterId) {
        this.initializeChapterDates();
        this.loadLookups();
        this.loadSuitableDates();
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.updateHeaderConfig();

    // Note: loadLookups() and loadSuitableDates() are called in the effect() when chapterId changes
    // No need to call them here to avoid duplicate API requests

    if (this.selectedDrive) {
      this.populateFormFromDrive();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // React to selectedDrive input changes
    // Only populate if form is already initialized (ngOnInit has run)
    if (changes['selectedDrive'] && changes['selectedDrive'].currentValue) {
      if (this.driveForm) {
        this.populateFormFromDrive();
      }
      // Update breadcrumb when drive changes
      this.updateHeaderConfig();
    }
  }

  /**
   * Initialize dates using chapter timezone instead of browser timezone
   */
  private initializeChapterDates(): void {
    // Get chapter's current date based on timezone (returns Moment object)
    const chapterMoment = this.chapterTimezoneService.getChapterLocalDate();

    // Convert Moment to Date
    const chapterDate = chapterMoment.toDate();

    this.fromDate = chapterDate;
    this.currentDate = chapterDate;

    // Calculate toDate as chapter date + 30 days
    const toDateCalc = new Date(chapterDate);
    toDateCalc.setDate(toDateCalc.getDate() + 30);
    this.toDate = toDateCalc;

    // Update form validators with new chapter date
    if (this.driveForm) {
      this.driveForm.get('driveDate')?.setValidators([
        Validators.required,
        this.minDateValidator(this.currentDate)
      ]);
      this.driveForm.get('startDate')?.setValidators([
        Validators.required,
        this.minDateValidator(this.currentDate)
      ]);
      this.driveForm.get('endDate')?.setValidators([
        Validators.required,
        this.minDateValidator(this.currentDate)
      ]);

      this.driveForm.get('driveDate')?.updateValueAndValidity();
      this.driveForm.get('startDate')?.updateValueAndValidity();
      this.driveForm.get('endDate')?.updateValueAndValidity();
    }
  }

  /**
   * Validator to prevent selecting dates before chapter's current date
   */
  private minDateValidator(minDate: Date): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !minDate) {
        return null;
      }

      const controlDate = new Date(control.value);
      controlDate.setHours(0, 0, 0, 0);

      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);

      return controlDate < min ? { minDate: { min: minDate, actual: control.value } } : null;
    };
  }

  /**
   * Validator to ensure end date is not before start date
   */
  private dateRangeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const startDate = group.get('startDate')?.value;
      const endDate = group.get('endDate')?.value;

      if (!startDate || !endDate) {
        return null;
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);

      return end < start ? { dateRange: { start: startDate, end: endDate } } : null;
    };
  }

  private loadLookups(): void {
    if (!this.currentChapterId) return;

    this.isLoadingLookups = true;

    // Load drive types (no chapterId needed)
    this.lookupService.getDriveTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.driveTypeOptions = types;
        },
        error: (error) => {
          console.error('Failed to load drive types:', error);
          this.snackBar.open(this.getErrorMessage(error, 'Failed to load drive types'), 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });

    // Load drive categories (no chapterId needed)
    this.lookupService.getDriveCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categoryOptions = categories;
        },
        error: (error) => {
          console.error('Failed to load drive categories:', error);
          this.snackBar.open(this.getErrorMessage(error, 'Failed to load drive categories'), 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });

    // Load recruiters (requires chapterId)
    this.lookupService.getRecruiters(this.currentChapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (recruiters) => {
          this.recruiterOptions = recruiters;
        },
        error: (error) => {
          console.error('Failed to load recruiters:', error);
          this.snackBar.open(this.getErrorMessage(error, 'Failed to load recruiters'), 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });

    // Load locations (requires chapterId)
    this.lookupService.getLocations(this.currentChapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (locations) => {
          this.locationOptions = locations;
        },
        error: (error) => {
          console.error('Failed to load locations:', error);
          this.snackBar.open(this.getErrorMessage(error, 'Failed to load locations'), 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });

    // Load territories (requires chapterId)
    this.lookupService.getTerritories(this.currentChapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (territories) => {
          this.territoryOptions = territories;
          this.isLoadingLookups = false;
        },
        error: (error) => {
          console.error('Failed to load territories:', error);
          this.isLoadingLookups = false;
          this.snackBar.open(this.getErrorMessage(error, 'Failed to load territories'), 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });

    // Load facilities (no chapterId needed)
    this.lookupService.getFacilities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (facilities) => {
          this.staffList = facilities.map(f => ({
            name: f.label,
            selected: false
          }));
        },
        error: (error) => {
          console.error('Failed to load facilities:', error);
          this.snackBar.open(this.getErrorMessage(error, 'Failed to load facilities'), 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });

    // Load efficiency range parameter (EFRNG) from VALID_PARAMETERS
    // Used for staff calculation: staff_req = round((projected_show / total_hrs) / eff_range)
    this.lookupService.getEfficiencyRange()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (efficiencyRange) => {
          this.efficiencyRange = efficiencyRange;
          console.log('Efficiency range loaded:', this.efficiencyRange);
        },
        error: (error) => {
          console.error('Failed to load efficiency range, using default 1.0:', error);
          this.efficiencyRange = 1.0; // Fallback to default
        }
      });
  }

  /**
   * Update header config with dynamic breadcrumb based on selected drive
   */
  private updateHeaderConfig(): void {
    const driveId = this.selectedDrive?.temporaryDriveId;

    if (driveId) {
      // Show "Edit Drive [ID]" breadcrumb
      this.headerConfig = {
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: 'Create Drive from Temporary Drive', link: '#' },
          { label: `Edit Drive ${driveId}`, link: null }
        ],
        title: `Edit Drive ${driveId}`,
        subtitle: 'Create a Drive from a Temporary Drive Template.',
        showBackButton: true,
        onBackClick: () => this.onClose(),
        actions: this.getHeaderActions()
      };
    } else {
      // Default breadcrumb for new drive
      this.headerConfig = {
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: 'Create Drive from Temporary Drive', link: null }
        ],
        title: 'Create Drive from Temporary Drive',
        subtitle: 'Create a Drive from a Temporary Drive Template.',
        showBackButton: true,
        onBackClick: () => this.onClose(),
        actions: this.getHeaderActions()
      };
    }
  }

  private getHeaderActions(): ActionButton[] {
    return [
      {
        label: 'CLEAR ALL',
        variant: 'text',
        ariaLabel: 'Clear all fields',
        onClick: () => this.onClearAll()
      },
      {
        label: 'REMOVE DRIVE',
        variant: 'outlined',
        ariaLabel: 'Remove temporary drive',
        onClick: () => this.onRemoveDrive()
      },
      {
        label: 'SAVE DRIVE',
        variant: 'filled',
        ariaLabel: 'Save drive',
        onClick: () => this.onSubmit()
      }
    ];
  }

  private initializeForm(): void {
    this.driveForm = this.fb.group({
      // Drive Details
      driveId: ['', Validators.required],
      driveDate: [null, [Validators.required, this.minDateValidator(this.currentDate)]],
      driveType: ['', Validators.required],
      category: ['', Validators.required],
      openDrive: [''],
      recruiterId: ['', Validators.required],
      recruiterName: [''],
      contactName: [''],

      // Sponsor and Projection
      sponsorId: [''],
      sponsorName: [''],
      locationId: [''],
      locationName: [''],
      projectedDraw: [''],
      projectedShow: [''],
      deferralPercent: [''],
      territoryId: [''],
      territory: [''],

      // Date & Time
      startDate: [null, [Validators.required, this.minDateValidator(this.currentDate)]],
      startTime: ['', Validators.required],
      endDate: [null, [Validators.required, this.minDateValidator(this.currentDate)]],
      endTime: ['', Validators.required],
      setupBreakdown: [''],
      travelTime: [''],

      // Notes
      notes: ['']
    }, { validators: this.dateRangeValidator() });
  }

  private populateFormFromDrive(): void {
    if (!this.selectedDrive) {
      return;
    }

    // Use suggested Drive ID from BC_ID_GENERATOR package (backend generates it)
    const driveId = this.selectedDrive.suggestedDriveId || '';

    this.driveForm.patchValue({
      driveId: driveId,
      driveDate: new Date(this.selectedDrive.driveDate),
      driveType: this.selectedDrive.type,
      category: this.selectedDrive.category,
      sponsorId: this.selectedDrive.sponsorId,
      sponsorName: this.selectedDrive.sponsorName,
      projectedDraw: this.selectedDrive.projectedDraw,
      projectedShow: this.selectedDrive.projectedShow,
      contactName: this.selectedDrive.contactPerson
    });

    // For temporary drives (new drives), populate resources from temp drive data
    // This uses STAFF_REQD, VAN_REQD, COACH_REQD, BED_REQD from TEMP_DRIVES table
    this.resources = [
      { resource: 'Staff', number: this.selectedDrive.staffReqd || 0 },
      { resource: 'Coaches', number: this.selectedDrive.coachReqd || 0 },
      { resource: 'RBC Vans', number: this.selectedDrive.vanReqd || 0 },
      { resource: 'Beds', number: this.selectedDrive.bedReqd || 0 }
    ];
  }

  onClose(): void {
    this.closeForm.emit();
  }

  onClearAll(): void {
    // FMB: clear_form(NO_VALIDATE), hide_view('CANVAS_AVL'), initialise_windows
    this.driveForm.reset();
    this.staffList.forEach(staff => staff.selected = false);
    this.resources = [];
    this.comments = [];
    this.showSuitableDates = false;
    this.suitableDates = [];
  }

  onRemoveDrive(): void {
    // Validation: Check if drive date exists (from FMB: if drive_date is null then show_error('11123'))
    const driveDate = this.driveForm.get('driveDate')?.value;
    if (!driveDate) {
      this.snackBar.open('Cannot remove drive - no drive selected', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (!this.selectedDrive) return;

    // Use snackbar with action button instead of blocking confirm dialog
    const snackBarRef = this.snackBar.open(
      'Do you want to remove this temporary drive?',
      'REMOVE',
      {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['warning-snackbar']
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.temporaryDriveService.removeDrive(this.selectedDrive!.temporaryDriveId, this.currentChapterId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.snackBar.open(response.message, 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
            // Clear form after successful removal (FMB: clear_block, reset temp_id)
            this.driveForm.reset();
            this.comments = [];
            this.resources = [];
            this.staffList.forEach(staff => staff.selected = false);
            this.saveSuccess.emit();
          },
          error: (error) => {
            this.snackBar.open(this.getErrorMessage(error, 'Failed to remove temporary drive'), 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
    });
  }

  onViewSuitableDates(): void {
    this.loadSuitableDates();
  }

  loadSuitableDates(): void {
    const fromDateStr = this.formatDateForApi(this.fromDate);
    const toDateStr = this.formatDateForApi(this.toDate);

    this.temporaryDriveService.getSuitableDates(fromDateStr, toDateStr, this.currentChapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dates) => {
          this.suitableDates = dates;
        },
        error: (error) => {
          this.snackBar.open(this.getErrorMessage(error, 'Failed to load suitable dates'), 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  formatDateForApi(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  onViewPastDrives(): void {
    const sponsorId = this.driveForm.get('sponsorId')?.value;
    const sponsorName = this.driveForm.get('sponsorName')?.value;

    if (!sponsorId) {
      this.snackBar.open('Please select a sponsor first', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.temporaryDriveService.getPastDrives(sponsorId, this.currentChapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (drives) => {
          this.dialog.open(PastDrivesDialog, {
            width: '600px',
            maxWidth: '600px',
            height: '100vh',
            position: { right: '0' },
            panelClass: 'past-drives-dialog-right',
            data: {
              sponsorId: sponsorId,
              sponsorName: sponsorName || 'Unknown Sponsor',
              drives: drives
            }
          });
        },
        error: (error) => {
          this.snackBar.open(this.getErrorMessage(error, 'Failed to load past drives'), 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  onRunCalculation(): void {
    const projectedShow = this.driveForm.get('projectedShow')?.value;
    const driveDate = this.driveForm.get('driveDate')?.value;
    const startTime = this.driveForm.get('startTime')?.value;
    const endDate = this.driveForm.get('endDate')?.value;
    const endTime = this.driveForm.get('endTime')?.value;

    if (!projectedShow || !driveDate || !startTime || !endDate || !endTime) {
      this.snackBar.open('Please fill in Projected Show, Drive Date, Start Time, End Date, and End Time', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    const request = {
      projectedShow: projectedShow,
      driveDate: this.formatDateForBackend(driveDate),
      scheduleStartTime: startTime,
      scheduleEndDate: this.formatDateForBackend(endDate),
      scheduleEndTime: endTime,
      efficiencyRange: this.efficiencyRange // From VALID_PARAMETERS.EFRNG
    };

    this.temporaryDriveService.calculateStaff(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          // Update the staff resource number
          const staffResource = this.resources.find(r => r.resource === 'Staff');
          if (staffResource) {
            staffResource.number = result.staffRequired;
          }

          // Show success message (FMB doesn't show a dialog, just updates the value)
          this.snackBar.open('Staff calculation completed successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Staff calculation error:', error);
          this.snackBar.open(this.getErrorMessage(error, 'Failed to calculate staff requirements'), 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  formatDateForBackend(date: Date): string {
    // Format as YYYY-MM-DD for backend
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Handler for note actions from shared NotesManager component
   */
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
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleDateString('en-US', { month: 'short' });
    const year = now.getFullYear();
    const formattedDate = `${day}-${month}-${year}`; // Format: "4-Apr-2026"

    const newComment = {
      id: note.id,
      text: note.text,
      note: note.text,
      userName: this.headerService.headerConfig().user?.name || 'Unknown User',
      version: `1B | ${formattedDate}`, // Format: "1B | 4-Apr-2026"
      insertUser: this.headerService.headerConfig().user?.id || '',
      insertDate: now.toISOString(),
      noteSequence: this.comments.length + 1
    };

    this.comments = [...this.comments, newComment];
    this.snackBar.open('Note added. Will be saved when confirming the drive.', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private handleUpdateNote(note: NoteItem): void {
    const index = this.comments.findIndex(c => c.id === note.id);
    if (index !== -1) {
      this.comments[index] = {
        ...this.comments[index],
        text: note.text,
        note: note.text
      };
      this.comments = [...this.comments];
      this.snackBar.open('Note updated successfully', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });
    }
  }

  private handleDeleteNote(note: NoteItem): void {
    this.comments = this.comments.filter(c => c.id !== note.id);
    this.snackBar.open('Note removed from list', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  onRecruiterChange(recruiterId: string): void {
    const recruiter = this.recruiterOptions.find(r => r.id === recruiterId);
    this.driveForm.patchValue({
      recruiterName: recruiter?.name || ''
    });
  }

  onLocationChange(locationId: string): void {
    const location = this.locationOptions.find(l => l.id === locationId);
    this.driveForm.patchValue({
      locationName: location?.name || ''
    });
  }

  onTerritoryChange(territoryId: string): void {
    const territory = this.territoryOptions.find(t => t.id === territoryId);
    this.driveForm.patchValue({
      territory: territory?.name || ''
    });
  }

  areAllStaffSelected(): boolean {
    return this.staffList.length > 0 && this.staffList.every(staff => staff.selected);
  }

  isSomeStaffSelected(): boolean {
    const selectedCount = this.staffList.filter(staff => staff.selected).length;
    return selectedCount > 0 && selectedCount < this.staffList.length;
  }

  toggleAllStaff(checked: boolean): void {
    this.staffList.forEach(staff => staff.selected = checked);
  }

  onSubmit(): void {
    if (this.driveForm.invalid) {
      this.driveForm.markAllAsTouched();
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isSubmitting = true;

    const request = {
      temporaryDriveId: this.selectedDrive?.temporaryDriveId,
      driveDetails: {
        driveId: this.driveForm.get('driveId')?.value,
        driveDate: this.driveForm.get('driveDate')?.value,
        driveType: this.driveForm.get('driveType')?.value,
        category: this.driveForm.get('category')?.value,
        openDrive: this.driveForm.get('openDrive')?.value,
        recruiterId: this.driveForm.get('recruiterId')?.value,
        recruiterName: this.driveForm.get('recruiterName')?.value,
        contactName: this.driveForm.get('contactName')?.value
      },
      sponsorProjection: {
        sponsorId: this.driveForm.get('sponsorId')?.value,
        sponsorName: this.driveForm.get('sponsorName')?.value,
        locationId: this.driveForm.get('locationId')?.value,
        locationName: this.driveForm.get('locationName')?.value,
        projectedDraw: this.driveForm.get('projectedDraw')?.value,
        projectedShow: this.driveForm.get('projectedShow')?.value,
        deferralPercent: this.driveForm.get('deferralPercent')?.value,
        territoryId: this.driveForm.get('territoryId')?.value,
        territory: this.driveForm.get('territory')?.value
      },
      dateTime: {
        startDate: this.driveForm.get('startDate')?.value,
        startTime: this.driveForm.get('startTime')?.value,
        endDate: this.driveForm.get('endDate')?.value,
        endTime: this.driveForm.get('endTime')?.value,
        setupBreakdown: this.driveForm.get('setupBreakdown')?.value,
        travelTime: this.driveForm.get('travelTime')?.value
      },
      resources: this.resources,
      staffSchedule: this.staffList.filter(s => s.selected),
      notes: this.comments.map(c => c.note), // Send as array of individual notes
      chapterId: this.currentChapterId
    };

    this.temporaryDriveService.createDriveFromTemporary(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;

          // Store the confirmed drive ID
          if (response.driveId) {
            this.confirmedDriveId = response.driveId;

            // Use resources from the single API response
            if (response.resources && response.resources.length > 0) {
              this.resources = response.resources.map(r => ({
                resource: r.resourceDesc || r.resourceCode,
                number: r.numberReqd || 0
              }));
            }
          }

          this.snackBar.open(response.message, 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.saveSuccess.emit();
        },
        error: (error) => {
          this.isSubmitting = false;
          // Display error message from backend (includes FMB error codes like 11147)
          this.snackBar.open(this.getErrorMessage(error, 'Failed to create drive'), 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

}
