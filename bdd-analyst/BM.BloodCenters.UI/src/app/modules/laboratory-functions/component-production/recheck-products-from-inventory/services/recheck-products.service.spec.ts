import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RecheckProductsService } from './recheck-products.service';
import { ApiService } from '@shared/services/api.service';
import {
  ValidateUnitRequest,
  ValidateUnitResponse,
  AvailableComponent,
  ValidateComponentRequest,
  ValidateComponentResponse,
  RecheckProcessRequest,
  RecheckResultResponse,
  ApiResponse,
} from '../models/recheck-products.model';

describe('RecheckProductsService', () => {
  let service: RecheckProductsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockValidateUnitResponse: ValidateUnitResponse = {
    unitId: 'W123417031601',
    collectionDate: '2023-05-20T00:00:00',
    isEligible: true,
    availableComponents: [
      { productCode: 'E0701V00', productDescription: 'Fresh Frozen Plasma CPD/XX/<=18C' },
    ],
    hasInterdictions: false,
    warnings: [],
  };

  const mockAvailableComponents: AvailableComponent[] = [
    { productCode: 'E0701V00', productDescription: 'Fresh Frozen Plasma CPD/XX/<=18C' },
  ];

  const mockValidateComponentResponse: ValidateComponentResponse = {
    productCode: 'E0701V00',
    description: 'Fresh Frozen Plasma CPD/XX/<=18C',
    expiryDate: '2026-03-16T23:59:00',
    componentStatus: 'S',
    isEligible: true,
    warnings: [],
  };

  const mockRecheckResultResponse: RecheckResultResponse = {
    unitId: 'W123417031601',
    productCode: 'E0701V00',
    productDescription: 'Fresh Frozen Plasma CPD/XX/<=18C',
    expiryDate: '2026-03-16T23:59:00',
    previousStatus: 'S',
    newStatus: 'L',
    recheckDate: '2026-06-17T00:00:00',
    recheckUser: 'NITOR1',
    warehouseId: 'H',
    warnings: [],
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        RecheckProductsService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(RecheckProductsService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('validateUnit', () => {
    it('should POST and return ValidateUnitResponse on success', (done) => {
      const request: ValidateUnitRequest = { unitId: 'W123417031601' };
      const mockResponse: ApiResponse<ValidateUnitResponse> = {
        success: true,
        item: mockValidateUnitResponse,
        message: 'Unit validated successfully.',
        statusCode: 200,
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.validateUnit(request).subscribe({
        next: (response) => {
          expect(response).toEqual(mockValidateUnitResponse);
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail'),
      });
    });

    it('should propagate error on failure', (done) => {
      const request: ValidateUnitRequest = { unitId: 'INVALID' };
      const errorResponse = { error: { errorCode: '0063', message: 'Collection date not present' } };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.validateUnit(request).subscribe({
        next: () => fail('should not succeed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        },
      });
    });
  });

  describe('getAvailableComponents', () => {
    it('should GET and return components list', (done) => {
      const mockResponse: ApiResponse<AvailableComponent> = {
        success: true,
        data: mockAvailableComponents,
        message: 'Available components retrieved successfully.',
        statusCode: 200,
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAvailableComponents('W123417031601', '2023-05-20T00:00:00').subscribe({
        next: (response) => {
          expect(response).toEqual(mockAvailableComponents);
          expect(response.length).toBe(1);
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail'),
      });
    });

    it('should handle empty components response', (done) => {
      const emptyResponse: ApiResponse<AvailableComponent> = {
        success: true,
        data: [],
        message: 'Available components retrieved successfully.',
        statusCode: 200,
      };

      apiServiceSpy.get.and.returnValue(of(emptyResponse));

      service.getAvailableComponents('W123417031601', '2023-05-20T00:00:00').subscribe({
        next: (response) => {
          expect(response.length).toBe(0);
          done();
        },
        error: () => fail('should not fail'),
      });
    });

    it('should propagate error on failure', (done) => {
      const errorResponse = { error: { message: 'Error fetching components' } };
      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.getAvailableComponents('W123417031601', '2023-05-20T00:00:00').subscribe({
        next: () => fail('should not succeed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        },
      });
    });
  });

  describe('validateComponent', () => {
    it('should POST and return ValidateComponentResponse', (done) => {
      const request: ValidateComponentRequest = {
        unitId: 'W123417031601',
        productCode: 'E0701V00',
        collectionDate: '2023-05-20T00:00:00',
        chapterId: 'DAL',
      };
      const mockResponse: ApiResponse<ValidateComponentResponse> = {
        success: true,
        item: mockValidateComponentResponse,
        message: 'Component validated successfully.',
        statusCode: 200,
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.validateComponent(request).subscribe({
        next: (response) => {
          expect(response.isEligible).toBeTrue();
          expect(response.productCode).toBe('E0701V00');
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail'),
      });
    });

    it('should propagate error for ineligible component', (done) => {
      const request: ValidateComponentRequest = {
        unitId: 'W123417031601',
        productCode: 'E0385V00',
        collectionDate: '2023-05-20T00:00:00',
        chapterId: 'DAL',
      };
      const errorResponse = { error: { errorCode: '9795', message: 'Product has already expired' } };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.validateComponent(request).subscribe({
        next: () => fail('should not succeed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        },
      });
    });
  });

  describe('processRecheck', () => {
    it('should POST and return success response', (done) => {
      const request: RecheckProcessRequest = {
        unitId: 'W123417031601',
        productCode: 'E0701V00',
        collectionDate: '2023-05-20T00:00:00',
        chapterId: 'DAL',
      };
      const mockResponse: ApiResponse<RecheckResultResponse> = {
        success: true,
        item: mockRecheckResultResponse,
        message: 'TRANSACTION COMMITTED',
        statusCode: 200,
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.processRecheck(request).subscribe({
        next: (response) => {
          expect(response.unitId).toBe('W123417031601');
          expect(response.newStatus).toBe('L');
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail'),
      });
    });

    it('should handle commit failure', (done) => {
      const request: RecheckProcessRequest = {
        unitId: 'W123417031601',
        productCode: 'E0701V00',
        collectionDate: '2023-05-20T00:00:00',
        chapterId: 'DAL',
      };
      const errorResponse = { error: { errorCode: '0230', message: 'Unsuccessful commit' } };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.processRecheck(request).subscribe({
        next: () => fail('should not succeed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        },
      });
    });
  });
});
