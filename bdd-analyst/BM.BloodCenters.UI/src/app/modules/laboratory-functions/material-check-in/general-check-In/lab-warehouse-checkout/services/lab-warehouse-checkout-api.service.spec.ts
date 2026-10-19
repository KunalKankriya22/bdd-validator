import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { LabWarehouseCheckoutApiService } from './lab-warehouse-checkout-api.service';
import { ApiService } from '@shared/services/api.service';
import {
  ReturnResult,
  CreateLabWarehouseCheckoutDto,
  UpdateLabWarehouseCheckoutDto,
  LabWarehouseCheckoutDto,
  LabWarehouseCheckoutQueryDto,
  ValidProductDto
} from '../models/lab-warehouse-checkout.model';

describe('LabWarehouseCheckoutApiService', () => {
  let service: LabWarehouseCheckoutApiService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockCheckoutData: LabWarehouseCheckoutDto[] = [
    {
      batchId: 'BATCH001',
      unitId: '1234567',
      productCode: 'E009X00',
      receiveWarehouse: 'B',
      chapterId: 'CHAP01'
    }
  ];

  const mockApiResponse: ReturnResult<LabWarehouseCheckoutDto> = {
    success: true,
    statusCode: 200,
    message: 'Data retrieved successfully',
    data: mockCheckoutData,
    total: 1
  };

  const mockValidProducts: ValidProductDto[] = [
    { productCode: 'E009X00', productDescription: 'Red Blood Cells [AS54]', aliquot: '00' },
    { productCode: 'FFPXXXVA', productDescription: 'Fresh Frozen Plasma', aliquot: 'VA' }
  ];

  const mockProductsResponse: ReturnResult<ValidProductDto> = {
    success: true,
    statusCode: 200,
    message: 'Products retrieved',
    data: mockValidProducts
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LabWarehouseCheckoutApiService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(LabWarehouseCheckoutApiService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getCheckoutRecords', () => {
    it('should call API with correct endpoint and parameters', (done) => {
      const take = 25;
      const skip = 0;
      const query: LabWarehouseCheckoutQueryDto = {
        batchId: 'BATCH001',
        sortColumn: 'UnitId',
        sortOrder: 'ASC'
      };

      apiService.post.and.returnValue(of(mockApiResponse));

      service.getCheckoutRecords(take, skip, query).subscribe(response => {
        expect(response).toEqual(mockApiResponse);
        expect(apiService.post).toHaveBeenCalledWith(
          'api/v1/lab-warehouse-checkout/25/0',
          query
        );
        done();
      });
    });

  });

  describe('getCheckoutById', () => {
    it('should call API with composite key', (done) => {
      const singleResponse: ReturnResult<LabWarehouseCheckoutDto> = {
        success: true,
        statusCode: 200,
        message: 'Record retrieved',
        data: [mockCheckoutData[0]]
      };

      apiService.get.and.returnValue(of(singleResponse));

      service.getCheckoutById('BATCH001', '1234567', 'E009X00').subscribe(response => {
        expect(response).toEqual(singleResponse);
        expect(apiService.get).toHaveBeenCalledWith(
          'api/v1/lab-warehouse-checkout/BATCH001/1234567/E009X00'
        );
        done();
      });
    });

    it('should handle 404 not found', (done) => {
      const errorResponse = {
        success: false,
        statusCode: 404,
        message: 'Record not found'
      };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getCheckoutById('BATCH999', '9999999', 'XXX').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.statusCode).toBe(404);
          done();
        }
      });
    });
  });

  describe('createCheckout', () => {
    it('should call POST endpoint with DTO', (done) => {
      const createDto: CreateLabWarehouseCheckoutDto = {
        batchId: 'BATCH001',
        unitId: '1234567',
        productCode: 'E009X00',
        receiveWarehouse: 'B'
      };

      const createResponse: ReturnResult<LabWarehouseCheckoutDto> = {
        success: true,
        statusCode: 200,
        message: 'Created successfully',
        data: [mockCheckoutData[0]]
      };

      apiService.post.and.returnValue(of(createResponse));

      service.createCheckout(createDto).subscribe(response => {
        expect(response).toEqual(createResponse);
        expect(apiService.post).toHaveBeenCalledWith(
          'api/v1/lab-warehouse-checkout',
          createDto
        );
        done();
      });
    });

  });

  describe('updateCheckout', () => {
    it('should call PUT endpoint with composite key and DTO', (done) => {
      const updateDto: UpdateLabWarehouseCheckoutDto = {
        receiveWarehouse: 'C'
      };

      const updateResponse: ReturnResult<LabWarehouseCheckoutDto> = {
        success: true,
        statusCode: 200,
        message: 'Updated successfully',
        data: [{ ...mockCheckoutData[0], receiveWarehouse: 'C' }]
      };

      apiService.put.and.returnValue(of(updateResponse));

      service.updateCheckout('BATCH001', '1234567', 'E009X00', updateDto).subscribe(response => {
        expect(response).toEqual(updateResponse);
        expect(apiService.put).toHaveBeenCalledWith(
          'api/v1/lab-warehouse-checkout/BATCH001/1234567/E009X00',
          updateDto
        );
        done();
      });
    });

  });

  describe('deleteCheckout', () => {
    it('should call DELETE endpoint with composite key', (done) => {
      const deleteResponse: ReturnResult<boolean> = {
        success: true,
        statusCode: 200,
        message: 'Deleted successfully',
        data: [true]
      };

      apiService.delete.and.returnValue(of(deleteResponse));

      service.deleteCheckout('BATCH001', '1234567', 'E009X00').subscribe(response => {
        expect(response).toEqual(deleteResponse);
        expect(apiService.delete).toHaveBeenCalledWith(
          'api/v1/lab-warehouse-checkout/BATCH001/1234567/E009X00'
        );
        done();
      });
    });

    it('should handle delete failure', (done) => {
      const errorResponse = {
        success: false,
        statusCode: 404,
        message: 'Record not found'
      };

      apiService.delete.and.returnValue(throwError(() => errorResponse));

      service.deleteCheckout('BATCH001', '1234567', 'E009X00').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.statusCode).toBe(404);
          done();
        }
      });
    });
  });

  describe('getValidProducts', () => {
    it('should call valid-products endpoint with unitId', (done) => {
      apiService.get.and.returnValue(of(mockProductsResponse));

      service.getValidProducts('1234567').subscribe(products => {
        expect(products).toEqual(mockValidProducts);
        expect(apiService.get).toHaveBeenCalledWith(
          'api/v1/lab-warehouse-checkout/valid-products',
          jasmine.objectContaining({
            params: jasmine.any(Object)
          })
        );
        done();
      });
    });

    it('should include warehouseId if provided', (done) => {
      apiService.get.and.returnValue(of(mockProductsResponse));

      service.getValidProducts('1234567', 'WH01').subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(
          'api/v1/lab-warehouse-checkout/valid-products',
          jasmine.objectContaining({
            params: jasmine.any(Object)
          })
        );
        done();
      });
    });

  });

});
