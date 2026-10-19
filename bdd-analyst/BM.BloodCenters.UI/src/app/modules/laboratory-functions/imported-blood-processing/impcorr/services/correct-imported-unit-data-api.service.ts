import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpContext } from '@angular/common/http';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  ComponentAttributeDto,
  ComponentAttributeModel,
  CreateComponentAttributeRequestDto,
  UpdateComponentAttributeRequestDto,
  ComponentAttributeQueryDto,
  AttributeGroupDropdownDto,
  AttributeCodeDropdownDto,
  ProductCodeDropdownDto,
  ContractDropdownDto,
  AboLabelDropdownDto,
  ValidProductCodeDropdownDto,
  AttributeGroupLov,
  AttributeCodeLov,
  ProductCodeLov,
  ContractLov,
  AboLabelLov,
  SaveComponentAttributeRequestDto,
} from '../models/correct-imported-unit-data.model';

/** Standard API response envelope */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  errorCode?: string;
  data: T;
  totalCount?: number;
}

const SKIP_TOAST = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

/**
 * API Service for Correct Imported Unit Data
 * Base: /api/v1/correct-imported-units
 * JIRA: MLT-12626 / MLT-12628 | Mnemonic: IMPCORR
 */
@Injectable({ providedIn: 'root' })
export class CorrectImportedUnitDataApiService {
  private readonly apiService = inject(ApiService);

  /** POST /correct-imported-units/{take}/{skip} — get all attributes for a unit+product */
  getComponentAttributes(
    take: number,
    skip: number,
    queryDto: ComponentAttributeQueryDto = {}
  ): Observable<{ data: ComponentAttributeModel[]; total: number }> {
    return this.apiService
      .post<ApiResponse<ComponentAttributeDto[]>>(
        API.CORRECT_IMPORTED_UNITS.GET_ALL(take, skip),
        {
          unitId: queryDto.unitId,
          productCode: queryDto.productCode,
          attribGroup: queryDto.attribGroup,
          attribCode: queryDto.attribCode,
          searchKeyword: queryDto.searchKeyword,
          sortColumn: queryDto.sortColumn,
          sortOrder: queryDto.sortOrder
        }
      )
      .pipe(
        map(response => ({
          data: (response.data || []).map(dto => this.mapToModel(dto)),
          total: response.totalCount || 0
        }))
      );
  }

  /** GET /correct-imported-units/{unitId}/{chapterId}/{productCode}/{attribGroup}/{attribCode} */
  getComponentAttributeById(
    unitId: string,
    chapterId: string,
    productCode: string,
    attribGroup: string,
    attribCode: string
  ): Observable<ComponentAttributeModel> {
    return this.apiService
      .get<ApiResponse<ComponentAttributeDto>>(
        API.CORRECT_IMPORTED_UNITS.GET_BY_ID(unitId, chapterId, productCode, attribGroup, attribCode)
      )
      .pipe(map(response => this.mapToModel(response.data)));
  }

  /** POST /correct-imported-units — create a new attribute row */
  createComponentAttribute(
    request: CreateComponentAttributeRequestDto
  ): Observable<ComponentAttributeModel> {
    return this.apiService
      .post<ApiResponse<ComponentAttributeDto>>(
        API.CORRECT_IMPORTED_UNITS.CREATE,
        request,
        SKIP_TOAST
      )
      .pipe(
        map(response => {
          if (response.success === false) {
            throw { error: { message: response.message, statusCode: response.statusCode, errorCode: response.errorCode }, status: response.statusCode || 400 };
          }
          return this.mapToModel(response.data);
        })
      );
  }

  /** PUT /correct-imported-units/{unitId}/{chapterId}/{productCode}/{attribGroup}/{attribCode} */
  updateComponentAttribute(
    unitId: string,
    chapterId: string,
    productCode: string,
    attribGroup: string,
    attribCode: string,
    request: UpdateComponentAttributeRequestDto
  ): Observable<ComponentAttributeModel> {
    return this.apiService
      .put<ApiResponse<ComponentAttributeDto>>(
        API.CORRECT_IMPORTED_UNITS.UPDATE(unitId, chapterId, productCode, attribGroup, attribCode),
        request,
        SKIP_TOAST
      )
      .pipe(
        map(response => {
          if (response.success === false) {
            throw { error: { message: response.message, statusCode: response.statusCode, errorCode: response.errorCode }, status: response.statusCode || 400 };
          }
          return this.mapToModel(response.data);
        })
      );
  }

  /** DELETE /correct-imported-units/{unitId}/{chapterId}/{productCode}/{attribGroup}/{attribCode} */
  deleteComponentAttribute(
    unitId: string,
    chapterId: string,
    productCode: string,
    attribGroup: string,
    attribCode: string
  ): Observable<void> {
    return this.apiService
      .delete<ApiResponse<void>>(
        API.CORRECT_IMPORTED_UNITS.DELETE(unitId, chapterId, productCode, attribGroup, attribCode),
        SKIP_TOAST
      )
      .pipe(
        map(response => {
          if (response.success === false) {
            throw { error: { message: response.message, statusCode: response.statusCode, errorCode: response.errorCode }, status: response.statusCode || 400 };
          }
          return;
        })
      );
  }

