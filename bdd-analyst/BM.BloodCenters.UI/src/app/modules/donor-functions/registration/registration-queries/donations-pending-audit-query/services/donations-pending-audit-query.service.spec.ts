import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { DonationsPendingAuditQueryService } from './donations-pending-audit-query.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  DonationsPendingAuditQueryDto,
  DonationsPendingAuditDto,
  DriveOption
} from '../models/donations-pending-audit-query.model';

describe('DonationsPendingAuditQueryService', () => {
  let service: DonationsPendingAuditQueryService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DonationsPendingAuditQueryService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(DonationsPendingAuditQueryService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('searchDonationsPendingAudit', () => {
    it('should call API service with correct endpoint and parameters', (done) => {
      const mockRequest: DonationsPendingAuditQueryDto = {
        fromDate: '2024-01-01',
        toDate: '2024-01-31',
        driveId: 'DRV001',
        status: 'R',
        sortColumn: 'insertDate',
        sortOrder: 'DESC',
        take: 25,
        skip: 0
      };

      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: {
          resp: [
            {
              unitId: '1234567890123',
              driveId: 'DRV001',
              collDate: '2024-01-15',
              donorId: 'DN12345',
              donationType: 'WB',
              procedureCode: 'PR001',
              insertUser: 'USER01',
              insertDate: '2024-01-15T10:30:00Z',
              transactionId: '123456'
            }
          ] as DonationsPendingAuditDto[],
          donationType: [{ value: 'WB', label: 'Whole Blood' }],
          procedureCode: [{ value: 'PR001', label: 'Procedure 001' }]
        },
        totalCount: 1
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.searchDonationsPendingAudit(mockRequest).subscribe({
        next: (result) => {
          expect(apiService.post).toHaveBeenCalledWith(
            API.DONOR_FUNCTIONS.DONATIONS_PENDING_AUDIT.SEARCH,
            mockRequest
          );
          expect(result.data.resp.length).toBe(1);
          expect(result.data.donationType.length).toBe(1);
          expect(result.data.procedureCode.length).toBe(1);
          expect(result.totalCount).toBe(1);
          expect(result.data.resp[0].unitId).toBe('1234567890123');
          done();
        }
      });
    });

    it('should handle empty response data', (done) => {
      const mockRequest: DonationsPendingAuditQueryDto = {
        fromDate: '2024-01-01',
        toDate: '2024-01-31',
        status: 'R',
        driveId: null,
        sortColumn: 'insertDate',
        sortOrder: 'DESC',
        take: 25,
        skip: 0
      };

      const mockResponse = {
        success: true,
        message: 'No data found',
        statusCode: 200,
        data: undefined,
        totalCount: undefined
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.searchDonationsPendingAudit(mockRequest).subscribe({
        next: (result) => {
          expect(result.data.resp).toEqual([]);
          expect(result.data.donationType).toEqual([]);
          expect(result.data.procedureCode).toEqual([]);
          expect(result.totalCount).toBe(0);
          done();
        }
      });
    });

  });

  describe('getDrivesDropdown', () => {
    it('should call API service with date parameters', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          { driveId: 'DRV001', sponsorName: 'Test Drive 1', driveDate: '2024-01-15' },
          { driveId: 'DRV002', sponsorName: 'Test Drive 2', driveDate: '2024-01-16' }
        ] as DriveOption[]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getDrivesDropdown('2024-01-01', '2024-01-31').subscribe({
        next: (result) => {
          expect(apiService.get).toHaveBeenCalled();
          expect(result.data.length).toBe(2);
          expect(result.data[0].driveId).toBe('DRV001');
          done();
        }
      });
    });

    it('should handle empty drive list', (done) => {
      const mockResponse = {
        success: true,
        message: 'No drives found',
        statusCode: 200,
        data: undefined
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getDrivesDropdown().subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          done();
        }
      });
    });

  });
});
