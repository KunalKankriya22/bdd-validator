import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';
import {
  InterdictedFilterValue,
  InventoryClassOption,
  ProductTypeOption
} from '../models/interdicted-active-stock.model';

@Component({
  selector: 'app-interdicted-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    FilterPanelBase
  ],
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss']
})
export class InterdictedFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: InterdictedFilterValue | null = null;
  @Input() inventoryClasses: InventoryClassOption[] = [];
  @Input() productTypes: ProductTypeOption[] = [];

  @Output() apply = new EventEmitter<InterdictedFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  inventoryClassSearchControl = new FormControl('');
  filteredInventoryClasses: InventoryClassOption[] = [];

  productTypeSearchControl = new FormControl('');
  filteredProductTypes: ProductTypeOption[] = [];

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      inventoryClass: [this.currentFilters?.inventoryClass ?? null],
      productType: [this.currentFilters?.productType ?? null]
    });

    this.filteredInventoryClasses = [...this.inventoryClasses];
    this.filteredProductTypes = [...this.productTypes];

    this.inventoryClassSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term || '').toLowerCase();
        this.filteredInventoryClasses = this.inventoryClasses.filter(
          ic => ic.code.toLowerCase().includes(t) || ic.description.toLowerCase().includes(t)
        );
      });

    this.productTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term || '').toLowerCase();
        this.filteredProductTypes = this.productTypes.filter(
          pt => pt.productType.toLowerCase().includes(t) || pt.description.toLowerCase().includes(t)
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get selectedInventoryClassDescription(): string {
    const code = this.filterForm?.get('inventoryClass')?.value;
    if (!code) return '';
    return this.inventoryClasses.find(ic => ic.code === code)?.description ?? '';
  }

  get selectedProductTypeDescription(): string {
    const type = this.filterForm?.get('productType')?.value;
    if (!type) return '';
    return this.productTypes.find(pt => pt.productType === type)?.description ?? '';
  }

  get isApplyDisabled(): boolean {
    const v = this.filterForm.value;
    const hasValue = !!v.inventoryClass || !!v.productType;
    if (!hasValue) return true;
    return (
      (v.inventoryClass || null) === (this.currentFilters?.inventoryClass || null) &&
      (v.productType || null) === (this.currentFilters?.productType || null)
    );
  }

  get isClearDisabled(): boolean {
    const v = this.filterForm.value;
    return !v.inventoryClass && !v.productType;
  }

  onApply(): void {
    const v = this.filterForm.value;
    const filters: InterdictedFilterValue = {};
    if (v.inventoryClass) filters.inventoryClass = v.inventoryClass;
    if (v.productType) filters.productType = v.productType;
    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({ inventoryClass: null, productType: null });
    this.inventoryClassSearchControl.setValue('');
    this.productTypeSearchControl.setValue('');
  }

  onClose(): void {
    this.close.emit();
  }
}
