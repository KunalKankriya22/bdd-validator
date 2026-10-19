import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LabInterdictionOverrideService } from './lab-interdiction-override.service';
import { ApiService } from '../../../../shared/services/api.service';
import {
  LabInterdictionOverrideModel,
  LabInterdictionOverrideParamsDto,
  VerifyInterdictionRequest,
  VerifyInterdictionResponse,
  LabInterdictionFilterDropdownData,
  DropdownOption
} from '../models/lab-interdiction-override.model';

describe('LabInterdictionOverrideService', () => {
  let service: LabInterdictionOverrideService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockLabInterdictionData: LabInterdictionOverrideModel[] = [
    {
      auditKey: 1,
      donorDecisionCode: 'ACC',
      decisionDesc: 'Acceptable',
      productType: 'RBC',
      prodTypeDesc: 'Red Blood Cells',
      interCode: 'HIV',
      interDescription: 'HIV Positive',
      interType: 'P',
      overrideDesc: 'Override description',
      effDate: '2025-01-01T00:00:00',
      lastModifiedDate: '2025-01-15T10:30:00',
      programId: 'PROG001',
      moveDate: '2025-01-10T00:00:00',
      user: 'admin',
      choose: 'Y'
    },
    {
      auditKey: 2,
      donorDecisionCode: 'DEF',
      decisionDesc: 'Deferred',
      productType: 'PLT',
      prodTypeDesc: 'Platelets',
      interCode: 'HBV',
      interDescription: 'Hepatitis B',
      interType: 'T',
      overrideDesc: 'Temporary override',
      effDate: '2025-02-01T00:00:00'
    }
  ];

  const mockSearchResponse = {
    data: mockLabInterdictionData,
    totalCount: 2
  };

  const mockVerifyResponse: VerifyInterdictionResponse = {
    success: true,
    verifiedCount: 2,
    errors: [],
    verifiedAuditKeys: [1, 2],
    failedAuditKeys: []
  };

  const mockFilterDropdownData: LabInterdictionFilterDropdownData = {
    cueOptions: [
      { key: 'Acceptable', value: 'ACC' },
      { key: 'Deferred', value: 'DEF' },
      { key: 'Rejected', value: 'REJ' }
    ],
    typeOptions: [
      { key: 'Permanent', value: 'P' },
      { key: 'Temporary', value: 'T' },
      { key: 'Indefinite', value: 'I' }
    ]
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        LabInterdictionOverrideService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(LabInterdictionOverrideService);
  });

  describe('getLabInterdictionOverrides', () => {
    it('should fetch lab interdiction overrides successfully', (done) => {
      mockApiService.post.and.returnValue(of(mockSearchResponse));

      const params: LabInterdictionOverrideParamsDto = {
        skip: 0,
        take: 10
      };

      service.getLabInterdictionOverrides(params).subscribe((result) => {
        expect(result.data.length).toBe(2);
        expect(result.totalRecords).toBe(2);
        expect(result.data[0].auditKey).toBe(1);
        expect(result.data[0].donorDecisionCode).toBe('ACC');
        expect(result.data[1].interType).toBe('T');
        done();
      });
    });

    it('should construct correct API endpoint', (done) => {
      mockApiService.post.and.returnValue(of(mockSearchResponse));

      const params: LabInterdictionOverrideParamsDto = {
        skip: 0,
        take: 10
      };

      service.getLabInterdictionOverrides(params).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          '/api/v1/application-admin/lab-interdiction-override-tech2/search',
          params
        );
        done();
      });
    });

    it('should include all filter fields in request payload', (done) => {
      mockApiService.post.and.returnValue(of(mockSearchResponse));

      const params: LabInterdictionOverrideParamsDto = {
        donorDecisionCode: 'ACC',
        interType: 'P',
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'after',
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'before',
        searchText: 'HIV',
        sortOrder: 'asc',
        sortColumn: 'donorDecisionCode',
        skip: 0,
        take: 10
      };

      service.getLabInterdictionOverrides(params).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          '/api/v1/application-admin/lab-interdiction-override-tech2/search',
          jasmine.objectContaining({
            donorDecisionCode: 'ACC',
            interType: 'P',
            effectiveDate: '2025-01-01',
            effectiveDatePeriod: 'after',
            terminationDate: '2025-12-31',
            terminationDatePeriod: 'before',
            searchText: 'HIV',
            sortOrder: 'asc',
            sortColumn: 'donorDecisionCode',
            skip: 0,
            take: 10
          })
        );
        done();
      });
    });



  });

  describe('verifyInterdictions', () => {
    it('should verify interdictions successfully', (done) => {
      mockApiService.post.and.returnValue(of(mockVerifyResponse));

      const request: VerifyInterdictionRequest = {
        auditKeys: [1, 2]
      };

      service.verifyInterdictions(request).subscribe((result) => {
        expect(result.success).toBeTrue();
        expect(result.verifiedCount).toBe(2);
        expect(result.errors.length).toBe(0);
        expect(result.verifiedAuditKeys).toEqual([1, 2]);
        expect(result.failedAuditKeys).toEqual([]);
        done();
      });
    });

    it('should construct correct API endpoint for verification', (done) => {
      mockApiService.post.and.returnValue(of(mockVerifyResponse));

      const request: VerifyInterdictionRequest = {
        auditKeys: [1, 2]
      };

      service.verifyInterdictions(request).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          '/api/v1/application-admin/lab-interdiction-override-tech2/verify',
          request
        );
        done();
      });
    });

    it('should handle partial verification with errors', (done) => {
      const partialResponse: VerifyInterdictionResponse = {
        success: false,
        verifiedCount: 1,
        errors: ['Failed to verify audit key 2'],
        verifiedAuditKeys: [1],
        failedAuditKeys: [2]
      };
      mockApiService.post.and.returnValue(of(partialResponse));

      const request: VerifyInterdictionRequest = {
        auditKeys: [1, 2]
      };

      service.verifyInterdictions(request).subscribe((result) => {
        expect(result.success).toBeFalse();
        expect(result.verifiedCount).toBe(1);
        expect(result.errors.length).toBe(1);
        expect(result.verifiedAuditKeys).toEqual([1]);
        expect(result.failedAuditKeys).toEqual([2]);
        done();
      });
    });

    it('should handle empty audit keys array', (done) => {
      const emptyResponse: VerifyInterdictionResponse = {
        success: true,
        verifiedCount: 0,
        errors: [],
        verifiedAuditKeys: [],
        failedAuditKeys: []
      };
      mockApiService.post.and.returnValue(of(emptyResponse));

      const request: VerifyInterdictionRequest = {
        auditKeys: []
      };

      service.verifyInterdictions(request).subscribe((result) => {
        expect(result.success).toBeTrue();
        expect(result.verifiedCount).toBe(0);
        done();
      });
    });

    it('should handle verification API errors', (done) => {
      const error = new Error('Verification API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      const request: VerifyInterdictionRequest = {
        auditKeys: [1, 2]
      };

      service.verifyInterdictions(request).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('getFilterDropdownOptions', () => {
    it('should fetch filter dropdown options successfully', (done) => {
      const apiResponse = {
        data: [mockFilterDropdownData],
        success: true
      };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getFilterDropdownOptions().subscribe((result) => {
        expect(result.data.length).toBe(1);
        expect(result.data[0].cueOptions.length).toBe(3);
        expect(result.data[0].typeOptions.length).toBe(3);
        done();
      });
    });

    it('should construct correct API endpoint for filter dropdown', (done) => {
      const apiResponse = {
        data: [mockFilterDropdownData],
        success: true
      };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getFilterDropdownOptions().subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          '/api/v1/application-admin/lab-interdiction-override-tech2/filter-dropdown'
        );
        done();
      });
    });

    it('should handle filter dropdown API errors', (done) => {
      const error = new Error('Filter Dropdown API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getFilterDropdownOptions().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });
});
