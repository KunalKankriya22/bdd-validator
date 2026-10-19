import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { ModifyFreezeStartTimeApiService } from './modify-freeze-start-time-api.service';
import {
  ValidateUnitDto,
  ProductForUnitDto,
  AliquotDto,
  ComponentFreezeDetailsDto,
  UpdateFreezeStartTimeRequestDto,
  UpdateFreezeStartTimeResponseDto,
} from '../models/modify-freeze-start-time.model';

describe('ModifyFreezeStartTimeApiService', () => {
  let service: ModifyFreezeStartTimeApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'put']);

    TestBed.configureTestingModule({
      providers: [
        ModifyFreezeStartTimeApiService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(ModifyFreezeStartTimeApiService);
  });

  describe('validateUnit', () => {
    const mockResponse: ValidateUnitDto = {
      unitId: 'W1234567890123',
      collDate: '2025-06-15T00:00:00',
      chapterId: 'BOS',
      codeScheme: 'I',
    };

    it('should call API with correct URL', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, item: mockResponse }));
      const expectedUrl = API.MODIFY_FREEZE_START_TIME.VALIDATE_UNIT('W1234567890123');

      service.validateUnit('W1234567890123').subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledWith(expectedUrl);
    });

    it('should return unit data on success', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, item: mockResponse }));

      service.validateUnit('W1234567890123').subscribe((result) => {
        expect(result).toEqual(mockResponse);
        done();
      });
    });

    it('should throw error when success is false', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: false, item: null }));

      service.validateUnit('W1234567890123').subscribe({
        error: (err) => {
          expect(err.message).toBe('Unit not found');
          done();
        },
      });
    });

    it('should throw error when item is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, item: null }));

      service.validateUnit('W1234567890123').subscribe({
        error: (err) => {
          expect(err.message).toBe('Unit not found');
          done();
        },
      });
    });

    it('should propagate API errors', (done) => {
      const apiError = { status: 500, message: 'Server error' };
      apiServiceSpy.get.and.returnValue(throwError(() => apiError));

      service.validateUnit('W1234567890123').subscribe({
        error: (err) => {
          expect(err).toEqual(apiError);
          done();
        },
      });
    });
  });

  describe('getProducts', () => {
    const mockProducts: ProductForUnitDto[] = [
      { productCode: 'RBC', productDescription: 'Red Blood Cells' },
      { productCode: 'FFP', productDescription: 'Fresh Frozen Plasma' },
    ];

    it('should call API with correct URL', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, item: mockProducts }));
      const expectedUrl = API.MODIFY_FREEZE_START_TIME.GET_PRODUCTS('UNIT1', '2025-06-15', 'I');

      service.getProducts('UNIT1', '2025-06-15', 'I').subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledWith(expectedUrl);
    });

    it('should return products array on success', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, item: mockProducts }));

      service.getProducts('UNIT1', '2025-06-15', 'I').subscribe((result) => {
        expect(result).toEqual(mockProducts);
        expect(result.length).toBe(2);
        done();
      });
    });

    it('should return empty array when item is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, item: null }));

      service.getProducts('UNIT1', '2025-06-15', 'I').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should throw error on API failure', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getProducts('UNIT1', '2025-06-15', 'I').subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to load products');
          done();
        },
      });
    });
  });

  describe('getAliquots', () => {
    const mockAliquots: AliquotDto[] = [{ aliquot: '00' }, { aliquot: '01' }];

    it('should call API with correct URL', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, item: mockAliquots }));
      const expectedUrl = API.MODIFY_FREEZE_START_TIME.GET_ALIQUOTS('UNIT1', 'FFP', '2025-06-15');

      service.getAliquots('UNIT1', 'FFP', '2025-06-15').subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledWith(expectedUrl);
    });

    it('should return aliquots array on success', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, item: mockAliquots }));

      service.getAliquots('UNIT1', 'FFP', '2025-06-15').subscribe((result) => {
        expect(result).toEqual(mockAliquots);
        expect(result.length).toBe(2);
        done();
      });
    });

    it('should return empty array when item is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, item: null }));

      service.getAliquots('UNIT1', 'FFP', '2025-06-15').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should throw error on API failure', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getAliquots('UNIT1', 'FFP', '2025-06-15').subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to load aliquots');
          done();
        },
      });
    });
  });

  describe('getComponentDetails', () => {
    const mockDetails: ComponentFreezeDetailsDto = {
      unitId: 'UNIT1',
      productCode: 'FFP',
      productDescription: 'Fresh Frozen Plasma',
      aliquot: '00',
      collDate: '2025-06-15',
      freezeStartTime: '2025-06-15T14:30:00',
      bleedStartTime: '2025-06-15T10:00:00',
      bleedEndTime: '2025-06-15T10:15:00',
      chapterId: 'BOS',
      parmValue: null,
    };

    it('should call API with correct URL', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, item: mockDetails }));
      const expectedUrl = API.MODIFY_FREEZE_START_TIME.GET_COMPONENT_DETAILS('UNIT1', 'FFP', '00', '2025-06-15');

      service.getComponentDetails('UNIT1', 'FFP', '00', '2025-06-15').subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledWith(expectedUrl);
    });

    it('should return component details on success', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, item: mockDetails }));

      service.getComponentDetails('UNIT1', 'FFP', '00', '2025-06-15').subscribe((result) => {
        expect(result).toEqual(mockDetails);
        expect(result.freezeStartTime).toBe('2025-06-15T14:30:00');
        done();
      });
    });

    it('should throw error when success is false', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: false, item: null }));

      service.getComponentDetails('UNIT1', 'FFP', '00', '2025-06-15').subscribe({
        error: (err) => {
          expect(err.message).toBe('Component details not found');
          done();
        },
      });
    });

    it('should propagate API errors', (done) => {
      const apiError = { status: 404, message: 'Not found' };
      apiServiceSpy.get.and.returnValue(throwError(() => apiError));

      service.getComponentDetails('UNIT1', 'FFP', '00', '2025-06-15').subscribe({
        error: (err) => {
          expect(err).toEqual(apiError);
          done();
        },
      });
    });
  });

  describe('updateFreezeStartTime', () => {
    const mockRequest: UpdateFreezeStartTimeRequestDto = {
      unitId: 'UNIT1',
      productCode: 'FFP',
      aliquot: '00',
      collDate: '2025-06-15',
      freezeStartTime: '2025-06-15T14:30:00',
    };

    const mockResponse: UpdateFreezeStartTimeResponseDto = {
      unitId: 'UNIT1',
      productCode: 'FFP',
      aliquot: '00',
      collDate: '2025-06-15',
      productDescription: 'Fresh Frozen Plasma',
      freezeStartTime: '2025-06-15T14:30:00',
      cmtiGenerated: false,
      warning: null,
    };

    it('should call API with correct URL and body', () => {
      apiServiceSpy.put.and.returnValue(of({ success: true, data: [mockResponse] }));

      service.updateFreezeStartTime(mockRequest).subscribe();

      expect(apiServiceSpy.put).toHaveBeenCalledWith(API.MODIFY_FREEZE_START_TIME.UPDATE, mockRequest);
    });

    it('should return first item from data array on success', (done) => {
      apiServiceSpy.put.and.returnValue(of({ success: true, data: [mockResponse] }));

      service.updateFreezeStartTime(mockRequest).subscribe((result) => {
        expect(result).toEqual(mockResponse);
        done();
      });
    });

    it('should throw error when success is false', (done) => {
      apiServiceSpy.put.and.returnValue(of({ success: false, data: [] }));

      service.updateFreezeStartTime(mockRequest).subscribe({
        error: (err) => {
          expect(err.message).toBe('Update failed');
          done();
        },
      });
    });

    it('should throw error when data is empty', (done) => {
      apiServiceSpy.put.and.returnValue(of({ success: true, data: [] }));

      service.updateFreezeStartTime(mockRequest).subscribe({
        error: (err) => {
          expect(err.message).toBe('Update failed');
          done();
        },
      });
    });

    it('should throw error when data is null', (done) => {
      apiServiceSpy.put.and.returnValue(of({ success: true, data: null }));

      service.updateFreezeStartTime(mockRequest).subscribe({
        error: (err) => {
          expect(err.message).toBe('Update failed');
          done();
        },
      });
    });

    it('should propagate API errors', (done) => {
      const apiError = { status: 500, message: 'Internal server error' };
      apiServiceSpy.put.and.returnValue(throwError(() => apiError));

      service.updateFreezeStartTime(mockRequest).subscribe({
        error: (err) => {
          expect(err).toEqual(apiError);
          done();
        },
      });
    });
  });
});
