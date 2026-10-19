import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange, SimpleChanges } from '@angular/core';
import { ManualUploadTab } from './manual-upload-tab';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('ManualUploadTab', () => {
  let component: ManualUploadTab;
  let fixture: ComponentFixture<ManualUploadTab>;
  let mockService: jasmine.SpyObj<InstrumentInterfaceService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('InstrumentInterfaceService', [
      'getPendingFileIds',
      'manualUpload',
    ]);
    mockSnackbar = createMockSnackbarService();

    mockService.getPendingFileIds.and.returnValue(of({ success: true, data: [] }));
    mockService.manualUpload.and.returnValue(of({ success: true, message: 'File has been loaded successfully.' }));

    await TestBed.configureTestingModule({
      imports: [ManualUploadTab, NoopAnimationsModule],
      providers: [
        { provide: InstrumentInterfaceService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManualUploadTab);
    component = fixture.componentInstance;
    component.chapterId = 'DAL';
    component.instrumentId = 'S201';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reset all state when inputs change via ngOnChanges', () => {
    // Arrange
    component.selectedFileId.set('F001');
    component.fileIds.set(['F001', 'F002']);
    component.loading.set(true);
    component.uploading.set(true);
    component.errorMessage.set('Some error');
    component.errorTitle.set('Error Title');

    const changes: SimpleChanges = {
      chapterId: new SimpleChange('OLD', 'NEW', false),
    };

    // Act
    component.ngOnChanges(changes);

    // Assert
    expect(component.selectedFileId()).toBe('');
    expect(component.fileIds()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(component.uploading()).toBe(false);
    expect(component.errorMessage()).toBe('');
    expect(component.errorTitle()).toBe('');
  });

  it('should clear error signals via clearError', () => {
    // Arrange
    component.errorMessage.set('Upload failed');
    component.errorTitle.set('Upload Failed');

    // Act
    component.clearError();

    // Assert
    expect(component.errorMessage()).toBe('');
    expect(component.errorTitle()).toBe('');
  });

  it('should load pending file IDs successfully', () => {
    // Arrange
    const mockResponse = {
      success: true,
      data: [{ fileId: 'F001' }, { fileId: 'F002' }],
    };
    mockService.getPendingFileIds.and.returnValue(of(mockResponse));

    // Act
    component.loadPendingFileIds();

    // Assert
    expect(mockService.getPendingFileIds).toHaveBeenCalledWith('DAL', 'S201');
    expect(component.fileIds()).toEqual(['F001', 'F002']);
    expect(component.loading()).toBe(false);
  });

  it('should set fileIds to empty array when API returns no data', () => {
    // Arrange
    mockService.getPendingFileIds.and.returnValue(of({ success: false, data: null }));

    // Act
    component.loadPendingFileIds();

    // Assert
    expect(component.fileIds()).toEqual([]);
  });

  it('should show error and not call API when chapterId is missing in loadPendingFileIds', () => {
    // Arrange
    component.chapterId = '';

    // Act
    component.loadPendingFileIds();

    // Assert
    expect(mockSnackbar.showError).toHaveBeenCalledWith(
      'Please select both Chapter ID and Instrument ID before retrieving pending files.'
    );
    expect(mockService.getPendingFileIds).not.toHaveBeenCalled();
  });

  it('should show error snackbar when loadPendingFileIds API call fails', () => {
    // Arrange
    mockService.getPendingFileIds.and.returnValue(throwError(() => new Error('Network error')));

    // Act
    component.loadPendingFileIds();

    // Assert
    expect(component.loading()).toBe(false);
    expect(component.fileIds()).toEqual([]);
    expect(mockSnackbar.showError).toHaveBeenCalledWith(
      'Unable to retrieve pending file list. Please try again or contact support.'
    );
  });

  it('should reset selectedFileId and set loading true before calling getPendingFileIds', () => {
    // Arrange
    component.selectedFileId.set('F999');
    let loadingDuringCall = false;
    let selectedDuringCall = '';

    mockService.getPendingFileIds.and.callFake(() => {
      loadingDuringCall = component.loading();
      selectedDuringCall = component.selectedFileId();
      return of({ success: true, data: [] });
    });

    // Act
    component.loadPendingFileIds();

    // Assert
    expect(loadingDuringCall).toBe(true);
    expect(selectedDuringCall).toBe('');
  });

  it('should upload successfully and show success snackbar', () => {
    // Arrange
    component.selectedFileId.set('F001');
    const successResponse = { success: true, message: 'File uploaded.' };
    mockService.manualUpload.and.returnValue(of(successResponse));
    mockService.getPendingFileIds.and.returnValue(of({ success: true, data: [] }));

    // Act
    component.onUpload();

    // Assert
    expect(mockService.manualUpload).toHaveBeenCalledWith('DAL', 'S201', 'F001');
    expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('File uploaded.');
    expect(component.uploading()).toBe(false);
    expect(component.selectedFileId()).toBe('');
  });

  it('should show error when uploading without a selected file ID', () => {
    // Arrange
    component.selectedFileId.set('');

    // Act
    component.onUpload();

    // Assert
    expect(mockSnackbar.showError).toHaveBeenCalledWith('Please select a File ID before uploading.');
    expect(mockService.manualUpload).not.toHaveBeenCalled();
  });

  it('should show error when uploading without chapterId', () => {
    // Arrange
    component.chapterId = '';
    component.selectedFileId.set('F001');

    // Act
    component.onUpload();

    // Assert
    expect(mockSnackbar.showError).toHaveBeenCalledWith('Chapter ID is required.');
    expect(mockService.manualUpload).not.toHaveBeenCalled();
  });

  it('should show error when uploading without instrumentId', () => {
    // Arrange
    component.chapterId = 'DAL';
    component.instrumentId = '';
    component.selectedFileId.set('F001');

    // Act
    component.onUpload();

    // Assert
    expect(mockSnackbar.showError).toHaveBeenCalledWith('Instrument ID is required.');
    expect(mockService.manualUpload).not.toHaveBeenCalled();
  });

  it('should set error title and message when upload response indicates abort', () => {
    // Arrange
    component.selectedFileId.set('F001');
    const abortResponse = {
      success: false,
      errorResponse: { error: 'File aborted due to validation errors' },
    };
    mockService.manualUpload.and.returnValue(of(abortResponse));

    // Act
    component.onUpload();

    // Assert
    expect(component.uploading()).toBe(false);
    expect(component.errorTitle()).toBe('Upload Aborted');
    expect(component.errorMessage()).toBe('File aborted due to validation errors');
  });

  it('should set error title and message when upload API call fails', () => {
    // Arrange
    component.selectedFileId.set('F001');
    const errorObj = { error: { errorResponse: { error: 'Server timeout' } } };
    mockService.manualUpload.and.returnValue(throwError(() => errorObj));

    // Act
    component.onUpload();

    // Assert
    expect(component.uploading()).toBe(false);
    expect(component.errorTitle()).toBe('Upload Failed');
    expect(component.errorMessage()).toBe('Server timeout');
  });

  it('should reload pending file IDs after successful upload', () => {
    // Arrange
    component.selectedFileId.set('F001');
    mockService.manualUpload.and.returnValue(of({ success: true, message: 'OK' }));
    mockService.getPendingFileIds.and.returnValue(of({ success: true, data: [{ fileId: 'F002' }] }));

    // Act
    component.onUpload();

    // Assert
    expect(mockService.getPendingFileIds).toHaveBeenCalledWith('DAL', 'S201');
  });

  it('should have correct initial signal values', () => {
    const fresh = TestBed.createComponent(ManualUploadTab);
    const comp = fresh.componentInstance;

    expect(comp.selectedFileId()).toBe('');
    expect(comp.uploading()).toBe(false);
    expect(comp.fileIds()).toEqual([]);
    expect(comp.loading()).toBe(false);
    expect(comp.errorMessage()).toBe('');
    expect(comp.errorTitle()).toBe('');
    expect(comp.instrumentDesc).toBe('');
  });

  it('should reset state when instrumentId changes via ngOnChanges', () => {
    // Arrange
    component.selectedFileId.set('F001');
    component.fileIds.set(['F001']);
    component.loading.set(true);
    component.uploading.set(true);
    component.errorMessage.set('err');
    component.errorTitle.set('title');

    const changes: SimpleChanges = {
      instrumentId: new SimpleChange('OLD', 'NEW', false),
    };

    // Act
    component.ngOnChanges(changes);

    // Assert
    expect(component.selectedFileId()).toBe('');
    expect(component.fileIds()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(component.uploading()).toBe(false);
    expect(component.errorMessage()).toBe('');
    expect(component.errorTitle()).toBe('');
  });

  it('should reset state when both chapterId and instrumentId change', () => {
    // Arrange
    component.selectedFileId.set('F001');
    component.fileIds.set(['F001']);

    const changes: SimpleChanges = {
      chapterId: new SimpleChange('A', 'B', false),
      instrumentId: new SimpleChange('X', 'Y', false),
    };

    // Act
    component.ngOnChanges(changes);

    // Assert
    expect(component.selectedFileId()).toBe('');
    expect(component.fileIds()).toEqual([]);
  });

  it('should NOT reset state when unrelated input changes', () => {
    // Arrange
    component.selectedFileId.set('F001');
    component.fileIds.set(['F001', 'F002']);
    component.loading.set(true);

    const changes: SimpleChanges = {
      instrumentDesc: new SimpleChange('old desc', 'new desc', false),
    };

    // Act
    component.ngOnChanges(changes);

    // Assert
    expect(component.selectedFileId()).toBe('F001');
    expect(component.fileIds()).toEqual(['F001', 'F002']);
    expect(component.loading()).toBe(true);
  });

  it('should show error when instrumentId is missing in loadPendingFileIds', () => {
    // Arrange
    component.instrumentId = '';

    // Act
    component.loadPendingFileIds();

    // Assert
    expect(mockSnackbar.showError).toHaveBeenCalledWith(
      'Please select both Chapter ID and Instrument ID before retrieving pending files.'
    );
    expect(mockService.getPendingFileIds).not.toHaveBeenCalled();
  });

  it('should handle plain string items in data from getPendingFileIds', () => {
    // Arrange
    mockService.getPendingFileIds.and.returnValue(of({ success: true, data: ['FILE_A', 'FILE_B'] }));

    // Act
    component.loadPendingFileIds();

    // Assert
    expect(component.fileIds()).toEqual(['FILE_A', 'FILE_B']);
  });

  it('should clear error before loading pending file IDs', () => {
    // Arrange
    component.errorMessage.set('prev error');
    component.errorTitle.set('prev title');
    mockService.getPendingFileIds.and.returnValue(of({ success: true, data: [] }));

    // Act
    component.loadPendingFileIds();

    // Assert - error cleared even though API returned no errors
    expect(component.errorMessage()).toBe('');
    expect(component.errorTitle()).toBe('');
  });

  it('should set fileIds to empty when response.success is true but data is null', () => {
    // Arrange
    mockService.getPendingFileIds.and.returnValue(of({ success: true, data: null }));

    // Act
    component.loadPendingFileIds();

    // Assert
    expect(component.fileIds()).toEqual([]);
  });

  it('should use default success message when response.message is falsy', () => {
    // Arrange
    component.selectedFileId.set('F001');
    mockService.manualUpload.and.returnValue(of({ success: true }));
    mockService.getPendingFileIds.and.returnValue(of({ success: true, data: [] }));

    // Act
    component.onUpload();

    // Assert
    expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('File has been loaded successfully.');
  });

  it('should use response.error when errorResponse.error is not available on abort', () => {
    // Arrange
    component.selectedFileId.set('F001');
    const abortResponse = {
      success: false,
      error: 'Validation failed for selected file',
    };
    mockService.manualUpload.and.returnValue(of(abortResponse));

    // Act
    component.onUpload();

    // Assert
    expect(component.errorTitle()).toBe('Upload Aborted');
    expect(component.errorMessage()).toBe('Validation failed for selected file');
  });

  it('should use default abort message when no error details available', () => {
    // Arrange
    component.selectedFileId.set('F001');
    const abortResponse = { success: false };
    mockService.manualUpload.and.returnValue(of(abortResponse));

    // Act
    component.onUpload();

    // Assert
    expect(component.errorTitle()).toBe('Upload Aborted');
    expect(component.errorMessage()).toBe(
      'The file has been aborted. Please refer to the log file for details.'
    );
  });

  it('should use err.error.error when err.error.errorResponse.error is not available on failure', () => {
    // Arrange
    component.selectedFileId.set('F001');
    const errorObj = { error: { error: 'Bad request from server' } };
    mockService.manualUpload.and.returnValue(throwError(() => errorObj));

    // Act
    component.onUpload();

    // Assert
    expect(component.errorTitle()).toBe('Upload Failed');
    expect(component.errorMessage()).toBe('Bad request from server');
  });

  it('should use default error message when no error details available on failure', () => {
    // Arrange
    component.selectedFileId.set('F001');
    mockService.manualUpload.and.returnValue(throwError(() => ({})));

    // Act
    component.onUpload();

    // Assert
    expect(component.errorTitle()).toBe('Upload Failed');
    expect(component.errorMessage()).toBe(
      'An unexpected error occurred during upload. Please try again.'
    );
  });

  it('should set uploading to true and clear error before calling manualUpload', () => {
    // Arrange
    component.selectedFileId.set('F001');
    component.errorMessage.set('old error');
    component.errorTitle.set('old title');
    let uploadingDuringCall = false;
    let errorMsgDuringCall = '';
    let errorTitleDuringCall = '';

    mockService.manualUpload.and.callFake(() => {
      uploadingDuringCall = component.uploading();
      errorMsgDuringCall = component.errorMessage();
      errorTitleDuringCall = component.errorTitle();
      return of({ success: true, message: 'OK' });
    });
    mockService.getPendingFileIds.and.returnValue(of({ success: true, data: [] }));

    // Act
    component.onUpload();

    // Assert
    expect(uploadingDuringCall).toBe(true);
    expect(errorMsgDuringCall).toBe('');
    expect(errorTitleDuringCall).toBe('');
  });

  it('should call focusFileSelect after successful upload', () => {
    // Arrange
    component.selectedFileId.set('F001');
    mockService.manualUpload.and.returnValue(of({ success: true, message: 'OK' }));
    mockService.getPendingFileIds.and.returnValue(of({ success: true, data: [] }));
    component.fileSelect = { focus: jasmine.createSpy('focus') } as any;
    jasmine.clock().install();

    // Act
    component.onUpload();
    jasmine.clock().tick(0);

    // Assert
    expect(component.fileSelect.focus).toHaveBeenCalled();
    jasmine.clock().uninstall();
  });

  it('should call focusFileSelect after upload abort', () => {
    // Arrange
    component.selectedFileId.set('F001');
    mockService.manualUpload.and.returnValue(of({ success: false }));
    component.fileSelect = { focus: jasmine.createSpy('focus') } as any;
    jasmine.clock().install();

    // Act
    component.onUpload();
    jasmine.clock().tick(0);

    // Assert
    expect(component.fileSelect.focus).toHaveBeenCalled();
    jasmine.clock().uninstall();
  });

  it('should call focusFileSelect after upload error', () => {
    // Arrange
    component.selectedFileId.set('F001');
    mockService.manualUpload.and.returnValue(throwError(() => ({})));
    component.fileSelect = { focus: jasmine.createSpy('focus') } as any;
    jasmine.clock().install();

    // Act
    component.onUpload();
    jasmine.clock().tick(0);

    // Assert
    expect(component.fileSelect.focus).toHaveBeenCalled();
    jasmine.clock().uninstall();
  });

  it('should not throw when fileSelect is undefined during focusFileSelect', () => {
    // Arrange
    component.selectedFileId.set('F001');
    mockService.manualUpload.and.returnValue(of({ success: true, message: 'OK' }));
    mockService.getPendingFileIds.and.returnValue(of({ success: true, data: [] }));
    (component as any).fileSelect = undefined;

    // Act & Assert - should not throw
    expect(() => {
      component.onUpload();
      jasmine.clock().install();
      jasmine.clock().tick(0);
      jasmine.clock().uninstall();
    }).not.toThrow();
  });

  it('should handle mixed data items with and without fileId property', () => {
    // Arrange
    const mixedData = [{ fileId: 'F001' }, 'RAW_STRING', { fileId: 'F003' }];
    mockService.getPendingFileIds.and.returnValue(of({ success: true, data: mixedData }));

    // Act
    component.loadPendingFileIds();

    // Assert
    expect(component.fileIds()).toEqual(['F001', 'RAW_STRING', 'F003']);
  });

  it('should not call API or set loading when both chapterId and instrumentId are empty', () => {
    // Arrange
    component.chapterId = '';
    component.instrumentId = '';

    // Act
    component.loadPendingFileIds();

    // Assert
    expect(mockService.getPendingFileIds).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });
});
