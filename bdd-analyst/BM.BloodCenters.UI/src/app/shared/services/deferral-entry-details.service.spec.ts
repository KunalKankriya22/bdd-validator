import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { DeferralEntryDetailsService } from './deferral-entry-details.service';
import { API } from '../../core/constants/api.constants';
import { environment } from '../../../environments/environment';
import {
  DeferralEntryDetailsDto,
  DeferralEntryDetailsQueryDto,
  DeferralEntryDetailsResponse,
  DeferralEntryDetailsListResponse,
} from '@shared/models/deferral-entry-details.model';

describe('DeferralEntryDetailsService', () => {
  let service: DeferralEntryDetailsService;
  let httpMock: HttpTestingController;

  const mockDeferralEntry: DeferralEntryDetailsDto = {
    donorId: 'DN30136690',
    driveDate: '2025-03-17T00:00:00Z',
    deferralId: 'W123424081006',
    creditSponsor: 'SPONSOR01',
    lookupId: 'CJH123',
    screenerId: 'CJH123',
    physicalId: 'CJH123',
    donationType: 'AL',
    deferralType: 'IND',
    procedureCode: 'WB',
    deferralReason: '55',
    deferredThruDate: null,
    firstReviewerId: 'CJH123',
    transactionId: 'TR02885439',
    bagType: null,
    setId: null,
    creditCount: null,
    equipType: null,
    donorInfo: {
      bloodType: 'No ABO',
      lastName: 'KIM',
      firstName: 'MUBEE',
      middleName: null,
      lastNameSuffix: null,
      alternateIdType: 'DRLIC',
      alternateId: '09181959003',
      dateOfBirth: '2003-03-12T00:00:00Z',
      gender: 'Male',
      donorWeight: 123,
      email: 'kim.mubee@hotmail.com',
      ethnicGroup: 'CA',
      status: 'A',
      address: {
        streetName: '82 LONG',
        suiteApt: null,
        city: 'DALLAS',
        state: 'TEXAS',
        zip: '75235',
        intlAddr: null,
      },
      homePhone: {
        areaCode: '+214',
        phoneNo: '234-567-89',
        extension: null,
        formattedPhone: '(+214) 234-567-89',
      },
      dayPhone: {
        areaCode: '+214',
        phoneNo: '234-567-89',
        extension: null,
        formattedPhone: '(+214) 234-567-89',
      },
      mobilePhone: {
        areaCode: '+817',
        phoneNo: '234-567-89',
        extension: null,
        formattedPhone: '(+817) 234-567-89',
      },
      employer: {
        employerId: 'EMP001',
        employerName: 'WELLSKY',
        city: 'OVERLAND PARK',
        state: 'TEXAS',
        zip: '66207',
        intlAddr: null,
      },
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DeferralEntryDetailsService],
    });

    service = TestBed.inject(DeferralEntryDetailsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('should retrieve all deferral entries with pagination', (done) => {
      const take = 10;
      const skip = 0;
      const mockResponse: DeferralEntryDetailsListResponse = {
        success: true,
        statusCode: 200,
        message: 'Deferral entry details retrieved successfully',
        data: [mockDeferralEntry],
        total: 1,
      };

      service.getAll(take, skip).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.total).toBe(1);
          expect(result.data[0].donorId).toBe('DN30136690');
          done();
        },
        error: done.fail,
      });

      const expectedUrl = `${environment.apiUrl}${API.RECRUITMENT.DEFERRAL_ENTRY_DETAILS.GET_ALL(take, skip)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should retrieve filtered deferral entries with query parameters', (done) => {
      const take = 20;
      const skip = 0;
      const query: DeferralEntryDetailsQueryDto = {
        donorId: 'DN30136690',
        deferralReason: '55',
        donationType: 'AL',
        procedureCode: 'WB',
        fromDate: '2025-01-01',
        toDate: '2025-12-31',
        searchKeyword: 'KIM',
        sortColumn: 'DriveDate',
        sortOrder: 'DESC',
      };

      const mockResponse: DeferralEntryDetailsListResponse = {
        success: true,
        statusCode: 200,
        message: 'Deferral entry details retrieved successfully',
        data: [mockDeferralEntry],
        total: 1,
      };

      service.getAll(take, skip, query).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.total).toBe(1);
          done();
        },
        error: done.fail,
      });

      const expectedUrl = `${environment.apiUrl}${API.RECRUITMENT.DEFERRAL_ENTRY_DETAILS.GET_ALL(take, skip)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush(mockResponse);
    });


  });

  describe('getByCompositeKey', () => {
    it('should retrieve a single deferral entry by composite key', (done) => {
      const donorId = 'DN30136690';
      const driveDate = '2025-03-17';

      const mockResponse: DeferralEntryDetailsResponse = {
        success: true,
        statusCode: 200,
        message: 'Deferral entry details retrieved successfully',
        data: mockDeferralEntry,
      };

      service.getByCompositeKey(donorId, driveDate).subscribe({
        next: (result) => {
          expect(result).toBeTruthy();
          expect(result.donorId).toBe('DN30136690');
          expect(result.deferralId).toBe('W123424081006');
          expect(result.donorInfo?.lastName).toBe('KIM');
          done();
        },
        error: done.fail,
      });

      const expectedUrl = `${environment.apiUrl}${API.RECRUITMENT.DEFERRAL_ENTRY_DETAILS.GET_BY_COMPOSITE_KEY(donorId, driveDate)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle not found error (404)', (done) => {
      const donorId = 'INVALID';
      const driveDate = '2025-99-99';

      service.getByCompositeKey(donorId, driveDate).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const expectedUrl = `${environment.apiUrl}${API.RECRUITMENT.DEFERRAL_ENTRY_DETAILS.GET_BY_COMPOSITE_KEY(donorId, driveDate)}`;
      const req = httpMock.expectOne(expectedUrl);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

});

  describe('getByDonorId', () => {
    it('should retrieve all deferral entries for a specific donor', (done) => {
      const donorId = 'DN30136690';
      const take = 10;
      const skip = 0;

      const mockResponse: DeferralEntryDetailsListResponse = {
        success: true,
        statusCode: 200,
        message: `Deferral entries retrieved successfully for donor ${donorId}`,
        data: [mockDeferralEntry],
        total: 1,
      };

      service.getByDonorId(donorId, take, skip).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.total).toBe(1);
          expect(result.data[0].donorId).toBe('DN30136690');
          done();
        },
        error: done.fail,
      });

      const expectedUrl = `${environment.apiUrl}${API.RECRUITMENT.DEFERRAL_ENTRY_DETAILS.GET_BY_DONOR(donorId, take, skip)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


  });

  describe('Error Handling', () => {

    it('should handle 400 Bad Request', (done) => {
      const donorId = 'INVALID';
      const driveDate = 'INVALID-DATE';

      service.getByCompositeKey(donorId, driveDate).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const expectedUrl = `${environment.apiUrl}${API.RECRUITMENT.DEFERRAL_ENTRY_DETAILS.GET_BY_COMPOSITE_KEY(donorId, driveDate)}`;
      const req = httpMock.expectOne(expectedUrl);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });
});
