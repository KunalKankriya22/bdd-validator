import { TextFieldModule } from '@angular/cdk/text-field';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, Inject, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { LoggingService } from '@shared/services/logging.service';
import { InputValidationUtil } from '@shared/utils/input-validation.util';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DonorCommunicationsService } from '../../services/donor-communications.service';
import {
  AddCommunicationDialogData,
  CreateDonorCommunicationDto
} from '../../models/donor-communications.model';

@Component({
  selector: 'app-add-communication',
  standalone: true,
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
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    TextFieldModule
  ],
  templateUrl: './add-communication.html',
  styleUrls: ['./add-communication.scss']
})
export class AddCommunicationDialogComponent implements OnInit, OnDestroy {
  @ViewChild('targetDateNativeInput') targetDateNativeInput?: ElementRef;
  @ViewChild('actionDateNativeInput') actionDateNativeInput?: ElementRef;

  private readonly service = inject(DonorCommunicationsService);
  private readonly fb = inject(FormBuilder);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly loggingService = inject(LoggingService);
  private destroy$ = new Subject<void>();
  private dateTimeInterval?: number;

  form!: FormGroup;
  loading = signal(false);
  loadingCodes = signal(false);
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

  // Dropdown options with search - converted to signals
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

  // Computed descriptions (derived from selected values) - converted to signals
  selectedTypeDesc = signal('');
  selectedCodeDesc = signal('');
  selectedActionCodeDesc = signal('');

  // Display values - converted to signals
  currentDateTime = signal('');
  currentUser = signal('');

  constructor(
    public dialogRef: MatDialogRef<AddCommunicationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddCommunicationDialogData
  ) {}

  ngOnInit(): void {
    // Validate required dialog data
    if (!this.data) {
      this.snackbarService.showError('Dialog configuration is missing (Error 18023)');
      this.loggingService.error('AddCommunicationDialog: Missing dialog data');
      this.dialogRef.close({ action: 'cancel' });
      return;
    }

    if (!this.data.donorId) {
      this.snackbarService.showError('Donor ID is required to add communication (Error 18023)');
      this.loggingService.error('AddCommunicationDialog: Missing or invalid donorId', this.data.donorId);
      this.dialogRef.close({ action: 'cancel' });
      return;
    }

    if (!this.data.mode || !['new', 'details'].includes(this.data.mode)) {
      this.snackbarService.showError('Invalid dialog mode (Error 18023)');
      this.loggingService.error('AddCommunicationDialog: Invalid mode', this.data.mode);
      this.dialogRef.close({ action: 'cancel' });
      return;
    }

    // Get chapter date first
    this.chapterDate = this.chapterTimezoneService.getChapterLocalDate();

    // Get current user
    this.currentUser.set(this.loginService.getStoredUsername() || '');

    this.initializeForm();
    this.setupComTypeSearch();
    this.setupComCodeSearch();
    this.setupActionCodeSearch();

    if (this.data.mode === 'new') {
      this.loadLookups();
      this.updateDateTime();
      // Update every minute
      this.dateTimeInterval = window.setInterval(() => {
        this.updateDateTime();
      }, 60000);
    } else if (this.data.communication) {
      const dateTime = this.data.communication.comDate;
      this.currentDateTime.set(DateFieldValidationUtility.formatDateTimeForUI(dateTime));
      this.loadExistingData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.dateTimeInterval) {
      clearInterval(this.dateTimeInterval);
    }
  }

