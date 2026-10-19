import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';

export interface UploadProgressData {
  fileName: string;
  progress: number;
}

@Component({
  selector: 'app-upload-progress-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule
  ],
  templateUrl: './upload-progress-dialog.html',
  styleUrl: './upload-progress-dialog.scss'
})
export class UploadProgressDialog {
  private dialogRef = inject(MatDialogRef<UploadProgressDialog>);
  data = inject<UploadProgressData>(MAT_DIALOG_DATA);

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
