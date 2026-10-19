import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AboLabelingApiService } from './abo-labeling-api.service';
import { environment } from '../../../../../../environments/environment';
import {
  ValidateUnitRequestDto,
  ValidateProductRequestDto,
  ValidateBarcodeRequestDto,
  GenerateLabelRequestDto,
} from '../models/abo-labeling.model';

describe('AboLabelingApiService', () => {
  let service: AboLabelingApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/laboratory/abo-labeling`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AboLabelingApiService],
    });

    service = TestBed.inject(AboLabelingApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });


  describe('validateUnit', () => {
    it('should validate unit ID successfully', () => {
      const request: ValidateUnitRequestDto = {
        scannedUnitId: 'ABC12345',
        entryMode: null,
        chapterId: 'CHAP01',
      };

      const mockResponse = {
        success: true,
        message: 'Unit ID validated successfully',
        statusCode: 200,
        data: {
          isValid: true,
          unitId: 'ABC123',
          checkDigit: '45',
          collectionDate: '2026-05-20T00:00:00Z',
          chapterId: 'CHAP01',
          errorMessage: null,
          errorCode: null,
        },
      };

      service.validateUnit(request).subscribe((result) => {
        expect(result.isValid).toBeTrue();
        expect(result.unitId).toBe('ABC123');
        expect(result.checkDigit).toBe('45');
        expect(result.collectionDate).toBe('2026-05-20T00:00:00Z');
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-unit`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle invalid unit ID', () => {
      const request: ValidateUnitRequestDto = {
        scannedUnitId: '',
        entryMode: null,
      };

      const mockResponse = {
        success: false,
        message: 'Invalid Unit ID format',
        statusCode: 400,
        data: {
          isValid: false,
          unitId: '',
          errorMessage: 'Unit ID must be entered',
          errorCode: '400',
        },
      };

      service.validateUnit(request).subscribe((result) => {
        expect(result.isValid).toBeFalse();
        expect(result.errorMessage).toBe('Unit ID must be entered');
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-unit`);
      req.flush(mockResponse);
    });
  });

  describe('validateProduct', () => {
    it('should validate product code successfully', () => {
      const request: ValidateProductRequestDto = {
        scannedProductCode: 'RBC01',
        unitId: 'ABC123',
      };

      const mockResponse = {
        success: true,
        message: 'Product code validated successfully',
        statusCode: 200,
        data: {
          isValid: true,
          productCode: 'RBC01',
          productDescription: 'Red Blood Cells',
          componentPrefix: '00',
          aboOnly: false,
          productFormula: 'FORMULA_RBC01',
          errorMessage: null,
          errorCode: null,
        },
      };

      service.validateProduct(request).subscribe((result) => {
        expect(result.isValid).toBeTrue();
        expect(result.productCode).toBe('RBC01');
        expect(result.productDescription).toBe('Red Blood Cells');
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-product`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle product not found', () => {
      const request: ValidateProductRequestDto = {
        scannedProductCode: 'INVALID',
      };

      const mockResponse = {
        success: false,
        message: 'Product not found',
        statusCode: 400,
        data: {
          isValid: false,
          productCode: '',
          aboOnly: false,
          errorMessage: 'Product code not found or inactive',
          errorCode: '400',
        },
      };

      service.validateProduct(request).subscribe((result) => {
        expect(result.isValid).toBeFalse();
        expect(result.errorMessage).toBe('Product code not found or inactive');
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-product`);
      req.flush(mockResponse);
    });
  });

  describe('validateBarcode', () => {
    it('should validate Code 128 barcode successfully', () => {
      const request: ValidateBarcodeRequestDto = {
        scannedBarcode: '026100',
        barcodeFormat: '128',
      };

      const mockResponse = {
        success: true,
        message: 'Barcode validated successfully',
        statusCode: 200,
        data: {
          isValid: true,
          parsedValue: '026100',
          detectedFormat: 'CODE128',
          parsedDate: '2026-04-09T00:00:00Z',
          formatMetadata: 'Year=26, DayOfYear=100',
          errorMessage: null,
          errorCode: null,
        },
      };

      service.validateBarcode(request).subscribe((result) => {
        expect(result.isValid).toBeTrue();
        expect(result.detectedFormat).toBe('CODE128');
        expect(result.parsedDate).toBe('2026-04-09T00:00:00Z');
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-barcode`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should validate Codabar barcode successfully', () => {
      const request: ValidateBarcodeRequestDto = {
        scannedBarcode: '05-27-26 14:30',
        barcodeFormat: 'CODABAR',
      };

      const mockResponse = {
        success: true,
        message: 'Barcode validated successfully',
        statusCode: 200,
        data: {
          isValid: true,
          parsedValue: '05-27-26 14:30',
          detectedFormat: 'CODABAR',
          parsedDate: '2026-05-27T14:30:00Z',
          formatMetadata: 'MM-DD-RR HH24:MI',
          errorMessage: null,
          errorCode: null,
        },
      };

      service.validateBarcode(request).subscribe((result) => {
        expect(result.isValid).toBeTrue();
        expect(result.detectedFormat).toBe('CODABAR');
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-barcode`);
      req.flush(mockResponse);
    });

    it('should handle invalid barcode format', () => {
      const request: ValidateBarcodeRequestDto = {
        scannedBarcode: 'INVALID',
        barcodeFormat: '128',
      };

      const mockResponse = {
        success: false,
        message: 'Invalid barcode',
        statusCode: 400,
        data: {
          isValid: false,
          parsedValue: '',
          detectedFormat: '',
          errorMessage: 'Invalid barcode format',
          errorCode: '400',
        },
      };

      service.validateBarcode(request).subscribe((result) => {
        expect(result.isValid).toBeFalse();
        expect(result.errorMessage).toBe('Invalid barcode format');
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-barcode`);
      req.flush(mockResponse);
    });
  });

  describe('generateLabel', () => {
    it('should generate label successfully', () => {
      const request: GenerateLabelRequestDto = {
        unitId: 'ABC123',
        productCode: 'RBC01',
        expiryDate128: '026100',
        aboType: 'A',
        rhType: 'POS',
      };

      const mockResponse = {
        success: true,
        message: 'Label generated successfully',
        statusCode: 200,
        data: {
          success: true,
          labelLines: [
            'A POS',
            '',
            '',
            '',
            '',
            '',
            '',
            'Unit: ABC123',
            'Product: RBC01',
          ],
          unitIdWithCheckDigit: 'ABC123',
          productCode: 'RBC01',
          expiryDate128: '026100',
          aboType: 'A',
          rhType: 'POS',
          errorMessage: null,
          errorCode: null,
        },
      };

      service.generateLabel(request).subscribe((result) => {
        expect(result.success).toBeTrue();
        expect(result.labelLines.length).toBe(9);
        expect(result.labelLines[0]).toBe('A POS');
      });

      const req = httpMock.expectOne(`${baseUrl}/generate-label`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle missing ABO type error', () => {
      const request: GenerateLabelRequestDto = {
        unitId: 'ABC123',
        productCode: 'RBC01',
        expiryDate128: '026100',
        aboType: '',
      };

      const mockResponse = {
        success: false,
        message: 'ABO type required',
        statusCode: 400,
        data: {
          success: false,
          labelLines: [],
          unitIdWithCheckDigit: '',
          productCode: '',
          aboType: '',
          errorMessage: 'ABO type is required for labeling',
          errorCode: '400',
        },
      };

      service.generateLabel(request).subscribe((result) => {
        expect(result.success).toBeFalse();
        expect(result.errorMessage).toBe('ABO type is required for labeling');
      });

      const req = httpMock.expectOne(`${baseUrl}/generate-label`);
      req.flush(mockResponse);
    });
  });

  describe('getLabelFormats', () => {
    it('should retrieve label formats successfully', () => {
      const mockResponse = {
        success: true,
        message: 'Label formats retrieved successfully',
        statusCode: 200,
        data: [
          {
            formatCode: '128',
            formatName: 'Code 128',
            description: 'Code 128 barcode format for expiry dates (YYYDDD)',
            isActive: true,
            dateFormatMask: 'YYYDDD',
          },
          {
            formatCode: 'CODABAR',
            formatName: 'Codabar',
            description: 'Codabar barcode format for expiry dates (MM-DD-RR HH24:MI)',
            isActive: true,
            dateFormatMask: 'MM-DD-RR HH24:MI',
          },
        ],
      };

      service.getLabelFormats().subscribe((formats) => {
        expect(formats.length).toBe(2);
        expect(formats[0].formatCode).toBe('128');
        expect(formats[1].formatCode).toBe('CODABAR');
      });

      const req = httpMock.expectOne(`${baseUrl}/label-formats`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
