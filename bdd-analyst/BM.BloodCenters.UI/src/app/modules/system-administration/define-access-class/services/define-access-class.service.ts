import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { API } from '../../../../core/constants/api.constants';
import moment from 'moment';
import { ChapterTimezoneService } from '../../../../shared/services/chapter-timezone.service';

/* ============================
   API MODELS
============================= */
export interface DefineAccessClassApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: DefineAccessClassApiRow[];
}

export interface DefineAccessClassApiRow {
  class: string;
  classDescription: string;
  type: string;
  code: string;
  description: string;
  effectiveDate: string;
  terminationDate: string;
}

/* ============================
   UI MODEL
============================= */
export interface DefineAccessClassRow {
  class: string;
  classDescription: string;
  type: string;
  code: string;
  description: string;
  effectiveDate: string;
  terminationDate: string;
}

export interface TypeApiResponse {
  types: string;
  description?: string;
}

export interface TypesApiResponse {
  success: boolean;
  statusCode: number;
  data: TypeApiResponse[];
}

export interface CodeValueApiResponse {
  value: string;
  description: string;
}

export interface CodeValuesApiResponse {
  success: boolean;
  statusCode: number;
  data: CodeValueApiResponse[];
}

export interface CodeFilterDropdownItem {
  code: string;
  description: string;
}

export interface TypeFilterDropdownItem {
  types: string;
  description: string;
}

export interface CreateAccessClassRequest {
  accessCodeValues: string[];
  accessClass: string;
  accessCodeType: string;
  effectiveDate: string;
  terminationDate: string | null;
  insertUser: string;
}

export interface CreateAccessClassResponseItem {
  class: string;
  classDescription: string;
  type: string;
  code: string;
  description: string;
  effectiveDate: string;
}

export interface CreateAccessClassResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: CreateAccessClassResponseItem[];
}

export interface GetAccessClassByIdResponseItem {
  class: string;
  classDescription: string;
  type: string;
  code: string;
  description: string;
  effectiveDate: string;
  terminationDate: string | null;
}

export interface GetAccessClassByIdResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: GetAccessClassByIdResponseItem;
}

export interface GetAccessClassDetailResponse {
  success: boolean;
  statusCode: number;
  data: GetAccessClassByIdResponseItem;
}

export interface UpdateAccessClassRequest {
  accessClass: string;
  accessCodeType: string;
  accessCodeValue: string;
  terminationDate: string;
}

export interface UpdateAccessClassResponseItem {
  class: string;
  classDescription: string;
  type: string;
  code: string;
  description: string;
  effectiveDate: string;
  terminationDate: string;
}

export interface UpdateAccessClassResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: UpdateAccessClassResponseItem;
}

@Injectable({
  providedIn: 'root',
})
export class DefineAccessClassService {
  private readonly baseUrl = `${environment.apiUrl}/api/v1/define-access-class`;

  constructor(private http: HttpClient, private chapterTimezoneService: ChapterTimezoneService) {}

  /* ============================
     GET ACCESS CLASSES DROPDOWN
     Backend:
     GET /define-user-access/access-classes
  ============================= */
  getAccessClassesDropdown(): Observable<{ code: string; description: string }[]> {
    return this.http
      .get<{ success: boolean; data: { code: string; description: string }[] }>(`${environment.apiUrl}${API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.ACCESS_CLASSES}`)
      .pipe(map(res => (res?.data ?? []).map(item => ({ code: item.code, description: item.description || '' }))));
  }

  /* ============================
     GET DEFINE ACCESS CLASS DATA
     Backend:
     /define-access-class/{accessClass}?sort=ASC
  ============================= */
  getDefineAccessClass(
    accessClass: string,
    sort: 'ASC' | 'DESC' = 'ASC'
  ): Observable<DefineAccessClassRow[]> {
    const url = `${this.baseUrl}/${accessClass}?sort=${sort}`;

    return this.http
      .get<DefineAccessClassApiResponse>(url)
      .pipe(
        map(res =>
          (res?.data ?? []).map(item => ({
            class: item.class,
            classDescription: item.classDescription,
            type: item.type,
            code: item.code,
            description: item.description,
            effectiveDate: this.formatDate(item.effectiveDate),
            terminationDate: this.formatDate(item.terminationDate) || '-',
          }))
        )
      );
  }

