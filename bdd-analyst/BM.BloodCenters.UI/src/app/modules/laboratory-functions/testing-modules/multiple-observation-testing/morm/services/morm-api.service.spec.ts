import { TestBed } from '@angular/core/testing';
import { MormApiService } from './morm-api.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';

describe('MormApiService', () => {
  let service: MormApiService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        MormApiService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(MormApiService);
  });

  // -----------------------------------------------------------------------
  // getMatrix
  // -----------------------------------------------------------------------
  describe('getMatrix', () => {
    it('should return mapped matrix data', (done) => {
      // Arrange
      const matrixData = { testId: 'T1', testType: 'TT1', testDescription: null, testTypeDescription: null, bandCount: 2, testBands: [], matrixResults: [] };
      apiSpy.get.and.returnValue(of({ data: matrixData, success: true, message: '', statusCode: 200 }));

      // Act
      service.getMatrix('T1', 'TT1').subscribe((result) => {
        // Assert
        expect(result).toEqual(matrixData);
        done();
      });
    });

    it('should propagate error', (done) => {
      // Arrange
      const err = new Error('fail');
      apiSpy.get.and.returnValue(throwError(() => err));

      // Act
      service.getMatrix('T1', 'TT1').subscribe({ error: (e) => { expect(e).toBe(err); done(); } });
    });
  });

  // -----------------------------------------------------------------------
  // saveMatrix
  // -----------------------------------------------------------------------
  describe('saveMatrix', () => {
    it('should post and return save result', (done) => {
      // Arrange
      const request = { testId: 'T1', testType: 'TT1', matrixResults: [] };
      const mockResponse = { data: { insertedCount: 1, updatedCount: 2 }, success: true, message: '', statusCode: 200 };
      apiSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.saveMatrix(request).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse);
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should propagate error', (done) => {
      // Arrange
      apiSpy.post.and.returnValue(throwError(() => new Error('fail')));

      // Act
      service.saveMatrix({} as any).subscribe({ error: (e) => { expect(e).toBeTruthy(); done(); } });
    });
  });

  // -----------------------------------------------------------------------
  // LOV endpoints (similar GET-then-map pattern)
  // -----------------------------------------------------------------------
  describe.each([
    { method: 'getTestsLov' as const, args: [], mockData: [{ testId: 'T1', testDescription: 'Test 1' }] },
    { method: 'getResultValuesLov' as const, args: [], mockData: [{ result: 'P', description: 'Positive' }] },
  ])('$method (no-arg LOV)', ({ method, args, mockData }) => {
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

    it('should propagate error', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(throwError(() => new Error('fail')));

      // Act
      (service[method] as Function)(...args).subscribe({ error: (e: any) => { expect(e).toBeTruthy(); done(); } });
    });
  });

  describe.each([
    { method: 'getTestTypesLov' as const, args: ['T1'], mockData: [{ testType: 'TT1', testTypeDescription: 'Type 1' }] },
    { method: 'getResultInterpretationsLov' as const, args: ['T1'], mockData: [{ resultCode: 'R1', description: 'Interp 1' }] },
  ])('$method (testId LOV)', ({ method, args, mockData }) => {
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

    it('should propagate error', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(throwError(() => new Error('fail')));

      // Act
      (service[method] as Function)(...args).subscribe({ error: (e: any) => { expect(e).toBeTruthy(); done(); } });
    });
  });
});
