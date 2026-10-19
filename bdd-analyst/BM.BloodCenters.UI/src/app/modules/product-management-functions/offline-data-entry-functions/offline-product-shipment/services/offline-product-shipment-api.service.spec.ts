import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OfflineProductShipmentApiService } from './offline-product-shipment-api.service';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  OfflineProductShipmentChargeDto,
  CreateOfflineProductShipmentChargeDto,
  UpdateOfflineProductShipmentChargeDto,
  OfflineProductShipmentQueryDto,
  ApiResponse,
  CompleteBoxEntryResponseDto,
  BoxValidateRequestDto,
  BoxValidationResultDto,
  ShipmentHeaderDto,
  BoxDataDto,
  ProductInBoxDto,
  ConsigneeInZoneDto,
  FinalizeShipmentResponseDto
} from '../models/offline-product-shipment.model';

describe('OfflineProductShipmentApiService', () => {
  let service: OfflineProductShipmentApiService;
  let httpMock: HttpTestingController;

  const mockChargeDto: OfflineProductShipmentChargeDto = {
    shipmentNo: 'SH122817AS1302',
    orderNo: 'ORD12345',
    chargeCode: 'SHIP01',
    chargeCodeDesc: 'Shipping Charge',
    amount: 25.50,
    crDbInd: 'D',
    crDbDesc: 'Debit',
    chapterId: 'CH001',
    quantity: 1
  };

  const mockApiResponse: ApiResponse<OfflineProductShipmentChargeDto> = {
    data: mockChargeDto,
    success: true,
    message: 'Success'
  };

  const mockChargesArray: OfflineProductShipmentChargeDto[] = [mockChargeDto];
  const mockArrayApiResponse: ApiResponse<OfflineProductShipmentChargeDto[]> = {
    data: mockChargesArray,
    success: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OfflineProductShipmentApiService]
    });

    service = TestBed.inject(OfflineProductShipmentApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getCharges', () => {
    it('should fetch charges with pagination and query parameters', () => {
      const take = 25;
      const skip = 0;
      const query: OfflineProductShipmentQueryDto = {
        shipmentNo: 'SH122817AS1302',
        sortColumn: 'shipmentNo',
        sortOrder: 'ASC'
      };

      service.getCharges(take, skip, query).subscribe(charges => {
        expect(charges).toEqual(mockChargesArray);
        expect(charges.length).toBe(1);
        expect(charges[0].shipmentNo).toBe('SH122817AS1302');
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.GET_ALL(take, skip)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush(mockArrayApiResponse);
    });

    it('should handle empty query parameters', () => {
      const take = 10;
      const skip = 0;

      service.getCharges(take, skip).subscribe(charges => {
        expect(charges).toEqual(mockChargesArray);
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.GET_ALL(take, skip)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockArrayApiResponse);
    });
  });

  describe('getChargeById', () => {
    it('should fetch a single charge by composite key', () => {
      const shipmentNo = 'SH122817AS1302';
      const orderNo = 'ORD12345';

      service.getChargeById(shipmentNo, orderNo).subscribe(charge => {
        expect(charge).toEqual(mockChargeDto);
        expect(charge.shipmentNo).toBe(shipmentNo);
        expect(charge.orderNo).toBe(orderNo);
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.GET_BY_ID(shipmentNo, orderNo)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });

  });

  describe('createCharge', () => {
    it('should create a new charge', () => {
      const createDto: CreateOfflineProductShipmentChargeDto = {
        shipmentNo: 'SH122817AS1302',
        orderNo: 'ORD12345',
        chargeCode: 'SHIP01',
        amount: 25.50,
        crDbInd: 'D'
      };

      service.createCharge(createDto).subscribe(charge => {
        expect(charge).toEqual(mockChargeDto);
        expect(charge.shipmentNo).toBe(createDto.shipmentNo);
        expect(charge.chargeCode || null).toBe(createDto.chargeCode || null);
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.CREATE}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockApiResponse);
    });

    it('should handle validation errors on create', () => {
      const invalidDto: CreateOfflineProductShipmentChargeDto = {
        shipmentNo: '', // Invalid - required
        orderNo: 'ORD12345'
      };

      service.createCharge(invalidDto).subscribe({
        next: () => fail('Should have failed with validation error'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.CREATE}`;
      const req = httpMock.expectOne(expectedUrl);
      req.flush({ errors: ['Shipment number is required'] }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateCharge', () => {
    it('should update an existing charge', () => {
      const shipmentNo = 'SH122817AS1302';
      const orderNo = 'ORD12345';
      const updateDto: UpdateOfflineProductShipmentChargeDto = {
        chargeCode: 'SHIP02',
        amount: 30.00,
        crDbInd: 'C'
      };

      const updatedCharge = { ...mockChargeDto, ...updateDto };
      const updatedResponse: ApiResponse<OfflineProductShipmentChargeDto> = {
        data: updatedCharge,
        success: true
      };

      service.updateCharge(shipmentNo, orderNo, updateDto).subscribe(charge => {
        expect(charge.chargeCode).toBe('SHIP02');
        expect(charge.amount).toBe(30.00);
        expect(charge.crDbInd).toBe('C');
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.UPDATE(shipmentNo, orderNo)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(updatedResponse);
    });
  });

  describe('deleteCharge', () => {

    it('should handle delete errors', () => {
      const shipmentNo = 'SH122817AS1302';
      const orderNo = 'ORD12345';

      service.deleteCharge(shipmentNo, orderNo).subscribe({
        next: () => fail('Should have failed with error'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.DELETE(shipmentNo, orderNo)}`;
      const req = httpMock.expectOne(expectedUrl);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('completeBoxEntry', () => {
    it('should POST to complete endpoint and return first item from data', () => {
      const shipmentNo = 'SH001';
      const mockResponse: ApiResponse<CompleteBoxEntryResponseDto[]> = {
        data: [{ shipmentNo: 'SH001' } as CompleteBoxEntryResponseDto],
        success: true
      };

      service.completeBoxEntry(shipmentNo).subscribe(result => {
        expect(result.shipmentNo).toBe('SH001');
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.COMPLETE_BOX_ENTRY(shipmentNo)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should pass dto body when provided', () => {
      const shipmentNo = 'SH001';
      const dto = { consigneeId: 'C1', shipmentDate: '2025-01-01', carrier: '', trackNo: '', flightNo: '', boxId: 'BOX1' };
      const mockResponse: ApiResponse<CompleteBoxEntryResponseDto[]> = {
        data: [{ shipmentNo: 'SH001' } as CompleteBoxEntryResponseDto],
        success: true
      };

      service.completeBoxEntry(shipmentNo, dto as any).subscribe();

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.COMPLETE_BOX_ENTRY(shipmentNo)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });
  });

  describe('validateBox', () => {
    it('should POST box data and return first validation result', () => {
      const boxData: BoxValidateRequestDto = { boxId: 'BOX001', consigneeId: 'C1', shipmentDate: new Date() };
      const mockResult: BoxValidationResultDto = { isValid: true, boxType: 'Cooler', packedBy: 'User1' };
      const mockResponse: ApiResponse<BoxValidationResultDto[]> = {
        data: [mockResult],
        success: true
      };

      service.validateBox(boxData).subscribe(result => {
        expect(result.isValid).toBeTrue();
        expect(result.boxType).toBe('Cooler');
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.VALIDATE_BOX}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(boxData);
      req.flush(mockResponse);
    });
  });

  describe('Lookup Endpoints', () => {
    it('searchShipmentNumbers should GET with search param', () => {
      service.searchShipmentNumbers('SH').subscribe(result => {
        expect(result).toBeTruthy();
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.LOOKUP_SHIPMENTS}?search=SH`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], success: true });
    });

    it('getConsignees should GET consignee list', () => {
      service.getConsignees().subscribe(result => {
        expect(result).toBeTruthy();
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.LOOKUP_CONSIGNEES}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], success: true });
    });

    it('getConsigneeById should GET consignee detail', () => {
      service.getConsigneeById('CONS001').subscribe(result => {
        expect(result).toBeTruthy();
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.GET_CONSIGNEE_DETAIL('CONS001')}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [{ consigneeId: 'CONS001', name: 'Test' }], success: true });
    });

    it('getCarriers should GET carrier list', () => {
      service.getCarriers().subscribe(result => {
        expect(result).toBeTruthy();
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.LOOKUP_CARRIERS}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], success: true });
    });

    it('getChargeCodes should GET charge code list', () => {
      service.getChargeCodes().subscribe(result => {
        expect(result).toBeTruthy();
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.LOOKUP_CHARGE_CODES}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], success: true });
    });

    it('searchShipmentNumbers without search term should not include search param', () => {
      service.searchShipmentNumbers('').subscribe(result => {
        expect(result).toBeTruthy();
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.LOOKUP_SHIPMENTS}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.has('search')).toBeFalse();
      req.flush({ data: [], success: true });
    });
  });

  describe('getShipmentHeader', () => {
    it('should GET header by shipment number', () => {
      const mockHeader: ShipmentHeaderDto = {
        shipmentNo: 'SH001', consigneeId: 'C1', consigneeName: 'Hospital',
        shipmentDate: new Date(), address1: '', city: '', state: '', zip: '', country: '',
        carrier: 'BC', carrierDesc: 'Van', trackNo: '123', flightNo: ''
      };

      service.getShipmentHeader('SH001').subscribe(result => {
        expect(result.shipmentNo).toBe('SH001');
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.GET_HEADER('SH001')}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [mockHeader], success: true });
    });

    it('should return empty object when data is empty', () => {
      service.getShipmentHeader('SH999').subscribe(result => {
        expect(result).toEqual({} as ShipmentHeaderDto);
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.GET_HEADER('SH999')}`;
      const req = httpMock.expectOne(expectedUrl);
      req.flush({ data: [], success: true });
    });
  });

  describe('saveShipmentHeader', () => {
    it('should POST header data', () => {
      const dto: ShipmentHeaderDto = {
        shipmentNo: 'SH001', consigneeId: 'C1', consigneeName: 'Hospital',
        shipmentDate: new Date(), address1: '', city: '', state: '', zip: '', country: '',
        carrier: 'BC', carrierDesc: 'Van', trackNo: '123', flightNo: ''
      };

      service.saveShipmentHeader(dto).subscribe(result => {
        expect(result.shipmentNo).toBe('SH001');
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.CREATE_HEADER}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ data: [dto], success: true });
    });
  });

  describe('getBoxList', () => {
    it('should GET boxes for shipment', () => {
      const mockBoxes: BoxDataDto[] = [
        { boxId: 'BOX001', boxType: 'Cooler', packedBy: 'User1', packedDate: new Date() }
      ];

      service.getBoxList('SH001').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].boxId).toBe('BOX001');
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.GET_BOXES('SH001')}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockBoxes, success: true });
    });
  });

  describe('getAvailableBoxes', () => {
    it('should GET available boxes with consigneeId query param', () => {
      service.getAvailableBoxes('CONS001').subscribe(result => {
        expect(result).toBeTruthy();
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.GET_BOXES('available')}?consigneeId=CONS001`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], success: true });
    });
  });

  describe('getProductsInBox', () => {
    it('should GET products for shipment', () => {
      const mockProducts: ProductInBoxDto[] = [
        { boxId: 'BOX001', productCode: 'RBC', aboRhDesc: 'O Pos', productCount: 2 }
      ];

      service.getProductsInBox('SH001').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].productCode).toBe('RBC');
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.GET_PRODUCTS_IN_BOX('SH001')}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockProducts, success: true });
    });
  });

  describe('getConsigneesInSameZone', () => {
    it('should GET zone consignees', () => {
      const mockConsignees: ConsigneeInZoneDto[] = [
        { consigneeId: 'C2', name: 'Clinic', orderClass: 'Standing', orderStatus: 'Active', orderStatusDesc: 'Active' }
      ];

      service.getConsigneesInSameZone('C1', 'WEST').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].consigneeId).toBe('C2');
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.GET_ZONE_CONSIGNEES('C1', 'WEST')}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockConsignees, success: true });
    });
  });

  describe('getDefaultCharges', () => {
    it('should GET default charges for shipment', () => {
      service.getDefaultCharges('SH001').subscribe(result => {
        expect(result).toBeTruthy();
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.DEFAULT_CHARGES('SH001')}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [mockChargeDto], success: true });
    });
  });

  describe('getPrinters', () => {
    it('should GET and transform printer data', () => {
      const rawPrinters = [
        { printerId: 'PR1', printerDescription: 'Printer One' },
        { printerId: 'PR2', printerDescription: 'Printer Two' }
      ];

      service.getPrinters().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('PR1');
        expect(result[0].codeDesc).toBe('Printer One');
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.LOOKUP_PRINTERS}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(rawPrinters);
    });

    it('should handle null data', () => {
      service.getPrinters().subscribe(result => {
        expect(result).toEqual([]);
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.LOOKUP_PRINTERS}`;
      const req = httpMock.expectOne(expectedUrl);
      req.flush(null);
    });
  });

  describe('finalizeShipment', () => {
    it('should POST to finalize endpoint', () => {
      service.finalizeShipment('SH001').subscribe(result => {
        expect(result).toBeTruthy();
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.FINALIZE_SHIPMENT('SH001')}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ data: [{ shipmentNo: 'SH001', success: true }], success: true });
    });

    it('should return empty object when data is null', () => {
      service.finalizeShipment('SH999').subscribe(result => {
        expect(result).toEqual({} as FinalizeShipmentResponseDto);
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.FINALIZE_SHIPMENT('SH999')}`;
      const req = httpMock.expectOne(expectedUrl);
      req.flush({ data: null, success: true });
    });
  });

  describe('deleteCharge', () => {
    it('should send DELETE and return boolean', () => {
      service.deleteCharge('SH001', 'ORD001').subscribe(result => {
        expect(result).toBeTrue();
      });

      const expectedUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.DELETE('SH001', 'ORD001')}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('DELETE');
      req.flush({ data: true, success: true });
    });
  });
});
