import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, debounceTime, catchError, of } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { RegularOrderApiService } from '../../services/regular-order-api.service';
import { CustomerContactDto } from '../../models/regular-order.model';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

export interface EnterCustomerContactDialogData {
  customerId: string;
}

@Component({
  selector: 'app-enter-customer-contact-dialog',
  standalone: true,
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
    MatMomentDateModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './enter-customer-contact-dialog.html',
  styleUrls: ['./enter-customer-contact-dialog.scss']
})
export class EnterCustomerContactDialogComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `enter-customer-contact-${EnterCustomerContactDialogComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  readonly data = inject<EnterCustomerContactDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<EnterCustomerContactDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiService = inject(RegularOrderApiService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  existingContacts = signal<CustomerContactDto[]>([]);

  contactForm!: FormGroup;
  minDate!: Moment;
  terminationMinDate!: Moment;
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  contactTypes = signal<{ code: string; description: string }[]>([]);
  salutations = signal<{ code: string; description: string }[]>([]);
  filteredContactTypes = signal<{ code: string; description: string }[]>([]);
  filteredSalutations = signal<{ code: string; description: string }[]>([]);
  contactTypeSearchCtrl = new FormControl('');
  salutationSearchCtrl = new FormControl('');
  selectedContactTypeCode = signal<string>('D');
  selectedContactTypeDescription = computed(() => {
    const code = this.selectedContactTypeCode();
    const type = this.contactTypes().find(t => t.code === code);
    return type?.description ?? code;
  });

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  ngOnInit(): void {
    this.minDate = this.getChapterMinDate();
    this.terminationMinDate = this.minDate;
    this.initializeForm();
    DateFieldValidationUtility.setupAddModeValidators(this.contactForm, this.chapterOffset);
    this.contactForm.get('contactTypeCode')!.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(code => {
      this.selectedContactTypeCode.set(code);
      this.cdr.markForCheck();
    });
    this.subscribeToSearchFilters();
    this.loadContactTypes();
    this.loadExistingContacts();
  }

  private loadContactTypes(): void {
    this.apiService.getContactTypes().pipe(
      takeUntil(this.destroy$)
    ).subscribe(types => {
      this.contactTypes.set(types);
      this.filteredContactTypes.set(types);
      this.cdr.markForCheck();
    });

    this.apiService.getSalutationsLookup().pipe(
      takeUntil(this.destroy$)
    ).subscribe(salutations => {
      this.salutations.set(salutations);
      this.filteredSalutations.set(salutations);
      this.cdr.markForCheck();
    });
  }

  private subscribeToSearchFilters(): void {
    this.contactTypeSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredContactTypes.set(
        this.contactTypes().filter(t => t.code.toLowerCase().includes(search) || t.description.toLowerCase().includes(search))
      );
    });

    this.salutationSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredSalutations.set(
        this.salutations().filter(s => s.code.toLowerCase().includes(search) || s.description.toLowerCase().includes(search))
      );
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  private initializeForm(): void {
    this.contactForm = this.fb.group({
      lastName: ['', [Validators.required]],
      salutation: [''],
      firstName: ['', [Validators.required]],
      title: [''],
      contactTypeCode: ['D', [Validators.required]],
      dayPhone: ['', [Validators.required, EnterCustomerContactDialogComponent.phoneNumberValidator]],
      faxNumber: ['', [EnterCustomerContactDialogComponent.phoneNumberValidator]],
      nightPhone: ['', [EnterCustomerContactDialogComponent.phoneNumberValidator]],
      telexNumber: ['', [EnterCustomerContactDialogComponent.phoneNumberValidator]],
      effDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]],
      termDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });
  }

  static phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    if (/[^0-9\-]/.test(value)) {
      return { phoneFormat: 'Phone number must contain only digits and dashes' };
    }

    const digits = value.replace(/-/g, '');
    if (digits.length !== 7 && digits.length !== 10) {
      return { phoneFormat: 'Phone number must be 7 or 10 digits' };
    }

    return null;
  }

  static formatPhoneNumber(value: string): string {
    if (!value) return value;
    const digits = value.replace(/-/g, '');
    if (digits.length === 7 && /^\d+$/.test(digits)) {
      return `${digits.substring(0, 3)}-${digits.substring(3)}`;
    }
    if (digits.length === 10 && /^\d+$/.test(digits)) {
      return `${digits.substring(0, 3)}-${digits.substring(3, 6)}-${digits.substring(6)}`;
    }
    return value;
  }

  onPhoneBlur(controlName: string): void {
    const control = this.contactForm.get(controlName);
    if (!control || !control.value) return;
    const formatted = EnterCustomerContactDialogComponent.formatPhoneNumber(control.value);
    if (formatted !== control.value) {
      control.setValue(formatted, { emitEvent: false });
    }
    control.markAsTouched();
    this.cdr.markForCheck();
  }

  private updateTerminationMinDate(): void {
    const effectiveValue = this.contactForm?.get('effDate')?.value;
    let effectiveMoment: Moment | null = null;
    if (effectiveValue && moment.isMoment(effectiveValue) && effectiveValue.isValid()) {
      effectiveMoment = effectiveValue.clone();
    } else if (effectiveValue instanceof Date && !isNaN(effectiveValue.getTime())) {
      effectiveMoment = moment(effectiveValue);
    }
    this.terminationMinDate = effectiveMoment && effectiveMoment.isAfter(this.minDate)
      ? effectiveMoment
      : this.minDate.clone();
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.contactForm.get('effDate')
    );
  }

  onEffectiveDateChange(): void {
    this.lastChangedDateField = 'effective';
    this.updateTerminationMinDate();
    this.contactForm.get('effDate')?.markAsTouched();
    this.contactForm.get('effDate')?.markAsDirty();
    this.contactForm.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.contactForm.get('termDate'),
      false
    );
  }

  onTerminationDateChange(): void {
    this.lastChangedDateField = 'termination';
    this.contactForm.get('termDate')?.markAsTouched();
    this.contactForm.get('termDate')?.markAsDirty();
    this.contactForm.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.contactForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.contactForm.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.contactForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.contactForm.get('termDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  get f() { return this.contactForm.controls; }

  onSave(): void {
    this.contactForm.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.contactForm, 'termDate');
    this.cdr.markForCheck();

    if (this.contactForm.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.contactForm.invalid) return;

    const formValue = this.contactForm.getRawValue();

    // Check for duplicate contact by first + last name
    const duplicate = this.existingContacts().find(c =>
      c.firstName?.toLowerCase() === formValue.firstName?.toLowerCase() &&
      c.lastName?.toLowerCase() === formValue.lastName?.toLowerCase()
    );

    if (duplicate) {
      const confirmRef = this.dialog.open(ConfirmActionDialogComponent, {
        width: '420px',
        disableClose: true,
        data: {
          title: 'Duplicate Contact',
          message: 'A contact with this name already exists. Continue?',
          confirmText: 'YES',
          cancelText: 'NO'
        }
      });
      confirmRef.afterClosed().pipe(
        takeUntil(this.destroy$)
      ).subscribe(confirmed => {
        if (confirmed) {
          this.closeWithData(formValue);
        }
      });
    } else {
      this.closeWithData(formValue);
    }
  }

  private closeWithData(formValue: any): void {
    this.dialogRef.close({
      ...formValue,
      effectiveDate: formValue.effDate ? DateFieldValidationUtility.serializeDateForApi(formValue.effDate) : null,
      terminationDate: formValue.termDate ? DateFieldValidationUtility.serializeDateForApi(formValue.termDate) : null
    });
  }

  private loadExistingContacts(): void {
    if (!this.data.customerId) return;
    this.apiService.getContacts(this.data.customerId).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe(contacts => {
      this.existingContacts.set(contacts);
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
