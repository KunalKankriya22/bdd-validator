import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InstrumentUploadLogQueryService } from './instrument-upload-log-query.service';
import { API } from '@core/constants/api.constants';

describe('InstrumentUploadLogQueryService', () => {
  let service: InstrumentUploadLogQueryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InstrumentUploadLogQueryService],
    });

    service = TestBed.inject(InstrumentUploadLogQueryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getInstrumentUploadLogs should GET with query params', () => {
    const mockResponse = { data: [], total: 0 };
    service.getInstrumentUploadLogs({ readDate: '2024-01-01' } as any).subscribe((result) => {
      expect(result).toEqual(mockResponse as any);
    });

    const req = httpMock.expectOne(r => r.url === API.INSTRUMENT_UPLOAD_LOG.QUERY);
    expect(req.request.params.get('readDate')).toBe('2024-01-01');
    req.flush(mockResponse);
  });

  it('getFilterOptions should GET with optional params', () => {
    const mockResponse = { testBatches: [], tests: [], machines: [] };
    service.getFilterOptions('2024-01-01', 'TB1').subscribe((result) => {
      expect(result).toEqual(mockResponse as any);
    });

    const req = httpMock.expectOne(r => r.url === API.INSTRUMENT_UPLOAD_LOG.FILTER_OPTIONS);
    expect(req.request.params.get('readDate')).toBe('2024-01-01');
    expect(req.request.params.get('tbId')).toBe('TB1');
    req.flush(mockResponse);
  });
});
