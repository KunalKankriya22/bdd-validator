import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import {
  AuditHoldRecord,
  RemoveHoldWithOkRequest,
  RemoveHoldWithNftRequest,
  DropdownOption,
  DeferDonorConfig
} from '../models/release-audit-holds.model';
import { ReleaseAuditHoldsService } from '../services/release-audit-holds.service';

@Component({
  selector: 'app-remove-hold-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    NgxMatSelectSearchModule,
    MatProgressSpinnerModule,
    SidePanelBase
  ],
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './remove-hold-panel.html',
  styleUrls: ['./remove-hold-panel.scss']
})
export class RemoveHoldPanel implements OnInit, OnDestroy, OnChanges {
  @Input() record!: AuditHoldRecord;
  @Input() mode: 'ok' | 'nft' = 'ok';
  @Input() isSubmitting = false;
  @Output() closePanel = new EventEmitter<void>();
  @Output() submit = new EventEmitter<RemoveHoldWithOkRequest | RemoveHoldWithNftRequest>();

  @ViewChild('terminationDateInput') terminationDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('deferThroughInput') deferThroughInput!: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  panelTitle = '';
  footerButtons: DialogButton[] = [
    {
      label: 'CANCEL',
      action: 'cancel',
      variant: 'text',
      disabled: false
    },
    {
      label: 'REMOVE',
      action: 'remove',
      variant: 'primary',
      disabled: true
    }
  ];

  today = new Date();
  reasonOptions: DropdownOption[] = [];
  filteredReasonOptions: DropdownOption[] = [];
  reasonSearchControl = new FormControl('');
  deferDonorOptions: DropdownOption[] = [];
  isDeferDonorEnabled = false;

  reasonDescription = '';

  terminationDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const hasFormRangeError = this.form?.errors?.['dateRangeInvalid'] ?? false;
      return !!(control.touched || control.dirty) && hasFormRangeError;
    }
  };

  deferThroughErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const hasFormRangeError = this.form?.errors?.['deferThroughRangeInvalid'] ?? false;
      return !!(control.touched || control.dirty) && hasFormRangeError;
    }
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: ReleaseAuditHoldsService,
    private headerService: HeaderService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isSubmitting']) {
      this.updateButtonStates();
    }
  }

  ngOnInit(): void {
    this.panelTitle = this.mode === 'ok' ? 'Removing Hold With OK' : 'Removing Hold With NFT';
    this.initializeForm();
    this.loadDropdownOptions();
    this.setupReasonSearch();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closePanel.emit();
      });
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      reason: [null, Validators.required],
      terminationDate: [null, [
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator()
      ]],
      deferDonor: [null, Validators.required],
      effectiveDate: [{ value: null, disabled: true }, Validators.required],
      deferThrough: [{ value: null, disabled: true }, [
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator()
      ]],
      comments: [{ value: '', disabled: true }],
      acknowledged: [false, Validators.requiredTrue]
    });

    this.form.get('reason')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.updateReasonDescription(value));

    this.form.get('deferDonor')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.onDeferDonorChange(value));

    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateButtonStates());

    this.form.get('acknowledged')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateButtonStates());

    this.updateButtonStates();
  }

  private loadDropdownOptions(): void {
    this.service.getInterdictionCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(options => {
        this.reasonOptions = options;
        this.filteredReasonOptions = [...options];
      });

    const collDate = DateFieldValidationUtility.serializeDateForApi(
      moment(this.record.collectionDate, 'DD-MMM-YYYY')
    ) || '';
    this.service.getDeferDonorConfig(collDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => this.applyDeferDonorConfig(config));
  }

  private setupReasonSearch(): void {
    this.reasonSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredReasonOptions = this.reasonOptions.filter(option =>
          option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term)
        );
      });
  }

  private applyDeferDonorConfig(config: DeferDonorConfig): void {
    this.isDeferDonorEnabled = config.isDeferDonorEnabled;
    this.deferDonorOptions = config.options;

    if (config.defaultTermDate) {
      this.form.patchValue({
        terminationDate: moment(config.defaultTermDate).toDate()
      }, { emitEvent: false });
    }

    const defaultEffDate = this.mode === 'ok'
      ? config.defaultEffDateOk
      : config.defaultEffDateNft;

    if (defaultEffDate) {
      this.form.patchValue({
        effectiveDate: moment(defaultEffDate).toDate()
      }, { emitEvent: false });
    }

    if (!this.isDeferDonorEnabled) {
      this.form.get('deferDonor')?.disable();
      this.form.get('deferThrough')?.disable();
      this.form.get('comments')?.clearValidators();
      this.form.get('comments')?.disable();
      this.form.get('comments')?.updateValueAndValidity();
    }

    this.form.updateValueAndValidity();
    this.updateButtonStates();
  }


  private onDeferDonorChange(value: string): void {
    const deferThroughControl = this.form.get('deferThrough');
    const commentsControl = this.form.get('comments');

    switch (value) {
      case 'T':
        deferThroughControl?.enable();
        deferThroughControl?.setValidators([
          Validators.required,
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator()
        ]);
        commentsControl?.enable();
        commentsControl?.setValidators([Validators.required]);
        break;

      case 'I':
        deferThroughControl?.patchValue(null, { emitEvent: false });
        deferThroughControl?.clearValidators();
        deferThroughControl?.setValidators([
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator()
        ]);
        deferThroughControl?.disable();
        commentsControl?.enable();
        commentsControl?.setValidators([Validators.required]);
        break;

      case 'N':
      default:
        deferThroughControl?.patchValue(null, { emitEvent: false });
        deferThroughControl?.clearValidators();
        deferThroughControl?.setValidators([
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator()
        ]);
        deferThroughControl?.disable();
        commentsControl?.patchValue('', { emitEvent: false });
        commentsControl?.clearValidators();
        commentsControl?.disable();
        break;
    }

    deferThroughControl?.updateValueAndValidity();
    commentsControl?.updateValueAndValidity();
  }

  private updateReasonDescription(code: string): void {
    const selected = this.reasonOptions.find(opt => opt.value === code);
    this.reasonDescription = selected?.label ?? '';
  }

  private updateButtonStates(): void {
    const isAcknowledged = this.form?.get('acknowledged')?.value === true;
    const isFormValid = this.form?.valid ?? false;
    this.footerButtons = this.footerButtons.map(btn =>
      btn.action === 'remove'
        ? { ...btn, disabled: !isAcknowledged || !isFormValid || this.isSubmitting }
        : btn
    );
  }

  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }
    if (control.hasError('required')) {
      const inputValue = this.terminationDateInput?.nativeElement?.value;
      if (inputValue && inputValue.trim().length > 0) {
        return 'Termination Date is invalid';
      }
      return 'Termination Date is required';
    }
    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Termination Date is invalid';
    }
    if (control.hasError('matDatepickerMin')) {
      return 'Termination Date must be on or after today\'s date';
    }
    return '';
  }

  getDeferThroughError(): string {
    const control = this.form.get('deferThrough');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse')) {
      return 'Defer Through is invalid';
    }
    if (control.hasError('required')) {
      const inputValue = this.deferThroughInput?.nativeElement?.value;
      if (inputValue && inputValue.trim().length > 0) {
        return 'Defer Through is invalid';
      }
      return 'Defer Through is required';
    }
    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Defer Through is invalid';
    }
    if (control.hasError('matDatepickerMin')) {
      return 'Defer Through must be on or after Effective Date';
    }
    return '';
  }

  onDateInputBlur(controlName: string): void {
    const control = this.form.get(controlName);
    if (!control) return;

    if (control.value && control.valid) {
      const currentValue = control.value;
      control.setValue(currentValue, { emitEvent: false });
      control.updateValueAndValidity();
    }
  }

  onButtonClick(action: string): void {
    if (action === 'cancel') {
      this.closePanel.emit();
    } else if (action === 'remove') {
      this.form.markAllAsTouched();
      this.updateButtonStates();

      if (this.form.valid) {
        const formValue = this.form.getRawValue();
        const deferValue = formValue.deferDonor;
        const hasDeferral = deferValue === 'T' || deferValue === 'I';

        const request: RemoveHoldWithOkRequest | RemoveHoldWithNftRequest = {
          unitId: this.record.unitId,
          collectionDate: this.record.collectionDate,
          code: this.record.hold,
          description: this.reasonDescription,
          reason: formValue.reason,
          terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) || '',
          deferDonor: deferValue || null,
          effectiveDate: hasDeferral ? DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '' : '',
          deferThrough: deferValue === 'T' ? formValue.deferThrough : null,
          comments: hasDeferral ? formValue.comments : '',
          acknowledged: formValue.acknowledged
        };

        this.submit.emit(request);
      }
    }
  }

  onClose(): void {
    this.closePanel.emit();
  }

  get formattedEffectiveDate(): string {
    return DateFieldValidationUtility.formatDateForUI(this.form.get('effectiveDate')?.value).toUpperCase();
  }

  get isDeferThroughEnabled(): boolean {
    return this.form.get('deferDonor')?.value === 'T';
  }
}
