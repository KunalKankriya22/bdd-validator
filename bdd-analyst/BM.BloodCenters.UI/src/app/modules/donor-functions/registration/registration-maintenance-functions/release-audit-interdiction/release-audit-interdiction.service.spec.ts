import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ReleaseAuditInterdictionService } from './release-audit-interdiction.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  SearchRequest,
  SearchResponse,
  SearchResponseData,
  ReleaseRequest,
  ReleaseResponse,
  RemoveRequest,
  RemovalReason,
  RemovalReasonsResponse,
  Interdiction,
  TerminatedInterdictionsResponse
} from './release-audit-interdiction.models';

describe('ReleaseAuditInterdictionService', () => {
  let service: ReleaseAuditInterdictionService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockSearchResponseData: SearchResponseData = {
    donationInfo: {
      donationType: 'WB',
      procedureType: 'PC01',
      driveId: 'DRV001',
      donorCue: 'CUE001',
      numberOfOtherInterdictions: 2,
      collectionDate: '2025-01-15'
    },
    donorInfo: {
      name: 'Doe, John',
      aboType: 'O+',
      dateOfBirth: '1990-01-01',
      sex: 'M',
      donorIdNumber: 'D001'
    },
    interdictions: [
      {
        interCode: 'IC01',
        interType: 'TYPE1',
        effectiveDate: '2025-01-01',
        terminationDate: '2025-12-31',
        releaseDate: null,
        releasedUser: '',
        insertedUser: 'admin',
        originated: 'LAB',
        reason: 'Test reason',
        groupMode: 'GM1',
        groupId: 'GRP01',
        canRelease: true
      }
    ],
    transactionId: 'TXN001',
    donorId: 'D001',
    hasHiddenInterdictions: false
  };

  const mockInterdiction: Interdiction = {
    interCode: 'IC01',
    interType: 'TYPE1',
    effectiveDate: '2025-01-01',
    terminationDate: '2025-06-01',
    releaseDate: '2025-03-01',
    releasedUser: 'admin',
    insertedUser: 'system',
    originated: 'LAB',
    reason: 'Terminated reason',
    groupMode: 'GM1',
    groupId: 'GRP01',
    canRelease: false
  };

  const mockRemovalReason: RemovalReason = {
    code: 'RR01',
    description: 'Test Removal Reason'
  };

  const mockReleaseRequest: ReleaseRequest = {
    transactionId: 'TXN001',
    interCode: 'IC01',
    interType: 'TYPE1',
    terminationDate: '2025-12-31',
    originatedFrom: 'LAB',
    reasonCode: 'R01',
    groupId: 'GRP01',
    groupMode: 'GM1'
  };

  const mockRemoveRequest: RemoveRequest = {
    transactionId: 'TXN001',
    interCode: 'IC01',
    originatedFrom: 'LAB',
    reasonCode: 'R01',
    groupMode: 'GM1',
    groupId: 'GRP01',
    unitId: 'U001',
    deferralId: null,
    collDate: '2025-01-15',
    termDate: '2025-12-31',
    removalReasonCode: 'RR01'
  };

  const mockReleaseResponse: ReleaseResponse = {
    success: true,
    message: 'Released successfully',
    statusCode: 200
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'put', 'post']);

    TestBed.configureTestingModule({
      providers: [
        ReleaseAuditInterdictionService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(ReleaseAuditInterdictionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /* -------------------------------- search -------------------------------- */

  describe('search', () => {
    it('should return search response data on success', (done) => {
      const mockResponse: SearchResponse = {
        success: true,
        statusCode: 200,
        item: mockSearchResponseData
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      const request: SearchRequest = { option: 'donation' };

      service.search(request).subscribe(result => {
        expect(result).toEqual(mockSearchResponseData);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.RELEASE_AUDIT_INTERDICTIONS.SEARCH,
          jasmine.objectContaining({ params: jasmine.anything() })
        );
        done();
      });
    });

    it('should set unitId param when provided', (done) => {
      const mockResponse: SearchResponse = {
        success: true,
        statusCode: 200,
        item: mockSearchResponseData
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      const request: SearchRequest = { option: 'donation', unitId: 'U001' };

      service.search(request).subscribe(() => {
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        const params = callArgs[1].params;
        expect(params.get('option')).toBe('donation');
        expect(params.get('unitId')).toBe('U001');
        done();
      });
    });

    it('should set deferralId param when provided', (done) => {
      const mockResponse: SearchResponse = {
        success: true,
        statusCode: 200,
        item: mockSearchResponseData
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      const request: SearchRequest = { option: 'deferral', deferralId: 'DEF001' };

      service.search(request).subscribe(() => {
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        const params = callArgs[1].params;
        expect(params.get('option')).toBe('deferral');
        expect(params.get('deferralId')).toBe('DEF001');
        done();
      });
    });

    it('should not set unitId or deferralId params when not provided', (done) => {
      const mockResponse: SearchResponse = {
        success: true,
        statusCode: 200,
        item: mockSearchResponseData
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      const request: SearchRequest = { option: 'donation' };

      service.search(request).subscribe(() => {
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        const params = callArgs[1].params;
        expect(params.get('option')).toBe('donation');
        expect(params.has('unitId')).toBeFalse();
        expect(params.has('deferralId')).toBeFalse();
        done();
      });
    });

    it('should throw error with res.message when success is false', (done) => {
      const mockResponse: SearchResponse = {
        success: false,
        statusCode: 400,
        errorCode: 'ERR001',
        message: 'Custom error message',
        errorResponse: { errorCode: 'ERR001', error: 'Error response error' }
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.search({ option: 'donation' }).subscribe({
        error: (err) => {
          expect(err.error.errorCode).toBe('ERR001');
          expect(err.error.message).toBe('Custom error message');
          expect(err.error.errorResponse).toEqual({ errorCode: 'ERR001', error: 'Error response error' });
          done();
        }
      });
    });

    it('should throw error with errorResponse.error when message is falsy', (done) => {
      const mockResponse: SearchResponse = {
        success: false,
        statusCode: 400,
        errorCode: 'ERR002',
        message: '',
        errorResponse: { errorCode: 'ERR002', error: 'Error from errorResponse' }
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.search({ option: 'donation' }).subscribe({
        error: (err) => {
          expect(err.error.message).toBe('Error from errorResponse');
          done();
        }
      });
    });

    it('should throw error with default message when both message and errorResponse.error are falsy', (done) => {
      const mockResponse: SearchResponse = {
        success: false,
        statusCode: 400,
        errorCode: 'ERR003'
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.search({ option: 'donation' }).subscribe({
        error: (err) => {
          expect(err.error.message).toBe('Failed to search');
          expect(err.error.errorCode).toBe('ERR003');
          done();
        }
      });
    });

    it('should throw error when success is true but item is missing', (done) => {
      const mockResponse: SearchResponse = {
        success: true,
        statusCode: 200
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.search({ option: 'donation' }).subscribe({
        error: (err) => {
          expect(err.error.message).toBe('Failed to search');
          done();
        }
      });
    });

    it('should propagate HTTP error from API', (done) => {
      const httpError = { status: 500, message: 'Internal Server Error' };
      apiServiceSpy.get.and.returnValue(throwError(() => httpError));

      service.search({ option: 'donation' }).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          expect(err.message).toBe('Internal Server Error');
          done();
        }
      });
    });
  });

  /* -------------------------------- release -------------------------------- */

  describe('release', () => {
    it('should call PUT API and return release response on success', (done) => {
      apiServiceSpy.put.and.returnValue(of(mockReleaseResponse));

      service.release(mockReleaseRequest).subscribe(result => {
        expect(result).toEqual(mockReleaseResponse);
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          API.RELEASE_AUDIT_INTERDICTIONS.RELEASE,
          mockReleaseRequest
        );
        done();
      });
    });

    it('should propagate error from API', (done) => {
      const httpError = { error: { message: 'Release failed' } };
      apiServiceSpy.put.and.returnValue(throwError(() => httpError));

      service.release(mockReleaseRequest).subscribe({
        error: (err) => {
          expect(err.error.message).toBe('Release failed');
          done();
        }
      });
    });
  });

  /* -------------------------------- getTerminatedInterdictions -------------------------------- */

  describe('getTerminatedInterdictions', () => {
    it('should return interdictions array on success', (done) => {
      const mockResponse: TerminatedInterdictionsResponse = {
        success: true,
        item: [mockInterdiction]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTerminatedInterdictions('TXN001').subscribe(result => {
        expect(result).toEqual([mockInterdiction]);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.RELEASE_AUDIT_INTERDICTIONS.TERMINATED,
          jasmine.objectContaining({ params: jasmine.anything() })
        );
        done();
      });
    });

    it('should pass transactionId as query param', (done) => {
      const mockResponse: TerminatedInterdictionsResponse = {
        success: true,
        item: [mockInterdiction]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTerminatedInterdictions('TXN999').subscribe(() => {
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        const params = callArgs[1].params;
        expect(params.get('transactionId')).toBe('TXN999');
        done();
      });
    });

    it('should throw error when success is false', (done) => {
      const mockResponse: TerminatedInterdictionsResponse = {
        success: false,
        errorCode: 'ERR_TERM'
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTerminatedInterdictions('TXN001').subscribe({
        error: (err) => {
          expect(err.error.errorCode).toBe('ERR_TERM');
          expect(err.error.message).toBe('Failed to fetch terminated interdictions');
          done();
        }
      });
    });

    it('should throw error when success is true but item is missing', (done) => {
      const mockResponse: TerminatedInterdictionsResponse = {
        success: true
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTerminatedInterdictions('TXN001').subscribe({
        error: (err) => {
          expect(err.error.message).toBe('Failed to fetch terminated interdictions');
          done();
        }
      });
    });

    it('should propagate HTTP error from API', (done) => {
      const httpError = { status: 500, message: 'Server error' };
      apiServiceSpy.get.and.returnValue(throwError(() => httpError));

      service.getTerminatedInterdictions('TXN001').subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          expect(err.message).toBe('Server error');
          done();
        }
      });
    });
  });

  /* -------------------------------- getRemovalReasons -------------------------------- */

  describe('getRemovalReasons', () => {
    it('should return removal reasons array on success', (done) => {
      const mockResponse: RemovalReasonsResponse = {
        success: true,
        item: [mockRemovalReason]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getRemovalReasons().subscribe(result => {
        expect(result).toEqual([mockRemovalReason]);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.RELEASE_AUDIT_INTERDICTIONS.REMOVAL_REASONS
        );
        done();
      });
    });

    it('should throw error when success is false', (done) => {
      const mockResponse: RemovalReasonsResponse = {
        success: false,
        errorCode: 'ERR_REASONS'
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getRemovalReasons().subscribe({
        error: (err) => {
          expect(err.error.errorCode).toBe('ERR_REASONS');
          expect(err.error.message).toBe('Failed to fetch removal reasons');
          done();
        }
      });
    });

    it('should throw error when success is true but item is missing', (done) => {
      const mockResponse: RemovalReasonsResponse = {
        success: true
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getRemovalReasons().subscribe({
        error: (err) => {
          expect(err.error.message).toBe('Failed to fetch removal reasons');
          done();
        }
      });
    });

    it('should propagate HTTP error from API', (done) => {
      const httpError = { error: { message: 'Removal reasons fetch failed' } };
      apiServiceSpy.get.and.returnValue(throwError(() => httpError));

      service.getRemovalReasons().subscribe({
        error: (err) => {
          expect(err.error.message).toBe('Removal reasons fetch failed');
          done();
        }
      });
    });
  });

  /* -------------------------------- remove -------------------------------- */

  describe('remove', () => {
    it('should call PUT API and return response on success', (done) => {
      const mockResponse: ReleaseResponse = {
        success: true,
        message: 'Removed successfully',
        statusCode: 200
      };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.remove(mockRemoveRequest).subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          API.RELEASE_AUDIT_INTERDICTIONS.REMOVE,
          mockRemoveRequest
        );
        done();
      });
    });

    it('should propagate error from API', (done) => {
      const httpError = { error: { message: 'Remove failed' } };
      apiServiceSpy.put.and.returnValue(throwError(() => httpError));

      service.remove(mockRemoveRequest).subscribe({
        error: (err) => {
          expect(err.error.message).toBe('Remove failed');
          done();
        }
      });
    });
  });
});
