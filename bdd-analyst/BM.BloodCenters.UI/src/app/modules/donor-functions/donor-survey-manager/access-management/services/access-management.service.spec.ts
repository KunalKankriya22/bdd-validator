import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AccessManagementService } from './access-management.service';
import {
  AccessManagementModel,
  AccessManagementDto,
  UpdateAccessManagementDto,
  AccessManagementParamsDto
} from '../models/access-management.model';
import { API } from '../../../../../core/constants/api.constants';

describe('AccessManagementService', () => {
  let service: AccessManagementService;
  let httpMock: HttpTestingController;

  const mockApiResponse = [
    {
      chapterId: 'CH001',
      donorType: 'R',
      funcName: 'ONPDNCON',
      alertReq: 'Y',
      effDate: '2025-01-01',
      termDate: '2025-12-31'
    },
    {
      chapterId: 'CH002',
      donorType: 'F',
      funcName: 'ONPDNREG',
      alertReq: 'N',
      effDate: '2025-02-01',
      termDate: null
    }
  ];

  const mockMappedData: AccessManagementModel[] = [
    {
      chapterId: 'CH001',
      type: 'Regular donor',
      functionName: 'ONPDNCON',
      alertRequired: 'Yes',
      effectiveDate: '2025-01-01',
      terminationDate: '2025-12-31'
    },
    {
      chapterId: 'CH002',
      type: 'FastTrak donor',
      functionName: 'ONPDNREG',
      alertRequired: 'No',
      effectiveDate: '2025-02-01',
      terminationDate: null
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AccessManagementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAccessManagement', () => {
    it('should fetch and map data from API', (done) => {
      const params: AccessManagementParamsDto = {};

      service.getAccessManagement(100, 0, params).subscribe(response => {
        expect(response.data.length).toBe(2);
        expect(response.data[0].type).toBe('Regular donor');
        expect(response.data[0].alertRequired).toBe('Yes');
        expect(response.totalRecords).toBe(2);
        done();
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG);
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });

    it('should cache data after first load', (done) => {
      const params: AccessManagementParamsDto = {};

      service.getAccessManagement(100, 0, params).subscribe(() => {
        // Second call should use cache
        service.getAccessManagement(100, 0, params).subscribe(response => {
          expect(response.data.length).toBe(2);
          done();
        });
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG);
      req.flush(mockApiResponse);
      // No second HTTP request should be made
    });









  });

  describe('getAccessManagementFilters', () => {
    it('should fetch filter options', (done) => {
      const mockResponse = {
        data: [
          { chapterId: 'CH001', chapterName: 'Chapter 1' },
          { chapterId: 'CH002', chapterName: 'Chapter 2' }
        ]
      };

      service.getAccessManagementFilters().subscribe(response => {
        expect(response.item.chapterIds.length).toBe(2);
        expect(response.item.chapterIds).toContain('CH001');
        expect(response.item.alertRequiredOptions).toContain('Yes');
        expect(response.item.alertRequiredOptions).toContain('No');
        done();
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG_CHAPTERS);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('getFormOptions', () => {
    it('should fetch form options', (done) => {
      const mockFunctionNames = {
        data: [
          { funcName: 'ONPDNCON', funcDesc: 'Donor Consents' },
          { funcName: 'ONPDNREG', funcDesc: 'Donor Registration' }
        ]
      };

      const mockChapters = {
        data: [
          { chapterId: 'CH001', chapterName: 'Chapter 1' },
          { chapterId: 'CH002', chapterName: 'Chapter 2' }
        ]
      };

      service.getFormOptions().subscribe(response => {
        expect(response.chapterIds.length).toBe(2);
        expect(response.types.length).toBe(2);
        expect(response.functionNames.length).toBe(2);
        expect(response.alertRequiredOptions.length).toBe(2);
        done();
      });

      const req1 = httpMock.expectOne(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG_FUNCTION_NAMES);
      req1.flush(mockFunctionNames);

      const req2 = httpMock.expectOne(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG_CHAPTERS);
      req2.flush(mockChapters);
    });

    it('should handle error and return defaults', (done) => {
      service.getFormOptions().subscribe({
        next: (response) => {
          expect(response.chapterIds).toEqual([]);
          expect(response.types.length).toBe(2);
          expect(response.functionNames).toEqual([]);
          expect(response.alertRequiredOptions.length).toBe(2);
          done();
        },
        error: () => {
          fail('Should not error - catchError should handle it');
          done();
        }
      });

      // Match the two specific requests made by getFormOptions
      const functionNamesReq = httpMock.expectOne(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG_FUNCTION_NAMES);
      const chaptersReq = httpMock.expectOne(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG_CHAPTERS);

      // Error the first request - this will trigger forkJoin to error
      functionNamesReq.error(new ProgressEvent('error'));

      // Try to error the second request, but it may be cancelled already
      try {
        chaptersReq.error(new ProgressEvent('error'));
      } catch (e) {
        // Ignore "Cannot return an error for a cancelled request"
        // This is expected behavior when forkJoin cancels the second observable
      }
    });
  });

  describe('addAccessManagement', () => {
    it('should add new record', (done) => {
      const dto: AccessManagementDto = {
        chapterId: 'CH001',
        type: 'Regular donor',
        functionName: 'ONPDNCON',
        alertRequired: 'Yes',
        effectiveDate: '2025-01-01',
        terminationDate: '2025-12-31'
      };

      service.addAccessManagement(dto).subscribe(response => {
        expect(response.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.donorType).toBe('R');
      expect(req.request.body.funcName).toBe('ONPDNCON');
      expect(req.request.body.alertReq).toBe('Y');
      req.flush({ success: true });
    });

    it('should clear cache after adding', (done) => {
      const dto: AccessManagementDto = {
        chapterId: 'CH001',
        type: 'Regular donor',
        functionName: 'ONPDNCON',
        alertRequired: 'Yes',
        effectiveDate: '2025-01-01',
        terminationDate: null
      };

      // Load data first to populate cache
      service.getAccessManagement(100, 0, {}).subscribe(() => {
        // Add new record
        service.addAccessManagement(dto).subscribe(() => {
          expect(service['cachedData'].length).toBe(0);
          done();
        });

        const addReq = httpMock.expectOne(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG);
        addReq.flush({ success: true });
      });

      const getReq = httpMock.expectOne(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG);
      getReq.flush(mockApiResponse);
    });

  });

  describe('updateAccessManagement', () => {
    it('should update existing record', (done) => {
      const dto: UpdateAccessManagementDto = {
        currentChapterId: 'CH001',
        currentType: 'Regular donor',
        currentFunctionName: 'ONPDNCON',
        chapterId: 'CH001',
        type: 'FastTrak donor',
        functionName: 'ONPDNCON',
        alertRequired: 'No',
        effectiveDate: '2025-01-01',
        terminationDate: '2025-12-31'
      };

      service.updateAccessManagement(dto).subscribe(response => {
        expect(response.success).toBeTrue();
        done();
      });

      const expectedUrl = API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG_UPDATE('CH001', 'R');
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.donorType).toBe('F');
      expect(req.request.body.alertReq).toBeNull();
      req.flush({ success: true });
    });

    it('should clear cache after updating', (done) => {
      const dto: UpdateAccessManagementDto = {
        currentChapterId: 'CH001',
        currentType: 'Regular donor',
        currentFunctionName: 'ONPDNCON',
        chapterId: 'CH001',
        type: 'FastTrak donor',
        functionName: 'ONPDNCON',
        alertRequired: 'No',
        effectiveDate: '2025-01-01',
        terminationDate: null
      };

      // Load data first to populate cache
      service.getAccessManagement(100, 0, {}).subscribe(() => {
        // Update record
        service.updateAccessManagement(dto).subscribe(() => {
          expect(service['cachedData'].length).toBe(0);
          done();
        });

        const updateReq = httpMock.expectOne(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG_UPDATE('CH001', 'R'));
        updateReq.flush({ success: true });
      });

      const getReq = httpMock.expectOne(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG);
      getReq.flush(mockApiResponse);
    });

  });
  describe('Data Mapping', () => {
    it('should map type code R to Regular donor', (done) => {
      service.getAccessManagement(100, 0, {}).subscribe(response => {
        expect(response.data[0].type).toBe('Regular donor');
        done();
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG);
      req.flush(mockApiResponse);
    });

    it('should map type code F to FastTrak donor', (done) => {
      service.getAccessManagement(100, 0, {}).subscribe(response => {
        expect(response.data[1].type).toBe('FastTrak donor');
        done();
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG);
      req.flush(mockApiResponse);
    });

    it('should map alert required code Y to Yes', (done) => {
      service.getAccessManagement(100, 0, {}).subscribe(response => {
        expect(response.data[0].alertRequired).toBe('Yes');
        done();
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG);
      req.flush(mockApiResponse);
    });

    it('should map alert required code N to No', (done) => {
      service.getAccessManagement(100, 0, {}).subscribe(response => {
        expect(response.data[1].alertRequired).toBe('No');
        done();
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG);
      req.flush(mockApiResponse);
    });
  });

  describe('Date Formatting', () => {
    it('should format date string correctly for API', () => {
      const formatted = service['formatDateWithoutTimezone']('2025-01-15');
      expect(formatted).toBe('2025-01-15T00:00:00.000');
    });

    it('should format Date object correctly for API', () => {
      const date = new Date(2025, 0, 15); // Jan 15, 2025
      const formatted = service['formatDateWithoutTimezone'](date);
      expect(formatted).toContain('2025-01-15');
    });
  });
});
