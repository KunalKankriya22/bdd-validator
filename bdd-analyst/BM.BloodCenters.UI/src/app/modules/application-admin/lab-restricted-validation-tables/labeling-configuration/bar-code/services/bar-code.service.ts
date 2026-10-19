import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  BarCodeModel,
  BarCodeListRequestDto,
  BarCodeCreateDto,
  BarCodeUpdateDto,
  ReturnResult,
  LookupItem
} from '../models/bar-code.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class BarCodeService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Bar Code table data with filters
   * POST /lbl-barcode-config/list
   * No pagination in URL - returns all filtered records.
   */
  getBarCodes(
    params: BarCodeListRequestDto
  ): Observable<{ data: BarCodeModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.BARCODE_LIST;

    return this.apiService.post<ReturnResult<BarCodeModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching bar code data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Barcode dropdown values
   * GET /lbl-barcode-config/lookups/barcodes
   * Response is a plain array: [{ code, description }]
   */
  getBarcodeLookups(): Observable<LookupItem[]> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.BARCODE_LOOKUP_BARCODES;

    return this.apiService.get<LookupItem[]>(endpoint).pipe(
      map(response => Array.isArray(response) ? response : []),
      catchError(error => {
        console.error('Error fetching barcode lookups:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Test ID dropdown values
   * GET /lbl-barcode-config/lookups/test-ids
   * Response is a plain array: [{ code, description }]
   */
  getTestIdLookups(): Observable<LookupItem[]> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.BARCODE_LOOKUP_TEST_IDS;

    return this.apiService.get<LookupItem[]>(endpoint).pipe(
      map(response => Array.isArray(response) ? response : []),
      catchError(error => {
        console.error('Error fetching test ID lookups:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new Bar Code Configuration
   * POST /lbl-barcode-config
   */
  createBarCode(data: BarCodeCreateDto): Observable<ReturnResult<BarCodeModel>> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.BARCODE_ADD;

    return this.apiService.post<ReturnResult<BarCodeModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error creating bar code configuration:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing Bar Code Configuration
   * PUT /lbl-barcode-config/{barcodeValue}/{testId}/{resultCode}
   * URL parameters use original PK values to identify the record
   * Body contains editable fields: testId, resultCode, effDate, termDate
   */
  updateBarCode(barcodeValue: string, testId: string, resultCode: string, data: BarCodeUpdateDto): Observable<ReturnResult<BarCodeModel>> {
    const endpoint = API.APPLICATION_ADMIN.LABELING_CONFIGURATION.BARCODE_UPDATE(barcodeValue, testId, resultCode);

    return this.apiService.put<ReturnResult<BarCodeModel>>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error updating bar code configuration:', error);
        return throwError(() => error);
      })
    );
  }
}
