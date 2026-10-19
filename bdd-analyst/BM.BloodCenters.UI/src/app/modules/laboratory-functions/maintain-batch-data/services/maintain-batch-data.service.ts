import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../../../shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import {
  MaintainBatchDataLovDto,
  MaintainBatchDataResponseDto,
  MaintainBatchDataUpdateRequestDto,
  MaintainBatchDataApiResponse,
} from '../models/maintain-batch-data.model';

@Injectable({ providedIn: 'root' })
export class MaintainBatchDataService {
  private readonly apiService = inject(ApiService);

  getBatchLov(): Observable<MaintainBatchDataLovDto[]> {
    return this.apiService
      .get<MaintainBatchDataApiResponse<MaintainBatchDataLovDto>>(
        API.LABORATORY_FUNCTIONS.MAINTAIN_BATCH_DATA.LOV
      )
      .pipe(
        map((response) => response.data || []),
        catchError((error) => throwError(() => error))
      );
  }

  getBatchById(
    batchId: string
  ): Observable<MaintainBatchDataResponseDto | null> {
    return this.apiService
      .get<MaintainBatchDataApiResponse<MaintainBatchDataResponseDto>>(
        API.LABORATORY_FUNCTIONS.MAINTAIN_BATCH_DATA.GET_BY_ID(batchId)
      )
      .pipe(
        map((response) => response.item ?? null),
        catchError((error) => throwError(() => error))
      );
  }

  updateBatch(
    dto: MaintainBatchDataUpdateRequestDto
  ): Observable<{ success: boolean; message: string; item: boolean }> {
    return this.apiService
      .put<{ success: boolean; message: string; item: boolean }>(
        API.LABORATORY_FUNCTIONS.MAINTAIN_BATCH_DATA.UPDATE,
        dto
      )
      .pipe(catchError((error) => throwError(() => error)));
  }
}
