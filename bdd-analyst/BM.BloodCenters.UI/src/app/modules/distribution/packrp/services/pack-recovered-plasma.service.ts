import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { API } from '@core/constants/api.constants';
import { ApiResponse } from '@shared/interfaces/api-response.interface';

import {
  CustomerSelectionDto,
  OrderDto,
  PickSlipQueryDto,
  PickSlipDto,
  PickSlipsQueryResponseDto,
  CreatePickSlipRequestDto,
  CreatePickSlipResponseDto,
  BoxDto,
  CreateBoxRequestDto,
  CreateBoxResponseDto,
  PackProductRequestDto,
  PackProductResponseDto,
  UnpackProductRequestDto,
  UnpackProductResponseDto,
  ProductDto,
  PackedProductDto,
  ProductDetailDto
} from '../models/pack-recovered-plasma.model';

/**
 * Pack Recovered Plasma API Service
 * Handles all API operations for packaging recovered plasma products
 * Base URL: /api/pack-recovered-plasma
 */
@Injectable({
  providedIn: 'root'
})
export class PackRecoveredPlasmaService {
  private readonly http = inject(HttpClient);

  /**
   * Get Customers with Valid Contracts
   * Endpoint: GET /api/v1/pack-recovered-plasma/customers
   */
  getCustomers(searchKeyword?: string): Observable<CustomerSelectionDto[]> {
    let params = new HttpParams();
    if (searchKeyword) {
      params = params.set('searchKeyword', searchKeyword);
    }

    const url = API.PACK_RECOVERED_PLASMA.CUSTOMERS;
    console.log('Calling getCustomers API:', url, 'params:', params.toString());

    return this.http
      .get<ApiResponse<CustomerSelectionDto[]>>(url, { params })
      .pipe(
        map(response => {
          console.log('getCustomers response:', response);
          return response.data || [];
        })
      );
  }

  /**
   * Get Orders for Customer
   * Endpoint: GET /api/v1/pack-recovered-plasma/orders
   */
  getOrders(customerId: string, consigneeId: string): Observable<OrderDto[]> {
    const params = new HttpParams()
      .set('customerId', customerId)
      .set('consigneeId', consigneeId);

    return this.http
      .get<ApiResponse<OrderDto[]>>(
        API.PACK_RECOVERED_PLASMA.ORDERS,
        { params }
      )
      .pipe(map(response => response.data || []));
  }

  /**
   * Query Pick Slips with Filters and Pagination
   * Endpoint: POST /api/v1/pack-recovered-plasma/pick-slips/{take}/{skip}
   */
  queryPickSlips(
    take: number,
    skip: number,
    filters: PickSlipQueryDto
  ): Observable<PickSlipsQueryResponseDto> {
    return this.http
      .post<ApiResponse<PickSlipsQueryResponseDto>>(
        API.PACK_RECOVERED_PLASMA.PICK_SLIPS_QUERY(take, skip),
        filters
      )
      .pipe(
        map(response => ({
          data: response.data?.data || [],
          totalCount: response.data?.totalCount || 0
        }))
      );
  }

  /**
   * Get Pick Slip by ID
   * Endpoint: GET /api/v1/pack-recovered-plasma/pick-slips/{id}
   */
  getPickSlipById(pickSlipId: string): Observable<PickSlipDto> {
    return this.http
      .get<ApiResponse<PickSlipDto>>(
        API.PACK_RECOVERED_PLASMA.PICK_SLIP_BY_ID(pickSlipId)
      )
      .pipe(map(response => response.data!));
  }

  /**
   * Create New Pick Slip
   * Endpoint: POST /api/v1/pack-recovered-plasma/pick-slips
   */
  createPickSlip(dto: CreatePickSlipRequestDto): Observable<CreatePickSlipResponseDto> {
    return this.http
      .post<ApiResponse<CreatePickSlipResponseDto>>(
        API.PACK_RECOVERED_PLASMA.CREATE_PICK_SLIP,
        dto
      )
      .pipe(map(response => response.data!));
  }

  /**
   * Get Boxes for Pick Slip
   * Endpoint: GET /api/v1/pack-recovered-plasma/boxes/{pickSlipId}
   */
  getBoxesByPickSlip(pickSlipId: string): Observable<BoxDto[]> {
    return this.http
      .get<ApiResponse<BoxDto[]>>(
        API.PACK_RECOVERED_PLASMA.BOXES_BY_PICK_SLIP(pickSlipId)
      )
      .pipe(map(response => response.data || []));
  }

  /**
   * Get Box by ID
   * Endpoint: GET /api/v1/pack-recovered-plasma/boxes/detail/{boxId}
   */
  getBoxById(boxId: string): Observable<BoxDto> {
    return this.http
      .get<ApiResponse<BoxDto>>(
        API.PACK_RECOVERED_PLASMA.BOX_BY_ID(boxId)
      )
      .pipe(map(response => response.data!));
  }

