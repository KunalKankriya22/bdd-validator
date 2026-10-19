import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { GenericNotesDialogData } from './generic-notes-dialog.model';

@Component({
  selector: 'app-generic-notes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './generic-notes-dialog.html',
  styleUrl: './generic-notes-dialog.scss',
})
export class GenericNotesDialog {
  private readonly dialogRef = inject(MatDialogRef<GenericNotesDialog>);
  readonly data: GenericNotesDialogData = inject(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }
}
