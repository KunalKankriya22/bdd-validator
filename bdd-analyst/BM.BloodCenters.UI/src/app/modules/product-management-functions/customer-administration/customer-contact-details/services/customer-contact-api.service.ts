import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { LoggingService } from '@shared/services/logging.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  CustomerContactDto,
  ContactTypeDto,
  CreateCustomerContactRequestDto,
  UpdateCustomerContactRequestDto,
  ReturnResult
} from '../models/customer-contact.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerContactApiService {
  private readonly apiService = inject(ApiService);
  private readonly loggingService = inject(LoggingService);

  getCustomerContacts(customerId: string, includeTerminated = false): Observable<{ data: CustomerContactDto[]; total: number }> {
    return this.apiService
      .get<ReturnResult<CustomerContactDto>>(API.CUSTOMER_CONTACT.LIST(customerId, includeTerminated))
      .pipe(
        map(response => ({
          data: response.data || [],
          total: response.total || 0
        })),
        catchError(error => {
          this.loggingService.error('Error loading customer contacts', error);
          return throwError(() => error);
        })
      );
  }

  getContactTypes(): Observable<ContactTypeDto[]> {
    return this.apiService
      .get<{ data: ContactTypeDto[] }>(API.CUSTOMER_PROFILE.CONTACT_TYPES)
      .pipe(
        map(response => response.data),
        catchError(error => {
          this.loggingService.error('Error loading contact types', error);
          return throwError(() => error);
        })
      );
  }

  createCustomerContact(dto: CreateCustomerContactRequestDto): Observable<ReturnResult<void>> {
    return this.apiService
      .post<ReturnResult<void>>(API.CUSTOMER_CONTACT.CREATE, dto)
      .pipe(
        catchError(error => {
          this.loggingService.error('Error creating customer contact', error);
          return throwError(() => error);
        })
      );
  }

  updateCustomerContact(
    customerId: string,
    contactType: string,
    dto: UpdateCustomerContactRequestDto
  ): Observable<ReturnResult<void>> {
    return this.apiService
      .put<ReturnResult<void>>(API.CUSTOMER_CONTACT.UPDATE(customerId, contactType), dto)
      .pipe(
        catchError(error => {
          this.loggingService.error('Error updating customer contact', error);
          return throwError(() => error);
        })
      );
  }
}
