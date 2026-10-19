import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Observable } from 'rxjs';
import { NonExtractedBatchesApiService } from './non-extracted-batches-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  BatchDto,
  UnitDto,
  TestResultDto,
  ContractLookupDto,
  QueryBatchesResponse,
  NonExtractedBatchesQueryParams
} from '../models/non-extracted-batches.model';

describe('NonExtractedBatchesApiService', () => {
  let service: NonExtractedBatchesApiService;
  let httpMock: HttpTestingController;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockQueryResponse: QueryBatchesResponse = {
    batches: [
      {
        batchId: '01021301',
        numberOfUnits: 42,
        contractId: 'RG000123',
        chapterId: 'CHT001',
        qcDate: null
      },
      {
        batchId: '01021302',
        numberOfUnits: 35,
        contractId: 'RG000123',
        chapterId: 'CHT001',
        qcDate: null
      }
    ],
    totalBatches: 2,
    totalUnits: 77
  };

  const mockUnits: UnitDto[] = [
    {
      unitId: '0102130100001',
      checkDigit: 'F',
      collDate: '2024-05-15T00:00:00Z',
      batchId: '01021301',
      contractId: 'RG000123',
      chapterId: 'CHT001',
      qcCheckinDate: null
    },
    {
      unitId: '0102130100002',
      checkDigit: 'D',
      collDate: '2024-05-15T00:00:00Z',
      batchId: '01021301',
      contractId: 'RG000123',
      chapterId: 'CHT001',
      qcCheckinDate: null
    }
  ];

  const mockTestResults: TestResultDto[] = [
    {
      unitId: '0102130100001',
      collDate: '2024-05-15T00:00:00Z',
      testId: 'ALT',
      testSeqNo: 1,
      resultStatus1: 'N',
      extractDate: null,
      chapterId: 'CHT001'
    },
    {
      unitId: '0102130100001',
      collDate: '2024-05-15T00:00:00Z',
      testId: 'HBsAg',
      testSeqNo: 2,
      resultStatus1: 'N',
      extractDate: null,
      chapterId: 'CHT001'
    }
  ];

  const mockContracts: ContractLookupDto[] = [
    {
      contractId: 'RG000123',
      company: 'Regional Testing Lab A',
      centerId: 'CENTER01'
    },
    {
      contractId: 'RG000456',
      company: 'Regional Testing Lab B',
      centerId: 'CENTER02'
    }
  ];

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NonExtractedBatchesApiService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(NonExtractedBatchesApiService);
    httpMock = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('queryBatches', () => {
    it('should query batches with required date range', (done) => {
      const params: NonExtractedBatchesQueryParams = {
        fromDate: '2024-05-01',
        toDate: '2024-05-31'
      };

      apiService.get.and.returnValue(
        new Observable(subscriber => {
          subscriber.next({ data: mockQueryResponse });
          subscriber.complete();
        })
      );

      service.queryBatches(params).subscribe(response => {
        expect(response).toEqual(mockQueryResponse);
        expect(response.batches.length).toBe(2);
        expect(response.totalBatches).toBe(2);
        expect(response.totalUnits).toBe(77);
        done();
      });

      expect(apiService.get).toHaveBeenCalledWith(
        API.NON_EXTRACTED_BATCHES.GET_BATCHES,
        jasmine.objectContaining({ params: jasmine.any(Object) })
      );
    });

    it('should query batches with optional contract filter', (done) => {
      const params: NonExtractedBatchesQueryParams = {
        contractId: 'RG000123',
        fromDate: '2024-05-01',
        toDate: '2024-05-31'
      };

      apiService.get.and.returnValue(
        new Observable(subscriber => {
          subscriber.next({ data: mockQueryResponse });
          subscriber.complete();
        })
      );

      service.queryBatches(params).subscribe(response => {
        expect(response).toEqual(mockQueryResponse);
        done();
      });

      expect(apiService.get).toHaveBeenCalled();
    });

  });

  describe('getUnitsForBatch', () => {
    it('should get units for a batch without contract filter', (done) => {
      const batchId = '01021301';

      apiService.get.and.returnValue(
        new Observable(subscriber => {
          subscriber.next({ data: mockUnits });
          subscriber.complete();
        })
      );

      service.getUnitsForBatch(batchId).subscribe(units => {
        expect(units).toEqual(mockUnits);
        expect(units.length).toBe(2);
        done();
      });

      expect(apiService.get).toHaveBeenCalledWith(
        API.NON_EXTRACTED_BATCHES.GET_UNITS(batchId),
        jasmine.objectContaining({ params: jasmine.any(Object) })
      );
    });

    it('should get units for a batch with contract filter', (done) => {
      const batchId = '01021301';
      const contractId = 'RG000123';

      apiService.get.and.returnValue(
        new Observable(subscriber => {
          subscriber.next({ data: mockUnits });
          subscriber.complete();
        })
      );

      service.getUnitsForBatch(batchId, contractId).subscribe(units => {
        expect(units).toEqual(mockUnits);
        done();
      });

      expect(apiService.get).toHaveBeenCalled();
    });

    it('should handle empty units result', (done) => {
      const batchId = '01021301';

      apiService.get.and.returnValue(
        new Observable(subscriber => {
          subscriber.next({ data: [] });
          subscriber.complete();
        })
      );

      service.getUnitsForBatch(batchId).subscribe(units => {
        expect(units.length).toBe(0);
        done();
      });
    });
  });

  describe('getTestResultsForUnit', () => {
    it('should get test results for a unit', (done) => {
      const batchId = '01021301';
      const unitId = '0102130100001';
      const collDate = '2024-05-15T00:00:00Z';

      apiService.get.and.returnValue(
        new Observable(subscriber => {
          subscriber.next({ data: mockTestResults });
          subscriber.complete();
        })
      );

      service.getTestResultsForUnit(batchId, unitId, collDate).subscribe(results => {
        expect(results).toEqual(mockTestResults);
        expect(results.length).toBe(2);
        done();
      });

      expect(apiService.get).toHaveBeenCalledWith(
        API.NON_EXTRACTED_BATCHES.GET_TEST_RESULTS(batchId, unitId),
        jasmine.objectContaining({ params: jasmine.any(Object) })
      );
    });

    it('should get test results with contract filter', (done) => {
      const batchId = '01021301';
      const unitId = '0102130100001';
      const collDate = '2024-05-15T00:00:00Z';
      const contractId = 'RG000123';

      apiService.get.and.returnValue(
        new Observable(subscriber => {
          subscriber.next({ data: mockTestResults });
          subscriber.complete();
        })
      );

      service.getTestResultsForUnit(batchId, unitId, collDate, contractId).subscribe(results => {
        expect(results).toEqual(mockTestResults);
        done();
      });

      expect(apiService.get).toHaveBeenCalled();
    });

    it('should handle empty test results', (done) => {
      const batchId = '01021301';
      const unitId = '0102130100001';
      const collDate = '2024-05-15T00:00:00Z';

      apiService.get.and.returnValue(
        new Observable(subscriber => {
          subscriber.next({ data: [] });
          subscriber.complete();
        })
      );

      service.getTestResultsForUnit(batchId, unitId, collDate).subscribe(results => {
        expect(results.length).toBe(0);
        done();
      });
    });
  });

  describe('getActiveContracts', () => {
    it('should get active contracts for dropdown', (done) => {
      apiService.get.and.returnValue(
        new Observable(subscriber => {
          subscriber.next({ data: mockContracts });
          subscriber.complete();
        })
      );

      service.getActiveContracts().subscribe(contracts => {
        expect(contracts).toEqual(mockContracts);
        expect(contracts.length).toBe(2);
        done();
      });

      expect(apiService.get).toHaveBeenCalledWith(
        API.NON_EXTRACTED_BATCHES.GET_CONTRACTS
      );
    });

    it('should handle empty contracts result', (done) => {
      apiService.get.and.returnValue(
        new Observable(subscriber => {
          subscriber.next({ data: [] });
          subscriber.complete();
        })
      );

      service.getActiveContracts().subscribe(contracts => {
        expect(contracts.length).toBe(0);
        done();
      });
    });
  });
});
