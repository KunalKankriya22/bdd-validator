import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

// ── Generic wrapper ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total?: number;
  item?: unknown;
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

export interface EquipmentTypeLookupDto {
  code: string;
  description: string;
}

export interface EquipmentLookupDto {
  equipId: string;
  equipReference: string;
}

export interface QcEventDto {
  qcReference: string;
  qcType: string;
  qcDate: string;
  qcStatus: string;
}

export interface QcHeaderDto {
  equipReference: string;
  equipmentType: string;
  qcReference: string;
  qcId: string;
  qcType: string;
  qcTypeDescription: string;
  qcDate: string | null;
  qcTech1: string | null;
  qcTech2: string | null;
  qcResult1: string | null;
  qcResult1Description: string | null;
  qcResult2: string | null;
  qcResult2Description: string | null;
  qcStatus: string;
  qcStatusDescription: string;
  insertDate: string;
  lastModifiedDate: string;
  modifiedBy: string;
  auditKey: number;
  programId: string;
  noteId: string | null;
}

export interface QcDetailDto {
  qcReference: string;
  qcId: string;
  arrangeBy: number;
  expectedValue: string;
  minimumValue?: string | null;
  maximumValue?: string | null;
  actualValue: string | null;
  interpretation: string | null;
  interpretation2?: string | null;
  insertDate: string;
  insertedBy: string;
}

export interface QcTypeLookupDto {
  qcType: string;
  description: string;
}

export interface QcResultLookupDto {
  code: string;
  description: string;
}

export interface UserLookupDto {
  userId: string;
  userName: string;
}

export interface ReviewCodeDto {
  reviewCode: string | null;
}

export interface BarcodeParseRequestDto {
  barcode: string;
}

export interface BarcodeParseResponseDto {
  equipmentReference: string;
  equipmentType: string;
  equipmentId: string;
  isValid: boolean;
  errorCode: string | null;
  errorMessage: string | null;
}

// ── Request DTOs ──────────────────────────────────────────────────────────────

export interface UpdateQcDetailItemDto {
  qcId: string;
  arrangeBy: number;
  actualValue: string;
}

export interface UpdateQcDetailsRequestDto {
  details: UpdateQcDetailItemDto[];
}

export interface UpdateQcHeaderRequestDto {
  qcType: string;
  qcDate?: string | null;
  qcTech1?: string | null;
  qcTech2?: string | null;
  qcResult1: string;
  qcResult2?: string | null;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class EditReconcileQcDetailsService {
  private readonly apiService = inject(ApiService);

  getEquipmentTypes(): Observable<EquipmentTypeLookupDto[]> {
    return this.apiService
      .get<ApiResponse<EquipmentTypeLookupDto[]>>(API.EQUIPMENT_QC_SUP.EQUIPMENT_TYPES)
      .pipe(map(res => res.data ?? []));
  }

  getEquipmentIds(equipmentType: string): Observable<EquipmentLookupDto[]> {
    const params = new HttpParams().set('equipmentType', equipmentType);
    return this.apiService
      .get<ApiResponse<EquipmentLookupDto[]>>(API.EQUIPMENT_QC_SUP.EQUIPMENT_IDS, { params })
      .pipe(map(res => res.data ?? []));
  }

  getEquipmentReferences(equipmentType: string, equipmentId: string): Observable<EquipmentLookupDto[]> {
    const params = new HttpParams()
      .set('equipmentType', equipmentType)
      .set('equipmentId', equipmentId);
    return this.apiService
      .get<ApiResponse<EquipmentLookupDto[]>>(API.EQUIPMENT_QC_SUP.EQUIPMENT_REFERENCES, { params })
      .pipe(map(res => res.data ?? []));
  }

  getQcEvents(equipmentReference: string): Observable<QcEventDto[]> {
    const params = new HttpParams().set('equipmentReference', equipmentReference);
    return this.apiService
      .get<ApiResponse<QcEventDto[]>>(API.EQUIPMENT_QC_SUP.QC_EVENTS, { params })
      .pipe(map(res => res.data ?? []));
  }

  getQcHeader(qcReference: string): Observable<QcHeaderDto | null> {
    return this.apiService
      .get<ApiResponse<QcHeaderDto[]>>(API.EQUIPMENT_QC_SUP.QC_HEADER(qcReference))
      .pipe(map(res => res.data?.[0] ?? null));
  }

  getQcDetails(qcReference: string): Observable<QcDetailDto[]> {
    return this.apiService
      .get<ApiResponse<QcDetailDto[]>>(API.EQUIPMENT_QC_SUP.QC_DETAILS(qcReference))
      .pipe(map(res => res.data ?? []));
  }

  getQcTypes(equipmentType: string): Observable<QcTypeLookupDto[]> {
    const params = new HttpParams().set('equipmentType', equipmentType);
    return this.apiService
      .get<ApiResponse<QcTypeLookupDto[]>>(API.EQUIPMENT_QC_SUP.QC_TYPES, { params })
      .pipe(map(res => res.data ?? []));
  }

  getQcResults(): Observable<QcResultLookupDto[]> {
    return this.apiService
      .get<ApiResponse<QcResultLookupDto[]>>(API.EQUIPMENT_QC_SUP.QC_RESULTS)
      .pipe(map(res => res.data ?? []));
  }

  getUsers(): Observable<UserLookupDto[]> {
    return this.apiService
      .get<ApiResponse<UserLookupDto[]>>(API.EQUIPMENT_QC_SUP.USERS)
      .pipe(map(res => res.data ?? []));
  }

  getReviewCode(equipmentType: string, qcType: string): Observable<string | null> {
    const params = new HttpParams().set('equipmentType', equipmentType).set('qcType', qcType);
    return this.apiService
      .get<ApiResponse<ReviewCodeDto[]>>(API.EQUIPMENT_QC_SUP.REVIEW_CODE, { params })
      .pipe(map(res => res.data?.[0]?.reviewCode ?? null));
  }

  parseBarcode(barcode: string): Observable<BarcodeParseResponseDto | null> {
    return this.apiService
      .post<ApiResponse<BarcodeParseResponseDto[]>>(API.EQUIPMENT_QC_SUP.PARSE_BARCODE, { barcode })
      .pipe(map(res => res.data?.[0] ?? null));
  }

  updateQcDetails(qcReference: string, body: UpdateQcDetailsRequestDto): Observable<ApiResponse<unknown>> {
    return this.apiService.put<ApiResponse<unknown>>(API.EQUIPMENT_QC_SUP.QC_DETAILS(qcReference), body);
  }

  updateQcHeader(qcReference: string, body: UpdateQcHeaderRequestDto): Observable<ApiResponse<unknown>> {
    return this.apiService.put<ApiResponse<unknown>>(API.EQUIPMENT_QC_SUP.QC_HEADER(qcReference), body);
  }
}
