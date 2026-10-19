import { Component, Input, signal, inject, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-manual-upload-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './manual-upload-tab.html',
  styleUrls: ['./manual-upload-tab.scss'],
})
export class ManualUploadTab implements OnChanges {
  @Input() chapterId!: string;
  @Input() instrumentId!: string;
  @Input() instrumentDesc: string = '';

  @ViewChild('fileSelect') fileSelect!: MatSelect;

  private instrumentService = inject(InstrumentInterfaceService);
  private snackbarService = inject(SnackbarService);

  selectedFileId = signal<string>('');
  uploading = signal<boolean>(false);
  fileIds = signal<string[]>([]);
  loading = signal<boolean>(false);
  errorMessage = signal<string>('');
  errorTitle = signal<string>('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chapterId'] || changes['instrumentId']) {
      this.selectedFileId.set('');
      this.fileIds.set([]);
      this.loading.set(false);
      this.uploading.set(false);
      this.clearError();
    }
  }

  clearError(): void {
    this.errorMessage.set('');
    this.errorTitle.set('');
  }

  loadPendingFileIds(): void {
    if (!this.chapterId || !this.instrumentId) {
      this.snackbarService.showError('Please select both Chapter ID and Instrument ID before retrieving pending files.');
      return;
    }

    this.clearError();
    this.loading.set(true);
    this.selectedFileId.set('');

    this.instrumentService.getPendingFileIds(this.chapterId, this.instrumentId).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success && response.data) {
          const fileIdList = response.data.map((item: any) => item.fileId || item);
          this.fileIds.set(fileIdList);
        } else {
          this.fileIds.set([]);
        }
      },
      error: () => {
        this.loading.set(false);
        this.fileIds.set([]);
        this.snackbarService.showError('Unable to retrieve pending file list. Please try again or contact support.');
      },
    });
  }

  onUpload(): void {
    if (!this.chapterId) {
      this.snackbarService.showError('Chapter ID is required.');
      return;
    }
    if (!this.instrumentId) {
      this.snackbarService.showError('Instrument ID is required.');
      return;
    }
    if (!this.selectedFileId()) {
      this.snackbarService.showError('Please select a File ID before uploading.');
      return;
    }

    this.clearError();
    this.uploading.set(true);

    this.instrumentService.manualUpload(this.chapterId, this.instrumentId, this.selectedFileId()).subscribe({
      next: (response) => {
        this.uploading.set(false);
        if (response.success) {
          this.snackbarService.showSuccess(response.message || 'File has been loaded successfully.');
          this.selectedFileId.set('');
          this.loadPendingFileIds();
          this.focusFileSelect();
        } else {
          this.errorTitle.set('Upload Aborted');
          this.errorMessage.set(
            response.errorResponse?.error || response.error ||
            'The file has been aborted. Please refer to the log file for details.'
          );
          this.focusFileSelect();
        }
      },
      error: (err: any) => {
        this.uploading.set(false);
        const message = err?.error?.errorResponse?.error || err?.error?.error ||
          'An unexpected error occurred during upload. Please try again.';
        this.errorTitle.set('Upload Failed');
        this.errorMessage.set(message);
        this.focusFileSelect();
      },
    });
  }

  private focusFileSelect(): void {
    setTimeout(() => {
      this.fileSelect?.focus();
    });
  }
}
