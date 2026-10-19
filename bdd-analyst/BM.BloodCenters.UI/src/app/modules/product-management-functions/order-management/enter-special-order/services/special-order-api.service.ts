import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  SpecialOrderDto,
  SpecialOrderItemDto,
  CreateSpecialOrderRequestDto,
  CreateSpecialOrderItemDto,
  UpdateSpecialOrderRequestDto,
  OrderApiResponse,
  LookupItem,
  ConsigneeDto,
  CustomerContactDto,
  InventoryStockCheckResult
} from '../models/special-order.model';

@Injectable({
  providedIn: 'root'
})
export class SpecialOrderApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // ── Lookup endpoints (dedicated special order) ──

  getCustomersLookup(search?: string): Observable<LookupItem[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.LOOKUP_CUSTOMERS}${params}`
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
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.LOOKUP_CONSIGNEES(customerId)}`
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

  getPayeesLookup(customerId: string): Observable<LookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.LOOKUP_PAYEES(customerId)}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((p: any) => ({ code: p.customerId ?? p.code, description: p.name ?? p.description ?? p.customerId ?? p.code })) : [];
      })
    );
  }

  getContracts(customerId: string): Observable<LookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.LOOKUP_CONTRACTS(customerId)}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((c: any) => ({ code: c.code ?? c.contractId, description: c.description ?? c.contractId ?? c.code })) : [];
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
    let url = `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.LOOKUP_PRODUCT_TYPES}`;
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
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.LOOKUP_BLOOD_TYPES(productType)}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((b: any) => ({ code: b.code ?? b.aboCode, description: b.description ?? b.aboDesc ?? b.code })) : [];
      })
    );
  }

  getOrderModesLookup(): Observable<LookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.LOOKUP_ORDER_MODES}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((m: any) => ({ code: m.code, description: m.description ?? m.code })) : [];
      })
    );
  }

  getTiersLookup(productType: string): Observable<any[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.LOOKUP_TIERS(productType)}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((t: any) => ({ code: String(t.tier), description: `Tier ${t.tier} - ${t.dateRange?.trim() ?? ''} ($${t.unitPrice})`, unitPrice: t.unitPrice })) : [];
      })
    );
  }

  getAttributeGroupsLookup(): Observable<LookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.LOOKUP_ATTRIBUTE_GROUPS}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((g: any) => ({ code: g.code, description: g.description ?? g.code })) : [];
      })
    );
  }

  getAttributeCodesLookup(attribGroup: string): Observable<LookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.LOOKUP_ATTRIBUTE_CODES(attribGroup)}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((a: any) => ({ code: a.code, description: a.description ?? a.code })) : [];
      })
    );
  }

  getOrderClassesLookup(): Observable<LookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.LOOKUP_ORDER_CLASSES}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((c: any) => ({ code: c.code, description: c.description ?? c.code })) : [];
      })
    );
  }

  getSalutationsLookup(): Observable<LookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.LOOKUP_SALUTATIONS}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((s: any) => ({ code: s.code, description: s.description ?? s.code })) : [];
      })
    );
  }

  getAntigenCodesLookup(): Observable<LookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.LOOKUP_ANTIGENS}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((a: any) => ({ code: a.code, description: a.description ?? a.code })) : [];
      })
    );
  }

  getSourceProductsLookup(productType: string): Observable<LookupItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.LOOKUP_SOURCE_PRODUCTS(productType)}`
    ).pipe(
      map(response => {
        const data = response?.data ?? response;
        return Array.isArray(data) ? data.map((a: any) => ({ code: a.code, description: a.description ?? a.code })) : [];
      })
    );
  }

  // ── Open Orders, Inventory, Charges, Notes ──

  getOpenOrderItems(customerId: string): Observable<any[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.OPEN_ORDER_ITEMS(customerId)}`
    ).pipe(
      map(response => response?.data ?? [])
    );
  }

  getInventorySummary(productType: string, bloodType: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.INVENTORY_SUMMARY}?productType=${productType}&bloodType=${bloodType}`
    ).pipe(
      map(response => response?.data?.[0] ?? null)
    );
  }

  getInventoryTiers(productType: string, bloodType: string): Observable<any[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.INVENTORY_TIERS}?productType=${productType}&bloodType=${bloodType}`
    ).pipe(
      map(response => response?.data ?? [])
    );
  }

  checkInventoryStock(productType: string, bloodType: string, requiredQty: number): Observable<InventoryStockCheckResult | null> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.INVENTORY_STOCK_CHECK}?productType=${productType}&bloodType=${bloodType}&requiredQty=${requiredQty}`
    ).pipe(
      map(response => response?.data?.[0] ?? null)
    );
  }

  getOrderCharges(orderNo: string): Observable<any[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.GET_ORDER_CHARGES(orderNo)}`
    ).pipe(
      map(response => response?.data ?? [])
    );
  }

  addOrderCharge(orderNo: string, dto: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.ADD_ORDER_CHARGE(orderNo)}`,
      dto
    );
  }

  deleteOrderCharge(orderNo: string, chargeCode: string): Observable<boolean> {
    return this.http.delete<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.DELETE_ORDER_CHARGE(orderNo, chargeCode)}`
    ).pipe(
      map(response => response?.success ?? false)
    );
  }

  getOrderNotes(orderNo: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.GET_ORDER_NOTES(orderNo)}`
    ).pipe(
      map(response => response?.data?.[0] ?? null)
    );
  }

  saveOrderNotes(orderNo: string, note: string): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.SAVE_ORDER_NOTES(orderNo)}`,
      { note }
    );
  }

  getChargeCodesLookup(): Observable<any[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.LOOKUP_CHARGE_CODES}`
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

  // ── Special Order CRUD (uses special-orders endpoint) ──

  createOrder(dto: CreateSpecialOrderRequestDto): Observable<SpecialOrderDto> {
    return this.http.post<OrderApiResponse<SpecialOrderDto>>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.CREATE_ORDER}`,
      dto
    ).pipe(
      map(response => response.data[0])
    );
  }

  getOrder(orderNo: string): Observable<SpecialOrderDto> {
    return this.http.get<OrderApiResponse<SpecialOrderDto>>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.GET_ORDER(orderNo)}`
    ).pipe(
      map(response => response.data[0])
    );
  }

  updateOrder(orderNo: string, dto: UpdateSpecialOrderRequestDto): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.UPDATE_ORDER(orderNo)}`,
      dto
    ).pipe(
      map(response => response?.data?.[0] ?? response)
    );
  }

  cancelOrder(orderNo: string): Observable<boolean> {
    return this.http.delete<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.CANCEL_ORDER(orderNo)}`
    ).pipe(
      map(response => response?.success ?? false)
    );
  }

  // ── Order Items ──

  getOrderItems(orderNo: string): Observable<SpecialOrderItemDto[]> {
    return this.http.get<OrderApiResponse<SpecialOrderItemDto>>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.GET_ORDER_ITEMS(orderNo)}`
    ).pipe(
      map(response => response.data)
    );
  }

  addOrderItem(orderNo: string, dto: CreateSpecialOrderItemDto): Observable<SpecialOrderItemDto[]> {
    return this.http.post<OrderApiResponse<SpecialOrderItemDto>>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.ADD_ORDER_ITEM(orderNo)}`,
      dto
    ).pipe(
      map(response => response.data)
    );
  }

  deleteOrderItem(orderNo: string, itemNo: number): Observable<boolean> {
    return this.http.delete<OrderApiResponse<boolean>>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.DELETE_ORDER_ITEM(orderNo, itemNo)}`
    ).pipe(
      map(response => response.success)
    );
  }

  // ── Item Antigens ──

  getItemAntigens(orderNo: string, itemNo: number): Observable<any[]> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.GET_ITEM_ANTIGENS(orderNo, itemNo)}`
    ).pipe(
      map(response => response?.data ?? [])
    );
  }

  addItemAntigen(orderNo: string, itemNo: number, antigenId: string): Observable<any[]> {
    return this.http.post<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.ADD_ITEM_ANTIGEN(orderNo, itemNo)}`,
      { antigenId }
    ).pipe(
      map(response => response?.data ?? [])
    );
  }

  deleteItemAntigen(orderNo: string, itemNo: number, antigenId: string): Observable<boolean> {
    return this.http.delete<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.DELETE_ITEM_ANTIGEN(orderNo, itemNo, antigenId)}`
    ).pipe(
      map(response => response?.success ?? false)
    );
  }

  // ── Item Notes ──

  getItemNotes(orderNo: string, itemNo: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.GET_ITEM_NOTES(orderNo, itemNo)}`
    ).pipe(
      map(response => response?.data?.[0] ?? null)
    );
  }

  saveItemNotes(orderNo: string, itemNo: number, note: string): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}${API.SPECIAL_ORDER_MANAGEMENT.SAVE_ITEM_NOTES(orderNo, itemNo)}`,
      { note }
    );
  }
}
