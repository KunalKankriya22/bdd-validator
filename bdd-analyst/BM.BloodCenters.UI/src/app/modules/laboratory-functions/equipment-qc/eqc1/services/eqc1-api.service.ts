import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import type {
  EquipmentType,
  EquipmentLookup,
  QcType,
  QcResult,
  QcControlDetail,
  QcHeaderResponse,
  QcDetailResponse,
  QcEvent,
  ReviewCode,
  BarcodeResponse,
  SystemUser,
  CreateQcRequest,
  CreateQcResponse,
  UpdateQcHeaderRequest,
  UpdateQcDetailsRequest,
  ApiResponse
} from '../models/eqc1.model';

@Injectable({
  providedIn: 'root'
})
export class Eqc1ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getEquipmentTypes(): Observable<EquipmentType[]> {
    return this.http.get<ApiResponse<EquipmentType[]>>(
      `${this.baseUrl}${API.EQUIPMENT_QC_ENTRY.EQUIPMENT_TYPES}`
    ).pipe(map(response => response.data));
  }

  getEquipmentIds(equipmentType: string): Observable<EquipmentLookup[]> {
    const params = new HttpParams().set('equipmentType', equipmentType);
    return this.http.get<ApiResponse<EquipmentLookup[]>>(
      `${this.baseUrl}${API.EQUIPMENT_QC_ENTRY.EQUIPMENT_IDS}`,
      { params }
    ).pipe(map(response => response.data ?? []));
  }

  getEquipmentReferences(equipmentType: string, equipmentId: string): Observable<EquipmentLookup[]> {
    const params = new HttpParams()
      .set('equipmentType', equipmentType)
      .set('equipmentId', equipmentId);
    return this.http.get<ApiResponse<EquipmentLookup[]>>(
      `${this.baseUrl}${API.EQUIPMENT_QC_ENTRY.EQUIPMENT_REFERENCES}`,
      { params }
    ).pipe(map(response => response.data ?? []));
  }

  getQcTypes(equipmentType: string): Observable<QcType[]> {
    const params = new HttpParams().set('equipmentType', equipmentType);
    return this.http.get<ApiResponse<QcType[]>>(
      `${this.baseUrl}${API.EQUIPMENT_QC_ENTRY.QC_TYPES}`,
      { params }
    ).pipe(map(response => response.data));
  }

  getQcControlDetails(equipmentType: string, qcType: string): Observable<QcControlDetail[]> {
    const params = new HttpParams()
      .set('equipmentType', equipmentType)
      .set('qcType', qcType);
    return this.http.get<ApiResponse<QcControlDetail[]>>(
      `${this.baseUrl}${API.EQUIPMENT_QC_ENTRY.QC_CONTROL_DETAILS}`,
      { params }
    ).pipe(map(response => response.data ?? []));
  }

  getQcHeader(qcReference: string): Observable<QcHeaderResponse[]> {
    return this.http.get<ApiResponse<QcHeaderResponse[]>>(
      `${this.baseUrl}${API.EQUIPMENT_QC_ENTRY.QC_HEADER(qcReference)}`
    ).pipe(map(response => response.data));
  }

  getQcDetails(qcReference: string): Observable<QcDetailResponse[]> {
    return this.http.get<ApiResponse<QcDetailResponse[]>>(
      `${this.baseUrl}${API.EQUIPMENT_QC_ENTRY.QC_DETAILS(qcReference)}`
    ).pipe(map(response => response.data));
  }

  getQcEvents(equipmentReference: string): Observable<QcEvent[]> {
    const params = new HttpParams().set('equipmentReference', equipmentReference);
    return this.http.get<ApiResponse<QcEvent[]>>(
      `${this.baseUrl}${API.EQUIPMENT_QC_ENTRY.QC_EVENTS}`,
      { params }
    ).pipe(map(response => response.data));
  }

  getQcResults(): Observable<QcResult[]> {
    return this.http.get<ApiResponse<QcResult[]>>(
      `${this.baseUrl}${API.EQUIPMENT_QC_ENTRY.QC_RESULTS}`
    ).pipe(map(response => response.data));
  }

  getUsers(): Observable<SystemUser[]> {
    return this.http.get<ApiResponse<SystemUser[]>>(
      `${this.baseUrl}${API.EQUIPMENT_QC_ENTRY.USERS}`
    ).pipe(map(response => response.data));
  }

  getReviewCode(equipmentType: string, qcType: string): Observable<ReviewCode> {
    const params = new HttpParams()
      .set('equipmentType', equipmentType)
      .set('qcType', qcType);
    return this.http.get<ApiResponse<ReviewCode[]>>(
      `${this.baseUrl}${API.EQUIPMENT_QC_ENTRY.REVIEW_CODE}`,
      { params }
    ).pipe(map(response => response.data[0]));
  }

  parseBarcode(barcode: string): Observable<BarcodeResponse> {
    return this.http.post<ApiResponse<BarcodeResponse[]>>(
      `${this.baseUrl}${API.EQUIPMENT_QC_ENTRY.PARSE_BARCODE}`,
      { barcode }
    ).pipe(map(response => response.data[0]));
  }

  createQcHeader(request: CreateQcRequest): Observable<CreateQcResponse> {
    return this.http.post<CreateQcResponse>(
      `${this.baseUrl}${API.EQUIPMENT_QC_ENTRY.CREATE_QC_HEADER}`,
      request
    );
  }

  updateQcHeader(qcReference: string, request: UpdateQcHeaderRequest): Observable<ApiResponse<{ qcReference: string; rowsAffected: number; qcStatus: string }>> {
    return this.http.put<ApiResponse<{ qcReference: string; rowsAffected: number; qcStatus: string }>>(
      `${this.baseUrl}${API.EQUIPMENT_QC_ENTRY.QC_HEADER(qcReference)}`,
      request
    );
  }

  updateQcDetails(qcReference: string, request: UpdateQcDetailsRequest): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(
      `${this.baseUrl}${API.EQUIPMENT_QC_ENTRY.QC_DETAILS(qcReference)}`,
      request
    );
  }
}
