import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ProductTypeItem,
  AttributeItem,
  CatalogNumberItem,
  ProductCodeOption,
  ProductDeterminationResult,
  ComponentCreateRequest,
  ComponentCreateResponseData,
  ReprintLabelRequest,
  ReprintLabelResponseData,
  UnitValidationResult,
  ApiResponse,
} from '../models/pheresis-component.model';

@Injectable({
  providedIn: 'root',
})
export class PheresisComponentApiService {
  private readonly apiService = inject(ApiService);

  getProductTypes(): Observable<ProductTypeItem[]> {
    return this.apiService
      .get<ApiResponse<ProductTypeItem>>(API.PHERESIS_COMPONENTS.PRODUCT_TYPES)
      .pipe(map((response) => response.data));
  }

  getAttributes(productTypeCode: string): Observable<AttributeItem[]> {
    return this.apiService
      .get<ApiResponse<AttributeItem>>(API.PHERESIS_COMPONENTS.ATTRIBUTES(productTypeCode))
      .pipe(map((response) => response.data));
  }

  validateUnit(unitId: string, productType: string): Observable<UnitValidationResult> {
    return this.apiService
      .post<ApiResponse<UnitValidationResult>>(API.PHERESIS_COMPONENTS.VALIDATE_UNIT, {
        unitId,
        productType,
      })
      .pipe(map((response) => response.data[0]));
  }

  getCatalogNumbers(unitId: string, productTypeCode: string): Observable<CatalogNumberItem[]> {
    return this.apiService
      .get<ApiResponse<CatalogNumberItem>>(
        API.PHERESIS_COMPONENTS.CATALOG_NUMBERS(productTypeCode, unitId)
      )
      .pipe(map((response) => response.data));
  }

  getProductCodes(unitId: string, productTypeCode: string): Observable<ProductCodeOption[]> {
    return this.apiService
      .get<ApiResponse<ProductCodeOption>>(
        API.PHERESIS_COMPONENTS.PRODUCT_CODES(unitId, productTypeCode)
      )
      .pipe(map((response) => response.data));
  }

  determineProductCode(
    unitId: string,
    collDate: string,
    productTypeCode: string,
    catalogNumber: string,
    attribCode?: string
  ): Observable<ProductDeterminationResult> {
    return this.apiService
      .post<ApiResponse<ProductDeterminationResult>>(
        API.PHERESIS_COMPONENTS.DETERMINE_PRODUCT,
        {
          unitId,
          collDate,
          productType: productTypeCode,
          catalogNumber,
          attribCode,
        }
      )
      .pipe(map((response) => response.data[0]));
  }

  createComponent(
    request: ComponentCreateRequest
  ): Observable<ApiResponse<ComponentCreateResponseData>> {
    return this.apiService.post<ApiResponse<ComponentCreateResponseData>>(
      API.PHERESIS_COMPONENTS.CREATE,
      request
    );
  }

  reprintLabel(
    request: ReprintLabelRequest
  ): Observable<ApiResponse<ReprintLabelResponseData>> {
    return this.apiService.post<ApiResponse<ReprintLabelResponseData>>(
      API.PHERESIS_COMPONENTS.REPRINT_LABEL,
      request
    );
  }
}
