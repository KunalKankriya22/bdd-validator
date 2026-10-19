import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ChangeDriveIdCollectionDateService } from './change-drive-id-collection-date.service';
import { environment } from '../../../../../../../environments/environment';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import { UpdateDriveRequest, ValidateRequest } from '../models/change-drive-id-collection-date.model';

describe('ChangeDriveIdCollectionDateService', () => {
  let service: ChangeDriveIdCollectionDateService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChangeDriveIdCollectionDateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ChangeDriveIdCollectionDateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getBatches', () => {
    it('should fetch batches with pagination', () => {
      const mockResponse = {
        data: { items: [], total: 0 },
        success: true
      };

      service.getBatches(25, 0, 'CH01').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/batches/25/0?chapterId=CH01`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getBatchBySetId', () => {
    it('should fetch batch by set ID', () => {
      const mockResponse = {
        success: true,
        data: { donations: [], total: 0 }
      };

      service.getBatchBySetId('SET001', 'CH01').subscribe(response => {
        expect(response).toBeTruthy();
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/batch/SET001?chapterId=CH01`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
  describe('getDrivesByDate', () => {
    it('should fetch drives by date', () => {
      const mockResponse = {
        data: [
          { driveId: 'DRV0020373', driveDate: '1998-01-05T00:00:00', sponsorName: 'ST COLUMBA CHURCH', projectedDraw: 50 }
        ],
        success: true
      };

      service.getDrivesByDate('1998-01-05', 'CH01').subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.data[0].driveId).toBe('DRV0020373');
        expect(response.data[0].sponsorName).toBe('ST COLUMBA CHURCH');
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/drives/1998-01-05?chapterId=CH01`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
  describe('validateChange', () => {
    it('should validate change request', () => {
      const request: ValidateRequest = {
        chapterId: 'CH01',
        transactionId: 'TR001',
        newCollectionDate: '2024-01-15'
      };

      const mockResponse = {
        data: { isValid: true },
        success: true
      };

      service.validateChange(request).subscribe(response => {
        expect(response.data.isValid).toBeTrue();
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/validate`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('updateDrive', () => {
    it('should update drive', () => {
      const request: UpdateDriveRequest = {
        setId: 'SET001',
        unitId: 'UNIT001',
        newDriveId: 'DRV002',
        transactionIds: ['TR001', 'TR002']
      };

      const mockResponse = {
        data: { message: 'Success', updatedCount: 2 },
        success: true
      };

      service.updateDrive(request).subscribe(response => {
        expect(response.data.updatedCount).toBe(2);
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('getDonationTypes', () => {
    it('should fetch donation types', () => {
      const mockResponse = {
        data: [
          { code: 'ALL', description: 'All Types' },
          { code: 'WB', description: 'Whole Blood' }
        ],
        success: true
      };

      service.getDonationTypes().subscribe(types => {
        expect(types.length).toBe(2);
        expect(types[0].code).toBe('ALL');
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/donation-types`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getProcedureCodes', () => {
    it('should fetch procedure codes', () => {
      const mockResponse = {
        data: [
          { code: 'WB', description: 'Whole Blood' },
          { code: 'PLT', description: 'Platelets' }
        ],
        success: true
      };

      service.getProcedureCodes().subscribe(codes => {
        expect(codes.length).toBe(2);
        expect(codes[0].code).toBe('WB');
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/procedure-codes`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getByUnitId', () => {
    it('should fetch by unitId with SKIP_ERROR_TOAST context', () => {
      const mockResponse: any = {
        success: true,
        message: '',
        statusCode: 200,
        data: [{ transactionId: 'TR001', unitId: 'U001' }],
        total: 1,
        errorResponse: { errorCode: '', error: '' }
      };

      service.getByUnitId('U001', 'CH01').subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data.length).toBe(1);
        expect(response.data[0].unitId).toBe('U001');
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/unit/U001?chapterId=CH01`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('chapterId')).toBe('CH01');
      expect(req.request.context.get(SKIP_ERROR_TOAST)).toBeTrue();
      req.flush(mockResponse);
    });

    it('should handle HTTP errors for getByUnitId', () => {
      service.getByUnitId('INVALID', 'CH01').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/unit/INVALID?chapterId=CH01`
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getByDeferralId', () => {
    it('should fetch by deferralId with SKIP_ERROR_TOAST context', () => {
      const mockResponse: any = {
        success: true,
        message: '',
        statusCode: 200,
        data: [{ transactionId: 'TR002', deferralId: 'DEF001' }],
        total: 1,
        errorResponse: { errorCode: '', error: '' }
      };

      service.getByDeferralId('DEF001', 'CH01').subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data.length).toBe(1);
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/deferral/DEF001?chapterId=CH01`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('chapterId')).toBe('CH01');
      expect(req.request.context.get(SKIP_ERROR_TOAST)).toBeTrue();
      req.flush(mockResponse);
    });

    it('should handle HTTP errors for getByDeferralId', () => {
      service.getByDeferralId('INVALID', 'CH01').subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/deferral/INVALID?chapterId=CH01`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getByDriveId', () => {
    it('should fetch by driveId', () => {
      const mockResponse: any = {
        success: true,
        message: '',
        statusCode: 200,
        data: [{ transactionId: 'TR003', driveId: 'DRV001' }],
        total: 1,
        errorResponse: { errorCode: '', error: '' }
      };

      service.getByDriveId('DRV001', 'CH01').subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data.length).toBe(1);
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/drive/DRV001?chapterId=CH01`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('chapterId')).toBe('CH01');
      req.flush(mockResponse);
    });

    it('should handle HTTP errors for getByDriveId', () => {
      service.getByDriveId('INVALID', 'CH01').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/drive/INVALID?chapterId=CH01`
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getUpdteDrivParam', () => {
    it('should fetch UPDTE_DRIV param', () => {
      const mockResponse = {
        data: { value: 30, description: 'Max days for drive update' },
        success: true
      };

      service.getUpdteDrivParam().subscribe(response => {
        expect(response.data.value).toBe(30);
        expect(response.data.description).toBe('Max days for drive update');
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/updte-driv-param`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle HTTP errors for getUpdteDrivParam', () => {
      service.getUpdteDrivParam().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/updte-driv-param`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('validateUnitId', () => {
    it('should validate unit ID and send correct request body', () => {
      const mockResponse = {
        success: true,
        message: 'Valid',
        errorCode: null,
        item: { parsedUnitId: 'U001-PARSED' }
      };

      service.validateUnitId('U001').subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.item!.parsedUnitId).toBe('U001-PARSED');
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor-lib/validate-unit`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ unitId: 'U001', validateFfValue: 'DONOR' });
      expect(req.request.context.get(SKIP_ERROR_TOAST)).toBeTrue();
      req.flush(mockResponse);
    });

    it('should handle invalid unit ID response', () => {
      const mockResponse = {
        success: false,
        message: 'Invalid unit ID',
        errorCode: 'INVALID_UNIT',
        item: null
      };

      service.validateUnitId('BAD_ID').subscribe(response => {
        expect(response.success).toBeFalse();
        expect(response.errorCode).toBe('INVALID_UNIT');
        expect(response.item).toBeNull();
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor-lib/validate-unit`
      );
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle HTTP errors for validateUnitId', () => {
      service.validateUnitId('U001').subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor-lib/validate-unit`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors for getBatches', () => {
      service.getBatches(25, 0, 'CH01').subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/batches/25/0?chapterId=CH01`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle HTTP errors for getBatchBySetId', () => {
      service.getBatchBySetId('INVALID', 'CH01').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/batch/INVALID?chapterId=CH01`
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle HTTP errors for getDrivesByDate', () => {
      service.getDrivesByDate('2024-01-01', 'CH01').subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/drives/2024-01-01?chapterId=CH01`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle HTTP errors for validateChange', () => {
      const request: ValidateRequest = {
        chapterId: 'CH01',
        transactionId: 'TR001',
        newCollectionDate: '2024-01-15'
      };

      service.validateChange(request).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/validate`
      );
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle HTTP errors for updateDrive', () => {
      const request: UpdateDriveRequest = {
        setId: 'SET001',
        transactionIds: ['TR001']
      };

      service.updateDrive(request).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle HTTP errors for getDonationTypes', () => {
      service.getDonationTypes().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/donation-types`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle HTTP errors for getProcedureCodes', () => {
      service.getProcedureCodes().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/procedure-codes`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getDonationTypes - map transformation', () => {
    it('should uppercase and trim donation type codes', () => {
      const mockResponse = {
        data: [
          { code: '  wb  ', description: 'Whole Blood' },
          { code: 'plt', description: 'Platelets' }
        ],
        success: true
      };

      service.getDonationTypes().subscribe(types => {
        expect(types[0].code).toBe('WB');
        expect(types[1].code).toBe('PLT');
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/donation-types`
      );
      req.flush(mockResponse);
    });

    it('should handle null data in donation types response', () => {
      const mockResponse = {
        data: null,
        success: true
      };

      service.getDonationTypes().subscribe(types => {
        expect(types).toEqual([]);
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/donation-types`
      );
      req.flush(mockResponse);
    });

    it('should handle empty array in donation types response', () => {
      const mockResponse = {
        data: [],
        success: true
      };

      service.getDonationTypes().subscribe(types => {
        expect(types).toEqual([]);
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/donation-types`
      );
      req.flush(mockResponse);
    });

    it('should handle null code in donation types', () => {
      const mockResponse = {
        data: [
          { code: null, description: 'Unknown' }
        ],
        success: true
      };

      service.getDonationTypes().subscribe(types => {
        expect(types.length).toBe(1);
        expect(types[0].code).toBe('');
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/donation-types`
      );
      req.flush(mockResponse);
    });
  });

  describe('getProcedureCodes - map transformation', () => {
    it('should uppercase and trim procedure codes', () => {
      const mockResponse = {
        data: [
          { code: '  wb  ', description: 'Whole Blood' },
          { code: 'plt', description: 'Platelets' }
        ],
        success: true
      };

      service.getProcedureCodes().subscribe(codes => {
        expect(codes[0].code).toBe('WB');
        expect(codes[1].code).toBe('PLT');
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/procedure-codes`
      );
      req.flush(mockResponse);
    });

    it('should handle null data in procedure codes response', () => {
      const mockResponse = {
        data: null,
        success: true
      };

      service.getProcedureCodes().subscribe(codes => {
        expect(codes).toEqual([]);
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/procedure-codes`
      );
      req.flush(mockResponse);
    });

    it('should handle empty array in procedure codes response', () => {
      const mockResponse = {
        data: [],
        success: true
      };

      service.getProcedureCodes().subscribe(codes => {
        expect(codes).toEqual([]);
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/procedure-codes`
      );
      req.flush(mockResponse);
    });

    it('should handle null code in procedure codes', () => {
      const mockResponse = {
        data: [
          { code: null, description: 'Unknown' }
        ],
        success: true
      };

      service.getProcedureCodes().subscribe(codes => {
        expect(codes.length).toBe(1);
        expect(codes[0].code).toBe('');
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/donor/change-drive/procedure-codes`
      );
      req.flush(mockResponse);
    });
  });
});
