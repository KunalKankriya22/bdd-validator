import { Component, ElementRef, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, AfterViewInit, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { noWhitespaceOnlyValidator } from '@shared/validators/input.validators';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { DrivesService } from '../services/drives.service';
import { HeaderService } from '@shared/services/header.service';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import {
  DrivesModel,
  AddDriveRecordDto,
  UpdateDriveRecordDto,
  ChapterLookup
} from '../models/drives.model';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

/**
 * Custom validator to ensure the date is not in the past (current date or future dates allowed)
 */
function noFutureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const selectedDate = moment(control.value).startOf('day');
  const today = DateFieldValidationUtility.getMinDate();

  if (selectedDate.isBefore(today)) {
    return { pastDate: true };
  }

  return null;
}

export interface DriveRecordFormData {
  chapterId: string;
  type: string;
  drive: string;
  siteId: string;
  description?: string;
  os: string;
  scheduledDate: Date;
}

interface SiteIdOption {
  siteId: string;
  description: string;
}

@Component({
  selector: 'app-add-edit-drive-record',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] }
  ],
  templateUrl: './add-edit-drive-record.html',
  styleUrls: ['./add-edit-drive-record.scss']
})
export class AddEditDriveRecord implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: DrivesModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<DriveRecordFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();
  @ViewChild('scheduledDateInput') scheduledDateInput!: ElementRef<HTMLInputElement>;

  scheduledDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.scheduledDateInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  form: FormGroup;
  panelTitle: string = '';
  currentDate: Moment = DateFieldValidationUtility.getMinDate(); // Chapter timezone today for min/max validation

  editModeValues: {
    chapterId: string;
    type: string;
    drive: string;
    siteId: string;
    description: string;
    os: string;
    scheduledDate: string;
  } = {
      chapterId: '',
      type: '',
      drive: '',
      siteId: '',
      description: '',
      os: '',
      scheduledDate: ''
    };

  chapterOptions: ChapterLookup[] = [];
  typeOptions = [
    { display: 'F – Fixed Site Drive', value: 'F' },
    { display: 'I - Mobile Drive', value: 'I' },
    { display: 'C - Central site drives', value: 'C' }
  ];
  siteIdOptions: SiteIdOption[] = [];
  osOptions = [
    { display: 'Yes', value: 'Y' },
    { display: 'No', value: 'N' }
  ];

  isLoadingOptions = false;
  isLoadingSiteOptions = false;
  isSaving = false;

  chapterSearchControl = new FormControl('');
  filteredChapterOptions: ChapterLookup[] = [];

  typeSearchControl = new FormControl('');
  filteredTypeOptions = [...this.typeOptions];

  siteSearchControl = new FormControl('');
  filteredSiteIdOptions: SiteIdOption[] = [];

  osSearchControl = new FormControl('');
  filteredOsOptions = [...this.osOptions];

  lastUpdated: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private drivesService: DrivesService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService
  ) {
    effect(() => {
      const chapterTimezone = this.headerService.chapterTimeZone();
      this.currentDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
    });

    this.form = this.fb.group({
      chapterId: ['', [Validators.required, Validators.maxLength(4)]],
      type: ['', [Validators.required, Validators.maxLength(1)]],
      drive: ['', [Validators.required, Validators.maxLength(6), this.noSpecialCharactersValidator]],
      siteId: ['', [Validators.required, Validators.maxLength(7)]],
      description: ['', [Validators.maxLength(50), noWhitespaceOnlyValidator()]],
      os: ['', [Validators.required, Validators.maxLength(1)]],
      scheduledDate: [null, [Validators.required, noFutureDateValidator]]
    });
  }

  ngOnInit(): void {
    this.setupPanel();
    this.loadChapterOptions();
    this.setupSiteIdListener();
    this.setupChapterIdListener();
    this.setupChapterSearch();
    this.setupTypeSearch();
    this.setupSiteSearch();
    this.setupOsSearch();
    this.subscribeToChapterChanges();
  }

  /**
   * Set up listener for Chapter ID changes to reload site options
   */
  private setupChapterIdListener(): void {
    this.form.get('chapterId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((chapterId: string) => {
        // Clear current site ID selection when chapter changes
        this.form.get('siteId')?.setValue('', { emitEvent: false });
        this.form.get('description')?.setValue('', { emitEvent: false });

        // Reload site options for the new chapter
        if (chapterId) {
          this.loadSiteIdOptions();
        } else {
          // Clear site options if no chapter selected
          this.siteIdOptions = [];
          this.filteredSiteIdOptions = [];
        }
      });
  }

  /**
   * Set up listener for Site ID changes to fetch description
   */
  private setupSiteIdListener(): void {
    this.form.get('siteId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((siteId: string) => {
        if (siteId && this.mode === 'add') {
          this.fetchSiteDescription(siteId);
        }
      });
  }

  /**
   * Fetch site description by group site ID
   * @param groupSiteId - The group site ID
   */
  private fetchSiteDescription(groupSiteId: string): void {
    this.drivesService.getGroupSiteById(groupSiteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (siteDetails) => {
          // Update the description field with the fetched description
          this.form.get('description')?.setValue(siteDetails.siteName || '', { emitEvent: false });
        },
        error: () => {
          // Clear description on error
          this.form.get('description')?.setValue('', { emitEvent: false });
        }
      });
  }

  /**
   * Load chapter options from API for dropdown
   */
  private loadChapterOptions(): void {
    this.isLoadingOptions = true;

    this.drivesService.getChapterLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.chapterOptions = response.data || [];
          this.filteredChapterOptions = this.chapterOptions;
          this.isLoadingOptions = false;

          // Update chapter display value in edit mode after options are loaded
          if (this.mode === 'edit' && this.data && this.data.chapterID) {
            this.editModeValues.chapterId = this.getChapterDisplayValue(this.data.chapterID);
          }
        },
        error: () => {
          this.isLoadingOptions = false;
        }
      });
  }

  /**
   * Load site ID options from API for dropdown
   */
  private loadSiteIdOptions(): void {
    this.isLoadingSiteOptions = true;
    this.siteIdOptions = [];
    this.filteredSiteIdOptions = [];

    // Get the selected chapter ID from the form
    const chapterId = this.form.get('chapterId')?.value;

    // Load all sites for the selected chapter
    this.drivesService.getGroupSites(chapterId || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const groupSites = response.data || [];

          this.siteIdOptions = groupSites.map(site => ({
            siteId: site.groupSiteId,
            description: site.siteName
          }));

          this.filteredSiteIdOptions = [...this.siteIdOptions];

          this.isLoadingSiteOptions = false;
        },
        error: () => {
          this.siteIdOptions = [];
          this.filteredSiteIdOptions = [];
          this.isLoadingSiteOptions = false;
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.setupPanel();

        if (this.mode === 'add') {
          this.resetFormForAddMode();
        }
      }
    }
  }

  ngAfterViewInit(): void {
    // No scroll listener needed - loading all sites for selected chapter
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add Drive Record';
      this.form.get('description')?.disable();
    } else {
      this.panelTitle = 'Edit Drive Record';
      this.populateFormForEdit();

      // Load group sites for the chapter in edit mode
      this.loadSiteIdOptions();
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      chapterId: '',
      type: '',
      drive: '',
      siteId: '',
      description: '',
      os: '',
      scheduledDate: ''
    };

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    this.form.get('chapterId')?.enable();
    this.form.get('drive')?.enable(); // Enable drive field in add mode
    this.form.get('description')?.disable(); // Disable description field (readonly label)

    // Restore required validators for add mode
    this.form.get('chapterId')?.setValidators([Validators.required, Validators.maxLength(4)]);
    this.form.get('type')?.setValidators([Validators.required, Validators.maxLength(1)]);
    this.form.get('drive')?.setValidators([Validators.required, Validators.maxLength(6), this.noSpecialCharactersValidator]);
    this.form.get('siteId')?.setValidators([Validators.required, Validators.maxLength(7)]);
    this.form.get('os')?.setValidators([Validators.required, Validators.maxLength(1)]);
    this.form.get('scheduledDate')?.setValidators([Validators.required, noFutureDateValidator]);

    // Update validity
    this.form.get('chapterId')?.updateValueAndValidity();
    this.form.get('type')?.updateValueAndValidity();
    this.form.get('drive')?.updateValueAndValidity();
    this.form.get('siteId')?.updateValueAndValidity();
    this.form.get('os')?.updateValueAndValidity();
    this.form.get('scheduledDate')?.updateValueAndValidity();

    // Clear site options when resetting for add mode
    this.siteIdOptions = [];
    this.filteredSiteIdOptions = [];
  }

  private populateFormForEdit(): void {
    if (this.data) {
      const chapterId = this.data.chapterID || '';
      const type = this.mapDisplayTypeToValue(this.data.type || '');
      const drive = this.data.drive || '';
      const siteId = this.data.siteID || '';
      const description = this.data.description || '';
      const os = this.mapDisplayOsToValue(this.data.os || '');

      this.editModeValues = {
        chapterId: this.getChapterDisplayValue(chapterId),
        type: this.data.type || '',
        drive,
        siteId,
        description,
        os: this.data.os || '',
        scheduledDate: this.data.scheduledDate || ''
      };

      // Disable non-editable fields in edit mode
      this.form.get('chapterId')?.disable();
      this.form.get('drive')?.disable(); // Drive is not editable in edit mode
      this.form.get('description')?.disable(); // Description is not editable in edit mode

      this.form.patchValue({
        chapterId,
        type,
        drive,
        siteId,
        description,
        os,
        scheduledDate: this.data.scheduledDate ? moment(this.data.scheduledDate, 'DD-MMM-YYYY') : null
      });

      // In edit mode, remove the past date validator since the datepicker already blocks past dates
      // and we don't want to show error for existing dates
      this.form.get('scheduledDate')?.setValidators([Validators.required]);
      this.form.get('scheduledDate')?.updateValueAndValidity();
    }
  }

  private mapDisplayTypeToValue(displayType: string): string {
    if (displayType.startsWith('F')) return 'F';
    if (displayType.startsWith('I')) return 'I';
    if (displayType.startsWith('C')) return 'C';
    return displayType;
  }

  private mapDisplayOsToValue(displayOs: string): string {
    if (displayOs === 'Yes') return 'Y';
    if (displayOs === 'No') return 'N';
    return displayOs;
  }

  private getChapterDisplayValue(chapterId: string): string {
    const chapter = this.chapterOptions.find(c => c.chapterId === chapterId);
    return chapter ? `${chapterId} - ${chapter.chapterName}` : chapterId;
  }

  /**
   * Format date for API (dd-MMM-yyyy format with title case month)
   */
  private formatDateForApi(date: any): string {
    if (!date) return '';
    const m = moment(date);
    if (!m.isValid()) return '';

    // Format as DD-Mon-YYYY (e.g., "28-Feb-2026")
    const day = m.format('DD');
    const month = m.format('MMM'); // Get month abbreviation
    const year = m.format('YYYY');

    // Ensure month is in title case (first letter uppercase, rest lowercase)
    const monthTitleCase = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();

    return `${day}-${monthTitleCase}-${year}`;
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSaving = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: AddDriveRecordDto = {
        chapterId: formValue.chapterId,
        driveType: formValue.type,
        driveId: formValue.drive,
        groupSiteId: formValue.siteId,
        description: formValue.description || '',
        os: formValue.os,
        scheduledDate: this.formatDateForApi(formValue.scheduledDate)
      };
      apiCall = this.drivesService.addDriveRecord(addPayload);
    } else {
      const updatePayload: UpdateDriveRecordDto = {
        chapterId: formValue.chapterId,
        driveType: formValue.type,
        driveId: formValue.drive,
        groupSiteId: formValue.siteId,
        originalGroupSiteId: this.editModeValues.siteId,
        description: this.editModeValues.description || '',
        os: formValue.os || null,
        scheduledDate: this.formatDateForApi(formValue.scheduledDate)
      };
      apiCall = this.drivesService.updateDriveRecord(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || (this.mode === 'add'
            ? 'Drive Record added successfully'
            : 'Drive Record updated successfully');

          this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: DriveRecordFormData = {
            chapterId: formValue.chapterId,
            type: formValue.type,
            drive: formValue.drive,
            siteId: formValue.siteId,
            description: formValue.description || '',
            os: formValue.os,
            scheduledDate: formValue.scheduledDate?.toDate ? formValue.scheduledDate.toDate() : (formValue.scheduledDate || new Date())
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        },
       
      });
  }

  get chapterIdControl() {
    return this.form.get('chapterId');
  }

  get typeControl() {
    return this.form.get('type');
  }

  get driveControl() {
    return this.form.get('drive');
  }

  get siteIdControl() {
    return this.form.get('siteId');
  }

  get descriptionControl() {
    return this.form.get('description');
  }

  get osControl() {
    return this.form.get('os');
  }

  get scheduledDateControl() {
    return this.form.get('scheduledDate');
  }

  getChapterIdError(): string {
    const control = this.chapterIdControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Chapter ID is required';
    }
    if (control.hasError('maxlength')) {
      return 'Chapter ID must be maximum 4 characters';
    }
    return '';
  }

  getTypeError(): string {
    const control = this.typeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Type is required';
    }
    return '';
  }

  getDriveError(): string {
    const control = this.driveControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Drive is required';
    }
    if (control.hasError('whitespaceOnly')) {
      return 'Drive cannot contain only spaces';
    }
    if (control.hasError('noAlphanumeric')) {
      return 'Drive must contain at least one letter or number';
    }
    if (control.hasError('maxlength')) {
      return 'Drive must be maximum 6 characters';
    }
    if (control.hasError('specialCharacters')) {
      return 'Drive must not contain special characters';
    }
    return '';
  }

  getSiteIdError(): string {
    const control = this.siteIdControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Site ID is required';
    }
    if (control.hasError('maxlength')) {
      return 'Site ID must be maximum 7 characters';
    }
    return '';
  }

  getDescriptionError(): string {
    const control = this.descriptionControl;
    if (!control || !control.touched) return '';

    if (control.hasError('whitespaceOnly')) {
      return 'Description cannot contain only spaces';
    }
    if (control.hasError('maxlength')) {
      return 'Description must be maximum 50 characters';
    }
    return '';
  }

  getOsError(): string {
    const control = this.osControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'OS is required';
    }
    return '';
  }

  getScheduledDateError(): string {
    const control = this.scheduledDateControl;
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse')) {
      return 'Scheduled Date is invalid';
    }
    if (control.hasError('required')) {
      const inputValue = this.scheduledDateInput?.nativeElement?.value;
      if (inputValue && inputValue.trim().length > 0) {
        return 'Scheduled Date is invalid';
      }
      return 'Scheduled Date is required';
    }
    if (control.hasError('pastDate')) {
      return 'Scheduled Date cannot be past date';
    }
    return '';
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }

  noSpecialCharactersValidator = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  const specialCharPattern = /[^a-zA-Z0-9]/;
  if (specialCharPattern.test(control.value)) {
    return { specialCharacters: true };
  }
  return null;
}

  onScheduledDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get('scheduledDate');
    if (!control) return;
    const inputValue = input.value?.trim();
    if (!inputValue) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      if (this.mode === 'edit') {
        control.markAsDirty();
      } else {
        control.markAsPristine();
        control.markAsUntouched();
      }
      control.updateValueAndValidity();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ matDatepickerParse: { text: inputValue } });
      }
    }
  }

  onScheduledDateBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get('scheduledDate');
    if (!control) return;
    const inputValue = input.value?.trim();
    if (!inputValue) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      if (this.mode === 'add') {
        control.markAsPristine();
        control.markAsUntouched();
      }
      control.updateValueAndValidity();
    }
  }

  onDriveInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const newValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (value !== newValue) {
      this.form.patchValue({ drive: newValue }, { emitEvent: false });
      input.value = newValue;
    }
  }

