import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import { API } from '@core/constants/api.constants';
import {
  ValidateUnitResponse,
  ProductOption,
  ComponentPrefix,
  ComponentNoteData,
  SaveNoteRequest,
  SaveNoteResponse,
} from '../models/component-notes.model';

@Injectable({
  providedIn: 'root'
})
export class ComponentNotesApiService {
  private http = inject(HttpClient);

  validateUnit(unitId: string): Observable<ValidateUnitResponse> {
    return this.http.get<{
      success: boolean;
      message: string;
      statusCode: number;
      data: ValidateUnitResponse[];
      errorCode?: string;
      errorResponse?: { errorCode: string; error: string };
    }>(API.COMPONENT_NOTES.VALIDATE_UNIT(unitId), {
      context: new HttpContext().set(SKIP_ERROR_TOAST, true)
    }).pipe(
      map(response => {
        if (!response.success || !response.data || response.data.length === 0) {
          const error: any = new Error(response.errorResponse?.error || response.message || 'Failed to validate unit');
          error.errorCode = response.errorResponse?.errorCode || response.errorCode;
          throw error;
        }
        return response.data[0];
      })
    );
  }

  getProducts(unitId: string, collDate: string, codeScheme: string = 'I'): Observable<ProductOption[]> {
    const params = new HttpParams()
      .set('collDate', collDate)
      .set('codeScheme', codeScheme);

    return this.http.get<{
      success: boolean;
      data: ProductOption[];
    }>(API.COMPONENT_NOTES.PRODUCTS(unitId), { params }).pipe(
      map(response => {
        if (!response.success || !response.data) {
          return [];
        }
        return response.data;
      })
    );
  }

  getComponentPrefixes(unitId: string, collDate: string, productCode: string): Observable<ComponentPrefix[]> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('collDate', collDate)
      .set('productCode', productCode);

    return this.http.get<{
      success: boolean;
      data: ComponentPrefix[];
    }>(API.COMPONENT_NOTES.COMPONENT_PREFIXES, { params }).pipe(
      map(response => response.success && response.data ? response.data : [])
    );
  }

  getNote(unitId: string, collDate: string, productCode: string, componentPrefix: string): Observable<ComponentNoteData | null> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('collDate', collDate)
      .set('productCode', productCode)
      .set('componentPrefix', componentPrefix);

    return this.http.get<{
      success: boolean;
      data: ComponentNoteData[];
    }>(API.COMPONENT_NOTES.NOTE, {
      params,
      context: new HttpContext().set(SKIP_ERROR_TOAST, true)
    }).pipe(
      map(response => {
        if (response.success && response.data && response.data.length > 0) {
          return response.data[0];
        }
        return null;
      })
    );
  }

  saveNote(request: SaveNoteRequest): Observable<SaveNoteResponse> {
    return this.http.post<{
      success: boolean;
      message: string;
      errorCode?: string;
      data: SaveNoteResponse[];
      errorResponse?: { errorCode: string; error: string };
    }>(API.COMPONENT_NOTES.NOTE, request).pipe(
      map(response => {
        if (!response.success) {
          const error: any = new Error(response.errorResponse?.error || response.message || 'Failed to save note');
          error.errorCode = response.errorResponse?.errorCode || response.errorCode;
          throw error;
        }
        const data = response.data?.[0] || { noteId: '' };
        return { ...data, message: response.message };
      })
    );
  }
}
