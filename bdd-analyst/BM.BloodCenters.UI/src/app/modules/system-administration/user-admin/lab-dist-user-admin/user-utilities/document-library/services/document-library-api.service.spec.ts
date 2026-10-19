import { TestBed } from '@angular/core/testing';
import { HttpParams } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { DocumentLibraryApiService } from './document-library-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  DocumentLibraryDto,
  UploadMetadata,
  DeleteDocumentRequest
} from '../models/document-library.model';

describe('DocumentLibraryApiService', () => {
  let service: DocumentLibraryApiService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockDocument: DocumentLibraryDto = {
    chapterId: 'CH001',
    sessionId: 'sess-001',
    docName: 'test-document.pdf',
    docType: 'pdf',
    docId: 'DOC001',
    docLinkedTable: 'Donors',
    docLinkedColumn: 'DonorId',
    docLinkedDesc: 'Donor Documents',
    insertDate: '2025-01-15T00:00:00Z',
    insertUser: 'admin',
    linkedValues: ['VAL1', 'VAL2']
  };

  const mockMetadata: UploadMetadata = {
    docName: 'test-document.pdf',
    docId: 'DOC001',
    docLinkedTable: 'Donors',
    docLinkedColumn: 'DonorId',
    docLinkedDesc: 'Donor Documents',
    linkedValues: ['VAL1']
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        DocumentLibraryApiService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(DocumentLibraryApiService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── uploadDocument ──────────────────────────────────────────────────

  describe('uploadDocument', () => {
    it('should POST FormData with File and JSON metadata and return the item', (done) => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const mockResponse = { success: true, item: mockDocument, message: null };

      apiService.post.and.returnValue(of(mockResponse));

      service.uploadDocument(file, mockMetadata).subscribe({
        next: (result) => {
          expect(result).toEqual(mockDocument);

          const [url, body] = apiService.post.calls.mostRecent().args;
          expect(url).toBe(API.USER_UTILITIES.DOCUMENT_LIBRARY.UPLOAD);
          expect(body instanceof FormData).toBeTrue();
          expect(body.get('File')).toBeTruthy();
          expect(body.get('Metadata')).toBe(JSON.stringify(mockMetadata));
          done();
        }
      });
    });

    it('should throw when response.success is false', (done) => {
      const file = new File(['x'], 'bad.pdf');
      const mockResponse = { success: false, item: null, message: 'Upload failed' };

      apiService.post.and.returnValue(of(mockResponse));

      service.uploadDocument(file, mockMetadata).subscribe({
        error: (err) => {
          expect(err.message).toBe('Upload failed');
          done();
        }
      });
    });

    it('should throw with default message when response has no message', (done) => {
      const file = new File(['x'], 'bad.pdf');
      const mockResponse = { success: false, item: null, message: null };

      apiService.post.and.returnValue(of(mockResponse));

      service.uploadDocument(file, mockMetadata).subscribe({
        error: (err) => {
          expect(err.message).toBe('Upload failed');
          done();
        }
      });
    });

    it('should propagate HTTP errors', (done) => {
      const file = new File(['x'], 'err.pdf');
      const httpError = new Error('Network error');

      apiService.post.and.returnValue(throwError(() => httpError));

      service.uploadDocument(file, mockMetadata).subscribe({
        error: (err) => {
          expect(err.message).toBe('Network error');
          done();
        }
      });
    });
  });

  // ── searchDocuments ─────────────────────────────────────────────────

  describe('searchDocuments', () => {
    const filters = { docLinkedTable: 'Donors' };

    it('should POST filters and return documents with total', (done) => {
      const mockResponse = {
        success: true,
        data: [mockDocument],
        total: 1,
        message: null
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.searchDocuments(filters).subscribe({
        next: (result) => {
          expect(result.documents).toEqual([mockDocument]);
          expect(result.total).toBe(1);

          const [url] = apiService.post.calls.mostRecent().args;
          expect(url).toBe(API.USER_UTILITIES.DOCUMENT_LIBRARY.SEARCH(1000, 0));
          done();
        }
      });
    });

    it('should use provided take and skip values', (done) => {
      const mockResponse = { success: true, data: [], total: 0, message: null };

      apiService.post.and.returnValue(of(mockResponse));

      service.searchDocuments(filters, 50, 10).subscribe({
        next: () => {
          const [url] = apiService.post.calls.mostRecent().args;
          expect(url).toBe(API.USER_UTILITIES.DOCUMENT_LIBRARY.SEARCH(50, 10));
          done();
        }
      });
    });

    it('should default total to 0 when response.total is null', (done) => {
      const mockResponse = { success: true, data: [mockDocument], total: null, message: null };

      apiService.post.and.returnValue(of(mockResponse));

      service.searchDocuments(filters).subscribe({
        next: (result) => {
          expect(result.total).toBe(0);
          done();
        }
      });
    });

    it('should return empty documents when success is false', (done) => {
      const mockResponse = { success: false, data: null, total: null, message: 'Error' };

      apiService.post.and.returnValue(of(mockResponse));

      service.searchDocuments(filters).subscribe({
        next: (result) => {
          expect(result.documents).toEqual([]);
          expect(result.total).toBe(0);
          done();
        }
      });
    });

    it('should return empty documents when data is null', (done) => {
      const mockResponse = { success: true, data: null, total: null, message: null };

      apiService.post.and.returnValue(of(mockResponse));

      service.searchDocuments(filters).subscribe({
        next: (result) => {
          expect(result.documents).toEqual([]);
          expect(result.total).toBe(0);
          done();
        }
      });
    });

    it('should propagate HTTP errors', (done) => {
      const httpError = new Error('Server error');

      apiService.post.and.returnValue(throwError(() => httpError));

      service.searchDocuments(filters).subscribe({
        error: (err) => {
          expect(err.message).toBe('Server error');
          done();
        }
      });
    });
  });

  // ── getDocumentMetadata ─────────────────────────────────────────────

  describe('getDocumentMetadata', () => {
    it('should GET and return the document item', (done) => {
      const mockResponse = { success: true, item: mockDocument, message: null };

      apiService.get.and.returnValue(of(mockResponse));

      service.getDocumentMetadata('sess-001').subscribe({
        next: (result) => {
          expect(result).toEqual(mockDocument);

          const [url] = apiService.get.calls.mostRecent().args;
          expect(url).toBe(API.USER_UTILITIES.DOCUMENT_LIBRARY.GET('sess-001'));
          done();
        }
      });
    });

    it('should throw when response.success is false', (done) => {
      const mockResponse = { success: false, item: null, message: 'Document not found' };

      apiService.get.and.returnValue(of(mockResponse));

      service.getDocumentMetadata('bad-id').subscribe({
        error: (err) => {
          expect(err.message).toBe('Document not found');
          done();
        }
      });
    });

    it('should throw with default message when response has no message', (done) => {
      const mockResponse = { success: false, item: null, message: null };

      apiService.get.and.returnValue(of(mockResponse));

      service.getDocumentMetadata('bad-id').subscribe({
        error: (err) => {
          expect(err.message).toBe('Document not found');
          done();
        }
      });
    });

    it('should propagate HTTP errors', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('Not found')));

      service.getDocumentMetadata('bad-id').subscribe({
        error: (err) => {
          expect(err.message).toBe('Not found');
          done();
        }
      });
    });
  });

  // ── downloadDocument ────────────────────────────────────────────────

  describe('downloadDocument', () => {
    it('should GET with responseType blob and return the blob', (done) => {
      const blob = new Blob(['file content'], { type: 'application/pdf' });

      apiService.get.and.returnValue(of(blob));

      service.downloadDocument('sess-001').subscribe({
        next: (result) => {
          expect(result).toBe(blob);

          const [url, options] = apiService.get.calls.mostRecent().args;
          expect(url).toBe(API.USER_UTILITIES.DOCUMENT_LIBRARY.DOWNLOAD('sess-001'));
          expect(options).toEqual({ responseType: 'blob' });
          done();
        }
      });
    });

    it('should catch and propagate errors', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('Download error')));

      service.downloadDocument('sess-001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Download error');
          done();
        }
      });
    });
  });

  // ── deleteDocument ──────────────────────────────────────────────────

  describe('deleteDocument', () => {
    it('should DELETE with body and complete on success', (done) => {
      const mockResponse = { success: true, message: null };

      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteDocument('sess-001').subscribe({
        next: (result) => {
          expect(result).toBeUndefined();

          const [url, options] = apiService.delete.calls.mostRecent().args;
          expect(url).toBe(API.USER_UTILITIES.DOCUMENT_LIBRARY.DELETE('sess-001'));
          expect(options).toEqual({ body: { deleteAll: true } });
          done();
        }
      });
    });

    it('should accept a custom deleteRequest', (done) => {
      const deleteRequest: DeleteDocumentRequest = {
        deleteAll: false,
        selectedValues: ['VAL1']
      };
      const mockResponse = { success: true, message: null };

      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteDocument('sess-001', deleteRequest).subscribe({
        next: () => {
          const [, options] = apiService.delete.calls.mostRecent().args;
          expect(options).toEqual({ body: deleteRequest });
          done();
        }
      });
    });

    it('should succeed when message includes "deleted" even if success is false', (done) => {
      const mockResponse = { success: false, message: 'Record already deleted' };

      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteDocument('sess-001').subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          done();
        }
      });
    });

    it('should throw when success is false and message does not include "deleted"', (done) => {
      const mockResponse = { success: false, message: 'Delete failed' };

      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteDocument('sess-001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Delete failed');
          done();
        }
      });
    });

    it('should throw with default message when success is false and message is null', (done) => {
      const mockResponse = { success: false, message: null };

      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteDocument('sess-001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Delete failed');
          done();
        }
      });
    });

    it('should propagate HTTP errors', (done) => {
      apiService.delete.and.returnValue(throwError(() => new Error('Server error')));

      service.deleteDocument('sess-001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Server error');
          done();
        }
      });
    });
  });

  // ── getLinkCategories ───────────────────────────────────────────────

  describe('getLinkCategories', () => {
    it('should GET and map categories to TableColumnLink objects', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { code: 'C001', description: 'Donors', tableName: 'DonorTable', columnName: 'DonorId' },
          { code: 'C002', description: 'Units', tableName: 'UnitTable', columnName: 'UnitId' }
        ],
        message: null
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getLinkCategories().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0]).toEqual({
            code: 'C001',
            linkWith: 'Donors',
            linkTable: 'DonorTable',
            linkColumn: 'DonorId'
          });
          expect(result[1]).toEqual({
            code: 'C002',
            linkWith: 'Units',
            linkTable: 'UnitTable',
            linkColumn: 'UnitId'
          });

          const [url] = apiService.get.calls.mostRecent().args;
          expect(url).toBe(API.USER_UTILITIES.DOCUMENT_LIBRARY.LINK_CATEGORIES);
          done();
        }
      });
    });

    it('should return empty array when data is null', (done) => {
      const mockResponse = { success: true, data: null, message: null };

      apiService.get.and.returnValue(of(mockResponse));

      service.getLinkCategories().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should return empty array when success is false', (done) => {
      const mockResponse = { success: false, data: null, message: 'Error' };

      apiService.get.and.returnValue(of(mockResponse));

      service.getLinkCategories().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should propagate HTTP errors', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('Fetch error')));

      service.getLinkCategories().subscribe({
        error: (err) => {
          expect(err.message).toBe('Fetch error');
          done();
        }
      });
    });
  });

  // ── linkDocumentValues ──────────────────────────────────────────────

  describe('linkDocumentValues', () => {
    it('should POST FormData with SessionId and Metadata and return item', (done) => {
      const mockResponse = { success: true, item: mockDocument, message: null };

      apiService.post.and.returnValue(of(mockResponse));

      service.linkDocumentValues('sess-001', mockMetadata).subscribe({
        next: (result) => {
          expect(result).toEqual(mockDocument);

          const [url, body] = apiService.post.calls.mostRecent().args;
          expect(url).toBe(API.USER_UTILITIES.DOCUMENT_LIBRARY.UPLOAD);
          expect(body instanceof FormData).toBeTrue();
          expect(body.get('SessionId')).toBe('sess-001');
          expect(body.get('Metadata')).toBe(JSON.stringify(mockMetadata));
          done();
        }
      });
    });

    it('should throw when response.success is false', (done) => {
      const mockResponse = { success: false, item: null, message: 'Link failed' };

      apiService.post.and.returnValue(of(mockResponse));

      service.linkDocumentValues('sess-001', mockMetadata).subscribe({
        error: (err) => {
          expect(err.message).toBe('Link failed');
          done();
        }
      });
    });

    it('should throw with default message when response has no message', (done) => {
      const mockResponse = { success: false, item: null, message: null };

      apiService.post.and.returnValue(of(mockResponse));

      service.linkDocumentValues('sess-001', mockMetadata).subscribe({
        error: (err) => {
          expect(err.message).toBe('Link failed');
          done();
        }
      });
    });
  });

  // ── linkValues ──────────────────────────────────────────────────────

  describe('linkValues', () => {
    it('should POST valuesToLink and return item', (done) => {
      const values = ['VAL1', 'VAL2'];
      const mockResponse = { success: true, item: mockDocument, message: null };

      apiService.post.and.returnValue(of(mockResponse));

      service.linkValues('sess-001', values).subscribe({
        next: (result) => {
          expect(result).toEqual(mockDocument);

          const [url, body] = apiService.post.calls.mostRecent().args;
          expect(url).toBe(API.USER_UTILITIES.DOCUMENT_LIBRARY.LINK_VALUES('sess-001'));
          expect(body).toEqual({ valuesToLink: values });
          done();
        }
      });
    });

    it('should throw when response.success is false', (done) => {
      const mockResponse = { success: false, item: null, message: 'Failed to link values' };

      apiService.post.and.returnValue(of(mockResponse));

      service.linkValues('sess-001', ['VAL1']).subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to link values');
          done();
        }
      });
    });

    it('should throw with default message when response has no message', (done) => {
      const mockResponse = { success: false, item: null, message: null };

      apiService.post.and.returnValue(of(mockResponse));

      service.linkValues('sess-001', ['VAL1']).subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to link values');
          done();
        }
      });
    });

    it('should propagate HTTP errors', (done) => {
      apiService.post.and.returnValue(throwError(() => new Error('Server error')));

      service.linkValues('sess-001', ['VAL1']).subscribe({
        error: (err) => {
          expect(err.message).toBe('Server error');
          done();
        }
      });
    });
  });

  // ── validateValue ───────────────────────────────────────────────────

  describe('validateValue', () => {
    it('should GET with HttpParams and return the boolean item', (done) => {
      const mockResponse = { success: true, item: true, message: null };

      apiService.get.and.returnValue(of(mockResponse));

      service.validateValue('Donors', 'DonorId', '12345').subscribe({
        next: (result) => {
          expect(result).toBeTrue();

          const [url, options] = apiService.get.calls.mostRecent().args;
          expect(url).toBe(API.USER_UTILITIES.DOCUMENT_LIBRARY.VALIDATE_VALUE);
          expect(options.params.get('tableName')).toBe('Donors');
          expect(options.params.get('columnName')).toBe('DonorId');
          expect(options.params.get('value')).toBe('12345');
          done();
        }
      });
    });

    it('should return false when item is false', (done) => {
      const mockResponse = { success: true, item: false, message: null };

      apiService.get.and.returnValue(of(mockResponse));

      service.validateValue('Donors', 'DonorId', 'bad').subscribe({
        next: (result) => {
          expect(result).toBeFalse();
          done();
        }
      });
    });

    it('should return false when item is null', (done) => {
      const mockResponse = { success: true, item: null, message: null };

      apiService.get.and.returnValue(of(mockResponse));

      service.validateValue('Donors', 'DonorId', 'missing').subscribe({
        next: (result) => {
          expect(result).toBeFalse();
          done();
        }
      });
    });

    it('should return false when success is false', (done) => {
      const mockResponse = { success: false, item: null, message: 'Error' };

      apiService.get.and.returnValue(of(mockResponse));

      service.validateValue('Donors', 'DonorId', 'err').subscribe({
        next: (result) => {
          expect(result).toBeFalse();
          done();
        }
      });
    });

    it('should propagate HTTP errors', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('Validation error')));

      service.validateValue('Donors', 'DonorId', '12345').subscribe({
        error: (err) => {
          expect(err.message).toBe('Validation error');
          done();
        }
      });
    });
  });

  // ── getColumnCodes ──────────────────────────────────────────────────

  describe('getColumnCodes', () => {
    it('should GET and extract unique column names from data', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { columnName: 'DonorId', description: 'Donor ID' },
          { columnName: 'UnitId', description: 'Unit ID' },
          { columnName: 'DonorId', description: 'Donor ID (dup)' }
        ],
        message: null
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getColumnCodes().subscribe({
        next: (result) => {
          expect(result).toEqual(['DonorId', 'UnitId']);
          expect(result.length).toBe(2);

          const [url, options] = apiService.get.calls.mostRecent().args;
          expect(url).toBe(API.USER_UTILITIES.DOCUMENT_LIBRARY.COLUMN_CODES);
          expect(options.params.keys().length).toBe(0);
          done();
        }
      });
    });

    it('should pass tableName as HttpParam when provided', (done) => {
      const mockResponse = {
        success: true,
        data: [{ columnName: 'DonorId', description: 'Donor ID' }],
        message: null
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getColumnCodes('Donors').subscribe({
        next: () => {
          const [, options] = apiService.get.calls.mostRecent().args;
          expect(options.params.get('tableName')).toBe('Donors');
          done();
        }
      });
    });

    it('should return empty array when data is null', (done) => {
      const mockResponse = { success: true, data: null, message: null };

      apiService.get.and.returnValue(of(mockResponse));

      service.getColumnCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should return empty array when success is false', (done) => {
      const mockResponse = { success: false, data: null, message: 'Error' };

      apiService.get.and.returnValue(of(mockResponse));

      service.getColumnCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should propagate HTTP errors', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('Column codes error')));

      service.getColumnCodes().subscribe({
        error: (err) => {
          expect(err.message).toBe('Column codes error');
          done();
        }
      });
    });
  });
});
