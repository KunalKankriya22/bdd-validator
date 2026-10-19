import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductCodesService } from './product-codes.service';
import { environment } from 'src/environments/environment';
import { ProductCodeRequest } from '../models/product-codes.model';
import { API } from '@core/constants/api.constants';

describe('ProductCodesService', () => {
  let service: ProductCodesService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/valid-products`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductCodesService]
    });

    service = TestBed.inject(ProductCodesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding HTTP requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProductCodes', () => {
    it('should fetch product codes with pagination', (done) => {
      const mockResponse = {
        data: [
          {
            productCode: 'E0001',
            productDesc: 'Red Blood Cells',
            productType: 'RBC',
            effDate: '2025-01-01',
            termDate: null
          }
        ],
        total: 1
      };

      service.getProductCodes(10, 0).subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.total).toBe(1);
        expect(response.data[0].productCode).toBe('E0001');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should send search keyword in request body', () => {
      const params = { searchKeyword: 'RBC' };

      service.getProductCodes(10, 0, params).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      expect(req.request.body.searchKeyword).toBe('RBC');
      req.flush({ data: [], total: 0 });
    });

    it('should send product type filter', () => {
      const params = { productType: 'RBC' };

      service.getProductCodes(10, 0, params).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      expect(req.request.body.productType).toBe('RBC');
      req.flush({ data: [], total: 0 });
    });

    it('should send product class filter', () => {
      const params = { productClass: 'WB' };

      service.getProductCodes(10, 0, params).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      expect(req.request.body.productClass).toBe('WB');
      req.flush({ data: [], total: 0 });
    });

    it('should send sort parameters in request body', () => {
      const params = { sortColumn: 'productCode', sortOrder: 'ASC' as const };

      service.getProductCodes(25, 50, params).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/25/50`);
      expect(req.request.body.sortColumn).toBe('productCode');
      expect(req.request.body.sortOrder).toBe('ASC');
      req.flush({ data: [], total: 0 });
    });

    it('should send date filter parameters in request body', () => {
      const params = {
        effectiveDate: '2025-01-01',
        effectivePeriod: 'After',
        terminationDate: '2025-12-31',
        terminationPeriod: 'Before'
      };

      service.getProductCodes(10, 0, params).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      expect(req.request.body.effectiveDate).toBe('2025-01-01');
      expect(req.request.body.effectivePeriod).toBe('After');
      expect(req.request.body.terminationDate).toBe('2025-12-31');
      expect(req.request.body.terminationPeriod).toBe('Before');
      req.flush({ data: [], total: 0 });
    });

    it('should send null values for all body fields when params is undefined', () => {
      service.getProductCodes(10, 0).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      expect(req.request.body.searchKeyword).toBeNull();
      expect(req.request.body.sortColumn).toBeNull();
      expect(req.request.body.sortOrder).toBeNull();
      expect(req.request.body.productType).toBeNull();
      expect(req.request.body.productClass).toBeNull();
      expect(req.request.body.effectiveDate).toBeNull();
      expect(req.request.body.effectivePeriod).toBeNull();
      expect(req.request.body.terminationDate).toBeNull();
      expect(req.request.body.terminationPeriod).toBeNull();
      req.flush({ data: [], total: 0 });
    });

    it('should convert date strings to Date objects', (done) => {
      const mockResponse = {
        data: [
          {
            productCode: 'E0001',
            effDate: '2025-01-01T00:00:00',
            termDate: '2025-12-31T00:00:00',
            lastModifiedDate: '2025-05-15T10:30:00'
          }
        ],
        total: 1
      };

      service.getProductCodes(10, 0).subscribe(response => {
        expect(response.data[0].effDate instanceof Date).toBeTrue();
        expect(response.data[0].termDate instanceof Date).toBeTrue();
        expect(response.data[0].lastModifiedDate instanceof Date).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      req.flush(mockResponse);
    });

    it('should handle null dates correctly', (done) => {
      const mockResponse = {
        data: [
          {
            productCode: 'E0001',
            effDate: null,
            termDate: null,
            lastModifiedDate: null
          }
        ],
        total: 1
      };

      service.getProductCodes(10, 0).subscribe(response => {
        expect(response.data[0].effDate).toBeUndefined();
        expect(response.data[0].termDate).toBeNull();
        expect(response.data[0].lastModifiedDate).toBeUndefined();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      req.flush(mockResponse);
    });

    it('should return empty array and zero total when response data is null', (done) => {
      const mockResponse = { data: null, total: 0 };

      service.getProductCodes(10, 0).subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.total).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      req.flush(mockResponse);
    });

    it('should default total to 0 when response total is undefined', (done) => {
      const mockResponse = { data: [] };

      service.getProductCodes(10, 0).subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.total).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors', (done) => {
      service.getProductCodes(10, 0).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getProductCodeById', () => {
    it('should fetch single product code', (done) => {
      const mockResponse = {
        data: [
          {
            productCode: 'E0001',
            productDesc: 'Red Blood Cells',
            effDate: '2025-01-01',
            termDate: null
          }
        ]
      };

      service.getProductCodeById('E0001').subscribe(response => {
        expect(response).toBeTruthy();
        expect(response!.productCode).toBe('E0001');
        expect(response!.productDesc).toBe('Red Blood Cells');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/E0001`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should convert date strings to Date objects in response', (done) => {
      const mockResponse = {
        data: [
          {
            productCode: 'E0001',
            effDate: '2025-01-01T00:00:00',
            termDate: '2025-12-31T00:00:00',
            lastModifiedDate: '2025-06-01T12:00:00'
          }
        ]
      };

      service.getProductCodeById('E0001').subscribe(response => {
        expect(response).toBeTruthy();
        expect(response!.effDate instanceof Date).toBeTrue();
        expect(response!.termDate instanceof Date).toBeTrue();
        expect(response!.lastModifiedDate instanceof Date).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/E0001`);
      req.flush(mockResponse);
    });

    it('should handle null/falsy dates in single product response', (done) => {
      const mockResponse = {
        data: [
          {
            productCode: 'E0001',
            effDate: null,
            termDate: null,
            lastModifiedDate: null
          }
        ]
      };

      service.getProductCodeById('E0001').subscribe(response => {
        expect(response).toBeTruthy();
        expect(response!.effDate).toBeUndefined();
        expect(response!.termDate).toBeNull();
        expect(response!.lastModifiedDate).toBeUndefined();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/E0001`);
      req.flush(mockResponse);
    });

    it('should return null when response data is empty array', (done) => {
      const mockResponse = { data: [] };

      service.getProductCodeById('NONEXIST').subscribe(response => {
        expect(response).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/NONEXIST`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when response data is null', (done) => {
      const mockResponse = { data: null };

      service.getProductCodeById('NONEXIST').subscribe(response => {
        expect(response).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/NONEXIST`);
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors', (done) => {
      service.getProductCodeById('E0001').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/E0001`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createProductCode', () => {
    it('should create new product code', () => {
      const request: ProductCodeRequest = {
        productCode: 'E0002',
        productDesc: 'Test Product',
        productType: 'RBC',
        effDate: '2025-01-01',
        termDate: null
      };

      const mockResponse = {
        success: true,
        message: 'Product created successfully'
      };

      service.createProductCode(request).subscribe(response => {
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors on create', (done) => {
      const request: ProductCodeRequest = {
        productCode: 'E0002',
        productDesc: 'Test Product',
        productType: 'RBC',
        effDate: '2025-01-01',
        termDate: null
      };

      service.createProductCode(request).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateProductCode', () => {
    it('should update existing product code', () => {
      const request: ProductCodeRequest = {
        productCode: 'E0001',
        productDesc: 'Updated Product',
        productType: 'RBC',
        effDate: '2025-01-01',
        termDate: null
      };

      const mockResponse = {
        success: true,
        message: 'Product updated successfully'
      };

      service.updateProductCode('E0001', request).subscribe(response => {
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${baseUrl}/E0001`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors on update', (done) => {
      const request: ProductCodeRequest = {
        productCode: 'E0001',
        productDesc: 'Updated Product',
        productType: 'RBC',
        effDate: '2025-01-01',
        termDate: null
      };

      service.updateProductCode('E0001', request).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/E0001`);
      expect(req.request.method).toBe('PUT');
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });
    });
  });

  describe('deleteProductCode', () => {
    it('should soft delete product code', () => {
      const mockResponse = {
        success: true,
        message: 'Product deleted successfully'
      };

      service.deleteProductCode('E0001').subscribe(response => {
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${baseUrl}/E0001`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors on delete', (done) => {
      service.deleteProductCode('E0001').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/E0001`);
      expect(req.request.method).toBe('DELETE');
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('getProductAttributes', () => {
    it('should fetch product attributes', (done) => {
      const mockResponse = {
        data: [
          {
            attributeGroup: 'ATTR',
            attributeGroupDescription: 'Attributes',
            attributeCode: 'A001',
            attributeDescription: 'Test Attribute'
          }
        ],
        total: 1,
        success: true,
        message: 'Success'
      };

      service.getProductAttributes('E0001').subscribe(response => {
        expect(response.length).toBe(1);
        expect(response[0].attributeCode).toBe('A001');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/E0001/attributes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when response data is null', (done) => {
      const mockResponse = { data: null, total: 0, success: true, message: 'Success' };

      service.getProductAttributes('E0001').subscribe(response => {
        expect(response).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/E0001/attributes`);
      req.flush(mockResponse);
    });

    it('should return empty array when response data is empty', (done) => {
      const mockResponse = { data: [], total: 0, success: true, message: 'Success' };

      service.getProductAttributes('E0001').subscribe(response => {
        expect(response).toEqual([]);
        expect(response.length).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/E0001/attributes`);
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors', (done) => {
      service.getProductAttributes('E0001').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/E0001/attributes`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('Lookup Services', () => {
    describe('getProductTypes', () => {
      it('should fetch product types', (done) => {
        const mockResponse = {
          data: [
            { productTypeCode: 'RBC', productTypeDesc: 'Red Blood Cells' },
            { productTypeCode: 'PLT', productTypeDesc: 'Platelets' }
          ]
        };

        service.getProductTypes().subscribe(response => {
          expect(response.length).toBe(2);
          expect(response[0].productTypeCode).toBe('RBC');
          done();
        });

        const req = httpMock.expectOne(`${environment.apiUrl}${API.COMPONENT_PRODUCTION.PRODUCT_CODES.PRODUCT_TYPES_LOV}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });

      it('should handle empty lookup responses', (done) => {
        const mockResponse = { data: [] };

        service.getProductTypes().subscribe(response => {
          expect(response.length).toBe(0);
          done();
        });

        const req = httpMock.expectOne(`${environment.apiUrl}${API.COMPONENT_PRODUCTION.PRODUCT_CODES.PRODUCT_TYPES_LOV}`);
        req.flush(mockResponse);
      });

      it('should return empty array when data is null', (done) => {
        const mockResponse = { data: null };

        service.getProductTypes().subscribe(response => {
          expect(response).toEqual([]);
          done();
        });

        const req = httpMock.expectOne(`${environment.apiUrl}${API.COMPONENT_PRODUCTION.PRODUCT_CODES.PRODUCT_TYPES_LOV}`);
        req.flush(mockResponse);
      });

      it('should propagate HTTP errors', (done) => {
        service.getProductTypes().subscribe({
          next: () => fail('Should have failed'),
          error: (error) => {
            expect(error.status).toBe(500);
            done();
          }
        });

        const req = httpMock.expectOne(`${environment.apiUrl}${API.COMPONENT_PRODUCTION.PRODUCT_CODES.PRODUCT_TYPES_LOV}`);
        req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      });
    });

    describe('getProductClasses', () => {
      it('should fetch product classes', (done) => {
        const mockResponse = {
          data: [
            { code: 'WB', codeDesc: 'Whole Blood' },
            { code: 'RBC', codeDesc: 'Red Blood Cells' }
          ]
        };

        service.getProductClasses().subscribe(response => {
          expect(response.length).toBe(2);
          expect(response[0].code).toBe('WB');
          done();
        });

        const req = httpMock.expectOne(`${environment.apiUrl}${API.COMPONENT_PRODUCTION.PRODUCT_CODES.PRODUCT_CLASSES}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });

      it('should return empty array when data is null', (done) => {
        const mockResponse = { data: null };

        service.getProductClasses().subscribe(response => {
          expect(response).toEqual([]);
          done();
        });

        const req = httpMock.expectOne(`${environment.apiUrl}${API.COMPONENT_PRODUCTION.PRODUCT_CODES.PRODUCT_CLASSES}`);
        req.flush(mockResponse);
      });

      it('should propagate HTTP errors', (done) => {
        service.getProductClasses().subscribe({
          next: () => fail('Should have failed'),
          error: (error) => {
            expect(error.status).toBe(500);
            done();
          }
        });

        const req = httpMock.expectOne(`${environment.apiUrl}${API.COMPONENT_PRODUCTION.PRODUCT_CODES.PRODUCT_CLASSES}`);
        req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      });
    });

    describe('getModifiers', () => {
      it('should fetch modifiers', (done) => {
        const mockResponse = {
          data: [
            { code: 'M01', codeDesc: 'Modifier 1' },
            { code: 'M02', codeDesc: 'Modifier 2' }
          ]
        };

        service.getModifiers().subscribe(response => {
          expect(response.length).toBe(2);
          expect(response[0].code).toBe('M01');
          done();
        });

        const req = httpMock.expectOne(`${environment.apiUrl}${API.COMPONENT_PRODUCTION.PRODUCT_CODES.MODIFIERS}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });

      it('should return empty array when data is null', (done) => {
        const mockResponse = { data: null };

        service.getModifiers().subscribe(response => {
          expect(response).toEqual([]);
          done();
        });

        const req = httpMock.expectOne(`${environment.apiUrl}${API.COMPONENT_PRODUCTION.PRODUCT_CODES.MODIFIERS}`);
        req.flush(mockResponse);
      });

      it('should propagate HTTP errors', (done) => {
        service.getModifiers().subscribe({
          next: () => fail('Should have failed'),
          error: (error) => {
            expect(error.status).toBe(500);
            done();
          }
        });

        const req = httpMock.expectOne(`${environment.apiUrl}${API.COMPONENT_PRODUCTION.PRODUCT_CODES.MODIFIERS}`);
        req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      });
    });

    describe('getInventoryClasses', () => {
      it('should fetch inventory classes', (done) => {
        const mockResponse = {
          data: [
            { code: 'IC01', codeDesc: 'Inventory Class 1' },
            { code: 'IC02', codeDesc: 'Inventory Class 2' }
          ]
        };

        service.getInventoryClasses().subscribe(response => {
          expect(response.length).toBe(2);
          expect(response[0].code).toBe('IC01');
          expect(response[1].codeDesc).toBe('Inventory Class 2');
          done();
        });

        const req = httpMock.expectOne(`${environment.apiUrl}${API.COMPONENT_PRODUCTION.PRODUCT_CODES.INVENTORY_CLASSES}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });

      it('should return empty array when data is null', (done) => {
        const mockResponse = { data: null };

        service.getInventoryClasses().subscribe(response => {
          expect(response).toEqual([]);
          done();
        });

        const req = httpMock.expectOne(`${environment.apiUrl}${API.COMPONENT_PRODUCTION.PRODUCT_CODES.INVENTORY_CLASSES}`);
        req.flush(mockResponse);
      });

      it('should return empty array when data is empty', (done) => {
        const mockResponse = { data: [] };

        service.getInventoryClasses().subscribe(response => {
          expect(response).toEqual([]);
          expect(response.length).toBe(0);
          done();
        });

        const req = httpMock.expectOne(`${environment.apiUrl}${API.COMPONENT_PRODUCTION.PRODUCT_CODES.INVENTORY_CLASSES}`);
        req.flush(mockResponse);
      });

      it('should propagate HTTP errors', (done) => {
        service.getInventoryClasses().subscribe({
          next: () => fail('Should have failed'),
          error: (error) => {
            expect(error.status).toBe(500);
            done();
          }
        });

        const req = httpMock.expectOne(`${environment.apiUrl}${API.COMPONENT_PRODUCTION.PRODUCT_CODES.INVENTORY_CLASSES}`);
        req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      });
    });
  });

  describe('validateFormula', () => {
    it('should return success true for a valid formula', (done) => {
      const mockResponse = { success: true };

      service.validateFormula('RBC+PLT').subscribe(result => {
        expect(result.success).toBeTrue();
        expect(result.error).toBeUndefined();
        expect(result.errorCode).toBeUndefined();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-formula`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.productFormula).toBe('RBC+PLT');
      req.flush(mockResponse);
    });

    it('should trim whitespace from formula before sending', (done) => {
      const mockResponse = { success: true };

      service.validateFormula('  RBC+PLT  ').subscribe(result => {
        expect(result.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-formula`);
      expect(req.request.body.productFormula).toBe('RBC+PLT');
      req.flush(mockResponse);
    });

    it('should send null when formula is null', (done) => {
      const mockResponse = { success: true };

      service.validateFormula(null).subscribe(result => {
        expect(result.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-formula`);
      expect(req.request.body.productFormula).toBeNull();
      req.flush(mockResponse);
    });

    it('should return success false when API returns success not true', (done) => {
      const mockResponse = { success: false };

      service.validateFormula('INVALID').subscribe(result => {
        expect(result.success).toBeFalse();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-formula`);
      req.flush(mockResponse);
    });

    it('should catch HTTP error and return failure with error message from error.error.error', (done) => {
      service.validateFormula('BAD_FORMULA').subscribe(result => {
        expect(result.success).toBeFalse();
        expect(result.error).toBe('Formula syntax error');
        expect(result.errorCode).toBe('FORMULA_INVALID');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-formula`);
      req.flush(
        { error: 'Formula syntax error', errorCode: 'FORMULA_INVALID' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should catch HTTP error and return failure with error message from error.error.message', (done) => {
      service.validateFormula('BAD_FORMULA').subscribe(result => {
        expect(result.success).toBeFalse();
        expect(result.error).toBe('Validation failed');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-formula`);
      req.flush(
        { message: 'Validation failed' },
        { status: 422, statusText: 'Unprocessable Entity' }
      );
    });

    it('should return default error message when no specific error message is provided', (done) => {
      service.validateFormula('BAD_FORMULA').subscribe(result => {
        expect(result.success).toBeFalse();
        expect(result.error).toBe('Invalid formula');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-formula`);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should return errorCode from HTTP error response', (done) => {
      service.validateFormula('BAD').subscribe(result => {
        expect(result.success).toBeFalse();
        expect(result.errorCode).toBe('ERR_SYNTAX');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-formula`);
      req.flush(
        { error: 'Syntax error', errorCode: 'ERR_SYNTAX' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors gracefully', (done) => {
      service.getProductCodes(10, 0).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle 401 unauthorized errors', (done) => {
      service.getProductCodes(10, 0).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });
});
