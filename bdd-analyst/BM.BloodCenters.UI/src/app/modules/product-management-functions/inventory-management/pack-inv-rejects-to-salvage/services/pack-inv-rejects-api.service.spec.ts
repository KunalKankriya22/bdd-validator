import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { PackInvRejectsApiService } from './pack-inv-rejects-api.service';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ConsigneeLovDto,
  OrderLovDto,
  ProductTypeLovDto,
  ProductCodeLovDto,
  BloodTypeLovDto,
  BoxLovDto,
  DiscardProductDto,
  ValidateUnitResponseDto,
  ValidateConsigneeRequestDto,
  ValidateConsigneeResponseDto,
  ValidateProductRequestDto,
  PackProductsRequestDto,
  PackProductsResponseDto,
  PackInvRejectsQueryDto,
  CreateNewBoxDto,
  CreateNewBoxResponseDto,
  ApiResponse
} from '../models/pack-inv-rejects.model';

describe('PackInvRejectsApiService', () => {
  let service: PackInvRejectsApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${API.PACK_INV_REJECTS_TO_SALVAGE.BASE}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PackInvRejectsApiService]
    });

    service = TestBed.inject(PackInvRejectsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── validateUnit ──────────────────────────────────────────────────────

  describe('validateUnit', () => {
    it('should POST unitId and return mapped data', () => {
      const mockResponse: ValidateUnitResponseDto = { isValid: true, errorMessage: null };

      service.validateUnit('U001').subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-unit`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ unitId: 'U001' });
      req.flush({ success: true, statusCode: 200, message: 'ok', data: mockResponse } as ApiResponse<ValidateUnitResponseDto>);
    });

    it('should propagate HTTP error', () => {
      service.validateUnit('BAD').subscribe({
        next: () => fail('expected error'),
        error: (err) => expect(err.status).toBe(400)
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-unit`);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  // ── getConsignees ─────────────────────────────────────────────────────

  describe('getConsignees', () => {
    it('should fetch consignees with default parameters', () => {
      const mockData: ConsigneeLovDto[] = [
        {
          consigneeId: 'CONS01',
          customerId: 'CUST01',
          customerType: 'RD',
          customerName: 'Test Customer',
          shortName: 'TC',
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          fullAddress: '123 Main St, Springfield, IL'
        }
      ];

      service.getConsignees().subscribe(data => {
        expect(data).toEqual(mockData);
        expect(data.length).toBe(1);
      });

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/consignees` && r.params.get('discardOption') === 'ALL'
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Successfully fetched consignees',
        data: mockData
      } as ApiResponse<ConsigneeLovDto[]>);
    });

    it('should fetch consignees with search text', () => {
      const mockData: ConsigneeLovDto[] = [];

      service.getConsignees('test').subscribe(data => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/consignees`
        && r.params.get('discardOption') === 'ALL'
        && r.params.get('searchText') === 'test'
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Successfully fetched consignees',
        data: mockData
      } as ApiResponse<ConsigneeLovDto[]>);
    });
  });

  // ── validateConsignee ─────────────────────────────────────────────────

  describe('validateConsignee', () => {
    it('should validate consignee successfully', () => {
      const request: ValidateConsigneeRequestDto = {
        consigneeId: 'CONS01',
        rejectOption: 'ALL'
      };

      const mockResponse: ValidateConsigneeResponseDto = {
        consigneeId: 'CONS01',
        customerId: 'CUST01',
        customerType: 'RD',
        fullAddress: '123 Main St, Springfield, IL',
        hasContract: true
      };

      service.validateConsignee(request).subscribe(data => {
        expect(data).toEqual(mockResponse);
        expect(data.hasContract).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-consignee`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Consignee validated successfully',
        data: mockResponse
      } as ApiResponse<ValidateConsigneeResponseDto>);
    });
  });

  // ── getOrders ─────────────────────────────────────────────────────────

  describe('getOrders', () => {
    it('should fetch orders for consignee', () => {
      const mockData: OrderLovDto[] = [
        {
          orderNo: 'ORD001',
          customerId: 'CUST01',
          consigneeId: 'CONS01',
          orderType: 'ID',
          orderClass: 'routine',
          orderStatus: 'open'
        }
      ];

      service.getOrders('CUST01', 'CONS01').subscribe(data => {
        expect(data).toEqual(mockData);
        expect(data.length).toBe(1);
      });

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/orders`
        && r.params.get('customerId') === 'CUST01'
        && r.params.get('consigneeId') === 'CONS01'
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Successfully fetched discard orders',
        data: mockData
      } as ApiResponse<OrderLovDto[]>);
    });
  });

  // ── getProductTypes ───────────────────────────────────────────────────

  describe('getProductTypes', () => {
    it('should fetch product types', () => {
      const mockData: ProductTypeLovDto[] = [
        {
          productType: 'RBC',
          description: 'Red Blood Cells'
        },
        {
          productType: 'PLT',
          description: 'Platelets'
        }
      ];

      service.getProductTypes('CUST01', 'CONS01').subscribe(data => {
        expect(data).toEqual(mockData);
        expect(data.length).toBe(2);
      });

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/product-types`
        && r.params.get('customerId') === 'CUST01'
        && r.params.get('consigneeId') === 'CONS01'
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Successfully fetched product types',
        data: mockData
      } as ApiResponse<ProductTypeLovDto[]>);
    });
  });

  // ── getProductCodes ───────────────────────────────────────────────────

  describe('getProductCodes', () => {
    it('should fetch product codes with all query params', () => {
      const mockData: ProductCodeLovDto[] = [
        { productCode: 'E1234567', shortName: 'RBC-LR' },
        { productCode: 'E7654321', shortName: 'PLT-AP' }
      ];

      service.getProductCodes('U001', 'CUST01', 'CONS01', 'ISBT').subscribe(data => {
        expect(data).toEqual(mockData);
        expect(data.length).toBe(2);
      });

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/product-codes`
        && r.params.get('unitId') === 'U001'
        && r.params.get('customerId') === 'CUST01'
        && r.params.get('consigneeId') === 'CONS01'
        && r.params.get('codeScheme') === 'ISBT'
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'ok',
        data: mockData
      } as ApiResponse<ProductCodeLovDto[]>);
    });

    it('should propagate HTTP error', () => {
      service.getProductCodes('U001', 'CUST01', 'CONS01', 'ISBT').subscribe({
        next: () => fail('expected error'),
        error: (err) => expect(err.status).toBe(500)
      });

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/product-codes`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ── getBloodTypes ─────────────────────────────────────────────────────

  describe('getBloodTypes', () => {
    it('should fetch blood types with query params', () => {
      const mockData: BloodTypeLovDto[] = [
        { aboDesc: 'O Positive' },
        { aboDesc: 'A Negative' }
      ];

      service.getBloodTypes('U001', 'E1234567', 'ISBT').subscribe(data => {
        expect(data).toEqual(mockData);
        expect(data.length).toBe(2);
      });

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/blood-types`
        && r.params.get('unitId') === 'U001'
        && r.params.get('productCode') === 'E1234567'
        && r.params.get('codeScheme') === 'ISBT'
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'ok',
        data: mockData
      } as ApiResponse<BloodTypeLovDto[]>);
    });

    it('should propagate HTTP error', () => {
      service.getBloodTypes('U001', 'E1234567', 'ISBT').subscribe({
        next: () => fail('expected error'),
        error: (err) => expect(err.status).toBe(404)
      });

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/blood-types`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ── getBoxes ──────────────────────────────────────────────────────────

  describe('getBoxes', () => {
    it('should fetch boxes without product type filter', () => {
      const mockData: BoxLovDto[] = [
        {
          boxId: 'BOX001',
          discardId: 'CONS01',
          boxStatus: 'open',
          productCount: 15
        }
      ];

      service.getBoxes('CONS01').subscribe(data => {
        expect(data).toEqual(mockData);
        expect(data[0].productCount).toBe(15);
      });

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/open-boxes`
        && r.params.get('consigneeId') === 'CONS01'
        && !r.params.has('productType')
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Successfully fetched open boxes',
        data: mockData
      } as ApiResponse<BoxLovDto[]>);
    });

    it('should fetch boxes with product type filter', () => {
      const mockData: BoxLovDto[] = [];

      service.getBoxes('CONS01', 'RBC').subscribe(data => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/open-boxes`
        && r.params.get('consigneeId') === 'CONS01'
        && r.params.get('productType') === 'RBC'
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Successfully fetched open boxes',
        data: mockData
      } as ApiResponse<BoxLovDto[]>);
    });
  });

  // ── getBoxContents ────────────────────────────────────────────────────

  describe('getBoxContents', () => {
    it('should fetch box contents using BOX_CONTENTS url', () => {
      const boxId = 'BOX001';
      const mockData: DiscardProductDto[] = [
        {
          unitId: 'U001',
          productCode: 'E1234567',
          aliquot: '00',
          chapterId: 'CH01',
          bloodType: 'O+',
          productType: 'RBC',
          productStatus: 'PK',
          collDate: '2024-01-01T00:00:00Z',
          expDate: '2024-03-01T00:00:00Z',
          boxId: 'BOX001',
          warehouseId: '1',
          discardType: 'RE',
          chkDigit: '12',
          productDesc: 'Red Cells',
          aboDesc: 'O Positive'
        }
      ];

      service.getBoxContents(boxId).subscribe(data => {
        expect(data).toEqual(mockData);
        expect(data.length).toBe(1);
      });

      const expectedUrl = `${environment.apiUrl}${API.PACK_INV_REJECTS_TO_SALVAGE.BOX_CONTENTS(boxId)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'ok',
        data: mockData
      } as ApiResponse<DiscardProductDto[]>);
    });

    it('should propagate HTTP error', () => {
      service.getBoxContents('MISSING').subscribe({
        next: () => fail('expected error'),
        error: (err) => expect(err.status).toBe(404)
      });

      const expectedUrl = `${environment.apiUrl}${API.PACK_INV_REJECTS_TO_SALVAGE.BOX_CONTENTS('MISSING')}`;
      const req = httpMock.expectOne(expectedUrl);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ── queryDiscardProducts ──────────────────────────────────────────────

  describe('queryDiscardProducts', () => {
    const queryDto: PackInvRejectsQueryDto = {
      consigneeId: 'CONS01',
      productType: 'RBC',
      productStatus: 'checked_in',
      sortColumn: 'UnitId',
      sortOrder: 'ASC'
    };

    const mockData: DiscardProductDto[] = [
      {
        unitId: '1234567890123456',
        productCode: 'E1234567',
        aliquot: '00',
        chapterId: 'CH01',
        bloodType: 'AB',
        productType: 'RBC',
        productStatus: 'CI',
        collDate: '2024-01-15T00:00:00Z',
        expDate: '2024-03-15T12:00:00Z',
        boxId: null,
        warehouseId: '1',
        discardType: 'RE',
        chkDigit: '12',
        productDesc: 'Red Cells',
        aboDesc: 'AB Positive'
      }
    ];

    it('should query discard products with pagination', () => {
      service.queryDiscardProducts(10, 0, queryDto).subscribe(result => {
        expect(result.data).toEqual(mockData);
        expect(result.totalCount).toBe(150);
      });

      const req = httpMock.expectOne(`${baseUrl}/discard-products/10/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(queryDto);
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Successfully fetched discard products',
        data: mockData,
        totalCount: 150
      } as ApiResponse<DiscardProductDto[]>);
    });

    it('should prefer response.total over response.totalCount', () => {
      service.queryDiscardProducts(5, 0, queryDto).subscribe(result => {
        expect(result.totalCount).toBe(200);
      });

      const req = httpMock.expectOne(`${baseUrl}/discard-products/5/0`);
      req.flush({
        success: true,
        statusCode: 200,
        message: 'ok',
        data: mockData,
        total: 200,
        totalCount: 150
      });
    });

    it('should default totalCount to 0 when neither total nor totalCount is present', () => {
      service.queryDiscardProducts(5, 0, queryDto).subscribe(result => {
        expect(result.totalCount).toBe(0);
      });

      const req = httpMock.expectOne(`${baseUrl}/discard-products/5/0`);
      req.flush({
        success: true,
        statusCode: 200,
        message: 'ok',
        data: mockData
      });
    });
  });

  // ── validateProduct ───────────────────────────────────────────────────

  describe('validateProduct', () => {
    it('should validate manual product', () => {
      const request: ValidateProductRequestDto = {
        unitId: '1234567890123456',
        productCode: 'E1234567',
        aliquot: '00',
        bloodType: 'AB',
        expDate: '2024-03-15T12:00:00'
      };

      const mockResponse: DiscardProductDto = {
        unitId: '1234567890123456',
        productCode: 'E1234567',
        aliquot: '00',
        chapterId: 'CH01',
        bloodType: 'AB',
        productType: 'RBC',
        productStatus: null,
        collDate: null,
        expDate: '2024-03-15T12:00:00Z',
        boxId: null,
        warehouseId: null,
        discardType: null,
        chkDigit: '12',
        productDesc: 'Red Cells',
        aboDesc: 'AB Positive'
      };

      service.validateProduct(request).subscribe(data => {
        expect(data).toEqual(mockResponse);
        expect(data.unitId).toBe(request.unitId);
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-product`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Product validated successfully',
        data: mockResponse
      } as ApiResponse<DiscardProductDto>);
    });
  });

  // ── packProducts ──────────────────────────────────────────────────────

  describe('packProducts', () => {
    it('should pack products to box successfully', () => {
      const request: PackProductsRequestDto = {
        boxId: 'BOX001',
        productKeys: [
          {
            unitId: '1234567890123456',
            productCode: 'E1234567',
            aliquot: '00',
            expDate: '2024-03-15T12:00:00'
          }
        ]
      };

      const mockResponse: PackProductsResponseDto = {
        boxId: 'BOX001',
        packedCount: 1,
        failedCount: 0
      };

      service.packProducts(request).subscribe(data => {
        expect(data).toEqual(mockResponse);
        expect(data.packedCount).toBe(1);
        expect(data.failedCount).toBe(0);
      });

      const req = httpMock.expectOne(`${baseUrl}/pack-product`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Successfully packed 1 product(s) to box BOX001',
        data: mockResponse
      } as ApiResponse<PackProductsResponseDto>);
    });
  });

  // ── closeBox ──────────────────────────────────────────────────────────

  describe('closeBox', () => {
    it('should close box with default allProperlyPacked=false', () => {
      service.closeBox('BOX001').subscribe(data => {
        expect(data).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/close-box`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ boxId: 'BOX001', allProperlyPacked: false });
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Box closed',
        data: undefined
      } as ApiResponse<void>);
    });

    it('should close box with allProperlyPacked=true', () => {
      service.closeBox('BOX002', true).subscribe(data => {
        expect(data).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/close-box`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ boxId: 'BOX002', allProperlyPacked: true });
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Box closed',
        data: undefined
      } as ApiResponse<void>);
    });

    it('should propagate HTTP error', () => {
      service.closeBox('BADBOX').subscribe({
        next: () => fail('expected error'),
        error: (err) => expect(err.status).toBe(409)
      });

      const req = httpMock.expectOne(`${baseUrl}/close-box`);
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });
    });
  });

  // ── createNewBox ──────────────────────────────────────────────────────

  describe('createNewBox', () => {
    it('should create a new box and return response', () => {
      const dto: CreateNewBoxDto = {
        currentBoxId: 'BOX001',
        closeCurrentBox: true,
        allProductsProperlyPacked: true,
        consigneeId: 'CONS01'
      };

      const mockResponse: CreateNewBoxResponseDto = { boxId: 'BOX002' };

      service.createNewBox(dto).subscribe(data => {
        expect(data).toEqual(mockResponse);
        expect(data.boxId).toBe('BOX002');
      });

      const req = httpMock.expectOne(`${baseUrl}/create-new-box`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Box created',
        data: mockResponse
      } as ApiResponse<CreateNewBoxResponseDto>);
    });

    it('should create a new box with null currentBoxId', () => {
      const dto: CreateNewBoxDto = {
        currentBoxId: null,
        closeCurrentBox: false,
        allProductsProperlyPacked: false,
        consigneeId: 'CONS01'
      };

      const mockResponse: CreateNewBoxResponseDto = { boxId: 'BOX003' };

      service.createNewBox(dto).subscribe(data => {
        expect(data.boxId).toBe('BOX003');
      });

      const req = httpMock.expectOne(`${baseUrl}/create-new-box`);
      expect(req.request.body.currentBoxId).toBeNull();
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Box created',
        data: mockResponse
      } as ApiResponse<CreateNewBoxResponseDto>);
    });

    it('should propagate HTTP error', () => {
      const dto: CreateNewBoxDto = {
        currentBoxId: null,
        closeCurrentBox: false,
        allProductsProperlyPacked: false,
        consigneeId: 'CONS01'
      };

      service.createNewBox(dto).subscribe({
        next: () => fail('expected error'),
        error: (err) => expect(err.status).toBe(500)
      });

      const req = httpMock.expectOne(`${baseUrl}/create-new-box`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ── unpackProduct ─────────────────────────────────────────────────────

  describe('unpackProduct', () => {
    it('should unpack product from box', () => {
      const productKey = {
        unitId: '1234567890123456',
        productCode: 'E1234567',
        aliquot: '00',
        expDate: '2024-03-15T12:00:00'
      };

      service.unpackProduct(productKey).subscribe(data => {
        expect(data).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/unpack`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(productKey);
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Product unpacked successfully',
        data: undefined
      } as ApiResponse<void>);
    });
  });
});
