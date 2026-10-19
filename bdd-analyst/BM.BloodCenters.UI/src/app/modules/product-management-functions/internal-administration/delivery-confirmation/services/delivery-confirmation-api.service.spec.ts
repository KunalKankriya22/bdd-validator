import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { DeliveryConfirmationApiService } from './delivery-confirmation-api.service';
import {
  ApiResponse,
  UndeliveredShipmentDto,
  ShipmentDeliveryDto,
  ConfirmDeliveryRequestDto,
} from '../models/delivery-confirmation.model';
import { API } from '@core/constants/api.constants';

describe('DeliveryConfirmationApiService', () => {
  let service: DeliveryConfirmationApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DeliveryConfirmationApiService],
    });

    service = TestBed.inject(DeliveryConfirmationApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getUndeliveredShipments', () => {
    it('should fetch undelivered shipments successfully', () => {
      const mockShipments: UndeliveredShipmentDto[] = [
        {
          shipmentNo: 'SH240001',
          shortName: 'HOSP-A',
          consigneeName: 'Hospital A - Main Campus',
        },
        {
          shipmentNo: 'SH240002',
          shortName: 'HOSP-B',
          consigneeName: 'Hospital B - Blood Bank',
        },
      ];
      const mockResponse: ApiResponse<UndeliveredShipmentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Undelivered shipments retrieved successfully',
        data: [mockShipments],
        total: 2,
      };

      service.getUndeliveredShipments().subscribe((shipments) => {
        expect(shipments).toEqual(mockShipments);
        expect(shipments.length).toBe(2);
        expect(shipments[0].shipmentNo).toBe('SH240001');
      });

      const req = httpMock.expectOne(
        API.SHIPMENT_DELIVERY.UNDELIVERED_SHIPMENTS
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when no shipments found', () => {
      const mockResponse: ApiResponse<UndeliveredShipmentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'No undelivered shipments found',
        data: [],
        total: 0,
      };

      service.getUndeliveredShipments().subscribe((shipments) => {
        expect(shipments).toEqual([]);
      });

      const req = httpMock.expectOne(
        API.SHIPMENT_DELIVERY.UNDELIVERED_SHIPMENTS
      );
      req.flush(mockResponse);
    });

  });

  describe('getShipmentDetails', () => {
    it('should fetch shipment details successfully', () => {
      const shipmentNo = 'SH240001';
      const mockDetail: ShipmentDeliveryDto = {
        shipmentNo: 'SH240001',
        consigneeId: 'CONS001',
        consigneeShortName: 'HOSP-A',
        shipmentDate: '2024-01-15T09:30:00Z',
        shippedByPerson: 'John Smith',
        carrier: 'FedEx',
        trackNo: '1234567890',
        flightNo: null,
        receiptDate: null,
        receivedBy: null,
        comments: null,
        chapterId: 'CH01',
      };
      const mockResponse: ApiResponse<ShipmentDeliveryDto> = {
        success: true,
        statusCode: 200,
        message: 'Shipment details retrieved successfully',
        data: [mockDetail],
        total: 1,
      };

      service.getShipmentDetails(shipmentNo).subscribe((details) => {
        expect(details).toEqual(mockDetail);
        expect(details?.shipmentNo).toBe('SH240001');
        expect(details?.consigneeId).toBe('CONS001');
      });

      const req = httpMock.expectOne(
        API.SHIPMENT_DELIVERY.GET_DETAILS(shipmentNo)
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


    it('should encode shipment number in URL', () => {
      const shipmentNo = 'SH 240/001';
      const mockResponse: ApiResponse<ShipmentDeliveryDto> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
        total: 0,
      };

      service.getShipmentDetails(shipmentNo).subscribe();

      const req = httpMock.expectOne(
        API.SHIPMENT_DELIVERY.GET_DETAILS(shipmentNo)
      );
      expect(req.request.url).toContain('SH%20240%2F001');
      req.flush(mockResponse);
    });

    it('should handle server error', () => {
      service.getShipmentDetails('SH240001').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(
        API.SHIPMENT_DELIVERY.GET_DETAILS('SH240001')
      );
      req.flush(
        { message: 'Internal server error' },
        { status: 500, statusText: 'Server Error' }
      );
    });
  });

  describe('confirmDelivery', () => {
    it('should confirm delivery successfully', () => {
      const request: ConfirmDeliveryRequestDto = {
        shipmentNo: 'SH240001',
        receiptDate: '2024-01-16T00:00:00',
        receiptTime: '14:30:00',
        receivedBy: 'Jane Doe',
        comments: 'Received in good condition',
      };

      const mockResponse: ApiResponse<boolean> = {
        success: true,
        statusCode: 200,
        message: 'Delivery confirmed successfully',
        data: [true],
        total: 1,
      };

      service.confirmDelivery(request).subscribe((result) => {
        expect(result).toBe(true);
      });

      const req = httpMock.expectOne(API.SHIPMENT_DELIVERY.CONFIRM);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });


    it('should handle validation error - receipt date in future', () => {
      const request: ConfirmDeliveryRequestDto = {
        shipmentNo: 'SH240001',
        receiptDate: '2099-01-01T00:00:00',
        receivedBy: 'Jane Doe',
      };

      const errorResponse = {
        success: false,
        statusCode: 400,
        message: 'Receipt date cannot be in the future',
        errorCode: '0503',
      };

      service.confirmDelivery(request).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.error.errorCode).toBe('0503');
        },
      });

      const req = httpMock.expectOne(API.SHIPMENT_DELIVERY.CONFIRM);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('should send request without optional fields', () => {
      const request: ConfirmDeliveryRequestDto = {
        shipmentNo: 'SH240001',
        receiptDate: '2024-01-16T00:00:00',
        receivedBy: 'Jane Doe',
      };

      const mockResponse: ApiResponse<boolean> = {
        success: true,
        statusCode: 200,
        message: 'Delivery confirmed successfully',
        data: [true],
        total: 1,
      };

      service.confirmDelivery(request).subscribe((result) => {
        expect(result).toBe(true);
      });

      const req = httpMock.expectOne(API.SHIPMENT_DELIVERY.CONFIRM);
      expect(req.request.body.comments).toBeUndefined();
      expect(req.request.body.receiptTime).toBeUndefined();
      req.flush(mockResponse);
    });

    it('should return false when API returns empty data', () => {
      const request: ConfirmDeliveryRequestDto = {
        shipmentNo: 'SH240001',
        receiptDate: '2024-01-16T00:00:00',
        receivedBy: 'Jane Doe',
      };

      const mockResponse: ApiResponse<boolean> = {
        success: true,
        statusCode: 200,
        message: 'Processed',
        data: [],
        total: 0,
      };

      service.confirmDelivery(request).subscribe((result) => {
        expect(result).toBe(false);
      });

      const req = httpMock.expectOne(API.SHIPMENT_DELIVERY.CONFIRM);
      req.flush(mockResponse);
    });
  });
});
