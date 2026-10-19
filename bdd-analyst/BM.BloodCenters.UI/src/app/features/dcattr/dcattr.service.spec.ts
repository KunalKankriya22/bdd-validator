import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DcattrService } from './dcattr.service';
import { environment } from '../../../environments/environment';
import {
  ValidateDeleteUnitRequestDto,
  PreviewProductCodeRequestDto,
  DeleteAttributeRequestDto,
  ApiResponse
} from './dcattr.models';

describe('DcattrService', () => {
  let service: DcattrService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/delete-component-attribute`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DcattrService]
    });
    service = TestBed.inject(DcattrService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('validateUnit', () => {
    it('should validate unit successfully', () => {
      const request: ValidateDeleteUnitRequestDto = { unitId: '12345678901234' };
      const mockResponse: ApiResponse<{ collectionDate: string }> = {
        success: true,
        message: 'Unit validated successfully',
        statusCode: 200,
        data: { collectionDate: '2026-01-15T00:00:00Z' }
      };

      service.validateUnit(request).subscribe(response => {
        expect(response.collectionDate).toBe('2026-01-15T00:00:00Z');
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-unit`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle unit not found error (0210)', () => {
      const request: ValidateDeleteUnitRequestDto = { unitId: 'INVALID' };
      const mockError: ApiResponse<any> = {
        success: false,
        statusCode: 400,
        errorCode: '0210',
        error: 'Unit not found',
        errorResponse: {
          errorCode: '0210',
          error: 'Unit not found'
        }
      };

      service.validateUnit(request).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Unit not found');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-unit`);
      req.flush(mockError, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle no deletable attributes error (0175)', () => {
      const request: ValidateDeleteUnitRequestDto = { unitId: '12345678901234' };
      const mockError: ApiResponse<any> = {
        success: false,
        statusCode: 400,
        errorCode: '0175',
        error: 'Unit does not have any deletable attributes',
        errorResponse: {
          errorCode: '0175',
          error: 'Unit does not have any deletable attributes'
        }
      };

      service.validateUnit(request).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Unit does not have any deletable attributes');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-unit`);
      req.flush(mockError, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getDeletableAttributes', () => {
    it('should get deletable attributes successfully', () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        message: 'Deletable attributes retrieved successfully',
        statusCode: 200,
        data: [
          { attribCode: 'CMV', description: 'CMV Negative', category: 'Testing' },
          { attribCode: 'IRRAD', description: 'Irradiated', category: 'Processing' }
        ],
        total: 2
      };

      service.getDeletableAttributes('12345678901234', '2026-01-15T00:00:00Z', 'RBC001', 'I').subscribe(response => {
        expect(response.length).toBe(2);
        expect(response[0].attribCode).toBe('CMV');
        expect(response[1].attribCode).toBe('IRRAD');
      });

      const req = httpMock.expectOne(
        r => r.url === `${baseUrl}/deletable-attributes` &&
        r.params.get('unitId') === '12345678901234' &&
        r.params.get('collDate') === '2026-01-15T00:00:00Z' &&
        r.params.get('productCode') === 'RBC001' &&
        r.params.get('codeScheme') === 'I'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('previewNewProductCode', () => {
    it('should preview new product code successfully', () => {
      const request: PreviewProductCodeRequestDto = {
        unitId: '12345678901234',
        collDate: '2026-01-15T00:00:00Z',
        productCode: 'RBC001',
        attribCode: 'CMV',
        codeScheme: 'I'
      };
      const mockResponse: ApiResponse<{ newProductCode: string }> = {
        success: true,
        message: 'New product code generated successfully',
        statusCode: 200,
        data: { newProductCode: 'RBC002' }
      };

      service.previewNewProductCode(request).subscribe(response => {
        expect(response.newProductCode).toBe('RBC002');
      });

      const req = httpMock.expectOne(`${baseUrl}/preview-new-product-code`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle product code generation failed error (9726)', () => {
      const request: PreviewProductCodeRequestDto = {
        unitId: '12345678901234',
        collDate: '2026-01-15T00:00:00Z',
        productCode: 'RBC001',
        attribCode: 'CMV',
        codeScheme: 'I'
      };
      const mockError: ApiResponse<any> = {
        success: false,
        statusCode: 400,
        errorCode: '9726',
        error: 'Product code generation failed',
        errorResponse: {
          errorCode: '9726',
          error: 'Product code generation failed'
        }
      };

      service.previewNewProductCode(request).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Product code generation failed');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/preview-new-product-code`);
      req.flush(mockError, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('deleteAttribute', () => {
    it('should delete attribute successfully', () => {
      const request: DeleteAttributeRequestDto = {
        unitId: '12345678901234',
        collDate: '2026-01-15T00:00:00Z',
        oldProductCode: 'RBC001',
        attribCode: 'CMV',
        newProdCode: 'RBC002',
        verifyProdCode: 'RBC002',
        codeScheme: 'I'
      };
      const mockResponse: ApiResponse<{ newProductCode: string }> = {
        success: true,
        message: 'Attribute deleted successfully',
        statusCode: 200,
        data: { newProductCode: 'RBC002' }
      };

      service.deleteAttribute(request).subscribe(response => {
        expect(response.newProductCode).toBe('RBC002');
      });

      const req = httpMock.expectOne(`${baseUrl}/delete`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle verification mismatch error (9728)', () => {
      const request: DeleteAttributeRequestDto = {
        unitId: '12345678901234',
        collDate: '2026-01-15T00:00:00Z',
        oldProductCode: 'RBC001',
        attribCode: 'CMV',
        newProdCode: 'RBC002',
        verifyProdCode: 'RBC003',
        codeScheme: 'I'
      };
      const mockError: ApiResponse<any> = {
        success: false,
        statusCode: 400,
        errorCode: '9728',
        error: 'New product code verification failed',
        errorResponse: {
          errorCode: '9728',
          error: 'New product code verification failed'
        }
      };

      service.deleteAttribute(request).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('New product code verification failed');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/delete`);
      req.flush(mockError, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle warehouse mismatch error (0241)', () => {
      const request: DeleteAttributeRequestDto = {
        unitId: '12345678901234',
        collDate: '2026-01-15T00:00:00Z',
        oldProductCode: 'RBC001',
        attribCode: 'CMV',
        newProdCode: 'RBC002',
        verifyProdCode: 'RBC002',
        codeScheme: 'I'
      };
      const mockError: ApiResponse<any> = {
        success: false,
        statusCode: 400,
        errorCode: '0241',
        error: 'Component warehouse does not match user warehouse',
        errorResponse: {
          errorCode: '0241',
          error: 'Component warehouse does not match user warehouse'
        }
      };

      service.deleteAttribute(request).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Component warehouse does not match user warehouse');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/delete`);
      req.flush(mockError, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getAttributeHistory', () => {
    it('should get attribute history successfully', () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        message: 'History retrieved successfully',
        statusCode: 200,
        data: [
          {
            oldProductCode: 'RBC001',
            attribCode: 'CMV',
            newProductCode: 'RBC002',
            attribDate: '2026-05-28T10:30:00Z',
            insertDate: '2026-05-28T10:30:00Z'
          },
          {
            oldProductCode: 'RBC002',
            attribCode: 'IRRAD',
            newProductCode: 'RBC003',
            attribDate: '2026-01-20T14:20:00Z',
            insertDate: '2026-01-20T14:20:00Z'
          }
        ],
        total: 2
      };

      service.getAttributeHistory('12345678901234', '2026-01-15T00:00:00Z', 'RBC001').subscribe(response => {
        expect(response.length).toBe(2);
        expect(response[0].attribCode).toBe('CMV');
        expect(response[1].attribCode).toBe('IRRAD');
      });

      const req = httpMock.expectOne(
        r => r.url === `${baseUrl}/attribute-history` &&
        r.params.get('unitId') === '12345678901234' &&
        r.params.get('collDate') === '2026-01-15T00:00:00Z' &&
        r.params.get('productCode') === 'RBC001'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });
});
