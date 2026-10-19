import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  HlaAntigenModel,
  HlaAntigenParamsDto,
  CreateHlaAntigenDto,
  UpdateHlaAntigenDto,
  HlaAntigenResponse,
  HlaAntigenItemResponse,
  LocusCodeModel,
  LocusCodesResponse
} from '../models/hla-antigens.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class HlaAntigensService {
  private readonly apiService = inject(ApiService);

  /**
   * Get HLA Antigens list with pagination, sorting, and filtering
   * POST /valid-hla-locus/{take}/{skip}
   * Query params: locus, searchKeyword, includeExpired, sortOrder
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getHlaAntigens(
    take: number,
    skip: number,
    params: HlaAntigenParamsDto
  ): Observable<{ data: HlaAntigenModel[]; total: number }> {
    const endpoint = API.DONOR_FUNCTIONS.VALID_HLA_LOCUS.GET_LIST(take, skip);

    return this.apiService.post<HlaAntigenResponse>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        total: response.total || 0
      }))
    );
  }

  /**
   * Get single HLA antigen by composite key
   * GET /valid-hla-locus/{locus}/{epitopeId}
   * @param locus - Locus code (primary key part 1)
   * @param epitopeId - Epitope ID (primary key part 2)
   * @returns Observable with single HLA antigen
   */
  getHlaAntigenById(
    locus: string,
    epitopeId: string
  ): Observable<HlaAntigenModel | null> {
    const endpoint = API.DONOR_FUNCTIONS.VALID_HLA_LOCUS.GET_BY_ID(locus, epitopeId);

    return this.apiService.get<HlaAntigenItemResponse>(endpoint).pipe(
      map(response => response.item || null),
      catchError(error => {
        // 404 is expected when checking for duplicates (record doesn't exist)
        if (error.status === 404) {
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new HLA antigen
   * POST /valid-hla-locus
   * @param payload - HLA antigen data to add
   * @returns Observable with API response
   */
  addHlaAntigen(payload: CreateHlaAntigenDto): Observable<HlaAntigenItemResponse> {
    const endpoint = API.DONOR_FUNCTIONS.VALID_HLA_LOCUS.CREATE;

    return this.apiService.post<HlaAntigenItemResponse>(endpoint, payload);
  }

  /**
   * Update existing HLA antigen
   * PUT /valid-hla-locus/{locus}/{epitopeId}
   */
  updateHlaAntigen(
    locus: string,
    epitopeId: string,
    payload: UpdateHlaAntigenDto
  ): Observable<HlaAntigenItemResponse> {
    const endpoint = API.DONOR_FUNCTIONS.VALID_HLA_LOCUS.UPDATE(locus, epitopeId);

    return this.apiService.put<HlaAntigenItemResponse>(endpoint, payload);
  }

  /**
   * Get locus codes lookup
   * GET /valid-hla-locus/locus-codes
   * @returns Observable with array of locus codes
   */
  getLocusCodes(): Observable<LocusCodeModel[]> {
    const endpoint = API.DONOR_FUNCTIONS.VALID_HLA_LOCUS.GET_LOCUS_CODES;

    return this.apiService.get<LocusCodesResponse>(endpoint).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get epitope IDs (antigens) for filter dropdown
   * GET /valid-hla-locus/epitope-ids
   * @returns Observable with array of epitope IDs
   */
  getEpitopeIds(): Observable<string[]> {
    const endpoint = API.DONOR_FUNCTIONS.VALID_HLA_LOCUS.GET_EPITOPE_IDS;

    return this.apiService.get<{ success: boolean; data: Array<{ epitopeId: string }> }>(endpoint).pipe(
      map(response => (response.data || []).map(item => item.epitopeId))
    );
  }

  /**
   * Get epitope super IDs (associated antigens) for filter dropdown
   * GET /valid-hla-locus/epitope-super-ids
   * @returns Observable with array of epitope super IDs
   */
  getEpitopeSuperIds(): Observable<string[]> {
    const endpoint = API.DONOR_FUNCTIONS.VALID_HLA_LOCUS.GET_EPITOPE_SUPER_IDS;

    return this.apiService.get<{ success: boolean; data: Array<{ epitopeSuperI: string }> }>(endpoint).pipe(
      map(response => (response.data || []).map(item => item.epitopeSuperI))
    );
  }
}