  /**
   * Create New Box
   * Endpoint: POST /api/v1/pack-recovered-plasma/boxes
   */
  createBox(dto: CreateBoxRequestDto): Observable<CreateBoxResponseDto> {
    return this.http
      .post<ApiResponse<CreateBoxResponseDto>>(
        API.PACK_RECOVERED_PLASMA.CREATE_BOX,
        dto
      )
      .pipe(map(response => response.data!));
  }

  /**
   * Pack Product into Box
   * Endpoint: POST /api/v1/pack-recovered-plasma/pack
   */
  packProduct(dto: PackProductRequestDto): Observable<PackProductResponseDto> {
    return this.http
      .post<ApiResponse<PackProductResponseDto>>(
        API.PACK_RECOVERED_PLASMA.PACK,
        dto
      )
      .pipe(map(response => response.data!));
  }

  /**
   * Unpack Product from Box
   * Endpoint: POST /api/v1/pack-recovered-plasma/unpack
   */
  unpackProduct(dto: UnpackProductRequestDto): Observable<UnpackProductResponseDto> {
    return this.http
      .post<ApiResponse<UnpackProductResponseDto>>(
        API.PACK_RECOVERED_PLASMA.UNPACK,
        dto
      )
      .pipe(map(response => response.data!));
  }

  /**
   * Get Available Products
   * Endpoint: GET /api/v1/pack-recovered-plasma/products/available
   */
  getAvailableProducts(productCode: string, aboType?: string): Observable<ProductDto[]> {
    let params = new HttpParams().set('productCode', productCode);
    if (aboType) {
      params = params.set('aboType', aboType);
    }

    return this.http
      .get<ApiResponse<ProductDto[]>>(
        API.PACK_RECOVERED_PLASMA.AVAILABLE_PRODUCTS,
        { params }
      )
      .pipe(map(response => response.data || []));
  }

  /**
   * Get Packed Products in Box
   * Endpoint: GET /api/v1/pack-recovered-plasma/packed-products/box/{boxId}
   */
  getPackedProductsByBox(boxId: string): Observable<PackedProductDto[]> {
    return this.http
      .get<ApiResponse<PackedProductDto[]>>(
        API.PACK_RECOVERED_PLASMA.PACKED_PRODUCTS_BY_BOX(boxId)
      )
      .pipe(map(response => response.data || []));
  }

  /**
   * Get Packed Products in Pick Slip
   * Endpoint: GET /api/v1/pack-recovered-plasma/packed-products/pickslip/{pickSlipId}
   */
  getPackedProductsByPickSlip(pickSlipId: string): Observable<PackedProductDto[]> {
    return this.http
      .get<ApiResponse<PackedProductDto[]>>(
        API.PACK_RECOVERED_PLASMA.PACKED_PRODUCTS_BY_PICK_SLIP(pickSlipId)
      )
      .pipe(map(response => response.data || []));
  }

  /**
   * Get Product Details by DIN
   * Endpoint: GET /api/v1/pack-recovered-plasma/products/detail/{din}
   */
  getProductByDin(din: string): Observable<ProductDetailDto> {
    return this.http
      .get<ApiResponse<ProductDetailDto>>(
        API.PACK_RECOVERED_PLASMA.PRODUCT_BY_DIN(din)
      )
      .pipe(map(response => response.data!));
  }

  /**
   * Search Customers for Autocomplete
   * Endpoint: GET /api/v1/pack-recovered-plasma/customers
   */
  searchCustomers(searchKeyword: string): Observable<Array<{ customerId: string; customerName: string }>> {
    const params = new HttpParams().set('searchKeyword', searchKeyword);
    return this.http
      .get<ApiResponse<CustomerSelectionDto[]>>(
        API.PACK_RECOVERED_PLASMA.CUSTOMERS,
        { params }
      )
      .pipe(
        map(response =>
          (response.data || []).map(customer => ({
            customerId: customer.customerId,
            customerName: customer.customerName
          }))
        )
      );
  }

  /**
   * Search Boxes for Autocomplete
   * Maps boxes to simplified format for autocomplete
   */
  searchBoxes(pickSlipId: string): Observable<Array<{ boxId: string; creationDate: string }>> {
    return this.http
      .get<ApiResponse<BoxDto[]>>(
        API.PACK_RECOVERED_PLASMA.BOXES_BY_PICK_SLIP(pickSlipId)
      )
      .pipe(
        map(response =>
          (response.data || []).map(box => ({
            boxId: box.boxId,
            creationDate: box.insertDate ?? ''
          }))
        )
      );
  }
}
