import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import {
  GoalTypeOption,
  CustodianOption,
  CollectionGoalsQueryRequest,
  CollectionGoalsSummaryResponse,
  CollectionGoalsSummaryItem,
  GoalTypesResponse,
  CustodiansResponse,
} from '../models/collection-goals-by-date-query.model';

@Injectable({
  providedIn: 'root',
})
export class CollectionGoalsByDateQueryService {
  private readonly apiService = inject(ApiService);

  getGoalTypes(): Observable<GoalTypeOption[]> {
    return this.apiService
      .get<GoalTypesResponse>(API.DONOR_FUNCTIONS.COLLECTION_GOALS_BY_DATE.GOAL_TYPES)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching goal types:', error);
          return throwError(() => error);
        })
      );
  }

  getCustodians(goalType: string, chapterId: string): Observable<CustodianOption[]> {
    return this.apiService
      .get<CustodiansResponse>(
        API.DONOR_FUNCTIONS.COLLECTION_GOALS_BY_DATE.CUSTODIANS(goalType, chapterId)
      )
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => {
          console.error('Error fetching custodians:', error);
          return throwError(() => error);
        })
      );
  }

  queryCollectionGoals(
    request: CollectionGoalsQueryRequest
  ): Observable<CollectionGoalsSummaryItem[]> {
    return this.apiService
      .post<CollectionGoalsSummaryResponse>(
        API.DONOR_FUNCTIONS.COLLECTION_GOALS_BY_DATE.SUMMARY,
        request
      )
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
          console.error('Error querying collection goals:', error);
          return throwError(() => error);
        })
      );
  }
}
