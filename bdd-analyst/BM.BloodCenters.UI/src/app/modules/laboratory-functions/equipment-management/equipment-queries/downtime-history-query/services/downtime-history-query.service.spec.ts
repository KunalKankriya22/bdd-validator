import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DowntimeHistoryQueryService } from './downtime-history-query.service';
import { API } from '@core/constants/api.constants';

describe('DowntimeHistoryQueryService', () => {
  let service: DowntimeHistoryQueryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DowntimeHistoryQueryService],
    });
    service = TestBed.inject(DowntimeHistoryQueryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getEquipmentTypes GETs and returns data array', (done) => {
    const mockTypes = [{ code: 'T1', description: 'Type 1' }];

    service.getEquipmentTypes().subscribe(result => {
      expect(result).toEqual(mockTypes as any);
      done();
    });

    const req = httpMock.expectOne(API.DOWNTIME_HISTORY_QUERY.EQUIPMENT_TYPES);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, message: '', statusCode: 200, data: mockTypes });
  });

  it('getEquipmentIds GETs by type and transforms to dropdown format', (done) => {
    service.getEquipmentIds('CENTRIFUGE').subscribe(result => {
      expect(result).toEqual([{ code: 'E001', description: 'E001 - Ref1' }]);
      done();
    });

    const req = httpMock.expectOne(API.DOWNTIME_HISTORY_QUERY.EQUIPMENT_BY_TYPE('CENTRIFUGE'));
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true, message: '', statusCode: 200,
      data: [{ equipId: 'E001', equipReference: 'Ref1' }],
    });
  });

  it('getEquipmentReferences GETs with params and transforms to dropdown format', (done) => {
    service.getEquipmentReferences('CENTRIFUGE', 'E001').subscribe(result => {
      expect(result).toEqual([{ code: 'REF1', description: 'REF1' }]);
      done();
    });

    const req = httpMock.expectOne(
      r =>
        r.url === API.DOWNTIME_HISTORY_QUERY.EQUIPMENT_REFERENCES &&
        r.params.get('equipmentType') === 'CENTRIFUGE' &&
        r.params.get('equipmentId') === 'E001'
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true, message: '', statusCode: 200,
      data: [{ equipReference: 'REF1' }],
    });
  });

  it('getDowntimeHistory POSTs and returns successful response', (done) => {
    const params = { equipmentReference: 'REF1' } as any;
    const mockResponse = { success: true, message: 'OK', data: [{ id: 1 }], total: 1 };

    service.getDowntimeHistory(params, 100, 0).subscribe(result => {
      expect(result).toEqual(mockResponse as any);
      done();
    });

    const req = httpMock.expectOne(API.DOWNTIME_HISTORY_QUERY.GET_DOWNTIME_HISTORY(100, 0));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(params);
    req.flush(mockResponse);
  });

  it('getDowntimeHistory returns fallback for non-success response', (done) => {
    service.getDowntimeHistory({} as any).subscribe(result => {
      expect(result).toEqual({
        success: false,
        message: 'Nope',
        data: [],
        total: 0,
      } as any);
      done();
    });

    const req = httpMock.expectOne(API.DOWNTIME_HISTORY_QUERY.GET_DOWNTIME_HISTORY(1000, 0));
    req.flush({ success: false, message: 'Nope' });
  });

  it('propagates HTTP errors through handleError', (done) => {
    service.getEquipmentTypes().subscribe({
      error: err => {
        expect(err.status).toBe(500);
        done();
      },
    });

    const req = httpMock.expectOne(API.DOWNTIME_HISTORY_QUERY.EQUIPMENT_TYPES);
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
  });
});
