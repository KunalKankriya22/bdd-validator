import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, shareReplay, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  DockingTypeOption,
  LovOption,
  AttributeCodeLovOption,
  ProductCodeLovOption,
  ValidateUnitForDockingRequest,
  IsbtBarcodeParseResult
} from '../models/sterile-docking-definition.model';

export interface ApiResponse<T> {
  success: boolean;
  item?: T;  // API returns 'item' not 'data'
  data?: T;  // Keep for backwards compatibility
  message?: string;
  statusCode?: number;
  errorResponse?: { errorCode: string; error: string };
}

/**
 * Service for fetching List of Values (LOVs) for Sterile Docking Definition
 * Uses a single /filters endpoint that returns all dropdown data
 */
@Injectable({ providedIn: 'root' })
export class SterileDockingLovService {
  private readonly apiService = inject(ApiService);
  private filtersCache$?: Observable<any>;

  /**
   * Get all filter dropdown data in one call
   * Response is cached using shareReplay
   */
  getFilters(): Observable<any> {
    if (!this.filtersCache$) {
      this.filtersCache$ = this.apiService
        .get<ApiResponse<any>>(API.STERILE_DOCKING_DEFINITION.FILTERS)
        .pipe(
          map(response => {
            // THIS API returns data in response.item (not response.data like other modules)
            const rawData = response.item || {};
            return this.transformFiltersResponse(rawData);
          }),
          shareReplay(1),
          catchError((error) => {
            console.error('[SterileDockingLovService] Error loading sterile docking filters:', error);
            return of({});
          })
        );
    }
    return this.filtersCache$;
  }

  /**
   * Transform API response with uppercase fields to expected format
   */
  private transformFiltersResponse(rawData: any): any {
    console.log('[SterileDockingLovService] Raw API response keys:', Object.keys(rawData));
    console.log('[SterileDockingLovService] Raw API response:', rawData);

    return {
      // Available from API
      dockingTypes: this.transformToLovOptions(rawData.itemTypes || []),
      machineCodes: this.transformToLovOptions(rawData.sterileMachines || []),
      productCodes: this.transformToProductOptions(rawData.productCodes || []),
      waferLots: this.transformToLovOptions(rawData.waferLots || []),

      catalogNumbers: this.transformToLovOptions(rawData.catalogNumbers || []),
      bagLots: this.transformToLovOptions(rawData.lotNumbers || []),

      // Try to find attribute codes - check various possible field names
      attributeCodes: this.transformToAttributeOptions(
        rawData.attributeCodes ||
        rawData.attributes ||
        rawData.attributeGroups ||
        rawData.itemAttributes ||
        []
      ),

      // Filter types and lots (available from API)
      filterTypes: this.transformToLovOptions(rawData.filterTypes || []),
      filterLots: this.transformToLovOptions(rawData.filterLots || [])
    };
  }

  /**
   * Transform uppercase CODE/DESCRIPTION to lowercase code/description
   */
  private transformToLovOptions(items: any[]): LovOption[] {
    if (!items || !Array.isArray(items)) {
      return [];
    }
    return items.map(item => ({
      code: item.CODE || item.code || '',
      description: item.DESCRIPTION || item.description || ''
    }));
  }

  /**
   * Transform attribute codes (may have additional fields)
   */
  private transformToAttributeOptions(items: any[]): AttributeCodeLovOption[] {
    if (!items || !Array.isArray(items)) {
      return [];
    }
    return items.map(item => ({
      code: item.CODE || item.code || '',
      description: item.DESCRIPTION || item.description || '',
      attributeGroup: item.ATTRIB_GROUP || item.attribGroup || ''
    }));
  }

  /**
   * Transform product codes (may use PRODUCT_CODE field)
   */
  private transformToProductOptions(items: any[]): ProductCodeLovOption[] {
    if (!items || !Array.isArray(items)) {
      return [];
    }
    return items.map(item => ({
      code: item.PRODUCT_CODE || item.CODE || item.code || '',
      description: item.DESCRIPTION || item.description || '',
      shortName: item.SHORT_NAME || item.shortName || '',
      productTypeId: item.PRODUCT_TYPE_ID || item.productTypeId || ''
    }));
  }

