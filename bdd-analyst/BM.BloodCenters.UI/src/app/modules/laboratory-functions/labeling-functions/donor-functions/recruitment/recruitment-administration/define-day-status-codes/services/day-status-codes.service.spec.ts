import { TestBed } from '@angular/core/testing';
import { DayStatusCodesService } from './day-status-codes.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';

describe('DayStatusCodesService', () => {
  let service: DayStatusCodesService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        DayStatusCodesService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(DayStatusCodesService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getDayStatusCodes', () => {
    it('should fetch day status codes successfully', (done) => {
      const mockResponse = {
        data: [
          {
            status: 'AC',
            description: 'Active',
            resourceCode: 'RES01',
            lower: 0,
            upper: 10,
            effectiveDate: new Date(2024, 0, 1),
            terminationDate: null
          }
        ],
        total: 1
      };

      const params = { searchKeyword: 'Active' };
      apiService.post.and.returnValue(of(mockResponse));

      service.getDayStatusCodes(10, 0, params).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockResponse.data);
          expect(result.total).toBe(1);
          expect(apiService.post).toHaveBeenCalled();
          done();
        }
      });
    });


  });

  describe('getDayStatusFilters', () => {
    it('should fetch day status filters successfully', (done) => {
      const mockResponse = {
        resourceCodes: ['RES01'],
        statusCodes: ['AC']
      };

      const expectedResult = {
        resourceCodes: [{ resourceCode: 'RES01' }],
        statusCodes: [{ status: 'AC' }]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getDayStatusFilters().subscribe({
        next: (result) => {
          expect(result).toEqual(expectedResult);
          expect(apiService.get).toHaveBeenCalled();
          done();
        }
      });
    });


    it('should return empty arrays when data is missing', (done) => {
      const mockResponse = null;
      apiService.get.and.returnValue(of(mockResponse));

      service.getDayStatusFilters().subscribe({
        next: (result) => {
          expect(result).toEqual({ resourceCodes: [], statusCodes: [] });
          done();
        }
      });
    });
  });


  describe('addDayStatusCode', () => {
    it('should add day status code successfully', (done) => {
      const mockData = {
        status: 'AC',
        description: 'Active Status',
        resourceCode: 'RES01',
        lower: 0,
        upper: 10,
        effectiveDate: '2024-01-01',
        terminationDate: null,
        chapterId: 'CH001'
      };

      const mockResponse = { success: true };
      apiService.post.and.returnValue(of(mockResponse));

      service.addDayStatusCode(mockData).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiService.post).toHaveBeenCalled();
          done();
        }
      });
    });

  });

  describe('updateDayStatusCode', () => {
    it('should update day status code successfully', (done) => {
      const mockData = {
        resourceCode: 'RES01',
        status: 'AC',
        description: 'Active Status',
        lower: 5,
        upper: 15,
        effectiveDate: '2024-01-01',
        terminationDate: '2024-12-31',
        chapterId: 'CH001'
      };

      const mockResponse = { success: true };
      apiService.put.and.returnValue(of(mockResponse));

      service.updateDayStatusCode(mockData).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiService.put).toHaveBeenCalled();
          done();
        }
      });
    });

  });
});
