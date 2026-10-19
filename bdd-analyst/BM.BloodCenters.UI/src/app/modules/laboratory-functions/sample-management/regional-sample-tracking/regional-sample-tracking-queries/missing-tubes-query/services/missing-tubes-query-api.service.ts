import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  ContractOption,
  BatchOption,
  MissingReasonCode,
  MissingTubesQueryResponse,
} from '../models/missing-tubes-query.model';

@Injectable({ providedIn: 'root' })
export class MissingTubesQueryApiService {
  private readonly http = inject(HttpClient);

  getContracts(): Observable<ReturnResult<ContractOption[]>> {
    return this.http.get<ReturnResult<ContractOption[]>>(
      API.MISSING_TUBES_QUERY.CONTRACTS,
    );
  }

  getBatches(contractId: string): Observable<ReturnResult<BatchOption[]>> {
    return this.http.get<ReturnResult<BatchOption[]>>(
      API.MISSING_TUBES_QUERY.BATCHES(contractId),
    );
  }

  getMissingReasons(): Observable<ReturnResult<MissingReasonCode[]>> {
    return this.http.get<ReturnResult<MissingReasonCode[]>>(
      API.MISSING_TUBES_QUERY.MISSING_REASONS,
    );
  }

  query(
    contractId: string,
    batchId: string,
    take = 100,
    skip = 0,
    sortColumn = 'UnitId',
    sortOrder = 'ASC',
  ): Observable<ReturnResult<MissingTubesQueryResponse>> {
    const params = new HttpParams()
      .set('contractId', contractId)
      .set('batchId', batchId)
      .set('take', take)
      .set('skip', skip)
      .set('sortColumn', sortColumn)
      .set('sortOrder', sortOrder);

    return this.http.get<ReturnResult<MissingTubesQueryResponse>>(
      API.MISSING_TUBES_QUERY.QUERY,
      { params },
    );
  }
}
