import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PackLabDiscardsService } from './pack-lab-discards.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  Consignee,
  Order,
  ProductType,
  DiscardType,
  Box,
  TestId,
  BoxContent,
  AvailableProduct,
  UnitProduct,
  PackProductRequest,
  PackProductResponse,
  ApiResponse,
  BarcodeScheme,
} from '../models/pack-lab-discards.model';


describe('PackLabDiscardsService', () => {
  let service: PackLabDiscardsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  // Mock data
  const mockConsignees: Consignee[] = [
    {
      consigneeId: 'CONS001',
      shortName: 'Acme Disposal',
      address1: '123 Main St',
      city: 'Boston',
      state: 'MA',
      customerId: 'CUST001',
    },
  ];

  const mockOrders: Order[] = [
    {
      orderNo: 'LD20240601001',
      orderType: 'LD',
      orderStatus: 'OP',
      insertDate: '2024-06-01T12:00:00Z',
    },
  ];

  const mockProductTypes: ProductType[] = [
    { productType: 'PLT', productDesc: 'Platelets' },
    { productType: 'RBC', productDesc: 'Red Blood Cells' },
  ];

  const mockDiscardTypes: DiscardType[] = [
    { discardType: 'NFT', discardTypeDesc: 'Not Fit for Transfusion' },
    { discardType: 'BIO', discardTypeDesc: 'Biohazard' },
  ];

  const mockBoxes: Box[] = [
    { boxId: 'BX001', boxStatus: 'Open', consigneeId: 'CONS001' },
  ];

  const mockTestIds: TestId[] = [
    { testId: 'VIRAL001', testDesc: 'Viral Marker Test', testGroup: 'VIRAL' },
  ];

  const mockBoxContents: BoxContent[] = [
    {
      unitId: 'UNIT12345',
      collDate: '2024-05-15T00:00:00Z',
      productType: 'PLT',
      productCode: 'PROD001',
      aboDesc: 'O Positive - NFT',
      bloodType: 'O+',
      productDesc: 'Platelets Apheresis',
    },
  ];

  const mockAvailableProducts: AvailableProduct[] = [
    {
      unitId: 'UNIT12345',
      collDate: '2024-05-15T00:00:00Z',
      productType: 'PLT',
      productCode: 'PROD001',
      systemLabelDecision: 'O+',
      aboDesc: 'O Positive - NFT',
      productDesc: 'Platelets Apheresis',
    },
  ];

  const mockUnitProducts: UnitProduct[] = [
    {
      unitId: 'UNIT12345',
      productCode: 'PROD001',
      productDesc: 'Platelets Apheresis',
      productType: 'PLT',
      componentPrefix: 'CP01',
      systemLabelDecision: 'O+',
      aboDesc: 'O Positive',
      collDate: '2024-05-15T00:00:00Z',
    },
  ];

  const mockPackResponse: PackProductResponse = {
    boxId: 'BX001',
    pickSlipId: 'PS001',
    orderNo: 'LD001',
    unitId: 'UNIT12345',
    productCode: 'PROD001',
    message: 'Product packed successfully',
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        PackLabDiscardsService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(PackLabDiscardsService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getConsignees', () => {
    it('should extract consignees from wrapped response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockConsignees }));

      service.getConsignees().subscribe((data) => {
        expect(data).toEqual(mockConsignees);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.PACK_LAB_DISCARDS.CONSIGNEES, jasmine.objectContaining({ params: jasmine.any(Object) }));
        done();
      });
    });

    it('should extract consignees from plain array response', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockConsignees));

      service.getConsignees('DI').subscribe((data) => {
        expect(data).toEqual(mockConsignees);
        done();
      });
    });

    it('should extract consignees from nested data.data response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: { data: mockConsignees } }));

      service.getConsignees('BI').subscribe((data) => {
        expect(data).toEqual(mockConsignees);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getConsignees().subscribe({
        error: (err) => {
          expect(err.message).toBe('Network error');
          done();
        },
      });
    });
  });

  describe('getOrders', () => {
    it('should extract orders from wrapped response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockOrders }));
      service.getOrders('CONS001').subscribe((data) => {
        expect(data).toEqual(mockOrders);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.PACK_LAB_DISCARDS.ORDERS('CONS001'));
        done();
      });
    });

    it('should extract orders from plain array', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockOrders));
      service.getOrders('CONS001').subscribe((data) => {
        expect(data).toEqual(mockOrders);
        done();
      });
    });

    it('should return empty array when response is not array-like', (done) => {
      apiServiceSpy.get.and.returnValue(of({ message: 'no data' }));
      service.getOrders('CONS001').subscribe((data) => {
        expect(data).toEqual([]);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Server error')));

      service.getOrders('CONS001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Server error');
          done();
        },
      });
    });
  });

  describe('getProductTypes', () => {
    it('should extract product types from wrapped response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockProductTypes }));
      service.getProductTypes().subscribe((data) => {
        expect(data).toEqual(mockProductTypes);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.PACK_LAB_DISCARDS.PRODUCT_TYPES);
        done();
      });
    });

    it('should extract product types from plain array', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockProductTypes));
      service.getProductTypes().subscribe((data) => {
        expect(data).toEqual(mockProductTypes);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Server error')));

      service.getProductTypes().subscribe({
        error: (err) => {
          expect(err.message).toBe('Server error');
          done();
        },
      });
    });
  });

  describe('getDiscardTypes', () => {
    it('should extract discard types from wrapped response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockDiscardTypes }));
      service.getDiscardTypes().subscribe((data) => {
        expect(data).toEqual(mockDiscardTypes);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.PACK_LAB_DISCARDS.DISCARD_TYPES);
        done();
      });
    });

    it('should extract discard types from plain array', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockDiscardTypes));
      service.getDiscardTypes().subscribe((data) => {
        expect(data).toEqual(mockDiscardTypes);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Server error')));

      service.getDiscardTypes().subscribe({
        error: (err) => {
          expect(err.message).toBe('Server error');
          done();
        },
      });
    });
  });

  describe('getBoxes', () => {
    it('should extract boxes from wrapped response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockBoxes }));
      service.getBoxes('CONS001').subscribe((data) => {
        expect(data).toEqual(mockBoxes);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.PACK_LAB_DISCARDS.BOXES('CONS001'));
        done();
      });
    });

    it('should extract boxes from plain array', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockBoxes));
      service.getBoxes('CONS001').subscribe((data) => {
        expect(data).toEqual(mockBoxes);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Server error')));

      service.getBoxes('CONS001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Server error');
          done();
        },
      });
    });
  });

  describe('getTestIds', () => {
    it('should extract test IDs from wrapped response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockTestIds }));
      service.getTestIds().subscribe((data) => {
        expect(data).toEqual(mockTestIds);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.PACK_LAB_DISCARDS.TEST_IDS);
        done();
      });
    });

    it('should extract test IDs from plain array', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockTestIds));
      service.getTestIds().subscribe((data) => {
        expect(data).toEqual(mockTestIds);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Server error')));

      service.getTestIds().subscribe({
        error: (err) => {
          expect(err.message).toBe('Server error');
          done();
        },
      });
    });
  });

  describe('getBoxContents', () => {
    it('should extract box contents from wrapped response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockBoxContents }));
      service.getBoxContents('BX001').subscribe((data) => {
        expect(data).toEqual(mockBoxContents);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.PACK_LAB_DISCARDS.BOX_CONTENTS('BX001'));
        done();
      });
    });

    it('should extract box contents from plain array', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockBoxContents));
      service.getBoxContents('BX001').subscribe((data) => {
        expect(data).toEqual(mockBoxContents);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Server error')));

      service.getBoxContents('BX001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Server error');
          done();
        },
      });
    });
  });

  describe('getUnitProducts', () => {
    it('should fetch unit products with all optional params', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockUnitProducts }));

      service.getUnitProducts('UNIT12345', 'PLT', 'NFT', 'CONS001').subscribe((data) => {
        expect(data).toEqual(mockUnitProducts);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.PACK_LAB_DISCARDS.UNIT_PRODUCTS('UNIT12345'),
          jasmine.objectContaining({ params: jasmine.any(Object) })
        );
        done();
      });
    });

    it('should fetch unit products without optional params', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockUnitProducts));

      service.getUnitProducts('UNIT12345').subscribe((data) => {
        expect(data).toEqual(mockUnitProducts);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.PACK_LAB_DISCARDS.UNIT_PRODUCTS('UNIT12345'),
          jasmine.objectContaining({ params: jasmine.any(Object) })
        );
        done();
      });
    });

    it('should fetch unit products with only productType param', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockUnitProducts }));

      service.getUnitProducts('UNIT12345', 'PLT').subscribe((data) => {
        expect(data).toEqual(mockUnitProducts);
        done();
      });
    });

    it('should return empty array for non-array response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: 'No products' }));

      service.getUnitProducts('UNIT12345').subscribe((data) => {
        expect(data).toEqual([]);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Unit not found')));

      service.getUnitProducts('INVALID').subscribe({
        error: (err) => {
          expect(err.message).toBe('Unit not found');
          done();
        },
      });
    });
  });

  describe('getAvailableProducts', () => {
    it('should extract available products from wrapped response', (done) => {
      const request = { productType: 'PLT', discardType: 'NFT' };
      apiServiceSpy.post.and.returnValue(of({ data: mockAvailableProducts }));
      service.getAvailableProducts(request).subscribe((data) => {
        expect(data).toEqual(mockAvailableProducts);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(API.PACK_LAB_DISCARDS.AVAILABLE_PRODUCTS, request);
        done();
      });
    });

    it('should extract available products from plain array', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockAvailableProducts));
      service.getAvailableProducts({}).subscribe((data) => {
        expect(data).toEqual(mockAvailableProducts);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('Server error')));

      service.getAvailableProducts({ productType: 'PLT' }).subscribe({
        error: (err) => {
          expect(err.message).toBe('Server error');
          done();
        },
      });
    });
  });

  describe('packProduct', () => {
    it('should pack a product successfully', (done) => {
      const request: PackProductRequest = {
        consigneeId: 'CONS001',
        discardType: 'NFT',
        unitId: 'UNIT12345',
        productCode: 'PROD0001',
        bloodType: 'O+',
        barcodeScheme: BarcodeScheme.CODE128,
      };

      const response: ApiResponse<PackProductResponse> = {
        success: true,
        statusCode: 201,
        message: 'Product packed successfully',
        data: mockPackResponse,
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.packProduct(request).subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockPackResponse);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(API.PACK_LAB_DISCARDS.PACK, request);
        done();
      });
    });

    it('should pack a BIO product with test IDs', (done) => {
      const request: PackProductRequest = {
        consigneeId: 'CONS001',
        discardType: 'BIO',
        unitId: 'UNIT67890',
        productCode: 'PROD0002',
        bloodType: 'A+',
        testIds: ['VIRAL001', 'MAN001'],
        barcodeScheme: BarcodeScheme.CODE128,
      };

      const response: ApiResponse<PackProductResponse> = {
        success: true,
        statusCode: 201,
        message: 'Product packed successfully',
        data: mockPackResponse,
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.packProduct(request).subscribe((data) => {
        expect(data.success).toBe(true);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(API.PACK_LAB_DISCARDS.PACK, request);
        done();
      });
    });

    it('should normalize response via extractResponse fallback when response lacks success+data shape', (done) => {
      const request: PackProductRequest = {
        consigneeId: 'CONS001',
        discardType: 'NFT',
        unitId: 'UNIT12345',
        productCode: 'PROD0001',
        bloodType: 'O+',
      };

      // Response has item instead of data, and no success key -- triggers fallback
      const rawResponse = { item: mockPackResponse, statusCode: 200 };
      apiServiceSpy.post.and.returnValue(of(rawResponse));

      service.packProduct(request).subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.statusCode).toBe(200);
        expect(data.message).toBe('Success');
        expect(data.data).toEqual(mockPackResponse);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      const request: PackProductRequest = {
        consigneeId: 'CONS001',
        discardType: 'NFT',
        unitId: 'UNIT12345',
        productCode: 'PROD0001',
        bloodType: 'O+',
      };

      apiServiceSpy.post.and.returnValue(throwError(() => new Error('Pack failed')));

      service.packProduct(request).subscribe({
        error: (err) => {
          expect(err.message).toBe('Pack failed');
          done();
        },
      });
    });
  });

  describe('closeBox', () => {
    it('should close a box successfully with wrapped response', (done) => {
      const response = { success: true, statusCode: 200, message: 'Box closed', data: true };
      apiServiceSpy.post.and.returnValue(of(response));

      service.closeBox('BX001', 'Y').subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toBe(true);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.PACK_LAB_DISCARDS.CLOSE_BOX('BX001'),
          { confirmation: 'Y' }
        );
        done();
      });
    });

    it('should handle box not found error', (done) => {
      const response = { success: false, statusCode: 404, message: 'Box not found', data: false };
      apiServiceSpy.post.and.returnValue(of(response));

      service.closeBox('INVALID_BOX', 'Y').subscribe((data) => {
        expect(data.success).toBe(false);
        done();
      });
    });

    it('should handle decline confirmation', (done) => {
      const response = { success: true, statusCode: 200, message: 'Cancelled', data: false };
      apiServiceSpy.post.and.returnValue(of(response));

      service.closeBox('BX001', 'N').subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toBe(false);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.PACK_LAB_DISCARDS.CLOSE_BOX('BX001'),
          { confirmation: 'N' }
        );
        done();
      });
    });

    it('should propagate error from API', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('Server error')));

      service.closeBox('BX001', 'Y').subscribe({
        error: (err) => {
          expect(err.message).toBe('Server error');
          done();
        },
      });
    });
  });

  describe('unpackProduct', () => {
    it('should unpack a product without aliquot', (done) => {
      const response = { success: true, statusCode: 200, message: 'Unpacked', data: true };
      apiServiceSpy.delete.and.returnValue(of(response));

      service.unpackProduct('UNIT12345', 'PROD001').subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toBe(true);
        expect(apiServiceSpy.delete).toHaveBeenCalledWith(
          API.PACK_LAB_DISCARDS.UNPACK('UNIT12345', 'PROD001', undefined)
        );
        done();
      });
    });

    it('should unpack a product with aliquot', (done) => {
      const response = { success: true, statusCode: 200, message: 'Unpacked', data: true };
      apiServiceSpy.delete.and.returnValue(of(response));

      service.unpackProduct('UNIT12345', 'PROD001', 'ALQ01').subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toBe(true);
        expect(apiServiceSpy.delete).toHaveBeenCalledWith(
          API.PACK_LAB_DISCARDS.UNPACK('UNIT12345', 'PROD001', 'ALQ01')
        );
        done();
      });
    });

    it('should normalize response via extractResponse fallback', (done) => {
      // Response without explicit success key triggers fallback branch
      const rawResponse = { data: true };
      apiServiceSpy.delete.and.returnValue(of(rawResponse));

      service.unpackProduct('UNIT12345', 'PROD001').subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.statusCode).toBe(200);
        expect(data.message).toBe('Success');
        expect(data.data).toBe(true);
        done();
      });
    });

    it('should handle error response from API', (done) => {
      const response = {
        success: false,
        statusCode: 404,
        message: 'Product not found',
        data: false,
        errorCode: '0312',
        errorResponse: { errorCode: '0312', error: 'Invalid unit ID' },
      };
      apiServiceSpy.delete.and.returnValue(of(response));

      service.unpackProduct('INVALID', 'PROD001').subscribe((data) => {
        expect(data.success).toBe(false);
        expect(data.errorCode).toBe('0312');
        expect(data.errorResponse).toEqual({ errorCode: '0312', error: 'Invalid unit ID' });
        done();
      });
    });

    it('should propagate thrown error from API', (done) => {
      apiServiceSpy.delete.and.returnValue(throwError(() => new Error('Delete failed')));

      service.unpackProduct('UNIT12345', 'PROD001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Delete failed');
          done();
        },
      });
    });
  });

  describe('extractArray edge cases (via public methods)', () => {
    it('should return empty array for null response', (done) => {
      apiServiceSpy.get.and.returnValue(of(null));

      service.getProductTypes().subscribe((data) => {
        expect(data).toEqual([]);
        done();
      });
    });

    it('should return empty array for string response', (done) => {
      apiServiceSpy.get.and.returnValue(of('unexpected'));

      service.getDiscardTypes().subscribe((data) => {
        expect(data).toEqual([]);
        done();
      });
    });

    it('should extract from nested data.data structure', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: { data: mockTestIds } }));

      service.getTestIds().subscribe((data) => {
        expect(data).toEqual(mockTestIds);
        done();
      });
    });
  });

  describe('extractResponse edge cases (via public methods)', () => {
    it('should build response from raw object lacking success and data keys', (done) => {
      // Raw response with no success, no data, no item -- falls through to using response itself as data
      const rawResponse = { boxId: 'BX001', message: 'done' };
      apiServiceSpy.post.and.returnValue(of(rawResponse));

      service.closeBox('BX001', 'Y').subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.statusCode).toBe(200);
        expect(data.data).toEqual(rawResponse as any);
        done();
      });
    });

    it('should prefer item property when data is absent', (done) => {
      const rawResponse = { item: { boxId: 'BX002' }, statusCode: 201 };
      apiServiceSpy.post.and.returnValue(of(rawResponse));

      service.closeBox('BX002', 'Y').subscribe((data) => {
        expect(data.data).toEqual({ boxId: 'BX002' } as any);
        expect(data.statusCode).toBe(201);
        done();
      });
    });
  });
});
