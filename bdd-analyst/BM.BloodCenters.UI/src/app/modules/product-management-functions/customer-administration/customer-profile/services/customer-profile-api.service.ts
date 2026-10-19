import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  CustomerProfileDto,
  CreateCustomerProfileRequestDto,
  UpdateCustomerProfileRequestDto,
  CustomerProfileQueryDto,
  CustomerTypeDto,
  StateCodeDto,
  PayeeDto,
  PlasmaFileTypeDto,
  ApiResponse
} from '../models/customer-profile.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerProfileApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getCustomerProfiles(
    take: number,
    skip: number,
    query?: CustomerProfileQueryDto
  ): Observable<ApiResponse<CustomerProfileDto[]>> {
    return this.http.post<ApiResponse<CustomerProfileDto[]>>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.LIST(take, skip)}`,
      query ?? {}
    );
  }

  getCustomerProfileById(customerId: string): Observable<CustomerProfileDto> {
    return this.http.get<ApiResponse<CustomerProfileDto[] | CustomerProfileDto>>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.GET_BY_ID(customerId)}`
    ).pipe(
      map(response => Array.isArray(response.data) ? response.data[0] : response.data)
    );
  }

  createCustomerProfile(data: CreateCustomerProfileRequestDto): Observable<CustomerProfileDto> {
    return this.http.post<ApiResponse<CustomerProfileDto>>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.CREATE}`,
      data
    ).pipe(
      map(response => response.data)
    );
  }

  updateCustomerProfile(
    customerId: string,
    data: UpdateCustomerProfileRequestDto
  ): Observable<CustomerProfileDto> {
    return this.http.put<ApiResponse<CustomerProfileDto>>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.UPDATE(customerId)}`,
      data
    ).pipe(
      map(response => response.data)
    );
  }

  generateCustomerId(customerType: string): Observable<{ customerId: string }> {
    return this.http.get<{ CustomerId: string }>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.GENERATE_ID(customerType)}`
    ).pipe(
      map(response => ({ customerId: response.CustomerId }))
    );
  }

  getCustomerTypes(): Observable<CustomerTypeDto[]> {
    return this.http.get<CustomerTypeDto[]>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.CUSTOMER_TYPES}`
    );
  }

  getStateCodes(): Observable<StateCodeDto[]> {
    return this.http.get<StateCodeDto[]>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.STATES}`
    );
  }

  getPayees(): Observable<PayeeDto[]> {
    return this.http.get<PayeeDto[]>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.PAYEES}`
    );
  }

  getPlasmaFileTypes(): Observable<PlasmaFileTypeDto[]> {
    return this.http.get<PlasmaFileTypeDto[]>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.PLASMA_TYPES}`
    );
  }
}
