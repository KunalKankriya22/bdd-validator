import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

export interface FiltersDialogData {
  sex?: string;
  status?: string;
  availableSexOptions?: string[];
  availableStatusOptions?: string[];
}

/**
 * Filters Panel Component
 * Allows users to filter graded donations/donors by Sex and Status
 */
@Component({
  selector: 'app-filters-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './filters-dialog.html',
  styleUrls: ['./filters-dialog.scss']
})
export class FiltersDialogComponent implements OnInit {
  @Input() currentFilters?: FiltersDialogData;
  @Input() availableSexOptions: string[] = [];
  @Input() availableStatusOptions: string[] = [];
  @Output() apply = new EventEmitter<FiltersDialogData>();
  @Output() close = new EventEmitter<void>();

  filterForm: FormGroup;

  sexOptions: string[] = [];
  statusOptions: string[] = [];

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      sex: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.sexOptions = this.availableSexOptions;
    this.statusOptions = this.availableStatusOptions;

    if (this.currentFilters) {
      this.filterForm.patchValue({
        sex: this.currentFilters.sex || '',
        status: this.currentFilters.status || ''
      });
    }
  }

  /**
   * Clear all filters
   */
  onClearAll(): void {
    this.filterForm.patchValue({
      sex: '',
      status: ''
    });
  }

  /**
   * Apply filters and emit
   */
  onApply(): void {
    const filters = this.filterForm.value;
    this.apply.emit(filters);
  }

  /**
   * Close panel without applying
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Compute Apply button disabled state
   * Disabled when all filters are empty/All (no filter to apply)
   * Enabled when at least one filter has a value, regardless of whether it changed from initial state
   */
  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Normalize 'All' and empty string to be equivalent
    const normalizeSex = (value: string | undefined) => (!value || value === 'All') ? '' : value;
    const normalizeStatus = (value: string | undefined) => (!value || value === 'All') ? '' : value;

    const currentSexNormalized = normalizeSex(formValue.sex);
    const currentStatusNormalized = normalizeStatus(formValue.status);

    // Check if at least one filter has a value
    const hasAnyValue = !!(currentSexNormalized || currentStatusNormalized);

    // Disable Apply if no filter has a value
    return !hasAnyValue;
  }
}