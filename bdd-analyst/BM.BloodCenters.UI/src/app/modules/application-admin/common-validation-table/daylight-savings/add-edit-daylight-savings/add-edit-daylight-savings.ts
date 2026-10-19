import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE
} from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DaylightSavingsService } from '../services/daylight-savings.service';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import {
  DaylightSavingsModel,
  DaylightSavingsDto,
  UpdateDaylightSavingsDto
} from '../models/daylight-savings.model';
import { HeaderService } from '@shared/services/header.service';
import { getDateInTimezone } from '@shared/date/timezone.util';

@Component({
  selector: 'app-add-edit-daylight-savings',
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
    MatTooltipModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-daylight-savings.html',
  styleUrls: ['./add-edit-daylight-savings.scss']
})
export class AddEditDaylightSavings
  implements OnInit, OnChanges, OnDestroy {

  @Input() mode: 'add' | 'edit' | 'view' = 'add';
  @Input() data: DaylightSavingsModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<'add' | 'edit' | 'view'>();

  form: FormGroup;
  panelTitle = '';
  isSaving = false;
  isLoadingOptions = false;

  chapterOptions: { id: string; name: string }[] = [];
  timeZoneOptions: string[] = [];
  timeZoneRegionOptions: string[] = [];

  // Filtered options for searchable dropdowns (Donor User Access pattern)
  filteredChapterOptions: { id: string; name: string }[] = [];
  filteredTimeZoneOptions: string[] = [];
  filteredTimeZoneRegionOptions: string[] = [];

  // Search controls for dropdowns
  chapterSearchControl = new FormControl('');
  timeZoneSearchControl = new FormControl('');
  timeZoneRegionSearchControl = new FormControl('');

  private originalStartTime: string | null = null; // Track original start time for edit mode
  private destroy$ = new Subject<void>();
  private dropdownOptionsLoaded$ = new Subject<void>();

  /** Error state matchers for date fields following Donor User Access pattern */
  startDateTimeErrorMatcher = {
    isErrorState: (control: any): boolean => {
      if (!control) return false;
      return (control.invalid && (control.touched || control.dirty)) ||
             (control.touched && !!this.getStartDateTimeError());
    }
  };

  endDateTimeErrorMatcher = {
    isErrorState: (control: any): boolean => {
      if (!control) return false;
      return (control.invalid && (control.touched || control.dirty)) ||
             (control.touched && !!this.getEndDateTimeError());
    }
  };

  constructor(
    private fb: FormBuilder,
    private daylightSavingsService: DaylightSavingsService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService
  ) {
    this.form = this.fb.group({
      chapterId: ['', [Validators.required, Validators.maxLength(4)]],
      chapterName: [''],
      startDateTime: ['', [Validators.required, this.dateTimeFormatValidator.bind(this)]],
      endDateTime: ['', [Validators.required, this.dateTimeFormatValidator.bind(this)]],
      baseOffSet: [null],
      dstOffSet: [null, [Validators.required, Validators.min(0), Validators.max(120), this.integerValidator]],
      timeZone: ['', Validators.required],
      timeZoneRegion: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(64)]]
    }, { validators: this.dateTimeRangeValidator.bind(this) });
  }

  /* -------------------------------- CUSTOM VALIDATORS -------------------------------- */

  private integerValidator(control: any): { [key: string]: any } | null {
    if (control.value === null || control.value === '') {
      return null;
    }
    const value = parseFloat(control.value);
    if (isNaN(value)) {
      return null;
    }
    // Check if the value is not an integer
    if (!Number.isInteger(value)) {
      return { notInteger: true };
    }
    return null;
  }

  /**
   * Get chapter-aware "today" date for validation.
   * Uses chapter timezone offset to get the correct current date.
   */
  private getChapterToday(): Moment {
    const chapterOffset = this.headerService.chapterTimeZone();

    if (chapterOffset && chapterOffset !== 'UTC') {
      try {
        const { year, month, day } = getDateInTimezone(chapterOffset);
        return moment([year, month, day]);
      } catch {
        // Fallback: try as offset string (e.g., "-05:00")
        return moment.utc().utcOffset(chapterOffset).startOf('day');
      }
    }

    // Fallback to browser time if chapter timezone not available
    return moment().startOf('day');
  }

  /* ---------------- INIT ---------------- */

  ngOnInit(): void {
    this.setupTimeZoneListener();
    this.setupSearchControls();
    this.loadDropdownOptions();

    // SetupPanel will be called via ngOnChanges or after dropdown loads
    // If mode/data are already set, setupPanel() has been called by ngOnChanges
    // Otherwise, call it after a short delay to ensure dropdowns have started loading
    if (!this.mode) {
      setTimeout(() => this.setupPanel(), 0);
    }
  }

  /* ---------------- TIME ZONE LISTENER ---------------- */

  private setupTimeZoneListener(): void {
    // Listen to Time Zone changes and auto-populate Base Offset and fetch timezone regions
    this.form.get('timeZone')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((timeZone: string) => {
        if (timeZone) {
          // Extract offset from timezone string (e.g., "GMT-05:00" -> "-5")
          const offset = this.extractOffsetFromTimeZone(timeZone);

          // Clear the Time Zone Region when timezone changes (it will be repopulated)
          // Auto-set DST offset to 60 (standard 1-hour offset)
          this.form.patchValue({
            baseOffSet: offset,
            dstOffSet: 60,
            timeZoneRegion: ''
          }, { emitEvent: false });

          // Clear existing options
          this.timeZoneRegionOptions = [];
          this.filteredTimeZoneRegionOptions = [];

          // Fetch new timezone regions based on selected timezone
          this.loadTimeZoneRegionsByOffset(timeZone);
        } else {
          // No timezone selected, disable and clear Time Zone Region
          this.form.patchValue({
            baseOffSet: null,
            timeZoneRegion: ''
          }, { emitEvent: false });
          this.timeZoneRegionOptions = [];
          this.filteredTimeZoneRegionOptions = [];
          this.form.get('timeZoneRegion')?.disable({ emitEvent: false });
        }
      });
  }

  /* ---------------- SEARCH SETUP (Donor User Access pattern) ---------------- */

  private setupSearchControls(): void {
    // Chapter search
    this.chapterSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredChapterOptions = this.chapterOptions.filter(chapter =>
          chapter.id.toLowerCase().includes(term) ||
          chapter.name.toLowerCase().includes(term)
        );
      });

    // Time Zone search
    this.timeZoneSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredTimeZoneOptions = this.timeZoneOptions.filter(tz =>
          tz.toLowerCase().includes(term)
        );
      });

    // Time Zone Region search
    this.timeZoneRegionSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredTimeZoneRegionOptions = this.timeZoneRegionOptions.filter(region =>
          region.toLowerCase().includes(term)
        );
      });
  }

  // Store the timezone region to set after API loads
  private pendingTimeZoneRegion: string | null = null;

  private extractOffsetFromTimeZone(timeZone: string): string {
    // Remove "GMT" prefix and extract the offset value
    // Examples: "GMT-05:00" -> "-05:00", "GMT+05:30" -> "+05:30"
    const match = timeZone.match(/GMT([+-])(\d{1,2}):?(\d{2})?/i);

    if (!match) return '';

    const sign = match[1];
    const hours = match[2].padStart(2, '0');
    const minutes = match[3] || '00';

    // Return in HH:MM format with sign
    return `${sign}${hours}:${minutes}`;
  }

  private convertBaseOffsetToTimeZone(baseOffset: string | number | null): string {
    // Convert base offset to GMT timezone format
    // Examples: "-06:00" -> "GMT-06:00", "+05:30" -> "GMT+05:30"
    // Also supports legacy: "4.5" -> "GMT+04:30", "-5" -> "GMT-05:00"

    if (baseOffset === null || baseOffset === undefined || baseOffset === '') return '';

    const offsetStr = baseOffset.toString();

    // Check if already in HH:MM format (e.g., "-06:00", "+05:30")
    const hhmmMatch = offsetStr.match(/^([+-])?(\d{1,2}):(\d{2})$/);
    if (hhmmMatch) {
      const sign = hhmmMatch[1] || '+';
      const hours = hhmmMatch[2].padStart(2, '0');
      const minutes = hhmmMatch[3];
      return `GMT${sign}${hours}:${minutes}`;
    }

    // Legacy format: decimal number (e.g., "-5", "4.5")
    const offsetNum = typeof baseOffset === 'string' ? parseFloat(baseOffset) : baseOffset;

    if (isNaN(offsetNum)) return '';

    const sign = offsetNum >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetNum);
    const hours = Math.floor(absOffset);
    const minutes = Math.round((absOffset - hours) * 60);

    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');

    return `GMT${sign}${hoursStr}:${minutesStr}`;
  }

  private loadTimeZoneRegionsByOffset(timeZone: string): void {
    this.isLoadingOptions = true;

    // Extract offset without "GMT" prefix (e.g., "GMT+05:00" -> "+05:00")
    const offsetWithoutGMT = timeZone.replace(/^GMT/i, '');

    this.daylightSavingsService.getTimeZoneRegionsByOffset(offsetWithoutGMT)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingOptions = false)
      )
      .subscribe({
        next: (res: any) => {
          if (res.success && res.data && res.data.length > 0) {
            const data = res.data[0];

            // DON'T update timezone options - keep the full list for searching
            // Only update timezone region options based on selected timezone
            if (data.timeZoneRegion && Array.isArray(data.timeZoneRegion)) {
              this.timeZoneRegionOptions = data.timeZoneRegion;
              // Initialize filtered options (Donor User Access pattern)
              this.filteredTimeZoneRegionOptions = [...this.timeZoneRegionOptions];

              // Enable the Time Zone Region dropdown now that we have options
              this.form.get('timeZoneRegion')?.enable({ emitEvent: false });

              // If there's a pending timezone region value (from edit mode), set it now
              if (this.pendingTimeZoneRegion !== null) {
                this.form.patchValue({
                  timeZoneRegion: this.pendingTimeZoneRegion
                }, { emitEvent: false });

                // Clear the pending value
                this.pendingTimeZoneRegion = null;
              }
            }
          }
        },
        error: (err) => {
          console.error('Error fetching timezone regions:', err);
          this.timeZoneRegionOptions = [];
          this.filteredTimeZoneRegionOptions = [];
          this.form.get('timeZoneRegion')?.disable({ emitEvent: false });
          this.pendingTimeZoneRegion = null;
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      this.setupPanel();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.dropdownOptionsLoaded$.complete();
  }

  /* ---------------- PANEL SETUP ---------------- */

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add New Day Light Savings';
      // Restore validators for add mode
      this.form.get('chapterId')?.setValidators(Validators.required);
      this.form.get('chapterId')?.updateValueAndValidity();
      this.form.enable();
      this.form.reset();

      // Disable Time Zone Region until a timezone is selected
      this.form.get('timeZoneRegion')?.disable({ emitEvent: false });
    } else if (this.mode === 'edit' && this.data) {
      this.panelTitle = 'Edit Day Light Savings';
      this.populateForm();
    } else if (this.mode === 'view' && this.data) {
      this.panelTitle = 'View Day Light Savings';
      this.populateFormForView();
    }
  }

  private populateFormForView(): void {
    if (!this.data) return;

    // Enable all fields first
    this.form.enable();

    const startDateTime = this.data.startTime ? this.formatDateTimeForInput(this.data.startTime) : '';
    const endDateTime = this.data.endTime ? this.formatDateTimeForInput(this.data.endTime) : '';

    this.form.patchValue({
      chapterId: this.data.chapterId,
      chapterName: this.data.chapterName,
      startDateTime,
      endDateTime,
      baseOffSet: this.data.baseOffSet ?? null,
      dstOffSet: this.data.dstOffSet ?? null,
      timeZone: this.data.timeZone ?? '',
      timeZoneRegion: this.data.timeZoneRegion ?? ''
    });

    // Disable all form controls in view mode
    this.form.disable();
  }

  private populateForm(): void {
    if (!this.data) return;

    // Store original start time for WHERE clause in UPDATE
    this.originalStartTime = this.data.startTime || null;

    // Enable all fields first
    this.form.enable();

    // Clear validators for chapterId in edit mode since it will be disabled
    this.form.get('chapterId')?.clearValidators();
    this.form.get('chapterId')?.updateValueAndValidity();

    const startDateTime = this.data.startTime ? this.formatDateTimeForInput(this.data.startTime) : '';
    const endDateTime = this.data.endTime ? this.formatDateTimeForInput(this.data.endTime) : '';

    // Populate form WITHOUT timeZone and timeZoneRegion initially
    this.form.patchValue({
      chapterId: this.data.chapterId,
      chapterName: this.data.chapterName,
      startDateTime,
      endDateTime,
      baseOffSet: this.data.baseOffSet ?? null,
      dstOffSet: this.data.dstOffSet ?? null
    }, { emitEvent: false });

    // Trigger validation after patching form to ensure date range validation runs in edit mode
    this.form.updateValueAndValidity();

    // Disable chapterId and chapterName in edit mode (part of PK, readonly)
    this.form.get('chapterId')?.disable();
    this.form.get('chapterName')?.disable();

    // Store the timezone region to be set after API loads
    this.pendingTimeZoneRegion = this.data.timeZoneRegion ?? null;

    // Wait for dropdown options to load before setting timezone
    // Capture the base offset value now before the async callback
    const baseOffSet = this.data.baseOffSet;

    this.dropdownOptionsLoaded$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // Convert base offset to timezone format and set it
      // This will trigger the valueChanges listener which will call the API
      if (baseOffSet !== null && baseOffSet !== undefined) {
        const timeZone = this.convertBaseOffsetToTimeZone(baseOffSet);
        if (timeZone) {
          // Set timezone - this will trigger the listener and API call
          this.form.patchValue({ timeZone }, { emitEvent: true });
        }
      } else {
        // No base offset, keep Time Zone Region disabled
        this.form.get('timeZoneRegion')?.disable({ emitEvent: false });
      }
    });
  }

  /* ---------------- VALIDATORS ---------------- */

  private dateTimeFormatValidator(control: any): { [key: string]: any } | null {
    const value = control.value as string;

    if (!value || value.trim() === '') {
      return null; // Required validator handles empty values
    }

    // Regex for DD-MMM-YYYY HH:mm format - only accepts "-" as separator
    // Example: 02-JAN-2025 00:00
    const regex = /^(\d{2})-([A-Za-z]{3})-(\d{4})\s(\d{2}):(\d{2})$/;
    const match = value.match(regex);

    if (!match) {
      return { invalidFormat: true };
    }

    const [, day, monthStr, year, hours, minutes] = match;

    // Validate month (case insensitive)
    const validMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    if (!validMonths.includes(monthStr.toUpperCase())) {
      return { invalidDateTime: true };
    }

    // Normalize to uppercase format with hyphens for parsing
    const normalizedValue = `${day}-${monthStr.toUpperCase()}-${year} ${hours}:${minutes}`;

    // Parse and validate date/time
    const parsedDate = moment(normalizedValue, 'DD-MMM-YYYY HH:mm', true);
    if (!parsedDate.isValid()) {
      return { invalidDateTime: true };
    }

    // Validate day range
    const dayNum = parseInt(day, 10);
    if (dayNum < 1 || dayNum > 31) {
      return { invalidDateTime: true };
    }

    // Validate hours and minutes
    const hoursNum = parseInt(hours, 10);
    const minutesNum = parseInt(minutes, 10);
    if (hoursNum < 0 || hoursNum > 23 || minutesNum < 0 || minutesNum > 59) {
      return { invalidDateTime: true };
    }

    // Auto-correct the value to uppercase format with hyphens
    if (value !== normalizedValue) {
      setTimeout(() => {
        control.setValue(normalizedValue, { emitEvent: false });
      });
    }

    return null;
  }

  private dateTimeRangeValidator(group: FormGroup): { [key: string]: any } | null {
    const startDateTimeStr = group.get('startDateTime')?.value as string;
    const endDateTimeStr = group.get('endDateTime')?.value as string;
    // Use chapter-aware current date/time for validation
    const now = this.getChapterToday();

    // IMPORTANT: Past date validation should only run in ADD mode
    // In EDIT mode, we allow editing existing records with past dates
    // This follows the same pattern as Donor User Access module
    if (this.mode === 'add') {
      // Validate start date even if end date is not filled
      if (startDateTimeStr) {
        const startDateTime = moment(startDateTimeStr, 'DD-MMM-YYYY HH:mm', true);

        if (startDateTime.isValid()) {
          // Check if start date/time is in the past (FMB error 18202)
          // Compare using chapter-aware current time
          if (startDateTime.isBefore(now)) {
            return { pastDateTime: 'Start date & time cannot be in the past' };
          }
        }
      }

      // Validate end date even if start date is not filled
      if (endDateTimeStr) {
        const endDateTime = moment(endDateTimeStr, 'DD-MMM-YYYY HH:mm', true);

        if (endDateTime.isValid()) {
          // Check if end date/time is in the past (FMB error 11066)
          // Compare using chapter-aware current time
          if (endDateTime.isBefore(now)) {
            return { pastEndDateTime: 'End date & time cannot be in the past' };
          }
        }
      }
    }

    // Only validate range if both dates are filled
    if (!startDateTimeStr || !endDateTimeStr) {
      return null;
    }

    // Parse the datetime strings
    const startDateTime = moment(startDateTimeStr, 'DD-MMM-YYYY HH:mm', true);
    const endDateTime = moment(endDateTimeStr, 'DD-MMM-YYYY HH:mm', true);

    if (!startDateTime.isValid() || !endDateTime.isValid()) {
      return null; // Format validators handle invalid dates
    }

    // End datetime must be strictly greater than start datetime
    if (endDateTime.isSameOrBefore(startDateTime)) {
      return { invalidDateRange: 'End date & time must be greater than start date & time' };
    }

    return null;
  }

  /* ---------------- LOAD DROPDOWNS ---------------- */

  private loadDropdownOptions(): void {
    this.isLoadingOptions = true;

    this.daylightSavingsService.getChapters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          // API returns array directly, map chapterId -> id, chapterName -> name
          if (Array.isArray(res)) {
            this.chapterOptions = res.map((chapter: any) => ({
              id: chapter.chapterId,
              name: chapter.chapterName
            }));
          } else {
            this.chapterOptions = [];
          }
          // Initialize filtered options (Territory pattern)
          this.filteredChapterOptions = [...this.chapterOptions];
        },
        error: () => {
          this.chapterOptions = [];
          this.filteredChapterOptions = [];
        }
      });

    this.daylightSavingsService.getDaylightSavingsDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          const dropdown = res.data?.[0];
          if (dropdown) {
            this.timeZoneOptions = dropdown.timeZone ?? [];
            // Initialize filtered options (Donor User Access pattern)
            this.filteredTimeZoneOptions = [...this.timeZoneOptions];
            // Don't load timeZoneRegionOptions from here - they come from the offset-specific API
          }
          this.isLoadingOptions = false;
          // Emit that dropdown options are loaded
          this.dropdownOptionsLoaded$.next();
        },
        error: () => {
          this.isLoadingOptions = false;
          this.dropdownOptionsLoaded$.next();
        }
      });
  }

  /* ---------------- SAVE HANDLER ---------------- */

  onSave(closeAfterSave = true): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();

    // Parse the datetime strings
    const startDateTime = moment(raw.startDateTime, 'DD-MMM-YYYY HH:mm', true);
    const endDateTime = moment(raw.endDateTime, 'DD-MMM-YYYY HH:mm', true);

    if (!startDateTime.isValid() || !endDateTime.isValid()) {
      return; // Should not happen due to validators
    }

    const payload: DaylightSavingsDto | UpdateDaylightSavingsDto = {
      chapterId: raw.chapterId?.trim(),
      // Send dates in chapter local time (without 'Z' suffix)
      // Backend will convert from chapter local time to GMT using GetGmtDateAsync
      // This follows the same pattern as Donor User Access module
      startTime: startDateTime.format('YYYY-MM-DDTHH:mm:ss.SSS'),
      endTime: endDateTime.format('YYYY-MM-DDTHH:mm:ss.SSS'),
      timeZone: raw.timeZone,
      timeZoneRegion: raw.timeZoneRegion,
      baseOffSet: raw.baseOffSet?.toString() ?? '',
      dstOffSet: Number(raw.dstOffSet ?? 0)
    };

    // Include originalStartTime for edit mode
    if (this.mode === 'edit' && this.originalStartTime) {
      (payload as UpdateDaylightSavingsDto).originalStartTime = this.originalStartTime;
    }

    this.isSaving = true;

    const apiCall =
      this.mode === 'add'
        ? this.daylightSavingsService.addDaylightSavings(payload)
        : this.daylightSavingsService.updateDaylightSavings(payload);

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isSaving = false))
      )
      .subscribe({
        next: (res) => {
          this.snackBar.open(
            res?.message ||
              (this.mode === 'add'
                ? 'Record added successfully'
                : 'Record updated successfully'),
            'DISMISS',
            {
              duration: 3000,
              verticalPosition: 'top',
              horizontalPosition: 'end',
              panelClass: ['success-snackbar']
            }
          );

          this.saveSuccess.emit();

          if (closeAfterSave) {
            this.closePanel.emit();
          } else {
            this.form.reset();
          }
        },
        error: (err) => {
          console.error('Error saving daylight savings:', err);
          // Error is handled globally by authInterceptor
        }
      });
  }

  onSaveAndCreateAnother(): void {
    this.onSave(false);
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onChapterChange(chapterId: string): void {
    const chapter = this.chapterOptions.find(c => c.id === chapterId);
    if (chapter) {
      this.form.patchValue({ chapterName: chapter.name });
    }
  }

  /* ---------------- FORMATTERS ---------------- */

  formatDateTime(dateTime: Date | string | null | undefined): string {
    if (!dateTime) return '-';

    const d = new Date(dateTime);
    return `${d.getDate().toString().padStart(2, '0')}-${d
      .toLocaleString('en-US', { month: 'short' })
      .toUpperCase()}-${d.getFullYear()} ${d
      .getHours()
      .toString()
      .padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  private formatDateTimeForInput(dateTime: Date | string | null | undefined): string {
    if (!dateTime) return '';

    const m = moment(dateTime);
    if (!m.isValid()) return '';

    // Format as DD-MMM-YYYY HH:mm with uppercase month (e.g., 02-JAN-2025 00:00)
    const formatted = m.format('DD-MMM-YYYY HH:mm');
    // Convert month to uppercase (moment returns "Jan", we need "JAN")
    const parts = formatted.split('-');
    if (parts.length === 3) {
      parts[1] = parts[1].toUpperCase();
      return parts.join('-');
    }
    return formatted.toUpperCase();
  }

  /* ---------------- INPUT VALIDATION ---------------- */

  preventInvalidNumberInput(event: KeyboardEvent): void {
    // Prevent 'e', 'E', '+', '-' from being entered in number fields
    if (event.key === 'e' || event.key === 'E' || event.key === '+' || event.key === '-') {
      event.preventDefault();
    }
  }

  /* ---------------- DATE/TIME ERROR MESSAGES (Donor User Access Pattern) ---------------- */

  /**
   * Get error message for Start Date & Time field
   * Follows Donor User Access pattern for error handling
   */
  getStartDateTimeError(): string {
    const control = this.form.get('startDateTime');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('required')) {
      return 'Start date & time is required';
    }

    if (control.hasError('invalidFormat') || control.hasError('invalidDateTime')) {
      return 'Start date & time format is invalid (DD-MMM-YYYY HH:mm or DD/MMM/YYYY HH:mm)';
    }

    if (this.form.hasError('pastDateTime') && this.mode === 'add') {
      return 'Start date & time cannot be in the past';
    }

    return '';
  }

  /**
   * Get error message for End Date & Time field
   * Follows Donor User Access pattern for error handling
   */
  getEndDateTimeError(): string {
    const control = this.form.get('endDateTime');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('required')) {
      return 'End date & time is required';
    }

    if (control.hasError('invalidFormat') || control.hasError('invalidDateTime')) {
      return 'End date & time format is invalid (DD-MMM-YYYY HH:mm or DD/MMM/YYYY HH:mm)';
    }

    if (this.form.hasError('pastEndDateTime') && this.mode === 'add') {
      return 'End date & time cannot be in the past';
    }

    if (this.form.hasError('invalidDateRange')) {
      return 'End date & time must be greater than start date & time';
    }

    return '';
  }

  /* ---------------- INPUT EVENT HANDLERS (Donor User Access Pattern) ---------------- */

  /**
   * Handle input event for Start Date & Time field
   * Follows Donor User Access pattern for input validation
   */
  onStartDateTimeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get('startDateTime');
    if (!control) return;

    if (!input.value?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.markAsTouched();
      control.setErrors({ required: true });
    } else {
      control.markAsTouched();
      control.markAsDirty();
      // If input has text but control value is null, datetime parser couldn't parse it
      if (!control.value) {
        control.setErrors({ invalidDateTime: true });
      }
    }

    // Trigger form-level validators to check date range in both add and edit modes
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Handle input event for End Date & Time field
   * Follows Donor User Access pattern for input validation
   */
  onEndDateTimeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get('endDateTime');
    if (!control) return;

    if (!input.value?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.markAsTouched();
      control.setErrors({ required: true });
    } else {
      control.markAsTouched();
      control.markAsDirty();
      // If input has text but control value is null, datetime parser couldn't parse it
      if (!control.value) {
        control.setErrors({ invalidDateTime: true });
      }
    }

    // Trigger form-level validators to check date range in both add and edit modes
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Handle input event for DST Offset field
   * Marks the field as touched for validation
   */
  onDstOffsetInput(): void {
    const control = this.form.get('dstOffSet');
    if (!control) return;

    control.markAsTouched();
    control.markAsDirty();
  }

  /**
   * Get error message for DST Offset field
   * Follows Donor User Access pattern for error handling
   */
  getDstOffsetError(): string {
    const control = this.form.get('dstOffSet');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('required')) {
      return 'DST Offset is required';
    }

    if (control.hasError('notInteger')) {
      return 'Enter valid number';
    }

    if (control.hasError('min')) {
      return 'DST Offset must be at least 0';
    }

    if (control.hasError('max')) {
      return 'DST Offset cannot exceed 120 minutes';
    }

    return '';
  }
} 