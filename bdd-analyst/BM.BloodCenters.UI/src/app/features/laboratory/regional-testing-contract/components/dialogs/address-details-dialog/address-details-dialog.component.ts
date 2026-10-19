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
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { Address } from '../../../models/regional-testing-contract.models';

/**
 * Address Details Dialog Component
 * Dialog for adding/editing contract address information
 *
 * TODO: Implement when addresses API is available
 */
@Component({
  selector: 'app-address-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  templateUrl: './address-details-dialog.component.html',
  styleUrl: './address-details-dialog.component.scss'
})
export class AddressDetailsDialogComponent implements OnInit {
  private static nextId = 0;
  protected readonly componentId = `address-details-dialog-${AddressDetailsDialogComponent.nextId++}`;

  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AddressDetailsDialogComponent>);

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label}`;

  form!: FormGroup;
  protected readonly submitted = signal<boolean>(false);

  // TODO: Replace with actual lookups from API
  protected readonly states = signal([
    { code: 'CA', name: 'California' },
    { code: 'TX', name: 'Texas' },
    { code: 'NY', name: 'New York' },
    { code: 'FL', name: 'Florida' }
  ]);

  protected readonly countries = signal([
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'MX', name: 'Mexico' }
  ]);

  protected readonly postalZipOptions = signal([
    { code: 'ZIP', description: 'ZIP' },
    { code: 'POSTAL', description: 'Postal' }
  ]);

  constructor(@Inject(MAT_DIALOG_DATA) public data?: Address) {}

  ngOnInit(): void {
    this.initForm();

    if (this.data) {
      this.form.patchValue(this.data);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      isInternational: [false],
      addressLine1: ['', [Validators.required, Validators.maxLength(100)]],
      addressLine2: ['', Validators.maxLength(100)],
      addressLine3: ['', Validators.maxLength(100)],
      city: ['', Validators.maxLength(50)],
      state: ['', Validators.required],
      postalZip: ['ZIP'],
      country: ['US', Validators.required],
      phoneNumber: ['', Validators.maxLength(20)],
      fax: ['', Validators.maxLength(20)],
      internationalPhoneNumber: ['', Validators.maxLength(20)],
      internationalFax: ['', Validators.maxLength(20)]
    });

    // Watch international checkbox to enable/disable international fields
    this.form.get('isInternational')?.valueChanges.subscribe(isInternational => {
      const intPhoneControl = this.form.get('internationalPhoneNumber');
      const intFaxControl = this.form.get('internationalFax');

      if (isInternational) {
        intPhoneControl?.enable();
        intFaxControl?.enable();
      } else {
        intPhoneControl?.disable();
        intFaxControl?.disable();
        intPhoneControl?.setValue('');
        intFaxControl?.setValue('');
      }
    });

    // Initialize international fields state
    const intPhoneControl = this.form.get('internationalPhoneNumber');
    const intFaxControl = this.form.get('internationalFax');
    if (!this.form.get('isInternational')?.value) {
      intPhoneControl?.disable();
      intFaxControl?.disable();
    }
  }

  get f() {
    return this.form.controls;
  }

  onClearAll(): void {
    this.form.reset({
      isInternational: false,
      postalZip: 'ZIP',
      country: 'US'
    });
    this.submitted.set(false);
  }

  onAdd(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const address: Address = {
      ...this.form.value,
      addressId: this.data?.addressId
    };

    this.dialogRef.close(address);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