  /** GET /correct-imported-units/attribute-groups */
  getAttributeGroups(): Observable<AttributeGroupLov[]> {
    return this.apiService
      .get<ApiResponse<AttributeGroupDropdownDto[]>>(
        API.CORRECT_IMPORTED_UNITS.ATTRIBUTE_GROUPS
      )
      .pipe(
        map(response =>
          (response.data || []).map(item => ({
            code: item.code,
            description: item.description
          }))
        )
      );
  }

  /** GET /correct-imported-units/attribute-codes/{attribGroup}?codeScheme=... */
  getAttributeCodes(attribGroup: string, codeScheme: string): Observable<AttributeCodeLov[]> {
    return this.apiService
      .get<ApiResponse<AttributeCodeDropdownDto[]>>(
        `${API.CORRECT_IMPORTED_UNITS.ATTRIBUTE_CODES(attribGroup)}?codeScheme=${encodeURIComponent(codeScheme)}`
      )
      .pipe(
        map(response =>
          (response.data || []).map(item => ({
            code: item.code,
            description: item.description
          }))
        )
      );
  }

  /** GET /correct-imported-units/contracts */
  getContracts(): Observable<ContractLov[]> {
    return this.apiService
      .get<ApiResponse<ContractDropdownDto[]>>(
        API.CORRECT_IMPORTED_UNITS.CONTRACTS
      )
      .pipe(
        map(response =>
          (response.data || []).map(item => ({
            code: item.code,
            description: item.description
          }))
        )
      );
  }

  /** GET /correct-imported-units/product-codes/{unitId}?codeScheme=... */
  getProductCodes(unitId: string, codeScheme: string): Observable<ProductCodeLov[]> {
    return this.apiService
      .get<ApiResponse<ProductCodeDropdownDto[]>>(
        `${API.CORRECT_IMPORTED_UNITS.PRODUCT_CODES(unitId)}?codeScheme=${encodeURIComponent(codeScheme)}`,
        SKIP_TOAST
      )
      .pipe(
        map(response =>
          (response.data || []).map(item => ({
            code: item.productCode,
            description: item.productDesc,
            productType: item.productType
          }))
        )
      );
  }

  /** GET /correct-imported-units/code-scheme/{unitId} */
  getUnitCodeScheme(unitId: string): Observable<string> {
    return this.apiService
      .get<ApiResponse<{ codeScheme: string }>>(
        API.CORRECT_IMPORTED_UNITS.CODE_SCHEME(unitId)
      )
      .pipe(map(response => response.data?.codeScheme ?? 'I'));
  }

  /** GET /correct-imported-units/abo-labels?codeScheme=... */
  getAboLabels(codeScheme: string): Observable<AboLabelLov[]> {
    return this.apiService
      .get<ApiResponse<AboLabelDropdownDto[]>>(
        API.CORRECT_IMPORTED_UNITS.ABO_LABELS(codeScheme)
      )
      .pipe(
        map(response =>
          (response.data || []).map(item => ({
            code: item.code,
            description: item.description
          }))
        )
      );
  }

  /** POST /correct-imported-units/save — single-call save for all unit details + attributes */
  saveComponentAttribute(request: SaveComponentAttributeRequestDto): Observable<void> {
    return this.apiService
      .post<ApiResponse<unknown>>(API.CORRECT_IMPORTED_UNITS.SAVE, request, SKIP_TOAST)
      .pipe(
        map(response => {
          if (response.success === false) {
            throw { error: { message: response.message, statusCode: response.statusCode, errorCode: response.errorCode }, status: response.statusCode || 400 };
          }
        })
      );
  }

  /** GET /correct-imported-units/valid-product-codes?codeScheme=...&productType=... */
  getValidProductCodes(codeScheme: string, productType: string): Observable<ProductCodeLov[]> {
    return this.apiService
      .get<ApiResponse<ValidProductCodeDropdownDto[]>>(
        API.CORRECT_IMPORTED_UNITS.VALID_PRODUCT_CODES(codeScheme, productType)
      )
      .pipe(
        map(response =>
          (response.data || []).map(item => ({
            code: item.productCode,
            description: item.productShortName
          }))
        )
      );
  }

  /** Map backend DTO → frontend ComponentAttributeModel */
  mapToModel(dto: ComponentAttributeDto | null | undefined): ComponentAttributeModel {
    if (!dto) throw new Error('Server returned invalid data format');
    return {
      unitId: dto.unitId,
      chapterId: dto.chapterId,
      productCode: dto.productCode,
      attributeGroup: dto.attribGroup,
      attributeCode: dto.attribCode,
      originalImportedProduct: dto.orgImportedProd ?? null,
      attributeGroupDescription: dto.attributeGroupDesc ?? null,
      attributeCodeDescription: dto.attributeCodeDesc ?? null,
      insertDate: dto.insertDate,
      insertUserId: dto.insertUserId,
      programId: dto.programId ?? null,
      contractId: dto.contractId ?? null,
      externalUnitId: dto.osUnitId ?? null,
      receivedDate: dto.receivedDate ?? null,
      batchId: dto.batchId ?? null,
      checkInUser: dto.labelUserId ?? null,
      checkInDate: dto.labelDats ?? null,
      aboLabel: dto.systemLabelDecision ?? null,
      expirationDate: dto.componentExpiryDate ?? null,
      licenseFlag: dto.impLicenseFlag ?? null,
      componentPrefix: dto.componentPrefix ?? null,
    };
  }
}
