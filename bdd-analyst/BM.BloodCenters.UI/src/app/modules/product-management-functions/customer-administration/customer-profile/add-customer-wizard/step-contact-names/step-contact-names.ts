import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, forkJoin, concatMap, from, toArray, switchMap } from 'rxjs';

import { AddCustomerWizardApiService } from '../add-customer-wizard-api.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import {
  phoneNumberValidator,
  alphabeticOnlyValidator
} from '../../validators/customer-profile.validators';

interface ContactTypeDto {
  code: string;
  description: string;
}

@Component({
  selector: 'app-step-contact-names',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatProgressSpinnerModule,
    LoadingSpinnerComponent,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './step-contact-names.html',
  styleUrls: ['./step-contact-names.scss']
})
export class StepContactNamesComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `contact-names-${StepContactNamesComponent.nextId++}`;

  @Input() customerId: string = '';
  @Input() savedData: any[] = [];
  @Output() saveSuccess = new EventEmitter<any>();
  @Output() savingChange = new EventEmitter<boolean>();
  @Output() loadingChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(AddCustomerWizardApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  contactForm!: FormGroup;

  protected readonly saving = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);
  protected readonly loading = signal<boolean>(false);
  protected readonly contactTypes = signal<ContactTypeDto[]>([]);
  protected filteredContactTypes: ContactTypeDto[] = [];
  protected contactTypeSearchCtrl = new FormControl<string>('');

  protected today!: Moment;
  protected minDate!: Moment;

  protected get contacts(): FormArray {
    return this.contactForm.get('contacts') as FormArray;
  }

  protected readonly elementId = (name: string, index?: number) =>
    index !== undefined
      ? `${this.componentId}-${index}-${name}`
      : `${this.componentId}-${name}`;
  protected readonly errorId = (name: string, index?: number) =>
    index !== undefined
      ? `${this.componentId}-${index}-${name}-error`
      : `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string, index?: number) =>
    index !== undefined
      ? `${this.componentId}-${index}-${name}-label`
      : `${this.componentId}-${name}-label`;

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const tz = this.headerService.chapterTimeZone();
        this.minDate = DateFieldValidationUtility.getMinDate(tz);
        this.contacts.controls.forEach((group) => {
          group.get('effDate')?.setValidators([
            Validators.required,
            DateFieldValidationUtility.effectiveDateNotPastValidator(tz)
          ]);
          group.get('effDate')?.updateValueAndValidity();
          group.get('termDate')?.setValidators([DateFieldValidationUtility.terminationDateNotPastValidator(tz)]);
          group.get('termDate')?.updateValueAndValidity();
        });
      });

    this.loadContactTypes();
    this.setupSearchControls();

    // Populate form with savedData if available
    if (this.savedData && this.savedData.length > 0) {
      // Create a FormGroup for each saved contact
      this.savedData.forEach((contact) => {
        const contactGroup = this.createContactFormGroup();
        contactGroup.patchValue({
          contactType: contact.contactType,
          firstName: contact.firstName,
          lastName: contact.lastName,
          salutation: contact.salutation,
          title: contact.title,
          dayPhone: contact.dayPhoneNo || contact.dayPhone,
          nightPhone: contact.nightPhoneNo || contact.nightPhone,
          faxNumber: contact.faxNo || contact.faxNumber
        });
        // Handle dates with moment conversion
        if (contact.effDate) {
          contactGroup.get('effDate')?.setValue(moment(contact.effDate));
        }
        if (contact.termDate) {
          contactGroup.get('termDate')?.setValue(moment(contact.termDate));
        }
        this.contacts.push(contactGroup);
        this.setupContactListeners(this.contacts.length - 1);
      });
    } else {
      // Add first contact by default if no savedData
      if (this.contacts.length === 0) {
        this.addContact();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.contactForm = this.fb.group({
      contacts: this.fb.array([])
    });
  }

  private loadContactTypes(): void {
    this.loading.set(true); this.loadingChange.emit(true);
    this.apiService.getContactTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.contactTypes.set(types);
          this.filteredContactTypes = types;
          this.loading.set(false); this.loadingChange.emit(false);
        },
        error: (err) => {
          this.showErrorAndAutoDismiss('Failed to load contact types');
          console.error('Error loading contact types:', err);
          this.loading.set(false); this.loadingChange.emit(false);
        }
      });
  }

  private setupSearchControls(): void {
    this.contactTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        const search = (searchTerm || '').toLowerCase();
        this.filteredContactTypes = this.contactTypes().filter(t =>
          t.code.toLowerCase().includes(search) || t.description.toLowerCase().includes(search));
      });
  }

  private createContactFormGroup(): FormGroup {
    return this.fb.group({
      contactType: ['', [Validators.required]],
      firstName: ['', [Validators.required, Validators.maxLength(50), alphabeticOnlyValidator()]],
      lastName: ['', [Validators.required, Validators.maxLength(50), alphabeticOnlyValidator()]],
      salutation: ['', [Validators.maxLength(10), alphabeticOnlyValidator()]],
      title: ['', [Validators.maxLength(10), alphabeticOnlyValidator()]],
      dayPhone: ['', [
        Validators.required,
        Validators.maxLength(20),
        phoneNumberValidator()
      ]],
      nightPhone: ['', [
        Validators.maxLength(20),
        phoneNumberValidator()
      ]],
      faxNumber: ['', [
        Validators.maxLength(20),
        phoneNumberValidator()
      ]],
      effDate: [null, [
        Validators.required,
        DateFieldValidationUtility.effectiveDateNotPastValidator(this.headerService.chapterTimeZone())
      ]],
      termDate: [null, [DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone())]]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });
  }

  protected onlyNumbers(event: KeyboardEvent): boolean {
    const char = event.key;
    if (char === 'Backspace' || char === 'Tab' || char === 'Delete' ||
        char === 'ArrowLeft' || char === 'ArrowRight' || char === 'Home' || char === 'End') {
      return true;
    }
    if (event.ctrlKey || event.metaKey) return true;
    if (char < '0' || char > '9') {
      event.preventDefault();
      return false;
    }
    return true;
  }

  protected stripPhoneOnFocus(index: number, controlName: string): void {
    const ctrl = this.contacts.at(index)?.get(controlName);
    if (!ctrl?.value) return;
    const digits = ctrl.value.replace(/\D/g, '');
    if (digits !== ctrl.value) {
      ctrl.setValue(digits, { emitEvent: false });
    }
  }

  protected formatPhoneOnBlur(index: number, controlName: string): void {
    const ctrl = this.contacts.at(index)?.get(controlName);
    if (!ctrl?.value) return;
    const digits = ctrl.value.replace(/\D/g, '');
    if (digits.length === 10) {
      ctrl.setValue(`${digits.substring(0, 3)}-${digits.substring(3, 6)}-${digits.substring(6)}`, { emitEvent: false });
    } else if (digits.length === 7) {
      ctrl.setValue(`${digits.substring(0, 3)}-${digits.substring(3)}`, { emitEvent: false });
    }
  }

  private stripPhone(value: string | null): string | null {
    return value ? value.replace(/\D/g, '') : value;
  }

  protected addContact(): void {
    const contactGroup = this.createContactFormGroup();
    this.contacts.push(contactGroup);

    // Setup listeners for this contact
    this.setupContactListeners(this.contacts.length - 1);
  }

  protected removeContact(index: number): void {
    if (this.contacts.length > 1) {
      this.contacts.removeAt(index);
    } else {
      this.showErrorAndAutoDismiss('At least one contact is required');
    }
  }

  private setupContactListeners(index: number): void {
    const contactGroup = this.contacts.at(index) as FormGroup;

    // Re-validate termination date when effective date changes
    contactGroup.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        contactGroup.get('termDate')?.updateValueAndValidity();
      });
  }

  protected getEffectiveDateError(index: number): string {
    return DateFieldValidationUtility.getEffectiveDateError(this.contacts.at(index) as FormGroup);
  }

  protected getTerminationMinDate(index: number): Moment {
    const effValue = this.contacts.at(index)?.get('effDate')?.value;
    if (effValue && moment.isMoment(effValue) && effValue.isValid()) {
      return effValue.isAfter(this.minDate) ? effValue : this.minDate;
    }
    return this.minDate;
  }

  protected getTerminationDateError(index: number): string {
    return DateFieldValidationUtility.getTerminationDateError(this.contacts.at(index) as FormGroup);
  }

  protected onSubmit(): void {
    this.submitted.set(true);
    this.contactForm.markAllAsTouched();

    // If savedData exists and form is not dirty, just move to next step
    if (this.savedData?.length > 0 && !this.contactForm.dirty) {
      this.saveSuccess.emit(this.savedData);
      return;
    }

    if (this.contactForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      this.showErrorAndAutoDismiss('Please correct the errors in the form');
      return;
    }

    // Check for duplicate contact types within the form
    const allTypes = this.contacts.controls
      .map(c => (c as FormGroup).getRawValue().contactType)
      .filter(t => !!t);
    const formDuplicates = allTypes.filter((t, i) => allTypes.indexOf(t) !== i);
    if (formDuplicates.length > 0) {
      this.showErrorAndAutoDismiss(`Duplicate contact type: ${formDuplicates[0]}`);
      return;
    }

    // Check new contact types against already-saved contacts in DB
    const savedTypes = (this.savedData || []).map((c: any) => c.contactType).filter((t: string) => !!t);
    const newTypes = this.contacts.controls
      .filter((_, i) => !this.savedData?.[i]?.instId)
      .map(c => (c as FormGroup).getRawValue().contactType)
      .filter(t => !!t);
    const dbDuplicates = newTypes.filter(t => savedTypes.includes(t));
    if (dbDuplicates.length > 0) {
      this.showErrorAndAutoDismiss(`Contact type ${dbDuplicates[0]} already exists`);
      return;
    }

    this.saving.set(true); this.savingChange.emit(true);

    const contactItems = this.contacts.controls.map((contactGroup, index) => {
      const formValue = (contactGroup as FormGroup).getRawValue();
      const isExisting = !!this.savedData?.[index]?.instId;

      return {
        isExisting,
        payload: {
          contactType: formValue.contactType || null,
          firstName: formValue.firstName || null,
          lastName: formValue.lastName || null,
          salutation: formValue.salutation || null,
          title: formValue.title || null,
          dayPhoneNo: this.stripPhone(formValue.dayPhone) || null,
          nightPhoneNo: this.stripPhone(formValue.nightPhone) || null,
          faxNo: this.stripPhone(formValue.faxNumber) || null,
          effDate: formValue.effDate ? moment(formValue.effDate).format('YYYY-MM-DD') : '',
          termDate: formValue.termDate ? moment(formValue.termDate).format('YYYY-MM-DD') : null
        }
      };
    });

    // Only create new contacts (skip existing ones that haven't changed)
    const newContacts = contactItems.filter(item => !item.isExisting);

    if (newContacts.length === 0) {
      this.saving.set(false); this.savingChange.emit(false);
      this.saveSuccess.emit(this.savedData);
      return;
    }

    from(newContacts)
      .pipe(
        concatMap((item) => this.apiService.createContact(this.customerId, item.payload)),
        toArray(),
        switchMap(() => this.apiService.getContacts(this.customerId)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (savedContacts) => {
          this.saving.set(false); this.savingChange.emit(false);
          this.snackbarService.showSuccess(
            `${newContacts.length} contact${newContacts.length > 1 ? 's' : ''} saved successfully`
          );
          this.saveSuccess.emit(savedContacts);
        },
        error: (err) => {
          this.saving.set(false); this.savingChange.emit(false);
          const errorMessage = err?.error?.errorResponse?.error || err?.error?.message || 'Failed to save contact details';
          this.showErrorAndAutoDismiss(errorMessage);
          console.error('Error saving contact details:', err);
          // Refresh savedData so retry knows which items were already saved
          this.apiService.getContacts(this.customerId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(saved => { if (saved?.length) this.savedData = saved; });
        }
      });
  }

  protected onEffectiveDateChange(index: number): void {
    const contactGroup = this.contacts.at(index) as FormGroup;
    contactGroup.get('termDate')?.updateValueAndValidity();
    contactGroup.get('effDate')?.markAsTouched();
  }

  protected onTerminationDateChange(index: number): void {
    const contactGroup = this.contacts.at(index) as FormGroup;
    contactGroup.get('termDate')?.markAsTouched();
  }

  protected onEffectiveDateInput(event: Event, index: number): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.contacts.at(index).get('effDate')
    );
  }

  protected onTerminationDateInput(event: Event, index: number): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.contacts.at(index).get('termDate')
    );
  }

  private showErrorAndAutoDismiss(message: string): void {
    this.snackbarService.showError(message);
    setTimeout(() => this.snackBar.dismiss(), 5000);
  }

}
