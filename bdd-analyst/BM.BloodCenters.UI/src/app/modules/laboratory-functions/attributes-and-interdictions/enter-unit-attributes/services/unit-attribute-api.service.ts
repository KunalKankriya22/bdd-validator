import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API } from 'src/app/core/constants/api.constants';
import {
  UnitValidationResult,
  UnitAttributeRow,
  AttributeGroupOption,
  AttributeCodeOption,
  CreateUnitAttributeRequest,
} from '../models/unit-attribute.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode: number;
  data: T;
  total?: number;
}

@Injectable()
export class UnitAttributeApiService {

  constructor(private readonly http: HttpClient) {}

  validateUnit(unitId: string): Observable<UnitValidationResult> {
    return this.http.get<ApiResponse<UnitValidationResult[]>>(
      API.ENTER_UNIT_ATTRIBUTES.VALIDATE_UNIT(unitId)
    ).pipe(
      map(response => {
        if (!response.data || response.data.length === 0) {
          throw new Error('Unit not found');
        }
        return response.data[0];
      })
    );
  }

  getAttributes(unitId: string, collDate: string, codeScheme: string, take: number, skip: number): Observable<{ data: UnitAttributeRow[]; totalRecords: number }> {
    const params = new HttpParams()
      .set('collDate', collDate)
      .set('codeScheme', codeScheme);

    return this.http.get<ApiResponse<UnitAttributeRow[]>>(
      API.ENTER_UNIT_ATTRIBUTES.GET_ATTRIBUTES(unitId, take, skip),
      { params }
    ).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      }))
    );
  }

  getAttributeGroups(): Observable<AttributeGroupOption[]> {
    return this.http.get<ApiResponse<AttributeGroupOption[]>>(
      API.ENTER_UNIT_ATTRIBUTES.ATTRIBUTE_GROUPS
    ).pipe(
      map(response => response.data || [])
    );
  }

  getAttributeCodes(
    groupCode: string,
    alertSpFlag: string | null,
    codeScheme: string
  ): Observable<AttributeCodeOption[]> {
    let params = new HttpParams().set('codeScheme', codeScheme);
    if (alertSpFlag) {
      params = params.set('alertSpFlag', alertSpFlag);
    }

    return this.http.get<ApiResponse<AttributeCodeOption[]>>(
      API.ENTER_UNIT_ATTRIBUTES.ATTRIBUTE_CODES(groupCode),
      { params }
    ).pipe(
      map(response => response.data || [])
    );
  }

  createAttribute(dto: CreateUnitAttributeRequest, codeScheme: string): Observable<unknown> {
    const params = new HttpParams().set('codeScheme', codeScheme);

    return this.http.post<ApiResponse<unknown>>(
      API.ENTER_UNIT_ATTRIBUTES.CREATE,
      dto,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }

  deleteAttribute(
    unitId: string,
    attribGroup: string,
    attribCode: string,
    collDate: string
  ): Observable<unknown> {
    const params = new HttpParams().set('collDate', collDate);

    return this.http.delete<ApiResponse<unknown>>(
      API.ENTER_UNIT_ATTRIBUTES.DELETE(unitId, attribGroup, attribCode),
      { params }
    ).pipe(
      map(response => response.data)
    );
  }
}
