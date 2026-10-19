import { TestBed } from '@angular/core/testing';
import { HttpParams } from '@angular/common/http';
import { of } from 'rxjs';
import { ModifyCryoDetailsService } from './modify-cryo-details.service';
import { ApiService } from '@shared/services/api.service';

describe('ModifyCryoDetailsService', () => {
  let service: ModifyCryoDetailsService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'put']);

    TestBed.configureTestingModule({
      providers: [
        ModifyCryoDetailsService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(ModifyCryoDetailsService);
  });

  describe('getCryoRecord', () => {
    it('should get and map first element from data array', (done) => {
      // Arrange
      const record = { unitId: 'U1', thawMethod: 'TM1' };
      apiSpy.get.and.returnValue(of({ data: [record] }));

      // Act
      service.getCryoRecord('U1').subscribe((result) => {
        // Assert
        expect(result).toEqual(record as any);
        expect(apiSpy.get).toHaveBeenCalledWith('/api/v1/cryo-modify-details/U1');
        done();
      });
    });

    it('should throw when data array is empty', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(of({ data: [] }));

      // Act
      service.getCryoRecord('U1').subscribe({
        error: (err) => {
          // Assert
          expect(err.message).toBe('No CRYO record found');
          done();
        },
      });
    });
  });

  describe('updateCryoRecord', () => {
    it('should put and return message', (done) => {
      // Arrange
      apiSpy.put.and.returnValue(of({ message: 'Updated' }));
      const dto = { thawMethod: 'TM2' } as any;

      // Act
      service.updateCryoRecord('U1', dto).subscribe((result) => {
        // Assert
        expect(result).toBe('Updated');
        expect(apiSpy.put).toHaveBeenCalledWith('/api/v1/cryo-modify-details/U1', dto);
        done();
      });
    });

    it('should return default message when response has no message', (done) => {
      // Arrange
      apiSpy.put.and.returnValue(of({ message: '' }));
      const dto = { thawMethod: 'TM2' } as any;

      // Act
      service.updateCryoRecord('U1', dto).subscribe((result) => {
        // Assert
        expect(result).toBe('CRYO details updated successfully');
        done();
      });
    });
  });

  describe('getThawMethods', () => {
    it('should return flat array from data', (done) => {
      // Arrange
      const methods = [{ code: 'TM1', description: 'Method 1' }];
      apiSpy.get.and.returnValue(of({ data: methods }));

      // Act
      service.getThawMethods().subscribe((result) => {
        // Assert
        expect(result).toEqual(methods as any);
        expect(apiSpy.get).toHaveBeenCalledWith('/api/v1/cryo-modify-details/thaw-methods');
        done();
      });
    });

    it('should unwrap nested array from data', (done) => {
      // Arrange
      const methods = [{ code: 'TM1', description: 'Method 1' }];
      apiSpy.get.and.returnValue(of({ data: [methods] }));

      // Act
      service.getThawMethods().subscribe((result) => {
        // Assert
        expect(result).toEqual(methods as any);
        done();
      });
    });

    it('should return empty array when data is not an array', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(of({ data: null }));

      // Act
      service.getThawMethods().subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getCentrifuges', () => {
    it('should return flat array from data', (done) => {
      // Arrange
      const centrifuges = [{ code: 'C1', description: 'Centrifuge 1' }];
      apiSpy.get.and.returnValue(of({ data: centrifuges }));

      // Act
      service.getCentrifuges().subscribe((result) => {
        // Assert
        expect(result).toEqual(centrifuges as any);
        expect(apiSpy.get).toHaveBeenCalledWith('/api/v1/cryo-modify-details/centrifuges');
        done();
      });
    });

    it('should unwrap nested array from data', (done) => {
      // Arrange
      const centrifuges = [{ code: 'C1', description: 'Centrifuge 1' }];
      apiSpy.get.and.returnValue(of({ data: [centrifuges] }));

      // Act
      service.getCentrifuges().subscribe((result) => {
        // Assert
        expect(result).toEqual(centrifuges as any);
        done();
      });
    });

    it('should return empty array when data is not an array', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(of({ data: null }));

      // Act
      service.getCentrifuges().subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getCatalogNumbers', () => {
    it('should get with params and unwrap nested array', (done) => {
      // Arrange
      const catalogs = [{ catalogNumber: 'CN1' }];
      apiSpy.get.and.returnValue(of({ data: [catalogs] }));

      // Act
      service.getCatalogNumbers('U1').subscribe((result) => {
        // Assert
        expect(result).toEqual(catalogs as any);
        expect(apiSpy.get).toHaveBeenCalledWith(
          '/api/v1/cryo-modify-details/catalog-numbers',
          { params: jasmine.any(HttpParams) }
        );
        done();
      });
    });

    it('should return empty array when data is not nested', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(of({ data: [] }));

      // Act
      service.getCatalogNumbers('U1').subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });
  });
});
