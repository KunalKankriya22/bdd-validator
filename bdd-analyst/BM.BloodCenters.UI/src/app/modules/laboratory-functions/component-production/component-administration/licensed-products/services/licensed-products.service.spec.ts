import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LicensedProductsService } from './licensed-products.service';
import { environment } from 'src/environments/environment';
import { LicensedProductRequest } from '../models/licensed-products.model';

describe('LicensedProductsService', () => {
  let service: LicensedProductsService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/licensed-products`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LicensedProductsService]
    });

    service = TestBed.inject(LicensedProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getLicensedProducts', () => {
    it('should POST and map response with item array and total', (done) => {
      service.getLicensedProducts('CH1', 10, 0).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.data[0].productDescription).toBe('Product A');
        expect(result.total).toBe(5);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.chapterId).toBe('CH1');
      req.flush({ item: [{ productDesc: 'Product A' }], total: 5 });
    });
  });

  describe('getChapters', () => {
    it('should GET active chapter lookup', (done) => {
      service.getChapters().subscribe(result => {
        expect(result).toEqual([{ chapterId: 'C1', chapterName: 'Chapter 1' }] as any);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/active/lookup`);
      expect(req.request.method).toBe('GET');
      req.flush([{ chapterId: 'C1', chapterName: 'Chapter 1' }]);
    });
  });

  describe('getValidProducts', () => {
    it('should GET, map item array, and cache with shareReplay', (done) => {
      service.getValidProducts().subscribe(result => {
        expect(result).toEqual([{ productCode: 'P1', productDesc: 'Prod 1' }]);

        // Second call should use cache (no new HTTP request)
        service.getValidProducts().subscribe(cached => {
          expect(cached).toEqual([{ productCode: 'P1', productDesc: 'Prod 1' }]);
          done();
        });
      });

      const req = httpMock.expectOne(`${baseUrl}/product-codes`);
      expect(req.request.method).toBe('GET');
      req.flush({ item: [{ productCode: 'P1', productDesc: 'Prod 1' }] });
    });
  });

  describe('getCachedValidProducts', () => {
    it('should return empty array when not loaded', () => {
      expect(service.getCachedValidProducts()).toEqual([]);
    });
  });

  describe('clearValidProductsCache', () => {
    it('should reset cached products', (done) => {
      // Load products first
      service.getValidProducts().subscribe(() => {
        expect(service.getCachedValidProducts().length).toBe(1);

        service.clearValidProductsCache();
        expect(service.getCachedValidProducts()).toEqual([]);
        done();
      });

      httpMock.expectOne(`${baseUrl}/product-codes`).flush({ item: [{ productCode: 'P1', productDesc: 'X' }] });
    });
  });

  describe('getLicensedProductById', () => {
    it('should POST with chapterId in body', (done) => {
      service.getLicensedProductById('P1', 'CH1').subscribe(result => {
        expect(result.productCode).toBe('P1');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/P1/details`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ chapterId: 'CH1' });
      req.flush({ productCode: 'P1' });
    });
  });

  describe('createLicensedProduct', () => {
    it('should POST with product and chapter data', (done) => {
      const request: LicensedProductRequest = {
        productCode: 'P1', osokFlag: 'Y', effDate: '2024-01-01', termDate: null
      } as LicensedProductRequest;

      service.createLicensedProduct(request, 'CH1').subscribe(() => done());

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.chapterId).toBe('CH1');
      expect(req.request.body.productCode).toBe('P1');
      req.flush(null);
    });
  });

  describe('updateLicensedProduct', () => {
    it('should PUT with chapter and request data', (done) => {
      const request: Partial<LicensedProductRequest> = { osokFlag: 'N' };

      service.updateLicensedProduct('P1', 'CH1', request).subscribe(() => done());

      const req = httpMock.expectOne(`${baseUrl}/P1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.chapterId).toBe('CH1');
      expect(req.request.body.osokFlag).toBe('N');
      req.flush(null);
    });
  });
});
