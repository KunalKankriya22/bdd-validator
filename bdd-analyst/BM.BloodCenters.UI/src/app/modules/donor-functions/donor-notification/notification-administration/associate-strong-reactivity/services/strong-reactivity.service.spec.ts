import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { StrongReactivityService } from './strong-reactivity.service';
import { ApiService } from '@shared/services/api.service';
import {
  CreateStrongReactivityDto,
  UpdateStrongReactivityDto,
  StrongReactivityModel
} from '../models/strong-reactivity.model';

describe('StrongReactivityService', () => {
  let service: StrongReactivityService;
  let httpMock: HttpTestingController;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockData: StrongReactivityModel[] = [
    {
      epitopeId1: '11',
      epitopeId2: '1',
      bound: 'S',
      effectiveDate: '2026-05-16',
      terminationDate: null
    }
  ];

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        StrongReactivityService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(StrongReactivityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getStrongReactivities', () => {
    it('should fetch strong reactivity records', (done) => {
      const mockResponse = {
        data: mockData,
        total: 1
      };

      mockApiService.post.and.returnValue(
        of(mockResponse)
      );

      service.getStrongReactivities(25, 0).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
        done();
      });

      expect(mockApiService.post).toHaveBeenCalledWith(
        'api/v1/strong-reactivity/25/0',
        {}
      );
    });


    it('should pass filters to API', (done) => {
      const filters = {
        bond: 'S',
        effDate: '2026-05-19',
        effDatePeriod: 'After'
      };

      mockApiService.post.and.returnValue(
        of({ data: [], total: 0 })
      );

      service.getStrongReactivities(25, 0, filters).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          'api/v1/strong-reactivity/25/0',
          filters
        );
        done();
      });
    });

  });

  describe('getEpitopesDropdown', () => {
    it('should fetch epitope dropdown options', (done) => {
      const mockEpitopes = [
        { epitopeId: '1', locus: 'A' },
        { epitopeId: '11', locus: 'B' }
      ];

      mockApiService.get.and.returnValue(
        of({ data: mockEpitopes })
      );

      service.getEpitopesDropdown().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].epitopeId).toBe('1');
        done();
      });

      expect(mockApiService.get).toHaveBeenCalledWith(
        'api/v1/strong-reactivity/epitopes-dropdown'
      );
    });

    it('should handle errors and return empty array', (done) => {
      mockApiService.get.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      service.getEpitopesDropdown().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getByIds', () => {
    it('should fetch single record by composite key', (done) => {
      const mockRecord = mockData[0];

      mockApiService.get.and.returnValue(
        of({ data: mockRecord })
      );

      service.getByIds('11', '1').subscribe(result => {
        expect(result.epitopeId1).toBe('11');
        expect(result.epitopeId2).toBe('1');
        done();
      });

      expect(mockApiService.get).toHaveBeenCalledWith(
        'api/v1/strong-reactivity/11/1'
      );
    });
  });

  describe('create', () => {

    it('should handle creation errors', (done) => {
      const newRecord: CreateStrongReactivityDto = {
        epitopeId1: '11',
        epitopeId2: '1',
        bound: 'S',
        effectiveDate: '2026-05-19'
      };

      mockApiService.post.and.returnValue(
        throwError(() => new Error('Duplicate entry'))
      );

      service.create(newRecord).subscribe({
        error: (error) => {
          expect(error.message).toBe('Duplicate entry');
          done();
        }
      });
    });
  });

  describe('update', () => {
    it('should update existing record', (done) => {
      const updateData: UpdateStrongReactivityDto = {
        epitopeId1: '11',
        epitopeId2: '1',
        bound: 'C',
        effectiveDate: '2026-05-19',
        terminationDate: undefined
      };

      mockApiService.put.and.returnValue(
        of({ success: true })
      );

      service.update('11', '1', updateData).subscribe(result => {
        expect(result.success).toBe(true);
        done();
      });

      expect(mockApiService.put).toHaveBeenCalledWith(
        'api/v1/strong-reactivity/11/1',
        updateData
      );
    });
  });

  describe('delete', () => {
    it('should soft delete record', (done) => {
      mockApiService.delete.and.returnValue(
        of({ success: true })
      );

      service.delete('11', '1').subscribe(result => {
        expect(result.success).toBe(true);
        done();
      });

      expect(mockApiService.delete).toHaveBeenCalledWith(
        'api/v1/strong-reactivity/11/1'
      );
    });
  });

  describe('batchUpdate', () => {
    it('should create new records', (done) => {
      const records = [
        {
          epitopeId1: '11',
          epitopeId2: '1',
          bound: 'S',
          effectiveDate: new Date('2026-05-19'),
          terminationDate: null,
          _isNew: true
        }
      ];

      mockApiService.post.and.returnValue(
        of({ success: true })
      );

      service.batchUpdate(records).subscribe(result => {
        expect(result.success).toBe(true);
        expect(mockApiService.post).toHaveBeenCalled();
        done();
      });
    });

    it('should update existing records', (done) => {
      const records = [
        {
          epitopeId1: '11',
          epitopeId2: '1',
          bound: 'C',
          effectiveDate: new Date('2026-05-19'),
          terminationDate: null,
          _isNew: false,
          _originalEpitopeId1: '11',
          _originalEpitopeId2: '1'
        }
      ];

      mockApiService.put.and.returnValue(
        of({ success: true })
      );

      service.batchUpdate(records).subscribe(result => {
        expect(result.success).toBe(true);
        expect(mockApiService.put).toHaveBeenCalled();
        done();
      });
    });

    it('should handle mixed create and update operations', (done) => {
      const records = [
        {
          epitopeId1: '11',
          epitopeId2: '1',
          bound: 'S',
          effectiveDate: new Date('2026-05-19'),
          _isNew: true
        },
        {
          epitopeId1: '63',
          epitopeId2: '77',
          bound: 'C',
          effectiveDate: new Date('2026-05-19'),
          _isNew: false,
          _originalEpitopeId1: '63',
          _originalEpitopeId2: '77'
        }
      ];

      mockApiService.post.and.returnValue(
        of({ success: true })
      );
      mockApiService.put.and.returnValue(
        of({ success: true })
      );

      service.batchUpdate(records).subscribe(result => {
        expect(result.success).toBe(true);
        expect(mockApiService.post).toHaveBeenCalled();
        expect(mockApiService.put).toHaveBeenCalled();
        done();
      });
    });

    it('should return success for empty array', (done) => {
      service.batchUpdate([]).subscribe(result => {
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should handle batch errors', (done) => {
      const records = [
        {
          epitopeId1: '11',
          epitopeId2: '1',
          bound: 'S',
          effectiveDate: new Date('2026-05-19'),
          _isNew: true
        }
      ];

      mockApiService.post.and.returnValue(
        throwError(() => new Error('Batch operation failed'))
      );

      service.batchUpdate(records).subscribe({
        error: (error) => {
          expect(error.message).toBe('Batch operation failed');
          done();
        }
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format date for API correctly', () => {
      const date = new Date('2026-05-19');
      const formatted = (service as any).formatDateForAPI(date);

      expect(formatted).toBe('2026-05-19');
    });

    it('should handle string dates', () => {
      const formatted = (service as any).formatDateForAPI('2026-05-19');

      expect(formatted).toBe('2026-05-19');
    });

  });
});
