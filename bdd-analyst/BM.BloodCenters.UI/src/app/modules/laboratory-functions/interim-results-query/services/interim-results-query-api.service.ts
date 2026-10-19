import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API } from '@core/constants/api.constants';
import { ApiService } from '@shared/services/api.service';
import {
  InterimBatchOption,
  InterimCodeOption,
  InterimContractOption,
  InterimResultsQueryRequest,
  InterimResultsQueryResponse,
  InterimTestOption
} from '../models/interim-results-query.model';

interface ApiListResponse<T> {
  success: boolean;
  data?: T[];
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class InterimResultsQueryApiService {
  private readonly apiService = inject(ApiService);

  getContracts(searchText?: string): Observable<InterimContractOption[]> {
    let endpoint = API.LABORATORY.INTERIM_RESULTS_CONTRACTS;
    if (searchText) {
      endpoint += `?searchText=${encodeURIComponent(searchText)}`;
    }
    return this.apiService.get<ApiListResponse<InterimContractOption>>(endpoint).pipe(
      map(response => response.data || [])
    );
  }

  getTestsForContract(contractId: string): Observable<InterimTestOption[]> {
    const endpoint = API.LABORATORY.INTERIM_RESULTS_TESTS(contractId);
    return this.apiService.get<ApiListResponse<InterimTestOption>>(endpoint).pipe(
      map(response => response.data || [])
    );
  }

  getInterimCodes(): Observable<InterimCodeOption[]> {
    const endpoint = API.LABORATORY.INTERIM_RESULTS_CODES;
    return this.apiService.get<ApiListResponse<InterimCodeOption>>(endpoint).pipe(
      map(response => response.data || [])
    );
  }

  getBatchesForContract(contractId: string, testId?: string | null, interimCode?: string | null): Observable<InterimBatchOption[]> {
    const endpoint = API.LABORATORY.INTERIM_RESULTS_BATCHES;
    const body: Record<string, string> = { contractId };
    if (testId) body['testId'] = testId;
    if (interimCode) body['interimCode'] = interimCode;
    return this.apiService.post<ApiListResponse<InterimBatchOption>>(endpoint, body).pipe(
      map(response => response.data || [])
    );
  }

  queryResults(request: InterimResultsQueryRequest): Observable<InterimResultsQueryResponse> {
    const endpoint = API.LABORATORY.INTERIM_RESULTS_QUERY;
    return this.apiService.post<InterimResultsQueryResponse>(endpoint, request);
  }
}
