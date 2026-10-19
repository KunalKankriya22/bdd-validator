import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ScanUnitsForCryoProcessingService } from './scan-units-for-cryo-processing.service';
import {
  CryoWorksheetDto,
  CryoUnitDto,
  CryoComponentDto,
  AddCryoUnitRequestDto,
  ReturnResult,
} from '../models/scan-units-for-cryo-processing.model';

describe('ScanUnitsForCryoProcessingService', () => {
  let service: ScanUnitsForCryoProcessingService;
  let httpMock: HttpTestingController;
  const baseUrl = 'api/v1/cryo-processing';

  const mockWorksheet: CryoWorksheetDto = {
    cryoWorksheetId: '030410-CY1242',
    insertDats: new Date('2024-03-10'),
    totalUnits: 5,
    processedUnits: 2,
    unprocessedUnits: 3,
  };

  const mockComponent: CryoComponentDto = {
    productCode: 'E0701V00',
    productDesc: 'Fresh Frozen Plasma',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ScanUnitsForCryoProcessingService],
    });
    service = TestBed.inject(ScanUnitsForCryoProcessingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getActiveWorksheets', () => {
    it('should fetch active worksheets successfully', (done) => {
      const mockResponse: ReturnResult<CryoWorksheetDto> = {
        success: true,
        statusCode: 200,
        data: [mockWorksheet],
      };

      service.getActiveWorksheets().subscribe((worksheets) => {
        expect(worksheets.length).toBe(1);
        expect(worksheets[0].cryoWorksheetId).toBe('030410-CY1242');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/worksheets`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


  });

  describe('getValidComponents', () => {
    it('should fetch valid components successfully', (done) => {
      const mockResponse: ReturnResult<CryoComponentDto> = {
        success: true,
        statusCode: 200,
        data: [mockComponent],
      };

      service.getValidComponents('W4545-26-051302-1').subscribe((components) => {
        expect(components.length).toBe(1);
        expect(components[0].productCode).toBe('E0701V00');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/units/W4545-26-051302-1/components`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when no components', (done) => {
      const mockResponse: ReturnResult<CryoComponentDto> = {
        success: true,
        statusCode: 200,
        data: [],
      };

      service.getValidComponents('W4545-26-051302-1').subscribe((components) => {
        expect(components).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/units/W4545-26-051302-1/components`);
      req.flush(mockResponse);
    });
  });

  describe('generateWorksheetId', () => {
    it('should generate new worksheet ID', (done) => {
      const newId = '030412-CY1244';
      const mockResponse: ReturnResult<string> = {
        success: true,
        statusCode: 200,
        data: newId,
      };

      service.generateWorksheetId().subscribe((worksheetId) => {
        expect(worksheetId).toBe(newId);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/worksheets/generate`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });
});
