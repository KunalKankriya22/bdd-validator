import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ShippedAttributesAntigensDialogData } from '../../models/order-history-single-order.model';

@Component({
  selector: 'app-shipped-attributes-antigens-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './shipped-attributes-antigens-dialog.html',
  styleUrls: ['./shipped-attributes-antigens-dialog.scss'],
})
export class ShippedAttributesAntigensDialogComponent {
  readonly data = inject<ShippedAttributesAntigensDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ShippedAttributesAntigensDialogComponent>);

  onClose(): void {
    this.dialogRef.close();
  }
}
