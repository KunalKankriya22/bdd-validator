import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DonationEntryDetailsService } from './donation-entry-details.service';
import { ApiService } from '@shared/services/api.service';
import {
  DonationEntryDetailsResponse,
  DonationEntryDetailsWithDonor,
} from '@shared/models/donation-entry-details.model';

describe('DonationEntryDetailsService', () => {
  let service: DonationEntryDetailsService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockItem: DonationEntryDetailsWithDonor = {
    donationDetails: {
      unitId: 'W123424081006',
      donationType: 'AL',
      procedureCode: 'WB',
      donationDate: '08-OCT-2024',
    },
    donorInfo: {
      donorId: 'DN30134290',
      lastName: 'FLEMING',
      firstName: 'FREDDIE',
      streetName: '452 CHAMPA ST',
      city: 'DALLAS',
      state: 'TEXAS',
      zip: '75235',
    },
  };

  const mockResponse: DonationEntryDetailsResponse = {
    success: true,
    message: '',
    statusCode: 200,
    item: mockItem,
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get']);
    apiSpy.get.and.returnValue(of(mockResponse));

    TestBed.configureTestingModule({
      providers: [
        DonationEntryDetailsService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(DonationEntryDetailsService);
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getEntryDetails', () => {
    it('should return donation details with donor info', (done) => {
      service.getEntryDetails('W123424081006').subscribe((result) => {
        expect(result).toBeDefined();
        expect(result.donationDetails?.unitId).toBe('W123424081006');
        expect(result.donorInfo?.donorId).toBe('DN30134290');
        expect(result.donorInfo?.lastName).toBe('FLEMING');
        expect(result.donorInfo?.firstName).toBe('FREDDIE');
        done();
      });
    });

    it('should return details with address information', (done) => {
      service.getEntryDetails('W123424081006').subscribe((result) => {
        expect(result.donorInfo?.streetName).toBe('452 CHAMPA ST');
        expect(result.donorInfo?.city).toBe('DALLAS');
        expect(result.donorInfo?.state).toBe('TEXAS');
        expect(result.donorInfo?.zip).toBe('75235');
        done();
      });
    });

    it('should return details with donation information', (done) => {
      service.getEntryDetails('W123424081006').subscribe((result) => {
        expect(result.donationDetails?.donationType).toBe('AL');
        expect(result.donationDetails?.procedureCode).toBe('WB');
        expect(result.donationDetails?.donationDate).toBe('08-OCT-2024');
        done();
      });
    });

  });
});
