import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiService } from '@shared/services/api.service';
import { ViewNotificationLetterDialogService } from './view-notification-letter-dialog.service';
import {
  NotificationLetterListResponse,
  NotificationLetterTextResponse,
  NotificationLetter,
} from './view-notification-letter-dialog.model';

describe('ViewNotificationLetterDialogService', () => {
  let service: ViewNotificationLetterDialogService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockLetter: NotificationLetter = {
    letterCode: 'NL001',
    letterSeqNo: '100',
    chapterId: 'CH01',
    letterTitle: 'Test Letter',
    authorizedBy: 'ADMIN',
    authorizedDate: '2026-01-15T00:00:00',
    generatedBy: 'SYSTEM',
    generatedDate: '2026-01-16T00:00:00',
  };

  const mockListResponse: NotificationLetterListResponse = {
    success: true,
    message: '',
    statusCode: 200,
    data: [{ letters: [mockLetter] }],
    total: 1,
    errorResponse: { errorCode: '', error: '' },
  };

  const mockTextResponse: NotificationLetterTextResponse = {
    success: true,
    message: '',
    statusCode: 200,
    data: [{ letterText: 'Dear Donor, this is a notification letter.' }],
    total: 1,
    errorResponse: { errorCode: '', error: '' },
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        ViewNotificationLetterDialogService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(ViewNotificationLetterDialogService);
  });

  describe('getLettersForDonor', () => {
    it('should return letters array on success', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockListResponse));

      service.getLettersForDonor('DN00001').subscribe((letters) => {
        expect(letters.length).toBe(1);
        expect(letters[0].letterCode).toBe('NL001');
        expect(letters[0].letterSeqNo).toBe('100');
        done();
      });
    });


    it('should return empty array when data array is empty', (done) => {
      const emptyResponse: NotificationLetterListResponse = {
        ...mockListResponse,
        data: [{ letters: [] }],
      };
      apiServiceSpy.get.and.returnValue(of(emptyResponse));

      service.getLettersForDonor('DN00001').subscribe((letters) => {
        expect(letters).toEqual([]);
        done();
      });
    });

    it('should throw error when response is not successful', (done) => {
      const failResponse: NotificationLetterListResponse = {
        ...mockListResponse,
        success: false,
        message: 'Donor not found',
      };
      apiServiceSpy.get.and.returnValue(of(failResponse));

      service.getLettersForDonor('DN00001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Donor not found');
          done();
        },
      });
    });

    it('should propagate API errors', (done) => {
      const apiError = new Error('Network error');
      apiServiceSpy.get.and.returnValue(throwError(() => apiError));

      service.getLettersForDonor('DN00001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Network error');
          done();
        },
      });
    });

    it('should call correct API endpoint with encoded donorId', () => {
      apiServiceSpy.get.and.returnValue(of(mockListResponse));
      service.getLettersForDonor('DN/001').subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        '/api/v1/notification-letters/DN%2F001',
        jasmine.objectContaining({ context: jasmine.anything() }),
      );
    });
  });

  describe('getLetterText', () => {
    it('should return letter text on success', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockTextResponse));

      service.getLetterText('DN00001', '100', 'CH01').subscribe((text) => {
        expect(text).toBe('Dear Donor, this is a notification letter.');
        done();
      });
    });


    it('should throw error when response is not successful', (done) => {
      const failResponse: NotificationLetterTextResponse = {
        ...mockTextResponse,
        success: false,
        message: 'Letter not found',
      };
      apiServiceSpy.get.and.returnValue(of(failResponse));

      service.getLetterText('DN00001', '100', 'CH01').subscribe({
        error: (err) => {
          expect(err.message).toBe('Letter not found');
          done();
        },
      });
    });

    it('should pass chapterId as query param', () => {
      apiServiceSpy.get.and.returnValue(of(mockTextResponse));
      service.getLetterText('DN00001', '100', 'CH01').subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        '/api/v1/notification-letters/DN00001/letter-text/100',
        jasmine.objectContaining({
          params: jasmine.anything(),
        }),
      );
    });

    it('should propagate API errors', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Server error')));

      service.getLetterText('DN00001', '100', 'CH01').subscribe({
        error: (err) => {
          expect(err.message).toBe('Server error');
          done();
        },
      });
    });
  });
});
