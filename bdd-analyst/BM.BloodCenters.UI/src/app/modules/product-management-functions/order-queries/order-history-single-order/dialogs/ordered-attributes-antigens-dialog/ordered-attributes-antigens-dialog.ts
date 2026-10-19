import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OrderedAttributesAntigensDialogData } from '../../models/order-history-single-order.model';

@Component({
  selector: 'app-ordered-attributes-antigens-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './ordered-attributes-antigens-dialog.html',
  styleUrls: ['./ordered-attributes-antigens-dialog.scss'],
})
export class OrderedAttributesAntigensDialogComponent {
  readonly data = inject<OrderedAttributesAntigensDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<OrderedAttributesAntigensDialogComponent>);

  onClose(): void {
    this.dialogRef.close();
  }
}
