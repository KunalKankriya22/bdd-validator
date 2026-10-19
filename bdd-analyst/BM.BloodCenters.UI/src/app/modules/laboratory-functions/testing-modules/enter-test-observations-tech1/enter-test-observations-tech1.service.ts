import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ApiResponse,
  BandRow,
  LoadObservationsResponse,
  ObservationColumn,
  ObservationDataResponse,
  ResultInterpretation,
  SaveObservationsRequest,
  SaveNoteRequest,
  SaveOtherBandsRequest,
  TestObservationNote,
  TestTypeOption,
} from './enter-test-observations-tech1.model';

/**
 * Service for Enter Test Observations: Tech 1
 * Handles all API interactions for test observation data
 * Consumes existing backend APIs from TestObservationsController
 */
@Injectable({
  providedIn: 'root',
})
export class EnterTestObservationsTech1Service {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.TESTING_MODULES.ENTER_TEST_OBSERVATIONS_TECH1.BASE}`;

  /**
   * Load initial dropdown options
   * Uses existing backend LOV endpoints:
   * - GET /lov/test-batches
   * Note: Tests are loaded separately based on selected test batch
   */
  loadInitialOptions(): Observable<LoadObservationsResponse> {
    const testBatchesUrl = `${this.baseUrl}/lov/test-batches`;

    return this.http.get<ApiResponse<any>>(testBatchesUrl).pipe(
      map((testBatches) => {
        return {
          testBatchWorksheets: (testBatches.data || []).map((tb: any) => ({
            id: tb.tbId,
            testId: tb.testId,
            displayName: `${tb.tbId}`,
            description: '',
          })),
          testIds: [], // Will be loaded dynamically based on selected test batch
          testTypes: [], // Will be loaded dynamically based on selected test
          resultInterpretations: [],
        };
      })
    );
  }

  /**
   * Load tests for a specific test batch
   * Uses backend endpoint: GET /lov/tests/{tbId}
   */
  loadTestsForBatch(tbId: string): Observable<any[]> {
    const url = `${this.baseUrl}/lov/tests/${encodeURIComponent(tbId)}`;

    return this.http.get<ApiResponse<any>>(url).pipe(
      map((response) => {
        return (response.data || []).map((t: any) => ({
          id: t.testId,
          code: t.testId,
          description: t.testDesc,
        }));
      })
    );
  }

  /**
   * Load valid result codes for a specific test ID
   * Uses backend endpoint: GET /lov/result-codes/{testId}
   */
  loadResultCodes(testId: string): Observable<ResultInterpretation[]> {
    const url = `${this.baseUrl}/lov/result-codes/${encodeURIComponent(testId)}`;

    return this.http.get<ApiResponse<any>>(url).pipe(
      map((response) => {
        return (response.data || []).map((rc: any) => ({
          code: rc.resultCode,
          description: rc.resultDesc,
        }));
      })
    );
  }

  /**
   * Load valid band values for observation dropdowns
   * Uses backend endpoint: GET /lov/band-values/{testId}
   */
  loadBandValues(testId: string): Observable<{ result: string; resultDesc: string }[]> {
    const url = `${this.baseUrl}/lov/band-values/${encodeURIComponent(testId)}`;

    return this.http.get<ApiResponse<any>>(url).pipe(
      map((response) => {
        return (response.data || []).map((bv: any) => ({
          result: bv.result,
          resultDesc: bv.resultDesc,
        }));
      })
    );
  }

  /**
   * Load test types for a specific test ID
   * Uses existing backend endpoint: GET /lov/test-types/{testId}
   */
  loadTestTypes(testId: string): Observable<TestTypeOption[]> {
    const url = `${this.baseUrl}/lov/test-types/${testId}`;

    return this.http.get<ApiResponse<any>>(url).pipe(
      map((response) => {
        return (response.data || []).map((tt: any) => ({
          id: tt.testType,
          code: tt.testType,
          description: tt.testTypeDesc,
          controlValue: tt.controlValue,
        }));
      })
    );
  }

  /**
   * Load observation data for selected filters
   * Uses existing backend endpoint: GET /holding-tests/{tbId}/{testId}
   * @param testBatchWorksheetId Test Batch ID
   * @param testId Test ID
   * @param testTypeId Test Type ID
   */
  loadObservationData(
    testBatchWorksheetId: string,
    testId: string,
    testTypeId: string
  ): Observable<ObservationDataResponse> {
    const url = `${this.baseUrl}/holding-tests/${testBatchWorksheetId}/${testId}?testType=${encodeURIComponent(testTypeId)}`;

    return this.http.get<ApiResponse<any>>(url).pipe(
      map((response) => {
        const holdingTests = response.data || [];

        // Build observation columns from band names returned by API
        // All units share the same band configuration, so use the first unit's bands
        const firstUnitBands = holdingTests.length > 0 ? (holdingTests[0].bandResults || []) : [];
        const columns: ObservationColumn[] = firstUnitBands.map((band: any, index: number) => ({
          columnId: band.bandName,
          columnName: band.bandName,
          order: band.bandSeq || (index + 1),
        }));

        // Build units from holding tests
        const units = holdingTests.map((test: any) => {
          const bandResults = test.bandResults || [];

          // Build band seq map for save operation
          const bandSeqMap: { [bandName: string]: number } = {};
          bandResults.forEach((band: any) => {
            bandSeqMap[band.bandName] = band.bandSeq;
          });

          // Each band becomes a single observation entry keyed by bandName
          const bands: BandRow[] = [{
            bandId: 'tech1',
            bandName: 'Tech 1',
            unitId: test.unitId,
            observations: bandResults.reduce((obs: any, band: any) => {
              obs[band.bandName] = band.tech1BandVal ?? null;
              return obs;
            }, {} as any),
            isOtherBand: false,
          }];

          // Process otherBands if they exist
          const otherBands = test.otherBands || [];
          otherBands.forEach((other: any, index: number) => {
            if (other.band1) {
              bands.push({
                bandId: `other-band1-${index}`,
                bandName: other.band1,
                unitId: test.unitId,
                observations: bandResults.reduce((obs: any, band: any) => {
                  obs[band.bandName] = null;
                  return obs;
                }, {} as any),
                isOtherBand: true,
              });
            }
            if (other.band2) {
              bands.push({
                bandId: `other-band2-${index}`,
                bandName: other.band2,
                unitId: test.unitId,
                observations: bandResults.reduce((obs: any, band: any) => {
                  obs[band.bandName] = null;
                  return obs;
                }, {} as any),
                isOtherBand: true,
              });
            }
          });

          return {
            unitId: test.unitId,
            collDate: test.collDate,
            tbSeqNo: test.tbSeqNo,
            tempResult1: test.tempResult1 || '',
            bandSeqMap,
            bands,
          };
        });

        return {
          columns,
          units,
          description: testBatchWorksheetId,
          testTypeDescription: testTypeId,
          controlValue: '2',
        };
      })
    );
  }

  /**
   * Save observation data
   * Uses existing backend endpoint: POST /save
   * @param request Save observations request
   */
  saveObservations(request: SaveObservationsRequest): Observable<ApiResponse<any>> {
    const url = `${this.baseUrl}/save`;

    const backendRequest = {
      tbId: request.testBatchWorksheetId,
      testId: request.testId,
      testType: request.testTypeId,
      overrideCodes: request.overrideCodes || [],
      observations: request.unitObservations.map((unit) => {
        const band = unit.bands[0];
        const bandResults = band
          ? Object.entries(band.observations).map(([bandName, value]) => ({
              bandName,
              bandSeq: unit.bandSeqMap?.[bandName] || 0,
              tech1BandVal: value != null ? String(value) : null,
            }))
          : [];

        return {
          unitId: unit.unitId,
          collDate: unit.collDate || new Date().toISOString(),
          tbSeqNo: unit.tbSeqNo || 0,
          tempResult1: unit.tempResult1 || '',
          bandResults,
        };
      }),
    };

    return this.http.post<ApiResponse<any>>(url, backendRequest);
  }

  loadNote(tbId: string, testId: string, unitId: string, tbSeqNo: string): Observable<TestObservationNote | null> {
    const url = `${this.baseUrl}/notes/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/${encodeURIComponent(unitId)}/${encodeURIComponent(tbSeqNo)}`;
    return this.http.get<ApiResponse<any>>(url).pipe(
      map((response) => {
        const data = response.data;
        if (Array.isArray(data) && data.length > 0) {
          return data[0] as TestObservationNote;
        }
        return null;
      })
    );
  }

  saveNote(request: SaveNoteRequest): Observable<ApiResponse<any>> {
    const url = `${this.baseUrl}/notes`;
    return this.http.post<ApiResponse<any>>(url, request);
  }

  deleteNote(noteId: string): Observable<ApiResponse<any>> {
    const url = `${this.baseUrl}/notes/${encodeURIComponent(noteId)}`;
    return this.http.delete<ApiResponse<any>>(url);
  }

  loadOtherBands(tbId: string, testId: string, unitId: string, tbSeqNo: string): Observable<any[]> {
    const url = `${this.baseUrl}/other-bands/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/${encodeURIComponent(unitId)}/${encodeURIComponent(tbSeqNo)}`;
    return this.http.get<ApiResponse<any>>(url).pipe(
      map((response) => {
        const data = response.data;
        return Array.isArray(data) ? data : [];
      })
    );
  }

  saveOtherBands(request: SaveOtherBandsRequest): Observable<ApiResponse<any>> {
    const url = `${this.baseUrl}/other-bands`;
    return this.http.post<ApiResponse<any>>(url, request);
  }

  deleteOtherBands(tbId: string, testId: string, unitId: string, tbSeqNo: string): Observable<ApiResponse<any>> {
    const url = `${this.baseUrl}/other-bands/${encodeURIComponent(tbId)}/${encodeURIComponent(testId)}/${encodeURIComponent(unitId)}/${encodeURIComponent(tbSeqNo)}`;
    return this.http.delete<ApiResponse<any>>(url);
  }

}
