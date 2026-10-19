import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { VerifyComponentSuitabilityApiService } from './verify-component-suitability-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ProcessCodeDto,
  ProductTypeDto,
  EligibleProductDto,
  UnitEligibilityDto,
  ComponentDetailDto,
  SpecialProcessResultDto,
  ApiResponse,
  ValidateUnitRequestDto,
  AssignSpecialProcessRequestDto,
} from '../models/verify-component-suitability.model';

describe('VerifyComponentSuitabilityApiService', () => {
  let service: VerifyComponentSuitabilityApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockProcessCodesResponse: ApiResponse<ProcessCodeDto[]> = {
    success: true,
    statusCode: 200,
    message: 'Successfully fetched active process codes',
    data: [
      { code: 'FROZ', description: 'Freezing' },
      { code: 'THAW', description: 'Thawing' },
      { code: 'IR', description: 'Irradiation' },
    ],
  };

  const mockProductTypesResponse: ApiResponse<ProductTypeDto[]> = {
    success: true,
    statusCode: 200,
    message: 'Successfully fetched product types',
    data: [
      { productType: 'RBC', description: 'Red Blood Cells' },
      { productType: 'PLT', description: 'Platelets' },
      { productType: 'FFP', description: 'Fresh Frozen Plasma' },
    ],
  };

  const mockEligibleProductsResponse: ApiResponse<EligibleProductDto[]> = {
    success: true,
    statusCode: 200,
    message: 'Successfully fetched eligible products',
    data: [
      { productCode: 'RBCS', description: 'RBC' },
      { productCode: 'E0385V00', description: 'RBC AS5' },
    ],
  };

  const mockUnitEligibilityResponse: ApiResponse<UnitEligibilityDto> = {
    success: true,
    statusCode: 200,
    message: 'Unit is eligible for the selected process',
    data: {
      unitId: 'W1234-18-031302-Z',
      collectionDate: '2024-05-15T00:00:00Z',
      isEligible: true,
      errorMessage: null,
    },
  };

  const mockComponentDetailResponse: ApiResponse<ComponentDetailDto> = {
    success: true,
    statusCode: 200,
    message: 'Component details retrieved successfully',
    data: {
      unitId: 'W1234-18-031302-Z',
      productCode: 'E0385V00',
      productDescription: 'RBC AS5',
      componentPrefix: '01',
      aboRh: 'AB Pos Regular',
      expiryDate: '2018-03-01T16:40:00Z',
      collectionDate: '2024-05-15T00:00:00Z',
    },
  };

  const mockAssignResponse: ApiResponse<SpecialProcessResultDto> = {
    success: true,
    statusCode: 201,
    message: 'Special process assigned successfully',
    data: {
      unitId: 'W1234-18-031302-Z',
      productCode: 'E0385V00',
      productDescription: 'RBC AS5',
      aboRh: 'AB Pos Regular',
      expiryDate: '2018-03-01T16:40:00Z',
      processCode: 'FROZ',
      insertDate: '2024-05-20T10:15:00Z',
    },
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        VerifyComponentSuitabilityApiService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(VerifyComponentSuitabilityApiService);
  });

  describe('getProcessCodes', () => {
    it('should call correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockProcessCodesResponse));

      service.getProcessCodes().subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.VERIFY_COMPONENT_SUITABILITY.PROCESS_CODES
        );
        done();
      });
    });

    it('should return process codes array', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockProcessCodesResponse));

      service.getProcessCodes().subscribe((data) => {
        expect(data).toEqual(mockProcessCodesResponse.data);
        expect(data.length).toBe(3);
        expect(data[0].code).toBe('FROZ');
        done();
      });
    });


  });

  describe('getProductTypes', () => {
    it('should call correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockProductTypesResponse));

      service.getProductTypes().subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.VERIFY_COMPONENT_SUITABILITY.PRODUCT_TYPES
        );
        done();
      });
    });

    it('should return product types array', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockProductTypesResponse));

      service.getProductTypes().subscribe((data) => {
        expect(data).toEqual(mockProductTypesResponse.data);
        expect(data.length).toBe(3);
        expect(data[0].productType).toBe('RBC');
        done();
      });
    });

  });

  describe('getEligibleProducts', () => {
    it('should call correct endpoint with query parameters', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockEligibleProductsResponse));

      const unitId = 'W1234-18-031302-Z';
      const processCode = 'FROZ';

      service.getEligibleProducts(unitId, processCode).subscribe(() => {
        const expectedUrl = API.VERIFY_COMPONENT_SUITABILITY.ELIGIBLE_PRODUCTS(
          unitId,
          processCode
        );
        expect(apiServiceSpy.get).toHaveBeenCalledWith(expectedUrl);
        done();
      });
    });

    it('should return eligible products array', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockEligibleProductsResponse));

      service.getEligibleProducts('W1234-18-031302-Z', 'FROZ').subscribe((data) => {
        expect(data).toEqual(mockEligibleProductsResponse.data);
        expect(data.length).toBe(2);
        expect(data[0].productCode).toBe('RBCS');
        done();
      });
    });

    it('should return empty array when no eligible products', (done) => {
      apiServiceSpy.get.and.returnValue(
        of({ ...mockEligibleProductsResponse, data: [] })
      );

      service.getEligibleProducts('W1234-18-031302-Z', 'FROZ').subscribe((data) => {
        expect(data).toEqual([]);
        done();
      });
    });
  });

  describe('validateUnit', () => {
    it('should call correct endpoint with request body', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockUnitEligibilityResponse));

      const request: ValidateUnitRequestDto = {
        processCode: 'FROZ',
        unitId: 'W1234-18-031302-Z',
      };

      service.validateUnit(request).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.VERIFY_COMPONENT_SUITABILITY.VALIDATE_UNIT,
          request
        );
        done();
      });
    });

    it('should return unit eligibility response', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockUnitEligibilityResponse));

      const request: ValidateUnitRequestDto = {
        processCode: 'FROZ',
        unitId: 'W1234-18-031302-Z',
      };

      service.validateUnit(request).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data.isEligible).toBe(true);
        expect(response.data.unitId).toBe('W1234-18-031302-Z');
        done();
      });
    });

  });

  describe('validateProduct', () => {
    it('should call correct endpoint with query parameters', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockComponentDetailResponse));

      const unitId = 'W1234-18-031302-Z';
      const productCode = 'E0385V00';
      const processCode = 'FROZ';

      service.validateProduct(unitId, productCode, processCode).subscribe(() => {
        const expectedUrl = API.VERIFY_COMPONENT_SUITABILITY.VALIDATE_PRODUCT(
          unitId,
          productCode,
          processCode
        );
        expect(apiServiceSpy.post).toHaveBeenCalledWith(expectedUrl, {});
        done();
      });
    });

    it('should include componentPrefix when provided', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockComponentDetailResponse));

      const unitId = 'W1234-18-031302-Z';
      const productCode = 'E0385V00';
      const processCode = 'FROZ';
      const componentPrefix = '01';

      service
        .validateProduct(unitId, productCode, processCode, componentPrefix)
        .subscribe(() => {
          const expectedUrl = API.VERIFY_COMPONENT_SUITABILITY.VALIDATE_PRODUCT(
            unitId,
            productCode,
            processCode,
            componentPrefix
          );
          expect(apiServiceSpy.post).toHaveBeenCalledWith(expectedUrl, {});
          done();
        });
    });

    it('should return component detail response', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockComponentDetailResponse));

      service
        .validateProduct('W1234-18-031302-Z', 'E0385V00', 'FROZ')
        .subscribe((response) => {
          expect(response.success).toBe(true);
          expect(response.data.productCode).toBe('E0385V00');
          expect(response.data.aboRh).toBe('AB Pos Regular');
          done();
        });
    });
  });

  describe('assignSpecialProcess', () => {
    it('should call correct endpoint with request body', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockAssignResponse));

      const request: AssignSpecialProcessRequestDto = {
        processCode: 'FROZ',
        unitId: 'W1234-18-031302-Z',
        productCode: 'E0385V00',
        componentPrefix: '01',
      };

      service.assignSpecialProcess(request).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.VERIFY_COMPONENT_SUITABILITY.ASSIGN,
          request
        );
        done();
      });
    });

    it('should return assign result response', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockAssignResponse));

      const request: AssignSpecialProcessRequestDto = {
        processCode: 'FROZ',
        unitId: 'W1234-18-031302-Z',
        productCode: 'E0385V00',
      };

      service.assignSpecialProcess(request).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(201);
        expect(response.data.processCode).toBe('FROZ');
        expect(response.data.insertDate).toBeTruthy();
        done();
      });
    });

  });

  describe('assignBatch', () => {
    it('should handle empty array', (done) => {
      service.assignBatch([]).subscribe((results) => {
        expect(results).toEqual([]);
        done();
      });
    });

    it('should assign multiple components successfully', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockAssignResponse));

      const requests: AssignSpecialProcessRequestDto[] = [
        {
          processCode: 'FROZ',
          unitId: 'W1234-18-031302-Z',
          productCode: 'E0385V00',
        },
        {
          processCode: 'FROZ',
          unitId: 'W1234-18-031302-Y',
          productCode: 'RBCS',
        },
      ];

      service.assignBatch(requests).subscribe((results) => {
        expect(results.length).toBe(2);
        expect(results.every((r) => r.success)).toBe(true);
        expect(apiServiceSpy.post).toHaveBeenCalledTimes(2);
        done();
      });
    });

    it('should handle partial failures', (done) => {
      let callCount = 0;
      apiServiceSpy.post.and.callFake((() => {
        callCount++;
        if (callCount === 1) {
          return of(mockAssignResponse);
        } else {
          return throwError(() => ({ error: { message: 'Duplicate assignment' } }));
        }
      }) as any);

      const requests: AssignSpecialProcessRequestDto[] = [
        {
          processCode: 'FROZ',
          unitId: 'W1234-18-031302-Z',
          productCode: 'E0385V00',
        },
        {
          processCode: 'FROZ',
          unitId: 'W1234-18-031302-Y',
          productCode: 'RBCS',
        },
      ];

      service.assignBatch(requests).subscribe((results) => {
        expect(results.length).toBe(2);
        expect(results[0].success).toBe(true);
        expect(results[1].success).toBe(false);
        expect(results[1].error).toBe('Duplicate assignment');
        done();
      });
    });

    it('should include request in result', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockAssignResponse));

      const requests: AssignSpecialProcessRequestDto[] = [
        {
          processCode: 'FROZ',
          unitId: 'W1234-18-031302-Z',
          productCode: 'E0385V00',
          componentPrefix: '01',
        },
      ];

      service.assignBatch(requests).subscribe((results) => {
        expect(results[0].request).toEqual(requests[0]);
        expect(results[0].data).toBeTruthy();
        done();
      });
    });

  });
});
