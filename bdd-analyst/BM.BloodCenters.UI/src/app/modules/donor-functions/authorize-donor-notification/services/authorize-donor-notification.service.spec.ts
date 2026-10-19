import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthorizeDonorNotificationService } from './authorize-donor-notification.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  SearchDonorNotificationRequestDto,
  MarkNoLetterRequestDto,
  ApproveNoLetterRequestDto
} from '../models/authorize-donor-notification.model';

describe('AuthorizeDonorNotificationService', () => {
  let service: AuthorizeDonorNotificationService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        AuthorizeDonorNotificationService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(AuthorizeDonorNotificationService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('searchDonors', () => {
    it('should search donors with correct endpoint and parameters', (done) => {
      const take = 10;
      const skip = 0;
      const searchParams: SearchDonorNotificationRequestDto = {
        searchType: 'All',
        includeNotified: 'N'
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Donors retrieved successfully',
        data: [],
        total: 0
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDonors(take, skip, searchParams).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.SEARCH(take, skip),
          searchParams
        );
        done();
      });
    });

    it('should return mapped data and total when response has results', (done) => {
      const mockResults = [
        {
          donorId: 'DN001',
          donorName: 'Test Donor',
          lastDonationType: 'WB',
          lastProcCode: null,
          lastUnitId: 'U001',
          lastDonationDate: '2025-01-01',
          interCode: 'INT01',
          interEffDate: '2025-01-01',
          unitId: 'U001',
          letterSeqNo: '1',
          letterId: 'L001',
          notificationStatus: 'AUTHZ' as const,
          chapterId: 'CH01',
          otherInterdictionCount: 2
        }
      ];
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockResults,
        total: 1
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDonors(25, 0, { searchType: 'All' }).subscribe(result => {
        expect(result.data).toEqual(mockResults);
        expect(result.total).toBe(1);
        done();
      });
    });

    it('should default data to empty array when response data is null', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: null,
        total: 5
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDonors(10, 0, { searchType: 'All' }).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(5);
        done();
      });
    });

    it('should fall back to Total (capital T) when total is undefined', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [],
        Total: 42
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse as any));

      service.searchDonors(10, 0, { searchType: 'All' }).subscribe(result => {
        expect(result.total).toBe(42);
        done();
      });
    });

    it('should default total to 0 when both total and Total are undefined', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: []
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse as any));

      service.searchDonors(10, 0, { searchType: 'All' }).subscribe(result => {
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should propagate error on searchDonors failure', (done) => {
      const error = { status: 500, message: 'Server Error' };
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.searchDonors(10, 0, { searchType: 'All' }).subscribe({
        error: err => {
          expect(err).toEqual(error);
          done();
        }
      });
    });
  });

  describe('getDonorDetails', () => {
    it('should call correct endpoint and return donor details', (done) => {
      const donorId = 'DN0012345';
      const mockDetails = {
        donorId: 'DN0012345',
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

    it('should return donor details with null fields', (done) => {
      const mockDetails = {
        donorId: 'DN0099999',
        workPhone: null,
        homePhone: null,
        mobilePhone: null,
        address: null,
        preferredContactFlag: null
      };

      apiServiceSpy.get.and.returnValue(of(mockDetails));

      service.getDonorDetails('DN0099999').subscribe(result => {
        expect(result.workPhone).toBeNull();
        expect(result.homePhone).toBeNull();
        expect(result.mobilePhone).toBeNull();
        expect(result.address).toBeNull();
        done();
      });
    });

    it('should propagate error on getDonorDetails failure', (done) => {
      const error = { status: 404, message: 'Donor not found' };
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getDonorDetails('DN_INVALID').subscribe({
        error: err => {
          expect(err).toEqual(error);
          done();
        }
      });
    });
  });

  describe('getDonorCommunications', () => {
    it('should call correct endpoint and return communications', (done) => {
      const donorId = 'DN0012345';
      const mockComms = [
        {
          donorId: 'DN0012345',
          donorName: 'Doe, John',
          chapterId: 'CH01',
          comCode: 'CC001',
          comDate: '2025-03-15',
          comType: 'LETTER',
          comDesc: 'Notification letter sent',
          programId: 'PROG1',
          insertUser: 'ADMIN',
          insertDate: '2025-03-15'
        }
      ];
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockComms,
        totalCount: 1
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonorCommunications(donorId).subscribe(result => {
        expect(result).toEqual(mockComms);
        expect(result.length).toBe(1);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.GET_COMMUNICATIONS(donorId)
        );
        done();
      });
    });

    it('should default to empty array when response data is null', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: null,
        totalCount: 0
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse as any));

      service.getDonorCommunications('DN001').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error on getDonorCommunications failure', (done) => {
      const error = { status: 500, message: 'Internal error' };
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getDonorCommunications('DN001').subscribe({
        error: err => {
          expect(err).toEqual(error);
          done();
        }
      });
    });
  });

  describe('markNoLetter', () => {
    it('should mark no letter with correct payload', (done) => {
      const payload: MarkNoLetterRequestDto = {
        donorId: 'DN0012345',
        interCode: 'INT001',
        unitId: '1234567',
        userComment: 'Test comment',
        mode: 'USER'
      };

      const mockResponse = {
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

    it('should mark no letter with SUPER mode', (done) => {
      const payload: MarkNoLetterRequestDto = {
        donorId: 'DN0012345',
        interCode: 'INT002',
        userComment: 'Supervisor override',
        mode: 'SUPER'
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Marked'
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.markNoLetter(payload).subscribe(result => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.MARK_NO_LETTER,
          payload
        );
        done();
      });
    });

    it('should propagate error on markNoLetter failure', (done) => {
      const payload: MarkNoLetterRequestDto = {
        donorId: 'DN001',
        interCode: 'INT001',
        userComment: 'test'
      };
      const error = { status: 400, message: 'Bad Request' };
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.markNoLetter(payload).subscribe({
        error: err => {
          expect(err).toEqual(error);
          done();
        }
      });
    });
  });

  describe('approveNoLetter', () => {
    it('should approve no letter with correct payload', (done) => {
      const payload: ApproveNoLetterRequestDto = {
        donorId: 'DN0012345',
        interCode: 'INT001',
        unitId: '1234567',
        supervisorComment: 'Approved'
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'No-letter status approved successfully'
      };

      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.approveNoLetter(payload).subscribe(result => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.APPROVE_NO_LETTER,
          payload
        );
        done();
      });
    });

    it('should approve no letter without optional unitId', (done) => {
      const payload: ApproveNoLetterRequestDto = {
        donorId: 'DN0012345',
        interCode: 'INT001',
        supervisorComment: 'Approved without unit'
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Approved'
      };

      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.approveNoLetter(payload).subscribe(result => {
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should propagate error on approveNoLetter failure', (done) => {
      const payload: ApproveNoLetterRequestDto = {
        donorId: 'DN001',
        interCode: 'INT001',
        supervisorComment: 'test'
      };
      const error = { status: 403, message: 'Forbidden' };
      apiServiceSpy.put.and.returnValue(throwError(() => error));

      service.approveNoLetter(payload).subscribe({
        error: err => {
          expect(err).toEqual(error);
          done();
        }
      });
    });
  });

  describe('getCodeDescription', () => {
    it('should call correct endpoint and return the description message', (done) => {
      const searchType = 'InterCD';
      const code = 'INT001';
      const mockResponse = { message: 'Interdiction Code 001' };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getCodeDescription(searchType, code).subscribe(result => {
        expect(result).toBe('Interdiction Code 001');
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.GET_CODE_DESCRIPTION(searchType, code)
        );
        done();
      });
    });

    it('should return empty string when response message is empty', (done) => {
      apiServiceSpy.get.and.returnValue(of({ message: '' }));

      service.getCodeDescription('LetterID', 'L001').subscribe(result => {
        expect(result).toBe('');
        done();
      });
    });

    it('should return empty string when response message is null/undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ message: null } as any));

      service.getCodeDescription('DonorID', 'DN001').subscribe(result => {
        expect(result).toBe('');
        done();
      });
    });

    it('should propagate error on getCodeDescription failure', (done) => {
      const error = { status: 404, message: 'Code not found' };
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getCodeDescription('InterCD', 'INVALID').subscribe({
        error: err => {
          expect(err).toEqual(error);
          done();
        }
      });
    });
  });

  describe('rejectNoLetter', () => {
    it('should call delete endpoint without unitId query param', (done) => {
      const donorId = 'DN0012345';
      const interCode = 'INT001';
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'No-letter rejected'
      };

      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      service.rejectNoLetter(donorId, interCode).subscribe(result => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.delete).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.REJECT_NO_LETTER(donorId, interCode)
        );
        done();
      });
    });

    it('should call delete endpoint without unitId when unitId is null', (done) => {
      const donorId = 'DN0012345';
      const interCode = 'INT001';
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Rejected'
      };

      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      service.rejectNoLetter(donorId, interCode, null).subscribe(result => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.delete).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.REJECT_NO_LETTER(donorId, interCode)
        );
        done();
      });
    });

    it('should call delete endpoint without unitId when unitId is empty string', (done) => {
      const donorId = 'DN0012345';
      const interCode = 'INT001';
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Rejected'
      };

      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      service.rejectNoLetter(donorId, interCode, '').subscribe(result => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.delete).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.REJECT_NO_LETTER(donorId, interCode)
        );
        done();
      });
    });

    it('should append unitId as query param when unitId is provided', (done) => {
      const donorId = 'DN0012345';
      const interCode = 'INT001';
      const unitId = 'U9876543';
      const expectedEndpoint =
        API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.REJECT_NO_LETTER(donorId, interCode)
        + `?unitId=${encodeURIComponent(unitId)}`;
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'No-letter rejected with unit'
      };

      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      service.rejectNoLetter(donorId, interCode, unitId).subscribe(result => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.delete).toHaveBeenCalledWith(expectedEndpoint);
        done();
      });
    });

    it('should encode special characters in unitId query param', (done) => {
      const donorId = 'DN001';
      const interCode = 'INT001';
      const unitId = 'U 123&special';
      const expectedEndpoint =
        API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.REJECT_NO_LETTER(donorId, interCode)
        + `?unitId=${encodeURIComponent(unitId)}`;
      const mockResponse = { success: true, statusCode: 200, message: 'OK' };

      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      service.rejectNoLetter(donorId, interCode, unitId).subscribe(result => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.delete).toHaveBeenCalledWith(expectedEndpoint);
        done();
      });
    });

    it('should propagate error on rejectNoLetter failure', (done) => {
      const error = { status: 500, message: 'Server Error' };
      apiServiceSpy.delete.and.returnValue(throwError(() => error));

      service.rejectNoLetter('DN001', 'INT001').subscribe({
        error: err => {
          expect(err).toEqual(error);
          done();
        }
      });
    });
  });

  describe('getLovLimit', () => {
    it('should parse and return numeric limit from response message', (done) => {
      apiServiceSpy.get.and.returnValue(of({ message: '50' }));

      service.getLovLimit().subscribe(result => {
        expect(result).toBe(50);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.GET_LOV_LIMIT
        );
        done();
      });
    });

    it('should default to 21 when message is not a valid number', (done) => {
      apiServiceSpy.get.and.returnValue(of({ message: 'abc' }));

      service.getLovLimit().subscribe(result => {
        expect(result).toBe(21);
        done();
      });
    });

    it('should default to 21 when message is empty string', (done) => {
      apiServiceSpy.get.and.returnValue(of({ message: '' }));

      service.getLovLimit().subscribe(result => {
        expect(result).toBe(21);
        done();
      });
    });

    it('should default to 21 when message is "0"', (done) => {
      apiServiceSpy.get.and.returnValue(of({ message: '0' }));

      service.getLovLimit().subscribe(result => {
        expect(result).toBe(21);
        done();
      });
    });

    it('should return 21 on API error (graceful fallback)', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 500 })));

      service.getLovLimit().subscribe(result => {
        expect(result).toBe(21);
        done();
      });
    });
  });

  describe('getLovCodes', () => {
    it('should return lov codes for a search type', (done) => {
      const searchType = 'InterCD';
      const mockCodes = [
        { code: 'INT001', description: 'Interdiction 1' },
        { code: 'INT002', description: 'Interdiction 2' }
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

    it('should default to empty array when response data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null } as any));

      service.getLovCodes('LetterID').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should default to empty array when response data is undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({} as any));

      service.getLovCodes('UnitID').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array on API error (graceful fallback)', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 500 })));

      service.getLovCodes('InterCD').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('checkUnitExists', () => {
    it('should return true when unit exists', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true }));

      service.checkUnitExists('U1234567').subscribe(result => {
        expect(result).toBe(true);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.AUTHORIZE_DONOR_NOTIFICATION.CHECK_UNIT_EXISTS('U1234567')
        );
        done();
      });
    });

    it('should return true regardless of response success value', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: false }));

      service.checkUnitExists('U0000001').subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });

    it('should return false on API error (graceful fallback)', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 404 })));

      service.checkUnitExists('U_INVALID').subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });

    it('should return false on network error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network Error')));

      service.checkUnitExists('U999').subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });
  });
});
