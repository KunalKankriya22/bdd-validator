import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, FormGroupDirective, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize, debounceTime, filter } from 'rxjs';
import moment, { Moment } from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { LoginService } from '@shared/services/login.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';


import { SetDriveDateIdService } from './services/set-drive-date-id.service';
import { DriveListItemDto, SetDriveContextDto } from './models/set-drive-date-id.model';

@Component({
  selector: 'app-set-drive-date-and-id',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatSnackBarModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './set-drive-date-and-id.html',
  styleUrl: './set-drive-date-and-id.scss'
})
export class SetDriveDateAndIdComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private returnUrl: string | null = null;
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);
  private readonly menuService = inject(MenuService);
  private readonly service = inject(SetDriveDateIdService);
  private readonly snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  @ViewChild(FormGroupDirective) formDirective!: FormGroupDirective;

  // Fallback values
  private readonly DEFAULT_TITLE = 'Set Drive Date and ID';
  private readonly DEFAULT_SUBTITLE = 'Assign a drive date, select the drive ID and map it to a user for accurate tracking';

  // Page Header
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/' },
      { label: this.DEFAULT_TITLE, link: null }
    ],
    title: this.DEFAULT_TITLE,
    subtitle: this.DEFAULT_SUBTITLE,
    actions: []
  };

  // Form
  form!: FormGroup;

  // Computed read-only fields
  driveDay: string = '';
  driveName: string = '';

  // Current user (read-only, from session)
  currentUserId: string = '';

  // Getter for current user name from headerService signal
  get currentUserName(): string {
    return this.headerService.headerConfig().user?.name || '';
  }

  // Access control
  hasDriveBkAccess: boolean = false;

  // Dropdown data
  drives: DriveListItemDto[] = [];

  // Search control for Drive ID dropdown
  readonly driveIdSearchCtrl = new FormControl('');
  private driveIdSearchTerm = '';

  get filteredDrives(): DriveListItemDto[] {
    const search = this.driveIdSearchTerm.toLowerCase();
    if (!search) return this.drives;
    return this.drives.filter(d =>
      d.driveId.toLowerCase().includes(search) || d.sponsorName.toLowerCase().includes(search)
    );
  }

  // State
  isLoading = false;
  isLoadingDrives = false;
  isSaving = false;

  // Date validation
  minDate!: Moment;
  maxDate!: Moment;
  chapterLocalDate!: Moment; // Original chapter local date for reset

  ngOnInit(): void {
    // Get current user from session (like :banner.user_id in Oracle Forms)
    this.currentUserId = this.loginService.getStoredUsername();

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || null;

    this.loadPageHeaderFromMenu();
    this.initializeForm();
    this.loadUserAccess();  // API 1: Get user access and date range
    this.setupDateListener();
    this.setupChapterChangeListener();
    this.setupSearchSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load page header from menu service
   */
  private loadPageHeaderFromMenu(): void {
    const currentPath = this.router.url.split('?')[0];
    const menuItem = this.menuService.findMenuItemByPath(currentPath);

    const title = menuItem?.label || this.DEFAULT_TITLE;
    const subtitle = menuItem?.remarks || this.DEFAULT_SUBTITLE;

    this.headerConfig = {
      ...this.headerConfig,
      title,
      subtitle,
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: title, link: null }
      ]
    };
  }

  /**
   * Initialize reactive form
   */
  private initializeForm(): void {
    this.form = this.fb.group({
      driveDate: [null, Validators.required],
      driveId: ['', Validators.required]
      // NO userId control - it's read-only from session
    });
  }

  /**
   * Load user drive access permissions and date range
   * API 1: GET /api/v1/set-drive-date-and-id/user-access
   */
  private loadUserAccess(): void {
    this.isLoading = true;

    this.service.getUserDriveAccess()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.hasDriveBkAccess = response.data.hasDriveBkAccess;
            this.minDate = moment(response.data.minDate);
            this.maxDate = moment(response.data.maxDate);
            this.chapterLocalDate = moment(response.data.chapterLocalDate);

            // Set initial drive date to chapter local date
            this.form.patchValue({
              driveDate: moment(this.chapterLocalDate)
            });
          }
        },
        error: () => {
          this.showError('Failed to load user access information');
        }
      });
  }

  /**
   * Setup listener for drive date changes to load drives
   */
  private setupDateListener(): void {
    this.form.get('driveDate')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        filter(date => !!date && moment.isMoment(date) && date.isValid())
      )
      .subscribe((date: Moment) => {
        this.loadDrivesForDate(date);
        this.updateDriveDay();
      });
  }

  /**
   * Setup listener for chapter changes to reload component
   * When user changes chapter from header dropdown, reload the component to get new chapter's data
   */
  private setupChapterChangeListener(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reload the component by navigating to a dummy route and back
        const currentUrl = this.router.url;
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate([currentUrl]);
        });
      });
  }

  /**
   * Load drives for selected date
   * API 2: GET /api/v1/set-drive-date-and-id/drives?driveDate={date}
   */
  private loadDrivesForDate(date: Moment): void {
    const dateString = DateFieldValidationUtility.serializeDateForApi(date);

    if (!dateString) {
      return;
    }

    this.isLoadingDrives = true;
    this.form.patchValue({ driveId: '' }); // Clear drive selection
    this.driveName = '';

    this.service.getDrivesForDate(dateString)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingDrives = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.drives = response.data;
            if (this.drives.length === 0) {
              this.showError('No drives available for this date');
            }
          } else {
            this.drives = [];
          }
        },
        error: (error) => {
          this.drives = [];
          this.showError(error?.error?.message || 'Failed to load drives for selected date');
        }
      });
  }

  /**
   * Update drive day when drive date changes
   */
  private updateDriveDay(): void {
    const dateControl = this.form.get('driveDate');
    if (dateControl?.value && moment.isMoment(dateControl.value)) {
      const date = dateControl.value as Moment;
      if (date.isValid()) {
        this.driveDay = date.format('dddd');
      } else {
        this.driveDay = '';
      }
    } else {
      this.driveDay = '';
    }
  }

  private setupSearchSubscriptions(): void {
    this.driveIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.driveIdSearchTerm = v || '');
  }

  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
  }

  onDriveDateChange(): void {
    this.form.get('driveDate')?.markAsTouched();
    this.form.get('driveDate')?.markAsDirty();
    this.updateDriveDay();
  }

  onDriveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('driveDate')
    );
  }

  /**
   * Handle drive ID selection change
   */
  onDriveIdChange(driveId: string): void {
    const drive = this.drives.find(d => d.driveId === driveId);
    this.driveName = drive?.sponsorName || '';
  }

  /**
   * Get drive date error message
   */
  getDriveDateError(): string {
    const control = this.form.get('driveDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse') ||
        control.hasError('invalidDateFormat') ||
        control.hasError('invalidDate')) {
      return 'Drive Date is invalid';
    }

    if (control.hasError('required')) {
      return 'Drive Date is required';
    }

    if (control.hasError('matDatepickerMin')) {
      return `Drive Date cannot be before ${this.minDate.format('DD-MMM-YYYY')}`;
    }

    if (control.hasError('matDatepickerMax')) {
      return `Drive Date cannot be after ${this.maxDate.format('DD-MMM-YYYY')}`;
    }

    if (control.hasError('effectiveDatePast')) {
      return 'Drive Date cannot be in the past';
    }

    return '';
  }

  /**
   * Handle SET button click
   * API 3: POST /api/v1/set-drive-date-and-id/validate
   */
  onSet(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.isSaving = true;

    const formValue = this.form.value;

    // Serialize date to YYYY-MM-DD format for API
    const dateString = DateFieldValidationUtility.serializeDateForApi(formValue.driveDate);

    if (!dateString) {
      this.showError('Invalid drive date');
      this.isSaving = false;
      return;
    }

    const dto: SetDriveContextDto = {
      driveDate: dateString,
      driveId: formValue.driveId || ''
      // NO userId - backend gets it from authenticated session
    };

    this.service.validateDriveContext(dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSaving = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const { driveId, driveDate, sponsorName, status, chapterId } = response.data;
            sessionStorage.setItem('driveContext', JSON.stringify({
              driveId,
              driveDate,
              sponsorName,
              status,
              chapterId,
              userId: this.currentUserId,
              userName: this.currentUserName
            }));
            this.showSuccess(`Drive context set: ${driveId} - ${sponsorName}`);
            if (this.returnUrl) {
              this.router.navigate([this.returnUrl]);
            } else {
              this.router.navigate(['/home']);
            }
          }
        },
        error: (error) => {
          const apiError = error?.error;

          // Use backend error message (backend handles all error codes and messaging)
          const errorMsg = apiError?.errorResponse?.error || apiError?.message || 'Validation failed';

          this.showError(errorMsg);
        }
      });
  }

  /**
   * Handle CANCEL button click
   */
  onCancel(): void {
    this.resetToInitialState();
  }

  /**
   * Reset form to initial state (chapter local date)
   */
  private resetToInitialState(): void {
    sessionStorage.removeItem('driveContext');

    // Clear drives and computed fields
    this.drives = [];
    this.driveDay = '';
    this.driveName = '';

    // Reset the form directive to clear submitted state (removes red color from fields)
    if (this.formDirective) {
      this.formDirective.resetForm({
        driveDate: moment(this.chapterLocalDate),
        driveId: ''
      });
    } else {
      // Fallback if formDirective is not available
      this.form.reset({
        driveDate: moment(this.chapterLocalDate),
        driveId: ''
      });
    }

    // This will trigger the valueChanges listener to load drives for chapter local date
  }

  /**
   * Show success message at top-right
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message at top-right
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
