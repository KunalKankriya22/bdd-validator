import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LookupService } from '../services/lookup.service';
import { TemporaryDriveFilterValue, TemporaryDriveFilterOptions } from '../models/temporary-drive-filter.model';

export interface TemporaryDriveFilterDialogData {
  currentFilters: TemporaryDriveFilterValue | null;
  chapterId: string;
}

@Component({
  selector: 'app-temporary-drive-filter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Filter Temporary Drives</h2>

    <mat-dialog-content>
      @if (isLoading) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading filter options...</p>
        </div>
      } @else {
        <form [formGroup]="filterForm" class="filter-form">
          <!-- Drive Date -->
          <mat-form-field appearance="outline">
            <mat-label>Drive Date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="driveDate">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <!-- Sponsor -->
          <mat-form-field appearance="outline">
            <mat-label>Sponsor</mat-label>
            <mat-select formControlName="sponsorId">
              <mat-option [value]="null">All Sponsors</mat-option>
              @for (sponsor of filterOptions.sponsors; track sponsor.id) {
                <mat-option [value]="sponsor.id">{{ sponsor.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Drive Type -->
          <mat-form-field appearance="outline">
            <mat-label>Drive Type</mat-label>
            <mat-select formControlName="driveType">
              <mat-option [value]="null">All Types</mat-option>
              @for (type of filterOptions.driveTypes; track type.value) {
                <mat-option [value]="type.value">{{ type.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Drive Category -->
          <mat-form-field appearance="outline">
            <mat-label>Drive Category</mat-label>
            <mat-select formControlName="driveCategory">
              <mat-option [value]="null">All Categories</mat-option>
              @for (category of filterOptions.driveCategories; track category.value) {
                <mat-option [value]="category.value">{{ category.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </form>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="clearFilters()">Clear All</button>
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="applyFilters()" [disabled]="isLoading">
        Apply Filters
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .filter-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
      padding: 16px 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 16px;
    }

    mat-form-field {
      width: 100%;
    }
  `]
})
export class TemporaryDriveFilterDialog implements OnInit {
  private fb = inject(FormBuilder);
  private lookupService = inject(LookupService);
  private dialogRef = inject(MatDialogRef<TemporaryDriveFilterDialog>);

  filterForm!: FormGroup;
  isLoading = false;

  filterOptions: TemporaryDriveFilterOptions = {
    sponsors: [],
    driveTypes: [
      { value: 'I', label: 'Internal' },
      { value: 'C', label: 'Community' },
      { value: 'M', label: 'Mobile' }
    ],
    driveCategories: [
      { value: 'B', label: 'Bloodlines' },
      { value: 'C', label: 'Corporate' },
      { value: 'S', label: 'School' },
      { value: 'O', label: 'Other' }
    ]
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: TemporaryDriveFilterDialogData) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadFilterOptions();
    this.populateCurrentFilters();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      driveDate: [null],
      sponsorId: [null],
      driveType: [null],
      driveCategory: [null]
    });
  }

  private loadFilterOptions(): void {
    this.isLoading = true;

    // Load sponsors for dropdown
    this.lookupService.getSponsors(this.data.chapterId).subscribe({
      next: (sponsors) => {
        this.filterOptions.sponsors = sponsors;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading sponsors:', error);
        this.isLoading = false;
      }
    });
  }

  private populateCurrentFilters(): void {
    if (this.data.currentFilters) {
      this.filterForm.patchValue({
        driveDate: this.data.currentFilters.driveDate,
        sponsorId: this.data.currentFilters.sponsorId,
        driveType: this.data.currentFilters.driveType,
        driveCategory: this.data.currentFilters.driveCategory
      });
    }
  }

  applyFilters(): void {
    const filters: TemporaryDriveFilterValue = {
      driveDate: this.filterForm.get('driveDate')?.value || null,
      sponsorId: this.filterForm.get('sponsorId')?.value || null,
      driveType: this.filterForm.get('driveType')?.value || null,
      driveCategory: this.filterForm.get('driveCategory')?.value || null
    };

    this.dialogRef.close(filters);
  }

  clearFilters(): void {
    this.filterForm.reset();
    const emptyFilters: TemporaryDriveFilterValue = {
      driveDate: null,
      sponsorId: null,
      driveType: null,
      driveCategory: null
    };
    this.dialogRef.close(emptyFilters);
  }
}
