import { TestBed } from '@angular/core/testing';
import { SpecialProcessingMasterCodesService } from './special-processing-master-codes.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';

describe('SpecialProcessingMasterCodesService', () => {
  let service: SpecialProcessingMasterCodesService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        SpecialProcessingMasterCodesService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(SpecialProcessingMasterCodesService);
  });

  describe('getList', () => {
    it('should map response to paginated result', (done) => {
      // Arrange
      const mockResponse = { data: [{ codeType: 'A', code: '1' }], totalCount: 10, success: true, message: '', statusCode: 200 };
      apiSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.getList(10, 0, { codeType: 'A', searchKeyword: 'test' }).subscribe((result) => {
        // Assert
        expect(result).toEqual({ items: mockResponse.data as any, totalRecords: 10 });
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should default to empty array and data.length when response has no data/totalCount', (done) => {
      // Arrange
      apiSpy.post.and.returnValue(of({ data: null, success: true, message: '', statusCode: 200 }));

      // Act
      service.getList(10, 0, {}).subscribe((result) => {
        // Assert
        expect(result).toEqual({ items: [], totalRecords: 0 });
        done();
      });
    });

    it('should propagate error', (done) => {
      // Arrange
      const err = new Error('fail');
      apiSpy.post.and.returnValue(throwError(() => err));

      // Act
      service.getList(10, 0, {}).subscribe({ error: (e) => { expect(e).toBe(err); done(); } });
    });
  });

  describe('getGroupedList', () => {
    it('should map response to paginated result', (done) => {
      // Arrange
      const mockResponse = { data: [{ codeType: 'B' }], totalCount: 5, success: true, message: '', statusCode: 200 };
      apiSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.getGroupedList(10, 0, { searchKeyword: 'x' }).subscribe((result) => {
        // Assert
        expect(result).toEqual({ items: mockResponse.data as any, totalRecords: 5 });
        done();
      });
    });

    it('should propagate error', (done) => {
      // Arrange
      apiSpy.post.and.returnValue(throwError(() => new Error('fail')));

      // Act
      service.getGroupedList(10, 0, {}).subscribe({ error: (e) => { expect(e).toBeTruthy(); done(); } });
    });
  });

  describe('getById', () => {
    it('should return mapped data', (done) => {
      // Arrange
      const dto = { codeType: 'A', code: '1', codeDesc: 'desc', effDate: null, termDate: null, lastModifiedDate: null };
      apiSpy.get.and.returnValue(of({ data: dto, success: true, message: '', statusCode: 200 }));

      // Act
      service.getById('A', '1').subscribe((result) => {
        // Assert
        expect(result).toEqual(dto);
        done();
      });
    });

    it('should propagate error', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(throwError(() => new Error('fail')));

      // Act
      service.getById('A', '1').subscribe({ error: (e) => { expect(e).toBeTruthy(); done(); } });
    });
  });

  describe('getCodeTypes', () => {
    it('should return code types array', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(of({ data: ['TYPE1', 'TYPE2'], success: true, message: '', statusCode: 200 }));

      // Act
      service.getCodeTypes().subscribe((result) => {
        // Assert
        expect(result).toEqual(['TYPE1', 'TYPE2']);
        done();
      });
    });

    it('should return empty array on error', (done) => {
      // Arrange
      apiSpy.get.and.returnValue(throwError(() => new Error('fail')));

      // Act
      service.getCodeTypes().subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('create', () => {
    it('should post and return response', (done) => {
      // Arrange
      const request = { codeType: 'A', code: '1', codeDesc: 'desc', effDate: null, termDate: null };
      const mockResponse = { data: {} as any, success: true, message: 'created', statusCode: 200 };
      apiSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.create(request).subscribe((result) => {
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
      service.create({} as any).subscribe({ error: (e) => { expect(e).toBeTruthy(); done(); } });
    });
  });

  describe('update', () => {
    it('should put and return response', (done) => {
      // Arrange
      const request = { codeDesc: 'updated', effDate: null, termDate: null };
      const mockResponse = { data: {} as any, success: true, message: 'updated', statusCode: 200 };
      apiSpy.put.and.returnValue(of(mockResponse));

      // Act
      service.update('A', '1', request).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse);
        expect(apiSpy.put).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should propagate error', (done) => {
      // Arrange
      apiSpy.put.and.returnValue(throwError(() => new Error('fail')));

      // Act
      service.update('A', '1', {} as any).subscribe({ error: (e) => { expect(e).toBeTruthy(); done(); } });
    });
  });
});
