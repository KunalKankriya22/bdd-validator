import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  ApiResponse,
  ConsigneeLovDto,
  OrderLovDto,
  ProductTypeLovDto,
  ProductCodeLovDto,
  BloodTypeLovDto,
  BoxLovDto,
  DiscardProductDto,
  ValidateUnitResponseDto,
  ValidateConsigneeRequestDto,
  ValidateConsigneeResponseDto,
  ValidateProductRequestDto,
  PackProductsRequestDto,
  PackProductsResponseDto,
  PackInvRejectsQueryDto,
  CloseBoxDto,
  CreateNewBoxDto,
  CreateNewBoxResponseDto
} from '../models/pack-inv-rejects.model';

const SKIP = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

@Injectable({
  providedIn: 'root'
})
export class PackInvRejectsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.PACK_INV_REJECTS_TO_SALVAGE.BASE}`;

  validateUnit(unitId: string): Observable<ValidateUnitResponseDto> {
    return this.http
      .post<ApiResponse<ValidateUnitResponseDto>>(`${this.baseUrl}/validate-unit`, { unitId }, SKIP)
      .pipe(map(response => response.data));
  }

  getConsignees(searchText?: string): Observable<ConsigneeLovDto[]> {
    const paramObj: Record<string, string> = { discardOption: 'ALL' };
    if (searchText) {
      paramObj['searchText'] = searchText;
    }
    const params = new HttpParams({ fromObject: paramObj });

    return this.http
      .get<ApiResponse<ConsigneeLovDto[]>>(`${this.baseUrl}/consignees`, { params, ...SKIP })
      .pipe(map(response => response.data));
  }

  validateConsignee(request: ValidateConsigneeRequestDto): Observable<ValidateConsigneeResponseDto> {
    return this.http
      .post<ApiResponse<ValidateConsigneeResponseDto>>(`${this.baseUrl}/validate-consignee`, request, SKIP)
      .pipe(map(response => response.data));
  }

  getOrders(customerId: string, consigneeId: string): Observable<OrderLovDto[]> {
    const params = new HttpParams()
      .set('customerId', customerId)
      .set('consigneeId', consigneeId);

    return this.http
      .get<ApiResponse<OrderLovDto[]>>(`${this.baseUrl}/orders`, { params, ...SKIP })
      .pipe(map(response => response.data));
  }

  getProductTypes(customerId: string, consigneeId: string): Observable<ProductTypeLovDto[]> {
    const params = new HttpParams()
      .set('customerId', customerId)
      .set('consigneeId', consigneeId);

    return this.http
      .get<ApiResponse<ProductTypeLovDto[]>>(`${this.baseUrl}/product-types`, { params, ...SKIP })
      .pipe(map(response => response.data));
  }

  getProductCodes(unitId: string, customerId: string, consigneeId: string, codeScheme: string): Observable<ProductCodeLovDto[]> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('customerId', customerId)
      .set('consigneeId', consigneeId)
      .set('codeScheme', codeScheme);

    return this.http
      .get<ApiResponse<ProductCodeLovDto[]>>(`${this.baseUrl}/product-codes`, { params, ...SKIP })
      .pipe(map(response => response.data));
  }

  getBloodTypes(unitId: string, productCode: string, codeScheme: string): Observable<BloodTypeLovDto[]> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('productCode', productCode)
      .set('codeScheme', codeScheme);

    return this.http
      .get<ApiResponse<BloodTypeLovDto[]>>(`${this.baseUrl}/blood-types`, { params, ...SKIP })
      .pipe(map(response => response.data));
  }

  getBoxes(consigneeId: string, productType?: string): Observable<BoxLovDto[]> {
    let params = new HttpParams().set('consigneeId', consigneeId);

    if (productType) {
      params = params.set('productType', productType);
    }

    return this.http
      .get<ApiResponse<BoxLovDto[]>>(`${this.baseUrl}/open-boxes`, { params, ...SKIP })
      .pipe(map(response => response.data));
  }

  getBoxContents(boxId: string): Observable<DiscardProductDto[]> {
    return this.http
      .get<ApiResponse<DiscardProductDto[]>>(
        `${environment.apiUrl}${API.PACK_INV_REJECTS_TO_SALVAGE.BOX_CONTENTS(boxId)}`,
        SKIP
      )
      .pipe(map(response => response.data));
  }

  queryDiscardProducts(
    take: number,
    skip: number,
    queryDto: PackInvRejectsQueryDto
  ): Observable<{ data: DiscardProductDto[], totalCount: number }> {
    return this.http
      .post<ApiResponse<DiscardProductDto[]>>(`${this.baseUrl}/discard-products/${take}/${skip}`, queryDto, SKIP)
      .pipe(
        map(response => ({
          data: response.data,
          totalCount: response.total ?? response.totalCount ?? 0
        }))
      );
  }

  validateProduct(request: ValidateProductRequestDto): Observable<DiscardProductDto> {
    return this.http
      .post<ApiResponse<DiscardProductDto>>(`${this.baseUrl}/validate-product`, request, SKIP)
      .pipe(map(response => response.data));
  }

  packProducts(request: PackProductsRequestDto): Observable<PackProductsResponseDto> {
    return this.http
      .post<ApiResponse<PackProductsResponseDto>>(`${this.baseUrl}/pack-product`, request, SKIP)
      .pipe(map(response => response.data));
  }

  closeBox(boxId: string, allProperlyPacked = false): Observable<void> {
    const body: CloseBoxDto = { boxId, allProperlyPacked };
    return this.http
      .post<ApiResponse<void>>(`${this.baseUrl}/close-box`, body, SKIP)
      .pipe(map(response => response.data));
  }

  createNewBox(dto: CreateNewBoxDto): Observable<CreateNewBoxResponseDto> {
    return this.http
      .post<ApiResponse<CreateNewBoxResponseDto>>(`${this.baseUrl}/create-new-box`, dto, SKIP)
      .pipe(map(response => response.data));
  }

  unpackProduct(productKey: { unitId: string; productCode: string; aliquot: string; expDate: string }): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.baseUrl}/unpack`, productKey, SKIP)
      .pipe(map(response => response.data));
  }
}
