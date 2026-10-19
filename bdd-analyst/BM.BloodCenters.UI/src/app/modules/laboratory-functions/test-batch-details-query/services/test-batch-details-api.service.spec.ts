import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { TestBatchDetailsApiService } from './test-batch-details-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  WorksheetLovDto,
  TestIdLovDto,
  TestBatchDetailsResult,
  ScheduledTestDto,
  UnscheduledTestDto,
  HoldingTestDto,
  TestBatchParmDto,
  BatchNoteDto,
  BatchNotesResponse,
  BatchNoteDeleteResponse,
  ApiListResponse,
  ApiSingleResult
} from '../models/test-batch-details.model';

describe('TestBatchDetailsApiService', () => {
  let service: TestBatchDetailsApiService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockWorksheets: WorksheetLovDto[] = [
    { tbId: 'TB001', testId: 'TEST01' },
    { tbId: 'TB002', testId: 'TEST02' }
  ];

  const mockTests: TestIdLovDto[] = [
    { testId: 'TEST01', testDesc: 'HIV Antibody Test' },
    { testId: 'TEST02', testDesc: 'Hepatitis B Surface Antigen' }
  ];

  const mockDetails: TestBatchDetailsResult = {
    worksheetId: 'TB001',
    testId: 'TEST01',
    testDesc: 'HIV Antibody Test',
    firstUnitId: 'U001',
    firstChkDigit: '1',
    lastUnitId: 'U050',
    lastChkDigit: '5',
    testKitId: 'KIT01',
    testType: 'E',
    cutOffValue: '0.5',
    reconcileFlag: 'Y',
    parmCheckFlag: 'N',
    kitLotNumber: 'LOT123',
    totalUnits: 50,
    hasScheduledTests: true,
    hasUnscheduledTests: false,
    hasHoldingTests: true,
    hasParameters: true,
    hasDocuments: false,
    reagents: [
      {
        reagentType: 'R',
        reagentTypeDesc: 'Reagent',
        reagentName: 'Anti-HIV',
        expiryDate: '2027-01-15',
        channel: 1,
        supplierName: 'Supplier A',
        lotNumber: 'RL001'
      }
    ]
  };

  const mockScheduledTests: ScheduledTestDto[] = [
    {
      unitId: 'U001', chkDigit: '1', collDate: '2026-07-01',
      testSeqNo: 1, testState: 'C', tbId: 'TB001', tbSeqNo: 1,
      wellNumber: 'A1', absorbance: '0.123', ratio: '0.5',
      resultDats: '2026-07-02', testingLabCode: 'LAB01',
      resultStatus1: 'P', interpDesc: 'Positive'
    }
  ];

  const mockUnscheduledTests: UnscheduledTestDto[] = [
    {
      unitId: 'U010', chkDigit: '2', collDate: '2026-07-03',
      testSeqNo: 2, testState: 'P', tbId: 'TB001', tbSeqNo: 2,
      wellNumber: 'B2', absorbance: '0.045', ratio: '0.2',
      resultDats: null, testingLabCode: 'LAB01',
      resultStatus1: null, resultStatus2: null,
      tempResult1: null, tempResult2: null,
      interpCode: null, interpDesc: null
    }
  ];

  const mockHoldingTests: HoldingTestDto[] = [
    {
      unitId: 'U020', chkDigit: '3', collDate: '2026-07-04',
      resultStatus1: 'H', interpDesc: 'Holding',
      tbSeqNo: 3, wellNumber: 'C3', absorbance: '0.300',
      ratio: '1.2', resultDats: '2026-07-05',
      testingLabCode: 'LAB02', resultUserId: 'USER01'
    }
  ];

  const mockParameters: TestBatchParmDto[] = [
    {
      parmCode: 'TEMP', description: 'Temperature',
      parmValue: '37', acceptFlag: 'Y',
      firstTech: 'TECH01', firstDate: '2026-07-01',
      secondTech: 'TECH02', secondDate: '2026-07-01'
    },
    {
      parmCode: 'PH', description: 'pH Level',
      parmValue: '7.4', acceptFlag: 'Y',
      firstTech: 'TECH01', firstDate: '2026-07-01',
      secondTech: null, secondDate: null
    }
  ];

  const mockNotes: BatchNoteDto[] = [
    {
      noteId: 'N001', noteSequence: 1, note: 'First note',
      auditKey: 101, insertDate: '2026-07-01T10:00:00Z',
      insertUser: 'USER01', insertUserName: 'John Doe',
      programId: 'PROG01', chapterId: 'CH01'
    },
    {
      noteId: 'N002', noteSequence: 2, note: 'Second note',
      auditKey: 102, insertDate: '2026-07-01T11:00:00Z',
      insertUser: 'USER02', insertUserName: 'Jane Smith',
      programId: 'PROG01', chapterId: 'CH01'
    }
  ];

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TestBatchDetailsApiService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(TestBatchDetailsApiService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTestBatchDetails', () => {
    it('should call API with worksheetId and testId', (done) => {
      apiService.get.and.returnValue(jasmine.createSpyObj('Observable', ['pipe']) as any);
      const worksheetId = 'TB001';
      const testId = 'TEST01';

      service.getTestBatchDetails(worksheetId, testId);

      expect(apiService.get).toHaveBeenCalledWith(
        API.TEST_BATCH_DETAILS_QUERY.DETAILS(worksheetId, testId)
      );

      done();
    });

    it('should return item when item is present in response', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const apiResponse: ApiSingleResult<TestBatchDetailsResult> = {
        data: [], item: mockDetails, message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getTestBatchDetails(worksheetId, testId).subscribe({
        next: result => {
          expect(result).toEqual(mockDetails);
          expect(result.worksheetId).toBe('TB001');
          expect(result.testId).toBe('TEST01');
          expect(result.totalUnits).toBe(50);
          expect(result.reagents.length).toBe(1);
          done();
        },
        error: done.fail
      });
    });

    it('should return data[0] when item is null', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const apiResponse: ApiSingleResult<TestBatchDetailsResult> = {
        data: [mockDetails], item: null as any, message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getTestBatchDetails(worksheetId, testId).subscribe({
        next: result => {
          expect(result).toEqual(mockDetails);
          expect(result.worksheetId).toBe('TB001');
          done();
        },
        error: done.fail
      });
    });

    it('should return data[0] when item is undefined', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const apiResponse = {
        data: [mockDetails], message: 'OK'
      } as ApiSingleResult<TestBatchDetailsResult>;

      apiService.get.and.returnValue(of(apiResponse));

      service.getTestBatchDetails(worksheetId, testId).subscribe({
        next: result => {
          expect(result).toEqual(mockDetails);
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error when API call fails', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const error = { statusCode: 500, message: 'Internal Server Error' };

      apiService.get.and.returnValue(throwError(() => error));

      service.getTestBatchDetails(worksheetId, testId).subscribe({
        next: () => done.fail('should have errored'),
        error: err => {
          expect(err.statusCode).toBe(500);
          done();
        }
      });
    });

    it('should call the correct API endpoint URL', (done) => {
      const worksheetId = 'WS-100';
      const testId = 'TST-200';
      const apiResponse: ApiSingleResult<TestBatchDetailsResult> = {
        data: [mockDetails], item: mockDetails, message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getTestBatchDetails(worksheetId, testId).subscribe({
        next: () => {
          expect(apiService.get).toHaveBeenCalledWith(
            API.TEST_BATCH_DETAILS_QUERY.DETAILS(worksheetId, testId)
          );
          done();
        },
        error: done.fail
      });
    });
  });

  describe('getScheduledTests', () => {
    it('should call API with worksheetId and testId', (done) => {
      apiService.get.and.returnValue(jasmine.createSpyObj('Observable', ['pipe']) as any);
      const worksheetId = 'TB001';
      const testId = 'TEST01';

      service.getScheduledTests(worksheetId, testId);

      expect(apiService.get).toHaveBeenCalledWith(
        API.TEST_BATCH_DETAILS_QUERY.SCHEDULED_TESTS(worksheetId, testId)
      );

      done();
    });

    it('should return flattened scheduled tests array', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const apiResponse: ApiListResponse<ScheduledTestDto[]> = {
        data: [mockScheduledTests], message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getScheduledTests(worksheetId, testId).subscribe({
        next: result => {
          expect(result).toEqual(mockScheduledTests);
          expect(result.length).toBe(1);
          expect(result[0].unitId).toBe('U001');
          expect(result[0].testState).toBe('C');
          done();
        },
        error: done.fail
      });
    });

    it('should flatten nested arrays from response', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const secondTest: ScheduledTestDto = {
        unitId: 'U002', chkDigit: '2', collDate: '2026-07-02',
        testSeqNo: 2, testState: 'P', tbId: 'TB001', tbSeqNo: 2,
        wellNumber: 'A2', absorbance: '0.200', ratio: '0.8',
        resultDats: null, testingLabCode: 'LAB01',
        resultStatus1: null, interpDesc: null
      };
      const apiResponse: ApiListResponse<ScheduledTestDto[]> = {
        data: [mockScheduledTests, [secondTest]], message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getScheduledTests(worksheetId, testId).subscribe({
        next: result => {
          expect(result.length).toBe(2);
          expect(result[0].unitId).toBe('U001');
          expect(result[1].unitId).toBe('U002');
          done();
        },
        error: done.fail
      });
    });

    it('should return empty array when no scheduled tests', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const apiResponse: ApiListResponse<ScheduledTestDto[]> = {
        data: [], message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getScheduledTests(worksheetId, testId).subscribe({
        next: result => {
          expect(result).toEqual([]);
          expect(result.length).toBe(0);
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error when API call fails', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const error = { statusCode: 500, message: 'Server Error' };

      apiService.get.and.returnValue(throwError(() => error));

      service.getScheduledTests(worksheetId, testId).subscribe({
        next: () => done.fail('should have errored'),
        error: err => {
          expect(err.statusCode).toBe(500);
          done();
        }
      });
    });
  });

  describe('getUnscheduledTests', () => {
    it('should call API with worksheetId and testId', (done) => {
      apiService.get.and.returnValue(jasmine.createSpyObj('Observable', ['pipe']) as any);
      const worksheetId = 'TB001';
      const testId = 'TEST01';

      service.getUnscheduledTests(worksheetId, testId);

      expect(apiService.get).toHaveBeenCalledWith(
        API.TEST_BATCH_DETAILS_QUERY.UNSCHEDULED_TESTS(worksheetId, testId)
      );

      done();
    });

    it('should return flattened unscheduled tests array', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const apiResponse: ApiListResponse<UnscheduledTestDto[]> = {
        data: [mockUnscheduledTests], message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getUnscheduledTests(worksheetId, testId).subscribe({
        next: result => {
          expect(result).toEqual(mockUnscheduledTests);
          expect(result.length).toBe(1);
          expect(result[0].unitId).toBe('U010');
          expect(result[0].testState).toBe('P');
          done();
        },
        error: done.fail
      });
    });

    it('should return empty array when no unscheduled tests', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const apiResponse: ApiListResponse<UnscheduledTestDto[]> = {
        data: [], message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getUnscheduledTests(worksheetId, testId).subscribe({
        next: result => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error when API call fails', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const error = { statusCode: 404, message: 'Not Found' };

      apiService.get.and.returnValue(throwError(() => error));

      service.getUnscheduledTests(worksheetId, testId).subscribe({
        next: () => done.fail('should have errored'),
        error: err => {
          expect(err.statusCode).toBe(404);
          done();
        }
      });
    });
  });

  describe('getHoldingTests', () => {
    it('should call API with correct endpoint', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const apiResponse: ApiListResponse<HoldingTestDto[]> = {
        data: [mockHoldingTests], message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getHoldingTests(worksheetId, testId).subscribe({
        next: () => {
          expect(apiService.get).toHaveBeenCalledWith(
            API.TEST_BATCH_DETAILS_QUERY.HOLDING_TESTS(worksheetId, testId)
          );
          done();
        },
        error: done.fail
      });
    });

    it('should return flattened holding tests array', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const apiResponse: ApiListResponse<HoldingTestDto[]> = {
        data: [mockHoldingTests], message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getHoldingTests(worksheetId, testId).subscribe({
        next: result => {
          expect(result).toEqual(mockHoldingTests);
          expect(result.length).toBe(1);
          expect(result[0].unitId).toBe('U020');
          expect(result[0].resultStatus1).toBe('H');
          expect(result[0].resultUserId).toBe('USER01');
          done();
        },
        error: done.fail
      });
    });

    it('should return empty array when no holding tests', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const apiResponse: ApiListResponse<HoldingTestDto[]> = {
        data: [], message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getHoldingTests(worksheetId, testId).subscribe({
        next: result => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error when API call fails', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const error = { statusCode: 500, message: 'Server Error' };

      apiService.get.and.returnValue(throwError(() => error));

      service.getHoldingTests(worksheetId, testId).subscribe({
        next: () => done.fail('should have errored'),
        error: err => {
          expect(err.statusCode).toBe(500);
          done();
        }
      });
    });
  });

  describe('getParameters', () => {
    it('should call API with correct endpoint', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const apiResponse: ApiListResponse<TestBatchParmDto[]> = {
        data: [mockParameters], message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getParameters(worksheetId, testId).subscribe({
        next: () => {
          expect(apiService.get).toHaveBeenCalledWith(
            API.TEST_BATCH_DETAILS_QUERY.PARAMETERS(worksheetId, testId)
          );
          done();
        },
        error: done.fail
      });
    });

    it('should return flattened parameters array', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const apiResponse: ApiListResponse<TestBatchParmDto[]> = {
        data: [mockParameters], message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getParameters(worksheetId, testId).subscribe({
        next: result => {
          expect(result).toEqual(mockParameters);
          expect(result.length).toBe(2);
          expect(result[0].parmCode).toBe('TEMP');
          expect(result[0].parmValue).toBe('37');
          expect(result[1].parmCode).toBe('PH');
          done();
        },
        error: done.fail
      });
    });

    it('should return empty array when no parameters', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const apiResponse: ApiListResponse<TestBatchParmDto[]> = {
        data: [], message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getParameters(worksheetId, testId).subscribe({
        next: result => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error when API call fails', (done) => {
      const worksheetId = 'TB001';
      const testId = 'TEST01';
      const error = { statusCode: 500, message: 'Server Error' };

      apiService.get.and.returnValue(throwError(() => error));

      service.getParameters(worksheetId, testId).subscribe({
        next: () => done.fail('should have errored'),
        error: err => {
          expect(err.statusCode).toBe(500);
          done();
        }
      });
    });
  });

  describe('getRecentWorksheets', () => {
    it('should call API and extract data array from response', (done) => {
      apiService.get.and.returnValue({
        pipe: jasmine.createSpy('pipe').and.returnValue({
          subscribe: (handlers: any) => {
            handlers(mockWorksheets);
            return { unsubscribe: () => {} };
          }
        })
      } as any);

      service.getRecentWorksheets().subscribe(result => {
        expect(result).toEqual(mockWorksheets);
        expect(apiService.get).toHaveBeenCalledWith(
          API.TEST_BATCH_DETAILS_QUERY.WORKSHEETS
        );
        done();
      });
    });

    it('should return flattened worksheets from API response', (done) => {
      const apiResponse: ApiListResponse<WorksheetLovDto[]> = {
        data: [mockWorksheets], message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getRecentWorksheets().subscribe({
        next: result => {
          expect(result).toEqual(mockWorksheets);
          expect(result.length).toBe(2);
          expect(result[0].tbId).toBe('TB001');
          expect(result[1].tbId).toBe('TB002');
          done();
        },
        error: done.fail
      });
    });

    it('should return empty array when no worksheets', (done) => {
      const apiResponse: ApiListResponse<WorksheetLovDto[]> = {
        data: [], message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getRecentWorksheets().subscribe({
        next: result => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should call the correct API endpoint', (done) => {
      const apiResponse: ApiListResponse<WorksheetLovDto[]> = {
        data: [mockWorksheets], message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getRecentWorksheets().subscribe({
        next: () => {
          expect(apiService.get).toHaveBeenCalledWith(
            API.TEST_BATCH_DETAILS_QUERY.WORKSHEETS
          );
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error when API call fails', (done) => {
      const error = { statusCode: 503, message: 'Service Unavailable' };

      apiService.get.and.returnValue(throwError(() => error));

      service.getRecentWorksheets().subscribe({
        next: () => done.fail('should have errored'),
        error: err => {
          expect(err.statusCode).toBe(503);
          done();
        }
      });
    });
  });

  describe('getTestsForWorksheet', () => {
    it('should call API with worksheetId and extract data array', (done) => {
      const worksheetId = 'TB001';

      apiService.get.and.returnValue({
        pipe: jasmine.createSpy('pipe').and.returnValue({
          subscribe: (handlers: any) => {
            handlers(mockTests);
            return { unsubscribe: () => {} };
          }
        })
      } as any);

      service.getTestsForWorksheet(worksheetId).subscribe(result => {
        expect(result).toEqual(mockTests);
        expect(apiService.get).toHaveBeenCalledWith(
          API.TEST_BATCH_DETAILS_QUERY.TESTS_FOR_WORKSHEET(worksheetId)
        );
        done();
      });
    });

    it('should return flattened tests from API response', (done) => {
      const worksheetId = 'TB001';
      const apiResponse: ApiListResponse<TestIdLovDto[]> = {
        data: [mockTests], message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getTestsForWorksheet(worksheetId).subscribe({
        next: result => {
          expect(result).toEqual(mockTests);
          expect(result.length).toBe(2);
          expect(result[0].testId).toBe('TEST01');
          expect(result[1].testDesc).toBe('Hepatitis B Surface Antigen');
          done();
        },
        error: done.fail
      });
    });

    it('should return empty array when worksheet has no tests', (done) => {
      const worksheetId = 'TB999';
      const apiResponse: ApiListResponse<TestIdLovDto[]> = {
        data: [], message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getTestsForWorksheet(worksheetId).subscribe({
        next: result => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should call the correct API endpoint with worksheetId', (done) => {
      const worksheetId = 'WS-SPECIAL';
      const apiResponse: ApiListResponse<TestIdLovDto[]> = {
        data: [mockTests], message: 'OK'
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getTestsForWorksheet(worksheetId).subscribe({
        next: () => {
          expect(apiService.get).toHaveBeenCalledWith(
            API.TEST_BATCH_DETAILS_QUERY.TESTS_FOR_WORKSHEET(worksheetId)
          );
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error when API call fails', (done) => {
      const worksheetId = 'TB001';
      const error = { statusCode: 404, message: 'Worksheet not found' };

      apiService.get.and.returnValue(throwError(() => error));

      service.getTestsForWorksheet(worksheetId).subscribe({
        next: () => done.fail('should have errored'),
        error: err => {
          expect(err.statusCode).toBe(404);
          done();
        }
      });
    });
  });

  describe('getNotes', () => {
    it('should call API with correct endpoint', (done) => {
      const worksheetId = 'TB001';
      const apiResponse: BatchNotesResponse = {
        success: true, statusCode: 200, message: 'OK',
        total: 2, data: mockNotes
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getNotes(worksheetId).subscribe({
        next: () => {
          expect(apiService.get).toHaveBeenCalledWith(
            API.TEST_BATCH_DETAILS_QUERY.NOTES(worksheetId)
          );
          done();
        },
        error: done.fail
      });
    });

    it('should return notes data from response', (done) => {
      const worksheetId = 'TB001';
      const apiResponse: BatchNotesResponse = {
        success: true, statusCode: 200, message: 'OK',
        total: 2, data: mockNotes
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getNotes(worksheetId).subscribe({
        next: result => {
          expect(result).toEqual(mockNotes);
          expect(result.length).toBe(2);
          expect(result[0].note).toBe('First note');
          expect(result[0].auditKey).toBe(101);
          expect(result[1].insertUserName).toBe('Jane Smith');
          done();
        },
        error: done.fail
      });
    });

    it('should return empty array when no notes exist', (done) => {
      const worksheetId = 'TB001';
      const apiResponse: BatchNotesResponse = {
        success: true, statusCode: 200, message: 'OK',
        total: 0, data: []
      };

      apiService.get.and.returnValue(of(apiResponse));

      service.getNotes(worksheetId).subscribe({
        next: result => {
          expect(result).toEqual([]);
          expect(result.length).toBe(0);
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error when API call fails', (done) => {
      const worksheetId = 'TB001';
      const error = { statusCode: 500, message: 'Server Error' };

      apiService.get.and.returnValue(throwError(() => error));

      service.getNotes(worksheetId).subscribe({
        next: () => done.fail('should have errored'),
        error: err => {
          expect(err.statusCode).toBe(500);
          done();
        }
      });
    });
  });

  describe('addNote', () => {
    it('should call API post with correct endpoint and body', (done) => {
      const worksheetId = 'TB001';
      const noteText = 'New batch note';
      const apiResponse: BatchNotesResponse = {
        success: true, statusCode: 201, message: 'Created',
        total: 3, data: [...mockNotes, {
          noteId: 'N003', noteSequence: 3, note: noteText,
          auditKey: 103, insertDate: '2026-07-01T12:00:00Z',
          insertUser: 'USER01', insertUserName: 'John Doe',
          programId: 'PROG01', chapterId: 'CH01'
        }]
      };

      apiService.post.and.returnValue(of(apiResponse));

      service.addNote(worksheetId, noteText).subscribe({
        next: result => {
          expect(apiService.post).toHaveBeenCalledWith(
            API.TEST_BATCH_DETAILS_QUERY.NOTES(worksheetId),
            { note: noteText }
          );
          expect(result.length).toBe(3);
          expect(result[2].note).toBe('New batch note');
          done();
        },
        error: done.fail
      });
    });

    it('should return updated notes list after adding', (done) => {
      const worksheetId = 'TB001';
      const noteText = 'Added note';
      const apiResponse: BatchNotesResponse = {
        success: true, statusCode: 201, message: 'Created',
        total: 1, data: [{
          noteId: 'N001', noteSequence: 1, note: noteText,
          auditKey: 101, insertDate: '2026-07-01T10:00:00Z',
          insertUser: 'USER01', insertUserName: 'John Doe',
          programId: 'PROG01', chapterId: 'CH01'
        }]
      };

      apiService.post.and.returnValue(of(apiResponse));

      service.addNote(worksheetId, noteText).subscribe({
        next: result => {
          expect(result).toEqual(apiResponse.data);
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error when adding note fails', (done) => {
      const worksheetId = 'TB001';
      const noteText = 'Test note';
      const error = { statusCode: 400, message: 'Bad Request' };

      apiService.post.and.returnValue(throwError(() => error));

      service.addNote(worksheetId, noteText).subscribe({
        next: () => done.fail('should have errored'),
        error: err => {
          expect(err.statusCode).toBe(400);
          done();
        }
      });
    });
  });

  describe('updateNote', () => {
    it('should call API put with correct endpoint and body', (done) => {
      const worksheetId = 'TB001';
      const auditKey = 101;
      const updatedText = 'Updated note text';
      const apiResponse: BatchNotesResponse = {
        success: true, statusCode: 200, message: 'OK',
        total: 2, data: [{
          noteId: 'N001', noteSequence: 1, note: updatedText,
          auditKey: 101, insertDate: '2026-07-01T10:00:00Z',
          insertUser: 'USER01', insertUserName: 'John Doe',
          programId: 'PROG01', chapterId: 'CH01'
        }, mockNotes[1]]
      };

      apiService.put.and.returnValue(of(apiResponse));

      service.updateNote(worksheetId, auditKey, updatedText).subscribe({
        next: result => {
          expect(apiService.put).toHaveBeenCalledWith(
            API.TEST_BATCH_DETAILS_QUERY.NOTE(worksheetId, auditKey),
            { note: updatedText }
          );
          expect(result.length).toBe(2);
          expect(result[0].note).toBe('Updated note text');
          done();
        },
        error: done.fail
      });
    });

    it('should return updated notes list', (done) => {
      const worksheetId = 'TB001';
      const auditKey = 101;
      const updatedText = 'Changed content';
      const apiResponse: BatchNotesResponse = {
        success: true, statusCode: 200, message: 'OK',
        total: 1, data: [{
          noteId: 'N001', noteSequence: 1, note: updatedText,
          auditKey: 101, insertDate: '2026-07-01T10:00:00Z',
          insertUser: 'USER01', insertUserName: 'John Doe',
          programId: 'PROG01', chapterId: 'CH01'
        }]
      };

      apiService.put.and.returnValue(of(apiResponse));

      service.updateNote(worksheetId, auditKey, updatedText).subscribe({
        next: result => {
          expect(result).toEqual(apiResponse.data);
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error when update fails', (done) => {
      const worksheetId = 'TB001';
      const auditKey = 999;
      const updatedText = 'Updated note';
      const error = { statusCode: 404, message: 'Note not found' };

      apiService.put.and.returnValue(throwError(() => error));

      service.updateNote(worksheetId, auditKey, updatedText).subscribe({
        next: () => done.fail('should have errored'),
        error: err => {
          expect(err.statusCode).toBe(404);
          done();
        }
      });
    });
  });

  describe('deleteNote', () => {
    it('should call API delete with correct endpoint', (done) => {
      const worksheetId = 'TB001';
      const auditKey = 101;
      const apiResponse: BatchNoteDeleteResponse = {
        success: true, statusCode: 200, message: 'Deleted', item: true
      };

      apiService.delete.and.returnValue(of(apiResponse));

      service.deleteNote(worksheetId, auditKey).subscribe({
        next: () => {
          expect(apiService.delete).toHaveBeenCalledWith(
            API.TEST_BATCH_DETAILS_QUERY.NOTE(worksheetId, auditKey)
          );
          done();
        },
        error: done.fail
      });
    });

    it('should return true when deletion succeeds', (done) => {
      const worksheetId = 'TB001';
      const auditKey = 101;
      const apiResponse: BatchNoteDeleteResponse = {
        success: true, statusCode: 200, message: 'Deleted', item: true
      };

      apiService.delete.and.returnValue(of(apiResponse));

      service.deleteNote(worksheetId, auditKey).subscribe({
        next: result => {
          expect(result).toBe(true);
          done();
        },
        error: done.fail
      });
    });

    it('should return false when deletion reports failure', (done) => {
      const worksheetId = 'TB001';
      const auditKey = 101;
      const apiResponse: BatchNoteDeleteResponse = {
        success: false, statusCode: 200, message: 'Could not delete', item: false
      };

      apiService.delete.and.returnValue(of(apiResponse));

      service.deleteNote(worksheetId, auditKey).subscribe({
        next: result => {
          expect(result).toBe(false);
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error when deletion fails', (done) => {
      const worksheetId = 'TB001';
      const auditKey = 999;
      const error = { statusCode: 404, message: 'Note not found' };

      apiService.delete.and.returnValue(throwError(() => error));

      service.deleteNote(worksheetId, auditKey).subscribe({
        next: () => done.fail('should have errored'),
        error: err => {
          expect(err.statusCode).toBe(404);
          done();
        }
      });
    });
  });
});
