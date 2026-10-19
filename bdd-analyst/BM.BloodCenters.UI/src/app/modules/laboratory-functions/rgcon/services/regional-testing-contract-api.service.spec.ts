import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RegionalTestingContractApiService } from './regional-testing-contract-api.service';
import { API } from '@core/constants/api.constants';

describe('RegionalTestingContractApiService', () => {
  let service: RegionalTestingContractApiService;
  let httpMock: HttpTestingController;

  const baseUrl = API.REGIONAL_TESTING_CONTRACT.BASE;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RegionalTestingContractApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(RegionalTestingContractApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAllContracts', () => {
    it('should POST query with take/skip and map response', (done: DoneFn) => {
      const query = { searchKeyword: 'test' } as any;

      service.getAllContracts(query, 10, 0).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush({ success: true, data: [{ contractId: 'C1' }], totalCount: 1 });
    });
  });

  describe('getContractById', () => {
    it('should GET and return first item or null', (done: DoneFn) => {
      service.getContractById('C1').subscribe(result => {
        expect(result).toEqual({ contractId: 'C1' } as any);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/C1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [{ contractId: 'C1' }] });
    });
  });

  describe('createContract', () => {
    it('should POST and return contractId from first data element', (done: DoneFn) => {
      const dto = { contractType: 'TS' } as any;

      service.createContract(dto).subscribe(result => {
        expect(result.contractId).toBe('NEW1');
        done();
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: [{ contractId: 'NEW1' }] });
    });
  });

  describe('updateContract', () => {
    it('should PUT and return void', (done: DoneFn) => {
      const dto = { contractType: 'TS' } as any;

      service.updateContract('C1', dto).subscribe(result => {
        expect(result).toBeUndefined();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/C1`);
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true });
    });
  });

  describe('deleteContract', () => {
    it('should DELETE and return boolean result', (done: DoneFn) => {
      service.deleteContract('C1').subscribe(result => {
        expect(result).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/C1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, data: [true] });
    });
  });
});
