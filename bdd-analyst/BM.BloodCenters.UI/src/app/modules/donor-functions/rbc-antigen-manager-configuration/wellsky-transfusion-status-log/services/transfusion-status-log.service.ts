import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  TransfusionStatusLogSearchDto,
  TransfusionJobDto,
  TransfusionUnitDto,
  TransfusionErrorUnitDto,
} from '../models/transfusion-status-log.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T[];
  total: number;
  item?: T;
  errorResponse: { errorCode: string; error: string };
}

@Injectable({ providedIn: 'root' })
export class TransfusionStatusLogService {
  private readonly api = inject(ApiService);

  searchJobs(take: number, skip: number, params: TransfusionStatusLogSearchDto): Observable<ApiResponse<TransfusionJobDto>> {
    return this.api.post<ApiResponse<TransfusionJobDto>>(
      API.APPLICATION_ADMIN.TRANSFUSION_STATUS_LOG_SEARCH(take, skip),
      params,
    );
  }

  getCount(params: TransfusionStatusLogSearchDto): Observable<ApiResponse<never>> {
    return this.api.post<ApiResponse<never>>(API.APPLICATION_ADMIN.TRANSFUSION_STATUS_LOG_COUNT, params);
  }

  getOkUnits(jobId: number): Observable<ApiResponse<TransfusionUnitDto>> {
    return this.api.get<ApiResponse<TransfusionUnitDto>>(
      API.APPLICATION_ADMIN.TRANSFUSION_STATUS_LOG_OK_UNITS(jobId),
    );
  }

  getErrorUnits(jobId: number): Observable<ApiResponse<TransfusionErrorUnitDto>> {
    return this.api.get<ApiResponse<TransfusionErrorUnitDto>>(
      API.APPLICATION_ADMIN.TRANSFUSION_STATUS_LOG_ERROR_UNITS(jobId),
    );
  }
}
