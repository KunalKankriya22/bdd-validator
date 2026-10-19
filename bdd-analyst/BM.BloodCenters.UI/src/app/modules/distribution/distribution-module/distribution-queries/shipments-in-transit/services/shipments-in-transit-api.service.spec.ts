import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { ShipmentsInTransitApiService } from './shipments-in-transit-api.service';
import { API } from '@core/constants/api.constants';
import {
  ShipmentLookupDto,
  BoxLookupDto,
  ShipmentHeaderDto,
  ReturnResult,
  ShipmentsInTransitSearchRequest,
} from '../models/shipments-in-transit.model';

describe('ShipmentsInTransitApiService', () => {
  let service: ShipmentsInTransitApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ShipmentsInTransitApiService],
    });

    service = TestBed.inject(ShipmentsInTransitApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getShipmentLookup', () => {
    it('should GET shipment lookup', () => {
      const mockResponse: ReturnResult<ShipmentLookupDto> = {
        success: true,
        message: '',
        statusCode: 200,
        data: [
          { shipmentNo: 'SH001', consigneeName: 'Hospital A' },
          { shipmentNo: 'SH002', consigneeName: 'Hospital B' },
        ],
      };

      service.getShipmentLookup().subscribe((result) => {
        expect(result.data?.length).toBe(2);
        expect(result.data?.[0].shipmentNo).toBe('SH001');
      });

      const req = httpMock.expectOne(API.SHIPMENTS_IN_TRANSIT.SHIPMENT_LOOKUP);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty shipment list', () => {
      const mockResponse: ReturnResult<ShipmentLookupDto> = {
        success: true,
        message: '',
        statusCode: 200,
        data: [],
      };

      service.getShipmentLookup().subscribe((result) => {
        expect(result.data).toEqual([]);
      });

      const req = httpMock.expectOne(API.SHIPMENTS_IN_TRANSIT.SHIPMENT_LOOKUP);
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getShipmentLookup().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(API.SHIPMENTS_IN_TRANSIT.SHIPMENT_LOOKUP);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getBoxLookup', () => {

    it('should handle shipment number with special characters', () => {
      const mockResponse: ReturnResult<BoxLookupDto> = {
        success: true,
        message: '',
        statusCode: 200,
        data: [],
      };

      service.getBoxLookup('SH/001').subscribe((result) => {
        expect(result.success).toBeTrue();
      });

      const req = httpMock.expectOne(API.SHIPMENTS_IN_TRANSIT.BOX_LOOKUP('SH/001'));
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getBoxLookup('SH001').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne(API.SHIPMENTS_IN_TRANSIT.BOX_LOOKUP('SH001'));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('search', () => {
    it('should POST search request with shipment number only', () => {
      const request: ShipmentsInTransitSearchRequest = {
        ShipmentNo: 'SH001',
      };

      const mockResponse: ReturnResult<ShipmentHeaderDto> = {
        success: true,
        message: '',
        statusCode: 200,
        item: {
          shipmentNo: 'SH001',
          shipmentDate: '2025-01-11T13:15:00',
          carrierCode: 'BC',
          carrierName: 'Test Carrier',
          customerName: 'Test Customer',
          address: '123 Main St',
          city: 'Dallas',
          state: 'TX',
          zip: '75001',
          country: 'USA',
          totalBoxes: 5,
          defaultBoxId: 'BOX001',
          products: [],
        },
      };

      service.search(request).subscribe((result) => {
        expect(result.item?.shipmentNo).toBe('SH001');
        expect(result.item?.carrierName).toBe('Test Carrier');
      });

      const req = httpMock.expectOne(API.SHIPMENTS_IN_TRANSIT.SEARCH);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should POST search request with shipment and box ID', () => {
      const request: ShipmentsInTransitSearchRequest = {
        ShipmentNo: 'SH001',
        BoxId: 'BOX001',
      };

      service.search(request).subscribe();

      const req = httpMock.expectOne(API.SHIPMENTS_IN_TRANSIT.SEARCH);
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, message: '', statusCode: 200, item: null });
    });

    it('should handle unsuccessful response', () => {
      const request: ShipmentsInTransitSearchRequest = { ShipmentNo: 'SH999' };

      service.search(request).subscribe((result) => {
        expect(result.success).toBeFalse();
        expect(result.errorResponse?.error).toBe('Shipment not found');
      });

      const req = httpMock.expectOne(API.SHIPMENTS_IN_TRANSIT.SEARCH);
      req.flush({
        success: false,
        message: 'Shipment not found',
        statusCode: 400,
        errorResponse: { errorCode: '4306', error: 'Shipment not found' },
      });
    });

    it('should propagate HTTP error', (done) => {
      service.search({ ShipmentNo: 'SH001' }).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(API.SHIPMENTS_IN_TRANSIT.SEARCH);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
