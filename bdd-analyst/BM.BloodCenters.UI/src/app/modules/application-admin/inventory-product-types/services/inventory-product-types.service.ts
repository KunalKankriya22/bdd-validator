import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  InventoryProductTypeModel,
  InventoryProductTypeParamsDto,
  InventoryProductTypeCreateDto,
  InventoryProductTypeUpdateDto,
  InventoryProductTypeFilterLov
} from '../models/inventory-product-types.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  Success?: boolean;
  Message?: string;
  Error?: string;
  StatusCode?: number;
  Data?: T[];
  Item?: T;
  Total?: number;
}

/**
 * Service for managing Inventory Product Types data
 * Handles CRUD operations and filter/search functionality
 */
@Injectable({
  providedIn: 'root'
})
export class InventoryProductTypesService {
  private readonly apiService = inject(ApiService);

  /**
   * Fetches Inventory Product Types table data with pagination, search, and filters
   * @param take Number of records to fetch
   * @param skip Number of records to skip (for pagination)
   * @param params Search, filter, and sort parameters
   * @returns Observable with data array and total record count
   */
  getInventoryProductTypes(
    take: number,
    skip: number,
    params: InventoryProductTypeParamsDto
  ): Observable<{ data: InventoryProductTypeModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.INVENTORY_PRODUCT_TYPES_LIST(take, skip);

    return this.apiService.post<ReturnResult<any>>(endpoint, params).pipe(
      map(response => {
        const data = (response.Data || []).map((item: any) => this.transformToCamelCase(item));
        return {
          data,
          totalRecords: response.Total || 0
        };
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Transforms backend PascalCase response to frontend camelCase
   */
  private transformToCamelCase(item: any): InventoryProductTypeModel {
    return {
      productType: item.ProductType,
      shortName: item.ShortName,
      description: item.Description,
      price: item.StandardPrice,
      lifeSpan: item.LifeSpan,
      lifeSpanInd: item.LifeSpanIndicator,
      sortSequence: item.SortSequence,
      productGrouping: item.ProductGrouping,
      aboOnly: item.AboOnly,
      rhRequired: item.ShipAnyRh,
      importAllowed: item.AboFlag,
      pooledProduct: item.PoolProduct,
      specialInventory: item.SpecialProductType,
      tempMax: item.MaximumTemp,
      tempMin: item.MinimumTemp,
      effectiveDate: item.EffectiveDate,
      terminationDate: item.TerminationDate,
      modificationDate: item.LastModifiedDate
    };
  }

  /**
   * Fetches a single Inventory Product Type record by product type code
   * @param productType The product type code to fetch
   * @returns Observable with the Inventory Product Type record
   */
  getInventoryProductTypeByCode(productType: string): Observable<InventoryProductTypeModel> {
    const endpoint = API.APPLICATION_ADMIN.INVENTORY_PRODUCT_TYPES_BY_CODE(productType);

    return this.apiService.get<any>(endpoint).pipe(
      map(response => {
        // The API returns the data directly (not wrapped in Item/Data)
        // Check if response has ProductType field (PascalCase from API)
        if (response && response.ProductType) {
          return this.transformToCamelCase(response);
        }

        // Fallback: check for wrapped response
        const item = response.Item || response.Data?.[0];
        return item ? this.transformToCamelCase(item) : ({} as InventoryProductTypeModel);
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Gets all available dropdown values from master tables.
   * Used by add/edit forms to show all possible values.
   * @returns Observable with available dropdown data
   */
  getAvailableDropdowns(): Observable<ReturnResult<InventoryProductTypeFilterLov>> {
    return this.apiService.get<ReturnResult<InventoryProductTypeFilterLov>>(
      API.APPLICATION_ADMIN.INVENTORY_PRODUCT_TYPES_AVAILABLE_DROPDOWNS
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Gets filter options showing only values that exist in actual data.
   * Used by filter panel to prevent empty filter results.
   * @returns Observable with filter options data
   */
  getFilterOptions(): Observable<ReturnResult<InventoryProductTypeFilterLov>> {
    return this.apiService.get<ReturnResult<InventoryProductTypeFilterLov>>(
      API.APPLICATION_ADMIN.INVENTORY_PRODUCT_TYPES_FILTER_OPTIONS
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * DEPRECATED: Use getAvailableDropdowns() for add/edit forms or getFilterOptions() for filter panel
   * @deprecated
   */
  getInventoryProductTypeFilters(): Observable<ReturnResult<any>> {
    return this.apiService.get<ReturnResult<any>>(
      API.APPLICATION_ADMIN.INVENTORY_PRODUCT_TYPES_FILTERS
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Fetches available product types for Add dialog Type dropdown
   * Returns product types from VSERV_PRODUCTS that are active and not yet configured
   * Backend returns List<ProductTypeDropdownDto> directly (not wrapped in ReturnResult)
   * @returns Observable with available product types array
   */
  getAvailableProductTypes(): Observable<any> {
    return this.apiService.get<any>(
      API.APPLICATION_ADMIN.INVENTORY_PRODUCT_TYPES_AVAILABLE
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Creates a new Inventory Product Type record
   * @param payload The Inventory Product Type data to create
   * @returns Observable with creation result
   */
  createInventoryProductType(payload: InventoryProductTypeCreateDto): Observable<any> {
    return this.apiService.post(
      API.APPLICATION_ADMIN.INVENTORY_PRODUCT_TYPES_CREATE,
      payload
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Updates an existing Inventory Product Type record
   * @param _productType The code of the record to update (not used - code is in payload)
   * @param payload The updated Inventory Product Type data
   * @returns Observable with update result
   */
  updateInventoryProductType(_productType: string, payload: InventoryProductTypeUpdateDto): Observable<any> {
    return this.apiService.put(
      API.APPLICATION_ADMIN.INVENTORY_PRODUCT_TYPES_UPDATE,
      payload
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Deletes an Inventory Product Type record
   * @param productType The code of the record to delete
   * @returns Observable with deletion result
   */
  deleteInventoryProductType(productType: string): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.INVENTORY_PRODUCT_TYPES_DELETE(productType);

    return this.apiService.delete(endpoint).pipe(
      catchError(error => throwError(() => error))
    );
  }
}