  /**
   * Get docking types (BA, FI, SE, FB, NE, BF)
   */
  getDockingTypes(): Observable<DockingTypeOption[]> {
    console.log('[SterileDockingLovService] getDockingTypes() called');
    return this.getFilters().pipe(
      map(filters => {
        const dockingTypes = filters.dockingTypes || [];
        console.log('[SterileDockingLovService] Extracted dockingTypes from filters:', dockingTypes);
        return dockingTypes;
      })
    );
  }

  /**
   * Get machine codes (code_type='STER')
   */
  getMachineCodes(): Observable<LovOption[]> {
    return this.getFilters().pipe(
      map(filters => filters.machineCodes || [])
    );
  }

  /**
   * Get wafer lots (sp_flag='WA')
   */
  getWaferLots(): Observable<LovOption[]> {
    return this.getFilters().pipe(
      map(filters => filters.waferLots || [])
    );
  }

  /**
   * Get filter types (chapter-validated, date-filtered)
   */
  getFilterTypes(): Observable<LovOption[]> {
    return this.getFilters().pipe(
      map(filters => filters.filterTypes || [])
    );
  }

  /**
   * Get filter lots
   */
  getFilterLots(): Observable<LovOption[]> {
    return this.getFilters().pipe(
      map(filters => filters.filterLots || [])
    );
  }

  /**
   * Get attribute codes (dynamic based on docking type + product type)
   */
  getAttributeCodes(): Observable<AttributeCodeLovOption[]> {
    return this.getFilters().pipe(
      map(filters => filters.attributeCodes || [])
    );
  }

  /**
   * Get product codes (for original and derived products)
   */
  getProductCodes(): Observable<ProductCodeLovOption[]> {
    return this.getFilters().pipe(
      map(filters => filters.productCodes || [])
    );
  }

  /**
   * Get catalog numbers
   */
  getCatalogNumbers(): Observable<LovOption[]> {
    return this.getFilters().pipe(
      map(filters => filters.catalogNumbers || [])
    );
  }

  /**
   * Get bag lots
   */
  getBagLots(): Observable<LovOption[]> {
    return this.getFilters().pipe(
      map(filters => filters.bagLots || [])
    );
  }

  /**
   * Validate a unit by ID (for barcode scanning)
   */
  validateUnit(unitId: string): Observable<any> {
    return this.apiService
      .get<ApiResponse<any>>(API.STERILE_DOCKING_DEFINITION.VALIDATE_UNIT(unitId))
      .pipe(
        map(response => response.item || response.data || {}),
        catchError((error) => {
          console.error('[SterileDockingLovService] Error validating unit:', error);
          throw error;
        })
      );
  }

  /**
   * Search units by keyword (for manual entry)
   */
  searchUnits(keyword: string, take: number = 50, skip: number = 0, dockingType?: string): Observable<any[]> {
    return this.apiService
      .post<ApiResponse<any>>(
        API.STERILE_DOCKING_DEFINITION.SEARCH_UNITS(take, skip),
        { keyword, dockingType }
      )
      .pipe(
        map(response => {
          const data = response.item || response.data || [];
          return Array.isArray(data) ? data : [];
        }),
        catchError((error) => {
          console.error('[SterileDockingLovService] Error searching units:', error);
          return of([]);
        })
      );
  }

  /**
   * Enhanced unit validation with docking context (FMB-equivalent checks)
   * Checks interdictions, labeled components, needle mode, bleed times, etc.
   */
  validateUnitForDocking(request: ValidateUnitForDockingRequest): Observable<any> {
    return this.apiService
      .post<ApiResponse<any>>(
        API.STERILE_DOCKING_DEFINITION.VALIDATE_UNIT_FOR_DOCKING,
        request,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
      )
      .pipe(
        catchError((error) => {
          console.error('[SterileDockingLovService] Error validating unit for docking:', error);
          throw error;
        })
      );
  }

  /**
   * Parse ISBT catalog barcode with data identifiers =) and &)
   */
  parseCatalogBarcode(scan: string): Observable<IsbtBarcodeParseResult> {
    return this.apiService
      .post<IsbtBarcodeParseResult>(API.STERILE_DOCKING_DEFINITION.PARSE_CATALOG_BARCODE, { scan })
      .pipe(
        catchError((error) => {
          console.error('[SterileDockingLovService] Error parsing catalog barcode:', error);
          return of({ success: false, errorMessage: 'Failed to parse barcode', scanMode: 'Error' } as IsbtBarcodeParseResult);
        })
      );
  }

