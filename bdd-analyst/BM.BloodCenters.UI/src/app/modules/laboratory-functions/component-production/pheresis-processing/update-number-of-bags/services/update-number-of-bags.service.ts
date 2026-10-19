import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ValidateUnitRequest,
  ValidateUnitData,
  ProductCode,
  ComponentPrefixItem,
  UpdateBagsRequest,
  ReturnResult,
} from '../models/update-number-of-bags.model';

@Injectable({
  providedIn: 'root',
})
export class UpdateNumberOfBagsService {
  private readonly apiService = inject(ApiService);

  validateUnit(request: ValidateUnitRequest): Observable<ReturnResult<ValidateUnitData>> {
    return this.apiService
      .post<ReturnResult<ValidateUnitData>>(
        API.UPDATE_NUMBER_OF_BAGS.VALIDATE_UNIT,
        request,
      )
      .pipe(
        catchError((error) => {
          console.error('Error validating unit:', error);
          return throwError(() => error);
        }),
      );
  }

  getProductCodes(unitId: string, collDate: string, codeScheme: string): Observable<ProductCode[]> {
    return this.apiService
      .get<ProductCode[]>(
        API.UPDATE_NUMBER_OF_BAGS.PRODUCT_CODES(unitId, collDate, codeScheme),
      )
      .pipe(
        map((response) => response ?? []),
        catchError((error) => {
          console.error('Error fetching product codes:', error);
          return throwError(() => error);
        }),
      );
  }

  getComponentPrefixes(
    unitId: string,
    collDate: string,
    productCode: string,
    codeScheme: string,
  ): Observable<ComponentPrefixItem[]> {
    return this.apiService
      .get<ComponentPrefixItem[]>(
        API.UPDATE_NUMBER_OF_BAGS.COMPONENT_PREFIXES(unitId, collDate, productCode, codeScheme),
      )
      .pipe(
        map((response) => response ?? []),
        catchError((error) => {
          console.error('Error fetching component prefixes:', error);
          return throwError(() => error);
        }),
      );
  }

  updateBags(request: UpdateBagsRequest): Observable<ReturnResult<boolean>> {
    return this.apiService
      .put<ReturnResult<boolean>>(
        API.UPDATE_NUMBER_OF_BAGS.UPDATE_BAGS,
        request,
      )
      .pipe(
        catchError((error) => {
          console.error('Error updating bags:', error);
          return throwError(() => error);
        }),
      );
  }
}
