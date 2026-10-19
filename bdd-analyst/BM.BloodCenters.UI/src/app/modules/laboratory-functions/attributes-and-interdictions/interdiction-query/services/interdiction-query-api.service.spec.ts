import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { InterdictionQueryApiService } from './interdiction-query-api.service';
import { API } from '@core/constants/api.constants';

describe('InterdictionQueryApiService', () => {
  let service: InterdictionQueryApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InterdictionQueryApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(InterdictionQueryApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('queryInterdictions', () => {
    it('should POST and map response.item when data is absent', (done: DoneFn) => {
      const mockResult = { unitId: 'U001', unitInterdictions: [], componentInterdictions: [] };

      service.queryInterdictions({
        unitId: 'U001',
        productCode: 'PC1',
        collectionDate: '2024-01-01'
      }).subscribe(result => {
        expect(result).toEqual(mockResult as any);
        done();
      });

      const req = httpMock.expectOne(API.LAB_INTERDICTION_QUERY.QUERY);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ unitId: 'U001', productCode: 'PC1', collectionDate: '2024-01-01' });
      req.flush({ success: true, message: '', statusCode: 200, item: mockResult });
    });

    it('should throw when response is not successful', (done: DoneFn) => {
      service.queryInterdictions({ unitId: 'U001' } as any).subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('No data');
          done();
        }
      });

      const req = httpMock.expectOne(API.LAB_INTERDICTION_QUERY.QUERY);
      req.flush({ success: false, message: 'No data', statusCode: 400 });
    });
  });

  describe('getProductsForUnit', () => {
    it('should GET with formatted date and return product codes', (done: DoneFn) => {
      const mockProducts = [{ productCode: 'P1', description: 'Product 1' }];

      service.getProductsForUnit('U001', '2024-01-15').subscribe(result => {
        expect(result).toEqual(mockProducts as any);
        done();
      });

      // Date without 'T' gets T00:00:00 appended
      const expectedUrl = API.LAB_INTERDICTION_QUERY.GET_PRODUCTS('U001', '2024-01-15T00:00:00', 'I');
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockProducts });
    });
  });
});
