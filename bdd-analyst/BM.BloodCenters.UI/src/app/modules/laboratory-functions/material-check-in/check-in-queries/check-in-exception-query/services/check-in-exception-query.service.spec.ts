import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { CheckInExceptionQueryService } from './check-in-exception-query.service';
import { ApiService } from '@shared/services/api.service';
import {
  CheckInExceptionQueryRequest,
  CheckInExceptionResult
} from '../models/check-in-exception-query.model';

describe('CheckInExceptionQueryService', () => {
  let service: CheckInExceptionQueryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockResult: CheckInExceptionResult = {
    tubesOnlyCheckedIn: [
      {
        unitId: 'W123418031306',
        tubeCheckInDate: '2025-01-11T00:00:00Z',
        tubeCheckInDateFormatted: '11-JAN-2025'
      },
      {
        unitId: 'W123418031307',
        tubeCheckInDate: '2025-01-10T00:00:00Z',
        tubeCheckInDateFormatted: '10-DEC-2025'
      }
    ],
    noBagCheckedIn: [
      {
        unitId: '0714600',
        collectionDate: '2025-01-11T00:00:00Z',
        collectionDateFormatted: '11-JAN-2025'
      },
      {
        unitId: '7146011',
        collectionDate: '2025-01-10T00:00:00Z',
        collectionDateFormatted: '10-DEC-2025'
      },
      {
        unitId: 'W123418031308',
        collectionDate: '2020-02-02T00:00:00Z',
        collectionDateFormatted: '02-FEB-2020'
      }
    ],
    totalTubesOnly: 2,
    totalNoBag: 5
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        CheckInExceptionQueryService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(CheckInExceptionQueryService);
  });

  describe('queryCheckInExceptions', () => {
    it('should call ApiService.get with correct URL and params', (done) => {
      const request: CheckInExceptionQueryRequest = {
        fromDate: '2025-01-01',
        toDate: '2025-01-31'
      };

      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockResult }));

      service.queryCheckInExceptions(request).subscribe({
        next: () => {
          const url = apiServiceSpy.get.calls.mostRecent().args[0] as string;
          expect(url).toContain('check-in-exception-query');
          expect(url).toContain('fromDate=2025-01-01');
          expect(url).toContain('toDate=2025-01-31');
          done();
        }
      });
    });

    it('should return check-in exception results on success', (done) => {
      const request: CheckInExceptionQueryRequest = {
        fromDate: '2025-01-01',
        toDate: '2025-01-31'
      };

      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockResult }));

      service.queryCheckInExceptions(request).subscribe({
        next: (result) => {
          expect(result.tubesOnlyCheckedIn.length).toBe(2);
          expect(result.noBagCheckedIn.length).toBe(3);
          expect(result.totalTubesOnly).toBe(2);
          expect(result.totalNoBag).toBe(5);
          done();
        }
      });
    });

    it('should not send take/skip params', (done) => {
      const request: CheckInExceptionQueryRequest = {
        fromDate: '2025-01-01',
        toDate: '2025-01-31'
      };

      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockResult }));

      service.queryCheckInExceptions(request).subscribe({
        next: () => {
          const url = apiServiceSpy.get.calls.mostRecent().args[0] as string;
          expect(url).not.toContain('take=');
          expect(url).not.toContain('skip=');
          done();
        }
      });
    });

    it('should throw error when API returns success: false', (done) => {
      const request: CheckInExceptionQueryRequest = {
        fromDate: '2025-01-01',
        toDate: '2025-01-31'
      };

      apiServiceSpy.get.and.returnValue(of({
        success: false,
        message: 'Date cannot be in the future',
        data: { tubesOnlyCheckedIn: [], noBagCheckedIn: [], totalTubesOnly: 0, totalNoBag: 0 }
      }));

      service.queryCheckInExceptions(request).subscribe({
        next: () => fail('Should have thrown an error'),
        error: () => {
          done();
        }
      });
    });

    it('should propagate HTTP errors', (done) => {
      const request: CheckInExceptionQueryRequest = {
        fromDate: '2025-01-01',
        toDate: '2025-01-31'
      };

      apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 400, error: { errorCode: '0060', errorResponse: { error: 'Future date' } } })));

      service.queryCheckInExceptions(request).subscribe({
        next: () => fail('Should have thrown an error'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });
    });
  });

  describe('formatDateForApi', () => {
    it('should format date to YYYY-MM-DD', () => {
      const date = new Date(2025, 0, 15);
      expect(service.formatDateForApi(date)).toBe('2025-01-15');
    });


    it('should handle beginning of year', () => {
      expect(service.formatDateForApi(new Date(2025, 0, 1))).toBe('2025-01-01');
    });

    it('should handle end of year', () => {
      expect(service.formatDateForApi(new Date(2025, 11, 31))).toBe('2025-12-31');
    });
  });
});
