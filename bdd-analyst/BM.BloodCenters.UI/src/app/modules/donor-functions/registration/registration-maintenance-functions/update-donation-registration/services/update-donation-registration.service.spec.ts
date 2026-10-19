import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiService } from '@shared/services/api.service';
import { UpdateDonationRegistrationService } from './update-donation-registration.service';
import { UpdateDonationRetrieveResponse } from '../models/update-donation-registration.model';

describe('UpdateDonationRegistrationService', () => {
  let service: UpdateDonationRegistrationService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockRetrieveResponse = {
    success: true,
    message: '',
    statusCode: 200,
    data: {
      transactionId: 'TXN001',
      unitId: 'W6333 19 030301-X',
      voidUnitId: null,
      donationType: 'AL',
      donationTypeDescription: 'Allogeneic',
      procedureCode: 'PP',
      procedureCodeDescription: 'Phlebotomy',
      equipType: 'AMIC',
      lookupId: 'CJH123',
      screenerId: 'CJH123',
      physicalId: 'CJH123',
      firstReviewerId: 'CJH123',
      creditSponsor: 'SPON046697',
      materialId: 'CJH123',
      collDate: '2025-01-01',
      driveId: 'DRV0172299',
      driveDate: '2026-01-25',
      armUsed: 'R',
      deferralReason: '5',
      deferralType: 'NA',
      deferredThruDate: '1994-10-12',
      sVenipuncture: '01',
      sReactions: 'MI',
      auditKey: 1,
      enteredBy: 'Brigerman Richards',
      donorId: 'DN30136689',
      lastName: 'Rogers',
      firstName: 'Marvin',
      middleName: 'Harry',
      lastNameSuffix: 'Sr.',
      dateOfBirth: '1994-10-12',
      gender: 'M',
      donorWeight: 75,
      bloodType: null,
      ethnicGroup: 'CA',
      alternateId: 'M639466',
      alternateType: 'PASPT',
      idQueue: 'Yes',
      donorStatus: 'A',
      streetName: '781 LINCOLN WAY DRVE',
      suiteApt: '12345 BK',
      city: 'Dallas',
      state: 'TX',
      zip: '75001',
      homePhone: '(214) 852-758-44',
      workPhone: '(214) 852-758-45',
      mobilePhone: '(214) 852-758-46',
      email: 'marvin.hollis@example.com',
      preferredPhone: 'mobile',
      employerName: 'Mediware',
      employerCity: 'Dallas',
      employerState: 'TX',
      employerZip: '75001',
    } as unknown as UpdateDonationRetrieveResponse,
    total: 1,
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'put']);

    TestBed.configureTestingModule({
      providers: [
        UpdateDonationRegistrationService,
        { provide: ApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(UpdateDonationRegistrationService);
  });

  describe('retrieveByUnitId', () => {
    it('should call GET with unitId and collectionDate params', () => {
      mockApiService.get.and.returnValue(of(mockRetrieveResponse));

      service.retrieveByUnitId('W6333', '2025-01-01').subscribe((response) => {
        expect(response.success).toBeTrue();
        expect(response.data.unitId).toBe('W6333 19 030301-X');
      });

      expect(mockApiService.get).toHaveBeenCalledTimes(1);
      const callArgs = mockApiService.get.calls.mostRecent().args;
      expect(callArgs[0]).toContain('W6333');
      expect(callArgs[1]?.params).toBeDefined();
    });

  });

  describe('updateDonation', () => {
    it('should call PUT with transactionId and request body', () => {
      mockApiService.put.and.returnValue(of(mockRetrieveResponse));

      const request = {
        transactionId: 'TXN001',
        donationType: 'AL',
        armUsed: 'L',
      };

      service.updateDonation('TXN001', request).subscribe((response) => {
        expect(response.success).toBeTrue();
      });

      expect(mockApiService.put).toHaveBeenCalledTimes(1);
      const callArgs = mockApiService.put.calls.mostRecent().args;
      expect(callArgs[0]).toContain('TXN001');
      expect(callArgs[1]).toEqual(request);
    });

  });

  describe('updateDonation error handling', () => {
    it('should propagate error on failure', (done) => {
      const error = { status: 400, message: 'Bad request' };
      mockApiService.put.and.returnValue(throwError(() => error));

      service.updateDonation('TXN001', { transactionId: 'TXN001' }).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('getInterdictions', () => {
    it('should return interdiction DTOs from API response', () => {
      const mockInterdictions = [
        { transactionId: 'TXN001', interCode: 'DNTPN', interDesc: 'Donation Type' },
      ];
      mockApiService.get.and.returnValue(of({ success: true, data: mockInterdictions, total: 1 }));

      service.getInterdictions('TXN001').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].interCode).toBe('DNTPN');
      });

      expect(mockApiService.get).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when data is null', () => {
      mockApiService.get.and.returnValue(of({ success: true, data: null, total: 0 }));

      service.getInterdictions('TXN001').subscribe((result) => {
        expect(result).toEqual([]);
      });
    });

    it('should propagate error on failure', (done) => {
      const error = { status: 500, message: 'Server error' };
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getInterdictions('TXN001').subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('retrieveByUnitId error handling', () => {
    it('should propagate error on failure', (done) => {
      const error = { status: 404, message: 'Not found' };
      mockApiService.get.and.returnValue(throwError(() => error));

      service.retrieveByUnitId('INVALID', '2025-01-01').subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });
});