  private initializeForm(): void {
    const isDetails = this.data.mode === 'details';

    this.form = this.fb.group({
      communicationType: [{ value: '', disabled: isDetails }, Validators.required],
      communicationCode: [{ value: '', disabled: isDetails }, Validators.required],
      comments: [{ value: '', disabled: isDetails }, Validators.maxLength(2000)],
      actionCode: [{ value: '', disabled: isDetails }],
      targetDate: [{ value: null, disabled: isDetails }, [
        DateFieldValidationUtility.validDateValidator()
      ]],
      actionDate: [{ value: null, disabled: isDetails }, [
        DateFieldValidationUtility.validDateValidator()
      ]]
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
  }

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
    // Load communication types
    this.service.getCommunicationTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          const typesData = types.map(t => ({
            value: t.code,
            label: `${t.code} - ${t.description}`
          }));
          this.communicationTypes.set(typesData);
          this.filteredComTypes.set([...typesData]);
        },
        error: (error) => {
          this.loggingService.error('Failed to load communication types', error);
          this.communicationTypes.set([]);
          this.filteredComTypes.set([]);
        }
      });
  }

  private loadExistingData(): void {
    if (!this.data.communication) return;

    const comm = this.data.communication;

    // Populate dropdown options from existing data
    if (comm.comType && comm.comTypeDesc) {
      const typeOption = {
        value: comm.comType,
        label: `${comm.comType} - ${comm.comTypeDesc}`
      };
      this.communicationTypes.set([typeOption]);
      this.filteredComTypes.set([typeOption]);
    }

    if (comm.comCode && comm.comCodeDesc) {
      const codeOption = {
        value: comm.comCode,
        label: `${comm.comCode} - ${comm.comCodeDesc}`
      };
      this.communicationCodes.set([codeOption]);
      this.filteredComCodes.set([codeOption]);
    }

    if (comm.actionCode && comm.actionCodeDesc) {
      const actionOption = {
        value: comm.actionCode,
        label: `${comm.actionCode} - ${comm.actionCodeDesc}`
      };
      this.actionCodes.set([actionOption]);
      this.filteredActionCodes.set([actionOption]);
    }

    // Set form values
    this.form.patchValue({
      communicationType: comm.comType,
      communicationCode: comm.comCode,
      comments: comm.comDesc,
      actionCode: comm.actionCode,
      targetDate: comm.targetDate ? moment(comm.targetDate, 'YYYY-MM-DD') : null,
      actionDate: comm.actionDate ? moment(comm.actionDate, 'YYYY-MM-DD') : null
    });

    // Set descriptions
    this.selectedTypeDesc.set(comm.comTypeDesc || '');
    this.selectedCodeDesc.set(comm.comCodeDesc || '');
    this.selectedActionCodeDesc.set(comm.actionCodeDesc || '');
  }

  private onTypeChange(communicationType: string): void {
    if (!communicationType) {
      this.communicationCodes.set([]);
      this.filteredComCodes.set([]);
      this.actionCodes.set([]);
      this.filteredActionCodes.set([]);
      this.selectedTypeDesc.set('');
      this.form.patchValue({ communicationCode: '' });
      return;
    }

    // Extract description from label
    const type = this.communicationTypes().find(t => t.value === communicationType);
    this.selectedTypeDesc.set(type ? type.label.split(' - ')[1] || '' : '');

    // Load communication codes
    this.loadingCodes.set(true);
    this.service.getCommunicationCodes(communicationType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          const codesData = codes.map(c => ({
            value: c.code,
            label: `${c.code} - ${c.description}`
          }));
          this.communicationCodes.set(codesData);
          this.filteredComCodes.set([...codesData]);
          this.loadingCodes.set(false);
        },
        error: (error) => {
          this.loggingService.error('Failed to load communication codes', error);
          this.communicationCodes.set([]);
          this.filteredComCodes.set([]);
          this.loadingCodes.set(false);
        }
      });

    // Load action codes for the selected communication type
    this.service.getActionCodes(communicationType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          const actionCodesData = codes.map(c => ({
            value: c.code,
            label: `${c.code} - ${c.description}`
          }));
          this.actionCodes.set(actionCodesData);
          this.filteredActionCodes.set([...actionCodesData]);
        },
        error: (error) => {
          this.loggingService.error('Failed to load action codes', error);
          this.actionCodes.set([]);
          this.filteredActionCodes.set([]);
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

    const code = this.communicationCodes().find(c => c.value === communicationCode);
    this.selectedCodeDesc.set(code ? code.label.split(' - ')[1] || '' : '');
  }

  private onActionCodeChange(actionCode: string): void {
    if (!actionCode) {
      this.selectedActionCodeDesc.set('');
      return;
    }

    const code = this.actionCodes().find(c => c.value === actionCode);
    this.selectedActionCodeDesc.set(code ? code.label.split(' - ')[1] || '' : '');
  }

  preventLeadingAndMultipleSpaces(event: KeyboardEvent, controlName: string): void {
    const control = this.form.get(controlName);
    if (control) {
      InputValidationUtil.preventLeadingAndMultipleSpaces(event, control);
    }
  }

  trimTrailingSpaces(controlName: string): void {
    const control = this.form.get(controlName);
    if (control) {
      InputValidationUtil.trimTrailingSpaces(control);
    }
  }

  preventSpaceInput(event: KeyboardEvent): void {
    InputValidationUtil.preventSpaceInput(event);
  }

  onSave(): void {
    this.form.markAllAsTouched();

    if (this.hasVisibleDateError) {
      return;
    }

    if (this.form.invalid) {
      return;
    }

    if (this.data.mode === 'new') {
      this.saveNewCommunication();
    } else {
      this.dialogRef.close({ action: 'cancel' });
    }
  }

  private saveNewCommunication(): void {
    const request = this.buildCreateRequest();

    // Disable form to prevent modifications during save
    this.form.disable();
    this.loading.set(true);

    this.service.createCommunication(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          // Form stays disabled - dialog will close
          this.snackbarService.showSuccess('Communication saved successfully');
          this.dialogRef.close({ action: 'save' });
        },
        error: (error) => {
          this.loading.set(false);
          // Re-enable form on error so user can correct and retry
          this.form.enable();
          this.loggingService.error('Failed to save communication', error);

          // Extract and display specific error message if available
          const errorMessage = this.extractErrorMessage(error);
          this.snackbarService.showError(errorMessage || 'Failed to save communication');
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  onTargetDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.targetDateRawInput = input.value;

    const control = this.form.get('targetDate');
    if (control && !control.touched) {
      control.markAsTouched();
    }
  }

  onTargetDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.form.get('targetDate');
      if (!control?.value && this.targetDateRawInput && !input.value) {
        input.value = this.targetDateRawInput;
      }
    }, 0);
  }

  onActionDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.actionDateRawInput = input.value;

    const control = this.form.get('actionDate');
    if (control && !control.touched) {
      control.markAsTouched();
    }
  }

  onActionDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.form.get('actionDate');
      if (!control?.value && this.actionDateRawInput && !input.value) {
        input.value = this.actionDateRawInput;
      }
    }, 0);
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  getTargetDateError(): string {
    const control = this.form?.get('targetDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDate')) return 'Target Date is invalid';
    if (!control.value && this.getNativeInputText(this.targetDateNativeInput)) return 'Target Date is invalid';
    return '';
  }

  getActionDateError(): string {
    const control = this.form?.get('actionDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDate')) return 'Action Date is invalid';
    if (!control.value && this.getNativeInputText(this.actionDateNativeInput)) return 'Action Date is invalid';
    return '';
  }

  get hasVisibleDateError(): boolean {
    return !!this.getTargetDateError() || !!this.getActionDateError();
  }

  get isSaveDisabled(): boolean {
    if (this.loading() || this.form.disabled) {
      return true;
    }

    if (this.data.mode === 'new') {
      return this.form.invalid || this.hasVisibleDateError;
    }

    return false;
  }

  private buildCreateRequest(): CreateDonorCommunicationDto {
    const formValue = this.form.getRawValue();

    return {
      donorId: this.data.donorId,
      comDate: moment().format('YYYY-MM-DDTHH:mm:ss'),
      comType: formValue.communicationType,
      comCode: formValue.communicationCode,
      comDesc: formValue.comments || undefined,
      actionCode: formValue.actionCode || undefined,
      targetDate: formValue.targetDate
        ? moment(formValue.targetDate).format('YYYY-MM-DD')
        : undefined,
      actionDate: formValue.actionDate
        ? moment(formValue.actionDate).format('YYYY-MM-DD')
        : undefined
    };
  }

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

  trackByValue(_index: number, item: { value: string; label: string }): string {
    return item.value;
  }

  /**
   * Extracts user-friendly error message from API error response
   */
  private extractErrorMessage(error: any): string | null {
    // Check for structured API error response
    if (error?.error?.Message) {
      return error.error.Message;
    }

    if (error?.error?.Error) {
      return error.error.Error;
    }

    // Check for validation error array
    if (error?.error?.ErrorResponse?.Error) {
      return error.error.ErrorResponse.Error;
    }

    // Map specific error codes to user-friendly messages
    const errorCode = error?.error?.ErrorCode;
    if (errorCode) {
      const errorMap: Record<string, string> = {
        '18030': 'Comments exceed maximum length (2000 characters)',
        '18031': 'Action Code is too long (max 5 characters)',
        '18032': 'Action Date cannot be in the past',
        '18015': 'Communication Type is required',
        '18016': 'Invalid Communication Type',
        '18013': 'Invalid Communication Code',
        '18017': 'Invalid Action Code',
        '18029': 'Communication Date is required'
      };

      if (errorMap[errorCode]) {
        return errorMap[errorCode];
      }
    }

    return null;
  }
}
