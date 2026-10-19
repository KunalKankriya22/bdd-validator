import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

import {
  CreateAssociationRequest,
  InterdictionCodeOption,
  DonationTypeOption,
  LetterCodeOption
} from '../../models/associate-letter.model';

@Component({
  selector: 'app-link-letter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './link-letter-panel.component.html',
  styleUrls: ['./link-letter-panel.component.scss']
})
export class LinkLetterPanelComponent implements OnInit {
  @Input() interdictionCodeOptions: InterdictionCodeOption[] = [];
  @Input() donationTypeOptions: DonationTypeOption[] = [];
  @Input() letterCodeOptions: LetterCodeOption[] = [];

  @Output() save = new EventEmitter<CreateAssociationRequest>();
  @Output() close = new EventEmitter<void>();

  linkForm: FormGroup;

  // Descriptions
  interdictionDescription = '-';
  donationDescription = '-';

  constructor(private fb: FormBuilder) {
    this.linkForm = this.fb.group({
      interdictionCode: ['', Validators.required],
      donationType: ['', Validators.required],
      letterId: ['', Validators.required],
      effectiveDate: [new Date(), Validators.required],
      terminationDate: [null]
    });

    // Watch for interdiction code changes
    this.linkForm.get('interdictionCode')?.valueChanges.subscribe(code => {
      const option = this.interdictionCodeOptions.find(o => o.code === code);
      this.interdictionDescription = option?.description || '-';
    });

    // Watch for donation type changes
    this.linkForm.get('donationType')?.valueChanges.subscribe(code => {
      const option = this.donationTypeOptions.find(o => o.code === code);
      this.donationDescription = option?.description || '-';
    });
  }

  ngOnInit(): void {}

  onSave(createAnother: boolean = false): void {
    if (this.linkForm.valid) {
      const request: CreateAssociationRequest = {
        interdictionCode: this.linkForm.value.interdictionCode,
        donationType: this.linkForm.value.donationType,
        letterId: this.linkForm.value.letterId,
        effectiveDate: this.formatDate(this.linkForm.value.effectiveDate),
        terminationDate: this.linkForm.value.terminationDate
          ? this.formatDate(this.linkForm.value.terminationDate)
          : undefined
      };

      this.save.emit(request);

      if (createAnother) {
        // Reset form but keep current date as effective date
        this.linkForm.reset({
          interdictionCode: '',
          donationType: '',
          letterId: '',
          effectiveDate: new Date(),
          terminationDate: null
        });
        this.interdictionDescription = '-';
        this.donationDescription = '-';
      }
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
