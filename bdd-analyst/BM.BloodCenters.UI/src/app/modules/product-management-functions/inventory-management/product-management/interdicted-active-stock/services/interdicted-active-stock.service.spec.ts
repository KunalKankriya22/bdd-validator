import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InterdictedActiveStockService } from './interdicted-active-stock.service';
import { environment } from 'src/environments/environment';

describe('InterdictedActiveStockService', () => {
  let service: InterdictedActiveStockService;
  let httpMock: HttpTestingController;

  const BASE = `${environment.apiUrl}/api/v1/laboratory/interdicted-active-stock`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InterdictedActiveStockService]
    });
    service = TestBed.inject(InterdictedActiveStockService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getInventoryClasses()', () => {
    it('should GET inventory-classes endpoint', () => {
      service.getInventoryClasses().subscribe();
      const req = httpMock.expectOne(`${BASE}/inventory-classes`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, message: null, statusCode: 200, data: [] });
    });
  });

  describe('getProductTypes()', () => {
    it('should GET product-types endpoint', () => {
      service.getProductTypes().subscribe();
      const req = httpMock.expectOne(`${BASE}/product-types`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, message: null, statusCode: 200, data: [] });
    });
  });

  describe('getInterdictedProducts()', () => {
    it('should GET interdicted products with correct query params', () => {
      service.getInterdictedProducts('REG', 'RBC', 10, 0).subscribe();
      const req = httpMock.expectOne(
        `${BASE}?take=10&skip=0&sortDirection=A&inventoryClass=REG&productType=RBC`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, message: null, statusCode: 200, data: { items: [], totalRecords: 0, pageIndex: 0, pageSize: 10 } });
    });

    it('should omit inventoryClass param when empty', () => {
      service.getInterdictedProducts('', 'RBC', 10, 0).subscribe();
      const req = httpMock.expectOne(`${BASE}?take=10&skip=0&sortDirection=A&productType=RBC`);
      expect(req.request.params.has('inventoryClass')).toBeFalse();
      req.flush({ success: true, message: null, statusCode: 200, data: { items: [], totalRecords: 0, pageIndex: 0, pageSize: 10 } });
    });

    it('should omit productType param when empty', () => {
      service.getInterdictedProducts('REG', '', 25, 50).subscribe();
      const req = httpMock.expectOne(`${BASE}?take=25&skip=50&sortDirection=A&inventoryClass=REG`);
      expect(req.request.params.has('productType')).toBeFalse();
      req.flush({ success: true, message: null, statusCode: 200, data: { items: [], totalRecords: 0, pageIndex: 0, pageSize: 25 } });
    });

    it('should send both params as empty when no filters applied', () => {
      service.getInterdictedProducts('', '', 10, 0).subscribe();
      const req = httpMock.expectOne(`${BASE}?take=10&skip=0&sortDirection=A`);
      expect(req.request.params.has('inventoryClass')).toBeFalse();
      expect(req.request.params.has('productType')).toBeFalse();
      req.flush({ success: true, message: null, statusCode: 200, data: { items: [], totalRecords: 0, pageIndex: 0, pageSize: 10 } });
    });

    it('should send sortDirection=D when descending', () => {
      service.getInterdictedProducts('', '', 25, 0, 'D').subscribe();
      const req = httpMock.expectOne(`${BASE}?take=25&skip=0&sortDirection=D`);
      expect(req.request.params.get('sortDirection')).toBe('D');
      req.flush({ success: true, message: null, statusCode: 200, data: { items: [], totalRecords: 0, pageIndex: 0, pageSize: 25 } });
    });

    it('should include searchTerm param when provided', () => {
      service.getInterdictedProducts('', '', 25, 0, 'A', 'W63332').subscribe();
      const req = httpMock.expectOne(`${BASE}?take=25&skip=0&sortDirection=A&searchTerm=W63332`);
      expect(req.request.params.get('searchTerm')).toBe('W63332');
      req.flush({ success: true, message: null, statusCode: 200, data: { items: [], totalRecords: 0, pageIndex: 0, pageSize: 25 } });
    });

    it('should omit searchTerm param when empty', () => {
      service.getInterdictedProducts('', '', 25, 0, 'A', '').subscribe();
      const req = httpMock.expectOne(`${BASE}?take=25&skip=0&sortDirection=A`);
      expect(req.request.params.has('searchTerm')).toBeFalse();
      req.flush({ success: true, message: null, statusCode: 200, data: { items: [], totalRecords: 0, pageIndex: 0, pageSize: 25 } });
    });
  });
});
