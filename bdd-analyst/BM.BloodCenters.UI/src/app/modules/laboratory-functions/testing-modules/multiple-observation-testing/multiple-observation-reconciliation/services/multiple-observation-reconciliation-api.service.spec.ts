import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MultipleObservationReconciliationApiService } from './multiple-observation-reconciliation-api.service';
import { API } from '@core/constants/api.constants';

describe('MultipleObservationReconciliationApiService', () => {
  let service: MultipleObservationReconciliationApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MultipleObservationReconciliationApiService],
    });

    service = TestBed.inject(MultipleObservationReconciliationApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // -----------------------------------------------------------------------
  // GET endpoints (no body)
  // -----------------------------------------------------------------------
  describe('getWorksheetsDropdown', () => {
    it('should GET worksheets dropdown', (done) => {
      // Arrange
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ tbId: 'TB1', testId: 'T1' }] };

      // Act
      service.getWorksheetsDropdown().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse);
        done();
      });

      // Assert request
      const req = httpMock.expectOne(API.MULTIPLE_OBSERVATION_RECONCILIATION.WORKSHEETS_DROPDOWN);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getTestsDropdown', () => {
    it('should GET tests dropdown for tbId', (done) => {
      // Arrange
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ testId: 'T1', testDesc: 'Test' }] };

      // Act
      service.getTestsDropdown('TB1').subscribe((result) => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(API.MULTIPLE_OBSERVATION_RECONCILIATION.TESTS_DROPDOWN('TB1'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getPendingTests', () => {
    it('should GET pending tests with query params', (done) => {
      // Arrange
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ tbId: 'TB1', testId: 'T1', tbSeqNo: 1, unitId: 'U1', testChapterId: 'C1' }] };

      // Act
      service.getPendingTests('T1', 'TB1').subscribe((result) => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne((r) => r.url === API.MULTIPLE_OBSERVATION_RECONCILIATION.PENDING_TESTS);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('testId')).toBe('T1');
      expect(req.request.params.get('tbId')).toBe('TB1');
      req.flush(mockResponse);
    });
  });

  // -----------------------------------------------------------------------
  // Parameterized GET endpoints (testId-based lookups)
  // -----------------------------------------------------------------------
  describe.each([
    { method: 'getTestDetails' as const, args: ['U1', 'TB1', 'T1', 1] as const, url: API.MULTIPLE_OBSERVATION_RECONCILIATION.TEST_DETAILS('U1', 'TB1', 'T1', 1) },
    { method: 'getValidResults' as const, args: ['T1'] as const, url: API.MULTIPLE_OBSERVATION_RECONCILIATION.VALID_RESULTS('T1') },
    { method: 'getValidInterpretations' as const, args: ['T1'] as const, url: API.MULTIPLE_OBSERVATION_RECONCILIATION.VALID_INTERPRETATIONS('T1') },
    { method: 'getValidTestBands' as const, args: ['T1', 'TT1'] as const, url: API.MULTIPLE_OBSERVATION_RECONCILIATION.VALID_TEST_BANDS('T1', 'TT1') },
    { method: 'getOtherBands' as const, args: ['U1', 'TB1', 'T1', 1] as const, url: API.MULTIPLE_OBSERVATION_RECONCILIATION.OTHER_BANDS_GET('U1', 'TB1', 'T1', 1) },
    { method: 'getNote' as const, args: ['TB1', 'T1', 'U1', 1] as const, url: API.MULTIPLE_OBSERVATION_RECONCILIATION.NOTES_GET('TB1', 'T1', 'U1', 1) },
  ])('$method', ({ method, args, url }) => {
    it('should issue GET request', (done) => {
      // Arrange
      const mockResponse = { success: true, message: '', statusCode: 200, data: [] };

      // Act
      (service[method] as Function)(...args).subscribe((result: any) => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // -----------------------------------------------------------------------
  // PUT endpoints
  // -----------------------------------------------------------------------
  describe('updateBandValues', () => {
    it('should PUT band values', (done) => {
      // Arrange
      const request = { bandValues: [{ bandName: 'Band 1', superBandVal: 'P' }] };
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ totalUpdated: 1 }] };

      // Act
      service.updateBandValues('U1', 'TB1', 'T1', 1, request).subscribe((result) => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(API.MULTIPLE_OBSERVATION_RECONCILIATION.UPDATE_BAND_VALUES('U1', 'TB1', 'T1', 1));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('reconcileTest', () => {
    it('should PUT reconcile request', (done) => {
      // Arrange
      const request = { superIntp: 'POS' };
      const mockResponse = { success: true, message: '', statusCode: 200 };

      // Act
      service.reconcileTest('U1', 'TB1', 'T1', 1, request).subscribe((result) => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(API.MULTIPLE_OBSERVATION_RECONCILIATION.RECONCILE('U1', 'TB1', 'T1', 1));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  // -----------------------------------------------------------------------
  // POST endpoints
  // -----------------------------------------------------------------------
  describe.each([
    {
      method: 'validateCombination' as const,
      args: [{ unitId: 'U1', tbId: 'TB1', testId: 'T1', tbSeqNo: 1, testType: 'TT1', ctrlVal: null }] as const,
      url: API.MULTIPLE_OBSERVATION_RECONCILIATION.VALIDATE_COMBINATION,
    },
    {
      method: 'commitReconciliation' as const,
      args: [{ tbId: 'TB1', testId: 'T1', antigenFlag: 'Y', units: [] }] as const,
      url: API.MULTIPLE_OBSERVATION_RECONCILIATION.COMMIT_RECONCILIATION,
    },
    {
      method: 'saveOtherBands' as const,
      args: [{ unitId: 'U1', tbId: 'TB1', testId: 'T1', tbSeqNo: 1, otherBands: [] }] as const,
      url: API.MULTIPLE_OBSERVATION_RECONCILIATION.OTHER_BANDS_SAVE,
    },
    {
      method: 'saveNote' as const,
      args: [{ tbId: 'TB1', testId: 'T1', unitId: 'U1', tbSeqNo: 1, note: 'test note' }] as const,
      url: API.MULTIPLE_OBSERVATION_RECONCILIATION.NOTES_SAVE,
    },
  ])('$method', ({ method, args, url }) => {
    it('should issue POST request', (done) => {
      // Arrange
      const mockResponse = { success: true, message: '', statusCode: 200, data: [] };

      // Act
      (service[method] as Function)(...args).subscribe((result: any) => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(args[0]);
      req.flush(mockResponse);
    });
  });

  // -----------------------------------------------------------------------
  // DELETE endpoints
  // -----------------------------------------------------------------------
  describe.each([
    {
      method: 'deleteOtherBands' as const,
      args: ['U1', 'TB1', 'T1', 1] as const,
      url: API.MULTIPLE_OBSERVATION_RECONCILIATION.OTHER_BANDS_DELETE('U1', 'TB1', 'T1', 1),
    },
    {
      method: 'deleteNote' as const,
      args: [42] as const,
      url: API.MULTIPLE_OBSERVATION_RECONCILIATION.NOTES_DELETE(42),
    },
  ])('$method', ({ method, args, url }) => {
    it('should issue DELETE request', (done) => {
      // Arrange
      const mockResponse = { success: true, message: '', statusCode: 200 };

      // Act
      (service[method] as Function)(...args).subscribe((result: any) => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });
});
