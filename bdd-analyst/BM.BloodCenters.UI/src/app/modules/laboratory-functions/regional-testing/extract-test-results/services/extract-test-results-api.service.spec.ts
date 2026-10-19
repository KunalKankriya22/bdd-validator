import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ExtractTestResultsApiService } from './extract-test-results-api.service';
import { environment } from 'src/environments/environment';

describe('ExtractTestResultsApiService', () => {
  let service: ExtractTestResultsApiService;
  let httpMock: HttpTestingController;

  const BASE = `${environment.apiUrl}/api/v1/extract-test-results`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ExtractTestResultsApiService],
    });

    service = TestBed.inject(ExtractTestResultsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getActiveContracts should GET and return data array', () => {
    const mock = [{ contractId: 'C1' }];
    service.getActiveContracts().subscribe((result) => expect(result).toEqual(mock as any));

    httpMock.expectOne(`${BASE}/contracts`).flush({ data: mock });
  });

  describe('POST paginated methods', () => {
    const cases: { method: 'getBatches' | 'getUnits'; segment: string }[] = [
      { method: 'getBatches', segment: 'batches' },
      { method: 'getUnits', segment: 'units' },
    ];

    cases.forEach(({ method, segment }) => {
      it(`${method} should POST and return data with total`, () => {
        const items = [{ id: '1' }];
        service[method](10, 0, {} as any).subscribe((result) => {
          expect(result).toEqual({ data: items as any, total: 1 });
        });

        const req = httpMock.expectOne(`${BASE}/${segment}/10/0`);
        expect(req.request.method).toBe('POST');
        req.flush({ data: items, total: 1 });
      });
    });
  });

  it('createExtraction should POST and return merged response', () => {
    const item = { extractionId: 'E1' };
    service.createExtraction({} as any).subscribe((result) => {
      expect(result.message).toBe('OK');
    });

    const req = httpMock.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush({ data: [item], message: 'OK' });
  });
});
