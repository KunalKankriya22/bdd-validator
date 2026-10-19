import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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

export interface FilterDialogData {
  filters: AssociationFilterCriteria;
  interdictionCodeOptions: InterdictionCodeOption[];
  donationTypeOptions: DonationTypeOption[];
  letterCodeOptions: LetterCodeOption[];
}

@Component({
  selector: 'app-filter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './filter-dialog.component.html',
  styleUrls: ['./filter-dialog.component.scss']
})
export class FilterDialogComponent implements OnInit {
  filterForm: FormGroup;
  interdictionCodeOptions: InterdictionCodeOption[] = [];
  donationTypeOptions: DonationTypeOption[] = [];
  letterCodeOptions: LetterCodeOption[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FilterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FilterDialogData
  ) {
    this.interdictionCodeOptions = data.interdictionCodeOptions;
    this.donationTypeOptions = data.donationTypeOptions;
    this.letterCodeOptions = data.letterCodeOptions;

    this.filterForm = this.fb.group({
      interdictionCode: [data.filters.interdictionCode || ''],
      donationType: [data.filters.donationType || ''],
      letterId: [data.filters.letterId || '']
    });
  }

  ngOnInit(): void {}

  onApply(): void {
    const filters: AssociationFilterCriteria = {
      interdictionCode: this.filterForm.value.interdictionCode || undefined,
      donationType: this.filterForm.value.donationType || undefined,
      letterId: this.filterForm.value.letterId || undefined
    };
    this.dialogRef.close(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      interdictionCode: '',
      donationType: '',
      letterId: ''
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
