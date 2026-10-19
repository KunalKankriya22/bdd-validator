import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  ValidAttributesMatrix,
  CreateValidAttributesMatrixDto,
  UpdateValidAttributesMatrixDto,
  ValidAttributesMatrixParamsDto,
  ApiResponse,
  AttributeGroupDropdown,
  AttributeCodeDropdown,
  ModifierCodeDropdown
} from '../models/valid-attributes-matrix.model';

@Injectable({
  providedIn: 'root'
})
export class ValidAttributesMatrixService {
  private apiService = inject(ApiService);

  getValidAttributesMatrix(
    take: number,
    skip: number,
    params: ValidAttributesMatrixParamsDto
  ): Observable<ApiResponse<ValidAttributesMatrix[]>> {
    return this.apiService
      .post<ApiResponse<ValidAttributesMatrix[]>>(API.VALID_ATTRIBUTES_MATRIX.LIST(take, skip), params)
      .pipe(catchError((error) => throwError(() => error)));
  }

  getValidAttributesMatrixById(
    attribAddedGroup: string,
    attribAddedCode: string,
    attribDeletedCode?: string | null,
    associatedAttribCode?: string | null
  ): Observable<ApiResponse<ValidAttributesMatrix[]>> {
    let url = API.VALID_ATTRIBUTES_MATRIX.GET_BY_ID(attribAddedGroup, attribAddedCode);
    const qp: string[] = [];
    if (attribDeletedCode) qp.push(`attribDeletedCode=${encodeURIComponent(attribDeletedCode)}`);
    if (associatedAttribCode) qp.push(`associatedAttribCode=${encodeURIComponent(associatedAttribCode)}`);
    if (qp.length) url += `?${qp.join('&')}`;
    return this.apiService
      .get<ApiResponse<ValidAttributesMatrix[]>>(url)
      .pipe(catchError((error) => throwError(() => error)));
  }

  createValidAttributesMatrix(data: CreateValidAttributesMatrixDto): Observable<ApiResponse<unknown>> {
    return this.apiService
      .post<ApiResponse<unknown>>(API.VALID_ATTRIBUTES_MATRIX.CREATE, data, {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true)
      })
      .pipe(catchError((error) => throwError(() => error)));
  }

  updateValidAttributesMatrix(
    attribAddedGroup: string,
    attribAddedCode: string,
    data: UpdateValidAttributesMatrixDto,
    attribDeletedCode?: string | null,
    associatedAttribCode?: string | null
  ): Observable<ApiResponse<unknown>> {
    let url = API.VALID_ATTRIBUTES_MATRIX.UPDATE(attribAddedGroup, attribAddedCode);
    const qp: string[] = [];
    if (attribDeletedCode) qp.push(`attribDeletedCode=${encodeURIComponent(attribDeletedCode)}`);
    if (associatedAttribCode) qp.push(`associatedAttribCode=${encodeURIComponent(associatedAttribCode)}`);
    if (qp.length) url += `?${qp.join('&')}`;
    return this.apiService
      .put<ApiResponse<unknown>>(url, data, {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true)
      })
      .pipe(catchError((error) => throwError(() => error)));
  }

  deleteValidAttributesMatrix(
    attribAddedGroup: string,
    attribAddedCode: string,
    attribDeletedCode?: string | null,
    associatedAttribCode?: string | null
  ): Observable<ApiResponse<boolean>> {
    let url = API.VALID_ATTRIBUTES_MATRIX.DELETE(attribAddedGroup, attribAddedCode);
    const qp: string[] = [];
    if (attribDeletedCode) qp.push(`attribDeletedCode=${encodeURIComponent(attribDeletedCode)}`);
    if (associatedAttribCode) qp.push(`associatedAttribCode=${encodeURIComponent(associatedAttribCode)}`);
    if (qp.length) url += `?${qp.join('&')}`;
    return this.apiService
      .delete<ApiResponse<boolean>>(url, {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true)
      })
      .pipe(catchError((error) => throwError(() => error)));
  }

  getAttributeGroups(searchParam?: string): Observable<AttributeGroupDropdown[]> {
    return this.apiService
      .get<AttributeGroupDropdown[]>(API.VALID_ATTRIBUTES_MATRIX.ATTRIBUTE_GROUPS(searchParam))
      .pipe(catchError((error) => throwError(() => error)));
  }

  getAttributeCodes(attribGroup?: string, searchParam?: string): Observable<AttributeCodeDropdown[]> {
    return this.apiService
      .get<AttributeCodeDropdown[]>(API.VALID_ATTRIBUTES_MATRIX.ATTRIBUTE_CODES(attribGroup, searchParam))
      .pipe(catchError((error) => throwError(() => error)));
  }

  getDeletedAttributeCodes(attribGroup?: string, searchParam?: string): Observable<AttributeCodeDropdown[]> {
    return this.apiService
      .get<AttributeCodeDropdown[]>(API.VALID_ATTRIBUTES_MATRIX.DELETED_ATTRIBUTE_CODES(attribGroup, searchParam))
      .pipe(catchError((error) => throwError(() => error)));
  }

  getAssociatedAttributeCodes(attribGroup?: string, searchParam?: string): Observable<AttributeCodeDropdown[]> {
    return this.apiService
      .get<AttributeCodeDropdown[]>(API.VALID_ATTRIBUTES_MATRIX.ASSOCIATED_ATTRIBUTE_CODES(attribGroup, searchParam))
      .pipe(catchError((error) => throwError(() => error)));
  }

  getModifierCodes(searchParam?: string): Observable<ModifierCodeDropdown[]> {
    return this.apiService
      .get<ModifierCodeDropdown[]>(API.VALID_ATTRIBUTES_MATRIX.MODIFIER_CODES(searchParam))
      .pipe(catchError((error) => throwError(() => error)));
  }
}
