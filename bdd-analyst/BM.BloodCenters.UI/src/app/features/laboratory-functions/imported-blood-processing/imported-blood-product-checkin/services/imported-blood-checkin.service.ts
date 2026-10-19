import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  CreateBatchInputDto,
  BatchResponse,
  BatchQueryDto
} from '../models/batch.model';
import { CreateComponentDto, ComponentResponse } from '../models/component.model';
import { ComponentAttributeDto, AttributeGridItem } from '../models/attribute.model';
import { CartonDto } from '../models/carton.model';
import { ValidateUnitIdDto, ValidateProductCodeDto } from '../models/barcode-validation.model';
import { ContractLovDto, ProductTypeLovDto, ContractTestDto, AboLabelDropdownDto } from '../models/contract.model';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  total?: number;
  totalCount?: number;
  item?: T;
}

@Injectable({
  providedIn: 'root'
})
export class ImportedBloodCheckinService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // ============= LOV / Dropdowns =============

  /** GET /lov/contracts — populates Contract dropdown */
  getContracts(): Observable<ContractLovDto[]> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.LOV_CONTRACTS}`;
    return this.http.get<ApiResponse<ContractLovDto[]>>(url).pipe(
      map(r => r.data ?? [])
    );
  }

  /** GET /lov/abo-values?productCode=&codeScheme= — populates ABO dropdown */
  getAboValues(productCode: string, codeScheme: string): Observable<AboLabelDropdownDto[]> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.LOV_ABO_VALUES}`;
    const params = new HttpParams().set('productCode', productCode).set('codeScheme', codeScheme);
    return this.http.get<ApiResponse<AboLabelDropdownDto[]>>(url, { params }).pipe(
      map(r => r.data ?? [])
    );
  }

  /** GET /lov/product-types — populates Product Type dropdown */
  getProductTypes(): Observable<ProductTypeLovDto[]> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.LOV_PRODUCT_TYPES}`;
    return this.http.get<ApiResponse<ProductTypeLovDto[]>>(url).pipe(
      map(r => r.data ?? [])
    );
  }

  // ============= Batch Operations =============

  /** GET /lov/product-codes?productType=&codeScheme= — populates Product Code dropdown */
  getProductCodes(productType: string, codeScheme: string): Observable<{code: string, description: string}[]> {
    const params = new HttpParams().set('productType', productType).set('codeScheme', codeScheme);
    return this.http.get<ApiResponse<{code: string, description: string}[]>>(
      API.IMPORTED_BLOOD_CHECKIN.LOV_PRODUCT_CODES, { params }
    ).pipe(map(r => r.data ?? []));
  }

  /** PUT /batches/{batchId} — update existing batch */
  updateBatch(batchId: string, dto: CreateBatchInputDto): Observable<BatchResponse> {
    const url = `${API.IMPORTED_BLOOD_CHECKIN.GET_BATCH(batchId)}`;
    return this.http.put<ApiResponse<BatchResponse[]>>(url, dto).pipe(
      map(r => r.data[0])
    );
  }

  /** POST /batches — create a new batch */
  createBatch(dto: CreateBatchInputDto): Observable<BatchResponse> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.CREATE_BATCH}`;
    return this.http.post<ApiResponse<BatchResponse[]>>(url, dto).pipe(
      map(r => r.data[0])
    );
  }

  /** GET /batches/{take}/{skip}?contractId=&fromDate=&toDate=&incompleteOnly= */
  getBatches(
    take: number,
    skip: number,
    filters?: BatchQueryDto
  ): Observable<{ data: BatchResponse[]; totalCount: number }> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.GET_BATCHES(take, skip)}`;
    let params = new HttpParams();
    if (filters?.contractId) params = params.set('contractId', filters.contractId);
    if (filters?.fromDate) params = params.set('fromDate', filters.fromDate);
    if (filters?.toDate) params = params.set('toDate', filters.toDate);
    if (filters?.incompleteOnly) params = params.set('incompleteOnly', 'true');
    return this.http.get<ApiResponse<BatchResponse[]>>(url, { params }).pipe(
      map(r => ({ data: r.data ?? [], totalCount: r.total ?? r.totalCount ?? 0 }))
    );
  }

  /** GET /batches/{batchId} */
  getBatch(batchId: string): Observable<BatchResponse> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.GET_BATCH(batchId)}`;
    return this.http.get<ApiResponse<BatchResponse[]>>(url).pipe(
      map(r => r.data[0])
    );
  }

  /** GET /contracts/{contractId}/tests */
  getContractTests(contractId: string): Observable<ContractTestDto[]> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.GET_CONTRACT_TESTS(contractId)}`;
    return this.http.get<ApiResponse<ContractTestDto[]>>(url).pipe(
      map(r => r.data ?? [])
    );
  }

  // ============= Carton Operations =============

  /** POST /batches/{batchId}/cartons?expectedCount= */
  addCartons(
    batchId: string,
    expectedCount: number,
    cartons: CartonDto[]
  ): Observable<CartonDto[]> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.ADD_CARTONS(batchId, expectedCount)}`;
    return this.http.post<ApiResponse<CartonDto[]>>(url, cartons).pipe(
      map(r => r.data ?? [])
    );
  }

  /** GET /batches/{batchId}/cartons */
  getCartonsByBatch(batchId: string): Observable<CartonDto[]> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.GET_CARTONS(batchId)}`;
    return this.http.get<ApiResponse<CartonDto[]>>(url).pipe(
      map(r => r.data ?? [])
    );
  }

  // ============= Barcode Validation =============

  /** POST /validate/unit-id */
  validateUnitId(dto: ValidateUnitIdDto): Observable<string> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.VALIDATE_UNIT_ID}`;
    return this.http.post<ApiResponse<string[]>>(url, dto).pipe(
      map(r => r.data[0])
    );
  }

  /** GET /validate-product-code-field — validates raw typed product code against DB */
  validateProductCodeField(productCode: string, productType: string, codeScheme: string): Observable<boolean> {
    return this.http.get<ApiResponse<boolean[]>>(
      API.IMPORTED_BLOOD_CHECKIN.VALIDATE_PRODUCT_CODE_FIELD,
      { params: { productCode, productType, codeScheme }, context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    ).pipe(map(r => r.success ?? false));
  }

  /** POST /validate/product-code */
  validateProductCode(dto: ValidateProductCodeDto): Observable<string> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.VALIDATE_PRODUCT_CODE}`;
    return this.http.post<ApiResponse<string[]>>(url, dto).pipe(
      map(r => r.data[0])
    );
  }

  // ============= Component Operations =============

  /** POST /components */
  checkInComponent(dto: CreateComponentDto): Observable<ComponentResponse> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.CHECK_IN_COMPONENT}`;
    return this.http.post<ApiResponse<ComponentResponse[]>>(url, dto).pipe(
      map(r => r.data[0])
    );
  }

  /** GET /components/{unitId} */
  getComponent(unitId: string): Observable<ComponentResponse> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.GET_COMPONENT(unitId)}`;
    return this.http.get<ApiResponse<ComponentResponse[]>>(url).pipe(
      map(r => r.data[0])
    );
  }

  /** GET /check-duplicate-external-unit — checks if os_unit_id already exists for this contract */
  checkDuplicateExternalUnit(osUnitId: string, contractId: string): Observable<boolean> {
    return this.http.get<ApiResponse<boolean[]>>(
      API.IMPORTED_BLOOD_CHECKIN.CHECK_DUPLICATE_EXTERNAL_UNIT,
      { params: { osUnitId, contractId }, context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    ).pipe(map(r => r.data?.[0] ?? false));
  }

  /** GET /check-unit-contract-conflict — checks if unit_id exists under a different contract */
  checkUnitContractConflict(unitId: string, contractId: string): Observable<boolean> {
    return this.http.get<ApiResponse<boolean[]>>(
      API.IMPORTED_BLOOD_CHECKIN.CHECK_UNIT_CONTRACT_CONFLICT,
      { params: { unitId, contractId }, context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    ).pipe(map(r => r.data?.[0] ?? false));
  }

  /** GET /batches/{batchId}/components/{take}/{skip} */
  getComponentsByBatch(
    batchId: string,
    take: number,
    skip: number
  ): Observable<{ data: ComponentResponse[]; totalCount: number }> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.GET_COMPONENTS_BY_BATCH(batchId, take, skip)}`;
    return this.http.get<ApiResponse<ComponentResponse[]>>(url).pipe(
      map(r => ({ data: r.data ?? [], totalCount: r.total ?? r.totalCount ?? 0 }))
    );
  }

  /** PUT /components/{unitId}/status — status sent as plain JSON string */
  updateComponentStatus(unitId: string, status: string): Observable<boolean> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.UPDATE_COMPONENT_STATUS(unitId)}`;
    return this.http.put<ApiResponse<boolean>>(url, JSON.stringify(status), {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(map(() => true));
  }

  // ============= Component Attribute Operations =============

  /** GET /components/{unitId}/attributes?productCode= */
  getComponentAttributes(unitId: string, productCode: string): Observable<AttributeGridItem[]> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.GET_COMPONENT_ATTRIBUTES(unitId)}`;
    const params = new HttpParams().set('productCode', productCode);
    return this.http.get<ApiResponse<AttributeGridItem[]>>(url, { params }).pipe(
      map(r => r.data ?? [])
    );
  }

  /** POST /components/{unitId}/attributes?productCode=&productType= */
  addComponentAttributes(
    unitId: string,
    productCode: string,
    productType: string,
    attributes: ComponentAttributeDto[]
  ): Observable<AttributeGridItem[]> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.ADD_COMPONENT_ATTRIBUTES(unitId)}`;
    const params = new HttpParams().set('productCode', productCode).set('productType', productType);
    return this.http.post<ApiResponse<AttributeGridItem[]>>(url, attributes, { params }).pipe(
      map(r => r.data ?? [])
    );
  }

  /** PUT /components/{unitId}/attributes?productCode=&productType= */
  updateComponentAttributes(
    unitId: string,
    productCode: string,
    productType: string,
    attributes: ComponentAttributeDto[]
  ): Observable<boolean> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.UPDATE_COMPONENT_ATTRIBUTES(unitId)}`;
    const params = new HttpParams().set('productCode', productCode).set('productType', productType);
    return this.http.put<ApiResponse<boolean>>(url, attributes, { params }).pipe(
      map(() => true)
    );
  }

  // ============= LOV / Attribute Lookups =============

  /** GET /lov/attribute-groups — populates Attribute Group dropdown */
  getAttributeGroups(): Observable<{code: string, description: string}[]> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.LOV_ATTRIBUTE_GROUPS}`;
    return this.http.get<ApiResponse<{code: string, description: string}[]>>(url).pipe(
      map(r => r.data ?? [])
    );
  }

  /** GET /lov/attribute-codes?attribGroup=&codeScheme= — populates Attribute Code dropdown */
  getAttributeCodes(attribGroup: string, codeScheme: string): Observable<{code: string, description: string}[]> {
    const url = `${this.baseUrl}${API.IMPORTED_BLOOD_CHECKIN.LOV_ATTRIBUTE_CODES}`;
    const params = new HttpParams().set('attribGroup', attribGroup).set('codeScheme', codeScheme);
    return this.http.get<ApiResponse<{code: string, description: string}[]>>(url, { params }).pipe(
      map(r => r.data ?? [])
    );
  }

}
