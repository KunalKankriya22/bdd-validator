import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';

export interface FileUploadEvent {
  file: File;
  isValid: boolean;
  error?: string;
}

/**
 * Reusable File Upload Zone Component
 * Supports drag-and-drop, file browsing, progress display, and validation
 */
@Component({
  selector: 'app-file-upload-zone',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule
  ],
  templateUrl: './file-upload-zone.html',
  styleUrl: './file-upload-zone.scss'
})
export class FileUploadZoneComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Input() placeholderText = 'Drag and drop your files here';
  @Input() browseText = 'browse files';
  @Input() acceptedFileTypes = '*';
  @Input() maxFileSizeMB = 20;
  @Input() disabled = false;
  @Input() showRemoveButton = true;
  @Input() showSuccessIcon = true;
  @Input() uploadProgress = 0;
  @Input() displayName?: string; // Optional display name override (for truncated filenames)

  @Output() fileSelected = new EventEmitter<FileUploadEvent>();
  @Output() fileRemoved = new EventEmitter<void>();
  @Output() progressUpdate = new EventEmitter<number>();

  selectedFile: File | null = null;
  isDragOver = false;
  errorMessage = '';

  onDragOver(event: DragEvent): void {
    if (this.disabled || this.selectedFile) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    if (this.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    if (this.disabled || this.selectedFile) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      this.handleFile(target.files[0]);
    }
  }

  private handleFile(file: File): void {
    this.errorMessage = '';

    // Validate file size
    const maxSizeInBytes = this.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      this.errorMessage = `File size (${fileSizeInMB}MB) exceeds the maximum allowed size of ${this.maxFileSizeMB}MB`;
      this.fileSelected.emit({
        file,
        isValid: false,
        error: this.errorMessage
      });
      return;
    }

    // Validate file type if specified
    if (this.acceptedFileTypes !== '*') {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const acceptedExtensions = this.acceptedFileTypes.split(',').map(ext => ext.trim().toLowerCase());
      if (!acceptedExtensions.includes(fileExtension)) {
        this.errorMessage = `File type not allowed. Accepted types: ${this.acceptedFileTypes}`;
        this.fileSelected.emit({
          file,
          isValid: false,
          error: this.errorMessage
        });
        return;
      }
    }

    this.selectedFile = file;
    this.fileSelected.emit({
      file,
      isValid: true
    });
  }

  onRemove(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.errorMessage = '';
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.fileRemoved.emit();
  }

  /**
   * Get file icon based on file type
   */
  getFileIcon(): string {
    if (!this.selectedFile) return 'insert_drive_file';
    const name = this.selectedFile.name.toLowerCase();
    if (name.endsWith('.pdf')) return 'picture_as_pdf';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return 'description';
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'grid_on';
    if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')) return 'image';
    if (name.endsWith('.zip') || name.endsWith('.rar')) return 'folder_zip';
    return 'insert_drive_file';
  }

  /**
   * Get CSS class for file icon based on file type
   */
  getFileIconClass(): string {
    if (!this.selectedFile) return '';
    const name = this.selectedFile.name.toLowerCase();
    if (name.endsWith('.pdf')) return 'file-icon-pdf';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return 'file-icon-doc';
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'file-icon-xls';
    if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')) return 'file-icon-image';
    return '';
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + sizes[i];
  }

  /**
   * Reset the component state
   */
  reset(): void {
    this.selectedFile = null;
    this.errorMessage = '';
    this.isDragOver = false;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
