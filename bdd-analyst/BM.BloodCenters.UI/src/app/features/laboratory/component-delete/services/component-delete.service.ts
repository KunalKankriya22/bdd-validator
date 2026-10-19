import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { Component } from '../models/component.model';
import { ComponentDeleteRequest } from '../models/component-delete-request.model';
import { ComponentInitData } from '../models/component-init-data.model';
import { ProductCodeLov } from '../models/product-code-lov.model';

/**
 * Service for Component Delete operations
 * Handles API calls to backend component-delete controller
 */
@Injectable({
  providedIn: 'root'
})
export class ComponentDeleteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/laboratory/component-delete`;

  /**
   * Get component details by composite key
   * @param unitId - Unit identifier
   * @param collDate - Collection date (YYYY-MM-DD)
   * @param productCode - Product code
   */
  getComponentDetails(
    unitId: string,
    collDate: string,
    productCode: string
  ): Observable<Component> {
    const url = `${this.baseUrl}/component/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}/${encodeURIComponent(productCode)}`;
    return this.http.get<{ item: Component }>(url).pipe(
      map(response => response.item),
      catchError(this.handleError)
    );
  }

  /**
   * Validate if component can be deleted
   * Returns validation result or throws error with specific error code
   * @param unitId - Unit identifier
   * @param collDate - Collection date (YYYY-MM-DD)
   * @param productCode - Product code
   */
  checkDelete(
    unitId: string,
    collDate: string,
    productCode: string
  ): Observable<{ canDelete: boolean; errorCode?: string; errorMessage?: string; requiresConfirmation?: boolean }> {
    const url = `${this.baseUrl}/check-delete/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}/${encodeURIComponent(productCode)}`;
    return this.http.get<{ item: { canDelete: boolean; errorCode?: string; errorMessage?: string; requiresConfirmation?: boolean } }>(url).pipe(
      map(response => response.item),
      catchError(this.handleError)
    );
  }

  /**
   * Delete component (soft delete - sets OUT_OF_SYSTEM_DATS)
   * @param request - Component delete request with optional note
   */
  deleteComponent(request: ComponentDeleteRequest): Observable<void> {
    return this.http.delete<void>(this.baseUrl, { body: request }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get initial data (collection date + product codes) for a unit
   * Combines collection date and product codes LOV into single API call
   * @param unitId - Unit identifier
   * @param codeScheme - Code scheme ('I' for ISBT, 'C' for Codabar)
   */
  getInitData(unitId: string, codeScheme: 'I' | 'C'): Observable<ComponentInitData> {
    const url = `${this.baseUrl}/init-data/${encodeURIComponent(unitId)}?codeScheme=${encodeURIComponent(codeScheme)}`;
    return this.http.get<{ item: ComponentInitData }>(url).pipe(
      map(response => response.item),
      catchError(this.handleError)
    );
  }

  /**
   * Get product codes LOV for a unit
   * @param unitId - Unit identifier
   * @param collDate - Collection date (YYYY-MM-DD)
   * @param codeScheme - Code scheme ('I' for ISBT, 'C' for Codabar) - dynamically determined from unit validation
   */
  getProductCodesLov(unitId: string, collDate: string, codeScheme: 'I' | 'C'): Observable<ProductCodeLov[]> {
    const url = `${this.baseUrl}/lov/product-codes/${encodeURIComponent(unitId)}/${encodeURIComponent(collDate)}?codeScheme=${encodeURIComponent(codeScheme)}`;
    return this.http.get<{ data: ProductCodeLov[] }>(url).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while processing your request.';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error - extract from standardized API response format
      const apiError = error.error;

      if (apiError?.message) {
        // Standard API error response
        errorMessage = apiError.message;
      } else if (apiError?.errorResponse?.error) {
        // Nested error response
        errorMessage = apiError.errorResponse.error;
      } else if (error.status === 404) {
        errorMessage = 'Component not found.';
      } else if (error.status === 400) {
        errorMessage = 'Invalid request. Please check your input.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
    }

    return throwError(() => ({ message: errorMessage, error }));
  }
}
