import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AntqlQueryService } from './antql-query.service';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  UnitDonorTestedAntigenResponse,
  ScheduledTest,
  UnscheduledTest,
  DonorTest,
  UnitTestedAntigensApiResponse
} from '../models/antql-query.model';

describe('AntqlQueryService', () => {
  let service: AntqlQueryService;
  let httpMock: HttpTestingController;

  const mockUnitId = '1234567890123456';
  const queryUrl = `${environment.apiUrl}${API.UNIT_TESTED_ANTIGENS.QUERY}`;

  const mockScheduledTest: ScheduledTest = {
    testId: 'ABORH',
    testSeqNo: 1,
    resultDescription: 'O POS',
    resultDateTime: '2024-03-15T10:00:00',
    testBatchId: 'BATCH001',
    technician: 'TECH01',
    source: 'Sched'
  };

  const mockUnscheduledTest: UnscheduledTest = {
    testId: 'CMV',
    testSeqNo: 1,
    resultDescription: 'NEGATIVE',
    resultDateTime: '2024-03-15T11:00:00',
    testBatchId: 'BATCH002',
    technician: 'TECH02',
    source: 'Unsched'
  };

  const mockDonorTest: DonorTest = {
    testId: 'ANTIGEN',
    resultDescription: 'POSITIVE',
    insertDateTime: '2024-03-15T09:00:00',
    isConfirmed: true,
    source: 'Donor'
  };

  const mockCombinedResponse: UnitDonorTestedAntigenResponse = {
    unitId: mockUnitId,
    collectionDate: '2024-03-15T08:30:00',
    hasResults: true,
    scheduledTests: [mockScheduledTest],
    unscheduledTests: [mockUnscheduledTest],
    donorTests: [mockDonorTest]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AntqlQueryService]
    });

    service = TestBed.inject(AntqlQueryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('queryTestedAntigens', () => {
    it('should POST to the correct endpoint and extract item from response', (done) => {
      const apiResponse: UnitTestedAntigensApiResponse = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        item: mockCombinedResponse,
        data: null,
        total: null
      };

      service.queryTestedAntigens(mockUnitId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockCombinedResponse);
          expect(response.unitId).toBe(mockUnitId);
          expect(response.scheduledTests.length).toBe(1);
          expect(response.unscheduledTests.length).toBe(1);
          expect(response.donorTests.length).toBe(1);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(queryUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ unitId: mockUnitId });
      req.flush(apiResponse);
    });

    it('should extract data from array if item is null', (done) => {
      const apiResponse: UnitTestedAntigensApiResponse = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        item: null,
        data: [mockCombinedResponse],
        total: 1
      };

      service.queryTestedAntigens(mockUnitId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockCombinedResponse);
          expect(response.unitId).toBe(mockUnitId);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(queryUrl);
      req.flush(apiResponse);
    });




    it('should throw error when both item and data are null', (done) => {
      const apiResponse: UnitTestedAntigensApiResponse = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        item: null,
        data: null,
        total: 0
      };

      service.queryTestedAntigens(mockUnitId).subscribe({
        next: () => done.fail('should have failed with no data error'),
        error: (error) => {
          expect(error.message).toBe('No data returned from API');
          done();
        }
      });

      const req = httpMock.expectOne(queryUrl);
      req.flush(apiResponse);
    });

    it('should throw error when data is empty array', (done) => {
      const apiResponse: UnitTestedAntigensApiResponse = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        item: null,
        data: [],
        total: 0
      };

      service.queryTestedAntigens(mockUnitId).subscribe({
        next: () => done.fail('should have failed with no data error'),
        error: (error) => {
          expect(error.message).toBe('No data returned from API');
          done();
        }
      });

      const req = httpMock.expectOne(queryUrl);
      req.flush(apiResponse);
    });
  });
});
