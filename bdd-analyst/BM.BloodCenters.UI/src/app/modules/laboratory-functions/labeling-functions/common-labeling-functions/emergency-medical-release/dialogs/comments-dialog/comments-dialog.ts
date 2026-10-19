import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

/**
 * Comments Dialog Data Interface
 */
export interface CommentsDialogData {
  comments: string;
  maxLength?: number;
}

/**
 * Comments Dialog Component
 * Reusable dialog for editing emergency medical release comments
 * Max characters: 500 (per API documentation)
 */
@Component({
  selector: 'app-comments-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './comments-dialog.html',
  styleUrls: ['./comments-dialog.scss'],
})
export class CommentsDialogComponent {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `comments-dialog-${CommentsDialogComponent.nextId++}`;

  // Generate unique IDs for elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  form: FormGroup;
  maxLength: number;

  // Signal for character count
  protected readonly currentLength = signal<number>(0);
  protected readonly charactersRemaining = computed(() =>
    this.maxLength - this.currentLength()
  );

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<CommentsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CommentsDialogData
  ) {
    this.maxLength = data.maxLength || 240;

    this.form = this.fb.group({
      comments: [
        data.comments || '',
        [Validators.maxLength(this.maxLength)]
      ],
    });

    // Update character count signal
    this.currentLength.set((data.comments || '').length);

    // Track changes to update character count
    this.form.get('comments')?.valueChanges.subscribe((value: string) => {
      this.currentLength.set((value || '').length);
    });
  }

  get f() {
    return this.form.controls;
  }

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value.comments);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
