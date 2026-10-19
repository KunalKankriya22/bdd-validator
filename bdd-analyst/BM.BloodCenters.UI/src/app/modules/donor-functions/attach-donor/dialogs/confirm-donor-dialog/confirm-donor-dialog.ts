import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Confirm Donor Dialog Data
 */
export interface ConfirmDonorDialogData {
  donorId: string;
  donorName: string;
}

/**
 * Confirm Donor Dialog Result
 */
export type ConfirmDonorDialogResult = 'no' | 'yes' | 'right-donor';

/**
 * Confirm Donor Dialog Component
 * Displays warning dialog asking if the right donor is present in the list
 * Based on Figma screenshot AttachDonor3.png
 */
@Component({
  selector: 'app-confirm-donor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './confirm-donor-dialog.html',
  styleUrl: './confirm-donor-dialog.scss'
})
export class ConfirmDonorDialogComponent {
  private static nextId = 0;
  protected readonly componentId = `confirm-donor-dialog-${ConfirmDonorDialogComponent.nextId++}`;

  readonly data = inject<ConfirmDonorDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmDonorDialogComponent>);

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  /**
   * User clicked NO button
   * Close dialog and return 'no' result
   */
  onNo(): void {
    this.dialogRef.close('no');
  }

  /**
   * User clicked YES, RIGHT DONOR button
   * Close dialog and return 'right-donor' result
   */
  onRightDonor(): void {
    this.dialogRef.close('right-donor');
  }
}
