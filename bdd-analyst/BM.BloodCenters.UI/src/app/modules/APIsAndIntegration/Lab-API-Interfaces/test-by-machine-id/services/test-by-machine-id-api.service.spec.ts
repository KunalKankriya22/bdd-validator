import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestByMachineIdApiService } from './test-by-machine-id-api.service';
import { TestByMachineIdMockService } from './test-by-machine-id-mock.service';
import { HeaderService } from '@shared/services/header.service';
import {
  TestByMachineIdBulkUpsertDto,
  InstrumentTestUpsertDto,
  ApplicationSchedulingTestUpsertDto
} from '../models/test-by-machine-id.model';

describe('TestByMachineIdApiService', () => {
  let service: TestByMachineIdApiService;
  let httpMock: HttpTestingController;
  const baseUrl = '/api/v1/valid-instrument-test-schedules';

  const mockHeaderService = {
    getCurrentChapterId: () => 'CHAPTER-1',
    chapterTimeZone: jasmine.createSpy('chapterTimeZone').and.returnValue('America/New_York'),
    chapterChanged$: { pipe: () => ({ subscribe: () => {} }) }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TestByMachineIdApiService,
        TestByMachineIdMockService,
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });
    service = TestBed.inject(TestByMachineIdApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ========== getInstrumentIds ==========
  describe('getInstrumentIds', () => {
    it('should make GET request to /instruments with chapterId param', () => {
      service.getInstrumentIds().subscribe();

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/instruments` && r.params.get('chapterId') === 'CHAPTER-1'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });

    it('should transform response to InstrumentIdOption array', () => {
      let result: any;
      service.getInstrumentIds().subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/instruments`);
      req.flush({
        success: true,
        data: [
          { code: 'INST1', codeDesc: 'Instrument 1' },
          { code: 'INST2', codeDesc: 'Instrument 2' }
        ]
      });

      expect(result.length).toBe(2);
      expect(result[0].instrumentId).toBe('INST1');
      expect(result[0].description).toBe('Instrument 1');
      expect(result[1].instrumentId).toBe('INST2');
    });

    it('should return empty array on error', () => {
      let result: any;
      service.getInstrumentIds().subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/instruments`);
      req.error(new ProgressEvent('error'));

      expect(result).toEqual([]);
    });

    it('should fall back to instrumentId/description when code/codeDesc are absent', () => {
      let result: any;
      service.getInstrumentIds().subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/instruments`);
      req.flush({
        success: true,
        data: [
          { instrumentId: 'FALLBACK1', description: 'Fallback Instrument' }
        ]
      });

      expect(result.length).toBe(1);
      expect(result[0].instrumentId).toBe('FALLBACK1');
      expect(result[0].description).toBe('Fallback Instrument');
    });

    it('should handle null data in response gracefully', () => {
      let result: any;
      service.getInstrumentIds().subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/instruments`);
      req.flush({ success: true, data: null });

      expect(result).toEqual([]);
    });

    it('should use empty string for description when codeDesc and description are absent', () => {
      let result: any;
      service.getInstrumentIds().subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/instruments`);
      req.flush({
        success: true,
        data: [{ code: 'NO_DESC' }]
      });

      expect(result[0].description).toBe('');
    });
  });

  // ========== getInstrumentTestIds ==========
  describe('getInstrumentTestIds', () => {
    it('should make GET request to /instrument-tests/{instrumentId}', () => {
      service.getInstrumentTestIds('INST1').subscribe();

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/instrument-tests/INST1` && r.params.get('chapterId') === 'CHAPTER-1'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });

    it('should transform response to InstrumentTestIdOption array', () => {
      let result: any;
      service.getInstrumentTestIds('INST1').subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/instrument-tests/INST1`);
      req.flush({
        success: true,
        data: [
          { machineTestId: 'TEST1', description: 'Test 1' },
          { machineTestId: 'TEST2', description: 'Test 2' }
        ]
      });

      expect(result.length).toBe(2);
      expect(result[0].testId).toBe('TEST1');
      expect(result[0].description).toBe('Test 1');
    });

    it('should return empty array on error', () => {
      let result: any;
      service.getInstrumentTestIds('INST1').subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/instrument-tests/INST1`);
      req.error(new ProgressEvent('error'));

      expect(result).toEqual([]);
    });

    it('should return empty array when instrumentId is undefined', () => {
      let result: any;
      service.getInstrumentTestIds(undefined).subscribe(r => (result = r));

      httpMock.expectNone(r => r.url.includes('/instrument-tests/'));
      expect(result).toEqual([]);
    });

    it('should fall back to testId when machineTestId is absent', () => {
      let result: any;
      service.getInstrumentTestIds('INST1').subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/instrument-tests/INST1`);
      req.flush({
        success: true,
        data: [
          { testId: 'FALLBACK_TEST', description: 'Fallback Test' }
        ]
      });

      expect(result.length).toBe(1);
      expect(result[0].testId).toBe('FALLBACK_TEST');
      expect(result[0].description).toBe('Fallback Test');
    });

    it('should handle null data in response gracefully', () => {
      let result: any;
      service.getInstrumentTestIds('INST1').subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/instrument-tests/INST1`);
      req.flush({ success: true, data: null });

      expect(result).toEqual([]);
    });

    it('should use empty string for description when description is absent', () => {
      let result: any;
      service.getInstrumentTestIds('INST1').subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/instrument-tests/INST1`);
      req.flush({
        success: true,
        data: [{ machineTestId: 'NO_DESC_TEST' }]
      });

      expect(result[0].description).toBe('');
    });

    it('should encode special characters in instrumentId URL', () => {
      service.getInstrumentTestIds('INST/1').subscribe();

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/instrument-tests/INST%2F1`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });
  });

  // ========== getTestData ==========
  describe('getTestData', () => {
    it('should make GET request to /{machineId} with chapterId', () => {
      service.getTestData({ instrumentId: 'INST1' }).subscribe();

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/INST1` && r.params.get('chapterId') === 'CHAPTER-1'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });

    it('should include machineTestId param when testId provided', () => {
      service.getTestData({ instrumentId: 'INST1', testId: 'TEST1' }).subscribe();

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/INST1` &&
        r.params.get('machineTestId') === 'TEST1'
      );
      req.flush({ success: true, data: [] });
    });

    it('should return empty response when instrumentId is missing', () => {
      let result: any;
      service.getTestData({ instrumentId: '' }).subscribe(r => (result = r));

      httpMock.expectNone(r => r.url.includes(baseUrl));
      expect(result.instrumentTests).toEqual([]);
      expect(result.applicationSchedulingTests).toEqual([]);
      expect(result.totalRecords).toBe(0);
    });

    it('should return empty response on error', () => {
      let result: any;
      service.getTestData({ instrumentId: 'INST1' }).subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/INST1`);
      req.error(new ProgressEvent('error'));

      expect(result.instrumentTests).toEqual([]);
      expect(result.totalRecords).toBe(0);
    });

    it('should not include machineTestId param when testId is not provided', () => {
      service.getTestData({ instrumentId: 'INST1' }).subscribe();

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/INST1` && !r.params.has('machineTestId')
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });

    it('should encode special characters in instrumentId URL', () => {
      service.getTestData({ instrumentId: 'INST/1' }).subscribe();

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/INST%2F1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });

    it('should handle null data in response gracefully', () => {
      let result: any;
      service.getTestData({ instrumentId: 'INST1' }).subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/INST1`);
      req.flush({ success: true, data: null });

      expect(result.instrumentTests).toEqual([]);
      expect(result.applicationSchedulingTests).toEqual([]);
      expect(result.totalRecords).toBe(0);
    });

    it('should handle multiple records in response', () => {
      let result: any;
      service.getTestData({ instrumentId: 'INST1' }).subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/INST1`);
      req.flush({
        success: true,
        data: [
          { MachineId: 'INST1', MachineTestId: 'T1', AuditKey: 1 },
          { MachineId: 'INST1', MachineTestId: 'T2', AuditKey: 2 },
          { MachineId: 'INST1', MachineTestId: 'T3', AuditKey: 3 }
        ]
      });

      expect(result.instrumentTests.length).toBe(3);
      expect(result.applicationSchedulingTests.length).toBe(3);
      expect(result.totalRecords).toBe(3);
    });

    it('should return empty response when instrumentId is undefined', () => {
      let result: any;
      service.getTestData({ instrumentId: undefined } as any).subscribe(r => (result = r));

      httpMock.expectNone(r => r.url.includes(baseUrl));
      expect(result.instrumentTests).toEqual([]);
      expect(result.applicationSchedulingTests).toEqual([]);
      expect(result.totalRecords).toBe(0);
    });
  });

  // ========== saveBulkTestData ==========
  describe('saveBulkTestData', () => {
    const mockDto: TestByMachineIdBulkUpsertDto = {
      InstrumentId: 'INST1',
      TestId: 'TEST1',
      InstrumentTests: [{
        Test1: 'T1', Result1: 'R',
        Test2: '', Result2: '',
        Test3: '', Result3: '',
        Test4: '', Result4: '',
        Test5: '', Result5: '',
        PoolSize: 5
      }],
      ApplicationSchedulingTests: [{
        Test1: 'LT1', Result1: 'R',
        Test2: '', Result2: '',
        Test3: '', Result3: '',
        DefTest4: '', Result4: '',
        DefTest5: '', Result5: '',
        DefTest6: '', Result6: '',
        EffectiveDate: '2026-01-01T00:00:00.000Z',
        TerminationDate: null as any
      }]
    };

    it('should make POST request to /save', () => {
      service.saveBulkTestData(mockDto).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/save`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, message: 'Saved', data: {} });
    });

    it('should transform response to SaveResponse', () => {
      let result: any;
      service.saveBulkTestData(mockDto).subscribe(r => (result = r));

      const req = httpMock.expectOne(`${baseUrl}/save`);
      req.flush({ success: true, message: 'Saved OK', data: { id: 1 } });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Saved OK');
    });

    it('should throw error on failure', () => {
      let errorCaught = false;
      service.saveBulkTestData(mockDto).subscribe({
        error: () => { errorCaught = true; }
      });

      const req = httpMock.expectOne(`${baseUrl}/save`);
      req.error(new ProgressEvent('error'));

      expect(errorCaught).toBe(true);
    });

    it('should map instrument test fields to create DTO', () => {
      service.saveBulkTestData(mockDto).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/save`);
      const body = req.request.body;
      expect(body.machineId).toBe('INST1');
      expect(body.chapterId).toBe('CHAPTER-1');
      expect(body.machineTestId).toBe('TEST1');
      expect(body.testId1).toBe('T1');
      expect(body.testId1Res).toBe('R');
      expect(body.poolSize).toBe('5');
      req.flush({ success: true, data: {} });
    });

    it('should map application scheduling test fields to create DTO', () => {
      service.saveBulkTestData(mockDto).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/save`);
      const body = req.request.body;
      expect(body.ltSchTestId1).toBe('LT1');
      expect(body.ltSchRes1).toBe('R');
      expect(body.ltSchTestId2).toBe('');
      expect(body.effDate).toBe('2026-01-01T00:00:00.000Z');
      req.flush({ success: true, data: {} });
    });

    it('should include originalEffDate in request body when provided', () => {
      service.saveBulkTestData(mockDto, '2025-06-15').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/save`);
      const body = req.request.body;
      expect(body.originalEffDate).toBeTruthy();
      req.flush({ success: true, data: {} });
    });

    it('should set originalEffDate to null when not provided', () => {
      service.saveBulkTestData(mockDto).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/save`);
      const body = req.request.body;
      expect(body.originalEffDate).toBeNull();
      req.flush({ success: true, data: {} });
    });

    it('should use default message when response message is empty', () => {
      let result: any;
      service.saveBulkTestData(mockDto).subscribe(r => (result = r));

      const req = httpMock.expectOne(`${baseUrl}/save`);
      req.flush({ success: true, message: '', data: {} });

      expect(result.message).toBe('Test data saved successfully');
    });

    it('should use default success true when response success is undefined', () => {
      let result: any;
      service.saveBulkTestData(mockDto).subscribe(r => (result = r));

      const req = httpMock.expectOne(`${baseUrl}/save`);
      req.flush({ data: {} });

      expect(result.success).toBe(true);
    });

    it('should set testId6 and testId6Res to empty strings in create DTO', () => {
      service.saveBulkTestData(mockDto).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/save`);
      const body = req.request.body;
      expect(body.testId6).toBe('');
      expect(body.testId6Res).toBe('');
      req.flush({ success: true, data: {} });
    });

    it('should set termDate to null when TerminationDate is null', () => {
      service.saveBulkTestData(mockDto).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/save`);
      const body = req.request.body;
      expect(body.termDate).toBeNull();
      req.flush({ success: true, data: {} });
    });

    it('should include all application scheduling fields in create DTO', () => {
      const fullDto: TestByMachineIdBulkUpsertDto = {
        InstrumentId: 'INST2',
        TestId: 'TEST2',
        InstrumentTests: [{
          Test1: 'A', Result1: 'R',
          Test2: 'B', Result2: 'N',
          Test3: 'C', Result3: 'NR',
          Test4: 'D', Result4: 'R',
          Test5: 'E', Result5: 'N',
          PoolSize: '>1'
        }],
        ApplicationSchedulingTests: [{
          Test1: 'LT1', Result1: 'R',
          Test2: 'LT2', Result2: 'N',
          Test3: 'LT3', Result3: 'NR',
          DefTest4: 'DT4', Result4: 'R',
          DefTest5: 'DT5', Result5: 'N',
          DefTest6: 'DT6', Result6: 'NR',
          EffectiveDate: '2026-03-01T00:00:00.000Z',
          TerminationDate: '2027-12-31T00:00:00.000Z'
        }]
      };

      service.saveBulkTestData(fullDto).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/save`);
      const body = req.request.body;
      expect(body.machineId).toBe('INST2');
      expect(body.machineTestId).toBe('TEST2');
      expect(body.testId1).toBe('A');
      expect(body.testId2).toBe('B');
      expect(body.testId3).toBe('C');
      expect(body.testId4).toBe('D');
      expect(body.testId5).toBe('E');
      expect(body.testId1Res).toBe('R');
      expect(body.testId2Res).toBe('N');
      expect(body.testId3Res).toBe('NR');
      expect(body.testId4Res).toBe('R');
      expect(body.testId5Res).toBe('N');
      expect(body.poolSize).toBe('>1');
      expect(body.ltSchTestId1).toBe('LT1');
      expect(body.ltSchRes1).toBe('R');
      expect(body.ltSchTestId2).toBe('LT2');
      expect(body.ltSchRes2).toBe('N');
      expect(body.ltSchTestId3).toBe('LT3');
      expect(body.ltSchRes3).toBe('NR');
      expect(body.ltSchDfltTest4).toBe('DT4');
      expect(body.ltSchDfltRes4).toBe('R');
      expect(body.ltSchDfltTest5).toBe('DT5');
      expect(body.ltSchDfltRes5).toBe('N');
      expect(body.ltSchDfltTest6).toBe('DT6');
      expect(body.ltSchDfltRes6).toBe('NR');
      expect(body.effDate).toBe('2026-03-01T00:00:00.000Z');
      expect(body.termDate).toBe('2027-12-31T00:00:00.000Z');
      req.flush({ success: true, data: {} });
    });

    it('should pass through response data', () => {
      let result: any;
      service.saveBulkTestData(mockDto).subscribe(r => (result = r));

      const req = httpMock.expectOne(`${baseUrl}/save`);
      req.flush({ success: true, message: 'OK', data: { recordId: 42 } });

      expect(result.data).toEqual({ recordId: 42 });
    });
  });

  // ========== getTestOptions ==========
  describe('getTestOptions', () => {
    it('should make GET request to /lifetrack-tests', () => {
      service.getTestOptions().subscribe();

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/lifetrack-tests` && r.params.get('chapterId') === 'CHAPTER-1'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });

    it('should transform response and include hardcoded results', () => {
      let result: any;
      service.getTestOptions().subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/lifetrack-tests`);
      req.flush({
        success: true,
        data: [
          { testId: 'LT001', testDesc: 'LifeTrack Test 1' },
          { testId: 'LT002', testDesc: 'LifeTrack Test 2' }
        ]
      });

      expect(result.tests.length).toBe(2);
      expect(result.tests[0].testId).toBe('LT001');
      expect(result.tests[0].description).toBe('LifeTrack Test 1');
      expect(result.results).toEqual(['R', 'N', 'NR']);
    });

    it('should return empty arrays on error', () => {
      let result: any;
      service.getTestOptions().subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/lifetrack-tests`);
      req.error(new ProgressEvent('error'));

      expect(result.tests).toEqual([]);
      expect(result.results).toEqual([]);
    });

    it('should handle string items in data array', () => {
      let result: any;
      service.getTestOptions().subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/lifetrack-tests`);
      req.flush({
        success: true,
        data: ['MPX', 'HIV', 'HCV']
      });

      expect(result.tests.length).toBe(3);
      expect(result.tests[0].testId).toBe('MPX');
      expect(result.tests[1].testId).toBe('HIV');
      expect(result.tests[2].testId).toBe('HCV');
    });

    it('should handle null data in response', () => {
      let result: any;
      service.getTestOptions().subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/lifetrack-tests`);
      req.flush({ success: true, data: null });

      expect(result.tests).toEqual([]);
      expect(result.results).toEqual(['R', 'N', 'NR']);
    });

    it('should use fallback fields when primary fields are absent', () => {
      let result: any;
      service.getTestOptions().subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/lifetrack-tests`);
      req.flush({
        success: true,
        data: [
          { code: 'CODE1', description: 'Description 1' },
          { name: 'NAME1' }
        ]
      });

      expect(result.tests[0].testId).toBe('CODE1');
      expect(result.tests[0].description).toBe('Description 1');
      expect(result.tests[1].testId).toBe('NAME1');
    });

    it('should populate testShortId and testGroup when available', () => {
      let result: any;
      service.getTestOptions().subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/lifetrack-tests`);
      req.flush({
        success: true,
        data: [
          { testId: 'LT1', testDesc: 'Test 1', testShortId: 'SHORT1', testGroup: 'GROUP_A' }
        ]
      });

      expect(result.tests[0].testShortId).toBe('SHORT1');
      expect(result.tests[0].testGroup).toBe('GROUP_A');
    });

    it('should default testShortId and testGroup to empty string when absent', () => {
      let result: any;
      service.getTestOptions().subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/lifetrack-tests`);
      req.flush({
        success: true,
        data: [{ testId: 'LT1', testDesc: 'Test 1' }]
      });

      expect(result.tests[0].testShortId).toBe('');
      expect(result.tests[0].testGroup).toBe('');
    });

    it('should handle non-array data as empty tests', () => {
      let result: any;
      service.getTestOptions().subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/lifetrack-tests`);
      req.flush({ success: true, data: 'not-an-array' });

      expect(result.tests).toEqual([]);
      expect(result.results).toEqual(['R', 'N', 'NR']);
    });
  });

  // ========== getTestResults ==========
  describe('getTestResults', () => {
    it('should make GET request to /test-results/{testId}', () => {
      service.getTestResults('LT001').subscribe();

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/test-results/LT001` && r.params.get('chapterId') === 'CHAPTER-1'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [{ resultStatus: 'R' }, { resultStatus: 'N' }] });
    });

    it('should transform response to string array', () => {
      let result: any;
      service.getTestResults('LT001').subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/test-results/LT001`);
      req.flush({
        success: true,
        data: [{ resultStatus: 'R' }, { resultStatus: 'NR' }]
      });

      expect(result).toEqual(['R', 'NR']);
    });

    it('should return empty array on error', () => {
      let result: any;
      service.getTestResults('LT001').subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/test-results/LT001`);
      req.error(new ProgressEvent('error'));

      expect(result).toEqual([]);
    });

    it('should handle plain string items without resultStatus property', () => {
      let result: any;
      service.getTestResults('LT001').subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/test-results/LT001`);
      req.flush({
        success: true,
        data: ['R', 'NR', 'I']
      });

      expect(result).toEqual(['R', 'NR', 'I']);
    });

    it('should handle null data in response', () => {
      let result: any;
      service.getTestResults('LT001').subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/test-results/LT001`);
      req.flush({ success: true, data: null });

      expect(result).toEqual([]);
    });

    it('should encode special characters in testId URL', () => {
      service.getTestResults('LT/001').subscribe();

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/test-results/LT%2F001`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });
  });

  // ========== transformBackendToFrontend (tested via getTestData) ==========
  describe('transformBackendToFrontend', () => {
    function flushGetTestData(backendItem: any) {
      let result: any;
      service.getTestData({ instrumentId: 'INST-1' }).subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url.includes(`${baseUrl}/INST-1`));
      req.flush({ success: true, message: '', data: [backendItem] });
      return result;
    }

    it('should map instrument test fields from PascalCase backend', () => {
      const result = flushGetTestData({
        MachineId: 'INST-1',
        MachineTestId: 'TEST-1',
        TestId1: 'T1', TestId1Res: 'R',
        TestId2: 'T2', TestId2Res: 'N',
        TestId3: '', TestId3Res: '',
        TestId4: '', TestId4Res: '',
        TestId5: '', TestId5Res: '',
        PoolSize: '5',
        AuditKey: 100
      });

      const inst = result.instrumentTests[0];
      expect(inst.instrumentId).toBe('INST-1');
      expect(inst.testId).toBe('TEST-1');
      expect(inst.test1).toBe('T1');
      expect(inst.result1).toBe('R');
      expect(inst.test2).toBe('T2');
      expect(inst.result2).toBe('N');
      expect(inst.poolSize).toBe(5);
      expect(inst.auditKey).toBe(100);
    });

    it('should map application scheduling test fields', () => {
      const result = flushGetTestData({
        MachineId: 'INST-1',
        MachineTestId: 'TEST-1',
        LtSchTestId1: 'LT1', LtSchRes1: 'R',
        LtSchTestId2: 'LT2', LtSchRes2: 'N',
        LtSchTestId3: '', LtSchRes3: '',
        LtSchDfltTest4: '', LtSchDfltRes4: '',
        LtSchDfltTest5: '', LtSchDfltRes5: '',
        LtSchDfltTest6: '', LtSchDfltRes6: '',
        EffDate: '2026-06-30T00:00:00Z',
        TermDate: null,
        AuditKey: 100
      });

      const app = result.applicationSchedulingTests[0];
      expect(app.instrumentId).toBe('INST-1');
      expect(app.test1).toBe('LT1');
      expect(app.result1).toBe('R');
      expect(app.test2).toBe('LT2');
      expect(app.effectiveDate).toBeInstanceOf(Date);
      expect(app.terminationDate).toBeNull();
    });

    it('should parse PoolSize ">1" as string', () => {
      const result = flushGetTestData({
        MachineId: 'INST-1', MachineTestId: 'TEST-1',
        PoolSize: '>1', AuditKey: 1
      });

      expect(result.instrumentTests[0].poolSize).toBe('>1');
    });

    it('should parse PoolSize null as undefined', () => {
      const result = flushGetTestData({
        MachineId: 'INST-1', MachineTestId: 'TEST-1',
        PoolSize: null, AuditKey: 1
      });

      expect(result.instrumentTests[0].poolSize).toBeUndefined();
    });

    it('should parse PoolSize non-numeric as undefined', () => {
      const result = flushGetTestData({
        MachineId: 'INST-1', MachineTestId: 'TEST-1',
        PoolSize: 'abc', AuditKey: 1
      });

      expect(result.instrumentTests[0].poolSize).toBeUndefined();
    });

    it('should set totalRecords from data array length', () => {
      const result = flushGetTestData({
        MachineId: 'INST-1', MachineTestId: 'TEST-1', AuditKey: 1
      });

      expect(result.totalRecords).toBe(1);
    });

    it('should parse UTC Z-suffix effectiveDate without off-by-one shift', () => {
      const result = flushGetTestData({
        MachineId: 'INST-1', MachineTestId: 'TEST-1',
        EffDate: '2026-06-30T00:00:00Z', TermDate: null, AuditKey: 1
      });

      const effDate: Date = result.applicationSchedulingTests[0].effectiveDate;
      expect(effDate).toBeInstanceOf(Date);
      expect(effDate.getFullYear()).toBe(2026);
      expect(effDate.getMonth()).toBe(5);
      expect(effDate.getDate()).toBe(30);
    });

    it('should parse no-Z suffix effectiveDate correctly', () => {
      const result = flushGetTestData({
        MachineId: 'INST-1', MachineTestId: 'TEST-1',
        EffDate: '2026-06-30T00:00:00', TermDate: null, AuditKey: 1
      });

      const effDate: Date = result.applicationSchedulingTests[0].effectiveDate;
      expect(effDate).toBeInstanceOf(Date);
      expect(effDate.getFullYear()).toBe(2026);
      expect(effDate.getMonth()).toBe(5);
      expect(effDate.getDate()).toBe(30);
    });

    it('should parse UTC Z-suffix terminationDate without off-by-one shift', () => {
      const result = flushGetTestData({
        MachineId: 'INST-1', MachineTestId: 'TEST-1',
        EffDate: '2026-06-30T00:00:00', TermDate: '2030-06-30T00:00:00Z', AuditKey: 1
      });

      const termDate: Date = result.applicationSchedulingTests[0].terminationDate;
      expect(termDate).toBeInstanceOf(Date);
      expect(termDate.getFullYear()).toBe(2030);
      expect(termDate.getMonth()).toBe(5);
      expect(termDate.getDate()).toBe(30);
    });

    it('should parse no-Z suffix terminationDate correctly', () => {
      const result = flushGetTestData({
        MachineId: 'INST-1', MachineTestId: 'TEST-1',
        EffDate: '2026-06-30T00:00:00', TermDate: '2030-06-30T00:00:00', AuditKey: 1
      });

      const termDate: Date = result.applicationSchedulingTests[0].terminationDate;
      expect(termDate).toBeInstanceOf(Date);
      expect(termDate.getFullYear()).toBe(2030);
      expect(termDate.getMonth()).toBe(5);
      expect(termDate.getDate()).toBe(30);
    });

    it('should use local date parts so getDate() matches calendar day in any timezone', () => {
      const result = flushGetTestData({
        MachineId: 'INST-1', MachineTestId: 'TEST-1',
        EffDate: '2026-01-01T00:00:00Z', TermDate: '2030-12-31T00:00:00Z', AuditKey: 1
      });

      const effDate: Date = result.applicationSchedulingTests[0].effectiveDate;
      const termDate: Date = result.applicationSchedulingTests[0].terminationDate;

      expect(effDate.getDate()).toBe(1);
      expect(effDate.getMonth()).toBe(0);
      expect(termDate.getDate()).toBe(31);
      expect(termDate.getMonth()).toBe(11);
    });

    it('should handle empty data array', () => {
      let result: any;
      service.getTestData({ instrumentId: 'INST-1' }).subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url.includes(`${baseUrl}/INST-1`));
      req.flush({ success: true, data: [] });

      expect(result.instrumentTests).toEqual([]);
      expect(result.applicationSchedulingTests).toEqual([]);
      expect(result.totalRecords).toBe(0);
    });

    it('should map camelCase backend fields', () => {
      const result = flushGetTestData({
        machineId: 'INST-CC',
        machineTestId: 'TEST-CC',
        testId1: 'T1cc', testId1Res: 'Rcc',
        testId2: 'T2cc', testId2Res: 'Ncc',
        testId3: '', testId3Res: '',
        testId4: '', testId4Res: '',
        testId5: '', testId5Res: '',
        poolSize: '10',
        auditKey: 200,
        ltSchTestId1: 'LTcc1', ltSchRes1: 'Rcc',
        ltSchTestId2: 'LTcc2', ltSchRes2: 'Ncc',
        ltSchTestId3: '', ltSchRes3: '',
        ltSchDfltTest4: '', ltSchDfltRes4: '',
        ltSchDfltTest5: '', ltSchDfltRes5: '',
        ltSchDfltTest6: '', ltSchDfltRes6: '',
        effDate: '2026-03-15T00:00:00Z',
        termDate: '2027-06-30T00:00:00Z'
      });

      const inst = result.instrumentTests[0];
      expect(inst.instrumentId).toBe('INST-CC');
      expect(inst.testId).toBe('TEST-CC');
      expect(inst.test1).toBe('T1cc');
      expect(inst.result1).toBe('Rcc');
      expect(inst.test2).toBe('T2cc');
      expect(inst.result2).toBe('Ncc');
      expect(inst.poolSize).toBe(10);
      expect(inst.auditKey).toBe(200);

      const app = result.applicationSchedulingTests[0];
      expect(app.instrumentId).toBe('INST-CC');
      expect(app.testId).toBe('TEST-CC');
      expect(app.test1).toBe('LTcc1');
      expect(app.result1).toBe('Rcc');
      expect(app.test2).toBe('LTcc2');
      expect(app.result2).toBe('Ncc');
      expect(app.effectiveDate).toBeInstanceOf(Date);
      expect(app.effectiveDate.getFullYear()).toBe(2026);
      expect(app.effectiveDate.getMonth()).toBe(2);
      expect(app.effectiveDate.getDate()).toBe(15);
      expect(app.terminationDate).toBeInstanceOf(Date);
      expect(app.terminationDate.getFullYear()).toBe(2027);
      expect(app.terminationDate.getMonth()).toBe(5);
      expect(app.terminationDate.getDate()).toBe(30);
    });

    it('should handle invalid date strings gracefully', () => {
      const result = flushGetTestData({
        MachineId: 'INST-1', MachineTestId: 'TEST-1',
        EffDate: 'not-a-date', TermDate: 'also-invalid', AuditKey: 1
      });

      expect(result.applicationSchedulingTests[0].effectiveDate).toBeNull();
      expect(result.applicationSchedulingTests[0].terminationDate).toBeNull();
    });

    it('should default missing fields to empty strings', () => {
      const result = flushGetTestData({
        AuditKey: 1
      });

      const inst = result.instrumentTests[0];
      expect(inst.instrumentId).toBe('');
      expect(inst.testId).toBe('');
      expect(inst.test1).toBe('');
      expect(inst.result1).toBe('');
      expect(inst.test2).toBe('');
      expect(inst.result2).toBe('');
      expect(inst.test3).toBe('');
      expect(inst.result3).toBe('');
      expect(inst.test4).toBe('');
      expect(inst.result4).toBe('');
      expect(inst.test5).toBe('');
      expect(inst.result5).toBe('');
      expect(inst.auditKey).toBe(1);

      const app = result.applicationSchedulingTests[0];
      expect(app.instrumentId).toBe('');
      expect(app.testId).toBe('');
      expect(app.test1).toBe('');
      expect(app.result1).toBe('');
      expect(app.defTest4).toBe('');
      expect(app.result4).toBe('');
      expect(app.defTest5).toBe('');
      expect(app.result5).toBe('');
      expect(app.defTest6).toBe('');
      expect(app.result6).toBe('');
      expect(app.effectiveDate).toBeNull();
      expect(app.terminationDate).toBeNull();
    });

    it('should default auditKey to 0 when missing', () => {
      const result = flushGetTestData({
        MachineId: 'INST-1', MachineTestId: 'TEST-1'
      });

      expect(result.instrumentTests[0].auditKey).toBe(0);
      expect(result.applicationSchedulingTests[0].auditKey).toBe(0);
    });

    it('should parse numeric PoolSize string to number', () => {
      const result = flushGetTestData({
        MachineId: 'INST-1', MachineTestId: 'TEST-1',
        PoolSize: '42', AuditKey: 1
      });

      expect(result.instrumentTests[0].poolSize).toBe(42);
    });

    it('should handle multiple backend records', () => {
      let result: any;
      service.getTestData({ instrumentId: 'INST-1' }).subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url.includes(`${baseUrl}/INST-1`));
      req.flush({
        success: true, message: '', data: [
          { MachineId: 'INST-1', MachineTestId: 'T1', AuditKey: 1 },
          { MachineId: 'INST-1', MachineTestId: 'T2', AuditKey: 2 }
        ]
      });

      expect(result.instrumentTests.length).toBe(2);
      expect(result.applicationSchedulingTests.length).toBe(2);
      expect(result.instrumentTests[0].testId).toBe('T1');
      expect(result.instrumentTests[1].testId).toBe('T2');
      expect(result.totalRecords).toBe(2);
    });
  });

  // ========== formatPoolSize (tested via saveBulkTestData) ==========
  describe('formatPoolSize via saveBulkTestData', () => {
    function saveDtoWithPoolSize(poolSize: any) {
      const dto: TestByMachineIdBulkUpsertDto = {
        InstrumentId: 'INST1', TestId: 'TEST1',
        InstrumentTests: [{
          Test1: '', Result1: '', Test2: '', Result2: '',
          Test3: '', Result3: '', Test4: '', Result4: '',
          Test5: '', Result5: '', PoolSize: poolSize
        }],
        ApplicationSchedulingTests: [{
          Test1: '', Result1: '', Test2: '', Result2: '',
          Test3: '', Result3: '', DefTest4: '', Result4: '',
          DefTest5: '', Result5: '', DefTest6: '', Result6: '',
          EffectiveDate: '2026-01-01T00:00:00.000Z'
        }]
      };
      service.saveBulkTestData(dto).subscribe();
      return httpMock.expectOne(`${baseUrl}/save`);
    }

    it('should format numeric pool size to string', () => {
      const req = saveDtoWithPoolSize(5);
      expect(req.request.body.poolSize).toBe('5');
      req.flush({ success: true, data: {} });
    });

    it('should pass through ">1" string unchanged', () => {
      const req = saveDtoWithPoolSize('>1');
      expect(req.request.body.poolSize).toBe('>1');
      req.flush({ success: true, data: {} });
    });

    it('should handle undefined pool size', () => {
      const req = saveDtoWithPoolSize(undefined);
      expect(req.request.body.poolSize).toBe('');
      req.flush({ success: true, data: {} });
    });

    it('should format zero pool size to string "0"', () => {
      const req = saveDtoWithPoolSize(0);
      expect(req.request.body.poolSize).toBe('0');
      req.flush({ success: true, data: {} });
    });

    it('should format string pool size to string', () => {
      const req = saveDtoWithPoolSize('10');
      expect(req.request.body.poolSize).toBe('10');
      req.flush({ success: true, data: {} });
    });
  });

  // ========== formatDateForApi (tested via saveBulkTestData with originalEffDate) ==========
  describe('formatDateForApi via saveBulkTestData originalEffDate', () => {
    const baseSaveDto: TestByMachineIdBulkUpsertDto = {
      InstrumentId: 'INST1', TestId: 'TEST1',
      InstrumentTests: [{
        Test1: '', Result1: '', Test2: '', Result2: '',
        Test3: '', Result3: '', Test4: '', Result4: '',
        Test5: '', Result5: '', PoolSize: undefined
      }],
      ApplicationSchedulingTests: [{
        Test1: '', Result1: '', Test2: '', Result2: '',
        Test3: '', Result3: '', DefTest4: '', Result4: '',
        DefTest5: '', Result5: '', DefTest6: '', Result6: '',
        EffectiveDate: '2026-01-01T00:00:00.000Z'
      }]
    };

    it('should format Date object to ISO string', () => {
      service.saveBulkTestData(baseSaveDto, new Date(2025, 5, 15)).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/save`);
      const body = req.request.body;
      expect(body.originalEffDate).toContain('2025-06-15');
      req.flush({ success: true, data: {} });
    });

    it('should format date string to ISO string', () => {
      service.saveBulkTestData(baseSaveDto, '2025-03-20').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/save`);
      const body = req.request.body;
      expect(body.originalEffDate).toContain('2025-03-20');
      req.flush({ success: true, data: {} });
    });

    it('should set originalEffDate to null when originalEffDate is null', () => {
      service.saveBulkTestData(baseSaveDto, null).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/save`);
      const body = req.request.body;
      expect(body.originalEffDate).toBeNull();
      req.flush({ success: true, data: {} });
    });
  });

  // ========== getChapterId (tested indirectly) ==========
  describe('getChapterId', () => {
    it('should use empty string when getCurrentChapterId returns null', () => {
      mockHeaderService.getCurrentChapterId = () => null as any;

      service.getInstrumentIds().subscribe();

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/instruments` && r.params.get('chapterId') === ''
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });

      // Restore original mock
      mockHeaderService.getCurrentChapterId = () => 'CHAPTER-1';
    });
  });

  // ========== service creation ==========
  describe('service creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have correct baseUrl', () => {
      // Verified by making a request and checking the URL prefix
      service.getInstrumentIds().subscribe();
      const req = httpMock.expectOne(r => r.url.startsWith('/api/v1/valid-instrument-test-schedules'));
      req.flush({ success: true, data: [] });
    });
  });

  // ========== String trimming (str helper) ==========
  describe('string trimming', () => {
    it('should trim trailing whitespace from instrument IDs', () => {
      let result: any;
      service.getInstrumentIds().subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/instruments`);
      req.flush({
        success: true,
        data: [{ code: 'INST1   ', codeDesc: 'Instrument 1  ' }]
      });

      expect(result[0].instrumentId).toBe('INST1');
      expect(result[0].description).toBe('Instrument 1');
    });

    it('should trim trailing whitespace from instrument test IDs', () => {
      let result: any;
      service.getInstrumentTestIds('INST1').subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/instrument-tests/INST1`);
      req.flush({
        success: true,
        data: [{ machineTestId: 'TEST1   ', description: 'Test 1  ' }]
      });

      expect(result[0].testId).toBe('TEST1');
      expect(result[0].description).toBe('Test 1');
    });

    it('should trim trailing whitespace from test options', () => {
      let result: any;
      service.getTestOptions().subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/lifetrack-tests`);
      req.flush({
        success: true,
        data: [{ testId: 'LT001   ', testDesc: 'LifeTrack Test   ' }]
      });

      expect(result.tests[0].testId).toBe('LT001');
      expect(result.tests[0].description).toBe('LifeTrack Test');
    });

    it('should trim trailing whitespace from test results', () => {
      let result: any;
      service.getTestResults('LT001').subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/test-results/LT001`);
      req.flush({
        success: true,
        data: [{ resultStatus: 'R   ' }, { resultStatus: 'NR  ' }]
      });

      expect(result).toEqual(['R', 'NR']);
    });

    it('should trim trailing whitespace from backend test data fields', () => {
      let result: any;
      service.getTestData({ instrumentId: 'INST1' }).subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url.includes(`${baseUrl}/INST1`));
      req.flush({
        success: true,
        data: [{
          MachineId: 'INST1  ',
          MachineTestId: 'TEST1  ',
          TestId1: 'T1   ',
          TestId1Res: 'R   ',
          LtSchTestId1: 'LT1  ',
          LtSchRes1: 'R  ',
          LtSchTestId2: 'LT2  ',
          LtSchRes2: 'N  ',
          EffDate: '2026-06-30T00:00:00Z',
          AuditKey: 1
        }]
      });

      const inst = result.instrumentTests[0];
      expect(inst.instrumentId).toBe('INST1');
      expect(inst.testId).toBe('TEST1');
      expect(inst.test1).toBe('T1');
      expect(inst.result1).toBe('R');

      const app = result.applicationSchedulingTests[0];
      expect(app.test1).toBe('LT1');
      expect(app.result1).toBe('R');
      expect(app.test2).toBe('LT2');
      expect(app.result2).toBe('N');
    });

    it('should handle null and undefined values in str helper without error', () => {
      let result: any;
      service.getTestData({ instrumentId: 'INST1' }).subscribe(r => (result = r));

      const req = httpMock.expectOne(r => r.url.includes(`${baseUrl}/INST1`));
      req.flush({
        success: true,
        data: [{
          MachineId: null,
          MachineTestId: undefined,
          TestId1: null,
          AuditKey: 1
        }]
      });

      const inst = result.instrumentTests[0];
      expect(inst.instrumentId).toBe('');
      expect(inst.testId).toBe('');
      expect(inst.test1).toBe('');
    });
  });
});
