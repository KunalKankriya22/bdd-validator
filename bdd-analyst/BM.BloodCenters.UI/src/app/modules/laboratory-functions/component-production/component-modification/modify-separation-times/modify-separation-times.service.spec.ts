import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ModifySeparationTimesService } from './modify-separation-times.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  UnitValidationResult,
  CollectionDateOption,
  SeparationTimesData,
  CentrifugeOption,
  UpdateSeparationTimesPayload,
} from './modify-separation-times.model';

describe('ModifySeparationTimesService', () => {
  let service: ModifySeparationTimesService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [ModifySeparationTimesService, { provide: ApiService, useValue: spy }],
    });

    service = TestBed.inject(ModifySeparationTimesService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('validateUnit', () => {
    it('should return validation result for valid unit', (done) => {
      const mockResult: UnitValidationResult = {
        isValid: true,
        message: null,
        errorCode: null,
        errorResponse: null,
        maxCollDate: '2026-05-20T00:00:00',
      };
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, message: '', data: mockResult }));

      service.validateUnit('W123456').subscribe({
        next: (result) => {
          expect(result).toEqual(mockResult);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.SEPARATION_TIMES.VALIDATE_UNIT,
            jasmine.objectContaining({ params: jasmine.anything() }),
          );
          done();
        },
      });
    });

    it('should return validation result for invalid unit', (done) => {
      const mockResult: UnitValidationResult = {
        isValid: false,
        message: 'Unit not found or has been QC labeled.',
        errorCode: '0210',
        errorResponse: { errorCode: '0210', error: 'Unit not found or has been QC labeled.' },
        maxCollDate: null,
      };
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, message: '', data: mockResult }));

      service.validateUnit('INVALID').subscribe({
        next: (result) => {
          expect(result.isValid).toBeFalse();
          expect(result.message).toBeTruthy();
          done();
        },
      });
    });

  });
  describe('getSeparationTimes', () => {
    it('should fetch separation times successfully', (done) => {
      const mockData: SeparationTimesData = {
        unitId: 'W123456',
        collDate: '2026-05-20T00:00:00',
        chapterId: '001',
        firstSepTime: '2026-05-20T14:30:00',
        firstSepCentrifugeId: 'C01',
        firstSepUserId: 'JSMITH',
        firstSepEntryMode: 'M',
        secondSepTime: '2026-05-20T15:45:00',
        secondSepCentrifugeId: 'C02',
        secondSepUserId: 'JDOE',
        secondSepEntryMode: 'M',
        bleedStartTime: '2026-05-20T10:00:00',
        bleedEndTime: '2026-05-20T10:15:00',
      };

      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, message: '', data: mockData }));

      service.getSeparationTimes('W123456', '2026-05-20T00:00:00').subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.SEPARATION_TIMES.GET,
            jasmine.objectContaining({ params: jasmine.anything() }),
          );
          done();
        },
      });
    });

  });

  describe('updateSeparationTimes', () => {
    it('should update separation times successfully', (done) => {
      const payload: UpdateSeparationTimesPayload = {
        firstSepTime: '2026-05-20T14:30:00',
        firstSepCentrifugeId: 'C01',
        firstSepEntryMode: 'M',
        secondSepTime: '2026-05-20T15:45:00',
        secondSepCentrifugeId: 'C02',
        secondSepEntryMode: 'M',
      };

      const mockResponse: SeparationTimesData = {
        unitId: 'W123456',
        collDate: '2026-05-20T00:00:00',
        chapterId: '001',
        firstSepTime: '2026-05-20T14:30:00',
        firstSepCentrifugeId: 'C01',
        firstSepUserId: 'JSMITH',
        firstSepEntryMode: 'M',
        secondSepTime: '2026-05-20T15:45:00',
        secondSepCentrifugeId: 'C02',
        secondSepUserId: 'JDOE',
        secondSepEntryMode: 'M',
        bleedStartTime: '2026-05-20T10:00:00',
        bleedEndTime: '2026-05-20T10:15:00',
      };

      apiServiceSpy.put.and.returnValue(of({ success: true, statusCode: 200, message: '', data: mockResponse }));

      service.updateSeparationTimes('W123456', '2026-05-20T00:00:00', payload).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiServiceSpy.put).toHaveBeenCalledWith(
            API.SEPARATION_TIMES.SAVE,
            payload,
            jasmine.objectContaining({ params: jasmine.anything() }),
          );
          done();
        },
      });
    });

  });

  describe('getCentrifuges', () => {
    it('should fetch centrifuge options successfully', (done) => {
      const mockData: CentrifugeOption[] = [
        { equipId: 'C01', serialNumber: 'SN-12345' },
        { equipId: 'C02', serialNumber: 'SN-67890' },
        { equipId: 'C03', serialNumber: 'SN-11111' },
      ];

      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, message: '', data: mockData }));

      service.getCentrifuges().subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          expect(result.length).toBe(3);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.SEPARATION_TIMES.CENTRIFUGES);
          done();
        },
      });
    });


  });
});
