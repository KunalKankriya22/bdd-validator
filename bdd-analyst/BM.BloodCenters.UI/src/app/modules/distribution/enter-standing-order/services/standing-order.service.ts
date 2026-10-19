import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import moment from 'moment';
import {
  ApiResponse,
  StandingOrderDto,
  StandingOrderListDto,
  StandingOrderQueryDto,
  CreateStandingOrderDto,
  UpdateStandingOrderDto,
  StandingOrderItemDto,
  StandingOrderItemListDto,
  StandingOrderItemQueryDto,
  CreateStandingOrderItemDto,
  UpdateStandingOrderItemDto,
  getWeekDayDisplay,
  getTimeDisplay,
  getYesNoDisplay,
  getSubstitutionDisplay,
  LovOption,
  ContractOption
} from '../models/standing-order.model';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';

/**
 * Service for managing Standing Orders (header and items)
 * API Base URL: /api/standing-orders
 */
@Injectable({
  providedIn: 'root'
})
export class StandingOrderService {
  private readonly apiService = inject(ApiService);

  // ─── Standing Order Header Methods ────────────────────────────────────────

  /**
   * Get paginated list of standing orders with filtering
   * POST /api/standing-orders/{take}/{skip}
   */
  getStandingOrders(
    take: number,
    skip: number,
    queryDto: StandingOrderQueryDto
  ): Observable<{ data: StandingOrderListDto[]; totalRecords: number }> {
    return this.apiService
      .post<ApiResponse<StandingOrderDto>>(API.STANDING_ORDERS.LIST(take, skip), queryDto)
      .pipe(
        map(res => ({
          data: (res.data ?? []).map(item => this.mapToListDto(item)),
          totalRecords: res.totalCount ?? res.total ?? 0
        }))
      );
  }

  /**
   * Get a specific standing order by composite key
   * GET /api/standing-orders/{contractId}/{consigneeId}/{weekDay}
   */
  getStandingOrderById(
    contractId: string,
    consigneeId: string,
    weekDay: string
  ): Observable<StandingOrderDto | null> {
    return this.apiService
      .get<ApiResponse<StandingOrderDto>>(API.STANDING_ORDERS.GET(contractId, consigneeId, weekDay))
      .pipe(
        map(res => (res.data && res.data.length > 0 ? res.data[0] : null))
      );
  }

  /**
   * Create a new standing order
   * POST /api/standing-orders
   */
  createStandingOrder(dto: CreateStandingOrderDto): Observable<ApiResponse<any>> {
    return this.apiService.post<ApiResponse<any>>(API.STANDING_ORDERS.CREATE, dto);
  }

  /**
   * Update an existing standing order
   * PUT /api/standing-orders/{contractId}/{consigneeId}/{weekDay}
   */
  updateStandingOrder(
    contractId: string,
    consigneeId: string,
    weekDay: string,
    dto: UpdateStandingOrderDto
  ): Observable<ApiResponse<any>> {
    return this.apiService.put<ApiResponse<any>>(
      API.STANDING_ORDERS.UPDATE(contractId, consigneeId, weekDay),
      dto
    );
  }

  /**
   * Delete (soft delete - sets TERM_DATE) a standing order
   * DELETE /api/standing-orders/{contractId}/{consigneeId}/{weekDay}
   */
  deleteStandingOrder(
    contractId: string,
    consigneeId: string,
    weekDay: string
  ): Observable<ApiResponse<boolean>> {
    return this.apiService.delete<ApiResponse<boolean>>(
      API.STANDING_ORDERS.DELETE(contractId, consigneeId, weekDay)
    );
  }

  // ─── Standing Order Items Methods ─────────────────────────────────────────

  /**
   * Get paginated list of items for a standing order with filtering
   * POST /api/standing-orders/{contractId}/{consigneeId}/{weekDay}/items/{take}/{skip}
   */
  getStandingOrderItems(
    contractId: string,
    consigneeId: string,
    weekDay: string,
    take: number,
    skip: number,
    queryDto: StandingOrderItemQueryDto
  ): Observable<{ data: StandingOrderItemListDto[]; totalRecords: number }> {
    return this.apiService
      .post<ApiResponse<StandingOrderItemDto>>(
        API.STANDING_ORDERS.ITEMS.LIST(contractId, consigneeId, weekDay, take, skip),
        queryDto
      )
      .pipe(
        map(res => ({
          data: (res.data ?? []).map(item => this.mapToItemListDto(item)),
          totalRecords: res.totalCount ?? res.total ?? 0
        }))
      );
  }

