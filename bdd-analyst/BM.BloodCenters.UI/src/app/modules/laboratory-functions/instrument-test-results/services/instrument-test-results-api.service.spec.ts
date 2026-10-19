import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { InstrumentTestResultsApiService } from './instrument-test-results-api.service';
import { ApiService } from '@shared/services/api.service';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  ValidInstrumentTestScheduleDto,
  CreateValidInstrumentTestScheduleRequestDto,
  UpdateValidInstrumentTestScheduleRequestDto,
  InstrumentLookupDto,
  InstrumentTestLookupDto,
  InstrumentResultDto,
  InstrumentResultQueryDto,
  CreateInstrumentResultDto,
  UpdateInstrumentResultDto,
  ResultStatusDropdownDto,
  MachineLookupDto,
  TestDropdownDto,
  InstrumentTestDetailDto,
} from '../models/instrument-test-results.model';

const LIST_URL = '/api/v1/valid-instrument-test-schedules';
const CREATE_URL = '/api/v1/valid-instrument-test-schedules/create';
const UPDATE_URL = (machineId: string, chapterId: string, machineTestId: string) =>
  `/api/v1/valid-instrument-test-schedules/${encodeURIComponent(machineId)}/${encodeURIComponent(chapterId)}/${encodeURIComponent(machineTestId)}`;
const INSTRUMENTS_URL = '/api/v1/valid-instrument-test-schedules/instruments';
const INSTRUMENT_TESTS_URL = (instrumentId: string) =>
  `/api/v1/valid-instrument-test-schedules/instrument-tests/${encodeURIComponent(instrumentId)}`;
const ALL_INSTRUMENT_TESTS_URL = (instrumentId: string) =>
  `/api/v1/valid-instrument-test-schedules/all-instrument-tests/${encodeURIComponent(instrumentId)}`;
const LIFETRACK_TESTS_URL = '/api/v1/valid-instrument-test-schedules/lifetrack-tests';

const makeSchedule = (overrides: Partial<ValidInstrumentTestScheduleDto> = {}): ValidInstrumentTestScheduleDto => ({
  machineId: 'AX200',
  chapterId: 'CH01',
  machineTestId: 'HIVAB',
  effDate: '2020-01-01',
  termDate: null,
  ...overrides,
});

