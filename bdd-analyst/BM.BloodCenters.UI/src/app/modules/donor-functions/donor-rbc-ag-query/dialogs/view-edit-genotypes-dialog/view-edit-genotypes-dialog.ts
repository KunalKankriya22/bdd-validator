import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

/**
 * Dialog data interface for genotype editing
 */
export interface ViewEditGenotypesDialogData {
  donorId: string;
  donorName: string;
  currentGenotype: string | null;
}

/**
 * Dialog result interface
 */
export interface ViewEditGenotypesDialogResult {
  action: 'save' | 'cancel';
  genotype?: string;
}

@Component({
  selector: 'app-view-edit-genotypes-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './view-edit-genotypes-dialog.html',
  styleUrl: './view-edit-genotypes-dialog.scss',
})
export class ViewEditGenotypesDialog {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `view-edit-genotypes-dialog-${ViewEditGenotypesDialog.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly dialogRef = inject(MatDialogRef<ViewEditGenotypesDialog>);
  readonly data: ViewEditGenotypesDialogData = inject(MAT_DIALOG_DATA);

  // Form control with 500 character limit
  genotypeControl = new FormControl(
    this.data.currentGenotype || '',
    [Validators.maxLength(500)]
  );

  // Computed character count
  protected readonly characterCount = computed(() => {
    const value = this.genotypeControl.value || '';
    return value.length;
  });

  protected readonly charactersRemaining = computed(() => {
    return 500 - this.characterCount();
  });

  protected readonly isValid = computed(() => {
    return this.genotypeControl.valid;
  });

  onSave(): void {
    if (this.genotypeControl.valid) {
      this.dialogRef.close({
        action: 'save',
        genotype: this.genotypeControl.value || '',
      } as ViewEditGenotypesDialogResult);
    }
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' } as ViewEditGenotypesDialogResult);
  }
}
