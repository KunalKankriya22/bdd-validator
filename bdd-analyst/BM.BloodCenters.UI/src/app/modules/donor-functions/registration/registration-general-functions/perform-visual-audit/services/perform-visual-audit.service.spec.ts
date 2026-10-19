import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { PerformVisualAuditService } from './perform-visual-audit.service';
import { SearchUnitRequest, SaveAuditRequest, ResetAuditRequest } from '../models/perform-visual-audit.model';

describe('PerformVisualAuditService', () => {
  let service: PerformVisualAuditService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockSearchResponse = {
    donorDetails: { donorId: 'D001', name: 'John Doe', dateOfBirth: '1990-01-01', sex: 'M' },
    units: [{ unitId: 'U001', audit: 'OK' as const, collectionDate: '2024-01-01', donationType: 'WB', procedureCode: 'PC01' }],
    multipleCollectionDates: false
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        PerformVisualAuditService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(PerformVisualAuditService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('searchByUnitId', () => {
    it('should return first data element on success', (done) => {
      const request: SearchUnitRequest = { option: 'Donation', unitId: 'U001', chapterId: 'CH001' };
      apiService.post.and.returnValue(of({ success: true, message: 'ok', statusCode: 200, data: [mockSearchResponse] }));

      service.searchByUnitId(request).subscribe({
        next: (result) => {
          expect(result.units.length).toBe(1);
          expect(result.units[0].unitId).toBe('U001');
          expect(apiService.post).toHaveBeenCalledWith('/api/v1/visual-audit/search', request);
          done();
        }
      });
    });

    it('should throw when success is true but data is empty', (done) => {
      const request: SearchUnitRequest = { option: 'Donation', unitId: 'U001', chapterId: 'CH001' };
      apiService.post.and.returnValue(of({ success: true, message: 'No data found', statusCode: 200, data: [] }));

      service.searchByUnitId(request).subscribe({
        error: (err) => {
          expect(err.message).toBe('No data found');
          done();
        }
      });
    });

    it('should throw when success is false', (done) => {
      const request: SearchUnitRequest = { option: 'Donation', unitId: 'U001', chapterId: 'CH001' };
      apiService.post.and.returnValue(of({ success: false, message: 'Not found', statusCode: 404, data: undefined }));

      service.searchByUnitId(request).subscribe({
        error: (err) => {
          expect(err.message).toBe('Not found');
          done();
        }
      });
    });

    it('should propagate HTTP errors', (done) => {
      const request: SearchUnitRequest = { option: 'Deferral', deferralId: 'DEF001', chapterId: 'CH001' };
      apiService.post.and.returnValue(throwError(() => new Error('Network error')));

      service.searchByUnitId(request).subscribe({
        error: (err) => {
          expect(err.message).toBe('Network error');
          done();
        }
      });
    });
  });

  describe('saveAudit', () => {
    it('should call POST with save request', (done) => {
      const request: SaveAuditRequest = {
        option: 'Donation',
        chapterId: 'CH001',
        units: [{ unitId: 'U001', audit: 'OK', collectionDate: '2024-01-01' }]
      };
      apiService.post.and.returnValue(of({ success: true, message: 'Saved' }));

      service.saveAudit(request).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiService.post).toHaveBeenCalledWith('/api/v1/visual-audit/save', request);
          done();
        }
      });
    });

    it('should propagate save errors', (done) => {
      const request: SaveAuditRequest = { option: 'Donation', chapterId: 'CH001', units: [] };
      apiService.post.and.returnValue(throwError(() => new Error('Save failed')));

      service.saveAudit(request).subscribe({
        error: (err) => {
          expect(err.message).toBe('Save failed');
          done();
        }
      });
    });
  });

  describe('resetAudit', () => {
    it('should call POST with reset request', (done) => {
      const request: ResetAuditRequest = {
        option: 'Donation',
        unitId: 'U001',
        newStatus: 'OK',
        chapterId: 'CH001'
      };
      apiService.post.and.returnValue(of({ success: true, message: 'Reset successfully' }));

      service.resetAudit(request).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiService.post).toHaveBeenCalledWith('/api/v1/visual-audit/reset', request);
          done();
        }
      });
    });

    it('should support null newStatus for clearing audit', (done) => {
      const request: ResetAuditRequest = {
        option: 'Deferral',
        deferralId: 'DEF001',
        newStatus: null,
        chapterId: 'CH001'
      };
      apiService.post.and.returnValue(of({ success: true, message: 'Cleared' }));

      service.resetAudit(request).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          done();
        }
      });
    });
  });
});
