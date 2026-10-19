import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { SeparationTimesOfflineApiService } from './separation-times-offline-api.service';
import {
  ValidateUnitRequestDto,
  ValidateUnitResponseDto,
  RecordFirstSeparationRequestDto,
  RecordSecondSeparationRequestDto,
  SeparationTimesOfflineDto,
  CentrifugeDto,
  ApiResponse,
} from '../models/separation-times-offline.model';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';

describe('SeparationTimesOfflineApiService', () => {
  let service: SeparationTimesOfflineApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${API.SEPARATION_TIMES_OFFLINE.BASE}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SeparationTimesOfflineApiService],
    });

    service = TestBed.inject(SeparationTimesOfflineApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('validateUnit', () => {
    it('should validate unit and return response', () => {
      const mockResponse: ApiResponse<ValidateUnitResponseDto> = {
        success: true,
        statusCode: 200,
        message: 'Unit validated successfully',
        item: {
          unitId: 'W123456789',
          collDate: '2024-06-01T00:00:00Z',
          bleedStartTime: '2024-06-01T08:30:00Z',
          bleedEndTime: '2024-06-01T08:45:00Z',
          firstSepTime: null,
          secondSepTime: null,
          canRecordFirst: true,
          canRecordSecond: false,
          firstSepDuration: null,
          secondSepDuration: null,
        },
      };

      service.validateUnit('W123456789').subscribe((response) => {
        expect(response).toEqual(mockResponse.item!);
        expect(response.unitId).toBe('W123456789');
        expect(response.canRecordFirst).toBeTrue();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.SEPARATION_TIMES_OFFLINE.VALIDATE_UNIT}`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ unitId: 'W123456789' } as ValidateUnitRequestDto);
      req.flush(mockResponse);
    });

    it('should handle unit not found error', () => {
      const errorResponse = {
        success: false,
        statusCode: 400,
        message: 'Unit not found in the system',
        errorCode: '0063',
        error: 'Unit not found in the system',
      };

      service.validateUnit('INVALID').subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.SEPARATION_TIMES_OFFLINE.VALIDATE_UNIT}`
      );
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle pheresis unit error', () => {
      const errorResponse = {
        success: false,
        statusCode: 400,
        message: 'Pheresis units cannot have separation times recorded',
        errorCode: '0095',
        error: 'Pheresis units cannot have separation times recorded',
      };

      service.validateUnit('P987654321').subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.SEPARATION_TIMES_OFFLINE.VALIDATE_UNIT}`
      );
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getCentrifuges', () => {
    it('should retrieve active centrifuges', () => {
      const mockResponse: ApiResponse<CentrifugeDto> = {
        success: true,
        statusCode: 200,
        message: 'Centrifuges retrieved successfully',
        data: [
          { centrifugeId: 'B01', manufacturer: 'Centrifuge 1 - Lab A' },
          { centrifugeId: 'B02', manufacturer: 'Centrifuge 2 - Lab B' },
        ],
        total: 2,
      };

      service.getCentrifuges().subscribe((response) => {
        expect(response.length).toBe(2);
        expect(response[0].centrifugeId).toBe('B01');
        expect(response[1].centrifugeId).toBe('B02');
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.SEPARATION_TIMES_OFFLINE.CENTRIFUGES}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('recordFirstSeparation', () => {
    it('should record first separation successfully', () => {
      const request: RecordFirstSeparationRequestDto = {
        unitId: 'W123456789',
        processDate: '2024-06-01T09:15:00Z',
        centrifugeId: 'B01',
      };

      const mockResponse: ApiResponse<SeparationTimesOfflineDto> = {
        success: true,
        statusCode: 200,
        message: 'First separation recorded successfully',
        item: {
          unitId: 'W123456789',
          collDate: '2024-06-01T00:00:00Z',
          chapterId: 'CHAP01',
          bleedStartTime: '2024-06-01T08:30:00Z',
          bleedEndTime: '2024-06-01T08:45:00Z',
          firstSepTime: '2024-06-01T09:15:00Z',
          firstSepCentrifugeId: 'B01',
          firstSepDuration: '00:45',
          secondSepTime: null,
          secondSepCentrifugeId: null,
          secondSepDuration: null,
          canRecordFirst: false,
          canRecordSecond: true,
        },
      };

      service.recordFirstSeparation(request).subscribe((response) => {
        expect(response).toEqual(mockResponse.item!);
        expect(response.firstSepTime).toBe('2024-06-01T09:15:00Z');
        expect(response.firstSepDuration).toBe('00:45');
        expect(response.canRecordSecond).toBeTrue();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.SEPARATION_TIMES_OFFLINE.RECORD_FIRST}`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle future date error', () => {
      const request: RecordFirstSeparationRequestDto = {
        unitId: 'W123456789',
        processDate: '2099-12-31T23:59:59Z',
        centrifugeId: 'B01',
      };

      const errorResponse = {
        success: false,
        statusCode: 400,
        message: 'Process date cannot be in the future',
        errorCode: '0103',
        error: 'Process date cannot be in the future',
      };

      service.recordFirstSeparation(request).subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.SEPARATION_TIMES_OFFLINE.RECORD_FIRST}`
      );
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle invalid centrifuge error', () => {
      const request: RecordFirstSeparationRequestDto = {
        unitId: 'W123456789',
        processDate: '2024-06-01T09:15:00Z',
        centrifugeId: 'INVALID',
      };

      const errorResponse = {
        success: false,
        statusCode: 400,
        message: 'Invalid centrifuge for first separation',
        errorCode: '3000',
        error: 'Invalid centrifuge for first separation',
      };

      service.recordFirstSeparation(request).subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.SEPARATION_TIMES_OFFLINE.RECORD_FIRST}`
      );
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('recordSecondSeparation', () => {
    it('should record second separation successfully', () => {
      const request: RecordSecondSeparationRequestDto = {
        unitId: 'W123456789',
        processDate: '2024-06-01T11:30:00Z',
        centrifugeId: 'B02',
      };

      const mockResponse: ApiResponse<SeparationTimesOfflineDto> = {
        success: true,
        statusCode: 200,
        message: 'Second separation recorded successfully',
        item: {
          unitId: 'W123456789',
          collDate: '2024-06-01T00:00:00Z',
          chapterId: 'CHAP01',
          bleedStartTime: '2024-06-01T08:30:00Z',
          bleedEndTime: '2024-06-01T08:45:00Z',
          firstSepTime: '2024-06-01T09:15:00Z',
          firstSepCentrifugeId: 'B01',
          firstSepDuration: '00:45',
          secondSepTime: '2024-06-01T11:30:00Z',
          secondSepCentrifugeId: 'B02',
          secondSepDuration: '03:00',
          canRecordFirst: false,
          canRecordSecond: false,
        },
      };

      service.recordSecondSeparation(request).subscribe((response) => {
        expect(response).toEqual(mockResponse.item!);
        expect(response.secondSepTime).toBe('2024-06-01T11:30:00Z');
        expect(response.secondSepDuration).toBe('03:00');
        expect(response.canRecordSecond).toBeFalse();
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.SEPARATION_TIMES_OFFLINE.RECORD_SECOND}`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle invalid centrifuge error for second separation', () => {
      const request: RecordSecondSeparationRequestDto = {
        unitId: 'W123456789',
        processDate: '2024-06-01T11:30:00Z',
        centrifugeId: 'INVALID',
      };

      const errorResponse = {
        success: false,
        statusCode: 400,
        message: 'Invalid centrifuge for second separation',
        errorCode: '3001',
        error: 'Invalid centrifuge for second separation',
      };

      service.recordSecondSeparation(request).subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.SEPARATION_TIMES_OFFLINE.RECORD_SECOND}`
      );
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getSeparationDetails', () => {
    it('should retrieve separation details for a unit', () => {
      const unitId = 'W123456789';
      const mockResponse: ApiResponse<SeparationTimesOfflineDto> = {
        success: true,
        statusCode: 200,
        message: 'Separation details retrieved successfully',
        item: {
          unitId: 'W123456789',
          collDate: '2024-06-01T00:00:00Z',
          chapterId: 'CHAP01',
          bleedStartTime: '2024-06-01T08:30:00Z',
          bleedEndTime: '2024-06-01T08:45:00Z',
          firstSepTime: '2024-06-01T09:15:00Z',
          firstSepCentrifugeId: 'B01',
          firstSepDuration: '00:45',
          secondSepTime: '2024-06-01T11:30:00Z',
          secondSepCentrifugeId: 'B02',
          secondSepDuration: '03:00',
          canRecordFirst: false,
          canRecordSecond: false,
        },
      };

      service.getSeparationDetails(unitId).subscribe((response) => {
        expect(response).toEqual(mockResponse.item!);
        expect(response.unitId).toBe('W123456789');
      });

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(unitId)}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle unit not found error', () => {
      const unitId = 'NOTFOUND';
      const errorResponse = {
        success: false,
        statusCode: 404,
        message: 'Unit not found',
      };

      service.getSeparationDetails(unitId).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(unitId)}`);
      req.flush(errorResponse, { status: 404, statusText: 'Not Found' });
    });
  });
});
