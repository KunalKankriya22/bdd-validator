import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { LabTestsApiService } from './lab-tests-api.service';
import { DefineTestResultsLabBulkUpsertDto } from '../models/lab-tests.model';

describe('LabTestsApiService', () => {
  let service: LabTestsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        LabTestsApiService
      ]
    });

    service = TestBed.inject(LabTestsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getTestIds', () => {
    it('should fetch and map test IDs from string array', fakeAsync(() => {
      let result: any;
      service.getTestIds().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/test-ids'));
      expect(req.request.method).toBe('GET');
      req.flush({ data: ['ABID', 'ABSC', 'HBSAG'] });
      tick();

      expect(result.length).toBe(3);
      expect(result[0]).toEqual({ testId: 'ABID' });
      expect(result[1]).toEqual({ testId: 'ABSC' });
    }));

    it('should handle PascalCase response', fakeAsync(() => {
      let result: any;
      service.getTestIds().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/test-ids'));
      req.flush({ Data: ['TEST1', 'TEST2'] });
      tick();

      expect(result.length).toBe(2);
    }));

    it('should map object format with code, description, and testGroup', fakeAsync(() => {
      let result: any;
      service.getTestIds().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/test-ids'));
      req.flush({
        data: [
          { code: '@K', description: 'Anti-Kell', testGroup: 'AG' },
          { Code: 'AB', Description: 'ABO Type', TestGroup: 'BLD' }
        ]
      });
      tick();

      expect(result.length).toBe(2);
      expect(result[0]).toEqual({ testId: '@K', description: 'Anti-Kell', testGroup: 'AG' });
      expect(result[1]).toEqual({ testId: 'AB', description: 'ABO Type', testGroup: 'BLD' });
    }));

    it('should handle direct array response', fakeAsync(() => {
      let result: any;
      service.getTestIds().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/test-ids'));
      req.flush([{ testId: 'T1' }, { TestId: 'T2' }]);
      tick();

      expect(result.length).toBe(2);
      expect(result[0].testId).toBe('T1');
      expect(result[1].testId).toBe('T2');
    }));

    it('should handle non-array rawData gracefully', fakeAsync(() => {
      let result: any;
      service.getTestIds().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/test-ids'));
      req.flush({ data: 'not-an-array' });
      tick();

      expect(result).toEqual([]);
    }));

    it('should propagate errors', fakeAsync(() => {
      let error: any;
      service.getTestIds().subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/test-ids'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getTestDetails', () => {
    it('should fetch and map test details from Item wrapper', fakeAsync(() => {
      let result: any;
      service.getTestDetails('ABID').subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/ABID'));
      expect(req.request.method).toBe('GET');
      req.flush({
        Item: {
          Description: 'ABO Blood Type',
          ShortId: 'ABI',
          Group: 'BLOOD',
          AntigenTest: true,
          AutoSchedule: false,
          EditResults: true,
          DiscrepancyCheck: false,
          NoOfResults: 2,
          FullResult: true,
          EffectiveDate: '2024-01-01T00:00:00Z',
          TerminationDate: null,
          ModificationDate: '2024-06-15T00:00:00Z'
        }
      });
      tick();

      expect(result.description).toBe('ABO Blood Type');
      expect(result.shortId).toBe('ABI');
      expect(result.group).toBe('BLOOD');
      expect(result.antigenTest).toBe('Y');
      expect(result.autoSchedule).toBe('N');
      expect(result.editResults).toBe('Y');
      expect(result.discrepancyCheck).toBe('N');
      expect(result.noOfResults).toBe(2);
      expect(result.fullResult).toBe('Y');
    }));

    it('should return default values when item is null in response', fakeAsync(() => {
      let result: any;
      service.getTestDetails('NONE').subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/NONE'));
      req.flush({ Item: null });
      tick();

      expect(result).toBeTruthy();
      expect(result.description).toBe('');
      expect(result.shortId).toBe('');
    }));

    it('should map camelCase response fields via item wrapper', fakeAsync(() => {
      let result: any;
      service.getTestDetails('TEST1').subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/TEST1'));
      req.flush({
        item: {
          description: 'Camel Test',
          shortId: 'CT',
          group: 'GRP',
          antigenTest: false,
          autoSchedule: true,
          editResults: false,
          discrepancyCheck: true,
          noOfResults: 3,
          fullResult: false,
          effectiveDate: '2024-02-01',
          terminationDate: '2025-02-01',
          modificationDate: '2024-07-01'
        }
      });
      tick();

      expect(result.description).toBe('Camel Test');
      expect(result.shortId).toBe('CT');
      expect(result.antigenTest).toBe('N');
      expect(result.autoSchedule).toBe('Y');
      expect(result.discrepancyCheck).toBe('Y');
      expect(result.fullResult).toBe('N');
      expect(result.effDateTime).toBe('2024-02-01');
      expect(result.termDateTime).toBe('2025-02-01');
    }));

    it('should map from Data array wrapper', fakeAsync(() => {
      let result: any;
      service.getTestDetails('DAT1').subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/DAT1'));
      req.flush({
        Data: [{
          Description: 'Data Array Test',
          ShortId: 'DA',
          Group: 'G',
          AntigenTest: null,
          NoOfResults: 0
        }]
      });
      tick();

      expect(result.description).toBe('Data Array Test');
      expect(result.shortId).toBe('DA');
      expect(result.antigenTest).toBe('');
      expect(result.noOfResults).toBe(0);
    }));

    it('should propagate errors', fakeAsync(() => {
      let error: any;
      service.getTestDetails('ERR').subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/ERR'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getDropdowns', () => {
    it('should fetch and map dropdown options from data wrapper', fakeAsync(() => {
      let result: any;
      service.getDropdowns().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/dropdowns'));
      expect(req.request.method).toBe('GET');
      req.flush({
        data: {
          Group: [{ Code: 'BLD', Description: 'Blood' }],
          AntigenTest: [{ Value: true, Label: 'Yes' }],
          AutoSchedule: [{ Value: false, Label: 'No' }],
          EditResults: [],
          DiscrepancyCheck: [],
          NoOfResults: [{ Value: 1, Label: '1' }],
          FullResult: [{ Value: true, Label: 'Yes' }]
        }
      });
      tick();

      expect(result.group.length).toBe(1);
      expect(result.group[0]).toEqual({ value: 'BLD', display: 'BLD - Blood' });
      expect(result.antigenTest[0]).toEqual({ value: true, display: 'Yes' });
      expect(result.noOfResults[0]).toEqual({ value: 1, display: '1' });
    }));

    it('should handle group without description', fakeAsync(() => {
      let result: any;
      service.getDropdowns().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/dropdowns'));
      req.flush({
        data: {
          Group: [{ Code: 'TST', Description: '' }],
          AntigenTest: [],
          AutoSchedule: [],
          EditResults: [],
          DiscrepancyCheck: [],
          NoOfResults: [],
          FullResult: []
        }
      });
      tick();

      expect(result.group.length).toBe(1);
      expect(result.group[0]).toEqual({ value: 'TST', display: 'TST' });
    }));

    it('should handle direct response without Data/data wrapper', fakeAsync(() => {
      let result: any;
      service.getDropdowns().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/dropdowns'));
      req.flush({
        group: [{ code: 'GR1', description: 'Group One' }],
        antigenTest: [{ value: true, label: 'Yes' }],
        autoSchedule: [],
        editResults: [],
        discrepancyCheck: [],
        noOfResults: [],
        fullResult: []
      });
      tick();

      expect(result.group.length).toBe(1);
      expect(result.group[0]).toEqual({ value: 'GR1', display: 'GR1 - Group One' });
      expect(result.antigenTest[0]).toEqual({ value: true, display: 'Yes' });
    }));

    it('should propagate errors', fakeAsync(() => {
      let error: any;
      service.getDropdowns().subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/dropdowns'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getTestGroups', () => {
    it('should fetch and map test groups from direct array', fakeAsync(() => {
      let result: any;
      service.getTestGroups().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/dropdowns/test-groups'));
      expect(req.request.method).toBe('GET');
      req.flush([
        { code: 'AG', description: 'Serological RBC Antigen' },
        { code: 'CHEM', description: 'Chemistries: ALT, Cholesterol' }
      ]);
      tick();

      expect(result.length).toBe(2);
      expect(result[0]).toEqual({ value: 'AG', display: 'AG - Serological RBC Antigen' });
      expect(result[1]).toEqual({ value: 'CHEM', display: 'CHEM - Chemistries: ALT, Cholesterol' });
    }));

    it('should handle wrapped response with PascalCase fields', fakeAsync(() => {
      let result: any;
      service.getTestGroups().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/dropdowns/test-groups'));
      req.flush({
        Data: [
          { Code: 'BLD', Description: 'Blood Tests' },
          { Code: 'NAT', Description: '' }
        ]
      });
      tick();

      expect(result.length).toBe(2);
      expect(result[0]).toEqual({ value: 'BLD', display: 'BLD - Blood Tests' });
      expect(result[1]).toEqual({ value: 'NAT', display: 'NAT' });
    }));

    it('should propagate errors', fakeAsync(() => {
      let error: any;
      service.getTestGroups().subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/dropdowns/test-groups'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getResultCodes', () => {
    it('should fetch and map result codes from direct array', fakeAsync(() => {
      let result: any;
      service.getResultCodes().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/dropdowns/result-codes'));
      expect(req.request.method).toBe('GET');
      req.flush([
        { code: 'NEG', description: 'Negative' },
        { code: 'POS', description: 'Positive' },
        { code: 'IND', description: 'Indeterminate' }
      ]);
      tick();

      expect(result.length).toBe(3);
      expect(result[0]).toEqual({ value: 'NEG', display: 'NEG - Negative' });
      expect(result[1]).toEqual({ value: 'POS', display: 'POS - Positive' });
      expect(result[2]).toEqual({ value: 'IND', display: 'IND - Indeterminate' });
    }));

    it('should handle wrapped response with PascalCase and missing description', fakeAsync(() => {
      let result: any;
      service.getResultCodes().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/dropdowns/result-codes'));
      req.flush({
        Data: [
          { Code: 'UNK', Description: '' }
        ]
      });
      tick();

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({ value: 'UNK', display: 'UNK' });
    }));

    it('should propagate errors', fakeAsync(() => {
      let error: any;
      service.getResultCodes().subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/dropdowns/result-codes'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getInterdictionCodesByTestId', () => {
    it('should fetch and map interdiction codes for a test ID', fakeAsync(() => {
      let result: any;
      service.getInterdictionCodesByTestId('ABID').subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/interdiction-codes/ABID'));
      expect(req.request.method).toBe('GET');
      req.flush([
        { code: 'ABOT', description: 'ABO/Rh Not Initially Tested' },
        { code: 'D01', description: 'Interdiction 1' }
      ]);
      tick();

      expect(result.length).toBe(2);
      expect(result[0]).toEqual({ value: 'ABOT', display: 'ABOT - ABO/Rh Not Initially Tested' });
      expect(result[1]).toEqual({ value: 'D01', display: 'D01 - Interdiction 1' });
    }));

    it('should handle wrapped response with PascalCase and missing description', fakeAsync(() => {
      let result: any;
      service.getInterdictionCodesByTestId('TEST2').subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/interdiction-codes/TEST2'));
      req.flush({
        Data: [
          { Code: 'IC1', Description: 'Code One' },
          { Code: 'IC2', Description: '' }
        ]
      });
      tick();

      expect(result.length).toBe(2);
      expect(result[0]).toEqual({ value: 'IC1', display: 'IC1 - Code One' });
      expect(result[1]).toEqual({ value: 'IC2', display: 'IC2' });
    }));

    it('should propagate errors', fakeAsync(() => {
      let error: any;
      service.getInterdictionCodesByTestId('ERR').subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/interdiction-codes/ERR'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getActiveTestIds', () => {
    it('should fetch and map active test IDs from direct array', fakeAsync(() => {
      let result: any;
      service.getActiveTestIds().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/active-test-ids'));
      expect(req.request.method).toBe('GET');
      req.flush([
        { code: 'iMPX', description: 'Individual Multiplex NAT test' },
        { code: 'ABID', description: 'ABO Blood Type' }
      ]);
      tick();

      expect(result.length).toBe(2);
      expect(result[0]).toEqual({ value: 'iMPX', display: 'iMPX - Individual Multiplex NAT test' });
      expect(result[1]).toEqual({ value: 'ABID', display: 'ABID - ABO Blood Type' });
    }));

    it('should handle wrapped response with PascalCase and missing description', fakeAsync(() => {
      let result: any;
      service.getActiveTestIds().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/active-test-ids'));
      req.flush({
        Data: [
          { Code: 'T1', Description: '' }
        ]
      });
      tick();

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({ value: 'T1', display: 'T1' });
    }));

    it('should propagate errors', fakeAsync(() => {
      let error: any;
      service.getActiveTestIds().subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/active-test-ids'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getFilterValues', () => {
    it('should fetch and map filter values from three endpoints', fakeAsync(() => {
      let result: any;
      service.getFilterValues().subscribe(r => result = r);
      tick();

      const interdictionsReq = httpMock.expectOne(r => r.url.includes('/dropdowns/interdictions'));
      expect(interdictionsReq.request.method).toBe('GET');
      interdictionsReq.flush([
        { code: 'D01', description: 'Interdiction 1' },
        { code: 'D02', description: 'Interdiction 2' }
      ]);

      const attributesReq = httpMock.expectOne(r => r.url.includes('/dropdowns/attributes'));
      expect(attributesReq.request.method).toBe('GET');
      attributesReq.flush([
        { code: 'A01', description: 'Attribute 1' },
        { code: 'A02', description: 'Attribute 2' },
        { code: 'A03', description: 'Attribute 3' }
      ]);

      const testsReq = httpMock.expectOne(r => r.url.includes('/dropdowns/tests'));
      expect(testsReq.request.method).toBe('GET');
      testsReq.flush([
        { testId: 'ABID', description: 'Test 1' },
        { testId: 'TEST2', description: 'Test 2' }
      ]);

      tick();

      expect(result.interdictionCodes.length).toBe(2);
      expect(result.interdictionCodes[0]).toEqual({ value: 'D01', display: 'D01 - Interdiction 1' });
      expect(result.attributeCodes.length).toBe(3);
      expect(result.tests.length).toBe(2);
    }));

    it('should cache results and not make duplicate API calls', fakeAsync(() => {
      let result1: any;
      let result2: any;

      service.clearFilterValuesCache();

      service.getFilterValues().subscribe(r => result1 = r);
      tick();

      const interdictionsReq = httpMock.expectOne(r => r.url.includes('/dropdowns/interdictions'));
      interdictionsReq.flush([{ code: 'C1', description: 'Cached' }]);

      const attributesReq = httpMock.expectOne(r => r.url.includes('/dropdowns/attributes'));
      attributesReq.flush([{ code: 'A1', description: 'Attr' }]);

      const testsReq = httpMock.expectOne(r => r.url.includes('/dropdowns/tests'));
      testsReq.flush([{ testId: 'T1', description: 'Test' }]);
      tick();

      // Second call should use cached observable - no new HTTP requests
      service.getFilterValues().subscribe(r => result2 = r);
      tick();

      // httpMock.verify() in afterEach will confirm no extra requests were made
      expect(result1).toEqual(result2);
    }));

    it('should handle items without descriptions', fakeAsync(() => {
      let result: any;
      service.getFilterValues().subscribe(r => result = r);
      tick();

      httpMock.expectOne(r => r.url.includes('/dropdowns/interdictions'))
        .flush([{ code: 'X1' }]);
      httpMock.expectOne(r => r.url.includes('/dropdowns/attributes'))
        .flush([{ code: 'Y1' }]);
      httpMock.expectOne(r => r.url.includes('/dropdowns/tests'))
        .flush([{ testId: 'Z1' }]);
      tick();

      expect(result.interdictionCodes[0]).toEqual({ value: 'X1', display: 'X1' });
      expect(result.attributeCodes[0]).toEqual({ value: 'Y1', display: 'Y1' });
      expect(result.tests[0]).toEqual({ value: 'Z1', display: 'Z1' });
    }));

    it('should handle non-array responses as empty arrays', fakeAsync(() => {
      let result: any;
      service.getFilterValues().subscribe(r => result = r);
      tick();

      httpMock.expectOne(r => r.url.includes('/dropdowns/interdictions'))
        .flush({ Data: 'not-array' });
      httpMock.expectOne(r => r.url.includes('/dropdowns/attributes'))
        .flush({ Data: 'not-array' });
      httpMock.expectOne(r => r.url.includes('/dropdowns/tests'))
        .flush({ Data: 'not-array' });
      tick();

      expect(result.interdictionCodes).toEqual([]);
      expect(result.attributeCodes).toEqual([]);
      expect(result.tests).toEqual([]);
    }));
  });

  describe('clearFilterValuesCache', () => {
    it('should clear cache so next getFilterValues makes new API calls', fakeAsync(() => {
      // First call - populates cache
      service.getFilterValues().subscribe();
      tick();

      httpMock.expectOne(r => r.url.includes('/dropdowns/interdictions'))
        .flush([{ code: 'D1', description: 'First' }]);
      httpMock.expectOne(r => r.url.includes('/dropdowns/attributes'))
        .flush([]);
      httpMock.expectOne(r => r.url.includes('/dropdowns/tests'))
        .flush([]);
      tick();

      // Clear the cache
      service.clearFilterValuesCache();

      // Second call should make new API requests
      let result: any;
      service.getFilterValues().subscribe(r => result = r);
      tick();

      httpMock.expectOne(r => r.url.includes('/dropdowns/interdictions'))
        .flush([{ code: 'D2', description: 'Second' }]);
      httpMock.expectOne(r => r.url.includes('/dropdowns/attributes'))
        .flush([]);
      httpMock.expectOne(r => r.url.includes('/dropdowns/tests'))
        .flush([]);
      tick();

      expect(result.interdictionCodes[0].value).toBe('D2');
    }));
  });

  describe('getLabTests', () => {
    it('should return empty result when testId is empty', fakeAsync(() => {
      let result: any;
      service.getLabTests({ testId: '' }).subscribe(r => result = r);
      tick();

      expect(result).toEqual({ data: [], totalRecords: 0 });
      // No HTTP request should be made - httpMock.verify() will confirm
    }));

    it('should post filter request with testId as query param', fakeAsync(() => {
      let result: any;
      service.getLabTests({ testId: 'ABID' }).subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r =>
        r.url.includes('/api/v1/define-test-results-lab/filter-by-testid') &&
        r.url.includes('testId=ABID')
      );
      expect(req.request.method).toBe('POST');
      req.flush({
        data: [
          {
            ResultCode: 'POS',
            PlateSeq: 'I',
            InterdictionCode: 'D01',
            NoOfRepeats: 2,
            AttributeCode: 'A01',
            ConfirmTest1: 'ABSC',
            ConfirmTest2: '',
            ConfirmTest3: '',
            ConfirmTest4: '',
            ConfirmTest5: '',
            ConfirmTest6: '',
            AutoOnly: true,
            SecondTech: false,
            EffectiveDate: '2024-01-15T00:00:00Z',
            TerminationDate: null,
            ModificationDate: '2024-06-01T00:00:00Z',
            AuditKey: 1
          }
        ],
        total: 1
      });
      tick();

      expect(result.data.length).toBe(1);
      expect(result.data[0].resultCode).toBe('POS');
      expect(result.data[0].initialRepeat).toBe('I');
      expect(result.data[0].machineResult).toBe('Y');
      expect(result.data[0].result2).toBe('N');
      expect(result.totalRecords).toBe(1);
    }));

    it('should include all filter body parameters', fakeAsync(() => {
      service.getLabTests({
        testId: 'ABID',
        interdictionCode: 'D01',
        initialRepeat: 'I',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31'),
        searchKeyword: 'POS'
      }).subscribe();
      tick();

      const req = httpMock.expectOne(r => r.url.includes('testId=ABID'));
      const body = req.request.body;
      expect(body.interdiction).toBe('D01');
      expect(body.plateSeq).toBe('I');
      expect(body.effectivePeriod).toBe('AFTER');
      expect(body.effectiveDate).toBeTruthy();
      expect(body.terminationPeriod).toBe('BEFORE');
      expect(body.terminationDate).toBeTruthy();
      expect(body.searchKeyword).toBe('POS');
      req.flush({ data: [], total: 0 });
    }));

    it('should handle direct array response format', fakeAsync(() => {
      let result: any;
      service.getLabTests({ testId: 'ABID' }).subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('testId=ABID'));
      req.flush([
        {
          ResultCode: 'NEG',
          PlateSeq: 'R',
          InterdictionCode: 'D02',
          NoOfRepeats: 1,
          AttributeCode: '',
          ConfirmTest1: '',
          ConfirmTest2: '',
          ConfirmTest3: '',
          ConfirmTest4: '',
          ConfirmTest5: '',
          ConfirmTest6: '',
          AutoOnly: false,
          SecondTech: true,
          EffectiveDate: '2024-03-01',
          TerminationDate: '2025-03-01',
          ModificationDate: '2024-07-01',
          AuditKey: 5
        }
      ]);
      tick();

      expect(result.data.length).toBe(1);
      expect(result.totalRecords).toBe(1);
      expect(result.data[0].resultCode).toBe('NEG');
      expect(result.data[0].initialRepeat).toBe('R');
      expect(result.data[0].machineResult).toBe('N');
      expect(result.data[0].result2).toBe('Y');
      expect(result.data[0].termDate).toBe('2025-03-01');
      expect(result.data[0].auditKey).toBe(5);
    }));

    it('should map AutoOnly boolean to Y/N machineResult', fakeAsync(() => {
      let result: any;
      service.getLabTests({ testId: 'ABID' }).subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('testId=ABID'));
      req.flush({
        data: [
          { ResultCode: 'R1', AutoOnly: true, SecondTech: false, PlateSeq: 'I', InterdictionCode: 'D01', EffectiveDate: '2024-01-01', AuditKey: 1 },
          { ResultCode: 'R2', AutoOnly: false, SecondTech: true, PlateSeq: 'R', InterdictionCode: 'D02', EffectiveDate: '2024-01-01', AuditKey: 2 },
          { ResultCode: 'R3', AutoOnly: null, SecondTech: null, PlateSeq: 'I', InterdictionCode: 'D01', EffectiveDate: '2024-01-01', AuditKey: 3 }
        ],
        total: 3
      });
      tick();

      expect(result.data[0].machineResult).toBe('Y');
      expect(result.data[0].result2).toBe('N');
      expect(result.data[1].machineResult).toBe('N');
      expect(result.data[1].result2).toBe('Y');
      expect(result.data[2].machineResult).toBe('');
      expect(result.data[2].result2).toBe('');
    }));

    it('should propagate errors', fakeAsync(() => {
      let error: any;
      service.getLabTests({ testId: 'ABID' }).subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('testId=ABID'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('saveBulkLabTests', () => {
    it('should post bulk upsert with testId as query param', fakeAsync(() => {
      const dto: DefineTestResultsLabBulkUpsertDto = {
        records: [{
          resultCode: 'POS',
          plateSeq: 'I',
          effectiveDate: '2024-01-01T00:00:00.000Z'
        }]
      };

      let result: any;
      service.saveBulkLabTests('ABID', dto).subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r =>
        r.url.includes('/api/v1/define-test-results-lab/bulk/upsert') &&
        r.url.includes('testId=ABID')
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);

      req.flush({
        data: {
          TotalRecords: 1,
          CreatedCount: 1,
          UpdatedCount: 0,
          FailureCount: 0,
          SuccessCount: 1,
          Success: true,
          Message: 'Saved successfully'
        }
      });
      tick();

      expect(result.TotalRecords).toBe(1);
      expect(result.CreatedCount).toBe(1);
      expect(result.Success).toBe(true);
      expect(result.Message).toBe('Saved successfully');
    }));

    it('should map camelCase response fields', fakeAsync(() => {
      const dto: DefineTestResultsLabBulkUpsertDto = {
        records: [{ resultCode: 'NEG', plateSeq: 'R', effectiveDate: '2024-06-01' }]
      };

      let result: any;
      service.saveBulkLabTests('TEST2', dto).subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('testId=TEST2'));
      req.flush({
        totalRecords: 3,
        createdCount: 0,
        updatedCount: 3,
        failureCount: 0,
        successCount: 3,
        success: true,
        message: 'All updated'
      });
      tick();

      expect(result.TotalRecords).toBe(3);
      expect(result.UpdatedCount).toBe(3);
      expect(result.SuccessCount).toBe(3);
      expect(result.Success).toBe(true);
      expect(result.Message).toBe('All updated');
    }));

    it('should propagate errors', fakeAsync(() => {
      const dto: DefineTestResultsLabBulkUpsertDto = {
        records: [{ resultCode: 'X', plateSeq: 'I', effectiveDate: '2024-01-01' }]
      };

      let error: any;
      service.saveBulkLabTests('ABID', dto).subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('testId=ABID'));
      req.flush('Error', { status: 400, statusText: 'Bad Request' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('createTest', () => {
    it('should post create request', fakeAsync(() => {
      const dto = {
        TestId: 'NEW01',
        Description: 'New Test',
        ShortId: 'NT',
        AutoSchedule: true,
        EditResults: false,
        DiscrepancyCheck: false,
        NoOfResults: 1,
        FullResult: true,
        EffectiveDate: '2025-01-01T00:00:00.000Z'
      };

      let result: any;
      service.createTest(dto).subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ success: true });
      tick();

      expect(result).toBeTruthy();
    }));

    it('should propagate errors', fakeAsync(() => {
      let error: any;
      service.createTest({ TestId: 'ERR' } as any).subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab'));
      req.flush('Validation error', { status: 422, statusText: 'Unprocessable Entity' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('updateTest', () => {
    it('should put update request with testId in URL', fakeAsync(() => {
      const dto = {
        Description: 'Updated Test',
        ShortId: 'UT',
        AutoSchedule: true,
        EditResults: true,
        DiscrepancyCheck: false,
        NoOfResults: 2,
        FullResult: true,
        EffectiveDate: '2025-01-01T00:00:00.000Z'
      };

      let result: any;
      service.updateTest('ABID', dto).subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/ABID'));
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true });
      tick();

      expect(result).toBeTruthy();
    }));

    it('should propagate errors', fakeAsync(() => {
      let error: any;
      service.updateTest('ABID', { Description: 'Fail' } as any).subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-lab/ABID'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
      tick();

      expect(error).toBeTruthy();
    }));
  });
});
