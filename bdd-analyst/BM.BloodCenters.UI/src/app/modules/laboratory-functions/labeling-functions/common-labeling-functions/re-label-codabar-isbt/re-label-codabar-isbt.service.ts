import { Injectable, inject } from '@angular/core';
import { HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  ApiResponse,
  UserAccessResponse,
  UnitValidationResult,
  ComponentItem,
  UnitAttribute,
  AboMapping,
  IsbtProductCodeMapping,
  SpecialTestingCode,
  FacilityCode,
  CatalogNumber,
  LotNumber,
  AboValue,
  ProductCode,
  ProductCodeDropdownItem,
  UnitNote,
  AddNoteRequest,
  ValidateComponentRequest,
  ValidateIsbtDetailsRequest,
  VerifyLabelRequest,
  RelabelRequest,
  RelabelCommitRequest,
  RelabelPrintLabelRequest,
} from './re-label-codabar-isbt.model';

const SKIP = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

@Injectable({ providedIn: 'root' })
export class ReLabelCodabarIsbtService {
  private readonly apiService = inject(ApiService);

  // 1. Validate Unit — GET /relabel-codabar-isbt/unit/{unitId}
  validateUnit(unitId: string): Observable<ApiResponse<UnitValidationResult>> {
    return this.apiService.get<ApiResponse<UnitValidationResult>>(
      API.RELABEL_CODABAR_ISBT.VALIDATE_UNIT(unitId),
      SKIP,
    );
  }

  // 2. Get Components — GET /relabel-codabar-isbt/components
  getComponents(
    unitId: string,
    collectionDate: string,
    productCode?: string,
  ): Observable<ApiResponse<ComponentItem>> {
    let params = new HttpParams()
      .set('unitId', unitId)
      .set('collectionDate', collectionDate);
    if (productCode) params = params.set('productCode', productCode);
    return this.apiService.get<ApiResponse<ComponentItem>>(
      API.RELABEL_CODABAR_ISBT.COMPONENTS,
      { ...SKIP, params },
    );
  }

  // 3. Validate Component — POST /relabel-codabar-isbt/validate-component
  validateComponent(request: ValidateComponentRequest): Observable<ApiResponse<unknown>> {
    return this.apiService.post<ApiResponse<unknown>>(
      API.RELABEL_CODABAR_ISBT.VALIDATE_COMPONENT,
      request,
      SKIP,
    );
  }

  // 4. Get Product Codes — GET /relabel-codabar-isbt/product-codes
  getProductCodes(): Observable<ApiResponse<ProductCode>> {
    return this.apiService.get<ApiResponse<ProductCode>>(
      API.RELABEL_CODABAR_ISBT.PRODUCT_CODES,
      SKIP,
    );
  }

  // 5. Get Unit Attributes — GET /relabel-codabar-isbt/unit-attributes
  getUnitAttributes(unitId: string, productCode?: string): Observable<ApiResponse<UnitAttribute>> {
    let params = new HttpParams().set('unitId', unitId);
    if (productCode) params = params.set('productCode', productCode);
    return this.apiService.get<ApiResponse<UnitAttribute>>(
      API.RELABEL_CODABAR_ISBT.UNIT_ATTRIBUTES,
      { ...SKIP, params },
    );
  }

  // 6. Validate ISBT Details — POST /relabel-codabar-isbt/validate-isbt-details
  validateIsbtDetails(request: ValidateIsbtDetailsRequest): Observable<ApiResponse<unknown>> {
    return this.apiService.post<ApiResponse<unknown>>(
      API.RELABEL_CODABAR_ISBT.VALIDATE_ISBT_DETAILS,
      request,
    );
  }

  // 7. Get ABO Mapping — GET /relabel-codabar-isbt/abo-mapping?codabarSld={sld}&unitId={unitId}&collectionDate={collDate}
  getAboMapping(codabarSld: string, unitId?: string, collectionDate?: string): Observable<ApiResponse<AboMapping>> {
    let params = new HttpParams().set('codabarSld', codabarSld);
    if (unitId) params = params.set('unitId', unitId);
    if (collectionDate) params = params.set('collectionDate', collectionDate);
    return this.apiService.get<ApiResponse<AboMapping>>(
      API.RELABEL_CODABAR_ISBT.ABO_MAPPING,
      { ...SKIP, params },
    );
  }

  // 8. Get ISBT Product Code Mapping — GET /relabel-codabar-isbt/isbt-product-code/{code}?unitId={unitId}
  getIsbtProductCodeMapping(
    codabarProductCode: string,
    unitId?: string,
  ): Observable<ApiResponse<IsbtProductCodeMapping>> {
    let params = new HttpParams();
    if (unitId) params = params.set('unitId', unitId);
    return this.apiService.get<ApiResponse<IsbtProductCodeMapping>>(
      API.RELABEL_CODABAR_ISBT.ISBT_PRODUCT_CODE(codabarProductCode),
      { ...SKIP, params },
    );
  }

  // 9. Check User Access — GET /relabel-codabar-isbt/check-user-access?accessClass={class}
  checkUserAccess(accessClass: string): Observable<UserAccessResponse> {
    const params = new HttpParams().set('accessClass', accessClass);
    return this.apiService.get<UserAccessResponse>(
      API.RELABEL_CODABAR_ISBT.CHECK_USER_ACCESS,
      { ...SKIP, params },
    );
  }

