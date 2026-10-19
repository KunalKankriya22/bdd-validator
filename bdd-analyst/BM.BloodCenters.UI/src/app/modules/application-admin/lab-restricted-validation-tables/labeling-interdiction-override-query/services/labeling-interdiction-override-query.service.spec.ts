import { TestBed } from '@angular/core/testing';
import { LabelingInterdictionOverrideQueryService } from './labeling-interdiction-override-query.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import {
  LabelingInterdictionOverrideQueryModel,
  LabelingInterdictionOverrideQueryParamsDto,
  LabelingInterdictionOverrideFilterLov
} from '../models/labeling-interdiction-override-query.model';

describe('LabelingInterdictionOverrideQueryService', () => {
  let service: LabelingInterdictionOverrideQueryService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockQueryData: LabelingInterdictionOverrideQueryModel[] = [
    {
      donorDecisionCode: 'DDC001',
      productType: 'PT001',
      interCode: 'IC001',
      interDesc: 'Inter Description 1',
      interType: 'TypeA',
      overrideDesc: 'Override Desc 1',
      effDate: new Date('2025-01-01'),
      termDate: null
    },
    {
      donorDecisionCode: 'DDC002',
      productType: 'PT002',
      interCode: 'IC002',
      interDesc: 'Inter Description 2',
      interType: 'TypeB',
      overrideDesc: 'Override Desc 2',
      effDate: new Date('2025-02-01'),
      termDate: new Date('2025-12-31')
    }
  ];

  const mockResponse = {
    success: true,
    data: mockQueryData,
    total: 2
  };

  const mockFilterLov: LabelingInterdictionOverrideFilterLov = {
    donorDecisionCodes: [
      { code: 'DDC001', description: 'Decision 001' },
      { code: 'DDC002', description: 'Decision 002' }
    ],
    productTypes: [
      { code: 'TypeA', description: 'Type A' },
      { code: 'TypeB', description: 'Type B' }
    ],
    interTypes: [
      { code: 'I', description: 'Initial' },
      { code: 'H', description: 'Hold' },
      { code: 'B', description: 'Bio' }
    ]
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        LabelingInterdictionOverrideQueryService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(LabelingInterdictionOverrideQueryService);
  });

  describe('getLabelingInterdictionOverrideQuery', () => {





    it('should work with different take and skip values', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));
      const params: LabelingInterdictionOverrideQueryParamsDto = {};

      service.getLabelingInterdictionOverrideQuery(50, 100, params).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/labelling-interdiction-override-query\/50\/100/),
          params
        );
        done();
      });
    });


    it('should propagate error on failure', (done) => {
      const error = new Error('API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.getLabelingInterdictionOverrideQuery(10, 0, {}).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('getLabelingInterdictionOverrideQueryFilters', () => {

    it('should return filter LOV data', (done) => {
      const response = { item: mockFilterLov };
      mockApiService.get.and.returnValue(of(response));

      service.getLabelingInterdictionOverrideQueryFilters().subscribe(result => {
        expect(result).toEqual(mockFilterLov);
        done();
      });
    });


    it('should propagate error on failure', (done) => {
      const error = new Error('Filter API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getLabelingInterdictionOverrideQueryFilters().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('API Endpoint Construction', () => {
    it('should construct correct endpoint with take and skip', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getLabelingInterdictionOverrideQuery(10, 5, {}).subscribe(() => {
        const calledEndpoint = mockApiService.post.calls.mostRecent().args[0];
        expect(calledEndpoint).toContain('10');
        expect(calledEndpoint).toContain('5');
        done();
      });
    });

    it('should use POST for getLabelingInterdictionOverrideQuery', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getLabelingInterdictionOverrideQuery(10, 0, {}).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalled();
        expect(mockApiService.get).not.toHaveBeenCalled();
        done();
      });
    });

    it('should use GET for getLabelingInterdictionOverrideQueryFilters', (done) => {
      mockApiService.get.and.returnValue(of({ item: mockFilterLov }));

      service.getLabelingInterdictionOverrideQueryFilters().subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalled();
        expect(mockApiService.post).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network error for query', (done) => {
      const networkError = { status: 0, message: 'Network Error' };
      mockApiService.post.and.returnValue(throwError(() => networkError));

      service.getLabelingInterdictionOverrideQuery(10, 0, {}).subscribe({
        error: (err) => {
          expect(err.status).toBe(0);
          done();
        }
      });
    });

    it('should handle 500 server error for filters', (done) => {
      const serverError = { status: 500, message: 'Internal Server Error' };
      mockApiService.get.and.returnValue(throwError(() => serverError));

      service.getLabelingInterdictionOverrideQueryFilters().subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });
    });
  });
});
