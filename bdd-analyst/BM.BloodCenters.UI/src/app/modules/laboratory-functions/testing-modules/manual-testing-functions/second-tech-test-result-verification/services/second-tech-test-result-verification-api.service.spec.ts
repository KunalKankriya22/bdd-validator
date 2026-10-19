import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SecondTechTestResultVerificationApiService } from './second-tech-test-result-verification-api.service';

describe('SecondTechTestResultVerificationApiService', () => {
  let service: SecondTechTestResultVerificationApiService;
  let httpMock: HttpTestingController;
  const baseUrl = '/api/v1/second-tech-test-result';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SecondTechTestResultVerificationApiService],
    });

    service = TestBed.inject(SecondTechTestResultVerificationApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── GET methods returning r.data when success ────────────────────────
  describe('getTbWsOptions', () => {
    it('should return data when success', (done) => {
      // Arrange
      const mockData = [{ tbId: 'TB1', wsId: 'WS1' }];

      // Act
      service.getTbWsOptions().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData as any);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/test-batch-options`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockData, statusCode: 200, totalCount: 1 });
    });

    it('should return empty array when not success', (done) => {
      // Act
      service.getTbWsOptions().subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/test-batch-options`);
      req.flush({ success: false, data: null, statusCode: 200, totalCount: 0 });
    });
  });

  describe('getTestIdOptions', () => {
    it('should GET with encoded tbId and return data', (done) => {
      // Arrange
      const mockData = [{ testId: 'T1' }];

      // Act
      service.getTestIdOptions('TB1').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData as any);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/test-id-options/TB1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockData, statusCode: 200, totalCount: 1 });
    });
  });

  describe('getResultCodes', () => {
    it('should GET with query params and return data', (done) => {
      // Arrange
      const mockData = [{ resultCode: 'POS' }];

      // Act
      service.getResultCodes('T1', 'Y').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData as any);
        done();
      });

      const req = httpMock.expectOne(
        (r) => r.url === `${baseUrl}/result-code-options` &&
               r.params.get('testId') === 'T1' &&
               r.params.get('antigenFlag') === 'Y'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockData, statusCode: 200, totalCount: 1 });
    });
  });

  describe('searchTestResults', () => {
    it('should POST and return mapped results', (done) => {
      // Arrange
      const mockRows = [{ tbSeqNo: 1, unitId: 'U1' }];

      // Act
      service.searchTestResults('TB1', 'T1').subscribe((result) => {
        // Assert
        expect(result.results).toEqual(mockRows as any);
        expect(result.totalCount).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/search-sort-filter/1000/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ tbId: 'TB1', testId: 'T1' });
      req.flush({ success: true, data: mockRows, statusCode: 200, totalCount: 1 });
    });

    it('should return empty results on 400 error', (done) => {
      // Act
      service.searchTestResults('TB1', 'T1').subscribe((result) => {
        // Assert
        expect(result).toEqual({ results: [], totalCount: 0 });
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/search-sort-filter/1000/0`);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });

    it('should rethrow non-400 errors', (done) => {
      // Act
      service.searchTestResults('TB1', 'T1').subscribe({
        error: (err) => {
          // Assert
          expect(err.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/search-sort-filter/1000/0`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('saveTestResults', () => {
    it('should POST mapped body and return mapped response', (done) => {
      // Arrange
      const request = {
        tbId: 'TB1',
        testId: 'T1',
        results: [{ tbSeqNo: 1, unitId: 'U1', tempResult2: 'POS' }],
      };

      // Act
      service.saveTestResults(request as any).subscribe((result) => {
        // Assert
        expect(result.success).toBeTrue();
        expect(result.hasDiscrepancy).toBeFalse();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/save`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.results[0].tempResult2).toBe('POS');
      req.flush({
        success: true,
        statusCode: 200,
        data: { resultSummary: '1:POS;', hasDiscrepancy: false, discrepancyMessage: null, reconciled: false, resultsMoved: false },
      });
    });
  });

  // ── synchronous validateResults ──────────────────────────────────────
  describe('validateResults', () => {
    it('should build summary and detect discrepancy', () => {
      // Arrange
      const rows = [
        { tempResult2: 'POS', tempResult1: 'NEG' },
        { tempResult2: 'POS', tempResult1: 'POS' },
      ] as any[];

      // Act
      const result = service.validateResults(rows);

      // Assert
      expect(result.hasWarnings).toBeTrue();
      expect(result.resultSummary).toContain('2:POS');
      expect(result.hasDiscrepancy).toBeTrue();
    });

    it('should return no warnings when no results entered', () => {
      // Arrange
      const rows = [{ tempResult2: null, tempResult1: 'POS' }] as any[];

      // Act
      const result = service.validateResults(rows);

      // Assert
      expect(result.hasWarnings).toBeFalse();
      expect(result.warnings.length).toBe(0);
      expect(result.hasDiscrepancy).toBeFalse();
    });
  });
});
