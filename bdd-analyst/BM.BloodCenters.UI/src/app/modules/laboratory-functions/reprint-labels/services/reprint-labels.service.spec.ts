import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReprintLabelsService } from './reprint-labels.service';
import { API } from '../../../../core/constants/api.constants';

describe('ReprintLabelsService', () => {
  let service: ReprintLabelsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReprintLabelsService],
    });
    service = TestBed.inject(ReprintLabelsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getLabelTypes', () => {
    it('should call GET label-types endpoint', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        data: [
          { code: 'PFF', description: 'Print Full Face Label - ISBT' },
          { code: 'PCA', description: 'Codabar ABO/Expiration Label' },
        ],
      };

      service.getLabelTypes().subscribe(res => {
        expect(res.success).toBe(true);
        expect(res.data?.length).toBe(2);
        expect(res.data?.[0].code).toBe('PFF');
      });

      const req = httpMock.expectOne(API.REPRINT_LABELS.LABEL_TYPES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('validateUnit', () => {
    it('should call POST validate-unit endpoint', () => {
      const request = { unitId: 'W633319021203', labelType: 'PFF' };
      const mockResponse = {
        success: true,
        statusCode: 200,
        item: {
          unitId: 'W633319021203',
          collDate: '12-Feb-2019',
          donorDecisionCode: 'Y',
          systemLabelDecision: '73',
          contractId: 'INTERNAL',
        },
      };

      service.validateUnit(request).subscribe(res => {
        expect(res.success).toBe(true);
        expect(res.item?.unitId).toBe('W633319021203');
        expect(res.item?.systemLabelDecision).toBe('73');
      });

      const req = httpMock.expectOne(API.REPRINT_LABELS.VALIDATE_UNIT);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

  });

  describe('processLabel', () => {
    it('should return warning 9200 without overrides', () => {
      const request = { unitId: 'W633319021203', labelType: 'PFF', productCode: 'E5078V00', overrides: null };
      const mockResponse = {
        success: true,
        statusCode: 200,
        item: {
          isWarning: true,
          warningCode: '9200',
          warningMessage: 'Label will be printed',
          warnings: [{ code: '9200', message: 'Label will be printed' }],
        },
      };

      service.processLabel(request).subscribe(res => {
        expect(res.success).toBe(true);
        expect(res.item?.isWarning).toBe(true);
        expect(res.item?.warningCode).toBe('9200');
      });

      const req = httpMock.expectOne(API.REPRINT_LABELS.PROCESS_LABEL);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should return label data with 9200 override', () => {
      const request = { unitId: 'W633319021203', labelType: 'PFF', productCode: 'E5078V00', overrides: ['9200'] };
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Label printed successfully',
        item: {
          unitId: 'W633319021203',
          label: '73',
          expiryDate: '12-Feb-2034 23:59',
          identifierCode: 'RG',
          codeScheme: 'I',
          specialTestingCode: 'N0107',
          requiresSpecialTesting: true,
          isMfProduct: false,
          isWarning: false,
        },
      };

      service.processLabel(request).subscribe(res => {
        expect(res.success).toBe(true);
        expect(res.item?.isWarning).toBe(false);
        expect(res.item?.label).toBe('73');
        expect(res.item?.codeScheme).toBe('I');
      });

      const req = httpMock.expectOne(API.REPRINT_LABELS.PROCESS_LABEL);
      req.flush(mockResponse);
    });

  });

  describe('verifyLabel', () => {
    it('should return verification complete when all match', () => {
      const request = {
        unitId: 'W633319021203',
        productCode: 'E5078V00',
        labelType: 'PFF',
        expectedLabel: '73',
        expectedExpiryDate: '12-FEB-2034',
        expectedCollDate: null,
        expectedSpecialTestingCode: null,
        identifierCode: 'RG',
        codeScheme: 'I',
        scannedUnitId: 'W633319021203',
        scannedAbo: '73',
        scannedProductCode: 'E5078V00',
        scannedExpirationDate: '12-FEB-2034',
        scannedCollectionDate: null,
        scannedSpecialTestingCode: null,
      };
      const mockResponse = {
        success: true,
        statusCode: 200,
        item: {
          unitIdMatch: true,
          aboMatch: true,
          productCodeMatch: true,
          dateMatch: true,
          specialTestingMatch: true,
          verificationComplete: true,
        },
      };

      service.verifyLabel(request).subscribe(res => {
        expect(res.success).toBe(true);
        expect(res.item?.verificationComplete).toBe(true);
      });

      const req = httpMock.expectOne(API.REPRINT_LABELS.VERIFY);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should return mismatch error for wrong ABO', () => {
      const request = {
        unitId: 'W633319021203', productCode: 'E5078V00', labelType: 'PFF',
        expectedLabel: '73', expectedExpiryDate: null, expectedCollDate: null,
        expectedSpecialTestingCode: null, identifierCode: 'RG', codeScheme: 'I',
        scannedUnitId: 'W633319021203', scannedAbo: '51',
        scannedProductCode: 'E5078V00', scannedExpirationDate: null,
        scannedCollectionDate: null, scannedSpecialTestingCode: null,
      };
      const mockResponse = {
        success: true, statusCode: 200,
        item: {
          unitIdMatch: true, aboMatch: false, productCodeMatch: true,
          dateMatch: true, specialTestingMatch: true, verificationComplete: false,
          mismatchErrorCode: '1509', mismatchField: 'ABO',
        },
      };

      service.verifyLabel(request).subscribe(res => {
        expect(res.item?.aboMatch).toBe(false);
        expect(res.item?.mismatchErrorCode).toBe('1509');
        expect(res.item?.verificationComplete).toBe(false);
      });

      const req = httpMock.expectOne(API.REPRINT_LABELS.VERIFY);
      req.flush(mockResponse);
    });
  });
});
