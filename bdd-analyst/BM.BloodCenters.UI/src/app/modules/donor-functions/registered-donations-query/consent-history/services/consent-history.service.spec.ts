import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ConsentHistoryService } from './consent-history.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../core/constants/api.constants';
import {
  ConsentHistoryDto,
  ConsentHistoryDetailDto,
  ConsentHistoryDonorInfoDto,
  ConsentHistoryQueryDto,
  ReturnResult,
} from '../models/consent-history.model';

describe('ConsentHistoryService', () => {
  let service: ConsentHistoryService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockConsentHistoryData: ConsentHistoryDto[] = [
    {
      chapterId: 'CH01',
      unitId: 'W0352001234',
      deferralId: 'DEF001',
      collDate: '2026-01-15T00:00:00',
      letterCode: 'LC01',
      signatureDate: '2026-01-15T10:30:00',
      witness: 'WITNESS1',
      manualSignatureDate: null,
      status: 'Accepted',
      donorId: 'DON001',
      transactionId: 'TXN001',
      letterId: 'LTR001',
    },
    {
      chapterId: 'CH01',
      unitId: null,
      deferralId: null,
      collDate: '2026-01-16T00:00:00',
      letterCode: 'LC02',
      signatureDate: '2026-01-16T14:00:00',
      witness: null,
      manualSignatureDate: '2026-01-16T00:00:00',
      status: 'Decline',
      donorId: 'DON001',
      transactionId: 'TXN002',
      letterId: 'LTR002',
    },
  ];

  const mockDetailData: ConsentHistoryDetailDto = {
    letterContent: 'This is the consent letter content.',
    letterCode: 'LC01',
    chapterId: 'CH01',
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        ConsentHistoryService,
        { provide: ApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(ConsentHistoryService);
  });

  describe('queryConsentHistory', () => {
    const query: ConsentHistoryQueryDto = { donorId: 'DON001' };

    it('should call ApiService.post with correct URL and query', () => {
      const response: ReturnResult<ConsentHistoryDto> = {
        data: mockConsentHistoryData,
        total: 2,
      };
      mockApiService.post.and.returnValue(of(response));

      service.queryConsentHistory(query).subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith(
        API.CONSENT_HISTORY.BASE,
        query
      );
    });

    it('should return mapped data and total on success', (done) => {
      const response: ReturnResult<ConsentHistoryDto> = {
        data: mockConsentHistoryData,
        total: 2,
        message: undefined,
      };
      mockApiService.post.and.returnValue(of(response));

      service.queryConsentHistory(query).subscribe((result) => {
        expect(result.data).toEqual(mockConsentHistoryData);
        expect(result.total).toBe(2);
        expect(result.message).toBeUndefined();
        done();
      });
    });


    it('should include message when present in response', (done) => {
      const response: ReturnResult<ConsentHistoryDto> = {
        data: [],
        total: 0,
        message: 'No records found',
      };
      mockApiService.post.and.returnValue(of(response));

      service.queryConsentHistory(query).subscribe((result) => {
        expect(result.message).toBe('No records found');
        done();
      });
    });

    it('should propagate error on API failure', (done) => {
      const error = new Error('Server error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.queryConsentHistory(query).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getConsentDetail', () => {
    const donorId = 'DON001';
    const transactionId = 'TXN001';
    const letterId = 'LTR001';

    it('should call ApiService.get with correct URL', () => {
      mockApiService.get.and.returnValue(
        of({ success: true, data: mockDetailData, message: '' })
      );

      service.getConsentDetail(donorId, transactionId, letterId).subscribe();

      expect(mockApiService.get).toHaveBeenCalledWith(
        API.CONSENT_HISTORY.DETAIL(donorId, transactionId, letterId)
      );
    });

    it('should return detail data on success', (done) => {
      mockApiService.get.and.returnValue(
        of({ success: true, data: mockDetailData, message: '' })
      );

      service
        .getConsentDetail(donorId, transactionId, letterId)
        .subscribe((result) => {
          expect(result).toEqual(mockDetailData);
          done();
        });
    });

    it('should propagate error on API failure', (done) => {
      const error = new Error('Not found');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getConsentDetail(donorId, transactionId, letterId).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getSignatureUrl', () => {
    it('should return correct donor signature URL', () => {
      const url = service.getSignatureUrl('DON001', 'TXN001', 'LTR001', 'donor');
      expect(url).toBe(
        API.CONSENT_HISTORY.SIGNATURE('DON001', 'TXN001', 'LTR001', 'donor')
      );
    });

    it('should return correct witness signature URL', () => {
      const url = service.getSignatureUrl('DON001', 'TXN001', 'LTR001', 'witness');
      expect(url).toBe(
        API.CONSENT_HISTORY.SIGNATURE('DON001', 'TXN001', 'LTR001', 'witness')
      );
    });
  });

  describe('getDonorInfo', () => {
    it('should GET donor info with correct URL', () => {
      const response: ReturnResult<ConsentHistoryDonorInfoDto> = {
        data: [{ donorId: 'DN001', donorName: 'John', address: '123 Main St' }],
      };
      mockApiService.get.and.returnValue(of(response));

      service.getDonorInfo('DN001').subscribe();

      expect(mockApiService.get).toHaveBeenCalledWith(
        API.CONSENT_HISTORY.DONOR_INFO('DN001')
      );
    });

    it('should return first item from data array', (done) => {
      const response: ReturnResult<ConsentHistoryDonorInfoDto> = {
        success: true,
        data: [{ donorId: 'DN001', donorName: 'John', address: '123 Main St' }],
      };
      mockApiService.get.and.returnValue(of(response));

      service.getDonorInfo('DN001').subscribe((result) => {
        expect(result).toEqual({ donorId: 'DN001', donorName: 'John', address: '123 Main St' });
        done();
      });
    });

    it('should propagate error on HTTP failure', (done) => {
      const error = new Error('Server error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getDonorInfo('DN001').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getSignature', () => {
    const donorId = 'DON001';
    const transactionId = 'TXN001';
    const letterId = 'LTR001';

    it('should call ApiService.get with correct URL and blob responseType', () => {
      const blob = new Blob(['image'], { type: 'image/jpeg' });
      mockApiService.get.and.returnValue(of(blob));

      service.getSignature(donorId, transactionId, letterId, 'donor').subscribe();

      expect(mockApiService.get).toHaveBeenCalledWith(
        API.CONSENT_HISTORY.SIGNATURE(donorId, transactionId, letterId, 'donor'),
        jasmine.objectContaining({ responseType: 'blob' as any })
      );
    });

    it('should return blob on success for donor signature', (done) => {
      const blob = new Blob(['image-data'], { type: 'image/jpeg' });
      mockApiService.get.and.returnValue(of(blob));

      service
        .getSignature(donorId, transactionId, letterId, 'donor')
        .subscribe((result) => {
          expect(result).toBe(blob);
          done();
        });
    });

    it('should return blob on success for witness signature', (done) => {
      const blob = new Blob(['witness-data'], { type: 'image/jpeg' });
      mockApiService.get.and.returnValue(of(blob));

      service
        .getSignature(donorId, transactionId, letterId, 'witness')
        .subscribe((result) => {
          expect(result).toBe(blob);
          done();
        });
    });

    it('should propagate error on API failure', (done) => {
      const error = new Error('Signature not found');
      mockApiService.get.and.returnValue(throwError(() => error));

      service
        .getSignature(donorId, transactionId, letterId, 'donor')
        .subscribe({
          error: (err) => {
            expect(err).toBe(error);
            done();
          },
        });
    });
  });
});
