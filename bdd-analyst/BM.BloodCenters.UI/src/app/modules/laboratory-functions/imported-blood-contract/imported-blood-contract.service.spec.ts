import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ImportedBloodContractService } from './imported-blood-contract.service';
import { environment } from '../../../../environments/environment';
import { API } from '../../../core/constants/api.constants';
import {
  ContractSearchRequest,
  CreateContractRequest,
  UpdateContractRequest,
  BulkUpsertContractTests,
  BulkSaveContacts
} from './imported-blood-contract.model';

describe('ImportedBloodContractService', () => {
  let service: ImportedBloodContractService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ImportedBloodContractService]
    });

    service = TestBed.inject(ImportedBloodContractService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('searchContracts', () => {
    it('should POST and return data array', (done) => {
      const request = {} as ContractSearchRequest;

      service.searchContracts(request).subscribe(result => {
        expect(result).toEqual([{ contractId: 'C1' }] as any);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}${API.IMPORTED_BLOOD_CONTRACT.SEARCH}`);
      expect(req.request.method).toBe('POST');
      req.flush({ data: [{ contractId: 'C1' }] });
    });
  });

  describe('getById', () => {
    it('should GET and return item from response', (done) => {
      service.getById('C1', 'IMP').subscribe(result => {
        expect(result).toEqual({ contractId: 'C1' } as any);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}${API.IMPORTED_BLOOD_CONTRACT.GET_BY_ID('C1', 'IMP')}`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, item: { contractId: 'C1' } });
    });
  });

  describe('create', () => {
    it('should POST create request', (done) => {
      const request = { contractId: 'C1' } as CreateContractRequest;

      service.create(request).subscribe(result => {
        expect(result.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}${API.IMPORTED_BLOOD_CONTRACT.CREATE}`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });
  });

  describe('update', () => {
    it('should PUT update request', (done) => {
      const request = {} as UpdateContractRequest;

      service.update('C1', 'IMP', request).subscribe(result => {
        expect(result.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}${API.IMPORTED_BLOOD_CONTRACT.UPDATE('C1', 'IMP')}`);
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true });
    });
  });

  describe('deleteContract', () => {
    it('should DELETE by contractId and type', (done) => {
      service.deleteContract('C1', 'IMP').subscribe(result => {
        expect(result.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}${API.IMPORTED_BLOOD_CONTRACT.DELETE('C1', 'IMP')}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('contract tests sub-resource', () => {
    it('getContractTests should GET and return data array', (done) => {
      service.getContractTests('C1').subscribe(result => {
        expect(result).toEqual([{ testId: 'T1' }] as any);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}${API.IMPORTED_BLOOD_CONTRACT.TESTS.GET('C1')}`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [{ testId: 'T1' }] });
    });

    it('bulkUpsertTests should POST bulk request', (done) => {
      const request = { tests: [] } as unknown as BulkUpsertContractTests;

      service.bulkUpsertTests('C1', request).subscribe(result => {
        expect(result.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}${API.IMPORTED_BLOOD_CONTRACT.TESTS.BULK_UPSERT('C1')}`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('deleteTest should DELETE by contractId, testId, and auditKey', (done) => {
      service.deleteTest('C1', 'T1', 100).subscribe(result => {
        expect(result.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}${API.IMPORTED_BLOOD_CONTRACT.TESTS.DELETE('C1', 'T1', 100)}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('contacts sub-resource', () => {
    it('getContacts should GET and return data array', (done) => {
      service.getContacts('C1').subscribe(result => {
        expect(result).toEqual([{ contactId: 1 }] as any);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}${API.IMPORTED_BLOOD_CONTRACT.CONTACTS.GET('C1')}`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [{ contactId: 1 }] });
    });

    it('bulkSaveContacts should POST bulk request', (done) => {
      const request = { contacts: [] } as unknown as BulkSaveContacts;

      service.bulkSaveContacts('C1', request).subscribe(result => {
        expect(result.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}${API.IMPORTED_BLOOD_CONTRACT.CONTACTS.BULK_SAVE('C1')}`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('deleteContact should DELETE by contractId and contactId', (done) => {
      service.deleteContact('C1', 1).subscribe(result => {
        expect(result.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}${API.IMPORTED_BLOOD_CONTRACT.CONTACTS.DELETE('C1', 1)}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('LOV endpoints', () => {
    const lovCases: { method: string; url: string }[] = [
      { method: 'getStateCodes', url: `${apiUrl}${API.IMPORTED_BLOOD_CONTRACT.LOV.STATE_CODES}` },
      { method: 'getCountries', url: `${apiUrl}${API.INTERNATIONAL_ADDRESS.COUNTRIES}` },
      { method: 'getBarcodeProtocols', url: `${apiUrl}${API.IMPORTED_BLOOD_CONTRACT.LOV.BARCODE_PROTOCOLS}` },
      { method: 'getTests', url: `${apiUrl}${API.IMPORTED_BLOOD_CONTRACT.LOV.TESTS}` },
    ];

    lovCases.forEach(({ method, url }) => {
      it(`${method} should GET and return data array`, (done) => {
        (service as any)[method]().subscribe((result: any[]) => {
          expect(result).toEqual([{ code: 'X' }]);
          done();
        });

        const req = httpMock.expectOne(url);
        expect(req.request.method).toBe('GET');
        req.flush({ data: [{ code: 'X' }] });
      });
    });
  });
});
