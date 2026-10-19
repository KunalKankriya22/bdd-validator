import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  RegularOrderDto,
  OrderItemDto,
  CreateRegularOrderRequestDto,
  CreateOrderItemDto,
  UpdateRegularOrderRequestDto,
  RegularOrderQueryDto,
  OrderApiResponse,
  LookupItem,
  ConsigneeDto,
  CustomerContactDto,
  InventoryStockCheckResult,
  CancelOrderRequestDto,
  UpdateOrderItemRequestDto,
  OrderNumberLookupItem,
  PickSlipLookupItem,
  OrderClassLookupItem,
  ContractLookupItem,
  StandingOrderItemDto,
  CreateConsigneeDto
} from '../models/regular-order.model';

@Injectable({
  providedIn: 'root'
})
export class RegularOrderApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // ── Lookup endpoints ──

  getCustomersLookup(search?: string): Observable<LookupItem[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.LOOKUP_CUSTOMERS}${params}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((c: any) => ({ code: c.customerId ?? c.code, description: c.name ?? c.description ?? c.customerId ?? c.code })) : [];
      })
    );
  }

  getCustomerById(customerId: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.GET_BY_ID(customerId)}`
    ).pipe(
      map(response => response?.data?.[0] ?? response?.data ?? response)
    );
  }

  getConsignees(customerId: string): Observable<ConsigneeDto[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.LOOKUP_CONSIGNEES(customerId)}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((c: any) => ({
          consigneeId: c.consigneeId ?? c.code,
          consigneeName: c.name ?? c.consigneeName ?? '',
          address: c.address ?? ''
        })) : [];
      })
    );
  }

  getContacts(customerId: string): Observable<CustomerContactDto[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.CONTACTS(customerId)}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((c: any) => ({
          contactId: c.contactType ?? c.contactId ?? '',
          lastName: c.lastName ?? '',
          firstName: c.firstName ?? '',
          salutation: c.salutation,
          title: c.title,
          contactType: c.contactType,
          contactTypeCode: c.contactType,
          dayPhone: c.dayPhoneNo ?? c.dayPhone,
          faxNumber: c.faxNo ?? c.faxNumber,
          nightPhone: c.nightPhoneNo ?? c.nightPhone,
          telexNumber: c.telexNo ?? c.telexNumber,
          effectiveDate: c.effDate ?? c.effectiveDate,
          terminationDate: c.termDate ?? c.terminationDate
        })) : [];
      })
    );
  }

  getContracts(customerId: string): Observable<ContractLookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.LOOKUP_CONTRACTS(customerId)}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((c: any) => ({ code: c.code ?? c.contractId, description: c.description ?? c.contractId ?? c.code, effDate: c.effDate ?? c.effectiveDate, substituteFlag: c.substituteFlag ?? c.subFlag })) : [];
      })
    );
  }

  getPayeesLookup(customerId: string): Observable<LookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.LOOKUP_PAYEES(customerId)}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((p: any) => ({ code: p.customerId ?? p.code, description: p.name ?? p.description ?? p.customerId ?? p.code })) : [];
      })
    );
  }

  createContact(customerId: string, contact: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.CONTACTS(customerId)}`,
      contact
    ).pipe(
      map(response => response?.data?.[0] ?? response?.item ?? response)
    );
  }

  getContactTypes(): Observable<LookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.CUSTOMER_PROFILE.CONTACT_TYPES}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((c: any) => ({ code: c.code ?? c.contactTypeCode, description: c.description ?? c.contactType ?? c.code })) : [];
      })
    );
  }

  getProductTypesLookup(customerId?: string, consigneeId?: string): Observable<LookupItem[]> {
    let url = `${this.baseUrl}${API.ORDER_MANAGEMENT.LOOKUP_PRODUCT_TYPES}`;
    const params: string[] = [];
    if (customerId) params.push(`customerId=${customerId}`);
    if (consigneeId) params.push(`consigneeId=${consigneeId}`);
    if (params.length) url += `?${params.join('&')}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((p: any) => ({ code: p.code ?? p.productType, description: p.description ?? p.productTypeDesc ?? p.code })) : [];
      })
    );
  }

  getBloodTypesLookup(productType: string): Observable<LookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.LOOKUP_BLOOD_TYPES(productType)}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((b: any) => ({ code: b.code ?? b.aboCode, description: b.description ?? b.aboDesc ?? b.code })) : [];
      })
    );
  }

  getOrderModesLookup(): Observable<LookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.LOOKUP_ORDER_MODES}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((m: any) => ({ code: m.code, description: m.description ?? m.code })) : [];
      })
    );
  }

  getTiersLookup(productType: string): Observable<any[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.LOOKUP_TIERS(productType)}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((t: any) => ({ code: String(t.tier), description: `Tier ${t.tier} - ${t.dateRange?.trim() ?? ''} ($${t.unitPrice})`, unitPrice: t.unitPrice })) : [];
      })
    );
  }

  getAttributeGroupsLookup(): Observable<LookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.LOOKUP_ATTRIBUTE_GROUPS}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((g: any) => ({ code: g.code, description: g.description ?? g.code })) : [];
      })
    );
  }

  getAttributeCodesLookup(attribGroup: string): Observable<LookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.LOOKUP_ATTRIBUTE_CODES(attribGroup)}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((a: any) => ({ code: a.code, description: a.description ?? a.code })) : [];
      })
    );
  }

  getOrderClassesLookup(): Observable<OrderClassLookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.LOOKUP_ORDER_CLASSES}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((c: any) => ({ code: c.code, description: c.description ?? c.code, processHours: c.processHours })) : [];
      })
    );
  }

  getSalutationsLookup(): Observable<LookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.LOOKUP_SALUTATIONS}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((s: any) => ({ code: s.code, description: s.description ?? s.code })) : [];
      })
    );
  }

  // ── Open Orders, Inventory, Charges, Notes ──

  getOpenOrderItems(customerId: string): Observable<any[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.OPEN_ORDER_ITEMS(customerId)}`
    ).pipe(
      map(response => response?.data ?? [])
    );
  }

  getInventorySummary(productType: string, bloodType: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.INVENTORY_SUMMARY}?productType=${productType}&bloodType=${bloodType}`
    ).pipe(
      map(response => response?.data?.[0] ?? null)
    );
  }

  getInventoryTiers(productType: string, bloodType: string): Observable<any[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.INVENTORY_TIERS}?productType=${productType}&bloodType=${bloodType}`
    ).pipe(
      map(response => response?.data ?? [])
    );
  }

  checkInventoryStock(productType: string, bloodType: string, requiredQty: number): Observable<InventoryStockCheckResult | null> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.INVENTORY_STOCK_CHECK}?productType=${productType}&bloodType=${bloodType}&requiredQty=${requiredQty}`
    ).pipe(
      map(response => response?.data?.[0] ?? null)
    );
  }

  getOrderCharges(orderNo: string): Observable<any[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.GET_ORDER_CHARGES(orderNo)}`
    ).pipe(
      map(response => response?.data ?? [])
    );
  }

  addOrderCharge(orderNo: string, dto: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.ADD_ORDER_CHARGE(orderNo)}`,
      dto
    );
  }

  deleteOrderCharge(orderNo: string, chargeCode: string): Observable<boolean> {
    return this.http.delete<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.DELETE_ORDER_CHARGE(orderNo, chargeCode)}`
    ).pipe(
      map(response => response?.success ?? false)
    );
  }

  getOrderNotes(orderNo: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.GET_ORDER_NOTES(orderNo)}`
    ).pipe(
      map(response => response?.data?.[0] ?? null)
    );
  }

  saveOrderNotes(orderNo: string, note: string): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.SAVE_ORDER_NOTES(orderNo)}`,
      { note }
    );
  }

  getItemNotes(orderNo: string, itemNo: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.GET_ITEM_NOTES(orderNo, itemNo)}`
    ).pipe(
      map(response => response?.data?.[0] ?? null)
    );
  }

  saveItemNotes(orderNo: string, itemNo: number, note: string): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.SAVE_ITEM_NOTES(orderNo, itemNo)}`,
      { note }
    );
  }

  getChargeCodesLookup(): Observable<any[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.LOOKUP_CHARGE_CODES}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((c: any) => ({
          code: c.code,
          description: c.description ?? c.code,
          unitAmount: c.unitAmount ?? 0,
          crDbInd: c.crDbInd ?? '',
          percentDiscFlag: c.percentDiscFlag ?? ''
        })) : [];
      })
    );
  }

  // ── Order CRUD ──

  createOrder(dto: CreateRegularOrderRequestDto): Observable<RegularOrderDto> {
    return this.http.post<OrderApiResponse<RegularOrderDto>>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.CREATE_ORDER}`,
      dto
    ).pipe(
      map(response => response.data[0])
    );
  }

  getOrder(orderNo: string): Observable<RegularOrderDto> {
    return this.http.get<OrderApiResponse<RegularOrderDto>>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.GET_ORDER(orderNo)}`
    ).pipe(
      map(response => response.data[0])
    );
  }

  updateOrder(orderNo: string, dto: UpdateRegularOrderRequestDto): Observable<RegularOrderDto> {
    return this.http.put<OrderApiResponse<RegularOrderDto>>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.UPDATE_ORDER(orderNo)}`,
      dto
    ).pipe(
      map(response => response.data[0])
    );
  }

  deleteOrder(orderNo: string): Observable<boolean> {
    return this.http.delete<OrderApiResponse<boolean>>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.DELETE_ORDER(orderNo)}`
    ).pipe(
      map(response => response.success)
    );
  }

  getOpenOrders(take: number, skip: number, query: RegularOrderQueryDto): Observable<OrderApiResponse<RegularOrderDto>> {
    return this.http.post<OrderApiResponse<RegularOrderDto>>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.GET_ALL(take, skip)}`,
      query
    );
  }

  getOrderItems(orderNo: string): Observable<OrderItemDto[]> {
    return this.http.get<OrderApiResponse<OrderItemDto>>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.GET_ORDER_ITEMS(orderNo)}`
    ).pipe(
      map(response => response.data)
    );
  }

  addOrderItem(orderNo: string, dto: CreateOrderItemDto): Observable<OrderItemDto[]> {
    return this.http.post<OrderApiResponse<OrderItemDto>>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.ADD_ORDER_ITEM(orderNo)}`,
      dto
    ).pipe(
      map(response => response.data)
    );
  }

  deleteOrderItem(orderNo: string, itemNo: number): Observable<boolean> {
    return this.http.delete<OrderApiResponse<boolean>>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.DELETE_ORDER_ITEM(orderNo, itemNo)}`
    ).pipe(
      map(response => response.success)
    );
  }

  // ── Change/Cancel Order endpoints ──

  getOrderNumbersLookup(search?: string): Observable<OrderNumberLookupItem[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.LOOKUP_ORDER_NUMBERS}${params}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((o: any) => ({
          orderNo: o.orderNo ?? '',
          customerId: o.customerId ?? '',
          customerName: o.customerName ?? '',
          orderStatus: o.orderStatus ?? '',
          insertDate: o.insertDate ?? ''
        })) : [];
      })
    );
  }

  getCancelCodesLookup(): Observable<LookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.LOOKUP_CANCEL_CODES}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((c: any) => ({
          code: c.cancelCode ?? c.code ?? '',
          description: c.description ?? c.cancelCode ?? ''
        })) : [];
      })
    );
  }

  cancelOrder(orderNo: string, dto: CancelOrderRequestDto): Observable<RegularOrderDto> {
    return this.http.post<OrderApiResponse<RegularOrderDto>>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.CANCEL_ORDER(orderNo)}`,
      dto
    ).pipe(
      map(response => response.data[0])
    );
  }

  cancelOrderItem(orderNo: string, itemNo: number): Observable<OrderItemDto[]> {
    return this.http.post<OrderApiResponse<OrderItemDto>>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.CANCEL_ORDER_ITEM(orderNo, itemNo)}`,
      {}
    ).pipe(
      map(response => response.data)
    );
  }

  updateOrderItem(orderNo: string, itemNo: number, dto: UpdateOrderItemRequestDto): Observable<OrderItemDto[]> {
    return this.http.put<OrderApiResponse<OrderItemDto>>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.UPDATE_ORDER_ITEM(orderNo, itemNo)}`,
      dto
    ).pipe(
      map(response => response.data)
    );
  }

  getPickSlips(orderNo: string): Observable<PickSlipLookupItem[]> {
    return this.http.get<OrderApiResponse<PickSlipLookupItem>>(
      `${this.baseUrl}${API.ORDER_MANAGEMENT.GET_PICK_SLIPS(orderNo)}`
    ).pipe(
      map(response => response.data ?? [])
    );
  }

  getStandingOrderItems(customerId: string, contractId: string, consigneeId?: string): Observable<StandingOrderItemDto[]> {
    let url = `${this.baseUrl}/api/v1/regular-order/lookups/standing-order-items/${customerId}/${contractId}`;
    if (consigneeId) url += `?consigneeId=${consigneeId}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data : [];
      })
    );
  }

  createConsignee(customerId: string, consignee: CreateConsigneeDto): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/consignee`, {
      ...consignee,
      customerId
    });
  }
}
