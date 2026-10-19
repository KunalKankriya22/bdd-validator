import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ReleaseTestResultsService, ReleaseTestResultsState } from './release-test-results.service';
import { environment } from 'src/environments/environment';
import {
  ReleaseTestResultSearchRequest,
  ReleaseTestResultSearchResponse,
  AutoDetermineQcFlagRequest,
  AutoDetermineQcFlagResponse,
  ReleaseTestResultsRequest,
  ReleaseTestResultsResponse,
  ApiResponse,
  ContractOption,
  BatchOption,
  TestResult,
  TestSeriesOption,
  TestOption,
  CollectionDayLegendItem,
  SampleAgeConfig,
  ReleaseTestResultUnit,
} from '../models/release-test-results.models';

describe('ReleaseTestResultsService', () => {
  let service: ReleaseTestResultsService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/laboratory/release-test-results`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReleaseTestResultsService],
    });

    service = TestBed.inject(ReleaseTestResultsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // =========================================================================
  // State Management
  // =========================================================================

  describe('savedState', () => {
    it('should return null initially', () => {
      expect(service.savedState).toBeNull();
    });
  });

  describe('saveState', () => {
    it('should store state so that savedState getter returns it', () => {
      const mockState: ReleaseTestResultsState = {
        formValues: { contractId: 'C001', contractIdDescription: 'Test Contract', batchId: 'B001' },
        searchResults: null,
        unitsData: [],
        selectedUnit: null,
        selectedUnitIndex: -1,
        testResults: [],
        showSidePanel: false,
        sortColumn: 'unitId',
        sortDirection: 'ASC',
        contractOptions: [],
        batchOptions: [],
        legendData: [],
        sampleAgeConfig: [],
        reconciled: false,
      };

      service.saveState(mockState);

      expect(service.savedState).toEqual(mockState);
    });

    it('should overwrite a previously saved state', () => {
      const firstState: ReleaseTestResultsState = {
        formValues: { contractId: 'C001', contractIdDescription: 'First', batchId: '' },
        searchResults: null,
        unitsData: [],
        selectedUnit: null,
        selectedUnitIndex: -1,
        testResults: [],
        showSidePanel: false,
        sortColumn: 'unitId',
        sortDirection: 'ASC',
        contractOptions: [],
        batchOptions: [],
        legendData: [],
        sampleAgeConfig: [],
        reconciled: false,
      };

      const secondState: ReleaseTestResultsState = {
        ...firstState,
        formValues: { contractId: 'C002', contractIdDescription: 'Second', batchId: 'B002' },
        reconciled: true,
      };

      service.saveState(firstState);
      service.saveState(secondState);

      expect(service.savedState).toEqual(secondState);
      expect(service.savedState!.formValues.contractId).toBe('C002');
    });
  });

  describe('clearState', () => {
    it('should set state to null', () => {
      const mockState: ReleaseTestResultsState = {
        formValues: { contractId: 'C001', contractIdDescription: 'Test', batchId: '' },
        searchResults: null,
        unitsData: [],
        selectedUnit: null,
        selectedUnitIndex: -1,
        testResults: [],
        showSidePanel: false,
        sortColumn: 'unitId',
        sortDirection: 'ASC',
        contractOptions: [],
        batchOptions: [],
        legendData: [],
        sampleAgeConfig: [],
        reconciled: false,
      };

      service.saveState(mockState);
      expect(service.savedState).not.toBeNull();

      service.clearState();
      expect(service.savedState).toBeNull();
    });

    it('should be safe to call when state is already null', () => {
      service.clearState();
      expect(service.savedState).toBeNull();
    });
  });

  // =========================================================================
  // searchUnits
  // =========================================================================

  describe('searchUnits', () => {
    const searchRequest: ReleaseTestResultSearchRequest = {
      contractId: 'C001',
      batchId: 'B001',
      sortColumn: 'unitId',
      sortOrder: 'ASC',
    };

    it('should POST to /search and map response.data[0] with message when data exists', (done) => {
      const mockSearchResult: ReleaseTestResultSearchResponse = {
        contractId: 'C001',
        company: 'ABC Blood Services',
        contractType: 'REGIONAL',
        resultsMethod: 'MANUAL',
        batchId: 'B001',
        units: [
          {
            unitId: 'W120624120401',
            chapterId: '0001',
            collDate: '2026-05-25T00:00:00Z',
            qcTestFlag: 'Y',
            redTubeFlag: 'Y',
            redTube2Flag: 'N',
            purpleTubeFlag: 'N',
          } as ReleaseTestResultUnit,
        ],
        totalUnits: 1,
        unitsToRelease: 1,
        skippedUnits: 0,
        sqcReasonUnits: 0,
        batchOnHold: false,
        batchSkipped: false,
      };

      const mockApiResponse: ApiResponse<ReleaseTestResultSearchResponse> = {
        success: true,
        statusCode: 200,
        message: 'Units retrieved successfully',
        data: [mockSearchResult],
        totalCount: 1,
      };

      service.searchUnits(searchRequest).subscribe((result) => {
        expect(result.contractId).toBe('C001');
        expect(result.company).toBe('ABC Blood Services');
        expect(result.units.length).toBe(1);
        expect(result.units[0].unitId).toBe('W120624120401');
        expect(result.message).toBe('Units retrieved successfully');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/search`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(searchRequest);
      req.flush(mockApiResponse);
    });

    it('should return empty structure with defaults when response has no data', (done) => {
      const mockApiResponse: ApiResponse<ReleaseTestResultSearchResponse> = {
        success: true,
        statusCode: 200,
        message: 'No units found',
        data: [],
        totalCount: 0,
      };

      service.searchUnits(searchRequest).subscribe((result) => {
        expect(result.contractId).toBe('C001');
        expect(result.company).toBe('');
        expect(result.contractType).toBe('');
        expect(result.resultsMethod).toBeNull();
        expect(result.batchId).toBe('B001');
        expect(result.units).toEqual([]);
        expect(result.totalUnits).toBe(0);
        expect(result.unitsToRelease).toBe(0);
        expect(result.skippedUnits).toBe(0);
        expect(result.sqcReasonUnits).toBe(0);
        expect(result.batchOnHold).toBe(false);
        expect(result.batchSkipped).toBe(false);
        expect(result.message).toBe('No units found');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/search`);
      req.flush(mockApiResponse);
    });

    it('should return empty structure when data is null', (done) => {
      const mockApiResponse = {
        success: true,
        statusCode: 200,
        message: 'No data',
        data: null as any,
        totalCount: 0,
      };

      service.searchUnits(searchRequest).subscribe((result) => {
        expect(result.units).toEqual([]);
        expect(result.totalUnits).toBe(0);
        expect(result.message).toBe('No data');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/search`);
      req.flush(mockApiResponse);
    });

    it('should use empty string for contractId when request has no contractId', (done) => {
      const requestNoContract: ReleaseTestResultSearchRequest = {};

      service.searchUnits(requestNoContract).subscribe((result) => {
        expect(result.contractId).toBe('');
        expect(result.batchId).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/search`);
      req.flush({
        success: true,
        statusCode: 200,
        message: '',
        data: [],
        totalCount: 0,
      });
    });
  });

  // =========================================================================
  // autoDetermineQcFlags
  // =========================================================================

  describe('autoDetermineQcFlags', () => {
    const qcRequest: AutoDetermineQcFlagRequest = {
      contractId: 'C001',
      batchId: 'B001',
      units: [
        { unitId: 'W120624120401', collDate: '2026-05-25T00:00:00Z' },
        { unitId: 'W120624120402', collDate: '2026-05-25T00:00:00Z' },
      ],
    };

    it('should POST to /auto-determine-qc-flags and map response.data[0] with message when data exists', (done) => {
      const mockQcResult: AutoDetermineQcFlagResponse = {
        units: [
          {
            unitId: 'W120624120401',
            collDate: '2026-05-25T00:00:00Z',
            qcTestFlag: 'Y',
            serumPlasmaInd: 'S',
            redTubeFlag: 'Y',
            redTube2Flag: 'N',
            purpleTubeFlag: 'N',
          },
        ],
        totalProcessed: 1,
      };

      const mockApiResponse: ApiResponse<AutoDetermineQcFlagResponse> = {
        success: true,
        statusCode: 200,
        message: 'QC flags determined',
        data: [mockQcResult],
        totalCount: 1,
      };

      service.autoDetermineQcFlags(qcRequest).subscribe((result) => {
        expect(result.units.length).toBe(1);
        expect(result.units[0].qcTestFlag).toBe('Y');
        expect(result.units[0].serumPlasmaInd).toBe('S');
        expect(result.totalProcessed).toBe(1);
        expect(result.message).toBe('QC flags determined');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/auto-determine-qc-flags`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(qcRequest);
      req.flush(mockApiResponse);
    });

    it('should return {units:[], totalProcessed:0, message} when no data', (done) => {
      const mockApiResponse: ApiResponse<AutoDetermineQcFlagResponse> = {
        success: true,
        statusCode: 200,
        message: 'No units to process',
        data: [],
        totalCount: 0,
      };

      service.autoDetermineQcFlags(qcRequest).subscribe((result) => {
        expect(result.units).toEqual([]);
        expect(result.totalProcessed).toBe(0);
        expect(result.message).toBe('No units to process');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/auto-determine-qc-flags`);
      req.flush(mockApiResponse);
    });
  });

  // =========================================================================
  // releaseTestResults
  // =========================================================================

  describe('releaseTestResults', () => {
    const releaseRequest: ReleaseTestResultsRequest = {
      contractId: 'C001',
      batchId: 'B001',
      performCommit: true,
      units: [
        { unitId: 'W120624120401', collDate: '2026-05-25T00:00:00Z', qcTestFlag: 'Y' },
      ],
    };

    it('should POST to /release and map response.data[0] with message when data exists', (done) => {
      const mockReleaseResult: ReleaseTestResultsResponse = {
        unitsReleased: 1,
        unitsSkipped: 0,
        releasedUnitIds: ['W120624120401'],
        skippedUnitIds: [],
        allUnitsReleased: true,
      };

      const mockApiResponse: ApiResponse<ReleaseTestResultsResponse> = {
        success: true,
        statusCode: 200,
        message: 'Release completed successfully',
        data: [mockReleaseResult],
        totalCount: 1,
      };

      service.releaseTestResults(releaseRequest).subscribe((result) => {
        expect(result.unitsReleased).toBe(1);
        expect(result.unitsSkipped).toBe(0);
        expect(result.releasedUnitIds).toEqual(['W120624120401']);
        expect(result.skippedUnitIds).toEqual([]);
        expect(result.allUnitsReleased).toBe(true);
        expect(result.message).toBe('Release completed successfully');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/release`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(releaseRequest);
      req.flush(mockApiResponse);
    });

    it('should return empty response structure when no data', (done) => {
      const mockApiResponse: ApiResponse<ReleaseTestResultsResponse> = {
        success: true,
        statusCode: 200,
        message: 'No units processed',
        data: [],
        totalCount: 0,
      };

      service.releaseTestResults(releaseRequest).subscribe((result) => {
        expect(result.unitsReleased).toBe(0);
        expect(result.unitsSkipped).toBe(0);
        expect(result.releasedUnitIds).toEqual([]);
        expect(result.skippedUnitIds).toEqual([]);
        expect(result.allUnitsReleased).toBe(false);
        expect(result.message).toBe('No units processed');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/release`);
      req.flush(mockApiResponse);
    });

    it('should send performCommit flag in the request body', (done) => {
      const validationRequest: ReleaseTestResultsRequest = {
        ...releaseRequest,
        performCommit: false,
      };

      service.releaseTestResults(validationRequest).subscribe(() => done());

      const req = httpMock.expectOne(`${baseUrl}/release`);
      expect(req.request.body.performCommit).toBe(false);
      req.flush({
        success: true,
        statusCode: 200,
        message: '',
        data: [{ unitsReleased: 0, unitsSkipped: 0, releasedUnitIds: [], skippedUnitIds: [], allUnitsReleased: false }],
        totalCount: 1,
      });
    });
  });

  // =========================================================================
  // getContractOptions
  // =========================================================================

  describe('getContractOptions', () => {
    it('should GET /contracts and return response.data', (done) => {
      const mockContracts: ContractOption[] = [
        { contractId: 'C001', company: 'ABC Blood', contractType: 'REGIONAL', description: 'ABC Regional' },
        { contractId: 'C002', company: 'XYZ Labs', contractType: 'LOCAL', description: 'XYZ Local' },
      ];

      service.getContractOptions().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].contractId).toBe('C001');
        expect(result[1].company).toBe('XYZ Labs');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/contracts`);
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Contracts retrieved',
        data: mockContracts,
        totalCount: 2,
      });
    });

    it('should return empty array when data is null', (done) => {
      service.getContractOptions().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/contracts`);
      req.flush({
        success: true,
        statusCode: 200,
        message: '',
        data: null,
        totalCount: 0,
      });
    });
  });

  // =========================================================================
  // getBatchOptions
  // =========================================================================

  describe('getBatchOptions', () => {
    it('should GET /batches/{contractId} and return response.data', (done) => {
      const mockBatches: BatchOption[] = [
        { batchId: 'B001', description: 'Batch 1', totalUnits: 10 },
        { batchId: 'B002', description: 'Batch 2', totalUnits: 5 },
      ];

      service.getBatchOptions('C001').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].batchId).toBe('B001');
        expect(result[1].totalUnits).toBe(5);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/batches/C001`);
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Batches retrieved',
        data: mockBatches,
        totalCount: 2,
      });
    });

    it('should encode the contractId in the URL', (done) => {
      service.getBatchOptions('C/001&special').subscribe(() => done());

      const req = httpMock.expectOne(`${baseUrl}/batches/${encodeURIComponent('C/001&special')}`);
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: '',
        data: [],
        totalCount: 0,
      });
    });

    it('should return empty array when data is null', (done) => {
      service.getBatchOptions('C001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/batches/C001`);
      req.flush({
        success: true,
        statusCode: 200,
        message: '',
        data: null,
        totalCount: 0,
      });
    });
  });

  // =========================================================================
  // getUnitTestResults
  // =========================================================================

  describe('getUnitTestResults', () => {
    it('should GET /test-results/{unitId}?collDate=X and return response.data', (done) => {
      const mockResults: TestResult[] = [
        {
          sequence: 1,
          testId: 'HIV12',
          resultCode: 'NEG',
          resultDescription: 'Negative',
          description: 'HIV 1/2 Antibody',
          isReactive: 'N',
        },
      ];

      service.getUnitTestResults('W120624120401', '2026-05-25').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].testId).toBe('HIV12');
        expect(result[0].resultCode).toBe('NEG');
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}/test-results/${encodeURIComponent('W120624120401')}?collDate=${encodeURIComponent('2026-05-25')}`
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Test results retrieved',
        data: mockResults,
        totalCount: 1,
      });
    });

    it('should encode unitId and collDate in the URL', (done) => {
      service.getUnitTestResults('UNIT/123', '2026-05-25T00:00:00Z').subscribe(() => done());

      const req = httpMock.expectOne(
        `${baseUrl}/test-results/${encodeURIComponent('UNIT/123')}?collDate=${encodeURIComponent('2026-05-25T00:00:00Z')}`
      );
      req.flush({ success: true, statusCode: 200, message: '', data: [], totalCount: 0 });
    });

    it('should return empty array when data is null', (done) => {
      service.getUnitTestResults('W120624120401', '2026-05-25').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        `${baseUrl}/test-results/${encodeURIComponent('W120624120401')}?collDate=${encodeURIComponent('2026-05-25')}`
      );
      req.flush({ success: true, statusCode: 200, message: '', data: null, totalCount: 0 });
    });
  });

  // =========================================================================
  // getTestSeries
  // =========================================================================

  describe('getTestSeries', () => {
    it('should GET /test-series and return response.data', (done) => {
      const mockSeries: TestSeriesOption[] = [
        { testSeriesId: 'TS001', description: 'Confirmatory Series 1' },
        { testSeriesId: 'TS002', description: 'Regional Series' },
      ];

      service.getTestSeries().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].testSeriesId).toBe('TS001');
        expect(result[1].description).toBe('Regional Series');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/test-series`);
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Test series retrieved',
        data: mockSeries,
        totalCount: 2,
      });
    });

    it('should return empty array when data is null', (done) => {
      service.getTestSeries().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/test-series`);
      req.flush({ success: true, statusCode: 200, message: '', data: null, totalCount: 0 });
    });
  });

  // =========================================================================
  // getTests
  // =========================================================================

  describe('getTests', () => {
    it('should GET /tests and return response.data', (done) => {
      const mockTests: TestOption[] = [
        { testId: 'HIV12', testDesc: 'HIV 1/2 Antibody Test' },
        { testId: 'HBSAG', testDesc: 'Hepatitis B Surface Antigen' },
      ];

      service.getTests().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].testId).toBe('HIV12');
        expect(result[1].testDesc).toBe('Hepatitis B Surface Antigen');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/tests`);
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Tests retrieved',
        data: mockTests,
        totalCount: 2,
      });
    });

    it('should return empty array when data is null', (done) => {
      service.getTests().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/tests`);
      req.flush({ success: true, statusCode: 200, message: '', data: null, totalCount: 0 });
    });
  });

  // =========================================================================
  // getCollectionDayLegend
  // =========================================================================

  describe('getCollectionDayLegend', () => {
    it('should GET /collection-day-legend and return response.data', (done) => {
      const mockLegend: CollectionDayLegendItem[] = [
        { code: 'WHITE', description: '0-2 days' },
        { code: 'YELLOW', description: '3-4 days' },
        { code: 'GREEN', description: '5 days' },
        { code: 'RED', description: '6-7 days' },
        { code: 'BLUE', description: '8+ days' },
      ];

      service.getCollectionDayLegend().subscribe((result) => {
        expect(result.length).toBe(5);
        expect(result[0].code).toBe('WHITE');
        expect(result[4].description).toBe('8+ days');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/collection-day-legend`);
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Legend retrieved',
        data: mockLegend,
        totalCount: 5,
      });
    });

    it('should return empty array when data is null', (done) => {
      service.getCollectionDayLegend().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/collection-day-legend`);
      req.flush({ success: true, statusCode: 200, message: '', data: null, totalCount: 0 });
    });
  });

  // =========================================================================
  // getSampleAgeConfig
  // =========================================================================

  describe('getSampleAgeConfig', () => {
    it('should GET /sample-age-config and return response.data', (done) => {
      const mockConfig: SampleAgeConfig[] = [
        { code: 'WHITE', description: '0-2 days', sortSequence: 1, minDays: 0, maxDays: 2 },
        { code: 'YELLOW', description: '3-4 days', sortSequence: 2, minDays: 3, maxDays: 4 },
      ];

      service.getSampleAgeConfig().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].minDays).toBe(0);
        expect(result[1].maxDays).toBe(4);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/sample-age-config`);
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Config retrieved',
        data: mockConfig,
        totalCount: 2,
      });
    });

    it('should return empty array when data is null', (done) => {
      service.getSampleAgeConfig().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/sample-age-config`);
      req.flush({ success: true, statusCode: 200, message: '', data: null, totalCount: 0 });
    });
  });

  // =========================================================================
  // submitReport
  // =========================================================================

  describe('submitReport', () => {
    it('should POST to /report with { unitId } and return response.item', (done) => {
      const mockItem = { jobId: 'JOB-12345', status: 'SUBMITTED' };

      service.submitReport('W120624120401').subscribe((result) => {
        expect(result).toEqual(mockItem);
        expect(result.jobId).toBe('JOB-12345');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/report`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ unitId: 'W120624120401' });
      req.flush({ item: mockItem });
    });

    it('should return undefined when response has no item', (done) => {
      service.submitReport('W120624120401').subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/report`);
      req.flush({});
    });
  });

  // =========================================================================
  // handleError (tested via public methods)
  // =========================================================================

  describe('handleError (via public methods)', () => {
    it('should handle ErrorEvent with "Error: {message}" format', (done) => {
      spyOn(console, 'error');

      service.getContractOptions().subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toBe('Error: Network connection failed');
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/contracts`);
      req.error(new ErrorEvent('error', { message: 'Network connection failed' }));
    });

    it('should handle server error with error.error.message and extract errorCode', (done) => {
      spyOn(console, 'error');

      service.searchUnits({ contractId: 'INVALID' }).subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toBe('Contract not found');
          expect(error.code).toBe('0085');
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/search`);
      req.flush(
        { message: 'Contract not found', errorCode: '0085' },
        { status: 404, statusText: 'Not Found' }
      );
    });

    it('should default errorCode to UNKNOWN when error.error has message but no errorCode', (done) => {
      spyOn(console, 'error');

      service.getTests().subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toBe('Internal processing error');
          expect(error.code).toBe('UNKNOWN');
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/tests`);
      req.flush(
        { message: 'Internal processing error' },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });

    it('should handle server error without error.error.message using status and message', (done) => {
      spyOn(console, 'error');

      service.getTestSeries().subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toContain('Error Code: 500');
          expect(error.message).toContain('Message:');
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/test-series`);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should include originalError in the thrown error object', (done) => {
      spyOn(console, 'error');

      service.getSampleAgeConfig().subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.originalError).toBeDefined();
          expect(error.originalError.status).toBe(503);
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/sample-age-config`);
      req.flush(
        { message: 'Service unavailable', errorCode: 'SVC_DOWN' },
        { status: 503, statusText: 'Service Unavailable' }
      );
    });

    it('should handle errors on POST methods (releaseTestResults)', (done) => {
      spyOn(console, 'error');

      const releaseRequest: ReleaseTestResultsRequest = {
        contractId: 'C001',
        performCommit: true,
        units: [{ unitId: 'U001', collDate: '2026-05-25', qcTestFlag: 'Y' }],
      };

      service.releaseTestResults(releaseRequest).subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toBe('Batch is on hold');
          expect(error.code).toBe('1191');
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/release`);
      req.flush(
        { message: 'Batch is on hold', errorCode: '1191' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle errors on autoDetermineQcFlags', (done) => {
      spyOn(console, 'error');

      const qcRequest: AutoDetermineQcFlagRequest = {
        contractId: 'C001',
        units: [{ unitId: 'U001', collDate: '2026-05-25' }],
      };

      service.autoDetermineQcFlags(qcRequest).subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toBe('Invalid contract');
          expect(error.code).toBe('1147');
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/auto-determine-qc-flags`);
      req.flush(
        { message: 'Invalid contract', errorCode: '1147' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle errors on getBatchOptions', (done) => {
      spyOn(console, 'error');

      service.getBatchOptions('INVALID').subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toContain('Error Code: 404');
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/batches/INVALID`);
      req.flush(null, { status: 404, statusText: 'Not Found' });
    });

    it('should handle errors on submitReport', (done) => {
      spyOn(console, 'error');

      service.submitReport('INVALID').subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toBe('Report generation failed');
          expect(error.code).toBe('RPT_ERR');
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/report`);
      req.flush(
        { message: 'Report generation failed', errorCode: 'RPT_ERR' },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });

    it('should log error details via console.error', (done) => {
      const consoleSpy = spyOn(console, 'error');

      service.getCollectionDayLegend().subscribe({
        next: () => fail('Should have errored'),
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'ReleaseTestResultsService error:',
            jasmine.objectContaining({
              errorMessage: jasmine.any(String),
              errorCode: jasmine.any(String),
            })
          );
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/collection-day-legend`);
      req.flush(
        { message: 'Server error' },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });
  });
});
