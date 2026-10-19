import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ProductCombinationTableModel } from '../../models/product-combinations.model';

/**
 * View Product Combination Dialog Component
 * Displays details of a product combination in read-only mode
 */
@Component({
  selector: 'app-view-product-combination',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatListModule
  ],
  templateUrl: './view-product-combination.html',
  styleUrls: ['./view-product-combination.scss']
})
export class ViewProductCombinationComponent {
  private static nextId = 0;
  protected readonly componentId = `view-product-combination-${ViewProductCombinationComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ProductCombinationTableModel,
    private dialogRef: MatDialogRef<ViewProductCombinationComponent>
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
