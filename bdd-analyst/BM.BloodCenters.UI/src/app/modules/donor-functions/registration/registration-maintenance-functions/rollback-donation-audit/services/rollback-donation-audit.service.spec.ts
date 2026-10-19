import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RollbackDonationAuditService } from './rollback-donation-audit.service';
import { ApiService } from '@shared/services/api.service';
import {
  RetrieveRequest,
  RollbackRequest,
  ReturnResult,
  RetrieveResponse
} from '../models/rollback-donation-audit.model';

describe('RollbackDonationAuditService', () => {
  let service: RollbackDonationAuditService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockRetrieveResponse: ReturnResult<RetrieveResponse> = {
    success: true,
    message: 'Success',
    error: '',
    statusCode: 200,
    data: [],
    item: {
      donorProfile: {
        donorName: 'John Doe',
        dob: '01-15-1980',
        gender: 'Male',
        transactionId: 'TR123456',
        date: '01-10-2025 10:30',
        auditUser: 'admin',
        donationType: 'WB',
        procedureCode: 'WB001',
        signature: 'Yes'
      },
      healthHistory: [],
      physicalFindings: [],
      collectionDate: '01-10-2025',
      okToDonate: true
    },
    total: 1
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['post']);

    TestBed.configureTestingModule({
      providers: [
        RollbackDonationAuditService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(RollbackDonationAuditService);
  });

  describe('retrieve', () => {
    it('should call API with correct endpoint and payload', () => {
      const request: RetrieveRequest = { type: 'Deferral', id: 'DEF123' };
      apiServiceSpy.post.and.returnValue(of(mockRetrieveResponse));

      service.retrieve(request).subscribe();

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/rollback-donation-audit/retrieve',
        request
      );
    });

    it('should return retrieve response on success', (done) => {
      const request: RetrieveRequest = { type: 'Deferral', id: 'DEF123' };
      apiServiceSpy.post.and.returnValue(of(mockRetrieveResponse));

      service.retrieve(request).subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          expect(response.item.donorProfile.donorName).toBe('John Doe');
          done();
        }
      });
    });

  });

  describe('rollback', () => {
    it('should call API with correct endpoint and payload', () => {
      const request: RollbackRequest = { type: 'Deferral', id: 'DEF123', transactionId: 'TR123' };
      const mockResponse: ReturnResult<boolean> = {
        success: true,
        message: 'Rollback successful',
        error: '',
        statusCode: 200,
        data: [],
        item: true,
        total: 1
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.rollback(request).subscribe();

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/rollback-donation-audit/rollback',
        request
      );
    });

    it('should return success on successful rollback', (done) => {
      const request: RollbackRequest = { type: 'Deferral', id: 'DEF123', transactionId: 'TR123' };
      const mockResponse: ReturnResult<boolean> = {
        success: true,
        message: 'Rollback successful',
        error: '',
        statusCode: 200,
        data: [],
        item: true,
        total: 1
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.rollback(request).subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          expect(response.message).toBe('Rollback successful');
          done();
        }
      });
    });

  });
});
