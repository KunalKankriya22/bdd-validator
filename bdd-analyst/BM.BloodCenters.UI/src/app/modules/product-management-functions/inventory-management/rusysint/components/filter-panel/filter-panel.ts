import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import {
  FilterValue,
  ProductCodeLOV,
  BloodTypeLOV,
  WarehouseLOV
} from '../../models/release-product-quarantine.model';

/**
 * Filter Panel Component for Release Product Quarantine
 * Provides filtering options for quarantine products
 */
@Component({
  selector: 'app-release-product-quarantine-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './filter-panel.html',
  styleUrls: ['./filter-panel.scss']
})
export class ReleaseProductQuarantineFilterPanel implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `filter-panel-${ReleaseProductQuarantineFilterPanel.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @Input() productCodeOptions: ProductCodeLOV[] = [];
  @Input() bloodTypeOptions: BloodTypeLOV[] = [];
  @Input() warehouseOptions: WarehouseLOV[] = [];
  @Input() currentFilters: FilterValue | null = null;

  @Output() applyFilters = new EventEmitter<FilterValue>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() closePanel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  filterForm!: FormGroup;
  readonly today = moment().startOf('day').toDate();

  ngOnInit(): void {
    this.initForm();
    if (this.currentFilters) {
      this.populateForm(this.currentFilters);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      productCode: [null],
      bloodType: [null],
      warehouseId: [null],
      fromDate: [null],
      toDate: [null]
    });
  }

  private populateForm(filters: FilterValue): void {
    this.filterForm.patchValue({
      productCode: filters.productCode || null,
      bloodType: filters.bloodType || null,
      warehouseId: filters.warehouseId || null,
      fromDate: filters.fromDate || null,
      toDate: filters.toDate || null
    });
  }

  get f() {
    return this.filterForm.controls;
  }

  get hasAnyFilter(): boolean {
    const values = this.filterForm.value;
    return !!(
      values.productCode ||
      values.bloodType ||
      values.warehouseId ||
      values.fromDate ||
      values.toDate
    );
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    const filters: FilterValue = {};

    if (formValue.productCode) {
      filters.productCode = formValue.productCode;
    }
    if (formValue.bloodType) {
      filters.bloodType = formValue.bloodType;
    }
    if (formValue.warehouseId) {
      filters.warehouseId = formValue.warehouseId;
    }
    if (formValue.fromDate) {
      filters.fromDate = formValue.fromDate;
    }
    if (formValue.toDate) {
      filters.toDate = formValue.toDate;
    }

    this.applyFilters.emit(filters);
    this.closePanel.emit();
  }

  onClear(): void {
    this.filterForm.reset();
    this.clearFilters.emit();
    this.closePanel.emit();
  }

  onClose(): void {
    this.closePanel.emit();
  }

  /**
   * Format product code with description for dropdown
   */
  formatProductCode(option: ProductCodeLOV): string {
    return option.productDesc
      ? `${option.productCode} - ${option.productDesc}`
      : option.productCode;
  }

  /**
   * Format blood type with description for dropdown
   */
  formatBloodType(option: BloodTypeLOV): string {
    return option.aboDesc
      ? `${option.bloodType} - ${option.aboDesc}`
      : option.bloodType;
  }

  /**
   * Format warehouse with description for dropdown
   */
  formatWarehouse(option: WarehouseLOV): string {
    return option.warehouseDesc
      ? `${option.warehouseId} - ${option.warehouseDesc}`
      : option.warehouseId;
  }
}
