import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MultipleDonorsQueryService } from './multiple-donors-query.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  DonorSearchResult,
  MultipleDonorsSearchRequest,
} from '../models/multiple-donors-query.model';
import { of, throwError } from 'rxjs';

describe('MultipleDonorsQueryService', () => {
  let service: MultipleDonorsQueryService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockDonorData: DonorSearchResult[] = [
    {
      donorId: 'DN00017648',
      donorName: 'ROGERS ALLESIA',
      dateOfBirth: '1994-01-11',
      dobDay: 'TUE',
      gender: 'Female',
      bloodType: 'O+',
      totalDonations: 0,
      totalCredits: 0,
      totalGallons: 0,
      lastDonationDate: null,
      lastUnitId: null,
      dayPhoneNo: '414-645-0340',
      homePhoneNo: '414-442-7022',
      mobilePhone: null,
      donorAddress: '3432 W HADLEY ST YOUR CITY, AK 0000'
    },
    {
      donorId: 'DN00018201',
      donorName: 'ROGERS JAMES',
      dateOfBirth: '1988-02-22',
      dobDay: 'MON',
      gender: 'Male',
      bloodType: 'A+',
      totalDonations: 1,
      totalCredits: 0,
      totalGallons: 0,
      lastDonationDate: null,
      lastUnitId: null,
      dayPhoneNo: null,
      homePhoneNo: '555-123-4567',
      mobilePhone: '555-987-6543',
      donorAddress: '123 MAIN ST ANYTOWN, CA 90210'
    }
  ];

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MultipleDonorsQueryService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(MultipleDonorsQueryService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('searchDonors', () => {
    it('should call POST /multiple-donors-query/search with take/skip in URL', (done) => {
      const params: MultipleDonorsSearchRequest = {
        lastName: 'ROGERS',
        searchMode: 'LIKE',
        gender: 'E'
      };

      const mockResponse = {
        success: true,
        data: mockDonorData,
        total: 2,
        message: ''
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.searchDonors(params, 10, 0).subscribe({
        next: (result) => {
          expect(apiService.post).toHaveBeenCalledWith(
            API.DONOR.MULTIPLE_DONORS_QUERY_SEARCH(10, 0),
            params
          );
          expect(result.data.length).toBe(2);
          expect(result.totalRecords).toBe(2);
          done();
        }
      });
    });

    it('should map response fields correctly', (done) => {
      const params: MultipleDonorsSearchRequest = { donorId: 'DN00017648' };
      const mockResponse = {
        success: true,
        data: [mockDonorData[0]],
        total: 1,
        message: 'Success'
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.searchDonors(params, 10, 0).subscribe({
        next: (result) => {
          expect(result.data[0].donorId).toBe('DN00017648');
          expect(result.data[0].donorName).toBe('ROGERS ALLESIA');
          expect(result.data[0].bloodType).toBe('O+');
          expect(result.data[0].totalDonations).toBe(0);
          expect(result.totalRecords).toBe(1);
          expect(result.message).toBe('Success');
          done();
        }
      });
    });


    it('should propagate error with displayMessage from backend validation', (done) => {
      const params: MultipleDonorsSearchRequest = {};
      const errorResponse = {
        status: 400,
        error: {
          errorResponse: { error: 'Search returned too many results' }
        }
      };

      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.searchDonors(params, 10, 0).subscribe({
        error: (error) => {
          expect(error.displayMessage).toBe('Search returned too many results');
          done();
        }
      });
    });

    it('should handle 500 server error', (done) => {
      const params: MultipleDonorsSearchRequest = {};
      const errorResponse = { status: 500, statusText: 'Internal Server Error' };

      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.searchDonors(params, 10, 0).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });
    });

    it('should pass all search parameters correctly with take/skip in URL', (done) => {
      const params: MultipleDonorsSearchRequest = {
        lastName: 'ROGERS',
        firstName: 'JAMES',
        searchMode: 'SOUNDEX',
        dateOfBirth: '1988-02-22',
        gender: 'M',
        phone: '5551234567',
        donorId: 'DN00018201',
        previousDonorId: '',
        collectionDate: '2025-01-01',
        unitId: '1234567'
      };

      apiService.post.and.returnValue(of({ data: [], total: 0 }));

      service.searchDonors(params, 25, 50).subscribe({
        next: () => {
          expect(apiService.post).toHaveBeenCalledWith(
            API.DONOR.MULTIPLE_DONORS_QUERY_SEARCH(25, 50),
            params
          );
          done();
        }
      });
    });
  });

  describe('getMaxRowsLimit', () => {
    it('should call GET /multiple-donors-query/max-rows-limit', (done) => {
      const mockResponse = {
        success: true,
        item: 200,
        data: [200]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getMaxRowsLimit().subscribe({
        next: (result) => {
          expect(apiService.get).toHaveBeenCalledWith(
            API.DONOR.MULTIPLE_DONORS_QUERY_MAX_ROWS
          );
          expect(result).toBe(200);
          done();
        }
      });
    });

    it('should return default 200 on error', (done) => {
      apiService.get.and.returnValue(throwError(() => ({ status: 500 })));

      service.getMaxRowsLimit().subscribe({
        next: (result) => {
          expect(result).toBe(200);
          done();
        }
      });
    });

    it('should return default 200 when item is missing', (done) => {
      apiService.get.and.returnValue(of({ success: true }));

      service.getMaxRowsLimit().subscribe({
        next: (result) => {
          expect(result).toBe(200);
          done();
        }
      });
    });
  });
});
