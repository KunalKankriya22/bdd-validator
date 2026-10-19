import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SponsorContactModel, SponsorContactDetailModel, SponsorContactAddress } from '../../../recruitment-administration/maintain-sponsor-contacts/models/maintain-sponsor-contacts.model';

@Component({
  selector: 'app-view-international-address',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './view-international-address.html',
  styleUrls: ['./view-international-address.scss']
})
export class ViewInternationalAddressComponent implements OnInit, OnChanges {
  @Input() data: SponsorContactModel | null = null;
  @Input() detailData: SponsorContactDetailModel | null = null;
  @Input() isLoading = false;
  @Output() closePanel = new EventEmitter<void>();

  form!: FormGroup;
  address: Partial<SponsorContactAddress> = {};

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.setupForm();
    this.updateAddress();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['detailData']) {
      this.updateAddress();
    }
  }

  private setupForm(): void {
    this.form = this.fb.group({
      address1: [''],
      address2: [''],
      address3: [''],
      address4: [''],
      country: [''],
      postalCode: [''],
      extension: [''],
      workPhone: [''],
      homePhone: [''],
      mobilePhone: [''],
      fax: [''],
      email: ['']
    });
  }

  private updateAddress(): void {
    // Use detailData if available
    if (this.detailData) {
      this.address = this.detailData.address || {};
    } else {
      this.address = {};
    }
    this.populateForm();
  }

  private populateForm(): void {
    if (!this.form) return;

    this.form.patchValue({
      address1: this.address.intlAddress1 || '',
      address2: this.address.intlAddress2 || '',
      address3: this.address.intlAddress3 || '',
      address4: this.address.intlAddress4 || '',
      country: this.address.countryName || '',
      postalCode: this.address.intlPostalCode || '',
      extension: this.address.intlWorkPhoneExt || '',
      workPhone: this.address.intlWorkPhoneNo || '',
      homePhone: this.address.intlHomePhoneNo || '',
      mobilePhone: this.address.intlMobilePhoneNo || '',
      fax: this.address.intlFaxNo || '',
      email: this.address.email || ''
    });
  }

  onClose(): void {
    this.closePanel.emit();
  }
}
