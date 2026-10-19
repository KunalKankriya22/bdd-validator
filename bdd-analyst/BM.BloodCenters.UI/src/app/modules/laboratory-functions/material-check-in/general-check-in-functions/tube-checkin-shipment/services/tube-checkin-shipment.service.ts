import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../../../../../environments/environment';
import {
  SamplePackDto,
  SamplePackQueryDto,
  SamplePackTubeDto,
  CreateSamplePackRequestDto,
  UpdateSamplePackRequestDto,
  AddTubeRequestDto,
  ReturnResult,
  DestinationLab,
} from '../models/tube-checkin-shipment.model';

@Injectable({
  providedIn: 'root',
})
export class TubeCheckinShipmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/sample-packs`;

  /**
   * Get all sample packs with optional filtering
   * @param take Number of records to return
   * @param skip Number of records to skip
   * @param query Optional filter criteria
   */
  getAll(take: number, skip: number, query: SamplePackQueryDto): Observable<ReturnResult<SamplePackDto>> {
    return this.http.post<ReturnResult<SamplePackDto>>(`${this.baseUrl}/${take}/${skip}`, query).pipe(
      catchError(() => of({
        success: false,
        message: 'Failed to retrieve sample packs',
        statusCode: 500,
        data: [],
        totalRecords: 0
      }))
    );
  }


  /**
   * Get sample pack by box ID
   * @param boxId Box identifier
   */
  getById(boxId: string): Observable<SamplePackDto | null> {
    return this.http.get<SamplePackDto>(`${this.baseUrl}/${boxId}`).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Get box header by box ID (alias for getById for backward compatibility)
   */
  getBoxHeader(boxId: string, chapterId: string): Observable<SamplePackDto | null> {
    return this.getById(boxId);
  }

  /**
   * Create a new sample pack
   * @param request Sample pack creation data
   */
  create(request: CreateSamplePackRequestDto): Observable<ReturnResult<any>> {
    return this.http.post<ReturnResult<any>>(`${this.baseUrl}`, request);
  }

  /**
   * Create a new box (alias for create for backward compatibility)
   */
  createBox(request: CreateSamplePackRequestDto): Observable<ReturnResult<any>> {
    return this.create(request);
  }

  /**
   * Update existing sample pack
   * @param boxId Box identifier
   * @param request Update data
   */
  update(boxId: string, request: UpdateSamplePackRequestDto): Observable<ReturnResult<any>> {
    return this.http.put<ReturnResult<any>>(`${this.baseUrl}/${boxId}`, request);
  }

  /**
   * Close sample pack for shipment
   * @param boxId Box identifier
   */
  close(boxId: string): Observable<ReturnResult<any>> {
    return this.http.put<ReturnResult<any>>(`${this.baseUrl}/${boxId}/close`, {});
  }

  /**
   * Close box (alias for close for backward compatibility)
   */
  closeBox(request: { boxId: string; printPackList: boolean }): Observable<ReturnResult<any>> {
    // Note: printPackList is not used in the current API but kept for compatibility
    return this.close(request.boxId);
  }

  /**
   * Get all tubes in a sample pack
   * @param boxId Box identifier
   */
  getTubes(boxId: string): Observable<ReturnResult<SamplePackTubeDto>> {
    return this.http.get<ReturnResult<SamplePackTubeDto>>(`${this.baseUrl}/${boxId}/tubes`).pipe(
      catchError(() => of({
        success: false,
        message: 'Failed to retrieve tubes',
        statusCode: 500,
        data: [],
        totalRecords: 0
      }))
    );
  }

  /**
   * Get box units/tubes (alias for getTubes for backward compatibility)
   */
  getBoxUnits(boxId: string, chapterId: string): Observable<SamplePackTubeDto[]> {
    return this.getTubes(boxId).pipe(
      map(result => result.data || []),
      catchError(() => of([]))
    );
  }

  /**
   * Add tube to sample pack
   * @param boxId Box identifier
   * @param request Tube data
   */
  addTube(boxId: string, request: AddTubeRequestDto): Observable<ReturnResult<any>> {
    return this.http.post<ReturnResult<any>>(`${this.baseUrl}/${boxId}/tubes`, request);
  }

  /**
   * Remove tube from sample pack
   * @param boxId Box identifier
   * @param unitId Unit identifier
   */
  removeTube(boxId: string, unitId: string): Observable<ReturnResult<any>> {
    return this.http.delete<ReturnResult<any>>(`${this.baseUrl}/${boxId}/tubes/${unitId}`);
  }

  /**
   * Get open boxes using the new lookup endpoint
   * POST /sample-packs/lookups/open-boxes
   * Returns: { success, data: [{ boxId, collDate, extractType, donorType, destinationCode }] }
   */
  getOpenBoxesLookup(): Observable<SamplePackDto[]> {
    return this.http.post<ReturnResult<SamplePackDto>>(`${this.baseUrl}/lookups/open-boxes`, {}).pipe(
      map(result => result.data || []),
      catchError(() => of([]))
    );
  }

  /**
   * Get open boxes with full details for dropdown
   * Updated to use the new /lookups/open-boxes endpoint
   */
  getOpenBoxesDetailed(chapterId: string): Observable<SamplePackDto[]> {
    return this.getOpenBoxesLookup();
  }

  /**
   * Get open boxes (backward compatibility - returns just box IDs)
   */
  getOpenBoxes(chapterId: string): Observable<string[]> {
    return this.getOpenBoxesDetailed(chapterId).pipe(
      map(boxes => boxes.map(box => box.boxId))
    );
  }

  /**
   * Get active testing laboratories for dropdown
   * TODO: Backend /lookups/testing-labs returns 500 - using fallback until fixed
   */
  getDestinationLabs(chapterId: string): Observable<DestinationLab[]> {
    // Try API first, fallback to empty array if 500 error
    // Backend gets chapterId from user context automatically
    return this.http.post<ReturnResult<DestinationLab>>(`${this.baseUrl}/lookups/testing-labs`, {}).pipe(
      map(result => result.data || []),
      catchError(() => {
        // Return empty array - user will need to manually enter destination code
        console.warn('Testing labs lookup failed - endpoint may not be implemented yet');
        return of([]);
      })
    );
  }

  /**
   * Get plate capacity from master codes
   * TODO: Backend /lookups/plate-capacity returns 500 - using default until fixed
   */
  getPlateCapacity(): Observable<number> {
    // Try API first, fallback to default 88 if 500 error
    return this.http.post<{ success: boolean; data: { plateCapacity: number | null }; statusCode: number }>(
      `${this.baseUrl}/lookups/plate-capacity`, {}
    ).pipe(
      map(result => result.data?.plateCapacity || 88), // Default to 88 per Oracle Forms
      catchError(() => {
        console.warn('Plate capacity lookup failed - using default 88');
        return of(88);
      })
    );
  }

  /**
   * View units in box (for dialog) - using getTubes
   */
  viewUnitsInBox(boxId: string, chapterId: string): Observable<{ tubes: SamplePackTubeDto[]; unitCount: number; tubeCount: number }> {
    return this.getTubes(boxId).pipe(
      map(result => {
        const tubes = result.data || [];
        const unitCount = new Set(tubes.map(t => t.unitId)).size;
        return {
          tubes,
          unitCount,
          tubeCount: tubes.length
        };
      }),
      catchError(() => of({ tubes: [], unitCount: 0, tubeCount: 0 }))
    );
  }
}
