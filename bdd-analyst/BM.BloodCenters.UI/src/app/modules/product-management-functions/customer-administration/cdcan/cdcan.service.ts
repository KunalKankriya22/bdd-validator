import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { API } from '../../../../core/constants/api.constants';
import {
  CustomerDbcrAdjustDto,
  CancelAdviceRequestDto,
  CustomerLOV,
  AdviceLOV,
  ApiResponse
} from './cdcan.model';

@Injectable({ providedIn: 'root' })
export class CdcanService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.CANCEL_DEBIT_CREDIT_ADVICE.BASE}`;

  getCustomers(): Observable<CustomerLOV[]> {
    const url = `${environment.apiUrl}${API.CUSTOMER_DEBIT_CREDIT_QUERY.CUSTOMER_LOV}`;
    return this.http.get<ApiResponse<{ customerId: string; name: string }[]>>(url).pipe(
      map(response => {
        if (!response.data) return [];
        return response.data.map(item => ({
          customerId: item.customerId,
          customerName: item.name
        }));
      })
    );
  }

  getAdvicesByCustomer(customerId: string): Observable<AdviceLOV[]> {
    const url = `${environment.apiUrl}${API.CUSTOMER_DEBIT_CREDIT_QUERY.ADVICE_ID_LOV(customerId)}`;
    return this.http.get<ApiResponse<{ adviceId: string; insertDate: string }[]>>(url).pipe(
      map(response => {
        if (!response.data) return [];
        return response.data.map(item => ({
          adviceId: item.adviceId,
          displayText: item.adviceId,
          insertDate: item.insertDate
        }));
      })
    );
  }

  getAdviceById(adviceId: string): Observable<CustomerDbcrAdjustDto | null> {
    const url = `${environment.apiUrl}${API.CANCEL_DEBIT_CREDIT_ADVICE.GET_BY_ID(adviceId)}`;
    return this.http.get<ApiResponse<CustomerDbcrAdjustDto[]>>(url).pipe(
      map(response => {
        if (!response.data || response.data.length === 0) {
          return null;
        }
        return response.data[0];
      })
    );
  }

  cancelAdvice(adviceId: string): Observable<ApiResponse<boolean>> {
    const url = `${environment.apiUrl}${API.CANCEL_DEBIT_CREDIT_ADVICE.CANCEL}`;
    const request: CancelAdviceRequestDto = {
      adviceId,
      confirmation: 'Y'
    };
    return this.http.post<ApiResponse<boolean>>(url, request);
  }
}
