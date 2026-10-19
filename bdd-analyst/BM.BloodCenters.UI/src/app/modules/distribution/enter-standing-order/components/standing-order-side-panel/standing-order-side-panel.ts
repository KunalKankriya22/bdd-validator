import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  inject,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { A11yModule } from '@angular/cdk/a11y';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';

import {
  StandingOrderListDto,
  StandingOrderDto,
  CreateStandingOrderDto,
  UpdateStandingOrderDto,
  WEEK_DAYS,
  TIME_OPTIONS,
  CONFIRMATION_OPTIONS,
  WeekDayOption,
  TimeOption,
  getTimeDisplay
} from '../../models/standing-order.model';
import { StandingOrderService } from '../../services/standing-order.service';

@Component({
  selector: 'app-standing-order-side-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    A11yModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './standing-order-side-panel.html',
  styleUrl: './standing-order-side-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StandingOrderSidePanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() record: StandingOrderListDto | null = null;
  @Input() contractId = '';
  @Input() consigneeId = '';

  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<string>();
  @Output() saveAndAddAnother = new EventEmitter<string>();

  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly standingOrderService = inject(StandingOrderService);
  private readonly destroy$ = new Subject<void>();

  protected readonly loading = signal(false);

  readonly weekDays = WEEK_DAYS;
  readonly timeOptions = TIME_OPTIONS;
  readonly confirmationOptions = CONFIRMATION_OPTIONS;

  form!: FormGroup;
  private existingRecord: StandingOrderDto | null = null;
  private minDate!: Moment;

  get isEditMode(): boolean { return this.mode === 'edit'; }

  get panelTitle(): string {
    return this.isEditMode ? 'Edit Previous Day Details' : 'Add New Day Details';
  }

  get lastModifiedDisplay(): string | null {
    if (!this.isEditMode || !this.existingRecord?.lastModifiedDate) return null;
    const tz = this.headerService.chapterTimeZone();
    const m = tz ? moment.utc(this.existingRecord.lastModifiedDate).utcOffset(tz)
                 : moment(this.existingRecord.lastModifiedDate);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : null;
  }

  effDateErrorMatcher: ErrorStateMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );
  termDateErrorMatcher: ErrorStateMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError()
  );

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    this.initForm();
    if (this.isEditMode && this.record) {
      this.loadExistingRecord();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['mode'] || changes['record']) && this.form) {
      this.initForm();
      if (this.isEditMode && this.record) {
        this.loadExistingRecord();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.existingRecord = null;

    const timeStringValidator = (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const isValid = TIME_OPTIONS.some(t => t.display.toLowerCase() === (control.value as string).toLowerCase());
      return isValid ? null : { invalidTime: true };
    };

    this.form = this.fb.group({
      weekDay: [{ value: this.record?.weekDay || '', disabled: this.isEditMode }, [Validators.required]],
      confirmFlag: [this.isEditMode ? '' : 'Y', [Validators.required]],
      requiredTime: [null, [Validators.required, timeStringValidator]],
      effDate: [this.isEditMode ? null : this.minDate.clone(), [Validators.required]],
      termDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    } else {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      const effCtrl = this.form.get('effDate');
      if (effCtrl) {
        effCtrl.enable();
        effCtrl.setValidators([Validators.required]);
        effCtrl.updateValueAndValidity();
      }
    }
  }

  private loadExistingRecord(): void {
    if (!this.record) return;
    this.loading.set(true);

    this.standingOrderService.getStandingOrderById(
      this.record.contractId, this.record.consigneeId, this.record.weekDay
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dto) => {
          if (dto) {
            this.existingRecord = dto;
            this.form.patchValue({
              weekDay: dto.weekDay,
              confirmFlag: dto.confirmFlag,
              requiredTime: dto.requiredTime != null ? getTimeDisplay(dto.requiredTime) : null,
              effDate: dto.effDate ? moment(dto.effDate) : null,
              termDate: dto.termDate ? moment(dto.termDate) : null
            });
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  onSave(addAnother: boolean): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.form.getRawValue();

    if (this.isEditMode && this.record) {
      const updateDto: UpdateStandingOrderDto = {
        confirmFlag: formValue.confirmFlag,
        requiredTime: this.parseTimeToHour(formValue.requiredTime),
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate)
      };

      this.standingOrderService.updateStandingOrder(
        this.record.contractId, this.record.consigneeId, this.record.weekDay, updateDto
      ).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading.set(false);
            this.saveSuccess.emit('Standing order updated successfully');
          },
          error: (err) => {
            this.loading.set(false);
          }
        });
    } else {
      const createDto: CreateStandingOrderDto = {
        contractId: this.contractId,
        consigneeId: this.consigneeId,
        weekDay: formValue.weekDay,
        confirmFlag: formValue.confirmFlag,
        requiredTime: this.parseTimeToHour(formValue.requiredTime),
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate)
      };

      this.standingOrderService.createStandingOrder(createDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading.set(false);
            if (addAnother) {
              this.saveAndAddAnother.emit('Standing order created successfully');
              this.resetFormForAddAnother();
            } else {
              this.saveSuccess.emit('Standing order created successfully');
            }
          },
          error: (err) => {
            this.loading.set(false);
          }
        });
    }
  }

  private resetFormForAddAnother(): void {
    this.form.reset({
      weekDay: '',
      confirmFlag: 'Y',
      requiredTime: null,
      effDate: this.minDate.clone(),
      termDate: null
    });
    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  private parseTimeToHour(timeStr: string | null): number | null {
    if (!timeStr) return null;
    const lower = timeStr.toLowerCase();
    const option = TIME_OPTIONS.find(t => t.display.toLowerCase() === lower);
    return option != null ? option.value : null;
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'), 'Effective Date', 'Termination Date', this.form.errors
    );
  }

  getTerminationDateError(): string {
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'), 'Termination Date', 'Effective Date', this.form.errors
    );
  }

  getEffectiveDateMin(): Moment | null {
    return this.mode === 'add' ? this.minDate : null;
  }

  getTerminationDateMin(): Moment | null {
    const effValue = this.form.get('effDate')?.value;
    if (effValue && moment.isMoment(effValue) && effValue.isValid()) {
      return effValue.isAfter(this.minDate) ? effValue : this.minDate;
    }
    return this.minDate;
  }
}
