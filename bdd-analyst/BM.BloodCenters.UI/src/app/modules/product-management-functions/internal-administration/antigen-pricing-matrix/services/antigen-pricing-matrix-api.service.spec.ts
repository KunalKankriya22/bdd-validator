import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AntigenPricingMatrixApiService } from './antigen-pricing-matrix-api.service';
import { ApiService } from '@shared/services/api.service';
import {
  AntigenPricingMatrixQueryParamsDto,
  AntigenPricingMatrixCreateDto,
  AntigenPricingMatrixUpdateDto
} from '../models/antigen-pricing-matrix.model';

describe('AntigenPricingMatrixApiService', () => {
  let service: AntigenPricingMatrixApiService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        AntigenPricingMatrixApiService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });
    service = TestBed.inject(AntigenPricingMatrixApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAntigenPricingMatrix', () => {
    it('should POST to the correct endpoint with take and skip', (done) => {
      // Arrange
      const mockResponse = { data: [], totalCount: 0 };
      mockApiService.post.and.returnValue(of(mockResponse));
      const params: AntigenPricingMatrixQueryParamsDto = {};

      // Act
      service.getAntigenPricingMatrix(10, 0, params).subscribe(() => {
        // Assert
        expect(mockApiService.post).toHaveBeenCalledWith(
          '/api/v1/antigen-pricing-matrix/10/0',
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should map API response fields to model fields', (done) => {
      // Arrange
      const mockResponse = {
        data: [{
          serviceCode: 'SVC001',
          antigenQty: 5,
          stdPrice: 99.99,
          antigenDesc: 'Test Antigen',
          effDate: '2025-01-01',
          termDate: '2025-12-31',
          lastModifiedDate: '2025-06-15'
        }],
        totalCount: 1
      };
      mockApiService.post.and.returnValue(of(mockResponse));
      const params: AntigenPricingMatrixQueryParamsDto = {};

      // Act
      service.getAntigenPricingMatrix(10, 0, params).subscribe(result => {
        // Assert
        expect(result.data.length).toBe(1);
        expect(result.data[0].code).toBe('SVC001');
        expect(result.data[0].quantity).toBe(5);
        expect(result.data[0].price).toBe(99.99);
        expect(result.data[0].description).toBe('Test Antigen');
        expect(result.data[0].effDate).toBe('2025-01-01');
        expect(result.data[0].termDate).toBe('2025-12-31');
        expect(result.data[0].modificationDate).toBe('2025-06-15');
        expect(result.totalCount).toBe(1);
        done();
      });
    });

    it('should include only provided filter params in the request body', (done) => {
      // Arrange
      const mockResponse = { data: [], totalCount: 0 };
      mockApiService.post.and.returnValue(of(mockResponse));
      const params: AntigenPricingMatrixQueryParamsDto = {
        searchKeyword: 'test',
        serviceCode: 'SVC001',
        sortColumn: 'code',
        sortOrder: 'asc'
      };

      // Act
      service.getAntigenPricingMatrix(10, 0, params).subscribe(() => {
        // Assert
        const requestBody = mockApiService.post.calls.mostRecent().args[1] as Record<string, unknown>;
        expect(requestBody['searchKeyword']).toBe('test');
        expect(requestBody['serviceCode']).toBe('SVC001');
        expect(requestBody['sortColumn']).toBe('code');
        expect(requestBody['sortOrder']).toBe('asc');
        expect(requestBody['antigenQty']).toBeUndefined();
        expect(requestBody['effDate']).toBeUndefined();
        expect(requestBody['termDate']).toBeUndefined();
        done();
      });
    });

    it('should include antigenQty when it is 0', (done) => {
      // Arrange
      const mockResponse = { data: [], totalCount: 0 };
      mockApiService.post.and.returnValue(of(mockResponse));
      const params: AntigenPricingMatrixQueryParamsDto = { antigenQty: 0 };

      // Act
      service.getAntigenPricingMatrix(10, 0, params).subscribe(() => {
        // Assert
        const requestBody = mockApiService.post.calls.mostRecent().args[1] as Record<string, unknown>;
        expect(requestBody['antigenQty']).toBe(0);
        done();
      });
    });

    it('should return empty data array when response.data is null', (done) => {
      // Arrange
      const mockResponse = { data: null, totalCount: 0 };
      mockApiService.post.and.returnValue(of(mockResponse));
      const params: AntigenPricingMatrixQueryParamsDto = {};

      // Act
      service.getAntigenPricingMatrix(10, 0, params).subscribe(result => {
        // Assert
        expect(result.data).toEqual([]);
        expect(result.totalCount).toBe(0);
        done();
      });
    });

    it('should include date filter params when provided', (done) => {
      // Arrange
      const mockResponse = { data: [], totalCount: 0 };
      mockApiService.post.and.returnValue(of(mockResponse));
      const params: AntigenPricingMatrixQueryParamsDto = {
        effDatePeriod: 'after',
        effDate: '2025-01-01',
        termDatePeriod: 'before',
        termDate: '2025-12-31'
      };

      // Act
      service.getAntigenPricingMatrix(10, 0, params).subscribe(() => {
        // Assert
        const requestBody = mockApiService.post.calls.mostRecent().args[1] as Record<string, unknown>;
        expect(requestBody['effDatePeriod']).toBe('after');
        expect(requestBody['effDate']).toBe('2025-01-01');
        expect(requestBody['termDatePeriod']).toBe('before');
        expect(requestBody['termDate']).toBe('2025-12-31');
        done();
      });
    });
  });

  describe('getAntigenPricingMatrixById', () => {
    it('should GET from the correct composite-key URL', (done) => {
      // Arrange
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: {
        serviceCode: 'SVC001', antigenQty: 3, stdPrice: 50, antigenDesc: 'Desc',
        effDate: '2025-01-01', termDate: null, lastModifiedDate: '2025-06-01'
      }};
      mockApiService.get.and.returnValue(of(mockResponse));

      // Act
      service.getAntigenPricingMatrixById('SVC001', 3, '2025-01-01').subscribe(() => {
        // Assert
        expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/antigen-pricing-matrix/SVC001/3/2025-01-01');
        done();
      });
    });

    it('should map the single API item to model fields', (done) => {
      // Arrange
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: {
        serviceCode: 'ABC', antigenQty: 2, stdPrice: 75.5, antigenDesc: 'Alpha',
        effDate: '2025-03-01', termDate: '2025-09-30', lastModifiedDate: '2025-04-01'
      }};
      mockApiService.get.and.returnValue(of(mockResponse));

      // Act
      service.getAntigenPricingMatrixById('ABC', 2, '2025-03-01').subscribe(result => {
        // Assert
        expect(result.data!.code).toBe('ABC');
        expect(result.data!.quantity).toBe(2);
        expect(result.data!.price).toBe(75.5);
        expect(result.data!.description).toBe('Alpha');
        expect(result.data!.modificationDate).toBe('2025-04-01');
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should handle response with no data gracefully', (done) => {
      // Arrange
      const mockResponse = { success: false, statusCode: 404, message: 'Not found', data: null };
      mockApiService.get.and.returnValue(of(mockResponse));

      // Act
      service.getAntigenPricingMatrixById('NONE', 0, '2025-01-01').subscribe(result => {
        // Assert
        expect(result.data).toBeUndefined();
        expect(result.success).toBe(false);
        done();
      });
    });
  });

  describe('createAntigenPricingMatrix', () => {
    it('should POST the DTO mapped to API field names', (done) => {
      // Arrange
      const dto: AntigenPricingMatrixCreateDto = {
        code: 'NEW01', quantity: 4, price: 120, description: 'New Antigen',
        effDate: '2025-06-01', termDate: '2025-12-31'
      };
      const mockResponse = { success: true, statusCode: 201, message: 'Created', data: { serviceCode: 'NEW01', antigenQty: 4 } };
      mockApiService.post.and.returnValue(of(mockResponse));

      // Act
      service.createAntigenPricingMatrix(dto).subscribe(() => {
        // Assert
        const requestBody = mockApiService.post.calls.mostRecent().args[1];
        expect(requestBody.serviceCode).toBe('NEW01');
        expect(requestBody.antigenQty).toBe(4);
        expect(requestBody.stdPrice).toBe(120);
        expect(requestBody.antigenDesc).toBe('New Antigen');
        expect(requestBody.effDate).toBe('2025-06-01');
        expect(requestBody.termDate).toBe('2025-12-31');
        done();
      });
    });

    it('should POST to the CREATE endpoint', (done) => {
      // Arrange
      const dto: AntigenPricingMatrixCreateDto = {
        code: 'X', quantity: 1, price: 10, description: 'D', effDate: '2025-01-01'
      };
      mockApiService.post.and.returnValue(of({ success: true, statusCode: 201, message: 'OK', data: { serviceCode: 'X', antigenQty: 1 } }));

      // Act
      service.createAntigenPricingMatrix(dto).subscribe(() => {
        // Assert
        expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/antigen-pricing-matrix', jasmine.any(Object));
        done();
      });
    });

    it('should set termDate to undefined when not provided', (done) => {
      // Arrange
      const dto: AntigenPricingMatrixCreateDto = {
        code: 'X', quantity: 1, price: 10, description: 'D', effDate: '2025-01-01'
      };
      mockApiService.post.and.returnValue(of({ success: true, statusCode: 201, message: 'OK', data: { serviceCode: 'X', antigenQty: 1 } }));

      // Act
      service.createAntigenPricingMatrix(dto).subscribe(() => {
        // Assert
        const requestBody = mockApiService.post.calls.mostRecent().args[1];
        expect(requestBody.termDate).toBeUndefined();
        done();
      });
    });
  });

  describe('updateAntigenPricingMatrix', () => {
    it('should PUT to the correct composite-key URL with mapped DTO', (done) => {
      // Arrange
      const dto: AntigenPricingMatrixUpdateDto = {
        code: 'UPD01', quantity: 6, price: 200, description: 'Updated',
        effDate: '2025-07-01', termDate: '2026-01-01'
      };
      const mockResponse = { success: true, statusCode: 200, message: 'Updated', data: { serviceCode: 'UPD01', antigenQty: 6 } };
      mockApiService.put.and.returnValue(of(mockResponse));

      // Act
      service.updateAntigenPricingMatrix('ORIG01', 3, '2025-01-01', dto).subscribe(() => {
        // Assert
        expect(mockApiService.put).toHaveBeenCalledWith(
          '/api/v1/antigen-pricing-matrix/ORIG01/3/2025-01-01',
          jasmine.objectContaining({
            serviceCode: 'UPD01',
            antigenQty: 6,
            stdPrice: 200,
            antigenDesc: 'Updated'
          })
        );
        done();
      });
    });
  });

  describe('getFilterDropdownValues', () => {
    it('should GET from the filter-dropdown endpoint and return data array', (done) => {
      // Arrange
      const mockResponse = { data: ['SVC001', 'SVC002', 'SVC003'] };
      mockApiService.get.and.returnValue(of(mockResponse));

      // Act
      service.getFilterDropdownValues().subscribe(result => {
        // Assert
        expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/antigen-pricing-matrix/filter-dropdown');
        expect(result).toEqual(['SVC001', 'SVC002', 'SVC003']);
        done();
      });
    });

    it('should return empty array when response.data is null', (done) => {
      // Arrange
      const mockResponse = { data: null };
      mockApiService.get.and.returnValue(of(mockResponse));

      // Act
      service.getFilterDropdownValues().subscribe(result => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });
  });
});
