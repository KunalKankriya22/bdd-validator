import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API } from '../../../../../../core/constants/api.constants';
import {
  CryoWorksheetLovResponse,
  CryoUnitsResponse,
  DeleteCryoUnitsRequest,
  DeleteCryoUnitsResponse,
  CryoWorksheetUnit,
} from '../models/delete-cryo-units.model';
import moment from 'moment';

/**
 * Service for Delete Units from CRYO Worksheet operations
 */
@Injectable({
  providedIn: 'root',
})
export class DeleteCryoUnitsService {
  private readonly http = inject(HttpClient);

  /**
   * Get CRYO worksheets with un-thawed units (last 21 days)
   * @param take Number of records to retrieve (default: 10)
   * @param skip Number of records to skip (default: 0)
   * @returns Observable of worksheet LOV response
   */
  getWorksheets(take: number = 10, skip: number = 0): Observable<CryoWorksheetLovResponse> {
    const url = API.CRYO_WORKSHEET_UNITS.GET_WORKSHEETS(take, skip);

    return this.http.post<CryoWorksheetLovResponse>(url, {});
  }

  /**
   * Get un-thawed units for a specific CRYO worksheet
   * @param worksheetId CRYO worksheet ID (case-insensitive, auto-converted to uppercase)
   * @param take Number of records to retrieve (default: 10)
   * @param skip Number of records to skip (default: 0)
   * @returns Observable of units response
   */
  getWorksheetUnits(
    worksheetId: string,
    take: number = 10,
    skip: number = 0
  ): Observable<CryoWorksheetUnit[]> {
    const url = API.CRYO_WORKSHEET_UNITS.GET_UNITS(worksheetId, take, skip);

    return this.http.post<CryoUnitsResponse>(url, {}).pipe(
      map(response => {
        // Transform backend DTOs to frontend display models
        return response.data.map((unit, index) => ({
          sequence: index + 1, // Frontend generates sequence
          unitId: unit.unitId,
          productCode: unit.productCode,
          productDescription: unit.productDescription,
          bloodGroup: unit.bloodGroup,
          rh: unit.rh,
          collectionDate: this.formatDate(unit.collDate), // Backend uses 'collDate'
          expirationDate: this.formatDate(unit.expirationDate),
          status: unit.status,
        }));
      })
    );
  }

  /**
   * Delete selected units from a CRYO worksheet (PHYSICAL DELETE)
   * ⚠️ WARNING: This is a destructive operation - always confirm with user first.
   * @param request Delete request containing worksheet ID and unit IDs
   * @returns Observable of delete response
   */
  deleteUnits(request: DeleteCryoUnitsRequest): Observable<DeleteCryoUnitsResponse> {
    const url = API.CRYO_WORKSHEET_UNITS.DELETE_UNITS;

    return this.http.delete<DeleteCryoUnitsResponse>(url, { body: request });
  }

  /**
   * Format ISO 8601 date to DD-MON-YYYY display format
   * @param isoDate ISO 8601 date string
   * @returns Formatted date string (DD-MMM-YYYY uppercase)
   */
  private formatDate(isoDate: string): string {
    if (!isoDate) return '';

    return moment(isoDate).format('DD-MMM-YYYY').toUpperCase();
  }
}
