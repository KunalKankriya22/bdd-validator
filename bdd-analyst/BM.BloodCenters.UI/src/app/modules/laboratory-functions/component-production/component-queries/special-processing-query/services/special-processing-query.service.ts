import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  SpecialProcessingQueryResultDto,
  SpecialProcessingQueryRequestDto,
} from '../models/special-processing-query.model';

@Injectable({ providedIn: 'root' })
export class SpecialProcessingQueryService {
  private readonly apiService = inject(ApiService);

  /**
   * Search special processing data by unit ID
   * @param unitId - The unit ID to query
   * @returns Observable of special processing query results
   */
  search(unitId: string): Observable<ReturnResult<SpecialProcessingQueryResultDto>> {
    const request: SpecialProcessingQueryRequestDto = { unitId };
    return this.apiService.post<ReturnResult<SpecialProcessingQueryResultDto>>(
      API.SPECIAL_PROCESSING_QUERY.SEARCH,
      request
    );
  }
}
