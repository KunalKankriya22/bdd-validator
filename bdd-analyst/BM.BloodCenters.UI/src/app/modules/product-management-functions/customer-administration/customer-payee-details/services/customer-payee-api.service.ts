import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  PayeeCustomerDto,
  PayeeCustomerQueryDto,
  CreatePayeeCustomerRequestDto,
  UpdatePayeeCustomerRequestDto,
  ReturnResult
} from '../models/customer-payee.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerPayeeApiService {
  private readonly apiService = inject(ApiService);

  getPayeeCustomers(
    take: number,
    skip: number,
    query?: PayeeCustomerQueryDto
  ): Observable<{ data: PayeeCustomerDto[]; total: number }> {
    return this.apiService
      .post<ReturnResult<PayeeCustomerDto>>(
        API.PAYEE_CUSTOMER.LIST(take, skip),
        query || {}
      )
      .pipe(
        map(response => ({
          data: response.data || [],
          total: response.total || 0
        })),
        catchError(error => throwError(() => error))
      );
  }

  getPayeeById(id: string): Observable<PayeeCustomerDto | null> {
    return this.apiService
      .get<ReturnResult<PayeeCustomerDto>>(
        API.PAYEE_CUSTOMER.GET_BY_ID(id)
      )
      .pipe(
        map(response => response.data?.[0] || response.item || null),
        catchError(error => throwError(() => error))
      );
  }

  createPayee(dto: CreatePayeeCustomerRequestDto): Observable<ReturnResult<any>> {
    return this.apiService
      .post<ReturnResult<any>>(API.PAYEE_CUSTOMER.CREATE, dto)
      .pipe(
        catchError(error => throwError(() => error))
      );
  }

  updatePayee(id: string, dto: UpdatePayeeCustomerRequestDto): Observable<ReturnResult<any>> {
    return this.apiService
      .put<ReturnResult<any>>(
        API.PAYEE_CUSTOMER.UPDATE(id),
        dto
      )
      .pipe(
        catchError(error => throwError(() => error))
      );
  }

  getStateCodes(): Observable<{ code: string; description: string }[]> {
    return this.apiService
      .get<{ code: string; description: string }[]>(API.CUSTOMER_PROFILE.STATES)
      .pipe(
        catchError(error => {
          console.error('Error loading states:', error);
          return throwError(() => error);
        })
      );
  }

  getZones(): Observable<{ code: string; description: string }[]> {
    return this.apiService
      .get<{ code: string; description: string }[]>(API.CUSTOMER_PROFILE.ZONES)
      .pipe(
        catchError(error => {
          console.error('Error loading zones:', error);
          return throwError(() => error);
        })
      );
  }

}
