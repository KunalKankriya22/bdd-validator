import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DonorProfileAuditQueryService } from './donor-profile-audit-query.service';
import { API } from 'src/app/core/constants/api.constants';
import { ApiService } from '@shared/services/api.service';
import {
  DonorProfileAuditQueryDto,
  DonorProfileAuditResultDto,
  DonorProfileAuditDetailDto,
  DonorSearchRequest,
  DonorSearchResultDto
} from '../models/donor-profile-audit-query.model';

describe('DonorProfileAuditQueryService', () => {
  let service: DonorProfileAuditQueryService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockAuditResults: DonorProfileAuditResultDto[] = [
    {
      rowNum: 1,
      insertDate: '2025-01-15T10:30:00',
      insertUser: 'JOHN.DOE',
      programId: 'DPUVDAT',
      tableName: 'DONORS',
      dataDetails: 'Updated phone number',
      recNum: 12345,
      colNum: 1,
      detailsAvailable: true
    },
    {
      rowNum: 2,
      insertDate: '2025-01-14T14:20:00',
      insertUser: 'JANE.SMITH',
      programId: 'DONREG',
      tableName: 'DONOR_INTERDIC',
      dataDetails: 'Added deferral',
      recNum: 12346,
      colNum: 1,
      detailsAvailable: false
    }
  ];

  const mockAuditDetail: DonorProfileAuditDetailDto = {
    recordId: 12345,
    insertDate: '2025-01-15T10:30:00',
    insertUser: 'JOHN.DOE',
    programId: 'DPUVDAT',
    tableName: 'DONORS',
    changes: [
      {
        colNum: 1,
        columnName: 'PHONE_NUMBER',
        oldValue: '5551234567',
        newValue: '5559876543'
      },
      {
        colNum: 2,
        columnName: 'UPDATED_DATE',
        oldValue: '2025-01-14',
        newValue: '2025-01-15'
      }
    ]
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        DonorProfileAuditQueryService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(DonorProfileAuditQueryService);
  });

  describe('queryAuditRecords', () => {
    it('should query audit records successfully', () => {
      // Arrange
      const criteria: DonorProfileAuditQueryDto = {
        donorId: 'DN3012085',
        fromDate: '2025-01-01',
        toDate: '2025-01-31'
      };
      const take = 25;
      const skip = 0;

      mockApiService.post.and.returnValue(of({
        success: true,
        data: mockAuditResults,
        total: 2
      }));

      // Act & Assert
      service.queryAuditRecords(criteria, take, skip).subscribe(response => {
        expect(response.data).toEqual(mockAuditResults);
        expect(response.total).toBe(2);
      });

      const expectedEndpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.QUERY(take, skip, false);
      expect(mockApiService.post).toHaveBeenCalledWith(expectedEndpoint, criteria);
    });

    it('should append insertUser query parameter when provided in criteria', () => {
      // Arrange
      const criteria: DonorProfileAuditQueryDto = {
        donorId: 'DN3012085',
        insertUser: 'JOHN.DOE'
      };

      mockApiService.post.and.returnValue(of({ data: mockAuditResults, total: 2 }));

      // Act
      service.queryAuditRecords(criteria, 25, 0).subscribe();

      // Assert
      const expectedEndpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.QUERY(25, 0, false)
        + '?insertUser=JOHN.DOE';
      expect(mockApiService.post).toHaveBeenCalledWith(expectedEndpoint, criteria);
    });

    it('should append searchText query parameter when provided', () => {
      // Arrange
      const criteria: DonorProfileAuditQueryDto = { donorId: 'DN3012085' };

      mockApiService.post.and.returnValue(of({ data: [], total: 0 }));

      // Act
      service.queryAuditRecords(criteria, 25, 0, false, 'phone').subscribe();

      // Assert
      const expectedEndpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.QUERY(25, 0, false)
        + '?searchText=phone';
      expect(mockApiService.post).toHaveBeenCalledWith(expectedEndpoint, criteria);
    });

    it('should trim searchText before appending to query parameters', () => {
      // Arrange
      const criteria: DonorProfileAuditQueryDto = { donorId: 'DN3012085' };

      mockApiService.post.and.returnValue(of({ data: [], total: 0 }));

      // Act
      service.queryAuditRecords(criteria, 25, 0, false, '  phone  ').subscribe();

      // Assert
      const expectedEndpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.QUERY(25, 0, false)
        + '?searchText=phone';
      expect(mockApiService.post).toHaveBeenCalledWith(expectedEndpoint, criteria);
    });

    it('should not append searchText when it is whitespace only', () => {
      // Arrange
      const criteria: DonorProfileAuditQueryDto = { donorId: 'DN3012085' };

      mockApiService.post.and.returnValue(of({ data: [], total: 0 }));

      // Act
      service.queryAuditRecords(criteria, 25, 0, false, '   ').subscribe();

      // Assert
      const expectedEndpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.QUERY(25, 0, false);
      expect(mockApiService.post).toHaveBeenCalledWith(expectedEndpoint, criteria);
    });

    it('should append tableName query parameter when provided', () => {
      // Arrange
      const criteria: DonorProfileAuditQueryDto = { donorId: 'DN3012085' };

      mockApiService.post.and.returnValue(of({ data: [], total: 0 }));

      // Act
      service.queryAuditRecords(criteria, 25, 0, false, undefined, 'DONORS').subscribe();

      // Assert
      const expectedEndpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.QUERY(25, 0, false)
        + '?tableName=DONORS';
      expect(mockApiService.post).toHaveBeenCalledWith(expectedEndpoint, criteria);
    });

    it('should trim tableName before appending to query parameters', () => {
      // Arrange
      const criteria: DonorProfileAuditQueryDto = { donorId: 'DN3012085' };

      mockApiService.post.and.returnValue(of({ data: [], total: 0 }));

      // Act
      service.queryAuditRecords(criteria, 25, 0, false, undefined, '  DONORS  ').subscribe();

      // Assert
      const expectedEndpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.QUERY(25, 0, false)
        + '?tableName=DONORS';
      expect(mockApiService.post).toHaveBeenCalledWith(expectedEndpoint, criteria);
    });

    it('should not append tableName when it is whitespace only', () => {
      // Arrange
      const criteria: DonorProfileAuditQueryDto = { donorId: 'DN3012085' };

      mockApiService.post.and.returnValue(of({ data: [], total: 0 }));

      // Act
      service.queryAuditRecords(criteria, 25, 0, false, undefined, '   ').subscribe();

      // Assert
      const expectedEndpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.QUERY(25, 0, false);
      expect(mockApiService.post).toHaveBeenCalledWith(expectedEndpoint, criteria);
    });

    it('should use ? separator when expandAll is false and query params exist', () => {
      // Arrange
      const criteria: DonorProfileAuditQueryDto = {
        donorId: 'DN3012085',
        insertUser: 'ADMIN'
      };

      mockApiService.post.and.returnValue(of({ data: [], total: 0 }));

      // Act
      service.queryAuditRecords(criteria, 25, 0, false).subscribe();

      // Assert
      const expectedEndpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.QUERY(25, 0, false)
        + '?insertUser=ADMIN';
      expect(mockApiService.post).toHaveBeenCalledWith(expectedEndpoint, criteria);
    });

    it('should use & separator when expandAll is true and query params exist', () => {
      // Arrange
      const criteria: DonorProfileAuditQueryDto = {
        donorId: 'DN3012085',
        insertUser: 'JOHN.DOE'
      };

      mockApiService.post.and.returnValue(of({ data: mockAuditResults, total: 2 }));

      // Act
      service.queryAuditRecords(criteria, 25, 0, true).subscribe();

      // Assert
      const expectedEndpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.QUERY(25, 0, true)
        + '&insertUser=JOHN.DOE';
      expect(mockApiService.post).toHaveBeenCalledWith(expectedEndpoint, criteria);
    });

    it('should build endpoint with expandAll true and no additional query params', () => {
      // Arrange
      const criteria: DonorProfileAuditQueryDto = { donorId: 'DN3012085' };

      mockApiService.post.and.returnValue(of({ data: [], total: 0 }));

      // Act
      service.queryAuditRecords(criteria, 25, 0, true).subscribe();

      // Assert
      const expectedEndpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.QUERY(25, 0, true);
      expect(mockApiService.post).toHaveBeenCalledWith(expectedEndpoint, criteria);
    });

    it('should append multiple query parameters joined by &', () => {
      // Arrange
      const criteria: DonorProfileAuditQueryDto = {
        donorId: 'DN3012085',
        insertUser: 'JOHN.DOE'
      };

      mockApiService.post.and.returnValue(of({ data: [], total: 0 }));

      // Act
      service.queryAuditRecords(criteria, 25, 0, false, 'phone', 'DONORS').subscribe();

      // Assert
      const expectedEndpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.QUERY(25, 0, false)
        + '?insertUser=JOHN.DOE&searchText=phone&tableName=DONORS';
      expect(mockApiService.post).toHaveBeenCalledWith(expectedEndpoint, criteria);
    });

    it('should append multiple query parameters with & separator when expandAll is true', () => {
      // Arrange
      const criteria: DonorProfileAuditQueryDto = {
        donorId: 'DN3012085',
        insertUser: 'ADMIN'
      };

      mockApiService.post.and.returnValue(of({ data: [], total: 0 }));

      // Act
      service.queryAuditRecords(criteria, 10, 5, true, 'address', 'DONOR_INTERDIC').subscribe();

      // Assert
      const expectedEndpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.QUERY(10, 5, true)
        + '&insertUser=ADMIN&searchText=address&tableName=DONOR_INTERDIC';
      expect(mockApiService.post).toHaveBeenCalledWith(expectedEndpoint, criteria);
    });

    it('should encode special characters in query parameter values', () => {
      // Arrange
      const criteria: DonorProfileAuditQueryDto = {
        donorId: 'DN3012085',
        insertUser: 'JOHN DOE&CO'
      };

      mockApiService.post.and.returnValue(of({ data: [], total: 0 }));

      // Act
      service.queryAuditRecords(criteria, 25, 0).subscribe();

      // Assert
      const expectedEndpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.QUERY(25, 0, false)
        + '?insertUser=' + encodeURIComponent('JOHN DOE&CO');
      expect(mockApiService.post).toHaveBeenCalledWith(expectedEndpoint, criteria);
    });

    it('should return empty data array when response data is null', () => {
      // Arrange
      const criteria: DonorProfileAuditQueryDto = { donorId: 'DN3012085' };

      mockApiService.post.and.returnValue(of({ success: true, data: null, total: 5 }));

      // Act & Assert
      service.queryAuditRecords(criteria, 25, 0).subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.total).toBe(5);
      });
    });

    it('should return zero total when response total is null', () => {
      // Arrange
      const criteria: DonorProfileAuditQueryDto = { donorId: 'DN3012085' };

      mockApiService.post.and.returnValue(of({ success: true, data: mockAuditResults, total: null }));

      // Act & Assert
      service.queryAuditRecords(criteria, 25, 0).subscribe(response => {
        expect(response.data).toEqual(mockAuditResults);
        expect(response.total).toBe(0);
      });
    });

    it('should return empty data array and zero total when both are undefined', () => {
      // Arrange
      const criteria: DonorProfileAuditQueryDto = { donorId: 'DN3012085' };

      mockApiService.post.and.returnValue(of({ success: true }));

      // Act & Assert
      service.queryAuditRecords(criteria, 25, 0).subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.total).toBe(0);
      });
    });

    it('should propagate errors from the API', (done) => {
      // Arrange
      const criteria: DonorProfileAuditQueryDto = { donorId: 'DN3012085' };
      const errorResponse = { status: 500, message: 'Internal Server Error' };

      mockApiService.post.and.returnValue(throwError(() => errorResponse));

      // Act & Assert
      service.queryAuditRecords(criteria, 25, 0).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getAuditDetail', () => {
    it('should get audit detail successfully', () => {
      // Arrange
      const recordId = 12345;

      mockApiService.get.and.returnValue(of({
        success: true,
        data: mockAuditDetail
      }));

      // Act & Assert
      service.getAuditDetail(recordId).subscribe(detail => {
        expect(detail).toEqual(mockAuditDetail);
        expect(detail?.changes.length).toBe(2);
      });

      const expectedEndpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.DETAIL(recordId);
      expect(mockApiService.get).toHaveBeenCalledWith(expectedEndpoint);
    });

    it('should return null when response data is null', () => {
      // Arrange
      mockApiService.get.and.returnValue(of({ success: true, data: null }));

      // Act & Assert
      service.getAuditDetail(99999).subscribe(detail => {
        expect(detail).toBeNull();
      });

      const expectedEndpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.DETAIL(99999);
      expect(mockApiService.get).toHaveBeenCalledWith(expectedEndpoint);
    });

    it('should return null when response data is undefined', () => {
      // Arrange
      mockApiService.get.and.returnValue(of({ success: true }));

      // Act & Assert
      service.getAuditDetail(55555).subscribe(detail => {
        expect(detail).toBeNull();
      });

      const expectedEndpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.DETAIL(55555);
      expect(mockApiService.get).toHaveBeenCalledWith(expectedEndpoint);
    });

    it('should call the correct endpoint with the given recordId', () => {
      // Arrange
      const recordId = 67890;
      mockApiService.get.and.returnValue(of({ success: true, data: mockAuditDetail }));

      // Act
      service.getAuditDetail(recordId).subscribe();

      // Assert
      const expectedEndpoint = API.DONOR_FUNCTIONS.DONOR_PROFILE_AUDIT_QUERY.DETAIL(recordId);
      expect(mockApiService.get).toHaveBeenCalledWith(expectedEndpoint);
    });

    it('should propagate errors from the API', (done) => {
      // Arrange
      const errorResponse = { status: 404, message: 'Not Found' };

      mockApiService.get.and.returnValue(throwError(() => errorResponse));

      // Act & Assert
      service.getAuditDetail(99999).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('searchDonors', () => {
    const mockDonors: DonorSearchResultDto[] = [
      {
        donorId: 'DN3012085',
        lastName: 'SMITH',
        firstName: 'JOHN',
        middleName: 'A',
        dateOfBirth: '1980-05-15',
        sex: 'Male',
        aboRh: 'O POS',
        address: '123 Main St',
        phoneNumber: '5551234567'
      }
    ];

    it('should search donors successfully', () => {
      // Arrange
      const criteria: DonorSearchRequest = {
        lastName: 'SMITH',
        firstName: 'JOHN',
      };

      mockApiService.post.and.returnValue(of({ success: true, data: mockDonors }));

      // Act & Assert
      service.searchDonors(criteria).subscribe(donors => {
        expect(donors).toEqual(mockDonors);
        expect(donors.length).toBe(1);
      });

      expect(mockApiService.post).toHaveBeenCalledWith(API.SEARCH_FOR_DONOR.SEARCH, criteria);
    });

    it('should handle items property in response when data is absent', () => {
      // Arrange
      const criteria: DonorSearchRequest = { lastName: 'SMITH' };

      mockApiService.post.and.returnValue(of({ success: true, items: mockDonors }));

      // Act & Assert
      service.searchDonors(criteria).subscribe(donors => {
        expect(donors).toEqual(mockDonors);
      });
    });

    it('should prefer data over items when both are present', () => {
      // Arrange
      const criteria: DonorSearchRequest = { lastName: 'SMITH' };
      const itemsDonors: DonorSearchResultDto[] = [{
        donorId: 'DN9999999',
        lastName: 'OTHER',
        firstName: 'PERSON',
        dateOfBirth: '1990-01-01',
        sex: 'Female',
        aboRh: 'A NEG'
      }];

      mockApiService.post.and.returnValue(of({
        success: true,
        data: mockDonors,
        items: itemsDonors
      }));

      // Act & Assert
      service.searchDonors(criteria).subscribe(donors => {
        expect(donors).toEqual(mockDonors);
      });
    });

    it('should return empty array when no donors found', () => {
      // Arrange
      const criteria: DonorSearchRequest = { lastName: 'NONEXISTENT' };

      mockApiService.post.and.returnValue(of({ success: false, data: null }));

      // Act & Assert
      service.searchDonors(criteria).subscribe(donors => {
        expect(donors).toEqual([]);
      });
    });

    it('should return empty array when response has no data or items', () => {
      // Arrange
      const criteria: DonorSearchRequest = { lastName: 'NOBODY' };

      mockApiService.post.and.returnValue(of({ success: true }));

      // Act & Assert
      service.searchDonors(criteria).subscribe(donors => {
        expect(donors).toEqual([]);
      });
    });

    it('should call the correct endpoint with the given criteria', () => {
      // Arrange
      const criteria: DonorSearchRequest = {
        lastName: 'DOE',
        firstName: 'JANE',
        donorId: 'DN1234567'
      };

      mockApiService.post.and.returnValue(of({ success: true, data: [] }));

      // Act
      service.searchDonors(criteria).subscribe();

      // Assert
      expect(mockApiService.post).toHaveBeenCalledWith(API.SEARCH_FOR_DONOR.SEARCH, criteria);
    });

    it('should propagate errors from the API', (done) => {
      // Arrange
      const criteria: DonorSearchRequest = { lastName: 'SMITH' };
      const errorResponse = { status: 500, message: 'Server Error' };

      mockApiService.post.and.returnValue(throwError(() => errorResponse));

      // Act & Assert
      service.searchDonors(criteria).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });
});
