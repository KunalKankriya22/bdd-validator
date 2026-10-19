import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { CheckInBatchQueryApiService } from './check-in-batch-query-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { ReturnResult } from '../models/check-in-batch-query.model';

describe('CheckInBatchQueryApiService', () => {
  let service: CheckInBatchQueryApiService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        CheckInBatchQueryApiService,
        { provide: ApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(CheckInBatchQueryApiService);
  });

  describe('getBatchIdsLov', () => {
    it('should call API with correct URL and unwrap response.data', (done) => {
      const mockResponse: ReturnResult<any> = {
        success: true,
        message: 'Success',
        error: null,
        errorCode: null,
        statusCode: 200,
        data: [{ batchId: '111619-CB9006' }, { batchId: '111619-CB9007' }],
        item: null,
        total: 2,
      };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getBatchIdsLov().subscribe((batchIds) => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.QC_BATCH_UNITS_BATCH_IDS_LOV
        );
        expect(batchIds.length).toBe(2);
        expect(batchIds[0].batchId).toBe('111619-CB9006');
        done();
      });
    });

    it('should return empty array when response.data is null', (done) => {
      const mockResponse: ReturnResult<any> = {
        success: true,
        message: null,
        error: null,
        errorCode: null,
        statusCode: 200,
        data: null,
        item: null,
        total: 0,
      };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getBatchIdsLov().subscribe((batchIds) => {
        expect(batchIds).toEqual([]);
        done();
      });
    });

    it('should return empty array on API error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getBatchIdsLov().subscribe((batchIds) => {
        expect(batchIds).toEqual([]);
        done();
      });
    });
  });

  describe('getUnitsByBatchId', () => {
    it('should call API with correct URL and map response to BatchUnitsResponse', (done) => {
      const mockResponse: ReturnResult<any> = {
        success: true,
        message: 'Success',
        error: null,
        errorCode: null,
        statusCode: 200,
        data: [
          {
            unitId: 'W123418031306',
            chkDigit: '-3',
            collDate: '2025-01-11T00:00:00',
            donorDecisionCode: 'Y',
            catalogNumber: 'TE00CPD100',
            driveId: '166348',
            groupSiteId: '046694',
            redTubeFlag: 'Y',
            redTube2: 'Y',
            purpleTubeFlag: 'Y',
            serumPlasmaInd: 'Y',
            bleedStartTime: '2025-01-11T14:00:00',
            bleedEndTime: '2025-01-11T14:10:00',
            qcCheckinDate: null,
          },
        ],
        item: null,
        total: 1,
      };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getUnitsByBatchId('111619-CB9006').subscribe((response) => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.QC_BATCH_UNITS_BY_BATCH('111619-CB9006')
        );
        expect(response.units.length).toBe(1);
        expect(response.unitCount).toBe(1);
        expect(response.units[0].unitId).toBe('W123418031306');
        expect(response.units[0].chkDigit).toBe('-3');
        expect(response.units[0].driveId).toBe('166348');
        done();
      });
    });

    it('should return empty units when response.data is null', (done) => {
      const mockResponse: ReturnResult<any> = {
        success: true,
        message: null,
        error: null,
        errorCode: null,
        statusCode: 200,
        data: null,
        item: null,
        total: null,
      };
      mockApiService.get.and.returnValue(of(mockResponse));

      service.getUnitsByBatchId('111619-CB9006').subscribe((response) => {
        expect(response.units).toEqual([]);
        expect(response.unitCount).toBe(0);
        done();
      });
    });

    it('should propagate error to caller', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('API Error')));

      service.getUnitsByBatchId('invalid').subscribe({
        error: (err) => {
          expect(err.message).toBe('API Error');
          done();
        },
      });
    });
  });
});
