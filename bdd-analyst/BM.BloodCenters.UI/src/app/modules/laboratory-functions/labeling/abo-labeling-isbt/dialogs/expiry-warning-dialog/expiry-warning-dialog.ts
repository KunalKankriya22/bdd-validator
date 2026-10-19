import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

/**
 * Expiry Warning Dialog Component
 * Displays a warning when a product has already expired
 * Allows user to continue or cancel the operation
 */
@Component({
  selector: 'app-expiry-warning-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './expiry-warning-dialog.html',
  styleUrl: './expiry-warning-dialog.scss',
})
export class ExpiryWarningDialogComponent {
  private static nextId = 0;
  readonly componentId = `expiry-warning-dialog-${ExpiryWarningDialogComponent.nextId++}`;

  private readonly dialogRef = inject(MatDialogRef<ExpiryWarningDialogComponent>);

  readonly elementId = (name: string) => `${this.componentId}-${name}`;

  onNo(): void {
    this.dialogRef.close(false);
  }

  onYes(): void {
    this.dialogRef.close(true);
  }
}
