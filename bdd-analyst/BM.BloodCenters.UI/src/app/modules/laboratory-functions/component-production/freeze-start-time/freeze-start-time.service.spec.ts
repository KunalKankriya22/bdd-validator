import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { FreezeStartTimeService } from './freeze-start-time.service';

describe('FreezeStartTimeService', () => {
  let service: FreezeStartTimeService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        FreezeStartTimeService,
        { provide: HttpClient, useValue: httpSpy },
      ],
    });

    service = TestBed.inject(FreezeStartTimeService);
  });

  describe('validateUnit', () => {
    it('should post and map first data element', (done) => {
      // Arrange
      const mapped = { unitId: 'U1', collectionDate: '2024-01-01' };
      httpSpy.post.and.returnValue(of({ success: true, statusCode: 200, message: 'OK', data: [mapped] }));

      // Act
      service.validateUnit({ unitId: 'U1' } as any).subscribe((result) => {
        // Assert
        expect(result).toEqual(mapped as any);
        expect(httpSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('lookupProducts', () => {
    it('should post and return first data element or empty array', (done) => {
      // Arrange
      const products = [{ productCode: 'P1' }];
      httpSpy.post.and.returnValue(of({ success: true, statusCode: 200, message: 'OK', data: [products] }));

      // Act
      service.lookupProducts({ unitId: 'U1' } as any).subscribe((result) => {
        // Assert
        expect(result).toEqual(products as any);
        done();
      });
    });

    it('should return empty array when data element is falsy', (done) => {
      // Arrange
      httpSpy.post.and.returnValue(of({ success: true, statusCode: 200, message: 'OK', data: [null] }));

      // Act
      service.lookupProducts({ unitId: 'U1' } as any).subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('lookupAliquots', () => {
    it('should post and return first data element or empty array', (done) => {
      // Arrange
      const aliquots = [{ aliquotId: 'A1' }];
      httpSpy.post.and.returnValue(of({ success: true, statusCode: 200, message: 'OK', data: [aliquots] }));

      // Act
      service.lookupAliquots({ unitId: 'U1', productCode: 'P1' } as any).subscribe((result) => {
        // Assert
        expect(result).toEqual(aliquots as any);
        done();
      });
    });

    it('should return empty array when data element is falsy', (done) => {
      // Arrange
      httpSpy.post.and.returnValue(of({ success: true, statusCode: 200, message: 'OK', data: [null] }));

      // Act
      service.lookupAliquots({ unitId: 'U1', productCode: 'P1' } as any).subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('recordFreeze', () => {
    it('should post and map first data element', (done) => {
      // Arrange
      const response = { success: true, freezeId: 'F1' };
      httpSpy.post.and.returnValue(of({ success: true, statusCode: 200, message: 'OK', data: [response] }));

      // Act
      service.recordFreeze({ unitId: 'U1' } as any).subscribe((result) => {
        // Assert
        expect(result).toEqual(response as any);
        done();
      });
    });
  });

  describe('checkDuplicate', () => {
    it('should post and map first data element', (done) => {
      // Arrange
      const response = { isDuplicate: false };
      httpSpy.post.and.returnValue(of({ success: true, statusCode: 200, message: 'OK', data: [response] }));

      // Act
      service.checkDuplicate({ unitId: 'U1' } as any).subscribe((result) => {
        // Assert
        expect(result).toEqual(response as any);
        done();
      });
    });
  });

  describe('queryHistory', () => {
    it('should post and map first data element', (done) => {
      // Arrange
      const response = { records: [], totalCount: 0 };
      httpSpy.post.and.returnValue(of({ success: true, statusCode: 200, message: 'OK', data: [response] }));

      // Act
      service.queryHistory({ page: 1, pageSize: 10 } as any).subscribe((result) => {
        // Assert
        expect(result).toEqual(response as any);
        done();
      });
    });
  });
});
