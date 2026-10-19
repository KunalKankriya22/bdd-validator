import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WksService } from './wks.service';
import { environment } from '../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  TestBatchDto,
  CreateTestBatchRequestDto,
  UpdateTestBatchRequestDto,
  AddTestRequestDto,
  AddUnitRequestDto,
  ApiResponse,
} from './wks.models';

describe('WksService', () => {
  let service: WksService;
  let httpMock: HttpTestingController;

  const mockTestBatch: TestBatchDto = {
    tbId: '2026-1234-TB',
    testChapterId: 'CHAP',
    startWorkNumber: 1,
    testingLabCode: '99',
    insertDate: '2026-06-22T10:00:00Z',
    insertUser: 'USER01',
    tests: [
      {
        testId: 'ABO',
        testKitId: 'KIT-001',
        testDesc: 'ABO Blood Type',
        testGroup: 'BLOOD',
      },
    ],
    units: [
      {
        seqNo: 1,
        unitId: '1234567890123',
        collDate: '2026-06-20T00:00:00Z',
        chapterId: 'CHAP',
        checkDigit: '45',
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WksService],
    });

    service = TestBed.inject(WksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getTestBatch', () => {
    it('should retrieve a test batch by ID', () => {
      const tbId = '2026-1234-TB';
      const mockResponse: ApiResponse<TestBatchDto> = {
        success: true,
        statusCode: 200,
        message: 'Test batch retrieved successfully',
        data: [mockTestBatch],
        item: mockTestBatch,
        total: 1,
      };

      service.getTestBatch(tbId).subscribe((batch) => {
        expect(batch).toEqual(mockTestBatch);
        expect(batch.tbId).toBe(tbId);
        expect(batch.tests.length).toBe(1);
        expect(batch.units.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.TEST_BATCH.GET(tbId)}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle array data response', () => {
      const tbId = '2026-1234-TB';
      const mockResponse: ApiResponse<TestBatchDto> = {
        success: true,
        statusCode: 200,
        data: [mockTestBatch],
      };

      service.getTestBatch(tbId).subscribe((batch) => {
        expect(batch).toEqual(mockTestBatch);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.TEST_BATCH.GET(tbId)}`);
      req.flush(mockResponse);
    });
  });

  describe('createTestBatch', () => {
    it('should create a new test batch', () => {
      const request: CreateTestBatchRequestDto = {
        startWorkNumber: 1,
        testingLabCode: '99',
        tests: [
          {
            testId: 'ABO',
            testKitId: 'KIT-001',
          },
        ],
        units: [
          {
            unitId: '1234567890123',
          },
        ],
      };

      const mockResponse: ApiResponse<TestBatchDto> = {
        success: true,
        statusCode: 201,
        message: 'Test batch created successfully',
        data: [mockTestBatch],
        item: mockTestBatch,
        total: 1,
      };

      service.createTestBatch(request).subscribe((batch) => {
        expect(batch).toEqual(mockTestBatch);
        expect(batch.tbId).toBe('2026-1234-TB');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.TEST_BATCH.CREATE}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('updateTestBatch', () => {
    it('should update an existing test batch', () => {
      const tbId = '2026-1234-TB';
      const request: UpdateTestBatchRequestDto = {
        startWorkNumber: 10,
      };

      const updatedBatch = { ...mockTestBatch, startWorkNumber: 10 };
      const mockResponse: ApiResponse<TestBatchDto> = {
        success: true,
        statusCode: 200,
        message: 'Test batch updated successfully',
        data: [updatedBatch],
        item: updatedBatch,
      };

      service.updateTestBatch(tbId, request).subscribe((batch) => {
        expect(batch.startWorkNumber).toBe(10);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.TEST_BATCH.UPDATE(tbId)}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('addTestToBatch', () => {
    it('should add a test to an existing batch', () => {
      const tbId = '2026-1234-TB';
      const request: AddTestRequestDto = {
        testId: 'HIV',
        testKitId: 'KIT-005',
      };

      const mockResponse: ApiResponse<boolean> = {
        success: true,
        statusCode: 200,
        message: 'Test added to batch successfully',
        data: [true],
        item: true,
      };

      service.addTestToBatch(tbId, request).subscribe((result) => {
        expect(result).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.TEST_BATCH.ADD_TEST(tbId)}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('addUnitToBatch', () => {
    it('should add a unit to an existing batch', () => {
      const tbId = '2026-1234-TB';
      const request: AddUnitRequestDto = {
        unitId: '1234567890125',
      };

      const mockResponse: ApiResponse<boolean> = {
        success: true,
        statusCode: 200,
        message: 'Unit added to batch successfully',
        data: [true],
        item: true,
      };

      service.addUnitToBatch(tbId, request).subscribe((result) => {
        expect(result).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.TEST_BATCH.ADD_UNIT(tbId)}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });
  describe('getTestBatches', () => {
    it('should retrieve available test batches', () => {
      const mockBatches = [
        { tbId: '2026-1234-TB', description: 'Batch 1234' },
        { tbId: '2026-5678-TB', description: 'Batch 5678' },
      ];

      const mockResponse: ApiResponse<typeof mockBatches> = {
        success: true,
        statusCode: 200,
        data: mockBatches,
      };

      service.getTestBatches().subscribe((batches) => {
        expect(batches.length).toBe(2);
        expect(batches[0].tbId).toBe('2026-1234-TB');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.TEST_BATCH.LIST}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


    it('should return empty array for invalid response', () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        statusCode: 200,
      };

      service.getTestBatches().subscribe((batches) => {
        expect(batches).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.TEST_BATCH.LIST}`);
      req.flush(mockResponse);
    });
  });

  describe('getAvailableTests', () => {
    it('should retrieve available tests', () => {
      const mockTests = [
        { testId: 'ABO', description: 'ABO Blood Type' },
        { testId: 'RH', description: 'Rh Factor' },
      ];

      const mockResponse: ApiResponse<typeof mockTests> = {
        success: true,
        statusCode: 200,
        data: mockTests,
      };

      service.getAvailableTests().subscribe((tests) => {
        expect(tests.length).toBe(2);
        expect(tests[0].testId).toBe('ABO');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.TEST_BATCH.AVAILABLE_TESTS}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getTestKits', () => {
    it('should retrieve test kits for a specific test', () => {
      const testId = 'ABO';
      const mockKits = [
        {
          kitId: 'KIT-001',
          reviewedBy: 'SIVA',
          labCode: 'RT',
          reagentType: 'C',
          name: 'ABO Positive',
          expiryDate: '12-DEC-2025',
        },
      ];

      const mockResponse: ApiResponse<typeof mockKits> = {
        success: true,
        statusCode: 200,
        data: mockKits,
      };

      service.getTestKits(testId).subscribe((kits) => {
        expect(kits.length).toBe(1);
        expect(kits[0].kitId).toBe('KIT-001');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.TEST_BATCH.TEST_KITS(testId)}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getLabCodes', () => {
    it('should retrieve available lab codes', () => {
      const mockLabCodes = [
        { labCode: '99', description: 'Main Lab' },
        { labCode: '01', description: 'Branch Lab' },
      ];

      const mockResponse: ApiResponse<typeof mockLabCodes> = {
        success: true,
        statusCode: 200,
        data: mockLabCodes,
      };

      service.getLabCodes().subscribe((codes) => {
        expect(codes.length).toBe(2);
        expect(codes[0].labCode).toBe('99');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.TEST_BATCH.LAB_CODES}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
