import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { DerivedProductDto } from '../models/sterile-docking-definition.model';

@Component({
  selector: 'app-derived-products-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './derived-products-table.component.html',
  styleUrl: './derived-products-table.component.scss'
})
export class DerivedProductsTableComponent implements OnChanges {
  @Input() products: DerivedProductDto[] = [];
  @Output() removeProduct = new EventEmitter<string>();

  displayedColumns: string[] = [
    'unitId',
    'originalProductCode',
    'derivedProduct',
    'shortName',
    'weldOk',
    'verifyProduct'
  ];

  sortedProducts: DerivedProductDto[] = [];
  currentSort: Sort = { active: 'unitId', direction: 'asc' };

  private newRowIds = new Set<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['products']) {
      const prev = changes['products'].previousValue as DerivedProductDto[] || [];
      const curr = changes['products'].currentValue as DerivedProductDto[] || [];
      const prevIds = new Set(prev.map((p: DerivedProductDto) => p.id));

      curr.forEach((p: DerivedProductDto) => {
        if (!prevIds.has(p.id)) {
          this.newRowIds.add(p.id);
          setTimeout(() => this.newRowIds.delete(p.id), 1500);
        }
      });

      this.sortedProducts = [...this.products];
      this.applySort(this.currentSort);
    }
  }

  isNewRow(row: DerivedProductDto): boolean {
    return this.newRowIds.has(row.id);
  }

  onSortChange(sort: Sort): void {
    this.currentSort = sort;
    this.applySort(sort);
  }

  private applySort(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      this.sortedProducts = [...this.products];
      return;
    }

    this.sortedProducts = [...this.products].sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      const valueA = this.getSortValue(a, sort.active);
      const valueB = this.getSortValue(b, sort.active);

      return this.compare(valueA, valueB, isAsc);
    });
  }

  private getSortValue(product: DerivedProductDto, column: string): string {
    switch (column) {
      case 'unitId':
        return product.unitId;
      case 'originalProductCode':
        return product.originalProductCode;
      case 'derivedProduct':
        return product.derivedProduct;
      case 'shortName':
        return product.shortName;
      case 'weldOk':
        return product.weldOk;
      case 'verifyProduct':
        return product.verifyProduct;
      default:
        return '';
    }
  }

  private compare(a: string, b: string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  formatYesNo(value: 'Y' | 'N'): string {
    return value === 'Y' ? 'Yes' : 'No';
  }

  onRemove(unitId: string): void {
    this.removeProduct.emit(unitId);
  }
}
