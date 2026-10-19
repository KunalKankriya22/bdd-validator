import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EnterOrderChargesApiService } from './enter-order-charges-api.service';
import { API } from '@core/constants/api.constants';

describe('EnterOrderChargesApiService', () => {
  let service: EnterOrderChargesApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EnterOrderChargesApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });

    service = TestBed.inject(EnterOrderChargesApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getOrders', () => {
    it('should GET with q param when provided', (done: DoneFn) => {
      service.getOrders('test').subscribe(r => {
        expect(r.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(r =>
        r.url === API.ENTER_ORDER_CHARGES.ORDERS && r.params.get('q') === 'test'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });
  });

  describe('getServiceCodes', () => {
    it('should GET service codes', (done: DoneFn) => {
      service.getServiceCodes().subscribe(r => {
        expect(r.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(API.ENTER_ORDER_CHARGES.SERVICE_CODES);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });
  });

  describe('GET-by-orderNo endpoints', () => {
    const orderNo = 'ORD001';
    const cases = [
      { method: 'getOrderCharges' as const, url: API.ENTER_ORDER_CHARGES.GET(orderNo) },
      { method: 'getOrderItems' as const, url: API.ENTER_ORDER_CHARGES.ORDER_ITEMS(orderNo) },
      { method: 'getItemAttributesAntigens' as const, url: API.ENTER_ORDER_CHARGES.ITEM_ATTRIBUTES_ANTIGENS(orderNo) }
    ];

    cases.forEach(({ method, url }) => {
      it(`${method} should GET by orderNo`, (done: DoneFn) => {
        service[method](orderNo).subscribe(() => done());

        const req = httpMock.expectOne(url);
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: {} });
      });
    });
  });

  describe('getCrDbIndicators', () => {
    it('should GET CR/DB indicators', (done: DoneFn) => {
      service.getCrDbIndicators().subscribe(r => {
        expect(r.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(API.ENTER_ORDER_CHARGES.CRDB_INDICATORS);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [
        { code: 'CR', description: 'Credit' },
        { code: 'DB', description: 'Debit' },
      ]});
    });
  });

  describe('addCharge', () => {
    it('should POST with CrDbInd code passed directly', (done: DoneFn) => {
      service.addCharge('ORD001', {
        serviceCode: 'SVC1',
        creditDebit: 'CR',
        quantity: 2,
        amount: 100
      }).subscribe(() => done());

      const req = httpMock.expectOne(API.ENTER_ORDER_CHARGES.ADD_CHARGE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        OrderNo: 'ORD001',
        ChargeCode: 'SVC1',
        CrDbInd: 'CR',
        Quantity: 2,
        Amount: 100
      });
      req.flush({ success: true, data: {} });
    });
  });

  describe('updateCharge', () => {
    it('should PUT with RowId and CrDbInd code passed directly', (done: DoneFn) => {
      service.updateCharge({
        serviceCode: 'SVC2',
        creditDebit: 'DB',
        quantity: 1,
        amount: 50,
        rowId: 'AAARxYAAEAAAARzAAA',
      }).subscribe(() => done());

      const req = httpMock.expectOne(API.ENTER_ORDER_CHARGES.UPDATE_CHARGE);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        rowId: 'AAARxYAAEAAAARzAAA',
        chargeCode: 'SVC2',
        crDbInd: 'DB',
        quantity: 1,
        amount: 50,
      });
      req.flush({ success: true, data: {} });
    });

    it('should pass CR code directly', (done: DoneFn) => {
      service.updateCharge({
        serviceCode: 'SVC1',
        creditDebit: 'CR',
        quantity: 1,
        amount: 50,
        rowId: 'ROW123',
      }).subscribe(() => done());

      const req = httpMock.expectOne(API.ENTER_ORDER_CHARGES.UPDATE_CHARGE);
      expect(req.request.body.crDbInd).toBe('CR');
      expect(req.request.body.rowId).toBe('ROW123');
      req.flush({ success: true, data: {} });
    });
  });

  describe('deleteCharge', () => {
    it('should DELETE with rowId in URL', (done: DoneFn) => {
      service.deleteCharge('AAARxYAAEAAAARzAAA').subscribe(() => done());

      const req = httpMock.expectOne(API.ENTER_ORDER_CHARGES.DELETE_CHARGE('AAARxYAAEAAAARzAAA'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, data: true });
    });
  });
});
