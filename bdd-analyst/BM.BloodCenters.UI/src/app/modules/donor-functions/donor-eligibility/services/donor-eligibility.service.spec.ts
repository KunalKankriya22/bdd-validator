import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DonorEligibilityService } from './donor-eligibility.service';
import { ApiService } from '@shared/services/api.service';

describe('DonorEligibilityService', () => {
  let service: DonorEligibilityService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        DonorEligibilityService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(DonorEligibilityService);
  });

  describe('getDonationTypes', () => {
    it('should return mapped donation types on success', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        data: [{ donationType: 'WB', description: 'Whole Blood' }],
      };
      apiSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getDonationTypes().subscribe((result) => {
        // Assert
        expect(result).toEqual([{ code: 'WB', description: 'Whole Blood' }]);
        done();
      });
    });

    it('should throw error when response is not successful', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(of({ success: false, message: 'Error', data: [] }));

      // Act
      service.getDonationTypes().subscribe({
        error: (e) => {
          // Assert
          expect(e.message).toBe('Error');
          done();
        },
      });
    });
  });

  describe('getProcedureCodes', () => {
    it('should return procedure codes on success', (done) => {
      // Arrange
      const codes = [{ procedureCode: 'PC1', description: 'Procedure 1' }];
      apiSpy.get.and.returnValue(of({ success: true, data: codes }));

      // Act
      service.getProcedureCodes('WB').subscribe((result) => {
        // Assert
        expect(result).toEqual(codes as any);
        done();
      });
    });

    it('should throw error when response is not successful', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(of({ success: false, message: 'Failed', data: [] }));

      // Act
      service.getProcedureCodes('WB').subscribe({
        error: (e) => {
          // Assert
          expect(e.message).toBe('Failed');
          done();
        },
      });
    });
  });

  describe('checkEligibility', () => {
    it('should return eligibility result from item on success', (done) => {
      // Arrange
      const eligResult = { eligStatus: 'Y', deferralDate: null, interType: null, deferralReason: null };
      apiSpy.post.and.returnValue(of({ success: true, item: eligResult, data: [] }));

      // Act
      service.checkEligibility({ donorId: 'D1' } as any).subscribe((result) => {
        // Assert
        expect(result).toEqual(eligResult as any);
        done();
      });
    });

    it('should throw error when response is not successful', (done) => {
      // Arrange
      apiSpy.post.and.returnValue(of({ success: false, message: 'Check failed', data: [] }));

      // Act
      service.checkEligibility({} as any).subscribe({
        error: (e) => {
          // Assert
          expect(e.message).toBe('Check failed');
          done();
        },
      });
    });
  });

  describe('getInterdictions', () => {
    it('should return interdictions on success', (done) => {
      // Arrange
      const interdictions = [{ interType: 'PERM', reason: 'Test' }];
      apiSpy.get.and.returnValue(of({ success: true, data: interdictions }));

      // Act
      service.getInterdictions('D1').subscribe((result) => {
        // Assert
        expect(result).toEqual(interdictions as any);
        done();
      });
    });

    it('should throw error when response is not successful', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(of({ success: false, message: 'Failed', data: [] }));

      // Act
      service.getInterdictions('D1').subscribe({
        error: (e) => {
          // Assert
          expect(e.message).toBe('Failed');
          done();
        },
      });
    });
  });
});
