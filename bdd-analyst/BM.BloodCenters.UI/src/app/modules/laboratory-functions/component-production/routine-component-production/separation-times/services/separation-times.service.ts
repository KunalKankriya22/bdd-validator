import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  CentrifugeDto,
  RecordSeparationRequestDto,
  RecordSeparationResponseDto,
  ApiResponse
} from '../models/separation-times.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class SeparationTimesService {
  private readonly apiService = inject(ApiService);

  getCentrifuges(): Observable<CentrifugeDto[]> {
    return this.apiService.get<ApiResponse<CentrifugeDto>>(API.ROUTINE_SEPARATION_TIMES.CENTRIFUGES).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  recordSeparation(request: RecordSeparationRequestDto): Observable<RecordSeparationResponseDto> {
    return this.apiService.post<ApiResponse<RecordSeparationResponseDto>>(
      API.ROUTINE_SEPARATION_TIMES.RECORD_SEPARATION,
      request
    ).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          return response.data[0];
        }
        throw new Error('No data returned from separation API');
      }),
      catchError(error => throwError(() => error))
    );
  }
}
