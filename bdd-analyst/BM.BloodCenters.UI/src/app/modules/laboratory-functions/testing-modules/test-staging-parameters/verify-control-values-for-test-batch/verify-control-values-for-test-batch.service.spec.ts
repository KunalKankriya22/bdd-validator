import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VerifyControlValuesForTestBatchService } from './verify-control-values-for-test-batch.service';
import { API } from '@core/constants/api.constants';
import { TestBatchParmVerifyDto } from './verify-control-values-for-test-batch.model';

describe('VerifyControlValuesForTestBatchService', () => {
  let service: VerifyControlValuesForTestBatchService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VerifyControlValuesForTestBatchService]
    });

    service = TestBed.inject(VerifyControlValuesForTestBatchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── getPendingBatches ──────────────────────────────────────────────

  describe('getPendingBatches', () => {
    it('should GET pending batches with default techMode "0"', async () => {
      const mockResponse = { success: true, data: [{ tbId: 'TB1', testName: 'ABO', unitCount: 5 }] };

      const promise = service.getPendingBatches();

      const req = httpMock.expectOne(r => r.url === API.TEST_BATCH_PARM.GET_PENDING_BATCHES);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('techMode')).toBe('0');
      req.flush(mockResponse);

      const result = await promise;
      expect(result.length).toBe(1);
      expect(result[0].tbId).toBe('TB1');
    });

    it('should GET pending batches with custom techMode', async () => {
      const mockResponse = { success: true, data: [{ tbId: 'TB2' }] };

      const promise = service.getPendingBatches('1');

      const req = httpMock.expectOne(r => r.url === API.TEST_BATCH_PARM.GET_PENDING_BATCHES);
      expect(req.request.params.get('techMode')).toBe('1');
      req.flush(mockResponse);

      const result = await promise;
      expect(result.length).toBe(1);
    });

    it('should return empty array when data is null', async () => {
      const promise = service.getPendingBatches();

      const req = httpMock.expectOne(r => r.url === API.TEST_BATCH_PARM.GET_PENDING_BATCHES);
      req.flush({ success: true, data: null });

      const result = await promise;
      expect(result).toEqual([]);
    });
  });

  // ── getBatchTests ──────────────────────────────────────────────────

  describe('getBatchTests', () => {
    const tbId = 'TB100';

    it('should GET batch tests with default techMode "0"', async () => {
      const mockResponse = { success: true, data: [{ testId: 'T1', testName: 'ABO' }] };

      const promise = service.getBatchTests(tbId);

      const req = httpMock.expectOne(r => r.url === API.TEST_BATCH_PARM.GET_BATCH_TESTS(tbId));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('techMode')).toBe('0');
      req.flush(mockResponse);

      const result = await promise;
      expect(result.length).toBe(1);
      expect(result[0].testId).toBe('T1');
    });

    it('should GET batch tests with custom techMode', async () => {
      const mockResponse = { success: true, data: [{ testId: 'T2' }] };

      const promise = service.getBatchTests(tbId, '2');

      const req = httpMock.expectOne(r => r.url === API.TEST_BATCH_PARM.GET_BATCH_TESTS(tbId));
      expect(req.request.params.get('techMode')).toBe('2');
      req.flush(mockResponse);

      const result = await promise;
      expect(result.length).toBe(1);
    });

    it('should return empty array when data is null', async () => {
      const promise = service.getBatchTests(tbId);

      const req = httpMock.expectOne(r => r.url === API.TEST_BATCH_PARM.GET_BATCH_TESTS(tbId));
      req.flush({ success: true, data: null });

      const result = await promise;
      expect(result).toEqual([]);
    });
  });

  // ── getTestRuns ────────────────────────────────────────────────────

  describe('getTestRuns', () => {
    const testId = 'TST01';

    it('should GET test runs with testId only', async () => {
      const mockResponse = { success: true, data: [{ runId: 'R1', insertDate: '2025-01-01' }] };

      const promise = service.getTestRuns(testId);

      const req = httpMock.expectOne(r => r.url === API.TEST_BATCH_PARM.GET_TEST_RUNS);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('testId')).toBe(testId);
      expect(req.request.params.has('parmType')).toBeFalse();
      req.flush(mockResponse);

      const result = await promise;
      expect(result.length).toBe(1);
      expect(result[0].runId).toBe('R1');
    });

    it('should include parmType when provided', async () => {
      const mockResponse = { success: true, data: [{ runId: 'R2' }] };

      const promise = service.getTestRuns(testId, 'MAN');

      const req = httpMock.expectOne(r => r.url === API.TEST_BATCH_PARM.GET_TEST_RUNS);
      expect(req.request.params.get('testId')).toBe(testId);
      expect(req.request.params.get('parmType')).toBe('MAN');
      req.flush(mockResponse);

      const result = await promise;
      expect(result.length).toBe(1);
    });

    it('should return empty array when data is null', async () => {
      const promise = service.getTestRuns(testId);

      const req = httpMock.expectOne(r => r.url === API.TEST_BATCH_PARM.GET_TEST_RUNS);
      req.flush({ success: true, data: null });

      const result = await promise;
      expect(result).toEqual([]);
    });
  });

  // ── getTestKits ────────────────────────────────────────────────────

  describe('getTestKits', () => {
    const testId = 'TST01';

    it('should GET test kits with testId only', async () => {
      const mockResponse = { success: true, data: [{ testKitId: 'KIT1', kitLotNumber: 'LOT1' }] };

      const promise = service.getTestKits(testId);

      const req = httpMock.expectOne(r => r.url === API.TEST_BATCH_PARM.GET_TEST_KITS);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('testId')).toBe(testId);
      expect(req.request.params.has('kitLotNumber')).toBeFalse();
      req.flush(mockResponse);

      const result = await promise;
      expect(result.length).toBe(1);
      expect(result[0].testKitId).toBe('KIT1');
    });

    it('should include kitLotNumber when provided', async () => {
      const mockResponse = { success: true, data: [{ testKitId: 'KIT2' }] };

      const promise = service.getTestKits(testId, 'LOT-99');

      const req = httpMock.expectOne(r => r.url === API.TEST_BATCH_PARM.GET_TEST_KITS);
      expect(req.request.params.get('testId')).toBe(testId);
      expect(req.request.params.get('kitLotNumber')).toBe('LOT-99');
      req.flush(mockResponse);

      const result = await promise;
      expect(result.length).toBe(1);
    });

    it('should return empty array when data is null', async () => {
      const promise = service.getTestKits(testId);

      const req = httpMock.expectOne(r => r.url === API.TEST_BATCH_PARM.GET_TEST_KITS);
      req.flush({ success: true, data: null });

      const result = await promise;
      expect(result).toEqual([]);
    });
  });

  // ── getParmValuesLov ───────────────────────────────────────────────

  describe('getParmValuesLov', () => {
    it('should GET parameter values by datatype', async () => {
      const mockResponse = { success: true, data: [{ value: 'POS', description: 'Positive' }] };

      const promise = service.getParmValuesLov('NUMERIC');

      const req = httpMock.expectOne(r => r.url === API.TEST_BATCH_PARM.GET_PARM_VALUES_LOV);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('datatype')).toBe('NUMERIC');
      req.flush(mockResponse);

      const result = await promise;
      expect(result.length).toBe(1);
      expect(result[0].value).toBe('POS');
    });

    it('should return empty array when data is null', async () => {
      const promise = service.getParmValuesLov('TEXT');

      const req = httpMock.expectOne(r => r.url === API.TEST_BATCH_PARM.GET_PARM_VALUES_LOV);
      req.flush({ success: true, data: null });

      const result = await promise;
      expect(result).toEqual([]);
    });
  });

  // ── getBatchDetail ─────────────────────────────────────────────────

  describe('getBatchDetail', () => {
    const tbId = 'TB100';
    const testId = 'TST01';

    it('should GET batch detail', async () => {
      const mockItem = { tbId, testId, testName: 'ABO', parmType: 'MAN' };
      const mockResponse = { success: true, item: mockItem };

      const promise = service.getBatchDetail(tbId, testId);

      const req = httpMock.expectOne(r => r.url === API.TEST_BATCH_PARM.GET_BATCH_DETAIL(tbId, testId));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toBeTruthy();
      expect(result!.tbId).toBe(tbId);
      expect(result!.testId).toBe(testId);
    });

    it('should return null when item is null', async () => {
      const promise = service.getBatchDetail(tbId, testId);

      const req = httpMock.expectOne(r => r.url === API.TEST_BATCH_PARM.GET_BATCH_DETAIL(tbId, testId));
      req.flush({ success: true, item: null });

      const result = await promise;
      expect(result).toBeNull();
    });
  });

  // ── getParameters ──────────────────────────────────────────────────

  describe('getParameters', () => {
    const tbId = 'TB100';
    const testId = 'TST01';
    const expectedUrl = API.TEST_BATCH_PARM.GET_PARAMETERS(tbId, testId);

    it('should GET parameters without optional params', async () => {
      const mockResponse = { success: true, data: [{ sequence: 1, parmCode: 'ABORH' }] };

      const promise = service.getParameters(tbId, testId);

      const req = httpMock.expectOne(r => r.url === expectedUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResponse);

      const result = await promise;
      expect(result.length).toBe(1);
      expect(result[0].parmCode).toBe('ABORH');
    });

    it('should include sortColumn when provided', async () => {
      const mockResponse = { success: true, data: [] };

      const promise = service.getParameters(tbId, testId, 'sequence');

      const req = httpMock.expectOne(r => r.url === expectedUrl);
      expect(req.request.params.get('sortColumn')).toBe('sequence');
      expect(req.request.params.has('sortDirection')).toBeFalse();
      expect(req.request.params.has('searchTerm')).toBeFalse();
      req.flush(mockResponse);

      await promise;
    });

    it('should include sortDirection when provided', async () => {
      const mockResponse = { success: true, data: [] };

      const promise = service.getParameters(tbId, testId, undefined, 'asc');

      const req = httpMock.expectOne(r => r.url === expectedUrl);
      expect(req.request.params.has('sortColumn')).toBeFalse();
      expect(req.request.params.get('sortDirection')).toBe('asc');
      req.flush(mockResponse);

      await promise;
    });

    it('should include searchTerm when provided', async () => {
      const mockResponse = { success: true, data: [] };

      const promise = service.getParameters(tbId, testId, undefined, undefined, 'ABO');

      const req = httpMock.expectOne(r => r.url === expectedUrl);
      expect(req.request.params.has('sortColumn')).toBeFalse();
      expect(req.request.params.has('sortDirection')).toBeFalse();
      expect(req.request.params.get('searchTerm')).toBe('ABO');
      req.flush(mockResponse);

      await promise;
    });

    it('should include all optional params when provided', async () => {
      const mockResponse = { success: true, data: [{ sequence: 1, parmCode: 'CEL' }] };

      const promise = service.getParameters(tbId, testId, 'parmCode', 'desc', 'CEL');

      const req = httpMock.expectOne(r => r.url === expectedUrl);
      expect(req.request.params.get('sortColumn')).toBe('parmCode');
      expect(req.request.params.get('sortDirection')).toBe('desc');
      expect(req.request.params.get('searchTerm')).toBe('CEL');
      req.flush(mockResponse);

      const result = await promise;
      expect(result.length).toBe(1);
    });

    it('should return empty array when data is null', async () => {
      const promise = service.getParameters(tbId, testId);

      const req = httpMock.expectOne(r => r.url === expectedUrl);
      req.flush({ success: true, data: null });

      const result = await promise;
      expect(result).toEqual([]);
    });
  });

  // ── getReagents ────────────────────────────────────────────────────

  describe('getReagents', () => {
    const tbId = 'TB100';
    const testId = 'TST01';
    const testKitId = 'KIT1';
    const expectedUrl = API.TEST_BATCH_PARM.GET_REAGENTS(tbId, testId);

    it('should GET reagents with testKitId only', async () => {
      const mockResponse = {
        success: true,
        data: [{ channel: 1, reagentName: 'Anti-A', lotNumber: 'LOT1' }]
      };

      const promise = service.getReagents(tbId, testId, testKitId);

      const req = httpMock.expectOne(r => r.url === expectedUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('testKitId')).toBe(testKitId);
      expect(req.request.params.has('sortColumn')).toBeFalse();
      expect(req.request.params.has('sortDirection')).toBeFalse();
      req.flush(mockResponse);

      const result = await promise;
      expect(result.length).toBe(1);
      expect(result[0].reagentName).toBe('Anti-A');
    });

    it('should include sort params when provided', async () => {
      const mockResponse = { success: true, data: [{ channel: 2, reagentName: 'Anti-B' }] };

      const promise = service.getReagents(tbId, testId, testKitId, 'channel', 'asc');

      const req = httpMock.expectOne(r => r.url === expectedUrl);
      expect(req.request.params.get('testKitId')).toBe(testKitId);
      expect(req.request.params.get('sortColumn')).toBe('channel');
      expect(req.request.params.get('sortDirection')).toBe('asc');
      req.flush(mockResponse);

      const result = await promise;
      expect(result.length).toBe(1);
    });

    it('should return empty array when data is null', async () => {
      const promise = service.getReagents(tbId, testId, testKitId);

      const req = httpMock.expectOne(r => r.url === expectedUrl);
      req.flush({ success: true, data: null });

      const result = await promise;
      expect(result).toEqual([]);
    });
  });

  // ── getHoldingTests ────────────────────────────────────────────────

  describe('getHoldingTests', () => {
    const tbId = 'TB100';
    const testId = 'TST01';

    it('should GET holding tests with default take=25 and skip=0', async () => {
      const mockResponse = {
        success: true,
        data: [{ unitId: 'U001', testId: 'TST01', result: 'POS' }],
        totalCount: 1
      };

      const promise = service.getHoldingTests(tbId, testId);

      const req = httpMock.expectOne(
        r => r.url === API.TEST_BATCH_PARM.GET_HOLDING_TESTS(tbId, testId, 25, 0)
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const result = await promise;
      expect(result.data.length).toBe(1);
      expect(result.data[0].unitId).toBe('U001');
      expect(result.totalCount).toBe(1);
    });

    it('should GET holding tests with custom take and skip', async () => {
      const mockResponse = {
        success: true,
        data: [{ unitId: 'U002', testId: 'TST01' }],
        totalCount: 50
      };

      const promise = service.getHoldingTests(tbId, testId, 10, 20);

      const req = httpMock.expectOne(
        r => r.url === API.TEST_BATCH_PARM.GET_HOLDING_TESTS(tbId, testId, 10, 20)
      );
      req.flush(mockResponse);

      const result = await promise;
      expect(result.data.length).toBe(1);
      expect(result.totalCount).toBe(50);
    });

    it('should include sort params when provided', async () => {
      const mockResponse = { success: true, data: [], totalCount: 0 };

      const promise = service.getHoldingTests(tbId, testId, 25, 0, 'unitId', 'desc');

      const req = httpMock.expectOne(
        r => r.url === API.TEST_BATCH_PARM.GET_HOLDING_TESTS(tbId, testId, 25, 0)
      );
      expect(req.request.params.get('sortColumn')).toBe('unitId');
      expect(req.request.params.get('sortDirection')).toBe('desc');
      req.flush(mockResponse);

      const result = await promise;
      expect(result.data).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('should return empty data and zero totalCount when response values are null', async () => {
      const promise = service.getHoldingTests(tbId, testId);

      const req = httpMock.expectOne(
        r => r.url === API.TEST_BATCH_PARM.GET_HOLDING_TESTS(tbId, testId, 25, 0)
      );
      req.flush({ success: true, data: null, totalCount: null });

      const result = await promise;
      expect(result.data).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  // ── saveParameters ─────────────────────────────────────────────────

  describe('saveParameters', () => {
    const tbId = 'TB100';
    const testId = 'TST01';

    it('should PUT parameters with correct URL and DTO body', async () => {
      const dto: TestBatchParmVerifyDto = {
        runId: 'R1',
        testKitId: 'KIT1',
        parameters: [
          { parmCode: 'ABORH', parmValue: '5.0', confirmFlag: 'Y' }
        ]
      };
      const mockResponse = { success: true, message: 'Saved' };

      const promise = service.saveParameters(tbId, testId, dto);

      const req = httpMock.expectOne(
        r => r.url === API.TEST_BATCH_PARM.SAVE_PARAMETERS(tbId, testId)
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);

      const result = await promise;
      expect(result.success).toBeTrue();
      expect(result.message).toBe('Saved');
    });

    it('should return response directly without unwrapping', async () => {
      const dto: TestBatchParmVerifyDto = {
        parameters: [{ parmCode: 'CEL', parmValue: '3.2' }]
      };
      const mockResponse = { success: false, message: 'Validation failed', data: { errors: ['out of range'] } };

      const promise = service.saveParameters(tbId, testId, dto);

      const req = httpMock.expectOne(
        r => r.url === API.TEST_BATCH_PARM.SAVE_PARAMETERS(tbId, testId)
      );
      req.flush(mockResponse);

      const result = await promise;
      expect(result.success).toBeFalse();
      expect(result.message).toBe('Validation failed');
    });
  });

  // ── confirmBatch ───────────────────────────────────────────────────

  describe('confirmBatch', () => {
    const tbId = 'TB100';
    const testId = 'TST01';

    it('should POST with empty body to confirm batch', async () => {
      const mockResponse = { success: true, message: 'Batch confirmed' };

      const promise = service.confirmBatch(tbId, testId);

      const req = httpMock.expectOne(
        r => r.url === API.TEST_BATCH_PARM.CONFIRM_BATCH(tbId, testId)
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);

      const result = await promise;
      expect(result.success).toBeTrue();
      expect(result.message).toBe('Batch confirmed');
    });

    it('should return failure response', async () => {
      const mockResponse = { success: false, message: 'Batch has non-acceptable parameters' };

      const promise = service.confirmBatch(tbId, testId);

      const req = httpMock.expectOne(
        r => r.url === API.TEST_BATCH_PARM.CONFIRM_BATCH(tbId, testId)
      );
      req.flush(mockResponse);

      const result = await promise;
      expect(result.success).toBeFalse();
    });
  });
});
