import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API } from '@core/constants/api.constants';
import {
  ApiResponse,
  UndeliveredShipmentDto,
  ShipmentDeliveryDto,
  ConfirmDeliveryRequestDto
} from '../models/delivery-confirmation.model';

@Injectable({
  providedIn: 'root'
})
export class DeliveryConfirmationApiService {
  private readonly http = inject(HttpClient);

  getUndeliveredShipments(): Observable<UndeliveredShipmentDto[]> {
    return this.http
      .get<ApiResponse<UndeliveredShipmentDto[]>>(API.SHIPMENT_DELIVERY.UNDELIVERED_SHIPMENTS)
      .pipe(map(response => response.data?.[0] || []));
  }

  getShipmentDetails(shipmentNo: string): Observable<ShipmentDeliveryDto | null> {
    return this.http
      .get<ApiResponse<ShipmentDeliveryDto>>(API.SHIPMENT_DELIVERY.GET_DETAILS(shipmentNo))
      .pipe(map(response => response.data?.[0] || null));
  }

  confirmDelivery(request: ConfirmDeliveryRequestDto): Observable<boolean> {
    return this.http
      .post<ApiResponse<boolean>>(API.SHIPMENT_DELIVERY.CONFIRM, request)
      .pipe(map(response => response.data?.[0] || false));
  }
}
