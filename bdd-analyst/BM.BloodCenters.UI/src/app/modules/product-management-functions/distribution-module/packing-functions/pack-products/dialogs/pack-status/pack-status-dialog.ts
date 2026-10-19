import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import { PackStatusDialogData } from '../../models/pack.models';

/**
 * Pack Status Dialog
 * Shows packed products vs allocated products in split view
 *
 * JIRA: MLT-14015
 * Based on Legacy Pack Status screen
 */
@Component({
  selector: 'app-pack-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule
  ],
  templateUrl: './pack-status-dialog.html',
  styleUrl: './pack-status-dialog.scss'
})
export class PackStatusDialogComponent {
  private static nextId = 0;
  protected readonly componentId = `pack-status-${PackStatusDialogComponent.nextId++}`;

  protected readonly dialogRef = inject(MatDialogRef<PackStatusDialogComponent>);

  packedColumns: string[] = ['unitId', 'product', 'aliquot', 'aboRh'];
  allocatedColumns: string[] = ['unitId', 'product', 'aliquot', 'aboRh'];

  constructor(@Inject(MAT_DIALOG_DATA) public data: PackStatusDialogData) {}

  get packedProducts() {
    return this.data.packedProducts || [];
  }

  get allocatedProducts() {
    return this.data.allocatedProducts || [];
  }

  /**
   * Close dialog and continue packing
   */
  onExit(): void {
    this.dialogRef.close();
  }
}
