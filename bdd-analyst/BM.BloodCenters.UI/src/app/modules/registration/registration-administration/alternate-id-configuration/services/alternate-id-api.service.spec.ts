import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AlternateIdApiService } from './alternate-id-api.service';
import { ApiService } from '../../../../../shared/services/api.service';
import { API } from '../../../../../core/constants/api.constants';
import {
  AlternateIdDonorGrade,
  AlternateIdForm,
  AlternateIdApiResponse,
} from '../models/alternate-id.model';

describe('AlternateIdApiService', () => {
  let service: AlternateIdApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockApiItem = {
    keyDataGrade: '3',
    altidMatchType: 'SAME',
    finalGrade: '5',
    effDate: '2024-06-01T00:00:00Z',
    termDate: '2025-12-31T00:00:00Z',
    programId: 'VDIALTID',
    insertDate: '2024-06-01T12:00:00Z',
    insertUser: 'TESTUSER',
    auditKey: 42,
  };

  const mockForm: AlternateIdForm = {
    keyDataGrade: '3',
    altidMatchType: 'SAME',
    finalGrade: '5',
    effDate: '2024-06-01',
    termDate: '2025-12-31',
  };

  const mockFormNoTerm: AlternateIdForm = {
    keyDataGrade: '2',
    altidMatchType: 'DIFF',
    finalGrade: '4',
    effDate: '2024-01-01',
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        AlternateIdApiService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(AlternateIdApiService);
  });

  // ---------------------------------------------------------------
  // getAll
  // ---------------------------------------------------------------
  describe('getAll', () => {
    it('should POST to the correct endpoint with default take/skip', (done) => {
      const mockResponse: AlternateIdApiResponse = {
        success: true,
        data: [mockApiItem],
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getAll().subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.ALTERNATE_ID_CONFIG.GET_ALL(1000, 0),
          {}
        );
        done();
      });
    });

    it('should POST to the correct endpoint with custom take/skip', (done) => {
      const mockResponse: AlternateIdApiResponse = {
        success: true,
        data: [mockApiItem],
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getAll(25, 50).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.ALTERNATE_ID_CONFIG.GET_ALL(25, 50),
          {}
        );
        done();
      });
    });

    it('should map API response data via fromApiResponse', (done) => {
      const mockResponse: AlternateIdApiResponse = {
        success: true,
        data: [mockApiItem],
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getAll().subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].keyDataGrade).toBe('3');
        expect(result[0].altidMatchType).toBe('SAME');
        expect(result[0].finalGrade).toBe('5');
        expect(result[0].effDate).toEqual(jasmine.any(Date));
        expect(result[0].termDate).toEqual(jasmine.any(Date));
        expect(result[0].programId).toBe('VDIALTID');
        expect(result[0].insertDate).toEqual(jasmine.any(Date));
        expect(result[0].insertUser).toBe('TESTUSER');
        expect(result[0].auditKey).toBe(42);
        done();
      });
    });

    it('should default programId to VDIALTID when not present in response', (done) => {
      const itemNoProgramId = { ...mockApiItem, programId: undefined };
      const mockResponse: AlternateIdApiResponse = {
        success: true,
        data: [itemNoProgramId],
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getAll().subscribe((result) => {
        expect(result[0].programId).toBe('VDIALTID');
        done();
      });
    });

    it('should return an empty array when data is null/undefined', (done) => {
      const mockResponse: AlternateIdApiResponse = {
        success: true,
        data: undefined,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getAll().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should throw when response.success is false with message', (done) => {
      const failResponse: AlternateIdApiResponse = {
        success: false,
        message: 'Fetch failed',
      };
      apiServiceSpy.post.and.returnValue(of(failResponse));
      spyOn(console, 'error');

      service.getAll().subscribe({
        error: (err) => {
          expect(err.message).toBe('Fetch failed');
          done();
        },
      });
    });

    it('should throw with default message when response.success is false and no message', (done) => {
      const failResponse: AlternateIdApiResponse = {
        success: false,
      };
      apiServiceSpy.post.and.returnValue(of(failResponse));
      spyOn(console, 'error');

      service.getAll().subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to fetch alternate ID configurations');
          done();
        },
      });
    });

    it('should propagate API-level errors', (done) => {
      const apiError = new Error('Network error');
      apiServiceSpy.post.and.returnValue(throwError(() => apiError));
      spyOn(console, 'error');

      service.getAll().subscribe({
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // getByAuditKey
  // ---------------------------------------------------------------
  describe('getByAuditKey', () => {
    it('should GET from the correct endpoint', (done) => {
      const mockResponse: AlternateIdApiResponse = {
        success: true,
        item: mockApiItem as any,
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getByAuditKey(42).subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.ALTERNATE_ID_CONFIG.GET_BY_AUDIT_KEY(42)
        );
        done();
      });
    });

    it('should map response.item via fromApiResponse on success', (done) => {
      const mockResponse: AlternateIdApiResponse = {
        success: true,
        item: mockApiItem as any,
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getByAuditKey(42).subscribe((result) => {
        expect(result).toBeDefined();
        expect(result!.keyDataGrade).toBe('3');
        expect(result!.altidMatchType).toBe('SAME');
        expect(result!.effDate).toEqual(jasmine.any(Date));
        expect(result!.auditKey).toBe(42);
        done();
      });
    });

    it('should return undefined when response.success is false', (done) => {
      const mockResponse: AlternateIdApiResponse = {
        success: false,
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getByAuditKey(999).subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should return undefined when response.item is missing', (done) => {
      const mockResponse: AlternateIdApiResponse = {
        success: true,
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getByAuditKey(999).subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should handle 404 errors with structured error', (done) => {
      const notFoundError = { status: 404 };
      apiServiceSpy.get.and.returnValue(throwError(() => notFoundError));

      service.getByAuditKey(999).subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
          expect(err.error.message).toBe('Record not found');
          done();
        },
      });
    });

    it('should propagate non-404 API errors', (done) => {
      const apiError = { status: 500, message: 'Server error' };
      apiServiceSpy.get.and.returnValue(throwError(() => apiError));
      spyOn(console, 'error');

      service.getByAuditKey(42).subscribe({
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // create
  // ---------------------------------------------------------------
  describe('create', () => {
    it('should POST to the correct endpoint with mapped request body', (done) => {
      const mockResponse: AlternateIdApiResponse = {
        success: true,
        item: mockApiItem as any,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.create(mockForm).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.ALTERNATE_ID_CONFIG.CREATE,
          jasmine.objectContaining({
            keyDataGrade: '3',
            altidMatchType: 'SAME',
            finalGrade: '5',
            effDate: '2024-06-01',
            termDate: '2025-12-31',
          })
        );
        done();
      });
    });

    it('should send undefined termDate when form.termDate is null/empty', (done) => {
      const mockResponse: AlternateIdApiResponse = {
        success: true,
        item: { ...mockApiItem, termDate: null } as any,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.create(mockFormNoTerm).subscribe(() => {
        const requestBody = apiServiceSpy.post.calls.mostRecent().args[1];
        expect(requestBody.termDate).toBeUndefined();
        done();
      });
    });

    it('should map response.item via fromApiResponse on success', (done) => {
      const mockResponse: AlternateIdApiResponse = {
        success: true,
        item: mockApiItem as any,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.create(mockForm).subscribe((result) => {
        expect(result.keyDataGrade).toBe('3');
        expect(result.altidMatchType).toBe('SAME');
        expect(result.finalGrade).toBe('5');
        expect(result.effDate).toEqual(jasmine.any(Date));
        expect(result.programId).toBe('VDIALTID');
        expect(result.auditKey).toBe(42);
        done();
      });
    });

    it('should throw when response.success is false with message', (done) => {
      const failResponse: AlternateIdApiResponse = {
        success: false,
        message: 'Duplicate record',
      };
      apiServiceSpy.post.and.returnValue(of(failResponse));
      spyOn(console, 'error');

      service.create(mockForm).subscribe({
        error: (err) => {
          expect(err.message).toBe('Duplicate record');
          done();
        },
      });
    });

    it('should fall back to errorResponse.error when message is empty', (done) => {
      const failResponse: AlternateIdApiResponse = {
        success: false,
        message: '',
        errorResponse: { error: 'Validation error from server' },
      };
      apiServiceSpy.post.and.returnValue(of(failResponse));
      spyOn(console, 'error');

      service.create(mockForm).subscribe({
        error: (err) => {
          expect(err.message).toBe('Validation error from server');
          done();
        },
      });
    });

    it('should throw default message when both message and errorResponse.error are empty', (done) => {
      const failResponse: AlternateIdApiResponse = {
        success: false,
      };
      apiServiceSpy.post.and.returnValue(of(failResponse));
      spyOn(console, 'error');

      service.create(mockForm).subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to create alternate ID configuration');
          done();
        },
      });
    });

    it('should propagate API-level errors', (done) => {
      const apiError = new Error('Network failure');
      apiServiceSpy.post.and.returnValue(throwError(() => apiError));
      spyOn(console, 'error');

      service.create(mockForm).subscribe({
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // update
  // ---------------------------------------------------------------
  describe('update', () => {
    it('should PUT to the correct endpoint with mapped request body including auditKey', (done) => {
      const mockResponse: AlternateIdApiResponse = {
        success: true,
        item: mockApiItem as any,
      };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.update(42, mockForm).subscribe(() => {
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          API.ALTERNATE_ID_CONFIG.UPDATE,
          jasmine.objectContaining({
            auditKey: 42,
            keyDataGrade: '3',
            altidMatchType: 'SAME',
            finalGrade: '5',
            effDate: '2024-06-01',
            termDate: '2025-12-31',
          })
        );
        done();
      });
    });

    it('should send undefined termDate when form.termDate is null/empty', (done) => {
      const mockResponse: AlternateIdApiResponse = {
        success: true,
        item: { ...mockApiItem, termDate: null, auditKey: 99 } as any,
      };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.update(99, mockFormNoTerm).subscribe(() => {
        const requestBody = apiServiceSpy.put.calls.mostRecent().args[1];
        expect(requestBody.termDate).toBeUndefined();
        expect(requestBody.auditKey).toBe(99);
        done();
      });
    });

    it('should map response.item via fromApiResponse on success', (done) => {
      const mockResponse: AlternateIdApiResponse = {
        success: true,
        item: mockApiItem as any,
      };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.update(42, mockForm).subscribe((result) => {
        expect(result.keyDataGrade).toBe('3');
        expect(result.effDate).toEqual(jasmine.any(Date));
        expect(result.programId).toBe('VDIALTID');
        expect(result.auditKey).toBe(42);
        done();
      });
    });

    it('should throw when response.success is false with message', (done) => {
      const failResponse: AlternateIdApiResponse = {
        success: false,
        message: 'Update failed',
      };
      apiServiceSpy.put.and.returnValue(of(failResponse));
      spyOn(console, 'error');

      service.update(42, mockForm).subscribe({
        error: (err) => {
          expect(err.message).toBe('Update failed');
          done();
        },
      });
    });

    it('should fall back to errorResponse.error when message is empty', (done) => {
      const failResponse: AlternateIdApiResponse = {
        success: false,
        message: '',
        errorResponse: { error: 'Concurrency conflict' },
      };
      apiServiceSpy.put.and.returnValue(of(failResponse));
      spyOn(console, 'error');

      service.update(42, mockForm).subscribe({
        error: (err) => {
          expect(err.message).toBe('Concurrency conflict');
          done();
        },
      });
    });

    it('should throw default message when both message and errorResponse.error are empty', (done) => {
      const failResponse: AlternateIdApiResponse = {
        success: false,
      };
      apiServiceSpy.put.and.returnValue(of(failResponse));
      spyOn(console, 'error');

      service.update(42, mockForm).subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to update alternate ID configuration');
          done();
        },
      });
    });

    it('should handle 404 errors with structured error', (done) => {
      const notFoundError = { status: 404 };
      apiServiceSpy.put.and.returnValue(throwError(() => notFoundError));

      service.update(999, mockForm).subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
          expect(err.error.message).toBe('Record not found');
          done();
        },
      });
    });

    it('should propagate non-404 API errors', (done) => {
      const apiError = { status: 500, message: 'Server error' };
      apiServiceSpy.put.and.returnValue(throwError(() => apiError));
      spyOn(console, 'error');

      service.update(42, mockForm).subscribe({
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------
  describe('delete', () => {
    it('should DELETE from the correct endpoint', (done) => {
      const mockResponse: AlternateIdApiResponse = {
        success: true,
      };
      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      service.delete(42).subscribe(() => {
        expect(apiServiceSpy.delete).toHaveBeenCalledWith(
          API.ALTERNATE_ID_CONFIG.DELETE(42)
        );
        done();
      });
    });

    it('should return void on success', (done) => {
      const mockResponse: AlternateIdApiResponse = {
        success: true,
      };
      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      service.delete(42).subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should throw when response.success is false with message', (done) => {
      const failResponse: AlternateIdApiResponse = {
        success: false,
        message: 'Cannot delete active record',
      };
      apiServiceSpy.delete.and.returnValue(of(failResponse));
      spyOn(console, 'error');

      service.delete(42).subscribe({
        error: (err) => {
          expect(err.message).toBe('Cannot delete active record');
          done();
        },
      });
    });

    it('should throw default message when response.success is false and no message', (done) => {
      const failResponse: AlternateIdApiResponse = {
        success: false,
      };
      apiServiceSpy.delete.and.returnValue(of(failResponse));
      spyOn(console, 'error');

      service.delete(42).subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to delete alternate ID configuration');
          done();
        },
      });
    });

    it('should handle 404 errors with structured error', (done) => {
      const notFoundError = { status: 404 };
      apiServiceSpy.delete.and.returnValue(throwError(() => notFoundError));

      service.delete(999).subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
          expect(err.error.message).toBe('Record not found');
          done();
        },
      });
    });

    it('should propagate non-404 API errors', (done) => {
      const apiError = { status: 500, message: 'Server error' };
      apiServiceSpy.delete.and.returnValue(throwError(() => apiError));
      spyOn(console, 'error');

      service.delete(42).subscribe({
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        },
      });
    });
  });
});
