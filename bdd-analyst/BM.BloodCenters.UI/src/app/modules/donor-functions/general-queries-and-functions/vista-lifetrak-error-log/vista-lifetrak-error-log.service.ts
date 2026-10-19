import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import { VistaLifeTrakErrorLogDto, VistaLifeTrakErrorLogQueryDto, VistaLifeTrakErrorLogResponse } from './vista-lifetrak-error-log.model';

@Injectable({
  providedIn: 'root',
})
export class VistaLifeTrakErrorLogService {
  private readonly apiService = inject(ApiService);

  getErrorLogs(
    take: number,
    skip: number,
    query: VistaLifeTrakErrorLogQueryDto
  ): Observable<VistaLifeTrakErrorLogResponse> {
    return this.apiService
      .post<{ success: boolean; statusCode: number; message: string; data: VistaLifeTrakErrorLogDto[]; total: number }>(
        API.VISTA_LIFETRAK_ERROR_LOG.LIST(take, skip),
        query,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
      )
      .pipe(
        map((res) => ({
          data: res.data ?? [],
          total: res.total ?? 0,
        }))
      );
  }
}