  /**
   * Get a specific standing order item
   * GET /api/standing-orders/{contractId}/{consigneeId}/{weekDay}/items/{itemNo}
   */
  getStandingOrderItemById(
    contractId: string,
    consigneeId: string,
    weekDay: string,
    itemNo: number
  ): Observable<StandingOrderItemDto | null> {
    return this.apiService
      .get<ApiResponse<StandingOrderItemDto>>(
        API.STANDING_ORDERS.ITEMS.GET(contractId, consigneeId, weekDay, itemNo)
      )
      .pipe(
        map(res => (res.data && res.data.length > 0 ? res.data[0] : null))
      );
  }

  /**
   * Create a new standing order item
   * POST /api/standing-orders/{contractId}/{consigneeId}/{weekDay}/items
   */
  createStandingOrderItem(
    contractId: string,
    consigneeId: string,
    weekDay: string,
    dto: CreateStandingOrderItemDto
  ): Observable<ApiResponse<any>> {
    return this.apiService.post<ApiResponse<any>>(
      API.STANDING_ORDERS.ITEMS.CREATE(contractId, consigneeId, weekDay),
      dto
    );
  }

  /**
   * Update an existing standing order item
   * PUT /api/standing-orders/{contractId}/{consigneeId}/{weekDay}/items/{itemNo}
   */
  updateStandingOrderItem(
    contractId: string,
    consigneeId: string,
    weekDay: string,
    itemNo: number,
    dto: UpdateStandingOrderItemDto
  ): Observable<ApiResponse<any>> {
    return this.apiService.put<ApiResponse<any>>(
      API.STANDING_ORDERS.ITEMS.UPDATE(contractId, consigneeId, weekDay, itemNo),
      dto
    );
  }

  /**
   * Delete a standing order item
   * DELETE /api/standing-orders/{contractId}/{consigneeId}/{weekDay}/items/{itemNo}
   */
  deleteStandingOrderItem(
    contractId: string,
    consigneeId: string,
    weekDay: string,
    itemNo: number
  ): Observable<ApiResponse<boolean>> {
    return this.apiService.delete<ApiResponse<boolean>>(
      API.STANDING_ORDERS.ITEMS.DELETE(contractId, consigneeId, weekDay, itemNo)
    );
  }

  // ─── Dropdown Data Methods (via OrderQueries endpoints) ──────────────────

  getCustomerTypes(): Observable<LovOption[]> {
    return this.apiService
      .get<ApiResponse<any>>(API.STANDING_ORDER_QUERY.LOOKUPS.CUSTOMER_TYPES)
      .pipe(
        map(res => (res.data ?? []).map((item: any) => ({
          code: item.code || item.Code,
          description: item.description || item.Description || item.code || item.Code
        })))
      );
  }

  getCustomers(customerType?: string): Observable<ContractOption[]> {
    const url = customerType
      ? `${API.STANDING_ORDER_QUERY.LOOKUPS.CUSTOMERS}?customerType=${encodeURIComponent(customerType)}`
      : API.STANDING_ORDER_QUERY.LOOKUPS.CUSTOMERS;
    return this.apiService
      .get<ApiResponse<any>>(url)
      .pipe(
        map(res => (res.data ?? []).map((item: any) => ({
          code: item.contractId || item.ContractId,
          description: item.customerName || item.CustomerName || '',
          customerId: item.customerId || item.CustomerId || ''
        })))
      );
  }

  getConsignees(customerId: string): Observable<LovOption[]> {
    return this.apiService
      .get<ApiResponse<any>>(API.ORDER_MANAGEMENT.LOOKUP_CONSIGNEES(customerId))
      .pipe(
        map(res => (res.data ?? []).map((item: any) => ({
          code: item.consigneeId || item.ConsigneeId || item.code,
          description: item.name || item.Name || item.consigneeId || item.ConsigneeId || ''
        })))
      );
  }

  getWeekDays(): Observable<LovOption[]> {
    return this.apiService
      .get<ApiResponse<any>>(API.STANDING_ORDER_QUERY.LOOKUPS.WEEKDAYS)
      .pipe(
        map(res => (res.data ?? []).map((item: any) => ({
          code: item.code || item.Code || item.weekDay,
          description: item.description || item.Description || item.weekDayFull || ''
        })))
      );
  }

  // ─── Product Lookup Methods (via Regular Order shared endpoints) ─────────

  getProductTypes(customerId?: string, consigneeId?: string): Observable<LovOption[]> {
    let url = API.ORDER_MANAGEMENT.LOOKUP_PRODUCT_TYPES;
    if (customerId && consigneeId) {
      url += `?customerId=${encodeURIComponent(customerId)}&consigneeId=${encodeURIComponent(consigneeId)}`;
    }
    return this.apiService
      .get<ApiResponse<any>>(url)
      .pipe(
        map(res => (res.data ?? []).map((item: any) => ({
          code: item.productType || item.ProductType || item.code,
          description: item.productTypeShortName || item.ProductTypeShortName || item.description || ''
        })))
      );
  }

