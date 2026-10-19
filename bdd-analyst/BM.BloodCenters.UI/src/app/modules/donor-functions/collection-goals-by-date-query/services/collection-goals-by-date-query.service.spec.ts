import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CollectionGoalsByDateQueryService } from './collection-goals-by-date-query.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';

describe('CollectionGoalsByDateQueryService', () => {
  let service: CollectionGoalsByDateQueryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        CollectionGoalsByDateQueryService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(CollectionGoalsByDateQueryService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getGoalTypes', () => {
    it('should return goal types from response data', (done) => {
      const mockResponse = {
        data: [{ code: 'WB', description: 'Whole Blood' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getGoalTypes().subscribe(result => {
        expect(result.length).toBe(1);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.COLLECTION_GOALS_BY_DATE.GOAL_TYPES
        );
        done();
      });
    });
  });

  describe('getCustodians', () => {
    it('should return custodians for a goal type and chapter', (done) => {
      const mockResponse = {
        data: [{ custodianId: 'CUST01', name: 'Main Site' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getCustodians('WB', 'CH01').subscribe(result => {
        expect(result.length).toBe(1);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.COLLECTION_GOALS_BY_DATE.CUSTODIANS('WB', 'CH01')
        );
        done();
      });
    });
  });

  describe('queryCollectionGoals', () => {
    it('should return summary items from post response', (done) => {
      const request = { goalType: 'WB', fromDate: '2025-01-01', toDate: '2025-01-31' } as any;
      const mockResponse = {
        data: [{ date: '2025-01-01', goal: 50, actual: 45 }]
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.queryCollectionGoals(request).subscribe(result => {
        expect(result.length).toBe(1);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.COLLECTION_GOALS_BY_DATE.SUMMARY,
          request
        );
        done();
      });
    });
  });
});
