import { of, throwError } from 'rxjs';

import { MaintainDonorInterdictionService } from './maintain-donor-interdiction.service';
import { ApiService } from '@shared/services/api.service';
import {
  DonorDetails,
  DonorInterdiction,
  ValidInterdictionCode,
  CollectionDate,
  TerminationReason,
  PlaceInterdictionRequest,
  ReleaseInterdictionRequest,
  TerminateInterdictionRequest
} from '../models/maintain-donor-interdiction.models';

describe('MaintainDonorInterdictionService', () => {
  let service: MaintainDonorInterdictionService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const pastDate = new Date(now);
  pastDate.setFullYear(pastDate.getFullYear() - 1);
  const pastDateStr = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}-${String(pastDate.getDate()).padStart(2, '0')}`;

  const mockDonorDetails: DonorDetails = {
    donorId: 'DON12345',
    name: 'Smith, John',
    dateOfBirth: '1985-06-15',
    gender: 'Male',
    street: '123 Main St',
    suiteApt: 'Apt 4B',
    city: 'Boston',
    state: 'MA',
    zip: '02101',
    bloodType: 'O+',
    otherInters: 2,
    internationalAddress: null
  };

  const mockInterdictions: DonorInterdiction[] = [
    {
      interCode: 'BPHLD',
      interType: 'HOLD S',
      interDesc: 'Blood Pressure Hold',
      unitId: 'UNIT001',
      effDate: pastDateStr,
      termDate: null,
      releaseDate: null,
      insertUser: 'USER01',
      releaseUser: null,
      originatedFrom: 'INQR',
      reasonCode: null,
      termReason: null,
      groupMode: null,
      groupId: null,
      chapterId: 'CH01',
      donorId: 'DON12345',
      collDate: pastDateStr,
      notes: null
    }
  ];

  const mockValidCodes: ValidInterdictionCode[] = [
    { interCode: 'BPHLD', interType: 'HOLD S', interDesc: 'Blood Pressure Hold', periodType: 'D', periodNumber: 56, minimumPeriod: null },
    { interCode: 'TATTOO', interType: 'DEF', interDesc: 'Tattoo Deferral', periodType: 'M', periodNumber: 12, minimumPeriod: null }
  ];

  const mockCollectionDates: CollectionDate[] = [
    { collDate: pastDateStr }
  ];

  const mockTerminationReasons: TerminationReason[] = [
    { code: 'ERR', description: 'Entered in Error' },
    { code: 'RESOLVED', description: 'Issue Resolved' }
  ];

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

        service = new MaintainDonorInterdictionService(apiServiceSpy as any);
  });

  describe('getDonorDetails', () => {
    it('should return donor details from API', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: mockDonorDetails }));

      service.getDonorDetails('DON12345').subscribe({
        next: (result) => {
          expect(result).toEqual(mockDonorDetails);
          done();
        }
      });
    });

    it('should handle response without item wrapper', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockDonorDetails));

      service.getDonorDetails('DON12345').subscribe({
        next: (result) => {
          expect(result).toEqual(mockDonorDetails);
          done();
        }
      });
    });

    it('should propagate errors on getDonorDetails failure', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Donor not found')));

      service.getDonorDetails('DON12345').subscribe({
        error: (err) => {
          expect(err.message).toBe('Donor not found');
          done();
        }
      });
    });
  });

  describe('getInterdictions', () => {
    it('should return interdictions from API', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockInterdictions }));

      service.getInterdictions('DON12345').subscribe({
        next: (result) => {
          expect(result).toEqual(mockInterdictions);
          expect(result.length).toBe(1);
          done();
        }
      });
    });

    it('should return empty array when data is null or undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getInterdictions('DON12345').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should pass optional query params when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockInterdictions }));

      service.getInterdictions(
        'DON12345', true, 'USER01', 'INQR', 'GROUP', 'GRP1',
        'search-term', 'LAST30', '2024-01-01', 'LAST60', '2024-06-01'
      ).subscribe({
        next: (result) => {
          expect(result).toEqual(mockInterdictions);
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1]?.params;
          expect(params).toBeDefined();
          expect(params.get('showTerminated')).toBe('true');
          expect(params.get('userId')).toBe('USER01');
          expect(params.get('originated')).toBe('INQR');
          expect(params.get('groupMode')).toBe('GROUP');
          expect(params.get('groupId')).toBe('GRP1');
          expect(params.get('search')).toBe('search-term');
          expect(params.get('effectiveDatePeriod')).toBe('LAST30');
          expect(params.get('effectiveDate')).toBe('2024-01-01');
          expect(params.get('terminationDatePeriod')).toBe('LAST60');
          expect(params.get('terminationDate')).toBe('2024-06-01');
          done();
        }
      });
    });

    it('should propagate errors on getInterdictions failure', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Interdictions fetch failed')));

      service.getInterdictions('DON12345').subscribe({
        error: (err) => {
          expect(err.message).toBe('Interdictions fetch failed');
          done();
        }
      });
    });
  });

  describe('getValidCodes', () => {
    it('should return valid interdiction codes', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockValidCodes }));

      service.getValidCodes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockValidCodes);
          expect(result.length).toBe(2);
          done();
        }
      });
    });

    it('should return empty array when data is null or undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getValidCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should propagate errors on getValidCodes failure', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Valid codes fetch failed')));

      service.getValidCodes().subscribe({
        error: (err) => {
          expect(err.message).toBe('Valid codes fetch failed');
          done();
        }
      });
    });
  });

  describe('getCollectionDates', () => {
    it('should return collection dates for donor and unit', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockCollectionDates }));

      service.getCollectionDates('DON12345', 'UNIT001').subscribe({
        next: (result) => {
          expect(result).toEqual(mockCollectionDates);
          done();
        }
      });
    });

    it('should return empty array when data is null or undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getCollectionDates('DON12345', 'UNIT001').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should propagate errors on getCollectionDates failure', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Collection dates fetch failed')));

      service.getCollectionDates('DON12345', 'UNIT001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Collection dates fetch failed');
          done();
        }
      });
    });
  });

  describe('placeInterdiction', () => {
    it('should place an interdiction successfully', (done) => {
      const request: PlaceInterdictionRequest = {
        donorId: 'DON12345',
        interCode: 'BPHLD',
        effDate: todayStr
      };

      apiServiceSpy.post.and.returnValue(of(void 0));

      service.placeInterdiction(request).subscribe({
        next: () => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            jasmine.stringContaining('/interdictions'),
            request
          );
          done();
        }
      });
    });

    it('should propagate errors on placement failure', (done) => {
      const request: PlaceInterdictionRequest = {
        donorId: 'DON12345',
        interCode: 'BPHLD',
        effDate: todayStr
      };

      apiServiceSpy.post.and.returnValue(throwError(() => new Error('Placement failed')));

      service.placeInterdiction(request).subscribe({
        error: (err) => {
          expect(err.message).toBe('Placement failed');
          done();
        }
      });
    });
  });

  describe('releaseInterdiction', () => {
    it('should release an interdiction successfully', (done) => {
      const request: ReleaseInterdictionRequest = {
        donorId: 'DON12345',
        interCode: 'BPHLD',
        effDate: pastDateStr
      };

      apiServiceSpy.put.and.returnValue(of(void 0));

      service.releaseInterdiction(request).subscribe({
        next: () => {
          expect(apiServiceSpy.put).toHaveBeenCalledWith(
            jasmine.stringContaining('/interdictions/release'),
            request
          );
          done();
        }
      });
    });

    it('should propagate errors on release failure', (done) => {
      const request: ReleaseInterdictionRequest = {
        donorId: 'DON12345',
        interCode: 'BPHLD',
        effDate: pastDateStr
      };

      apiServiceSpy.put.and.returnValue(throwError(() => new Error('Release failed')));

      service.releaseInterdiction(request).subscribe({
        error: (err) => {
          expect(err.message).toBe('Release failed');
          done();
        }
      });
    });
  });

  describe('terminateInterdiction', () => {
    it('should terminate an interdiction successfully', (done) => {
      const request: TerminateInterdictionRequest = {
        donorId: 'DON12345',
        interCode: 'BPHLD',
        effDate: pastDateStr,
        termDate: todayStr,
        termReason: 'ERR'
      };

      apiServiceSpy.put.and.returnValue(of(void 0));

      service.terminateInterdiction(request).subscribe({
        next: () => {
          expect(apiServiceSpy.put).toHaveBeenCalledWith(
            jasmine.stringContaining('/interdictions/terminate'),
            request
          );
          done();
        }
      });
    });

    it('should propagate errors on terminate failure', (done) => {
      const request: TerminateInterdictionRequest = {
        donorId: 'DON12345',
        interCode: 'BPHLD',
        effDate: pastDateStr,
        termDate: todayStr,
        termReason: 'ERR'
      };

      apiServiceSpy.put.and.returnValue(throwError(() => new Error('Terminate failed')));

      service.terminateInterdiction(request).subscribe({
        error: (err) => {
          expect(err.message).toBe('Terminate failed');
          done();
        }
      });
    });
  });

  describe('getTerminationReasons', () => {
    it('should return termination reasons', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockTerminationReasons }));

      service.getTerminationReasons().subscribe({
        next: (result) => {
          expect(result).toEqual(mockTerminationReasons);
          expect(result.length).toBe(2);
          done();
        }
      });
    });

    it('should return empty array when data is null or undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getTerminationReasons().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should propagate errors on getTerminationReasons failure', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Termination reasons fetch failed')));

      service.getTerminationReasons().subscribe({
        error: (err) => {
          expect(err.message).toBe('Termination reasons fetch failed');
          done();
        }
      });
    });
  });
});
