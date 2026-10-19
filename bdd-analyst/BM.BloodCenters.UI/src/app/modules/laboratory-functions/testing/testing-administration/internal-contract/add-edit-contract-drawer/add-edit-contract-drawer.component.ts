import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

// Using real backend service
import { InternalContractService } from '../internal-contract.service';
import {
  ContractListItem,
  ContractWithDetails,
  MasterCode,
  ValidTest,
  State,
  Country,
  Contact,
  ContractTest,
  SaveContractRequest
} from '../internal-contract.models';
import {
  taxIdNumericValidator,
  unitIdPatternValidator,
  resultOutputValidator,
  stateRequiredValidator
} from '../validators/internal-contract.validators';
import {
  RESULT_OUTPUT_OPTIONS,
  UNIT_ID_PATTERN_OPTIONS,
  getErrorMessage
} from '../constants/internal-contract-error-codes';
import { ContactDialogComponent, ContactDialogData } from '../components/contact-dialog/contact-dialog.component';
import { TestDialogComponent, TestDialogData } from '../components/test-dialog/test-dialog.component';
import { MatDialog } from '@angular/material/dialog';

export interface AddEditContractDrawerData {
  mode: 'add' | 'edit';
  contractDetails?: ContractWithDetails;
}

@Component({
  selector: 'app-add-edit-contract-drawer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatTableModule,
    MatTooltipModule,
    LoadingSpinnerComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-contract-drawer.component.html',
  styleUrl: './add-edit-contract-drawer.component.scss'
})
export class AddEditContractDrawerComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  readonly componentId = `add-edit-contract-drawer-${AddEditContractDrawerComponent.nextId++}`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AddEditContractDrawerComponent>);
  private readonly data = inject<AddEditContractDrawerData>(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly contractService = inject(InternalContractService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  // Mode and state
  readonly mode = this.data.mode;
  readonly isEditMode = this.mode === 'edit';
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly submitted = signal<boolean>(false);

  // Lookup data signals
  readonly contractTypes = signal<MasterCode[]>([]);
  readonly barcodeProtocols = signal<MasterCode[]>([]);
  readonly validTests = signal<ValidTest[]>([]);
  readonly states = signal<State[]>([]);
  readonly countries = signal<Country[]>([]);
  readonly chapters = signal<Array<{chapterId: string; chapterName: string}>>([]);

  // Related data signals
  readonly contacts = signal<Contact[]>([]);
  readonly contractTests = signal<ContractTest[]>([]);

  // Computed values
  readonly isInternational = signal<boolean>(false);
  readonly isBarcodeProtocol8 = computed(() => this.contractForm?.get('barCodeProtocol')?.value === '8');
  readonly testCount = computed(() => this.contractTests().length);
  readonly contactCount = computed(() => this.contacts().length);

  // Constants
  readonly resultOutputOptions = RESULT_OUTPUT_OPTIONS;
  readonly unitIdPatternOptions = UNIT_ID_PATTERN_OPTIONS;

  readonly today: moment.Moment = this.chapterTimezoneService.isChapterLocalDateAvailable()
    ? this.chapterTimezoneService.getChapterLocalDate()
    : moment().startOf('day');

  minDate!: moment.Moment;

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError()
  );

  // Forms
  contractForm!: FormGroup;
  addressForm!: FormGroup;

  // Table columns
  contactColumns = ['contactType', 'contactLastName', 'contactFirstName', 'contactTitle', 'phoneNumber', 'faxNumber', 'actions'];

  // Header title
  get drawerTitle(): string {
    if (this.isEditMode && this.data.contractDetails) {
      return `Edit ${this.data.contractDetails.contract.company} Contract Details`;
    }
    return 'Add New Contract';
  }

  get lastModifiedText(): string {
    // Removed - no longer showing last modified in header
    return '';
  }

  ngOnInit(): void {
    this.initForms();
    this.loadLookupData();
    this.setupFormListeners();

    if (this.isEditMode && this.data.contractDetails) {
      this.populateFormWithContractDetails(this.data.contractDetails);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    const chapterOffset = this.headerService.chapterTimeZone();
    this.minDate = DateFieldValidationUtility.getMinDate(chapterOffset);

    // Contract form
    this.contractForm = this.fb.group({
      contractType: ['', [Validators.required]],
      company: ['', [Validators.required, Validators.maxLength(50)]],
      chapterId: [{ value: '', disabled: this.isEditMode }, [Validators.required]],
      taxIdForm: ['', [taxIdNumericValidator()]],
      barCodeProtocol: ['', [Validators.required]],
      unitIdPattern: [null, [unitIdPatternValidator()]],
      ediInputInd: [false],
      resultOutputInd: ['R', [Validators.required, resultOutputValidator()]],
      confirmTestFlag: [false],
      effDate: [{ value: null, disabled: this.isEditMode }, [Validators.required]],
      termDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

    if (this.isEditMode) {
      DateFieldValidationUtility.setupEditModeValidators(this.contractForm, chapterOffset);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.contractForm, chapterOffset);
    }

    // Address form
    this.addressForm = this.fb.group({
      intFlag: [false],
      addressLine1: ['', [Validators.required, Validators.maxLength(50)]],
      addressLine2: ['', [Validators.maxLength(50)]],
      city: ['', [Validators.required, Validators.maxLength(50)]],
      stateCode: ['', [stateRequiredValidator()]],
      zipCode: ['', [Validators.maxLength(10)]],
      country: ['', [Validators.maxLength(50)]]
    });
  }

  private setupFormListeners(): void {
    // Update unit ID pattern enabled state based on barcode protocol
    this.contractForm.get('barCodeProtocol')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((protocol: string) => {
        const unitIdPatternControl = this.contractForm.get('unitIdPattern');
        if (protocol === '8') {
          unitIdPatternControl?.enable();
        } else {
          unitIdPatternControl?.setValue(null);
          unitIdPatternControl?.disable();
        }
        unitIdPatternControl?.updateValueAndValidity();
      });

    // Update state required validation based on international flag
    this.addressForm.get('intFlag')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((isInternational: boolean) => {
        this.isInternational.set(isInternational);
        this.addressForm.get('stateCode')?.updateValueAndValidity();
      });

    // Track which date field was last changed for cross-field error display
    this.contractForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
      });

    this.contractForm.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
  }

  private loadLookupData(): void {
    this.loading.set(true);

    Promise.all([
      this.contractService.getContractTypes().toPromise(),
      this.contractService.getBarcodeProtocols().toPromise(),
      this.contractService.getValidTests().toPromise(),
      this.contractService.getStates().toPromise(),
      this.contractService.getCountries().toPromise(),
      this.contractService.getActiveChapters().toPromise()
    ])
      .then(([contractTypes, barcodeProtocols, validTests, states, countries, chapters]) => {
        this.contractTypes.set(contractTypes || []);
        this.barcodeProtocols.set(barcodeProtocols || []);
        this.validTests.set(validTests || []);
        this.states.set(states || []);
        this.countries.set(countries || []);
        this.chapters.set(chapters || []);
        this.loading.set(false);
      })
      .catch(err => {
        this.snackbarService.showError('Failed to load lookup data');
        this.loading.set(false);
      });
  }

  private populateFormWithContractDetails(data: ContractWithDetails): void {
    // Populate contract form
    this.contractForm.patchValue({
      contractType: data.contract.contractType,
      company: data.contract.company,
      chapterId: data.contract.chapterId,
      taxIdForm: data.contract.taxIdForm,
      barCodeProtocol: data.contract.barCodeProtocol,
      unitIdPattern: data.contract.unitIdPattern,
      ediInputInd: data.contract.ediInputInd === 'Y',
      resultOutputInd: data.contract.resultOutputInd,
      confirmTestFlag: data.contract.confirmTestFlag === 'Y',
      effDate: data.contract.effDate ? moment(data.contract.effDate) : null,
      termDate: data.contract.termDate ? moment(data.contract.termDate) : null
    });

    // Populate address form - handle both addr1/addr2 (backend) and addressLine1/addressLine2 (frontend)
    if (data.address) {
      const addr = data.address as any; // Backend uses addr1, addr2, zip instead of addressLine1, addressLine2, zipCode
      this.addressForm.patchValue({
        intFlag: addr.intFlag === 'Y' || addr.country !== 'USA',
        addressLine1: addr.addr1 || addr.addressLine1 || '',
        addressLine2: addr.addr2 || addr.addressLine2 || '',
        city: addr.city || '',
        stateCode: addr.stateCode || '',
        zipCode: addr.zip || addr.zipCode || '',
        country: addr.country || ''
      });
      this.isInternational.set(addr.intFlag === 'Y' || addr.country !== 'USA');
    }

    // Set contacts and tests
    this.contacts.set(data.contacts || []);
    this.contractTests.set(data.tests || []);
  }

  get cf() {
    return this.contractForm.controls;
  }

  get af() {
    return this.addressForm.controls;
  }

  // ===== Contact Management =====

  onAddContact(): void {
    if (this.contacts().length >= 8) {
      this.snackbarService.showError('Maximum 8 contacts allowed per contract');
      return;
    }

    const dialogData: ContactDialogData = {
      mode: 'create'
    };

    const dialogRef = this.dialog.open(ContactDialogComponent, {
      width: '500px',
      maxWidth: '500px',
      height: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'contact-dialog-drawer-panel',
      autoFocus: 'first-heading',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: Contact | undefined) => {
      if (result) {
        this.contacts.update(contacts => [...contacts, result]);
      }
    });
  }

  onEditContact(contact: Contact, index: number): void {
    const dialogData: ContactDialogData = {
      contact: { ...contact },
      mode: 'edit'
    };

    const dialogRef = this.dialog.open(ContactDialogComponent, {
      width: '500px',
      maxWidth: '500px',
      height: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'contact-dialog-drawer-panel',
      autoFocus: 'first-heading',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: Contact | undefined) => {
      if (result) {
        this.contacts.update(contacts => {
          const updated = [...contacts];
          updated[index] = result;
          return updated;
        });
      }
    });
  }

  onDeleteContact(index: number): void {
    if (confirm('Are you sure you want to delete this contact?')) {
      this.contacts.update(contacts => contacts.filter((_, i) => i !== index));
    }
  }

  // ===== Test Management =====

  onManageTests(): void {
    // Open test management dialog showing all tests with add/edit/delete
    this.snackbarService.showInfo('Test management dialog - showing all tests for this contract');
    // For now, just open add test dialog
    this.onAddTest();
  }

  onAddTest(): void {
    const existingTestIds = this.contractTests().map(t => t.testId);

    const dialogData: TestDialogData = {
      mode: 'create',
      validTests: this.validTests(),
      existingTestIds
    };

    const dialogRef = this.dialog.open(TestDialogComponent, {
      width: '600px',
      maxWidth: '600px',
      height: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'test-dialog-drawer-panel',
      autoFocus: 'first-heading',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // Handle both old format (just test) and new format (with addAnother flag)
        const test = result.test || result;
        if (test) {
          this.contractTests.update(tests => [...tests, test]);
        }

        // If user clicked "Add and Create Another", reopen dialog
        if (result.addAnother) {
          setTimeout(() => this.onAddTest(), 100);
        }
      }
    });
  }

  // ===== Date Validation =====

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.contractForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.contractForm.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.contractForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.contractForm.get('termDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.contractForm.get('effDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.contractForm.get('termDate'), this.isEditMode
    );
  }

  // ===== Form Actions =====

  onSave(): void {
    this.submitted.set(true);

    // Validate all forms
    this.contractForm.markAllAsTouched();
    this.addressForm.markAllAsTouched();

    if (!this.lastChangedDateField && this.contractForm.errors?.['dateRangeInvalid']) {
      this.lastChangedDateField = 'termination';
    }

    const termCtrl = this.contractForm.get('termDate');
    if (termCtrl && !termCtrl.value && !termCtrl.hasError('invalidDate') && !termCtrl.hasError('matDatepickerParse')) {
      DateFieldValidationUtility.clearOptionalDateErrors(this.contractForm, 'termDate');
    }

    if (this.contractForm.invalid || this.addressForm.invalid) {
      this.snackbarService.showError('Please correct the errors in the form');
      return;
    }

    const contractFormValue = this.contractForm.getRawValue(); // getRawValue to include disabled fields
    const addressFormValue = this.addressForm.value;

    // Build contract object
    const contract: any = {
      contractType: contractFormValue.contractType,
      contractId: this.isEditMode ? this.data.contractDetails?.contract.contractId : '',
      chapterId: contractFormValue.chapterId || this.headerService.getCurrentChapterId() || '',
      company: contractFormValue.company,
      addressId: null,
      taxIdForm: contractFormValue.taxIdForm || null,
      barCodeProtocol: contractFormValue.barCodeProtocol,
      unitIdPattern: contractFormValue.unitIdPattern || null,
      ediInputInd: contractFormValue.ediInputInd ? 'Y' : null,
      resultOutputInd: contractFormValue.resultOutputInd,
      confirmTestFlag: contractFormValue.confirmTestFlag ? 'Y' : null,
      effDate: moment(contractFormValue.effDate).format('YYYY-MM-DD'),
      termDate: contractFormValue.termDate ? moment(contractFormValue.termDate).format('YYYY-MM-DD') : null
    };

    // Build address object
    const address: any = {
      addressLine1: addressFormValue.addressLine1,
      addressLine2: addressFormValue.addressLine2 || null,
      city: addressFormValue.city,
      stateCode: addressFormValue.stateCode || null,
      zipCode: addressFormValue.zipCode || null,
      country: addressFormValue.country || null,
      intFlag: addressFormValue.intFlag ? 'Y' : null
    };

    // Build request
    const request: SaveContractRequest = {
      contract,
      address,
      contacts: this.contacts(),
      tests: this.contractTests(),
      loggedInUserName: this.loginService.getStoredUsername() || '',
      chapterId: contract.chapterId,
      programId: 'CONTR'
    };

    this.saving.set(true);

    const saveObservable = this.isEditMode
      ? this.contractService.update(this.data.contractDetails!.contract.contractId, request)
      : this.contractService.create(request);

    saveObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          this.snackbarService.showSuccess(
            this.isEditMode ? 'Contract updated successfully' : 'Contract created successfully'
          );
          this.dialogRef.close({ success: true, contractId: response.contractId });
        },
        error: (err) => {
          this.saving.set(false);
          const errorCode = err.error?.errorCode || err.error?.errorResponse?.errorCode;
          const errorMessage = errorCode
            ? getErrorMessage(errorCode)
            : (err.error?.message || err.error?.error || 'Failed to save contract');
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  onCancel(): void {
    // Close without confirmation dialog
    this.dialogRef.close({ success: false });
  }

  onClearAll(): void {
    if (confirm('Are you sure you want to clear all form data?')) {
      this.contractForm.reset({
        resultOutputInd: 'R',
        ediInputInd: false,
        confirmTestFlag: false
      });
      this.addressForm.reset({
        intFlag: false
      });
      this.contacts.set([]);
      this.contractTests.set([]);
      this.submitted.set(false);
    }
  }

  formatDate(date: string | null): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }
}
