import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VerifyTestObservationsTech2ApiService } from './verify-test-observations-tech2-api.service';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  WorksheetDto,
  TestDto,
  TestBandDto,
  PendingUnitDto,
  VerifyResultsRequestDto,
  ApiResponse,
  BandResultLookupDto,
  ValidResultDto,
  TestTypeMetadataDto,
  CombinationResultDto,
  TestTypeDto,
  ControlValueDto,
  AdditionalBandDto,
  NoteResponseDto,
  CheckExistingResultDto,
} from '../models/verify-test-observations-tech2.model';

describe('VerifyTestObservationsTech2ApiService', () => {
  let service: VerifyTestObservationsTech2ApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${API.VERIFY_TEST_OBSERVATIONS_TECH2.BASE}`;

  const mockWorksheets: WorksheetDto[] = [
    { tbId: 'TB001', pendingUnitsCount: 5 },
    { tbId: 'TB002', pendingUnitsCount: 3 }
  ];

  const mockTests: TestDto[] = [
    {
      testId: 'ABO',
      testDesc: 'ABO Blood Grouping',
      testType: 'M',
      testTypeDesc: 'Manual',
      pendingUnitsCount: 3
    }
  ];

  const mockTestBands: TestBandDto[] = [
    { bandSeq: 1, bandName: 'A1' },
    { bandSeq: 2, bandName: 'B' }
  ];

  const mockPendingUnits: PendingUnitDto[] = [
    {
      unitId: 'A12345678',
      chkDigit: '89',
      collDate: '2026-05-20T00:00:00Z',
      tbId: 'TB001',
      testId: 'ABO',
      tbSeqNo: 1,
      tempResult1: '+,+,-,-',
      tempResult1UserId: 'TECH01',
      bandResults: []
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VerifyTestObservationsTech2ApiService]
    });

    service = TestBed.inject(VerifyTestObservationsTech2ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getWorksheets', () => {
    it('should retrieve worksheets with pending units', () => {
      const mockResponse: ApiResponse<WorksheetDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Worksheets retrieved successfully',
        data: mockWorksheets,
        total: 2
      };

      service.getWorksheets().subscribe(worksheets => {
        expect(worksheets).toEqual(mockWorksheets);
        expect(worksheets.length).toBe(2);
        expect(worksheets[0].tbId).toBe('TB001');
      });

      const req = httpMock.expectOne(`${baseUrl}/worksheets`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty worksheets response', () => {
      const mockResponse: ApiResponse<WorksheetDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Worksheets retrieved successfully',
        data: [],
        total: 0
      };

      service.getWorksheets().subscribe(worksheets => {
        expect(worksheets).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/worksheets`);
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', () => {
      const mockResponse: ApiResponse<WorksheetDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK'
      };

      service.getWorksheets().subscribe(worksheets => {
        expect(worksheets).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/worksheets`);
      req.flush(mockResponse);
    });
  });

  describe('getTests', () => {
    it('should retrieve tests for a worksheet', () => {
      const tbId = 'TB001';
      const mockResponse: ApiResponse<TestDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Tests retrieved successfully',
        data: mockTests,
        total: 1
      };

      service.getTests(tbId).subscribe(tests => {
        expect(tests).toEqual(mockTests);
        expect(tests[0].testId).toBe('ABO');
      });

      const req = httpMock.expectOne(`${baseUrl}/tests/${tbId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should encode special characters in tbId', () => {
      const tbId = 'TB 001';
      const mockResponse: ApiResponse<TestDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Tests retrieved successfully',
        data: []
      };

      service.getTests(tbId).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/tests/TB%20001`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', () => {
      const mockResponse: ApiResponse<TestDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK'
      };

      service.getTests('TB001').subscribe(tests => {
        expect(tests).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/tests/TB001`);
      req.flush(mockResponse);
    });
  });

  describe('getTestBands', () => {
    it('should retrieve test bands for a test and type', () => {
      const testId = 'ABO';
      const testType = 'M';
      const mockResponse: ApiResponse<TestBandDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Test bands retrieved successfully',
        data: mockTestBands
      };

      service.getTestBands(testId, testType).subscribe(bands => {
        expect(bands).toEqual(mockTestBands);
        expect(bands.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/test-bands/${testId}/${testType}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', () => {
      const mockResponse: ApiResponse<TestBandDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK'
      };

      service.getTestBands('ABO', 'M').subscribe(bands => {
        expect(bands).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/test-bands/ABO/M`);
      req.flush(mockResponse);
    });
  });

  describe('getPendingUnits', () => {
    it('should retrieve pending units for verification', () => {
      const tbId = 'TB001';
      const testId = 'ABO';
      const mockResponse: ApiResponse<PendingUnitDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Pending units retrieved successfully',
        data: mockPendingUnits
      };

      service.getPendingUnits(tbId, testId).subscribe(units => {
        expect(units).toEqual(mockPendingUnits);
        expect(units[0].unitId).toBe('A12345678');
      });

      const req = httpMock.expectOne(`${baseUrl}/pending-units/${tbId}/${testId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', () => {
      const mockResponse: ApiResponse<PendingUnitDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK'
      };

      service.getPendingUnits('TB001', 'ABO').subscribe(units => {
        expect(units).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/pending-units/TB001/ABO`);
      req.flush(mockResponse);
    });
  });

  describe('verifyResults', () => {
    it('should verify unit results successfully', () => {
      const request: VerifyResultsRequestDto = {
        tbId: 'TB001',
        testId: 'ABO',
        unitId: 'A12345678',
        tbSeqNo: 1,
        bandResults: [
          { bandSeq: 1, bandName: 'A1', resultCode: '+' },
          { bandSeq: 2, bandName: 'B', resultCode: '-' }
        ],
        notes: 'Verified successfully'
      };

      const mockResponse: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Unit results verified successfully'
      };

      service.verifyResults(request).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.message).toBe('Unit results verified successfully');
      });

      const req = httpMock.expectOne(`${baseUrl}/verify`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle same technician error', () => {
      const request: VerifyResultsRequestDto = {
        tbId: 'TB001',
        testId: 'ABO',
        unitId: 'A12345678',
        tbSeqNo: 1,
        bandResults: [
          { bandSeq: 1, bandName: 'A1', resultCode: '+' }
        ]
      };

      const mockError: ApiResponse<void> = {
        success: false,
        statusCode: 400,
        message: 'Tech 2 verification cannot be performed by the same technician who entered Tech 1 results',
        errorCode: 'VALIDATION_ERROR',
        errorResponse: {
          errorCode: 'VALIDATION_ERROR',
          error: 'Tech 2 verification cannot be performed by the same technician who entered Tech 1 results'
        }
      };

      service.verifyResults(request).subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.error.message).toContain('same technician');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/verify`);
      req.flush(mockError, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle no band results error', () => {
      const request: VerifyResultsRequestDto = {
        tbId: 'TB001',
        testId: 'ABO',
        unitId: 'A12345678',
        tbSeqNo: 1,
        bandResults: []
      };

      const mockError: ApiResponse<void> = {
        success: false,
        statusCode: 400,
        message: 'At least one band result must be provided',
        errorCode: 'VALIDATION_ERROR'
      };

      service.verifyResults(request).subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.error.message).toContain('At least one band result');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/verify`);
      req.flush(mockError, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getBandResults', () => {
    it('should retrieve band result options for a test', () => {
      const mockBandResults: BandResultLookupDto[] = [
        { result: '+', resultDesc: 'Positive' },
        { result: '-', resultDesc: 'Negative' }
      ];
      const mockResponse: ApiResponse<BandResultLookupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockBandResults
      };

      service.getBandResults('ABO').subscribe(results => {
        expect(results).toEqual(mockBandResults);
        expect(results.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/band-results/ABO`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', () => {
      const mockResponse: ApiResponse<BandResultLookupDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK'
      };

      service.getBandResults('ABO').subscribe(results => {
        expect(results).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/band-results/ABO`);
      req.flush(mockResponse);
    });
  });

  describe('getValidResults', () => {
    it('should retrieve valid results for a test', () => {
      const mockValidResults: ValidResultDto[] = [
        { resultStatus: 'A', resultDesc: 'Type A' },
        { resultStatus: 'B', resultDesc: 'Type B' }
      ];
      const mockResponse: ApiResponse<ValidResultDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockValidResults
      };

      service.getValidResults('ABO').subscribe(results => {
        expect(results).toEqual(mockValidResults);
        expect(results.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/valid-results/ABO`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', () => {
      const mockResponse: ApiResponse<ValidResultDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK'
      };

      service.getValidResults('ABO').subscribe(results => {
        expect(results).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/valid-results/ABO`);
      req.flush(mockResponse);
    });
  });

  describe('getTestTypeMetadata', () => {
    it('should retrieve test type metadata', () => {
      const mockMetadata: TestTypeMetadataDto = {
        testType: 'M',
        testTypeDesc: 'Manual',
        resUpdate: 'Y',
        othBnd: 'N',
        defaultControlValue: 'CV1',
        fullTechTwo: 'N'
      };
      const mockResponse: ApiResponse<TestTypeMetadataDto> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockMetadata
      };

      service.getTestTypeMetadata('ABO', 'M').subscribe(metadata => {
        expect(metadata).toEqual(mockMetadata);
        expect(metadata.testType).toBe('M');
      });

      const req = httpMock.expectOne(`${baseUrl}/test-type-metadata/ABO/M`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should encode special characters in params', () => {
      const mockResponse: ApiResponse<TestTypeMetadataDto> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: { testType: 'M', testTypeDesc: 'Manual', resUpdate: null, othBnd: null, defaultControlValue: null, fullTechTwo: null }
      };

      service.getTestTypeMetadata('AB O', 'M T').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/test-type-metadata/AB%20O/M%20T`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('validateCombination', () => {
    it('should validate band result combination', () => {
      const request = {
        testId: 'ABO',
        testType: 'M',
        bandResults: [{ bandSeq: 1, bandName: 'A1', resultCode: '+' }],
        controlValue: 'CV1'
      };
      const mockResult: CombinationResultDto = {
        sysResult: 'A+',
        sysResultDesc: 'A Positive',
        isMatch: true
      };
      const mockResponse: ApiResponse<CombinationResultDto> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockResult
      };

      service.validateCombination(request).subscribe(result => {
        expect(result).toEqual(mockResult);
        expect(result.isMatch).toBeTrue();
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-combination`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should return no match when combination is invalid', () => {
      const request = {
        testId: 'ABO',
        testType: 'M',
        bandResults: [{ bandSeq: 1, bandName: 'A1', resultCode: '+' }]
      };
      const mockResult: CombinationResultDto = {
        sysResult: null,
        sysResultDesc: null,
        isMatch: false
      };
      const mockResponse: ApiResponse<CombinationResultDto> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockResult
      };

      service.validateCombination(request).subscribe(result => {
        expect(result.isMatch).toBeFalse();
        expect(result.sysResult).toBeNull();
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-combination`);
      req.flush(mockResponse);
    });
  });

  describe('getTestTypes', () => {
    it('should retrieve test types for a test', () => {
      const mockTestTypes: TestTypeDto[] = [
        { testType: 'M', testTypeDesc: 'Manual' },
        { testType: 'A', testTypeDesc: 'Automated' }
      ];
      const mockResponse: ApiResponse<TestTypeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockTestTypes
      };

      service.getTestTypes('ABO').subscribe(types => {
        expect(types).toEqual(mockTestTypes);
        expect(types.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/test-types/ABO`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', () => {
      const mockResponse: ApiResponse<TestTypeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK'
      };

      service.getTestTypes('ABO').subscribe(types => {
        expect(types).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/test-types/ABO`);
      req.flush(mockResponse);
    });
  });

  describe('getControlValues', () => {
    it('should retrieve control values for a test', () => {
      const mockControlValues: ControlValueDto[] = [
        { controlValue: 'CV1', description: 'Control 1' },
        { controlValue: 'CV2', description: 'Control 2' }
      ];
      const mockResponse: ApiResponse<ControlValueDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockControlValues
      };

      service.getControlValues('ABO').subscribe(values => {
        expect(values).toEqual(mockControlValues);
        expect(values.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/control-values/ABO`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', () => {
      const mockResponse: ApiResponse<ControlValueDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK'
      };

      service.getControlValues('ABO').subscribe(values => {
        expect(values).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/control-values/ABO`);
      req.flush(mockResponse);
    });
  });

  describe('getOtherBands', () => {
    it('should retrieve other bands with query params', () => {
      const mockBands: AdditionalBandDto[] = [
        { band1: 'X1', band2: 'Y1' }
      ];
      const mockResponse: ApiResponse<AdditionalBandDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockBands
      };

      service.getOtherBands('TB001', 'ABO', 'U001', 1).subscribe(bands => {
        expect(bands).toEqual(mockBands);
      });

      const req = httpMock.expectOne(
        `${baseUrl}/other-bands/TB001/ABO/U001?tbSeqNo=1`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('tbSeqNo')).toBe('1');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', () => {
      const mockResponse: ApiResponse<AdditionalBandDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK'
      };

      service.getOtherBands('TB001', 'ABO', 'U001', 1).subscribe(bands => {
        expect(bands).toEqual([]);
      });

      const req = httpMock.expectOne(
        `${baseUrl}/other-bands/TB001/ABO/U001?tbSeqNo=1`
      );
      req.flush(mockResponse);
    });
  });

  describe('getNotes', () => {
    it('should retrieve notes with query params', () => {
      const mockNotes: NoteResponseDto[] = [
        { noteId: 1, note: 'Test note', userId: 'USER01', insertDate: '2026-06-01' }
      ];
      const mockResponse: ApiResponse<NoteResponseDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockNotes
      };

      service.getNotes('TB001', 'ABO', 'U001', 1).subscribe(notes => {
        expect(notes).toEqual(mockNotes);
        expect(notes.length).toBe(1);
      });

      const req = httpMock.expectOne(
        `${baseUrl}/notes/TB001/ABO/U001?tbSeqNo=1`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('tbSeqNo')).toBe('1');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', () => {
      const mockResponse: ApiResponse<NoteResponseDto[]> = {
        success: true,
        statusCode: 200,
        message: 'OK'
      };

      service.getNotes('TB001', 'ABO', 'U001', 1).subscribe(notes => {
        expect(notes).toEqual([]);
      });

      const req = httpMock.expectOne(
        `${baseUrl}/notes/TB001/ABO/U001?tbSeqNo=1`
      );
      req.flush(mockResponse);
    });
  });

  describe('createNote', () => {
    it('should create a note and return the note ID', () => {
      const request = {
        tbId: 'TB001',
        testId: 'ABO',
        unitId: 'U001',
        tbSeqNo: 1,
        note: 'New test note'
      };
      const mockResponse: ApiResponse<number> = {
        success: true,
        statusCode: 200,
        message: 'Note created',
        data: 42
      };

      service.createNote(request).subscribe(noteId => {
        expect(noteId).toBe(42);
      });

      const req = httpMock.expectOne(`${baseUrl}/notes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('updateNote', () => {
    it('should update an existing note', () => {
      const request = {
        tbId: 'TB001',
        testId: 'ABO',
        unitId: 'U001',
        tbSeqNo: 1,
        note: 'Updated note'
      };
      const mockResponse: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Note updated'
      };

      service.updateNote(42, request).subscribe(result => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/notes/42`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('deleteNote', () => {
    it('should delete a note', () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Note deleted'
      };

      service.deleteNote(42).subscribe(result => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/notes/42`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('checkExisting', () => {
    it('should check for existing verification', () => {
      const mockResult: CheckExistingResultDto = {
        hasExistingResult: true,
        tempResult2UserId: 'TECH02'
      };
      const mockResponse: ApiResponse<CheckExistingResultDto> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockResult
      };

      service.checkExisting('TB001', 'ABO', 'U001', 1).subscribe(result => {
        expect(result.hasExistingResult).toBeTrue();
        expect(result.tempResult2UserId).toBe('TECH02');
      });

      const req = httpMock.expectOne(
        `${baseUrl}/check-existing/TB001/ABO/U001?tbSeqNo=1`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('tbSeqNo')).toBe('1');
      req.flush(mockResponse);
    });

    it('should return no existing result', () => {
      const mockResult: CheckExistingResultDto = {
        hasExistingResult: false
      };
      const mockResponse: ApiResponse<CheckExistingResultDto> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockResult
      };

      service.checkExisting('TB001', 'ABO', 'U001', 1).subscribe(result => {
        expect(result.hasExistingResult).toBeFalse();
      });

      const req = httpMock.expectOne(
        `${baseUrl}/check-existing/TB001/ABO/U001?tbSeqNo=1`
      );
      req.flush(mockResponse);
    });
  });

  describe('clearVerification', () => {
    it('should clear an existing verification', () => {
      const request = {
        tbId: 'TB001',
        testId: 'ABO',
        unitId: 'U001',
        tbSeqNo: 1
      };
      const mockResponse: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Verification cleared'
      };

      service.clearVerification(request).subscribe(response => {
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${baseUrl}/clear-verification`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('saveOtherBands', () => {
    it('should save other band results', () => {
      const request = {
        tbId: 'TB001',
        testId: 'ABO',
        unitId: 'U001',
        tbSeqNo: 1,
        otherBands: [{ band1: 'X', band2: 'Y' }]
      };
      const mockResponse: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Other bands saved'
      };

      service.saveOtherBands(request).subscribe(response => {
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${baseUrl}/other-bands`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('deleteOtherBands', () => {
    it('should delete other band results', () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Other bands deleted'
      };

      service.deleteOtherBands('TB001', 'ABO', 'U001', 1).subscribe(result => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/other-bands/TB001/ABO/U001/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });
});
