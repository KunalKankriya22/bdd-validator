import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';

import { DD_MON_YYYY_FORMATS } from '../../../../../shared/date/date-formats';
import { RegionalTestingContractService } from '../../services/regional-testing-contract.service';
import { RegionalTestingContractProfileService } from '../../services/regional-testing-contract-profile.service';
import { AddressDetailsDialogComponent } from '../dialogs/address-details-dialog/address-details-dialog.component';
import { ContactsInformationDialogComponent } from '../dialogs/contacts-information-dialog/contacts-information-dialog.component';
import { CustomerOverrideQueryDialogComponent } from '../dialogs/customer-override-query-dialog/customer-override-query-dialog.component';
import {
  CreateRegionalTestingContractDto,
  UpdateRegionalTestingContractDto,
  Address,
  Contact,
  ProfileTest,
  CONTRACT_TYPES,
  PROFILE_TYPES,
  YES_NO_OPTIONS
} from '../../models/regional-testing-contract.models';

/**
 * Contract Form Component
 * Two-step stepper for creating/editing regional testing contracts
 */
@Component({
  selector: 'app-contract-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false }
    }
  ],
  templateUrl: './contract-form.component.html',
  styleUrl: './contract-form.component.scss'
})
export class ContractFormComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `contract-form-${ContractFormComponent.nextId++}`;

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contractService = inject(RegionalTestingContractService);
  private readonly profileService = inject(RegionalTestingContractProfileService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Forms
  contractDetailsForm!: FormGroup;
  contractTestsForm!: FormGroup;

  // State
  protected readonly isEditMode = signal<boolean>(false);
  protected readonly contractId = signal<string | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);
  protected readonly today = moment().startOf('day');

  // Step 1 data
  protected readonly contractTypes = CONTRACT_TYPES;
  protected readonly addressData = signal<Address | null>(null);
  protected readonly contactsData = signal<Contact[]>([]);

  // Step 2 data
  protected readonly profileTypes = PROFILE_TYPES;
  protected readonly yesNoOptions = YES_NO_OPTIONS;
  protected readonly profileTestColumns: string[] = [
    'testId', 'description', 'width', 'length', 'required',
    'extract', 'electronicFile', 'effDate', 'termDate', 'actions'
  ];

  // TODO: Replace with actual test ID lookup from API
  protected readonly testIdOptions = signal([
    { testId: 'HIV1', description: 'HIV-1 Antibody Test' },
    { testId: 'HCV', description: 'Hepatitis C Virus Test' },
    { testId: 'HBV', description: 'Hepatitis B Virus Test' },
    { testId: 'HTLV', description: 'HTLV I/II Test' }
  ]);

  ngOnInit(): void {
    this.initForms();
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    // Step 1: Contract Details
    this.contractDetailsForm = this.fb.group({
      contractType: ['T', Validators.required],
      customerName: ['', [Validators.required, Validators.maxLength(100)]],
      customerId: ['', [Validators.required, Validators.maxLength(20)]],
      exportCode: ['', [Validators.required, Validators.maxLength(10)]],
      agreementDate: [null],
      effDate: [null, Validators.required],
      termDate: [null]
    });

    // Step 2: Contract Tests
    this.contractTestsForm = this.fb.group({
      showTerminated: ['No'],
      profileSetId: ['', Validators.maxLength(20)],
      isPrimary: [false],
      isAdHoc: [false],
      isSecondary: [false],
      profileTermDate: [null],
      profileTests: this.fb.array([]),
      nonProfileTestId: [''],
      reactiveTestId: [''],
      result: [''],
      plateSequence: ['']
    });

    // Watch effective date changes for validation
    this.contractDetailsForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.contractDetailsForm.get('termDate')?.updateValueAndValidity();
      });
  }

  private checkEditMode(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['contractId']) {
          this.isEditMode.set(true);
          this.contractId.set(params['contractId']);
          this.loadContract(params['contractId']);
        }
      });
  }

  private loadContract(contractId: string): void {
    this.loading.set(true);

    this.contractService.getContractById(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contract) => {
          this.contractDetailsForm.patchValue({
            contractType: contract.contractType,
            customerName: contract.customerName,
            customerId: contract.customerId,
            exportCode: contract.exportCode,
            agreementDate: contract.agreementDate ? moment(contract.agreementDate).toDate() : null,
            effDate: contract.effDate ? moment(contract.effDate).toDate() : null,
            termDate: contract.termDate ? moment(contract.termDate).toDate() : null
          });
          this.loading.set(false);
        },
        error: (err) => {
          this.showError('Failed to load contract. Please try again.');
          this.loading.set(false);
        }
      });
  }

  get step1() {
    return this.contractDetailsForm.controls;
  }

  get step2() {
    return this.contractTestsForm.controls;
  }

  get profileTests(): FormArray {
    return this.contractTestsForm.get('profileTests') as FormArray;
  }

  // Step 1 Methods
  onOpenAddressDialog(): void {
    const dialogRef = this.dialog.open(AddressDetailsDialogComponent, {
      width: '800px',
      data: this.addressData()
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((address: Address) => {
        if (address) {
          this.addressData.set(address);
        }
      });
  }

  onOpenContactsDialog(): void {
    const dialogRef = this.dialog.open(ContactsInformationDialogComponent, {
      width: '800px',
      data: this.contactsData()
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((contacts: Contact[]) => {
        if (contacts) {
          this.contactsData.set(contacts);
        }
      });
  }

  validateStep1(): boolean {
    if (this.contractDetailsForm.invalid) {
      return false;
    }

    const effDate = this.contractDetailsForm.get('effDate')?.value;
    const termDate = this.contractDetailsForm.get('termDate')?.value;

    // Effective date cannot be in past (create mode only)
    if (!this.isEditMode() && effDate) {
      const effMoment = moment(effDate).startOf('day');
      if (effMoment.isBefore(this.today)) {
        this.showError('Effective date cannot be in the past.');
        return false;
      }
    }

    // Termination date must be >= effective date
    if (effDate && termDate) {
      const effMoment = moment(effDate).startOf('day');
      const termMoment = moment(termDate).startOf('day');
      if (termMoment.isBefore(effMoment)) {
        this.showError('Termination date cannot be before effective date.');
        return false;
      }
    }

    return true;
  }

  // Step 2 - Profile Tests Methods
  onAddProfileTest(): void {
    const testGroup = this.fb.group({
      testId: ['', Validators.required],
      description: [''],
      width: [null],
      length: [null],
      required: ['N'],
      extract: ['N'],
      electronicFile: ['N'],
      effDate: [null, Validators.required],
      termDate: [null]
    });

    this.profileTests.push(testGroup);
  }

  onDeleteProfileTest(index: number): void {
    this.profileTests.removeAt(index);
  }

  onTestIdChange(index: number): void {
    const testGroup = this.profileTests.at(index) as FormGroup;
    const testId = testGroup.get('testId')?.value;

    const test = this.testIdOptions().find(t => t.testId === testId);
    if (test) {
      testGroup.patchValue({ description: test.description });
    }
  }

  onNonProfileTestIdChange(): void {
    const testId = this.contractTestsForm.get('nonProfileTestId')?.value;
    const test = this.testIdOptions().find(t => t.testId === testId);
    // Description would be displayed (read-only field)
  }

  onReactiveTestIdChange(): void {
    const testId = this.contractTestsForm.get('reactiveTestId')?.value;
    const test = this.testIdOptions().find(t => t.testId === testId);
    // Description would be displayed (read-only field)
  }

  onOpenCustomerOverrideQuery(): void {
    const dialogRef = this.dialog.open(CustomerOverrideQueryDialogComponent, {
      width: '1000px'
    });
  }

  // Scroll to section
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Save and Finish
  onSaveAndFinish(): void {
    this.submitted.set(true);

    if (!this.validateStep1() || this.contractTestsForm.invalid) {
      this.showError('Please correct all validation errors before saving.');
      return;
    }

    this.saving.set(true);

    if (this.isEditMode()) {
      this.updateContract();
    } else {
      this.createContract();
    }
  }

  private createContract(): void {
    const formValue = this.contractDetailsForm.value;

    const dto: CreateRegionalTestingContractDto = {
      contractType: formValue.contractType,
      customerName: formValue.customerName,
      customerId: formValue.customerId,
      exportCode: formValue.exportCode,
      agreementDate: formValue.agreementDate ? moment(formValue.agreementDate).format('YYYY-MM-DD') : undefined,
      effDate: moment(formValue.effDate).format('YYYY-MM-DD'),
      termDate: formValue.termDate ? moment(formValue.termDate).format('YYYY-MM-DD') : null,
      addressId: this.addressData()?.addressId || null
    };

    this.contractService.createContract(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.showSuccess(`Contract ${result.contractId} created successfully.`);
          this.saving.set(false);
          this.router.navigate(['/laboratory/regional-testing-contract']);
        },
        error: (err) => {
          this.handleApiError(err);
          this.saving.set(false);
        }
      });
  }

  private updateContract(): void {
    const formValue = this.contractDetailsForm.value;

    const dto: UpdateRegionalTestingContractDto = {
      contractType: formValue.contractType,
      customerName: formValue.customerName,
      customerId: formValue.customerId,
      exportCode: formValue.exportCode,
      agreementDate: formValue.agreementDate ? moment(formValue.agreementDate).format('YYYY-MM-DD') : undefined,
      effDate: moment(formValue.effDate).format('YYYY-MM-DD'),
      termDate: formValue.termDate ? moment(formValue.termDate).format('YYYY-MM-DD') : null,
      addressId: this.addressData()?.addressId || null
    };

    this.contractService.updateContract(this.contractId()!, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Contract updated successfully.');
          this.saving.set(false);
          this.router.navigate(['/laboratory/regional-testing-contract']);
        },
        error: (err) => {
          this.handleApiError(err);
          this.saving.set(false);
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/laboratory/regional-testing-contract']);
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  private handleApiError(err: any): void {
    const message = err.error?.message || err.message || 'An error occurred';

    // Map API error codes to user-friendly messages
    const errorMap: { [key: string]: string } = {
      '0080': 'Required field is missing.',
      '0318': 'Contract type must be Regional, Testing, or Supplier.',
      '5002': 'Effective date is required.',
      '5004': 'Termination date cannot be before effective date.',
      '5015': 'Effective date cannot be in the past.',
      '3115': 'Termination date cannot be in the past.'
    };

    const friendlyMessage = errorMap[err.error?.statusCode] || message;
    this.showError(friendlyMessage);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, '', {
      duration: 8000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 0,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
