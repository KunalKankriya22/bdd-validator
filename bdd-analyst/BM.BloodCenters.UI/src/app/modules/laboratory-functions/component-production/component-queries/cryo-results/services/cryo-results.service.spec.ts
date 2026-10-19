import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CryoResultsService } from './cryo-results.service';
import {
  WorksheetIdsResponse,
  CryoResultUnitsResponse,
} from '../models/cryo-results.model';
import { API } from '../../../../../../core/constants/api.constants';
import { environment } from '../../../../../../../environments/environment';

describe('CryoResultsService', () => {
  let service: CryoResultsService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), CryoResultsService],
    });

    service = TestBed.inject(CryoResultsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getWorksheetIds', () => {
    it('should fetch worksheet IDs with default daysBack', (done) => {
      const mockResponse: WorksheetIdsResponse = {
        success: true,
        message: 'Data retrieved successfully',
        statusCode: 200,
        data: [
          { worksheetId: 'CY1001' },
          { worksheetId: 'CY1002' },
        ],
        total: 2,
      };

      service.getWorksheetIds().subscribe((items) => {
        expect(items.length).toBe(2);
        expect(items[0].worksheetId).toBe('CY1001');
        expect(items[1].worksheetId).toBe('CY1002');
        done();
      });

      const req = httpMock.expectOne(
        (r) => r.url.includes(API.CRYO_RESULTS_QUERY.GET_WORKSHEETS) && r.params.get('daysBack') === '21',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass custom daysBack parameter', (done) => {
      const mockResponse: WorksheetIdsResponse = {
        success: true,
        message: 'Data retrieved successfully',
        statusCode: 200,
        data: [],
        total: 0,
      };

      service.getWorksheetIds(30).subscribe((items) => {
        expect(items.length).toBe(0);
        done();
      });

      const req = httpMock.expectOne(
        (r) => r.url.includes(API.CRYO_RESULTS_QUERY.GET_WORKSHEETS) && r.params.get('daysBack') === '30',
      );
      req.flush(mockResponse);
    });


    it('should propagate HTTP errors', (done) => {
      service.getWorksheetIds().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(
        (r) => r.url.includes(API.CRYO_RESULTS_QUERY.GET_WORKSHEETS),
      );
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getUnitsAwaitingResults', () => {
    it('should fetch units with take and skip', (done) => {
      const mockResponse: CryoResultUnitsResponse = {
        success: true,
        message: 'Data retrieved successfully',
        statusCode: 200,
        data: [
          {
            unitId: 'W633317070115',
            chkDigit: 'H',
            collDate: '2025-03-01T09:00:00Z',
            actualProductCode: 'E0701V00',
            productShortName: 'CRYO',
            thawMethod: 'REF',
            thawTemperature: 3.0,
            sepInd: '3',
            freezeTime: '2025-03-01T09:00:00Z',
          },
        ],
        total: 18,
      };

      service.getUnitsAwaitingResults('CY1001', 10, 0).subscribe((result) => {
        expect(result.data.length).toBe(1);
        expect(result.totalRecords).toBe(18);
        expect(result.data[0].unitId).toBe('W633317070115-H');
        done();
      });

      const expectedUrl = API.CRYO_RESULTS_QUERY.GET_UNITS('CY1001', 10, 0);
      const req = httpMock.expectOne((r) => r.url.includes(expectedUrl));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should combine unitId and chkDigit', (done) => {
      const mockResponse: CryoResultUnitsResponse = {
        success: true,
        message: 'Data retrieved successfully',
        statusCode: 200,
        data: [
          {
            unitId: 'W633317070115',
            chkDigit: 'N',
            collDate: '2025-03-01T00:00:00Z',
            actualProductCode: 'E5165V00',
            productShortName: 'CRYO',
            thawMethod: 'REF',
            thawTemperature: 3.0,
            sepInd: '3',
            freezeTime: null,
          },
        ],
        total: 1,
      };

      service.getUnitsAwaitingResults('CY1001', 10, 0).subscribe((result) => {
        expect(result.data[0].unitId).toBe('W633317070115-N');
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(API.CRYO_RESULTS_QUERY.GET_UNITS('CY1001', 10, 0)),
      );
      req.flush(mockResponse);
    });

    it('should use unitId only when chkDigit is null', (done) => {
      const mockResponse: CryoResultUnitsResponse = {
        success: true,
        message: 'Data retrieved',
        statusCode: 200,
        data: [
          {
            unitId: 'W633317070115',
            chkDigit: null,
            collDate: '2025-03-01T00:00:00Z',
            actualProductCode: 'E5165V00',
            productShortName: 'CRYO',
            thawMethod: null,
            thawTemperature: null,
            sepInd: null,
            freezeTime: null,
          },
        ],
        total: 1,
      };

      service.getUnitsAwaitingResults('CY1001', 10, 0).subscribe((result) => {
        expect(result.data[0].unitId).toBe('W633317070115');
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(API.CRYO_RESULTS_QUERY.GET_UNITS('CY1001', 10, 0)),
      );
      req.flush(mockResponse);
    });

    it('should format collDate as date-only and freezeTime with time', (done) => {
      const mockResponse: CryoResultUnitsResponse = {
        success: true,
        message: 'Data retrieved',
        statusCode: 200,
        data: [
          {
            unitId: 'W633317070115',
            chkDigit: 'H',
            collDate: '2025-03-01T09:00:00Z',
            actualProductCode: 'E0701V00',
            productShortName: 'CRYO',
            thawMethod: 'REF',
            thawTemperature: 3.0,
            sepInd: '3',
            freezeTime: '2025-03-01T14:30:00Z',
          },
        ],
        total: 1,
      };

      service.getUnitsAwaitingResults('CY1001', 10, 0).subscribe((result) => {
        expect(result.data[0].collDate).toMatch(/^\d{1,2}-[A-Z]{3}-\d{4}$/);
        expect(result.data[0].freezeTime).toMatch(/^\d{1,2}-[A-Z]{3}-\d{4}, \d{2}:\d{2}$/);
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(API.CRYO_RESULTS_QUERY.GET_UNITS('CY1001', 10, 0)),
      );
      req.flush(mockResponse);
    });

    it('should handle null dates as empty strings', (done) => {
      const mockResponse: CryoResultUnitsResponse = {
        success: true,
        message: 'Data retrieved',
        statusCode: 200,
        data: [
          {
            unitId: 'W633317070115',
            chkDigit: 'H',
            collDate: null,
            actualProductCode: null,
            productShortName: null,
            thawMethod: null,
            thawTemperature: null,
            sepInd: null,
            freezeTime: null,
          },
        ],
        total: 1,
      };

      service.getUnitsAwaitingResults('CY1001', 10, 0).subscribe((result) => {
        const unit = result.data[0];
        expect(unit.collDate).toBe('');
        expect(unit.freezeTime).toBe('');
        expect(unit.actualProductCode).toBe('');
        expect(unit.productShortName).toBe('');
        expect(unit.thawMethod).toBe('');
        expect(unit.thawTemperature).toBe('');
        expect(unit.sepInd).toBe('');
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(API.CRYO_RESULTS_QUERY.GET_UNITS('CY1001', 10, 0)),
      );
      req.flush(mockResponse);
    });

    it('should format thawTemperature with 1 decimal place', (done) => {
      const mockResponse: CryoResultUnitsResponse = {
        success: true,
        message: 'Data retrieved',
        statusCode: 200,
        data: [
          {
            unitId: 'W633317070115',
            chkDigit: 'H',
            collDate: '2025-03-01T00:00:00Z',
            actualProductCode: 'E0701V00',
            productShortName: 'CRYO',
            thawMethod: 'REF',
            thawTemperature: 3,
            sepInd: '3',
            freezeTime: '2025-03-01T00:00:00Z',
          },
        ],
        total: 1,
      };

      service.getUnitsAwaitingResults('CY1001', 10, 0).subscribe((result) => {
        expect(result.data[0].thawTemperature).toBe('3.0');
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(API.CRYO_RESULTS_QUERY.GET_UNITS('CY1001', 10, 0)),
      );
      req.flush(mockResponse);
    });


    it('should propagate HTTP errors', (done) => {
      service.getUnitsAwaitingResults('CY1001', 10, 0).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(API.CRYO_RESULTS_QUERY.GET_UNITS('CY1001', 10, 0)),
      );
      req.flush({ message: 'Invalid worksheet' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should pass sort parameters when provided', (done) => {
      const mockResponse: CryoResultUnitsResponse = {
        success: true,
        message: 'Data retrieved',
        statusCode: 200,
        data: [],
        total: 0,
      };

      service.getUnitsAwaitingResults('CY1001', 10, 0, 'unitId', 'asc').subscribe((result) => {
        expect(result.data.length).toBe(0);
        expect(result.totalRecords).toBe(0);
        done();
      });

      const req = httpMock.expectOne(
        (r) =>
          r.url.includes(API.CRYO_RESULTS_QUERY.GET_UNITS('CY1001', 10, 0)) &&
          r.params.get('sortColumn') === 'unitId' &&
          r.params.get('sortOrder') === 'asc',
      );
      req.flush(mockResponse);
    });

    it('should handle null response data gracefully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Data retrieved',
        statusCode: 200,
        data: null,
        total: 0,
      };

      service.getUnitsAwaitingResults('CY1001', 10, 0).subscribe((result) => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(API.CRYO_RESULTS_QUERY.GET_UNITS('CY1001', 10, 0)),
      );
      req.flush(mockResponse);
    });

    it('should handle null total in response', (done) => {
      const mockResponse = {
        success: true,
        message: 'Data retrieved',
        statusCode: 200,
        data: [],
        total: null,
      };

      service.getUnitsAwaitingResults('CY1001', 10, 0).subscribe((result) => {
        expect(result.totalRecords).toBe(0);
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(API.CRYO_RESULTS_QUERY.GET_UNITS('CY1001', 10, 0)),
      );
      req.flush(mockResponse);
    });
  });

  describe('getWorksheetIds edge cases', () => {
    it('should handle null response data as empty array', (done) => {
      const mockResponse = {
        success: true,
        message: 'Data retrieved',
        statusCode: 200,
        data: null,
        total: 0,
      };

      service.getWorksheetIds().subscribe((items) => {
        expect(items).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        (r) => r.url.includes(API.CRYO_RESULTS_QUERY.GET_WORKSHEETS),
      );
      req.flush(mockResponse);
    });
  });
});
