import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ShippedProductsDialogData } from '../../models/order-history-single-order.model';

@Component({
  selector: 'app-shipped-products-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './shipped-products-dialog.html',
  styleUrls: ['./shipped-products-dialog.scss'],
})
export class ShippedProductsDialogComponent {
  readonly data = inject<ShippedProductsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ShippedProductsDialogComponent>);

  onClose(): void {
    this.dialogRef.close();
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '--';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const day = date.getDate();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${month}-${year}, ${hours}:${minutes}`;
  }
}
