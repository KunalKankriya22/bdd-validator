import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import moment from 'moment';
import { HospitalPatientContractProfileTestsService } from './hospital-patient-contract-profile-tests.service';
import { API } from '@core/constants/api.constants';
import {
  ContractTest,
  ContractProfileTestTableModel,
  CreateContractTestRequest,
  UpdateContractTestRequest,
  ContractTestQueryDto,
  TestDropdownDto,
  ReturnResult,
  ContractDropdownDto
} from '../models/hospital-patient-contract-profile-tests.model';

describe('HospitalPatientContractProfileTestsService', () => {
  let service: HospitalPatientContractProfileTestsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HospitalPatientContractProfileTestsService]
    });

    service = TestBed.inject(HospitalPatientContractProfileTestsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getActiveContracts', () => {
    it('should fetch active contracts successfully', (done) => {
      const mockResponse: ReturnResult<ContractDropdownDto> = {
        success: true,
        data: [
          { contractId: 'HOSP001', company: 'University Medical Center' },
          { contractId: 'HOSP002', company: 'St. Mary\'s Hospital' }
        ],
        message: 'Active contracts retrieved successfully',
        statusCode: 200
      };

      service.getActiveContracts().subscribe(contracts => {
        expect(contracts.length).toBe(2);
        expect(contracts[0].contractId).toBe('HOSP001');
        expect(contracts[0].description).toBe('University Medical Center');
        expect(contracts[1].contractId).toBe('HOSP002');
        expect(contracts[1].description).toBe('St. Mary\'s Hospital');
        done();
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.CONTRACTS_DROPDOWN);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when fetching contracts fails', (done) => {
      const mockResponse: ReturnResult<ContractDropdownDto> = {
        success: false,
        message: 'Failed to retrieve active contracts',
        statusCode: 500
      };

      service.getActiveContracts().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Failed to retrieve active contracts');
          done();
        }
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.CONTRACTS_DROPDOWN);
      req.flush(mockResponse);
    });
  });

  describe('searchContractTests', () => {
    it('should fetch contract tests with pagination', (done) => {
      const contractId = 'HOSP001';
      const take = 25;
      const skip = 0;
      const filters: ContractTestQueryDto = {
        searchKeyword: 'HIV',
        sortColumn: 'TestId',
        sortOrder: 'ASC'
      };

      const mockResponse: ReturnResult<ContractTest> = {
        success: true,
        data: [
          {
            contractId: 'HOSP001',
            chapterId: 'CHAP001',
            testId: 'HIV1/2',
            profileSetId: 'PS001',
            testDesc: 'HIV 1/2 Antibody Screen',
            stopLabelFlag: 'Y',
            effDate: '2026-01-01T00:00:00Z',
            termDate: null,
            lastModifiedDate: '2026-06-15T10:30:00Z',
            programId: 'ADMIN001'
          }
        ],
        total: 1,
        message: 'Records retrieved successfully',
        statusCode: 200
      };

      service.searchContractTests(contractId, take, skip, filters).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
        expect(result.data[0].testId).toBe('HIV1/2');
        expect(result.data[0].effDate).toMatch(/^\d{2}-[A-Za-z]{3}-\d{4}$/); // DD-MMM-YYYY format
        done();
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.SEARCH(contractId, take, skip));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(filters);
      req.flush(mockResponse);
    });

  });

  describe('getContractTestById', () => {
    it('should fetch contract test by ID', (done) => {
      const contractId = 'HOSP001';
      const testId = 'HIV1/2';
      const mockResponse: ReturnResult<ContractTest> = {
        success: true,
        data: [
          {
            contractId: 'HOSP001',
            chapterId: 'CHAP001',
            testId: 'HIV1/2',
            profileSetId: 'PS001',
            testDesc: 'HIV 1/2 Antibody Screen',
            stopLabelFlag: 'Y',
            effDate: '2026-01-01T00:00:00Z',
            termDate: null,
            lastModifiedDate: '2026-06-15T10:30:00Z',
            programId: 'ADMIN001'
          }
        ],
        message: 'Record retrieved successfully',
        statusCode: 200
      };

      service.getContractTestById(contractId, testId).subscribe(test => {
        expect(test.testId).toBe('HIV1/2');
        expect(test.testDesc).toBe('HIV 1/2 Antibody Screen');
        expect(test.stopLabelFlag).toBe('Y');
        done();
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.GET_BY_ID(contractId, testId));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should throw error when test not found', (done) => {
      const mockResponse: ReturnResult<ContractTest> = {
        success: true,
        data: [],
        message: 'Record retrieved successfully',
        statusCode: 200
      };

      service.getContractTestById('HOSP001', 'INVALID').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Contract test not found');
          done();
        }
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.GET_BY_ID('HOSP001', 'INVALID'));
      req.flush(mockResponse);
    });
  });

  describe('getActiveTests', () => {
    it('should fetch active tests', (done) => {
      const mockResponse: ReturnResult<TestDropdownDto> = {
        success: true,
        data: [
          { testId: 'HIV1/2', testDesc: 'HIV 1/2 Antibody Screen', testGroup: 'INFECTIOUS' },
          { testId: 'HBsAg', testDesc: 'Hepatitis B Surface Antigen', testGroup: 'INFECTIOUS' }
        ],
        total: 2,
        message: 'Active tests retrieved successfully',
        statusCode: 200
      };

      service.getActiveTests().subscribe(tests => {
        expect(tests.length).toBe(2);
        expect(tests[0].testId).toBe('HIV1/2');
        expect(tests[1].testId).toBe('HBsAg');
        done();
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.TESTS_DROPDOWN);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createContractTest', () => {
    it('should create contract test successfully', (done) => {
      const payload: CreateContractTestRequest = {
        contractId: 'HOSP001',
        testId: 'HIV1/2',
        stopLabelFlag: 'Y',
        effDate: '2026-07-01T00:00:00.000Z',
        termDate: '2027-06-30T23:59:59.999Z'
      };

      const mockResponse: ReturnResult<any> = {
        success: true,
        message: 'Contract test created successfully',
        statusCode: 200
      };

      service.createContractTest(payload).subscribe(() => {
        expect(true).toBe(true); // Success
        done();
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

  });

  describe('updateContractTest', () => {
    it('should update contract test successfully', (done) => {
      const contractId = 'HOSP001';
      const testId = 'HIV1/2';
      const payload: UpdateContractTestRequest = {
        stopLabelFlag: 'N',
        effDate: '2026-07-01T00:00:00.000Z',
        termDate: '2027-12-31T23:59:59.999Z'
      };

      const mockResponse: ReturnResult<any> = {
        success: true,
        message: 'Contract test updated successfully',
        statusCode: 200
      };

      service.updateContractTest(contractId, testId, payload).subscribe(() => {
        expect(true).toBe(true); // Success
        done();
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.UPDATE(contractId, testId));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

  });

  describe('deleteContractTest', () => {

    it('should handle delete when record not found', (done) => {
      const mockResponse: ReturnResult<number> = {
        success: true,
        item: 0,
        message: 'Record not found or already deleted',
        statusCode: 404
      };

      service.deleteContractTest('HOSP001', 'INVALID').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Record not found or already deleted');
          done();
        }
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.DELETE('HOSP001', 'INVALID'));
      req.flush(mockResponse);
    });

    it('should handle delete error', (done) => {
      const mockResponse: ReturnResult<number> = {
        success: false,
        message: 'Failed to delete contract test',
        statusCode: 500
      };

      service.deleteContractTest('HOSP001', 'HIV1/2').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Failed to delete contract test');
          done();
        }
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.DELETE('HOSP001', 'HIV1/2'));
      req.flush(mockResponse);
    });
  });

  describe('getStopLabelFlagOptions', () => {
    it('should return static stop label flag options', (done) => {
      service.getStopLabelFlagOptions().subscribe(options => {
        expect(options.length).toBe(2);
        expect(options[0].code).toBe('Y');
        expect(options[0].description).toBe('Yes - Report results');
        expect(options[1].code).toBe('N');
        expect(options[1].description).toBe('No - Do not report results');
        done();
      });
    });
  });

  describe('searchContractTests error handling', () => {
    it('should throw error when search returns success false', (done) => {
      service.searchContractTests('HOSP001', 25, 0).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Search failed');
          done();
        }
      });
      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.SEARCH('HOSP001', 25, 0));
      req.flush({ success: false, message: 'Search failed', statusCode: 500 });
    });

    it('should handle null data in search response', (done) => {
      service.searchContractTests('HOSP001', 25, 0).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.SEARCH('HOSP001', 25, 0));
      req.flush({ success: true, data: null, total: null, message: 'OK', statusCode: 200 });
    });

    it('should search without filters', (done) => {
      service.searchContractTests('HOSP001', 25, 0).subscribe(result => {
        expect(result.data).toEqual([]);
        done();
      });
      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.SEARCH('HOSP001', 25, 0));
      expect(req.request.body).toEqual({});
      req.flush({ success: true, data: [], total: 0, message: 'OK', statusCode: 200 });
    });
  });

  describe('getContractTestById error handling', () => {
    it('should throw when response is not successful', (done) => {
      service.getContractTestById('HOSP001', 'T1').subscribe({
        next: () => fail('should fail'),
        error: (e) => {
          expect(e.message).toBe('Server error');
          done();
        }
      });
      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.GET_BY_ID('HOSP001', 'T1'));
      req.flush({ success: false, message: 'Server error', statusCode: 500 });
    });

    it('should throw when data is null', (done) => {
      service.getContractTestById('HOSP001', 'T1').subscribe({
        next: () => fail('should fail'),
        error: (e) => {
          expect(e.message).toBe('Contract test not found');
          done();
        }
      });
      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.GET_BY_ID('HOSP001', 'T1'));
      req.flush({ success: true, data: null, message: 'OK', statusCode: 200 });
    });
  });

  describe('getActiveTests error handling', () => {
    it('should throw when response is not successful', (done) => {
      service.getActiveTests().subscribe({
        next: () => fail('should fail'),
        error: (e) => {
          expect(e.message).toBe('Test error');
          done();
        }
      });
      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.TESTS_DROPDOWN);
      req.flush({ success: false, message: 'Test error', statusCode: 500 });
    });

    it('should return empty array when data is null', (done) => {
      service.getActiveTests().subscribe(tests => {
        expect(tests).toEqual([]);
        done();
      });
      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.TESTS_DROPDOWN);
      req.flush({ success: true, data: null, message: 'OK', statusCode: 200 });
    });
  });

  describe('createContractTest error handling', () => {
    it('should throw when create fails', (done) => {
      const payload: CreateContractTestRequest = {
        contractId: 'H1', testId: 'T1', stopLabelFlag: 'Y', effDate: '2026-01-01'
      };
      service.createContractTest(payload).subscribe({
        next: () => fail('should fail'),
        error: (e) => {
          expect(e.message).toBe('Create failed');
          done();
        }
      });
      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.CREATE);
      req.flush({ success: false, message: 'Create failed', statusCode: 500 });
    });
  });

  describe('updateContractTest error handling', () => {
    it('should throw when update fails', (done) => {
      const payload: UpdateContractTestRequest = {
        stopLabelFlag: 'Y', effDate: '2026-01-01'
      };
      service.updateContractTest('H1', 'T1', payload).subscribe({
        next: () => fail('should fail'),
        error: (e) => {
          expect(e.message).toBe('Update failed');
          done();
        }
      });
      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.UPDATE('H1', 'T1'));
      req.flush({ success: false, message: 'Update failed', statusCode: 500 });
    });
  });

  describe('deleteContractTest success', () => {
    it('should delete successfully when item > 0', (done) => {
      service.deleteContractTest('H1', 'T1').subscribe(() => {
        expect(true).toBe(true);
        done();
      });
      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.DELETE('H1', 'T1'));
      req.flush({ success: true, item: 1, message: 'Deleted', statusCode: 200 });
    });
  });

  describe('mapToTableModel edge cases', () => {
    it('should use testId as fallback when testDesc is null', (done) => {
      service.searchContractTests('HOSP001', 25, 0).subscribe(result => {
        expect(result.data[0].testDesc).toBe('FALLBACK');
        done();
      });
      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.SEARCH('HOSP001', 25, 0));
      req.flush({
        success: true,
        data: [{
          contractId: 'H1', chapterId: 'C1', testId: 'FALLBACK', profileSetId: 'PS1',
          testDesc: null, stopLabelFlag: 'Y', effDate: '2026-01-01',
          termDate: null, lastModifiedDate: '2026-01-01', programId: 'P1'
        }],
        total: 1, message: 'OK', statusCode: 200
      });
    });
  });

  describe('getActiveContracts with null data', () => {
    it('should return empty array when data is null', (done) => {
      service.getActiveContracts().subscribe(contracts => {
        expect(contracts).toEqual([]);
        done();
      });
      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.CONTRACTS_DROPDOWN);
      req.flush({ success: true, data: null, message: 'OK', statusCode: 200 });
    });
  });

  describe('Date Formatting', () => {
    it('should format ISO dates to DD-MMM-YYYY', (done) => {
      const mockResponse: ReturnResult<ContractTest> = {
        success: true,
        data: [
          {
            contractId: 'HOSP001',
            chapterId: 'CHAP001',
            testId: 'HIV1/2',
            testDesc: 'HIV 1/2 Antibody Screen',
            stopLabelFlag: 'Y',
            effDate: '2026-01-15T00:00:00Z',
            termDate: '2027-12-31T00:00:00Z',
            lastModifiedDate: '2026-06-20T00:00:00Z',
            programId: 'ADMIN001'
          }
        ],
        total: 1,
        message: 'Records retrieved successfully',
        statusCode: 200
      };

      const expectedEffDate = moment('2026-01-15T00:00:00Z').format('DD-MMM-YYYY');
      const expectedTermDate = moment('2027-12-31T00:00:00Z').format('DD-MMM-YYYY');
      const expectedLastModifiedDate = moment('2026-06-20T00:00:00Z').format('DD-MMM-YYYY');

      service.searchContractTests('HOSP001', 25, 0).subscribe(result => {
        expect(result.data[0].effDate).toBe(expectedEffDate);
        expect(result.data[0].termDate).toBe(expectedTermDate);
        expect(result.data[0].lastModifiedDate).toBe(expectedLastModifiedDate);
        done();
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.SEARCH('HOSP001', 25, 0));
      req.flush(mockResponse);
    });

  });
});
