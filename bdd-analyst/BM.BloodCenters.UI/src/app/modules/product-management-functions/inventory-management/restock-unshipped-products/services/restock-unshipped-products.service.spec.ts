import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RestockUnshippedProductsService } from './restock-unshipped-products.service';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  PickSlipDto,
  PickSlipProductDto,
  PickSlipQueryDto,
  RestockProductRequestDto,
  RestockResponseDto,
  ApiResponse
} from '../models/restock-unshipped-products.model';

describe('RestockUnshippedProductsService', () => {
  let service: RestockUnshippedProductsService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RestockUnshippedProductsService]
    });

    service = TestBed.inject(RestockUnshippedProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getPickSlips', () => {
    it('should fetch pick slips with default pagination', () => {
      const mockCriteria: PickSlipQueryDto = {
        chapterId: '001',
        warehouseId: 'H'
      };

      const mockResponse: ApiResponse<PickSlipDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Pick slips retrieved successfully',
        data: [
          {
            pickSlipId: 'PU17-00130025',
            chapterId: '001',
            totalProducts: 5,
            restockableProducts: 3,
            createDate: '2025-05-12T00:00:00',
            createUser: 'MAR123',
            warehouseId: 'H'
          }
        ],
        total: 1
      };

      service.getPickSlips(mockCriteria).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data?.length).toBe(1);
        expect(response.data?.[0].pickSlipId).toBe('PU17-00130025');
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.GET_PICK_SLIPS}/100/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCriteria);
      req.flush(mockResponse);
    });

    it('should fetch pick slips with custom pagination', () => {
      const mockCriteria: PickSlipQueryDto = {
        chapterId: '001'
      };

      service.getPickSlips(mockCriteria, 50, 10).subscribe();

      const req = httpMock.expectOne(`${baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.GET_PICK_SLIPS}/50/10`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: [] });
    });

    it('should include search filters in request body', () => {
      const mockCriteria: PickSlipQueryDto = {
        chapterId: '001',
        warehouseId: 'H',
        pickSlipId: 'PU17',
        searchKeyword: 'search',
        sortColumn: 'CreateDate',
        sortOrder: 'DESC'
      };

      service.getPickSlips(mockCriteria).subscribe();

      const req = httpMock.expectOne(`${baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.GET_PICK_SLIPS}/100/0`);
      expect(req.request.body).toEqual(mockCriteria);
      req.flush({ success: true, statusCode: 200, message: 'Success', data: [] });
    });

  });

  describe('getPickSlipProducts', () => {
    it('should fetch products for a pick slip', () => {
      const pickSlipId = 'PU17-00130025';
      const chapterId = '001';

      const mockResponse: ApiResponse<PickSlipProductDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Products retrieved successfully',
        data: [
          {
            pickSlipId: 'PU17-00130025',
            unitId: 'W123417070100',
            productCode: 'E009X00',
            productShortName: 'Red Blood Cells (AS54)',
            aliquot: '00',
            chapterId: '001',
            bloodType: 'AB+',
            bloodTypeDesc: 'AB Positive',
            expDate: '2025-05-12T23:59:00',
            collDate: '2025-04-10T08:00:00',
            productStatus: 'RP',
            warehouseId: 'H',
            device: '50',
            rack: '20',
            tray: '1028'
          }
        ],
        total: 1
      };

      service.getPickSlipProducts(pickSlipId, chapterId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data?.length).toBe(1);
        expect(response.data?.[0].unitId).toBe('W123417070100');
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.GET_PICK_SLIP_PRODUCTS(pickSlipId, 100, 0)}?chapterId=${chapterId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch products without chapter ID', () => {
      const pickSlipId = 'PU17-00130025';

      service.getPickSlipProducts(pickSlipId).subscribe();

      const req = httpMock.expectOne(
        `${baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.GET_PICK_SLIP_PRODUCTS(pickSlipId, 100, 0)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: [] });
    });

    it('should fetch products with custom pagination', () => {
      const pickSlipId = 'PU17-00130025';
      const chapterId = '001';

      service.getPickSlipProducts(pickSlipId, chapterId, 50, 10).subscribe();

      const req = httpMock.expectOne(
        `${baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.GET_PICK_SLIP_PRODUCTS(pickSlipId, 50, 10)}?chapterId=${chapterId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: [] });
    });

    it('should handle pick slip not found error', () => {
      const pickSlipId = 'INVALID_ID';
      const chapterId = '001';

      const mockErrorResponse = {
        success: false,
        statusCode: 404,
        message: 'Pick slip not found'
      };

      service.getPickSlipProducts(pickSlipId, chapterId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.error).toEqual(mockErrorResponse);
        }
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.GET_PICK_SLIP_PRODUCTS(pickSlipId, 100, 0)}?chapterId=${chapterId}`
      );
      req.flush(mockErrorResponse, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('restockProducts', () => {
    it('should restock products successfully', () => {
      const request: RestockProductRequestDto = {
        pickSlipId: 'PU17-00130025',
        chapterId: '001',
        products: [
          {
            unitId: 'W123417070100',
            productCode: 'E009X00',
            aliquot: '00',
            locationId: 'H-50-20-1028',
            warehouseId: 'H'
          }
        ]
      };

      const mockResponse: ApiResponse<RestockResponseDto> = {
        success: true,
        statusCode: 200,
        message: '1 product(s) restocked successfully',
        data: {
          productsRestocked: 1,
          rowsAffected: 2,
          pickSlipClosed: false
        }
      };

      service.restockProducts(request).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data?.productsRestocked).toBe(1);
        expect(response.data?.rowsAffected).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.RESTOCK_PRODUCTS}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });



    it('should handle product not found in pick slip error', () => {
      const request: RestockProductRequestDto = {
        pickSlipId: 'PU17-00130025',
        chapterId: '001',
        products: [
          {
            unitId: 'INVALID_UNIT',
            productCode: 'E009X00',
            aliquot: '00',
            locationId: 'H-50-20-1028',
            warehouseId: 'H'
          }
        ]
      };

      const mockErrorResponse = {
        success: false,
        statusCode: 400,
        message: 'Product not found in pick slip'
      };

      service.restockProducts(request).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.error.message).toBe('Product not found in pick slip');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.RESTOCK_PRODUCTS}`);
      req.flush(mockErrorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle product status not RP error', () => {
      const request: RestockProductRequestDto = {
        pickSlipId: 'PU17-00130025',
        chapterId: '001',
        products: [
          {
            unitId: 'W123417070100',
            productCode: 'E009X00',
            aliquot: '00',
            locationId: 'H-50-20-1028',
            warehouseId: 'H'
          }
        ]
      };

      const mockErrorResponse = {
        success: false,
        statusCode: 400,
        message: "Product status is not 'RP' (Removed/Picked)"
      };

      service.restockProducts(request).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.error.message).toContain('Product status');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.RESTOCK_PRODUCTS}`);
      req.flush(mockErrorResponse, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors for getPickSlips', () => {
      const mockCriteria: PickSlipQueryDto = { chapterId: '001' };

      service.getPickSlips(mockCriteria).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.GET_PICK_SLIPS}/100/0`);
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle network errors for getPickSlipProducts', () => {
      const pickSlipId = 'PU17-00130025';
      service.getPickSlipProducts(pickSlipId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(
        `${baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.GET_PICK_SLIP_PRODUCTS(pickSlipId, 100, 0)}`
      );
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle network errors for restockProducts', () => {
      const request: RestockProductRequestDto = {
        pickSlipId: 'PU17-00130025',
        chapterId: '001',
        products: []
      };

      service.restockProducts(request).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RESTOCK_UNSHIPPED_PRODUCTS.RESTOCK_PRODUCTS}`);
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });
  });
});
