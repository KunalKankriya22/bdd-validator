import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ShipmentDto,
  ShipmentQueryDto,
  ShipmentSearchResponse,
  ShipmentDetailResponse,
  BoxDetailDto,
  OrderDetailDto,
  ShippedProductDetailDto,
  DeliveryNotesDto,
  FilterOptions,
} from '../models/shipments-by-ship-date.model';

@Injectable({
  providedIn: 'root',
})
export class ShipmentsByShipDateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.SHIPMENTS_BY_SHIP_DATE.BASE}`;

  searchShipments(
    query: ShipmentQueryDto,
    take: number = 10,
    skip: number = 0
  ): Observable<{ data: ShipmentDto[]; totalCount: number }> {
    const url = `${this.baseUrl}/${take}/${skip}`;
    return this.http.post<ShipmentSearchResponse>(url, query).pipe(
      map((response) => ({
        data: response.data || [],
        totalCount: response.total || 0,
      }))
    );
  }

  getBoxDetails(shipmentNo: string): Observable<BoxDetailDto[]> {
    const url = API.SHIPMENTS_BY_SHIP_DATE.GET_BOXES(shipmentNo);
    return this.http
      .get<ShipmentDetailResponse<BoxDetailDto[]>>(`${environment.apiUrl}${url}`)
      .pipe(map((response) => response.data || []));
  }

  getOrderDetails(shipmentNo: string): Observable<OrderDetailDto[]> {
    const url = API.SHIPMENTS_BY_SHIP_DATE.GET_ORDERS(shipmentNo);
    return this.http
      .get<ShipmentDetailResponse<OrderDetailDto[]>>(`${environment.apiUrl}${url}`)
      .pipe(map((response) => response.data || []));
  }

  getShippedProducts(shipmentNo: string): Observable<ShippedProductDetailDto[]> {
    const url = API.SHIPMENTS_BY_SHIP_DATE.GET_PRODUCTS(shipmentNo);
    return this.http
      .get<ShipmentDetailResponse<ShippedProductDetailDto[]>>(`${environment.apiUrl}${url}`)
      .pipe(map((response) => response.data || []));
  }

  getDeliveryNotes(noteId: number): Observable<DeliveryNotesDto> {
    const url = API.SHIPMENTS_BY_SHIP_DATE.GET_NOTES(noteId);
    return this.http
      .get<ShipmentDetailResponse<DeliveryNotesDto>>(`${environment.apiUrl}${url}`)
      .pipe(map((response) => response.data));
  }

  getFilterOptions(): Observable<FilterOptions> {
    return this.http
      .get<ShipmentDetailResponse<FilterOptions>>(
        `${environment.apiUrl}${API.SHIPMENTS_BY_SHIP_DATE.FILTER_OPTIONS}`
      )
      .pipe(
        map((response) => response.data || { statuses: [], types: [] })
      );
  }
}
