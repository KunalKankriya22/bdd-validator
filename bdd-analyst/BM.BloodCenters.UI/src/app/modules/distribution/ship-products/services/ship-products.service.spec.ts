import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { ShipProductsService } from './ship-products.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ShipmentDto,
  CreateShipmentDto,
  UpdateShipmentDto,
  ShipmentQueryDto,
  ApiResponse,
  PackedBoxLookupDto,
  BoxDto,
  BoxProductDto,
  ShipmentChargeDto,
  CreateShipmentChargeRequestDto,
  ChargeCodeLookup,
  ConsigneeInZoneDto,
  ValidateBoxScanResponse
} from '../models/ship-products.model';

describe('ShipProductsService', () => {
  let service: ShipProductsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockShipment: ShipmentDto = {
    shipmentNo: 'SHIP001',
    chapterId: '0001',
    consigneeId: 'CONS001',
    consigneeName: 'Test Hospital',
    address1: '123 Main St',
    address2: null,
    city: 'Dallas',
    state: 'TX',
    zip: '75235',
    country: 'USA',
    shipmentDate: '2024-05-30T10:30:00Z',
    shipmentStatus: 'OP',
    shippedByUserId: 'USER01',
    shipmentType: 'RE',
    carrier: 'FEDEX',
    carrierDescription: 'Federal Express',
    trackNo: 'TRACK123456',
    flightNo: 'FL001',
    invoicePrintedDate: null,
    programId: "SHIPMENT"
  };

  const mockApiResponse: ApiResponse<ShipmentDto[]> = {
    success: true,
    statusCode: 200,
    message: 'Success',
    data: [mockShipment],
    total: 1
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'get',
      'post',
      'put',
      'delete'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ShipProductsService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(ShipProductsService);
  });

  describe('getAllShipments', () => {
    it('should call POST endpoint with correct parameters', (done) => {
      const take = 10;
      const skip = 0;
      const query: ShipmentQueryDto = { shipmentStatus: 'OP' };

      apiServiceSpy.post.and.returnValue(of(mockApiResponse));

      service.getAllShipments(take, skip, query).subscribe({
        next: (response) => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.SHIP_PRODUCTS.GET_ALL(take, skip),
            query
          );
          expect(response).toEqual(mockApiResponse);
          done();
        }
      });
    });

    it('should work with empty query', (done) => {
      const take = 10;
      const skip = 0;

      apiServiceSpy.post.and.returnValue(of(mockApiResponse));

      service.getAllShipments(take, skip).subscribe({
        next: (response) => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.SHIP_PRODUCTS.GET_ALL(take, skip),
            {}
          );
          done();
        }
      });
    });
  });

  describe('getShipmentByNumber', () => {
    it('should call GET endpoint with shipment number', (done) => {
      const shipmentNo = 'SHIP001';

      apiServiceSpy.get.and.returnValue(of(mockApiResponse));

      service.getShipmentByNumber(shipmentNo).subscribe({
        next: (response) => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.SHIP_PRODUCTS.GET_BY_NUMBER(shipmentNo)
          );
          expect(response).toEqual(mockApiResponse);
          done();
        }
      });
    });
  });

  describe('createShipment', () => {
    it('should call POST endpoint with shipment data', (done) => {
      const createDto: CreateShipmentDto = {
        consigneeId: 'CONS001',
        carrier: 'FEDEX',
        trackNo: 'TRACK123456',
        flightNo: 'FL001',
        shipmentType: 'RE',
        shipmentStatus: 'OP'
      };

      const createResponse: ApiResponse<{ shipmentNo: string }[]> = {
        success: true,
        statusCode: 201,
        message: 'Shipment created successfully',
        data: [{ shipmentNo: 'SHIP999' }]
      };

      apiServiceSpy.post.and.returnValue(of(createResponse));

      service.createShipment(createDto).subscribe({
        next: (response) => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.SHIP_PRODUCTS.CREATE,
            createDto
          );
          expect(response).toEqual(createResponse);
          done();
        }
      });
    });
  });

  describe('updateShipment', () => {
    it('should call PUT endpoint with shipment data', (done) => {
      const shipmentNo = 'SHIP001';
      const updateDto: UpdateShipmentDto = {
        carrier: 'UPS',
        trackNo: 'TRACK987654',
        flightNo: 'FL002'
      };

      const updateResponse: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Shipment updated successfully',
        data: undefined as any
      };

      apiServiceSpy.put.and.returnValue(of(updateResponse));

      service.updateShipment(shipmentNo, updateDto).subscribe({
        next: (response) => {
          expect(apiServiceSpy.put).toHaveBeenCalledWith(
            API.SHIP_PRODUCTS.UPDATE(shipmentNo),
            updateDto
          );
          expect(response).toEqual(updateResponse);
          done();
        }
      });
    });
  });

  describe('getShipmentNumberOptions', () => {
    it('should fetch shipments and map to LOV options with date formatting', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockApiResponse));

      service.getShipmentNumberOptions().subscribe({
        next: (options) => {
          expect(apiServiceSpy.post).toHaveBeenCalled();
          expect(options.length).toBe(1);
          expect(options[0].value).toBe('SHIP001');
          expect(options[0].label).toBe('SHIP001');
          // Description now includes consigneeName + formatted date (MM/DD/YY)
          expect(options[0].description).toBe('Test Hospital - 05/30/24');
          done();
        }
      });
    });

    it('should pass correct query parameters with limit 500', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockApiResponse));

      service.getShipmentNumberOptions().subscribe({
        next: () => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.SHIP_PRODUCTS.GET_ALL(500, 0),
            { shipmentStatus: 'OP', shipmentType: 'RE', sortColumn: 'ShipmentDate', sortOrder: 'DESC' }
          );
          done();
        }
      });
    });

    it('should return empty array when response data is null', (done) => {
      const nullDataResponse: ApiResponse<ShipmentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null as any
      };

      apiServiceSpy.post.and.returnValue(of(nullDataResponse));

      service.getShipmentNumberOptions().subscribe({
        next: (options) => {
          expect(options).toEqual([]);
          done();
        }
      });
    });

    it('should show only consigneeName when shipmentDate is null', (done) => {
      const shipmentNoDate: ShipmentDto = {
        ...mockShipment,
        shipmentDate: null as any
      };
      const response: ApiResponse<ShipmentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [shipmentNoDate]
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.getShipmentNumberOptions().subscribe({
        next: (options) => {
          expect(options[0].description).toBe('Test Hospital');
          done();
        }
      });
    });

    it('should show only formatted date when consigneeName is null', (done) => {
      const shipmentNoConsignee: ShipmentDto = {
        ...mockShipment,
        consigneeName: null
      };
      const response: ApiResponse<ShipmentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [shipmentNoConsignee]
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.getShipmentNumberOptions().subscribe({
        next: (options) => {
          expect(options[0].description).toBe('05/30/24');
          done();
        }
      });
    });

    it('should map undefined description when both consigneeName and shipmentDate are null', (done) => {
      const shipmentBothNull: ShipmentDto = {
        ...mockShipment,
        consigneeName: null,
        shipmentDate: null as any
      };
      const response: ApiResponse<ShipmentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [shipmentBothNull]
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.getShipmentNumberOptions().subscribe({
        next: (options) => {
          expect(options[0].description).toBeUndefined();
          done();
        }
      });
    });
  });

  describe('getConsigneeOptions', () => {
    it('should call GET endpoint and map consignees to LOV options', (done) => {
      const mockConsignees = [
        { consigneeId: 'CONS001', name: 'Test Hospital', address1: '123 Main St', city: 'Dallas', state: 'TX', country: 'USA' },
        { consigneeId: 'CONS002', name: 'City Clinic', address1: '456 Oak Ave', city: 'Houston', state: 'TX', country: 'USA' }
      ];
      const response: ApiResponse<typeof mockConsignees> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockConsignees
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getConsigneeOptions().subscribe({
        next: (options) => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.SHIP_PRODUCTS.CONSIGNEE_LOV);
          expect(options.length).toBe(2);
          expect(options[0]).toEqual({ value: 'CONS001', label: 'CONS001', description: 'Test Hospital' });
          expect(options[1]).toEqual({ value: 'CONS002', label: 'CONS002', description: 'City Clinic' });
          done();
        }
      });
    });

    it('should return empty array when response data is null', (done) => {
      const response: ApiResponse<any> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null as any
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getConsigneeOptions().subscribe({
        next: (options) => {
          expect(options).toEqual([]);
          done();
        }
      });
    });

    it('should map null name to undefined description', (done) => {
      const mockConsignees = [
        { consigneeId: 'CONS001', name: null, address1: '123 Main St', city: 'Dallas', state: 'TX', country: 'USA' }
      ];
      const response: ApiResponse<typeof mockConsignees> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockConsignees
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getConsigneeOptions().subscribe({
        next: (options) => {
          expect(options[0].description).toBeUndefined();
          done();
        }
      });
    });
  });

  describe('getCarrierOptions', () => {
    it('should call GET endpoint and map carriers to LOV options', (done) => {
      const mockCarriers = [
        { code: 'FEDEX', description: 'Federal Express' },
        { code: 'UPS', description: 'United Parcel Service' }
      ];
      const response: ApiResponse<typeof mockCarriers> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockCarriers
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getCarrierOptions().subscribe({
        next: (options) => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.SHIP_PRODUCTS.CARRIER_LOV);
          expect(options.length).toBe(2);
          expect(options[0]).toEqual({ value: 'FEDEX', label: 'FEDEX', description: 'Federal Express' });
          expect(options[1]).toEqual({ value: 'UPS', label: 'UPS', description: 'United Parcel Service' });
          done();
        }
      });
    });

    it('should return empty array when response data is null', (done) => {
      const response: ApiResponse<any> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null as any
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getCarrierOptions().subscribe({
        next: (options) => {
          expect(options).toEqual([]);
          done();
        }
      });
    });

    it('should map null description to undefined', (done) => {
      const mockCarriers = [
        { code: 'COUR', description: null }
      ];
      const response: ApiResponse<typeof mockCarriers> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockCarriers
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getCarrierOptions().subscribe({
        next: (options) => {
          expect(options[0].description).toBeUndefined();
          done();
        }
      });
    });
  });

  describe('getShipmentBoxes', () => {
    const mockBoxes: BoxDto[] = [
      { boxId: 'BOX001', shipmentNo: 'SHIP001', boxType: 'Cooler', packedBy: 'USER01', packedDate: '2024-05-30T10:00:00Z', productCount: 3 },
      { boxId: 'BOX002', shipmentNo: 'SHIP001', boxType: '26 Qt Igloo', packedBy: 'USER02', packedDate: '2024-05-30T11:00:00Z', productCount: 5 }
    ];

    it('should call GET endpoint and return boxes', (done) => {
      const shipmentNo = 'SHIP001';
      const response: ApiResponse<BoxDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockBoxes
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getShipmentBoxes(shipmentNo).subscribe({
        next: (boxes) => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.SHIP_PRODUCTS.GET_BOXES(shipmentNo));
          expect(boxes).toEqual(mockBoxes);
          done();
        }
      });
    });

    it('should return empty array when response data is null', (done) => {
      const response: ApiResponse<BoxDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null as any
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getShipmentBoxes('SHIP001').subscribe({
        next: (boxes) => {
          expect(boxes).toEqual([]);
          done();
        }
      });
    });
  });

  describe('addBoxToShipment', () => {
    it('should call POST endpoint with correct shipment and box IDs', (done) => {
      const shipmentNo = 'SHIP001';
      const boxId = 'BOX001';
      const response: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Box added',
        data: undefined as any
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.addBoxToShipment(shipmentNo, boxId).subscribe({
        next: (result) => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.SHIP_PRODUCTS.ADD_BOX(shipmentNo, boxId),
            {}
          );
          expect(result).toEqual(response);
          done();
        }
      });
    });
  });

  describe('removeBoxFromShipment', () => {
    it('should call DELETE endpoint with correct shipment and box IDs', (done) => {
      const shipmentNo = 'SHIP001';
      const boxId = 'BOX001';
      const response: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Box removed',
        data: undefined as any
      };

      apiServiceSpy.delete.and.returnValue(of(response));

      service.removeBoxFromShipment(shipmentNo, boxId).subscribe({
        next: (result) => {
          expect(apiServiceSpy.delete).toHaveBeenCalledWith(
            API.SHIP_PRODUCTS.REMOVE_BOX(shipmentNo, boxId)
          );
          expect(result).toEqual(response);
          done();
        }
      });
    });
  });

  describe('getBoxProductsForShipment', () => {
    const mockBoxProducts: BoxProductDto[] = [
      { boxId: 'BOX001', productCode: 'RBC', orderedAboRh: 'O+', count: 2 },
      { boxId: 'BOX001', productCode: 'PLT', orderedAboRh: 'A-', count: 1 }
    ];

    it('should call GET endpoint and return box products', (done) => {
      const shipmentNo = 'SHIP001';
      const response: ApiResponse<BoxProductDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockBoxProducts
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getBoxProductsForShipment(shipmentNo).subscribe({
        next: (products) => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.SHIP_PRODUCTS.GET_BOX_PRODUCTS(shipmentNo)
          );
          expect(products).toEqual(mockBoxProducts);
          done();
        }
      });
    });

    it('should return empty array when response data is null', (done) => {
      const response: ApiResponse<BoxProductDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null as any
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getBoxProductsForShipment('SHIP001').subscribe({
        next: (products) => {
          expect(products).toEqual([]);
          done();
        }
      });
    });
  });

  describe('completeShipment', () => {
    it('should call POST endpoint with shipment number', (done) => {
      const shipmentNo = 'SHIP001';
      const response: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Shipment completed',
        data: undefined as any
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.completeShipment(shipmentNo).subscribe({
        next: (result) => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.SHIP_PRODUCTS.COMPLETE(shipmentNo),
            {}
          );
          expect(result).toEqual(response);
          done();
        }
      });
    });
  });

  describe('getShipmentCharges', () => {
    const mockCharges: ShipmentChargeDto[] = [
      {
        chargeCode: 'SHIP',
        description: 'Shipping Fee',
        quantity: 1,
        price: 25.00,
        amount: 25.00,
        crDbInd: 'D',
        crDbDesc: 'Debit',
        orderNo: 'ORD001',
        shipmentNo: 'SHIP001',
        deletableFlag: 'Y'
      }
    ];

    it('should call GET endpoint and return charges', (done) => {
      const shipmentNo = 'SHIP001';
      const response: ApiResponse<ShipmentChargeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockCharges
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getShipmentCharges(shipmentNo).subscribe({
        next: (charges) => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.SHIP_PRODUCTS.GET_CHARGES(shipmentNo)
          );
          expect(charges).toEqual(mockCharges);
          done();
        }
      });
    });

    it('should return empty array when response data is null', (done) => {
      const response: ApiResponse<ShipmentChargeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null as any
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getShipmentCharges('SHIP001').subscribe({
        next: (charges) => {
          expect(charges).toEqual([]);
          done();
        }
      });
    });
  });

  describe('addShipmentCharge', () => {
    it('should call POST endpoint with charge data', (done) => {
      const shipmentNo = 'SHIP001';
      const charge: CreateShipmentChargeRequestDto = {
        chargeCode: 'SHIP',
        quantity: 2
      };
      const response: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Charge added',
        data: undefined as any
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.addShipmentCharge(shipmentNo, charge).subscribe({
        next: (result) => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.SHIP_PRODUCTS.ADD_CHARGE(shipmentNo),
            charge
          );
          expect(result).toEqual(response);
          done();
        }
      });
    });
  });

  describe('deleteShipmentCharge', () => {
    it('should call DELETE endpoint with correct parameters', (done) => {
      const shipmentNo = 'SHIP001';
      const chargeCode = 'SHIP';
      const orderNo = 'ORD001';
      const response: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Charge deleted',
        data: undefined as any
      };

      apiServiceSpy.delete.and.returnValue(of(response));

      service.deleteShipmentCharge(shipmentNo, chargeCode, orderNo).subscribe({
        next: (result) => {
          expect(apiServiceSpy.delete).toHaveBeenCalledWith(
            API.SHIP_PRODUCTS.DELETE_CHARGE(shipmentNo, chargeCode, orderNo)
          );
          expect(result).toEqual(response);
          done();
        }
      });
    });
  });

  describe('getChargeCodes', () => {
    const mockChargeCodes: ChargeCodeLookup[] = [
      { chargeCode: 'SHIP', chargeCodeDesc: 'Shipping Fee', charge: 25.00, chargeCodeType: 'S', crDbDesc: 'Debit', shipFlag: 'Y' },
      { chargeCode: 'HAND', chargeCodeDesc: 'Handling Fee', charge: 10.00, chargeCodeType: 'H', crDbDesc: 'Debit', shipFlag: 'Y' }
    ];

    it('should call GET endpoint and return charge codes', (done) => {
      const response: ApiResponse<ChargeCodeLookup[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockChargeCodes
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getChargeCodes().subscribe({
        next: (codes) => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.SHIP_PRODUCTS.CHARGE_CODES_LOV);
          expect(codes).toEqual(mockChargeCodes);
          done();
        }
      });
    });

    it('should return empty array when response data is null', (done) => {
      const response: ApiResponse<ChargeCodeLookup[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null as any
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getChargeCodes().subscribe({
        next: (codes) => {
          expect(codes).toEqual([]);
          done();
        }
      });
    });
  });

  describe('getConsigneesInSameZone', () => {
    const mockConsigneesInZone: ConsigneeInZoneDto[] = [
      { consigneeId: 'CONS002', consigneeName: 'City Clinic', address1: '456 Oak Ave', city: 'Houston', state: 'TX', zip: '77001', zone: 'ZONE1' },
      { consigneeId: 'CONS003', consigneeName: 'Regional Medical', address1: '789 Pine St', city: 'Austin', state: 'TX', zip: '78701', zone: 'ZONE1' }
    ];

    it('should call GET endpoint and return consignees in same zone', (done) => {
      const consigneeId = 'CONS001';
      const response: ApiResponse<ConsigneeInZoneDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockConsigneesInZone
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getConsigneesInSameZone(consigneeId).subscribe({
        next: (consignees) => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.SHIP_PRODUCTS.GET_CONSIGNEES_IN_ZONE(consigneeId)
          );
          expect(consignees).toEqual(mockConsigneesInZone);
          done();
        }
      });
    });

    it('should return empty array when response data is null', (done) => {
      const response: ApiResponse<ConsigneeInZoneDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null as any
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getConsigneesInSameZone('CONS001').subscribe({
        next: (consignees) => {
          expect(consignees).toEqual([]);
          done();
        }
      });
    });
  });

  describe('getPackedBoxesForConsignee', () => {
    it('should call GET endpoint and return packed boxes', (done) => {
      const consigneeId = 'CONS001';
      const mockBoxes: PackedBoxLookupDto[] = [
        { boxId: 'BOX001', orderNo: 'ORD001', boxType: 'Cooler' },
        { boxId: 'BOX002', orderNo: 'ORD002', boxType: '26 Qt Igloo' }
      ];
      const boxResponse: ApiResponse<PackedBoxLookupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockBoxes
      };

      apiServiceSpy.get.and.returnValue(of(boxResponse));

      service.getPackedBoxesForConsignee(consigneeId).subscribe({
        next: (boxes) => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.SHIP_PRODUCTS.PACKED_BOXES_LOV(consigneeId)
          );
          expect(boxes).toEqual(mockBoxes);
          done();
        }
      });
    });

    it('should return empty array when response data is null', (done) => {
      const response: ApiResponse<PackedBoxLookupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null as any
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getPackedBoxesForConsignee('CONS001').subscribe({
        next: (boxes) => {
          expect(boxes).toEqual([]);
          done();
        }
      });
    });
  });

  describe('getPackListPrinterOptions', () => {
    it('should call GET endpoint and map printers to LOV options', (done) => {
      const mockPrinters = [
        { printerId: 'PRN001', printerDescription: 'Main Floor Printer' },
        { printerId: 'PRN002', printerDescription: 'Lab Printer' }
      ];

      apiServiceSpy.get.and.returnValue(of(mockPrinters));

      service.getPackListPrinterOptions().subscribe({
        next: (options) => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.SHIP_PRODUCTS.PRINTER_LOV);
          expect(options.length).toBe(2);
          expect(options[0]).toEqual({ value: 'PRN001', label: 'PRN001', description: 'Main Floor Printer' });
          expect(options[1]).toEqual({ value: 'PRN002', label: 'PRN002', description: 'Lab Printer' });
          done();
        }
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of(null));

      service.getPackListPrinterOptions().subscribe({
        next: (options) => {
          expect(options).toEqual([]);
          done();
        }
      });
    });
  });

  describe('validateBarcodeScan', () => {
    it('should call POST endpoint with barcode payload', (done) => {
      const barcode = 'BOX001-SCAN';
      const mockValidateResponse: ApiResponse<ValidateBoxScanResponse[]> = {
        success: true,
        statusCode: 200,
        message: 'Valid',
        data: [{ boxId: 'BOX001', isValid: true }]
      };

      apiServiceSpy.post.and.returnValue(of(mockValidateResponse));

      service.validateBarcodeScan(barcode).subscribe({
        next: (response) => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.SHIP_PRODUCTS.VALIDATE_BARCODE,
            { barcode }
          );
          expect(response).toEqual(mockValidateResponse);
          done();
        }
      });
    });

    it('should return invalid response for bad barcode', (done) => {
      const barcode = 'INVALID-BARCODE';
      const mockInvalidResponse: ApiResponse<ValidateBoxScanResponse[]> = {
        success: true,
        statusCode: 200,
        message: 'Invalid barcode',
        data: [{ boxId: '', isValid: false, errorMessage: 'Barcode not recognized' }]
      };

      apiServiceSpy.post.and.returnValue(of(mockInvalidResponse));

      service.validateBarcodeScan(barcode).subscribe({
        next: (response) => {
          expect(response.data[0].isValid).toBeFalse();
          expect(response.data[0].errorMessage).toBe('Barcode not recognized');
          done();
        }
      });
    });

    it('should propagate errors from barcode validation', (done) => {
      const errorResponse = { error: { message: 'Service unavailable', errorCode: '5000' } };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.validateBarcodeScan('ANY-BARCODE').subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors from API service', (done) => {
      const errorResponse = {
        error: {
          message: 'Shipment not found',
          errorCode: '4306'
        }
      };

      apiServiceSpy.get.and.returnValue(
        throwError(() => errorResponse)
      );

      service.getShipmentByNumber('INVALID').subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });

    it('should propagate errors from POST calls', (done) => {
      const errorResponse = { error: { message: 'Invalid consignee', errorCode: '1300' } };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.createShipment({ consigneeId: 'INVALID', trackNo: 'T1' }).subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });

    it('should propagate errors from PUT calls', (done) => {
      const errorResponse = { error: { message: 'Shipment not found', errorCode: '4306' } };

      apiServiceSpy.put.and.returnValue(throwError(() => errorResponse));

      service.updateShipment('INVALID', { trackNo: 'T1' }).subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });

    it('should propagate errors from DELETE calls', (done) => {
      const errorResponse = { error: { message: 'Charge not found', errorCode: '4003' } };

      apiServiceSpy.delete.and.returnValue(throwError(() => errorResponse));

      service.deleteShipmentCharge('SHIP001', 'SHIP', 'ORD001').subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });
});
