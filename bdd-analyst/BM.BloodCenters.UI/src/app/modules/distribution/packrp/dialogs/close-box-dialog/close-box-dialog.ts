import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

export interface CloseBoxDialogData {
  currentBoxId: string | null;
  hasPackedProducts: boolean;
}

export interface CloseBoxDialogResult {
  closeCurrentBox: boolean;
  allProperlyPacked: boolean;
}

@Component({
  selector: 'app-close-box-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatRadioModule,
    MatIconModule
  ],
  templateUrl: './close-box-dialog.html',
  styleUrl: './close-box-dialog.scss'
})
export class CloseBoxDialogComponent {
  private static nextId = 0;
  protected readonly componentId = `close-box-dialog-${CloseBoxDialogComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  readonly data = inject<CloseBoxDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CloseBoxDialogComponent>);

  protected readonly closeCurrentBox = signal<boolean | null>(null);
  protected readonly allProperlyPacked = signal<boolean | null>(null);
  protected readonly validationError = signal<string | null>(null);

  protected isValid(): boolean {
    if (this.closeCurrentBox() === null || this.allProperlyPacked() === null) {
      return false;
    }

    if (this.closeCurrentBox() === true && this.allProperlyPacked() === false) {
      return false;
    }

    return true;
  }

  protected onCloseBoxChange(value: boolean): void {
    this.closeCurrentBox.set(value);
    this.updateValidation();
  }

  protected onProperlyPackedChange(value: boolean): void {
    this.allProperlyPacked.set(value);
    this.updateValidation();
  }

  private updateValidation(): void {
    this.validationError.set(null);

    if (this.closeCurrentBox() === true && this.allProperlyPacked() === false) {
      this.validationError.set('Current box cannot be closed if it is not packed properly.');
    }
  }

  protected onCreate(): void {
    if (!this.isValid()) {
      if (this.closeCurrentBox() === null || this.allProperlyPacked() === null) {
        this.validationError.set('Please answer both questions before proceeding');
      }
      return;
    }

    const result: CloseBoxDialogResult = {
      closeCurrentBox: this.closeCurrentBox() === true,
      allProperlyPacked: this.allProperlyPacked() === true
    };

    this.dialogRef.close(result);
  }

  protected onCancel(): void {
    this.dialogRef.close(null);
  }
}
