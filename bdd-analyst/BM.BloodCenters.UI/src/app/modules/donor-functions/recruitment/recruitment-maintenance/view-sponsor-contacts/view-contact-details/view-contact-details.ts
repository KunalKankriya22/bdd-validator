import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SponsorContactModel, SponsorContactDetailModel } from '../../../recruitment-administration/maintain-sponsor-contacts/models/maintain-sponsor-contacts.model';
import moment from 'moment';

@Component({
  selector: 'app-view-contact-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './view-contact-details.html',
  styleUrls: ['./view-contact-details.scss']
})
export class ViewContactDetailsComponent implements OnInit, OnChanges {
  @Input() data: SponsorContactModel | null = null;
  @Input() detailData: SponsorContactDetailModel | null = null;
  @Input() isLoading = false;
  @Output() closePanel = new EventEmitter<void>();

  form!: FormGroup;
  contactDetail: SponsorContactModel | SponsorContactDetailModel | null = null;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.setupForm();
    this.updateContactDetail();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['detailData']) {
      this.updateContactDetail();
    }
  }

  private setupForm(): void {
    this.form = this.fb.group({
      honorific: [''],
      firstName: [''],
      lastName: [''],
      type: [''],
      title: [''],
      effectiveDate: [''],
      terminationDate: ['']
    });
  }

  private updateContactDetail(): void {
    // Use detailData if available, otherwise fall back to basic data
    this.contactDetail = this.detailData || this.data;
    this.populateForm();
  }

  private populateForm(): void {
    if (!this.contactDetail || !this.form) return;

    this.form.patchValue({
      honorific: this.contactDetail.salutationDescription || '-',
      firstName: this.contactDetail.firstName || '-',
      lastName: this.contactDetail.lastName || '-',
      type: this.contactDetail.contactTypeDescription || '-',
      title: this.contactDetail.titleDescription || '-',
      effectiveDate: this.getFormattedDate(this.contactDetail.effDate),
      terminationDate: this.getFormattedDate(this.contactDetail.termDate)
    });
  }

  onClose(): void {
    this.closePanel.emit();
  }

  getFormattedDate(dateValue: any): string {
    if (!dateValue || dateValue === '-') return '-';
    const parsed = moment(dateValue);
    if (!parsed.isValid()) return '-';
    return parsed.format('DD-MMM-YYYY').toUpperCase();
  }
}
