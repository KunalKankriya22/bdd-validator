import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ShipDiscardSalvageApiService } from './ship-discard-salvage-api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ShipDiscardSalvageShipmentDto,
  BoxDto,
  CreateShipDiscardSalvageShipmentRequestDto,
  AddBoxToShipmentRequestDto,
  ApiResponse,
} from '../models/ship-discard-salvage.model';

describe('ShipDiscardSalvageApiService', () => {
  let service: ShipDiscardSalvageApiService;
  let httpMock: HttpTestingController;

  const mockShipmentDto: ShipDiscardSalvageShipmentDto = {
    shipmentNo: 'DI20260530120000',
    chapterId: '0001',
    consigneeId: 'DISC001',
    consigneeName: 'Discard Processing Center',
    address1: '123 Main St',
    address2: 'Suite 100',
    city: 'Dallas',
    state: 'TX',
    zip: '75235',
    country: 'USA',
    shipmentDate: '2026-05-30T12:00:00Z',
    shipmentStatus: 'OP',
    carrier: 'UPS',
    carrierDescription: 'UPS Ground',
    trackingNo: '1Z999AA10123456784',
    flightNo: 'AA1234',
    boxCount: 3,
    invoicePrintedDate: undefined,
  };

  const mockBoxDto: BoxDto = {
    boxId: 'BOX0001234',
    boxStatus: 'CL',
    boxType: 'STD',
    boxTypeDescription: 'Standard Box',
    packedByUserId: 'USER01',
    packedByUserName: 'Smith, John',
    packedDate: '2026-05-30T10:30:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ShipDiscardSalvageApiService],
    });
    service = TestBed.inject(ShipDiscardSalvageApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getOpenShipments', () => {
    it('should retrieve open shipments successfully', () => {
      const mockResponse: ApiResponse<ShipDiscardSalvageShipmentDto> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [mockShipmentDto],
        totalCount: 1,
      };

      service.getOpenShipments().subscribe((shipments) => {
        expect(shipments.length).toBe(1);
        expect(shipments[0].shipmentNo).toBe('DI20260530120000');
        expect(shipments[0].consigneeName).toBe('Discard Processing Center');
        expect(shipments[0].shipmentStatus).toBe('OP');
        expect(shipments[0].fullAddress).toContain('123 Main St');
      });

      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_SHIPMENTS);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


    it('should handle error when fetching shipments fails', () => {
      const errorMessage = 'Server error';

      service.getOpenShipments().subscribe({
        next: () => fail('should have failed with 500 error'),
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_SHIPMENTS);
      req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getShipmentById', () => {
    it('should retrieve shipment by ID successfully', () => {
      const shipmentNo = 'DI20260530120000';
      const mockResponse: ApiResponse<ShipDiscardSalvageShipmentDto> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [mockShipmentDto],
        totalCount: 1,
      };

      service.getShipmentById(shipmentNo).subscribe((shipment) => {
        expect(shipment).toBeTruthy();
        expect(shipment?.shipmentNo).toBe('DI20260530120000');
        expect(shipment?.consigneeId).toBe('DISC001');
      });

      const req = httpMock.expectOne(
        API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_SHIPMENT_BY_ID(shipmentNo)
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('createShipment', () => {
    it('should create shipment successfully', () => {
      const request: CreateShipDiscardSalvageShipmentRequestDto = {
        consigneeId: 'DISC001',
        carrier: 'UPS',
        trackingNo: '1Z999AA10123456784',
        flightNo: 'AA1234',
      };

      const mockResponse: ApiResponse<ShipDiscardSalvageShipmentDto> = {
        success: true,
        statusCode: 201,
        message: 'Shipment created successfully',
        data: [mockShipmentDto],
        totalCount: 1,
      };

      service.createShipment(request).subscribe((shipment) => {
        expect(shipment.shipmentNo).toBe('DI20260530120000');
        expect(shipment.consigneeId).toBe('DISC001');
        expect(shipment.carrier).toBe('UPS');
      });

      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.CREATE_SHIPMENT);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle error 4309 - No boxes for consignee', () => {
      const request: CreateShipDiscardSalvageShipmentRequestDto = {
        consigneeId: 'EMPTY001',
        carrier: 'UPS',
        trackingNo: '1Z999AA10123456784',
      };

      const errorResponse = {
        success: false,
        statusCode: 400,
        errorCode: '4309',
        errorResponse: {
          errorCode: '4309',
          error: 'No boxes found for this consignee',
        },
      };

      service.createShipment(request).subscribe({
        next: () => fail('should have failed with error 4309'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.CREATE_SHIPMENT);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle error 4307 - Carrier not active', () => {
      const request: CreateShipDiscardSalvageShipmentRequestDto = {
        consigneeId: 'DISC001',
        carrier: 'INACT',
        trackingNo: '1Z999AA10123456784',
      };

      const errorResponse = {
        success: false,
        statusCode: 400,
        errorCode: '4307',
        errorResponse: {
          errorCode: '4307',
          error: 'Carrier not found or not active',
        },
      };

      service.createShipment(request).subscribe({
        next: () => fail('should have failed with error 4307'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.CREATE_SHIPMENT);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('addBoxToShipment', () => {
    it('should add box to shipment successfully', () => {
      const shipmentNo = 'DI20260530120000';
      const request: AddBoxToShipmentRequestDto = {
        boxId: 'BOX0001234',
      };

      const mockResponse: ApiResponse<BoxDto> = {
        success: true,
        statusCode: 200,
        message: 'Box added to shipment successfully',
        data: [mockBoxDto],
        totalCount: 1,
      };

      service.addBoxToShipment(shipmentNo, request).subscribe((box) => {
        expect(box.boxId).toBe('BOX0001234');
        expect(box.boxStatus).toBe('CL');
        expect(box.boxTypeDescription).toBe('Standard Box');
      });

      const req = httpMock.expectOne(
        API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.ADD_BOX_TO_SHIPMENT(shipmentNo)
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle error 0334 - Box not found', () => {
      const shipmentNo = 'DI20260530120000';
      const request: AddBoxToShipmentRequestDto = {
        boxId: 'NOTFOUND',
      };

      const errorResponse = {
        success: false,
        statusCode: 400,
        errorCode: '0334',
        errorResponse: {
          errorCode: '0334',
          error: 'Box not found in warehouse',
        },
      };

      service.addBoxToShipment(shipmentNo, request).subscribe({
        next: () => fail('should have failed with error 0334'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(
        API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.ADD_BOX_TO_SHIPMENT(shipmentNo)
      );
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle error 4004 - Box does not belong to consignee', () => {
      const shipmentNo = 'DI20260530120000';
      const request: AddBoxToShipmentRequestDto = {
        boxId: 'WRONGBOX',
      };

      const errorResponse = {
        success: false,
        statusCode: 400,
        errorCode: '4004',
        errorResponse: {
          errorCode: '4004',
          error: 'Box does not belong to this consignee',
        },
      };

      service.addBoxToShipment(shipmentNo, request).subscribe({
        next: () => fail('should have failed with error 4004'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(
        API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.ADD_BOX_TO_SHIPMENT(shipmentNo)
      );
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle error 4013 - Box must be closed', () => {
      const shipmentNo = 'DI20260530120000';
      const request: AddBoxToShipmentRequestDto = {
        boxId: 'OPENBOX01',
      };

      const errorResponse = {
        success: false,
        statusCode: 400,
        errorCode: '4013',
        errorResponse: {
          errorCode: '4013',
          error: 'Box must be closed before shipping',
        },
      };

      service.addBoxToShipment(shipmentNo, request).subscribe({
        next: () => fail('should have failed with error 4013'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(
        API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.ADD_BOX_TO_SHIPMENT(shipmentNo)
      );
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getBoxesForConsignee', () => {
    it('should retrieve boxes for consignee successfully', () => {
      const consigneeId = 'DISC001';
      const mockResponse: ApiResponse<BoxDto> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [mockBoxDto, { ...mockBoxDto, boxId: 'BOX0001235' }],
        totalCount: 2,
      };

      service.getBoxesForConsignee(consigneeId).subscribe((boxes) => {
        expect(boxes.length).toBe(2);
        expect(boxes[0].boxId).toBe('BOX0001234');
        expect(boxes[1].boxId).toBe('BOX0001235');
      });

      const req = httpMock.expectOne(
        API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_BOXES_FOR_CONSIGNEE(consigneeId)
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('getActiveCarriers', () => {
    it('should call the correct carriers URL', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [],
        totalCount: 0,
      };

      service.getActiveCarriers().subscribe();

      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_CARRIERS);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should map camelCase carrier response correctly', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [
          { carrierCode: 'UPS', carrierName: 'UPS Ground' },
          { carrierCode: 'FDX', carrierName: 'FedEx Express' },
        ],
        totalCount: 2,
      };

      service.getActiveCarriers().subscribe((carriers) => {
        expect(carriers.length).toBe(2);
        expect(carriers[0].carrierCode).toBe('UPS');
        expect(carriers[0].carrierName).toBe('UPS Ground');
        expect(carriers[0].description).toBe('UPS - UPS Ground');
        expect(carriers[0].isActive).toBeTrue();
        expect(carriers[1].carrierCode).toBe('FDX');
        expect(carriers[1].carrierName).toBe('FedEx Express');
        expect(carriers[1].description).toBe('FDX - FedEx Express');
      });

      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_CARRIERS);
      req.flush(mockResponse);
    });

    it('should map PascalCase carrier response correctly', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [
          { CarrierCode: 'DHL', CarrierName: 'DHL International' },
        ],
        totalCount: 1,
      };

      service.getActiveCarriers().subscribe((carriers) => {
        expect(carriers.length).toBe(1);
        expect(carriers[0].carrierCode).toBe('DHL');
        expect(carriers[0].carrierName).toBe('DHL International');
        expect(carriers[0].description).toBe('DHL - DHL International');
        expect(carriers[0].isActive).toBeTrue();
      });

      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_CARRIERS);
      req.flush(mockResponse);
    });


    it('should handle error when fetching carriers fails', () => {
      service.getActiveCarriers().subscribe({
        next: () => fail('should have failed with 500 error'),
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_CARRIERS);
      req.flush('Server error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getConsigneesWithBoxes', () => {
    it('should call the correct consignees URL', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [],
        totalCount: 0,
      };

      service.getConsigneesWithBoxes().subscribe();

      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_CONSIGNEES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should map camelCase consignee response correctly', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [
          { consigneeId: 'DISC001', consigneeName: 'Discard Processing Center' },
          { consigneeId: 'SALV001', consigneeName: 'Salvage Depot' },
        ],
        totalCount: 2,
      };

      service.getConsigneesWithBoxes().subscribe((consignees) => {
        expect(consignees.length).toBe(2);
        expect(consignees[0].consigneeId).toBe('DISC001');
        expect(consignees[0].consigneeName).toBe('Discard Processing Center');
        expect(consignees[0].description).toBe('DISC001 - Discard Processing Center');
        expect(consignees[1].consigneeId).toBe('SALV001');
        expect(consignees[1].consigneeName).toBe('Salvage Depot');
      });

      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_CONSIGNEES);
      req.flush(mockResponse);
    });

    it('should map PascalCase consignee response correctly', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [
          { ConsigneeId: 'DISC002', ConsigneeName: 'Alt Discard Center' },
        ],
        totalCount: 1,
      };

      service.getConsigneesWithBoxes().subscribe((consignees) => {
        expect(consignees.length).toBe(1);
        expect(consignees[0].consigneeId).toBe('DISC002');
        expect(consignees[0].consigneeName).toBe('Alt Discard Center');
        expect(consignees[0].description).toBe('DISC002 - Alt Discard Center');
      });

      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_CONSIGNEES);
      req.flush(mockResponse);
    });


    it('should handle error when fetching consignees fails', () => {
      service.getConsigneesWithBoxes().subscribe({
        next: () => fail('should have failed with 500 error'),
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_CONSIGNEES);
      req.flush('Server error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('completeShipment (finalize)', () => {

    it('should encode special characters in shipment number', () => {
      const shipmentNo = 'DI2026/05+30';

      service.completeShipment(shipmentNo).subscribe();

      const expectedUrl = `${API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.BASE}/shipments/${encodeURIComponent(shipmentNo)}/finalize`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('should handle error when completing shipment fails', () => {
      const shipmentNo = 'DI20260530120000';

      service.completeShipment(shipmentNo).subscribe({
        next: () => fail('should have failed with 500 error'),
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const expectedUrl = `${API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.BASE}/shipments/${encodeURIComponent(shipmentNo)}/finalize`;
      const req = httpMock.expectOne(expectedUrl);
      req.flush('Server error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('removeBoxFromShipment', () => {
    it('should call DELETE with the correct URL', () => {
      const shipmentNo = 'DI20260530120000';
      const boxId = 'BOX0001234';

      service.removeBoxFromShipment(shipmentNo, boxId).subscribe();

      const expectedUrl = `${API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.BASE}/shipments/${encodeURIComponent(shipmentNo)}/boxes/${encodeURIComponent(boxId)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should encode special characters in shipment number and box ID', () => {
      const shipmentNo = 'DI2026/05+30';
      const boxId = 'BOX/001+234';

      service.removeBoxFromShipment(shipmentNo, boxId).subscribe();

      const expectedUrl = `${API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.BASE}/shipments/${encodeURIComponent(shipmentNo)}/boxes/${encodeURIComponent(boxId)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should handle error when removing box fails', () => {
      const shipmentNo = 'DI20260530120000';
      const boxId = 'BOX0001234';

      service.removeBoxFromShipment(shipmentNo, boxId).subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const expectedUrl = `${API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.BASE}/shipments/${encodeURIComponent(shipmentNo)}/boxes/${encodeURIComponent(boxId)}`;
      const req = httpMock.expectOne(expectedUrl);
      req.flush({ errorCode: '4306', error: 'Shipment not found' }, { status: 400, statusText: 'Bad Request' });
    });

  });

  describe('getShipmentProducts', () => {
    it('should retrieve shipment products', () => {
      const shipmentNo = 'DI20260530120000';
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [{ unitId: 'U1', productCode: 'PC1' }], totalCount: 1 };
      service.getShipmentProducts(shipmentNo).subscribe(products => {
        expect(products.length).toBe(1);
        expect(products[0].unitId).toBe('U1');
      });
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_SHIPMENT_PRODUCTS(shipmentNo));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
    it('should handle error', () => {
      service.getShipmentProducts('DI1').subscribe({ error: err => expect(err.status).toBe(500) });
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_SHIPMENT_PRODUCTS('DI1'));
      req.flush('Error', { status: 500, statusText: 'Error' });
    });
  });

  describe('getZoneConsignees', () => {
    it('should retrieve zone consignees', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [{ consigneeId: 'C1' }], totalCount: 1 };
      service.getZoneConsignees('DISC001').subscribe(consignees => {
        expect(consignees.length).toBe(1);
      });
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_ZONE_CONSIGNEES('DISC001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
    it('should handle error', () => {
      service.getZoneConsignees('C1').subscribe({ error: err => expect(err.status).toBe(500) });
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_ZONE_CONSIGNEES('C1'));
      req.flush('Error', { status: 500, statusText: 'Error' });
    });
  });

  describe('getShipmentCharges', () => {
    it('should retrieve shipment charges', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [{ chargeCode: 'CH1', amount: 100 }], totalCount: 1 };
      service.getShipmentCharges('DI1').subscribe(charges => {
        expect(charges.length).toBe(1);
      });
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_SHIPMENT_CHARGES('DI1'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
    it('should handle error', () => {
      service.getShipmentCharges('DI1').subscribe({ error: err => expect(err.status).toBe(500) });
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_SHIPMENT_CHARGES('DI1'));
      req.flush('Error', { status: 500, statusText: 'Error' });
    });
  });

  describe('addShipmentCharge', () => {
    it('should add charge and return data', () => {
      const request = { chargeCode: 'CH1', amount: 100 } as any;
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [{ chargeCode: 'CH1' }], totalCount: 1 };
      service.addShipmentCharge('DI1', request).subscribe(charges => {
        expect(charges.length).toBe(1);
      });
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.ADD_SHIPMENT_CHARGE('DI1'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
    it('should handle error', () => {
      service.addShipmentCharge('DI1', {} as any).subscribe({ error: err => expect(err.status).toBe(400) });
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.ADD_SHIPMENT_CHARGE('DI1'));
      req.flush('Error', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('deleteShipmentCharge', () => {
    it('should delete charge', () => {
      service.deleteShipmentCharge('DI1', 'CH1', '001').subscribe();
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.DELETE_SHIPMENT_CHARGE('DI1', 'CH1', '001'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
    it('should handle error', () => {
      service.deleteShipmentCharge('DI1', 'CH1', '001').subscribe({ error: err => expect(err.status).toBe(500) });
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.DELETE_SHIPMENT_CHARGE('DI1', 'CH1', '001'));
      req.flush('Error', { status: 500, statusText: 'Error' });
    });
  });

  describe('getChargeCodes', () => {
    it('should retrieve charge codes', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [{ code: 'CH1', description: 'Charge 1' }], totalCount: 1 };
      service.getChargeCodes().subscribe(codes => { expect(codes.length).toBe(1); });
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_CHARGE_CODES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
    it('should handle error', () => {
      service.getChargeCodes().subscribe({ error: err => expect(err.status).toBe(500) });
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_CHARGE_CODES);
      req.flush('Error', { status: 500, statusText: 'Error' });
    });
  });

  describe('getCreditDebitTypes', () => {
    it('should retrieve credit/debit types', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [{ code: 'CR', description: 'Credit' }], totalCount: 1 };
      service.getCreditDebitTypes().subscribe(types => { expect(types.length).toBe(1); });
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_CREDIT_DEBIT_TYPES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
    it('should handle error', () => {
      service.getCreditDebitTypes().subscribe({ error: err => expect(err.status).toBe(500) });
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_CREDIT_DEBIT_TYPES);
      req.flush('Error', { status: 500, statusText: 'Error' });
    });
  });

  describe('getShipmentById edge cases', () => {
    it('should return null when no data in response', () => {
      service.getShipmentById('DI1').subscribe(shipment => {
        expect(shipment).toBeNull();
      });
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_SHIPMENT_BY_ID('DI1'));
      req.flush({ success: true, statusCode: 200, message: 'OK', data: [], totalCount: 0 });
    });
  });

  describe('createShipment edge cases', () => {
    it('should throw error when no data returned', () => {
      const request = { consigneeId: 'DISC001', carrier: 'UPS' } as any;
      service.createShipment(request).subscribe({
        error: err => expect(err.message).toContain('No shipment data')
      });
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.CREATE_SHIPMENT);
      req.flush({ success: true, statusCode: 201, message: 'OK', data: [], totalCount: 0 });
    });
  });

  describe('addBoxToShipment edge cases', () => {
    it('should throw error when no box data returned', () => {
      service.addBoxToShipment('DI1', { boxId: 'BOX1' }).subscribe({
        error: err => expect(err.message).toContain('No box data')
      });
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.ADD_BOX_TO_SHIPMENT('DI1'));
      req.flush({ success: true, statusCode: 200, message: 'OK', data: [], totalCount: 0 });
    });
  });

  describe('transformShipmentDto edge cases', () => {
    it('should handle null optional fields', () => {
      const dto = {
        shipmentNo: 'DI1', chapterId: '0001', consigneeId: 'C1', consigneeName: 'Test',
        address1: null, address2: null, city: null, state: null, zip: null, country: null,
        shipmentDate: '2026-05-30T12:00:00Z', shipmentStatus: 'OP',
        carrier: null, carrierDescription: null, trackingNo: null, flightNo: null,
        boxCount: 0, invoicePrintedDate: null
      };
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [dto], totalCount: 1 };
      service.getOpenShipments().subscribe(shipments => {
        expect(shipments[0].address1).toBe('');
        expect(shipments[0].carrier).toBe('');
        expect(shipments[0].fullAddress).toBe('');
      });
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_SHIPMENTS);
      req.flush(mockResponse);
    });
  });

  describe('transformBoxDto edge cases', () => {
    it('should handle null optional fields', () => {
      const dto = { boxId: 'B1', boxStatus: 'OP', boxType: null, boxTypeDescription: null, packedByUserId: null, packedByUserName: null, packedDate: null };
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [dto], totalCount: 1 };
      service.getBoxesForConsignee('C1').subscribe(boxes => {
        expect(boxes[0].boxType).toBe('');
        expect(boxes[0].packedDate).toBeNull();
      });
      const req = httpMock.expectOne(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_BOXES_FOR_CONSIGNEE('C1'));
      req.flush(mockResponse);
    });
  });
});
