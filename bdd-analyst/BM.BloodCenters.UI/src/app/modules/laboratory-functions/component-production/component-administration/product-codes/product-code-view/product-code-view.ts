import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { ProductCodesService } from '../services/product-codes.service';
import { ProductCode, ProductAttribute } from '../models/product-codes.model';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { AddEditProductDialogComponent } from '../add-edit-product-dialog/add-edit-product-dialog';

@Component({
  selector: 'app-product-code-view',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    AddEditProductDialogComponent
  ],
  templateUrl: './product-code-view.html',
  styleUrls: ['./product-code-view.scss']
})
export class ProductCodeViewComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ProductCodesService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  product: ProductCode | null = null;
  productAttributes: ProductAttribute[] = [];
  sidePanelOpen = false;

  attributesTableConfig: DataTableConfig<ProductAttribute> = {
    columns: [
      {
        key: 'attributeGroup',
        header: 'Attribute Group',
        sortable: true,
        width: '150px'
      },
      {
        key: 'attributeGroupDescription',
        header: 'Description',
        sortable: false,
        minWidth: '200px'
      },
      {
        key: 'attributeCode',
        header: 'Attribute Code',
        sortable: false,
        width: '150px'
      },
      {
        key: 'attributeDescription',
        header: 'Description',
        sortable: false,
        minWidth: '200px'
      }
    ],
    sortConfig: {
      column: 'attributeGroup',
      direction: 'default'
    },
    stickyHeader: true,
    emptyMessage: 'No attributes found'
  };

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Product Codes', link: '/laboratory-functions/component-production/component-administration/product-codes' },
      { label: '', link: null } // Will be updated with product description
    ],
    title: '',
    subtitle: '',
    showBackButton: true,
    onBackClick: () => this.onBackClick()
    // Note: EDIT DETAILS button moved to custom SVG in template
  };

  ngOnInit(): void {
    const productCode = this.route.snapshot.paramMap.get('productCode');
    if (productCode) {
      this.loadProduct(productCode);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProduct(productCode: string): void {
    this.service.getProductCodeById(productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          this.product = product;
          this.updateHeader();
          this.loadProductAttributes(productCode);
        },
        error: (error) => {
          console.error('Error loading product:', error);
          this.snackBar.open(
            'Failed to load product details. Please try again.',
            'Close',
            { duration: 5000, panelClass: 'error-snackbar' }
          );
          this.router.navigate(['/laboratory-functions/component-production/component-administration/product-codes']);
        }
      });
  }

  private loadProductAttributes(productCode: string): void {
    this.service.getProductAttributes(productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (attributes) => {
          this.productAttributes = attributes;
        },
        error: (error) => {
          console.error('Error loading product attributes:', error);
        }
      });
  }

  private updateHeader(): void {
    if (this.product) {
      const productCode = this.product.productCode || '';
      const formula = this.product.productFormula || '-';
      const subtitle = `${productCode} | ${formula}`;

      // Create a new config object to trigger change detection
      this.headerConfig = {
        ...this.headerConfig,
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: 'Product Codes', link: '/laboratory-functions/component-production/component-administration/product-codes' },
          { label: this.product.productDesc || 'Product Details', link: null }
        ],
        title: this.product.productDesc || '',
        subtitle: subtitle
      };
    }
  }

  onBackClick(): void {
    this.router.navigate(['/laboratory-functions/component-production/component-administration/product-codes']);
  }

  onEditClick(): void {
    this.sidePanelOpen = true;
  }

  onDialogClosed(result: { success: boolean }): void {
    this.sidePanelOpen = false;
    if (result?.success) {
      // Reload the product data after successful edit
      const productCode = this.route.snapshot.paramMap.get('productCode');
      if (productCode) {
        this.loadProduct(productCode);
      }
    }
  }

  getProductClassDescription(): string {
    return this.product?.classDesc || '';
  }

  getModifierDescription(): string {
    return this.product?.modifierDesc || '';
  }

  getCellCountFlagDisplay(): string {
    const flag = this.product?.cellCountFlag;
    if (flag === 'Y') return 'Yes';
    if (flag === 'N') return 'No';
    if (flag === 'O') return 'O';
    return '-';
  }

  getPoolProductCodeDisplay(): string {
    const code = this.product?.poolProductCode;
    if (!code) return '-';
    if (code === 'Y') return 'Yes';
    if (code === 'N') return 'No';
    return code;
  }

  onAttributesSortChange(event: { column: string; direction: 'A' | 'D' | 'default' }): void {
    // Update sort config
    this.attributesTableConfig.sortConfig = {
      column: event.column,
      direction: event.direction
    };

    // Client-side sorting
    if (event.direction === 'default') {
      // Reset to original order (no sort)
      this.loadProductAttributes(this.route.snapshot.paramMap.get('productCode')!);
    } else {
      // Sort the array
      this.productAttributes = [...this.productAttributes].sort((a, b) => {
        const aValue = a[event.column as keyof ProductAttribute] || '';
        const bValue = b[event.column as keyof ProductAttribute] || '';

        const comparison = String(aValue).localeCompare(String(bValue));
        return event.direction === 'A' ? comparison : -comparison;
      });
    }
  }
}
