import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { TestBatchesInHoldingAreaQueryService } from './test-batches-in-holding-area-query.service';
import { API } from '@core/constants/api.constants';
import {
  HoldingTestQueryParams,
  HoldingTestModel,
  ReturnResult,
  ViewInterdictionModel,
  MenuAccessResult,
  FilterValuesResult,
} from './test-batches-in-holding-area-query.model';

describe('TestBatchesInHoldingAreaQueryService', () => {
  let service: TestBatchesInHoldingAreaQueryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TestBatchesInHoldingAreaQueryService],
    });

    service = TestBed.inject(TestBatchesInHoldingAreaQueryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getHoldingTests', () => {
    it('should POST to search endpoint', () => {
      const params: HoldingTestQueryParams = {
        allOrPending: 'P',
        testId: 'HBSAG',
        tbId: null,
        unitId: null,
        searchText: null,
        sortColumn: 'TbId',
        sortOrder: 'DESC',
        take: 10,
        skip: 0,
      };

      const mockResponse: ReturnResult<HoldingTestModel[]> = {
        success: true,
        statusCode: 200,
        data: [],
        total: 0,
      };

      service.getHoldingTests(params).subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(API.HOLDING_TESTS_QUERY.SEARCH);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(params);
      req.flush(mockResponse);
    });
  });

  describe('getTestIds', () => {
    it('should GET test IDs with allOrPending param', () => {
      const mockResponse: ReturnResult<string[]> = {
        success: true,
        statusCode: 200,
        data: ['HBSAG', 'ABORH'],
      };

      service.getTestIds('P').subscribe((result) => {
        expect(result.data).toEqual(['HBSAG', 'ABORH']);
      });

      const req = httpMock.expectOne(
        `${API.HOLDING_TESTS_QUERY.TEST_IDS}?allOrPending=P`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getBatchIds', () => {
    it('should GET batch IDs with allOrPending param', () => {
      const mockResponse: ReturnResult<string[]> = {
        success: true,
        statusCode: 200,
        data: ['092809-TB6124'],
      };

      service.getBatchIds('P').subscribe((result) => {
        expect(result.data).toEqual(['092809-TB6124']);
      });

      const req = httpMock.expectOne(
        `${API.HOLDING_TESTS_QUERY.BATCH_IDS}?allOrPending=P`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include testId param when provided', () => {
      const mockResponse: ReturnResult<string[]> = {
        success: true,
        statusCode: 200,
        data: ['092809-TB6124'],
      };

      service.getBatchIds('P', 'HBSAG').subscribe((result) => {
        expect(result.data).toEqual(['092809-TB6124']);
      });

      const req = httpMock.expectOne(
        `${API.HOLDING_TESTS_QUERY.BATCH_IDS}?allOrPending=P&testId=HBSAG`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should not include testId param when null', () => {
      service.getBatchIds('P', null).subscribe();

      const req = httpMock.expectOne(
        `${API.HOLDING_TESTS_QUERY.BATCH_IDS}?allOrPending=P`
      );
      expect(req.request.params.has('testId')).toBe(false);
      req.flush({ success: true, statusCode: 200, data: [] });
    });
  });
  describe('getFilterValues', () => {
    it('should POST to filter values endpoint', () => {
      const params = { allOrPending: 'P' };
      const mockResponse: ReturnResult<FilterValuesResult> = {
        success: true,
        statusCode: 200,
        item: {
          testIds: ['HBSAG'],
          absorbances: ['0.045'],
          ratios: ['1.2'],
          resultValues: ['NR'],
          statuses: ['Upload'],
        },
      };

      service.getFilterValues(params).subscribe((result) => {
        expect(result.item.testIds).toEqual(['HBSAG']);
      });

      const req = httpMock.expectOne(API.HOLDING_TESTS_QUERY.FILTER_VALUES);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('Menu Access Cache', () => {
    it('should return undefined for uncached menu access', () => {
      expect(service.getCachedMenuAccess('CPINTER')).toBeUndefined();
    });

    it('should cache and retrieve menu access', () => {
      service.setCachedMenuAccess('CPINTER', true);
      expect(service.getCachedMenuAccess('CPINTER')).toBe(true);
    });

    it('should cache false access', () => {
      service.setCachedMenuAccess('CPIRINT', false);
      expect(service.getCachedMenuAccess('CPIRINT')).toBe(false);
    });

    it('should update cached value', () => {
      service.setCachedMenuAccess('CPINTER', true);
      service.setCachedMenuAccess('CPINTER', false);
      expect(service.getCachedMenuAccess('CPINTER')).toBe(false);
    });
  });
});
