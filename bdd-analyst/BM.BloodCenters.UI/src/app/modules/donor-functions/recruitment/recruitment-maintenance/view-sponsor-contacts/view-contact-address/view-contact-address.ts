import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SponsorContactModel, SponsorContactDetailModel, SponsorContactAddress } from '../../../recruitment-administration/maintain-sponsor-contacts/models/maintain-sponsor-contacts.model';

@Component({
  selector: 'app-view-contact-address',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './view-contact-address.html',
  styleUrls: ['./view-contact-address.scss']
})
export class ViewContactAddressComponent implements OnInit, OnChanges {
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
      street: [''],
      zipCode: [''],
      city: [''],
      workPhone: [''],
      homePhone: [''],
      fax: [''],
      email: [''],
      website: ['']
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
      street: this.address.streetName || '',
      zipCode: this.address.zip || '',
      city: this.address.city || '',
      workPhone: this.getFormattedPhone(this.address.dAreaCode, this.address.dPhoneNo),
      homePhone: this.getFormattedPhone(this.address.hAreaCode, this.address.hPhoneNo),
      fax: this.getFormattedPhone(this.address.fAreaCode, this.address.fPhoneNo),
      email: this.address.email || '',
      website: this.address.webAddress || ''
    });
  }

  onClose(): void {
    this.closePanel.emit();
  }

  getFormattedPhone(areaCode?: string, phoneNo?: string): string {
    if (!areaCode && !phoneNo) return '-';
    if (areaCode && phoneNo) return `(${areaCode}) ${phoneNo}`;
    return phoneNo || areaCode || '-';
  }
}
