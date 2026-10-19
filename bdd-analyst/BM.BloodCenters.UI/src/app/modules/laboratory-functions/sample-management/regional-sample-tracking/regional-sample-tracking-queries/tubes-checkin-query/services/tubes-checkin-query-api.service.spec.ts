import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { TubesCheckinQueryApiService } from './tubes-checkin-query-api.service';
import { API } from '@core/constants/api.constants';

describe('TubesCheckinQueryApiService', () => {
  let service: TubesCheckinQueryApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TubesCheckinQueryApiService],
    });

    service = TestBed.inject(TubesCheckinQueryApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Notes API calls', () => {
    const batchId = 'TEST-BATCH-001';
    const contractId = 'CONTRACT-001';
    const noteId = '123';

    it('should call getBatchNotes with correct URL and query params', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        errorCode: null,
        errorResponse: null,
      };

      service.getBatchNotes(batchId, contractId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        `${API.TUBES_CHECKIN_QUERY.QUERY}/notes/${encodeURIComponent(batchId)}?contractId=${contractId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should call createBatchNote with correct URL, body, and query params', () => {
      const request = { note: 'Test note' };
      const mockResponse = {
        success: true,
        message: 'Created',
        statusCode: 201,
        data: {
          note: 'Test note',
          auditKey: 1,
          noteSeq: 1,
          insertUserName: 'Test User',
          insertDateTime: '2024-01-01T00:00:00Z',
          versionNo: 1
        },
        errorCode: null,
        errorResponse: null,
      };

      service.createBatchNote(batchId, contractId, request).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.note).toBe('Test note');
      });

      const req = httpMock.expectOne(
        `${API.TUBES_CHECKIN_QUERY.QUERY}/notes/${encodeURIComponent(batchId)}?contractId=${contractId}`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should call updateBatchNote with correct URL, body, and query params', () => {
      const request = { note: 'Updated note' };
      const mockResponse = {
        success: true,
        message: 'Updated',
        statusCode: 200,
        data: {
          note: 'Updated note',
          auditKey: 1,
          noteSeq: 1,
          insertUserName: 'Test User',
          insertDateTime: '2024-01-01T00:00:00Z',
          updateUserName: 'Test User',
          updateDateTime: '2024-01-02T00:00:00Z',
          versionNo: 2
        },
        errorCode: null,
        errorResponse: null,
      };

      service.updateBatchNote(batchId, contractId, noteId, request).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.note).toBe('Updated note');
      });

      const req = httpMock.expectOne(
        `${API.TUBES_CHECKIN_QUERY.QUERY}/notes/${encodeURIComponent(batchId)}/${noteId}?contractId=${contractId}`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should call deleteBatchNote with correct URL and query params', () => {
      const mockResponse = {
        success: true,
        message: 'Deleted',
        statusCode: 200,
        data: null,
        errorCode: null,
        errorResponse: null,
      };

      service.deleteBatchNote(batchId, contractId, noteId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        `${API.TUBES_CHECKIN_QUERY.QUERY}/notes/${encodeURIComponent(batchId)}/${noteId}?contractId=${contractId}`
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });
});
