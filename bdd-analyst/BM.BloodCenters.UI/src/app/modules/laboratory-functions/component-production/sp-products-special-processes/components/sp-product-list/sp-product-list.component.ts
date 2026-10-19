import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { ProductType } from '../../models/sp-products-special-processes.model';

@Component({
  selector: 'app-sp-product-list',
  standalone: true,
  imports: [CommonModule, MatListModule],
  templateUrl: './sp-product-list.component.html',
  styleUrls: ['./sp-product-list.component.scss']
})
export class SpProductListComponent {
  @Input() productTypes: ProductType[] = [];
  @Input() selectedProductTypeCode: string | null = null;
  @Input() isLoading = false;

  @Output() productTypeSelected = new EventEmitter<ProductType>();

  onProductTypeClick(productType: ProductType): void {
    this.productTypeSelected.emit(productType);
  }

  isSelected(productType: ProductType): boolean {
    return this.selectedProductTypeCode === productType.code;
  }
}
