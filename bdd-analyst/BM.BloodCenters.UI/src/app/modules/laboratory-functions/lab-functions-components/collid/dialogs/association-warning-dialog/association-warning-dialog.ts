import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

import { AssociationWarningData } from '../../models/valid-collection-facilities.model';

/**
 * Association Warning Dialog
 * Displays when a Collection ID is already associated with other contracts
 * Allows user to decide whether to proceed with the assignment
 *
 * Based on Figma: 05_Alert pop-up.png
 */
@Component({
  selector: 'app-association-warning-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule
  ],
  templateUrl: './association-warning-dialog.html',
  styleUrls: ['./association-warning-dialog.scss']
})
export class AssociationWarningDialogComponent {
  private static nextId = 0;
  protected readonly componentId = `association-warning-dialog-${AssociationWarningDialogComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  displayedColumns: string[] = ['contract', 'companyName'];

  private readonly dialogRef = inject(MatDialogRef<AssociationWarningDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: AssociationWarningData) {}

  onNoAssign(): void {
    this.dialogRef.close({ assigned: false });
  }

  onYesAssign(): void {
    this.dialogRef.close({ assigned: true });
  }
}
