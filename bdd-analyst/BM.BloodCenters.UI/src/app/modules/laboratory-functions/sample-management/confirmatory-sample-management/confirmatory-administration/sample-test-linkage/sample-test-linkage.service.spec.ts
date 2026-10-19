import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import moment from 'moment';
import { SampleTestLinkageService } from './sample-test-linkage.service';

describe('SampleTestLinkageService', () => {
  let service: SampleTestLinkageService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        SampleTestLinkageService,
        { provide: HttpClient, useValue: httpSpy },
      ],
    });

    service = TestBed.inject(SampleTestLinkageService);
  });

  describe('getValidTests', () => {
    it('should return mapped test options', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        statusCode: 200,
        data: { data: [{ testId: 'T1', description: 'Test One' }] },
      };
      httpSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getValidTests().subscribe((result) => {
        // Assert
        expect(result).toEqual([{ value: 'T1', label: 'Test One' }]);
        done();
      });
    });
  });

  describe('getSampleTypes', () => {
    it('should return mapped sample types', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        statusCode: 200,
        data: { data: [{ code: 'S1', description: 'Sample One' }] },
      };
      httpSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getSampleTypes().subscribe((result) => {
        // Assert
        expect(result).toEqual([{ code: 'S1', name: 'Sample One' }]);
        done();
      });
    });
  });

  describe('getTestLinkages', () => {
    it('should return mapped test linkage rows with moment dates', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        statusCode: 200,
        data: {
          data: [
            { testId: 'T1', sampleType: 'S1', testDescription: 'Test', effDate: '2024-01-01', termDate: null },
          ],
        },
      };
      httpSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getTestLinkages('S1').subscribe((result) => {
        // Assert
        expect(result.length).toBe(1);
        expect(result[0].testId).toBe('T1');
        expect(result[0]._rowId).toBe('1');
        expect(moment.isMoment(result[0].effectiveDate)).toBe(true);
        expect(result[0].terminationDate).toBeNull();
        done();
      });
    });
  });

  describe('saveTestLinkages', () => {
    it('should post save payload and return void', (done) => {
      // Arrange
      const mockResponse = { success: true, statusCode: 200, data: null };
      httpSpy.post.and.returnValue(of(mockResponse));
      const rows = [
        {
          _rowId: '1',
          testId: 'T1',
          effectiveDate: moment('2024-01-01'),
          terminationDate: null,
        },
      ] as any[];

      // Act
      service.saveTestLinkages('S1', rows).subscribe((result) => {
        // Assert
        expect(result).toBeUndefined();
        expect(httpSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
