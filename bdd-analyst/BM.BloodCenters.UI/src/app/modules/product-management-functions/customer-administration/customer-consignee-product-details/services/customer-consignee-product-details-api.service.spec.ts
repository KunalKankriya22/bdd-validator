import { TestBed } from '@angular/core/testing';
import { HttpParams } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { CustomerConsigneeProductDetailsApiService } from './customer-consignee-product-details-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  CustomerConsigneeProductDetailsDto,
  CustomerConsigneeProductQueryDto,
  CreateCustomerConsigneeProductRequestDto,
  UpdateCustomerConsigneeProductRequestDto,
  ReturnResult,
  CustomerLOV,
  ConsigneeLOV,
  ProductTypeLOV,
  ProductCodeLOV
} from '../models/customer-consignee-product-details.model';

describe('CustomerConsigneeProductDetailsApiService', () => {
  let service: CustomerConsigneeProductDetailsApiService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockDetail: CustomerConsigneeProductDetailsDto = {
    customerId: 'CUST001',
    customerName: 'Test Customer',
    consigneeId: 'CON001',
    consigneeName: 'Test Consignee',
    productType: 'WB',
    productTypeDescription: 'Whole Blood',
    productCode: 'PC001',
    productCodeDescription: 'Product Code 001',
    effDate: '2024-01-01',
    termDate: '2024-12-31',
    chapterId: 'CH01',
    insertDate: '2024-01-01',
    insertUser: 'admin',
    programId: 'PRG01'
  };

  const mockDetail2: CustomerConsigneeProductDetailsDto = {
    customerId: 'CUST002',
    customerName: 'Test Customer 2',
    consigneeId: 'CON002',
    consigneeName: 'Test Consignee 2',
    productType: 'PLT',
    productTypeDescription: 'Platelets',
    productCode: 'PC002',
    productCodeDescription: 'Product Code 002',
    effDate: '2024-02-01',
    termDate: null
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        CustomerConsigneeProductDetailsApiService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });
    service = TestBed.inject(CustomerConsigneeProductDetailsApiService);
  });

  describe('getCustomerConsigneeProductDetails', () => {
    const query: CustomerConsigneeProductQueryDto = {
      customerId: 'CUST001',
      consigneeId: null,
      productType: null,
      productCode: null
    };
    const take = 10;
    const skip = 0;

    it('should return data and total on success', (done: DoneFn) => {
      const apiResponse: ReturnResult<CustomerConsigneeProductDetailsDto> = {
        success: true,
        data: [mockDetail, mockDetail2],
        total: 2
      };
      mockApiService.post.and.returnValue(of(apiResponse));

      service.getCustomerConsigneeProductDetails(query, take, skip).subscribe(result => {
        expect(result.data).toEqual([mockDetail, mockDetail2]);
        expect(result.total).toBe(2);
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.CUSTOMER_CONSIGNEE_PRODUCT.LIST(take, skip),
          query
        );
        done();
      });
    });



    it('should log error and rethrow on failure', (done: DoneFn) => {
      const error = new Error('Network error');
      mockApiService.post.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      service.getCustomerConsigneeProductDetails(query, take, skip).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error loading customer consignee product details:',
            error
          );
          done();
        }
      });
    });
  });

  describe('getCustomerConsigneeProductDetail', () => {
    const customerId = 'CUST001';

    it('should return first data item when data array is present', (done: DoneFn) => {
      const apiResponse: ReturnResult<CustomerConsigneeProductDetailsDto> = {
        success: true,
        data: [mockDetail, mockDetail2]
      };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getCustomerConsigneeProductDetail(customerId, 'CON001', 'WB', 'PC001').subscribe(result => {
        expect(result).toEqual(mockDetail);
        expect(mockApiService.get).toHaveBeenCalled();
        const callArgs = mockApiService.get.calls.mostRecent().args;
        expect(callArgs[0]).toBe(API.CUSTOMER_CONSIGNEE_PRODUCT.GET_BY_ID(customerId));
        const params = callArgs[1]?.params as HttpParams;
        expect(params.get('consigneeId')).toBe('CON001');
        expect(params.get('productType')).toBe('WB');
        expect(params.get('productCode')).toBe('PC001');
        done();
      });
    });

    it('should fall back to item when data array is empty', (done: DoneFn) => {
      const apiResponse: ReturnResult<CustomerConsigneeProductDetailsDto> = {
        success: true,
        data: [],
        item: mockDetail
      };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getCustomerConsigneeProductDetail(customerId).subscribe(result => {
        expect(result).toEqual(mockDetail);
        done();
      });
    });

    it('should fall back to item when data is undefined', (done: DoneFn) => {
      const apiResponse: ReturnResult<CustomerConsigneeProductDetailsDto> = {
        success: true,
        data: undefined,
        item: mockDetail
      };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getCustomerConsigneeProductDetail(customerId).subscribe(result => {
        expect(result).toEqual(mockDetail);
        done();
      });
    });



    it('should set only provided optional params', (done: DoneFn) => {
      const apiResponse: ReturnResult<CustomerConsigneeProductDetailsDto> = {
        success: true,
        data: [mockDetail]
      };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getCustomerConsigneeProductDetail(customerId, 'CON001', null, 'PC001').subscribe(() => {
        const callArgs = mockApiService.get.calls.mostRecent().args;
        const params = callArgs[1]?.params as HttpParams;
        expect(params.get('consigneeId')).toBe('CON001');
        expect(params.has('productType')).toBeFalse();
        expect(params.get('productCode')).toBe('PC001');
        done();
      });
    });

    it('should log error and rethrow on failure', (done: DoneFn) => {
      const error = new Error('Server error');
      mockApiService.get.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      service.getCustomerConsigneeProductDetail(customerId).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error loading customer consignee product detail:',
            error
          );
          done();
        }
      });
    });
  });

  describe('createCustomerConsigneeProduct', () => {
    const dto: CreateCustomerConsigneeProductRequestDto = {
      customerId: 'CUST001',
      consigneeId: 'CON001',
      productType: 'WB',
      productCode: 'PC001',
      effDate: '2024-01-01',
      termDate: '2024-12-31'
    };

    it('should post and return result on success', (done: DoneFn) => {
      const apiResponse: ReturnResult<void> = { success: true, message: 'Created' };
      mockApiService.post.and.returnValue(of(apiResponse));

      service.createCustomerConsigneeProduct(dto).subscribe(result => {
        expect(result).toEqual(apiResponse);
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.CUSTOMER_CONSIGNEE_PRODUCT.CREATE,
          dto
        );
        done();
      });
    });

    it('should log error and rethrow on failure', (done: DoneFn) => {
      const error = new Error('Create failed');
      mockApiService.post.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      service.createCustomerConsigneeProduct(dto).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error creating customer consignee product:',
            error
          );
          done();
        }
      });
    });
  });

  describe('updateCustomerConsigneeProduct', () => {
    const customerId = 'CUST001';
    const consigneeId = 'CON001';
    const origProdType = 'WB';
    const origProdCode = 'PC001';
    const dto: UpdateCustomerConsigneeProductRequestDto = {
      productType: 'PLT',
      productCode: 'PC002',
      effDate: '2024-03-01',
      termDate: null
    };

    it('should put with all params and return result on success', (done: DoneFn) => {
      const apiResponse: ReturnResult<void> = { success: true, message: 'Updated' };
      mockApiService.put.and.returnValue(of(apiResponse));

      service.updateCustomerConsigneeProduct(customerId, consigneeId, origProdType, origProdCode, dto)
        .subscribe(result => {
          expect(result).toEqual(apiResponse);
          const callArgs = mockApiService.put.calls.mostRecent().args;
          expect(callArgs[0]).toBe(API.CUSTOMER_CONSIGNEE_PRODUCT.UPDATE(customerId));
          expect(callArgs[1]).toBe(dto);
          const params = callArgs[2]?.params as HttpParams;
          expect(params.get('consigneeId')).toBe(consigneeId);
          expect(params.get('originalProductType')).toBe(origProdType);
          expect(params.get('originalProductCode')).toBe(origProdCode);
          done();
        });
    });


    it('should set only provided optional params', (done: DoneFn) => {
      const apiResponse: ReturnResult<void> = { success: true };
      mockApiService.put.and.returnValue(of(apiResponse));

      service.updateCustomerConsigneeProduct(customerId, consigneeId, null, origProdCode, dto)
        .subscribe(() => {
          const callArgs = mockApiService.put.calls.mostRecent().args;
          const params = callArgs[2]?.params as HttpParams;
          expect(params.get('consigneeId')).toBe(consigneeId);
          expect(params.has('originalProductType')).toBeFalse();
          expect(params.get('originalProductCode')).toBe(origProdCode);
          done();
        });
    });

    it('should log error and rethrow on failure', (done: DoneFn) => {
      const error = new Error('Update failed');
      mockApiService.put.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      service.updateCustomerConsigneeProduct(customerId, consigneeId, origProdType, origProdCode, dto)
        .subscribe({
          next: () => fail('expected error'),
          error: (err) => {
            expect(err).toBe(error);
            expect(console.error).toHaveBeenCalledWith(
              'Error updating customer consignee product:',
              error
            );
            done();
          }
        });
    });
  });

  describe('getCustomers', () => {
    it('should return customer list on success', (done: DoneFn) => {
      const customers: CustomerLOV[] = [
        { customerId: 'CUST001', name: 'Customer 1' },
        { customerId: 'CUST002', name: 'Customer 2' }
      ];
      const apiResponse: ReturnResult<CustomerLOV> = { success: true, data: customers };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getCustomers().subscribe(result => {
        expect(result).toEqual(customers);
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.CUSTOMER_CONSIGNEE_PRODUCT.LOOKUP_CUSTOMERS
        );
        done();
      });
    });


    it('should log error and rethrow on failure', (done: DoneFn) => {
      const error = new Error('Customers fetch error');
      mockApiService.get.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      service.getCustomers().subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith('Error loading customers:', error);
          done();
        }
      });
    });
  });

  describe('getConsigneesByCustomer', () => {
    const customerId = 'CUST001';

    it('should return consignee list on success', (done: DoneFn) => {
      const consignees: ConsigneeLOV[] = [
        { consigneeId: 'CON001', name: 'Consignee 1' },
        { consigneeId: 'CON002', name: 'Consignee 2' }
      ];
      const apiResponse: ReturnResult<ConsigneeLOV> = { success: true, data: consignees };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getConsigneesByCustomer(customerId).subscribe(result => {
        expect(result).toEqual(consignees);
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.CUSTOMER_CONSIGNEE_PRODUCT.LOOKUP_CONSIGNEES(customerId)
        );
        done();
      });
    });


    it('should log error and rethrow on failure', (done: DoneFn) => {
      const error = new Error('Consignees fetch error');
      mockApiService.get.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      service.getConsigneesByCustomer(customerId).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith('Error loading consignees:', error);
          done();
        }
      });
    });
  });

  describe('getProductTypes', () => {
    it('should return product types on success', (done: DoneFn) => {
      const productTypes: ProductTypeLOV[] = [
        { productType: 'WB', description: 'Whole Blood' },
        { productType: 'PLT', description: 'Platelets' }
      ];
      const apiResponse: ReturnResult<ProductTypeLOV> = { success: true, data: productTypes };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getProductTypes().subscribe(result => {
        expect(result).toEqual(productTypes);
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.CUSTOMER_CONSIGNEE_PRODUCT.LOOKUP_PRODUCT_TYPES
        );
        done();
      });
    });


    it('should log error and rethrow on failure', (done: DoneFn) => {
      const error = new Error('Product types fetch error');
      mockApiService.get.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      service.getProductTypes().subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith('Error loading product types:', error);
          done();
        }
      });
    });
  });

  describe('getProductCodes', () => {
    it('should return product codes on success', (done: DoneFn) => {
      const productCodes: ProductCodeLOV[] = [
        { productCode: 'PC001', description: 'Product Code 001' },
        { productCode: 'PC002', description: 'Product Code 002' }
      ];
      const apiResponse: ReturnResult<ProductCodeLOV> = { success: true, data: productCodes };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getProductCodes().subscribe(result => {
        expect(result).toEqual(productCodes);
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.CUSTOMER_CONSIGNEE_PRODUCT.LOOKUP_PRODUCT_CODES
        );
        done();
      });
    });


    it('should log error and rethrow on failure', (done: DoneFn) => {
      const error = new Error('Product codes fetch error');
      mockApiService.get.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      service.getProductCodes().subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith('Error loading product codes:', error);
          done();
        }
      });
    });
  });
});
