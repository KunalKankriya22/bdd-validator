import { Injectable, inject } from '@angular/core';
import { HttpParams, HttpContext } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API } from 'src/app/core/constants/api.constants';
import { ApiService } from 'src/app/shared/services/api.service';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  SetInventoryLevelDto,
  CreateSetInventoryLevelDto,
  UpdateSetInventoryLevelDto,
  SetInventoryLevelQueryDto,
  InventoryClassLOV,
  InventoryTypeLOV,
  ProductTypeLOV,
  BloodTypeLOV,
  AttributeGroupLOV,
  AttributeCodeLOV,
  ApiResponse
} from '../models/setup-inventory-levels.model';

@Injectable({
  providedIn: 'root'
})
export class SetupInventoryLevelsApiService {
  private apiService = inject(ApiService);

  /**
   * Get all inventory levels with filtering, searching, sorting, and pagination
   * POST /api/v1/distributions/set-inventory-levels/{inventoryClass}/{take}/{skip}
   */
  getInventoryLevels(
    inventoryClass: string,
    query: SetInventoryLevelQueryDto,
    take: number,
    skip: number
  ): Observable<{ data: SetInventoryLevelDto[]; total: number }> {
    const url = API.SET_INVENTORY_LEVELS.LIST(inventoryClass, take, skip);

    return this.apiService.post<ApiResponse<SetInventoryLevelDto[]>>(url, query).pipe(
      map(response => ({
        data: response.data || [],
        total: response.totalCount || response.data?.length || 0
      })),
      catchError(error => {
        console.error('Failed to load inventory levels:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get single inventory level by composite key
   * GET /api/v1/distributions/set-inventory-levels/{inventoryClass}
   */
  getInventoryLevel(
    inventoryClass: string,
    inventoryType: string,
    productType: string,
    bloodType: string | null,
    suppressErrorNotification?: boolean
  ): Observable<SetInventoryLevelDto | null> {
    const url = API.SET_INVENTORY_LEVELS.GET(inventoryClass);

    let params = new HttpParams()
      .set('inventoryType', inventoryType)
      .set('productType', productType);

    if (bloodType) params = params.set('bloodType', bloodType);

    const context = suppressErrorNotification
      ? new HttpContext().set(SKIP_ERROR_TOAST, [404])
      : new HttpContext();

    return this.apiService.get<ApiResponse<SetInventoryLevelDto>>(url, { params, context }).pipe(
      map(response => response.data || null),
      catchError(error => {
        if (!suppressErrorNotification) {
          console.error('Failed to load inventory level:', error);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new inventory level
   * POST /api/v1/distributions/set-inventory-levels/{inventoryClass}
   */
  createInventoryLevel(
    inventoryClass: string,
    dto: CreateSetInventoryLevelDto
  ): Observable<SetInventoryLevelDto> {
    const url = API.SET_INVENTORY_LEVELS.CREATE(inventoryClass);

    return this.apiService.post<ApiResponse<SetInventoryLevelDto>>(url, dto).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Failed to create inventory level:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing inventory level
   * PUT /api/v1/distributions/set-inventory-levels/{inventoryClass}
   * Single-Mode: Include inventoryType in query params
   * Dual-Mode: Omit inventoryType from query params
   */
  updateInventoryLevel(
    inventoryClass: string,
    inventoryType: string | null,
    productType: string,
    bloodType: string | null,
    attribGroup: string | null,
    attribCode: string | null,
    effDate: string,
    dto: UpdateSetInventoryLevelDto
  ): Observable<SetInventoryLevelDto> {
    const url = API.SET_INVENTORY_LEVELS.UPDATE(inventoryClass);

    let params = new HttpParams()
      .set('productType', productType)
      .set('effDate', effDate);

    // Single-mode: Include inventoryType in query params
    // Dual-mode: Omit inventoryType
    if (inventoryType) params = params.set('inventoryType', inventoryType);

    if (bloodType) params = params.set('bloodType', bloodType);
    if (attribGroup) params = params.set('attribGroup', attribGroup);
    if (attribCode) params = params.set('attribCode', attribCode);

    return this.apiService.put<ApiResponse<SetInventoryLevelDto>>(url, dto, { params }).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Failed to update inventory level:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete an inventory level
   * DELETE /api/v1/distributions/set-inventory-levels/{inventoryClass}
   */
  deleteInventoryLevel(
    inventoryClass: string,
    inventoryType: string,
    productType: string,
    bloodType: string | null,
    attribGroup: string | null,
    attribCode: string | null,
    effDate: string
  ): Observable<void> {
    const url = API.SET_INVENTORY_LEVELS.DELETE(inventoryClass);

    let params = new HttpParams()
      .set('inventoryType', inventoryType)
      .set('productType', productType)
      .set('effDate', effDate);

    if (bloodType) params = params.set('bloodType', bloodType);
    if (attribGroup) params = params.set('attribGroup', attribGroup);
    if (attribCode) params = params.set('attribCode', attribCode);

    return this.apiService.delete<void>(url, { params }).pipe(
      catchError(error => {
        console.error('Failed to delete inventory level:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get inventory classes LOV
   * GET /api/v1/distributions/set-inventory-levels/inventory-classes
   */
  getInventoryClasses(): Observable<InventoryClassLOV[]> {
    return this.apiService.get<ApiResponse<InventoryClassLOV[]>>(API.SET_INVENTORY_LEVELS.INVENTORY_CLASSES_LOOKUP).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Failed to load inventory classes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get inventory types LOV
   * GET /api/v1/distributions/set-inventory-levels/inventory-types
   */
  getInventoryTypes(): Observable<InventoryTypeLOV[]> {
    return this.apiService.get<ApiResponse<InventoryTypeLOV[]>>(API.SET_INVENTORY_LEVELS.INVENTORY_TYPES_LOOKUP).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Failed to load inventory types:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get product types LOV
   * GET /api/v1/distributions/set-inventory-levels/product-types
   */
  getProductTypes(): Observable<ProductTypeLOV[]> {
    return this.apiService.get<ApiResponse<ProductTypeLOV[]>>(API.SET_INVENTORY_LEVELS.PRODUCT_TYPES_LOOKUP).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Failed to load product types:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get blood types LOV
   * GET /api/v1/distributions/set-inventory-levels/blood-types
   */
  getBloodTypes(): Observable<BloodTypeLOV[]> {
    return this.apiService.get<ApiResponse<BloodTypeLOV[]>>(API.SET_INVENTORY_LEVELS.BLOOD_TYPES_LOOKUP).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Failed to load blood types:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get attribute groups LOV
   * GET /api/v1/distributions/set-inventory-levels/attribute-groups
   */
  getAttributeGroups(): Observable<AttributeGroupLOV[]> {
    return this.apiService.get<ApiResponse<AttributeGroupLOV[]>>(API.SET_INVENTORY_LEVELS.ATTRIBUTE_GROUPS_LOOKUP).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Failed to load attribute groups:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get attribute codes LOV (cascading - requires attribute group)
   * GET /api/v1/distributions/set-inventory-levels/attribute-codes/{attributeGroup}
   */
  getAttributeCodes(attributeGroup: string): Observable<AttributeCodeLOV[]> {
    return this.apiService.get<ApiResponse<AttributeCodeLOV[]>>(API.SET_INVENTORY_LEVELS.ATTRIBUTE_CODES_LOOKUP(attributeGroup)).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error(`Failed to load attribute codes for group ${attributeGroup}:`, error);
        return throwError(() => error);
      })
    );
  }
}
