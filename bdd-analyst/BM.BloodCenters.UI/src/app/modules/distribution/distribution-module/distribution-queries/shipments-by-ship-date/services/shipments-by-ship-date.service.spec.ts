import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ShipmentsByShipDateService } from './shipments-by-ship-date.service';
import { ShipmentQueryDto } from '../models/shipments-by-ship-date.model';
import { environment } from '../../../../../../../environments/environment';

describe('ShipmentsByShipDateService', () => {
  let service: ShipmentsByShipDateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ShipmentsByShipDateService,
      ],
    });
    service = TestBed.inject(ShipmentsByShipDateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('searchShipments', () => {
    it('should post query and return mapped response', () => {
      const query: ShipmentQueryDto = {
        startDate: '2025-01-10',
        sortColumn: 'ShipmentNo',
        sortOrder: 'DESC',
      };
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Shipments retrieved successfully',
        data: [{ shipmentNo: 'SHP001', shipmentDate: '2025-01-10' }],
        total: 1,
      };

      service.searchShipments(query, 10, 0).subscribe((result) => {
        expect(result.data.length).toBe(1);
        expect(result.totalCount).toBe(1);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/shipments-by-ship-date/10/0`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush(mockResponse);
    });

  });

  describe('getBoxDetails', () => {
    it('should get box details for shipment number', () => {
      const mockBoxes = [{ boxId: 'BOX001', boxType: 'Standard' }];

      service.getBoxDetails('SHP001').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].boxId).toBe('BOX001');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/shipments-by-ship-date/SHP001/box-details`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockBoxes });
    });
  });

  describe('getOrderDetails', () => {
    it('should get order details for shipment number', () => {
      const mockOrders = [{ orderNo: 'ORD001', orderStatusDesc: 'Delivered' }];

      service.getOrderDetails('SHP001').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].orderNo).toBe('ORD001');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/shipments-by-ship-date/SHP001/order-details`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockOrders });
    });
  });

  describe('getShippedProducts', () => {
    it('should get shipped products for shipment number', () => {
      const mockProducts = [{ unitId: 'UNIT001', product: 'RBC' }];

      service.getShippedProducts('SHP001').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].unitId).toBe('UNIT001');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/shipments-by-ship-date/SHP001/products`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockProducts });
    });
  });

  describe('getDeliveryNotes', () => {
    it('should get delivery notes by noteId', () => {
      const mockNotes = { noteId: 42, note: 'Handle with care' };

      service.getDeliveryNotes(42).subscribe((result) => {
        expect(result.note).toBe('Handle with care');
        expect(result.noteId).toBe(42);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/shipments-by-ship-date/42/delivery-notes`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockNotes });
    });
  });
});
