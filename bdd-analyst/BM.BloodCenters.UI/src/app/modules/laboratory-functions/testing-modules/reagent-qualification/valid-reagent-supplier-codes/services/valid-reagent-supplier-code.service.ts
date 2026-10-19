import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../../../../environments/environment';
import { API } from '../../../../../../core/constants/api.constants';
import {
  ValidReagentSupplierCode,
  CreateValidReagentSupplierCodeDto,
  UpdateValidReagentSupplierCodeDto,
  ValidReagentSupplierCodeQueryDto,
  ValidReagentSupplierCodeApiResponse,
  ValidReagentSupplierCodeOperationResponse
} from '../models/valid-reagent-supplier-code.model';

@Injectable({ providedIn: 'root' })
export class ValidReagentSupplierCodeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Get all valid reagent supplier codes with filtering and pagination
   */
  getAll(
    take: number,
    skip: number,
    queryDto: ValidReagentSupplierCodeQueryDto
  ): Observable<{ data: ValidReagentSupplierCode[]; totalRecords: number }> {
    const url = `${this.baseUrl}${API.VALID_REAGENT_SUPPLIER_CODES.LIST(take, skip)}`;
    return this.http
      .post<ValidReagentSupplierCodeApiResponse<ValidReagentSupplierCode>>(url, queryDto)
      .pipe(
        map((response) => ({
          data: response.data || [],
          totalRecords: response.total || 0
        })),
        catchError((error) => {
          console.error('Error fetching valid reagent supplier codes:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get a single valid reagent supplier code by supplier code
   */
  getById(supplierCode: string): Observable<ValidReagentSupplierCode | null> {
    const url = `${this.baseUrl}${API.VALID_REAGENT_SUPPLIER_CODES.GET_BY_ID(supplierCode)}`;
    return this.http
      .get<ValidReagentSupplierCodeApiResponse<ValidReagentSupplierCode>>(url)
      .pipe(
        map((response) => {
          if (response.data && response.data.length > 0) {
            return response.data[0];
          }
          return null;
        }),
        catchError((error) => {
          console.error('Error fetching valid reagent supplier code by ID:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Create a new valid reagent supplier code
   */
  create(dto: CreateValidReagentSupplierCodeDto): Observable<ValidReagentSupplierCodeOperationResponse> {
    const url = `${this.baseUrl}${API.VALID_REAGENT_SUPPLIER_CODES.CREATE}`;
    return this.http
      .post<ValidReagentSupplierCodeOperationResponse>(url, dto)
      .pipe(
        catchError((error) => {
          console.error('Error creating valid reagent supplier code:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update an existing valid reagent supplier code
   */
  update(
    supplierCode: string,
    dto: UpdateValidReagentSupplierCodeDto
  ): Observable<ValidReagentSupplierCodeOperationResponse> {
    const url = `${this.baseUrl}${API.VALID_REAGENT_SUPPLIER_CODES.UPDATE(supplierCode)}`;
    return this.http
      .put<ValidReagentSupplierCodeOperationResponse>(url, dto)
      .pipe(
        catchError((error) => {
          console.error('Error updating valid reagent supplier code:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Delete (soft delete) a valid reagent supplier code
   * Sets termination date to current chapter local date
   */
  delete(supplierCode: string): Observable<ValidReagentSupplierCodeOperationResponse> {
    const url = `${this.baseUrl}${API.VALID_REAGENT_SUPPLIER_CODES.DELETE(supplierCode)}`;
    return this.http
      .delete<ValidReagentSupplierCodeOperationResponse>(url)
      .pipe(
        catchError((error) => {
          console.error('Error deleting valid reagent supplier code:', error);
          return throwError(() => error);
        })
      );
  }
}
