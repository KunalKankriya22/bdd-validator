import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SddWorksheetUnitsApiService } from './sdd-worksheet-units-api.service';
import {
  SddWorksheetLookupDto,
  SddWorksheetUnitDto,
  DeleteSddWorksheetUnitsRequestDto,
  DeleteSddWorksheetUnitsResponseDto,
  ApiResponse
} from '../models/sdd-worksheet-units.model';

describe('SddWorksheetUnitsApiService', () => {
  let service: SddWorksheetUnitsApiService;
  let httpMock: HttpTestingController;
  const baseUrl = '/api/v1/sdd-worksheet-units';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SddWorksheetUnitsApiService]
    });

    service = TestBed.inject(SddWorksheetUnitsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getWorksheets', () => {
    it('should retrieve worksheets successfully', () => {
      const mockWorksheets: SddWorksheetLookupDto[] = [
        { sdcWsNumber: 'WS12345', unitCount: '5 Units' },
        { sdcWsNumber: 'WS67890', unitCount: '3 Units' }
      ];

      const mockResponse: ApiResponse<SddWorksheetLookupDto[]> = {
        success: true,
        message: 'Worksheets retrieved successfully',
        statusCode: 200,
        data: mockWorksheets,
        total: 2
      };

      service.getWorksheets().subscribe((worksheets) => {
        expect(worksheets).toEqual(mockWorksheets);
        expect(worksheets.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/worksheets`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


  });

  describe('getUnits', () => {
    const worksheetId = 'WS12345';
    const take = 10;
    const skip = 0;

    it('should retrieve units for a worksheet successfully', () => {
      const mockUnits: SddWorksheetUnitDto[] = [
        { unitId: 'ABC1234567890', collDate: '15-Jan-2024', chkDigit: '12', sdcWsNumber: 'WS12345' },
        { unitId: 'DEF1234567890', collDate: '16-Jan-2024', chkDigit: '34', sdcWsNumber: 'WS12345' }
      ];

      const mockResponse: ApiResponse<SddWorksheetUnitDto[]> = {
        success: true,
        message: 'Units retrieved successfully',
        statusCode: 200,
        data: mockUnits,
        total: 2
      };

      service.getUnits(worksheetId, take, skip, 'asc').subscribe((result) => {
        expect(result.items).toEqual(mockUnits);
        expect(result.totalCount).toBe(2);
        expect(result.items.length).toBe(2);
      });

      const req = httpMock.expectOne(r =>
        r.url.endsWith(`${baseUrl}/${worksheetId}/${take}/${skip}`) && r.method === 'GET'
      );
      expect(req.request.params.get('sortOrder')).toBe('asc');
      req.flush(mockResponse);
    });

    it('should encode worksheet ID in URL', () => {
      const encodedId = 'WS%2012345';
      const rawId = 'WS 12345';

      service.getUnits(rawId, take, skip, 'asc').subscribe();

      const req = httpMock.expectOne(r =>
        r.url.endsWith(`${baseUrl}/${encodedId}/${take}/${skip}`) && r.method === 'GET'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [], total: 0, statusCode: 200, message: 'OK' });
    });


    it('should use total from response as totalCount', () => {
      const mockResponse: ApiResponse<SddWorksheetUnitDto[]> = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: [],
        total: 42
      };

      service.getUnits(worksheetId, take, skip).subscribe((result) => {
        expect(result.totalCount).toBe(42);
      });

      const req = httpMock.expectOne(r =>
        r.url.endsWith(`${baseUrl}/${worksheetId}/${take}/${skip}`) && r.method === 'GET'
      );
      req.flush(mockResponse);
    });

    it('should handle pagination parameters correctly', () => {
      service.getUnits(worksheetId, 25, 50).subscribe();

      const req = httpMock.expectOne(r =>
        r.url.endsWith(`${baseUrl}/${worksheetId}/25/50`) && r.method === 'GET'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [], total: 0, statusCode: 200, message: 'OK' });
    });

    it('should send desc sortOrder as query param', () => {
      service.getUnits(worksheetId, take, skip, 'desc').subscribe();

      const req = httpMock.expectOne(r =>
        r.url.endsWith(`${baseUrl}/${worksheetId}/${take}/${skip}`) && r.method === 'GET'
      );
      expect(req.request.params.get('sortOrder')).toBe('desc');
      req.flush({ success: true, data: [], total: 0, statusCode: 200, message: 'OK' });
    });

    it('should omit sortOrder param when not provided', () => {
      service.getUnits(worksheetId, take, skip).subscribe();

      const req = httpMock.expectOne(r =>
        r.url.endsWith(`${baseUrl}/${worksheetId}/${take}/${skip}`) && r.method === 'GET'
      );
      expect(req.request.params.has('sortOrder')).toBeFalse();
      req.flush({ success: true, data: [], total: 0, statusCode: 200, message: 'OK' });
    });

  });

  describe('deleteUnits', () => {
    it('should delete units successfully', () => {
      const request: DeleteSddWorksheetUnitsRequestDto = {
        sdcWsNumber: 'WS12345',
        unitIds: ['ABC1234567890', 'DEF1234567890']
      };

      const mockDeleteResponse: DeleteSddWorksheetUnitsResponseDto = {
        deletedCount: 2,
        worksheetId: 'WS12345'
      };

      const mockResponse: ApiResponse<DeleteSddWorksheetUnitsResponseDto> = {
        success: true,
        message: 'Successfully deleted 2 unit(s) from worksheet',
        statusCode: 200,
        data: mockDeleteResponse
      };

      service.deleteUnits(request).subscribe((response) => {
        expect(response.deletedCount).toBe(2);
        expect(response.worksheetId).toBe('WS12345');
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle validation error from API', () => {
      const request: DeleteSddWorksheetUnitsRequestDto = {
        sdcWsNumber: 'WS12345',
        unitIds: ['ABC1234567890']
      };

      service.deleteUnits(request).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(
        {
          success: false,
          message: 'Worksheet not found or has no unprocessed units',
          statusCode: 400
        },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle server error', () => {
      const request: DeleteSddWorksheetUnitsRequestDto = {
        sdcWsNumber: 'WS12345',
        unitIds: ['ABC1234567890']
      };

      service.deleteUnits(request).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(
        {
          success: false,
          message: 'Failed to delete units from worksheet',
          statusCode: 500
        },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });
  });
});
