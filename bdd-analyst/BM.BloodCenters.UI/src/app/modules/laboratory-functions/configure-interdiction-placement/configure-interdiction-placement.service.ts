import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  InterdictionPlacement,
  CreateInterdictionPlacementRequest,
  UpdateInterdictionPlacementRequest,
  InterdictionPlacementQuery,
  ActionFunctionNameLookup,
  ActionTypeLookup,
  ActionCodeLookup,
  ProductCodeLookup,
  InterdictionCodeLookup,
  ProductTypeLookup
} from './configure-interdiction-placement.model';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class ConfigureInterdictionPlacementService {
  private readonly apiService = inject(ApiService);

  getAll(
    take: number,
    skip: number,
    query: InterdictionPlacementQuery
  ): Observable<{ data: InterdictionPlacement[]; totalRecords: number }> {
    const endpoint = API.CONFIGURE_INTERDICTION_PLACEMENT.GET_ALL(take, skip);

    return this.apiService.post<any>(endpoint, query).pipe(
      map(response => this.extractTableData(response)),
      catchError(error => {
        console.error('Error fetching interdiction placement data:', error);
        return throwError(() => error);
      })
    );
  }

  create(data: CreateInterdictionPlacementRequest): Observable<any> {
    const endpoint = API.CONFIGURE_INTERDICTION_PLACEMENT.CREATE;

    return this.apiService.post<any>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error creating interdiction placement:', error);
        return throwError(() => error);
      })
    );
  }

  update(
    chapterId: string,
    actionFunctionName: string,
    actionType: string,
    actionCode: string | null,
    actionProductCode: string,
    data: UpdateInterdictionPlacementRequest
  ): Observable<any> {
    const endpoint = API.CONFIGURE_INTERDICTION_PLACEMENT.UPDATE(
      chapterId, actionFunctionName, actionType, actionCode, actionProductCode
    );

    return this.apiService.put<any>(endpoint, data).pipe(
      catchError(error => {
        console.error('Error updating interdiction placement:', error);
        return throwError(() => error);
      })
    );
  }

  delete(
    chapterId: string,
    actionFunctionName: string,
    actionType: string,
    actionCode: string | null,
    actionProductCode: string
  ): Observable<any> {
    const endpoint = API.CONFIGURE_INTERDICTION_PLACEMENT.DELETE(
      chapterId, actionFunctionName, actionType, actionCode, actionProductCode
    );

    return this.apiService.delete<any>(endpoint).pipe(
      catchError(error => {
        console.error('Error deleting interdiction placement:', error);
        return throwError(() => error);
      })
    );
  }

  getFilterOptions(functionName: string): Observable<{ productCodes: string[]; otherProductCodes: string[]; actionCodes: string[] }> {
    const endpoint = API.CONFIGURE_INTERDICTION_PLACEMENT.FILTER_OPTIONS(functionName);

    return this.apiService.get<any>(endpoint).pipe(
      map(response => {
        const data = response?.data || response?.Data || response || {};
        return {
          productCodes: data.productCodes || data.ProductCodes || [],
          otherProductCodes: data.otherProductCodes || data.OtherProductCodes || [],
          actionCodes: data.actionCodes || data.ActionCodes || [],
        };
      }),
      catchError(error => {
        console.error('Error fetching filter options:', error);
        return throwError(() => error);
      })
    );
  }

  getActionFunctionNames(): Observable<ActionFunctionNameLookup[]> {
    const endpoint = API.CONFIGURE_INTERDICTION_PLACEMENT.LOOKUPS.FUNCTION_NAMES;

    return this.apiService.get<any>(endpoint).pipe(
      map(response => {
        const items = Array.isArray(response) ? response : (response?.data || response?.Data || []);
        return items.map((item: any) => ({
          code: item.code || item.Code || item.codeDesc || item.CodeDesc || '',
          description: item.description || item.Description || item.codeDesc || item.CodeDesc || ''
        }));
      }),
      catchError(error => {
        console.error('Error fetching action function names:', error);
        return throwError(() => error);
      })
    );
  }

  getActionTypes(): Observable<ActionTypeLookup[]> {
    const endpoint = API.CONFIGURE_INTERDICTION_PLACEMENT.LOOKUPS.ACTION_TYPES;

    return this.apiService.get<any>(endpoint).pipe(
      map(response => {
        const items = Array.isArray(response) ? response : (response?.data || response?.Data || []);
        return items.map((item: any) => ({
          code: item.code || item.Code || item.codeDesc || item.CodeDesc || '',
          description: item.description || item.Description || item.codeDesc || item.CodeDesc || ''
        }));
      }),
      catchError(error => {
        console.error('Error fetching action types:', error);
        return throwError(() => error);
      })
    );
  }

  getActionCodes(): Observable<ActionCodeLookup[]> {
    const endpoint = API.CONFIGURE_INTERDICTION_PLACEMENT.LOOKUPS.ACTION_CODES;

    return this.apiService.get<any>(endpoint).pipe(
      map(response => {
        const items = Array.isArray(response) ? response : (response?.data || response?.Data || []);
        return items.map((item: any) => ({
          code: item.code || item.Code || '',
          codeDesc: item.description || item.Description || item.codeDesc || item.CodeDesc || ''
        }));
      }),
      catchError(error => {
        console.error('Error fetching action codes:', error);
        return throwError(() => error);
      })
    );
  }

  getProductCodes(): Observable<ProductCodeLookup[]> {
    const endpoint = API.CONFIGURE_INTERDICTION_PLACEMENT.LOOKUPS.PRODUCT_CODES;

    return this.apiService.get<any>(endpoint).pipe(
      map(response => {
        const items = Array.isArray(response) ? response : (response?.data || response?.Data || []);
        return items.map((item: any) => ({
          productCode: item.productCode || item.ProductCode || '',
          productDesc: item.productDescription || item.ProductDescription || item.productDesc || item.ProductDesc || ''
        }));
      }),
      catchError(error => {
        console.error('Error fetching product codes:', error);
        return throwError(() => error);
      })
    );
  }

  getInterdictionCodes(): Observable<InterdictionCodeLookup[]> {
    const endpoint = API.CONFIGURE_INTERDICTION_PLACEMENT.LOOKUPS.INTERDICTION_CODES;

    return this.apiService.get<any>(endpoint).pipe(
      map(response => {
        const items = Array.isArray(response) ? response : (response?.data || response?.Data || []);
        return items.map((item: any) => ({
          interCode: item.interCode || item.InterCode || '',
          interDesc: item.interDesc || item.InterDesc || '',
          interType: item.interType || item.InterType || ''
        }));
      }),
      catchError(error => {
        console.error('Error fetching interdiction codes:', error);
        return throwError(() => error);
      })
    );
  }

  getProductTypes(): Observable<ProductTypeLookup[]> {
    const endpoint = API.CONFIGURE_INTERDICTION_PLACEMENT.LOOKUPS.PRODUCT_TYPES;

    return this.apiService.get<any>(endpoint).pipe(
      map(response => {
        const items = Array.isArray(response) ? response : (response?.data || response?.Data || []);
        return items.map((item: any) => ({
          productType: item.productType || item.ProductType || ''
        }));
      }),
      catchError(error => {
        console.error('Error fetching product types:', error);
        return throwError(() => error);
      })
    );
  }

  private extractTableData(response: any): { data: InterdictionPlacement[]; totalRecords: number } {
    if (!response) {
      return { data: [], totalRecords: 0 };
    }

    const rawData: any[] = response.Data || response.data || [];
    const total: number = response.Total ?? response.total ?? response.TotalCount ?? response.totalCount ?? rawData.length;

    const normalizedData = rawData.map(item => this.normalizePropertyNames(item));

    return { data: normalizedData, totalRecords: total };
  }

  private normalizePropertyNames(item: any): InterdictionPlacement {
    if (!item) {
      return {
        chapterId: '',
        actionFunctionName: '',
        actionType: '',
        actionProductCode: '',
        actionCode: null,
        interOnCurrentProd: null,
        interOnOtherProds: null,
        interOnOtherProdTypes: null,
        interOnUnitLevel: null,
        interAllProdButCurr: null,
        interCode: null,
        effDate: null,
        termDate: null,
        insertDate: null,
        insertUser: null
      };
    }

    return {
      chapterId: item.chapterId ?? item.ChapterId ?? '',
      actionFunctionName: item.actionFunctionName ?? item.ActionFunctionName ?? '',
      actionType: item.actionType ?? item.ActionType ?? '',
      actionProductCode: item.actionProductCode ?? item.ActionProductCode ?? '',
      actionCode: item.actionCode ?? item.ActionCode ?? null,
      interOnCurrentProd: item.interOnCurrentProd ?? item.InterOnCurrentProd ?? null,
      interOnOtherProds: item.interOnOtherProds ?? item.InterOnOtherProds ?? null,
      interOnOtherProdTypes: item.interOnOtherProdTypes ?? item.InterOnOtherProdTypes ?? null,
      interOnUnitLevel: item.interOnUnitLevel ?? item.InterOnUnitLevel ?? null,
      interAllProdButCurr: item.interAllProdButCurr ?? item.InterAllProdButCurr ?? null,
      interCode: item.interCode ?? item.InterCode ?? null,
      effDate: item.effDate ?? item.EffDate ?? null,
      termDate: item.termDate ?? item.TermDate ?? null,
      insertDate: item.insertDate ?? item.InsertDate ?? null,
      insertUser: item.insertUser ?? item.InsertUser ?? null
    };
  }
}
