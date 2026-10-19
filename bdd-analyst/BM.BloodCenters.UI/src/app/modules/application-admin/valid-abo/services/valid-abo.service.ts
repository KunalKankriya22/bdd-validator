import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ValidAboModel,
  ValidAboParamsDto,
  ValidAboCreateDto,
  ValidAboUpdateDto,
  ValidAboLookupsResponse
} from '../models/valid-abo.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  Success?: boolean;
  Message?: string;
  Error?: string;
  StatusCode?: number;
  Data?: T[];
  Item?: T;
  Total?: number;
}

/**
 * Service for managing Valid ABO data
 * Handles CRUD operations and filter/search functionality
 */
@Injectable({
  providedIn: 'root'
})
export class ValidAboService {
  private readonly apiService = inject(ApiService);

  /**
   * Fetches Valid ABO table data with pagination, search, and filters
   * @param take Number of records to fetch
   * @param skip Number of records to skip (for pagination)
   * @param params Search, filter, and sort parameters
   * @returns Observable with data array and total record count
   */
  getValidAbo(
    take: number,
    skip: number,
    params: ValidAboParamsDto
  ): Observable<{ data: ValidAboModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.VALID_ABO(take, skip);

    return this.apiService.post<ReturnResult<any>>(endpoint, params).pipe(
      map(response => {
        const data = (response.Data || []).map((item: any) => this.transformToCamelCase(item));
        return {
          data,
          totalRecords: response.Total || 0
        };
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Fetches a single Valid ABO record by code
   * @param code The ABO code to fetch
   * @returns Observable with the Valid ABO record
   */
  /**
   * Transforms backend PascalCase response to frontend camelCase
   */
  private transformToCamelCase(item: any): ValidAboModel {
    return {
      code: item.Code,
      description: item.Description,
      intendedUse: item.IntendedUse,
      unitScheme: item.UnitScheme,
      transfusionStatus: item.TransfusionStatus,
      mnemonic1: item.Mnemonic1,
      mnemonic2: item.Mnemonic2,
      group: item.Group != null ? String(item.Group) : '',
      sequence: item.Sequence,
      aboGroupOnly: item.AboGroupOnly,
      effectiveDate: item.EffectiveDate,
      terminationDate: item.TerminationDate
    };
  }

  getValidAboByCode(code: string): Observable<ValidAboModel> {
    const endpoint = API.APPLICATION_ADMIN.VALID_ABO_BY_CODE(code);

    return this.apiService.get<ReturnResult<any>>(endpoint).pipe(
      map(response => {
        const item = response.Item || response.Data?.[0];
        return item ? this.transformToCamelCase(item) : ({} as ValidAboModel);
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Fetches filter dropdown options for Valid ABO
   * @returns Observable with filter LOV data
   */
  getValidAboFilters(): Observable<ReturnResult<any>> {
    return this.apiService.get<ReturnResult<any>>(
      API.APPLICATION_ADMIN.VALID_ABO_FILTERS
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Fetches lookup dropdown options for Valid ABO add/edit form
   * @returns Observable with lookup data (code and description)
   */
  getValidAboLookups(): Observable<ValidAboLookupsResponse> {
    return this.apiService.get<ValidAboLookupsResponse>(
      API.APPLICATION_ADMIN.VALID_ABO_LOOKUPS
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Creates a new Valid ABO record
   * @param payload The Valid ABO data to create
   * @returns Observable with creation result
   */
  createValidAbo(payload: ValidAboCreateDto): Observable<any> {
    // Ensure dates are strings before sending
    const cleanPayload = {
      ...payload,
      effectiveDate: typeof payload.effectiveDate === 'string' ? payload.effectiveDate : '',
      terminationDate: payload.terminationDate && typeof payload.terminationDate === 'string' ? payload.terminationDate : undefined
    };

    return this.apiService.post(
      API.APPLICATION_ADMIN.VALID_ABO_CREATE,
      cleanPayload
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Updates an existing Valid ABO record
   * @param _code The code of the record to update (not used - code is in payload)
   * @param payload The updated Valid ABO data
   * @returns Observable with update result
   */
  updateValidAbo(_code: string, payload: ValidAboUpdateDto): Observable<any> {
    return this.apiService.put(
      API.APPLICATION_ADMIN.VALID_ABO_UPDATE,
      payload
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Deletes a Valid ABO record
   * @param code The code of the record to delete
   * @returns Observable with deletion result
   */
  deleteValidAbo(code: string): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.VALID_ABO_DELETE(code);

    return this.apiService.delete(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }
}
