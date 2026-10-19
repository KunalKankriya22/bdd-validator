import { of, throwError } from 'rxjs';
import { DonorInterdictionOverrideService } from './donor-interdiction-override.service';
import { ApiService } from '../../../../shared/services/api.service';
import {
  DonorInterdictionOverrideModel,
  DonorInterdictionOverrideParamsDto,
  VerifyInterdictionRequest,
  VerifyInterdictionResponse
} from '../models/donor-interdiction-override.model';

describe('DonorInterdictionOverrideService', () => {
  let service: DonorInterdictionOverrideService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockDonorInterdictionData: DonorInterdictionOverrideModel[] = [
    {
      audit_Key: 1,
      donorDecisionCode: 'ACC',
      decisionDesc: 'Acceptable',
      productType: 'RBC',
      prodTypeDesc: 'Red Blood Cells',
      attribGroup: 'GRP001',
      attribCode: 'ATTR001',
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
      audit_Key: 2,
      donorDecisionCode: 'DEF',
      decisionDesc: 'Deferred',
      productType: 'PLT',
      prodTypeDesc: 'Platelets',
      attribGroup: 'GRP002',
      attribCode: 'ATTR002',
      interCode: 'HBV',
      interDescription: 'Hepatitis B',
      interType: 'T',
      overrideDesc: 'Temporary override',
      effDate: '2025-02-01T00:00:00'
    }
  ];

  const mockSearchResponse = {
    data: mockDonorInterdictionData,
    totalCount: 2
  };

  const mockVerifyResponse: VerifyInterdictionResponse = {
    success: true,
    verifiedCount: 2,
    errors: [],
    verifiedAuditKeys: [1, 2],
    failedAuditKeys: []
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

        service = new DonorInterdictionOverrideService(mockApiService as any);
  });

  describe('getDonorInterdictionOverrides', () => {
    it('should fetch donor interdiction overrides successfully', (done) => {
      mockApiService.post.and.returnValue(of(mockSearchResponse));

      const params: DonorInterdictionOverrideParamsDto = {
        skip: 0,
        take: 10
      };

      service.getDonorInterdictionOverrides(params).subscribe((result) => {
        expect(result.data.length).toBe(2);
        expect(result.totalRecords).toBe(2);
        expect(result.data[0].audit_Key).toBe(1);
        expect(result.data[0].donorDecisionCode).toBe('ACC');
        expect(result.data[1].interType).toBe('T');
        done();
      });
    });

    it('should construct correct API endpoint', (done) => {
      mockApiService.post.and.returnValue(of(mockSearchResponse));

      const params: DonorInterdictionOverrideParamsDto = {
        skip: 0,
        take: 10
      };

      service.getDonorInterdictionOverrides(params).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          '/api/v1/application-admin/donor-interdiction-override-tech2/search',
          params
        );
        done();
      });
    });

    it('should include all filter fields in request payload', (done) => {
      mockApiService.post.and.returnValue(of(mockSearchResponse));

      const params: DonorInterdictionOverrideParamsDto = {
        donorDecisionCode: 'ACC',
        interType: 'P',
        effectiveDate: '2025-01-01',
        periodEffDate: 'after',
        terminationDate: '2025-12-31',
        periodTermDate: 'before',
        searchText: 'HIV',
        sortOrder: 'asc',
        sortColumn: 'donorDecisionCode',
        skip: 0,
        take: 10
      };

      service.getDonorInterdictionOverrides(params).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          '/api/v1/application-admin/donor-interdiction-override-tech2/search',
          jasmine.objectContaining({
            donorDecisionCode: 'ACC',
            interType: 'P',
            effectiveDate: '2025-01-01',
            periodEffDate: 'after',
            terminationDate: '2025-12-31',
            periodTermDate: 'before',
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
          '/api/v1/application-admin/donor-interdiction-override-tech2/verify',
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
});
