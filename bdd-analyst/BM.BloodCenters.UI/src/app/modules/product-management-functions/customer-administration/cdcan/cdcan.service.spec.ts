import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CdcanService } from './cdcan.service';
import { environment } from '../../../../../environments/environment';
import { API } from '../../../../core/constants/api.constants';

describe('CdcanService', () => {
  let service: CdcanService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CdcanService]
    });

    service = TestBed.inject(CdcanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getCustomers', () => {
    it('should return mapped customer list', (done) => {
      const mockResponse = {
        data: [
          { customerId: 'C001', name: 'Hospital A' },
          { customerId: 'C002', name: 'Hospital B' }
        ]
      };

      service.getCustomers().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].customerId).toBe('C001');
        expect(result[0].customerName).toBe('Hospital A');
        done();
      });

      const url = `${environment.apiUrl}${API.CUSTOMER_DEBIT_CREDIT_QUERY.CUSTOMER_LOV}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when response data is null', (done) => {
      service.getCustomers().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });

      const url = `${environment.apiUrl}${API.CUSTOMER_DEBIT_CREDIT_QUERY.CUSTOMER_LOV}`;
      const req = httpMock.expectOne(url);
      req.flush({ data: null });
    });
  });

  describe('getAdvicesByCustomer', () => {
    it('should return mapped advice list for a customer', (done) => {
      const customerId = 'C001';
      const mockResponse = {
        data: [
          { adviceId: 'ADV-001', insertDate: '2025-01-01' }
        ]
      };

      service.getAdvicesByCustomer(customerId).subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].adviceId).toBe('ADV-001');
        expect(result[0].displayText).toBe('ADV-001');
        expect(result[0].insertDate).toBe('2025-01-01');
        done();
      });

      const url = `${environment.apiUrl}${API.CUSTOMER_DEBIT_CREDIT_QUERY.ADVICE_ID_LOV(customerId)}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when response data is null', (done) => {
      const customerId = 'C001';

      service.getAdvicesByCustomer(customerId).subscribe(result => {
        expect(result).toEqual([]);
        done();
      });

      const url = `${environment.apiUrl}${API.CUSTOMER_DEBIT_CREDIT_QUERY.ADVICE_ID_LOV(customerId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ data: null });
    });
  });

  describe('getAdviceById', () => {
    it('should return the first advice record when data exists', (done) => {
      const adviceId = 'ADV-001';
      const mockAdvice = { adviceId: 'ADV-001', amount: 100 };
      const mockResponse = { data: [mockAdvice] };

      service.getAdviceById(adviceId).subscribe(result => {
        expect(result).toEqual(mockAdvice as any);
        done();
      });

      const url = `${environment.apiUrl}${API.CANCEL_DEBIT_CREDIT_ADVICE.GET_BY_ID(adviceId)}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when data array is empty', (done) => {
      const adviceId = 'ADV-001';

      service.getAdviceById(adviceId).subscribe(result => {
        expect(result).toBeNull();
        done();
      });

      const url = `${environment.apiUrl}${API.CANCEL_DEBIT_CREDIT_ADVICE.GET_BY_ID(adviceId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ data: [] });
    });

    it('should return null when data is null', (done) => {
      const adviceId = 'ADV-001';

      service.getAdviceById(adviceId).subscribe(result => {
        expect(result).toBeNull();
        done();
      });

      const url = `${environment.apiUrl}${API.CANCEL_DEBIT_CREDIT_ADVICE.GET_BY_ID(adviceId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ data: null });
    });
  });

  describe('cancelAdvice', () => {
    it('should post cancel request with confirmation Y', (done) => {
      const adviceId = 'ADV-001';
      const mockResponse = { data: true, success: true };

      service.cancelAdvice(adviceId).subscribe(result => {
        expect(result.data).toBeTrue();
        done();
      });

      const url = `${environment.apiUrl}${API.CANCEL_DEBIT_CREDIT_ADVICE.CANCEL}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ adviceId: 'ADV-001', confirmation: 'Y' });
      req.flush(mockResponse);
    });
  });
});
