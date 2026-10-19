import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  OrderSearchResultDto,
  OrderHeaderDto,
  AttributeAntigenDto,
  ProductsAvailableHeaderDto,
  PrintTransferSlipRequest,
  PrintTransferSlipResponse,
} from '../models/initiate-hospital-transfer.model';

@Injectable({ providedIn: 'root' })
export class InitiateHospitalTransferApiService {
  private readonly http = inject(HttpClient);

  getOrders(q?: string): Observable<ReturnResult<OrderSearchResultDto[]>> {
    let params = new HttpParams();
    if (q) {
      params = params.set('q', q);
    }
    return this.http.get<ReturnResult<OrderSearchResultDto[]>>(
      API.INITIATE_HOSPITAL_TRANSFER.ORDERS,
      { params },
    );
  }

  getOrderDetails(orderNo: string): Observable<ReturnResult<OrderHeaderDto>> {
    return this.http.get<ReturnResult<OrderHeaderDto>>(
      API.INITIATE_HOSPITAL_TRANSFER.GET(orderNo),
    );
  }

  getAttributesAntigens(orderNo: string, itemNo: number): Observable<ReturnResult<AttributeAntigenDto>> {
    return this.http.get<ReturnResult<AttributeAntigenDto>>(
      API.INITIATE_HOSPITAL_TRANSFER.ATTRIBUTES_ANTIGENS(orderNo, itemNo),
    );
  }

  findProducts(orderNo: string, itemNo: number, shipmentAge: number = 0): Observable<ReturnResult<ProductsAvailableHeaderDto>> {
    let params = new HttpParams();
    if (shipmentAge > 0) {
      params = params.set('shipmentAge', shipmentAge.toString());
    }
    return this.http.get<ReturnResult<ProductsAvailableHeaderDto>>(
      API.INITIATE_HOSPITAL_TRANSFER.FIND_PRODUCTS(orderNo, itemNo),
      { params },
    );
  }

  printTransferSlip(request: PrintTransferSlipRequest): Observable<ReturnResult<PrintTransferSlipResponse>> {
    return this.http.post<ReturnResult<PrintTransferSlipResponse>>(
      API.INITIATE_HOSPITAL_TRANSFER.PRINT_TRANSFER_SLIP,
      request,
    );
  }
}
