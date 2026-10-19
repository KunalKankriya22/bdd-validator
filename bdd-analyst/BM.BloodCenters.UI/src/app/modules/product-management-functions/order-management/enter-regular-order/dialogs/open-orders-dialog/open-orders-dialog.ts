import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OpenOrderDto } from '../../models/regular-order.model';

export interface OpenOrdersDialogData {
  customerId: string;
  orders: OpenOrderDto[];
}

@Component({
  selector: 'app-open-orders-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './open-orders-dialog.html',
  styleUrls: ['./open-orders-dialog.scss']
})
export class OpenOrdersDialogComponent {
  readonly data = inject<OpenOrdersDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<OpenOrdersDialogComponent>);

  selectedOrderNo = signal<string | null>(null);

  onSelectOrder(orderNumber: string): void {
    this.selectedOrderNo.set(
      this.selectedOrderNo() === orderNumber ? null : orderNumber
    );
  }

  onLoadOrder(orderNumber: string): void {
    this.dialogRef.close({ action: 'load', orderNo: orderNumber });
  }

  onExit(): void {
    this.dialogRef.close();
  }
}
