import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProductsInQuarantineApiService } from './products-in-quarantine-api.service';
import { ApiService } from '@shared/services/api.service';
import {
  ProductsInQuarantineResponse,
  QuarantineTypesResponse,
  ProductInQuarantineDto,
  QuarantineTypeDto,
} from '../models/products-in-quarantine.model';

describe('ProductsInQuarantineApiService', () => {
  let service: ProductsInQuarantineApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockProducts: ProductInQuarantineDto[] = [
    {
      unitId: 'W1234-56-01-010-7', checkDigit: '12', productCode: 'RDS001',
      aliquot: '01', aboDescription: 'A Positive', expirationDate: '2024-02-15T00:00:00Z',
      customer: 'Hopkins County Memorial Hospital', reasonCode: 'QDTR',
      reason: 'Quarantine Due to Recall', userId: null,
    },
    {
      unitId: 'W1234-56-01-010-8', checkDigit: '45', productCode: 'PLT002',
      aliquot: '00', aboDescription: 'O Negative', expirationDate: '2024-02-20T00:00:00Z',
      customer: null, reasonCode: 'QR05', reason: 'Quality control hold', userId: null,
    },
  ];

  const mockProductsResponse: ProductsInQuarantineResponse = {
    success: true, message: 'Successfully retrieved 2 products', statusCode: 200,
    data: mockProducts, totalCount: 2, pagination: { take: 100, skip: 0, hasMore: false },
  };

  const mockQuarantineTypes: QuarantineTypeDto[] = [
    { code: 'RT', description: 'Return Products' },
    { code: 'QU', description: 'Quarantine Products' },
    { code: 'QL', description: 'Quality Hold' },
  ];

  const mockQuarantineTypesResponse: QuarantineTypesResponse = {
    success: true, message: 'Successfully retrieved quarantine types', statusCode: 200,
    data: mockQuarantineTypes,
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        ProductsInQuarantineApiService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(ProductsInQuarantineApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getProducts', () => {
    it('should retrieve products without filters', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockProductsResponse));
      service.getProducts().subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          expect(response.data.length).toBe(2);
          expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/products-in-quarantine');
          done();
        },
      });
    });

    it('should retrieve products with quarantine type filter', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockProductsResponse));
      service.getProducts({ quarantineType: 'RT' }).subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/products-in-quarantine?quarantineType=RT');
          done();
        },
      });
    });

    it('should retrieve products with pagination params', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockProductsResponse));
      service.getProducts({ take: 50, skip: 10 }).subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/products-in-quarantine?take=50&skip=10');
          done();
        },
      });
    });

    it('should retrieve products with all query parameters', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockProductsResponse));
      service.getProducts({ quarantineType: 'QU', take: 25, skip: 0 }).subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/products-in-quarantine?quarantineType=QU&take=25&skip=0');
          done();
        },
      });
    });

    it('should handle validation error for invalid take parameter', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => ({ statusCode: 400 })));
      service.getProducts({ take: 600 }).subscribe({
        next: () => fail('Should have errored'),
        error: (error) => { expect(error.statusCode).toBe(400); done(); },
      });
    });

    it('should handle network error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));
      service.getProducts().subscribe({
        next: () => fail('Should have errored'),
        error: (error) => { expect(error.message).toBe('Network error'); done(); },
      });
    });

    it('should handle null query params', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockProductsResponse));
      service.getProducts({ quarantineType: null }).subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/products-in-quarantine');
          done();
        },
      });
    });
  });

  describe('getQuarantineTypes', () => {
    it('should retrieve quarantine types', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockQuarantineTypesResponse));
      service.getQuarantineTypes().subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          expect(response.data.length).toBe(3);
          expect(response.data[0].code).toBe('RT');
          expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/products-in-quarantine/quarantine-types');
          done();
        },
      });
    });

    it('should handle API errors when retrieving quarantine types', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Failed to load')));
      service.getQuarantineTypes().subscribe({
        next: () => fail('Should have errored'),
        error: (error) => { expect(error.message).toBe('Failed to load'); done(); },
      });
    });

    it('should handle empty quarantine types response', (done) => {
      const emptyResponse: QuarantineTypesResponse = {
        success: true, message: '', statusCode: 200, data: [],
      };
      apiServiceSpy.get.and.returnValue(of(emptyResponse));
      service.getQuarantineTypes().subscribe({
        next: (response) => { expect(response.data.length).toBe(0); done(); },
      });
    });
  });
});
