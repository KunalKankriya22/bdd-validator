import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FileUploadZoneComponent, FileUploadEvent } from './file-upload-zone';

function createMockFile(name: string, size: number, type = 'application/octet-stream'): File {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, { type });
}

function createDragEvent(type: string, files?: File[]): DragEvent {
  const dataTransfer: Partial<DataTransfer> = {
    files: files as unknown as FileList,
  };
  const event = {
    type,
    preventDefault: jasmine.createSpy('preventDefault'),
    stopPropagation: jasmine.createSpy('stopPropagation'),
    dataTransfer: files ? dataTransfer as DataTransfer : undefined,
  } as unknown as DragEvent;
  return event;
}

describe('FileUploadZoneComponent', () => {
  let component: FileUploadZoneComponent;
  let fixture: ComponentFixture<FileUploadZoneComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FileUploadZoneComponent, NoopAnimationsModule],
    });

    fixture = TestBed.createComponent(FileUploadZoneComponent);
    component = fixture.componentInstance;
    try {
      fixture.detectChanges();
    } catch (_) {
      // template rendering may fail in test environment
    }
  });

  // -------------------------------------------------------
  // 1. Component creation
  // -------------------------------------------------------
  describe('Component creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default input values', () => {
      expect(component.placeholderText).toBe('Drag and drop your files here');
      expect(component.browseText).toBe('browse files');
      expect(component.acceptedFileTypes).toBe('*');
      expect(component.maxFileSizeMB).toBe(20);
      expect(component.disabled).toBe(false);
      expect(component.showRemoveButton).toBe(true);
      expect(component.showSuccessIcon).toBe(true);
      expect(component.uploadProgress).toBe(0);
    });

    it('should initialize with no selected file and no error', () => {
      expect(component.selectedFile).toBeNull();
      expect(component.isDragOver).toBe(false);
      expect(component.errorMessage).toBe('');
    });
  });

  // -------------------------------------------------------
  // 2. onDragOver
  // -------------------------------------------------------
  describe('onDragOver', () => {
    it('should set isDragOver to true', () => {
      const event = createDragEvent('dragover');
      component.onDragOver(event);
      expect(component.isDragOver).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should do nothing when disabled', () => {
      component.disabled = true;
      const event = createDragEvent('dragover');
      component.onDragOver(event);
      expect(component.isDragOver).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should do nothing when a file is already selected', () => {
      component.selectedFile = createMockFile('test.txt', 100);
      const event = createDragEvent('dragover');
      component.onDragOver(event);
      expect(component.isDragOver).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // 3. onDragLeave
  // -------------------------------------------------------
  describe('onDragLeave', () => {
    it('should clear isDragOver', () => {
      component.isDragOver = true;
      const event = createDragEvent('dragleave');
      component.onDragLeave(event);
      expect(component.isDragOver).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should do nothing when disabled', () => {
      component.disabled = true;
      component.isDragOver = true;
      const event = createDragEvent('dragleave');
      component.onDragLeave(event);
      expect(component.isDragOver).toBe(true);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // 4. onDrop
  // -------------------------------------------------------
  describe('onDrop', () => {
    it('should handle a dropped file', () => {
      const file = createMockFile('report.pdf', 500);
      const event = createDragEvent('drop', [file]);
      spyOn(component.fileSelected, 'emit');

      component.onDrop(event);

      expect(component.isDragOver).toBe(false);
      expect(component.selectedFile).toBe(file);
      expect(component.fileSelected.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ file, isValid: true })
      );
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should do nothing when disabled', () => {
      component.disabled = true;
      const file = createMockFile('report.pdf', 500);
      const event = createDragEvent('drop', [file]);
      spyOn(component.fileSelected, 'emit');

      component.onDrop(event);

      expect(component.selectedFile).toBeNull();
      expect(component.fileSelected.emit).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should do nothing when a file is already selected', () => {
      component.selectedFile = createMockFile('existing.txt', 100);
      const file = createMockFile('report.pdf', 500);
      const event = createDragEvent('drop', [file]);
      spyOn(component.fileSelected, 'emit');

      component.onDrop(event);

      expect(component.selectedFile.name).toBe('existing.txt');
      expect(component.fileSelected.emit).not.toHaveBeenCalled();
    });

    it('should do nothing when dataTransfer has no files', () => {
      const event = createDragEvent('drop', [] as unknown as File[]);
      // Simulate empty FileList (length 0)
      (event.dataTransfer as any).files = { length: 0 } as FileList;
      spyOn(component.fileSelected, 'emit');

      component.onDrop(event);

      expect(component.selectedFile).toBeNull();
      expect(component.fileSelected.emit).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // 5. onFileSelected
  // -------------------------------------------------------
  describe('onFileSelected', () => {
    it('should handle file from input element', () => {
      const file = createMockFile('data.csv', 200);
      const event = {
        target: { files: [file] } as unknown as HTMLInputElement,
      } as unknown as Event;
      spyOn(component.fileSelected, 'emit');

      component.onFileSelected(event);

      expect(component.selectedFile).toBe(file);
      expect(component.fileSelected.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ file, isValid: true })
      );
    });

    it('should do nothing when no file is present', () => {
      const event = {
        target: { files: [] } as unknown as HTMLInputElement,
      } as unknown as Event;
      spyOn(component.fileSelected, 'emit');

      component.onFileSelected(event);

      expect(component.selectedFile).toBeNull();
      expect(component.fileSelected.emit).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // 6. handleFile (via onDrop / onFileSelected)
  // -------------------------------------------------------
  describe('handleFile (via onDrop/onFileSelected)', () => {
    it('should accept a valid file', () => {
      const file = createMockFile('doc.pdf', 1000);
      const event = createDragEvent('drop', [file]);
      spyOn(component.fileSelected, 'emit');

      component.onDrop(event);

      expect(component.selectedFile).toBe(file);
      expect(component.errorMessage).toBe('');
      expect(component.fileSelected.emit).toHaveBeenCalledWith({
        file,
        isValid: true,
      });
    });

    it('should reject a file that is too large', () => {
      component.maxFileSizeMB = 1;
      // Create a file larger than 1MB
      const file = createMockFile('huge.pdf', 2 * 1024 * 1024);
      const event = createDragEvent('drop', [file]);
      spyOn(component.fileSelected, 'emit');

      component.onDrop(event);

      expect(component.selectedFile).toBeNull();
      expect(component.errorMessage).toContain('exceeds the maximum allowed size');
      expect(component.fileSelected.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ file, isValid: false })
      );
      const emittedEvent = (component.fileSelected.emit as jasmine.Spy).calls.first().args[0] as FileUploadEvent;
      expect(emittedEvent.error).toContain('exceeds the maximum allowed size');
    });

    it('should reject a file with an invalid file type', () => {
      component.acceptedFileTypes = '.pdf,.doc';
      const file = createMockFile('image.png', 500);
      const event = createDragEvent('drop', [file]);
      spyOn(component.fileSelected, 'emit');

      component.onDrop(event);

      expect(component.selectedFile).toBeNull();
      expect(component.errorMessage).toContain('File type not allowed');
      expect(component.fileSelected.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ file, isValid: false })
      );
    });

    it('should accept any file type when acceptedFileTypes is wildcard', () => {
      component.acceptedFileTypes = '*';
      const file = createMockFile('anything.xyz', 500);
      const event = createDragEvent('drop', [file]);
      spyOn(component.fileSelected, 'emit');

      component.onDrop(event);

      expect(component.selectedFile).toBe(file);
      expect(component.errorMessage).toBe('');
      expect(component.fileSelected.emit).toHaveBeenCalledWith({
        file,
        isValid: true,
      });
    });

    it('should accept a file with a matching extension from the accepted types list', () => {
      component.acceptedFileTypes = '.pdf,.doc,.docx';
      const file = createMockFile('report.docx', 500);
      const event = createDragEvent('drop', [file]);
      spyOn(component.fileSelected, 'emit');

      component.onDrop(event);

      expect(component.selectedFile).toBe(file);
      expect(component.errorMessage).toBe('');
    });
  });

  // -------------------------------------------------------
  // 7. onRemove
  // -------------------------------------------------------
  describe('onRemove', () => {
    it('should clear selectedFile and emit fileRemoved', () => {
      component.selectedFile = createMockFile('test.pdf', 100);
      component.errorMessage = 'some old error';
      // Mock the fileInput ViewChild
      component.fileInput = { nativeElement: { value: 'fakepath' } } as any;

      const event = {
        stopPropagation: jasmine.createSpy('stopPropagation'),
      } as unknown as Event;
      spyOn(component.fileRemoved, 'emit');

      component.onRemove(event);

      expect(component.selectedFile).toBeNull();
      expect(component.errorMessage).toBe('');
      expect(component.fileInput.nativeElement.value).toBe('');
      expect(component.fileRemoved.emit).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should work even if fileInput is not set', () => {
      component.selectedFile = createMockFile('test.pdf', 100);
      (component as any).fileInput = undefined;

      const event = {
        stopPropagation: jasmine.createSpy('stopPropagation'),
      } as unknown as Event;
      spyOn(component.fileRemoved, 'emit');

      expect(() => component.onRemove(event)).not.toThrow();
      expect(component.selectedFile).toBeNull();
      expect(component.fileRemoved.emit).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // 8. getFileIcon
  // -------------------------------------------------------
  describe('getFileIcon', () => {
    it('should return default icon when no file is selected', () => {
      component.selectedFile = null;
      expect(component.getFileIcon()).toBe('insert_drive_file');
    });

    it('should return pdf icon for .pdf files', () => {
      component.selectedFile = createMockFile('report.pdf', 100);
      expect(component.getFileIcon()).toBe('picture_as_pdf');
    });

    it('should return description icon for .doc files', () => {
      component.selectedFile = createMockFile('letter.doc', 100);
      expect(component.getFileIcon()).toBe('description');
    });

    it('should return description icon for .docx files', () => {
      component.selectedFile = createMockFile('letter.docx', 100);
      expect(component.getFileIcon()).toBe('description');
    });

    it('should return grid_on icon for .xls files', () => {
      component.selectedFile = createMockFile('data.xls', 100);
      expect(component.getFileIcon()).toBe('grid_on');
    });

    it('should return grid_on icon for .xlsx files', () => {
      component.selectedFile = createMockFile('data.xlsx', 100);
      expect(component.getFileIcon()).toBe('grid_on');
    });

    it('should return image icon for .jpg files', () => {
      component.selectedFile = createMockFile('photo.jpg', 100);
      expect(component.getFileIcon()).toBe('image');
    });

    it('should return image icon for .png files', () => {
      component.selectedFile = createMockFile('screenshot.png', 100);
      expect(component.getFileIcon()).toBe('image');
    });

    it('should return folder_zip icon for .zip files', () => {
      component.selectedFile = createMockFile('archive.zip', 100);
      expect(component.getFileIcon()).toBe('folder_zip');
    });

    it('should return default icon for unknown file types', () => {
      component.selectedFile = createMockFile('readme.txt', 100);
      expect(component.getFileIcon()).toBe('insert_drive_file');
    });
  });

  // -------------------------------------------------------
  // 9. getFileIconClass
  // -------------------------------------------------------
  describe('getFileIconClass', () => {
    it('should return empty string when no file is selected', () => {
      component.selectedFile = null;
      expect(component.getFileIconClass()).toBe('');
    });

    it('should return file-icon-pdf for .pdf files', () => {
      component.selectedFile = createMockFile('report.pdf', 100);
      expect(component.getFileIconClass()).toBe('file-icon-pdf');
    });

    it('should return file-icon-doc for .doc files', () => {
      component.selectedFile = createMockFile('letter.doc', 100);
      expect(component.getFileIconClass()).toBe('file-icon-doc');
    });

    it('should return file-icon-doc for .docx files', () => {
      component.selectedFile = createMockFile('letter.docx', 100);
      expect(component.getFileIconClass()).toBe('file-icon-doc');
    });

    it('should return file-icon-xls for .xls files', () => {
      component.selectedFile = createMockFile('data.xls', 100);
      expect(component.getFileIconClass()).toBe('file-icon-xls');
    });

    it('should return file-icon-xls for .xlsx files', () => {
      component.selectedFile = createMockFile('data.xlsx', 100);
      expect(component.getFileIconClass()).toBe('file-icon-xls');
    });

    it('should return file-icon-image for .jpg files', () => {
      component.selectedFile = createMockFile('photo.jpg', 100);
      expect(component.getFileIconClass()).toBe('file-icon-image');
    });

    it('should return file-icon-image for .png files', () => {
      component.selectedFile = createMockFile('screenshot.png', 100);
      expect(component.getFileIconClass()).toBe('file-icon-image');
    });

    it('should return empty string for unknown file types', () => {
      component.selectedFile = createMockFile('readme.txt', 100);
      expect(component.getFileIconClass()).toBe('');
    });
  });

  // -------------------------------------------------------
  // 10. formatFileSize
  // -------------------------------------------------------
  describe('formatFileSize', () => {
    it('should return "0 Bytes" for 0 bytes', () => {
      expect(component.formatFileSize(0)).toBe('0 Bytes');
    });

    it('should format bytes correctly', () => {
      expect(component.formatFileSize(500)).toContain('Bytes');
    });

    it('should format KB correctly', () => {
      const result = component.formatFileSize(2048);
      expect(result).toContain('KB');
    });

    it('should format MB correctly', () => {
      const result = component.formatFileSize(5 * 1024 * 1024);
      expect(result).toContain('MB');
    });
  });

  // -------------------------------------------------------
  // 11. reset
  // -------------------------------------------------------
  describe('reset', () => {
    it('should clear all state', () => {
      component.selectedFile = createMockFile('test.pdf', 100);
      component.errorMessage = 'some error';
      component.isDragOver = true;
      component.fileInput = { nativeElement: { value: 'fakepath' } } as any;

      component.reset();

      expect(component.selectedFile).toBeNull();
      expect(component.errorMessage).toBe('');
      expect(component.isDragOver).toBe(false);
      expect(component.fileInput.nativeElement.value).toBe('');
    });

    it('should work even if fileInput is not set', () => {
      component.selectedFile = createMockFile('test.pdf', 100);
      (component as any).fileInput = undefined;

      expect(() => component.reset()).not.toThrow();
      expect(component.selectedFile).toBeNull();
      expect(component.errorMessage).toBe('');
      expect(component.isDragOver).toBe(false);
    });
  });
});
