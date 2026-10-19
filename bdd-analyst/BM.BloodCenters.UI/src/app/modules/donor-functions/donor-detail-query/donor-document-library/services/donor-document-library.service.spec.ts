import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';

import { DonorDocumentLibraryService } from './donor-document-library.service';

describe('DonorDocumentLibraryService', () => {
  let service: DonorDocumentLibraryService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', [
      'get',
      'post',
      'put',
      'delete',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DonorDocumentLibraryService,
        { provide: ApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(DonorDocumentLibraryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('searchDocuments', () => {
    const filters = {
      docLinkedTable: 'DONORS',
      docLinkedColumn: 'DONOR_ID',
      docLinkedValue: '12345',
    };

    it('should call the search endpoint with correct params', () => {
      const mockResponse = {
        success: true,
        data: [
          { sessionId: 's1', docName: 'file.pdf', docId: 'D1' },
          { sessionId: 's2', docName: 'file2.docx', docId: 'D2' },
        ],
        total: 2,
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.searchDocuments(filters, 1000, 0).subscribe((result) => {
        expect(result.documents.length).toBe(2);
        expect(result.total).toBe(2);
      });

      expect(mockApiService.post).toHaveBeenCalledWith(
        API.USER_UTILITIES.DOCUMENT_LIBRARY.SEARCH(1000, 0),
        filters,
      );
    });

    it('should return empty documents when response is not successful', () => {
      const mockResponse = { success: false, data: null };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.searchDocuments(filters, 100, 0).subscribe((result) => {
        expect(result.documents).toEqual([]);
        expect(result.total).toBe(0);
      });
    });

    it('should return empty documents when response data is null', () => {
      const mockResponse = { success: true, data: null };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.searchDocuments(filters, 100, 0).subscribe((result) => {
        expect(result.documents).toEqual([]);
        expect(result.total).toBe(0);
      });
    });

    it('should default total to 0 when not provided in response', () => {
      const mockResponse = {
        success: true,
        data: [{ sessionId: 's1' }],
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.searchDocuments(filters, 100, 0).subscribe((result) => {
        expect(result.total).toBe(0);
      });
    });

    it('should handle null response gracefully', () => {
      mockApiService.post.and.returnValue(of(null));

      service.searchDocuments(filters, 100, 0).subscribe((result) => {
        expect(result.documents).toEqual([]);
        expect(result.total).toBe(0);
      });
    });

    it('should propagate errors', (done) => {
      const error = new Error('Network error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.searchDocuments(filters, 100, 0).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should pass different take/skip values to the endpoint', () => {
      mockApiService.post.and.returnValue(
        of({ success: true, data: [], total: 0 }),
      );

      service.searchDocuments({}, 50, 25).subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith(
        API.USER_UTILITIES.DOCUMENT_LIBRARY.SEARCH(50, 25),
        {},
      );
    });
  });

  describe('uploadDocument', () => {
    let mockFile: File;

    beforeEach(() => {
      mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });
    });

    it('should post FormData with file and metadata', () => {
      const metadata = { docName: 'Test Doc', docId: 'D1' };
      const mockResponse = { success: true, item: { sessionId: 's1' } };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.uploadDocument(mockFile, metadata).subscribe((result) => {
        expect(result).toEqual({ sessionId: 's1' });
      });

      expect(mockApiService.post).toHaveBeenCalled();
      const callArgs = mockApiService.post.calls.mostRecent().args;
      expect(callArgs[0]).toBe(API.USER_UTILITIES.DOCUMENT_LIBRARY.UPLOAD);
      expect(callArgs[1] instanceof FormData).toBeTrue();
    });

    it('should append File and Metadata to FormData', () => {
      const metadata = { docName: 'Test Doc' };
      const mockResponse = { success: true, data: { id: 1 } };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.uploadDocument(mockFile, metadata).subscribe();

      const formData = mockApiService.post.calls.mostRecent().args[1] as FormData;
      expect(formData.get('File')).toBeTruthy();
      expect(formData.get('Metadata')).toBe(JSON.stringify(metadata));
    });

    it('should return response.item when present', () => {
      const mockResponse = { success: true, item: { id: 'abc' } };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.uploadDocument(mockFile, {}).subscribe((result) => {
        expect(result).toEqual({ id: 'abc' });
      });
    });

    it('should return response.data when item is not present', () => {
      const mockResponse = { success: true, data: { id: 'xyz' } };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.uploadDocument(mockFile, {}).subscribe((result) => {
        expect(result).toEqual({ id: 'xyz' });
      });
    });

    it('should throw error when response is not successful', (done) => {
      const mockResponse = {
        success: false,
        message: 'File too large',
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.uploadDocument(mockFile, {}).subscribe({
        error: (err) => {
          expect(err.message).toBe('File too large');
          done();
        },
      });
    });

    it('should throw default error message when response has no message', (done) => {
      const mockResponse = { success: false };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.uploadDocument(mockFile, {}).subscribe({
        error: (err) => {
          expect(err.message).toBe('Upload failed');
          done();
        },
      });
    });

    it('should propagate network errors', (done) => {
      const error = new Error('Network error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.uploadDocument(mockFile, {}).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('downloadDocument', () => {
    it('should call the download endpoint with session ID', () => {
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });
      mockApiService.get.and.returnValue(of(mockBlob));

      service.downloadDocument('session-abc').subscribe((result) => {
        expect(result).toBe(mockBlob);
      });

      expect(mockApiService.get).toHaveBeenCalledWith(
        API.USER_UTILITIES.DOCUMENT_LIBRARY.DOWNLOAD('session-abc'),
        { responseType: 'blob' as any },
      );
    });

    it('should pass responseType blob option', () => {
      mockApiService.get.and.returnValue(of(new Blob()));

      service.downloadDocument('s1').subscribe();

      const options = mockApiService.get.calls.mostRecent().args[1];
      expect(options?.responseType).toBe('blob');
    });
  });

  describe('deleteDocument', () => {
    it('should call the delete endpoint with sessionId and deleteRequest', () => {
      mockApiService.delete.and.returnValue(of(null));

      const deleteRequest = { deleteAll: true };
      service
        .deleteDocument('session-abc', deleteRequest)
        .subscribe((result) => {
          expect(result).toBeUndefined();
        });

      expect(mockApiService.delete).toHaveBeenCalledWith(
        API.USER_UTILITIES.DOCUMENT_LIBRARY.DELETE('session-abc'),
        { body: deleteRequest },
      );
    });

    it('should support deleteAll with selectedValues', () => {
      mockApiService.delete.and.returnValue(of(null));

      const deleteRequest = {
        deleteAll: false,
        selectedValues: ['val1', 'val2'],
      };
      service.deleteDocument('s1', deleteRequest).subscribe();

      const args = mockApiService.delete.calls.mostRecent().args;
      expect(args[1]?.body).toEqual(deleteRequest);
    });

    it('should map response to void', () => {
      mockApiService.delete.and.returnValue(of({ success: true }));

      service
        .deleteDocument('s1', { deleteAll: true })
        .subscribe((result) => {
          expect(result).toBeUndefined();
        });
    });

    it('should propagate errors', (done) => {
      const error = new Error('Delete failed');
      mockApiService.delete.and.returnValue(throwError(() => error));

      service.deleteDocument('s1', { deleteAll: true }).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getLinkCategories', () => {
    it('should call the link categories endpoint', () => {
      const mockResponse = {
        success: true,
        data: [
          {
            code: 'DON',
            description: 'Donors',
            tableName: 'DONORS',
            columnName: 'DONOR_ID',
          },
          {
            code: 'PRD',
            description: 'Products',
            tableName: 'PRODUCTS',
            columnName: 'PROD_ID',
          },
        ],
      };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getLinkCategories().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({
          code: 'DON',
          linkWith: 'Donors',
          linkTable: 'DONORS',
          linkColumn: 'DONOR_ID',
        });
        expect(result[1]).toEqual({
          code: 'PRD',
          linkWith: 'Products',
          linkTable: 'PRODUCTS',
          linkColumn: 'PROD_ID',
        });
      });

      expect(mockApiService.get).toHaveBeenCalledWith(
        API.USER_UTILITIES.DOCUMENT_LIBRARY.LINK_CATEGORIES,
      );
    });

    it('should return empty array when response is not successful', () => {
      mockApiService.get.and.returnValue(of({ success: false }));

      service.getLinkCategories().subscribe((result) => {
        expect(result).toEqual([]);
      });
    });

    it('should return empty array when response data is null', () => {
      mockApiService.get.and.returnValue(of({ success: true, data: null }));

      service.getLinkCategories().subscribe((result) => {
        expect(result).toEqual([]);
      });
    });

    it('should propagate errors', (done) => {
      const error = new Error('Server error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getLinkCategories().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('linkValues', () => {
    it('should call the link values endpoint with session ID and values', () => {
      const mockResponse = { success: true };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.linkValues('session-1', ['val1', 'val2']).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      expect(mockApiService.post).toHaveBeenCalledWith(
        API.USER_UTILITIES.DOCUMENT_LIBRARY.LINK_VALUES('session-1'),
        { valuesToLink: ['val1', 'val2'] },
      );
    });

    it('should propagate errors', (done) => {
      const error = new Error('Link failed');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.linkValues('s1', ['v1']).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('validateValue', () => {
    it('should call the validate endpoint with encoded params', () => {
      const mockResponse = { success: true };
      mockApiService.get.and.returnValue(of(mockResponse));

      service
        .validateValue('DONORS', 'DONOR_ID', '12345')
        .subscribe((result) => {
          expect(result).toBeTrue();
        });

      const calledUrl = mockApiService.get.calls.mostRecent().args[0];
      expect(calledUrl).toContain(
        API.USER_UTILITIES.DOCUMENT_LIBRARY.VALIDATE_VALUE,
      );
      expect(calledUrl).toContain('tableName=DONORS');
      expect(calledUrl).toContain('columnName=DONOR_ID');
      expect(calledUrl).toContain('value=12345');
    });

    it('should return false when response success is not true', () => {
      mockApiService.get.and.returnValue(of({ success: false }));

      service
        .validateValue('DONORS', 'DONOR_ID', '99999')
        .subscribe((result) => {
          expect(result).toBeFalse();
        });
    });

    it('should return false when response is null', () => {
      mockApiService.get.and.returnValue(of(null));

      service.validateValue('T', 'C', 'V').subscribe((result) => {
        expect(result).toBeFalse();
      });
    });

    it('should propagate network error on failure', (done) => {
      const error = new Error('Network error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.validateValue('T', 'C', 'V').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should encode special characters in params', () => {
      mockApiService.get.and.returnValue(of({ success: true }));

      service.validateValue('MY TABLE', 'COL NAME', 'val&ue').subscribe();

      const calledUrl = mockApiService.get.calls.mostRecent().args[0];
      expect(calledUrl).toContain('tableName=MY%20TABLE');
      expect(calledUrl).toContain('columnName=COL%20NAME');
      expect(calledUrl).toContain('value=val%26ue');
    });
  });

  describe('getColumnCodes', () => {
    it('should call the column codes endpoint without params when no tableName provided', () => {
      const mockResponse = {
        success: true,
        data: [
          { columnName: 'DONOR_ID' },
          { columnName: 'STATUS' },
          { columnName: 'DONOR_ID' },
        ],
      };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getColumnCodes().subscribe((result) => {
        expect(result).toEqual(['DONOR_ID', 'STATUS']);
      });

      expect(mockApiService.get).toHaveBeenCalledWith(
        API.USER_UTILITIES.DOCUMENT_LIBRARY.COLUMN_CODES,
      );
    });

    it('should append tableName param when provided', () => {
      const mockResponse = {
        success: true,
        data: [{ columnName: 'COL1' }],
      };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getColumnCodes('DONORS').subscribe((result) => {
        expect(result).toEqual(['COL1']);
      });

      const calledUrl = mockApiService.get.calls.mostRecent().args[0];
      expect(calledUrl).toContain('?tableName=DONORS');
    });

    it('should deduplicate column names', () => {
      const mockResponse = {
        success: true,
        data: [
          { columnName: 'A' },
          { columnName: 'B' },
          { columnName: 'A' },
          { columnName: 'C' },
          { columnName: 'B' },
        ],
      };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getColumnCodes().subscribe((result) => {
        expect(result).toEqual(['A', 'B', 'C']);
      });
    });

    it('should return empty array when response is not successful', () => {
      mockApiService.get.and.returnValue(of({ success: false }));

      service.getColumnCodes().subscribe((result) => {
        expect(result).toEqual([]);
      });
    });

    it('should return empty array when response data is null', () => {
      mockApiService.get.and.returnValue(of({ success: true, data: null }));

      service.getColumnCodes().subscribe((result) => {
        expect(result).toEqual([]);
      });
    });

    it('should propagate errors', (done) => {
      const error = new Error('Server error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getColumnCodes().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should encode tableName with special characters', () => {
      mockApiService.get.and.returnValue(
        of({ success: true, data: [] }),
      );

      service.getColumnCodes('MY TABLE').subscribe();

      const calledUrl = mockApiService.get.calls.mostRecent().args[0];
      expect(calledUrl).toContain('tableName=MY%20TABLE');
    });
  });
});
