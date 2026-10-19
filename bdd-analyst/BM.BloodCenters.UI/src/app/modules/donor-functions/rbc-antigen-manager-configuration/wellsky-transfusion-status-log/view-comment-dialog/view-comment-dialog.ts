import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-view-comment-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './view-comment-dialog.html',
  styleUrls: ['./view-comment-dialog.scss'],
})
export class ViewCommentDialog {
  private readonly dialogRef = inject(MatDialogRef<ViewCommentDialog>);
  readonly data: { comment: string } = inject(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }
}
