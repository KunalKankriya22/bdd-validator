import { Component, OnInit, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import moment, { Moment } from 'moment';
import { Contact, ContractWithDetails } from '../../internal-contract.models';
import { phoneNumberValidator, contactTypeValidator } from '../../validators/internal-contract.validators';
import { CONTACT_TYPE_OPTIONS } from '../../constants/internal-contract-error-codes';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';

export interface ContactDialogData {
  contact?: Contact;
  mode: 'create' | 'edit';
  contractData?: ContractWithDetails;
  contractTypes?: Array<{codeValue: string; codeDescription: string}>;
  barcodeProtocols?: Array<{codeValue: string; codeDescription: string}>;
}

@Component({
  selector: 'app-contact-dialog',
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
    MatDatepickerModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './contact-dialog.component.html',
  styleUrl: './contact-dialog.component.scss'
})
export class ContactDialogComponent implements OnInit {
  private static nextId = 0;
  protected readonly componentId = `contact-dialog-${ContactDialogComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ContactDialogComponent>);

  form!: FormGroup;
  contactTypeOptions = CONTACT_TYPE_OPTIONS;
  isEditMode = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ContactDialogData) {
    this.isEditMode = data.mode === 'edit';
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const contact = this.data.contact;
    const contract = this.data.contractData?.contract;

    // Convert termDate to Moment if it exists
    const termDateValue = contract?.termDate ? moment(contract.termDate) : null;

    this.form = this.fb.group({
      // Contract fields (above grey line)
      company: [contract?.company || '', [Validators.maxLength(50)]],
      taxIdForm: [contract?.taxIdForm || '', [Validators.maxLength(9)]],
      barCodeProtocol: [contract?.barCodeProtocol || ''],
      unitIdPattern: [contract?.unitIdPattern || '', [Validators.maxLength(1)]],
      ediInputInd: [contract?.ediInputInd || null],
      resultOutputInd: [contract?.resultOutputInd || ''],
      confirmTestFlag: [contract?.confirmTestFlag || null],
      termDate: [termDateValue],

      // Contact fields (below grey line)
      contactType: [contact?.contactType || 'C', [contactTypeValidator()]],
      contactLastName: [contact?.contactLastName || '', [Validators.required, Validators.maxLength(50)]],
      contactFirstName: [contact?.contactFirstName || '', [Validators.required, Validators.maxLength(50)]],
      contactTitle: [contact?.contactTitle || '', [Validators.maxLength(30)]],
      phoneNumber: [contact?.phoneNumber || '', [phoneNumberValidator()]],
      faxNumber: [contact?.faxNumber || '', [phoneNumberValidator()]]
    });
  }

  get f() {
    return this.form.controls;
  }

  /**
   * Format phone/fax number as user types (999-999-9999)
   */
  formatPhoneNumber(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove non-digits

    if (value.length > 10) {
      value = value.substring(0, 10);
    }

    // Format as 999-999-9999
    if (value.length > 6) {
      value = `${value.substring(0, 3)}-${value.substring(3, 6)}-${value.substring(6)}`;
    } else if (value.length > 3) {
      value = `${value.substring(0, 3)}-${value.substring(3)}`;
    }

    this.form.get(controlName)?.setValue(value, { emitEvent: false });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      // Focus first invalid field
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const formValue = this.form.value;

    // Build contact object - preserve existing audit fields
    const contact: Contact = {
      contactId: this.data.contact?.contactId || null,
      contactType: formValue.contactType,
      contactLastName: formValue.contactLastName,
      contactFirstName: formValue.contactFirstName,
      contactTitle: formValue.contactTitle || null,
      phoneNumber: formValue.phoneNumber || null,
      faxNumber: formValue.faxNumber || null,
      // Preserve existing audit fields (backend will update these)
      lastModifiedDate: this.data.contact?.lastModifiedDate,
      programId: this.data.contact?.programId
    };

    // Build contract object with updated fields
    const termDate = formValue.termDate && moment.isMoment(formValue.termDate)
      ? formValue.termDate.toISOString()
      : formValue.termDate || null;

    const contract = {
      ...this.data.contractData?.contract,
      company: formValue.company,
      taxIdForm: formValue.taxIdForm || null,
      barCodeProtocol: formValue.barCodeProtocol,
      unitIdPattern: formValue.unitIdPattern || null,
      ediInputInd: formValue.ediInputInd || null,
      resultOutputInd: formValue.resultOutputInd,
      confirmTestFlag: formValue.confirmTestFlag || null,
      termDate: termDate
    };

    // Return both contract and contact data
    this.dialogRef.close({ contract, contact });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Format date to DD-MMM-YYYY
   */
  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  /**
   * Get contract type description from lookup
   */
  getContractTypeDescription(): string {
    const contractType = this.data.contractData?.contract?.contractType;
    if (!contractType || !this.data.contractTypes) return '-';
    const type = this.data.contractTypes.find(t => t.codeValue === contractType);
    return type ? type.codeDescription : contractType;
  }

  /**
   * Get barcode protocol description from lookup
   */
  getBarcodeProtocolDescription(): string {
    const barCodeProtocol = this.data.contractData?.contract?.barCodeProtocol;
    if (!barCodeProtocol || !this.data.barcodeProtocols) return '-';
    const protocol = this.data.barcodeProtocols.find(p => p.codeValue === barCodeProtocol);
    return protocol ? protocol.codeDescription : barCodeProtocol;
  }
}