describe('InstrumentTestResultsApiService', () => {
  let service: InstrumentTestResultsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService, InstrumentTestResultsApiService],
    });
    service = TestBed.inject(InstrumentTestResultsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('should return all non-terminated schedules by default', (done) => {
      const mockData: ValidInstrumentTestScheduleDto[] = [
        makeSchedule({ machineTestId: 'HIVAB' }),
        makeSchedule({ machineTestId: 'HCV' }),
      ];

      service.getAll(25, 0).subscribe(({ data, totalCount }) => {
        expect(data.length).toBe(2);
        expect(data.every((r) => !r.termDate)).toBeTrue();
        expect(totalCount).toBe(2);
        done();
      });

      const req = httpMock.expectOne((r) => r.url === LIST_URL && r.method === 'POST');
      expect(req.request.params.get('take')).toBe('25');
      expect(req.request.params.get('skip')).toBe('0');
      req.flush({ data: mockData, totalCount: 2 });
    });

    it('should include terminated records when includeTerminated is true', (done) => {
      const mockData: ValidInstrumentTestScheduleDto[] = [
        makeSchedule({ machineTestId: 'HIVAB' }),
        makeSchedule({ machineTestId: 'OLD', termDate: '2021-01-01' }),
      ];

      service.getAll(25, 0, { includeTerminated: true }).subscribe(({ data }) => {
        expect(data.some((r) => !!r.termDate)).toBeTrue();
        done();
      });

      const req = httpMock.expectOne((r) => r.url === LIST_URL && r.method === 'POST');
      expect(req.request.body).toEqual({ includeTerminated: true });
      req.flush({ data: mockData, totalCount: 2 });
    });

    it('should filter by instrumentId', (done) => {
      const mockData: ValidInstrumentTestScheduleDto[] = [
        makeSchedule({ machineId: 'AX200', machineTestId: 'HIVAB' }),
      ];

      service.getAll(25, 0, { instrumentId: 'AX200', includeTerminated: true }).subscribe(({ data }) => {
        expect(data.every((r) => r.machineId === 'AX200')).toBeTrue();
        done();
      });

      const req = httpMock.expectOne((r) => r.url === LIST_URL && r.method === 'POST');
      expect(req.request.body).toEqual({ instrumentId: 'AX200', includeTerminated: true });
      req.flush({ data: mockData, totalCount: 1 });
    });

    it('should filter by machineTestId substring', (done) => {
      const mockData: ValidInstrumentTestScheduleDto[] = [
        makeSchedule({ machineTestId: 'HIVAB' }),
      ];

      service.getAll(25, 0, { machineTestId: 'HIV', includeTerminated: true }).subscribe(({ data }) => {
        expect(data.every((r) => r.machineTestId.toLowerCase().includes('hiv'))).toBeTrue();
        done();
      });

      const req = httpMock.expectOne((r) => r.url === LIST_URL && r.method === 'POST');
      expect(req.request.body).toEqual({ machineTestId: 'HIV', includeTerminated: true });
      req.flush({ data: mockData, totalCount: 1 });
    });

    it('should apply pagination (skip)', (done) => {
      const page2Data: ValidInstrumentTestScheduleDto[] = [makeSchedule({ machineTestId: 'HCV' })];

      service.getAll(1, 1, { includeTerminated: true }).subscribe(({ data }) => {
        expect(data.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne((r) => r.url === LIST_URL && r.method === 'POST');
      expect(req.request.params.get('take')).toBe('1');
      expect(req.request.params.get('skip')).toBe('1');
      req.flush({ data: page2Data, totalCount: 5 });
    });


    it('should set SKIP_ERROR_TOAST for 404 to suppress snackbar', () => {
      service.getAll(25, 0).subscribe();

      const req = httpMock.expectOne((r) => r.url === LIST_URL && r.method === 'POST');
      const skipToast = req.request.context.get(SKIP_ERROR_TOAST);
      expect(skipToast).toEqual([404]);
      req.flush({ data: [], totalCount: 0 });
    });

    it('should return empty result on 404 error', (done) => {
      service.getAll(25, 0).subscribe(({ data, totalCount }) => {
        expect(data).toEqual([]);
        expect(totalCount).toBe(0);
        done();
      });

      const req = httpMock.expectOne((r) => r.url === LIST_URL && r.method === 'POST');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should re-throw non-404 errors', (done) => {
      service.getAll(25, 0).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url === LIST_URL && r.method === 'POST');
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });

    it('should fall back to res.total when totalCount is undefined', (done) => {
      service.getAll(25, 0).subscribe(({ totalCount }) => {
        expect(totalCount).toBe(42);
        done();
      });

      const req = httpMock.expectOne((r) => r.url === LIST_URL && r.method === 'POST');
      req.flush({ data: [makeSchedule()], total: 42 });
    });

    it('should fall back to data.length when both totalCount and total are undefined', (done) => {
      const mockData = [makeSchedule(), makeSchedule({ machineTestId: 'HCV' })];
      service.getAll(25, 0).subscribe(({ totalCount }) => {
        expect(totalCount).toBe(2);
        done();
      });

      const req = httpMock.expectOne((r) => r.url === LIST_URL && r.method === 'POST');
      req.flush({ data: mockData });
    });
  });

  describe('create', () => {
    it('should POST to create URL and return the created record', (done) => {
      const dto: CreateValidInstrumentTestScheduleRequestDto = {
        machineId: 'AX200', chapterId: 'CH01', machineTestId: 'SPEC_TEST', effDate: '2026-07-01',
      };
      const mockResult = makeSchedule({ machineTestId: 'SPEC_TEST' });

      service.create(dto).subscribe((result) => {
        expect(result.machineTestId).toBe('SPEC_TEST');
        expect(result.machineId).toBe('AX200');
        done();
      });

      const req = httpMock.expectOne((r) => r.url === CREATE_URL && r.method === 'POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ data: mockResult });
    });
  });

  describe('update', () => {
    it('should PUT to update URL and return the merged record', (done) => {
      const dto: UpdateValidInstrumentTestScheduleRequestDto = {
        testId1: 'NEWTEST', testId1Res: 'REAC',
      };
      const mockResult = makeSchedule({ testId1: 'NEWTEST', testId1Res: 'REAC' });

      service.update('AX200', 'CH01', 'HIVAB', dto).subscribe((result) => {
        expect(result.testId1).toBe('NEWTEST');
        expect(result.testId1Res).toBe('REAC');
        expect(result.machineId).toBe('AX200');
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url === UPDATE_URL('AX200', 'CH01', 'HIVAB') && r.method === 'PUT'
      );
      expect(req.request.body).toEqual(dto);
      req.flush({ data: mockResult });
    });
  });

  describe('getInstruments', () => {
    it('should GET instruments and return the list', (done) => {
      const mockList: InstrumentLookupDto[] = [
        { code: 'AX200', codeDesc: 'Analyzer 200' },
        { code: 'BX100', codeDesc: 'Bioplex 100' },
      ];

      service.getInstruments('CH01').subscribe((list) => {
        expect(list.length).toBeGreaterThan(0);
        expect(list[0].code).toBeTruthy();
        expect(list[0].codeDesc).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne((r) => r.url === INSTRUMENTS_URL && r.method === 'GET');
      expect(req.request.params.get('chapterId')).toBe('CH01');
      req.flush({ data: mockList });
    });
  });

  describe('getInstrumentTests', () => {
    it('should GET tests for a given instrument', (done) => {
      const mockList: InstrumentTestLookupDto[] = [
        { machineTestId: 'HIVAB' },
      ];

      service.getInstrumentTests('AX200', 'CH01').subscribe((list) => {
        expect(list.length).toBeGreaterThan(0);
        expect(list[0].machineTestId).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url === INSTRUMENT_TESTS_URL('AX200') && r.method === 'GET'
      );
      expect(req.request.params.get('chapterId')).toBe('CH01');
      req.flush({ data: mockList });
    });

    it('should return empty array for unknown instrument', (done) => {
      service.getInstrumentTests('UNKNOWN', 'CH01').subscribe((list) => {
        expect(list).toEqual([]);
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url === INSTRUMENT_TESTS_URL('UNKNOWN') && r.method === 'GET'
      );
      req.flush({ data: [] });
    });
  });

  // ── Instrument Results (VINTSTRS) ─────────────────────────────────────────

  const BASE_RESULT_URL = '/api/v1/instrument-test-results';
  const RESULT_BY_ID_URL = (ch: string, m: string, t: string, rs: string) =>
    `${BASE_RESULT_URL}/${encodeURIComponent(ch)}/${encodeURIComponent(m)}/${encodeURIComponent(t)}/${encodeURIComponent(rs)}`;
  const MACHINES_DROPDOWN_URL = `${BASE_RESULT_URL}/machines/dropdown`;
  const TESTS_DROPDOWN_URL = (machineId: string) =>
    `${BASE_RESULT_URL}/tests/dropdown/${encodeURIComponent(machineId)}`;
  const RESULT_STATUSES_DROPDOWN_URL = (testId: string) =>
    `${BASE_RESULT_URL}/result-statuses/dropdown/${encodeURIComponent(testId)}`;

  const mockResult: InstrumentResultDto = {
    chapterId: 'CH01', machineId: 'M01', testId: 'ABORH',
    resultStatus: 'POS', machineResultStatus: 'A+',
    effDate: '2025-01-01', termDate: null,
  };

  describe('getInstrumentResults', () => {
    it('should POST to paginated URL with query body', (done) => {
      const query: InstrumentResultQueryDto = { chapterId: 'CH01', machineId: 'M01', testId: 'ABORH' };
      service.getInstrumentResults(25, 0, query).subscribe(({ data, totalCount }) => {
        expect(data.length).toBe(1);
        expect(totalCount).toBe(1);
        done();
      });

      const req = httpMock.expectOne((r) => r.url === `${BASE_RESULT_URL}/25/0` && r.method === 'POST');
      expect(req.request.body).toEqual(query);
      req.flush({ data: [mockResult], totalCount: 1 });
    });


    it('should set SKIP_ERROR_TOAST for 404 to suppress snackbar', () => {
      const query: InstrumentResultQueryDto = { chapterId: 'CH01', machineId: 'M01', testId: 'ABORH' };
      service.getInstrumentResults(25, 0, query).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${BASE_RESULT_URL}/25/0` && r.method === 'POST');
      const skipToast = req.request.context.get(SKIP_ERROR_TOAST);
      expect(skipToast).toEqual([404]);
      req.flush({ data: [], totalCount: 0 });
    });

    it('should use totalCount from response when provided', (done) => {
      service.getInstrumentResults(10, 10, {}).subscribe(({ totalCount }) => {
        expect(totalCount).toBe(100);
        done();
      });

      const req = httpMock.expectOne((r) => r.url === `${BASE_RESULT_URL}/10/10` && r.method === 'POST');
      req.flush({ data: [mockResult], totalCount: 100 });
    });

    it('should return empty result on 404 error', (done) => {
      service.getInstrumentResults(25, 0, {}).subscribe(({ data, totalCount }) => {
        expect(data).toEqual([]);
        expect(totalCount).toBe(0);
        done();
      });

      const req = httpMock.expectOne((r) => r.url === `${BASE_RESULT_URL}/25/0` && r.method === 'POST');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should re-throw non-404 errors', (done) => {
      service.getInstrumentResults(25, 0, {}).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url === `${BASE_RESULT_URL}/25/0` && r.method === 'POST');
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });

    it('should fall back to res.total when totalCount is undefined', (done) => {
      service.getInstrumentResults(25, 0, {}).subscribe(({ totalCount }) => {
        expect(totalCount).toBe(55);
        done();
      });

      const req = httpMock.expectOne((r) => r.url === `${BASE_RESULT_URL}/25/0` && r.method === 'POST');
      req.flush({ data: [mockResult], total: 55 });
    });

    it('should fall back to data.length when both totalCount and total are undefined', (done) => {
      service.getInstrumentResults(25, 0, {}).subscribe(({ totalCount }) => {
        expect(totalCount).toBe(1);
        done();
      });

      const req = httpMock.expectOne((r) => r.url === `${BASE_RESULT_URL}/25/0` && r.method === 'POST');
      req.flush({ data: [mockResult] });
    });
  });

  describe('getMachinesDropdown', () => {
    it('should GET machines dropdown with chapterId param', (done) => {
      const mockMachines: MachineLookupDto[] = [
        { machineId: 'M01', machineDesc: 'Machine One' },
      ];

      service.getMachinesDropdown('CH01').subscribe((list) => {
        expect(list.length).toBe(1);
        expect(list[0].machineId).toBe('M01');
        done();
      });

      const req = httpMock.expectOne((r) => r.url === MACHINES_DROPDOWN_URL && r.method === 'GET');
      expect(req.request.params.get('chapterId')).toBe('CH01');
      req.flush(mockMachines);
    });
  });
  describe('getResultStatusesDropdown', () => {
    it('should GET result statuses for a given testId and chapterId', (done) => {
      const mockStatuses: ResultStatusDropdownDto[] = [
        { resultStatus: 'POS', resultDesc: 'Positive' },
        { resultStatus: 'NEG', resultDesc: 'Negative' },
      ];

      service.getResultStatusesDropdown('ABORH', 'CH01').subscribe((list) => {
        expect(list.length).toBe(2);
        expect(list[0].resultStatus).toBe('POS');
        done();
      });

      const req = httpMock.expectOne(
        (r) => r.url === RESULT_STATUSES_DROPDOWN_URL('ABORH') && r.method === 'GET'
      );
      expect(req.request.params.get('chapterId')).toBe('CH01');
      req.flush(mockStatuses);
    });
  });
  describe('createInstrumentResult', () => {
    it('should POST to base URL and return the created record', (done) => {
      const dto: CreateInstrumentResultDto = {
        chapterId: 'CH01', machineId: 'M01', testId: 'ABORH',
        resultStatus: 'POS', machineResultStatus: 'A+', effDate: '2026-01-01',
      };

      service.createInstrumentResult(dto).subscribe((result) => {
        expect(result.resultStatus).toBe('POS');
        done();
      });

      const req = httpMock.expectOne((r) => r.url === BASE_RESULT_URL && r.method === 'POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ data: mockResult });
    });
  });

  describe('updateInstrumentResult', () => {
    it('should PUT to composite key URL and return the updated record', (done) => {
      const dto: UpdateInstrumentResultDto = { machineResultStatus: 'B+', effDate: '2026-02-01' };

      service.updateInstrumentResult('CH01', 'M01', 'ABORH', 'POS', dto).subscribe((result) => {
        expect(result.machineId).toBe('M01');
        done();
      });

      const req = httpMock.expectOne(
        (r) => r.url === RESULT_BY_ID_URL('CH01', 'M01', 'ABORH', 'POS') && r.method === 'PUT'
      );
      expect(req.request.body).toEqual(dto);
      req.flush({ data: mockResult });
    });
  });

  describe('deleteInstrumentResult', () => {
    it('should DELETE to composite key URL', (done) => {
      service.deleteInstrumentResult('CH01', 'M01', 'ABORH', 'POS').subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(
        (r) => r.url === RESULT_BY_ID_URL('CH01', 'M01', 'ABORH', 'POS') && r.method === 'DELETE'
      );
      req.flush({ data: null });
    });
  });

  // ── getAllInstrumentTests (VALID_INSTRUMENT_TESTS) ──────────────────────────

  describe('getAllInstrumentTests', () => {
    it('should GET all instrument tests with chapterId param and SKIP_ERROR_TOAST', (done) => {
      const mockTests: Partial<InstrumentTestDetailDto>[] = [
        { chapterId: 'CH01', machineId: 'AX200', testId: 'HIVAB', testDesc: 'HIV Antibody' },
      ];

      service.getAllInstrumentTests('AX200', 'CH01').subscribe(({ data, totalCount }) => {
        expect(data.length).toBe(1);
        expect(totalCount).toBe(1);
        done();
      });

      const req = httpMock.expectOne(
        (r) => r.url === ALL_INSTRUMENT_TESTS_URL('AX200') && r.method === 'GET'
      );
      expect(req.request.params.get('chapterId')).toBe('CH01');
      const skipToast = req.request.context.get(SKIP_ERROR_TOAST);
      expect(skipToast).toEqual([404]);
      req.flush({ data: mockTests, totalCount: 1 });
    });

    it('should return empty result on 404 error', (done) => {
      service.getAllInstrumentTests('UNKNOWN', 'CH01').subscribe(({ data, totalCount }) => {
        expect(data).toEqual([]);
        expect(totalCount).toBe(0);
        done();
      });

      const req = httpMock.expectOne(
        (r) => r.url === ALL_INSTRUMENT_TESTS_URL('UNKNOWN') && r.method === 'GET'
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should re-throw non-404 errors', (done) => {
      service.getAllInstrumentTests('AX200', 'CH01').subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(
        (r) => r.url === ALL_INSTRUMENT_TESTS_URL('AX200') && r.method === 'GET'
      );
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });

    it('should fall back to res.total when totalCount is undefined', (done) => {
      service.getAllInstrumentTests('AX200', 'CH01').subscribe(({ totalCount }) => {
        expect(totalCount).toBe(10);
        done();
      });

      const req = httpMock.expectOne(
        (r) => r.url === ALL_INSTRUMENT_TESTS_URL('AX200') && r.method === 'GET'
      );
      req.flush({ data: [{ chapterId: 'CH01', machineId: 'AX200', testId: 'HIVAB' }], total: 10 });
    });

    it('should fall back to data.length when both totalCount and total are undefined', (done) => {
      const mockTests = [
        { chapterId: 'CH01', machineId: 'AX200', testId: 'HIVAB' },
        { chapterId: 'CH01', machineId: 'AX200', testId: 'HCV' },
      ];
      service.getAllInstrumentTests('AX200', 'CH01').subscribe(({ totalCount }) => {
        expect(totalCount).toBe(2);
        done();
      });

      const req = httpMock.expectOne(
        (r) => r.url === ALL_INSTRUMENT_TESTS_URL('AX200') && r.method === 'GET'
      );
      req.flush({ data: mockTests });
    });
  });

  // ── getTestsDropdown ────────────────────────────────────────────────────────

  describe('getTestsDropdown', () => {
    it('should GET tests dropdown for a given machineId', (done) => {
      const mockTests: TestDropdownDto[] = [
        { testId: 'ABORH', testDesc: 'ABO/RH' },
      ];

      service.getTestsDropdown('M01').subscribe((list) => {
        expect(list.length).toBe(1);
        expect(list[0].testId).toBe('ABORH');
        done();
      });

      const req = httpMock.expectOne(
        (r) => r.url === TESTS_DROPDOWN_URL('M01') && r.method === 'GET'
      );
      req.flush(mockTests);
    });
  });

  // ── getInstrumentResultById ─────────────────────────────────────────────────

  describe('getInstrumentResultById', () => {
    it('should GET a single result by composite key', (done) => {
      service.getInstrumentResultById('CH01', 'M01', 'ABORH', 'POS').subscribe((result) => {
        expect(result.chapterId).toBe('CH01');
        expect(result.machineId).toBe('M01');
        expect(result.testId).toBe('ABORH');
        expect(result.resultStatus).toBe('POS');
        done();
      });

      const req = httpMock.expectOne(
        (r) => r.url === RESULT_BY_ID_URL('CH01', 'M01', 'ABORH', 'POS') && r.method === 'GET'
      );
      req.flush({ data: mockResult });
    });
  });

  // ── getValidTests (LIFETRACK_TESTS) ─────────────────────────────────────────

  describe('getValidTests', () => {
    it('should GET valid tests with chapterId param', (done) => {
      const mockTests: TestDropdownDto[] = [
        { testId: 'ABORH', testDesc: 'ABO/RH' },
        { testId: 'HIVAB', testDesc: 'HIV Antibody' },
      ];

      service.getValidTests('CH01').subscribe((list) => {
        expect(list.length).toBe(2);
        expect(list[0].testId).toBe('ABORH');
        done();
      });

      const req = httpMock.expectOne(
        (r) => r.url === LIFETRACK_TESTS_URL && r.method === 'GET'
      );
      expect(req.request.params.get('chapterId')).toBe('CH01');
      req.flush({ data: mockTests });
    });

    it('should return empty array when data is null', (done) => {
      service.getValidTests('CH01').subscribe((list) => {
        expect(list).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        (r) => r.url === LIFETRACK_TESTS_URL && r.method === 'GET'
      );
      req.flush({ data: null });
    });
  });

});
