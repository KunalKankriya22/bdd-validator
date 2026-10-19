import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ErrorCodeApiService } from './error-code-api.service';
import { ApiService } from '../../../../shared/services/api.service';
import { TabType } from '../models/error-code.model';
import {
  ErrorCodeListApiResponse,
  ErrorCodeMutationApiResponse,
  ErrorCodeCreateRequest,
  ErrorCodeListRequest,
  PaginationParams,
  CodeExistenceCheckResponse,
} from '../models/error-code.model';

describe('ErrorCodeApiService', () => {
  let service: ErrorCodeApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockPagination: PaginationParams = { take: 10, skip: 0 };

  const mockListApiResponse: ErrorCodeListApiResponse = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: [
      {
        errorCode: 'E001',
        errorType: 'M',
        error: 'Test error message',
        auditFlag: 'Y',
      },
      {
        errorCode: 'E002',
        errorType: 'W',
        error: 'Warning message',
        auditFlag: 'N',
      },
    ],
    total: 2,
  };

  const mockMutationResponse: ErrorCodeMutationApiResponse = {
    success: true,
    message: 'Operation completed successfully',
    statusCode: 200,
  };

  const mockCreateRequest: ErrorCodeCreateRequest = {
    errorCode: 'E003',
    errorType: 'M',
    auditFlag: 'Y',
    error: 'New error message',
  };

  const mockCodeExistsResponse: CodeExistenceCheckResponse = {
    success: true,
    message: 'Success',
    item: { isExists: true },
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        ErrorCodeApiService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(ErrorCodeApiService);
  });

  // ---------------------------------------------------------------
  // Query (buildRequestBody + fetchErrorCodesList via public methods)
  // ---------------------------------------------------------------
  describe('query error codes', () => {
    it('should include only defined non-empty filter fields in the request', (done) => {
      const filters: ErrorCodeListRequest = {
        searchKeyword: 'blood',
        codeFrom: '',
        codeTo: undefined,
        auditFlag: 'Y',
        errorType: '',
        sort: 'asc',
      };

      apiServiceSpy.post.and.returnValue(of(mockListApiResponse));

      service.getDonorErrorCodes(filters, mockPagination).subscribe(() => {
        const postedBody = apiServiceSpy.post.calls.mostRecent().args[1];
        expect(postedBody.searchKeyword).toBe('blood');
        expect(postedBody.auditFlag).toBe('Y');
        expect(postedBody.sort).toBe('asc');
        expect(postedBody.codeFrom).toBeUndefined();
        expect(postedBody.codeTo).toBeUndefined();
        expect(postedBody.errorType).toBeUndefined();
        done();
      });
    });

    it('should include showEmpty even when its value is false', (done) => {
      const filters: ErrorCodeListRequest = { showEmpty: false };

      apiServiceSpy.post.and.returnValue(of(mockListApiResponse));

      service.getDonorErrorCodes(filters, mockPagination).subscribe(() => {
        const postedBody = apiServiceSpy.post.calls.mostRecent().args[1];
        expect(postedBody.showEmpty).toBe(false);
        done();
      });
    });

    it('should not include showEmpty when it is undefined', (done) => {
      const filters: ErrorCodeListRequest = {};

      apiServiceSpy.post.and.returnValue(of(mockListApiResponse));

      service.getDonorErrorCodes(filters, mockPagination).subscribe(() => {
        const postedBody = apiServiceSpy.post.calls.mostRecent().args[1];
        expect(postedBody.showEmpty).toBeUndefined();
        done();
      });
    });

    it('should map API response data via mapApiResponseToErrorCode', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockListApiResponse));

      service.getDonorErrorCodes({}, mockPagination).subscribe((result) => {
        expect(result.data.length).toBe(2);
        expect(result.total).toBe(2);
        expect(result.data[0].errorCode).toBe('E001');
        expect(result.data[0].errorType).toBe('M');
        expect(result.data[1].errorCode).toBe('E002');
        done();
      });
    });

    it('should throw when response.success is false', (done) => {
      const failResponse: ErrorCodeListApiResponse = {
        ...mockListApiResponse,
        success: false,
        message: 'Fetch failed',
      };
      apiServiceSpy.post.and.returnValue(of(failResponse));
      spyOn(console, 'error');

      service.getDonorErrorCodes({}, mockPagination).subscribe({
        error: (err) => {
          expect(err.message).toBe('Fetch failed');
          done();
        },
      });
    });

    it('should propagate API-level errors', (done) => {
      const apiError = new Error('Network error');
      apiServiceSpy.post.and.returnValue(throwError(() => apiError));
      spyOn(console, 'error');

      service.getDonorErrorCodes({}, mockPagination).subscribe({
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        },
      });
    });

    it('should call the correct endpoint for getDonorErrorCodes', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockListApiResponse));

      service.getDonorErrorCodes({}, { take: 25, skip: 50 }).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          '/api/v1/application-admin/donor-error-codes/25/50',
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should call the correct endpoint for getLabErrorCodes', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockListApiResponse));

      service.getLabErrorCodes({}, { take: 10, skip: 0 }).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          '/api/v1/admin/lab-error-codes/10/0',
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should call the correct endpoint for getDistributionErrorCodes', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockListApiResponse));

      service.getDistributionErrorCodes({}, { take: 10, skip: 0 }).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          '/api/v1/application-admin/distribution-error-codes/10/0',
          jasmine.any(Object)
        );
        done();
      });
    });
  });

  // ---------------------------------------------------------------
  // Tab-type routing for getErrorCodes
  // ---------------------------------------------------------------
  describe('getErrorCodes tab-type routing', () => {
    beforeEach(() => {
      apiServiceSpy.post.and.returnValue(of(mockListApiResponse));
    });

    it('should route to getDonorErrorCodes for TabType.DONOR', (done) => {
      service.getErrorCodes(TabType.DONOR, {}, mockPagination).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          jasmine.stringContaining('donor-error-codes'),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should route to getLabErrorCodes for TabType.LAB', (done) => {
      service.getErrorCodes(TabType.LAB, {}, mockPagination).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          jasmine.stringContaining('lab-error-codes'),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should route to getDistributionErrorCodes for TabType.DISTRIBUTION', (done) => {
      service.getErrorCodes(TabType.DISTRIBUTION, {}, mockPagination).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          jasmine.stringContaining('distribution-error-codes'),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should return throwError for an unknown tab type', (done) => {
      service.getErrorCodes('unknown' as TabType, {}, mockPagination).subscribe({
        error: (err) => {
          expect(err.message).toContain('not yet implemented');
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // Create error codes
  // ---------------------------------------------------------------
  describe('create error codes', () => {
    it('should POST to create a donor error code', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockMutationResponse));

      service.createDonorErrorCode(mockCreateRequest).subscribe((result) => {
        expect(result.success).toBeTrue();
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          '/api/v1/application-admin/donor-error-code',
          jasmine.objectContaining({
            errorCode: 'E003',
            errorType: 'M',
            auditFlag: 'Y',
            error: 'New error message',
          })
        );
        done();
      });
    });

    it('should POST to create a lab error code', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockMutationResponse));

      service.createLabErrorCode(mockCreateRequest).subscribe((result) => {
        expect(result.success).toBeTrue();
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          '/api/v1/admin/lab-error-code',
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should POST to create a distribution error code', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockMutationResponse));

      service.createDistributionErrorCode(mockCreateRequest).subscribe((result) => {
        expect(result.success).toBeTrue();
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          '/api/v1/application-admin/distribution-error-code',
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should throw when mutation response.success is false using message', (done) => {
      const failResponse: ErrorCodeMutationApiResponse = {
        success: false,
        message: 'Duplicate code',
        statusCode: 400,
      };
      apiServiceSpy.post.and.returnValue(of(failResponse));
      spyOn(console, 'error');

      service.createDonorErrorCode(mockCreateRequest).subscribe({
        error: (err) => {
          expect(err.message).toBe('Duplicate code');
          done();
        },
      });
    });

    it('should fall back to response.error when message is empty', (done) => {
      const failResponse: ErrorCodeMutationApiResponse = {
        success: false,
        message: '',
        statusCode: 400,
        error: 'Error field fallback',
      };
      apiServiceSpy.post.and.returnValue(of(failResponse));
      spyOn(console, 'error');

      service.createDonorErrorCode(mockCreateRequest).subscribe({
        error: (err) => {
          expect(err.message).toBe('Error field fallback');
          done();
        },
      });
    });

    it('should propagate API-level errors on create', (done) => {
      const apiError = new Error('Server error');
      apiServiceSpy.post.and.returnValue(throwError(() => apiError));
      spyOn(console, 'error');

      service.createDonorErrorCode(mockCreateRequest).subscribe({
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // createErrorCode tab-type routing
  // ---------------------------------------------------------------
  describe('createErrorCode tab-type routing', () => {
    beforeEach(() => {
      apiServiceSpy.post.and.returnValue(of(mockMutationResponse));
    });

    it('should route to createDonorErrorCode for TabType.DONOR', (done) => {
      service.createErrorCode(TabType.DONOR, mockCreateRequest).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          '/api/v1/application-admin/donor-error-code',
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should route to createLabErrorCode for TabType.LAB', (done) => {
      service.createErrorCode(TabType.LAB, mockCreateRequest).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          '/api/v1/admin/lab-error-code',
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should route to createDistributionErrorCode for TabType.DISTRIBUTION', (done) => {
      service.createErrorCode(TabType.DISTRIBUTION, mockCreateRequest).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          '/api/v1/application-admin/distribution-error-code',
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should return throwError for an unknown tab type', (done) => {
      service.createErrorCode('unknown' as TabType, mockCreateRequest).subscribe({
        error: (err) => {
          expect(err.message).toContain('not yet implemented');
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // Update error codes
  // ---------------------------------------------------------------
  describe('update error codes', () => {
    it('should PUT to update a donor error code and merge errorCode into request', (done) => {
      apiServiceSpy.put.and.returnValue(of(mockMutationResponse));

      service.updateDonorErrorCode('E001', mockCreateRequest).subscribe((result) => {
        expect(result.success).toBeTrue();
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          '/api/v1/application-admin/donor-error-code',
          jasmine.objectContaining({ errorCode: 'E001' })
        );
        done();
      });
    });

    it('should PUT to update a lab error code', (done) => {
      apiServiceSpy.put.and.returnValue(of(mockMutationResponse));

      service.updateLabErrorCode('L001', mockCreateRequest).subscribe((result) => {
        expect(result.success).toBeTrue();
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          '/api/v1/admin/lab-error-code',
          jasmine.objectContaining({ errorCode: 'L001' })
        );
        done();
      });
    });

    it('should PUT to update a distribution error code', (done) => {
      apiServiceSpy.put.and.returnValue(of(mockMutationResponse));

      service.updateDistributionErrorCode('D001', mockCreateRequest).subscribe((result) => {
        expect(result.success).toBeTrue();
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          '/api/v1/application-admin/distribution-error-code',
          jasmine.objectContaining({ errorCode: 'D001' })
        );
        done();
      });
    });

    it('should throw when update response.success is false', (done) => {
      const failResponse: ErrorCodeMutationApiResponse = {
        success: false,
        message: 'Update failed',
        statusCode: 500,
      };
      apiServiceSpy.put.and.returnValue(of(failResponse));
      spyOn(console, 'error');

      service.updateDonorErrorCode('E001', mockCreateRequest).subscribe({
        error: (err) => {
          expect(err.message).toBe('Update failed');
          done();
        },
      });
    });

    it('should propagate API-level errors on update', (done) => {
      const apiError = new Error('Network failure');
      apiServiceSpy.put.and.returnValue(throwError(() => apiError));
      spyOn(console, 'error');

      service.updateDonorErrorCode('E001', mockCreateRequest).subscribe({
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // updateErrorCode tab-type routing
  // ---------------------------------------------------------------
  describe('updateErrorCode tab-type routing', () => {
    beforeEach(() => {
      apiServiceSpy.put.and.returnValue(of(mockMutationResponse));
    });

    it('should route to updateDonorErrorCode for TabType.DONOR', (done) => {
      service.updateErrorCode(TabType.DONOR, 'E001', mockCreateRequest).subscribe(() => {
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          '/api/v1/application-admin/donor-error-code',
          jasmine.objectContaining({ errorCode: 'E001' })
        );
        done();
      });
    });

    it('should route to updateLabErrorCode for TabType.LAB', (done) => {
      service.updateErrorCode(TabType.LAB, 'L001', mockCreateRequest).subscribe(() => {
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          '/api/v1/admin/lab-error-code',
          jasmine.objectContaining({ errorCode: 'L001' })
        );
        done();
      });
    });

    it('should route to updateDistributionErrorCode for TabType.DISTRIBUTION', (done) => {
      service.updateErrorCode(TabType.DISTRIBUTION, 'D001', mockCreateRequest).subscribe(() => {
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          '/api/v1/application-admin/distribution-error-code',
          jasmine.objectContaining({ errorCode: 'D001' })
        );
        done();
      });
    });

    it('should return throwError for an unknown tab type', (done) => {
      service.updateErrorCode('unknown' as TabType, 'X001', mockCreateRequest).subscribe({
        error: (err) => {
          expect(err.message).toContain('not yet implemented');
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // Code existence checks
  // ---------------------------------------------------------------
  describe('code existence checks', () => {
    it('should GET and map isExists for checkDonorCodeExists', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockCodeExistsResponse));

      service.checkDonorCodeExists('E001').subscribe((exists) => {
        expect(exists).toBeTrue();
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/application-admin/is-code/E001'
        );
        done();
      });
    });

    it('should return false when isExists is false', (done) => {
      const notExistsResponse: CodeExistenceCheckResponse = {
        success: true,
        message: 'Success',
        item: { isExists: false },
      };
      apiServiceSpy.get.and.returnValue(of(notExistsResponse));

      service.checkDonorCodeExists('E999').subscribe((exists) => {
        expect(exists).toBeFalse();
        done();
      });
    });

    it('should throw when checkDonorCodeExists response.success is false', (done) => {
      const failResponse: CodeExistenceCheckResponse = {
        success: false,
        message: 'Check failed',
        item: { isExists: false },
      };
      apiServiceSpy.get.and.returnValue(of(failResponse));
      spyOn(console, 'error');

      service.checkDonorCodeExists('E001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Check failed');
          done();
        },
      });
    });

    it('should propagate API-level errors on code existence check', (done) => {
      const apiError = new Error('API failure');
      apiServiceSpy.get.and.returnValue(throwError(() => apiError));
      spyOn(console, 'error');

      service.checkDonorCodeExists('E001').subscribe({
        error: (err) => {
          expect(err).toBe(apiError);
          done();
        },
      });
    });

    it('should call checkLabCodeExists correctly', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockCodeExistsResponse));

      service.checkLabCodeExists('L001').subscribe((exists) => {
        expect(exists).toBeTrue();
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/application-admin/is-code/L001'
        );
        done();
      });
    });

    it('should call checkDistributionCodeExists correctly', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockCodeExistsResponse));

      service.checkDistributionCodeExists('D001').subscribe((exists) => {
        expect(exists).toBeTrue();
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/application-admin/is-code/D001'
        );
        done();
      });
    });
  });

  // ---------------------------------------------------------------
  // checkCodeExists tab-type routing
  // ---------------------------------------------------------------
  describe('checkCodeExists tab-type routing', () => {
    beforeEach(() => {
      apiServiceSpy.get.and.returnValue(of(mockCodeExistsResponse));
    });

    it('should route to checkDonorCodeExists for TabType.DONOR', (done) => {
      service.checkCodeExists(TabType.DONOR, 'E001').subscribe((exists) => {
        expect(exists).toBeTrue();
        done();
      });
    });

    it('should route to checkLabCodeExists for TabType.LAB', (done) => {
      service.checkCodeExists(TabType.LAB, 'L001').subscribe((exists) => {
        expect(exists).toBeTrue();
        done();
      });
    });

    it('should route to checkDistributionCodeExists for TabType.DISTRIBUTION', (done) => {
      service.checkCodeExists(TabType.DISTRIBUTION, 'D001').subscribe((exists) => {
        expect(exists).toBeTrue();
        done();
      });
    });

    it('should return throwError for an unknown tab type', (done) => {
      service.checkCodeExists('unknown' as TabType, 'X001').subscribe({
        error: (err) => {
          expect(err.message).toContain('not yet implemented');
          done();
        },
      });
    });
  });
});
