import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PrepareDonorNotificationService } from './donor-notification.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  SearchDonorNotificationRequestDto,
  SearchDonorNotificationResponse,
  DonorNotificationSearchResult,
  DonorDetailsDto,
  MarkNoLetterRequestDto,
  ApiSuccessResponse,
  LovCodeDto
} from '../models/donor-notification.model';

describe('PrepareDonorNotificationService', () => {
  let service: PrepareDonorNotificationService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        PrepareDonorNotificationService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(PrepareDonorNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // searchDonors
  // ---------------------------------------------------------------------------
  describe('searchDonors', () => {
    const take = 10;
    const skip = 0;
    const searchParams: SearchDonorNotificationRequestDto = {
      searchType: 'Pending',
      includeNotified: 'N'
    };

    it('should POST to the correct endpoint and return mapped data', (done: DoneFn) => {
      const mockResults: DonorNotificationSearchResult[] = [
        {
          donorId: 'D001',
          donorName: 'John Doe',
          lastDonationType: 'WB',
          lastProcCode: 'P001',
          lastUnitId: 'U001',
          lastDonationDate: '2026-01-15',
          interCode: 'IC001',
          interEffDate: '2026-01-01',
          unitId: 'U001',
          letterSeqNo: '1',
          letterId: 'L001',
          notificationStatus: 'AUTNO',
          chapterId: 'CH01',
          otherInterdictionCount: 0
        }
      ];
      const mockResponse: SearchDonorNotificationResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockResults,
        total: 1
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDonors(take, skip, searchParams).subscribe(result => {
        expect(result.data).toEqual(mockResults);
        expect(result.total).toBe(1);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.SEARCH(take, skip),
          searchParams
        );
        done();
      });
    });

    it('should default data to empty array when response.data is null', (done: DoneFn) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: null as any,
        total: 0
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDonors(take, skip, searchParams).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should fallback to Total (capital T) when total is undefined', (done: DoneFn) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [],
        Total: 5
      } as any;

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDonors(take, skip, searchParams).subscribe(result => {
        expect(result.total).toBe(5);
        done();
      });
    });

    it('should default total to 0 when both total and Total are undefined', (done: DoneFn) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: []
      } as any;

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDonors(take, skip, searchParams).subscribe(result => {
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should propagate errors from the API', (done: DoneFn) => {
      const mockError = new Error('Server error');
      apiServiceSpy.post.and.returnValue(throwError(() => mockError));

      service.searchDonors(take, skip, searchParams).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getDonorDetails
  // ---------------------------------------------------------------------------
  describe('getDonorDetails', () => {
    const donorId = 'D001';

    it('should GET donor details from the correct endpoint', (done: DoneFn) => {
      const mockDetails: DonorDetailsDto = {
        donorId: 'D001',
        workPhone: '555-0100',
        homePhone: '555-0101',
        mobilePhone: '555-0102',
        address: '123 Main St',
        preferredContactFlag: 'H'
      };

      apiServiceSpy.get.and.returnValue(of(mockDetails));

      service.getDonorDetails(donorId).subscribe(result => {
        expect(result).toEqual(mockDetails);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.GET_DONOR_DETAILS(donorId)
        );
        done();
      });
    });

    it('should propagate errors from the API', (done: DoneFn) => {
      const mockError = new Error('Not found');
      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getDonorDetails(donorId).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getCodeDescription
  // ---------------------------------------------------------------------------
  describe('getCodeDescription', () => {
    const searchType = 'InterCD';
    const code = 'IC001';

    it('should GET code description and return the message', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of({ message: 'Interdiction Code 001' }));

      service.getCodeDescription(searchType, code).subscribe(result => {
        expect(result).toBe('Interdiction Code 001');
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.GET_CODE_DESCRIPTION(searchType, code)
        );
        done();
      });
    });

    it('should return empty string when message is empty or null', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of({ message: '' }));

      service.getCodeDescription(searchType, code).subscribe(result => {
        expect(result).toBe('');
        done();
      });
    });

    it('should propagate errors from the API', (done: DoneFn) => {
      const mockError = new Error('Code not found');
      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getCodeDescription(searchType, code).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // markNoLetter
  // ---------------------------------------------------------------------------
  describe('markNoLetter', () => {
    const payload: MarkNoLetterRequestDto = {
      donorId: 'D001',
      interCode: 'IC001',
      unitId: 'U001',
      userComment: 'Test comment',
      mode: 'USER'
    };

    it('should POST the payload to the mark-no-letter endpoint', (done: DoneFn) => {
      const mockResponse: ApiSuccessResponse = {
        success: true,
        statusCode: 200,
        message: 'Marked for no letter successfully'
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.markNoLetter(payload).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Marked for no letter successfully');
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.MARK_NO_LETTER,
          payload
        );
        done();
      });
    });

    it('should propagate errors from the API', (done: DoneFn) => {
      const mockError = new Error('Mark failed');
      apiServiceSpy.post.and.returnValue(throwError(() => mockError));

      service.markNoLetter(payload).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(mockError);
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getLovLimit
  // ---------------------------------------------------------------------------
  describe('getLovLimit', () => {
    it('should GET and parse the LOV limit as an integer', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of({ message: '50' }));

      service.getLovLimit().subscribe(result => {
        expect(result).toBe(50);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.GET_LOV_LIMIT
        );
        done();
      });
    });

    it('should default to 21 when message is not a valid number', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of({ message: 'abc' }));

      service.getLovLimit().subscribe(result => {
        expect(result).toBe(21);
        done();
      });
    });

    it('should default to 21 when message is empty', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of({ message: '' }));

      service.getLovLimit().subscribe(result => {
        expect(result).toBe(21);
        done();
      });
    });

    it('should return 21 on API error (graceful fallback)', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Server error')));

      service.getLovLimit().subscribe(result => {
        expect(result).toBe(21);
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // checkUnitExists
  // ---------------------------------------------------------------------------
  describe('checkUnitExists', () => {
    const unitId = 'U001';

    it('should return true when the API call succeeds', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of({ success: true }));

      service.checkUnitExists(unitId).subscribe(result => {
        expect(result).toBe(true);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.CHECK_UNIT_EXISTS(unitId)
        );
        done();
      });
    });

    it('should return false on API error (graceful fallback)', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Not found')));

      service.checkUnitExists(unitId).subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getLovCodes
  // ---------------------------------------------------------------------------
  describe('getLovCodes', () => {
    const searchType = 'InterCD';

    it('should GET LOV codes and return the data array', (done: DoneFn) => {
      const mockCodes: LovCodeDto[] = [
        { code: 'IC001', description: 'Interdiction Code 001' },
        { code: 'IC002', description: 'Interdiction Code 002' }
      ];

      apiServiceSpy.get.and.returnValue(of({ data: mockCodes }));

      service.getLovCodes(searchType).subscribe(result => {
        expect(result).toEqual(mockCodes);
        expect(result.length).toBe(2);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.GET_LOV_CODES(searchType)
        );
        done();
      });
    });

    it('should default to empty array when response.data is null', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getLovCodes(searchType).subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array on API error (graceful fallback)', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Server error')));

      service.getLovCodes(searchType).subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });
});
