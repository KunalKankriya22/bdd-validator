import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-delete-note-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './delete-note-dialog.html',
  styleUrls: ['./delete-note-dialog.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DeleteNoteDialog {
  constructor(private dialogRef: MatDialogRef<DeleteNoteDialog>) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
