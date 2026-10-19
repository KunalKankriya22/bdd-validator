import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../core/constants/api.constants';
import {
  AttributeServiceCodeDto,
  AttributeServiceCodeModel,
  AttributeServiceCodeQueryDto,
  UpdateAttributeServiceCodeDto,
  AttributeGroupDropdownDto,
  ApiResponse
} from '../models/attribute-service-code.model';

@Injectable({
  providedIn: 'root'
})
export class AttributeServiceCodeApiService {
  private readonly apiService = inject(ApiService);

  getAttributeServiceCodes(
    take: number,
    skip: number,
    queryParams?: AttributeServiceCodeQueryDto
  ): Observable<{ data: AttributeServiceCodeModel[]; totalCount: number }> {
    const endpoint = API.ATTRIBUTE_SERVICE_CODES.LIST(take, skip);

    const body: AttributeServiceCodeQueryDto = {
      attributeGroup: queryParams?.attributeGroup || null,
      searchKeyword: queryParams?.searchKeyword || null,
      sortColumn: queryParams?.sortColumn || null,
      sortOrder: queryParams?.sortOrder || null,
      filterPrice: queryParams?.filterPrice || null,
      filterServiceCode: queryParams?.filterServiceCode || null
    };

    return this.apiService.post<ApiResponse<AttributeServiceCodeDto[]>>(endpoint, body).pipe(
      map(response => {
        const dataWithUniqueIds = (response.data || []).map((item, index) => ({
          ...item,
          uniqueRowId: `${item.attribGroup}-${item.attribCode}-${index}`
        }));

        return {
          data: dataWithUniqueIds,
          totalCount: response.total || 0
        };
      }),
      catchError(error => {
        console.error('Error fetching attribute service codes:', error);
        return throwError(() => error);
      })
    );
  }

  getAttributeServiceCodeById(
    attributeGroup: string,
    attributeCode: string
  ): Observable<AttributeServiceCodeDto> {
    const endpoint = API.ATTRIBUTE_SERVICE_CODES.GET_BY_ID(attributeGroup, attributeCode);

    return this.apiService.get<ApiResponse<AttributeServiceCodeDto>>(endpoint).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching attribute service code by ID:', error);
        return throwError(() => error);
      })
    );
  }

  updateAttributeServiceCode(
    attributeGroup: string,
    attributeCode: string,
    updateDto: UpdateAttributeServiceCodeDto
  ): Observable<any> {
    const endpoint = API.ATTRIBUTE_SERVICE_CODES.UPDATE(attributeGroup, attributeCode);

    const body: UpdateAttributeServiceCodeDto = {
      price: updateDto.price !== undefined ? updateDto.price : null,
      serviceCode: updateDto.serviceCode !== undefined ? updateDto.serviceCode : null,
      creditFlag: updateDto.creditFlag !== undefined ? updateDto.creditFlag : null
    };

    return this.apiService.put<ApiResponse<any>>(endpoint, body).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error updating attribute service code:', error);
        return throwError(() => error);
      })
    );
  }

  getFilterPrices(attributeGroup: string): Observable<string[]> {
    const endpoint = API.ATTRIBUTE_SERVICE_CODES.FILTER_PRICES(attributeGroup);

    return this.apiService.get<ApiResponse<string[]>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching filter prices:', error);
        return throwError(() => error);
      })
    );
  }

  getFilterServiceCodes(attributeGroup: string): Observable<string[]> {
    const endpoint = API.ATTRIBUTE_SERVICE_CODES.FILTER_SERVICE_CODES(attributeGroup);

    return this.apiService.get<ApiResponse<string[]>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching filter service codes:', error);
        return throwError(() => error);
      })
    );
  }

  deleteAttributeServiceCode(
    attributeGroup: string,
    attributeCode: string
  ): Observable<any> {
    const endpoint = API.ATTRIBUTE_SERVICE_CODES.DELETE(attributeGroup, attributeCode);

    return this.apiService.delete<ApiResponse<any>>(endpoint).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error deleting attribute service code:', error);
        return throwError(() => error);
      })
    );
  }

  getAttributeGroupsDropdown(): Observable<AttributeGroupDropdownDto[]> {
    const endpoint = API.ATTRIBUTE_SERVICE_CODES.GROUPS_DROPDOWN;

    return this.apiService.get<ApiResponse<AttributeGroupDropdownDto[]>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching attribute groups dropdown:', error);
        return throwError(() => error);
      })
    );
  }
}
