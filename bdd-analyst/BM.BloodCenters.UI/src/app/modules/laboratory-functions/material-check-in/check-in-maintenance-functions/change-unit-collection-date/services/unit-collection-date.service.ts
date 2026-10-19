import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import {
  ValidateUnitRequest,
  ValidateUnitResponse,
  CollectionDateRequest,
  ChangeCollectionDateResponse
} from '../models/unit-collection-date.model';

@Injectable({
  providedIn: 'root'
})
export class UnitCollectionDateService {
  private readonly apiService = inject(ApiService);

  /**
   * Validate if a unit can have its collection date changed
   * POST /api/v1/collection-date/validate-unit
   * Backend returns ReturnResult<UnitValidationResultDto>, we extract the item
   */
  validateUnit(request: ValidateUnitRequest): Observable<ValidateUnitResponse> {
    return this.apiService.post<any>(
      '/api/v1/collection-date/validate-unit',
      request
    ).pipe(
      map(response => {
        // Backend returns: { success, item: { isValid, unit: {...}, currentCollectionDate, ... } }
        // We need to flatten this and use unit data
        if (response?.item) {
          const unit = response.item.unit;
          return {
            isValid: response.item.isValid,
            unitId: unit?.unitId || '',
            chapterId: unit?.chapterId || '',
            currentCollectionDate: unit?.collectionDate || response.item.currentCollectionDate,
            insertDate: unit?.insertDate || response.item.insertDate,
            contractId: unit?.contractId || response.item.contractId,
            hasSystemLabelDecision: response.item.hasSystemLabelDecision,
            componentCount: response.item.componentCount,
            unitExists: response.item.unitExists,
            validationErrors: response.item.validationErrors || [],
            message: response.message
          } as ValidateUnitResponse;
        }
        // Fallback if structure is different
        return response as ValidateUnitResponse;
      })
    );
  }

  /**
   * Change the collection date for a unit and all related records
   * Implements two-phase commit with CMTI calculation
   * POST /api/v1/collection-date/change
   */
  changeCollectionDate(request: CollectionDateRequest): Observable<ChangeCollectionDateResponse> {
    return this.apiService.post<ChangeCollectionDateResponse>(
      '/api/v1/collection-date/change',
      request
    );
  }
}
