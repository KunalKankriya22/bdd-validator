import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ConversionMappingApiService } from './conversion-mapping-api.service';

describe('ConversionMappingApiService', () => {
  let service: ConversionMappingApiService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        ConversionMappingApiService,
        { provide: HttpClient, useValue: httpSpy },
      ],
    });

    service = TestBed.inject(ConversionMappingApiService);
  });

  describe('getSourceApplications', () => {
    it('should GET source applications', (done) => {
      // Arrange
      const mockResponse = { data: [{ sourceApplId: 'APP1' }], success: true };
      httpSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getSourceApplications().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(httpSpy.get).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getTargetValueTypes', () => {
    it('should GET target value types', (done) => {
      // Arrange
      const mockResponse = { data: [{ targetValueType: 'TYPE1' }], success: true };
      httpSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getTargetValueTypes().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(httpSpy.get).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getConversionMappings', () => {
    it('should POST to fetch conversion mappings with pagination', (done) => {
      // Arrange
      const query = { sourceApplId: 'APP1' } as any;
      const mockResponse = { data: [{ sourceValue: 'V1' }], success: true };
      httpSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.getConversionMappings(10, 0, query).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(httpSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('createConversionMapping', () => {
    it('should POST a new conversion mapping', (done) => {
      // Arrange
      const dto = { sourceApplId: 'APP1', sourceValue: 'V1' } as any;
      const mockResponse = { success: true };
      httpSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.createConversionMapping(dto).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(httpSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('updateConversionMapping', () => {
    it('should PUT an updated conversion mapping', (done) => {
      // Arrange
      const dto = { newTargetValue: 'V2' } as any;
      const mockResponse = { success: true };
      httpSpy.put.and.returnValue(of(mockResponse));

      // Act
      service.updateConversionMapping('APP1', 'APP2', 'V1', 'V2', 'TYPE1', dto).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(httpSpy.put).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
