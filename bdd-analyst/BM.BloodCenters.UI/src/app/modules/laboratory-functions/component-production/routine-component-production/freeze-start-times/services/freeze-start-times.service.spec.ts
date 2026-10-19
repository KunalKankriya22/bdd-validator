import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { FreezeStartTimesService } from './freeze-start-times.service';
import {
  RecordFreezeStartTimeDto,
  FreezeStartTimeResponseDto,
  EligibleComponentDto,
  UnitBleedInfoDto,
  ApiResponse
} from '../models/freeze-start-times.model';
import { environment } from '../../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';

describe('FreezeStartTimesService', () => {
  let service: FreezeStartTimesService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}${API.FREEZE_START_TIMES.BASE}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FreezeStartTimesService]
    });

    service = TestBed.inject(FreezeStartTimesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('recordFreezeStartTime', () => {
    it('should send POST request to correct endpoint', () => {
      const request: RecordFreezeStartTimeDto = {
        unitId: 'W1234-18-031302-Z',
        productCode: 'E0385V00',
        aliquot: '01',
        freezeStartTime: '2025-01-11T13:16:00Z'
      };

      const mockResponse: ApiResponse<FreezeStartTimeResponseDto> = {
        success: true,
        statusCode: 200,
        message: 'Freeze start time recorded successfully',
        data: [
          {
            success: true,
            message: 'Freeze start time recorded successfully',
            cmtiInterdictionGenerated: false,
            interdictionMessage: null
          }
        ],
        total: 1
      };

      service.recordFreezeStartTime(request).subscribe(response => {
        expect(response).toEqual(mockResponse.data[0]);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should return response data from array', (done) => {
      const request: RecordFreezeStartTimeDto = {
        unitId: 'TEST001',
        productCode: 'FFP01',
        aliquot: '01',
        freezeStartTime: '2024-05-12T14:30:00Z'
      };

      const mockData: FreezeStartTimeResponseDto = {
        success: true,
        message: 'Freeze start time recorded successfully',
        cmtiInterdictionGenerated: false,
        interdictionMessage: null
      };

      const mockResponse: ApiResponse<FreezeStartTimeResponseDto> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockData]
      };

      service.recordFreezeStartTime(request).subscribe(response => {
        expect(response).toEqual(mockData);
        done();
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(mockResponse);
    });

    it('should handle CMTI interdiction warning', (done) => {
      const request: RecordFreezeStartTimeDto = {
        unitId: 'TEST001',
        productCode: 'FFP01',
        aliquot: '01',
        freezeStartTime: '2024-05-12T18:00:00Z'
      };

      const mockData: FreezeStartTimeResponseDto = {
        success: true,
        message: 'Freeze start time recorded successfully',
        cmtiInterdictionGenerated: true,
        interdictionMessage: 'Component has CMTI interdiction - time limit exceeded'
      };

      const mockResponse: ApiResponse<FreezeStartTimeResponseDto> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockData]
      };

      service.recordFreezeStartTime(request).subscribe(response => {
        expect(response.cmtiInterdictionGenerated).toBeTrue();
        expect(response.interdictionMessage).toContain('CMTI interdiction');
        done();
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(mockResponse);
    });

    it('should throw error when response has no data', (done) => {
      const request: RecordFreezeStartTimeDto = {
        unitId: 'TEST001',
        productCode: 'FFP01',
        aliquot: '01',
        freezeStartTime: '2024-05-12T14:30:00Z'
      };

      const mockResponse: ApiResponse<FreezeStartTimeResponseDto> = {
        success: false,
        statusCode: 400,
        message: 'Freeze details already entered for this component',
        data: []
      };

      service.recordFreezeStartTime(request).subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('Freeze details already entered');
          done();
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(mockResponse);
    });

  });

  describe('getEligibleComponents', () => {
    const unitId = 'W1234-18-031302-Z';
    const expectedUrl = `${environment.apiUrl}${API.FREEZE_START_TIMES.ELIGIBLE_COMPONENTS(unitId)}`;

    it('should send GET request to correct endpoint', () => {
      const mockComponents: EligibleComponentDto[] = [
        {
          productCode: 'FFP01',
          productDescription: 'Fresh Frozen Plasma',
          aliquot: '01'
        },
        {
          productCode: 'CRYO01',
          productDescription: 'Cryoprecipitate',
          aliquot: '01'
        }
      ];

      const mockResponse: ApiResponse<EligibleComponentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Eligible components retrieved successfully',
        data: [mockComponents],
        total: 1
      };

      service.getEligibleComponents(unitId).subscribe(components => {
        expect(components).toEqual(mockComponents);
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


    it('should handle array of arrays response structure', (done) => {
      const mockComponents: EligibleComponentDto[] = [
        { productCode: 'FFP01', productDescription: 'Fresh Frozen Plasma', aliquot: '01' }
      ];

      const mockResponse: ApiResponse<EligibleComponentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockComponents]
      };

      service.getEligibleComponents(unitId).subscribe(components => {
        expect(components).toEqual(mockComponents);
        expect(components.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush(mockResponse);
    });

    it('should return empty array when data is empty', (done) => {
      const mockResponse: ApiResponse<EligibleComponentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: []
      };

      service.getEligibleComponents(unitId).subscribe(components => {
        expect(components).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush(mockResponse);
    });


    it('should encode unit ID in URL', () => {
      const encodedUnitId = 'W1234/18-031302-Z';
      const expectedEncodedUrl = `${environment.apiUrl}${API.FREEZE_START_TIMES.ELIGIBLE_COMPONENTS(encodedUnitId)}`;

      service.getEligibleComponents(encodedUnitId).subscribe();

      const req = httpMock.expectOne(expectedEncodedUrl);
      expect(req.request.urlWithParams).toContain(encodeURIComponent(encodedUnitId));
      req.flush({ success: true, statusCode: 200, message: 'Success', data: [[]] });
    });
  });

  describe('getUnitBleedInfo', () => {
    const unitId = 'W1234-18-031302-Z';
    const expectedUrl = `${environment.apiUrl}${API.FREEZE_START_TIMES.UNIT_INFO(unitId)}`;

    it('should send GET request to correct endpoint', () => {
      const mockUnitInfo: UnitBleedInfoDto = {
        unitId: 'W1234-18-031302-Z',
        collDate: '2024-05-12T00:00:00Z',
        bleedStartTime: '2024-05-12T10:00:00Z',
        bleedEndTime: '2024-05-12T10:15:00Z'
      };

      const mockResponse: ApiResponse<UnitBleedInfoDto> = {
        success: true,
        statusCode: 200,
        message: 'Unit bleed information retrieved successfully',
        data: [mockUnitInfo],
        total: 1
      };

      service.getUnitBleedInfo(unitId).subscribe(info => {
        expect(info).toEqual(mockUnitInfo);
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return first item from data array', (done) => {
      const mockUnitInfo: UnitBleedInfoDto = {
        unitId: 'TEST001',
        collDate: '2024-05-12T00:00:00Z',
        bleedStartTime: '2024-05-12T10:00:00Z',
        bleedEndTime: '2024-05-12T10:15:00Z'
      };

      const mockResponse: ApiResponse<UnitBleedInfoDto> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockUnitInfo]
      };

      service.getUnitBleedInfo(unitId).subscribe(info => {
        expect(info).toEqual(mockUnitInfo);
        expect(info.unitId).toBe('TEST001');
        done();
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush(mockResponse);
    });

    it('should handle null bleed times', (done) => {
      const mockUnitInfo: UnitBleedInfoDto = {
        unitId: 'TEST001',
        collDate: '2024-05-12T00:00:00Z',
        bleedStartTime: null,
        bleedEndTime: null
      };

      const mockResponse: ApiResponse<UnitBleedInfoDto> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockUnitInfo]
      };

      service.getUnitBleedInfo(unitId).subscribe(info => {
        expect(info.bleedStartTime).toBeNull();
        expect(info.bleedEndTime).toBeNull();
        done();
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush(mockResponse);
    });

    it('should throw error when unit not found', (done) => {
      const mockResponse: ApiResponse<UnitBleedInfoDto> = {
        success: false,
        statusCode: 404,
        message: 'Unit not found',
        data: []
      };

      service.getUnitBleedInfo('NOTFOUND').subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('Unit not found');
          done();
        }
      });

      const notFoundUrl = `${environment.apiUrl}${API.FREEZE_START_TIMES.UNIT_INFO('NOTFOUND')}`;
      const req = httpMock.expectOne(notFoundUrl);
      req.flush(mockResponse);
    });


    it('should encode unit ID in URL', () => {
      const encodedUnitId = 'W1234/18-031302-Z';
      const expectedEncodedUrl = `${environment.apiUrl}${API.FREEZE_START_TIMES.UNIT_INFO(encodedUnitId)}`;

      service.getUnitBleedInfo(encodedUnitId).subscribe();

      const req = httpMock.expectOne(expectedEncodedUrl);
      expect(req.request.urlWithParams).toContain(encodeURIComponent(encodedUnitId));
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [{ unitId: encodedUnitId, collDate: '2024-05-12T00:00:00Z', bleedStartTime: null, bleedEndTime: null }]
      });
    });
  });
});
