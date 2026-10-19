import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { ConfirmatoryQcService } from './confirmatory-qc.service';
import { API } from '@core/constants/api.constants';
import { environment } from '../../../../../environments/environment';
import { QueryQcUnitsRequest } from '../models/qc-query-request.model';
import { SaveQcFlagsRequest } from '../models/qc-save-request.model';

describe('ConfirmatoryQcService', () => {
  let service: ConfirmatoryQcService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConfirmatoryQcService],
    });

    service = TestBed.inject(ConfirmatoryQcService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('queryUnits', () => {
    it('should query QC units with All Results mode', () => {
      const request: QueryQcUnitsRequest = {
        allResults: 'Y',
        testSeriesId: 'CONF01',
        testId: null,
        contractId: null,
        batchId: null,
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'QC units retrieved successfully',
        item: {
          sessionId: '260530153045001',
          units: [],
          summaryStats: {
            totalUnits: 0,
            skippedUnits: 0,
            noResultUnits: 0,
            sqcUnits: 0,
          },
        },
      };

      service.queryUnits(request).subscribe((response) => {
        expect(response.sessionId).toBe('260530153045001');
        expect(response.units).toEqual([]);
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.CONFIRMATORY_QC.QUERY}`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

  });

  describe('getUnits', () => {
    it('should get units list for session', () => {
      const sessionId = '260530153045001';
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Units retrieved successfully',
        data: [
          {
            unitId: 'W120624120401',
            checkDigit: 'L',
            tubeCheckIn: 'Yes',
            collectionDate: '2026-05-25T00:00:00Z',
            reason: 'OK',
            qcFlag: 'Y',
            redTube1: 'Y',
            redTube2: 'N',
            purpleTube1: 'Y',
            purpleTube2: 'N',
            daysSinceCollection: 5,
            collectionDateColor: 'GREEN',
            hasWarning: false,
          },
        ],
      };

      service.getUnits(sessionId).subscribe((units) => {
        expect(units.length).toBe(1);
        expect(units[0].unitId).toBe('W120624120401');
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.CONFIRMATORY_QC.UNITS(sessionId)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getUnitDetail', () => {
    it('should get unit detail', () => {
      const sessionId = '260530153045001';
      const unitId = 'W120624120401';
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Unit detail retrieved successfully',
        item: {
          unitId: 'W120624120401',
          checkDigit: 'L',
          batchId: 'BATCH001',
          profileSetId: 'PROF01',
          chapterId: '0001',
          testSeriesId: 'CONF01',
          testId: null,
          testResults: [],
          hasWarning: false,
        },
      };

      service.getUnitDetail(sessionId, unitId).subscribe((detail) => {
        expect(detail.unitId).toBe('W120624120401');
        expect(detail.batchId).toBe('BATCH001');
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.CONFIRMATORY_QC.UNIT_DETAIL(sessionId, unitId)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
  describe('save', () => {
    it('should save QC flags', () => {
      const request: SaveQcFlagsRequest = {
        sessionId: '260530153045001',
        unitQcFlags: [
          {
            unitId: 'W120624120401',
            qcFlag: 'Y',
            qcReason: 'OK',
          },
        ],
        confirmPartialReconciliation: false,
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'QC flags saved successfully',
        item: true,
      };

      service.save(request).subscribe((result) => {
        expect(result).toBe(true);
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.CONFIRMATORY_QC.SAVE(request.sessionId)}`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });
  describe('getContracts', () => {
    it('should get contracts dropdown', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Contracts retrieved successfully',
        data: [
          {
            contractId: 'C12345',
            companyName: 'ABC Blood Services',
          },
        ],
      };

      service.getContracts().subscribe((contracts) => {
        expect(contracts.length).toBe(1);
        expect(contracts[0].contractId).toBe('C12345');
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.CONFIRMATORY_QC.CONTRACTS}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getBatches', () => {
    it('should get batches dropdown without contract filter', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Batches retrieved successfully',
        data: [
          {
            batchId: 'BATCH001',
            isInUse: false,
          },
        ],
      };

      service.getBatches().subscribe((batches) => {
        expect(batches.length).toBe(1);
        expect(batches[0].batchId).toBe('BATCH001');
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.CONFIRMATORY_QC.BATCHES()}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get batches dropdown with contract filter', () => {
      const contractId = 'C12345';
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Batches retrieved successfully',
        data: [
          {
            batchId: 'BATCH001',
            isInUse: true,
          },
        ],
      };

      service.getBatches(contractId).subscribe((batches) => {
        expect(batches.length).toBe(1);
        expect(batches[0].isInUse).toBe(true);
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.CONFIRMATORY_QC.BATCHES(contractId)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getTestSeries', () => {
    it('should get test series dropdown', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Test series retrieved successfully',
        data: [
          {
            testSeriesId: 'CONF01',
            description: 'Confirmatory Test Series 1',
          },
        ],
      };

      service.getTestSeries().subscribe((series) => {
        expect(series.length).toBe(1);
        expect(series[0].testSeriesId).toBe('CONF01');
        expect(series[0].description).toBe('Confirmatory Test Series 1');
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.CONFIRMATORY_QC.TEST_SERIES}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getTests', () => {
    it('should get tests dropdown', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Tests retrieved successfully',
        data: [
          {
            testId: 'HIV12',
            testDescription: 'HIV 1/2 Antibody Test',
          },
        ],
      };

      service.getTests().subscribe((tests) => {
        expect(tests.length).toBe(1);
        expect(tests[0].testId).toBe('HIV12');
        expect(tests[0].testDescription).toBe('HIV 1/2 Antibody Test');
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.CONFIRMATORY_QC.TESTS}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
