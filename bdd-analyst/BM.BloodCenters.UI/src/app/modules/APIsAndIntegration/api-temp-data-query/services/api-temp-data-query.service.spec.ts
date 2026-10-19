import { TestBed } from '@angular/core/testing';
import { ApiTempDataQueryService } from './api-temp-data-query.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';

describe('ApiTempDataQueryService', () => {
  let service: ApiTempDataQueryService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        ApiTempDataQueryService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(ApiTempDataQueryService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getIdTypes', () => {
    it('should fetch ID types successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          { code: 'DN', description: 'Donor Number' },
          { code: 'SSN', description: 'Social Security Number' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getIdTypes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse.data);
          expect(apiService.get).toHaveBeenCalled();
          done();
        }
      });
    });


    it('should return empty array when data is missing', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getIdTypes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });
  });

  describe('getTemporaryIds', () => {
    it('should fetch temporary IDs successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          { temporaryId: 'TEMP123' },
          { temporaryId: 'TEMP456' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getTemporaryIds().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse.data);
          expect(apiService.get).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should pass idType query param when provided', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [{ temporaryId: 'TEMP123' }]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getTemporaryIds('DNRID').subscribe({
        next: () => {
          const callArgs = apiService.get.calls.mostRecent().args;
          expect(callArgs[1]?.params?.get('idType')).toBe('DNRID');
          done();
        }
      });
    });

  });

  describe('getPermanentIds', () => {
    it('should fetch permanent IDs successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          { permanentId: 'PERM123' },
          { permanentId: 'PERM456' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getPermanentIds().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse.data);
          expect(apiService.get).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should pass idType query param when provided', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [{ permanentId: 'PERM123' }]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getPermanentIds('DNRID').subscribe({
        next: () => {
          const callArgs = apiService.get.calls.mostRecent().args;
          expect(callArgs[1]?.params?.get('idType')).toBe('DNRID');
          done();
        }
      });
    });

  });

  describe('queryApiTempData', () => {
    it('should query API temp data successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          {
            temporaryId: 'TEMP123',
            permanentId: 'PERM123',
            idType: 'DN',
            temporaryAuditKey: 12345,
            permanentAuditKey: 67890,
            sourceId: 'SFA',
            insertDate: '2025-11-23T02:15:03'
          }
        ],
        total: 1
      };

      const filters = { idType: 'DN' };
      apiService.post.and.returnValue(of(mockResponse));

      service.queryApiTempData(10, 0, filters).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockResponse.data);
          expect(result.total).toBe(1);
          expect(apiService.post).toHaveBeenCalled();
          done();
        }
      });
    });


  });

  describe('exportApiTempData', () => {
    it('should export API temp data successfully', (done) => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' });
      const filters = { idType: 'DN' };
      apiService.post.and.returnValue(of(mockBlob));

      service.exportApiTempData(filters).subscribe({
        next: (result) => {
          expect(result).toBe(mockBlob);
          expect(apiService.post).toHaveBeenCalled();
          done();
        }
      });
    });

  });

  describe('getSourceIds', () => {
    it('should fetch source IDs successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Successfully fetched source IDs',
        statusCode: 200,
        data: [
          { sourceId: 'LAP' },
          { sourceId: 'SFA' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getSourceIds().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse.data);
          expect(apiService.get).toHaveBeenCalled();
          done();
        }
      });
    });


    it('should return empty array when data is missing', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getSourceIds().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });
  });
});
