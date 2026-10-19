import {
  Component,
  inject,
  signal,
  OnInit,
  Inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Contact } from '../../../models/regional-testing-contract.models';

/**
 * Contacts Information Dialog Component
 * Dialog for managing multiple contact records
 *
 * TODO: Implement when contacts API is available
 */
@Component({
  selector: 'app-contacts-information-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './contacts-information-dialog.component.html',
  styleUrl: './contacts-information-dialog.component.scss'
})
export class ContactsInformationDialogComponent implements OnInit {
  private static nextId = 0;
  protected readonly componentId = `contacts-information-dialog-${ContactsInformationDialogComponent.nextId++}`;

  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ContactsInformationDialogComponent>);

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  form!: FormGroup;
  protected readonly submitted = signal<boolean>(false);

  // TODO: Replace with actual lookup from API
  protected readonly contactTypes = signal([
    { code: 'Facility', description: 'Facility' },
    { code: 'Primary', description: 'Primary' },
    { code: 'Billing', description: 'Billing' },
    { code: 'Technical', description: 'Technical' }
  ]);

  constructor(@Inject(MAT_DIALOG_DATA) public data?: Contact[]) {}

  ngOnInit(): void {
    this.initForm();

    if (this.data && this.data.length > 0) {
      this.data.forEach(contact => {
        this.addContact(contact);
      });
    } else {
      this.addContact();
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      contacts: this.fb.array([])
    });
  }

  get contacts(): FormArray {
    return this.form.get('contacts') as FormArray;
  }

  private createContactGroup(contact?: Contact): FormGroup {
    return this.fb.group({
      type: [contact?.type || 'Facility', Validators.required],
      lastName: [contact?.lastName || '', [Validators.required, Validators.maxLength(50)]],
      firstName: [contact?.firstName || '', [Validators.required, Validators.maxLength(50)]],
      title: [contact?.title || '', Validators.maxLength(50)],
      phoneNumber: [contact?.phoneNumber || '', Validators.maxLength(20)],
      fax: [contact?.fax || '', Validators.maxLength(20)]
    });
  }

  addContact(contact?: Contact): void {
    this.contacts.push(this.createContactGroup(contact));
  }

  removeContact(index: number): void {
    this.contacts.removeAt(index);

    // Ensure at least one contact remains
    if (this.contacts.length === 0) {
      this.addContact();
    }
  }

  onAddAnotherContact(): void {
    this.addContact();
  }

  onClearAll(): void {
    this.contacts.clear();
    this.addContact();
    this.submitted.set(false);
  }

  onSave(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const contacts: Contact[] = this.form.value.contacts;
    this.dialogRef.close(contacts);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getContactFormGroup(index: number): FormGroup {
    return this.contacts.at(index) as FormGroup;
  }
}
