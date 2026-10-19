import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  ShipmentLookupDto,
  BoxLookupDto,
  ShipmentHeaderDto,
  ShipmentsInTransitSearchRequest,
} from '../models/shipments-in-transit.model';

@Injectable({ providedIn: 'root' })
export class ShipmentsInTransitApiService {
  private readonly http = inject(HttpClient);

  getShipmentLookup(): Observable<ReturnResult<ShipmentLookupDto>> {
    return this.http.get<ReturnResult<ShipmentLookupDto>>(
      API.SHIPMENTS_IN_TRANSIT.SHIPMENT_LOOKUP,
    );
  }

  getBoxLookup(shipmentNo: string): Observable<ReturnResult<BoxLookupDto>> {
    return this.http.get<ReturnResult<BoxLookupDto>>(
      API.SHIPMENTS_IN_TRANSIT.BOX_LOOKUP(shipmentNo),
    );
  }

  search(request: ShipmentsInTransitSearchRequest): Observable<ReturnResult<ShipmentHeaderDto>> {
    return this.http.post<ReturnResult<ShipmentHeaderDto>>(
      API.SHIPMENTS_IN_TRANSIT.SEARCH,
      request,
    );
  }
}
