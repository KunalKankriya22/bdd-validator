import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ImportedProductCheckinService } from './imported-product-checkin.service';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';

describe('ImportedProductCheckinService', () => {
  let service: ImportedProductCheckinService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ImportedProductCheckinService]
    });
    service = TestBed.inject(ImportedProductCheckinService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Lookup Operations', () => {
    it('should get contracts', () => {
      const mockContracts = [
        { contractId: 'TEST', description: 'Test Contract' },
        { contractId: 'PROD', description: 'Production Contract' }
      ];

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Contracts retrieved successfully',
        data: mockContracts
      };

      service.getContracts().subscribe(contracts => {
        expect(contracts).toEqual(mockContracts);
        expect(contracts.length).toBe(2);
        expect(contracts[0].contractId).toBe('TEST');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.IMPORTED_PRODUCT_CHECKIN.GET_CONTRACTS}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get products for contract', () => {
      const contractId = 'TEST';
      const mockProducts = [
        { productCode: 'RBC001', description: 'Red Blood Cells' },
        { productCode: 'PLT001', description: 'Platelets' }
      ];

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Product codes retrieved successfully',
        data: mockProducts
      };

      service.getProductsForContract(contractId).subscribe(products => {
        expect(products).toEqual(mockProducts);
        expect(products.length).toBe(2);
        expect(products[0].productCode).toBe('RBC001');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.IMPORTED_PRODUCT_CHECKIN.GET_PRODUCTS_FOR_CONTRACT(contractId)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });



    it('should handle error responses gracefully', () => {
      service.getContracts().subscribe({
        next: () => fail('should have failed with 500 error'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.IMPORTED_PRODUCT_CHECKIN.GET_CONTRACTS}`);
      req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });
    });
  });
});