  getBloodTypes(productType: string): Observable<LovOption[]> {
    return this.apiService
      .get<ApiResponse<any>>(API.ORDER_MANAGEMENT.LOOKUP_BLOOD_TYPES(productType))
      .pipe(
        map(res => (res.data ?? []).map((item: any) => ({
          code: item.aboCode || item.AboCode || item.code,
          description: item.aboDesc || item.AboDesc || item.description || ''
        })))
      );
  }

  getTiers(productType: string): Observable<LovOption[]> {
    return this.apiService
      .get<ApiResponse<any>>(API.ORDER_MANAGEMENT.LOOKUP_TIERS(productType))
      .pipe(
        map(res => (res.data ?? []).map((item: any) => ({
          code: (item.tier || item.Tier || item.code)?.toString(),
          description: item.description || item.Description || (item.tier || item.Tier)?.toString() || ''
        })))
      );
  }

  getAttributeGroups(): Observable<LovOption[]> {
    return this.apiService
      .get<ApiResponse<any>>(API.ORDER_MANAGEMENT.LOOKUP_ATTRIBUTE_GROUPS)
      .pipe(
        map(res => (res.data ?? []).map((item: any) => ({
          code: item.attribGroup || item.AttribGroup || item.code,
          description: item.attribDesc || item.AttribDesc || item.description || ''
        })))
      );
  }

  getAttributeCodes(attribGroup: string): Observable<LovOption[]> {
    return this.apiService
      .get<ApiResponse<any>>(API.ORDER_MANAGEMENT.LOOKUP_ATTRIBUTE_CODES(attribGroup))
      .pipe(
        map(res => (res.data ?? []).map((item: any) => ({
          code: item.attribCode || item.AttribCode || item.code,
          description: item.attribDesc || item.AttribDesc || item.description || ''
        })))
      );
  }

  // ─── Helper Mapping Methods ───────────────────────────────────────────────

  /**
   * Map API DTO to list display DTO for standing orders
   */
  private mapToListDto(apiDto: StandingOrderDto): StandingOrderListDto {
    return {
      contractId: apiDto.contractId,
      consigneeId: apiDto.consigneeId,
      weekDay: apiDto.weekDay,
      weekDayDisplay: getWeekDayDisplay(apiDto.weekDay),
      confirmation: getYesNoDisplay(apiDto.confirmFlag),
      timeRequired: getTimeDisplay(apiDto.requiredTime),
      effectiveDate: this.formatDate(apiDto.effDate),
      terminationDate: apiDto.termDate ? this.formatDate(apiDto.termDate) : '--',
      modificationDate: apiDto.lastModifiedDate
        ? this.formatDateTime(apiDto.lastModifiedDate)
        : null
    };
  }

  /**
   * Map API DTO to list display DTO for standing order items
   */
  private mapToItemListDto(apiDto: StandingOrderItemDto): StandingOrderItemListDto {
    return {
      itemNo: apiDto.itemNo,
      weekDay: apiDto.weekDay || '',
      weekDayDisplay: getWeekDayDisplay(apiDto.weekDay || ''),
      productType: apiDto.productType,
      productName: apiDto.productTypeShortName || apiDto.productType,
      abOrh: apiDto.bloodTypeDescription || apiDto.bloodType || '--',
      tier: apiDto.tier?.toString() || '--',
      quantity: apiDto.qty,
      substitution: getSubstitutionDisplay(apiDto.subOk),
      minimumQuantity: apiDto.minQty?.toString() || '--',
      attributeDisplay: apiDto.attributeDisplay || '--',
      effectiveDate: this.formatDate(apiDto.effDate),
      terminationDate: apiDto.termDate ? this.formatDate(apiDto.termDate) : '--'
    };
  }

  /**
   * Format ISO date string to DD-MMM-YYYY (uppercase month)
   */
  private formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '--';
    const m = moment(dateStr);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '--';
  }

  /**
   * Format ISO datetime string to DD-MMM-YYYY, HH:MM AM/PM
   */
  private formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '--';
    const m = moment(dateStr);
    return m.isValid() ? m.format('DD-MMM-YYYY, hh:mm A').toUpperCase().replace(/AM|PM/, match => match) : '--';
  }

  /**
   * Serialize date for API (YYYY-MM-DD format)
   */
  serializeDateForApi(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    const m = moment(date);
    return m.isValid() ? m.format('YYYY-MM-DD') : null;
  }
}
