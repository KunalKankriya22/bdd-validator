import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ProductTypePrioritizationService } from './product-type-prioritization.service';
import { ApiService } from '@shared/services/api.service';
import { ProductTypePrioritizationCreateDto, ProductTypePrioritizationUpdateDto } from '../models/product-type-prioritization.model';

describe('ProductTypePrioritizationService', () => {
  let service: ProductTypePrioritizationService;
  let httpMock: HttpTestingController;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ProductTypePrioritizationService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(ProductTypePrioritizationService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getProductTypePrioritizations', () => {
    it('should fetch product type prioritizations', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { productType: 'PT001', barcodeValue: 'BC001', prioritySeq: 1 },
          { productType: 'PT002', barcodeValue: 'BC002', prioritySeq: 2 }
        ],
        total: 2
      };

      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getProductTypePrioritizations({}).subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.totalRecords).toBe(2);
        expect(apiService.post).toHaveBeenCalled();
        done();
      });
    });

  });

  describe('getProductTypeLookups', () => {
    it('should fetch product type lookup values', (done) => {
      const mockResponse = [
        { code: 'PT001', description: 'Product Type 001' },
        { code: 'PT002', description: 'Product Type 002' }
      ];

      apiService.get.and.returnValue(of(mockResponse) as any);

      service.getProductTypeLookups().subscribe(result => {
        expect(result.length).toBe(2);
        done();
      });
    });
  });

  describe('getBarcodeLookups', () => {
    it('should fetch barcode lookup values', (done) => {
      const mockResponse = [
        { code: 'BC001', description: 'Barcode 001' }
      ];

      apiService.get.and.returnValue(of(mockResponse) as any);

      service.getBarcodeLookups().subscribe(result => {
        expect(result.length).toBe(1);
        done();
      });
    });
  });

  describe('getMaxPriority', () => {
    it('should fetch max priority for a product type', (done) => {
      const mockResponse = { maxPriority: 5 };

      apiService.get.and.returnValue(of(mockResponse) as any);

      service.getMaxPriority('PT001').subscribe(result => {
        expect(result.maxPriority).toBe(5);
        expect(apiService.get).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('checkPriorityConflict', () => {
    it('should check for priority conflict', (done) => {
      const mockResponse = { conflict: false };

      apiService.get.and.returnValue(of(mockResponse) as any);

      service.checkPriorityConflict('PT001', 1).subscribe(result => {
        expect(result.conflict).toBe(false);
        done();
      });
    });

    it('should check with excludeBarcodeValue param', (done) => {
      const mockResponse = { conflict: true, barcodeValue: 'BC002' };

      apiService.get.and.returnValue(of(mockResponse) as any);

      service.checkPriorityConflict('PT001', 1, 'BC001').subscribe(result => {
        expect(result.conflict).toBe(true);
        done();
      });
    });
  });

  describe('createProductTypePrioritization', () => {
    it('should create a new product type prioritization', (done) => {
      const newRecord: ProductTypePrioritizationCreateDto = {
        productType: 'PT001',
        barcodeValue: 'BC001',
        prioritySeq: 1,
        effDate: '2024-01-01T00:00:00Z',
        termDate: null
      };

      const mockResponse = {
        success: true,
        message: 'Product type prioritization added successfully'
      };

      apiService.post.and.returnValue(of(mockResponse) as any);

      service.createProductTypePrioritization(newRecord).subscribe(result => {
        expect(result.success).toBe(true);
        done();
      });
    });
  });

  describe('updateProductTypePrioritization', () => {
    it('should update an existing product type prioritization', (done) => {
      const updateData: ProductTypePrioritizationUpdateDto = {
        prioritySeq: 2,
        effDate: '2024-06-01T00:00:00Z',
        termDate: null,
        shiftPriorities: false
      };

      const mockResponse = {
        success: true,
        message: 'Product type prioritization updated successfully'
      };

      apiService.put.and.returnValue(of(mockResponse) as any);

      service.updateProductTypePrioritization('PT001', 'BC001', updateData).subscribe(result => {
        expect(result.success).toBe(true);
        expect(apiService.put).toHaveBeenCalled();
        done();
      });
    });
  });
});