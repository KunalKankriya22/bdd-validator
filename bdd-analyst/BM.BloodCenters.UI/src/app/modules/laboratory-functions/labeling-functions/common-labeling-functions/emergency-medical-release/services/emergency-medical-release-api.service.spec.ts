import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EmergencyMedicalReleaseApiService } from './emergency-medical-release-api.service';
import { ApiService } from '@shared/services/api.service';

describe('EmergencyMedicalReleaseApiService', () => {
  let service: EmergencyMedicalReleaseApiService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        EmergencyMedicalReleaseApiService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(EmergencyMedicalReleaseApiService);
  });

  describe('getComponent', () => {
    it('should get component details for a unit', (done) => {
      // Arrange
      const mockResponse = { success: true, data: { unitId: 'U1' } };
      apiSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getComponent('U1').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.get).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getAboValues', () => {
    it('should get ABO values', (done) => {
      // Arrange
      const mockResponse = { success: true, data: [{ code: 'A' }] };
      apiSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getAboValues().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.get).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getOverrideCodes', () => {
    it('should get override codes', (done) => {
      // Arrange
      const mockResponse = { success: true, data: [{ code: 'OVR1' }] };
      apiSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getOverrideCodes().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.get).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getProducts', () => {
    it('should get products for a unit', (done) => {
      // Arrange
      const mockResponse = { success: true, data: [{ productCode: 'P1' }] };
      apiSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getProducts('U1').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.get).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getComponentPrefixes', () => {
    it('should get component prefixes for unit and product', (done) => {
      // Arrange
      const mockResponse = { success: true, data: ['PFX1', 'PFX2'] };
      apiSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getComponentPrefixes('U1', 'P1').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.get).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('processRelease', () => {
    it('should post release request', (done) => {
      // Arrange
      const mockResponse = { success: true, data: { releaseId: 'R1' } };
      apiSpy.post.and.returnValue(of(mockResponse));
      const request = { unitId: 'U1' } as any;

      // Act
      service.processRelease(request).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('processLabel', () => {
    it('should post label processing request', (done) => {
      // Arrange
      const mockResponse = { success: true, data: { labelId: 'L1' } };
      apiSpy.post.and.returnValue(of(mockResponse));
      const request = { unitId: 'U1' } as any;

      // Act
      service.processLabel(request).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('logAbandoned', () => {
    it('should post abandoned label request', (done) => {
      // Arrange
      const mockResponse = { success: true, data: true };
      apiSpy.post.and.returnValue(of(mockResponse));
      const request = { unitId: 'U1' } as any;

      // Act
      service.logAbandoned(request).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
