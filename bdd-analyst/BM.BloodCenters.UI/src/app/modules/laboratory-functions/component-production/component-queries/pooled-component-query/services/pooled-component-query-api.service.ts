import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  PooledComponentDto,
  PooledComponentUnitDto,
  PooledComponentQueryDto,
  PooledComponentLookupDto,
} from '../models/pooled-component-query.model';

@Injectable({ providedIn: 'root' })
export class PooledComponentQueryApiService {
  private readonly apiService = inject(ApiService);

  getPoolHeader(poolId: string): Observable<ReturnResult<PooledComponentDto>> {
    return this.apiService.get<ReturnResult<PooledComponentDto>>(
      API.POOLED_COMPONENT.GET_HEADER(poolId)
    );
  }

  getPoolUnits(poolId: string): Observable<ReturnResult<PooledComponentUnitDto>> {
    return this.apiService.get<ReturnResult<PooledComponentUnitDto>>(
      API.POOLED_COMPONENT.GET_UNITS(poolId)
    );
  }

  searchPools(query: PooledComponentQueryDto, take: number, skip: number): Observable<ReturnResult<PooledComponentLookupDto>> {
    return this.apiService.post<ReturnResult<PooledComponentLookupDto>>(
      API.POOLED_COMPONENT.SEARCH(take, skip),
      query
    );
  }
}