  /* ============================
     GET TYPES BY CLASSNAME
     Backend:
     /define-access-class/{classname}/types
  ============================= */
  getTypesByClassname(classname: string): Observable<{ type: string; description: string }[]> {
    const url = `${this.baseUrl}/${classname}/types`;

    return this.http
      .get<TypesApiResponse | TypeApiResponse[]>(url)
      .pipe(
        map(res => {
          const rows = Array.isArray(res) ? res : (res?.data ?? []);
          return rows.map(item => ({ type: item.types, description: item.description || '' }));
        })
      );
  }

  /* ============================
     GET TYPES FILTER DROPDOWN
     Backend:
     GET /define-access-class/types-filter-dropdown?accessClass={accessClass}
  ============================= */
  getTypesFilterDropdown(accessClass: string): Observable<{ type: string; description: string }[]> {
    const url = `${this.baseUrl}/types-filter-dropdown?accessClass=${accessClass}`;

    return this.http
      .get<{ success: boolean; data: TypeFilterDropdownItem[] }>(url)
      .pipe(
        map(res =>
          (res?.data ?? []).map(item => ({ type: item.types, description: item.description || '' }))
        )
      );
  }

  /* ============================
     GET CODE FILTER DROPDOWN
     Backend:
     GET /define-access-class/code-filter-dropdown?accessClass={accessClass}&accessCodeType={accessCodeType}
  ============================= */
  getCodeFilterDropdown(accessClass: string, accessCodeType?: string): Observable<CodeFilterDropdownItem[]> {
    let url = `${this.baseUrl}/code-filter-dropdown?accessClass=${accessClass}`;
    if (accessCodeType) {
      url += `&accessCodeType=${accessCodeType}`;
    }

    return this.http
      .get<{ success: boolean; data: CodeFilterDropdownItem[] }>(url)
      .pipe(
        map(res => res?.data ?? [])
      );
  }

  /* ============================
     GET CODE VALUES BY CLASSNAME AND TYPE
     Backend:
     /define-access-class/{classname}/{codetype}/code-values
  ============================= */
  getCodeValuesByType(classname: string, codetype: string): Observable<CodeValueApiResponse[]> {
    const url = `${this.baseUrl}/${classname}/${codetype}/code-values`;

    return this.http
      .get<CodeValuesApiResponse | CodeValueApiResponse[]>(url)
      .pipe(
        map(res => {
          const rows = Array.isArray(res) ? res : (res?.data ?? []);
          return rows;
        })
      );
  }

  /* ============================
     CREATE ACCESS CLASS
     Backend:
     POST /define-access-class
  ============================= */
  createAccessClass(request: CreateAccessClassRequest): Observable<CreateAccessClassResponse> {
    return this.http.post<CreateAccessClassResponse>(this.baseUrl, request);
  }

  /* ============================
     GET ACCESS CLASS BY ID
     Backend:
     /define-access-class/{codetype}/{codevalue}
  ============================= */
  getAccessClassById(codetype: string, codevalue: string): Observable<GetAccessClassByIdResponseItem> {
    const url = `${this.baseUrl}/${codetype}/${codevalue}`;

    return this.http
      .get<GetAccessClassByIdResponse>(url)
      .pipe(
        map(res => res.item)
      );
  }

  /* ============================
     GET ACCESS CLASS DETAIL BY CLASS + TYPE + CODE
     Backend:
     /define-access-class/{classname}/{codetype}/{codevalue}
  ============================= */
  getAccessClassDetail(classname: string, codetype: string, codevalue: string): Observable<GetAccessClassByIdResponseItem> {
    const url = `${this.baseUrl}/${classname}/${codetype}/${codevalue}`;

    return this.http
      .get<GetAccessClassDetailResponse>(url)
      .pipe(
        map(res => res.data)
      );
  }

  /* ============================
     UPDATE ACCESS CLASS TERMINATION DATE
     Backend:
     PUT /define-access-class
  ============================= */
  updateAccessClass(request: UpdateAccessClassRequest): Observable<UpdateAccessClassResponse> {
    return this.http.put<UpdateAccessClassResponse>(this.baseUrl, request);
  }

  private formatDate(value: string | null | undefined): string {
    if (!value || !value.trim()) return '';
    const m = moment.utc(value);
    if (!m.isValid()) return value;
    const local = this.chapterTimezoneService.convertGmtToLocal(m);
    return local.format('DD-MMM-YYYY').toUpperCase();
  }
}
