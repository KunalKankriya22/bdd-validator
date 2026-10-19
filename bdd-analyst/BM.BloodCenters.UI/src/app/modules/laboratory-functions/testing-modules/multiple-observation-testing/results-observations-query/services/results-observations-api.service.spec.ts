import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ResultsObservationsApiService } from './results-observations-api.service';

describe('ResultsObservationsApiService', () => {
  let service: ResultsObservationsApiService;
  let httpMock: HttpTestingController;
  const baseUrl = '/api/v1/results-observations';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ResultsObservationsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  [
    { method: 'validateUnit', args: ['U001'], url: `${baseUrl}/validate-unit/U001`, verb: 'GET' },
    { method: 'getTestsForUnit', args: ['U001'], url: `${baseUrl}/tests-for-unit/U001`, verb: 'GET' }
  ].forEach(({ method, args, url, verb }) => {
    it(`${method} should ${verb} ${url}`, (done) => {
      const mockResp = { success: true };
      (service as any)[method](...args).subscribe((res: any) => {
        expect(res).toEqual(mockResp);
        done();
      });
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe(verb);
      req.flush(mockResp);
    });
  });

  it('getTestBatches should encode testId in URL', (done) => {
    const mockResp = { success: true, data: [] };
    service.getTestBatches('U1', 'T/1').subscribe((res) => {
      expect(res).toEqual(mockResp);
      done();
    });
    const req = httpMock.expectOne(`${baseUrl}/test-batches/U1/${encodeURIComponent('T/1')}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResp);
  });

  it('getBandDetails should build URL with all params', (done) => {
    const mockResp = { success: true };
    service.getBandDetails('U1', 'T/1', 'TB1', 5).subscribe((res) => {
      expect(res).toEqual(mockResp);
      done();
    });
    const req = httpMock.expectOne(`${baseUrl}/band-details/U1/${encodeURIComponent('T/1')}/TB1/5`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResp);
  });

  it('createNote should POST request body', (done) => {
    const body = { unitId: 'U1', noteText: 'test' } as any;
    const mockResp = { success: true, data: { noteId: 1 } };
    service.createNote(body).subscribe((res) => {
      expect(res).toEqual(mockResp);
      done();
    });
    const req = httpMock.expectOne(`${baseUrl}/notes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(mockResp);
  });

  it('updateNote should PUT to notes/{noteId}', (done) => {
    const body = { noteText: 'updated' } as any;
    const mockResp = { success: true };
    service.updateNote(42, body).subscribe((res) => {
      expect(res).toEqual(mockResp);
      done();
    });
    const req = httpMock.expectOne(`${baseUrl}/notes/42`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush(mockResp);
  });

  it('deleteNote should DELETE with query params', (done) => {
    const mockResp = { success: true };
    service.deleteNote(10, 'U1', 'T1', 'TB1', 3, 'CH1').subscribe((res) => {
      expect(res).toEqual(mockResp);
      done();
    });
    const req = httpMock.expectOne(
      (r) => r.url === `${baseUrl}/notes/10` && r.method === 'DELETE'
    );
    expect(req.request.params.get('unitId')).toBe('U1');
    expect(req.request.params.get('testId')).toBe('T1');
    expect(req.request.params.get('tbId')).toBe('TB1');
    expect(req.request.params.get('tbSeqNo')).toBe('3');
    expect(req.request.params.get('testChapterId')).toBe('CH1');
    req.flush(mockResp);
  });
});
