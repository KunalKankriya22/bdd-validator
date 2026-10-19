import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PackodApiService } from './packod-api.service';
import { API } from '@core/constants/api.constants';
import {
  ConsigneeDropdownDto,
  DiscardProductDto,
  PackProductRequestDto,
  CloseBoxRequestDto,
  BoxContentItemDto,
  OrderLookupModel,
  OpenBoxLookupModel,
  ProductCodeLookupModel,
  AliquotLookupModel,
  BloodTypeLookupModel,
  DiscardProductsParamsDto,
  CreateNewBoxRequestDto
} from '../models';

describe('PackodApiService', () => {
  let service: PackodApiService;
  let httpMock: HttpTestingController;
  const base = API.PACK_INV_REJECTS_TO_SALVAGE;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PackodApiService]
    });

    service = TestBed.inject(PackodApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getConsignees', () => {
    it('should fetch consignees without search text', () => {
      const mockConsignees: ConsigneeDropdownDto[] = [
        {
          consigneeId: 'DISC001',
          customerId: 'CUST001',
          customerName: 'Regional Discard Center',
          address: '123 Waste Lane, City, ST 12345'
        }
      ];

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Consignees retrieved successfully',
        data: mockConsignees,
        totalCount: 1
      };

      service.getConsignees().subscribe(data => {
        expect(data).toEqual(mockConsignees);
        expect(data.length).toBe(1);
        expect(data[0].consigneeId).toBe('DISC001');
        expect(data[0].customerName).toBe('Regional Discard Center');
      });

      const req = httpMock.expectOne(base.CONSIGNEES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch consignees with search text', () => {
      const searchText = 'Regional';
      const mockConsignees: ConsigneeDropdownDto[] = [
        {
          consigneeId: 'DISC001',
          customerId: 'CUST001',
          customerName: 'Regional Discard Center',
          address: '123 Waste Lane, City, ST 12345'
        }
      ];

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Consignees retrieved successfully',
        data: mockConsignees,
        totalCount: 1
      };

      service.getConsignees(searchText).subscribe(data => {
        expect(data).toEqual(mockConsignees);
        expect(data.length).toBe(1);
      });

      const req = httpMock.expectOne(`${base.CONSIGNEES}?searchText=${searchText}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return an empty array when no consignees match', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'No consignees found',
        data: [] as ConsigneeDropdownDto[],
        totalCount: 0
      };

      service.getConsignees('nonexistent').subscribe(data => {
        expect(data).toEqual([]);
        expect(data.length).toBe(0);
      });

      const req = httpMock.expectOne(`${base.CONSIGNEES}?searchText=nonexistent`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate error when server returns 500', () => {
      service.getConsignees().subscribe({
        next: () => fail('expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(base.CONSIGNEES);
      expect(req.request.method).toBe('GET');
      req.flush('error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getOrders', () => {
    it('should fetch orders for a customer and consignee', () => {
      const customerId = 'CUST001';
      const consigneeId = 'DISC001';
      const mockOrders: OrderLookupModel[] = [
        { orderNo: 'ORD0001234' },
        { orderNo: 'ORD0001235' }
      ];

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Orders retrieved successfully',
        data: mockOrders,
        totalCount: 2
      };

      service.getOrders(customerId, consigneeId).subscribe(data => {
        expect(data).toEqual(mockOrders);
        expect(data.length).toBe(2);
        expect(data[0].orderNo).toBe('ORD0001234');
      });

      const req = httpMock.expectOne(
        `${base.ORDERS}?customerId=${customerId}&consigneeId=${consigneeId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return an empty array when no orders exist', () => {
      const customerId = 'CUST999';
      const consigneeId = 'DISC999';

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'No orders found',
        data: [] as OrderLookupModel[],
        totalCount: 0
      };

      service.getOrders(customerId, consigneeId).subscribe(data => {
        expect(data).toEqual([]);
        expect(data.length).toBe(0);
      });

      const req = httpMock.expectOne(
        `${base.ORDERS}?customerId=${customerId}&consigneeId=${consigneeId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate error when server returns 500', () => {
      const customerId = 'CUST001';
      const consigneeId = 'DISC001';

      service.getOrders(customerId, consigneeId).subscribe({
        next: () => fail('expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(
        `${base.ORDERS}?customerId=${customerId}&consigneeId=${consigneeId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush('error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getProductTypes', () => {
    it('should fetch product types for a customer and consignee', () => {
      const customerId = 'CUST001';
      const consigneeId = 'DISC001';
      const mockProductTypes = [
        { productType: 'RBC', description: 'Red Blood Cells' },
        { productType: 'PLT', description: 'Platelets' },
        { productType: 'PLASMA', description: 'Plasma' }
      ];

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Product types retrieved successfully',
        data: mockProductTypes,
        totalCount: 3
      };

      service.getProductTypes(customerId, consigneeId).subscribe(data => {
        expect(data).toEqual(mockProductTypes);
        expect(data.length).toBe(3);
        expect(data[0].productType).toBe('RBC');
      });

      const req = httpMock.expectOne(
        `${base.PRODUCT_TYPES}?customerId=${customerId}&consigneeId=${consigneeId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return an empty array when no product types exist', () => {
      const customerId = 'CUST999';
      const consigneeId = 'DISC999';

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'No product types found',
        data: [] as { productType: string; description: string }[],
        totalCount: 0
      };

      service.getProductTypes(customerId, consigneeId).subscribe(data => {
        expect(data).toEqual([]);
        expect(data.length).toBe(0);
      });

      const req = httpMock.expectOne(
        `${base.PRODUCT_TYPES}?customerId=${customerId}&consigneeId=${consigneeId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate error when server returns 500', () => {
      const customerId = 'CUST001';
      const consigneeId = 'DISC001';

      service.getProductTypes(customerId, consigneeId).subscribe({
        next: () => fail('expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(
        `${base.PRODUCT_TYPES}?customerId=${customerId}&consigneeId=${consigneeId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush('error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getOpenBoxes', () => {
    it('should fetch open boxes for a consignee', () => {
      const consigneeId = 'DISC001';
      const mockBoxes: OpenBoxLookupModel[] = [
        { boxId: 'BOX0001234', productType: 'RBC' },
        { boxId: 'BOX0001235', productType: 'PLT' }
      ];

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Open boxes retrieved successfully',
        data: mockBoxes,
        totalCount: 2
      };

      service.getOpenBoxes(consigneeId).subscribe(data => {
        expect(data).toEqual(mockBoxes);
        expect(data.length).toBe(2);
        expect(data[0].boxId).toBe('BOX0001234');
      });

      const req = httpMock.expectOne(`${base.OPEN_BOXES}?consigneeId=${consigneeId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch open boxes with product type filter', () => {
      const consigneeId = 'DISC001';
      const productType = 'RBC';
      const mockBoxes: OpenBoxLookupModel[] = [
        { boxId: 'BOX0001234', productType: 'RBC' }
      ];

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Open boxes retrieved successfully',
        data: mockBoxes,
        totalCount: 1
      };

      service.getOpenBoxes(consigneeId, productType).subscribe(data => {
        expect(data).toEqual(mockBoxes);
        expect(data.length).toBe(1);
      });

      const req = httpMock.expectOne(
        `${base.OPEN_BOXES}?consigneeId=${consigneeId}&productType=${productType}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate error when server returns 500', () => {
      const consigneeId = 'DISC001';

      service.getOpenBoxes(consigneeId).subscribe({
        next: () => fail('expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(`${base.OPEN_BOXES}?consigneeId=${consigneeId}`);
      expect(req.request.method).toBe('GET');
      req.flush('error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getProductCodes', () => {
    it('should fetch product codes', () => {
      const unitId = 'W1234567890123';
      const customerId = 'CUST001';
      const consigneeId = 'DISC001';
      const codeScheme = 'ISBT';
      const mockProductCodes: ProductCodeLookupModel[] = [
        { productCode: 'E1150110', shortName: 'RBC Leuko Red' }
      ];

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Product codes retrieved successfully',
        data: mockProductCodes
      };

      service.getProductCodes(unitId, customerId, consigneeId, codeScheme).subscribe(data => {
        expect(data).toEqual(mockProductCodes);
        expect(data.length).toBe(1);
        expect(data[0].productCode).toBe('E1150110');
      });

      const req = httpMock.expectOne(
        `${base.PRODUCT_CODES}?unitId=${unitId}&customerId=${customerId}&consigneeId=${consigneeId}&codeScheme=${codeScheme}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch multiple product codes', () => {
      const unitId = 'W1234567890123';
      const customerId = 'CUST001';
      const consigneeId = 'DISC001';
      const codeScheme = 'ISBT';
      const mockProductCodes: ProductCodeLookupModel[] = [
        { productCode: 'E1150110', shortName: 'RBC Leuko Red' },
        { productCode: 'E1150120', shortName: 'RBC Irradiated' },
        { productCode: 'E1150130', shortName: 'RBC Washed' }
      ];

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Product codes retrieved successfully',
        data: mockProductCodes
      };

      service.getProductCodes(unitId, customerId, consigneeId, codeScheme).subscribe(data => {
        expect(data).toEqual(mockProductCodes);
        expect(data.length).toBe(3);
        expect(data[1].productCode).toBe('E1150120');
        expect(data[2].shortName).toBe('RBC Washed');
      });

      const req = httpMock.expectOne(
        `${base.PRODUCT_CODES}?unitId=${unitId}&customerId=${customerId}&consigneeId=${consigneeId}&codeScheme=${codeScheme}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate error when server returns 500', () => {
      const unitId = 'W1234567890123';
      const customerId = 'CUST001';
      const consigneeId = 'DISC001';
      const codeScheme = 'ISBT';

      service.getProductCodes(unitId, customerId, consigneeId, codeScheme).subscribe({
        next: () => fail('expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(
        `${base.PRODUCT_CODES}?unitId=${unitId}&customerId=${customerId}&consigneeId=${consigneeId}&codeScheme=${codeScheme}`
      );
      expect(req.request.method).toBe('GET');
      req.flush('error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getAliquots', () => {
    it('should fetch aliquots for a unit and product code', () => {
      const unitId = 'W1234567890123';
      const productCode = 'E1150110';
      const mockAliquots: AliquotLookupModel[] = [
        { aliquot: '00' },
        { aliquot: '01' }
      ];

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Aliquots retrieved successfully',
        data: mockAliquots
      };

      service.getAliquots(unitId, productCode).subscribe(data => {
        expect(data).toEqual(mockAliquots);
        expect(data.length).toBe(2);
        expect(data[0].aliquot).toBe('00');
      });

      const req = httpMock.expectOne(
        `${base.ALIQUOTS}?unitId=${unitId}&productCode=${productCode}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return a single aliquot', () => {
      const unitId = 'W1234567890123';
      const productCode = 'E1150110';
      const mockAliquots: AliquotLookupModel[] = [
        { aliquot: '00' }
      ];

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Aliquots retrieved successfully',
        data: mockAliquots
      };

      service.getAliquots(unitId, productCode).subscribe(data => {
        expect(data).toEqual(mockAliquots);
        expect(data.length).toBe(1);
        expect(data[0].aliquot).toBe('00');
      });

      const req = httpMock.expectOne(
        `${base.ALIQUOTS}?unitId=${unitId}&productCode=${productCode}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return an empty array when no aliquots exist', () => {
      const unitId = 'W9999999999999';
      const productCode = 'E0000000';

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'No aliquots found',
        data: [] as AliquotLookupModel[]
      };

      service.getAliquots(unitId, productCode).subscribe(data => {
        expect(data).toEqual([]);
        expect(data.length).toBe(0);
      });

      const req = httpMock.expectOne(
        `${base.ALIQUOTS}?unitId=${unitId}&productCode=${productCode}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate error when server returns 500', () => {
      const unitId = 'W1234567890123';
      const productCode = 'E1150110';

      service.getAliquots(unitId, productCode).subscribe({
        next: () => fail('expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(
        `${base.ALIQUOTS}?unitId=${unitId}&productCode=${productCode}`
      );
      expect(req.request.method).toBe('GET');
      req.flush('error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getBloodTypes', () => {
    it('should fetch blood types for a unit, product code, and code scheme', () => {
      const unitId = 'W1234567890123';
      const productCode = 'E1150110';
      const codeScheme = 'ISBT';
      const mockBloodTypes: BloodTypeLookupModel[] = [
        { aboDesc: 'A Positive' },
        { aboDesc: 'O Negative' }
      ];

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Blood types retrieved successfully',
        data: mockBloodTypes
      };

      service.getBloodTypes(unitId, productCode, codeScheme).subscribe(data => {
        expect(data).toEqual(mockBloodTypes);
        expect(data.length).toBe(2);
        expect(data[0].aboDesc).toBe('A Positive');
      });

      const req = httpMock.expectOne(
        `${base.BLOOD_TYPES}?unitId=${unitId}&productCode=${productCode}&codeScheme=${codeScheme}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return a single blood type', () => {
      const unitId = 'W1234567890123';
      const productCode = 'E1150110';
      const codeScheme = 'ISBT';
      const mockBloodTypes: BloodTypeLookupModel[] = [
        { aboDesc: 'O Negative' }
      ];

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Blood types retrieved successfully',
        data: mockBloodTypes
      };

      service.getBloodTypes(unitId, productCode, codeScheme).subscribe(data => {
        expect(data).toEqual(mockBloodTypes);
        expect(data.length).toBe(1);
        expect(data[0].aboDesc).toBe('O Negative');
      });

      const req = httpMock.expectOne(
        `${base.BLOOD_TYPES}?unitId=${unitId}&productCode=${productCode}&codeScheme=${codeScheme}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return an empty array when no blood types exist', () => {
      const unitId = 'W9999999999999';
      const productCode = 'E0000000';
      const codeScheme = 'ISBT';

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'No blood types found',
        data: [] as BloodTypeLookupModel[]
      };

      service.getBloodTypes(unitId, productCode, codeScheme).subscribe(data => {
        expect(data).toEqual([]);
        expect(data.length).toBe(0);
      });

      const req = httpMock.expectOne(
        `${base.BLOOD_TYPES}?unitId=${unitId}&productCode=${productCode}&codeScheme=${codeScheme}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate error when server returns 500', () => {
      const unitId = 'W1234567890123';
      const productCode = 'E1150110';
      const codeScheme = 'ISBT';

      service.getBloodTypes(unitId, productCode, codeScheme).subscribe({
        next: () => fail('expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(
        `${base.BLOOD_TYPES}?unitId=${unitId}&productCode=${productCode}&codeScheme=${codeScheme}`
      );
      expect(req.request.method).toBe('GET');
      req.flush('error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getDiscardProducts', () => {
    it('should fetch discard products with pagination', () => {
      const take = 50;
      const skip = 0;
      const params: DiscardProductsParamsDto = {
        consigneeId: 'DISC001',
        customerId: 'CUST001',
        productType: 'RBC'
      };

      const mockProducts: DiscardProductDto[] = [
        {
          unitId: 'W1234567890123',
          chkDigit: '7',
          productCode: 'E1150110',
          productType: 'RBC',
          productDesc: 'RBC Leuko Red',
          aliquot: '00',
          bloodType: 'E001',
          aboDesc: 'A Positive',
          expDate: '2026-12-31T23:59:00Z',
          collDate: '2026-01-15T10:30:00Z',
          boxId: null,
          productStatus: 'CI'
        }
      ];

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Discard products retrieved successfully',
        data: mockProducts,
        totalCount: 125
      };

      service.getDiscardProducts(take, skip, params).subscribe(result => {
        expect(result.data).toEqual(mockProducts);
        expect(result.totalCount).toBe(125);
      });

      const req = httpMock.expectOne(base.DISCARD_PRODUCTS(take, skip));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(params);
      req.flush(mockResponse);
    });

    it('should return empty data with totalCount 0', () => {
      const take = 50;
      const skip = 0;
      const params: DiscardProductsParamsDto = {
        consigneeId: 'DISC999',
        customerId: 'CUST999',
        productType: 'RBC'
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'No discard products found',
        data: [] as DiscardProductDto[],
        totalCount: 0
      };

      service.getDiscardProducts(take, skip, params).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalCount).toBe(0);
      });

      const req = httpMock.expectOne(base.DISCARD_PRODUCTS(take, skip));
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should default totalCount to 0 when totalCount is null or undefined', () => {
      const take = 50;
      const skip = 0;
      const params: DiscardProductsParamsDto = {
        consigneeId: 'DISC001',
        customerId: 'CUST001',
        productType: 'RBC'
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Discard products retrieved',
        data: [] as DiscardProductDto[]
      };

      service.getDiscardProducts(take, skip, params).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalCount).toBe(0);
      });

      const req = httpMock.expectOne(base.DISCARD_PRODUCTS(take, skip));
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should propagate error when server returns 500', () => {
      const take = 50;
      const skip = 0;
      const params: DiscardProductsParamsDto = {
        consigneeId: 'DISC001',
        customerId: 'CUST001',
        productType: 'RBC'
      };

      service.getDiscardProducts(take, skip, params).subscribe({
        next: () => fail('expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(base.DISCARD_PRODUCTS(take, skip));
      expect(req.request.method).toBe('POST');
      req.flush('error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getBoxContents', () => {
    it('should fetch box contents successfully', () => {
      const boxId = 'BOX0001234';

      const mockBoxContents: BoxContentItemDto[] = [
        {
          unitId: 'W1234567890123',
          chkDigit: '7',
          expDate: '2026-12-31T23:59:00Z',
          productType: 'RBC',
          productCode: 'E1150110',
          aliquot: '00',
          bloodType: 'E001',
          aboDesc: 'A Positive',
          collDate: '2026-01-15T10:30:00Z'
        }
      ];

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Box contents retrieved successfully',
        data: mockBoxContents
      };

      service.getBoxContents(boxId).subscribe(data => {
        expect(data).toEqual(mockBoxContents);
        expect(data.length).toBe(1);
        expect(data[0].unitId).toBe('W1234567890123');
      });

      const req = httpMock.expectOne(base.BOX_CONTENTS(boxId));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return an empty array when box has no contents', () => {
      const boxId = 'BOX0009999';

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Box contents retrieved successfully',
        data: [] as BoxContentItemDto[]
      };

      service.getBoxContents(boxId).subscribe(data => {
        expect(data).toEqual([]);
        expect(data.length).toBe(0);
      });

      const req = httpMock.expectOne(base.BOX_CONTENTS(boxId));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate error when server returns 500', () => {
      const boxId = 'BOX0001234';

      service.getBoxContents(boxId).subscribe({
        next: () => fail('expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(base.BOX_CONTENTS(boxId));
      expect(req.request.method).toBe('GET');
      req.flush('error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('packProduct', () => {
    it('should pack a product successfully', () => {
      const request: PackProductRequestDto = {
        consigneeId: 'DISC001',
        customerId: 'CUST001',
        unitId: 'W1234567890123',
        productCode: 'E1150110',
        aliquot: '00',
        bloodType: 'E001',
        expDate: '2026-12-31T23:59:00Z',
        codeScheme: 'ISBT'
      };

      const mockProduct: DiscardProductDto = {
        unitId: 'W1234567890123',
        chkDigit: '7',
        productCode: 'E1150110',
        productType: 'RBC',
        productDesc: 'RBC Leuko Red',
        aliquot: '00',
        bloodType: 'E001',
        aboDesc: 'A Positive',
        expDate: '2026-12-31T23:59:00Z',
        collDate: '2026-01-15T10:30:00Z',
        boxId: 'BOX0001234',
        productStatus: 'PK'
      };

      const mockApiResponse = {
        success: true,
        statusCode: 200,
        message: 'Product packed successfully',
        data: mockProduct
      };

      service.packProduct(request).subscribe(data => {
        expect(data).toEqual(mockProduct);
        expect(data.unitId).toBe('W1234567890123');
        expect(data.productStatus).toBe('PK');
      });

      const req = httpMock.expectOne(base.PACK_PRODUCT);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockApiResponse);
    });

    it('should propagate error when server returns 500', () => {
      const request: PackProductRequestDto = {
        consigneeId: 'DISC001',
        customerId: 'CUST001',
        unitId: 'W1234567890123',
        productCode: 'E1150110',
        aliquot: '00',
        bloodType: 'E001',
        expDate: '2026-12-31T23:59:00Z',
        codeScheme: 'ISBT'
      };

      service.packProduct(request).subscribe({
        next: () => fail('expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(base.PACK_PRODUCT);
      expect(req.request.method).toBe('POST');
      req.flush('error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('closeBox', () => {
    it('should close a box successfully', () => {
      const request: CloseBoxRequestDto = {
        boxId: 'BOX0001234'
      };

      const mockApiResponse = {
        success: true,
        statusCode: 200,
        message: 'Box closed successfully',
        data: true
      };

      service.closeBox(request).subscribe(data => {
        expect(data).toBe(true);
      });

      const req = httpMock.expectOne(base.CLOSE_BOX);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockApiResponse);
    });

    it('should return false when box close is not successful', () => {
      const request: CloseBoxRequestDto = {
        boxId: 'BOX0001234'
      };

      const mockApiResponse = {
        success: true,
        statusCode: 200,
        message: 'Box could not be closed',
        data: false
      };

      service.closeBox(request).subscribe(data => {
        expect(data).toBe(false);
      });

      const req = httpMock.expectOne(base.CLOSE_BOX);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockApiResponse);
    });

    it('should propagate error when server returns 500', () => {
      const request: CloseBoxRequestDto = {
        boxId: 'BOX0001234'
      };

      service.closeBox(request).subscribe({
        next: () => fail('expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(base.CLOSE_BOX);
      expect(req.request.method).toBe('POST');
      req.flush('error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('createNewBox', () => {
    it('should create a new box successfully', () => {
      const request: CreateNewBoxRequestDto = {
        currentBoxId: 'BOX0001234',
        closeCurrentBox: true,
        allProductsProperlyPacked: true,
        consigneeId: 'DISC001'
      };

      const mockApiResponse = {
        success: true,
        statusCode: 200,
        message: 'New box created successfully',
        data: true
      };

      service.createNewBox(request).subscribe(data => {
        expect(data).toEqual({ message: 'New box created successfully' });
        expect(data.message).toBe('New box created successfully');
      });

      const req = httpMock.expectOne(base.CREATE_NEW_BOX);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockApiResponse);
    });

    it('should create a new box without closing current box', () => {
      const request: CreateNewBoxRequestDto = {
        closeCurrentBox: false,
        allProductsProperlyPacked: false,
        consigneeId: 'DISC001'
      };

      const mockApiResponse = {
        success: true,
        statusCode: 200,
        message: 'New box created',
        data: true
      };

      service.createNewBox(request).subscribe(data => {
        expect(data).toEqual({ message: 'New box created' });
      });

      const req = httpMock.expectOne(base.CREATE_NEW_BOX);
      expect(req.request.method).toBe('POST');
      req.flush(mockApiResponse);
    });

    it('should propagate error when server returns 500', () => {
      const request: CreateNewBoxRequestDto = {
        currentBoxId: 'BOX0001234',
        closeCurrentBox: true,
        allProductsProperlyPacked: true,
        consigneeId: 'DISC001'
      };

      service.createNewBox(request).subscribe({
        next: () => fail('expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(base.CREATE_NEW_BOX);
      expect(req.request.method).toBe('POST');
      req.flush('error', { status: 500, statusText: 'Server Error' });
    });
  });
});
