import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { A11yModule } from '@angular/cdk/a11y';

export interface FilterValues {
  aboRh: string;
  requiredQuantity: string;
  allocatedQuantity: string;
  remainingQuantity: string;
}

export interface FilterOptions {
  aboRhOptions: string[];
  requiredQtyOptions: string[];
  allocatedQtyOptions: string[];
  remainingQtyOptions: string[];
}

@Component({
  selector: 'app-initiate-hospital-transfer-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    A11yModule,
  ],
  templateUrl: './initiate-hospital-transfer-filter-panel.html',
  styleUrl: './initiate-hospital-transfer-filter-panel.scss',
})
export class InitiateHospitalTransferFilterPanel implements OnInit {
  @Input() currentFilters: FilterValues | null = null;
  @Input() options: FilterOptions = { aboRhOptions: [], requiredQtyOptions: [], allocatedQtyOptions: [], remainingQtyOptions: [] };

  @Output() apply = new EventEmitter<FilterValues>();
  @Output() clear = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  filterForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      aboRh: [''],
      requiredQuantity: [''],
      allocatedQuantity: [''],
      remainingQuantity: [''],
    });
  }

  ngOnInit(): void {
    if (this.currentFilters) {
      this.filterForm.patchValue(this.currentFilters);
    }
  }

  get isApplyDisabled(): boolean {
    const v = this.filterForm.value;
    return !v.aboRh && !v.requiredQuantity && !v.allocatedQuantity && !v.remainingQuantity;
  }

  onApply(): void {
    this.apply.emit(this.filterForm.value);
  }

  onClear(): void {
    this.filterForm.reset({
      aboRh: '',
      requiredQuantity: '',
      allocatedQuantity: '',
      remainingQuantity: '',
    });
    this.clear.emit();
  }

  onClose(): void {
    this.close.emit();
  }
}
