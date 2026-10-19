import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DonorRegistrationService } from './donor-registration.service';
import { environment } from 'src/environments/environment';
import {
  CreateRegisterDonationRequest,
  UpdateRegisterDonationRequest,
  BatchRegisterDonationRequest,
} from '../models/donor-registration.model';

describe('DonorRegistrationService', () => {
  let service: DonorRegistrationService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DonorRegistrationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('should call POST with correct URL and return data', () => {
      const mockResponse = {
        success: true,
        message: '',
        statusCode: 200,
        data: [{ transactionId: 'T1', donorId: 'D1' }],
        total: 1,
      };

      service.getAll(10, 0, { driveId: 'DRV001' }).subscribe((result) => {
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/register-donations/10/0`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ driveId: 'DRV001' });
      req.flush(mockResponse);
    });
  });
  describe('create', () => {
    it('should call POST with correct URL and body', () => {
      const request: CreateRegisterDonationRequest = {
        donorId: 'D1',
        unitId: 'U1',
        donationType: 'WB',
        driveId: 'DRV001',
      };
      const mockResponse = {
        success: true,
        message: 'Created',
        statusCode: 201,
        data: { transactionId: 'T1', donorId: 'D1' },
        total: 1,
      };

      service.create(request).subscribe((result) => {
        expect(result.success).toBeTrue();
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/register-donations`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('batchCreate', () => {
    it('should call POST /batch with correct body', () => {
      const request: BatchRegisterDonationRequest = {
        donorId: 'D1',
        firstUnitId: 'U1',
        lastUnitId: 'U1',
        donationType: 'WB',
        driveId: 'DRV001',
      };
      const mockResponse = {
        success: true,
        message: 'Created',
        statusCode: 201,
        data: [],
        total: 0,
      };

      service.batchCreate(request).subscribe((result) => {
        expect(result.success).toBeTrue();
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/register-donations/batch`
      );
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('update', () => {
    it('should call PUT with correct URL', () => {
      const request: UpdateRegisterDonationRequest = {
        transactionId: 'T1',
        unitId: 'U1',
      };
      const mockResponse = {
        success: true,
        message: 'Updated',
        statusCode: 200,
        data: { transactionId: 'T1' },
        total: 1,
      };

      service.update('T1', request).subscribe((result) => {
        expect(result.success).toBeTrue();
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/register-donations/T1`
      );
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('deleteDonation', () => {
    it('should call DELETE with correct URL', () => {
      const mockResponse = {
        success: true,
        message: 'Deleted',
        statusCode: 200,
        data: '',
        total: 0,
      };

      service.deleteDonation('T1').subscribe((result) => {
        expect(result.success).toBeTrue();
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/register-donations/T1`
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('getDrives', () => {
    it('should call GET with driveDate param', () => {
      const mockResponse = {
        success: true,
        message: '',
        statusCode: 200,
        data: [{ driveId: 'DRV001', driveDate: '2025-01-01' }],
        total: 1,
      };

      service.getDrives('2025-01-01').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].driveId).toBe('DRV001');
      });

      const req = httpMock.expectOne(
        (r) =>
          r.url.includes('register-donation-lookups/drives') &&
          r.params.get('driveDate') === '2025-01-01'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
  describe('registerHold', () => {
    it('should call POST to hold endpoint with correct body', () => {
      const request: CreateRegisterDonationRequest = {
        donorId: '',
        unitId: 'W6333',
        donationType: 'WB',
        driveId: 'DRV001',
        lastName: 'SMITH',
        firstName: 'JOHN',
        dateOfBirth: '1990-01-15',
        gender: 'M',
        sessionId: '',
      };
      const mockResponse = {
        success: true,
        message: 'Created',
        statusCode: 201,
        data: { transactionId: 'T1' },
        total: 1,
      };

      service.registerHold(request).subscribe((result) => {
        expect(result.success).toBeTrue();
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/register-donations/hold`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should propagate error on hold failure', () => {
      const request: CreateRegisterDonationRequest = {
        donorId: '',
        unitId: 'W6333',
        donationType: 'WB',
        driveId: 'DRV001',
        sessionId: '',
      };

      service.registerHold(request).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/register-donations/hold`
      );
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getByTransactionId', () => {
    it('should return data from response', () => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: { transactionId: 'T1', donorId: 'D1' }, total: 1 };
      service.getByTransactionId('T1').subscribe(result => {
        expect(result).toBeTruthy();
        expect((result as any).transactionId).toBe('T1');
      });
      const req = httpMock.expectOne(r => r.url.includes('register-donations') && r.url.includes('T1') && r.method === 'GET');
      req.flush(mockResponse);
    });
    it('should return null when no data', () => {
      service.getByTransactionId('T1').subscribe(result => { expect(result).toBeNull(); });
      const req = httpMock.expectOne(r => r.url.includes('T1') && r.method === 'GET');
      req.flush({ success: true, message: '', statusCode: 200, data: null, total: 0 });
    });
    it('should propagate error', () => {
      service.getByTransactionId('T1').subscribe({ error: err => expect(err.status).toBe(500) });
      const req = httpMock.expectOne(r => r.url.includes('T1') && r.method === 'GET');
      req.flush('err', { status: 500, statusText: 'Error' });
    });
  });

  describe('getByDonorId', () => {
    it('should return donor data array', () => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ transactionId: 'T1' }], total: 1 };
      service.getByDonorId('D1').subscribe(result => { expect(result.length).toBe(1); });
      const req = httpMock.expectOne(r => r.url.includes('D1') && r.method === 'GET');
      req.flush(mockResponse);
    });
    it('should return empty array when no data', () => {
      service.getByDonorId('D1').subscribe(result => { expect(result).toEqual([]); });
      const req = httpMock.expectOne(r => r.url.includes('D1') && r.method === 'GET');
      req.flush({ success: true, message: '', statusCode: 200, data: null, total: 0 });
    });
  });

  describe('createDonor', () => {
    it('should POST and return response', () => {
      const request = { donorId: 'D1' } as any;
      const mockResponse = { success: true, message: 'Created', statusCode: 201, data: { donorId: 'D1' }, total: 1 };
      service.createDonor(request).subscribe(result => { expect(result.success).toBeTrue(); });
      const req = httpMock.expectOne(r => r.method === 'POST' && r.url.includes('donor'));
      req.flush(mockResponse);
    });
  });

  describe('getProcedureCodes', () => {
    it('should return procedure codes', () => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ code: 'WB' }], total: 1 };
      service.getProcedureCodes().subscribe(result => { expect(result.length).toBe(1); });
      const req = httpMock.expectOne(r => r.url.includes('procedure-codes') && r.method === 'GET');
      req.flush(mockResponse);
    });
  });

  describe('getProcedureCodesByDonationType', () => {
    it('should return filtered procedure codes', () => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ code: 'WB' }], total: 1 };
      service.getProcedureCodesByDonationType('WB').subscribe(result => { expect(result.length).toBe(1); });
      const req = httpMock.expectOne(r => r.url.includes('WB') && r.method === 'GET');
      req.flush(mockResponse);
    });
  });

  describe('getVenipunctureCodes', () => {
    it('should map attribCode/attribDesc to code/description', () => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ attribCode: 'VC1', attribDesc: 'Veni 1' }], total: 1 };
      service.getVenipunctureCodes().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('VC1');
        expect(result[0].description).toBe('Veni 1');
      });
      const req = httpMock.expectOne(r => r.url.includes('venipuncture') && r.method === 'GET');
      req.flush(mockResponse);
    });
  });

  describe('getEmployees', () => {
    it('should call GET with driveDate param', () => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ employeeId: 'E1' }], total: 1 };
      service.getEmployees('2025-01-01').subscribe(result => { expect(result.length).toBe(1); });
      const req = httpMock.expectOne(r => r.url.includes('employees') && r.params.get('driveDate') === '2025-01-01');
      req.flush(mockResponse);
    });
  });

  describe('getInterdictionCodes', () => {
    it('should return interdiction codes', () => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ code: 'IC1' }], total: 1 };
      service.getInterdictionCodes().subscribe(result => { expect(result.length).toBe(1); });
      const req = httpMock.expectOne(r => r.url.includes('interdiction') && r.method === 'GET');
      req.flush(mockResponse);
    });
  });

  describe('getDonationTypes', () => {
    it('should return donation types', () => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ type: 'WB' }], total: 1 };
      service.getDonationTypes().subscribe(result => { expect(result.length).toBe(1); });
      const req = httpMock.expectOne(r => r.url.includes('donation-type') && r.method === 'GET');
      req.flush(mockResponse);
    });
  });

  describe('getSponsors', () => {
    it('should call GET with searchKeyword param', () => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ id: 'S1' }], total: 1 };
      service.getSponsors('test').subscribe(result => { expect(result.length).toBe(1); });
      const req = httpMock.expectOne(r => r.url.includes('sponsor') && r.params.get('searchKeyword') === 'test');
      req.flush(mockResponse);
    });
  });

  describe('getEmployers', () => {
    it('should return employers', () => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ id: 'EM1' }], total: 1 };
      service.getEmployers('search').subscribe(result => { expect(result.length).toBe(1); });
      const req = httpMock.expectOne(r => r.url.includes('employer') && r.method === 'GET');
      req.flush(mockResponse);
    });
  });

  describe('getCityState', () => {
    it('should pass zip and city params', () => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [{ city: 'Dallas' }], total: 1 };
      service.getCityState({ zip: '75001', city: 'Dallas' }).subscribe(result => { expect(result.length).toBe(1); });
      const req = httpMock.expectOne(r => r.url.includes('city') && r.params.get('zip') === '75001' && r.params.get('city') === 'Dallas');
      req.flush(mockResponse);
    });
    it('should handle zip only', () => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [], total: 0 };
      service.getCityState({ zip: '75001' }).subscribe(result => { expect(result).toEqual([]); });
      const req = httpMock.expectOne(r => r.params.get('zip') === '75001' && !r.params.has('city'));
      req.flush(mockResponse);
    });
  });

  describe('getDeferralReasons', () => {
    it('should filter out invalid reason codes', () => {
      const mockResponse = {
        success: true, message: '', statusCode: 200,
        data: [
          { reasonCode: '0', description: 'None' },
          { reasonCode: 'A1,', description: 'Bad' },
          { reasonCode: 'A1', description: 'Valid' }
        ], total: 3
      };
      service.getDeferralReasons('WB', '2025-01-01').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].reasonCode).toBe('A1');
      });
      const req = httpMock.expectOne(r => r.url.includes('deferral') && r.method === 'GET');
      req.flush(mockResponse);
    });
  });

  describe('validateUnitId', () => {
    it('should POST and return response', () => {
      const mockResponse = { success: true, data: { parsedUnitId: 'U1' } };
      service.validateUnitId('U1', 'N').subscribe(result => { expect(result.success).toBeTrue(); });
      const req = httpMock.expectOne(r => r.method === 'POST' && r.url.includes('validate'));
      expect(req.request.body).toEqual({ unitId: 'U1', validateFfValue: 'N' });
      req.flush(mockResponse);
    });
  });

  describe('checkExistingUnitId', () => {
    it('should return true when item exists', () => {
      service.checkExistingUnitId('U1').subscribe(result => { expect(result).toBeTrue(); });
      const req = httpMock.expectOne(r => r.url.includes('U1') && r.method === 'GET');
      req.flush({ success: true, message: '', statusCode: 200, data: true, total: 0, item: true });
    });
    it('should return false on error', () => {
      service.checkExistingUnitId('U1').subscribe(result => { expect(result).toBeFalse(); });
      const req = httpMock.expectOne(r => r.url.includes('U1') && r.method === 'GET');
      req.flush('err', { status: 500, statusText: 'Error' });
    });
  });

  describe('validateStaff', () => {
    it('should call GET and return result', () => {
      const mockResult = { valid: true, message: '' };
      service.validateStaff('S1', '2025-01-01').subscribe(result => { expect(result).toEqual(mockResult); });
      const req = httpMock.expectOne(r => r.url.includes('S1') && r.method === 'GET');
      req.flush(mockResult);
    });
  });

  describe('validateEquipmentType', () => {
    it('should call GET and return result', () => {
      const mockResult = { valid: true, message: '' };
      service.validateEquipmentType('EQ1').subscribe(result => { expect(result).toEqual(mockResult); });
      const req = httpMock.expectOne(r => r.url.includes('EQ1') && r.method === 'GET');
      req.flush(mockResult);
    });
  });

  describe('validateEthnicGroup', () => {
    it('should call GET and return result', () => {
      const mockResult = { valid: true, message: '' };
      service.validateEthnicGroup('EG1').subscribe(result => { expect(result).toEqual(mockResult); });
      const req = httpMock.expectOne(r => r.url.includes('EG1') && r.method === 'GET');
      req.flush(mockResult);
    });
  });

  describe('validateAlternateIdType', () => {
    it('should call GET and return result', () => {
      const mockResult = { valid: true, message: '' };
      service.validateAlternateIdType('ALT1').subscribe(result => { expect(result).toEqual(mockResult); });
      const req = httpMock.expectOne(r => r.url.includes('ALT1') && r.method === 'GET');
      req.flush(mockResult);
    });
  });

  describe('validateCity', () => {
    it('should call GET and return result', () => {
      const mockResult = { valid: true, message: '' };
      service.validateCity('Dallas').subscribe(result => { expect(result).toEqual(mockResult); });
      const req = httpMock.expectOne(r => r.url.includes('Dallas') && r.method === 'GET');
      req.flush(mockResult);
    });
  });

  describe('validateZipCity', () => {
    it('should call GET and return result', () => {
      const mockResult = { valid: true, message: '' };
      service.validateZipCity('Dallas', '75001').subscribe(result => { expect(result).toEqual(mockResult); });
      const req = httpMock.expectOne(r => r.method === 'GET' && r.url.includes('Dallas'));
      req.flush(mockResult);
    });
  });

  describe('getDonor', () => {
    it('should return donor demographics', () => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: { donorId: 'D1', name: 'Test' }, total: 1 };
      service.getDonor('D1').subscribe(result => { expect((result as any).donorId).toBe('D1'); });
      const req = httpMock.expectOne(r => r.url.includes('D1') && r.method === 'GET');
      req.flush(mockResponse);
    });
  });

  describe('getDonorAddress', () => {
    it('should return donor address', () => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: { address1: '123 Main' }, total: 1 };
      service.getDonorAddress('D1').subscribe(result => { expect((result as any).address1).toBe('123 Main'); });
      const req = httpMock.expectOne(r => r.url.includes('D1') && r.method === 'GET');
      req.flush(mockResponse);
    });
  });

  describe('getAll edge cases', () => {
    it('should use empty body when no query provided', () => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: null, total: 0 };
      service.getAll(10, 0).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
      });
      const req = httpMock.expectOne(r => r.method === 'POST' && r.url.includes('register-donations'));
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });
});
