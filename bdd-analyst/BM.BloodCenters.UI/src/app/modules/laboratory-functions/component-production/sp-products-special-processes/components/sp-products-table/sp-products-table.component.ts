import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
  RowAction,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';

import { SpProductModel, ProductType } from '../../models/sp-products-special-processes.model';

@Component({
  selector: 'app-sp-products-table',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    DataTable,
    SearchBar
  ],
  templateUrl: './sp-products-table.component.html',
  styleUrls: ['./sp-products-table.component.scss']
})
export class SpProductsTableComponent implements OnChanges {
  @Input() selectedProductType: ProductType | null = null;
  @Input() products: SpProductModel[] = [];
  @Input() isLoading = false;
  @Input() hasError = false;
  @Input() errorMessage = '';

  @Output() pageChange = new EventEmitter<TablePageEvent>();
  @Output() sortChange = new EventEmitter<TableSortEvent>();
  @Output() rowAction = new EventEmitter<TableRowActionEvent<SpProductModel>>();
  @Output() addProduct = new EventEmitter<void>();
  @Output() productSearch = new EventEmitter<string>();

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by code type or description',
    minLength: 1,
    ariaLabel: 'Search products',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<SpProductModel> = {
    columns: [],
    rowActions: [],
    sortConfig: {
      column: 'productCode',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No products available to display',
    loadingMessage: 'Loading products...',
    showPagination: false
  };

  ngOnChanges(changes: SimpleChanges): void {
    // Initialize table config on first load or when products change
    if ((changes['products'] || changes['selectedProductType']) && !this.tableConfig.columns.length) {
      this.tableConfig = {
        ...this.tableConfig,
        columns: this.getTableColumns(),
        rowActions: this.getRowActions()
      };
    }
  }

  private getTableColumns(): TableColumn<SpProductModel>[] {
    return [
      {
        key: 'productCode',
        header: 'Product Code',
        sortable: true,
        width: '120px'
      },
      {
        key: 'productDesc',
        header: 'Description',
        width: '250px'
      },
      {
        key: 'attribGroup',
        header: 'Attribute Group',
        width: '140px'
      },
      {
        key: 'attribCode',
        header: 'Attribute Code',
        width: '140px'
      },
      {
        key: 'attribCodeDesc',
        header: 'Attribute Description',
        width: '250px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<SpProductModel>[] {
    return [
      {
        icon: 'edit',
        label: 'Edit product',
        ariaLabel: 'Edit product',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  onPageChange(event: TablePageEvent): void {
    this.pageChange.emit(event);
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };
    this.sortChange.emit(event);
  }

  onRowAction(event: TableRowActionEvent<SpProductModel>): void {
    this.rowAction.emit(event);
  }

  onAddProduct(): void {
    this.addProduct.emit();
  }

  onProductSearch(searchText: string): void {
    this.productSearch.emit(searchText);
  }
}
