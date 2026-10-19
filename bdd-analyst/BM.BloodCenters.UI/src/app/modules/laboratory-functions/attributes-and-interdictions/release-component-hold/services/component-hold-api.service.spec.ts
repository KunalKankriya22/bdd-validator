import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ComponentHoldApiService } from './component-hold-api.service';
import { API } from '@core/constants/api.constants';
import { RetrieveComponentHoldsRequest, ReleaseHoldsRequest } from '../models/component-hold.model';

describe('ComponentHoldApiService', () => {
  let service: ComponentHoldApiService;
  let httpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    const httpSpy = jasmine.createSpyObj('HttpClient', ['post', 'get', 'request']);

    TestBed.configureTestingModule({
      providers: [
        ComponentHoldApiService,
        { provide: HttpClient, useValue: httpSpy }
      ]
    });

    service = TestBed.inject(ComponentHoldApiService);
    httpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  describe('validateUnit', () => {
    it('should return mapped UnitData on success', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: {
          unitId: 'U001',
          collectionDate: '2026-01-15',
          chapterId: 'CH01',
          checkDigit: null
        }
      };
      httpClient.post.and.returnValue(of(mockResponse));

      // Act
      service.validateUnit('U001').subscribe({
        next: (result) => {
          // Assert
          expect(result.unitId).toBe('U001');
          expect(result.collectionDate).toBe('2026-01-15');
          expect(result.chapterId).toBe('CH01');
          expect(result.availableProducts).toEqual([]);
          expect(httpClient.post).toHaveBeenCalledWith(
            API.RELEASE_COMPONENT_HOLD.VALIDATE_UNIT,
            { unitId: 'U001' }
          );
          done();
        }
      });
    });

    it('should throw when response is not successful', (done) => {
      // Arrange
      const mockResponse = {
        success: false,
        message: 'Unit not found',
        statusCode: 404,
        data: null
      };
      httpClient.post.and.returnValue(of(mockResponse));

      // Act
      service.validateUnit('INVALID').subscribe({
        error: (error) => {
          // Assert
          expect(error.message).toBe('Unit not found');
          done();
        }
      });
    });

    it('should throw default message when response has no message', (done) => {
      // Arrange
      const mockResponse = {
        success: false,
        message: '',
        statusCode: 500,
        data: null
      };
      httpClient.post.and.returnValue(of(mockResponse));

      // Act
      service.validateUnit('U001').subscribe({
        error: (error) => {
          // Assert
          expect(error.message).toBe('Failed to validate unit');
          done();
        }
      });
    });
  });

  describe('getProductsWithHolds', () => {
    it('should return mapped product options on success', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: [
          { productCode: 'RBC', productDesc: 'Red Blood Cells' },
          { productCode: 'PLT', productDesc: 'Platelets' }
        ]
      };
      httpClient.post.and.returnValue(of(mockResponse));

      // Act
      service.getProductsWithHolds('U001', '2026-01-15').subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(2);
          expect(result[0].productCode).toBe('RBC');
          expect(result[0].productDescription).toBe('Red Blood Cells');
          expect(httpClient.post).toHaveBeenCalledWith(
            API.RELEASE_COMPONENT_HOLD.PRODUCTS_WITH_HOLDS,
            { unitId: 'U001', collectionDate: '2026-01-15' }
          );
          done();
        }
      });
    });

    it('should return empty array when response is not successful', (done) => {
      // Arrange
      const mockResponse = {
        success: false,
        message: 'Error',
        statusCode: 500,
        data: null
      };
      httpClient.post.and.returnValue(of(mockResponse));

      // Act
      service.getProductsWithHolds('U001', '2026-01-15').subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual([]);
          done();
        }
      });
    });
  });

  describe('retrieveComponentHolds', () => {
    const request: RetrieveComponentHoldsRequest = {
      unitId: 'U001',
      collectionDate: '2026-01-15',
      chapterId: 'CH01',
      productCode: 'RBC'
    };

    it('should return mapped holds on success', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: [
          { interCode: 'H01', interDesc: 'Hold One' },
          { interCode: 'H02', interDesc: 'Hold Two' }
        ]
      };
      httpClient.post.and.returnValue(of(mockResponse));

      // Act
      service.retrieveComponentHolds(request).subscribe({
        next: (result) => {
          // Assert
          expect(result.holds.length).toBe(2);
          expect(result.holds[0].interdictionCode).toBe('H01');
          expect(result.holds[0].interdictionDescription).toBe('Hold One');
          expect(result.unitId).toBe('U001');
          expect(result.productCode).toBe('RBC');
          expect(result.productDescription).toBe('');
          done();
        }
      });
    });

    it('should handle null data array gracefully', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        data: null as any
      };
      httpClient.post.and.returnValue(of(mockResponse));

      // Act
      service.retrieveComponentHolds(request).subscribe({
        next: (result) => {
          // Assert
          expect(result.holds).toEqual([]);
          done();
        }
      });
    });

    it('should throw when response is not successful', (done) => {
      // Arrange
      const mockResponse = {
        success: false,
        message: 'Failed to retrieve holds',
        statusCode: 500,
        data: null
      };
      httpClient.post.and.returnValue(of(mockResponse));

      // Act
      service.retrieveComponentHolds(request).subscribe({
        error: (error) => {
          // Assert
          expect(error.message).toBe('Failed to retrieve holds');
          done();
        }
      });
    });
  });

  describe('releaseHolds', () => {
    const request: ReleaseHoldsRequest = {
      unitId: 'U001',
      collectionDate: '2026-01-15',
      chapterId: 'CH01',
      productCode: 'RBC',
      interdictionCodes: ['H01', 'H02']
    };

    it('should return clean success response', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Deleted',
        statusCode: 200,
        data: { holdsReleased: 2 }
      };
      httpClient.request.and.returnValue(of(mockResponse));

      // Act
      service.releaseHolds(request).subscribe({
        next: (result) => {
          // Assert
          expect(result.success).toBe(true);
          expect(result.releasedCount).toBe(2);
          expect(result.message).toBe('Hold(s) released successfully');
          expect(httpClient.request).toHaveBeenCalledWith(
            'DELETE',
            API.RELEASE_COMPONENT_HOLD.RELEASE,
            jasmine.objectContaining({
              body: {
                unitId: 'U001',
                collectionDate: '2026-01-15',
                productCode: 'RBC',
                interCodes: ['H01', 'H02']
              }
            })
          );
          done();
        }
      });
    });

    it('should throw error with errorCode when response fails', (done) => {
      // Arrange
      const mockResponse = {
        success: false,
        message: 'Cannot release',
        statusCode: 400,
        errorCode: '0230',
        data: { holdsReleased: 0 }
      };
      httpClient.request.and.returnValue(of(mockResponse));

      // Act
      service.releaseHolds(request).subscribe({
        error: (error) => {
          // Assert
          expect(error.message).toBe('Cannot release');
          expect(error.errorCode).toBe('0230');
          done();
        }
      });
    });

    it('should throw default message when response fails without message', (done) => {
      // Arrange
      const mockResponse = {
        success: false,
        message: '',
        statusCode: 500,
        data: { holdsReleased: 0 }
      };
      httpClient.request.and.returnValue(of(mockResponse));

      // Act
      service.releaseHolds(request).subscribe({
        error: (error) => {
          // Assert
          expect(error.message).toBe('Failed to release holds');
          done();
        }
      });
    });
  });
});
