import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface EnterNotesDialogData {
  unitId: string;
  existingNote?: string;
}

export interface EnterNotesDialogResult {
  note: string;
}

@Component({
  selector: 'app-enter-notes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './enter-notes-dialog.html',
  styleUrl: './enter-notes-dialog.scss',
})
export class EnterNotesDialog {
  readonly noteControl = new FormControl('', [Validators.maxLength(240)]);
  readonly saving = signal(false);

  constructor(
    private readonly dialogRef: MatDialogRef<EnterNotesDialog, EnterNotesDialogResult | null>,
    @Inject(MAT_DIALOG_DATA) public readonly data: EnterNotesDialogData
  ) {
    if (data.existingNote) {
      this.noteControl.setValue(data.existingNote);
    }
  }

  get isAddDisabled(): boolean {
    return !this.noteControl.value?.trim() || this.noteControl.invalid || this.saving();
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onAdd(): void {
    if (this.noteControl.invalid) return;
    const note = this.noteControl.value?.trim() ?? '';
    if (!note) return;
    this.dialogRef.close({ note });
  }
}
