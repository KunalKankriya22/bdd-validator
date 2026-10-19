import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ModifyComponentWeightApiService } from './modify-component-weight-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ComponentWeightUnitDetailsResponse,
  ProductOption,
  UpdateComponentWeightRequestDto,
  UpdateComponentWeightResponseDto,
} from '../models/modify-component-weight.model';

describe('ModifyComponentWeightApiService', () => {
  let service: ModifyComponentWeightApiService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'put']);

    TestBed.configureTestingModule({
      providers: [ModifyComponentWeightApiService, { provide: ApiService, useValue: apiServiceSpy }],
    });

    service = TestBed.inject(ModifyComponentWeightApiService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getUnitDetails', () => {
    it('should retrieve unit details successfully', (done) => {
      const mockResponse: ComponentWeightUnitDetailsResponse = {
        unitId: 'W1234-18-031311-Z',
        collDate: '2024-01-15',
        chapterId: '0001',
        contractId: 'STANDARD',
        isPheresisDonation: false,
        codeScheme: 'I',
        components: [
          {
            unitId: 'W1234-18-031311-Z',
            productCode: 'E0701V00',
            productDesc: 'Fresh Frozen Plasma/CPD',
            componentPrefix: '00',
            collectionDate: '2024-01-15',
            weight: 250,
            volume: 250,
            anticoagulantVolume: 250,
            specificGravity: 1.08,
            productType: 'PLT',
          },
        ],
      };

      apiService.get.and.returnValue(of({ success: true, data: [mockResponse] }));

      service.getUnitDetails('W1234-18-031311-Z', '0001').subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiService.get).toHaveBeenCalledWith(
            API.MODIFY_COMPONENT_WEIGHT.GET_UNIT_DETAILS('W1234-18-031311-Z', '0001')
          );
          done();
        },
      });
    });

    it('should throw error when unit not found', (done) => {
      apiService.get.and.returnValue(of({ success: false, message: 'Unit not found', data: [] }));

      service.getUnitDetails('INVALID', '0001').subscribe({
        error: (error) => {
          expect(error.message).toBe('Unit not found');
          done();
        },
      });
    });


    it('should throw error when data is null', (done) => {
      apiService.get.and.returnValue(of({ success: true, message: 'No data', data: null }));

      service.getUnitDetails('W1234-18-031311-Z', '0001').subscribe({
        error: (error) => {
          expect(error.message).toBe('No data');
          done();
        },
      });
    });

    it('should throw error when data array is empty', (done) => {
      apiService.get.and.returnValue(of({ success: true, message: 'Empty data', data: [] }));

      service.getUnitDetails('W1234-18-031311-Z', '0001').subscribe({
        error: (error) => {
          expect(error.message).toBe('Empty data');
          done();
        },
      });
    });

    it('should use default error message when message is not provided', (done) => {
      apiService.get.and.returnValue(of({ success: false, data: null }));

      service.getUnitDetails('W1234-18-031311-Z', '0001').subscribe({
        error: (error) => {
          expect(error.message).toBe('Unit not found');
          done();
        },
      });
    });
  });

  describe('getValidProducts', () => {
    it('should retrieve valid products successfully', (done) => {
      const mockProducts: ProductOption[] = [
        {
          productCode: 'E0701V00',
          productDesc: 'Fresh Frozen Plasma/CPD',
          productType: 'PLT',
          specificGravity: 1.08,
          poolProductCode: 'N',
        },
      ];

      apiService.get.and.returnValue(of({ success: true, data: [mockProducts] }));

      service.getValidProducts('W1234-18-031311-Z', '2024-01-15', '0001', 'I').subscribe({
        next: (result) => {
          expect(result).toEqual(mockProducts);
          expect(apiService.get).toHaveBeenCalledWith(
            API.MODIFY_COMPONENT_WEIGHT.GET_VALID_PRODUCTS('W1234-18-031311-Z', '2024-01-15', '0001', 'I')
          );
          done();
        },
      });
    });

    it('should return empty array when no products found', (done) => {
      apiService.get.and.returnValue(of({ success: false, data: null }));

      service.getValidProducts('W1234-18-031311-Z', '2024-01-15', '0001').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should use default codeScheme when not provided', (done) => {
      apiService.get.and.returnValue(of({ success: true, data: [[]] }));

      service.getValidProducts('W1234-18-031311-Z', '2024-01-15', '0001').subscribe({
        next: () => {
          expect(apiService.get).toHaveBeenCalledWith(
            API.MODIFY_COMPONENT_WEIGHT.GET_VALID_PRODUCTS('W1234-18-031311-Z', '2024-01-15', '0001', 'I')
          );
          done();
        },
      });
    });

    it('should handle direct array response format', (done) => {
      const mockProducts: ProductOption[] = [
        {
          productCode: 'E0701V00',
          productDesc: 'Fresh Frozen Plasma/CPD',
          productType: 'PLT',
          specificGravity: 1.08,
          poolProductCode: 'N',
        },
      ];

      apiService.get.and.returnValue(of(mockProducts));

      service.getValidProducts('W1234-18-031311-Z', '2024-01-15', '0001', 'I').subscribe({
        next: (result) => {
          expect(result).toEqual(mockProducts);
          done();
        },
      });
    });

    it('should handle nested data array format', (done) => {
      const mockProducts: ProductOption[] = [
        {
          productCode: 'E0701V00',
          productDesc: 'Fresh Frozen Plasma/CPD',
          productType: 'PLT',
          specificGravity: 1.08,
          poolProductCode: 'N',
        },
      ];

      apiService.get.and.returnValue(of({ data: [mockProducts] }));

      service.getValidProducts('W1234-18-031311-Z', '2024-01-15', '0001', 'I').subscribe({
        next: (result) => {
          expect(result).toEqual(mockProducts);
          done();
        },
      });
    });

    it('should handle flat data array format', (done) => {
      const mockProducts: ProductOption[] = [
        {
          productCode: 'E0701V00',
          productDesc: 'Fresh Frozen Plasma/CPD',
          productType: 'PLT',
          specificGravity: 1.08,
          poolProductCode: 'N',
        },
      ];

      apiService.get.and.returnValue(of({ data: mockProducts }));

      service.getValidProducts('W1234-18-031311-Z', '2024-01-15', '0001', 'I').subscribe({
        next: (result) => {
          expect(result).toEqual(mockProducts);
          done();
        },
      });
    });

    it('should handle success flag with single object in data', (done) => {
      const mockProduct: ProductOption = {
        productCode: 'E0701V00',
        productDesc: 'Fresh Frozen Plasma/CPD',
        productType: 'PLT',
        specificGravity: 1.08,
        poolProductCode: 'N',
      };

      apiService.get.and.returnValue(of({ success: true, data: mockProduct }));

      service.getValidProducts('W1234-18-031311-Z', '2024-01-15', '0001', 'I').subscribe({
        next: (result) => {
          expect(result).toEqual([mockProduct]);
          done();
        },
      });
    });

    it('should return empty array for unexpected response format', (done) => {
      apiService.get.and.returnValue(of({ unexpectedFormat: true }));

      service.getValidProducts('W1234-18-031311-Z', '2024-01-15', '0001', 'I').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should use codeScheme C when provided', (done) => {
      apiService.get.and.returnValue(of([]));

      service.getValidProducts('W1234-18-031311-Z', '2024-01-15', '0001', 'C').subscribe({
        next: () => {
          expect(apiService.get).toHaveBeenCalledWith(
            API.MODIFY_COMPONENT_WEIGHT.GET_VALID_PRODUCTS('W1234-18-031311-Z', '2024-01-15', '0001', 'C')
          );
          done();
        },
      });
    });

    it('should handle empty nested array response', (done) => {
      apiService.get.and.returnValue(of({ data: [[]] }));

      service.getValidProducts('W1234-18-031311-Z', '2024-01-15', '0001').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });
  });

  describe('updateComponentWeight', () => {
    it('should update component weight successfully', (done) => {
      const request: UpdateComponentWeightRequestDto = {
        unitId: 'W1234-18-031311-Z',
        collDate: '2024-01-15',
        chapterId: '0001',
        productCode: 'E0701V00',
        componentPrefix: '00',
        componentWeight: 252.75,
        anticoagulantVolume: 63,
      };

      const mockResponse: UpdateComponentWeightResponseDto = {
        success: true,
        message: 'Component weight updated successfully',
        calculatedVolume: 234.03,
        interdictionApplied: false,
      };

      apiService.put.and.returnValue(of({ success: true, data: [mockResponse] }));

      service.updateComponentWeight(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiService.put).toHaveBeenCalledWith(API.MODIFY_COMPONENT_WEIGHT.UPDATE, request);
          done();
        },
      });
    });

    it('should throw error when update fails', (done) => {
      const request: UpdateComponentWeightRequestDto = {
        unitId: 'W1234-18-031311-Z',
        collDate: '2024-01-15',
        chapterId: '0001',
        productCode: 'E0701V00',
        componentPrefix: '00',
        componentWeight: 0,
      };

      apiService.put.and.returnValue(of({ success: false, message: 'Weight must be greater than zero' }));

      service.updateComponentWeight(request).subscribe({
        error: (error) => {
          expect(error.message).toBe('Weight must be greater than zero');
          done();
        },
      });
    });

    it('should handle API errors during update', (done) => {
      const request: UpdateComponentWeightRequestDto = {
        unitId: 'W1234-18-031311-Z',
        collDate: '2024-01-15',
        chapterId: '0001',
        productCode: 'E0701V00',
        componentPrefix: '00',
        componentWeight: 252.75,
      };

      const errorResponse = { error: { message: 'Server error' } };
      apiService.put.and.returnValue(throwError(() => errorResponse));

      service.updateComponentWeight(request).subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        },
      });
    });

    it('should include optional anticoagulant volume in request', (done) => {
      const request: UpdateComponentWeightRequestDto = {
        unitId: 'W1234-18-031311-Z',
        collDate: '2024-01-15',
        chapterId: '0001',
        productCode: 'E0701V00',
        componentPrefix: '00',
        componentWeight: 252.75,
        anticoagulantVolume: 63,
      };

      const mockResponse: UpdateComponentWeightResponseDto = {
        success: true,
        message: 'Success',
        calculatedVolume: 234.03,
        interdictionApplied: false,
      };

      apiService.put.and.returnValue(of({ success: true, data: [mockResponse] }));

      service.updateComponentWeight(request).subscribe({
        next: () => {
          const callArgs = apiService.put.calls.mostRecent().args;
          expect(callArgs[1]).toEqual(request);
          expect(callArgs[1].anticoagulantVolume).toBe(63);
          done();
        },
      });
    });

    it('should use default error message when update fails without message', (done) => {
      const request: UpdateComponentWeightRequestDto = {
        unitId: 'W1234-18-031311-Z',
        collDate: '2024-01-15',
        chapterId: '0001',
        productCode: 'E0701V00',
        componentPrefix: '00',
        componentWeight: 252.75,
      };

      apiService.put.and.returnValue(of({ success: false }));

      service.updateComponentWeight(request).subscribe({
        error: (error) => {
          expect(error.message).toBe('Update failed');
          done();
        },
      });
    });

    it('should handle response without data array', (done) => {
      const request: UpdateComponentWeightRequestDto = {
        unitId: 'W1234-18-031311-Z',
        collDate: '2024-01-15',
        chapterId: '0001',
        productCode: 'E0701V00',
        componentPrefix: '00',
        componentWeight: 252.75,
      };

      apiService.put.and.returnValue(of({ success: true, message: 'Updated' }));

      service.updateComponentWeight(request).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(result.message).toBe('Updated');
          expect(result.interdictionApplied).toBe(false);
          done();
        },
      });
    });

    it('should handle response with empty data array', (done) => {
      const request: UpdateComponentWeightRequestDto = {
        unitId: 'W1234-18-031311-Z',
        collDate: '2024-01-15',
        chapterId: '0001',
        productCode: 'E0701V00',
        componentPrefix: '00',
        componentWeight: 252.75,
      };

      apiService.put.and.returnValue(of({ success: true, message: 'Success', data: [] }));

      service.updateComponentWeight(request).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(result.message).toBe('Success');
          expect(result.interdictionApplied).toBe(false);
          done();
        },
      });
    });

    it('should handle update with interdiction applied', (done) => {
      const request: UpdateComponentWeightRequestDto = {
        unitId: 'W1234-18-031311-Z',
        collDate: '2024-01-15',
        chapterId: '0001',
        productCode: 'E0701V00',
        componentPrefix: '00',
        componentWeight: 252.75,
      };

      const mockResponse: UpdateComponentWeightResponseDto = {
        success: true,
        message: 'Updated with interdiction',
        calculatedVolume: 234.03,
        interdictionApplied: true,
      };

      apiService.put.and.returnValue(of({ success: true, data: [mockResponse] }));

      service.updateComponentWeight(request).subscribe({
        next: (result) => {
          expect(result.interdictionApplied).toBe(true);
          done();
        },
      });
    });


    it('should handle response with empty message', (done) => {
      const request: UpdateComponentWeightRequestDto = {
        unitId: 'W1234-18-031311-Z',
        collDate: '2024-01-15',
        chapterId: '0001',
        productCode: 'E0701V00',
        componentPrefix: '00',
        componentWeight: 252.75,
      };

      apiService.put.and.returnValue(of({ success: true, message: '', data: [] }));

      service.updateComponentWeight(request).subscribe({
        next: (result) => {
          expect(result.message).toBe('');
          done();
        },
      });
    });
  });
});
