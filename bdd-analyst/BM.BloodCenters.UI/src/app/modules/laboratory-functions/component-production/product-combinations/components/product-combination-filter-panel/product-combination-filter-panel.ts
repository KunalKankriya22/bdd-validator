import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProductCombinationFilterValue, ProductTypeDetailDto } from '../../models/product-combinations.model';

/**
 * Filter Panel Component for Product Combinations
 * Allows filtering by bag count and product type
 */
@Component({
  selector: 'app-product-combination-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './product-combination-filter-panel.html',
  styleUrls: ['./product-combination-filter-panel.scss']
})
export class ProductCombinationFilterPanel implements OnInit {
  @Input() currentFilters: ProductCombinationFilterValue | null = null;
  @Input() productTypeOptions: ProductTypeDetailDto[] = [];

  @Output() apply = new EventEmitter<ProductCombinationFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm: FormGroup;

  // Bag count options (1-15)
  bagCountOptions = Array.from({ length: 15 }, (_, i) => i + 1);

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      bagCount: [null],
      productType: [null]
    });
  }

  ngOnInit(): void {
    if (this.currentFilters) {
      this.filterForm.patchValue(this.currentFilters);
    }
  }

  onApply(): void {
    const filters: ProductCombinationFilterValue = {
      bagCount: this.filterForm.value.bagCount || null,
      productType: this.filterForm.value.productType || null
    };

    // Only emit non-null filters
    const hasFilters = Object.values(filters).some(val => val !== null);
    this.apply.emit(hasFilters ? filters : {});
  }

  onClear(): void {
    this.filterForm.reset();
  }

  onClose(): void {
    this.close.emit();
  }

  hasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return Object.values(formValue).some(val => val !== null && val !== '');
  }
}
