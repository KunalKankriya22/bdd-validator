import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, finalize } from 'rxjs';

import { ValidDonationTypeProcedureCodeService } from '../services/valid-donation-type-procedure-code.service';
import {
  DonationTypeProcedureCodeFilterValue,
  PERIOD_OPTIONS,
  DonationTypeLookup,
  ProcedureCodeLookup,
  AttributeGroupLookup
} from '../models/valid-donation-type-procedure-code.model';

export interface DonationTypeProcedureFilterDialogData {
  currentFilters: DonationTypeProcedureCodeFilterValue | null;
}

@Component({
  selector: 'app-donation-type-procedure-filter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './donation-type-procedure-filter-dialog.html',
  styleUrls: ['./donation-type-procedure-filter-dialog.scss']
})
export class DonationTypeProcedureFilterDialog implements OnInit, OnDestroy {
  filterForm: FormGroup;
  periodOptions = PERIOD_OPTIONS;

  donationTypeOptions: DonationTypeLookup[] = [];
  procedureCodeOptions: ProcedureCodeLookup[] = [];
  attributeGroupOptions: AttributeGroupLookup[] = [];

  isLoadingOptions = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DonationTypeProcedureFilterDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DonationTypeProcedureFilterDialogData,
    private validDonationTypeProcedureCodeService: ValidDonationTypeProcedureCodeService
  ) {
    this.filterForm = this.fb.group({
      donationType: [null],
      procedureCode: [null],
      attributeGroup: [null],
      attributeCode: [null],
      period: [null],
      effectiveDate: [null],
      terminationDate: [null],
      terminationPeriod: [null]
    });
  }

  ngOnInit(): void {
    this.loadFilterOptions();

    if (this.data.currentFilters) {
      this.filterForm.patchValue(this.data.currentFilters);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFilterOptions(): void {
    this.isLoadingOptions = true;

    this.validDonationTypeProcedureCodeService
      .getFilters()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoadingOptions = false))
      )
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.donationTypeOptions = response.data.donationTypes || [];
            this.procedureCodeOptions = response.data.procedureCodes || [];
            this.attributeGroupOptions = response.data.attributeGroups || [];
          }
        },
        error: () => {
          // Error is handled by authInterceptor
        }
      });
  }

  onApply(): void {
    const filters: DonationTypeProcedureCodeFilterValue = this.filterForm.value;
    this.dialogRef.close(filters);
  }

  onClear(): void {
    this.filterForm.reset();
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
