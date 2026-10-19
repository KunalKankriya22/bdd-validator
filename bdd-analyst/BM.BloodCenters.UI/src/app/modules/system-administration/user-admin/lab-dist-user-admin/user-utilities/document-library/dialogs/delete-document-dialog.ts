import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Dialog data interface
 */
export interface DeleteDocumentDialogData {
  documentName: string;
  fileSize?: string;
  title?: string;
  message?: string;
  confirmButtonText?: string;
}

/**
 * Delete Document Confirmation Dialog Component
 */
@Component({
  selector: 'app-delete-document-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './delete-document-dialog.html',
  styleUrls: ['./delete-document-dialog.scss']
})
export class DeleteDocumentDialogComponent {
  public dialogRef = inject(MatDialogRef<DeleteDocumentDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: DeleteDocumentDialogData) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  get isPdf(): boolean {
    return this.data.documentName?.toLowerCase().endsWith('.pdf') || false;
  }

  get isDoc(): boolean {
    const name = this.data.documentName?.toLowerCase() || '';
    return name.endsWith('.doc') || name.endsWith('.docx');
  }

  get isXls(): boolean {
    const name = this.data.documentName?.toLowerCase() || '';
    return name.endsWith('.xls') || name.endsWith('.xlsx');
  }

  getFileIcon(): string {
    if (this.isPdf) return 'picture_as_pdf';
    if (this.isDoc) return 'description';
    if (this.isXls) return 'grid_on';
    return 'insert_drive_file';
  }
}
