import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { VoidCancelTestResultsApiService } from './void-cancel-test-results-api.service';
import { ApiService } from '@shared/services/api.service';
import {
  ActionTypeDto,
  ActiveTestDto,
  TestGroupDto,
  VoidReasonCodeDto,
  TestResultForVoidDto,
  VoidTestResultRequest,
  CancelTestResultRequest,
  TestResultDetailDto,
  ApiResponse,
} from '../models/void-cancel-test-results.model';

describe('VoidCancelTestResultsApiService', () => {
  let service: VoidCancelTestResultsApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'put']);

    TestBed.configureTestingModule({
      providers: [
        VoidCancelTestResultsApiService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(VoidCancelTestResultsApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getActions', () => {
    it('should return action type array', (done) => {
      // Arrange
      const mockActions: ActionTypeDto[] = [{ code: 'VOID', description: 'Void' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockActions }));

      // Act
      service.getActions().subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockActions);
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getTests', () => {
    it('should return active test array', (done) => {
      // Arrange
      const mockTests: ActiveTestDto[] = [{ testId: 'TST01', testDesc: 'Test 1' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockTests }));

      // Act
      service.getTests().subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(1);
          expect(result[0].testId).toBe('TST01');
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getTestGroups', () => {
    it('should return test group array', (done) => {
      // Arrange
      const mockGroups: TestGroupDto[] = [{ code: 'GRP1', description: 'Group 1' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockGroups }));

      // Act
      service.getTestGroups().subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(1);
          expect(result[0].code).toBe('GRP1');
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getVoidReasonCodes', () => {
    it('should return void reason code array', (done) => {
      // Arrange
      const mockReasons: VoidReasonCodeDto[] = [{ code: 'ERR', codeDesc: 'Error' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockReasons }));

      // Act
      service.getVoidReasonCodes().subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(1);
          expect(result[0].code).toBe('ERR');
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getTestResults', () => {
    it('should return test results for void', (done) => {
      // Arrange
      const mockResults: TestResultForVoidDto[] = [{
        unitId: 'U001', testId: 'TST01', testSeqNo: 1, resultCode: 'POS',
        resultDats: null, voidCancelFlag: null, voidReason: null, voidDate: null,
        voidUser: null, collDate: '2026-01-01', tbId: null, resultStatus1: null,
        testDesc: null, isScheduled: null, voidReasonDesc: null
      }];
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockResults }));

      // Act
      service.getTestResults('U001', 'TST01').subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(1);
          expect(result[0].unitId).toBe('U001');
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getTestResultsByUnit', () => {
    it('should return test results by unit', (done) => {
      // Arrange
      const mockResults: TestResultForVoidDto[] = [{
        unitId: 'U001', testId: 'TST01', testSeqNo: 1, resultCode: 'POS',
        resultDats: null, voidCancelFlag: null, voidReason: null, voidDate: null,
        voidUser: null, collDate: '2026-01-01', tbId: null, resultStatus1: null,
        testDesc: null, isScheduled: null, voidReasonDesc: null
      }];
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockResults }));

      // Act
      service.getTestResultsByUnit('U001', 'TST01', 'VOID').subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(1);
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('getTestResultDetails', () => {
    it('should return test result details', (done) => {
      // Arrange
      const mockDetails: TestResultDetailDto[] = [{
        testId: 'TST01', testSeqNo: 1, resultCode: 'POS', tbId: null,
        tbSeqNo: null, absorbance: null, ratio: null, wellNumber: null,
        testChapterId: null, resultDats: null, testMode: null, testDesc: 'Test 1',
        isScheduled: null
      }];
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockDetails }));

      // Act
      service.getTestResultDetails('U001', 'TST01', 'VOID').subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(1);
          expect(result[0].testId).toBe('TST01');
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('voidTestResults', () => {
    it('should put void request and return response data', (done) => {
      // Arrange
      const request: VoidTestResultRequest = {
        unitId: 'U001', testId: 'TST01', testSeqNo: 1,
        collDate: '2026-01-01', voidReason: 'ERR', isScheduled: 'N'
      };
      apiServiceSpy.put.and.returnValue(of({ success: true, message: '', statusCode: 200, data: { voided: true } }));

      // Act
      service.voidTestResults(request, false).subscribe({
        next: (result) => {
          // Assert
          expect(result.voided).toBe(true);
          expect(apiServiceSpy.put).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });

  describe('cancelTestResults', () => {
    it('should put cancel request and return response data', (done) => {
      // Arrange
      const request: CancelTestResultRequest = {
        unitId: 'U001', testId: 'TST01', testSeqNo: 1,
        collDate: '2026-01-01', isScheduled: 'N'
      };
      apiServiceSpy.put.and.returnValue(of({ success: true, message: '', statusCode: 200, data: { cancelled: true } }));

      // Act
      service.cancelTestResults(request).subscribe({
        next: (result) => {
          // Assert
          expect(result.cancelled).toBe(true);
          expect(apiServiceSpy.put).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail')
      });
    });
  });
});
