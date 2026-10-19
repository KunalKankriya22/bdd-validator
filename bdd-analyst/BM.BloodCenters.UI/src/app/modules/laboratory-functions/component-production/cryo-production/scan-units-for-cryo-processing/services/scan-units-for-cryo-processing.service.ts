import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SKIP_ERROR_TOAST } from '../../../../../../core/constants/http-context.constants';

import {
  CryoWorksheetDto,
  CryoUnitDto,
  CryoComponentDto,
  AddCryoUnitRequestDto,
  ReturnResult,
} from '../models/scan-units-for-cryo-processing.model';

/**
 * Service for Scan Units for CRYO Processing (CRYO1)
 * Based on actual backend API from PR #1401
 */
@Injectable({
  providedIn: 'root',
})
export class ScanUnitsForCryoProcessingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'api/v1/cryo-processing';

  /**
   * GET /cryo-processing/worksheets
   * Get all active CRYO worksheets (with unprocessed units)
   */
  getActiveWorksheets(): Observable<CryoWorksheetDto[]> {
    return this.http
      .get<ReturnResult<CryoWorksheetDto>>(`${this.baseUrl}/worksheets`)
      .pipe(
        map((result) => {
          if (result.success && result.data) {
            const worksheets = Array.isArray(result.data) ? result.data : [result.data];
            return worksheets.map((ws) => ({
              ...ws,
              insertDats: new Date(ws.insertDats),
            }));
          }
          return [];
        }),
        catchError(this.handleError)
      );
  }

  /**
   * GET /cryo-processing/worksheets/{worksheetId}
   * Get worksheet by ID (includes all units)
   */
  getWorksheetById(worksheetId: string): Observable<CryoWorksheetDto | null> {
    return this.http
      .get<ReturnResult<CryoWorksheetDto>>(`${this.baseUrl}/worksheets/${worksheetId}`)
      .pipe(
        map((result) => {
          if (result.success && result.data) {
            const worksheet = Array.isArray(result.data) ? result.data[0] : result.data;
            return {
              ...worksheet,
              insertDats: new Date(worksheet.insertDats),
            };
          }
          return null;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * POST /cryo-processing/worksheets/generate
   * Generate new CRYO worksheet ID
   */
  generateWorksheetId(): Observable<string> {
    return this.http
      .post<any>(`${this.baseUrl}/worksheets/generate`, {})
      .pipe(
        map((result) => {
          if (result.success) {
            // Backend returns worksheet ID in 'item' field, not 'data'
            const worksheetId = result.item || result.data;
            if (worksheetId) {
              return Array.isArray(worksheetId) ? worksheetId[0] : worksheetId;
            }
          }
          throw new Error(result.message || 'Failed to generate worksheet ID');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * GET /cryo-processing/worksheets/{worksheetId}/units
   * Get unprocessed units for a worksheet
   */
  getUnprocessedUnits(worksheetId: string): Observable<CryoUnitDto[]> {
    return this.http
      .get<ReturnResult<any>>(`${this.baseUrl}/worksheets/${worksheetId}/units`)
      .pipe(
        map((result) => {
          if (result.success && result.data) {
            const units = Array.isArray(result.data) ? result.data : [result.data];
            return units.map((unit: any) => ({
              ...unit,
              // Handle both 'sequence' and 'worksheetSeqNo' field names
              worksheetSeqNo: unit.worksheetSeqNo ?? unit.sequence ?? null,
              collDate: new Date(unit.collDate),
              insertDats: new Date(unit.insertDats),
            }));
          }
          return [];
        }),
        catchError(this.handleError)
      );
  }

  /**
   * POST /cryo-processing/worksheets/{worksheetId}/units
   * Add unit to CRYO worksheet
   */
  addUnitToWorksheet(worksheetId: string, dto: AddCryoUnitRequestDto): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/worksheets/${worksheetId}/units`, dto, {
        context: new HttpContext().set(SKIP_ERROR_TOAST, [400]),
      })
      .pipe(
        map((result) => {
          console.log('POST addUnit response:', result); // Debug logging

          // Just return success if the API call succeeded
          if (result.success) {
            return result;
          }
          throw new Error(result.message || 'Failed to add unit to worksheet');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * GET /cryo-processing/units/{unitId}/components
   * Get valid components for a unit (for product code dropdown)
   */
  getValidComponents(unitId: string): Observable<CryoComponentDto[]> {
    return this.http
      .get<ReturnResult<CryoComponentDto>>(`${this.baseUrl}/units/${unitId}/components`)
      .pipe(
        map((result) => {
          // Check if there's an error code even when success is true
          const errorCode = result.errorResponse?.errorCode;
          if (errorCode && errorCode.trim() !== '') {
            // Throw error to be caught by error handler in component
            const error = {
              error: {
                errorResponse: result.errorResponse,
                message: result.message
              }
            };
            throw error;
          }

          if (result.success) {
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
              return result.data;
            } else if (result.data && !Array.isArray(result.data)) {
              return [result.data];
            } else {
              return [];
            }
          }
          return [];
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Error handler - preserves error structure including error codes
   */
  private handleError(error: any): Observable<never> {
    // Preserve the full error structure so component can extract errorCode
    return throwError(() => error);
  }
}
