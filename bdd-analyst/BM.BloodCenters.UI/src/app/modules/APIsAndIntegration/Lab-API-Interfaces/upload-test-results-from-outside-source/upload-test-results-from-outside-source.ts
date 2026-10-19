import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { Chapters } from '../../../application-admin/chapter/services/chapters';
import { getDateInTimezone } from '@shared/date/timezone.util';
import { HeaderService } from '@shared/services/header.service';

import { UploadTestResultsApiService } from './services/upload-test-results-api.service';
import { ChapterOption, FileUploadItem } from './models/upload-test-results.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

@Component({
  selector: 'app-upload-test-results-from-outside-source',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatIconModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './upload-test-results-from-outside-source.html',
  styleUrls: ['./upload-test-results-from-outside-source.scss']
})
export class UploadTestResultsFromOutsideSourceComponent implements OnInit, OnDestroy {
  readonly headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Upload Test Results', link: null }
    ]
  };

  uploadForm!: FormGroup;
  chapters: ChapterOption[] = [];
  filteredChapters: ChapterOption[] = [];
  chapterSearchControl = new FormControl('');
  selectedChapter: ChapterOption | null = null;
  uploadedFiles: FileUploadItem[] = [];
  isLoadingChapters = false;
  isUploading = false;
  chapterLocalDate: string = '';
  isDragging = false;
  showUploadArea = false;
  browseFileLocation = '';
  showFileValidationError = false;
  fileValidationErrorMessage = '';
  statusMessage = ''; // WCAG: For ARIA live region announcements
  private fileDialogOpened = false;
  private activeIntervals: number[] = [];
  private windowFocusListener: (() => void) | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private apiService: UploadTestResultsApiService,
    private chaptersService: Chapters,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    private headerService: HeaderService
  ) {
    this.initializeForm();
  }

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  private getChapterCurrentDate(): Date {
    const chapterToday = moment().utcOffset(this.chapterOffset).startOf('day');
    const today = moment(chapterToday.format('YYYY-MM-DD')).startOf('day');
    return today.toDate();
  }

  ngOnInit(): void {
    this.loadChapters();
    this.loadFileLocation();
    this.setupChapterSearch();
    this.setupFileDialogListener();
  }

  ngOnDestroy(): void {
    // Clear all active intervals to prevent memory leaks
    this.activeIntervals.forEach(intervalId => clearInterval(intervalId));
    this.activeIntervals = [];

    // Remove window focus event listener to prevent memory leaks
    if (this.windowFocusListener) {
      window.removeEventListener('focus', this.windowFocusListener);
      this.windowFocusListener = null;
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.uploadForm = this.fb.group({
      chapterId: ['', [Validators.required]]
    });

    // Show upload area when chapter is selected
    this.uploadForm.get('chapterId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.showUploadArea = !!value;
        if (!value) {
          this.uploadedFiles = [];
          this.selectedChapter = null;
          this.chapterLocalDate = '';
        } else {
          // Find selected chapter
          this.selectedChapter = this.chapters.find(c => c.chapterId === value) || null;
          // Fetch chapter details to get timezone and compute local date
          this.chaptersService.getChapterById(value)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (chapter) => {
                if (chapter.timeZone && chapter.timeZone !== 'UTC') {
                  try {
                    const { year, month, day } = getDateInTimezone(chapter.timeZone);
                    this.chapterLocalDate = this.formatDate(new Date(year, month, day));
                  } catch {
                    this.chapterLocalDate = this.formatDate(new Date());
                  }
                } else {
                  this.chapterLocalDate = this.formatDate(new Date());
                }
              },
              error: () => {
                this.chapterLocalDate = this.formatDate(new Date());
              }
            });
        }
      });
  }

  private loadFileLocation(): void {
    this.apiService.getFileLocation()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.browseFileLocation = response?.data?.browse_file_location ?? '';
        },
        error: () => {
          this.browseFileLocation = '';
        }
      });
  }

  private loadChapters(): void {
    this.isLoadingChapters = true;
    this.apiService.getChapters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (chapters) => {
          // Filter chapters based on effective and termination dates using chapter's current date
          const chapterCurrentDate = this.getChapterCurrentDate();

          this.chapters = chapters.sort((a, b) => a.chapterId.localeCompare(b.chapterId)).filter(chapter => {
            // If no dates provided, include the chapter
            if (!chapter.effectiveDate && !chapter.terminationDate) {
              return true;
            }

            let isValid = true;

            // Check effective date - chapter should be effective by now
            if (chapter.effectiveDate) {
              const effectiveDate = moment(chapter.effectiveDate).startOf('day').toDate();
              isValid = isValid && chapterCurrentDate >= effectiveDate;
            }

            // Check termination date - chapter should not be terminated yet
            if (chapter.terminationDate) {
              const terminationDate = moment(chapter.terminationDate).startOf('day').toDate();
              isValid = isValid && chapterCurrentDate <= terminationDate;
            }

            return isValid;
          });

          this.filteredChapters = this.chapters;
          this.isLoadingChapters = false;
        },
        error: (error) => {
          console.error('Error loading chapters:', error);
          this.isLoadingChapters = false;
          // Error handling is now done by HTTP interceptor
        }
      });
  }

  private setupChapterSearch(): void {
    this.chapterSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredChapters = this.chapters
          .filter(chapter =>
            chapter.chapterId.toLowerCase().includes(term) ||
            chapter.chapterName.toLowerCase().includes(term)
          )
          .sort((a, b) => a.chapterId.localeCompare(b.chapterId));
      });
  }

  private setupFileDialogListener(): void {
    this.windowFocusListener = () => {
      if (this.fileDialogOpened) {
        // Small delay to ensure the file input change event has time to fire
        setTimeout(() => {
          this.ngZone.run(() => {
            // Check again if still waiting for file selection
            // If onFileSelect already ran, it would have set this to false
            if (!this.fileDialogOpened) {
              return;
            }

            const fileInput = document.getElementById('file-input') as HTMLInputElement;
            // Only show error if user canceled AND there are no files already uploaded
            if (fileInput && (!fileInput.files || fileInput.files.length === 0) && this.uploadedFiles.length === 0) {
              // User canceled the file dialog without selecting files and no files exist
              this.showFileValidationError = true;
              this.fileValidationErrorMessage = 'File is required';
            }
            this.fileDialogOpened = false;
          });
        }, 300);
      }
    };
    window.addEventListener('focus', this.windowFocusListener);
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      this.fileDialogOpened = true;
      fileInput.click();
    }
  }

  onSpaceKey(event: KeyboardEvent): void {
    event.preventDefault(); // Prevent page scroll
    this.triggerFileInput();
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fileDialogOpened = false;
    if (input.files && input.files.length > 0) {
      this.addFiles(Array.from(input.files));
      // Reset file input
      input.value = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
    this.showFileValidationError = false;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.addFiles(Array.from(files));
    }
  }

  private addFiles(files: File[]): void {
    // Filter for .txt files only
    const txtFiles = files.filter(file =>
      file.name.toLowerCase().endsWith('.txt')
    );

    if (txtFiles.length === 0) {
      this.snackBar.open('Only .txt files are allowed', 'Dismiss', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        politeness: 'assertive'
      });
      return;
    }

    // Filter out empty files (0 bytes)
    const emptyFiles = txtFiles.filter(file => file.size === 0);
    const nonEmptyFiles = txtFiles.filter(file => file.size > 0);

    if (emptyFiles.length > 0) {
      this.snackBar.open('File cannot be empty', 'Dismiss', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        politeness: 'assertive'
      });
    }

    if (nonEmptyFiles.length === 0) {
      return;
    }

    // Check for duplicate files
    const newFiles = nonEmptyFiles.filter(file => {
      return !this.uploadedFiles.some(item =>
        item.file.name === file.name && item.file.size === file.size
      );
    });

    if (newFiles.length < nonEmptyFiles.length) {
      this.snackBar.open('Some files were already added', 'Dismiss', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }

    // Add new files to the list and start progress simulation
    newFiles.forEach(file => {
      const fileItem: FileUploadItem = {
        file,
        progress: 0,
        status: 'uploading'
      };
      this.uploadedFiles.push(fileItem);

      // Start progress simulation for this file
      this.simulateFileProgress(fileItem);
    });

    // Clear validation error when files are added
    if (newFiles.length > 0) {
      this.showFileValidationError = false;
    }
  }

  private simulateFileProgress(fileItem: FileUploadItem): void {
    const progressInterval = window.setInterval(() => {
      if (fileItem.progress < 100 && fileItem.status === 'uploading') {
        fileItem.progress += 10;
        if (fileItem.progress >= 100) {
          fileItem.progress = 100;
          fileItem.status = 'pending'; // Ready to upload
          this.clearInterval(progressInterval);
        }
      } else {
        this.clearInterval(progressInterval);
      }
    }, 200);

    // Track the interval for cleanup
    this.activeIntervals.push(progressInterval);
  }

  private clearInterval(intervalId: number): void {
    clearInterval(intervalId);
    // Remove from active intervals array
    const index = this.activeIntervals.indexOf(intervalId);
    if (index > -1) {
      this.activeIntervals.splice(index, 1);
    }
  }

  onRemoveFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
    if (this.uploadedFiles.length === 0) {
      this.showFileValidationError = false;
      // WCAG 2.4.3: Move focus to drag-drop zone when all files removed
      setTimeout(() => {
        const dropZone = document.querySelector('.drag-drop-zone') as HTMLElement;
        dropZone?.focus();
      }, 100);
    } else if (index > 0) {
      // WCAG 2.4.3: Move focus to previous file's delete button
      setTimeout(() => {
        const prevDeleteBtn = document.querySelectorAll('.delete-file-btn')[index - 1] as HTMLElement;
        prevDeleteBtn?.focus();
      }, 100);
    } else {
      // WCAG 2.4.3: Move focus to next file's delete button (now at index 0)
      setTimeout(() => {
        const nextDeleteBtn = document.querySelector('.delete-file-btn') as HTMLElement;
        nextDeleteBtn?.focus();
      }, 100);
    }
  }

  onUpload(): void {
    if (this.uploadForm.invalid || this.uploadedFiles.length === 0) {
      this.uploadForm.markAllAsTouched();
      // Mark chapterId as dirty to show validation error
      this.uploadForm.get('chapterId')?.markAsDirty();
      if (this.uploadedFiles.length === 0) {
        this.showFileValidationError = true;
        this.fileValidationErrorMessage = 'File is required';
        this.snackBar.open('Please select at least one file to upload', 'Dismiss', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          politeness: 'assertive'
        });
      }
      return;
    }

    // Filter only pending files
    const pendingFiles = this.uploadedFiles.filter(item => item.status === 'pending');
    if (pendingFiles.length === 0) {
      this.snackBar.open('All files have already been uploaded', 'Dismiss', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      return;
    }

    this.isUploading = true;
    this.showFileValidationError = false;
    const chapterId = this.uploadForm.value.chapterId;

    // Set all pending files to uploading (they already have 100% progress)
    pendingFiles.forEach(fileItem => {
      fileItem.status = 'uploading';
    });

    // Upload all files in one request
    const filesToUpload = pendingFiles.map(item => item.file);

    this.apiService.uploadTestResults(chapterId, filesToUpload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Upload response:', response);

          // Update status based on fileResults
          if (response.fileResults && response.fileResults.length > 0) {
            response.fileResults.forEach(fileResult => {
              const fileItem = this.uploadedFiles.find(
                item => item.file.name === fileResult.fileName
              );

              if (fileItem) {
                if (fileResult.status === 'success') {
                  fileItem.status = 'success';
                  fileItem.progress = 100;
                } else {
                  // Mark failed file with error status and message
                  fileItem.status = 'error';
                  fileItem.errorMessage = fileResult.message || 'Upload failed';
                }
              }
            });
          }

          this.isUploading = false;

          // Show success message if any files succeeded
          if (response.successCount > 0) {
            // WCAG: Announce to screen readers via live region
            this.statusMessage = `${response.successCount} file(s) uploaded successfully. Form has been reset.`;
            this.snackBar.open(response.message || `${response.successCount} file(s) uploaded successfully`, 'Dismiss', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              politeness: 'polite'
            });
            // Clear status message after announcement
            setTimeout(() => this.statusMessage = '', 100);
          }

          // Only reset completely if ALL files succeeded
          if (response.failedCount === 0) {
            // Reset to initial state after all files uploaded successfully
            this.uploadForm.reset({
              chapterId: ''
            });
            this.uploadForm.markAsUntouched();
            this.uploadForm.markAsPristine();
            this.uploadForm.get('chapterId')?.setErrors(null);
            this.uploadedFiles = [];
            this.showUploadArea = false;
            this.selectedChapter = null;
            this.chapterLocalDate = '';
            this.showFileValidationError = false;

            // WCAG: Refocus on chapter selector for keyboard users
            setTimeout(() => {
              const chapterSelect = document.querySelector('mat-select[formControlName="chapterId"]') as HTMLElement;
              chapterSelect?.focus();
            }, 100);
          } else {
            // Some files failed - remove only successful files and keep failed ones visible
            this.uploadedFiles = this.uploadedFiles.filter(file => file.status !== 'success');
            this.showFileValidationError = true;
            this.fileValidationErrorMessage = `${response.failedCount} file(s) failed to upload`;
          }
        },
        error: (error) => {
          console.error('Error uploading files:', error);
          this.isUploading = false;

          const errorMessage = error?.error?.message || 'Failed to upload files';

          // Mark all pending files as failed with error status
          pendingFiles.forEach(fileItem => {
            fileItem.status = 'error';
            fileItem.errorMessage = errorMessage;
          });

          // Show validation error
          this.showFileValidationError = true;
          this.fileValidationErrorMessage = 'Failed to upload document';

          // Error handling is now done by HTTP interceptor
        }
      });
  }

  onCancel(): void {
    this.uploadForm.reset({
      chapterId: ''
    });
    this.uploadedFiles = [];
    this.showUploadArea = false;
    this.isUploading = false;
    this.selectedChapter = null;
    this.chapterLocalDate = '';
    this.showFileValidationError = false;
  }

  formatDate(date: Date): string {
    return DateFieldValidationUtility.formatDateForUI(date);
  }

  get chapterControl() {
    return this.uploadForm.get('chapterId');
  }

  get hasPendingFiles(): boolean {
    // Enable upload button only when:
    // 1. There are files
    // 2. All files have completed progress (status is 'pending' and progress is 100)
    // 3. Not currently uploading
    return this.uploadedFiles.length > 0 &&
           this.uploadedFiles.every(f => f.status === 'pending' && f.progress === 100) &&
           !this.isUploading;
  }

  get hasFiles(): boolean {
    return this.uploadedFiles.length > 0;
  }

  get uploadHeading(): string {
    const fileCount = this.uploadedFiles.length;
    if (fileCount === 0) {
      return 'Upload File';
    } else if (fileCount === 1) {
      return 'Upload Contract (1)';
    } else {
      return `Upload Contract (${fileCount})`;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i];
  }
}
