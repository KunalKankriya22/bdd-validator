import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SampleTransferInUnitValidationService } from './sample-transfer-in-unit-validation.service';
import { ApiService } from '@shared/services/api.service';
import type { UnitValidationApiResponse } from '@shared/components/unit-id-field/unit-id-field.model';

describe('SampleTransferInUnitValidationService', () => {
  let service: SampleTransferInUnitValidationService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        SampleTransferInUnitValidationService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(SampleTransferInUnitValidationService);
  });

  describe('validateUnitId', () => {
    it('should return donor lib response when validation and tube check both succeed', (done) => {
      // Arrange
      const donorLibResponse: UnitValidationApiResponse = {
        success: true,
        message: 'Valid',
        errorCode: '',
        item: { parsedUnitId: 'U001' } as any,
      };
      const transferInResponse = { success: true };

      apiSpy.post.and.returnValue(of(donorLibResponse));
      apiSpy.get.and.returnValue(of(transferInResponse));

      // Act
      service.validateUnitId('U001', 'FF1').subscribe((result) => {
        // Assert
        expect(result.success).toBe(true);
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        expect(apiSpy.get).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should return donor lib response as-is when success is false', (done) => {
      // Arrange
      const donorLibResponse: UnitValidationApiResponse = {
        success: false,
        message: 'Invalid unit',
        errorCode: '1234',
        item: null,
      };
      apiSpy.post.and.returnValue(of(donorLibResponse));

      // Act
      service.validateUnitId('U001', 'FF1').subscribe((result) => {
        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toBe('Invalid unit');
        expect(apiSpy.get).not.toHaveBeenCalled();
        done();
      });
    });

    it('should retry with skipCollectionCenter when error code is 9712', (done) => {
      // Arrange
      const error9712 = { error: { errorCode: '9712' } };
      const retryResponse: UnitValidationApiResponse = {
        success: true,
        message: 'Valid',
        errorCode: '',
        item: { parsedUnitId: 'U001' } as any,
      };
      const transferInResponse = { success: true };

      apiSpy.post.and.returnValues(
        throwError(() => error9712),
        of(retryResponse)
      );
      apiSpy.get.and.returnValue(of(transferInResponse));

      // Act
      service.validateUnitId('U001', 'FF1').subscribe((result) => {
        // Assert
        expect(result.success).toBe(true);
        expect(apiSpy.post).toHaveBeenCalledTimes(2);
        done();
      });
    });

    it('should return error response for non-9712 error codes', (done) => {
      // Arrange
      const errorOther = { error: { errorCode: '5000', message: 'Server error' } };
      apiSpy.post.and.returnValue(throwError(() => errorOther));

      // Act
      service.validateUnitId('U001', 'FF1').subscribe((result) => {
        // Assert
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('5000');
        done();
      });
    });

    it('should return failure when tube existence check fails', (done) => {
      // Arrange
      const donorLibResponse: UnitValidationApiResponse = {
        success: true,
        message: 'Valid',
        errorCode: '',
        item: { parsedUnitId: 'U001' } as any,
      };
      const transferInResponse = { success: false, message: 'Not found', errorCode: '1230' };

      apiSpy.post.and.returnValue(of(donorLibResponse));
      apiSpy.get.and.returnValue(of(transferInResponse));

      // Act
      service.validateUnitId('U001', 'FF1').subscribe((result) => {
        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toBe('Not found');
        done();
      });
    });
  });
});
