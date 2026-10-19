import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { DonationDeferralAuditService } from './donation-deferral-audit.service';
import { ApiService } from '@shared/services/api.service';
import { DonationDeferralAuditDto, ApiResponse } from '../models/donation-deferral-audit.model';

describe('DonationDeferralAuditService', () => {
  let service: DonationDeferralAuditService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockTransactionId = 'TR02867427';
  const mockAuditData: DonationDeferralAuditDto = {
    transactionId: mockTransactionId,
    unitId: 'U001',
    deferralId: null,
    signatureFlag: 'Y',
    donationType: 'Alogenic',
    procedureCode: 'PP',
    auditDate: new Date('2019-03-03T19:57:00Z'),
    auditUserName: 'Hunter, Celeste',
    isAbbreviatedDhq: false,
    healthHistory: [
      {
        questionCode: 'HQ0071',
        questionSequence: '1',
        response: 'Yes',
        answerCode: '4WAY4',
        answerDescription: '4-Way Cold Tablets',
        startDate: new Date('2019-02-28'),
        endDate: new Date('2019-03-03'),
        interCode: null,
        incidentDate: new Date('2019-03-03'),
        deferralThruDate: new Date('2019-03-03'),
        deferralPeriod: null,
        periodType: null,
        comments: 'Test comment',
      },
    ],
    physicalFindings: [
      {
        physicalCode: 'HQ0071',
        codeDescription: 'Arm Check',
        physicalValue: '120',
        interCode: null,
        interDescription: null,
        comments: null,
      },
    ],
  };

  const mockApiResponse: ApiResponse<DonationDeferralAuditDto> = {
    success: true,
    statusCode: 200,
    message: 'Audit details retrieved successfully',
    data: mockAuditData,
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DonationDeferralAuditService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(DonationDeferralAuditService);
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });
  describe('getAuditDetails', () => {
    it('should retrieve audit details successfully', (done) => {
      mockApiService.get.and.returnValue(of(mockApiResponse));

      service.getAuditDetails(mockTransactionId).subscribe({
        next: (data) => {
          expect(data).toEqual(mockAuditData);
          expect(data.transactionId).toBe(mockTransactionId);
          expect(data.healthHistory.length).toBe(1);
          expect(data.physicalFindings.length).toBe(1);
          done();
        },
        error: () => fail('Should not have errored'),
      });
    });

    it('should call API with correct URL', () => {
      mockApiService.get.and.returnValue(of(mockApiResponse));

      service.getAuditDetails(mockTransactionId).subscribe();

      const calledUrl: string = mockApiService.get.calls.mostRecent().args[0];
      expect(calledUrl).toContain(`/api/v1/donation-deferral-audit/${mockTransactionId}`);
    });

    it('should handle empty transaction ID', (done) => {
      service.getAuditDetails('').subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.error.message).toBe('Transaction ID is required');
          done();
        },
      });

      expect(mockApiService.get).not.toHaveBeenCalled();
    });

    it('should handle null transaction ID', (done) => {
      service.getAuditDetails(null as any).subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.error.message).toBe('Transaction ID is required');
          done();
        },
      });

      expect(mockApiService.get).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only transaction ID', (done) => {
      service.getAuditDetails('   ').subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.error.message).toBe('Transaction ID is required');
          done();
        },
      });

      expect(mockApiService.get).not.toHaveBeenCalled();
    });



    it('should handle 500 server error', (done) => {
      mockApiService.get.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'An error occurred while retrieving audit details' } }))
      );

      service.getAuditDetails(mockTransactionId).subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.error.message).toContain('An error occurred while retrieving audit details');
          done();
        },
      });
    });



    it('should handle response with null data', (done) => {
      const responseWithNullData: ApiResponse<DonationDeferralAuditDto> = {
        success: false,
        statusCode: 200,
        message: 'No data',
        data: null as any,
      };

      mockApiService.get.and.returnValue(of(responseWithNullData));

      service.getAuditDetails(mockTransactionId).subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });
    });


    it('should URL encode special characters in transaction ID', () => {
      const specialTransactionId = 'TR/2024#01';
      mockApiService.get.and.returnValue(of(mockApiResponse));

      service.getAuditDetails(specialTransactionId).subscribe();

      const calledUrl: string = mockApiService.get.calls.mostRecent().args[0];
      expect(calledUrl).toContain(encodeURIComponent(specialTransactionId));
    });
  });
});
