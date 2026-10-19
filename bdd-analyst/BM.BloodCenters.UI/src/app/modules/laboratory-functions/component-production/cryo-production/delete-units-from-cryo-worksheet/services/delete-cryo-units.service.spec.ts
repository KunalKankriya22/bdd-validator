import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DeleteCryoUnitsService } from './delete-cryo-units.service';
import {
  CryoWorksheetLovResponse,
  CryoUnitsResponse,
  DeleteCryoUnitsRequest,
  DeleteCryoUnitsResponse,
} from '../models/delete-cryo-units.model';
import { API } from '../../../../../../core/constants/api.constants';

describe('DeleteCryoUnitsService', () => {
  let service: DeleteCryoUnitsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), DeleteCryoUnitsService],
    });

    service = TestBed.inject(DeleteCryoUnitsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getWorksheets', () => {
    it('should fetch worksheet LOV with pagination', (done) => {
      const mockResponse: CryoWorksheetLovResponse = {
        success: true,
        message: 'Worksheets retrieved successfully',
        statusCode: 200,
        data: [
          {
            cryoWorksheetId: 'CRW123456',
            worksheetDate: '2026-06-10T00:00:00Z',
            unitCount: 15,
            locationId: 'LAB001',
          },
          {
            cryoWorksheetId: 'CRW123457',
            worksheetDate: '2026-06-09T00:00:00Z',
            unitCount: 8,
            locationId: 'LAB002',
          },
        ],
        totalCount: 2,
      };

      service.getWorksheets(10, 0).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.data.length).toBe(2);
        expect(response.totalCount).toBe(2);
        done();
      });

      const req = httpMock.expectOne(API.CRYO_WORKSHEET_UNITS.GET_WORKSHEETS(10, 0));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

  });

  describe('getWorksheetUnits', () => {
    it('should fetch units for a worksheet', (done) => {
      const worksheetId = 'CRW123456';
      const mockResponse: CryoUnitsResponse = {
        success: true,
        message: 'Units retrieved successfully',
        statusCode: 200,
        data: [
          {
            unitId: '12345678901',
            productCode: 'PC',
            productDescription: 'POOLED CRYOPRECIPITATE',
            bloodGroup: 'O',
            rh: 'POS',
            collDate: '2026-06-08T00:00:00Z',
            expirationDate: '2027-06-08T00:00:00Z',
            status: 'AVAILABLE',
          },
          {
            unitId: '12345678902',
            productCode: 'PC',
            productDescription: 'POOLED CRYOPRECIPITATE',
            bloodGroup: 'A',
            rh: 'POS',
            collDate: '2026-06-07T00:00:00Z',
            expirationDate: '2027-06-07T00:00:00Z',
            status: 'AVAILABLE',
          },
        ],
        totalCount: 2,
      };

      service.getWorksheetUnits(worksheetId, 10, 0).subscribe((units) => {
        expect(units.length).toBe(2);
        expect(units[0].unitId).toBe('12345678901');
        expect(units[0].collectionDate).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/); // DD-MMM-YYYY format
        expect(units[0].sequence).toBe(1); // Frontend-generated sequence
        done();
      });

      const req = httpMock.expectOne(API.CRYO_WORKSHEET_UNITS.GET_UNITS(worksheetId, 10, 0));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });


  });

  describe('deleteUnits', () => {
    it('should delete units successfully', (done) => {
      const deleteRequest: DeleteCryoUnitsRequest = {
        cryoWorksheetId: 'CRW123456',
        unitIds: ['12345678901', '12345678902'],
      };

      const mockResponse: DeleteCryoUnitsResponse = {
        success: true,
        message: 'TRANSACTION COMMITTED',
        errorCode: '8010',
        statusCode: 200,
        errorResponse: {
          ErrorCode: '8010',
          Error: 'TRANSACTION COMMITTED',
        },
      };

      service.deleteUnits(deleteRequest).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.success).toBe(true);
        expect(response.errorCode).toBe('8010');
        done();
      });

      const req = httpMock.expectOne(API.CRYO_WORKSHEET_UNITS.DELETE_UNITS);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toEqual(deleteRequest);
      req.flush(mockResponse);
    });

    it('should handle delete validation error', (done) => {
      const deleteRequest: DeleteCryoUnitsRequest = {
        cryoWorksheetId: 'INVALID',
        unitIds: ['12345678901'],
      };

      const mockErrorResponse: DeleteCryoUnitsResponse = {
        success: false,
        message: 'CRYO has been made for all units, or invalid CRYO worksheet ID',
        errorCode: '0054',
        statusCode: 400,
        errorResponse: {
          ErrorCode: '0054',
          Error: 'CRYO has been made for all units, or invalid CRYO worksheet ID',
        },
      };

      service.deleteUnits(deleteRequest).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.error.errorCode).toBe('0054');
          done();
        }
      );

      const req = httpMock.expectOne(API.CRYO_WORKSHEET_UNITS.DELETE_UNITS);
      req.flush(mockErrorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle delete with no units error', (done) => {
      const deleteRequest: DeleteCryoUnitsRequest = {
        cryoWorksheetId: 'CRW123456',
        unitIds: [],
      };

      const mockErrorResponse: DeleteCryoUnitsResponse = {
        success: false,
        message: 'No changes to commit',
        errorCode: '8013',
        statusCode: 400,
        errorResponse: {
          ErrorCode: '8013',
          Error: 'No changes to commit',
        },
      };

      service.deleteUnits(deleteRequest).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.error.errorCode).toBe('8013');
          done();
        }
      );

      const req = httpMock.expectOne(API.CRYO_WORKSHEET_UNITS.DELETE_UNITS);
      req.flush(mockErrorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle commit failure error', (done) => {
      const deleteRequest: DeleteCryoUnitsRequest = {
        cryoWorksheetId: 'CRW123456',
        unitIds: ['12345678901'],
      };

      const mockErrorResponse: DeleteCryoUnitsResponse = {
        success: false,
        message: 'Unsuccessful commit... transaction not saved',
        errorCode: '0230',
        statusCode: 500,
        errorResponse: {
          ErrorCode: '0230',
          Error: 'Unsuccessful commit... transaction not saved',
        },
      };

      service.deleteUnits(deleteRequest).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.error.errorCode).toBe('0230');
          done();
        }
      );

      const req = httpMock.expectOne(API.CRYO_WORKSHEET_UNITS.DELETE_UNITS);
      req.flush(mockErrorResponse, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
