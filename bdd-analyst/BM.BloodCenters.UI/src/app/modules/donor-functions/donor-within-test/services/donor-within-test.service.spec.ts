import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DonorWithinTestService } from './donor-within-test.service';
import { environment } from '../../../../../environments/environment';
import { API } from '../../../../core/constants/api.constants';
import {
  DonationRecordDto,
  TestResultDto,
  TestResultsResponse,
  ConfirmatoryTestDto,
  ApiResponse
} from '../models/donor-within-test.models';

describe('DonorWithinTestService', () => {
  let service: DonorWithinTestService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  const mockDonations: DonationRecordDto[] = [
    { unitId: 'W66712328191', displayUnitId: 'W66712328191-H', collDate: '2024-08-12', donorId: 'D123456' },
    { unitId: 'DEF07272001', displayUnitId: 'DEF[07272001]', collDate: '2025-07-27', donorId: 'D123456' }
  ];

  const mockTestResults: TestResultDto[] = [
    {
      testId: 'HBC',
      resultCode: 'NEG',
      reactive: null,
      testType: 'SCREENING',
      absorbance: '0.123'
    },
    {
      testId: 'HBSAG',
      resultCode: 'NEG',
      reactive: null,
      testType: 'SCREENING',
      absorbance: '0.045'
    }
  ];

  const mockTestResultsResponse: TestResultsResponse = {
    data: mockTestResults,
    hasHiddenTests: false,
    hasValidTests: true
  };

  const mockConfirmatoryTests: ConfirmatoryTestDto[] = [
    {
      unitId: 'W66712328191',
      collDate: '2024-08-12',
      testId: 'HIV-CONFIRM',
      testDesc: 'HIV Confirmatory',
      resultCode: 'NEG',
      chapterId: 'CH001',
      testType: 'Confirmatory'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DonorWithinTestService]
    });

    service = TestBed.inject(DonorWithinTestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAccessLevel', () => {
    it('should fetch the current user access level', () => {
      const apiResponse: ApiResponse<{ accessLevel: number }> = {
        success: true,
        data: { accessLevel: 5 }
      };

      service.getAccessLevel().subscribe((level) => {
        expect(level).toBe(5);
      });

      const expectedUrl = `${baseUrl}${API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.ACCESS_LEVEL}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should throw error when data is null', () => {
      const apiResponse: ApiResponse<any> = {
        success: true,
        data: null
      };

      service.getAccessLevel().subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toBe('Access level not returned by server');
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.ACCESS_LEVEL)
      );
      req.flush(apiResponse);
    });

    it('should handle array-wrapped response from ReturnResult', () => {
      const apiResponse = {
        data: [{ accessLevel: 99 }]
      };

      service.getAccessLevel().subscribe((level) => {
        expect(level).toBe(99);
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.ACCESS_LEVEL)
      );
      req.flush(apiResponse);
    });

    it('should handle error when fetching access level fails', () => {
      service.getAccessLevel().subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(403);
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.ACCESS_LEVEL)
      );
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('getDonations', () => {
    it('should fetch donations for a donor', () => {
      const donorId = 'D123456';
      const apiResponse: ApiResponse<DonationRecordDto[]> = {
        success: true,
        data: mockDonations
      };

      service.getDonations(donorId).subscribe((donations) => {
        expect(donations).toEqual(mockDonations);
        expect(donations.length).toBe(2);
      });

      const expectedUrl = `${baseUrl}${API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.DONATIONS(donorId)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should fetch donations with pagination parameters', () => {
      const donorId = 'D123456';
      const params = { take: 10, skip: 0, sortOrder: 'desc' };
      const apiResponse: ApiResponse<DonationRecordDto[]> = {
        success: true,
        data: mockDonations
      };

      service.getDonations(donorId, params).subscribe((donations) => {
        expect(donations).toEqual(mockDonations);
      });

      const req = httpMock.expectOne((request) => {
        return request.url.includes(API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.DONATIONS(donorId)) &&
               request.params.get('take') === '10' &&
               request.params.get('sortOrder') === 'desc';
      });
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should return empty array when API returns no data', () => {
      const donorId = 'D123456';
      const apiResponse: ApiResponse<DonationRecordDto[]> = {
        success: true,
        data: null as any
      };

      service.getDonations(donorId).subscribe((donations) => {
        expect(donations).toEqual([]);
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.DONATIONS(donorId))
      );
      req.flush(apiResponse);
    });

    it('should handle error when fetching donations fails', () => {
      const donorId = 'D123456';
      const errorMessage = 'Network error';

      service.getDonations(donorId).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.DONATIONS(donorId))
      );
      req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getTestResults', () => {
    it('should fetch test results for a donation with accessLevel', () => {
      const unitId = 'W66712328191';
      const collDate = '2024-08-12';
      const accessLevel = 5;
      const apiResponse: ApiResponse<TestResultsResponse> = {
        success: true,
        data: mockTestResultsResponse
      };

      service.getTestResults(unitId, collDate, accessLevel).subscribe((response) => {
        expect(response.data).toEqual(mockTestResults);
        expect(response.hasHiddenTests).toBeFalse();
        expect(response.hasValidTests).toBeTrue();
      });

      const req = httpMock.expectOne((request) => {
        return request.url.includes(API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.TEST_RESULTS(unitId, collDate)) &&
               request.params.get('accessLevel') === '5';
      });
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should fetch test results without accessLevel', () => {
      const unitId = 'W66712328191';
      const collDate = '2024-08-12';
      const apiResponse: ApiResponse<TestResultsResponse> = {
        success: true,
        data: mockTestResultsResponse
      };

      service.getTestResults(unitId, collDate).subscribe((response) => {
        expect(response.data).toEqual(mockTestResults);
      });

      const req = httpMock.expectOne((request) => {
        return request.url.includes(API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.TEST_RESULTS(unitId, collDate)) &&
               !request.params.has('accessLevel');
      });
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should return defaults when response data is null', () => {
      const unitId = 'W66712328191';
      const collDate = '2024-08-12';
      const apiResponse: ApiResponse<any> = {
        success: true,
        data: null
      };

      service.getTestResults(unitId, collDate).subscribe((response) => {
        expect(response.data).toEqual([]);
        expect(response.hasHiddenTests).toBeFalse();
        expect(response.hasValidTests).toBeFalse();
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.TEST_RESULTS(unitId, collDate))
      );
      req.flush(apiResponse);
    });

    it('should handle error when fetching test results fails', () => {
      const unitId = 'W66712328191';
      const collDate = '2024-08-12';

      service.getTestResults(unitId, collDate).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.TEST_RESULTS(unitId, collDate))
      );
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getConfirmatoryTests', () => {
    it('should fetch confirmatory tests for a donation', () => {
      const unitId = 'W66712328191';
      const collDate = '2024-08-12';
      const apiResponse: ApiResponse<ConfirmatoryTestDto[]> = {
        success: true,
        data: mockConfirmatoryTests
      };

      service.getConfirmatoryTests(unitId, collDate).subscribe((tests) => {
        expect(tests).toEqual(mockConfirmatoryTests);
        expect(tests.length).toBe(1);
      });

      const expectedUrl = `${baseUrl}${API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.CONFIRMATORY_TESTS(unitId, collDate)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should fetch confirmatory tests with numeric access level', () => {
      const unitId = 'W66712328191';
      const collDate = '2024-08-12';
      const accessLevel = 5;
      const apiResponse: ApiResponse<ConfirmatoryTestDto[]> = {
        success: true,
        data: mockConfirmatoryTests
      };

      service.getConfirmatoryTests(unitId, collDate, accessLevel).subscribe((tests) => {
        expect(tests).toEqual(mockConfirmatoryTests);
      });

      const req = httpMock.expectOne((request) => {
        return request.url.includes(API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.CONFIRMATORY_TESTS(unitId, collDate)) &&
               request.params.get('accessLevel') === '5';
      });
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should return empty array when no confirmatory tests found', () => {
      const unitId = 'W66712328191';
      const collDate = '2024-08-12';
      const apiResponse: ApiResponse<ConfirmatoryTestDto[]> = {
        success: true,
        data: []
      };

      service.getConfirmatoryTests(unitId, collDate).subscribe((tests) => {
        expect(tests).toEqual([]);
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.CONFIRMATORY_TESTS(unitId, collDate))
      );
      req.flush(apiResponse);
    });

    it('should handle error when fetching confirmatory tests fails', () => {
      const unitId = 'W66712328191';
      const collDate = '2024-08-12';

      service.getConfirmatoryTests(unitId, collDate).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.status).toBe(403);
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(API.DONOR_FUNCTIONS.DONOR_WITHIN_TEST.CONFIRMATORY_TESTS(unitId, collDate))
      );
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });
});
