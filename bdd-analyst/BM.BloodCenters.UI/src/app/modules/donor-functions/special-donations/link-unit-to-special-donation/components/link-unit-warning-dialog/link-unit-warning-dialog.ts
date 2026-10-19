import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LinkUnitWarning } from '../../models/special-donor.model';

/**
 * Link Unit Warning Dialog Data
 */
export interface LinkUnitWarningDialogData {
  warnings: LinkUnitWarning[];
}

/**
 * Link Unit Warning Dialog Result
 */
export type LinkUnitWarningDialogResult = 'cancel' | 'override';

/**
 * Link Unit Warning Dialog Component
 * Displays warnings when linking a unit to a special donation
 *
 * Warning codes:
 * - SAME_PATIENT_UNIT: Unit is already linked to another donor for same Patient
 * - DIFFERENT_DONOR_UNIT: Unit is linked to different donor
 * - DONOR_NOT_ASSOCIATED: Corresponding donor is not associated with this patient
 * - UNREGISTERED_UNIT: This unit is not registered
 */
@Component({
  selector: 'app-link-unit-warning-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './link-unit-warning-dialog.html',
  styleUrl: './link-unit-warning-dialog.scss'
})
export class LinkUnitWarningDialogComponent {
  private static nextId = 0;
  protected readonly componentId = `link-unit-warning-dialog-${LinkUnitWarningDialogComponent.nextId++}`;

  readonly data = inject<LinkUnitWarningDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<LinkUnitWarningDialogComponent>);

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  /**
   * Get user-friendly label for warning code
   */
  protected getWarningLabel(warningCode: string): string {
    switch (warningCode) {
      case 'SAME_PATIENT_UNIT':
        return 'SAME PATIENT UNIT';
      case 'DIFFERENT_DONOR_UNIT':
        return 'DIFFERENT DONOR UNIT';
      case 'DONOR_NOT_ASSOCIATED':
        return 'DONOR NOT ASSOCIATED';
      case 'UNREGISTERED_UNIT':
        return 'UNREGISTERED UNIT';
      default:
        return 'WARNING';
    }
  }

  onNo(): void {
    this.dialogRef.close('cancel');
  }

  onYes(): void {
    this.dialogRef.close('override');
  }
}
