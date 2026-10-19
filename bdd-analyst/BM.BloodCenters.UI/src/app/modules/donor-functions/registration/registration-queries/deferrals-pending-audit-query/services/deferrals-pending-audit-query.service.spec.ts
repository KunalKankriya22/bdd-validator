import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DeferralsPendingAuditQueryService } from './deferrals-pending-audit-query.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('DeferralsPendingAuditQueryService', () => {
  let service: DeferralsPendingAuditQueryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['post', 'get']);

    TestBed.configureTestingModule({
      providers: [
        DeferralsPendingAuditQueryService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(DeferralsPendingAuditQueryService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('searchDeferralsPendingAudit', () => {
    it('should call API with correct parameters and map response', (done) => {
      // Arrange
      const request = {
        fromDate: '2024-01-01',
        toDate: '2024-01-31',
        driveId: null,
        status: 'R',
        donationType: null,
        procedureCode: null,
        searchKeyword: null,
        sortColumn: 'deferralId',
        sortOrder: 'ASC',
        skip: 0,
        take: 25
      };
      const mockApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: {
          resp: [],
          donationType: [{ value: 'AL', label: 'AL' }],
          procedureCode: [{ value: 'WB', label: 'WB' }]
        },
        totalCount: 0
      };
      apiServiceSpy.post.and.returnValue(of(mockApiResponse));

      // Act
      service.searchDeferralsPendingAudit(request).subscribe({
        next: (response) => {
          // Assert
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.DONOR_FUNCTIONS.DEFERRALS_PENDING_AUDIT.SEARCH,
            request
          );
          expect(response.data.resp).toEqual([]);
          expect(response.data.donationType).toEqual([{ value: 'AL', label: 'AL' }]);
          expect(response.data.procedureCode).toEqual([{ value: 'WB', label: 'WB' }]);
          expect(response.totalCount).toEqual(0);
          done();
        }
      });
    });

  });

  describe('getDrivesDropdown', () => {
    it('should call API and map response', (done) => {
      // Arrange
      const mockResponse = { data: [{ driveId: 'D001', sponsorName: 'Sponsor 1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getDrivesDropdown('2024-01-01', '2024-01-31').subscribe({
        next: (response) => {
          // Assert
          expect(apiServiceSpy.get).toHaveBeenCalled();
          expect(response.data).toEqual([{ driveId: 'D001', sponsorName: 'Sponsor 1' }]);
          done();
        }
      });
    });
  });
});
