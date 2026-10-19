import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ApiResponse,
  OrderPackingDto,
  OrderPackingDetailDto,
  OrderPackingQueryDto,
  CreateBoxRequestDto,
  CreateBoxResponseDto,
  BoxContentsItem,
  PackStatusResponse,
  BoxTypeLookupDto,
  PickSlipLookupDto,
  PackProductRequest,
  PackProductResponse,
  QuarantineProductRequest,
  QuarantineProductResponse,
  CloseBoxRequest
} from '../models/offline-product-packing.model';

/**
 * Offline Product Packing Service
 * Handles all API calls for offline product packing operations
 *
 * API Documentation: offline-product-packing-api-documentation.md
 * Base URL: /api/offline-packing
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineProductPackingService {
  private readonly apiService = inject(ApiService);

  /**
   * Get All Orders with Filtering
   * Endpoint: POST /api/offline-packing/{take}/{skip}
   *
   * @param take - Number of records to return (min: 1, max: 100, default: 10)
   * @param skip - Number of records to skip for pagination (min: 0)
   * @param query - Optional filter/search/sort parameters
   * @returns Observable of paginated orders with total count
   */
  getAllOrders(
    take: number = 10,
    skip: number = 0,
    query?: OrderPackingQueryDto
  ): Observable<ApiResponse<OrderPackingDto>> {
    const endpoint = `${API.OFFLINE_PRODUCT_PACKING.GET_ALL}/${take}/${skip}`;
    return this.apiService.post<ApiResponse<OrderPackingDto>>(
      endpoint,
      query || {}
    );
  }

  /**
   * Search Orders by Keyword
   * Convenience method for autocomplete - searches across order no, customer, ordered by
   *
   * @param searchKeyword - Search keyword (minimum 2 characters recommended)
   * @param take - Number of results (default: 25)
   * @returns Observable of matching orders
   */
  searchOrders(searchKeyword: string, take: number = 25): Observable<OrderPackingDto[]> {
    if (!searchKeyword || searchKeyword.length < 2) {
      return of([]);
    }

    const query: OrderPackingQueryDto = {
      searchKeyword,
      sortColumn: 'OrderNo',
      sortOrder: 'ASC'
    };

    return this.getAllOrders(take, 0, query).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get Order Details
   * Endpoint: GET /api/offline-packing/{orderNo}
   *
   * @param orderNo - Order number (max 14 characters)
   * @returns Observable of order detail with line items
   */
  getOrderDetails(orderNo: string): Observable<ApiResponse<OrderPackingDetailDto>> {
    const endpoint = `${API.OFFLINE_PRODUCT_PACKING.GET_DETAIL}/${encodeURIComponent(orderNo)}`;
    return this.apiService.get<ApiResponse<OrderPackingDetailDto>>(endpoint);
  }

  /**
   * Get Order Details (Single Object)
   * Convenience method that returns the first order from the array response
   *
   * @param orderNo - Order number
   * @returns Observable of single order detail or null
   */
  getOrderDetail(orderNo: string): Observable<OrderPackingDetailDto | null> {
    return this.getOrderDetails(orderNo).pipe(
      map(response => {
        if (response.success && response.data && response.data.length > 0) {
          return response.data[0];
        }
        return null;
      })
    );
  }

  /**
   * Create New Box
   * Endpoint: POST /api/v1/offline-packing/box/create
   *
   * @param request - Box creation request (orderNo, boxType, productGrouping, closeCurrentBox)
   * @returns Observable of new box response
   */
  createBox(request: CreateBoxRequestDto): Observable<ApiResponse<CreateBoxResponseDto>> {
    return this.apiService.post<ApiResponse<CreateBoxResponseDto>>(
      API.OFFLINE_PRODUCT_PACKING.BOX_CREATE,
      request
    );
  }

  /**
   * Pack a Product into a Box
   * Endpoint: POST /api/v1/offline-packing/pack
   *
   * @param request - Pack product request with unit, box, order details
   * @returns Observable of pack product response
   */
  packProduct(request: PackProductRequest): Observable<ApiResponse<PackProductResponse>> {
    return this.apiService.post<ApiResponse<PackProductResponse>>(
      API.OFFLINE_PRODUCT_PACKING.PACK_PRODUCT,
      request
    );
  }

  /**
   * Quarantine a Product
   * Endpoint: POST /api/v1/offline-packing/quarantine
   *
   * @param request - Quarantine request with unit, product, and reason
   * @returns Observable of quarantine response
   */
  quarantineProduct(request: QuarantineProductRequest): Observable<ApiResponse<QuarantineProductResponse>> {
    return this.apiService.post<ApiResponse<QuarantineProductResponse>>(
      API.OFFLINE_PRODUCT_PACKING.QUARANTINE,
      request
    );
  }

  /**
   * Close a Box
   * Endpoint: POST /api/v1/offline-packing/box/close
   *
   * @param request - Close box request with boxId, orderNo, and packing confirmation
   * @returns Observable of close response
   */
  closeBox(request: CloseBoxRequest): Observable<ApiResponse<boolean>> {
    return this.apiService.post<ApiResponse<boolean>>(
      API.OFFLINE_PRODUCT_PACKING.BOX_CLOSE,
      request
    );
  }

  /**
   * Get Pack Status for an Order
   * Endpoint: GET /api/v1/offline-packing/pack-status/{orderNo}
   *
   * @param orderNo - Order number
   * @returns Observable of pack status with packed and allocated products
   */
  getPackStatus(orderNo: string): Observable<ApiResponse<PackStatusResponse>> {
    return this.apiService.get<ApiResponse<PackStatusResponse>>(
      API.OFFLINE_PRODUCT_PACKING.PACK_STATUS(orderNo)
    );
  }

  /**
   * Get Box Contents
   * Endpoint: GET /api/v1/offline-packing/box-contents/{boxId}
   *
   * @param boxId - Box identifier
   * @returns Observable of box contents items
   */
  getBoxContents(boxId: string): Observable<ApiResponse<BoxContentsItem>> {
    return this.apiService.get<ApiResponse<BoxContentsItem>>(
      API.OFFLINE_PRODUCT_PACKING.BOX_CONTENTS(boxId)
    );
  }

  /**
   * Get Box Types Lookup
   * Endpoint: GET /api/v1/offline-packing/lookups/box-types
   *
   * Returns active box types from VSERV_MASTER with CODE_TYPE = 'BOXTP'
   * and valid date range filtering.
   *
   * @returns Observable of box type lookup values
   */
  getBoxTypes(): Observable<BoxTypeLookupDto[]> {
    return this.apiService.get<any>(API.OFFLINE_PRODUCT_PACKING.BOX_TYPES).pipe(
      map(response => {
        // Handle both wrapped and unwrapped response formats
        if (Array.isArray(response)) {
          return response;
        }
        return response?.data || [];
      })
    );
  }

  /**
   * Get Pick Slips Lookup by Order Number
   * Endpoint: GET /api/v1/offline-packing/lookups/pick-slips/{orderNo}
   *
   * Returns pick slips associated with the given order number.
   *
   * @param orderNo - Order number to filter pick slips
   * @returns Observable of pick slip lookup values
   */
  getPickSlips(orderNo: string): Observable<PickSlipLookupDto[]> {
    return this.apiService.get<any>(API.OFFLINE_PRODUCT_PACKING.PICK_SLIPS(orderNo)).pipe(
      map(response => {
        // Handle both wrapped and unwrapped response formats
        let data: any[];
        if (Array.isArray(response)) {
          data = response;
        } else {
          data = response?.data || [];
        }
        // Map to PickSlipLookupDto format (handle different field names)
        return data.map((item: any) => ({
          pickSlipId: item.pickSlipId || item.packSlipId || item.pick_slip_id || item.id || '',
          orderNo: item.orderNo || item.order_no || '',
          customerId: item.customerId || item.customer_id || null,
          createdDate: item.createdDate || item.created_date || null,
          status: item.status || null,
          statusDesc: item.statusDesc || item.status_desc || null
        }));
      })
    );
  }

  /**
   * Get open boxes for an order
   * Endpoint: GET /api/v1/offline-packing/lookups/boxes/{orderNo}
   */
  getOpenBoxes(orderNo: string): Observable<BoxTypeLookupDto[]> {
    return this.apiService.get<BoxTypeLookupDto[]>(API.OFFLINE_PRODUCT_PACKING.OPEN_BOXES(orderNo));
  }

  /**
   * Get box type(s) for an existing box
   * Endpoint: GET /api/v1/offline-packing/lookups/box-type/{boxId}
   */
  getBoxTypeByBoxId(boxId: string): Observable<BoxTypeLookupDto[]> {
    return this.apiService.get<any>(API.OFFLINE_PRODUCT_PACKING.BOX_TYPE_BY_BOX(boxId)).pipe(
      map(response => {
        if (Array.isArray(response)) return response;
        return response?.data || [];
      })
    );
  }

  /**
   * Get product codes for a unit
   * Endpoint: GET /api/v1/offline-packing/lookups/product-codes/{unitId}
   */
  getProductCodes(unitId: string): Observable<BoxTypeLookupDto[]> {
    return this.apiService.get<BoxTypeLookupDto[]>(API.OFFLINE_PRODUCT_PACKING.PRODUCT_CODES(unitId));
  }

  /**
   * Get valid blood types for a unit and product code
   * Endpoint: GET /api/v1/offline-packing/lookups/blood-types/{unitId}/{productCode}
   */
  getValidBloodTypes(unitId: string, productCode: string): Observable<BoxTypeLookupDto[]> {
    return this.apiService.get<BoxTypeLookupDto[]>(API.OFFLINE_PRODUCT_PACKING.BLOOD_TYPES(unitId, productCode));
  }

  /**
   * Get valid aliquots for a unit and product code
   * Endpoint: GET /api/v1/offline-packing/lookups/aliquots/{unitId}/{productCode}
   */
  getValidAliquots(unitId: string, productCode: string): Observable<BoxTypeLookupDto[]> {
    return this.apiService.get<BoxTypeLookupDto[]>(API.OFFLINE_PRODUCT_PACKING.ALIQUOTS(unitId, productCode));
  }

  /**
   * Update order to back-ordered status
   * Endpoint: POST /api/v1/offline-packing/update-back-order-status
   */
  updateBackOrderStatus(orderNo: string): Observable<any> {
    return this.apiService.post(API.OFFLINE_PRODUCT_PACKING.UPDATE_BACK_ORDER, { orderNo });
  }
}
