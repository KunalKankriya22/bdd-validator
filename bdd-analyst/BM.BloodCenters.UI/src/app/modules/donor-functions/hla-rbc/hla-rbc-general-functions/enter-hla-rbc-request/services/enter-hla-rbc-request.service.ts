import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ApiLovDto,
  AttribCodeMap,
  HlaEpitopesMap,
  HospitalLookupDto,
  LovOption,
  PatientDetailDto,
  PatientSearchResultDto,
  PhysicianLookupDto,
  RequestDetailDto,
  RequestListItemDto,
  SavePayloadDto,
  SaveResultDto,
} from '../models/enter-hla-rbc-request.model';

interface ApiListResponse<T> {
  success: boolean;
  data?: T[];
  message?: string;
  total?: number;
}

interface ApiItemResponse<T> {
  success: boolean;
  item?: T;
  message?: string;
  statusCode?: number;
}

@Injectable({ providedIn: 'root' })
export class EnterHlaRbcRequestService {
  private readonly api = inject(ApiService);

  private mapLov(items: ApiLovDto[]): LovOption[] {
    return items.map(i => ({ value: i.code, label: i.description || i.code }));
  }

  private handleLovResponse(response: ApiListResponse<ApiLovDto>): LovOption[] {
    console.debug('[HLA-RBC LOV raw]', response);
    const data = response?.data ?? (Array.isArray(response) ? response as unknown as ApiLovDto[] : []);
    return data.length ? this.mapLov(data) : [];
  }

  // ─── Lookup ───────────────────────────────────────────────────────────────

  getPatients(): Observable<PatientSearchResultDto[]> {
    return this.api
      .get<ApiListResponse<PatientSearchResultDto>>(API.ENTER_HLA_RBC_REQUEST.LOOKUP_PATIENTS)
      .pipe(
        map(r => {
          console.debug('[HLA-RBC patients raw]', r);
          const data = r?.data ?? (Array.isArray(r) ? r as unknown as PatientSearchResultDto[] : []);
          return data;
        }),
        catchError(err => { console.error('getPatients failed:', err); return throwError(() => err); })
      );
  }

  getAboCodes(): Observable<LovOption[]> {
    return this.api
      .get<ApiListResponse<ApiLovDto>>(API.ENTER_HLA_RBC_REQUEST.LOOKUP_ABO_CODES)
      .pipe(
        map(r => this.handleLovResponse(r)),
        catchError(err => { console.error('getAboCodes failed:', err); return throwError(() => err); })
      );
  }

  getHlaLocus(): Observable<LovOption[]> {
    return this.api
      .get<ApiListResponse<ApiLovDto>>(API.ENTER_HLA_RBC_REQUEST.LOOKUP_HLA_LOCUS)
      .pipe(
        map(r => this.handleLovResponse(r)),
        catchError(err => { console.error('getHlaLocus failed:', err); return throwError(() => err); })
      );
  }

  /** HLA Phenotype dropdowns: locus must be 'A' or 'B' */
  getHlaEpitopes(locus: 'A' | 'B'): Observable<LovOption[]> {
    const params = new HttpParams().set('locus', locus);
    return this.api
      .get<ApiListResponse<ApiLovDto>>(API.ENTER_HLA_RBC_REQUEST.LOOKUP_HLA_EPITOPES, { params })
      .pipe(
        map(r => this.handleLovResponse(r)),
        catchError(err => { console.error('getHlaEpitopes failed:', err); return throwError(() => err); })
      );
  }

  /** HLA Antibodies value dropdown — any locus */
  getHlaEpitopesByLocus(locus: string): Observable<LovOption[]> {
    const params = new HttpParams().set('locus', locus);
    return this.api
      .get<ApiListResponse<ApiLovDto>>(API.ENTER_HLA_RBC_REQUEST.LOOKUP_HLA_EPITOPES_BY_LOCUS, { params })
      .pipe(
        map(r => this.handleLovResponse(r)),
        catchError(err => { console.error('getHlaEpitopesByLocus failed:', err); return throwError(() => err); })
      );
  }

  /** Single API for both RBC Antibodies and RBC Phenotype Antigen dropdowns */
  getRbcTests(): Observable<LovOption[]> {
    return this.api
      .get<ApiListResponse<ApiLovDto>>(API.ENTER_HLA_RBC_REQUEST.LOOKUP_RBC_TESTS)
      .pipe(
        map(r => this.handleLovResponse(r)),
        catchError(err => { console.error('getRbcTests failed:', err); return throwError(() => err); })
      );
  }

  getHospitals(): Observable<LovOption[]> {
    return this.api
      .get<ApiListResponse<HospitalLookupDto>>(API.ENTER_HLA_RBC_REQUEST.LOOKUP_HOSPITALS)
      .pipe(
        map(r => {
          const data = r?.data ?? (Array.isArray(r) ? r as unknown as HospitalLookupDto[] : []);
          return data.map(h => ({
            value: h.customerId,
            label: h.name,
          }));
        }),
        catchError(err => { console.error('getHospitals failed:', err); return throwError(() => err); })
      );
  }

