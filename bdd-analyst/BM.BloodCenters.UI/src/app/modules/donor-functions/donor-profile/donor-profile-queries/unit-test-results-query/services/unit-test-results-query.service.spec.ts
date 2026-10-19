import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import moment from 'moment';

import { UnitTestResultsQueryService } from './unit-test-results-query.service';
import { UnitTestResultsApiResponse } from '../models/unit-test-results-query.model';

describe('UnitTestResultsQueryService', () => {
  let service: UnitTestResultsQueryService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/unit-test-results`;

  const mockApiResponse: UnitTestResultsApiResponse = {
    success: true,
    statusCode: 200,
    message: 'Unit test results retrieved successfully',
    data: [
      {
        unitId: '1234567',
        donorId: 'DN001',
        collDate: '2024-01-15T00:00:00Z',
        donorName: 'Doe, John',
        dateOfBirth: '1980-01-01T00:00:00Z',
        gender: 'M',
        testResults: [
          {
            testId: 'ALT',
            resultCode: 'NEG',
            formattedResult: 'NEG : 0.5',
            absorbance: '0.5',
            cutOff: '1.0',
            bandDetails: null
          },
          {
            testId: 'HIV',
            resultCode: 'NEG',
            formattedResult: 'NEG',
            absorbance: null,
            cutOff: null,
            bandDetails: [
              {
                bandName: 'Band1',
                bandValue: '1+',
                intensity: 'Strong'
              }
            ]
          }
        ],
        hlaAntigens: {
          a1TestId: 'HLA1',
          a1Result: 'A0201',
          a2TestId: 'HLA2',
          a2Result: 'A0301',
          b1TestId: 'HLA3',
          b1Result: 'B0801',
          b2TestId: 'HLA4',
          b2Result: 'B1501'
        },
        rbcAntigens: [
          {
            groupId: 'D',
            tests: [{ testId: 'D', result: 'POS' }]
          },
          {
            groupId: 'C',
            tests: [{ testId: 'C', result: 'NEG' }]
          }
        ]
      }
    ],
    total: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UnitTestResultsQueryService]
    });

    service = TestBed.inject(UnitTestResultsQueryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('queryUnitTestResults', () => {
    it('should make POST request to query endpoint with unit ID only', () => {
      const unitId = '1234567';

      service.queryUnitTestResults(unitId).subscribe(response => {
        expect(response).toEqual(mockApiResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/query`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        unitId: '1234567',
        collDate: undefined
      });

      req.flush(mockApiResponse);
    });

    it('should make POST request with unit ID and collection date', () => {
      const unitId = '1234567';
      const collDate = moment('2024-01-15');

      service.queryUnitTestResults(unitId, collDate).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/query`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        unitId: '1234567',
        collDate: '2024-01-15'
      });

      req.flush(mockApiResponse);
    });

    it('should trim unit ID before sending', () => {
      const unitId = '  1234567  ';

      service.queryUnitTestResults(unitId).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/query`);
      expect(req.request.body.unitId).toBe('1234567');

      req.flush(mockApiResponse);
    });


  });

  describe('getUnitTestResultsByUnitId', () => {
    it('should make GET request to unit ID endpoint', () => {
      const unitId = '1234567';

      service.getUnitTestResultsByUnitId(unitId).subscribe(response => {
        expect(response).toEqual(mockApiResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/1234567`);
      expect(req.request.method).toBe('GET');

      req.flush(mockApiResponse);
    });

    it('should encode unit ID in URL', () => {
      const unitId = '123 456';

      service.getUnitTestResultsByUnitId(unitId).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/123%20456`);
      expect(req.request.method).toBe('GET');

      req.flush(mockApiResponse);
    });

    it('should trim unit ID before encoding', () => {
      const unitId = '  1234567  ';

      service.getUnitTestResultsByUnitId(unitId).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/1234567`);
      req.flush(mockApiResponse);
    });


    it('should handle empty data array', () => {
      const unitId = '1234567';
      const emptyResponse: UnitTestResultsApiResponse = {
        success: true,
        statusCode: 200,
        data: [],
        total: 0
      };

      service.getUnitTestResultsByUnitId(unitId).subscribe(response => {
        expect(response.data).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/1234567`);
      req.flush(emptyResponse);
    });

  });

  describe('Error Code Handling', () => {
    it('should pass through error code 0080 (field required)', () => {
      service.queryUnitTestResults('').subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/query`);
      req.flush(
        { errorCode: '0080', error: 'Field must be entered' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should pass through error code 0312 (invalid format)', () => {
      service.getUnitTestResultsByUnitId('12345').subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/12345`);
      req.flush(
        { errorCode: '0312', error: 'Invalid Unit ID format' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should pass through error code 9188 (no test results)', () => {
      service.getUnitTestResultsByUnitId('1234567').subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/1234567`);
      req.flush(
        { errorCode: '9188', error: 'No test results found' },
        { status: 404, statusText: 'Not Found' }
      );
    });
  });
});
