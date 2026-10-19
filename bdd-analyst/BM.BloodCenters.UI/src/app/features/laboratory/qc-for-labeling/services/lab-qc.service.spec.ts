import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LabQcService } from './lab-qc.service';
import { environment } from '../../../../../environments/environment';
import { LabQcSummaryDto, TestBatchDropdown, BatchUnitsResponse, SaveQcLabelRequest } from '../models/lab-qc-summary.model';
import { ComponentDto } from '../models/component.model';

describe('LabQcService', () => {
  let service: LabQcService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/lab-qc`;

  const mockComponentDto: ComponentDto = {
    unitId: '12345678',
    collDate: '2026-05-27T00:00:00Z',
    chapterId: 'CH001',
    productCode: 'RBC',
    abo: 'A',
    rh: 'POS',
    status: 'ACTIVE',
    poolId: null,
    expDate: '2026-06-27T00:00:00Z',
    lotNumber: 'LOT123',
    volume: 450.0,
    location: 'SHELF-A-01',
    modifiedDate: '2026-05-27T10:30:00Z',
    modifiedUser: 'LABTECH1',
    productDescription: 'Red Blood Cells',
    expirationDate: '2026-06-27T00:00:00Z',
    noteId: null,
    insertDate: '2026-05-27T08:00:00Z',
    insertUser: 'LABTECH1',
    componentPrefix: 'RBC',
    bagId: 'AHEO',
    systemLabelDecision: 'PASS',
    rejectReasonCode: null,
    labelDats: '2026-05-27T15:00:00Z',
    bagsUsed: 1
  };

  const mockLabQcSummary: LabQcSummaryDto = {
    components: [mockComponentDto],
    testResults: [
      {
        unitId: '12345678',
        collDate: '2026-05-27T00:00:00Z',
        chapterId: 'CH001',
        testId: 'ABO',
        testSeqNo: 1,
        testResult: 'A',
        testDate: '2026-05-27T09:00:00Z',
        performedBy: 'TECH001',
        comments: null,
        resultCode: 'POS',
        cancelFlag: null,
        absorbance: null,
        resultStatus: null,
        testDescription: 'ABO Typing',
        resultStatusDescription: null,
        tbId: 'TB001',
        ratio: null,
        resultStatus1: null
      }
    ],
    testBase: [
      {
        unitId: '12345678',
        collDate: '2026-05-27T00:00:00Z',
        chapterId: 'CH001',
        testId: 'ABO',
        testSeqNo: 1,
        testDescription: 'ABO Typing',
        testType: 'REQUIRED',
        requiredFlag: 'Y',
        cancelFlag: null
      }
    ]
  };

  const mockBatches: TestBatchDropdown[] = [
    { tbId: 'TB001', testChapterId: 'CH001', insertDate: '2026-05-27T00:00:00Z' },
    { tbId: 'TB002', testChapterId: 'CH001', insertDate: '2026-05-28T00:00:00Z' }
  ];

  const mockBatchUnits: BatchUnitsResponse = {
    tbId: 'TB001',
    testChapterId: 'CH001',
    unscheduledUnitCount: 2,
    units: [
      {
        sequenceNumber: 1,
        unitId: '12345678',
        displayUnitId: null,
        collDate: '2026-05-27',
        chapterId: 'CH001',
        checkDigit: null,
        donorInterface: 'Y',
        testingFlag: 'Y',
        nursingAuditFlag: 'Y',
        componentReview: 'Y',
        qcLabelFlag: 'Y'
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LabQcService]
    });

    service = TestBed.inject(LabQcService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getTestBatches', () => {
    it('should fetch test batches successfully', () => {
      service.getTestBatches().subscribe((data) => {
        expect(data).toEqual(mockBatches);
        expect(data.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/test-batches`);
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        message: 'Test batches retrieved successfully',
        statusCode: 200,
        item: mockBatches,
        total: 2
      });
    });

    it('should handle server error', () => {
      service.getTestBatches().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/test-batches`);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getBatchUnits', () => {
    it('should fetch batch units successfully', () => {
      service.getBatchUnits('TB001').subscribe((data) => {
        expect(data).toEqual(mockBatchUnits);
        expect(data.units.length).toBe(1);
        expect(data.unscheduledUnitCount).toBe(2);
      });

      const req = httpMock.expectOne((request) => {
        return request.url === `${baseUrl}/batch-units` &&
               request.params.get('tbId') === 'TB001';
      });
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        message: 'Batch units retrieved successfully',
        statusCode: 200,
        item: mockBatchUnits
      });
    });

    it('should handle 400 error when tbId is missing', () => {
      service.getBatchUnits('').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne((request) => {
        return request.url === `${baseUrl}/batch-units`;
      });
      req.flush(
        { success: false, message: 'tbId is required', statusCode: 400 },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('getQcSummary', () => {
    it('should fetch QC summary successfully', () => {
      const unitId = '12345678';
      const collDate = '2026-05-27';

      service.getQcSummary(unitId, collDate).subscribe((data) => {
        expect(data).toEqual(mockLabQcSummary);
        expect(data.components[0].unitId).toBe(unitId);
        expect(data.testResults.length).toBe(1);
        expect(data.testBase.length).toBe(1);
      });

      const req = httpMock.expectOne((request) => {
        return request.url === `${baseUrl}/summary` &&
               request.params.get('unitId') === unitId &&
               request.params.get('collDate') === collDate;
      });

      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        message: 'QC summary retrieved successfully',
        statusCode: 200,
        item: mockLabQcSummary
      });
    });

    it('should handle 404 error when component not found', () => {
      service.getQcSummary('99999999', '2026-05-27').subscribe({
        next: () => fail('Should have failed with 404'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne((request) => request.url === `${baseUrl}/summary`);
      req.flush(
        { success: false, message: 'Component not found', statusCode: 404 },
        { status: 404, statusText: 'Not Found' }
      );
    });

    it('should handle 400 error when unit ID is missing', () => {
      service.getQcSummary('', '2026-05-27').subscribe({
        next: () => fail('Should have failed with 400'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne((request) => request.url === `${baseUrl}/summary`);
      req.flush(
        { success: false, message: 'Unit ID must be entered', statusCode: 400 },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('getComponentDetails', () => {
    it('should fetch component details successfully', () => {
      const unitId = '12345678';
      const collDate = '2026-05-27';

      service.getComponentDetails(unitId, collDate).subscribe((data) => {
        expect(data).toEqual([mockComponentDto]);
        expect(data[0].unitId).toBe(unitId);
        expect(data[0].productCode).toBe('RBC');
      });

      const req = httpMock.expectOne((request) => {
        return request.url === `${baseUrl}/component` &&
               request.params.get('unitId') === unitId &&
               request.params.get('collDate') === collDate;
      });

      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        message: 'Component details retrieved successfully',
        statusCode: 200,
        item: mockLabQcSummary
      });
    });

    it('should handle error when fetching component details', () => {
      service.getComponentDetails('INVALID', '2026-05-27').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne((request) => request.url === `${baseUrl}/component`);
      req.flush(
        { success: false, message: 'Unit not found', statusCode: 400 },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('saveQcLabels', () => {
    it('should save QC labels successfully', () => {
      const request: SaveQcLabelRequest = {
        items: [{
          unitId: '12345678',
          collDate: '2026-05-27',
          chapterId: 'CH001',
          componentReview: 'Y',
          qcLabelFlag: 'Y'
        }]
      };

      service.saveQcLabels(request).subscribe((response) => {
        expect(response.success).toBeTrue();
        expect(response.message).toBe('TRANSACTION COMMITTED');
      });

      const req = httpMock.expectOne(`${baseUrl}/save`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush({
        success: true,
        message: 'TRANSACTION COMMITTED',
        statusCode: 200,
        errorCode: '8010'
      });
    });

    it('should handle validation error on save', () => {
      const request: SaveQcLabelRequest = { items: [] };

      service.saveQcLabels(request).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/save`);
      req.flush(
        { success: false, message: 'At least one item is required', statusCode: 400 },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });
});
