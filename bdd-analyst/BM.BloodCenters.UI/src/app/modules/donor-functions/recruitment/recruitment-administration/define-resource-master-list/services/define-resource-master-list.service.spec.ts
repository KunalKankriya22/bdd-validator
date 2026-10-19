import { TestBed } from '@angular/core/testing';
import { DefineResourceMasterListService } from './define-resource-master-list.service';
import { ApiService } from '@shared/services/api.service';
import {
  DefineResourceMasterListModel,
  DefineResourceMasterListDto,
  UpdateDefineResourceMasterListDto,
  DefineResourceMasterListParamsDto
} from '../models/define-resource-master-list.model';
import { of, throwError } from 'rxjs';

describe('DefineResourceMasterListService', () => {
  let service: DefineResourceMasterListService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockData: DefineResourceMasterListModel[] = [
    {
      resourceCode: 'STAFF',
      resourceDesc: 'Staff Resource',
      resourceType: 'STAFF',
      sortSeq: 1,
      criticalInd: 'Y',
      effDate: '2024-01-01T00:00:00.000Z',
      termDate: null
    },
    {
      resourceCode: 'COACH',
      resourceDesc: 'Coach Resource',
      resourceType: 'COACH',
      sortSeq: 2,
      criticalInd: 'N',
      effDate: '2024-01-01T00:00:00.000Z',
      termDate: '2024-12-31T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        DefineResourceMasterListService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(DefineResourceMasterListService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getDefineResourceMasterList', () => {
    it('should fetch resource master list data successfully', (done) => {
      const take = 10;
      const skip = 0;
      const params: DefineResourceMasterListParamsDto = { searchText: 'STAFF' };
      const mockResponse = {
        success: true,
        data: mockData,
        total: 2
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getDefineResourceMasterList(take, skip, params).subscribe({
        next: (response) => {
          expect(response.data).toEqual(mockData);
          expect(response.totalRecords).toBe(2);
          expect(apiService.post).toHaveBeenCalledWith(
            '/api/v1/resource-master-list/search-sort-filter/10/0',
            params
          );
          done();
        },
        error: done.fail
      });
    });


    it('should handle error when fetching data fails', (done) => {
      const errorResponse = { status: 500, message: 'Internal Server Error' };
      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.getDefineResourceMasterList(10, 0, {}).subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });

    it('should use correct endpoint with pagination parameters', (done) => {
      apiService.post.and.returnValue(of({ data: [], total: 0 }));

      service.getDefineResourceMasterList(25, 50, {}).subscribe({
        next: () => {
          expect(apiService.post).toHaveBeenCalledWith(
            '/api/v1/resource-master-list/search-sort-filter/25/50',
            {}
          );
          done();
        }
      });
    });
  });

  describe('addResourceCode', () => {
    it('should add a new resource code successfully', (done) => {
      const payload: DefineResourceMasterListDto = {
        resourceCode: 'NEWRC',
        resourceDesc: 'New Resource',
        resourceType: 'STAFF',
        sortSeq: 10,
        criticalInd: 'Y',
        effDate: '2024-01-01T00:00:00.000Z',
        termDate: ''
      };

      const mockResponse = {
        success: true,
        message: 'Resource code added successfully'
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.addResourceCode(payload).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(apiService.post).toHaveBeenCalledWith(
            '/api/v1/resource-master-list',
            payload
          );
          done();
        },
        error: done.fail
      });
    });

    it('should handle error when adding resource code fails', (done) => {
      const payload: DefineResourceMasterListDto = {
        resourceCode: 'NEWRC',
        resourceDesc: 'New Resource',
        resourceType: 'STAFF',
        sortSeq: 10,
        criticalInd: 'Y',
        effDate: '2024-01-01T00:00:00.000Z',
        termDate: ''
      };

      const errorResponse = { status: 409, error: { message: 'Resource code already exists' } };
      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.addResourceCode(payload).subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('updateResourceCode', () => {
    it('should update an existing resource code successfully', (done) => {
      const payload: UpdateDefineResourceMasterListDto = {
        resourceCode: 'STAFF',
        resourceDesc: 'Updated Staff Resource',
        resourceType: 'STAFF',
        sortSeq: 5,
        criticalInd: 'N',
        effDate: '2024-01-01T00:00:00.000Z',
        termDate: '2024-12-31T00:00:00.000Z'
      };

      const mockResponse = {
        success: true,
        message: 'Resource code updated successfully'
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateResourceCode(payload).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(apiService.put).toHaveBeenCalledWith(
            '/api/v1/resource-master-list',
            payload
          );
          done();
        },
        error: done.fail
      });
    });

    it('should handle error when updating resource code fails', (done) => {
      const payload: UpdateDefineResourceMasterListDto = {
        resourceCode: 'STAFF',
        resourceDesc: 'Updated Staff Resource',
        resourceType: 'STAFF',
        sortSeq: 5,
        criticalInd: 'N',
        effDate: '2024-01-01T00:00:00.000Z',
        termDate: ''
      };

      const errorResponse = { status: 404, error: { message: 'Resource code not found' } };
      apiService.put.and.returnValue(throwError(() => errorResponse));

      service.updateResourceCode(payload).subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getFilterOptions', () => {
    it('should fetch filter options successfully', (done) => {
      const mockResponse = {
        success: true,
        item: {
          resourceTypes: ['STAFF', 'COACH', 'VAN'],
          criticalIndicators: ['Y', 'N']
        }
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getFilterOptions().subscribe({
        next: (response) => {
          expect(response.resourceTypes).toEqual(['STAFF', 'COACH', 'VAN']);
          expect(response.criticalIndicators).toEqual(['Y', 'N']);
          expect(apiService.get).toHaveBeenCalledWith('/api/v1/resource-master-list/filter-options');
          done();
        },
        error: done.fail
      });
    });


    it('should handle error when fetching filter options fails', (done) => {
      const errorResponse = { status: 500, message: 'Internal Server Error' };
      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getFilterOptions().subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });
});
