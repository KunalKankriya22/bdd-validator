import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { noWhitespaceOnlyValidator, alphanumericWithHyphenValidator } from '@shared/validators/input.validators';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { VehicleDetailsService } from '../services/vehicle-details.service';
import { HeaderService } from '@shared/services/header.service';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import {
  VehicleDetails,
  CreateVehicleDetails,
  UpdateVehicleDetails,
  VehicleNote,
  CreateVehicleNotePayload
} from '../models/vehicle-details.model';
import { formatTableDate } from '../utils/table-display.util';
import { DeleteNoteDialog } from './delete-note-dialog/delete-note-dialog';

@Component({
  selector: 'app-add-edit-vehicle-details',
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
    MatTabsModule,
    MatDialogModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-vehicle-details.html',
  styleUrls: ['./add-edit-vehicle-details.scss']
})
export class AddEditVehicleDetails implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: VehicleDetails | null = null;
  @Input() activeTabIndex: number = 0;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  generalInfoForm: FormGroup;
  noteForm: FormGroup;
  panelTitle: string = '';
  private _minTermDateOverride: moment.Moment | null = null;

  vehicleTypeOptions: { value: string; label: string }[] = [];

  editModeValues: {
    vehicleId: string;
    vehicleName: string;
  } = {
      vehicleId: '',
      vehicleName: ''
    };

  isSaving = false;
  createAnother = false;
  private originalEffectiveDate: string | null = null;
  chapterTimezone: string = '';

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());
  maxDate: Moment | null = null; // Today in chapter timezone — used for "cannot be future date" fields
  minDate: Moment | null = null; // Today in chapter timezone — blocks past dates for eff & term date
  minDecommissionDate: Moment | null = null;
  minFdaRenewalDate: Moment | null = null;

  /** In edit mode, termination min = effective date (allows past dates). In add mode, min = today. */
  get terminationMinDate(): Moment | null {
    if (this._minTermDateOverride) {
      return this._minTermDateOverride;
    }
    if (this.mode === 'edit') {
      return this.generalInfoForm.get('effectiveDate')?.value || null;
    }
    return this.minDate;
  }

  // Notes
  notes: VehicleNote[] = [];
  pendingNotes: CreateVehicleNotePayload[] = []; // Notes to be sent with create request in add mode
  isAddingNote = false;
  editingNoteSequence: number | null = null;
  private localNoteSequence = 1; // Counter for local note sequence in add mode

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private vehicleDetailsService: VehicleDetailsService,
    private headerService: HeaderService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.chapterTimezone = this.headerService.chapterTimeZone();
    this.maxDate = DateFieldValidationUtility.getMinDate(this.chapterTimezone); // today
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterTimezone); // today — blocks past dates

    this.generalInfoForm = this.fb.group({
      vehicleId: [''],
      vehicleName: ['', [Validators.required, Validators.maxLength(50), noWhitespaceOnlyValidator(), this.lettersOnlyValidator()]],
      vehicleType: ['', [Validators.required]],
      identificationNumber: ['', [Validators.maxLength(20)]],
      licensePlate: ['', [Validators.maxLength(20)]],
      registrationDate: [null, [this.notFutureDateValidator()]],
      commissionDate: [null],
      decommissionDate: [null],
      fdaLicenseDate: [null, [this.notFutureDateValidator()]],
      fdaRenewalDate: [null],
      lastInspectionDate: [null, [this.notFutureDateValidator()]],
      inspectionRenewalDate: [null],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    this.noteForm = this.fb.group({
      noteText: ['', [Validators.required, Validators.maxLength(240), noWhitespaceOnlyValidator()]]
    });
  }

  ngOnInit(): void {
    this.setupDateValidation();
    this.updatePanelTitle();
    this.loadVehicleTypes();

    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.generalInfoForm);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.generalInfoForm, this.chapterTimezone);

      // Set effective date default to chapter's today in Add mode
      // Matches Oracle Forms behavior: :valid_vehicles.eff_date := :banner.hdr_date
      const today = DateFieldValidationUtility.getMinDate(this.chapterTimezone);
      this.generalInfoForm.patchValue({
        effectiveDate: today
      }, { emitEvent: false });
    }

    this.generalInfoForm.updateValueAndValidity({ emitEvent: false });
  }


  private loadNotes(vehicleId: string): void {
    this.vehicleDetailsService.getNotes(vehicleId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notes) => {
          this.notes = notes;
        }
      });
  }

  private loadVehicleTypes(): void {
    this.vehicleDetailsService.getVehicleTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.vehicleTypeOptions = types;
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      this.updatePanelTitle();
      this.populateForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDateValidation(): void {
    // Track which date field was last changed for cross-field error display
    this.generalInfoForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.lastChangedDateField = 'effective';
        const today = DateFieldValidationUtility.getMinDate(this.chapterTimezone);
        if (value && moment.isMoment(value) && value.isValid()) {
          // Use the effective date as minimum if it's same as or after today
          // This ensures termination date >= effective date consistently
          this._minTermDateOverride = value.isSameOrAfter(today, 'day') ? value.clone() : today;
        } else {
          this._minTermDateOverride = null;
        }
        // Update termination date validation, but preserve parse errors
        const termControl = this.generalInfoForm.get('terminationDate');
        if (termControl) {
          // Store existing parse/format errors before updating validation
          const parseError = termControl.hasError('matDatepickerParse');
          const invalidDateError = termControl.hasError('invalidDate');
          const invalidFormatError = termControl.hasError('invalidDateFormat');

          termControl.updateValueAndValidity({ emitEvent: false });

          // Restore parse/format errors if they existed (these come from user input, not validators)
          if (parseError || invalidDateError || invalidFormatError) {
            const currentErrors = termControl.errors || {};
            termControl.setErrors({
              ...currentErrors,
              ...(parseError ? { matDatepickerParse: true } : {}),
              ...(invalidDateError ? { invalidDate: true } : {}),
              ...(invalidFormatError ? { invalidDateFormat: true } : {})
            });
          }
        }
      });

    this.generalInfoForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });

    // Watch commission date changes to update minimum decommission date
    this.generalInfoForm.get('commissionDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(commissionDate => {
        if (commissionDate && moment.isMoment(commissionDate)) {
          this.minDecommissionDate = moment(commissionDate).startOf('day').add(1, 'day');
        } else {
          this.minDecommissionDate = null;
        }
        const decomControl = this.generalInfoForm.get('decommissionDate');
        if (decomControl) {
          // Preserve parse errors before updating validation
          const parseError = decomControl.hasError('matDatepickerParse');
          const invalidDateError = decomControl.hasError('invalidDate');
          const invalidFormatError = decomControl.hasError('invalidDateFormat');

          decomControl.updateValueAndValidity();

          if (parseError || invalidDateError || invalidFormatError) {
            const currentErrors = decomControl.errors || {};
            decomControl.setErrors({
              ...currentErrors,
              ...(parseError ? { matDatepickerParse: true } : {}),
              ...(invalidDateError ? { invalidDate: true } : {}),
              ...(invalidFormatError ? { invalidDateFormat: true } : {})
            });
          }
        }
      });

    // Watch decommission date changes to enforce commission date requirement
    // Oracle Forms error 13006: Commission Date required when Decommission Date exists
    this.generalInfoForm.get('decommissionDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(decommissionDate => {
        const commissionControl = this.generalInfoForm.get('commissionDate');
        if (decommissionDate && moment.isMoment(decommissionDate) && decommissionDate.isValid()) {
          // Decommission date exists - make commission date required
          if (!commissionControl?.value) {
            commissionControl?.setErrors({ commissionRequiredForDecommission: true });
            commissionControl?.markAsTouched();
          }
        } else {
          // Decommission date cleared - remove the custom error if it exists
          if (commissionControl?.hasError('commissionRequiredForDecommission')) {
            const errors = { ...commissionControl.errors };
            delete errors['commissionRequiredForDecommission'];
            commissionControl?.setErrors(Object.keys(errors).length > 0 ? errors : null);
          }
        }
      });

    // Watch FDA license date changes to update minimum FDA renewal date
    this.generalInfoForm.get('fdaLicenseDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(fdaLicenseDate => {
        if (fdaLicenseDate && moment.isMoment(fdaLicenseDate)) {
          this.minFdaRenewalDate = moment(fdaLicenseDate).startOf('day').add(1, 'day');
        } else {
          this.minFdaRenewalDate = null;
        }
        const renewalControl = this.generalInfoForm.get('fdaRenewalDate');
        if (renewalControl) {
          // Preserve parse errors before updating validation
          const parseError = renewalControl.hasError('matDatepickerParse');
          const invalidDateError = renewalControl.hasError('invalidDate');
          const invalidFormatError = renewalControl.hasError('invalidDateFormat');

          renewalControl.updateValueAndValidity();

          if (parseError || invalidDateError || invalidFormatError) {
            const currentErrors = renewalControl.errors || {};
            renewalControl.setErrors({
              ...currentErrors,
              ...(parseError ? { matDatepickerParse: true } : {}),
              ...(invalidDateError ? { invalidDate: true } : {}),
              ...(invalidFormatError ? { invalidDateFormat: true } : {})
            });
          }
        }
      });

    // Decommission Date: must be later than Commission Date
    this.generalInfoForm.get('decommissionDate')?.setValidators([
      this.dateAfterFieldValidator('commissionDate', 'decommissionBeforeCommission')
    ]);
    this.generalInfoForm.get('decommissionDate')?.updateValueAndValidity({ emitEvent: false });

    // FDA Renewal Date: must be later than FDA License Date
    this.generalInfoForm.get('fdaRenewalDate')?.setValidators([
      this.dateAfterFieldValidator('fdaLicenseDate', 'fdaRenewalBeforeLicense')
    ]);
    this.generalInfoForm.get('fdaRenewalDate')?.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Validator: only letters and spaces allowed (no numbers or special characters)
   */
  private lettersOnlyValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().trim();
      if (!value) return null;

      // Only allow letters (a-z, A-Z) and spaces
      if (!/^[a-zA-Z\s]+$/.test(value)) {
        return { lettersOnly: true };
      }
      return null;
    };
  }

  /**
   * Validator: date cannot be a future date (based on chapter timezone).
   */
  private notFutureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const selectedDate = moment.isMoment(control.value) ? control.value : moment(control.value);
      if (!selectedDate.isValid()) return null;

      const today = DateFieldValidationUtility.getMinDate(this.chapterTimezone);
      if (selectedDate.format('YYYY-MM-DD') > today.format('YYYY-MM-DD')) {
        return { futureDate: true };
      }
      return null;
    };
  }

  /**
   * Validator: current field's date must be later than another field's date.
   */
  private dateAfterFieldValidator(compareFieldKey: string, errorKey: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const currentDate = moment.isMoment(control.value) ? control.value : moment(control.value);
      if (!currentDate.isValid()) return null;

      const compareValue = this.generalInfoForm.get(compareFieldKey)?.value;
      if (!compareValue) return null;
      const compareDate = moment.isMoment(compareValue) ? compareValue : moment(compareValue);
      if (!compareDate.isValid()) return null;

      if (currentDate.format('YYYY-MM-DD') <= compareDate.format('YYYY-MM-DD')) {
        return { [errorKey]: true };
      }
      return null;
    };
  }

  /** Format effective date for display in edit mode */
  get editEffectiveDateDisplay(): string {
    if (!this.data?.effectiveDate) return '-';
    return moment(this.data.effectiveDate).format('DD-MMM-YYYY').toUpperCase();
  }

  private updatePanelTitle(): void {
    this.panelTitle = this.mode === 'add' ? 'Add New Vehicle Details' : 'Edit Vehicle Details';
  }

  private populateForm(): void {
    if (this.mode === 'edit' && this.data) {
      this.editModeValues.vehicleId = this.data.vehicleId;
      this.editModeValues.vehicleName = this.data.vehicleName;
      this.originalEffectiveDate = this.data.effectiveDate || null;

      this.generalInfoForm.patchValue({
        vehicleId: this.data.vehicleId,
        vehicleName: this.data.vehicleName,
        vehicleType: this.data.vehicleType,
        identificationNumber: this.data.identificationNumber || '',
        licensePlate: this.data.licensePlate || '',
        registrationDate: this.data.registrationDate ? moment(this.data.registrationDate) : null,
        commissionDate: this.data.commissionDate ? moment(this.data.commissionDate) : null,
        decommissionDate: this.data.decommissionDate ? moment(this.data.decommissionDate) : null,
        fdaLicenseDate: this.data.fdaLicenseDate ? moment(this.data.fdaLicenseDate) : null,
        fdaRenewalDate: this.data.fdaRenewalDate ? moment(this.data.fdaRenewalDate) : null,
        lastInspectionDate: this.data.lastInspectionDate ? moment(this.data.lastInspectionDate) : null,
        inspectionRenewalDate: this.data.inspectionRenewalDate ? moment(this.data.inspectionRenewalDate) : null,
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
      });

      // Load notes from API
      this.loadNotes(this.data.vehicleId);
    } else {
      this.generalInfoForm.reset();
      this.notes = [];
      this.pendingNotes = [];
      this.localNoteSequence = 1;
    }
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.generalInfoForm.controls)
      .find(key => this.generalInfoForm.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }

  onSave(): void {
    this.generalInfoForm.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.generalInfoForm, 'terminationDate');

    if (this.generalInfoForm.invalid || this.isSaving) {
      this.focusFirstInvalidField();
      return;
    }

    if (this.hasDateValidationError()) {
      this.generalInfoForm.get('terminationDate')?.markAsTouched();
      return;
    }
    this.isSaving = true;

    const formValue = this.generalInfoForm.getRawValue();

    const vehicleData: any = {
      vehicleName: formValue.vehicleName.trim(),
      vehicleType: formValue.vehicleType,
      identificationNumber: formValue.identificationNumber?.trim() || null,
      licensePlate: formValue.licensePlate?.trim() || null,
      registrationDate: DateFieldValidationUtility.serializeDateForApi(formValue.registrationDate),
      commissionDate: DateFieldValidationUtility.serializeDateForApi(formValue.commissionDate),
      decommissionDate: DateFieldValidationUtility.serializeDateForApi(formValue.decommissionDate),
      fdaLicenseDate: DateFieldValidationUtility.serializeDateForApi(formValue.fdaLicenseDate),
      fdaRenewalDate: DateFieldValidationUtility.serializeDateForApi(formValue.fdaRenewalDate),
      lastInspectionDate: DateFieldValidationUtility.serializeDateForApi(formValue.lastInspectionDate),
      inspectionRenewalDate: DateFieldValidationUtility.serializeDateForApi(formValue.inspectionRenewalDate),
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };

    if (this.mode === 'edit') {
      vehicleData.vehicleId = this.editModeValues.vehicleId;
    } else if (this.mode === 'add' && this.pendingNotes.length > 0) {
      // Include notes in create payload
      vehicleData.notes = this.pendingNotes;
    }

    const saveOperation = this.mode === 'add'
      ? this.vehicleDetailsService.createVehicle(vehicleData as CreateVehicleDetails)
      : this.vehicleDetailsService.updateVehicle(this.editModeValues.vehicleId, vehicleData as UpdateVehicleDetails);

    saveOperation
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: () => {
          this.showSnackbar(
            this.mode === 'add' ? 'Vehicle created successfully' : 'Vehicle updated successfully',
            'success'
          );
          if (this.createAnother) {
            this.createAnother = false;
            this.resetFormForCreateAnother();
          } else {
            this.saveSuccess.emit();
          }
        },
        error: (error) => {
          this.showSnackbar(error?.error?.message || 'Failed to save vehicle. Please try again.', 'error');
        }
      });
  }

  onAddAndCreateAnother(): void {
    this.createAnother = true;
    this.onSave();
  }

  private resetFormForCreateAnother(): void {
    this.generalInfoForm.reset();
    this.generalInfoForm.markAsPristine();
    this.generalInfoForm.markAsUntouched();
    // Clear pending notes for add mode
    this.pendingNotes = [];
    this.notes = [];
    this.localNoteSequence = 1;
  }

  // Notes functionality
  startAddNote(): void {
    this.isAddingNote = true;
    this.noteForm.reset();
  }

  cancelAddNote(): void {
    this.isAddingNote = false;
    this.noteForm.reset();
  }

  addNote(): void {
    if (this.noteForm.invalid) return;

    const noteText = this.noteForm.get('noteText')?.value?.trim() ?? '';
    const chapterId = this.headerService.chapterId() || '';
    const currentUser = this.headerService.headerConfig()?.user?.id || '';

    if (this.mode === 'add') {
      // In add mode, store note locally to be sent with create request
      const pendingNote: CreateVehicleNotePayload = {
        chapterId,
        note: noteText
      };
      this.pendingNotes.push(pendingNote);

      // Also add to display notes array for UI
      const displayNote: VehicleNote = {
        noteId: `temp-${this.localNoteSequence}`,
        chapterId,
        noteSequence: this.localNoteSequence,
        note: noteText,
        programId: '',
        insertDate: DateFieldValidationUtility.getChapterLocalDateForInsertISO(),
        insertUser: currentUser,
        auditKey: 0
      };
      this.notes.push(displayNote);
      this.localNoteSequence++;

      this.isAddingNote = false;
      this.noteForm.reset();
      this.showSnackbar('Note added', 'success');
    } else {
      // In edit mode, call API to add note
      if (!this.data) return;

      this.vehicleDetailsService.addNote(this.data.vehicleId, noteText)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (notes) => {
            this.notes = notes;
            this.isAddingNote = false;
            this.noteForm.reset();
            this.showSnackbar('Note added successfully', 'success');
          },
          error: (error) => {
            this.showSnackbar(error?.error?.message || 'Failed to add note', 'error');
          }
        });
    }
  }

  startEditNote(note: VehicleNote): void {
    this.editingNoteSequence = note.noteSequence;
    this.noteForm.patchValue({ noteText: note.note });
  }

  cancelEditNote(): void {
    this.editingNoteSequence = null;
    this.noteForm.reset();
  }

  saveEditNote(note: VehicleNote): void {
    if (this.noteForm.invalid || !this.data) return;

    const noteText = this.noteForm.get('noteText')?.value.trim();

    this.vehicleDetailsService.updateNote(note.noteId, note.auditKey, noteText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.editingNoteSequence = null;
          this.noteForm.reset();
          this.showSnackbar('Note updated successfully', 'success');
          this.loadNotes(this.data!.vehicleId);
        },
        error: (error) => {
          this.showSnackbar(error?.error?.message || 'Failed to update note', 'error');
        }
      });
  }

  deleteNote(note: VehicleNote): void {
    const dialogRef = this.dialog.open(DeleteNoteDialog, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (!confirmed) return;

        if (this.mode === 'add') {
          // In add mode, just remove from local arrays
          const noteIndex = this.notes.findIndex(n => n.noteSequence === note.noteSequence);
          if (noteIndex > -1) {
            this.notes.splice(noteIndex, 1);
            this.pendingNotes.splice(noteIndex, 1);
          }
          this.showSnackbar('Note deleted', 'success');
        } else {
          // In edit mode, call API to delete note
          if (!this.data) return;

          this.vehicleDetailsService.deleteNote(this.data.vehicleId, note.auditKey)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.notes = this.notes.filter(n => n.noteSequence !== note.noteSequence);
                this.showSnackbar('Note deleted successfully', 'success');
              },
              error: (error) => {
                this.showSnackbar(error?.error?.message || 'Failed to delete note', 'error');
              }
            });
        }
      });
  }

  canEditNote(note: VehicleNote): boolean {
    if (this.mode === 'add') return false;
    return true;
  }

  formatNoteDate(isoDate: string): string {
    if (!isoDate) return '-';
    try {
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) return '-';

      // Format date in chapter timezone using Intl.DateTimeFormat
      const timezone = this.chapterTimezone || 'UTC';
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      // Format as DD-MMM-YYYY
      const parts = formatter.formatToParts(date);
      const day = parts.find(p => p.type === 'day')?.value || '';
      const month = parts.find(p => p.type === 'month')?.value?.toUpperCase() || '';
      const year = parts.find(p => p.type === 'year')?.value || '';

      return `${day}-${month}-${year}`;
    } catch {
      return '-';
    }
  }

  formatDate(isoDate: string): string {
    if (!isoDate) return '-';
    const m = moment(isoDate, moment.ISO_8601, true);
    if (!m.isValid()) return '-';
    return m.format('DD-MMM-YYYY');
  }

  private showSnackbar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar']
    });
  }

  // Form error getters
  readonly terminationDateFilter = (date: Moment | null): boolean => {
    if (!date) return true;
    const d = date.clone().startOf('day');
    const today = DateFieldValidationUtility.getMinDate(this.chapterTimezone);
    if (d.isBefore(today)) return false;
    const effValue = this.generalInfoForm.get('effectiveDate')?.value;
    if (effValue) {
      const eff = moment(effValue).startOf('day');
      if (d.isBefore(eff)) return false;
    }
    return true;
  };

  getVehicleIdError(): string {
    const control = this.generalInfoForm.get('vehicleId');
    if (control?.hasError('required')) return 'Vehicle ID is required';
    if (control?.hasError('maxlength')) return 'Vehicle ID cannot exceed 10 characters';
    if (control?.hasError('whitespace')) return 'Vehicle ID cannot be only whitespace';
    return '';
  }

  getVehicleNameError(): string {
    const control = this.generalInfoForm.get('vehicleName');
    if (control?.hasError('required')) return 'Vehicle Name is required';
    if (control?.hasError('maxlength')) return 'Vehicle Name cannot exceed 50 characters';
    if (control?.hasError('whitespace')) return 'Vehicle Name cannot be only whitespace';
    if (control?.hasError('lettersOnly')) return 'Vehicle Name can only contain letters and spaces';
    return '';
  }

  getVehicleTypeError(): string {
    const control = this.generalInfoForm.get('vehicleType');
    if (control?.hasError('required')) return 'Vehicle Type is required';
    return '';
  }

  getRegistrationDateError(): string {
    const control = this.generalInfoForm.get('registrationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('invalidDateFormat')) return 'Registration Date is invalid';
    if (control.hasError('matDatepickerParse')) return 'Registration Date is invalid';
    if (control.hasError('futureDate')) return 'Registration Date cannot be a future date';
    if (control.hasError('matDatepickerMax')) return 'Registration Date cannot be a future date';
    return '';
  }

  getCommissionDateError(): string {
    const control = this.generalInfoForm.get('commissionDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('invalidDateFormat')) return 'Commission Date is invalid';
    if (control.hasError('matDatepickerParse')) return 'Commission Date is invalid';
    if (control.hasError('commissionRequiredForDecommission'))
      return 'Commission Date is required when Decommission Date is entered';
    return '';
  }

  getDecommissionDateError(): string {
    const control = this.generalInfoForm.get('decommissionDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('invalidDateFormat')) return 'Decommission Date is invalid';
    if (control.hasError('matDatepickerParse')) return 'Decommission Date is invalid';
    if (control.hasError('decommissionBeforeCommission')) return 'Decommission Date must be later than Commission Date';
    if (control.hasError('matDatepickerMin')) return 'Decommission Date must be later than Commission Date';
    return '';
  }

  getFdaLicenseDateError(): string {
    const control = this.generalInfoForm.get('fdaLicenseDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('invalidDateFormat')) return 'FDA License Date is invalid';
    if (control.hasError('matDatepickerParse')) return 'FDA License Date is invalid';
    if (control.hasError('futureDate')) return 'FDA License Date cannot be a future date';
    if (control.hasError('matDatepickerMax')) return 'FDA License Date cannot be a future date';
    return '';
  }

  getFdaRenewalDateError(): string {
    const control = this.generalInfoForm.get('fdaRenewalDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('invalidDateFormat')) return 'FDA Renewal Date is invalid';
    if (control.hasError('matDatepickerParse')) return 'FDA Renewal Date is invalid';
    if (control.hasError('fdaRenewalBeforeLicense')) return 'FDA Renewal Date must be later than FDA License Date';
    if (control.hasError('matDatepickerMin')) return 'FDA Renewal Date must be later than FDA License Date';
    return '';
  }

  getLastInspectionDateError(): string {
    const control = this.generalInfoForm.get('lastInspectionDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('invalidDateFormat')) return 'Last Inspection Date is invalid';
    if (control.hasError('matDatepickerParse')) return 'Last Inspection Date is invalid';
    if (control.hasError('futureDate')) return 'Last Inspection Date cannot be a future date';
    if (control.hasError('matDatepickerMax')) return 'Last Inspection Date cannot be a future date';
    return '';
  }

  getInspectionRenewalDateError(): string {
    const control = this.generalInfoForm.get('inspectionRenewalDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('invalidDateFormat')) return 'Inspection Renewal Date is invalid';
    if (control.hasError('matDatepickerParse')) return 'Inspection Renewal Date is invalid';
    return '';
  }

  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.generalInfoForm.get('effectiveDate'), 'Effective Date', 'Termination Date', this.generalInfoForm.errors
    );
  }

  getTerminationDateError(): string {
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.generalInfoForm.get('terminationDate'), 'Termination Date', 'Effective Date', this.generalInfoForm.errors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.generalInfoForm.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.generalInfoForm.get('terminationDate'), this.mode === 'edit'
    );
  }

  /**
   * Prevent invalid characters in date fields
   * For date fields other than Effective Date and Termination Date,
   * only allow digits and hyphen (no letters or special characters)
   */
  onDateFieldKeyPress(event: KeyboardEvent): void {
    const char = event.key;

    // Allow control keys (backspace, delete, tab, escape, enter, arrows, home, end)
    if (
      event.key === 'Backspace' ||
      event.key === 'Delete' ||
      event.key === 'Tab' ||
      event.key === 'Escape' ||
      event.key === 'Enter' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown' ||
      event.key === 'Home' ||
      event.key === 'End' ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }

    // Only allow digits (0-9) and hyphen (-) - no letters or other special characters
    const validPattern = /^[0-9\-]$/;
    if (!validPattern.test(char)) {
      event.preventDefault();
    }
  }

  /**
   * Handle input event for date fields to trigger validation
   */
  onRegistrationDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.generalInfoForm.get('registrationDate');
    if (!control) return;

    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      // If input has text but control value is null, datepicker couldn't parse it
      if (!control.value) {
        control.setErrors({ invalidDateFormat: true });
      }
    }
  }

  onCommissionDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.generalInfoForm.get('commissionDate');
    if (!control) return;

    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ invalidDateFormat: true });
      }
    }
  }

  onDecommissionDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.generalInfoForm.get('decommissionDate');
    if (!control) return;

    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ invalidDateFormat: true });
      }
    }
  }

  onFdaLicenseDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.generalInfoForm.get('fdaLicenseDate');
    if (!control) return;

    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ invalidDateFormat: true });
      }
    }
  }

  onFdaRenewalDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.generalInfoForm.get('fdaRenewalDate');
    if (!control) return;

    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ invalidDateFormat: true });
      }
    }
  }

  onLastInspectionDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.generalInfoForm.get('lastInspectionDate');
    if (!control) return;

    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ invalidDateFormat: true });
      }
    }
  }

  onInspectionRenewalDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.generalInfoForm.get('inspectionRenewalDate');
    if (!control) return;

    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ invalidDateFormat: true });
      }
    }
  }

  private hasDateValidationError(): boolean {
    return this.generalInfoForm.hasError('dateRangeInvalid') || false;
  }

  get noteCharsRemaining(): number {
    const noteText = this.noteForm.get('noteText')?.value || '';
    return 240 - noteText.length;
  }

  get isFormActionDisabled(): boolean {
    if (this.isSaving || this.generalInfoForm.invalid) {
      return true;
    }
    if (this.mode === 'edit' && !this.generalInfoForm.dirty) {
      return true;
    }
    return false;
  }
}
