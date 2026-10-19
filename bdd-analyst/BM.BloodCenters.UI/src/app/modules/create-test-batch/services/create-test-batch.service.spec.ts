import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { CreateTestBatchService } from './create-test-batch.service';
import { environment } from 'src/environments/environment';

describe('CreateTestBatchService', () => {
  let service: CreateTestBatchService;
  let httpSpy: jasmine.SpyObj<HttpClient>;
  const baseUrl = `${environment.apiUrl}/api/v1/create-test-batch`;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        CreateTestBatchService,
        { provide: HttpClient, useValue: httpSpy },
      ],
    });

    service = TestBed.inject(CreateTestBatchService);
  });

  describe('getOpenBatches', () => {
    it('should GET open batches', (done) => {
      // Arrange
      const mockResult = { data: [], total: 0 };
      httpSpy.get.and.returnValue(of(mockResult));

      // Act
      service.getOpenBatches().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResult);
        expect(httpSpy.get).toHaveBeenCalledWith(`${baseUrl}/open-batches`);
        done();
      });
    });
  });

  describe('getBatchById', () => {
    it('should GET batch by encoded id', (done) => {
      // Arrange
      const mockResult = { data: [], total: 0 };
      httpSpy.get.and.returnValue(of(mockResult));

      // Act
      service.getBatchById('TB-001').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResult);
        expect(httpSpy.get).toHaveBeenCalledWith(`${baseUrl}/${encodeURIComponent('TB-001')}`);
        done();
      });
    });
  });

  describe('getValidTests', () => {
    it('should GET valid tests', (done) => {
      // Arrange
      const mockResult = { data: [], total: 0 };
      httpSpy.get.and.returnValue(of(mockResult));

      // Act
      service.getValidTests().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResult);
        expect(httpSpy.get).toHaveBeenCalledWith(`${baseUrl}/valid-tests`);
        done();
      });
    });
  });

  describe('getTestKits', () => {
    it('should GET test kits by encoded test id', (done) => {
      // Arrange
      const mockResult = { data: [], total: 0 };
      httpSpy.get.and.returnValue(of(mockResult));

      // Act
      service.getTestKits('T-100').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResult);
        expect(httpSpy.get).toHaveBeenCalledWith(`${baseUrl}/test-kits/${encodeURIComponent('T-100')}`);
        done();
      });
    });
  });

  describe('validateUnit', () => {
    it('should POST validate-unit request', (done) => {
      // Arrange
      const request = { unitId: 'U1' } as any;
      const mockResult = { data: [], total: 0 };
      httpSpy.post.and.returnValue(of(mockResult));

      // Act
      service.validateUnit(request).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResult);
        expect(httpSpy.post).toHaveBeenCalledWith(`${baseUrl}/validate-unit`, request);
        done();
      });
    });
  });

  describe('validateTest', () => {
    it('should POST validate-test request', (done) => {
      // Arrange
      const request = { testId: 'T1' } as any;
      const mockResult = { data: [], total: 0 };
      httpSpy.post.and.returnValue(of(mockResult));

      // Act
      service.validateTest(request).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResult);
        expect(httpSpy.post).toHaveBeenCalledWith(`${baseUrl}/validate-test`, request);
        done();
      });
    });
  });

  describe('createOrUpdateBatch', () => {
    it('should POST to base url', (done) => {
      // Arrange
      const request = { batchName: 'Batch1' } as any;
      const mockResult = { data: [], total: 0 };
      httpSpy.post.and.returnValue(of(mockResult));

      // Act
      service.createOrUpdateBatch(request).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResult);
        expect(httpSpy.post).toHaveBeenCalledWith(baseUrl, request);
        done();
      });
    });
  });

  describe('getPrintableTests', () => {
    it('should GET printable tests by encoded batch id', (done) => {
      // Arrange
      const mockResult = { data: [], total: 0 };
      httpSpy.get.and.returnValue(of(mockResult));

      // Act
      service.getPrintableTests('TB-001').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResult);
        expect(httpSpy.get).toHaveBeenCalledWith(`${baseUrl}/${encodeURIComponent('TB-001')}/printable-tests`);
        done();
      });
    });
  });

  describe('submitPrint', () => {
    it('should POST print-worksheets request', (done) => {
      // Arrange
      const request = { batchId: 'TB-001' } as any;
      const mockResult = { data: [true], total: 1 };
      httpSpy.post.and.returnValue(of(mockResult));

      // Act
      service.submitPrint(request).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResult as any);
        expect(httpSpy.post).toHaveBeenCalledWith(`${baseUrl}/print-worksheets`, request);
        done();
      });
    });
  });
});
