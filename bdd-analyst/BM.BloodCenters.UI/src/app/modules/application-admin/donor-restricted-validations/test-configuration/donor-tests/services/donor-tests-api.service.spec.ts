import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { DonorTestsApiService } from './donor-tests-api.service';
import { DefineTestResultsDonorBulkUpsertDto } from '../models/donor-tests.model';

describe('DonorTestsApiService', () => {
  let service: DonorTestsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DonorTestsApiService
      ]
    });

    service = TestBed.inject(DonorTestsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getTestIds', () => {
    it('should fetch and map test IDs', fakeAsync(() => {
      let result: any;
      service.getTestIds().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-test-results-donor/dropdowns/tests'));
      expect(req.request.method).toBe('GET');
      req.flush({ data: [
        { testId: 'ABID', description: 'ABO', testGroup: 'BLOOD' },
        { testId: 'ABSC', description: 'Screen', testGroup: 'BLOOD' },
        { testId: 'HBSAG', description: 'Hepatitis', testGroup: 'SEROL' }
      ]});
      tick();

      expect(result.length).toBe(3);
      expect(result[0]).toEqual({ testId: 'ABID', description: 'ABO', testGroup: 'BLOOD' });
      expect(result[1]).toEqual({ testId: 'ABSC', description: 'Screen', testGroup: 'BLOOD' });
    }));

    it('should handle PascalCase response', fakeAsync(() => {
      let result: any;
      service.getTestIds().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-test-results-donor/dropdowns/tests'));
      req.flush({ Data: [
        { TestId: 'TEST1', Description: 'Test 1', TestGroup: 'GRP1' },
        { TestId: 'TEST2', Description: 'Test 2', TestGroup: 'GRP2' }
      ]});
      tick();

      expect(result.length).toBe(2);
      expect(result[0].testId).toBe('TEST1');
      expect(result[1].testId).toBe('TEST2');
    }));

    it('should propagate error', fakeAsync(() => {
      let error: any;
      service.getTestIds().subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-test-results-donor/dropdowns/tests'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getTestDetails', () => {
    it('should fetch and map test details', fakeAsync(() => {
      let result: any;
      service.getTestDetails('ABID').subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor/ABID'));
      expect(req.request.method).toBe('GET');
      req.flush({
        Item: {
          Description: 'ABO Blood Type',
          ShortId: 'ABI',
          ProfileTest: true,
          AntigenType: 'ABO',
          AntigenGroup: 'GRP1',
          TestGroup: 'BLOOD - Blood Group',
          TestGroupValue: 'BLOOD - Blood Group',
          ViewLevel: 2,
          EffectiveDate: '2024-01-01T00:00:00Z',
          TerminationDate: null,
          ModificationDate: '2024-06-15T00:00:00Z'
        }
      });
      tick();

      expect(result.description).toBe('ABO Blood Type');
      expect(result.shortId).toBe('ABI');
      expect(result.profileTest).toBe('Yes');
      expect(result.antigenType).toBe('ABO');
      expect(result.antigenGroup).toBe('GRP1');
      expect(result.testGroup).toBe('BLOOD');
      expect(result.viewLevel).toBe(2);
    }));

    it('should map ProfileTest false to No', fakeAsync(() => {
      let result: any;
      service.getTestDetails('ABID').subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor/ABID'));
      req.flush({
        Item: {
          ProfileTest: false,
          TestGroup: 'SEROL'
        }
      });
      tick();

      expect(result.profileTest).toBe('No');
    }));

    it('should extract testGroup code from hyphenated string', fakeAsync(() => {
      let result: any;
      service.getTestDetails('ABID').subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor/ABID'));
      req.flush({
        Item: {
          TestGroup: 'BLOOD - Blood Group'
        }
      });
      tick();

      expect(result.testGroup).toBe('BLOOD');
    }));

    it('should return default values when response has no valid item', fakeAsync(() => {
      let result: any;
      service.getTestDetails('NONE').subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor/NONE'));
      req.flush({ Item: null });
      tick();

      expect(result).toBeTruthy();
      expect(result.description).toBe('');
      expect(result.shortId).toBe('');
    }));

    it('should propagate error', fakeAsync(() => {
      let error: any;
      service.getTestDetails('ABID').subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor/ABID'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getDropdowns', () => {
    it('should fetch and map dropdown options', fakeAsync(() => {
      let result: any;
      service.getDropdowns().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor/dropdowns'));
      expect(req.request.method).toBe('GET');
      req.flush({
        data: {
          ProfileTestOptions: [true, false],
          AntigenTypes: ['ABO', 'RH'],
          AntigenGroups: ['GRP1'],
          TestGroups: ['BLOOD - Blood Group', 'SEROL - Serology'],
          ViewLevels: [1, 2, 3]
        }
      });
      tick();

      expect(result.profileTest.length).toBe(2);
      expect(result.profileTest[0]).toEqual({ value: true, display: 'Yes' });
      expect(result.profileTest[1]).toEqual({ value: false, display: 'No' });
      expect(result.antigenType.length).toBe(2);
      expect(result.antigenType[0]).toEqual({ value: 'ABO', display: 'ABO' });
      expect(result.testGroup.length).toBe(2);
      expect(result.testGroup[0]).toEqual({ value: 'BLOOD', display: 'BLOOD - Blood Group' });
      expect(result.viewLevel.length).toBe(3);
      expect(result.viewLevel[0]).toEqual({ value: 1, display: '1' });
    }));

    it('should propagate error', fakeAsync(() => {
      let error: any;
      service.getDropdowns().subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor/dropdowns'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getAntigenTypes', () => {
    it('should fetch and map antigen type options with code and description', fakeAsync(() => {
      let result: any;
      service.getAntigenTypes().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor/dropdowns/antigen-types'));
      expect(req.request.method).toBe('GET');
      req.flush({
        data: [
          { code: 'ABO', description: 'ABO Blood Type' },
          { code: 'RH', description: 'Rh Factor' }
        ]
      });
      tick();

      expect(result.length).toBe(2);
      expect(result[0]).toEqual({ value: 'ABO', display: 'ABO Blood Type' });
      expect(result[1]).toEqual({ value: 'RH', display: 'Rh Factor' });
    }));

    it('should handle PascalCase response and fall back to code when description is missing', fakeAsync(() => {
      let result: any;
      service.getAntigenTypes().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor/dropdowns/antigen-types'));
      req.flush({ Data: [{ Code: 'ABO' }] });
      tick();

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({ value: 'ABO', display: 'ABO' });
    }));

    it('should propagate error', fakeAsync(() => {
      let error: any;
      service.getAntigenTypes().subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor/dropdowns/antigen-types'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getAntigenGroups', () => {
    it('should fetch and map antigen group options', fakeAsync(() => {
      let result: any;
      service.getAntigenGroups().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor/dropdowns/antigen-groups'));
      expect(req.request.method).toBe('GET');
      req.flush({
        data: [
          { code: 'GRP1', description: 'Group 1' },
          { code: 'GRP2', description: 'Group 2' }
        ]
      });
      tick();

      expect(result.length).toBe(2);
      expect(result[0]).toEqual({ value: 'GRP1', display: 'Group 1' });
      expect(result[1]).toEqual({ value: 'GRP2', display: 'Group 2' });
    }));

    it('should handle PascalCase response and fall back to code when description is missing', fakeAsync(() => {
      let result: any;
      service.getAntigenGroups().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor/dropdowns/antigen-groups'));
      req.flush({ Data: [{ Code: 'GRP1' }] });
      tick();

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({ value: 'GRP1', display: 'GRP1' });
    }));

    it('should propagate error', fakeAsync(() => {
      let error: any;
      service.getAntigenGroups().subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor/dropdowns/antigen-groups'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getTestGroups', () => {
    it('should fetch and map test group options with formatted display', fakeAsync(() => {
      let result: any;
      service.getTestGroups().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor/dropdowns/test-groups'));
      expect(req.request.method).toBe('GET');
      req.flush({
        data: [
          { code: 'BLOOD', description: 'Blood Group' },
          { code: 'SEROL', description: 'Serology' }
        ]
      });
      tick();

      expect(result.length).toBe(2);
      expect(result[0]).toEqual({ value: 'BLOOD', display: 'BLOOD - Blood Group' });
      expect(result[1]).toEqual({ value: 'SEROL', display: 'SEROL - Serology' });
    }));

    it('should display only code when description is empty', fakeAsync(() => {
      let result: any;
      service.getTestGroups().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor/dropdowns/test-groups'));
      req.flush({ data: [{ code: 'OTHER', description: '' }] });
      tick();

      expect(result[0]).toEqual({ value: 'OTHER', display: 'OTHER' });
    }));

    it('should propagate error', fakeAsync(() => {
      let error: any;
      service.getTestGroups().subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor/dropdowns/test-groups'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('createTest', () => {
    it('should post create request', fakeAsync(() => {
      const dto = {
        TestId: 'NEW01',
        Description: 'New Test',
        ShortId: 'NT1',
        ProfileTest: false,
        TestGroup: 'BLOOD',
        ViewLevel: 1,
        EffectiveDate: '2025-01-01T00:00:00.000Z',
        InsertUser: 'TESTUSER'
      };

      let result: any;
      service.createTest(dto).subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ success: true });
      tick();

      expect(result).toBeTruthy();
    }));

    it('should propagate error', fakeAsync(() => {
      let error: any;
      service.createTest({ TestId: 'X' } as any).subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor'));
      req.flush('Bad request', { status: 400, statusText: 'Bad Request' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getViewLevelLimit', () => {
    it('should fetch and parse view level limit from item.Viewlimit', fakeAsync(() => {
      let result: any;
      service.getViewLevelLimit().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/donor-interdictions/view-limit'));
      expect(req.request.method).toBe('GET');
      req.flush({ item: { Viewlimit: '5' } });
      tick();

      expect(result).toBe(5);
    }));

    it('should fall back to data.viewlimit', fakeAsync(() => {
      let result: any;
      service.getViewLevelLimit().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/donor-interdictions/view-limit'));
      req.flush({ data: { viewlimit: '3' } });
      tick();

      expect(result).toBe(3);
    }));

    it('should return 0 for non-numeric value', fakeAsync(() => {
      let result: any;
      service.getViewLevelLimit().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/donor-interdictions/view-limit'));
      req.flush({ item: {} });
      tick();

      expect(result).toBe(0);
    }));

    it('should propagate error', fakeAsync(() => {
      let error: any;
      service.getViewLevelLimit().subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/donor-interdictions/view-limit'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('updateTest', () => {
    it('should put update request with testId in URL', fakeAsync(() => {
      const dto = {
        Description: 'Updated Test',
        ShortId: 'UT1',
        ProfileTest: true,
        TestGroup: 'SEROL',
        ViewLevel: 2,
        EffectiveDate: '2025-01-01T00:00:00.000Z'
      };

      let result: any;
      service.updateTest('ABID', dto).subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor/ABID'));
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true });
      tick();

      expect(result).toBeTruthy();
    }));

    it('should propagate error', fakeAsync(() => {
      let error: any;
      service.updateTest('ABID', {} as any).subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-tests-donor/ABID'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getFilterValues', () => {
    it('should fetch and map filter values', fakeAsync(() => {
      let result: any;
      service.getFilterValues().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-test-results-donor/filter-values'));
      expect(req.request.method).toBe('GET');
      req.flush({
        data: {
          Interdictions: ['D01', 'D02', 'D03']
        }
      });
      tick();

      expect(result.interdictions.length).toBe(3);
      expect(result.interdictions[0]).toEqual({ value: 'D01', display: 'D01' });
    }));

    it('should propagate error', fakeAsync(() => {
      let error: any;
      service.getFilterValues().subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-test-results-donor/filter-values'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getEditModeDropdowns', () => {
    it('should fetch and map edit mode dropdown options with formatted display', fakeAsync(() => {
      let result: any;
      service.getEditModeDropdowns().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-test-results-donor/dropdowns/tests'));
      expect(req.request.method).toBe('GET');
      req.flush({
        data: [
          { testId: 'ABID', description: 'ABO Blood Type' },
          { testId: 'ABSC', description: 'Screen' }
        ]
      });
      tick();

      expect(result.tests.length).toBe(2);
      expect(result.tests[0]).toEqual({ value: 'ABID', display: 'ABID - ABO Blood Type' });
      expect(result.tests[1]).toEqual({ value: 'ABSC', display: 'ABSC - Screen' });
      expect(result.interdictions).toEqual([]);
      expect(result.resultCodes).toEqual([]);
    }));

    it('should handle PascalCase response', fakeAsync(() => {
      let result: any;
      service.getEditModeDropdowns().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-test-results-donor/dropdowns/tests'));
      req.flush({ Data: [{ TestId: 'T1', Description: 'Test One' }] });
      tick();

      expect(result.tests[0]).toEqual({ value: 'T1', display: 'T1 - Test One' });
    }));

    it('should propagate error', fakeAsync(() => {
      let error: any;
      service.getEditModeDropdowns().subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-test-results-donor/dropdowns/tests'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getInterdictionDropdowns', () => {
    it('should fetch and map interdiction dropdown options', fakeAsync(() => {
      let result: any;
      service.getInterdictionDropdowns().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r =>
        r.url.includes('/api/v1/define-test-results-donor/dropdowns/interdictions') &&
        !r.url.includes('interdictions/')
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        data: [
          { code: 'D01', description: 'Defer 1 year' },
          { code: 'D02', description: 'Defer 2 years' }
        ]
      });
      tick();

      expect(result.length).toBe(2);
      expect(result[0]).toEqual({ value: 'D01', display: 'D01 - Defer 1 year' });
      expect(result[1]).toEqual({ value: 'D02', display: 'D02 - Defer 2 years' });
    }));

    it('should propagate error', fakeAsync(() => {
      let error: any;
      service.getInterdictionDropdowns().subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r =>
        r.url.includes('/api/v1/define-test-results-donor/dropdowns/interdictions') &&
        !r.url.includes('interdictions/')
      );
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getInterdictionDropdownsByTestId', () => {
    it('should fetch interdictions filtered by test ID', fakeAsync(() => {
      let result: any;
      service.getInterdictionDropdownsByTestId('ABID').subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r =>
        r.url.includes('/api/v1/define-test-results-donor/dropdowns/interdictions/ABID')
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        data: [
          { code: 'D01', description: 'Defer 1 year' }
        ]
      });
      tick();

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({ value: 'D01', display: 'D01 - Defer 1 year' });
    }));

    it('should handle PascalCase response with no description', fakeAsync(() => {
      let result: any;
      service.getInterdictionDropdownsByTestId('ABID').subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r =>
        r.url.includes('/api/v1/define-test-results-donor/dropdowns/interdictions/ABID')
      );
      req.flush({ Data: [{ Code: 'D01' }] });
      tick();

      expect(result[0]).toEqual({ value: 'D01', display: 'D01' });
    }));

    it('should propagate error', fakeAsync(() => {
      let error: any;
      service.getInterdictionDropdownsByTestId('ABID').subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r =>
        r.url.includes('/api/v1/define-test-results-donor/dropdowns/interdictions/ABID')
      );
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getResultCodeDropdowns', () => {
    it('should fetch and map result code dropdown options', fakeAsync(() => {
      let result: any;
      service.getResultCodeDropdowns().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-test-results-donor/dropdowns/result-codes'));
      expect(req.request.method).toBe('GET');
      req.flush({
        data: [
          { code: 'POS', description: 'Positive' },
          { code: 'NEG', description: 'Negative' }
        ]
      });
      tick();

      expect(result.length).toBe(2);
      expect(result[0]).toEqual({ value: 'POS', display: 'POS - Positive' });
      expect(result[1]).toEqual({ value: 'NEG', display: 'NEG - Negative' });
    }));

    it('should handle PascalCase response with no description', fakeAsync(() => {
      let result: any;
      service.getResultCodeDropdowns().subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-test-results-donor/dropdowns/result-codes'));
      req.flush({ Data: [{ Code: 'IND' }] });
      tick();

      expect(result[0]).toEqual({ value: 'IND', display: 'IND' });
    }));

    it('should propagate error', fakeAsync(() => {
      let error: any;
      service.getResultCodeDropdowns().subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('/api/v1/define-test-results-donor/dropdowns/result-codes'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('getDonorTestResults', () => {
    it('should return empty result when testId is not provided', fakeAsync(() => {
      let result: any;
      service.getDonorTestResults({}).subscribe(r => result = r);
      tick();

      expect(result).toEqual({ data: [], totalRecords: 0 });
    }));

    it('should post filter request with testId as query param', fakeAsync(() => {
      let result: any;
      service.getDonorTestResults({ testId: 'ABID' }).subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r =>
        r.url.includes('/api/v1/define-test-results-donor/filter-by-testid') &&
        r.url.includes('testId=ABID')
      );
      expect(req.request.method).toBe('POST');
      req.flush({
        data: [
          {
            TestId: 'ABID',
            ChapterId: 'CH1',
            ResultCode: 'POS',
            Interdiction1: 'D01',
            Interdiction2: '',
            Interdiction3: '',
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
      expect(result.data[0].testId).toBe('ABID');
      expect(result.data[0].chapterId).toBe('CH1');
      expect(result.data[0].resultCode).toBe('POS');
      expect(result.data[0].interdiction1).toBe('D01');
      expect(result.totalRecords).toBe(1);
    }));

    it('should include filter body parameters with correct casing', fakeAsync(() => {
      service.getDonorTestResults({
        testId: 'ABID',
        interdiction: 'D01',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        searchKeyword: 'POS'
      }).subscribe();
      tick();

      const req = httpMock.expectOne(r => r.url.includes('testId=ABID'));
      const body = req.request.body;
      expect(body.interdiction).toBe('D01');
      expect(body.effectivePeriod).toBe('AFTER');
      expect(body.searchKeyword).toBe('POS');
      req.flush({ data: [], total: 0 });
    }));

    it('should convert terminationDatePeriod to uppercase', fakeAsync(() => {
      service.getDonorTestResults({
        testId: 'ABID',
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31')
      }).subscribe();
      tick();

      const req = httpMock.expectOne(r => r.url.includes('testId=ABID'));
      const body = req.request.body;
      expect(body.terminationPeriod).toBe('BEFORE');
      req.flush({ data: [], total: 0 });
    }));

    it('should propagate error', fakeAsync(() => {
      let error: any;
      service.getDonorTestResults({ testId: 'ABID' }).subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('testId=ABID'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });

  describe('saveBulkDonorTestResults', () => {
    it('should post bulk upsert with testId as query param', fakeAsync(() => {
      const dto: DefineTestResultsDonorBulkUpsertDto = {
        Records: [{
          ResultCode: 'POS',
          Interdiction1: 'D01',
          EffectiveDate: '2024-01-01T00:00:00.000Z'
        }]
      };

      let result: any;
      service.saveBulkDonorTestResults('ABID', dto).subscribe(r => result = r);
      tick();

      const req = httpMock.expectOne(r =>
        r.url.includes('/api/v1/define-test-results-donor/bulk/upsert') &&
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

    it('should propagate error', fakeAsync(() => {
      const dto: DefineTestResultsDonorBulkUpsertDto = { Records: [] };
      let error: any;
      service.saveBulkDonorTestResults('ABID', dto).subscribe({ error: e => error = e });
      tick();

      const req = httpMock.expectOne(r => r.url.includes('testId=ABID'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      tick();

      expect(error).toBeTruthy();
    }));
  });
});
