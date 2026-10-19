import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import {
  AssociationFilterCriteria,
  InterdictionCodeOption,
  DonationTypeOption,
  LetterCodeOption
} from '../../models/associate-letter.model';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss']
})
export class FilterPanelComponent implements OnInit {
  @Input() filters: AssociationFilterCriteria = {};
  @Input() interdictionCodeOptions: InterdictionCodeOption[] = [];
  @Input() donationTypeOptions: DonationTypeOption[] = [];
  @Input() letterCodeOptions: LetterCodeOption[] = [];

  @Output() apply = new EventEmitter<AssociationFilterCriteria>();
  @Output() clear = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  filterForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      interdictionCode: [''],
      donationType: [''],
      letterId: ['']
    });
  }

  ngOnInit(): void {
    // Populate form with current filters
    this.filterForm.patchValue({
      interdictionCode: this.filters.interdictionCode || '',
      donationType: this.filters.donationType || '',
      letterId: this.filters.letterId || ''
    });
  }

  onApply(): void {
    const filters: AssociationFilterCriteria = {
      interdictionCode: this.filterForm.value.interdictionCode || undefined,
      donationType: this.filterForm.value.donationType || undefined,
      letterId: this.filterForm.value.letterId || undefined
    };
    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      interdictionCode: '',
      donationType: '',
      letterId: ''
    });
    this.clear.emit();
  }

  onClose(): void {
    this.close.emit();
  }
}