private setupChapterSearch(): void {
  this.chapterSearchControl.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(search => {
      if (!search) {
        this.filteredChapterOptions = this.chapterOptions;
        return;
      }
      const lowerSearch = search.toLowerCase();
      this.filteredChapterOptions = this.chapterOptions.filter(chapter =>
        chapter.chapterId.toLowerCase().includes(lowerSearch) ||
        chapter.chapterName.toLowerCase().includes(lowerSearch)
      );
    });
}

private setupTypeSearch(): void {
  this.typeSearchControl.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(search => {
      if (!search) {
        this.filteredTypeOptions = [...this.typeOptions];
        return;
      }
      const lowerSearch = search.toLowerCase();
      this.filteredTypeOptions = this.typeOptions.filter(type =>
        type.display.toLowerCase().includes(lowerSearch) ||
        type.value.toLowerCase().includes(lowerSearch)
      );
    });
}

private setupSiteSearch(): void {
  this.siteSearchControl.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(search => {
      if (!search) {
        this.filteredSiteIdOptions = [...this.siteIdOptions];
        return;
      }
      const lowerSearch = search.toLowerCase();
      this.filteredSiteIdOptions = this.siteIdOptions.filter(site =>
        site.siteId.toLowerCase().includes(lowerSearch) ||
        site.description.toLowerCase().includes(lowerSearch)
      );
    });
}

