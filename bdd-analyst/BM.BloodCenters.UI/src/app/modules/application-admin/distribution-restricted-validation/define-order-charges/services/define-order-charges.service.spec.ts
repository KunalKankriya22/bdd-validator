import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DefineOrderChargesService } from './define-order-charges.service';
import {
  OrderChargesApiResponse,
  OrderChargeApiModel,
  OrderChargeCreateDto,
  OrderChargeUpdateDto,
  ChargeTypeLovApiResponse,
  FilterServiceCodesApiResponse
} from '../models/define-order-charges.model';

describe('DefineOrderChargesService', () => {
  let service: DefineOrderChargesService;
  let httpMock: HttpTestingController;
  const baseUrl = '/api/v1/order-charges';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DefineOrderChargesService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(DefineOrderChargesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getOrderCharges', () => {
    it('should fetch order charges with pagination and transform data', (done) => {
      const mockApiResponse: OrderChargesApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          {
            chargeCode: 'TEST1',
            chargeCodeDesc: 'Test Charge 1',
            charge: 100.50,
            editCharge: 'Y',
            chargeCodeType: 'DB',
            chargeCodeTypeDesc: 'Debit',
            shipFlag: 'Y',
            crNcr: 'Y',
            serviceCode: 'TEST1',
            effectiveDate: '01-Jan-2024',
            terminationDate: '31-Dec-2024',
            lastModifiedDate: '15-Mar-2024'
          },
          {
            chargeCode: 'TEST2',
            chargeCodeDesc: 'Test Charge 2',
            charge: 200.75,
            editCharge: 'N',
            chargeCodeType: 'CR',
            chargeCodeTypeDesc: 'Credit',
            shipFlag: 'N',
            crNcr: 'N',
            serviceCode: 'TEST2',
            effectiveDate: '01-Feb-2024',
            terminationDate: '28-Feb-2024',
            lastModifiedDate: '20-Mar-2024'
          }
        ],
        total: 2
      };

      service.getOrderCharges(25, 0).subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.totalRecords).toBe(2);

        expect(result.data[0].serviceCode).toBe('TEST1');
        expect(result.data[0].serviceCodeDescription).toBe('Test Charge 1');
        expect(result.data[0].charge).toBe(100.50);
        expect(result.data[0].modifyCharge).toBe('Yes');
        expect(result.data[0].chargeType).toBe('Debit');
        expect(result.data[0].shipmentCharge).toBe('Y');
        expect(result.data[0].orderNumber).toBe('Yes');
        expect(result.data[0].effectiveDate).toBe('01-JAN-2024');
        expect(result.data[0].targetDate).toBe('31-DEC-2024');
        expect(result.data[0].lastModifiedDate).toBe('15-MAR-2024');

        expect(result.data[1].modifyCharge).toBe('No');
        expect(result.data[1].orderNumber).toBe('No');
        expect(result.data[1].effectiveDate).toBe('01-FEB-2024');
        expect(result.data[1].targetDate).toBe('28-FEB-2024');
        expect(result.data[1].lastModifiedDate).toBe('20-MAR-2024');

        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/25/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockApiResponse);
    });

    it('should send search keyword in request body', (done) => {
      const mockApiResponse: OrderChargesApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0
      };

      const params = { searchKeyword: 'TEST' };

      service.getOrderCharges(25, 0, params).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/25/0`);
      expect(req.request.body).toEqual({ searchKeyword: 'TEST' });
      req.flush(mockApiResponse);
    });

    it('should send filter and sort parameters in request body', (done) => {
      const mockApiResponse: OrderChargesApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0
      };

      const params = {
        filterServiceCode: 'TEST',
        sortColumn: 'serviceCode',
        sortOrder: 'ASC' as 'ASC' | 'DESC'
      };

      service.getOrderCharges(10, 5, params).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/10/5`);
      expect(req.request.body).toEqual({
        filterServiceCode: 'TEST',
        sortColumn: 'serviceCode',
        sortOrder: 'ASC'
      });
      req.flush(mockApiResponse);
    });

    it('should send filterEffectiveDateAfter in request body', (done) => {
      const mockApiResponse: OrderChargesApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0
      };

      const params = { filterEffectiveDateAfter: '2025-01-01' };

      service.getOrderCharges(25, 0, params).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/25/0`);
      expect(req.request.body).toEqual({ filterEffectiveDateAfter: '2025-01-01' });
      req.flush(mockApiResponse);
    });

    it('should send filterEffectiveDateBefore in request body', (done) => {
      const mockApiResponse: OrderChargesApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0
      };

      const params = { filterEffectiveDateBefore: '2025-06-30' };

      service.getOrderCharges(25, 0, params).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/25/0`);
      expect(req.request.body).toEqual({ filterEffectiveDateBefore: '2025-06-30' });
      req.flush(mockApiResponse);
    });

    it('should send filterTermDateAfter in request body', (done) => {
      const mockApiResponse: OrderChargesApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0
      };

      const params = { filterTermDateAfter: '2025-03-01' };

      service.getOrderCharges(25, 0, params).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/25/0`);
      expect(req.request.body).toEqual({ filterTermDateAfter: '2025-03-01' });
      req.flush(mockApiResponse);
    });

    it('should send filterTermDateBefore in request body', (done) => {
      const mockApiResponse: OrderChargesApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0
      };

      const params = { filterTermDateBefore: '2025-12-31' };

      service.getOrderCharges(25, 0, params).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/25/0`);
      expect(req.request.body).toEqual({ filterTermDateBefore: '2025-12-31' });
      req.flush(mockApiResponse);
    });

    it('should send all filter params combined in request body', (done) => {
      const mockApiResponse: OrderChargesApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0
      };

      const params = {
        searchKeyword: 'SEARCH',
        filterServiceCode: 'SVC01',
        filterEffectiveDateAfter: '2025-01-01',
        filterEffectiveDateBefore: '2025-06-30',
        filterTermDateAfter: '2025-03-01',
        filterTermDateBefore: '2025-12-31',
        sortColumn: 'serviceCode',
        sortOrder: 'DESC' as 'ASC' | 'DESC'
      };

      service.getOrderCharges(50, 100, params).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/50/100`);
      expect(req.request.body).toEqual({
        searchKeyword: 'SEARCH',
        filterServiceCode: 'SVC01',
        filterEffectiveDateAfter: '2025-01-01',
        filterEffectiveDateBefore: '2025-06-30',
        filterTermDateAfter: '2025-03-01',
        filterTermDateBefore: '2025-12-31',
        sortColumn: 'serviceCode',
        sortOrder: 'DESC'
      });
      req.flush(mockApiResponse);
    });

    it('should not include null/undefined params in request body', (done) => {
      const mockApiResponse: OrderChargesApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0
      };

      const params = {
        searchKeyword: undefined,
        filterServiceCode: null,
        filterEffectiveDateAfter: undefined
      };

      service.getOrderCharges(25, 0, params as any).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/25/0`);
      expect(req.request.body).toEqual({});
      req.flush(mockApiResponse);
    });

    it('should handle null shipFlag gracefully', (done) => {
      const mockApiResponse: OrderChargesApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          {
            chargeCode: 'TEST',
            chargeCodeDesc: 'Test',
            charge: 100,
            editCharge: 'Y',
            chargeCodeType: 'DB',
            chargeCodeTypeDesc: 'Debit',
            shipFlag: null,
            crNcr: 'Y',
            serviceCode: 'TEST',
            effectiveDate: '01-Jan-2024',
            terminationDate: '31-Dec-2024',
            lastModifiedDate: '15-Mar-2024'
          }
        ],
        total: 1
      };

      service.getOrderCharges(25, 0).subscribe(result => {
        expect(result.data[0].shipmentCharge).toBe('N');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/25/0`);
      req.flush(mockApiResponse);
    });

    it('should handle null editCharge and crNcr', (done) => {
      const mockApiResponse: OrderChargesApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          {
            chargeCode: 'TEST',
            chargeCodeDesc: 'Test',
            charge: 100,
            editCharge: null,
            chargeCodeType: 'DB',
            chargeCodeTypeDesc: 'Debit',
            shipFlag: 'Y',
            crNcr: null,
            serviceCode: 'TEST',
            effectiveDate: '01-Jan-2024',
            terminationDate: null,
            lastModifiedDate: undefined
          }
        ],
        total: 1
      };

      service.getOrderCharges(25, 0).subscribe(result => {
        expect(result.data[0].modifyCharge).toBe('No');
        expect(result.data[0].orderNumber).toBe('No');
        expect(result.data[0].targetDate).toBe('');
        expect(result.data[0].lastModifiedDate).toBe('');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/25/0`);
      req.flush(mockApiResponse);
    });



    it('should handle negative charge values', (done) => {
      const mockApiResponse: OrderChargesApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          {
            chargeCode: 'NEG01',
            chargeCodeDesc: 'Negative Charge',
            charge: -500.50,
            editCharge: 'Y',
            chargeCodeType: 'CR',
            chargeCodeTypeDesc: 'Credit',
            shipFlag: 'N',
            crNcr: 'Y',
            serviceCode: 'NEG01',
            effectiveDate: '01-Jan-2024',
            terminationDate: '31-Dec-2024',
            lastModifiedDate: '15-Mar-2024'
          }
        ],
        total: 1
      };

      service.getOrderCharges(25, 0).subscribe(result => {
        expect(result.data[0].charge).toBe(-500.50);
        expect(result.data[0].chargeType).toBe('Credit');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/25/0`);
      req.flush(mockApiResponse);
    });

    it('should convert month to uppercase in dates', (done) => {
      const mockApiResponse: OrderChargesApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          {
            chargeCode: 'TEST',
            chargeCodeDesc: 'Test',
            charge: 100,
            editCharge: 'Y',
            chargeCodeType: 'DB',
            chargeCodeTypeDesc: 'Debit',
            shipFlag: 'Y',
            crNcr: 'Y',
            serviceCode: 'TEST',
            effectiveDate: '15-May-2024',
            terminationDate: '20-Jun-2024',
            lastModifiedDate: '10-Apr-2024'
          }
        ],
        total: 1
      };

      service.getOrderCharges(25, 0).subscribe(result => {
        expect(result.data[0].effectiveDate).toBe('15-MAY-2024');
        expect(result.data[0].targetDate).toBe('20-JUN-2024');
        expect(result.data[0].lastModifiedDate).toBe('10-APR-2024');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/25/0`);
      req.flush(mockApiResponse);
    });

  });

  describe('addOrderCharge', () => {
    it('should create a new order charge', (done) => {
      const createDto: OrderChargeCreateDto = {
        chargeCode: 'NEW01',
        chargeCodeDesc: 'New Charge',
        charge: 150.00,
        editCharge: 'Y',
        chargeCodeType: 'DB',
        shipFlag: 'Y',
        crNcr: 'Y',
        effectiveDate: '2024-01-01',
        terminationDate: '2024-12-31'
      };

      const mockResponse = {
        success: true,
        message: 'Order charge created successfully',
        item: { id: 1 }
      };

      service.addOrderCharge(createDto).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Order charge created successfully');
        expect(result.data).toEqual({ id: 1 });
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockResponse);
    });

    it('should use response.data when response.item is not present', (done) => {
      const createDto: OrderChargeCreateDto = {
        chargeCode: 'NEW01',
        chargeCodeDesc: 'New Charge',
        charge: 150.00,
        editCharge: 'Y',
        chargeCodeType: 'DB',
        shipFlag: 'Y',
        crNcr: 'Y',
        effectiveDate: '2024-01-01',
        terminationDate: '2024-12-31'
      };

      const mockResponse = {
        success: true,
        message: 'Created',
        data: { chargeCode: 'NEW01' }
      };

      service.addOrderCharge(createDto).subscribe(result => {
        expect(result.data).toEqual({ chargeCode: 'NEW01' });
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}`);
      req.flush(mockResponse);
    });

  });

  describe('updateOrderCharge', () => {
    it('should update an existing order charge', (done) => {
      const updateDto: OrderChargeUpdateDto = {
        originalChargeCode: 'TEST1',
        chargeCode: 'TEST1',
        chargeCodeDesc: 'Updated Charge',
        charge: 175.50,
        editCharge: 'N',
        chargeCodeType: 'CR',
        shipFlag: 'N',
        crNcr: 'N',
        effectiveDate: '2024-01-01',
        terminationDate: '2024-12-31'
      };

      const mockResponse = {
        success: true,
        message: 'Order charge updated successfully',
        data: { updated: true }
      };

      service.updateOrderCharge(updateDto).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Order charge updated successfully');
        expect(result.data).toEqual({ updated: true });
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(mockResponse);
    });

  });

  describe('checkDuplicateServiceCode', () => {
    it('should return false (backend validates on save)', (done) => {
      service.checkDuplicateServiceCode('TEST', 'CHAPTER1').subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });
  });

  describe('validateBillingCode', () => {
    it('should return true (backend validates on save)', (done) => {
      service.validateBillingCode('BILL01').subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('getChargeTypeLov', () => {
    it('should fetch charge type LOV options', (done) => {
      const mockResponse: ChargeTypeLovApiResponse = {
        success: true,
        total: 2,
        data: [
          { code: 'DB', description: 'Debit' },
          { code: 'CR', description: 'Credit' }
        ]
      };

      service.getChargeTypeLov().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('DB');
        expect(result[0].description).toBe('Debit');
        expect(result[1].code).toBe('CR');
        expect(result[1].description).toBe('Credit');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/charge-type-lov`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty LOV response', (done) => {
      const mockResponse: ChargeTypeLovApiResponse = {
        success: true,
        total: 0,
        data: []
      };

      service.getChargeTypeLov().subscribe(result => {
        expect(result.length).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/charge-type-lov`);
      req.flush(mockResponse);
    });

    it('should handle LOV error', (done) => {
      service.getChargeTypeLov().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/charge-type-lov`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getFilterServiceCodes', () => {
    it('should fetch filter service codes', (done) => {
      const mockResponse: FilterServiceCodesApiResponse = {
        success: true,
        total: 2,
        data: [
          { code: 'CODE1', description: 'Code 1 Description' },
          { code: 'CODE2', description: 'Code 2 Description' }
        ]
      };

      service.getFilterServiceCodes().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('CODE1');
        expect(result[0].description).toBe('Code 1 Description');
        expect(result[1].code).toBe('CODE2');
        expect(result[1].description).toBe('Code 2 Description');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/filter/service-codes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty filter service codes', (done) => {
      const mockResponse: FilterServiceCodesApiResponse = {
        success: true,
        total: 0,
        data: []
      };

      service.getFilterServiceCodes().subscribe(result => {
        expect(result.length).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/filter/service-codes`);
      req.flush(mockResponse);
    });

    it('should handle filter service codes error', (done) => {
      service.getFilterServiceCodes().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/filter/service-codes`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
