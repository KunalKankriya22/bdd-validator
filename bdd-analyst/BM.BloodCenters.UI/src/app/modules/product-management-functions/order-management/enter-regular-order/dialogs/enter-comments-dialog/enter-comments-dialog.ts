import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface EnterCommentsDialogData {
  notes?: string;
}

@Component({
  selector: 'app-enter-comments-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './enter-comments-dialog.html',
  styleUrls: ['./enter-comments-dialog.scss']
})
export class EnterCommentsDialogComponent {
  readonly data = inject<EnterCommentsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<EnterCommentsDialogComponent>);
  private readonly fb = inject(FormBuilder);

  commentsForm: FormGroup = this.fb.group({
    notes: [this.data.notes || '']
  });

  onSave(): void {
    this.dialogRef.close(this.commentsForm.get('notes')?.value);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
