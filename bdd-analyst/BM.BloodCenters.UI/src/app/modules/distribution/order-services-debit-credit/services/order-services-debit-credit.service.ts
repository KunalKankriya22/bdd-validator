import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ApiResponse,
  CreateAdjustmentDto,
  LovOption,
  PatientLovDto,
  RequestedByLovDto
} from '../models/order-services-debit-credit.model';

@Injectable({ providedIn: 'root' })
export class OrderServicesDebitCreditService {
  private readonly api = inject(ApiService);

  create(dto: CreateAdjustmentDto): Observable<ApiResponse<object>> {
    return this.api.post<ApiResponse<object>>(
      API.ORDER_SERVICES_DEBIT_CREDIT.CREATE,
      dto
    );
  }

  getNote(adviceId: string): Observable<{ noteId: number; noteText: string } | null> {
    return this.api
      .get<ApiResponse<{ noteId: number; noteText: string }>>(
        API.ORDER_SERVICES_DEBIT_CREDIT.GET_NOTE(adviceId)
      )
      .pipe(map(res => res.data?.[0] ?? null));
  }

  addNote(adviceId: string, noteText: string): Observable<ApiResponse<object>> {
    return this.api.post<ApiResponse<object>>(
      API.ORDER_SERVICES_DEBIT_CREDIT.ADD_NOTE(adviceId),
      { noteText }
    );
  }

  getCustomerLov(searchTerm?: string | null): Observable<LovOption[]> {
    return this.api
      .get<ApiResponse<{ customerId: string; name: string }>>(
        API.ORDER_SERVICES_DEBIT_CREDIT.CUSTOMER_LOV(searchTerm)
      )
      .pipe(
        map(res =>
          (res.data ?? []).map(item => ({
            code: item.customerId,
            description: item.name ?? ''
          }))
        )
      );
  }

  getOrderNoLov(customerId: string, tranType: string, patientName?: string | null): Observable<LovOption[]> {
    return this.api
      .get<ApiResponse<{ orderNo: string; localInsDate?: string }>>(
        API.ORDER_SERVICES_DEBIT_CREDIT.ORDER_NO_LOV(customerId, tranType, patientName)
      )
      .pipe(
        map(res =>
          (res.data ?? []).map(item => ({
            code: item.orderNo,
            description: item.localInsDate ?? ''
          }))
        )
      );
  }

  getServiceCodeLov(tranType?: string | null, orderNo?: string | null): Observable<LovOption[]> {
    return this.api
      .get<ApiResponse<{ serviceCode: string; description?: string; charge?: number | null; editCharge?: string }>>(
        API.ORDER_SERVICES_DEBIT_CREDIT.SERVICE_CODE_LOV(tranType, orderNo)
      )
      .pipe(
        map(res =>
          (res.data ?? []).map(item => ({
            code:        item.serviceCode,
            description: item.description ?? '',
            charge:      item.charge ?? null,
            editCharge:  String(item.editCharge || '') === 'Y'
          }))
        )
      );
  }

  getReasonCodeLov(tranType: string): Observable<LovOption[]> {
    return this.api
      .get<ApiResponse<{ code: string; codeDesc?: string }>>(
        API.ORDER_SERVICES_DEBIT_CREDIT.REASON_CODE_LOV(tranType)
      )
      .pipe(
        map(res =>
          (res.data ?? []).map(item => ({
            code: item.code,
            description: item.codeDesc ?? ''
          }))
        )
      );
  }

  getPatientLov(customerId: string, tranType: string, searchTerm?: string | null): Observable<PatientLovDto[]> {
    return this.api
      .get<ApiResponse<PatientLovDto>>(
        API.ORDER_SERVICES_DEBIT_CREDIT.PATIENT_LOV(customerId, tranType, searchTerm)
      )
      .pipe(map(res => res.data ?? []));
  }

  getRequestedByLov(customerId: string): Observable<RequestedByLovDto[]> {
    return this.api
      .get<ApiResponse<RequestedByLovDto>>(
        API.ORDER_SERVICES_DEBIT_CREDIT.REQUESTED_BY_LOV(customerId)
      )
      .pipe(map(res => res.data ?? []));
  }
}
