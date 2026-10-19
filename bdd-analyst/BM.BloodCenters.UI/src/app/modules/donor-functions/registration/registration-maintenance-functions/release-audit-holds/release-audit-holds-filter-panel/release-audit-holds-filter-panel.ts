import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter, ErrorStateMatcher, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';

import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { AuditHoldFilterValue, DropdownOption, GetHoldsRequest } from '../models/release-audit-holds.model';
import { ReleaseAuditHoldsService } from '../services/release-audit-holds.service';

@Component({
  selector: 'app-release-audit-holds-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] }
  ],
  templateUrl: './release-audit-holds-filter-panel.html',
  styleUrls: ['./release-audit-holds-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReleaseAuditHoldsFilterPanel implements OnInit, OnDestroy {

  @Input() currentFilters: AuditHoldFilterValue | null = null;
  @Input() requestState: GetHoldsRequest | null = null;
  @Input() donationTypeOptionsInput: DropdownOption[] = [];
  @Input() donationProcedureOptionsInput: DropdownOption[] = [];
  @Input() auditHoldTypeOptionsInput: DropdownOption[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() apply = new EventEmitter<AuditHoldFilterValue>();
  @ViewChild('collectionDateInput') collectionDateInput!: ElementRef<HTMLInputElement>;

  collectionDateErrorMatcher!: ErrorStateMatcher;

  filterForm!: FormGroup;

  donationTypeOptions: DropdownOption[] = [];
  donationProcedureOptions: DropdownOption[] = [];
  auditHoldTypeOptions: DropdownOption[] = [];

  // Filtered options for searchable dropdowns
  filteredDonationTypeOptions: DropdownOption[] = [];
  filteredDonationProcedureOptions: DropdownOption[] = [];
  filteredAuditHoldTypeOptions: DropdownOption[] = [];

  // Search controls for dropdowns
  donationTypeSearchControl = new FormControl('');
  donationProcedureSearchControl = new FormControl('');
  auditHoldTypeSearchControl = new FormControl('');

  isLoadingFilters = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private releaseAuditHoldsService: ReleaseAuditHoldsService,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.collectionDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
      () => this.getCollectionDateError()
    );
    this.loadFilterOptions();
    this.setupSearchControls();
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
        this.close.emit();
      });
  }

  /* ------------------------------ FORM INIT ------------------------------ */

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      donationType: [this.currentFilters?.donationType ?? null],
      donationProcedure: [this.currentFilters?.donationProcedure ?? null],
      auditHoldType: [this.currentFilters?.auditHoldType ?? null],
      collectionDate: [this.currentFilters?.collectionDate
        ? moment(this.currentFilters.collectionDate, 'DD-MMM-YYYY')
        : null]
    });
  }

  /* ------------------------------ LOAD OPTIONS ------------------------------ */

  private loadFilterOptions(): void {
    this.donationTypeOptions = [...this.donationTypeOptionsInput];
    this.filteredDonationTypeOptions = [...this.donationTypeOptionsInput];
    this.donationProcedureOptions = [...this.donationProcedureOptionsInput];
    this.filteredDonationProcedureOptions = [...this.donationProcedureOptionsInput];
    this.auditHoldTypeOptions = [...this.auditHoldTypeOptionsInput];
    this.filteredAuditHoldTypeOptions = [...this.auditHoldTypeOptionsInput];
    this.isLoadingFilters = false;
    this.cdr.markForCheck();
  }

  /* ------------------------------ SEARCH SETUP ------------------------------ */

  private setupSearchControls(): void {
    // Donation Type search
    this.donationTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredDonationTypeOptions = this.donationTypeOptions.filter(option =>
          option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    // Donation Procedure search
    this.donationProcedureSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredDonationProcedureOptions = this.donationProcedureOptions.filter(option =>
          option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    // Audit Hold Type search
    this.auditHoldTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredAuditHoldTypeOptions = this.auditHoldTypeOptions.filter(option =>
          option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });
  }

  /* ------------------------------ ACTIONS ------------------------------ */

  onApply(): void {
    const formValue = this.filterForm.getRawValue();

    const collectionDateFormatted = formValue.collectionDate && moment(formValue.collectionDate).isValid()
      ? moment(formValue.collectionDate).format('DD-MMM-YYYY').toUpperCase()
      : undefined;

    const filters: AuditHoldFilterValue = {
      donationType: formValue.donationType ?? undefined,
      donationProcedure: formValue.donationProcedure ?? undefined,
      auditHoldType: formValue.auditHoldType ?? undefined,
      collectionDate: collectionDateFormatted
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      donationType: null,
      donationProcedure: null,
      auditHoldType: null,
      collectionDate: null
    });
  }

  onClose(): void {
    this.close.emit();
  }

  /* ------------------------------ VALIDATION ------------------------------ */

  get isApplyDisabled(): boolean {
    if (!this.filterForm) {
      return true;
    }

    const formValue = this.filterForm.value;

    const hasAnyValue =
      (formValue.donationType !== null && formValue.donationType !== '') ||
      (formValue.donationProcedure !== null && formValue.donationProcedure !== '') ||
      (formValue.auditHoldType !== null && formValue.auditHoldType !== '') ||
      (formValue.collectionDate !== null && formValue.collectionDate !== '');

    return !hasAnyValue;
  }

  /* ------------------------------ DATE INPUT HANDLING ------------------------------ */

  onCollectionDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleEndDateInput(inputValue, this.filterForm.get('collectionDate'));
    this.cdr.markForCheck();
  }

  onDateInputBlur(): void {
    const control = this.filterForm.get('collectionDate');
    if (control?.value && control.valid) {
      control.setValue(control.value, { emitEvent: false });
      control.updateValueAndValidity();
    }
  }

  /* ------------------------------ DATE ERROR MESSAGES ------------------------------ */

  getCollectionDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('collectionDate'),
      null,
      'Collection Date'
    );
  }
}
