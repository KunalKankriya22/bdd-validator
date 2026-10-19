import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AtcApiService } from './atc-api.service';
import { environment } from '../../../../../environments/environment';
import { API } from '../../../../core/constants/api.constants';
import {
  AdditionalConfirmatoryTestScheduledDto,
  TestGroupLookupDto,
  SampleTypeLookupDto,
  ApiResponse,
  ValidateUnitResponse,
  ExistingTestDto,
  ScheduleTestsResponse,
} from '../models/atc.models';

describe('AtcApiService', () => {
  let service: AtcApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${API.ADDITIONAL_CONFIRMATORY_TEST_SCHEDULED.BASE}`;

  const mockTestDto: AdditionalConfirmatoryTestScheduledDto = {
    testId: 'TEST001',
    testGroup: 'GROUP1',
    testDesc: 'Confirmatory Test',
    sampleType: 'SAMPLE1',
    effDate: '2024-01-01T00:00:00Z',
    termDate: null,
    isActive: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AtcApiService],
    });
    service = TestBed.inject(AtcApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAllTests', () => {
    it('should retrieve paginated tests', (done) => {
      const mockResponse: ApiResponse<AdditionalConfirmatoryTestScheduledDto[]> = {
        success: true, statusCode: 200, message: 'OK',
        data: [mockTestDto], totalCount: 1,
      };

      service.getAllTests().subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.totalCount).toBe(1);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });
  describe('getSampleTypes', () => {
    it('should retrieve sample types', (done) => {
      const mockResponse: ApiResponse<SampleTypeLookupDto[]> = {
        success: true, statusCode: 200, message: 'OK',
        data: [{ sampleType: 'S1', description: 'Sample 1' }],
      };

      service.getSampleTypes().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        },
        error: done.fail,
      });

      const url = `${environment.apiUrl}${API.ADDITIONAL_CONFIRMATORY_TEST_SCHEDULED.LOOKUP_SAMPLE_TYPES}`;
      const req = httpMock.expectOne(url);
      req.flush(mockResponse);
    });
  });

  describe('validateUnit', () => {
    it('should validate a unit', (done) => {
      const mockResponse: ApiResponse<ValidateUnitResponse> = {
        success: true, statusCode: 200, message: 'OK',
        data: { unitId: 'W1234', collDate: '2024-01-01', chapterId: 'CH01' },
      };

      service.validateUnit('W1234').subscribe({
        next: (result) => {
          expect(result.unitId).toBe('W1234');
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-unit`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ unitId: 'W1234' });
      req.flush(mockResponse);
    });
  });

  describe('getExistingTests', () => {
    it('should retrieve existing tests for a unit', (done) => {
      const mockResponse: ApiResponse<ExistingTestDto[]> = {
        success: true, statusCode: 200, message: 'OK',
        data: [{ statusFlag: 'S', testId: 'ABORH', testSeqNo: 1, tbId: 'TB1', resultStatus1: null }],
      };

      service.getExistingTests('W1234', '2024-01-01').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].testId).toBe('ABORH');
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/existing-tests`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('scheduleTests', () => {
    it('should schedule tests', (done) => {
      const mockResponse: ApiResponse<ScheduleTestsResponse[]> = {
        success: true, statusCode: 200, message: 'OK',
        data: [{ testsScheduled: 2, unitsProcessed: 1 }],
      };

      service.scheduleTests({
        testIds: ['T1', 'T2'],
        units: [{ unitId: 'W1234', collDate: '2024-01-01' }],
      }).subscribe({
        next: (result) => {
          expect(result.testsScheduled).toBe(2);
          expect(result.unitsProcessed).toBe(1);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/schedule`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });
});
