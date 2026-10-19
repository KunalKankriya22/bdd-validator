import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  CustomerContractDto,
  CustomerContractQueryDto,
  CreateCustomerContractRequestDto,
  UpdateCustomerContractRequestDto,
  ReturnResult
} from '../models/customer-contract.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerContractApiService {
  private readonly apiService = inject(ApiService);

  /**
   * TODO: Backend API Implementation Required
   * Endpoint: GET /api/v1/customer-contracts/{customerId}/{take}/{skip}
   * Description: Retrieves customer contracts with pagination
   */
  getCustomerContracts(
    customerId: string,
    take: number,
    skip: number,
    query?: CustomerContractQueryDto
  ): Observable<{ data: CustomerContractDto[]; total: number }> {
    return this.apiService
      .post<ReturnResult<CustomerContractDto>>(
        API.CUSTOMER_CONTRACT.LIST(customerId, take, skip),
        query || {}
      )
      .pipe(
        map(response => ({
          data: response.data || [],
          total: response.total || 0
        })),
        catchError(error => {
          console.error('Error loading customer contracts:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * TODO: Backend API Implementation Required
   * Endpoint: GET /api/v1/customer-contracts/{customerId}/{contractId}
   * Description: Retrieves a specific customer contract by ID
   */
  getCustomerContractById(
    customerId: string,
    contractId: string
  ): Observable<CustomerContractDto | null> {
    return this.apiService
      .get<ReturnResult<CustomerContractDto>>(
        API.CUSTOMER_CONTRACT.GET_BY_ID(customerId, contractId)
      )
      .pipe(
        map(response => response.data?.[0] || response.item || null),
        catchError(error => {
          console.error('Error loading customer contract:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * TODO: Backend API Implementation Required
   * Endpoint: POST /api/v1/customer-contracts/{customerId}
   * Description: Creates a new customer contract
   */
  createCustomerContract(
    customerId: string,
    dto: CreateCustomerContractRequestDto
  ): Observable<ReturnResult<void>> {
    return this.apiService
      .post<ReturnResult<void>>(API.CUSTOMER_CONTRACT.CREATE(customerId), dto)
      .pipe(
        catchError(error => {
          console.error('Error creating customer contract:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * TODO: Backend API Implementation Required
   * Endpoint: PUT /api/v1/customer-contracts/{customerId}/{contractId}
   * Description: Updates an existing customer contract
   */
  updateCustomerContract(
    customerId: string,
    contractId: string,
    dto: UpdateCustomerContractRequestDto
  ): Observable<ReturnResult<void>> {
    return this.apiService
      .put<ReturnResult<void>>(
        API.CUSTOMER_CONTRACT.UPDATE(customerId, contractId),
        dto
      )
      .pipe(
        catchError(error => {
          console.error('Error updating customer contract:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * TODO: Backend API Implementation Required
   * Endpoint: DELETE /api/v1/customer-contracts/{customerId}/{contractId}
   * Description: Deletes a customer contract
   */
  deleteCustomerContract(
    customerId: string,
    contractId: string
  ): Observable<ReturnResult<void>> {
    return this.apiService
      .delete<ReturnResult<void>>(
        API.CUSTOMER_CONTRACT.DELETE(customerId, contractId)
      )
      .pipe(
        catchError(error => {
          console.error('Error deleting customer contract:', error);
          return throwError(() => error);
        })
      );
  }
}
