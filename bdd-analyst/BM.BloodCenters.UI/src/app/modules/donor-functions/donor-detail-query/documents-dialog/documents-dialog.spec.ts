import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { DocumentsDialog, DocumentsDialogData } from './documents-dialog';
import { DocumentLibraryApiService } from 'src/app/modules/system-administration/user-admin/lab-dist-user-admin/user-utilities/document-library/services/document-library-api.service';
import { DocumentLibraryDto } from 'src/app/modules/system-administration/user-admin/lab-dist-user-admin/user-utilities/document-library/models/document-library.model';
import { createMockTranslateService, createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('DocumentsDialog', () => {
  let component: DocumentsDialog;
  let fixture: ComponentFixture<DocumentsDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<DocumentsDialog>>;
  let mockDocumentService: jasmine.SpyObj<DocumentLibraryApiService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let mockDialogData: DocumentsDialogData;

  const mockDocuments: DocumentLibraryDto[] = [
    {
      chapterId: 'WAD',
      sessionId: 'session-1',
      docName: 'Consent Form.pdf',
      docType: 'PDF',
      docId: 'DOC-001',
      docLinkedTable: 'DONORS',
      docLinkedColumn: 'DONOR_ID',
      docLinkedDesc: 'Donor Consent',
      insertDate: '2025-01-15',
      insertUser: 'ADMIN',
      linkedValues: ['00008392'],
    },
    {
      chapterId: 'WAD',
      sessionId: 'session-2',
      docName: 'Medical History.pdf',
      docType: 'PDF',
      docId: 'DOC-002',
      docLinkedTable: 'DONORS',
      docLinkedColumn: 'DONOR_ID',
      docLinkedDesc: 'Medical Records',
      insertDate: '2025-01-20',
      insertUser: 'ADMIN',
      linkedValues: ['00008392'],
    },
  ];

  beforeEach(() => {

    // Create fresh mock data for each test to avoid mutation issues
    mockDialogData = {
      donorId: '00008392',
      donorName: 'ROGERS, MARY',
    };

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockDocumentService = jasmine.createSpyObj('DocumentLibraryApiService', [
      'searchDocuments',
      'downloadDocument',
    ]);
    mockSnackBar = createMockMatSnackBar();
    mockTranslateService = createMockTranslateService();
    mockTranslateService.instant.and.callFake((key: string) => key);

    // Default mock behavior - return empty documents
    mockDocumentService.searchDocuments.and.returnValue(
      of({ documents: [], total: 0 })
    );



      TestBed.configureTestingModule({
      imports: [DocumentsDialog],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: DocumentLibraryApiService, useValue: mockDocumentService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: TranslateService, useValue: mockTranslateService },
      ],
    })
    .overrideComponent(DocumentsDialog, {
      remove: { imports: [] },
      add: { providers: [{ provide: MatSnackBar, useValue: mockSnackBar }] }
    });


    


      mockDialogRef.close.calls.reset();


      mockDocumentService.searchDocuments.calls.reset();


      mockDocumentService.downloadDocument.calls.reset();


      mockTranslateService.instant.and.callFake((key: string) => key);


    fixture = TestBed.createComponent(DocumentsDialog);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {
    it('should load documents on init', () => {
      // Arrange
      mockDocumentService.searchDocuments.and.returnValue(
        of({ documents: mockDocuments, total: 2 })
      );

      // Act
      fixture.detectChanges();

      // Assert
      expect(mockDocumentService.searchDocuments).toHaveBeenCalledWith(
        {
          docLinkedTable: 'DONORS',
          docLinkedColumn: 'DONOR_ID',
          docLinkedValue: '00008392',
        },
        1000,
        0
      );
    });

    it('should set error if donorId is missing', () => {
      // Arrange
      component.data.donorId = '';

      // Act
      component.loadDocuments();

      // Assert
      expect(component.error()).toBe('Donor ID is required to load documents');
      expect(mockDocumentService.searchDocuments).not.toHaveBeenCalled();
    });
  });

  describe('Document loading', () => {
    it('should display documents when loaded successfully', () => {
      // Arrange
      mockDocumentService.searchDocuments.and.returnValue(
        of({ documents: mockDocuments, total: 2 })
      );

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.documents().length).toBe(2);
      expect(component.hasDocuments()).toBe(true);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });

    it('should handle documents with multiple linked values', () => {
      // Arrange
      const docWithMultipleValues: DocumentLibraryDto = {
        ...mockDocuments[0],
        linkedValues: ['00008392', '00008393'],
      };
      mockDocumentService.searchDocuments.and.returnValue(
        of({ documents: [docWithMultipleValues], total: 1 })
      );

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.documents().length).toBe(2); // One row per linked value
    });




  });

  describe('Document download', () => {
    beforeEach(() => {
      mockDocumentService.searchDocuments.and.returnValue(
        of({ documents: mockDocuments, total: 2 })
      );
      fixture.detectChanges();
    });

    it('should download selected document', (done) => {
      // Arrange
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      mockDocumentService.downloadDocument.and.returnValue(of(mockBlob));
      component.onSelectionChange([component.documents()[0]]);

      // Create spy for window.URL methods
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:test');
      spyOn(window.URL, 'revokeObjectURL');

      // Act
      component.onDownload();

      // Assert
      setTimeout(() => {
        expect(mockDocumentService.downloadDocument).toHaveBeenCalledWith('session-1');
        expect(component.downloading()).toBe(false);
        done();
      }, 600); // Wait for minimum display time
    });

    it('should show error when no document selected', () => {
      // Arrange
      component.onSelectionChange([]); // Ensure no documents selected
      mockSnackBar.open.calls.reset(); // Reset spy
      fixture.detectChanges(); // Ensure component is fully initialized

      // Act
      component.onDownload();

      // Assert
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Please select exactly one document to download',
        'Close',
        jasmine.objectContaining({
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        })
      );
    });

    it('should show error when multiple documents selected', () => {
      // Arrange
      fixture.detectChanges(); // Ensure component is fully initialized
      mockSnackBar.open.calls.reset(); // Reset spy
      component.onSelectionChange([component.documents()[0], component.documents()[1]]);

      // Act
      component.onDownload();

      // Assert
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Please select exactly one document to download',
        'Close',
        jasmine.objectContaining({
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        })
      );
    });

    it('should handle download error', (done) => {
      // Arrange
      fixture.detectChanges(); // Ensure component is fully initialized
      mockSnackBar.open.calls.reset(); // Reset spy
      mockDocumentService.downloadDocument.and.returnValue(
        throwError(() => new Error('Download failed'))
      );
      component.onSelectionChange([component.documents()[0]]);

      // Act
      component.onDownload();

      // Assert - wait for async error handler
      setTimeout(() => {
        expect(component.downloading()).toBe(false);
        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Failed to download document',
          'Close',
          jasmine.objectContaining({
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          })
        );
        done();
      }, 100);
    });
  });

  describe('Selection management', () => {
    beforeEach(() => {
      mockDocumentService.searchDocuments.and.returnValue(
        of({ documents: mockDocuments, total: 2 })
      );
      fixture.detectChanges();
    });

    it('should update selected documents', () => {
      // Arrange
      const selectedDoc = component.documents()[0];

      // Act
      component.onSelectionChange([selectedDoc]);

      // Assert
      expect(component.selectedDocuments().length).toBe(1);
      expect(component.hasSelection()).toBe(true);
      expect(component.singleSelection()).toBe(true);
    });

    it('should track multiple selections', () => {
      // Act
      component.onSelectionChange(component.documents());

      // Assert
      expect(component.selectedDocuments().length).toBe(2);
      expect(component.hasSelection()).toBe(true);
      expect(component.singleSelection()).toBe(false);
    });
  });
});
