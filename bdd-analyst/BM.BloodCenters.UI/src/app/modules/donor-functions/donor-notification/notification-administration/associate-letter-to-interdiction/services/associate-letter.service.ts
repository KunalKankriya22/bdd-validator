import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import {
  LetterInterdictionAssociation,
  AssociationFilterCriteria,
  CreateAssociationRequest,
  UpdateAssociationRequest,
  AssociationListResponse,
  DropdownDataResponse
} from '../models/associate-letter.model';

@Injectable({
  providedIn: 'root'
})
export class AssociateLetterService {
  private readonly apiService = inject(ApiService);
  private readonly baseUrl = 'api/v1/letter-interdiction-association';

  /**
   * Get all letter-interdiction associations with pagination and optional filtering
   */
  getAssociations(
    take: number = 25,
    skip: number = 0,
    filters?: AssociationFilterCriteria
  ): Observable<AssociationListResponse> {
    const searchParams = {
      interdictionCode: filters?.interdictionCode || null,
      donationType: filters?.donationType || null,
      letterId: filters?.letterId || null
    };

    return this.apiService.post<any>(
      `${this.baseUrl}/${take}/${skip}`,
      searchParams
    ).pipe(
      map(response => ({
        data: response.data || [],
        totalCount: response.total || 0
      }))
    );
  }

  /**
   * Get dropdown data (interdiction codes, donation types, letter codes)
   */
  getDropdownData(): Observable<DropdownDataResponse> {
    return forkJoin({
      interdictionCodes: this.apiService.get<any>(`${this.baseUrl}/lov/interdictions`).pipe(
        map(response => response.data || [])
      ),
      donationTypes: this.apiService.get<any>(`${this.baseUrl}/lov/donation-types`).pipe(
        map(response => response.data || [])
      ),
      letterCodes: this.apiService.get<any>(`${this.baseUrl}/lov/letters`).pipe(
        map(response => response.data || [])
      )
    });
  }

  /**
   * Get a single association by composite key (not implemented - using list filter instead)
   */
  getAssociationById(
    interdictionCode: string,
    donationType: string,
    letterId: string
  ): Observable<LetterInterdictionAssociation | null> {
    return this.getAssociations(1, 0, {
      interdictionCode,
      donationType,
      letterId
    }).pipe(
      map(response => response.data.length > 0 ? response.data[0] : null)
    );
  }

  /**
   * Create a new letter-interdiction association
   */
  createAssociation(data: CreateAssociationRequest): Observable<any> {
    return this.apiService.post<any>(this.baseUrl, data);
  }

  /**
   * Update an existing association (typically to set termination date)
   */
  updateAssociation(data: LetterInterdictionAssociation): Observable<any> {
    return this.apiService.put<any>(this.baseUrl, data);
  }

  /**
   * Delete an association
   */
  deleteAssociation(
    interdictionCode: string,
    donationType: string,
    letterId: string
  ): Observable<any> {
    return this.apiService.delete<any>(
      `${this.baseUrl}?interdictionCode=${interdictionCode}&donationType=${donationType}&letterId=${letterId}`
    );
  }
}
