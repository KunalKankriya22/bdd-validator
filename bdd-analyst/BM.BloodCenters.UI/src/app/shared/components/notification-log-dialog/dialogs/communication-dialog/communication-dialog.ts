import { TextFieldModule } from '@angular/cdk/text-field';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Inject, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';
import { InputValidationUtil } from '@shared/utils/input-validation.util';
import moment from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import {
  CreateCommunicationRequest,
  DonorCommunication,
} from '../../../../models/notification-log.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { NotificationLogService } from '../../../../services/notification-log.service';

export interface CommunicationDialogData {
  mode: 'new' | 'edit';
  donorId: string;
  communication?: DonorCommunication;
}

export interface CommunicationDialogResult {
  action: 'save' | 'cancel';
  data?: CreateCommunicationRequest;
}

@Component({
  selector: 'app-communication-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    NgxMatSelectSearchModule,
    TextFieldModule,
  ],
  templateUrl: './communication-dialog.html',
  styleUrls: ['./communication-dialog.scss'],
})
export class CommunicationDialogComponent implements OnInit, OnDestroy {
  @ViewChild('targetDateNativeInput') targetDateNativeInput?: ElementRef;
  @ViewChild('actionDateNativeInput') actionDateNativeInput?: ElementRef;

  private readonly service = inject(NotificationLogService);
  private readonly fb = inject(FormBuilder);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private destroy$ = new Subject<void>();
  private dateTimeInterval?: number;

  form!: FormGroup;
  loading = signal(false);
  loadingCodes = signal(false);  // Loading state for communication codes dropdown
  chapterDate!: moment.Moment;

  // Store raw input text to preserve invalid dates
  private targetDateRawInput = '';
  private actionDateRawInput = '';

