import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import moment, { Moment } from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogHeaderFields } from '@shared/components/dialog-header-fields/dialog-header-fields';
import { DialogButton, DialogHeaderField } from '@shared/interfaces/dialog.interface';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { dateFormatValidator } from '@core/utils/date-adapter.util';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { CommunicationRecord, ActionCodeOption } from '../models/donor-communication-query.model';

export interface EditCommunicationDialogData {
  communication: CommunicationRecord;
  actionCodes: ActionCodeOption[];
}

@Component({
  selector: 'app-edit-communication-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    NgxMatSelectSearchModule,
    SidePanelBase,
    DialogHeaderFields,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './edit-communication-dialog.html',
  styleUrls: ['./edit-communication-dialog.scss'],
})
export class EditCommunicationDialog implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<EditCommunicationDialog>);
  private readonly data = inject<EditCommunicationDialogData>(MAT_DIALOG_DATA);

  protected readonly communication = this.data.communication;
  protected readonly actionCodes = this.data.actionCodes;

  form!: FormGroup;
  private readonly destroy$ = new Subject<void>();
  protected readonly isFormDirty = signal<boolean>(false);
  protected readonly hasDateErrors = signal<boolean>(false);

  // Search controls for Action Code dropdown
  protected readonly actionCodeSearchControl = new FormControl('');
  protected readonly actionCodeSearch = signal('');

  // Filtered action codes
  protected readonly filteredActionCodes = computed(() => {
    const search = this.actionCodeSearch().toLowerCase();
    const options = this.actionCodes;
    if (!search) return options;
    return options.filter((o: ActionCodeOption) =>
      (o.code || '').toLowerCase().includes(search)
    );
  });

  protected readonly footerButtons = computed<DialogButton[]>(() => [
    { label: 'CANCEL', action: 'cancel', variant: 'text' },
    { label: 'SAVE', action: 'save', variant: 'primary', disabled: !this.isFormDirty() || this.hasDateErrors() },
  ]);

  protected readonly headerFields: DialogHeaderField[] = [
    { label: 'Donor ID', value: this.data.communication.donorId },
    { label: 'Communication Type', value: this.data.communication.comType },
    { label: 'Communication Code', value: this.data.communication.comCode },
    { label: 'User ID', value: this.data.communication.insertUser },
  ];

  ngOnInit(): void {
    this.form = this.fb.group({
      actionCode: [this.communication.actionCode || null, [Validators.maxLength(5)]],
      targetDate: [
        this.communication.targetDate ? this.parseDate(this.communication.targetDate) : null,
        [dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]
      ],
      actionDate: [
        this.communication.actionDate ? this.parseDate(this.communication.actionDate) : null,
        [dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]
      ],
      comDesc: [this.communication.comDesc || null, [Validators.maxLength(2000)]],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('targetDate', 'actionDate')]
    });

    // Setup search control
    this.actionCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.actionCodeSearch.set(value || ''));

    // Track form dirty state and validation errors
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isFormDirty.set(this.form.dirty);
        this.updateDateErrorsState();
      });

    // Also track status changes to catch validation updates
    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateDateErrorsState();
      });
  }

  /**
   * Update the date errors signal based on current form state
   */
  private updateDateErrorsState(): void {
    const hasTargetError = !!this.getTargetDateError();
    const hasActionError = !!this.getActionDateError();
    this.hasDateErrors.set(hasTargetError || hasActionError);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Parse date string from API (MM-DD-YYYY) to Moment
   */
  private parseDate(dateString: string | null): Moment | null {
    if (!dateString) return null;
    const m = moment(dateString, 'MM-DD-YYYY');
    return m.isValid() ? m : null;
  }

  get f() { return this.form.controls; }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '–';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }

  onFooterButtonClick(action: string): void {
    if (action === 'cancel') {
      this.onCancel();
    } else if (action === 'save') {
      this.onSubmit();
    }
  }

  onSubmit(): void {
    this.dialogRef.close(this.form.value);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Handle Target Date input - validate on typing
   */
  onTargetDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('targetDate'),
      true
    );
  }

  /**
   * Handle Target Date blur - mark as touched
   */
  onTargetDateBlur(): void {
    const control = this.form.get('targetDate');
    control?.markAsTouched();
  }

  /**
   * Handle Action Date input - validate on typing
   */
  onActionDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('actionDate'),
      true
    );
  }

  /**
   * Handle Action Date blur - mark as touched
   */
  onActionDateBlur(): void {
    const control = this.form.get('actionDate');
    control?.markAsTouched();
  }

  /**
   * Get error message for Target Date field
   */
  getTargetDateError(): string {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('targetDate'),
      'Target Date',
      'Action Date',
      this.form.errors
    );
  }

  /**
   * Get error message for Action Date field
   */
  getActionDateError(): string {
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('actionDate'),
      'Action Date',
      'Target Date',
      this.form.errors
    );
  }
}
