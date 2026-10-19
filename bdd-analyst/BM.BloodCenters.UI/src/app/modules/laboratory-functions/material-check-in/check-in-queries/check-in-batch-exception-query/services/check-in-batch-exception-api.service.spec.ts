import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { CheckInBatchExceptionApiService } from './check-in-batch-exception-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  CheckInBatchExceptionDto,
  UnitAttributeDto,
  BatchExceptionResponse,
  UnitAttributesResponse,
} from '../models/check-in-batch-exception.model';

describe('CheckInBatchExceptionApiService', () => {
  let service: CheckInBatchExceptionApiService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockBatchExceptions: CheckInBatchExceptionDto[] = [
    {
      unitId: 'W123418031306',
      chkDigit: '12',
      collDate: '2025-01-11T00:00:00Z',
      donorDecisionCode: 'A',
      catalogNumber: 'TE00CPD100',
      driveId: '046694',
      groupSiteId: '046694',
      redTubeFlag: 'Yes',
      redTube2: 'Yes',
      purpleTubeFlag: 'Yes',
      serumPlasmaInd: 'Yes',
      bleedStartTime: '2025-01-11T14:00:00Z',
      bleedEndTime: '2025-01-11T14:10:00Z',
      qcCheckinDate: null,
      exceptionType: 'MISSING_DATA',
    },
    {
      unitId: 'W123418031307',
      chkDigit: '34',
      collDate: '2025-01-10T00:00:00Z',
      donorDecisionCode: 'A',
      catalogNumber: 'TE00CPD109',
      driveId: '890109',
      groupSiteId: '890109',
      redTubeFlag: 'Yes',
      redTube2: 'Yes',
      purpleTubeFlag: 'Yes',
      serumPlasmaInd: 'Yes',
      bleedStartTime: '2025-01-10T19:15:00Z',
      bleedEndTime: '2025-01-10T19:20:00Z',
      qcCheckinDate: '2025-12-10T00:00:00Z',
      exceptionType: 'HAS_ATTRIB_14',
    },
  ];

  const mockUnitAttributes: UnitAttributeDto[] = [
    {
      attributeGroup: 'PHER',
      groupDescription: 'Apheresis Donation Procedures',
      attributeCode: 'PP',
      codeDescription: 'Plateletpheresis',
    },
  ];

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CheckInBatchExceptionApiService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(CheckInBatchExceptionApiService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getBatchExceptions', () => {
    it('should fetch batch exceptions successfully', (done) => {
      const batchId = '111619-CB9006';
      const mockResponse: BatchExceptionResponse = {
        success: true,
        message: 'Successfully retrieved 2 batch exception(s).',
        statusCode: 200,
        data: mockBatchExceptions,
        total: 2,
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getBatchExceptions(batchId).subscribe({
        next: (data) => {
          expect(data).toEqual(mockBatchExceptions);
          expect(data.length).toBe(2);
          expect(apiService.get).toHaveBeenCalledWith(
            API.CHECK_IN_BATCH_EXCEPTION.GET_BATCH_EXCEPTIONS(batchId)
          );
          done();
        },
      });
    });


    it('should handle error when batch not found', (done) => {
      const batchId = 'INVALID-BATCH';
      const error = {
        status: 404,
        message: 'Batch not found or is not a check-in batch (CB type). Please verify the batch ID.',
      };

      apiService.get.and.returnValue(throwError(() => error));

      service.getBatchExceptions(batchId).subscribe({
        error: (err) => {
          expect(err).toBeDefined();
          expect(apiService.get).toHaveBeenCalled();
          done();
        },
      });
    });

  });

  describe('getUnitAttributes', () => {
    it('should fetch unit attributes successfully', (done) => {
      const unitId = 'W123418031306';
      const collDate = '2025-01-11T00:00:00Z';
      const mockResponse: UnitAttributesResponse = {
        success: true,
        message: 'Successfully retrieved 1 unit attribute(s).',
        statusCode: 200,
        data: mockUnitAttributes,
        total: 1,
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getUnitAttributes(unitId, collDate).subscribe({
        next: (data) => {
          expect(data).toEqual(mockUnitAttributes);
          expect(data.length).toBe(1);
          expect(apiService.get).toHaveBeenCalledWith(
            API.CHECK_IN_BATCH_EXCEPTION.GET_UNIT_ATTRIBUTES(unitId, collDate)
          );
          done();
        },
      });
    });

    it('should handle 404 when no attributes found', (done) => {
      const unitId = 'W123418031999';
      const collDate = '2025-01-11T00:00:00Z';
      const error = {
        status: 404,
        message: 'No attributes found for this unit.',
      };

      apiService.get.and.returnValue(throwError(() => error));

      service.getUnitAttributes(unitId, collDate).subscribe({
        error: (err) => {
          expect(err.message).toBe('No attributes found for this unit.');
          done();
        },
      });
    });


    it('should return empty array when response has no data', (done) => {
      const unitId = 'W123418031306';
      const collDate = '2025-01-11T00:00:00Z';
      const mockResponse: UnitAttributesResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getUnitAttributes(unitId, collDate).subscribe({
        next: (data) => {
          expect(data).toEqual([]);
          done();
        },
      });
    });
  });
});
