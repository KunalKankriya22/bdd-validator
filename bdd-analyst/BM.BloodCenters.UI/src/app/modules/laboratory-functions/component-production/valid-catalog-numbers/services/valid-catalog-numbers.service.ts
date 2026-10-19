import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API } from '@core/constants/api.constants';
import {
  ValidCatalogDto,
  ValidCatalogQueryParams,
  CreateValidCatalogDto,
  UpdateValidCatalogDto,
  CatalogNumberDropdownDto,
  ManufacturerDropdownDto,
  BagTypeDropdownDto,
  AnticoagulantDropdownDto,
  AdditiveDropdownDto,
  PaginatedResponse,
  ApiResponse,
} from '../models/valid-catalog-numbers.model';

@Injectable({
  providedIn: 'root',
})
export class ValidCatalogNumbersService {
  private readonly http = inject(HttpClient);

  /**
   * Get all valid catalog numbers with pagination
   * POST /api/v1/valid-catalog-numbers/{take}/{skip}
   */
  getValidCatalogs(
    take: number,
    skip: number,
    queryParams?: ValidCatalogQueryParams,
  ): Observable<PaginatedResponse<ValidCatalogDto>> {
    const url = API.VALID_CATALOG_NUMBERS.LIST(take, skip);
    const body = queryParams || {};

    return this.http.post<ApiResponse<ValidCatalogDto>>(url, body).pipe(
      map((response) => ({
        items: Array.isArray(response.data) ? response.data : [],
        totalRecords: response.total || 0,
      }))
    );
  }

  /**
   * Get valid catalog number by ID
   * GET /api/v1/valid-catalog-numbers/{catalogNumber}
   */
  getValidCatalogById(catalogNumber: string): Observable<ValidCatalogDto | null> {
    const url = API.VALID_CATALOG_NUMBERS.GET_BY_ID(catalogNumber);

    return this.http.get<ApiResponse<ValidCatalogDto>>(url).pipe(
      map((response) => {
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          return response.data[0];
        }
        return null;
      })
    );
  }

  /**
   * Create valid catalog number
   * POST /api/v1/valid-catalog-numbers
   */
  createValidCatalog(data: CreateValidCatalogDto): Observable<ApiResponse<ValidCatalogDto>> {
    return this.http.post<ApiResponse<ValidCatalogDto>>(API.VALID_CATALOG_NUMBERS.CREATE, data);
  }

  /**
   * Update valid catalog number
   * PUT /api/v1/valid-catalog-numbers/{catalogNumber}
   */
  updateValidCatalog(
    catalogNumber: string,
    data: UpdateValidCatalogDto,
  ): Observable<ApiResponse<ValidCatalogDto>> {
    const url = API.VALID_CATALOG_NUMBERS.UPDATE(catalogNumber);
    return this.http.put<ApiResponse<ValidCatalogDto>>(url, data);
  }

  /**
   * Get manufacturer codes (lookup)
   * GET /api/v1/valid-catalog-numbers/manufacturer-codes
   */
  getManufacturers(): Observable<ManufacturerDropdownDto[]> {
    return this.http.get<ManufacturerDropdownDto[]>(API.VALID_CATALOG_NUMBERS.MANUFACTURERS);
  }

  /**
   * Get bag types (lookup)
   * GET /api/v1/valid-catalog-numbers/bag-types
   */
  getBagTypes(): Observable<BagTypeDropdownDto[]> {
    return this.http.get<BagTypeDropdownDto[]>(API.VALID_CATALOG_NUMBERS.BAG_TYPES);
  }

  /**
   * Get anticoagulants (lookup)
   * GET /api/v1/valid-catalog-numbers/anticoagulants
   */
  getAnticoagulants(): Observable<AnticoagulantDropdownDto[]> {
    return this.http.get<AnticoagulantDropdownDto[]>(API.VALID_CATALOG_NUMBERS.ANTICOAGULANTS);
  }

  /**
   * Get additives (lookup)
   * GET /api/v1/valid-catalog-numbers/additives
   */
  getAdditives(): Observable<AdditiveDropdownDto[]> {
    return this.http.get<AdditiveDropdownDto[]>(API.VALID_CATALOG_NUMBERS.ADDITIVES);
  }

  /**
   * Get catalog numbers for filter dropdown
   * GET /api/v1/valid-catalog-numbers/filter/catalog-numbers
   */
  getFilterCatalogNumbers(): Observable<CatalogNumberDropdownDto[]> {
    return this.http.get<CatalogNumberDropdownDto[]>(API.VALID_CATALOG_NUMBERS.FILTER.CATALOG_NUMBERS);
  }

  /**
   * Get manufacturers for filter dropdown
   * GET /api/v1/valid-catalog-numbers/filter/manufacturers
   */
  getFilterManufacturers(): Observable<ManufacturerDropdownDto[]> {
    return this.http.get<ManufacturerDropdownDto[]>(API.VALID_CATALOG_NUMBERS.FILTER.MANUFACTURERS);
  }
}
