import { Component, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

import { MormFilterValue } from '../models/morm.model';

@Component({
  selector: 'app-morm-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule
  ],
  templateUrl: './morm-filter-panel.html',
  styleUrls: ['./morm-filter-panel.scss']
})
export class MormFilterPanel {
  @Output() apply = new EventEmitter<MormFilterValue>();
  @Output() close = new EventEmitter<void>();

  form: FormGroup;
  currentFilters: MormFilterValue | null = null;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      testId: [''],
      testType: [''],
      testIntp: [''],
      includeInactive: [false]
    });
  }

  ngOnInit(): void {
    if (this.currentFilters) {
      this.form.patchValue(this.currentFilters);
    }
  }

  onApply(): void {
    const formValue = this.form.value;

    // Build filter object with only non-empty values
    const filters: MormFilterValue = {};

    if (formValue.testId?.trim()) {
      filters.testId = formValue.testId.trim();
    }

    if (formValue.testType?.trim()) {
      filters.testType = formValue.testType.trim();
    }

    if (formValue.testIntp?.trim()) {
      filters.testIntp = formValue.testIntp.trim();
    }

    if (formValue.includeInactive) {
      filters.includeInactive = true;
    }

    this.apply.emit(filters);
  }

  onClear(): void {
    this.form.reset({
      testId: '',
      testType: '',
      testIntp: '',
      includeInactive: false
    });
  }

  onClose(): void {
    this.close.emit();
  }

  get f() {
    return this.form.controls;
  }
}