  /**
   * Calculate new expiry date based on product life span
   */
  calculateExpiryDate(productCode: string, processDate: string): Observable<any> {
    return this.apiService
      .post<ApiResponse<any>>(API.STERILE_DOCKING_DEFINITION.CALCULATE_EXPIRY_DATE, { productCode, processDate })
      .pipe(
        map(response => response.item || response.data),
        catchError((error) => {
          console.error('[SterileDockingLovService] Error calculating expiry date:', error);
          return of(null);
        })
      );
  }

  /**
   * Calculate derived product code for FB/BF docking via DEL_ATTRIBUTE.ADD_ATTRIBUTE
   */
  calculateDerivedProduct(oldProductCode: string, attribCode?: string, filterType?: string): Observable<{ derivedProduct: string; error?: string }> {
    let url = `${API.STERILE_DOCKING_DEFINITION.CALCULATE_DERIVED_PRODUCT}?oldProductCode=${encodeURIComponent(oldProductCode)}`;
    if (attribCode) {
      url += `&attribCode=${encodeURIComponent(attribCode)}`;
    }
    if (filterType) {
      url += `&filterType=${encodeURIComponent(filterType)}`;
    }
    return this.apiService
      .get<any>(url, { context: new HttpContext().set(SKIP_ERROR_TOAST, true) })
      .pipe(
        map(response => ({ derivedProduct: response.derivedProduct || oldProductCode })),
        catchError((error) => {
          const errorBody = error.error;
          const message = errorBody?.message || 'Error in deriving new product formula / product code';
          const errorCode = errorBody?.errorCode || '9735';
          return of({ derivedProduct: oldProductCode, error: `[${errorCode}] ${message}` });
        })
      );
  }

  /**
   * Get filtered dropdowns by docking type and optional catalog number
   * Bypasses cache — used for cascading dropdown reload
   */
  getFilteredDropdowns(dockingType: string, catalogNumber?: string, productType?: string, filterCatalogNumber?: string): Observable<any> {
    let url = `${API.STERILE_DOCKING_DEFINITION.FILTERS}?dockingType=${encodeURIComponent(dockingType)}`;
    if (catalogNumber) {
      url += `&catalogNumber=${encodeURIComponent(catalogNumber)}`;
    }
    if (productType) {
      url += `&productType=${encodeURIComponent(productType)}`;
    }
    if (filterCatalogNumber) {
      url += `&filterCatalogNumber=${encodeURIComponent(filterCatalogNumber)}`;
    }
    return this.apiService
      .get<ApiResponse<any>>(url)
      .pipe(
        map(response => this.transformFiltersResponse(response.item || {})),
        catchError((error) => {
          console.error('[SterileDockingLovService] Error loading filtered dropdowns:', error);
          return of({});
        })
      );
  }

  /**
   * Get product codes for a specific unit's components
   * Filters by product type for FB/BF docking types
   */
  getUnitProductCodes(unitId: string, productType?: string): Observable<ProductCodeLovOption[]> {
    let url = API.STERILE_DOCKING_DEFINITION.UNIT_PRODUCT_CODES(unitId);
    if (productType) {
      url += `?productType=${encodeURIComponent(productType)}`;
    }
    return this.apiService
      .get<any>(url)
      .pipe(
        map(response => {
          const data = response.data || response.item || [];
          return (Array.isArray(data) ? data : []).map((item: any) => ({
            code: item.CODE || item.code || '',
            description: item.DESCRIPTION || item.description || '',
            shortName: item.SHORT_NAME || item.shortName || '',
            productTypeId: item.PRODUCT_TYPE_ID || item.productTypeId || ''
          }));
        }),
        catchError((error) => {
          console.error('[SterileDockingLovService] Error loading unit product codes:', error);
          return of([]);
        })
      );
  }

  /**
   * Clear the filters cache
   * Call this when chapter changes or data needs to be refreshed
   */
  clearCache(): void {
    this.filtersCache$ = undefined;
  }
}

