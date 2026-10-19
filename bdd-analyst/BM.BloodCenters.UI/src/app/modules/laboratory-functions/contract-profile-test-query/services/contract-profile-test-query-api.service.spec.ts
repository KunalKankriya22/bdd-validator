import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ContractProfileTestQueryApiService } from './contract-profile-test-query-api.service';
import { API } from '../../../../core/constants/api.constants';

describe('ContractProfileTestQueryApiService', () => {
  let service: ContractProfileTestQueryApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ContractProfileTestQueryApiService],
    });

    service = TestBed.inject(ContractProfileTestQueryApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('GET lookup methods', () => {
    it('getContractLookup should GET contracts', () => {
      const mock = { data: [{ contractId: 'C1' }], total: 1 };
      service.getContractLookup('test').subscribe((result) => expect(result).toEqual(mock as any));

      const req = httpMock.expectOne(r => r.method === 'GET' && r.url.includes('contracts'));
      req.flush(mock);
    });

    it('getProfileSetLookup should GET profile sets', () => {
      const mock = { data: [{ profileSetId: 'PS1' }], total: 1 };
      service.getProfileSetLookup('C1').subscribe((result) => expect(result).toEqual(mock as any));

      const req = httpMock.expectOne(r => r.method === 'GET' && r.url.includes('profile-sets'));
      req.flush(mock);
    });
  });

  describe('POST methods', () => {
    const cases: { method: 'validateProfileSet' | 'getContractProfileTests'; urlPart: string }[] = [
      { method: 'validateProfileSet', urlPart: 'validate-profile-set' },
      { method: 'getContractProfileTests', urlPart: 'profile-tests' },
    ];

    cases.forEach(({ method, urlPart }) => {
      it(`${method} should POST request body`, () => {
        const mock = { success: true };
        service[method]({} as any).subscribe((result) => expect(result).toEqual(mock as any));

        const req = httpMock.expectOne(r => r.method === 'POST' && r.url.includes(urlPart));
        req.flush(mock);
      });
    });
  });
});
