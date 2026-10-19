import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EnterComponentDifferentialService } from './enter-component-differential.service';
import { ApiService } from '@shared/services/api.service';

describe('EnterComponentDifferentialService', () => {
  let service: EnterComponentDifferentialService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        EnterComponentDifferentialService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(EnterComponentDifferentialService);
  });

  // ── code-fetching GETs that map {code,description} and catchError→[] ─
  [
    { method: 'getProcessCodes' as const, key: 'processCode' },
    { method: 'getCellCodes' as const, key: 'cellCode' },
  ].forEach(({ method, key }) => {
    describe(method, () => {
      it('should map response and return mapped array', (done) => {
        // Arrange
        apiSpy.get.and.returnValue(of({ data: [{ code: 'C1', description: 'Desc' }] }));

        // Act
        service[method]().subscribe((result) => {
          // Assert
          expect(result.length).toBe(1);
          expect((result[0] as any)[key]).toBe('C1');
          done();
        });
      });

      it('should return empty array on error', (done) => {
        // Arrange
        apiSpy.get.and.returnValue(throwError(() => new Error('fail')));

        // Act
        service[method]().subscribe((result) => {
          // Assert
          expect(result).toEqual([]);
          done();
        });
      });
    });
  });

  describe('getStageCodes', () => {
    it('should map response with stageCode key', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(of({ data: [{ code: 'S1', description: 'Stage' }] }));

      // Act
      service.getStageCodes('P1').subscribe((result) => {
        // Assert
        expect(result[0].stageCode).toBe('S1');
        done();
      });
    });

    it('should return empty array on error', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(throwError(() => new Error('fail')));

      // Act
      service.getStageCodes('P1').subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getProductCodes', () => {
    it('should return response.data', (done) => {
      // Arrange
      const mockData = [{ productCode: 'PC1' }];
      apiSpy.get.and.returnValue(of({ data: mockData }));

      // Act
      service.getProductCodes('U1', '2024-01-01', 'P1').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData as any);
        done();
      });
    });

    it('should return empty array on error', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(throwError(() => new Error('fail')));

      // Act
      service.getProductCodes('U1', '2024-01-01', 'P1').subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });
  });

  // ── GETs returning data ?? null with catchError→null ─────────────────
  [
    { method: 'getUnitInfo' as const, args: ['U1'] },
    { method: 'getComponentInfo' as const, args: ['U1', '2024-01-01', 'PC', 'CP', 'P1'] },
    { method: 'getById' as const, args: [123] },
  ].forEach(({ method, args }) => {
    describe(method, () => {
      it('should return response.data', (done) => {
        // Arrange
        const mockData = { id: 1 };
        apiSpy.get.and.returnValue(of({ data: mockData }));

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
  });

  describe('search', () => {
    it('should POST filters and return data and total', (done) => {
      // Arrange
      const mockResponse = { data: [{ differentialId: 1 }], total: 1 };
      apiSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.search(10, 0, {} as any).subscribe((result) => {
        // Assert
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should return empty result on error', (done) => {
      // Arrange
      apiSpy.post.and.returnValue(throwError(() => new Error('fail')));

      // Act
      service.search(10, 0, {} as any).subscribe((result) => {
        // Assert
        expect(result).toEqual({ data: [], total: 0 });
        done();
      });
    });
  });

  describe('create', () => {
    it('should POST request and return response', (done) => {
      // Arrange
      const mockResponse = { data: { differentialId: 1, cellCode: 'CC' }, success: true };
      apiSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.create({} as any).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('update', () => {
    it('should PUT request and return response', (done) => {
      // Arrange
      const mockResponse = { data: { differentialId: 1, cellCode: 'CC' }, success: true };
      apiSpy.put.and.returnValue(of(mockResponse));

      // Act
      service.update(1, 'CC', {} as any).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.put).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
