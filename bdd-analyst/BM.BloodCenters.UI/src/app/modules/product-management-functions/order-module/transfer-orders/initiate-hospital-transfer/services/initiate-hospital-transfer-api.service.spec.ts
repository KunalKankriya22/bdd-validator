import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { InitiateHospitalTransferApiService } from './initiate-hospital-transfer-api.service';

describe('InitiateHospitalTransferApiService', () => {
  let service: InitiateHospitalTransferApiService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('HttpClient', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        InitiateHospitalTransferApiService,
        { provide: HttpClient, useValue: spy },
      ],
    });

    service = TestBed.inject(InitiateHospitalTransferApiService);
    httpSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  describe('getOrders', () => {
    it('should call GET and return order search results', (done) => {
      const mockResponse = { success: true, data: [{ orderNo: 'O001' }] };
      httpSpy.get.and.returnValue(of(mockResponse));

      service.getOrders().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          done();
        },
      });
    });
  });

  describe('getOrderDetails', () => {
    it('should call GET with order number and return details', (done) => {
      const mockResponse = { success: true, data: { orderNo: 'O001' } };
      httpSpy.get.and.returnValue(of(mockResponse));

      service.getOrderDetails('O001').subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          done();
        },
      });
    });
  });

  describe('getAttributesAntigens', () => {
    it('should call GET with order number and item number', (done) => {
      const mockResponse = { success: true, data: { attributes: [] } };
      httpSpy.get.and.returnValue(of(mockResponse));

      service.getAttributesAntigens('O001', 1).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          done();
        },
      });
    });
  });

  describe('findProducts', () => {
    it('should call GET with order number and item number', (done) => {
      const mockResponse = { success: true, data: { products: [] } };
      httpSpy.get.and.returnValue(of(mockResponse));

      service.findProducts('O001', 1).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          done();
        },
      });
    });
  });

  describe('printTransferSlip', () => {
    it('should call POST with request and return print result', (done) => {
      const request = { orderNo: 'O001' } as any;
      const mockResponse = { success: true, data: { slipId: 'S1' } };
      httpSpy.post.and.returnValue(of(mockResponse));

      service.printTransferSlip(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(httpSpy.post).toHaveBeenCalledWith(jasmine.any(String), request);
          done();
        },
      });
    });
  });
});
