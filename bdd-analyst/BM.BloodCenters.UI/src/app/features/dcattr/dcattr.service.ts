import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API } from '../../core/constants/api.constants';
import {
  ApiResponse,
  ValidateDeleteUnitRequestDto,
  ValidateDeleteUnitResponseDto,
  PreviewProductCodeRequestDto,
  PreviewProductCodeResponseDto,
  DeleteAttributeRequestDto,
  DeleteAttributeResponseDto,
  DeletableAttributeDto,
  ProductCodeDto,
  ProductAttributeLogDto,
  ReprintLabelRequestDto
} from './dcattr.models';

@Injectable({
  providedIn: 'root'
})
export class DcattrService {
  private readonly http = inject(HttpClient);

  validateUnit(request: ValidateDeleteUnitRequestDto): Observable<ValidateDeleteUnitResponseDto> {
    return this.http.post<ApiResponse<ValidateDeleteUnitResponseDto>>(API.DELETE_COMPONENT_ATTRIBUTE.VALIDATE_UNIT, request).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to validate unit');
      }),
      catchError(this.handleError)
    );
  }

  getProductCodes(unitId: string, collDate: string, codeScheme: string): Observable<ProductCodeDto[]> {
    const params = { unitId, collDate, codeScheme };
    return this.http.get<ApiResponse<ProductCodeDto[]>>(API.DELETE_COMPONENT_ATTRIBUTE.PRODUCT_CODES, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(this.handleError)
    );
  }

  getDeletableAttributes(
    unitId: string,
    collDate: string,
    productCode: string,
    codeScheme: string
  ): Observable<DeletableAttributeDto[]> {
    const params = { unitId, collDate, productCode, codeScheme };

    return this.http.get<ApiResponse<DeletableAttributeDto[]>>(API.DELETE_COMPONENT_ATTRIBUTE.DELETABLE_ATTRIBUTES, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(this.handleError)
    );
  }

  previewNewProductCode(request: PreviewProductCodeRequestDto): Observable<PreviewProductCodeResponseDto> {
    return this.http.post<ApiResponse<PreviewProductCodeResponseDto>>(API.DELETE_COMPONENT_ATTRIBUTE.PREVIEW_NEW_PRODUCT_CODE, request).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to preview new product code');
      }),
      catchError(this.handleError)
    );
  }

  deleteAttribute(request: DeleteAttributeRequestDto): Observable<DeleteAttributeResponseDto> {
    return this.http.post<ApiResponse<DeleteAttributeResponseDto>>(API.DELETE_COMPONENT_ATTRIBUTE.DELETE, request).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to delete attribute');
      }),
      catchError(this.handleError)
    );
  }

  reprintLabel(request: ReprintLabelRequestDto): Observable<any> {
    return this.http.post<ApiResponse<any>>(API.DELETE_COMPONENT_ATTRIBUTE.REPRINT_LABEL, request).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to reprint label');
      }),
      catchError(this.handleError)
    );
  }

  getAttributeHistory(
    unitId: string,
    collDate: string,
    productCode: string
  ): Observable<ProductAttributeLogDto[]> {
    const params = { unitId, collDate, productCode };

    return this.http.get<ApiResponse<ProductAttributeLogDto[]>>(API.DELETE_COMPONENT_ATTRIBUTE.ATTRIBUTE_HISTORY, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while processing your request.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      const apiError = error.error as ApiResponse<any>;

      if (apiError?.error) {
        errorMessage = apiError.error;
      } else if (apiError?.errorResponse?.error) {
        errorMessage = apiError.errorResponse.error;
      } else if (apiError?.message) {
        errorMessage = apiError.message;
      } else if (error.status === 404) {
        errorMessage = 'Resource not found.';
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
