import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  AntigenTestModel,
  AntigenTestParamsDto,
  AntigenTestApiResponse,
  AntigenTestDto,
  UpdateAntigenTestDto,
  BulkUpsertRequestDto,
  BulkUpsertResponseDto
} from '../models/antigen-test.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class AntigenTestService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Antigen Tests table data with search filters
   * POST /api/v1/application-administration/antigen-test/details/{take}/{skip}
   * @param params - Filter and search parameters (including take and skip)
   * @returns Observable with table data and total count
   */
  getAntigenTests(
    params: AntigenTestParamsDto
  ): Observable<{ data: AntigenTestModel[]; totalRecords: number }> {
    // Extract take and skip from params for URL
    const take = params.take || 25;
    const skip = params.skip || 0;

    const endpoint = API.APPLICATION_ADMIN.ANTIGEN_TESTS_GET_DETAILS(take, skip);
    const requestBody = this.buildRequestBody(params);

    return this.apiService.post<AntigenTestApiResponse>(endpoint, requestBody).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching antigen tests data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Build request body for search API
   * Maps frontend params to backend AntigenTestDetailsParamDto structure
   */
  private buildRequestBody(params: AntigenTestParamsDto): any {
    const body: any = {};

    // Only add properties that are not null or undefined
    // Note: skip and take are now in URL, not body
    if (params.searchKeyword !== undefined && params.searchKeyword !== null) {
      body.searchKeyword = params.searchKeyword;
    }
    if (params.price !== undefined && params.price !== null) {
      body.price = params.price;
    }
    // Backend expects 'priceRange', not 'pricePeriod'
    if (params.priceRange !== undefined && params.priceRange !== null) {
      body.priceRange = params.priceRange;
    }
    if (params.effectiveDate !== undefined && params.effectiveDate !== null) {
      body.effectiveDate = params.effectiveDate;
    }
    // Backend expects 'effectiveDatePeriod', not 'effectivePeriod'
    if (params.effectiveDatePeriod !== undefined && params.effectiveDatePeriod !== null) {
      body.effectiveDatePeriod = params.effectiveDatePeriod;
    }
    if (params.terminationDate !== undefined && params.terminationDate !== null) {
      body.terminationDate = params.terminationDate;
    }
    // Backend expects 'terminationDatePeriod', not 'terminationPeriod'
    if (params.terminationDatePeriod !== undefined && params.terminationDatePeriod !== null) {
      body.terminationDatePeriod = params.terminationDatePeriod;
    }
    if (params.localChapterId !== undefined && params.localChapterId !== null) {
      body.localChapterId = params.localChapterId;
    }
    if (params.sort !== undefined && params.sort !== null) {
      body.sort = params.sort;
    }

    return body;
  }

  /**
   * Bulk upsert Antigen Tests (add new and update existing in single call)
   * POST /api/v1/application-administration/antigen-test/details/bulk-upsert
   * @param data - Bulk upsert request with array of records and optional programId
   * @returns Observable with bulk operation result
   */
  bulkUpsertAntigenTests(data: BulkUpsertRequestDto): Observable<BulkUpsertResponseDto> {
    const endpoint = API.APPLICATION_ADMIN.ANTIGEN_TESTS_BULK_UPSERT;

    // Ensure programId is set (defaults to 'VSANTGN' if not provided)
    const requestBody = {
      ...data,
      programId: data.programId || 'VSANTGN'
    };

    return this.apiService.post<BulkUpsertResponseDto>(endpoint, requestBody).pipe(
      catchError(error => {
        console.error('Error bulk upserting antigen tests:', error);
        return throwError(() => error);
      })
    );
  }

  deleteAntigenTest(antigenId: string): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.ANTIGEN_TESTS_DELETE(antigenId);
    return this.apiService.delete(endpoint).pipe(
      catchError(error => {
        console.error('Error deleting antigen test:', error);
        return throwError(() => error);
      })
    );
  }
}
