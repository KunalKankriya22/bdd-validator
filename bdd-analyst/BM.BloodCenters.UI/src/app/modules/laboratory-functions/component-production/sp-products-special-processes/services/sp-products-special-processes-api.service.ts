import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  SpProductModel,
  SpProductQueryParamsDto,
  SpProductCreateDto,
  SpProductUpdateDto,
  ReturnResult,
  LookUp,
  ProductCodeDropdownItem,
  AttribCodeDropdownItem,
} from '../models/sp-products-special-processes.model';

@Injectable({ providedIn: 'root' })
export class SpProductsSpecialProcessesApiService {
  private readonly apiService = inject(ApiService);

  getProducts(
    params: SpProductQueryParamsDto = {}
  ): Observable<{ data: SpProductModel[]; totalRecords: number }> {
    const body: SpProductQueryParamsDto = {
      processCode: params.processCode || null,
      productCode: params.productCode || null,
      attribGroup: params.attribGroup || null,
      attribCode: params.attribCode || null,
      searchKeyword: params.searchKeyword || null,
      sortColumn: params.sortColumn || null,
      sortOrder: params.sortOrder || null,
    };

    return this.apiService.post<ReturnResult<SpProductModel>>(API.PRODUCT_PROCESS.LIST, body).pipe(
      map(response => ({
        data: response?.data || [],
        totalRecords: response?.total || 0,
      })),
      catchError(error => throwError(() => error))
    );
  }

  getProcessCodes(): Observable<LookUp[]> {
    return this.apiService.get<any>(API.PRODUCT_PROCESS.DROPDOWN_PROCESS_CODES).pipe(
      map(response => {
        const items = Array.isArray(response) ? response : (response?.data || []);
        return items.map((item: any) => ({
          code: item.code,
          name: item.codeDesc ?? item.description ?? '',
        }));
      }),
      catchError(error => throwError(() => error))
    );
  }

  getProductCodes(): Observable<LookUp[]> {
    return this.apiService.get<any>(API.PRODUCT_PROCESS.DROPDOWN_PRODUCT_CODES).pipe(
      map(response => {
        const items = Array.isArray(response) ? response : (response?.data || []);
        return items.map((item: any) => ({
          code: item.productCode ?? item.code,
          name: item.productDesc ?? item.codeDesc ?? '',
        }));
      }),
      catchError(error => throwError(() => error))
    );
  }

  getAttributeGroups(productCode: string): Observable<LookUp[]> {
    const endpoint = API.PRODUCT_PROCESS.DROPDOWN_ATTRIBUTE_GROUPS(productCode);
    return this.apiService.get<any>(endpoint).pipe(
      map(response => {
        const items = Array.isArray(response) ? response : (response?.data || []);
        return items.map((item: any) => ({
          code: item.code,
          name: item.codeDesc ?? item.description ?? '',
        }));
      }),
      catchError(error => throwError(() => error))
    );
  }

  getAttributeCodes(productCode: string, attribGroup: string): Observable<LookUp[]> {
    const endpoint = API.PRODUCT_PROCESS.DROPDOWN_ATTRIBUTE_CODES(productCode, attribGroup);
    return this.apiService.get<any>(endpoint).pipe(
      map(response => {
        const items = Array.isArray(response) ? response : (response?.data || []);
        return items.map((item: any) => ({
          code: item.attribCode ?? item.code,
          name: item.attribDesc ?? item.codeDesc ?? '',
        }));
      }),
      catchError(error => throwError(() => error))
    );
  }

  createProduct(dto: SpProductCreateDto): Observable<any> {
    return this.apiService.post(API.PRODUCT_PROCESS.CREATE, dto).pipe(
      catchError(error => throwError(() => error))
    );
  }

  updateProduct(
    processCode: string,
    productCode: string,
    dto: SpProductUpdateDto,
    attribGroup?: string | null,
    attribCode?: string | null
  ): Observable<any> {
    let endpoint = API.PRODUCT_PROCESS.UPDATE(processCode, productCode);
    const queryParams: string[] = [];
    if (attribGroup) queryParams.push(`attribGroup=${encodeURIComponent(attribGroup)}`);
    if (attribCode) queryParams.push(`attribCode=${encodeURIComponent(attribCode)}`);
    if (queryParams.length) endpoint += `?${queryParams.join('&')}`;

    return this.apiService.put(endpoint, dto).pipe(
      catchError(error => throwError(() => error))
    );
  }

  deleteProduct(
    processCode: string,
    productCode: string,
    attribGroup?: string | null,
    attribCode?: string | null
  ): Observable<any> {
    let endpoint = API.PRODUCT_PROCESS.DELETE(processCode, productCode);
    const queryParams: string[] = [];
    if (attribGroup) queryParams.push(`attribGroup=${encodeURIComponent(attribGroup)}`);
    if (attribCode) queryParams.push(`attribCode=${encodeURIComponent(attribCode)}`);
    if (queryParams.length) endpoint += `?${queryParams.join('&')}`;

    return this.apiService.delete(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }
}
