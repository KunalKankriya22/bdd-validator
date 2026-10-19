import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ReturnResult,
  DeferralWithDonorDto,
  DetachDeferralRequest
} from '../models/detach-donor-from-deferral.model';

@Injectable({ providedIn: 'root' })
export class DetachDonorFromDeferralService {
  private readonly apiService = inject(ApiService);

  getDeferralDetails(deferralId: string): Observable<ReturnResult<DeferralWithDonorDto>> {
    return this.apiService.get<ReturnResult<DeferralWithDonorDto>>(
      API.DETACH_DONOR_FROM_DEFERRAL.GET_DEFERRAL(deferralId)
    ).pipe(
      map(response => ({
        ...response,
        data: Array.isArray(response.data)
          ? response.data.map(item => this.keysPascalToCamel<DeferralWithDonorDto>(item))
          : [],
        item: this.keysPascalToCamel<DeferralWithDonorDto>(response.item)
      })),
      catchError(error => throwError(() => error))
    );
  }

  executeDeferralDetach(request: DetachDeferralRequest): Observable<ReturnResult<object>> {
    return this.apiService.post<ReturnResult<object>>(
      API.DETACH_DONOR_FROM_DEFERRAL.EXECUTE,
      request
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  private keysPascalToCamel<T>(obj: unknown): T {
    if (!obj || typeof obj !== 'object') return obj as T;
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      (acc as Record<string, unknown>)[camelKey] = value;
      return acc;
    }, {} as T);
  }
}
