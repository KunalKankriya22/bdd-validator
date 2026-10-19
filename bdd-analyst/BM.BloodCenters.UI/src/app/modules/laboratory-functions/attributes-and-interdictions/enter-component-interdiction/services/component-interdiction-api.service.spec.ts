import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentInterdictionApiService } from './component-interdiction-api.service';
import { environment } from 'src/environments/environment';
import {
  ValidateUnitRequest,
  ValidateProductRequest,
  CreateComponentInterdictionRequest,
  ApiResponse
} from '../models/component-interdiction.model';

describe('ComponentInterdictionApiService', () => {
  let service: ComponentInterdictionApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/component-interdiction`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ComponentInterdictionApiService]
    });
    service = TestBed.inject(ComponentInterdictionApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('validateUnit', () => {
    it('should validate unit successfully', (done) => {
      const request: ValidateUnitRequest = {
        scannedValue: 'ABC123456789',
        barcodeScheme: 'C'
      };

      const mockResponse: ApiResponse<any> = {
        success: true,
        message: 'Unit validated successfully',
        statusCode: 200,
        item: {
          unitId: 'ABC123456789',
          collectionDate: '2024-06-08T00:00:00Z',
          chapterId: '0001',
          hasComponents: true
        }
      };

      service.validateUnit(request).subscribe({
        next: (response) => {
          expect(response.unitId).toBe('ABC123456789');
          expect(response.hasComponents).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-unit`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

  });

  describe('validateProduct', () => {
    it('should validate product successfully', (done) => {
      const request: ValidateProductRequest = {
        scannedValue: 'RBC01',
        barcodeScheme: 'C',
        unitId: 'ABC123456789',
        collectionDate: '2024-06-08T00:00:00Z'
      };

      const mockResponse: ApiResponse<any> = {
        success: true,
        message: 'Product validated successfully',
        statusCode: 200,
        item: {
          productCode: 'RBC01',
          productDescription: 'Red Blood Cells'
        }
      };

      service.validateProduct(request).subscribe({
        next: (response) => {
          expect(response.productCode).toBe('RBC01');
          expect(response.productDescription).toBe('Red Blood Cells');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-product`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('getValidInterdictions', () => {
    it('should get valid interdictions', (done) => {
      const mockResponse: ApiResponse<any[]> = {
        success: true,
        message: 'Found 2 valid interdiction(s)',
        statusCode: 200,
        data: [
          { code: 'NFTH', description: 'Not For Transfusion - High Risk', type: 'NFT' },
          { code: 'HOLD', description: 'Component on Hold', type: 'Hold' }
        ]
      };

      service.getValidInterdictions('ABC123456789', '2024-06-08T00:00:00Z', 'RBC01').subscribe({
        next: (response) => {
          expect(response.length).toBe(2);
          expect(response[0].code).toBe('NFTH');
          done();
        }
      });

      const req = httpMock.expectOne(req =>
        req.url === `${baseUrl}/valid-interdictions` &&
        req.params.get('unitId') === 'ABC123456789'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createInterdiction', () => {
    it('should create interdiction successfully', (done) => {
      const request: CreateComponentInterdictionRequest = {
        unitId: 'ABC123456789',
        collectionDate: '2024-06-08T00:00:00Z',
        productCode: 'RBC01',
        interdictionCode: 'NFTH'
      };

      const mockResponse: ApiResponse<any> = {
        success: true,
        message: 'Record successfully added',
        statusCode: 201,
        errorCode: '8010',
        item: {
          unitId: 'ABC123456789',
          collectionDate: '2024-06-08T00:00:00Z',
          chapterId: '0001',
          productCode: 'RBC01',
          productDescription: 'Red Blood Cells',
          interdictionCode: 'NFTH',
          interdictionDescription: 'Not For Transfusion - High Risk',
          interdictionType: 'NFT',
          insertDate: '2024-06-08T14:30:00Z',
          interdictionUserId: 'USER001'
        }
      };

      service.createInterdiction(request).subscribe({
        next: (response) => {
          expect(response.unitId).toBe('ABC123456789');
          expect(response.interdictionCode).toBe('NFTH');
          done();
        }
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });
});