private setupOsSearch(): void {
  this.osSearchControl.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(search => {
      if (!search) {
        this.filteredOsOptions = [...this.osOptions];
        return;
      }
      const lowerSearch = search.toLowerCase();
      this.filteredOsOptions = this.osOptions.filter(os =>
        os.display.toLowerCase().includes(lowerSearch) ||
        os.value.toLowerCase().includes(lowerSearch)
      );
    });
}

onChapterDropdownClosed(): void {
  this.chapterSearchControl.setValue('');
  this.filteredChapterOptions = this.chapterOptions;
}

onTypeDropdownClosed(): void {
  this.typeSearchControl.setValue('');
  this.filteredTypeOptions = [...this.typeOptions];
}

onSiteDropdownClosed(): void {
  this.siteSearchControl.setValue('');
  this.filteredSiteIdOptions = [...this.siteIdOptions];
}

onOsDropdownClosed(): void {
  this.osSearchControl.setValue('');
  this.filteredOsOptions = [...this.osOptions];
}

formatDateTime(date: Date | null): string {
    if (!date) return '';
    const momentDate = moment(date);
    const isToday = momentDate.isSame(moment(), 'day');

    if (isToday) {
      return momentDate.format('[Today], HH:mm');
    } else {
      return momentDate.format('DD-MMM-YYYY, HH:mm');
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reload chapter and site options when chapter changes
        this.loadChapterOptions();
        if (this.form.get('chapterId')?.value) {
          this.loadSiteIdOptions();
        }
      });
  }
}
