import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UnitInterdictionService } from './unit-interdiction.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  SearchParams,
  SearchResponse,
  GetInterdictionsParams,
  GetInterdictionsResponse,
  ActiveInterdiction,
  CreateInterdictionsRequest,
  TerminateInterdictionRequest,
  ReleaseInterdictionRequest,
  ApiResponse,
  SearchOptionsResponse,
  InterdictionCodesResponse,
  TerminationReasonsResponse,
  TerminationReason
} from '../models/unit-interdiction.model';

describe('UnitInterdictionService', () => {
  let service: UnitInterdictionService;
  let httpMock: HttpTestingController;

  // Helper to build the full URL as ApiService does: baseUrl (empty) + '/' + endpoint without leading slash
  const buildUrl = (endpoint: string): string => {
    return '/' + endpoint.replace(/^\/+|\/+$/g, '');
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UnitInterdictionService,
        ApiService
      ]
    });

    service = TestBed.inject(UnitInterdictionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ---------------------------------------------------------------------------
  // searchDonation
  // ---------------------------------------------------------------------------
  describe('searchDonation', () => {
    const params: SearchParams = {
      option: 'N',
      unitId: 'UNIT001',
      chapterId: 'CH001',
      userId: 'USER001'
    };

    it('should POST to SEARCH endpoint and return the response', () => {
      const mockResponse: SearchResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: {
          transactionId: 'TXN001',
          unitId: 'UNIT001',
          donationType: 'WB',
          donationTypeDesc: 'Whole Blood',
          procedure: 'REGULAR',
          procedureDesc: 'Regular Donation',
          driveId: 'DRV001',
          collectionDate: '2026-05-13',
          donorId: 'DN001',
          donorName: 'Test Donor',
          dateOfBirth: '1990-01-01',
          gender: 'M',
          bloodType: 'O',
          bloodTypeDesc: 'O POS',
          activeInterdictions: [],
          terminatedInterdictionCount: 0,
          otherInterdictionCount: 0
        }
      };

      service.searchDonation(params).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.SEARCH));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(params);
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors', () => {
      service.searchDonation(params).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.SEARCH));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ---------------------------------------------------------------------------
  // mapActiveInterdictionsToUnitInterdictions
  // ---------------------------------------------------------------------------
  describe('mapActiveInterdictionsToUnitInterdictions', () => {
    it('should map active interdictions using primary fields', () => {
      const interdictions: ActiveInterdiction[] = [
        {
          interCode: 'IC01',
          interDesc: 'Interdiction One',
          interType: 'T1',
          insertDate: '2026-01-01',
          insertUser: 'USER1',
          groupMode: 'GM1',
          groupId: 'GRP1',
          termDate: '2026-06-01',
          releaseDate: '2026-07-01',
          releaseUser: 'RUSER1',
          originatedFrom: 'ORIGIN1',
          reasonCode: 'RC1',
          terminationReasonDesc: 'Reason Desc',
          isTerminated: true,
          isReleased: true,
          canTerminate: false,
          canRelease: true
        }
      ];

      const result = service.mapActiveInterdictionsToUnitInterdictions(interdictions, 'TXN-100');

      expect(result.length).toBe(1);
      const mapped = result[0];
      expect(mapped.id).toBe('TXN-100-0');
      expect(mapped.transactionId).toBe('TXN-100');
      expect(mapped.code).toBe('IC01');
      expect(mapped.description).toBe('Interdiction One');
      expect(mapped.type).toBe('T1');
      expect(mapped.effectiveDate).toBe('2026-01-01');
      expect(mapped.terminationDate).toBe('2026-06-01'); // termDate takes precedence
      expect(mapped.releaseDate).toBe('2026-07-01');
      expect(mapped.userId).toBe('USER1');
      expect(mapped.releaseUser).toBe('RUSER1');
      expect(mapped.originated).toBe('ORIGIN1'); // originatedFrom takes precedence over groupMode
      expect(mapped.reason).toBe('RC1'); // reasonCode takes precedence over terminationReason
      expect(mapped.reasonDescription).toBe('Reason Desc');
      expect(mapped.groupMode).toBe('GM1');
      expect(mapped.groupId).toBe('GRP1');
      expect(mapped.comments).toBeUndefined();
      expect(mapped.isTerminated).toBe(true);
      expect(mapped.isReleased).toBe(true);
      expect(mapped.canTerminate).toBe(false);
      expect(mapped.canRelease).toBe(true);
    });

    it('should use fallback fields and defaults when primary fields are absent', () => {
      const interdictions: ActiveInterdiction[] = [
        {
          interCode: 'IC02',
          interDesc: 'Interdiction Two',
          interType: 'T2',
          insertDate: '2026-02-01',
          insertUser: 'USER2',
          groupMode: 'GM2',
          groupId: 'GRP2',
          terminationDate: '2026-08-01',
          terminationReason: 'TR1'
          // No termDate, releaseDate, releaseUser, originatedFrom, reasonCode,
          // isTerminated, isReleased, canTerminate, canRelease
        }
      ];

      const result = service.mapActiveInterdictionsToUnitInterdictions(interdictions, 'TXN-200');

      const mapped = result[0];
      expect(mapped.terminationDate).toBe('2026-08-01'); // falls back to terminationDate
      expect(mapped.releaseDate).toBeUndefined();
      expect(mapped.releaseUser).toBeUndefined();
      expect(mapped.originated).toBe('GM2'); // falls back to groupMode
      expect(mapped.reason).toBe('TR1'); // falls back to terminationReason
      expect(mapped.isTerminated).toBe(false); // defaults to false
      expect(mapped.isReleased).toBe(false); // defaults to false
      expect(mapped.canTerminate).toBe(true); // defaults to true via ??
      expect(mapped.canRelease).toBe(false); // defaults to false via ??
    });

    it('should handle empty array', () => {
      const result = service.mapActiveInterdictionsToUnitInterdictions([], 'TXN-EMPTY');
      expect(result).toEqual([]);
    });

    it('should generate sequential IDs for multiple items', () => {
      const interdictions: ActiveInterdiction[] = [
        { interCode: 'A', interDesc: '', interType: '', insertDate: '', insertUser: '', groupMode: '', groupId: '' },
        { interCode: 'B', interDesc: '', interType: '', insertDate: '', insertUser: '', groupMode: '', groupId: '' }
      ];

      const result = service.mapActiveInterdictionsToUnitInterdictions(interdictions, 'TXN-SEQ');
      expect(result[0].id).toBe('TXN-SEQ-0');
      expect(result[1].id).toBe('TXN-SEQ-1');
    });
  });

  // ---------------------------------------------------------------------------
  // getInterdictions
  // ---------------------------------------------------------------------------
  describe('getInterdictions', () => {
    const params: GetInterdictionsParams = {
      transactionId: 'TXN001',
      includeTerminated: false
    };

    const sampleItem: ActiveInterdiction = {
      interCode: 'IC01',
      interDesc: 'Desc',
      interType: 'T1',
      insertDate: '2026-01-01',
      insertUser: 'USR1',
      groupMode: 'GM',
      groupId: 'GRP',
      termDate: '2026-06-01',
      reasonCode: 'RC1',
      terminationReasonDesc: 'Term Reason Desc',
      releaseDate: '2026-07-01',
      releaseUser: 'RUSR',
      originatedFrom: 'ORIG',
      isTerminated: true,
      isReleased: false,
      canTerminate: false,
      canRelease: true
    };

    it('should handle wrapped response { data: [...] }', () => {
      const wrappedResponse: GetInterdictionsResponse = { data: [sampleItem] };

      service.getInterdictions(params).subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].id).toBe('TXN001-0');
        expect(result[0].code).toBe('IC01');
        expect(result[0].terminationDate).toBe('2026-06-01');
        expect(result[0].reason).toBe('RC1');
        expect(result[0].originated).toBe('ORIG');
        expect(result[0].canTerminate).toBe(false);
        expect(result[0].canRelease).toBe(true);
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.GET));
      expect(req.request.method).toBe('POST');
      req.flush(wrappedResponse);
    });

    it('should handle direct array response', () => {
      service.getInterdictions(params).subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].transactionId).toBe('TXN001');
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.GET));
      req.flush([sampleItem]);
    });

    it('should use fallback fields when primary fields are absent', () => {
      const itemWithFallbacks: ActiveInterdiction = {
        interCode: '',
        interDesc: '',
        interType: '',
        insertDate: '',
        insertUser: '',
        groupMode: 'GM-FALLBACK',
        groupId: '',
        terminationDate: '2026-09-01',
        terminationReason: 'TR-FALLBACK'
      };

      service.getInterdictions(params).subscribe(result => {
        expect(result[0].terminationDate).toBe('2026-09-01');
        expect(result[0].reason).toBe('TR-FALLBACK');
        expect(result[0].originated).toBe('GM-FALLBACK');
        expect(result[0].canTerminate).toBe(true); // default via ??
        expect(result[0].canRelease).toBe(false); // default via ??
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.GET));
      req.flush({ data: [itemWithFallbacks] });
    });

    it('should return empty array when response has no data', () => {
      service.getInterdictions(params).subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.GET));
      req.flush({ data: null } as any);
    });

    it('should propagate HTTP errors', () => {
      service.getInterdictions(params).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.GET));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ---------------------------------------------------------------------------
  // createInterdictions
  // ---------------------------------------------------------------------------
  describe('createInterdictions', () => {
    const request: CreateInterdictionsRequest = {
      transactionId: 'TXN001',
      interdictions: [{ interCode: 'IC01' }]
    };

    it('should POST and return successful response', () => {
      const mockResponse: ApiResponse = { success: true, message: 'Created' };

      service.createInterdictions(request).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.CREATE));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should throw when API returns success: false (with error field)', () => {
      const failResponse: ApiResponse = {
        success: false,
        error: 'Duplicate interdiction',
        errorCode: 'DUP_001',
        statusCode: 400
      };

      service.createInterdictions(request).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.error).toBe('Duplicate interdiction');
          expect(err.message).toBe('Duplicate interdiction');
          expect(err.errorCode).toBe('DUP_001');
        }
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.CREATE));
      req.flush(failResponse);
    });

    it('should throw when API returns success: false (with message field)', () => {
      const failResponse: ApiResponse = {
        success: false,
        message: 'Validation failed'
      };

      service.createInterdictions(request).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.error).toBe('Validation failed');
          expect(err.message).toBe('Validation failed');
        }
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.CREATE));
      req.flush(failResponse);
    });

    it('should use default message when API returns success: false with no error/message', () => {
      const failResponse: ApiResponse = { success: false };

      service.createInterdictions(request).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.error).toBe('Failed to create interdiction');
          expect(err.message).toBe('Failed to create interdiction');
        }
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.CREATE));
      req.flush(failResponse);
    });

    it('should propagate HTTP errors', () => {
      service.createInterdictions(request).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.CREATE));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ---------------------------------------------------------------------------
  // terminateInterdiction
  // ---------------------------------------------------------------------------
  describe('terminateInterdiction', () => {
    const request: TerminateInterdictionRequest = {
      transactionId: 'TXN001',
      interCode: 'IC01',
      interType: 'T1',
      insertDate: '2026-01-01',
      terminationDate: '2026-07-01',
      reasonCode: 'RC01'
    };

    it('should PUT and return successful response', () => {
      const mockResponse: ApiResponse = { success: true, message: 'Terminated' };

      service.terminateInterdiction(request).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.TERMINATE));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should throw when API returns success: false', () => {
      const failResponse: ApiResponse = {
        success: false,
        error: 'Cannot terminate',
        errorCode: 'TERM_ERR',
        statusCode: 400
      };

      service.terminateInterdiction(request).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.error).toBe('Cannot terminate');
          expect(err.message).toBe('Cannot terminate');
          expect(err.errorCode).toBe('TERM_ERR');
        }
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.TERMINATE));
      req.flush(failResponse);
    });

    it('should use default message when success: false with no error/message', () => {
      const failResponse: ApiResponse = { success: false };

      service.terminateInterdiction(request).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('Failed to terminate interdiction');
        }
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.TERMINATE));
      req.flush(failResponse);
    });

    it('should propagate HTTP errors', () => {
      service.terminateInterdiction(request).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(403);
        }
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.TERMINATE));
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  // ---------------------------------------------------------------------------
  // releaseInterdiction
  // ---------------------------------------------------------------------------
  describe('releaseInterdiction', () => {
    const request: ReleaseInterdictionRequest = {
      transactionId: 'TXN001',
      interCode: 'IC01',
      interType: 'T1',
      insertDate: '2026-01-01'
    };

    it('should PUT and return successful response', () => {
      const mockResponse: ApiResponse = { success: true, message: 'Released' };

      service.releaseInterdiction(request).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.RELEASE));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should throw when API returns success: false', () => {
      const failResponse: ApiResponse = {
        success: false,
        message: 'Release denied',
        errorCode: 'REL_ERR',
        statusCode: 403
      };

      service.releaseInterdiction(request).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.error).toBe('Release denied');
          expect(err.message).toBe('Release denied');
          expect(err.errorCode).toBe('REL_ERR');
        }
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.RELEASE));
      req.flush(failResponse);
    });

    it('should use default message when success: false with no error/message', () => {
      const failResponse: ApiResponse = { success: false };

      service.releaseInterdiction(request).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.message).toBe('Failed to release interdiction');
        }
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.RELEASE));
      req.flush(failResponse);
    });

    it('should propagate HTTP errors', () => {
      service.releaseInterdiction(request).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.RELEASE));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ---------------------------------------------------------------------------
  // getSearchOptions
  // ---------------------------------------------------------------------------
  describe('getSearchOptions', () => {
    it('should GET search options and filter out invalid entries', () => {
      const mockResponse: SearchOptionsResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        item: {
          searchModes: [
            { value: 'N', label: 'Donation' },
            { value: 'D', label: 'Deferral' },
            { value: '', label: 'Empty Value' },  // filtered out
            { value: 'X', label: '' },             // filtered out
            null as any                            // filtered out
          ]
        }
      };

      service.getSearchOptions().subscribe(options => {
        expect(options.length).toBe(2);
        expect(options[0]).toEqual({ value: 'N', label: 'Donation' });
        expect(options[1]).toEqual({ value: 'D', label: 'Deferral' });
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.SEARCH_OPTIONS));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when item is missing', () => {
      const mockResponse = { success: true, message: 'OK', statusCode: 200, item: null };

      service.getSearchOptions().subscribe(options => {
        expect(options).toEqual([]);
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.SEARCH_OPTIONS));
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors', () => {
      service.getSearchOptions().subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.SEARCH_OPTIONS));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ---------------------------------------------------------------------------
  // getInterdictionCodes
  // ---------------------------------------------------------------------------
  describe('getInterdictionCodes', () => {
    it('should GET and map interdiction codes', () => {
      const mockResponse: InterdictionCodesResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: [
          { interCode: 'IC01', interType: 'T1', interDesc: 'Code One', viewLevel: 1 },
          { interCode: 'IC02', interType: 'T2', interDesc: 'Code Two', viewLevel: 2 }
        ]
      };

      service.getInterdictionCodes().subscribe(codes => {
        expect(codes.length).toBe(2);
        expect(codes[0]).toEqual({ code: 'IC01', type: 'T1', description: 'Code One' });
        expect(codes[1]).toEqual({ code: 'IC02', type: 'T2', description: 'Code Two' });
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.INTERDICTION_CODES));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is missing', () => {
      const mockResponse = { success: true, message: 'OK', statusCode: 200, data: null };

      service.getInterdictionCodes().subscribe(codes => {
        expect(codes).toEqual([]);
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.INTERDICTION_CODES));
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors', () => {
      service.getInterdictionCodes().subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.INTERDICTION_CODES));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ---------------------------------------------------------------------------
  // getTerminationReasons
  // ---------------------------------------------------------------------------
  describe('getTerminationReasons', () => {
    it('should GET and return termination reasons', () => {
      const reasons: TerminationReason[] = [
        { code: 'R1', description: 'Reason One' },
        { code: 'R2', description: 'Reason Two' }
      ];
      const mockResponse: TerminationReasonsResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: reasons
      };

      service.getTerminationReasons().subscribe(result => {
        expect(result).toEqual(reasons);
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.TERMINATION_REASONS));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is missing', () => {
      const mockResponse = { success: true, message: 'OK', statusCode: 200, data: null };

      service.getTerminationReasons().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.TERMINATION_REASONS));
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors', () => {
      service.getTerminationReasons().subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(buildUrl(API.UNIT_INTERDICTION.TERMINATION_REASONS));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
