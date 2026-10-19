import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API } from '@core/constants/api.constants';
import {
  ContainerDto,
  ContainerQueryParams,
  CreateContainerDto,
  UpdateContainerDto,
  ProductTypeDropdownDto,
  ContainerIdDropdownDto,
  PaginatedContainerResponse,
  ApiResponse,
} from '../models/container.model';

@Injectable({
  providedIn: 'root',
})
export class ContainerService {
  private readonly http = inject(HttpClient);

  /**
   * Get catalog details (containers) with pagination
   * POST /api/v1/catalog-details/{take}/{skip}
   */
  getContainers(
    catalogNumber: string,
    take: number,
    skip: number,
    queryParams?: ContainerQueryParams,
  ): Observable<PaginatedContainerResponse> {
    const url = API.VALID_CATALOG_NUMBERS.CATALOG_DETAIL.LIST(take, skip);
    const body = {
      catalogNumber: queryParams?.catalogNumber || '',
      baseCatalogNo: catalogNumber,
      showTerminated: queryParams?.showTerminated ?? null,
      searchKeyword: queryParams?.searchKeyword || '',
      sortColumn: queryParams?.sortColumn || '',
      sortOrder: queryParams?.sortOrder || '',
    };

    return this.http.post<ApiResponse<ContainerDto>>(url, body).pipe(
      map((response) => ({
        items: Array.isArray(response.data) ? response.data : [],
        totalRecords: response.total || 0,
      }))
    );
  }

  /**
   * Create catalog detail (container)
   * POST /api/v1/catalog-details
   */
  createContainer(data: CreateContainerDto): Observable<ApiResponse<ContainerDto>> {
    const url = API.VALID_CATALOG_NUMBERS.CATALOG_DETAIL.CREATE;
    return this.http.post<ApiResponse<ContainerDto>>(url, data);
  }

  /**
   * Update catalog detail (container)
   * PUT /api/v1/catalog-details/{catalogNumber}
   */
  updateContainer(
    catalogNumber: string,
    data: UpdateContainerDto,
  ): Observable<ApiResponse<ContainerDto>> {
    const url = API.VALID_CATALOG_NUMBERS.CATALOG_DETAIL.UPDATE(catalogNumber);
    return this.http.put<ApiResponse<ContainerDto>>(url, data);
  }

  /**
   * Get product types (lookup)
   * GET /api/v1/valid-catalog-numbers/catalog-detail/product-types
   */
  getProductTypes(): Observable<ProductTypeDropdownDto[]> {
    return this.http.get<ProductTypeDropdownDto[]>(API.VALID_CATALOG_NUMBERS.CATALOG_DETAIL.PRODUCT_TYPES);
  }

  /**
   * Get container IDs (lookup)
   * GET /api/v1/valid-catalog-numbers/catalog-detail/container-ids
   */
  getContainerIds(): Observable<ContainerIdDropdownDto[]> {
    return this.http.get<ContainerIdDropdownDto[]>(API.VALID_CATALOG_NUMBERS.CATALOG_DETAIL.CONTAINER_IDS);
  }

  /**
   * Get catalog numbers for filter dropdown
   * GET /api/v1/catalog-details/filter/catalog-numbers?baseCatalogNo={baseCatalogNo}
   */
  getFilterCatalogNumbers(baseCatalogNo: string): Observable<ContainerIdDropdownDto[]> {
    return this.http.get<ContainerIdDropdownDto[]>(API.VALID_CATALOG_NUMBERS.CATALOG_DETAIL.FILTER.CATALOG_NUMBERS(baseCatalogNo));
  }
}
