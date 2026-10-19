import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  CustomerProfileDto,
  CreateCustomerProfileRequestDto,
  UpdateCustomerProfileRequestDto,
  CustomerTypeDto,
  StateCodeDto,
  PayeeDto,
  PlasmaFileTypeDto,
  ApiResponse
} from '../models/customer-profile.model';

@Injectable({
  providedIn: 'root'
})
export class AddCustomerWizardApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // Customer Profile CRUD
  createCustomerProfile(data: CreateCustomerProfileRequestDto): Observable<CustomerProfileDto> {
    return this.http.post<ApiResponse<CustomerProfileDto[] | CustomerProfileDto>>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.CREATE}`,
      data
    ).pipe(
      map(response => Array.isArray(response.data) ? response.data[0] : response.data)
    );
  }

  updateCustomerProfile(
    customerId: string,
    data: UpdateCustomerProfileRequestDto
  ): Observable<CustomerProfileDto> {
    return this.http.put<ApiResponse<CustomerProfileDto[] | CustomerProfileDto>>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.UPDATE(customerId)}`,
      data
    ).pipe(
      map(response => Array.isArray(response.data) ? response.data[0] : response.data)
    );
  }

  generateCustomerId(customerType: string): Observable<{ customerId: string }> {
    return this.http.get<{ CustomerId: string }>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.GENERATE_ID(customerType)}`
    ).pipe(
      map(response => ({ customerId: response.CustomerId }))
    );
  }

  // Dropdown endpoints
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

  // Consignee endpoints
  createConsignee(customerId: string, data: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.CONSIGNEES(customerId)}`,
      data
    ).pipe(
      map(response => response.data)
    );
  }

  getConsignees(customerId: string): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.CONSIGNEES(customerId)}`
    ).pipe(
      map(response => response.data)
    );
  }

  updateConsignee(customerId: string, consigneeId: string, data: any): Observable<any> {
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.CONSIGNEES(customerId)}/${encodeURIComponent(consigneeId)}`,
      data
    ).pipe(
      map(response => response.data)
    );
  }

  getZones(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.ZONES}`
    );
  }

  // Contract endpoints
  createContract(customerId: string, data: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.CONTRACTS(customerId)}`,
      data
    ).pipe(
      map(response => response.data)
    );
  }

  getContracts(customerId: string): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.CONTRACTS(customerId)}`
    ).pipe(
      map(response => response.data)
    );
  }

  updateContract(customerId: string, contractId: string, data: any): Observable<any> {
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.CONTRACTS(customerId)}/${encodeURIComponent(contractId)}`,
      data
    ).pipe(
      map(response => response.data)
    );
  }

  // Contact endpoints
  createContact(customerId: string, data: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.CONTACTS(customerId)}`,
      data
    ).pipe(
      map(response => response.data)
    );
  }

  getContacts(customerId: string): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.CONTACTS(customerId)}`
    ).pipe(
      map(response => response.data)
    );
  }

  getContactTypes(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.CONTACT_TYPES}`
    ).pipe(
      map(response => response.data)
    );
  }

}
