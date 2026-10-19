import { TestBed } from '@angular/core/testing';
import { CommitReagentsForComponentService } from './commit-reagents-for-component.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';

describe('CommitReagentsForComponentService', () => {
  let service: CommitReagentsForComponentService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        CommitReagentsForComponentService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(CommitReagentsForComponentService);
  });

  // -----------------------------------------------------------------------
  // GET endpoints returning arrays (fallback to [])
  // -----------------------------------------------------------------------
  describe.each([
    { method: 'getProcessCodes' as const, args: [], mockData: [{ code: 'P1', description: 'Process 1' }] },
    { method: 'getStageCodes' as const, args: ['P1'], mockData: [{ code: 'S1', description: 'Stage 1' }] },
    { method: 'getUnitProducts' as const, args: ['U1', '2024-01-01', 'P1'], mockData: [{ productCode: 'PC1', productDesc: 'Prod 1', componentPrefix: 'CP1' }] },
  ])('$method (array endpoint)', ({ method, args, mockData }) => {
    it('should return mapped array data', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(of({ data: mockData, success: true, message: '', statusCode: 200 }));

      // Act
      (service[method] as Function)(...args).subscribe((result: any) => {
        // Assert
        expect(result).toEqual(mockData);
        done();
      });
    });

    it('should return empty array on error', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(throwError(() => new Error('fail')));

      // Act
      (service[method] as Function)(...args).subscribe((result: any) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // GET endpoints returning single object or null
  // -----------------------------------------------------------------------
  describe.each([
    { method: 'getUnitInfo' as const, args: ['U1'], mockData: { collDate: '2024-01-01' } },
    { method: 'getComponentInfo' as const, args: ['U1', '2024-01-01', 'PC1', 'CP1', 'P1'], mockData: { aboRh: 'O+', expiryDate: '2024-12-31' } },
  ])('$method (nullable endpoint)', ({ method, args, mockData }) => {
    it('should return mapped data', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(of({ data: mockData, success: true, message: '', statusCode: 200 }));

      // Act
      (service[method] as Function)(...args).subscribe((result: any) => {
        // Assert
        expect(result).toEqual(mockData);
        done();
      });
    });

    it('should return null on error', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(throwError(() => new Error('fail')));

      // Act
      (service[method] as Function)(...args).subscribe((result: any) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // checkKit
  // -----------------------------------------------------------------------
  describe('checkKit', () => {
    it('should return kit data', (done) => {
      // Arrange
      const kit = { kitId: 'K1', reagents: [] };
      apiSpy.get.and.returnValue(of({ data: kit, success: true, message: '', statusCode: 200 }));

      // Act
      service.checkKit('U1', '2024-01-01', 'PC1', 'CP1', 'P1', 'S1').subscribe((result) => {
        // Assert
        expect(result).toEqual(kit);
        done();
      });
    });

    it('should return null when no data', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(of({ data: null, success: true, message: '', statusCode: 200 }));

      // Act
      service.checkKit('U1', '2024-01-01', 'PC1', 'CP1', 'P1', 'S1').subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getLatestKit
  // -----------------------------------------------------------------------
  describe('getLatestKit', () => {
    it('should return kit data', (done) => {
      // Arrange
      const kit = { kitId: 'K2', reagents: [] };
      apiSpy.get.and.returnValue(of({ data: kit, success: true, message: '', statusCode: 200 }));

      // Act
      service.getLatestKit('P1', 'S1').subscribe((result) => {
        // Assert
        expect(result).toEqual(kit);
        done();
      });
    });

    it('should return null on error', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(throwError(() => new Error('fail')));

      // Act
      service.getLatestKit('P1', 'S1').subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // updateKit
  // -----------------------------------------------------------------------
  describe('updateKit', () => {
    it('should put and return void', (done) => {
      // Arrange
      apiSpy.put.and.returnValue(of({ data: undefined, success: true, message: '', statusCode: 200 }));

      // Act
      service.updateKit('K1', { reagents: [] }).subscribe((result) => {
        // Assert
        expect(result).toBeUndefined();
        expect(apiSpy.put).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // createKit
  // -----------------------------------------------------------------------
  describe('createKit', () => {
    it('should post and return created kit response', (done) => {
      // Arrange
      const request = { unitId: 'U1', collDate: '2024-01-01', productCode: 'PC1', componentPrefix: 'CP1', processCode: 'P1', stageCode: 'S1', reagents: [] };
      const mockResponse = { data: { kitId: 42 }, success: true, message: '', statusCode: 200 };
      apiSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.createKit(request).subscribe((result) => {
        // Assert
        expect(result).toEqual({ kitId: 42 });
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
