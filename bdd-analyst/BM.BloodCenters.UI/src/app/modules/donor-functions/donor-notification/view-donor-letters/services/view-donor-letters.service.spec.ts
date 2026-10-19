import { TestBed } from '@angular/core/testing';
import { HttpParams } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ViewDonorLettersService } from './view-donor-letters.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../core/constants/api.constants';
import {
  DonorLetterDto,
  DonorLetterDetailDto,
  LetterCodeLookupDto,
  DonorLookupDto,
  ReturnResult,
  DonorLettersQueryParams,
  DonorLookupQueryParams,
} from '../models/view-donor-letters.model';

describe('ViewDonorLettersService', () => {
  let service: ViewDonorLettersService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockLetterData: DonorLetterDto[] = [
    {
      donorId: 'D001',
      letterSeqNo: '1',
      donorName: 'John Doe',
      letterCode: 'L001',
      generateDate: '2026-05-01T10:00:00Z',
      generatedByName: 'Admin User',
      authorizedByName: 'Manager User',
    },
  ];

  const mockLetterDetail: DonorLetterDetailDto = {
    ...mockLetterData[0],
    address: '123 Main St, Boston, MA 02101',
    phone: '555-1234',
    letterText: 'Thank you for your generous donation.',
  };

  const mockLetterCodes: LetterCodeLookupDto[] = [
    { letterCode: 'L001', title: 'Thank You Letter' },
    { letterCode: 'L002', title: 'Reminder Letter' },
  ];

  const mockDonors: DonorLookupDto[] = [
    { donorId: 'D001', name: 'John Doe' },
    { donorId: 'D002', name: 'Jane Smith' },
  ];

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [ViewDonorLettersService, { provide: ApiService, useValue: apiSpy }],
    });

    service = TestBed.inject(ViewDonorLettersService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('queryDonorLetters', () => {
    it('should query donor letters successfully', (done) => {
      const queryParams: DonorLettersQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
        take: 10,
        skip: 0,
      };

      const mockResponse: ReturnResult<DonorLetterDto> = {
        success: true,
        data: mockLetterData,
        total: 1,
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.queryDonorLetters(queryParams).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockLetterData);
          expect(result.total).toBe(1);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.DONOR_LETTERS.BASE,
            jasmine.objectContaining({ params: jasmine.any(HttpParams) })
          );
          done();
        },
      });
    });

    it('should use default take of 10 and skip of 0 when not provided', (done) => {
      const queryParams: DonorLettersQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
      };

      const mockResponse: ReturnResult<DonorLetterDto> = {
        success: true,
        data: mockLetterData,
        total: 1,
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.queryDonorLetters(queryParams).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('take')).toBe('10');
          expect(params.get('skip')).toBe('0');
          done();
        },
      });
    });

    it('should include letterCode param when provided', (done) => {
      const queryParams: DonorLettersQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
        letterCode: 'L001',
      };

      const mockResponse: ReturnResult<DonorLetterDto> = {
        success: true,
        data: mockLetterData,
        total: 1,
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.queryDonorLetters(queryParams).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('letterCode')).toBe('L001');
          done();
        },
      });
    });

    it('should include donorId param when provided', (done) => {
      const queryParams: DonorLettersQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
        donorId: 'D001',
      };

      const mockResponse: ReturnResult<DonorLetterDto> = {
        success: true,
        data: mockLetterData,
        total: 1,
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.queryDonorLetters(queryParams).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('donorId')).toBe('D001');
          done();
        },
      });
    });

    it('should include sortColumn and sortOrder params when provided', (done) => {
      const queryParams: DonorLettersQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
        sortColumn: 'generateDate',
        sortOrder: 'desc',
      };

      const mockResponse: ReturnResult<DonorLetterDto> = {
        success: true,
        data: mockLetterData,
        total: 1,
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.queryDonorLetters(queryParams).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('sortColumn')).toBe('generateDate');
          expect(params.get('sortOrder')).toBe('desc');
          done();
        },
      });
    });

    it('should include all optional params when all are provided', (done) => {
      const queryParams: DonorLettersQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
        take: 25,
        skip: 10,
        letterCode: 'L002',
        donorId: 'D005',
        sortColumn: 'donorName',
        sortOrder: 'asc',
      };

      const mockResponse: ReturnResult<DonorLetterDto> = {
        success: true,
        data: mockLetterData,
        total: 1,
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.queryDonorLetters(queryParams).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('fromDate')).toBe('2026-05-01');
          expect(params.get('toDate')).toBe('2026-05-12');
          expect(params.get('take')).toBe('25');
          expect(params.get('skip')).toBe('10');
          expect(params.get('letterCode')).toBe('L002');
          expect(params.get('donorId')).toBe('D005');
          expect(params.get('sortColumn')).toBe('donorName');
          expect(params.get('sortOrder')).toBe('asc');
          done();
        },
      });
    });

    it('should not include optional params when they are not provided', (done) => {
      const queryParams: DonorLettersQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
      };

      const mockResponse: ReturnResult<DonorLetterDto> = {
        success: true,
        data: mockLetterData,
        total: 1,
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.queryDonorLetters(queryParams).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.has('letterCode')).toBeFalse();
          expect(params.has('donorId')).toBeFalse();
          expect(params.has('sortColumn')).toBeFalse();
          expect(params.has('sortOrder')).toBeFalse();
          done();
        },
      });
    });

    it('should default data to empty array when response data is null', (done) => {
      const queryParams: DonorLettersQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
      };

      const mockResponse = {
        success: true,
        data: null as unknown as DonorLetterDto[],
        total: 0,
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.queryDonorLetters(queryParams).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          done();
        },
      });
    });

    it('should default data to empty array when response data is undefined', (done) => {
      const queryParams: DonorLettersQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
      };

      const mockResponse = {
        success: true,
        total: 5,
      } as ReturnResult<DonorLetterDto>;

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.queryDonorLetters(queryParams).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          done();
        },
      });
    });

    it('should default total to 0 when response total is null', (done) => {
      const queryParams: DonorLettersQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
      };

      const mockResponse = {
        success: true,
        data: mockLetterData,
        total: null as unknown as number,
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.queryDonorLetters(queryParams).subscribe({
        next: (result) => {
          expect(result.total).toBe(0);
          done();
        },
      });
    });

    it('should default total to 0 when response total is undefined', (done) => {
      const queryParams: DonorLettersQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
      };

      const mockResponse = {
        success: true,
        data: mockLetterData,
      } as ReturnResult<DonorLetterDto>;

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.queryDonorLetters(queryParams).subscribe({
        next: (result) => {
          expect(result.total).toBe(0);
          done();
        },
      });
    });

    it('should handle error when querying donor letters fails', (done) => {
      const queryParams: DonorLettersQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
      };

      const errorMessage = 'Network error';
      const consoleSpy = spyOn(console, 'error');
      apiServiceSpy.get.and.returnValue(throwError(() => new Error(errorMessage)));

      service.queryDonorLetters(queryParams).subscribe({
        error: (error) => {
          expect(error.message).toBe(errorMessage);
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error querying donor letters:',
            jasmine.any(Error)
          );
          done();
        },
      });
    });
  });

  describe('getDonorLetterDetail', () => {
    it('should fetch donor letter detail successfully', (done) => {
      const mockResponse = {
        success: true,
        data: mockLetterDetail,
        message: 'Success',
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonorLetterDetail('D001', '1').subscribe({
        next: (result) => {
          expect(result).toEqual(mockLetterDetail);
          expect(result!.letterText).toBe('Thank you for your generous donation.');
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.DONOR_LETTERS.DETAIL('D001', '1')
          );
          done();
        },
      });
    });

    it('should call the correct API endpoint with encoded params', (done) => {
      const mockResponse = {
        success: true,
        data: mockLetterDetail,
        message: 'Success',
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonorLetterDetail('D/001', '2').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.DONOR_LETTERS.DETAIL('D/001', '2')
          );
          done();
        },
      });
    });

    it('should return response data via map operator', (done) => {
      const detail: DonorLetterDetailDto = {
        donorId: 'D999',
        letterSeqNo: '5',
        donorName: 'Test User',
        address: '456 Elm St',
        phone: '555-9999',
        letterText: 'Sample letter text.',
      };

      const mockResponse = {
        success: true,
        data: detail,
        message: 'OK',
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonorLetterDetail('D999', '5').subscribe({
        next: (result) => {
          expect(result).toBe(detail);
          expect(result!.donorId).toBe('D999');
          expect(result!.address).toBe('456 Elm St');
          done();
        },
      });
    });

    it('should handle error when fetching detail fails', (done) => {
      const errorMessage = 'Detail not found';
      const consoleSpy = spyOn(console, 'error');
      apiServiceSpy.get.and.returnValue(throwError(() => new Error(errorMessage)));

      service.getDonorLetterDetail('D001', '1').subscribe({
        error: (error) => {
          expect(error.message).toBe(errorMessage);
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching donor letter detail:',
            jasmine.any(Error)
          );
          done();
        },
      });
    });
  });

  describe('getLetterCodes', () => {
    it('should fetch letter codes successfully', (done) => {
      const mockResponse = {
        success: true,
        data: mockLetterCodes,
        message: 'Success',
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getLetterCodes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockLetterCodes);
          expect(result.length).toBe(2);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.DONOR_LETTERS.LETTER_CODES);
          done();
        },
      });
    });

    it('should handle error when fetching letter codes fails', (done) => {
      const errorMessage = 'Failed to load letter codes';
      const consoleSpy = spyOn(console, 'error');
      apiServiceSpy.get.and.returnValue(throwError(() => new Error(errorMessage)));

      service.getLetterCodes().subscribe({
        error: (error) => {
          expect(error.message).toBe(errorMessage);
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching letter codes:',
            jasmine.any(Error)
          );
          done();
        },
      });
    });

    it('should handle empty letter codes response', (done) => {
      const mockResponse = {
        success: true,
        data: [],
        message: 'Success',
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getLetterCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should default to empty array when response data is null', (done) => {
      const mockResponse = {
        success: true,
        data: null as unknown as LetterCodeLookupDto[],
        message: 'Success',
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getLetterCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should default to empty array when response data is undefined', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
      } as { success: boolean; data: LetterCodeLookupDto[]; message: string };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getLetterCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });
  });

  describe('getDonors', () => {
    it('should fetch donors successfully with search term', (done) => {
      const queryParams: DonorLookupQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
        searchTerm: 'John',
      };

      const mockResponse = {
        success: true,
        data: mockDonors,
        message: 'Success',
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonors(queryParams).subscribe({
        next: (result) => {
          expect(result).toEqual(mockDonors);
          expect(result.length).toBe(2);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.DONOR_LETTERS.DONORS,
            jasmine.objectContaining({ params: jasmine.any(HttpParams) })
          );
          done();
        },
      });
    });

    it('should include searchTerm in params when provided', (done) => {
      const queryParams: DonorLookupQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
        searchTerm: 'John',
      };

      const mockResponse = {
        success: true,
        data: mockDonors,
        message: 'Success',
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonors(queryParams).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('searchTerm')).toBe('John');
          expect(params.get('fromDate')).toBe('2026-05-01');
          expect(params.get('toDate')).toBe('2026-05-12');
          done();
        },
      });
    });

    it('should fetch donors without search term', (done) => {
      const queryParams: DonorLookupQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
      };

      const mockResponse = {
        success: true,
        data: mockDonors,
        message: 'Success',
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonors(queryParams).subscribe({
        next: (result) => {
          expect(result).toEqual(mockDonors);
          done();
        },
      });
    });

    it('should not include searchTerm in params when not provided', (done) => {
      const queryParams: DonorLookupQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
      };

      const mockResponse = {
        success: true,
        data: mockDonors,
        message: 'Success',
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonors(queryParams).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.has('searchTerm')).toBeFalse();
          done();
        },
      });
    });

    it('should handle error when fetching donors fails', (done) => {
      const queryParams: DonorLookupQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
      };

      const errorMessage = 'Failed to load donors';
      const consoleSpy = spyOn(console, 'error');
      apiServiceSpy.get.and.returnValue(throwError(() => new Error(errorMessage)));

      service.getDonors(queryParams).subscribe({
        error: (error) => {
          expect(error.message).toBe(errorMessage);
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching donors:',
            jasmine.any(Error)
          );
          done();
        },
      });
    });

    it('should handle empty donors response', (done) => {
      const queryParams: DonorLookupQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
        searchTerm: 'NonExistent',
      };

      const mockResponse = {
        success: true,
        data: [],
        message: 'Success',
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonors(queryParams).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should default to empty array when response data is null', (done) => {
      const queryParams: DonorLookupQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
      };

      const mockResponse = {
        success: true,
        data: null as unknown as DonorLookupDto[],
        message: 'Success',
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonors(queryParams).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should default to empty array when response data is undefined', (done) => {
      const queryParams: DonorLookupQueryParams = {
        fromDate: '2026-05-01',
        toDate: '2026-05-12',
      };

      const mockResponse = {
        success: true,
        message: 'Success',
      } as { success: boolean; data: DonorLookupDto[]; message: string };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonors(queryParams).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });
  });
});
