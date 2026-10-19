import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';

import { HospitalPatientTestingContractService } from '../services/hospital-patient-testing-contract.service';
import {
  ContractContact,
  DropdownOption
} from '../models/hospital-patient-testing-contract.model';

@Component({
  selector: 'app-add-edit-contact-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidePanelBase,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-edit-contact-dialog.html',
  styleUrls: ['./add-edit-contact-dialog.scss']
})
export class AddEditContactDialogComponent implements OnInit, OnDestroy, OnChanges {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() contractId = '';
  @Input() contact: ContractContact | null = null;
  @Input() contactTypes: DropdownOption[] = [];
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(HospitalPatientTestingContractService);
  private readonly destroy$ = new Subject<void>();

  readonly saving = signal<boolean>(false);

  contactTypeSearchCtrl = new FormControl<string>('');
  filteredContactTypes: DropdownOption[] = [];

  form!: FormGroup;

  footerButtons: DialogButton[] = [
    { label: 'CANCEL', action: 'cancel', variant: 'text' },
    { label: 'SAVE', action: 'save', variant: 'primary' }
  ];

  get isEditMode(): boolean { return this.mode === 'edit'; }
  get isAddMode(): boolean { return this.mode === 'add'; }
  get panelTitle(): string { return this.isEditMode ? 'Edit Contact Detail' : 'Add New Contact'; }

  // Backward compat alias
  get data() { return { contractId: this.contractId, contact: this.contact, contactTypes: this.contactTypes, mode: this.mode }; }

  ngOnInit(): void {
    this.initializeForm();
    this.setupSaveButtonState();
    this.filteredContactTypes = this.contactTypes;
    this.contactTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        this.filteredContactTypes = this.contactTypes.filter(o =>
          o.description.toLowerCase().includes((search || '').toLowerCase())
        );
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['contact'] || changes['mode']) && this.form) {
      this.initializeForm();
      this.setupSaveButtonState();
    }
    if (changes['contactTypes']) {
      this.filteredContactTypes = this.contactTypes;
    }
  }

  private setupSaveButtonState(): void {
    this.updateSaveButtonState();
    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateSaveButtonState());
  }

  private updateSaveButtonState(): void {
    this.footerButtons = this.footerButtons.map(btn =>
      btn.action === 'save' ? { ...btn, disabled: this.form.invalid || this.saving() } : btn
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      contactType: ['', [Validators.required, Validators.maxLength(1)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      title: ['', [Validators.maxLength(30)]],
      phoneNumber: ['', [Validators.maxLength(10)]],
      faxNumber: ['', [Validators.maxLength(10)]],
      emailId: ['', [Validators.maxLength(50), Validators.email]]
    });

    if (this.isEditMode && this.contact) {
      this.form.patchValue({
        contactType: this.contact.contactType,
        lastName: this.contact.lastName,
        firstName: this.contact.firstName,
        title: this.contact.title !== '--' ? this.contact.title : '',
        phoneNumber: this.contact.phoneNumber !== '-' ? this.contact.phoneNumber : '',
        faxNumber: this.contact.faxNumber !== '-' ? this.contact.faxNumber : '',
        emailId: this.contact.emailId !== '-' ? this.contact.emailId : ''
      });
      this.form.get('contactType')?.disable();
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const formValue = this.form.getRawValue();
    const payload: any = {
      contactType: formValue.contactType,
      contactLastName: formValue.lastName,
      contactFirstName: formValue.firstName,
      contactTitle: formValue.title,
      phoneNumber: formValue.phoneNumber,
      faxNumber: formValue.faxNumber,
      emailId: formValue.emailId
    };

    if (this.isEditMode && this.contact) {
      this.service.updateContact(this.contractId, this.contact.contactId, payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => { this.saving.set(false); this.saved.emit(); },
          error: () => { this.saving.set(false); }
        });
    } else {
      this.service.createContact(this.contractId, payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => { this.saving.set(false); this.saved.emit(); },
          error: () => { this.saving.set(false); }
        });
    }
  }

  onClearAll(): void {
    if (this.isEditMode) {
      this.form.patchValue({ lastName: '', firstName: '', title: '', phoneNumber: '', faxNumber: '', emailId: '' });
    } else {
      this.form.reset();
    }
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onButtonClick(action: string): void {
    if (action === 'save') this.onSave();
    else if (action === 'cancel') this.onCancel();
  }
}
