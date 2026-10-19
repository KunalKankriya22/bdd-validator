import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DeliveredShipmentsService } from './delivered-shipments.service';
import { environment } from '../../../../../environments/environment';
import {
  DeliveredShipmentDto,
  ApiResponse,
  DeliveredShipmentQueryDto,
} from '../models/delivered-shipments.model';

describe('DeliveredShipmentsService', () => {
  let service: DeliveredShipmentsService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/delivered-shipments`;

  const mockShipment: DeliveredShipmentDto = {
    shipmentNo: 'SH001',
    receiptDate: '2026-05-25T14:30:00Z',
    carrier: 'FedEx',
    consigneeName: 'General Hospital',
    address: '123 Main St',
    city: 'Dallas',
    state: 'Texas',
    zip: '75201',
    country: 'USA',
    orderType: 'Regular',
    orderClass: 'Priority',
    totalBoxes: 2,
    receivedBy: 'John Doe',
    trackingNo: '1234567890',
    flightNo: 'FL123',
    note: 'Handle with care',
    products: [
      {
        boxId: 'BOX001',
        unitId: '0123456789012',
        checkDigit: '45',
        collDate: '2026-05-20T00:00:00Z',
        productCode: 'RBC001',
        productDesc: 'Red Blood Cells',
        aliquot: '01',
        bloodType: 'O+',
        bloodTypeDesc: 'O Positive',
        expDate: '2026-06-20T00:00:00Z',
        pickSlipId: 'PS001',
        productType: 'RBC',
      },
      {
        boxId: 'BOX002',
        unitId: '0123456789013',
        checkDigit: '46',
        collDate: '2026-05-21T00:00:00Z',
        productCode: 'RBC002',
        productDesc: 'Red Blood Cells',
        aliquot: '02',
        bloodType: 'A+',
        bloodTypeDesc: 'A Positive',
        expDate: '2026-06-21T00:00:00Z',
        pickSlipId: 'PS002',
        productType: 'RBC',
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DeliveredShipmentsService],
    });

    service = TestBed.inject(DeliveredShipmentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getShipmentByNumber', () => {
    it('should retrieve a shipment by number', (done) => {
      const shipmentNo = 'SH001';
      const mockResponse: ApiResponse<DeliveredShipmentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Shipment retrieved successfully',
        data: [mockShipment],
        total: 1,
      };

      service.getShipmentByNumber(shipmentNo).subscribe({
        next: (result) => {
          expect(result).toEqual(mockShipment);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/${shipmentNo}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should retrieve a shipment with box filter', (done) => {
      const shipmentNo = 'SH001';
      const boxId = 'BOX001';
      const filteredShipment = { ...mockShipment, products: [mockShipment.products[0]] };
      const mockResponse: ApiResponse<DeliveredShipmentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Shipment retrieved successfully',
        data: [filteredShipment],
        total: 1,
      };

      service.getShipmentByNumber(shipmentNo, boxId).subscribe({
        next: (result) => {
          expect(result).toEqual(filteredShipment);
          expect(result?.products.length).toBe(1);
          expect(result?.products[0].boxId).toBe('BOX001');
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/${shipmentNo}?boxId=${boxId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


    it('should encode special characters in shipment number', () => {
      const shipmentNo = 'SH/001';

      service.getShipmentByNumber(shipmentNo).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(shipmentNo)}`);
      expect(req.request.urlWithParams).toContain('SH%2F001');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
      });
    });
  });

  describe('searchShipments', () => {
    it('should search shipments with query criteria', (done) => {
      const query: DeliveredShipmentQueryDto = {
        fromDate: '2026-05-01',
        toDate: '2026-05-31',
        sortColumn: 'ReceiptDate',
        sortOrder: 'DESC',
      };
      const take = 10;
      const skip = 0;

      const mockResponse: ApiResponse<DeliveredShipmentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Shipments retrieved successfully',
        data: [mockShipment],
        total: 25,
      };

      service.searchShipments(query, take, skip).subscribe({
        next: (result) => {
          expect(result.data).toEqual([mockShipment]);
          expect(result.total).toBe(25);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/${take}/${skip}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush(mockResponse);
    });

    it('should use default take and skip values', (done) => {
      const query: DeliveredShipmentQueryDto = {};
      const mockResponse: ApiResponse<DeliveredShipmentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
        total: 0,
      };

      service.searchShipments(query).subscribe({
        next: () => {
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

  });

  describe('getAllShipments', () => {
    it('should get shipments with query parameters', (done) => {
      const params = {
        consigneeId: 'CONS001',
        take: 5,
        skip: 0,
      };

      const mockResponse: ApiResponse<DeliveredShipmentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockShipment],
        total: 12,
      };

      service.getAllShipments(params).subscribe({
        next: (result) => {
          expect(result.data).toEqual([mockShipment]);
          expect(result.total).toBe(12);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((request) => request.url === baseUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('consigneeId')).toBe('CONS001');
      expect(req.request.params.get('take')).toBe('5');
      expect(req.request.params.get('skip')).toBe('0');
      req.flush(mockResponse);
    });

    it('should handle all query parameters', (done) => {
      const params = {
        shipmentNo: 'SH001',
        boxId: 'BOX001',
        consigneeId: 'CONS001',
        fromDate: '2026-05-01',
        toDate: '2026-05-31',
        take: 20,
        skip: 10,
      };

      const mockResponse: ApiResponse<DeliveredShipmentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
        total: 0,
      };

      service.getAllShipments(params).subscribe({
        next: () => {
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((request) => request.url === baseUrl);
      expect(req.request.params.get('shipmentNo')).toBe('SH001');
      expect(req.request.params.get('boxId')).toBe('BOX001');
      expect(req.request.params.get('consigneeId')).toBe('CONS001');
      expect(req.request.params.get('fromDate')).toBe('2026-05-01');
      expect(req.request.params.get('toDate')).toBe('2026-05-31');
      req.flush(mockResponse);
    });

    it('should work with no parameters', (done) => {
      const mockResponse: ApiResponse<DeliveredShipmentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
        total: 0,
      };

      service.getAllShipments().subscribe({
        next: () => {
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getShipmentNumbers', () => {
    it('should retrieve shipment numbers for dropdown', (done) => {
      const mockResponse: ApiResponse<DeliveredShipmentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [
          { ...mockShipment, shipmentNo: 'SH001' },
          { ...mockShipment, shipmentNo: 'SH002', receiptDate: '2026-05-26T10:00:00Z' },
        ],
        total: 2,
      };

      service.getShipmentNumbers().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].shipmentNo).toBe('SH001');
          expect(result[1].shipmentNo).toBe('SH002');
          expect(result[0].receiptDate).toBe('2026-05-25T14:30:00Z');
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((request) => request.url === baseUrl);
      expect(req.request.params.get('take')).toBe('1000');
      expect(req.request.params.get('skip')).toBe('0');
      req.flush(mockResponse);
    });

  });

  describe('getShipmentHeader', () => {
    it('should retrieve shipment header by number', (done) => {
      const shipmentNo = 'SH001';
      const mockResponse: ApiResponse<DeliveredShipmentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockShipment],
        total: 1,
      };

      service.getShipmentHeader(shipmentNo).subscribe({
        next: (result) => {
          expect(result).toEqual(mockShipment);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/${shipmentNo}/header`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('getBoxIdsByShipment', () => {
    it('should retrieve box IDs for a shipment', (done) => {
      const shipmentNo = 'SH001';
      const mockResponse: ApiResponse<string[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: ['BOX001', 'BOX002'],
      };

      service.getBoxIdsByShipment(shipmentNo).subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].boxId).toBe('BOX001');
          expect(result[1].boxId).toBe('BOX002');
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/${shipmentNo}/boxes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle shipment with no boxes', (done) => {
      const shipmentNo = 'SH001';
      const mockResponse: ApiResponse<string[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
      };

      service.getBoxIdsByShipment(shipmentNo).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/${shipmentNo}/boxes`);
      req.flush(mockResponse);
    });

    it('should handle shipment not found', (done) => {
      const shipmentNo = 'INVALID';
      const mockResponse: ApiResponse<string[]> = {
        success: false,
        statusCode: 404,
        message: 'Not found',
        data: null,
      };

      service.getBoxIdsByShipment(shipmentNo).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/${shipmentNo}/boxes`);
      req.flush(mockResponse);
    });
  });
});
