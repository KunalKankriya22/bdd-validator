import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import moment from 'moment';

import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import { ModifyContractBatchApiService } from './modify-contract-batch-api.service';

describe('ModifyContractBatchApiService', () => {
  let service: ModifyContractBatchApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ModifyContractBatchApiService],
    });

    service = TestBed.inject(ModifyContractBatchApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('queryContractBatch', () => {
    it('should query contract batch and return response', (done) => {
      const request = {
        oldContractId: 'MDWRG0058',
        oldBatchId: '080618-RG2010',
        oldRcvdCollDate: new Date('2025-01-09'),
      };

      service.queryContractBatch(request).subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response.oldContractId).toBe('MDWRG0058');
        expect(response.units.length).toBe(1);
        expect(response.units[0].unitId).toBe('W1707180824701');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.MODIFY_CONTRACT_BATCH.QUERY}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.oldContractId).toBe('MDWRG0058');

      req.flush({
        data: [{
          oldContractId: 'MDWRG0058',
          oldBatchId: '080618-RG2010',
          oldRcvdCollDate: '2025-01-09',
          oldContractType: 'RG',
          oldProfileSetId: 'RG0058-0002',
          units: [{ unitId: 'W1707180824701', collDate: '2025-01-08', chapterId: 'MDWR', changeFlag: 'N' }],
        }],
      });
    });

    it('should handle date parsing in response', (done) => {
      const request = {
        oldContractId: 'MDWRG0058',
        oldBatchId: '080618-RG2010',
        oldRcvdCollDate: new Date('2025-01-09'),
      };

      service.queryContractBatch(request).subscribe((response) => {
        expect(response.units[0].collDate).toBeInstanceOf(Date);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.MODIFY_CONTRACT_BATCH.QUERY}`);
      req.flush({
        data: [{
          oldContractId: 'MDWRG0058',
          oldBatchId: '080618-RG2010',
          oldRcvdCollDate: '2025-01-09T00:00:00Z',
          units: [{ unitId: 'W1707180824701', collDate: '2025-01-08T00:00:00Z', chapterId: 'MDWR', changeFlag: 'N' }],
        }],
      });
    });
  });

  describe('validateContract', () => {
    it('should validate contract and return response', (done) => {
      const request = {
        newContractId: 'MDWRG0089',
        newRcvdCollDate: new Date('2025-01-09'),
        newContractType: 'RG',
        newBatchId: '080618-RG2011',
      };

      service.validateContract(request).subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response.isValid).toBeTrue();
        expect(response.profileSetId).toBe('RG0089-0001');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.MODIFY_CONTRACT_BATCH.VALIDATE}`);
      expect(req.request.method).toBe('POST');
      req.flush({
        data: [{ isValid: true, profileSetId: 'RG0089-0001', contractType: 'RG', message: 'Contract is valid' }],
      });
    });

    it('should handle invalid contract response', (done) => {
      const request = {
        newContractId: 'INVALID',
        newRcvdCollDate: new Date('2025-01-09'),
        newContractType: 'RG',
      };

      service.validateContract(request).subscribe((response) => {
        expect(response.isValid).toBeFalse();
        expect(response.message).toBe('Invalid contract type');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.MODIFY_CONTRACT_BATCH.VALIDATE}`);
      req.flush({
        data: [{ isValid: false, profileSetId: '', contractType: '', message: 'Invalid contract type' }],
      });
    });
  });

  describe('modifyContractBatch', () => {
    const baseRequest = {
      oldContractInfo: { oldContractId: 'MDWRG0058', oldBatchId: '080618-RG2010', oldRcvdCollDate: new Date('2025-01-09'), oldContractType: 'RG' },
      newContractInfo: { newContractId: 'MDWRG0089', newRcvdCollDate: new Date('2025-01-09'), newContractType: 'RG' },
      units: [{ unitId: 'W1707180824701', collDate: new Date('2025-01-08'), chapterId: 'MDWR', changeFlag: 'Y' }],
    };

    it('should modify contract batch and return response', (done) => {
      service.modifyContractBatch(baseRequest).subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response.success).toBeTrue();
        expect(response.unitsModified).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.MODIFY_CONTRACT_BATCH.MODIFY}`);
      expect(req.request.method).toBe('POST');
      req.flush({
        data: [{ success: true, message: '1 record modified', unitsModified: 1, warnings: [] }],
      });
    });


    it('should handle warnings in response', (done) => {
      service.modifyContractBatch(baseRequest).subscribe((response) => {
        expect(response.warnings.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.MODIFY_CONTRACT_BATCH.MODIFY}`);
      req.flush({
        data: [{ success: true, message: 'Partial', unitsModified: 1, warnings: ['Warning: Some units skipped'] }],
      });
    });
  });

  describe('getContractOptions', () => {
    it('should return contract options from API', (done) => {
      service.getContractOptions().subscribe((options) => {
        expect(options).toBeTruthy();
        expect(options.length).toBe(1);
        expect(options[0].contractId).toBe('MDWRG0058');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.MODIFY_CONTRACT_BATCH.CONTRACTS}`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [{ contractId: 'MDWRG0058', company: 'Part Donor', contractType: 'RG' }] });
    });
  });

  describe('getBatchOptions', () => {
    it('should return batch options from API', (done) => {
      service.getBatchOptions('MDWRG0058').subscribe((options) => {
        expect(options).toBeTruthy();
        expect(options.length).toBe(1);
        expect(options[0].batchId).toBe('080618-RG2010');
        done();
      });

      const req = httpMock.expectOne((r) => r.url.includes('batches') && r.params.get('contractId') === 'MDWRG0058');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [{ batchId: '080618-RG2010' }] });
    });
  });

  describe('getProfileSetOptions', () => {
    it('should return profile set options from API', (done) => {
      service.getProfileSetOptions('MDWRG0058').subscribe((options) => {
        expect(options).toBeTruthy();
        expect(options.length).toBe(1);
        expect(options[0].profileSetId).toBe('RG0089-0001');
        done();
      });

      const req = httpMock.expectOne((r) => r.url.includes('profile-sets') && r.params.get('contractId') === 'MDWRG0058');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [{ profileSetId: 'RG0089-0001', profileDesc: 'Primary' }] });
    });
  });

  describe('getReceivedDates', () => {
    it('should return received dates from API', (done) => {
      service.getReceivedDates('MDWRG0058').subscribe((dates) => {
        expect(dates).toBeTruthy();
        expect(dates.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne((r) => r.url.includes('received-dates') && r.params.get('contractId') === 'MDWRG0058');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [{ receivedDate: '2025-01-09' }] });
    });
  });

  describe('getContractTests', () => {
    it('should return contract test IDs from API', (done) => {
      service.getContractTests('MDWRG0058', 'RG', 'RG0058-0002').subscribe((tests) => {
        expect(tests).toBeTruthy();
        expect(tests.length).toBe(2);
        expect(tests[0]).toBe('HIV-1/2');
        done();
      });

      const req = httpMock.expectOne((r) => r.url.includes('contract-tests'));
      expect(req.request.method).toBe('GET');
      req.flush({ data: ['HIV-1/2', 'HTLV-1/11'] });
    });
  });
});
