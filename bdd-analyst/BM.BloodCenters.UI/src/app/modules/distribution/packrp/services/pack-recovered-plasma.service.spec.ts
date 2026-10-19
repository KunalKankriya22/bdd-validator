import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { PackRecoveredPlasmaService } from './pack-recovered-plasma.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  CustomerSelectionDto,
  OrderDto,
  PickSlipQueryDto,
  PickSlipDto,
  PickSlipsQueryResponseDto,
  CreatePickSlipRequestDto,
  CreatePickSlipResponseDto,
  BoxDto,
  CreateBoxRequestDto,
  CreateBoxResponseDto,
  PackProductRequestDto,
  PackProductResponseDto,
  UnpackProductRequestDto,
  UnpackProductResponseDto,
  ProductDto,
  PackedProductDto,
  ProductDetailDto
} from '../models/pack-recovered-plasma.model';

describe('PackRecoveredPlasmaService', () => {
  let service: PackRecoveredPlasmaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PackRecoveredPlasmaService]
    });

    service = TestBed.inject(PackRecoveredPlasmaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // -------------------------------------------------------
  // getCustomers
  // -------------------------------------------------------
  describe('getCustomers', () => {
    it('should fetch customers successfully', () => {
      const mockCustomers: CustomerSelectionDto[] = [
        {
          customerId: 'CUST001',
          customerName: 'Test Hospital',
          consigneeId: 'CONS001',
          consigneeName: 'Test Lab',
          contractNumber: 'CT-001',
          contractEffDate: '2024-01-01T00:00:00Z',
          contractTermDate: null,
          hasValidContract: true
        }
      ];

      service.getCustomers().subscribe(customers => {
        expect(customers).toEqual(mockCustomers);
      });

      const req = httpMock.expectOne(`${API.PACK_RECOVERED_PLASMA.CUSTOMERS}`);
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockCustomers
      });
    });

    it('should include search keyword in query params', () => {
      service.getCustomers('hospital').subscribe();

      const req = httpMock.expectOne(
        `${API.PACK_RECOVERED_PLASMA.CUSTOMERS}?searchKeyword=hospital`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: [] });
    });

    it('should return empty array when data is null', () => {
      service.getCustomers().subscribe(customers => {
        expect(customers).toEqual([]);
      });

      const req = httpMock.expectOne(`${API.PACK_RECOVERED_PLASMA.CUSTOMERS}`);
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should propagate HTTP error', () => {
      service.getCustomers().subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${API.PACK_RECOVERED_PLASMA.CUSTOMERS}`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // -------------------------------------------------------
  // getOrders
  // -------------------------------------------------------
  describe('getOrders', () => {
    it('should fetch orders for customer', () => {
      const mockOrders: OrderDto[] = [
        {
          orderId: 'ORD-001',
          customerId: 'CUST001',
          customerName: 'Test Hospital',
          consigneeId: 'CONS001',
          consigneeName: 'Test Lab',
          orderDate: '2024-05-15T00:00:00Z',
          status: 'OPEN',
          totalItems: 100,
          packedItems: 50,
          remainingItems: 50
        }
      ];

      service.getOrders('CUST001', 'CONS001').subscribe(orders => {
        expect(orders).toEqual(mockOrders);
      });

      const req = httpMock.expectOne(
        `${API.PACK_RECOVERED_PLASMA.ORDERS}?customerId=CUST001&consigneeId=CONS001`
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        data: mockOrders
      });
    });

    it('should return empty array when data is null', () => {
      service.getOrders('CUST001', 'CONS001').subscribe(orders => {
        expect(orders).toEqual([]);
      });

      const req = httpMock.expectOne(
        `${API.PACK_RECOVERED_PLASMA.ORDERS}?customerId=CUST001&consigneeId=CONS001`
      );
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should propagate HTTP error', () => {
      service.getOrders('CUST001', 'CONS001').subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(
        `${API.PACK_RECOVERED_PLASMA.ORDERS}?customerId=CUST001&consigneeId=CONS001`
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // -------------------------------------------------------
  // queryPickSlips
  // -------------------------------------------------------
  describe('queryPickSlips', () => {
    const filters: PickSlipQueryDto = {
      customerId: 'CUST001',
      status: 'OPEN',
      sortColumn: 'pickSlipId',
      sortOrder: 'ASC'
    };

    it('should query pick slips with filters and pagination', () => {
      const mockPickSlips: PickSlipDto[] = [
        {
          pickSlipId: 'PA-001',
          orderId: 'ORD-001',
          customerId: 'CUST001',
          customerName: 'Test Hospital',
          consigneeId: 'CONS001',
          consigneeName: 'Test Lab',
          productCode: 'RPL',
          aboType: 'O+',
          quantityOrdered: 100,
          quantityPacked: 50,
          status: 'OPEN'
        }
      ];

      service.queryPickSlips(10, 0, filters).subscribe(result => {
        expect(result.data).toEqual(mockPickSlips);
        expect(result.totalCount).toBe(1);
      });

      const req = httpMock.expectOne(API.PACK_RECOVERED_PLASMA.PICK_SLIPS_QUERY(10, 0));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(filters);
      req.flush({
        success: true,
        statusCode: 200,
        data: { data: mockPickSlips, totalCount: 1 }
      });
    });

    it('should return defaults when response data is null', () => {
      service.queryPickSlips(10, 0, filters).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalCount).toBe(0);
      });

      const req = httpMock.expectOne(API.PACK_RECOVERED_PLASMA.PICK_SLIPS_QUERY(10, 0));
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should return defaults when nested data/totalCount are missing', () => {
      service.queryPickSlips(5, 20, filters).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalCount).toBe(0);
      });

      const req = httpMock.expectOne(API.PACK_RECOVERED_PLASMA.PICK_SLIPS_QUERY(5, 20));
      req.flush({ success: true, statusCode: 200, data: {} });
    });

    it('should propagate HTTP error', () => {
      service.queryPickSlips(10, 0, filters).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.PACK_RECOVERED_PLASMA.PICK_SLIPS_QUERY(10, 0));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // -------------------------------------------------------
  // getPickSlipById
  // -------------------------------------------------------
  describe('getPickSlipById', () => {
    it('should fetch pick slip by ID', () => {
      const mockPickSlip: PickSlipDto = {
        pickSlipId: 'PA-001',
        orderId: 'ORD-001',
        customerId: 'CUST001',
        customerName: 'Test Hospital',
        consigneeId: 'CONS001',
        consigneeName: 'Test Lab',
        productCode: 'RPL',
        aboType: 'O+',
        quantityOrdered: 100,
        quantityPacked: 50,
        status: 'OPEN'
      };

      service.getPickSlipById('PA-001').subscribe(pickSlip => {
        expect(pickSlip).toEqual(mockPickSlip);
      });

      const req = httpMock.expectOne(
        `${API.PACK_RECOVERED_PLASMA.PICK_SLIP_BY_ID('PA-001')}`
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        data: mockPickSlip
      });
    });

    it('should propagate HTTP error', () => {
      service.getPickSlipById('INVALID').subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(API.PACK_RECOVERED_PLASMA.PICK_SLIP_BY_ID('INVALID'));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // -------------------------------------------------------
  // createPickSlip
  // -------------------------------------------------------
  describe('createPickSlip', () => {
    it('should create pick slip successfully', () => {
      const createDto: CreatePickSlipRequestDto = {
        orderId: 'ORD-001',
        customerId: 'CUST001',
        consigneeId: 'CONS001',
        productCode: 'RPL',
        aboType: 'O+'
      };

      const mockResponse: CreatePickSlipResponseDto = {
        pickSlipId: 'PA-002'
      };

      service.createPickSlip(createDto).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(API.PACK_RECOVERED_PLASMA.CREATE_PICK_SLIP);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush({
        success: true,
        statusCode: 201,
        data: mockResponse
      });
    });

    it('should propagate HTTP error', () => {
      const createDto: CreatePickSlipRequestDto = {
        orderId: 'ORD-001',
        customerId: 'CUST001',
        consigneeId: 'CONS001',
        productCode: 'RPL',
        aboType: 'O+'
      };

      service.createPickSlip(createDto).subscribe({
        error: (err) => {
          expect(err.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(API.PACK_RECOVERED_PLASMA.CREATE_PICK_SLIP);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  // -------------------------------------------------------
  // getBoxesByPickSlip
  // -------------------------------------------------------
  describe('getBoxesByPickSlip', () => {
    it('should fetch boxes for pick slip', () => {
      const mockBoxes: BoxDto[] = [
        {
          boxId: 'BOX-001',
          pickSlipId: 'PA-001',
          maxCapacity: 50,
          currentCount: 25,
          remainingCapacity: 25,
          percentageFull: 50,
          isAtCapacity: false,
          status: 'OPEN',
          insertDate: '2024-06-01T00:00:00Z'
        }
      ];

      service.getBoxesByPickSlip('PA-001').subscribe(boxes => {
        expect(boxes).toEqual(mockBoxes);
      });

      const req = httpMock.expectOne(API.PACK_RECOVERED_PLASMA.BOXES_BY_PICK_SLIP('PA-001'));
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        data: mockBoxes
      });
    });

    it('should return empty array when data is null', () => {
      service.getBoxesByPickSlip('PA-001').subscribe(boxes => {
        expect(boxes).toEqual([]);
      });

      const req = httpMock.expectOne(API.PACK_RECOVERED_PLASMA.BOXES_BY_PICK_SLIP('PA-001'));
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should propagate HTTP error', () => {
      service.getBoxesByPickSlip('PA-001').subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.PACK_RECOVERED_PLASMA.BOXES_BY_PICK_SLIP('PA-001'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // -------------------------------------------------------
  // getBoxById
  // -------------------------------------------------------
  describe('getBoxById', () => {
    it('should fetch box by ID', () => {
      const mockBox: BoxDto = {
        boxId: 'BOX-001',
        pickSlipId: 'PA-001',
        maxCapacity: 50,
        currentCount: 25,
        remainingCapacity: 25,
        percentageFull: 50,
        isAtCapacity: false,
        status: 'OPEN'
      };

      service.getBoxById('BOX-001').subscribe(box => {
        expect(box).toEqual(mockBox);
      });

      const req = httpMock.expectOne(API.PACK_RECOVERED_PLASMA.BOX_BY_ID('BOX-001'));
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        data: mockBox
      });
    });

    it('should propagate HTTP error', () => {
      service.getBoxById('INVALID').subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(API.PACK_RECOVERED_PLASMA.BOX_BY_ID('INVALID'));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // -------------------------------------------------------
  // createBox
  // -------------------------------------------------------
  describe('createBox', () => {
    it('should create box successfully', () => {
      const createBoxDto = {
        pickSlipId: 'PA-001',
        maxCapacity: 50,
        boxId: 'BOX-001'
      };

      const mockResponse = {
        boxId: 'BOX-001'
      };

      service.createBox(createBoxDto).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${API.PACK_RECOVERED_PLASMA.CREATE_BOX}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createBoxDto);
      req.flush({
        success: true,
        statusCode: 201,
        data: mockResponse
      });
    });

    it('should propagate HTTP error', () => {
      const createBoxDto: CreateBoxRequestDto = {
        pickSlipId: 'PA-001',
        maxCapacity: 50
      };

      service.createBox(createBoxDto).subscribe({
        error: (err) => {
          expect(err.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(API.PACK_RECOVERED_PLASMA.CREATE_BOX);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  // -------------------------------------------------------
  // packProduct
  // -------------------------------------------------------
  describe('packProduct', () => {
    it('should pack product successfully', () => {
      const packRequest: PackProductRequestDto = {
        dinNumber: '=<E123456789012',
        boxId: 'BOX-001',
        pickSlipId: 'PA-001',
        productCode: 'RPL',
        barcodeScheme: 'ISBT',
        validateAboCompatibility: true,
        validateExpiry: true
      };

      const mockResponse = {
        dinNumber: '=<E123456789012',
        boxId: 'BOX-001',
        currentCount: 36,
        remainingCapacity: 14
      };

      service.packProduct(packRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${API.PACK_RECOVERED_PLASMA.PACK}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(packRequest);
      req.flush({
        success: true,
        statusCode: 200,
        data: mockResponse
      });
    });

    it('should propagate HTTP error', () => {
      const packRequest: PackProductRequestDto = {
        dinNumber: '=<E123456789012',
        boxId: 'BOX-001',
        pickSlipId: 'PA-001',
        productCode: 'RPL'
      };

      service.packProduct(packRequest).subscribe({
        error: (err) => {
          expect(err.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(API.PACK_RECOVERED_PLASMA.PACK);
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });
    });
  });

  // -------------------------------------------------------
  // unpackProduct
  // -------------------------------------------------------
  describe('unpackProduct', () => {
    it('should unpack product successfully', () => {
      const unpackRequest = {
        dinNumber: '=<E123456789012',
        boxId: 'BOX-001',
        pickSlipId: 'PA-001'
      };

      const mockResponse = {
        dinNumber: '=<E123456789012',
        boxId: 'BOX-001',
        currentCount: 34,
        remainingCapacity: 16
      };

      service.unpackProduct(unpackRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${API.PACK_RECOVERED_PLASMA.UNPACK}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(unpackRequest);
      req.flush({
        success: true,
        statusCode: 200,
        data: mockResponse
      });
    });

    it('should propagate HTTP error', () => {
      const unpackRequest: UnpackProductRequestDto = {
        dinNumber: '=<E123456789012',
        boxId: 'BOX-001',
        pickSlipId: 'PA-001'
      };

      service.unpackProduct(unpackRequest).subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(API.PACK_RECOVERED_PLASMA.UNPACK);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // -------------------------------------------------------
  // getAvailableProducts
  // -------------------------------------------------------
  describe('getAvailableProducts', () => {
    it('should fetch available products with product code', () => {
      const mockProducts: ProductDto[] = [
        {
          dinNumber: 'DIN001',
          productCode: 'RPL',
          productDescription: 'Recovered Plasma',
          aboRh: 'O+',
          expirationDate: '2025-12-31T00:00:00Z',
          stockState: 'AVAILABLE',
          barcodeScheme: 'ISBT'
        }
      ];

      service.getAvailableProducts('RPL').subscribe(products => {
        expect(products).toEqual(mockProducts);
      });

      const req = httpMock.expectOne(
        `${API.PACK_RECOVERED_PLASMA.AVAILABLE_PRODUCTS}?productCode=RPL`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: mockProducts });
    });

    it('should include ABO type in query params when provided', () => {
      service.getAvailableProducts('RPL', 'O+').subscribe();

      const req = httpMock.expectOne(
        `${API.PACK_RECOVERED_PLASMA.AVAILABLE_PRODUCTS}?productCode=RPL&aboType=O%2B`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, data: [] });
    });

    it('should return empty array when data is null', () => {
      service.getAvailableProducts('RPL').subscribe(products => {
        expect(products).toEqual([]);
      });

      const req = httpMock.expectOne(
        `${API.PACK_RECOVERED_PLASMA.AVAILABLE_PRODUCTS}?productCode=RPL`
      );
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should propagate HTTP error', () => {
      service.getAvailableProducts('RPL').subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        `${API.PACK_RECOVERED_PLASMA.AVAILABLE_PRODUCTS}?productCode=RPL`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // -------------------------------------------------------
  // getPackedProductsByBox
  // -------------------------------------------------------
  describe('getPackedProductsByBox', () => {
    it('should fetch packed products by box ID', () => {
      const mockProducts: PackedProductDto[] = [
        {
          dinNumber: '=<E123456789012',
          pickSlipId: 'PA-001',
          boxId: 'BOX-001',
          productCode: 'RPL',
          aboRh: 'O+',
          expirationDate: '2025-12-31T00:00:00Z',
          collectionDate: '2024-05-20T00:00:00Z',
          label: 'Manufacture',
          weight: 300,
          volume: 310
        } as PackedProductDto
      ];

      service.getPackedProductsByBox('BOX-001').subscribe(products => {
        expect(products).toEqual(mockProducts);
      });

      const req = httpMock.expectOne(
        `${API.PACK_RECOVERED_PLASMA.PACKED_PRODUCTS_BY_BOX('BOX-001')}`
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        data: mockProducts
      });
    });

    it('should return empty array when data is null', () => {
      service.getPackedProductsByBox('BOX-001').subscribe(products => {
        expect(products).toEqual([]);
      });

      const req = httpMock.expectOne(
        API.PACK_RECOVERED_PLASMA.PACKED_PRODUCTS_BY_BOX('BOX-001')
      );
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should propagate HTTP error', () => {
      service.getPackedProductsByBox('BOX-001').subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        API.PACK_RECOVERED_PLASMA.PACKED_PRODUCTS_BY_BOX('BOX-001')
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // -------------------------------------------------------
  // getPackedProductsByPickSlip
  // -------------------------------------------------------
  describe('getPackedProductsByPickSlip', () => {
    it('should fetch packed products by pick slip ID', () => {
      const mockProducts: PackedProductDto[] = [
        {
          dinNumber: '=<E123456789012',
          pickSlipId: 'PA-001',
          boxId: 'BOX-001',
          productCode: 'RPL',
          aboRh: 'O+',
          expirationDate: '2025-12-31T00:00:00Z',
          collectionDate: '2024-05-20T00:00:00Z'
        }
      ];

      service.getPackedProductsByPickSlip('PA-001').subscribe(products => {
        expect(products).toEqual(mockProducts);
      });

      const req = httpMock.expectOne(
        API.PACK_RECOVERED_PLASMA.PACKED_PRODUCTS_BY_PICK_SLIP('PA-001')
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        data: mockProducts
      });
    });

    it('should return empty array when data is null', () => {
      service.getPackedProductsByPickSlip('PA-001').subscribe(products => {
        expect(products).toEqual([]);
      });

      const req = httpMock.expectOne(
        API.PACK_RECOVERED_PLASMA.PACKED_PRODUCTS_BY_PICK_SLIP('PA-001')
      );
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should propagate HTTP error', () => {
      service.getPackedProductsByPickSlip('PA-001').subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(
        API.PACK_RECOVERED_PLASMA.PACKED_PRODUCTS_BY_PICK_SLIP('PA-001')
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // -------------------------------------------------------
  // getProductByDin
  // -------------------------------------------------------
  describe('getProductByDin', () => {
    it('should fetch product detail by DIN', () => {
      const mockDetail: ProductDetailDto = {
        dinNumber: '=<E123456789012',
        productCode: 'RPL',
        collectionDate: '2024-05-20T00:00:00Z',
        barcodeScheme: 'ISBT',
        barcodeSchemeLabel: 'ISBT 128',
        componentWeight: 300,
        componentVolume: 310
      };

      service.getProductByDin('=<E123456789012').subscribe(detail => {
        expect(detail).toEqual(mockDetail);
      });

      const req = httpMock.expectOne(
        API.PACK_RECOVERED_PLASMA.PRODUCT_BY_DIN('=<E123456789012')
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        data: mockDetail
      });
    });

    it('should propagate HTTP error', () => {
      service.getProductByDin('INVALID_DIN').subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(
        API.PACK_RECOVERED_PLASMA.PRODUCT_BY_DIN('INVALID_DIN')
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // -------------------------------------------------------
  // searchCustomers
  // -------------------------------------------------------
  describe('searchCustomers', () => {
    it('should search customers and map to simplified format', () => {
      const apiCustomers: CustomerSelectionDto[] = [
        {
          customerId: 'CUST001',
          customerName: 'Test Hospital',
          consigneeId: 'CONS001',
          consigneeName: 'Test Lab',
          contractNumber: 'CT-001',
          contractEffDate: '2024-01-01T00:00:00Z',
          contractTermDate: null,
          hasValidContract: true
        },
        {
          customerId: 'CUST002',
          customerName: 'City Clinic',
          consigneeId: 'CONS002',
          consigneeName: 'City Lab',
          contractNumber: 'CT-002',
          contractEffDate: '2024-02-01T00:00:00Z',
          contractTermDate: null,
          hasValidContract: true
        }
      ];

      service.searchCustomers('test').subscribe(results => {
        expect(results.length).toBe(2);
        expect(results[0]).toEqual({ customerId: 'CUST001', customerName: 'Test Hospital' });
        expect(results[1]).toEqual({ customerId: 'CUST002', customerName: 'City Clinic' });
      });

      const req = httpMock.expectOne(
        `${API.PACK_RECOVERED_PLASMA.CUSTOMERS}?searchKeyword=test`
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        data: apiCustomers
      });
    });

    it('should return empty array when data is null', () => {
      service.searchCustomers('xyz').subscribe(results => {
        expect(results).toEqual([]);
      });

      const req = httpMock.expectOne(
        `${API.PACK_RECOVERED_PLASMA.CUSTOMERS}?searchKeyword=xyz`
      );
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should propagate HTTP error', () => {
      service.searchCustomers('test').subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        `${API.PACK_RECOVERED_PLASMA.CUSTOMERS}?searchKeyword=test`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // -------------------------------------------------------
  // searchBoxes
  // -------------------------------------------------------
  describe('searchBoxes', () => {
    it('should search boxes and map to simplified format', () => {
      const apiBoxes: BoxDto[] = [
        {
          boxId: 'BOX-001',
          pickSlipId: 'PA-001',
          maxCapacity: 50,
          currentCount: 25,
          remainingCapacity: 25,
          percentageFull: 50,
          isAtCapacity: false,
          status: 'OPEN',
          insertDate: '2024-06-01T10:00:00Z'
        },
        {
          boxId: 'BOX-002',
          pickSlipId: 'PA-001',
          maxCapacity: 50,
          currentCount: 50,
          remainingCapacity: 0,
          percentageFull: 100,
          isAtCapacity: true,
          status: 'CLOSED',
          insertDate: '2024-06-02T14:30:00Z'
        }
      ];

      service.searchBoxes('PA-001').subscribe(results => {
        expect(results.length).toBe(2);
        expect(results[0]).toEqual({ boxId: 'BOX-001', creationDate: '2024-06-01T10:00:00Z' });
        expect(results[1]).toEqual({ boxId: 'BOX-002', creationDate: '2024-06-02T14:30:00Z' });
      });

      const req = httpMock.expectOne(
        API.PACK_RECOVERED_PLASMA.BOXES_BY_PICK_SLIP('PA-001')
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        data: apiBoxes
      });
    });

    it('should use empty string when insertDate is null/undefined', () => {
      const apiBoxes: BoxDto[] = [
        {
          boxId: 'BOX-003',
          pickSlipId: 'PA-001',
          maxCapacity: 50,
          currentCount: 0,
          remainingCapacity: 50,
          percentageFull: 0,
          isAtCapacity: false,
          status: 'OPEN'
          // insertDate is undefined
        }
      ];

      service.searchBoxes('PA-001').subscribe(results => {
        expect(results.length).toBe(1);
        expect(results[0]).toEqual({ boxId: 'BOX-003', creationDate: '' });
      });

      const req = httpMock.expectOne(
        API.PACK_RECOVERED_PLASMA.BOXES_BY_PICK_SLIP('PA-001')
      );
      req.flush({
        success: true,
        statusCode: 200,
        data: apiBoxes
      });
    });

    it('should return empty array when data is null', () => {
      service.searchBoxes('PA-001').subscribe(results => {
        expect(results).toEqual([]);
      });

      const req = httpMock.expectOne(
        API.PACK_RECOVERED_PLASMA.BOXES_BY_PICK_SLIP('PA-001')
      );
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should propagate HTTP error', () => {
      service.searchBoxes('PA-001').subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        API.PACK_RECOVERED_PLASMA.BOXES_BY_PICK_SLIP('PA-001')
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
