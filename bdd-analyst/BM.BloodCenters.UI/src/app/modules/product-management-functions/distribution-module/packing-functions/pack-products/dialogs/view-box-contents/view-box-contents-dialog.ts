import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import moment from 'moment';

import { ViewBoxContentsDialogData } from '../../models/pack.models';

/**
 * View Box Contents Dialog
 * Displays all products packed in a specific box
 *
 * JIRA: MLT-14015
 */
@Component({
  selector: 'app-view-box-contents-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule
  ],
  templateUrl: './view-box-contents-dialog.html',
  styleUrl: './view-box-contents-dialog.scss'
})
export class ViewBoxContentsDialogComponent {
  private static nextId = 0;
  protected readonly componentId = `view-box-contents-${ViewBoxContentsDialogComponent.nextId++}`;

  protected readonly dialogRef = inject(MatDialogRef<ViewBoxContentsDialogComponent>);

  displayedColumns: string[] = [
    'unitId',
    'expirationDate',
    'productType',
    'productCode',
    'aliquot',
    'aboRh'
  ];

  constructor(@Inject(MAT_DIALOG_DATA) public data: ViewBoxContentsDialogData) {}

  get products() {
    return this.data.products || [];
  }

  get productCount() {
    return this.products.length;
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  formatDate(value: string | null | undefined): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  /**
   * Close dialog
   */
  onClose(): void {
    this.dialogRef.close();
  }
}
