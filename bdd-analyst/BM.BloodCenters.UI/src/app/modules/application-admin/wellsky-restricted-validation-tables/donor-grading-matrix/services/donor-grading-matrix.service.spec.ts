import { TestBed } from '@angular/core/testing';
import { DonorGradingMatrixService } from './donor-grading-matrix.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import { CreateDonorGradingMatrix, UpdateDonorGradingMatrix } from '../models/donor-grading-matrix.model';

describe('DonorGradingMatrixService', () => {
  let service: DonorGradingMatrixService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        DonorGradingMatrixService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(DonorGradingMatrixService);
  });

  describe('getDonorGradingMatrix', () => {
    it('should call POST with correct endpoint', () => {
      mockApiService.post.and.returnValue(of({ data: [], total: 0 }));
      service.getDonorGradingMatrix(25, 0, {}).subscribe();
      expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/donor-grading-matrix/25/0', {});
    });


  });

  describe('addDonorGradingMatrix', () => {
    it('should call POST with correct endpoint', () => {
      mockApiService.post.and.returnValue(of({ success: true }));
      const payload: CreateDonorGradingMatrix = { lastnameMatch: 'SAME', firstnameMatch: 'SAME', dobMatch: 'SAME', genderMatch: 'M', grade: 1 };
      service.addDonorGradingMatrix(payload).subscribe();
      expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/donor-grading-matrix', payload);
    });

    it('should propagate 409 error', (done) => {
      mockApiService.post.and.returnValue(throwError(() => ({ status: 409 })));
      service.addDonorGradingMatrix({ lastnameMatch: 'SAME', firstnameMatch: 'SAME', dobMatch: 'SAME', genderMatch: 'M', grade: 1 })
        .subscribe({ error: (err) => { expect(err.status).toBe(409); done(); } });
    });
  });

  describe('updateDonorGradingMatrix', () => {
    it('should call PUT with dgmId in URL', () => {
      mockApiService.put.and.returnValue(of({ success: true }));
      const payload: UpdateDonorGradingMatrix = { lastnameMatch: 'DIFF', firstnameMatch: 'SIMM', dobMatch: 'SAME', genderMatch: 'F', grade: 3 };
      service.updateDonorGradingMatrix(5, payload).subscribe();
      expect(mockApiService.put).toHaveBeenCalledWith('/api/v1/donor-grading-matrix/5', payload);
    });

  });
});
