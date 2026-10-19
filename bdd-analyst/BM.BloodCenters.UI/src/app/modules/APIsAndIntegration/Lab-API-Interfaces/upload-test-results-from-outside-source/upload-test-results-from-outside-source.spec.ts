import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { UploadTestResultsFromOutsideSourceComponent } from './upload-test-results-from-outside-source';
import { UploadTestResultsApiService } from './services/upload-test-results-api.service';
import { ChapterOption, FileLocationResponse, UploadTestResultsResponseDto } from './models/upload-test-results.model';
import { HeaderService } from '@shared/services/header.service';
import { Chapters } from '../../../application-admin/chapter/services/chapters';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('UploadTestResultsFromOutsideSourceComponent', () => {
  let snackBarSpy: any;
  let chaptersServiceSpy: any;
  let headerServiceSpy: any;
  let apiServiceSpy: any;
  let component: UploadTestResultsFromOutsideSourceComponent;
  let fixture: ComponentFixture<UploadTestResultsFromOutsideSourceComponent>;
  let apiService: jasmine.SpyObj<UploadTestResultsApiService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let chaptersService: jasmine.SpyObj<Chapters>;

  // Use UTC dates to match the component's getChapterCurrentDate() which uses UTC offset
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const mockChapters: ChapterOption[] = [
    {
      chapterId: '001',
      chapterName: 'Chapter One',
      chapterCode: 'CH1',
      effectiveDate: yesterday.toISOString(),
      terminationDate: tomorrow.toISOString()
    },
    {
      chapterId: '002',
      chapterName: 'Chapter Two',
      chapterCode: 'CH2',
      effectiveDate: yesterday.toISOString(),
      terminationDate: tomorrow.toISOString()
    },
    {
      chapterId: '003',
      chapterName: 'Chapter Three',
      chapterCode: 'CH3',
      effectiveDate: yesterday.toISOString(),
      terminationDate: tomorrow.toISOString()
    }
  ];

  const mockFileLocationResponse: FileLocationResponse = {
    success: true,
    message: 'File location retrieved successfully.',
    statusCode: 200,
    data: {
      browse_file_location: 'C:\\TestResults\\Incoming'
    }
  };

  const mockChapterDetails = {
    chapterId: '001',
    chapterName: 'Chapter One',
    shortName: 'CH1',
    timeZone: 'America/New_York',
    effectiveDate: yesterday.toISOString(),
    terminationDate: tomorrow.toISOString()
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('UploadTestResultsApiService', [
      'getChapters',
      'uploadTestResults',
      'getFileLocation'
    ]);
    snackBarSpy = createMockMatSnackBar();
    headerServiceSpy = createMockHeaderService();
    chaptersServiceSpy = jasmine.createSpyObj('Chapters', ['getChapterById']);

    TestBed.configureTestingModule({
      imports: [
        UploadTestResultsFromOutsideSourceComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: UploadTestResultsApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: Chapters, useValue: chaptersServiceSpy },
        provideRouter([]),
        provideHttpClient()
      ]
    })
    .overrideComponent(UploadTestResultsFromOutsideSourceComponent, {
      set: {
        providers: [
          { provide: MatSnackBar, useValue: snackBarSpy }
        ]
      }
    });

    apiService = TestBed.inject(UploadTestResultsApiService) as jasmine.SpyObj<UploadTestResultsApiService>;
    snackBar = snackBarSpy;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    chaptersService = TestBed.inject(Chapters) as jasmine.SpyObj<Chapters>;

    chaptersService.getChapterById.and.returnValue(of(mockChapterDetails as any));
    apiService.getChapters.and.returnValue(of(mockChapters));
    apiService.getFileLocation.and.returnValue(of(mockFileLocationResponse));

    fixture = TestBed.createComponent(UploadTestResultsFromOutsideSourceComponent);
    component = fixture.componentInstance;
  });

  describe('Form Initialization', () => {
    it('should initialize the form with default values', () => {
      expect(component.uploadForm).toBeDefined();
      expect(component.uploadForm.get('chapterId')?.value).toBe('');
    });

    it('should have required validator on chapterId field', () => {
      const chapterIdControl = component.uploadForm.get('chapterId');
      expect(chapterIdControl?.hasError('required')).toBe(true);
    });

  });

  describe('ngOnInit', () => {
    it('should load chapters on initialization', () => {
      fixture.detectChanges();

      expect(apiService.getChapters).toHaveBeenCalled();
      expect(component.chapters).toEqual(mockChapters);
      expect(component.isLoadingChapters).toBe(false);
    });


    it('should handle error when loading chapters fails', fakeAsync(() => {
      const error = {
        error: {
          message: 'Failed to load chapters',
          statusCode: 500
        },
        status: 500
      };
      apiService.getChapters.and.returnValue(throwError(() => error));

      fixture.detectChanges();
      tick();

      expect(component.isLoadingChapters).toBe(false);
      // Error handling is now done by HTTP interceptor
    }));

  });

  describe('loadFileLocation', () => {
    it('should set browseFileLocation from API response on success', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.browseFileLocation).toBe('C:\\TestResults\\Incoming');
    }));

    it('should set browseFileLocation to empty string on error', fakeAsync(() => {
      apiService.getFileLocation.and.returnValue(throwError(() => ({ status: 404 })));

      fixture.detectChanges();
      tick();

      expect(component.browseFileLocation).toBe('');
    }));

    it('should set browseFileLocation to empty string when data is missing', fakeAsync(() => {
      const responseWithoutData: any = {
        success: false,
        message: 'File location not found.',
        statusCode: 404,
        data: null
      };
      apiService.getFileLocation.and.returnValue(of(responseWithoutData));

      fixture.detectChanges();
      tick();

      expect(component.browseFileLocation).toBe('');
    }));
  });

  describe('Chapter Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show upload area when chapter is selected', () => {
      component.uploadForm.patchValue({ chapterId: '001' });
      expect(component.showUploadArea).toBe(true);
    });

    it('should set selectedChapter when chapter is selected', () => {
      component.uploadForm.patchValue({ chapterId: '001' });
      expect(component.selectedChapter).toEqual(mockChapters[0]);
    });

    it('should clear uploaded files when chapter is deselected', () => {
      component.uploadForm.patchValue({ chapterId: '001' });
      component.uploadedFiles = [
        { file: new File(['test'], 'test.txt'), progress: 0, status: 'pending' }
      ];

      component.uploadForm.patchValue({ chapterId: '' });

      expect(component.uploadedFiles).toEqual([]);
      expect(component.showUploadArea).toBe(false);
      expect(component.selectedChapter).toBeNull();
    });
  });

  describe('File Selection', () => {
    let mockFile: File;

    beforeEach(() => {
      fixture.detectChanges();
      component.uploadForm.patchValue({ chapterId: '001' });
      mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should add valid .txt files to uploadedFiles array', () => {
      component['addFiles']([mockFile]);

      expect(component.uploadedFiles.length).toBe(1);
      expect(component.uploadedFiles[0].file.name).toBe('test.txt');
      expect(component.uploadedFiles[0].status).toBe('uploading');
      expect(component.uploadedFiles[0].progress).toBe(0);
    });

    it('should reject non-.txt files', () => {
      const invalidFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      snackBar.open.calls.reset();

      component['addFiles']([invalidFile]);

      expect(component.uploadedFiles.length).toBe(0);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Only .txt files are allowed',
        'Dismiss',
        jasmine.objectContaining({
          duration: 3000
        })
      );
    });

    it('should prevent duplicate files from being added', () => {
      component['addFiles']([mockFile]);
      snackBar.open.calls.reset();

      component['addFiles']([mockFile]);

      expect(component.uploadedFiles.length).toBe(1);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Some files were already added',
        'Dismiss',
        jasmine.any(Object)
      );
    });

    it('should start progress simulation when files are added', () => {
      component['addFiles']([mockFile]);

      expect(component.uploadedFiles[0].progress).toBe(0);
      expect(component.uploadedFiles[0].status).toBe('uploading');

      // Simulate progress intervals (200ms * 10 = 2000ms total)
      jasmine.clock().tick(200);
      expect(component.uploadedFiles[0].progress).toBe(10);

      jasmine.clock().tick(1800);
      expect(component.uploadedFiles[0].progress).toBe(100);
      expect(component.uploadedFiles[0].status).toBe('pending');
    });

    it('should reject empty (0 bytes) files', () => {
      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });
      snackBar.open.calls.reset();

      component['addFiles']([emptyFile]);

      expect(component.uploadedFiles.length).toBe(0);
      expect(snackBar.open).toHaveBeenCalledWith(
        'File cannot be empty',
        'Dismiss',
        jasmine.objectContaining({
          duration: 3000
        })
      );
    });

    it('should accept non-empty files and reject empty files from the same batch', () => {
      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });
      const validFile = new File(['test content'], 'valid.txt', { type: 'text/plain' });
      snackBar.open.calls.reset();

      component['addFiles']([emptyFile, validFile]);

      expect(component.uploadedFiles.length).toBe(1);
      expect(component.uploadedFiles[0].file.name).toBe('valid.txt');
      expect(snackBar.open).toHaveBeenCalledWith(
        'File cannot be empty',
        'Dismiss',
        jasmine.objectContaining({
          duration: 3000
        })
      );
    });

    it('should clear file validation error when files are added', () => {
      component.showFileValidationError = true;
      component.fileValidationErrorMessage = 'File is required';

      component['addFiles']([mockFile]);

      expect(component.showFileValidationError).toBe(false);
    });
  });

  describe('Drag and Drop', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.uploadForm.patchValue({ chapterId: '001' });
    });

    it('should set isDragging to true on dragover', () => {
      const event = new DragEvent('dragover');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      component.onDragOver(event);

      expect(component.isDragging).toBe(true);
      expect(component.showFileValidationError).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should set isDragging to false on dragleave', () => {
      component.isDragging = true;
      const event = new DragEvent('dragleave');
      spyOn(event, 'preventDefault');

      component.onDragLeave(event);

      expect(component.isDragging).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should add files on drop', () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);

      const event = new DragEvent('drop', { dataTransfer });
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      component.onDrop(event);

      expect(component.isDragging).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.uploadedFiles.length).toBe(1);
    });
  });

  describe('File Upload', () => {
    let mockFile: File;
    let mockResponse: UploadTestResultsResponseDto;

    beforeEach(() => {
      fixture.detectChanges();
      component.uploadForm.patchValue({ chapterId: '001' });
      mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

      mockResponse = {
        message: 'Files uploaded successfully',
        totalFilesProcessed: 1,
        successCount: 1,
        failedCount: 0,
        skippedCount: 0,
        totalRecordsProcessed: 10,
        ltInterfaceFilesCount: 1,
        testResultStagingsCount: 10,
        fileResults: [
          {
            fileName: 'test.txt',
            status: 'success',
            message: 'Processed successfully',
            recordCount: 10,
            isLifetrakFormat: true
          }
        ]
      };
    });


    it('should not submit if no files are uploaded', () => {
      snackBar.open.calls.reset();
      component.onUpload();

      expect(apiService.uploadTestResults).not.toHaveBeenCalled();
      expect(component.showFileValidationError).toBe(true);
      expect(component.fileValidationErrorMessage).toBe('File is required');
      expect(snackBar.open).toHaveBeenCalledWith(
        'Please select at least one file to upload',
        'Dismiss',
        jasmine.any(Object)
      );
    });

    it('should upload pending files successfully', fakeAsync(() => {
      component.uploadedFiles = [
        { file: mockFile, progress: 100, status: 'pending' }
      ];

      apiService.uploadTestResults.and.returnValue(of(mockResponse));
      snackBar.open.calls.reset();

      component.onUpload();
      tick();

      expect(apiService.uploadTestResults).toHaveBeenCalledWith('001', [mockFile]);
      expect(component.isUploading).toBe(false);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Files uploaded successfully',
        'Dismiss',
        jasmine.objectContaining({
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        })
      );
    }));

    it('should reset form after successful upload', fakeAsync(() => {
      component.uploadedFiles = [
        { file: mockFile, progress: 100, status: 'pending' }
      ];

      apiService.uploadTestResults.and.returnValue(of(mockResponse));

      component.onUpload();
      tick();

      expect(component.uploadForm.get('chapterId')?.value).toBe('');
      expect(component.uploadedFiles).toEqual([]);
      expect(component.showUploadArea).toBe(false);
      expect(component.selectedChapter).toBeNull();
      expect(component.showFileValidationError).toBe(false);
    }));

    it('should update file status to success based on fileResults', fakeAsync(() => {
      component.uploadedFiles = [
        { file: mockFile, progress: 100, status: 'pending' }
      ];

      apiService.uploadTestResults.and.returnValue(of(mockResponse));

      component.onUpload();
      tick();

      expect(component.uploadedFiles.length).toBe(0); // File removed after successful upload and reset
    }));

    it('should handle upload error', fakeAsync(() => {
      const error = {
        error: {
          message: 'Upload failed',
          statusCode: 500
        },
        status: 500
      };

      component.uploadedFiles = [
        { file: mockFile, progress: 100, status: 'pending' }
      ];

      apiService.uploadTestResults.and.returnValue(throwError(() => error));

      component.onUpload();
      tick();

      expect(component.isUploading).toBe(false);
      expect(component.showFileValidationError).toBe(true);
      expect(component.fileValidationErrorMessage).toBe('Failed to upload document');
      // Error handling is now done by HTTP interceptor
    }));

    it('should mark failed files with error status on upload error', fakeAsync(() => {
      const error = { error: { message: 'Upload failed' } };

      component.uploadedFiles = [
        { file: mockFile, progress: 100, status: 'pending' }
      ];

      apiService.uploadTestResults.and.returnValue(throwError(() => error));

      component.onUpload();
      tick();

      expect(component.uploadedFiles.length).toBe(1);
      expect(component.uploadedFiles[0].status).toBe('error');
      expect(component.uploadedFiles[0].errorMessage).toBe('Upload failed');
    }));

    it('should only upload files with pending status', () => {
      const file1 = new File(['test1'], 'test1.txt');
      const file2 = new File(['test2'], 'test2.txt');

      component.uploadedFiles = [
        { file: file1, progress: 100, status: 'pending' },
        { file: file2, progress: 100, status: 'success' }
      ];

      apiService.uploadTestResults.and.returnValue(of(mockResponse));

      component.onUpload();

      expect(apiService.uploadTestResults).toHaveBeenCalledWith('001', [file1]);
    });

    it('should handle partial failure - keep failed files visible and remove successful ones', fakeAsync(() => {
      const file1 = new File(['test1'], 'file1.txt');
      const file2 = new File(['test2'], 'file2.txt');

      component.uploadedFiles = [
        { file: file1, progress: 100, status: 'pending' },
        { file: file2, progress: 100, status: 'pending' }
      ];

      const partialFailureResponse: UploadTestResultsResponseDto = {
        message: 'Partial success',
        totalFilesProcessed: 2,
        successCount: 1,
        failedCount: 1,
        skippedCount: 0,
        totalRecordsProcessed: 10,
        ltInterfaceFilesCount: 1,
        testResultStagingsCount: 10,
        fileResults: [
          {
            fileName: 'file1.txt',
            status: 'success',
            message: 'Processed successfully',
            recordCount: 10,
            isLifetrakFormat: true
          },
          {
            fileName: 'file2.txt',
            status: 'failed',
            message: 'Invalid format',
            recordCount: 0,
            isLifetrakFormat: false
          }
        ]
      };

      apiService.uploadTestResults.and.returnValue(of(partialFailureResponse));
      snackBar.open.calls.reset();

      component.onUpload();
      tick();

      // Should keep only failed files
      expect(component.uploadedFiles.length).toBe(1);
      expect(component.uploadedFiles[0].file.name).toBe('file2.txt');
      expect(component.uploadedFiles[0].status).toBe('error');
      expect(component.uploadedFiles[0].errorMessage).toBe('Invalid format');

      // Should show validation error
      expect(component.showFileValidationError).toBe(true);
      expect(component.fileValidationErrorMessage).toBe('1 file(s) failed to upload');

      // Should not reset form when there are failures
      expect(component.uploadForm.get('chapterId')?.value).toBe('001');
      expect(component.showUploadArea).toBe(true);

      // Should still show success message for successful files
      expect(snackBar.open).toHaveBeenCalledWith(
        'Partial success',
        'Dismiss',
        jasmine.any(Object)
      );
    }));

    it('should reset form only when all files succeed', fakeAsync(() => {
      component.uploadedFiles = [
        { file: mockFile, progress: 100, status: 'pending' }
      ];

      const allSuccessResponse: UploadTestResultsResponseDto = {
        message: 'All files uploaded successfully',
        totalFilesProcessed: 1,
        successCount: 1,
        failedCount: 0,
        skippedCount: 0,
        totalRecordsProcessed: 10,
        ltInterfaceFilesCount: 1,
        testResultStagingsCount: 10,
        fileResults: [
          {
            fileName: 'test.txt',
            status: 'success',
            message: 'Processed successfully',
            recordCount: 10,
            isLifetrakFormat: true
          }
        ]
      };

      apiService.uploadTestResults.and.returnValue(of(allSuccessResponse));

      component.onUpload();
      tick();

      // Should reset form completely
      expect(component.uploadForm.get('chapterId')?.value).toBe('');
      expect(component.uploadedFiles).toEqual([]);
      expect(component.showUploadArea).toBe(false);
      expect(component.selectedChapter).toBeNull();
      expect(component.showFileValidationError).toBe(false);
    }));

    it('should mark files with error status when fileResult indicates failure', fakeAsync(() => {
      const file1 = new File(['test1'], 'file1.txt');

      component.uploadedFiles = [
        { file: file1, progress: 100, status: 'pending' }
      ];

      const failedResponse: UploadTestResultsResponseDto = {
        message: 'Upload failed',
        totalFilesProcessed: 1,
        successCount: 0,
        failedCount: 1,
        skippedCount: 0,
        totalRecordsProcessed: 0,
        ltInterfaceFilesCount: 0,
        testResultStagingsCount: 0,
        fileResults: [
          {
            fileName: 'file1.txt',
            status: 'failed',
            message: 'File format not recognized',
            recordCount: 0,
            isLifetrakFormat: false
          }
        ]
      };

      apiService.uploadTestResults.and.returnValue(of(failedResponse));

      component.onUpload();
      tick();

      expect(component.uploadedFiles.length).toBe(1);
      expect(component.uploadedFiles[0].status).toBe('error');
      expect(component.uploadedFiles[0].errorMessage).toBe('File format not recognized');
      expect(component.showFileValidationError).toBe(true);
      expect(component.fileValidationErrorMessage).toBe('1 file(s) failed to upload');
    }));
  });

  describe('File Removal', () => {


    it('should allow removing a file while upload progress is in progress', () => {
      fixture.detectChanges();
      component.uploadForm.patchValue({ chapterId: '001' });

      const file1 = new File(['test1'], 'test1.txt');
      component.uploadedFiles = [
        { file: file1, progress: 50, status: 'uploading' }
      ];
      component.isUploading = false;

      component.onRemoveFile(0);

      expect(component.uploadedFiles.length).toBe(0);
    });
  });

  describe('Cancel Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form and clear files when cancel is clicked', () => {
      component.uploadForm.patchValue({ chapterId: '001' });
      component.uploadedFiles = [
        { file: new File(['test'], 'test.txt'), progress: 100, status: 'pending' }
      ];
      component.showUploadArea = true;

      component.onCancel();

      expect(component.uploadForm.get('chapterId')?.value).toBe('');
      expect(component.uploadedFiles).toEqual([]);
      expect(component.showUploadArea).toBe(false);
      expect(component.isUploading).toBe(false);
      expect(component.selectedChapter).toBeNull();
      expect(component.showFileValidationError).toBe(false);
    });
  });

  describe('Getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return chapterControl', () => {
      expect(component.chapterControl).toBe(component.uploadForm.get('chapterId'));
    });

    it('should return true for hasPendingFiles when all files are at 100% and pending', () => {
      component.uploadedFiles = [
        { file: new File(['test'], 'test.txt'), progress: 100, status: 'pending' }
      ];

      expect(component.hasPendingFiles).toBe(true);
    });

    it('should return false for hasPendingFiles when files are uploading', () => {
      component.uploadedFiles = [
        { file: new File(['test'], 'test.txt'), progress: 50, status: 'uploading' }
      ];

      expect(component.hasPendingFiles).toBe(false);
    });

    it('should return false for hasPendingFiles when isUploading is true', () => {
      component.uploadedFiles = [
        { file: new File(['test'], 'test.txt'), progress: 100, status: 'pending' }
      ];
      component.isUploading = true;

      expect(component.hasPendingFiles).toBe(false);
    });

    it('should return true for hasFiles when files exist', () => {
      component.uploadedFiles = [
        { file: new File(['test'], 'test.txt'), progress: 0, status: 'uploading' }
      ];

      expect(component.hasFiles).toBe(true);
    });

    it('should return false for hasFiles when no files exist', () => {
      component.uploadedFiles = [];
      expect(component.hasFiles).toBe(false);
    });

    it('should return correct uploadHeading based on file count', () => {
      component.uploadedFiles = [];
      expect(component.uploadHeading).toBe('Upload File');

      component.uploadedFiles = [
        { file: new File(['test'], 'test.txt'), progress: 0, status: 'uploading' }
      ];
      expect(component.uploadHeading).toBe('Upload Contract (1)');

      component.uploadedFiles.push(
        { file: new File(['test2'], 'test2.txt'), progress: 0, status: 'uploading' }
      );
      expect(component.uploadHeading).toBe('Upload Contract (2)');
    });
  });

  describe('File Dialog Listener', () => {
    it('should not show error if files are already uploaded when dialog is canceled', fakeAsync(() => {
      fixture.detectChanges();
      component.uploadedFiles = [
        { file: new File(['test'], 'test.txt'), progress: 100, status: 'pending' }
      ];
      component['fileDialogOpened'] = true;

      window.dispatchEvent(new Event('focus'));
      tick(300);

      expect(component.showFileValidationError).toBe(false);
    }));
  });

  describe('Date Formatting', () => {
    it('should format date correctly in DD-MMM-YYYY format', () => {
      const currentYear = new Date().getFullYear();
      const testDate = new Date(currentYear, 1, 24); // Feb 24 of current year
      const formatted = component.formatDate(testDate);

      expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      expect(formatted).toBe(`24-FEB-${currentYear}`);
    });

    it('should pad single digit days with zero', () => {
      const currentYear = new Date().getFullYear();
      const testDate = new Date(currentYear, 1, 5); // Feb 5 of current year
      const formatted = component.formatDate(testDate);

      expect(formatted).toBe(`05-FEB-${currentYear}`);
    });
  });

  describe('File Size Formatting', () => {
    it('should format bytes correctly', () => {
      expect(component.formatFileSize(0)).toBe('0 Bytes');
      expect(component.formatFileSize(100)).toBe('100 Bytes');
      expect(component.formatFileSize(1024)).toBe('1 KB');
      expect(component.formatFileSize(1048576)).toBe('1 MB');
      expect(component.formatFileSize(1073741824)).toBe('1 GB');
    });

  });
  describe('Header Configuration', () => {

    it('should not have static title or subtitle (resolved dynamically by PageHeaderWithBreadcrumb)', () => {
      expect(component.headerConfig.title).toBeUndefined();
      expect(component.headerConfig.subtitle).toBeUndefined();
    });
  });

  describe('Chapter Date Filtering', () => {
    it('should show chapters when chapter date is between effective and termination date', fakeAsync(() => {
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekLater = new Date(today);
      oneWeekLater.setDate(oneWeekLater.getDate() + 7);

      const activeChapters: ChapterOption[] = [
        {
          chapterId: '001',
          chapterName: 'Active Chapter One',
          chapterCode: 'AC1',
          effectiveDate: oneWeekAgo.toISOString(),
          terminationDate: oneWeekLater.toISOString()
        },
        {
          chapterId: '002',
          chapterName: 'Active Chapter Two',
          chapterCode: 'AC2',
          effectiveDate: yesterday.toISOString(),
          terminationDate: tomorrow.toISOString()
        },
        {
          chapterId: '003',
          chapterName: 'Active Chapter Three',
          chapterCode: 'AC3',
          effectiveDate: oneWeekAgo.toISOString(),
          terminationDate: oneWeekLater.toISOString()
        }
      ];

      apiService.getChapters.and.returnValue(of(activeChapters));

      fixture.detectChanges();
      tick();

      // All three chapters should be included as they are all active (today is between their effective and termination dates)
      expect(component.chapters.length).toBe(3);
      expect(component.filteredChapters.length).toBe(3);

      // Verify all chapter IDs are present
      const chapterIds = component.chapters.map(c => c.chapterId);
      expect(chapterIds).toContain('001');
      expect(chapterIds).toContain('002');
      expect(chapterIds).toContain('003');

      // Verify chapter names are correct
      expect(component.chapters[0].chapterName).toBe('Active Chapter One');
      expect(component.chapters[1].chapterName).toBe('Active Chapter Two');
      expect(component.chapters[2].chapterName).toBe('Active Chapter Three');
    }));

    it('should filter out chapters when chapter date is outside effective and termination date range', fakeAsync(() => {
      const twoWeeksAgo = new Date(today);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekLater = new Date(today);
      oneWeekLater.setDate(oneWeekLater.getDate() + 7);
      const twoWeeksLater = new Date(today);
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

      const mixedChapters: ChapterOption[] = [
        {
          chapterId: '001',
          chapterName: 'Active Chapter',
          chapterCode: 'AC',
          effectiveDate: oneWeekAgo.toISOString(),
          terminationDate: oneWeekLater.toISOString()
        },
        {
          chapterId: '002',
          chapterName: 'Past Chapter',
          chapterCode: 'PC',
          effectiveDate: twoWeeksAgo.toISOString(),
          terminationDate: oneWeekAgo.toISOString()
        },
        {
          chapterId: '003',
          chapterName: 'Future Chapter',
          chapterCode: 'FC',
          effectiveDate: oneWeekLater.toISOString(),
          terminationDate: twoWeeksLater.toISOString()
        },
        {
          chapterId: '004',
          chapterName: 'Another Active Chapter',
          chapterCode: 'AAC',
          effectiveDate: yesterday.toISOString(),
          terminationDate: tomorrow.toISOString()
        }
      ];

      apiService.getChapters.and.returnValue(of(mixedChapters));

      fixture.detectChanges();
      tick();

      // Only active chapters (001 and 004) should be included
      expect(component.chapters.length).toBe(2);
      expect(component.filteredChapters.length).toBe(2);

      // Verify only active chapter IDs are present
      const chapterIds = component.chapters.map(c => c.chapterId);
      expect(chapterIds).toContain('001');
      expect(chapterIds).toContain('004');
      expect(chapterIds).not.toContain('002'); // Past chapter should be filtered out
      expect(chapterIds).not.toContain('003'); // Future chapter should be filtered out
    }));
  });

  describe('ngOnDestroy', () => {
    it('should clear all active intervals on destroy', () => {
      fixture.detectChanges();
      component['activeIntervals'] = [1, 2, 3];
      spyOn(window, 'clearInterval');

      component.ngOnDestroy();

      expect(window.clearInterval).toHaveBeenCalledTimes(3);
      expect(component['activeIntervals'].length).toBe(0);
    });

    it('should remove window focus listener on destroy', () => {
      fixture.detectChanges();
      const mockListener = jasmine.createSpy('listener');
      component['windowFocusListener'] = mockListener;
      spyOn(window, 'removeEventListener');

      component.ngOnDestroy();

      expect(window.removeEventListener).toHaveBeenCalledWith('focus', mockListener);
      expect(component['windowFocusListener']).toBeNull();
    });

    it('should complete destroy$ subject on destroy', () => {
      fixture.detectChanges();
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Chapter Selection with Timezone', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set chapter local date when chapter has non-UTC timezone', fakeAsync(() => {
      const mockChapterWithTimezone = {
        chapterId: '001',
        chapterName: 'Chapter One',
        timeZone: 'America/New_York',
        effectiveDate: yesterday.toISOString(),
        terminationDate: tomorrow.toISOString()
      };

      chaptersService.getChapterById.and.returnValue(of(mockChapterWithTimezone as any));

      component.uploadForm.patchValue({ chapterId: '001' });
      tick();

      expect(component.chapterLocalDate).toBeTruthy();
      expect(component.chapterLocalDate).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    }));

    it('should use current date when chapter has UTC timezone', fakeAsync(() => {
      const mockChapterUTC = {
        chapterId: '001',
        chapterName: 'Chapter One',
        timeZone: 'UTC',
        effectiveDate: yesterday.toISOString(),
        terminationDate: tomorrow.toISOString()
      };

      chaptersService.getChapterById.and.returnValue(of(mockChapterUTC as any));

      component.uploadForm.patchValue({ chapterId: '001' });
      tick();

      expect(component.chapterLocalDate).toBeTruthy();
    }));

    it('should use current date when timezone conversion fails', fakeAsync(() => {
      const mockChapterInvalidTimezone = {
        chapterId: '001',
        chapterName: 'Chapter One',
        timeZone: 'Invalid/Timezone',
        effectiveDate: yesterday.toISOString(),
        terminationDate: tomorrow.toISOString()
      };

      chaptersService.getChapterById.and.returnValue(of(mockChapterInvalidTimezone as any));

      component.uploadForm.patchValue({ chapterId: '001' });
      tick();

      expect(component.chapterLocalDate).toBeTruthy();
    }));

    it('should use current date when getChapterById fails', fakeAsync(() => {
      chaptersService.getChapterById.and.returnValue(throwError(() => new Error('API Error')));

      component.uploadForm.patchValue({ chapterId: '001' });
      tick();

      expect(component.chapterLocalDate).toBeTruthy();
    }));
  });

  describe('Chapter Search', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter chapters by chapter ID', fakeAsync(() => {
      component.chapterSearchControl.setValue('001');
      tick();

      expect(component.filteredChapters.length).toBe(1);
      expect(component.filteredChapters[0].chapterId).toBe('001');
    }));

    it('should filter chapters by chapter name', fakeAsync(() => {
      component.chapterSearchControl.setValue('Chapter One');
      tick();

      expect(component.filteredChapters.length).toBe(1);
      expect(component.filteredChapters[0].chapterName).toBe('Chapter One');
    }));

    it('should be case insensitive when searching', fakeAsync(() => {
      component.chapterSearchControl.setValue('CHAPTER ONE');
      tick();

      expect(component.filteredChapters.length).toBe(1);
      expect(component.filteredChapters[0].chapterName).toBe('Chapter One');
    }));

    it('should show all chapters when search is empty', fakeAsync(() => {
      component.chapterSearchControl.setValue('');
      tick();

      expect(component.filteredChapters.length).toBe(3);
    }));

    it('should return empty array when no chapters match search', fakeAsync(() => {
      component.chapterSearchControl.setValue('NonExistent');
      tick();

      expect(component.filteredChapters.length).toBe(0);
    }));
  });

  describe('File Dialog Cancel Detection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error when file dialog is canceled and no files exist', fakeAsync(() => {
      component.uploadedFiles = [];
      component['fileDialogOpened'] = true;

      const fileInput = document.createElement('input');
      fileInput.id = 'file-input';
      fileInput.type = 'file';
      document.body.appendChild(fileInput);

      window.dispatchEvent(new Event('focus'));
      tick(300);

      expect(component.showFileValidationError).toBe(true);
      expect(component.fileValidationErrorMessage).toBe('File is required');
      expect(component['fileDialogOpened']).toBe(false);

      document.body.removeChild(fileInput);
    }));

    it('should not show error when file dialog is canceled but files already exist', fakeAsync(() => {
      component.uploadedFiles = [
        { file: new File(['test'], 'test.txt'), progress: 100, status: 'pending' }
      ];
      component['fileDialogOpened'] = true;

      window.dispatchEvent(new Event('focus'));
      tick(300);

      expect(component.showFileValidationError).toBe(false);
    }));
  });

  describe('Keyboard Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should trigger file input on space key', () => {
      spyOn(component, 'triggerFileInput');
      const event = new KeyboardEvent('keydown', { key: ' ' });
      spyOn(event, 'preventDefault');

      component.onSpaceKey(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.triggerFileInput).toHaveBeenCalled();
    });

    it('should click file input when triggerFileInput is called', () => {
      const fileInput = document.createElement('input');
      fileInput.id = 'file-input';
      fileInput.type = 'file';
      spyOn(fileInput, 'click');
      document.body.appendChild(fileInput);

      component.triggerFileInput();

      expect(component['fileDialogOpened']).toBe(true);
      expect(fileInput.click).toHaveBeenCalled();

      document.body.removeChild(fileInput);
    });
  });

  describe('Upload - All Files Already Uploaded', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.uploadForm.patchValue({ chapterId: '001' });
    });

    it('should show message when all files have already been uploaded', () => {
      component.uploadedFiles = [
        { file: new File(['test'], 'test.txt'), progress: 100, status: 'success' }
      ];
      snackBar.open.calls.reset();

      component.onUpload();

      expect(snackBar.open).toHaveBeenCalledWith(
        'All files have already been uploaded',
        'Dismiss',
        jasmine.objectContaining({
          duration: 3000
        })
      );
    });
  });

  describe('Upload - Response Variations', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.uploadForm.patchValue({ chapterId: '001' });
    });

    it('should handle response without fileResults array', fakeAsync(() => {
      const mockFile = new File(['test'], 'test.txt');
      component.uploadedFiles = [
        { file: mockFile, progress: 100, status: 'pending' }
      ];

      const responseWithoutFileResults: any = {
        message: 'Upload completed',
        totalFilesProcessed: 1,
        successCount: 1,
        failedCount: 0,
        skippedCount: 0,
        totalRecordsProcessed: 10,
        ltInterfaceFilesCount: 1,
        testResultStagingsCount: 10
      };

      apiService.uploadTestResults.and.returnValue(of(responseWithoutFileResults));

      component.onUpload();
      tick();

      expect(component.isUploading).toBe(false);
    }));

    it('should handle empty fileResults array', fakeAsync(() => {
      const mockFile = new File(['test'], 'test.txt');
      component.uploadedFiles = [
        { file: mockFile, progress: 100, status: 'pending' }
      ];

      const responseWithEmptyFileResults: UploadTestResultsResponseDto = {
        message: 'Upload completed',
        totalFilesProcessed: 1,
        successCount: 1,
        failedCount: 0,
        skippedCount: 0,
        totalRecordsProcessed: 10,
        ltInterfaceFilesCount: 1,
        testResultStagingsCount: 10,
        fileResults: []
      };

      apiService.uploadTestResults.and.returnValue(of(responseWithEmptyFileResults));

      component.onUpload();
      tick();

      expect(component.isUploading).toBe(false);
    }));
  });
});
