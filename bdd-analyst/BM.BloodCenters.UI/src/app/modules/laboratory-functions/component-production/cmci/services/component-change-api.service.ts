import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  UnitValidationResultDto,
  ValidAttributeDto,
  ProductTypeDto,
  ChangeAttributeRequestDto,
  ChangeAttributeResponseDto,
  ChangeProductCodeRequestDto,
  ChangeProductCodeResponseDto,
  ReprintLabelRequestDto,
  ReprintLabelResponseDto,
  ProductCodeOption,
  CatalogNumberOption,
  DeriveProductCodeRequestDto,
  DeriveProductCodeResponseDto,
  ApiResponse,
} from '../models/component-change.model';

@Injectable({
  providedIn: 'root',
})
export class ComponentChangeApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Validates if a component/unit can be modified
   * @param unitId Unit identifier (ISBT 128 16-char or Codabar 9/10/12-char)
   * @returns Observable of UnitValidationResultDto
   */
  validateUnit(unitId: string): Observable<UnitValidationResultDto> {
    const url = API.COMPONENT_CHANGES.VALIDATE_UNIT(unitId);
    return this.apiService.get<ApiResponse<UnitValidationResultDto>>(url).pipe(
      map((response) => response?.item as UnitValidationResultDto),
      catchError((error) => {
        console.error('Error validating unit:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Retrieves valid attributes for a specific function and product type
   * @param functionName Function name (e.g., "CPICHNGE")
   * @param productType Product type code (e.g., "RBC", "PLT")
   * @returns Observable of ValidAttributeDto array
   */
  getValidAttributes(functionName: string, productType: string): Observable<ValidAttributeDto[]> {
    const url = API.COMPONENT_CHANGES.ATTRIBUTES(functionName, productType);
    return this.apiService.get<ApiResponse<ValidAttributeDto[]>>(url).pipe(
      map((response) => (response?.data as ValidAttributeDto[]) || []),
      catchError((error) => {
        console.error('Error fetching valid attributes:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Retrieves all valid product types that are currently active
   * @returns Observable of ProductTypeDto array
   */
  getValidProductTypes(): Observable<ProductTypeDto[]> {
    return this.apiService.get<ApiResponse<ProductTypeDto[]>>(API.COMPONENT_CHANGES.PRODUCT_TYPES).pipe(
      map((response) => (response?.data as ProductTypeDto[]) || []),
      catchError((error) => {
        console.error('Error fetching valid product types:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Adds or modifies a component attribute
   * @param request ChangeAttributeRequestDto
   * @returns Observable of ChangeAttributeResponseDto
   */
  changeAttribute(request: ChangeAttributeRequestDto): Observable<ChangeAttributeResponseDto> {
    return this.apiService
      .post<ApiResponse<ChangeAttributeResponseDto>>(API.COMPONENT_CHANGES.CHANGE_ATTRIBUTE, request)
      .pipe(
        map((response) => response?.item as ChangeAttributeResponseDto),
        catchError((error) => {
          console.error('Error changing attribute:', error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Changes the product code of a component
   * @param request ChangeProductCodeRequestDto
   * @returns Observable of ChangeProductCodeResponseDto
   */
  changeProductCode(request: ChangeProductCodeRequestDto): Observable<ChangeProductCodeResponseDto> {
    return this.apiService
      .post<ApiResponse<ChangeProductCodeResponseDto>>(API.COMPONENT_CHANGES.CHANGE_PRODUCT_CODE, request)
      .pipe(
        map((response) => response?.item as ChangeProductCodeResponseDto),
        catchError((error) => {
          console.error('Error changing product code:', error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Reprints the ISBT label for a converted/modified component
   * @param request ReprintLabelRequestDto
   * @returns Observable of ReprintLabelResponseDto
   */
  reprintLabel(request: ReprintLabelRequestDto): Observable<ReprintLabelResponseDto> {
    return this.apiService
      .post<ApiResponse<ReprintLabelResponseDto>>(API.COMPONENT_CHANGES.REPRINT_LABEL, request)
      .pipe(
        map((response) => response?.item as ReprintLabelResponseDto),
        catchError((error) => {
          console.error('Error reprinting label:', error);
          return throwError(() => error);
        }),
      );
  }

  getProductCodes(unitId: string, productType: string): Observable<ProductCodeOption[]> {
    const url = API.COMPONENT_CHANGES.PRODUCT_CODES(unitId, productType);
    return this.apiService.get<ApiResponse<ProductCodeOption[]>>(url).pipe(
      map((response) => (response?.data as ProductCodeOption[]) || []),
      catchError((error) => {
        console.error('Error fetching product codes:', error);
        return throwError(() => error);
      }),
    );
  }

  getCatalogNumbers(unitId: string, productType: string): Observable<CatalogNumberOption[]> {
    const url = API.COMPONENT_CHANGES.CATALOG_NUMBERS(unitId, productType);
    return this.apiService.get<ApiResponse<CatalogNumberOption[]>>(url).pipe(
      map((response) => (response?.data as CatalogNumberOption[]) || []),
      catchError((error) => {
        console.error('Error fetching catalog numbers:', error);
        return throwError(() => error);
      }),
    );
  }

  deriveProductCode(request: DeriveProductCodeRequestDto): Observable<DeriveProductCodeResponseDto> {
    return this.apiService
      .post<ApiResponse<DeriveProductCodeResponseDto>>(API.COMPONENT_CHANGES.DERIVE_PRODUCT_CODE, request)
      .pipe(
        map((response) => response?.item as DeriveProductCodeResponseDto),
        catchError((error) => {
          console.error('Error deriving product code:', error);
          return throwError(() => error);
        }),
      );
  }
}