  // 10. Verify Label — POST /relabel-codabar-isbt/verify-label
  verifyLabel(request: VerifyLabelRequest): Observable<ApiResponse<unknown>> {
    return this.apiService.post<ApiResponse<unknown>>(
      API.RELABEL_CODABAR_ISBT.VERIFY_LABEL,
      request,
    );
  }

  // 11. Relabel Commit — POST /relabel-codabar-isbt/relabel-commit
  relabelCommit(request: RelabelCommitRequest): Observable<ApiResponse<unknown>> {
    return this.apiService.post<ApiResponse<unknown>>(
      API.RELABEL_CODABAR_ISBT.RELABEL_COMMIT,
      request,
    );
  }

  // 12. Dropdown: ABO Values — GET /relabel-codabar-isbt/abo-values
  getAboValues(): Observable<ApiResponse<AboValue>> {
    return this.apiService.get<ApiResponse<AboValue>>(
      API.RELABEL_CODABAR_ISBT.ABO_VALUES,
      SKIP,
    );
  }

  // 12. Dropdown: Catalog Numbers — GET /relabel-codabar-isbt/catalog-numbers
  getCatalogNumbers(): Observable<ApiResponse<CatalogNumber>> {
    return this.apiService.get<ApiResponse<CatalogNumber>>(
      API.RELABEL_CODABAR_ISBT.CATALOG_NUMBERS,
      SKIP,
    );
  }

  // 12. Dropdown: Lot Numbers — GET /relabel-codabar-isbt/lot-numbers?catalogNumber={catalogNumber}
  getLotNumbers(catalogNumber: string): Observable<ApiResponse<LotNumber>> {
    const params = new HttpParams().set('catalogNumber', catalogNumber);
    return this.apiService.get<ApiResponse<LotNumber>>(
      API.RELABEL_CODABAR_ISBT.LOT_NUMBERS,
      { ...SKIP, params },
    );
  }

  // 12. Dropdown: Facility Codes — GET /relabel-codabar-isbt/facility-codes?contractId={contractId}
  // contractId is optional; backend defaults to "INTERNAL" when omitted.
  getFacilityCodes(contractId?: string): Observable<ApiResponse<FacilityCode>> {
    const options = contractId
      ? { ...SKIP, params: new HttpParams().set('contractId', contractId) }
      : SKIP;
    return this.apiService.get<ApiResponse<FacilityCode>>(
      API.RELABEL_CODABAR_ISBT.FACILITY_CODES,
      options,
    );
  }

  // 12. Dropdown: Special Testing Codes — GET /relabel-codabar-isbt/special-testing-codes
  getSpecialTestingCodes(): Observable<ApiResponse<SpecialTestingCode>> {
    return this.apiService.get<ApiResponse<SpecialTestingCode>>(
      API.RELABEL_CODABAR_ISBT.SPECIAL_TESTING_CODES,
      SKIP,
    );
  }

  // 13. Product Code Dropdown (unit-filtered) — GET /relabel-codabar-isbt/product-code-dropdown?unitId={unitId}
  getProductCodeDropdown(unitId: string): Observable<ApiResponse<ProductCodeDropdownItem>> {
    const params = new HttpParams().set('unitId', unitId);
    return this.apiService.get<ApiResponse<ProductCodeDropdownItem>>(
      API.RELABEL_CODABAR_ISBT.PRODUCT_CODE_DROPDOWN,
      { ...SKIP, params },
    );
  }

  // 14. Print Label — POST /relabel-codabar-isbt/print-label
  printLabel(request: RelabelPrintLabelRequest): Observable<ApiResponse<unknown>> {
    return this.apiService.post<ApiResponse<unknown>>(
      API.RELABEL_CODABAR_ISBT.PRINT_LABEL,
      request,
    );
  }

  // 15. Relabel — POST /relabel-codabar-isbt/relabel
  relabel(request: RelabelRequest): Observable<ApiResponse<unknown>> {
    return this.apiService.post<ApiResponse<unknown>>(
      API.RELABEL_CODABAR_ISBT.RELABEL,
      request,
    );
  }

  // 15. Get Unit Notes — GET /relabel-codabar-isbt/unit-notes?unitId={unitId}
  getUnitNotes(unitId: string): Observable<ApiResponse<UnitNote>> {
    const params = new HttpParams().set('unitId', unitId);
    return this.apiService.get<ApiResponse<UnitNote>>(
      API.RELABEL_CODABAR_ISBT.UNIT_NOTES,
      { ...SKIP, params },
    );
  }

  // 16. Add Unit Note — POST /relabel-codabar-isbt/unit-notes?unitId={unitId}
  addUnitNote(unitId: string, request: AddNoteRequest): Observable<ApiResponse<UnitNote>> {
    const params = new HttpParams().set('unitId', unitId);
    return this.apiService.post<ApiResponse<UnitNote>>(
      API.RELABEL_CODABAR_ISBT.UNIT_NOTES,
      request,
      { params },
    );
  }

  // 17. Delete Unit Note — DELETE /relabel-codabar-isbt/unit-notes/{auditKey}?unitId={unitId}
  deleteUnitNote(unitId: string, auditKey: number): Observable<ApiResponse<unknown>> {
    const params = new HttpParams().set('unitId', unitId);
    return this.apiService.delete<ApiResponse<unknown>>(
      API.RELABEL_CODABAR_ISBT.UNIT_NOTES_DELETE(auditKey),
      { params },
    );
  }
}
