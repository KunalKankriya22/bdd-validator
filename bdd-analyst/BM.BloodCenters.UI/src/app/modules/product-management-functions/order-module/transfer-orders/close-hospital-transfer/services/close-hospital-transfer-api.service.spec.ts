import { TestBed } from '@angular/core/testing';
import { HttpParams } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { CloseHospitalTransferApiService } from './close-hospital-transfer-api.service';

describe('CloseHospitalTransferApiService', () => {
  let service: CloseHospitalTransferApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockOpenSlips = {
    success: true, message: '', statusCode: 200,
    data: [
      { pickSlipId: 'PTI-00036', insertDate: '2026-01-12T13:15:00', pickSlipType: 'XR', sourceHospitalName: 'Parkland Hospital', destinationHospitalName: 'Guam Memorial', transferType: 'Regular', productCount: 4 },
    ],
  };

  const mockProducts = {
    success: true, message: '', statusCode: 200,
    data: [
      { pickSlipId: 'PTI-00036', unitId: 'W1234-18-031310-Z', productCode: 'E51665V00', bloodType: 'O+', expDate: '2026-01-12T13:15:00', aboDescription: 'O Positive', productType: 'RBC', aliquot: '01', collDate: '2026-01-01', chapterId: 'DAL', pickSlipType: 'XR', pickSlipStatus: 'OP', orderNo: 'ORD001', itemNo: 1, sourceHospital: 'CS001', tier: null, qcFlag: null, insertDate: null, sourceHospitalName: 'Parkland', sourceHospitalAddress: '1234 Main', sourceCityStateZip: 'Dallas, TX', destinationHospitalName: 'Guam', destinationHospitalAddress: '543 Med', destCityStateZip: 'Guam, GU', productDescription: 'Red Blood Cells' },
    ],
  };

  const mockCloseResponse = {
    success: true, message: '', statusCode: 200,
    item: { pickSlipId: 'PTI-00036', status: 'CL', productsProcessed: 2, productsDiscarded: 1, orderStatus: 'CL', message: 'Transfer closed successfully.' },
  };

  const mockProductCodeLov = {
    success: true, message: '', statusCode: 200,
    data: [{ productCode: 'E51665V00', productDescription: 'Red Blood Cells' }],
  };

  const mockAliquotLov = {
    success: true, message: '', statusCode: 200,
    data: [{ aliquot: '01' }],
  };

  const mockAboLov = {
    success: true, message: '', statusCode: 200,
    data: [{ bloodType: 'O+', aboDescription: 'O Positive' }],
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'put']);

    TestBed.configureTestingModule({
      providers: [
        CloseHospitalTransferApiService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(CloseHospitalTransferApiService);
  });

  describe('getOpenTransferSlips', () => {
    it('should call ApiService.get with correct endpoint', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of(mockOpenSlips));
      service.getOpenTransferSlips().subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.DISTRIBUTION.CLOSE_HOSPITAL_TRANSFER.OPEN_SLIPS);
        expect(result.success).toBeTrue();
        expect(result.data!.length).toBe(1);
        done();
      });
    });

    it('should propagate error through catchError', (done: DoneFn) => {
      const error = { status: 500, message: 'Server Error' };
      apiServiceSpy.get.and.returnValue(throwError(() => error));
      service.getOpenTransferSlips().subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('getTransferProducts', () => {
    it('should call ApiService.get with pickSlipId in path and no params when sortDirection is absent', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of(mockProducts));
      service.getTransferProducts('PTI-00036').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.DISTRIBUTION.CLOSE_HOSPITAL_TRANSFER.PRODUCTS('PTI-00036'), undefined);
        expect(result.data!.length).toBe(1);
        done();
      });
    });

    it('should pass sortDirection as HttpParams when provided', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of(mockProducts));
      service.getTransferProducts('PTI-00036', 'DESC').subscribe((result) => {
        const args = apiServiceSpy.get.calls.mostRecent().args;
        expect(args[0]).toBe(API.DISTRIBUTION.CLOSE_HOSPITAL_TRANSFER.PRODUCTS('PTI-00036'));
        const params = args[1].params as HttpParams;
        expect(params.get('sortDirection')).toBe('DESC');
        expect(result.data!.length).toBe(1);
        done();
      });
    });

    it('should not set params when sortDirection is empty string', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of(mockProducts));
      service.getTransferProducts('PTI-00036', '').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.DISTRIBUTION.CLOSE_HOSPITAL_TRANSFER.PRODUCTS('PTI-00036'), undefined);
        done();
      });
    });

    it('should propagate error through catchError', (done: DoneFn) => {
      const error = { status: 404, message: 'Not Found' };
      apiServiceSpy.get.and.returnValue(throwError(() => error));
      service.getTransferProducts('PTI-00036').subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('closeTransfer', () => {
    it('should call ApiService.put with request body', (done: DoneFn) => {
      apiServiceSpy.put.and.returnValue(of(mockCloseResponse));
      const request = { pickSlipId: 'PTI-00036', products: [{ unitId: 'U1', productCode: 'P1', aliquot: '01', collDate: '2026-01-01', qcFlag: 'O' }] };
      service.closeTransfer(request).subscribe((result) => {
        expect(apiServiceSpy.put).toHaveBeenCalledWith(API.DISTRIBUTION.CLOSE_HOSPITAL_TRANSFER.CLOSE, request);
        expect(result.item!.productsProcessed).toBe(2);
        done();
      });
    });

    it('should propagate error through catchError', (done: DoneFn) => {
      const error = { status: 400, message: 'Bad Request' };
      apiServiceSpy.put.and.returnValue(throwError(() => error));
      const request = { pickSlipId: 'PTI-00036', products: [] };
      service.closeTransfer(request).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('getProductCodeLov', () => {
    it('should call ApiService.get with all query params', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of(mockProductCodeLov));
      service.getProductCodeLov('U1', 'RBC', 'O+', 'I').subscribe((result) => {
        const args = apiServiceSpy.get.calls.mostRecent().args;
        expect(args[0]).toBe(API.DISTRIBUTION.CLOSE_HOSPITAL_TRANSFER.PRODUCT_CODE_LOV);
        const params = args[1].params as HttpParams;
        expect(params.get('unitId')).toBe('U1');
        expect(params.get('productType')).toBe('RBC');
        expect(params.get('bloodType')).toBe('O+');
        expect(params.get('codeScheme')).toBe('I');
        expect(result.data!.length).toBe(1);
        done();
      });
    });

    it('should propagate error through catchError', (done: DoneFn) => {
      const error = { status: 500, message: 'Internal Error' };
      apiServiceSpy.get.and.returnValue(throwError(() => error));
      service.getProductCodeLov('U1', 'RBC', 'O+', 'C').subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('getAliquotLov', () => {
    it('should call ApiService.get with correct endpoint and query params', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of(mockAliquotLov));
      service.getAliquotLov('U1', 'E51665V00').subscribe((result) => {
        const args = apiServiceSpy.get.calls.mostRecent().args;
        expect(args[0]).toBe(API.DISTRIBUTION.CLOSE_HOSPITAL_TRANSFER.ALIQUOT_LOV);
        const params = args[1].params as HttpParams;
        expect(params.get('unitId')).toBe('U1');
        expect(params.get('productCode')).toBe('E51665V00');
        expect(result.data!.length).toBe(1);
        done();
      });
    });

    it('should propagate error through catchError', (done: DoneFn) => {
      const error = { status: 503, message: 'Service Unavailable' };
      apiServiceSpy.get.and.returnValue(throwError(() => error));
      service.getAliquotLov('U1', 'P1').subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('getAboRhLov', () => {
    it('should call ApiService.get with all query params', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of(mockAboLov));
      service.getAboRhLov('U1', 'E51665V00', '01', 'I').subscribe((result) => {
        const args = apiServiceSpy.get.calls.mostRecent().args;
        expect(args[0]).toBe(API.DISTRIBUTION.CLOSE_HOSPITAL_TRANSFER.ABO_LOV);
        const params = args[1].params as HttpParams;
        expect(params.get('unitId')).toBe('U1');
        expect(params.get('productCode')).toBe('E51665V00');
        expect(params.get('aliquot')).toBe('01');
        expect(params.get('codeScheme')).toBe('I');
        expect(result.data![0].aboDescription).toBe('O Positive');
        done();
      });
    });

    it('should propagate error through catchError', (done: DoneFn) => {
      const error = { status: 422, message: 'Unprocessable' };
      apiServiceSpy.get.and.returnValue(throwError(() => error));
      service.getAboRhLov('U1', 'P1', '01', 'C').subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });
});
