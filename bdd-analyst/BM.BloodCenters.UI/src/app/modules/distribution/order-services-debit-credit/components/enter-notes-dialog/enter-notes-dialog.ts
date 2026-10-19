import { Component, inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface EnterNotesDialogData {
  noteText?: string;
}

@Component({
  selector: 'app-enter-notes-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, A11yModule, MatButtonModule, MatDialogModule, MatInputModule, MatFormFieldModule],
  templateUrl: './enter-notes-dialog.html',
  styleUrl: './enter-notes-dialog.scss'
})
export class EnterNotesDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<EnterNotesDialogComponent>);
  private readonly data: EnterNotesDialogData | null = inject(MAT_DIALOG_DATA, { optional: true });

  noteText = this.data?.noteText ?? '';

  get canAdd(): boolean { return this.noteText.trim().length > 0; }

  onCancel(): void { this.dialogRef.close(null); }

  onAdd(): void {
    if (this.canAdd) {
      this.dialogRef.close(this.noteText.trim());
    }
  }
}