  // Custom error matchers for date fields
  targetDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.targetDateNativeInput);
    }
  };

  actionDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.actionDateNativeInput);
    }
  };

  // Dropdown options with search (matching notification-log-dialog) - converted to signals
  communicationTypes = signal<{ value: string; label: string }[]>([]);
  communicationCodes = signal<{ value: string; label: string }[]>([]);
  actionCodes = signal<{ value: string; label: string }[]>([]);

  // Search controls for dropdowns
  comTypeSearchControl = new FormControl('');
  filteredComTypes = signal<{ value: string; label: string }[]>([]);

  comCodeSearchControl = new FormControl('');
  filteredComCodes = signal<{ value: string; label: string }[]>([]);

  actionCodeSearchControl = new FormControl('');
  filteredActionCodes = signal<{ value: string; label: string }[]>([]);

  // Staff dropdown with search
  staffList = signal<{ value: string; label: string }[]>([]);
  staffSearchControl = new FormControl('');
  filteredStaff = signal<{ value: string; label: string }[]>([]);

  // Computed descriptions (derived from selected values) - converted to signals
  selectedTypeDesc = signal('');
  selectedCodeDesc = signal('');
  selectedActionCodeDesc = signal('');
  selectedStaffName = signal('');

  // Display values - converted to signals
  currentDateTime = signal('');

  constructor(
    public dialogRef: MatDialogRef<CommunicationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CommunicationDialogData
  ) {}

  ngOnInit(): void {
    // Get chapter date first (critical for all date operations)
    this.chapterDate = this.chapterTimezoneService.getChapterLocalDate();

    this.initializeForm();
    this.setupComTypeSearch();
    this.setupComCodeSearch();
    this.setupActionCodeSearch();
    this.setupStaffSearch();

    if (this.data.mode === 'new') {
      // Load dropdown options only for new mode (single API call)
      this.loadLookups();
      // Use header's timezone calculation approach for add mode
      this.updateDateTime();
      // Update every minute (matching header component)
      this.dateTimeInterval = window.setInterval(() => {
        this.updateDateTime();
      }, 60000);
    } else if (this.data.communication) {
      // For edit mode, don't call dropdown APIs - use data from parent dialog
      // For existing communications, use the stored date
      const dateTime = this.data.communication.dateAndTime;
      this.currentDateTime.set(DateFieldValidationUtility.formatDateTimeForUI(dateTime));
      this.loadExistingData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clear interval if running
    if (this.dateTimeInterval) {
      clearInterval(this.dateTimeInterval);
    }
  }

  private initializeForm(): void {
    const isEdit = this.data.mode === 'edit';

    this.form = this.fb.group({
      communicationType: [{ value: '', disabled: isEdit }, Validators.required],
      communicationCode: [{ value: '', disabled: isEdit }, Validators.required],
      comments: [{ value: '', disabled: isEdit }, Validators.maxLength(2000)],
      staffId: [{ value: '', disabled: isEdit }],
      actionCode: [{ value: '', disabled: isEdit }],
      targetDate: [{ value: null, disabled: isEdit }, [
        DateFieldValidationUtility.validDateValidator()
      ]],
      actionDate: [{ value: null, disabled: isEdit }, [
        DateFieldValidationUtility.validDateValidator()
      ]], // Disabled in edit mode (no API to update)
    });

    // Type change handler
    this.form.get('communicationType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(communicationType => {
        this.onTypeChange(communicationType);
      });

    // Code change handler
    this.form.get('communicationCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(communicationCode => {
        this.onCodeChange(communicationCode);
      });

    // Action code change handler
    this.form.get('actionCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(actionCode => {
        this.onActionCodeChange(actionCode);
      });

    // Staff change handler
    this.form.get('staffId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(staffId => {
        this.onStaffChange(staffId);
      });
  }

  // Setup search for communication types (matching notification-log-dialog)
  private setupComTypeSearch(): void {
    this.comTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredComTypes.set(!term
          ? [...this.communicationTypes()]
          : this.communicationTypes().filter(type =>
              type.label.toLowerCase().includes(term) ||
              type.value.toLowerCase().includes(term)
            ));
      });
  }

  // Setup search for communication codes (matching notification-log-dialog)
  private setupComCodeSearch(): void {
    this.comCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredComCodes.set(!term
          ? [...this.communicationCodes()]
          : this.communicationCodes().filter(code =>
              code.label.toLowerCase().includes(term) ||
              code.value.toLowerCase().includes(term)
            ));
      });
  }

  // Setup search for action codes
  private setupActionCodeSearch(): void {
    this.actionCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredActionCodes.set(!term
          ? [...this.actionCodes()]
          : this.actionCodes().filter(code =>
              code.label.toLowerCase().includes(term) ||
              code.value.toLowerCase().includes(term)
            ));
      });
  }

  private loadLookups(): void {
    // For add mode, use single API call to get all dropdown values
    this.service.getAddDropdownValues()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dropdownValues) => {
          // Communication Types
          const typesData = dropdownValues.communicationTypes.map(t => ({
            value: t.code,
            label: `${t.code} - ${t.description}`
          }));
          this.communicationTypes.set(typesData);
          this.filteredComTypes.set([...typesData]);

          // Staff List
          const staffData = dropdownValues.staffList.map(s => ({
            value: s.staffId,
            label: `${s.staffId} - ${s.name}`
          }));
          this.staffList.set(staffData);
          this.filteredStaff.set([...staffData]);

          // Action Codes
          const actionCodesData = dropdownValues.actionCodes.map(c => ({
            value: c.code,
            label: `${c.code} - ${c.description}`
          }));
          this.actionCodes.set(actionCodesData);
          this.filteredActionCodes.set([...actionCodesData]);
        },
        error: (error) => {
          console.error('Failed to load dropdown values:', error);
          // Initialize with empty arrays on error
          this.communicationTypes.set([]);
          this.filteredComTypes.set([]);
          this.staffList.set([]);
          this.filteredStaff.set([]);
          this.actionCodes.set([]);
          this.filteredActionCodes.set([]);
        }
      });
  }

  // Setup search for staff (matching notification-log-dialog)
  private setupStaffSearch(): void {
    this.staffSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredStaff.set(!term
          ? [...this.staffList()]
          : this.staffList().filter(staff =>
              staff.label.toLowerCase().includes(term) ||
              staff.value.toLowerCase().includes(term)
            ));
      });
  }

  private loadExistingData(): void {
    if (!this.data.communication) return;

    const comm = this.data.communication;

    // In edit mode, populate dropdown options from existing data (no API calls)
    // Communication Type
    if (comm.communicationType && comm.communicationTypeDescription) {
      const typeOption = {
        value: comm.communicationType,
        label: `${comm.communicationType} - ${comm.communicationTypeDescription}`
      };
      this.communicationTypes.set([typeOption]);
      this.filteredComTypes.set([typeOption]);
    }

    // Communication Code
    if (comm.communicationCode && comm.communicationCodeDescription) {
      const codeOption = {
        value: comm.communicationCode,
        label: `${comm.communicationCode} - ${comm.communicationCodeDescription}`
      };
      this.communicationCodes.set([codeOption]);
      this.filteredComCodes.set([codeOption]);
    }

    // Action Code
    if (comm.actionCode && comm.actionCodeDescription) {
      const actionOption = {
        value: comm.actionCode,
        label: `${comm.actionCode} - ${comm.actionCodeDescription}`
      };
      this.actionCodes.set([actionOption]);
      this.filteredActionCodes.set([actionOption]);
    }

    // Staff
    if (comm.staffId && comm.staffName) {
      const staffOption = {
        value: comm.staffId,
        label: `${comm.staffId} - ${comm.staffName}`
      };
      this.staffList.set([staffOption]);
      this.filteredStaff.set([staffOption]);
    }

    // Parse dates from API (YYYY-MM-DD format) to moment objects
    // Set form values
    this.form.patchValue({
      communicationType: comm.communicationType,
      communicationCode: comm.communicationCode,
      comments: comm.comments,
      staffId: comm.staffId,
      actionCode: comm.actionCode,
      targetDate: comm.targetDate ? moment(comm.targetDate, 'YYYY-MM-DD') : null,
      actionDate: comm.actionDate ? moment(comm.actionDate, 'YYYY-MM-DD') : null,
    });

    // Set descriptions
    this.selectedTypeDesc.set(comm.communicationTypeDescription || '');
    this.selectedCodeDesc.set(comm.communicationCodeDescription || '');
    this.selectedActionCodeDesc.set(comm.actionCodeDescription || '');
    this.selectedStaffName.set(comm.staffName && comm.staffName.trim() !== ',' ? comm.staffName : '');
  }

  private onTypeChange(communicationType: string): void {
    if (!communicationType) {
      this.communicationCodes.set([]);
      this.filteredComCodes.set([]);
      this.selectedTypeDesc.set('');
      this.form.patchValue({ communicationCode: '' });
      return;
    }

    // Extract description from label
    const type = this.communicationTypes().find(t => t.value === communicationType);
    this.selectedTypeDesc.set(type ? type.label.split(' - ')[1] || '' : '');

    // Load communication codes - use add mode API for new mode, regular API for edit mode
    this.loadingCodes.set(true);
    const codesObservable = this.data.mode === 'new'
      ? this.service.getAddCommunicationCodes(communicationType)
      : this.service.getCommunicationCodes(this.data.donorId, communicationType);

    codesObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          // Transform to { value, label } format
          const codesData = codes.map(c => ({
            value: c.code,
            label: `${c.code} - ${c.description}`
          }));
          this.communicationCodes.set(codesData);
          this.filteredComCodes.set([...codesData]);
          this.loadingCodes.set(false);
        },
        error: (error) => {
          console.error('Failed to load communication codes:', error);
          // Initialize with empty arrays on error
          this.communicationCodes.set([]);
          this.filteredComCodes.set([]);
          this.loadingCodes.set(false);
        }
      });

    // Clear code selection
    this.form.patchValue({ communicationCode: '' });
    this.selectedCodeDesc.set('');
  }

  private onCodeChange(communicationCode: string): void {
    if (!communicationCode) {
      this.selectedCodeDesc.set('');
      return;
    }

    // Extract description from label
    const code = this.communicationCodes().find(c => c.value === communicationCode);
    this.selectedCodeDesc.set(code ? code.label.split(' - ')[1] || '' : '');
  }

  private onActionCodeChange(actionCode: string): void {
    if (!actionCode) {
      this.selectedActionCodeDesc.set('');
      return;
    }

    // Extract description from label
    const code = this.actionCodes().find(c => c.value === actionCode);
    this.selectedActionCodeDesc.set(code ? code.label.split(' - ')[1] || '' : '');
  }

  onStaffChange(staffId: string): void {
    if (!staffId) {
      this.selectedStaffName.set('');
      return;
    }

    // Extract name from label
    const staff = this.staffList().find(s => s.value === staffId);
    const staffName = staff ? staff.label.split(' - ')[1] || '' : '';
    this.selectedStaffName.set(staffName && staffName.trim() !== ',' ? staffName : '');
  }

  /**
   * Prevents leading spaces and multiple consecutive spaces
   * Uses shared InputValidationUtil for consistency across components
   */
  preventLeadingAndMultipleSpaces(event: KeyboardEvent, controlName: string): void {
    const control = this.form.get(controlName);
    if (control) {
      InputValidationUtil.preventLeadingAndMultipleSpaces(event, control);
    }
  }

  /**
   * Trims trailing spaces from a field on blur
   * Uses shared InputValidationUtil for consistency across components
   */
  trimTrailingSpaces(controlName: string): void {
    const control = this.form.get(controlName);
    if (control) {
      InputValidationUtil.trimTrailingSpaces(control);
    }
  }

  /**
   * Prevents space input entirely (for date fields)
   * Uses shared InputValidationUtil for consistency across components
   */
  preventSpaceInput(event: KeyboardEvent): void {
    InputValidationUtil.preventSpaceInput(event);
  }

  onSave(): void {
    // Mark all fields as touched to show validation errors
    this.form.markAllAsTouched();

    // Check for visible date errors
    if (this.hasVisibleDateError) {
      return;
    }

    if (this.form.invalid) {
      return;
    }

    if (this.data.mode === 'new') {
      this.saveNewCommunication();
    } else {
      // For edit mode, just close dialog (all fields are readonly)
      this.dialogRef.close({ action: 'save' });
    }
  }

  private saveNewCommunication(): void {
    const request = this.buildCreateRequest();
    this.loading.set(true);

    this.service.createCommunication(this.data.donorId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.snackbarService.showSuccess('Communication saved successfully.');
          const result: CommunicationDialogResult = {
            action: 'save',
            data: request
          };
          this.dialogRef.close(result);
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Failed to save communication:', error);
          // TODO: Show error message to user (e.g., using a snackbar)
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  /**
   * Store raw input text when user types in target date field
   */
  onTargetDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.targetDateRawInput = input.value;

    // Mark field as touched to show validation errors immediately
    const control = this.form.get('targetDate');
    if (control && !control.touched) {
      control.markAsTouched();
    }
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onTargetDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.form.get('targetDate');
      if (!control?.value && this.targetDateRawInput && !input.value) {
        input.value = this.targetDateRawInput;
      }
    }, 0);
  }

  /**
   * Store raw input text when user types in action date field
   */
  onActionDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.actionDateRawInput = input.value;

    // Mark field as touched to show validation errors immediately
    const control = this.form.get('actionDate');
    if (control && !control.touched) {
      control.markAsTouched();
    }
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onActionDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.form.get('actionDate');
      if (!control?.value && this.actionDateRawInput && !input.value) {
        input.value = this.actionDateRawInput;
      }
    }, 0);
  }

  /**
   * Get native input element text value
   */
  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  /**
   * Get error message for target date field
   */
  getTargetDateError(): string {
    const control = this.form?.get('targetDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDate')) return 'Target Date is invalid';
    if (!control.value && this.getNativeInputText(this.targetDateNativeInput)) return 'Target Date is invalid';
    return '';
  }

  /**
   * Get error message for action date field
   */
  getActionDateError(): string {
    const control = this.form?.get('actionDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDate')) return 'Action Date is invalid';
    if (!control.value && this.getNativeInputText(this.actionDateNativeInput)) return 'Action Date is invalid';
    return '';
  }

  /**
   * Check if there are visible date errors
   */
  get hasVisibleDateError(): boolean {
    return !!this.getTargetDateError() || !!this.getActionDateError();
  }

  /**
   * Check if save button should be disabled
   */
  get isSaveDisabled(): boolean {
    if (this.loading()) {
      return true;
    }

    // In add mode, disable if form is invalid or has visible date errors
    if (this.data.mode === 'new') {
      return this.form.invalid || this.hasVisibleDateError;
    }

    // In edit mode, form is always valid since fields are disabled
    return false;
  }

  private buildCreateRequest(): CreateCommunicationRequest {
    const formValue = this.form.getRawValue();

    return {
      communicationType: formValue.communicationType,
      communicationCode: formValue.communicationCode,
      comments: formValue.comments || undefined,
      staffId: formValue.staffId || undefined,
      actionCode: formValue.actionCode || undefined,
      // Format dates as ISO 8601 with time (YYYY-MM-DDTHH:mm:ss)
      targetDate: formValue.targetDate
        ? moment(formValue.targetDate).format('YYYY-MM-DDTHH:mm:ss')
        : undefined,
      actionDate: formValue.actionDate
        ? moment(formValue.actionDate).format('YYYY-MM-DDTHH:mm:ss')
        : undefined,
    };
  }

  // Use DateFieldValidationUtility for consistent date formatting
  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const momentDate = typeof date === 'string' ? moment(date) : moment(date);
    return DateFieldValidationUtility.formatDateForUI(momentDate);
  }

  get isNewMode(): boolean {
    return this.data.mode === 'new';
  }

  get dialogTitle(): string {
    return this.data.mode === 'new' ? 'Add New' : 'Details';
  }

  /**
   * Updates the current date/time display formatted as DD-MON-YYYY, HH:MM with chapter's timezone
   * Matching header component's timezone calculation approach
   */
  private updateDateTime(): void {
    const timeZone = this.headerService.chapterTimeZone();
    if (!timeZone) return;

    const now = new Date();

    const sign = timeZone[0] === '+' ? 1 : -1;
    const [hh, mm] = timeZone.slice(1).split(':').map(Number);
    const local = new Date(now.getTime() + sign * (hh * 60 + mm) * 60000);

    const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const monthName = MONTHS[local.getUTCMonth()];
    const day = String(local.getUTCDate()).padStart(2, '0');
    const year = local.getUTCFullYear();
    const hour = String(local.getUTCHours()).padStart(2, '0');
    const minute = String(local.getUTCMinutes()).padStart(2, '0');

    this.currentDateTime.set(`${day}-${monthName.toUpperCase()}-${year} ${hour}:${minute}`);
  }

  /**
   * TrackBy function for dropdown options to improve performance
   */
  trackByValue(_index: number, item: { value: string; label: string }): string {
    return item.value;
  }
}
