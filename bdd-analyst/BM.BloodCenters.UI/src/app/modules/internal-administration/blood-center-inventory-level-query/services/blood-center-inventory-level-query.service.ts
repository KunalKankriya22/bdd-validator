import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { API } from '@core/constants/api.constants';
import {
  InventoryLevelQueryDto,
  InventoryLevelResultDto,
  InventoryClassDto,
  ProductTypeDto,
  BloodTypeDto,
  AttributeGroupDto,
  AttributeCodeDto,
  ApiResponse
} from '../interfaces/inventory-level.interface';

@Injectable({ providedIn: 'root' })
export class BloodCenterInventoryLevelQueryService {
  private readonly http = inject(HttpClient);

  queryInventoryLevels(queryDto: InventoryLevelQueryDto): Observable<InventoryLevelResultDto[]> {
    return this.http
      .post<ApiResponse<InventoryLevelResultDto[]>>(API.BLOOD_CENTER_INVENTORY_LEVELS.QUERY, queryDto)
      .pipe(map(response => response.data ?? []));
  }

  getInventoryClasses(): Observable<InventoryClassDto[]> {
    return this.http
      .get<ApiResponse<InventoryClassDto[]>>(API.BLOOD_CENTER_INVENTORY_LEVELS.INVENTORY_CLASSES)
      .pipe(map(response => response.data ?? []));
  }

  getProductTypes(inventoryType: string = 'MI', customerId: string = 'STANDARD'): Observable<ProductTypeDto[]> {
    const params = new HttpParams()
      .set('inventoryType', inventoryType)
      .set('customerId', customerId);

    return this.http
      .get<ApiResponse<ProductTypeDto[]>>(API.BLOOD_CENTER_INVENTORY_LEVELS.PRODUCT_TYPES, { params })
      .pipe(map(response => response.data ?? []));
  }

  getBloodTypes(inventoryType: string = 'MI', productType?: string): Observable<BloodTypeDto[]> {
    let params = new HttpParams().set('inventoryType', inventoryType);
    if (productType) params = params.set('productType', productType);

    return this.http
      .get<ApiResponse<BloodTypeDto[]>>(API.BLOOD_CENTER_INVENTORY_LEVELS.BLOOD_TYPES, { params })
      .pipe(map(response => response.data ?? []));
  }

  getAttributeGroups(): Observable<AttributeGroupDto[]> {
    return this.http
      .get<ApiResponse<AttributeGroupDto[]>>(API.BLOOD_CENTER_INVENTORY_LEVELS.ATTRIBUTE_GROUPS)
      .pipe(map(response => response.data ?? []));
  }

  getAttributeCodes(attributeGroup: string): Observable<AttributeCodeDto[]> {
    return this.http
      .get<ApiResponse<AttributeCodeDto[]>>(API.BLOOD_CENTER_INVENTORY_LEVELS.ATTRIBUTE_CODES(attributeGroup))
      .pipe(map(response => response.data ?? []));
  }
}