  getPhysicians(): Observable<LovOption[]> {
    return this.api
      .get<ApiListResponse<PhysicianLookupDto>>(API.ENTER_HLA_RBC_REQUEST.LOOKUP_PHYSICIANS)
      .pipe(
        map(r => {
          const data = r?.data ?? (Array.isArray(r) ? r as unknown as PhysicianLookupDto[] : []);
          return data.map(p => ({
            value: p.phyId,
            label: p.firstName ? `${p.lastName}, ${p.firstName}` : p.lastName,
          }));
        }),
        catchError(err => { console.error('getPhysicians failed:', err); return throwError(() => err); })
      );
  }

  getProducts(): Observable<LovOption[]> {
    return this.api
      .get<ApiListResponse<ApiLovDto>>(API.ENTER_HLA_RBC_REQUEST.LOOKUP_PRODUCTS)
      .pipe(
        map(r => this.handleLovResponse(r)),
        catchError(err => { console.error('getProducts failed:', err); return throwError(() => err); })
      );
  }

  getPriorities(): Observable<LovOption[]> {
    return this.api
      .get<ApiListResponse<ApiLovDto>>(API.ENTER_HLA_RBC_REQUEST.LOOKUP_PRIORITIES)
      .pipe(
        map(r => this.handleLovResponse(r)),
        catchError(err => { console.error('getPriorities failed:', err); return throwError(() => err); })
      );
  }

  getAttributeGroups(): Observable<LovOption[]> {
    return this.api
      .get<ApiListResponse<ApiLovDto>>(API.ENTER_HLA_RBC_REQUEST.LOOKUP_ATTRIBUTE_GROUPS)
      .pipe(
        map(r => this.handleLovResponse(r)),
        catchError(err => { console.error('getAttributeGroups failed:', err); return throwError(() => err); })
      );
  }

  getAttributeCodes(group: string): Observable<LovOption[]> {
    const params = new HttpParams().set('group', group);
    return this.api
      .get<ApiListResponse<ApiLovDto>>(API.ENTER_HLA_RBC_REQUEST.LOOKUP_ATTRIBUTE_CODES, { params })
      .pipe(
        map(r => this.handleLovResponse(r)),
        catchError(err => { console.error('getAttributeCodes failed:', err); return throwError(() => err); })
      );
  }

  // ─── Patient ──────────────────────────────────────────────────────────────

  getPatientDetail(patId: string): Observable<PatientDetailDto | null> {
    return this.api
      .get<ApiItemResponse<PatientDetailDto>>(API.ENTER_HLA_RBC_REQUEST.PATIENT_DETAIL(patId))
      .pipe(
        map(r => (r.success && r.item) ? r.item : null),
        catchError(err => { console.error('getPatientDetail failed:', err); return throwError(() => err); })
      );
  }

  getPatientRequests(patId: string): Observable<RequestListItemDto[]> {
    return this.api
      .get<ApiListResponse<RequestListItemDto>>(API.ENTER_HLA_RBC_REQUEST.PATIENT_REQUESTS(patId))
      .pipe(
        map(r => {
          const data = (r.success && r.data) ? r.data : [];
          // Oracle Forms RG_REQUEST: exclude CLOSE status and submitted/executed requests
          return data.filter(req =>
            req.status !== 'CLOSE' &&
            req.submitRequest !== 'Y' &&
            req.submitRequest !== 'E'
          );
        }),
        catchError(err => { console.error('getPatientRequests failed:', err); return throwError(() => err); })
      );
  }

  // ─── Request ──────────────────────────────────────────────────────────────

  getRequestDetail(requestId: string): Observable<RequestDetailDto | null> {
    return this.api
      .get<ApiItemResponse<RequestDetailDto>>(API.ENTER_HLA_RBC_REQUEST.REQUEST_DETAIL(requestId))
      .pipe(
        map(r => (r.success && r.item) ? r.item : null),
        catchError(err => { console.error('getRequestDetail failed:', err); return throwError(() => err); })
      );
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  saveRequest(payload: SavePayloadDto): Observable<SaveResultDto> {
    return this.api
      .post<ApiItemResponse<SaveResultDto>>(API.ENTER_HLA_RBC_REQUEST.SAVE, payload)
      .pipe(
        map(r => {
          if (r.success && r.item) return r.item;
          throw new Error(r.message || 'Save failed');
        }),
        catchError(err => { console.error('saveRequest failed:', err); return throwError(() => err); })
      );
  }

  // ─── Close Request ────────────────────────────────────────────────────────

  closeRequest(requestId: string): Observable<void> {
    return this.api
      .put<ApiItemResponse<void>>(API.HLA_RBC_REQUEST_QUERY.CLOSE_REQUEST(requestId), {})
      .pipe(
        map(r => {
          if (!r.success) throw new Error(r.message || 'Close request failed');
        }),
        catchError(err => { console.error('closeRequest failed:', err); return throwError(() => err); })
      );
  }
}

export type { AttribCodeMap, HlaEpitopesMap };
