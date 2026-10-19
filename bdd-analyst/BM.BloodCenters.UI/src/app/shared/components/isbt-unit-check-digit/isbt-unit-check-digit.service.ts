import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  CalculateISBTCheckDigitRequest,
  ISBTCheckDigitResponse
} from './isbt-unit-check-digit.model';

@Injectable({
  providedIn: 'root'
})
export class ISBTUnitCheckDigitService {
  private readonly apiService = inject(ApiService);

  calculateCheckDigit(request: CalculateISBTCheckDigitRequest): Observable<ISBTCheckDigitResponse> {
    return this.apiService.post<ISBTCheckDigitResponse>(
      API.ISBT_CHECK_DIGIT.CALCULATE,
      request
    );
  }
}
