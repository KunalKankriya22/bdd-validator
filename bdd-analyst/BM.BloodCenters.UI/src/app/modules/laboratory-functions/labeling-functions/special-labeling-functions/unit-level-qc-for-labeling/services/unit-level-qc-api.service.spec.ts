import { TestBed } from '@angular/core/testing';
import { HttpContext } from '@angular/common/http';
import { of } from 'rxjs';
import { UnitLevelQcApiService } from './unit-level-qc-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  UnitLevelQCDto,
  UnitLevelQCDetailDto,
  UnitLevelQCQueryDto,
  UnitLevelQCQueryResponse,
  UnitLevelQCDetailResponse,
  UnitLevelQCValidateResponse,
  QcStatusResponse,
  CommitQcRequest,
  CommitQcResponse,
  ComponentsResponse,
  TestsResponse
} from '../models/unit-level-qc.model';

describe('UnitLevelQcApiService', () => {
  let service: UnitLevelQcApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockUnitDto: UnitLevelQCDto = {
    unitId: 'UNIT001',
    collDate: '2024-01-15T00:00:00Z',
    chapterId: 'CHAP01',
    productCode: 'RBC',
    productDescription: 'Red Blood Cells',
    qcLabelFlag: 'Y',
    systemLabelDecision: 'APPROVED',
    labelDats: '2024-01-16T00:00:00Z',
    abo: 'A',
    rh: '+',
    donorInterface: 'DI001',
    expirationDate: '2024-02-15T00:00:00Z',
    volume: 450,
    status: 'ACTIVE',
    insertDate: '2024-01-15T10:00:00Z',
    insertUser: 'TESTUSER'
  };

  const mockDetailDto: UnitLevelQCDetailDto = {
    ...mockUnitDto,
    testResultStatus: 'COMPLETED',
    testCompletionDate: '2024-01-16T12:00:00Z',
    testCount: 5,
    testsPassed: 5,
    testsFailed: 0
  };

  const mockQueryResponse: UnitLevelQCQueryResponse = {
    success: true,
    statusCode: 200,
    message: 'Success',
    data: [mockUnitDto],
    totalCount: 1
  };

  const mockDetailResponse: UnitLevelQCDetailResponse = {
    success: true,
    statusCode: 200,
    message: 'Success',
    item: mockDetailDto
  };

  const mockValidateResponse: UnitLevelQCValidateResponse = {
    success: true,
    statusCode: 200,
    message: 'Unit passed QC validation',
    isValid: true,
    validationErrors: []
  };

  const mockQcStatusResponse: QcStatusResponse = {
    success: true,
    statusCode: 200,
    message: 'Unit is eligible for QC labeling',
    item: {
      unitId: 'UNIT001',
      collDate: '2024-01-15T00:00:00',
      chapterId: 'CHAP01',
      contractId: 'INTERNAL',
      contractType: 'INTERNAL',
      donorInterface: 'Y',
      testingFlag: 'Y',
      nursingAuditFlag: 'Y',
      componentReview: 'Y',
      qcLabelFlag: 'N',
      qcLabelDate: null,
      expectedBagCount: 3,
      actualComponentCount: 3,
      isEligibleForQc: true
    }
  };

  const mockCommitQcResponse: CommitQcResponse = {
    success: true,
    statusCode: 200,
    message: 'QC results committed successfully',
    item: true
  };

  const mockComponentsResponse: ComponentsResponse = {
    success: true,
    statusCode: 200,
    message: 'Components retrieved successfully',
    data: [
      {
        unitId: 'UNIT001',
        collDate: '2024-01-15T00:00:00',
        chapterId: 'CHAP01',
        productCode: 'E0791',
        componentPrefix: '01',
        bagId: 'BAG001',
        expiryDate: '2024-02-14T00:00:00',
        systemLabelDecision: 'PASS',
        rejectReasonCode: null,
        insertDats: '2024-01-15T10:30:00',
        labelDats: '2024-01-15T11:00:00'
      }
    ],
    total: 1
  };

  const mockTestsResponse: TestsResponse = {
    success: true,
    statusCode: 200,
    message: 'Tests retrieved successfully',
    data: [
      {
        unitId: 'UNIT001',
        collDate: '2024-01-15T00:00:00',
        chapterId: 'CHAP01',
        testId: 'ABO',
        testSeqNo: 1,
        resultStatus1: 'PASS',
        tbId: 'TB20240115001',
        absorbance: '0.125',
        ratio: '1.5'
      }
    ],
    total: 1
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        UnitLevelQcApiService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(UnitLevelQcApiService);
  });

  describe('queryUnits', () => {
    it('should call POST with correct endpoint and query DTO', (done) => {
      const queryDto: UnitLevelQCQueryDto = { unitId: 'UNIT001', abo: 'A' };
      apiServiceSpy.post.and.returnValue(of(mockQueryResponse));

      service.queryUnits(queryDto, 25, 0).subscribe({
        next: (response) => {
          expect(response).toEqual(mockQueryResponse);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.UNIT_LEVEL_QC.QUERY(25, 0),
            queryDto
          );
          done();
        }
      });
    });

    it('should handle empty filters', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockQueryResponse));

      service.queryUnits({}, 25, 0).subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          expect(response.data.length).toBe(1);
          done();
        }
      });
    });
  });

  describe('getUnitById', () => {
    it('should call GET and extract item from response', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockDetailResponse));

      service.getUnitById('UNIT001').subscribe({
        next: (unit) => {
          expect(unit).toEqual(mockDetailDto);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.UNIT_LEVEL_QC.GET_BY_ID('UNIT001')
          );
          done();
        }
      });
    });
  });

  describe('getUnitDetail', () => {
    it('should call GET and return detailed unit with test info', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockDetailResponse));

      service.getUnitDetail('UNIT001').subscribe({
        next: (detail) => {
          expect(detail.testResultStatus).toBe('COMPLETED');
          expect(detail.testCount).toBe(5);
          expect(detail.testsPassed).toBe(5);
          expect(detail.testsFailed).toBe(0);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.UNIT_LEVEL_QC.GET_DETAIL('UNIT001')
          );
          done();
        }
      });
    });
  });

  describe('validateUnit', () => {
    it('should call POST with SKIP_ERROR_TOAST context', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockValidateResponse));

      service.validateUnit('UNIT001').subscribe({
        next: (result) => {
          expect(result).toEqual(mockValidateResponse);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.UNIT_LEVEL_QC.VALIDATE('UNIT001'),
            { unitId: 'UNIT001' },
            jasmine.objectContaining({ context: jasmine.any(HttpContext) })
          );
          done();
        }
      });
    });

    it('should return validation result with isValid flag', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockValidateResponse));

      service.validateUnit('UNIT001').subscribe({
        next: (result) => {
          expect(result.isValid).toBeTrue();
          expect(result.success).toBeTrue();
          done();
        }
      });
    });

    it('should handle validation failure response', (done) => {
      const failureResponse: UnitLevelQCValidateResponse = {
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        isValid: false,
        validationErrors: ['QC Label Flag must be Y', 'Tests failed: 2']
      };
      apiServiceSpy.post.and.returnValue(of(failureResponse));

      service.validateUnit('UNIT002').subscribe({
        next: (result) => {
          expect(result.isValid).toBeFalse();
          expect(result.validationErrors?.length).toBe(2);
          done();
        }
      });
    });
  });

  describe('getQcStatus', () => {

    it('should return QC status with all 4 check fields', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockQcStatusResponse));

      service.getQcStatus('UNIT001').subscribe({
        next: (response) => {
          const item = response.item;
          expect(item.donorInterface).toBe('Y');
          expect(item.testingFlag).toBe('Y');
          expect(item.nursingAuditFlag).toBe('Y');
          expect(item.componentReview).toBe('Y');
          expect(item.isEligibleForQc).toBeTrue();
          done();
        }
      });
    });

  });

  describe('commitQc', () => {
    it('should call PUT with correct endpoint and request body', (done) => {
      const request: CommitQcRequest = { componentReview: 'Y', qcLabelFlag: 'Y' };
      apiServiceSpy.put.and.returnValue(of(mockCommitQcResponse));

      service.commitQc('UNIT001', request).subscribe({
        next: (response) => {
          expect(response).toEqual(mockCommitQcResponse);
          expect(apiServiceSpy.put).toHaveBeenCalledWith(
            API.UNIT_LEVEL_QC.COMMIT_QC('UNIT001'),
            request
          );
          done();
        }
      });
    });

    it('should return success with item true', (done) => {
      const request: CommitQcRequest = { componentReview: 'Y', qcLabelFlag: 'Y' };
      apiServiceSpy.put.and.returnValue(of(mockCommitQcResponse));

      service.commitQc('UNIT001', request).subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          expect(response.item).toBeTrue();
          done();
        }
      });
    });
  });

  describe('getComponents', () => {

    it('should return components with product and label data', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockComponentsResponse));

      service.getComponents('UNIT001').subscribe({
        next: (response) => {
          expect(response.data.length).toBe(1);
          expect(response.data[0].productCode).toBe('E0791');
          expect(response.data[0].bagId).toBe('BAG001');
          expect(response.data[0].systemLabelDecision).toBe('PASS');
          expect(response.total).toBe(1);
          done();
        }
      });
    });
  });

  describe('getScheduledTests', () => {

    it('should return test data with absorbance and ratio', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockTestsResponse));

      service.getScheduledTests('UNIT001').subscribe({
        next: (response) => {
          expect(response.data.length).toBe(1);
          expect(response.data[0].testId).toBe('ABO');
          expect(response.data[0].testSeqNo).toBe(1);
          expect(response.data[0].absorbance).toBe('0.125');
          expect(response.data[0].ratio).toBe('1.5');
          done();
        }
      });
    });
  });
});
