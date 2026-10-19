import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../../../../environments/environment';
import {
  PathogenReductionDetailsDto,
  CheckSuitabilityRequestDto,
  CheckSuitabilityResponseDto,
  SaveSuitabilityRequestDto,
  UpdateSuitabilityRequestDto,
  SterileDockingRequestDto,
  UpdateIntermediateProcessRequestDto,
  UpdateFinalTransferRequestDto,
  SaveFinalProductsRequestDto,
  ProductCategoryDto,
  PathogenConfigDto,
  PathogenReductionStatusDto,
  PathogenReductionQueryStatusDto,
  SuspensionTypeDto,
  VolumeTypeSetDto,
  EquipmentSerialNumberDto,
  IlluminatorEquipmentTypeDto,
  SterileDockingMachineDto,
  WaferLotNumberDto,
  SetLotNumberDto,
  ProductCodeDto,
  ProductDetailsDto,
  InterimProductCodeDto,
  ChapterDto,
  UnitDetailsDto,
  PathogenFinalProductDto,
  ReprintLabelRequestDto,
  ReprintLabelResponseDto,
  PathogenReductionApiResponse,
  SaveSuitabilityResponse,
  SterileDockingResponse,
  SaveFinalProductsResponse,
  CalculateIntendedUseRequestDto,
  CalculateIntendedUseResponseDto
} from '../models/pathogen-reduction.model';

/**
 * Service for Pathogen Reduction Manager API operations
 * Base URL: /api/pathogen-reduction
 *
 * Workflow Steps:
 * 1. Check Suitability (algorithm execution)
 * 2. Save Suitability (create record if suitable)
 * 3. Sterile Docking (PL/SQL procedure call)
 * 4. Intermediate Processing (illumination/treatment)
 * 5. Final Transfer (CAD time, bags)
 * 6. Final Products (create product records)
 */
@Injectable({
  providedIn: 'root'
})
export class PathogenReductionManagerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/pathogen-reduction`;

  /**
   * 1. GET /pathogen-reduction/{unitId}
   * Retrieve pathogen reduction details for a specific unit
   *
   * @param unitId - Unit identifier (max 14 chars)
   * @param prodCode - Optional product code filter (max 5 chars)
   * @returns Observable<PathogenReductionDetailsDto>
   */
  getPathogenReductionDetails(
    unitId: string,
    prodCode?: string,
    tab?: string
  ): Observable<PathogenReductionDetailsDto> {
    let params = new HttpParams();
    if (prodCode) {
      params = params.set('prodCode', prodCode);
    }
    if (tab) {
      params = params.set('tab', tab);
    }

    return this.http
      .get<PathogenReductionApiResponse<PathogenReductionDetailsDto[]>>(
        `${this.baseUrl}/${encodeURIComponent(unitId)}`,
        { params }
      )
      .pipe(map(response => response.data[0])); // Extract first element from array
  }

  /**
   * 2. GET /pathogen-reduction/product-categories
   * Retrieve valid product categories for pathogen reduction (from MASTER_CODES PARDT)
   *
   * @returns Observable<ProductCategoryDto[]>
   */
  getProductCategories(): Observable<ProductCategoryDto[]> {
    return this.http
      .get<PathogenReductionApiResponse<ProductCategoryDto[]>>(
        `${this.baseUrl}/product-categories`
      )
      .pipe(map(response => response.data));
  }

  /**
   * 3. GET /pathogen-reduction/config
   * Retrieve valid pathogen reduction configuration ranges
   *
   * @returns Observable<PathogenConfigDto[]>
   */
  getConfiguration(): Observable<PathogenConfigDto[]> {
    return this.http
      .get<PathogenReductionApiResponse<PathogenConfigDto[]>>(
        `${this.baseUrl}/config`
      )
      .pipe(map(response => response.data));
  }

  /**
   * 4. GET /pathogen-reduction/status
   * Get pathogen reduction status overview for the chapter (dashboard view)
   *
   * @returns Observable<PathogenReductionStatusDto>
   */
  getStatusOverview(): Observable<PathogenReductionStatusDto> {
    return this.http
      .get<PathogenReductionApiResponse<PathogenReductionStatusDto>>(
        `${this.baseUrl}/status`
      )
      .pipe(map(response => response.data));
  }

  /**
   * GET /pathogen-reduction/query-status
   * Get units currently in CAD (Component Adsorption Device) process
   * Returns units with their status, CAD time elapsed, and priority
   *
   * @returns Observable<PathogenReductionQueryStatusDto[]>
   */
  getQueryStatus(): Observable<PathogenReductionQueryStatusDto[]> {
    return this.http
      .get<PathogenReductionApiResponse<PathogenReductionQueryStatusDto[]>>(
        `${this.baseUrl}/query-status`
      )
      .pipe(map(response => response.data));
  }

  /**
   * GET /pathogen-reduction/units/{unitId}
   * Retrieve unit details from UNITS table (collection date, bleed times, etc.)
   *
   * @param unitId - Unit identifier
   * @returns Observable<UnitDetailsDto>
   */
  getUnitDetails(unitId: string): Observable<UnitDetailsDto> {
    return this.http
      .get<PathogenReductionApiResponse<UnitDetailsDto[]>>(
        `${this.baseUrl}/units/${encodeURIComponent(unitId)}`
      )
      .pipe(map(response => response.data[0])); // Return first item from array
  }

  /**
   * GET /pathogen-reduction/suspension-types
   * Retrieve suspension types for dropdowns (includes equipType)
   *
   * @returns Observable<SuspensionTypeDto[]>
   */
  getSuspensionTypes(): Observable<SuspensionTypeDto[]> {
    return this.http
      .get<PathogenReductionApiResponse<SuspensionTypeDto[]>>(
        `${this.baseUrl}/suspension-types`
      )
      .pipe(map(response => response.data));
  }

  /**
   * GET /pathogen-reduction/volume-type-sets
   * Retrieve volume type sets for dropdowns
   *
   * @returns Observable<VolumeTypeSetDto[]>
   */
  getVolumeTypeSets(): Observable<VolumeTypeSetDto[]> {
    return this.http
      .get<PathogenReductionApiResponse<VolumeTypeSetDto[]>>(
        `${this.baseUrl}/volume-type-sets`
      )
      .pipe(map(response => response.data));
  }

  /**
   * GET /pathogen-reduction/equipment-serial-numbers/{equipType}
   * Retrieve equipment serial numbers for a specific equipment type
   *
   * @param equipType - Equipment type code
   * @returns Observable<EquipmentSerialNumberDto[]>
   */
  getEquipmentSerialNumbers(equipType: string): Observable<EquipmentSerialNumberDto[]> {
    return this.http
      .get<PathogenReductionApiResponse<EquipmentSerialNumberDto[]>>(
        `${this.baseUrl}/equipment-serial-numbers/${encodeURIComponent(equipType)}`
      )
      .pipe(map(response => response.data));
  }

  /**
   * GET /pathogen-reduction/illuminator-equipment-types
   * Retrieve illuminator equipment types for dropdowns
   *
   * @returns Observable<IlluminatorEquipmentTypeDto[]>
   */
  getIlluminatorEquipmentTypes(): Observable<IlluminatorEquipmentTypeDto[]> {
    return this.http
      .get<PathogenReductionApiResponse<IlluminatorEquipmentTypeDto[]>>(
        `${this.baseUrl}/illuminator-equipment-types`
      )
      .pipe(map(response => response.data));
  }

  /**
   * GET /pathogen-reduction/sterile-docking-machines
   * Retrieve sterile docking machines for dropdowns
   *
   * @returns Observable<SterileDockingMachineDto[]>
   */
  getSterileDockingMachines(): Observable<SterileDockingMachineDto[]> {
    return this.http
      .get<PathogenReductionApiResponse<SterileDockingMachineDto[]>>(
        `${this.baseUrl}/sterile-docking-machines`
      )
      .pipe(map(response => response.data));
  }

  /**
   * GET /pathogen-reduction/wafer-lot-numbers
   * Retrieve wafer lot numbers for dropdowns
   *
   * @returns Observable<WaferLotNumberDto[]>
   */
  getWaferLotNumbers(): Observable<WaferLotNumberDto[]> {
    return this.http
      .get<PathogenReductionApiResponse<WaferLotNumberDto[]>>(
        `${this.baseUrl}/wafer-lot-numbers`
      )
      .pipe(map(response => response.data));
  }

  /**
   * GET /pathogen-reduction/set-lot-numbers/{volumeTypeSet}
   * Retrieve set lot numbers for a specific volume type set
   *
   * @param volumeTypeSet - Volume type set code
   * @returns Observable<SetLotNumberDto[]>
   */
  getSetLotNumbers(volumeTypeSet: string): Observable<SetLotNumberDto[]> {
    return this.http
      .get<PathogenReductionApiResponse<SetLotNumberDto[]>>(
        `${this.baseUrl}/set-lot-numbers/${encodeURIComponent(volumeTypeSet)}`
      )
      .pipe(map(response => response.data));
  }

  /**
   * GET /pathogen-reduction/product-codes?unitId={unitId}&collectionDate={collectionDate}&productCategory={productCategory}
   * Retrieve initial product codes (before pathogen reduction) for a specific unit
   * Database Filter: pathogen_reduction_flag != 'Y'
   * Requires unitId, collectionDate from query params - filters by specific unit context
   *
   * @param unitId - Required unit ID
   * @param collectionDate - Required collection date
   * @param productCategory - Optional product category filter (e.g., "PLT", "PLAS")
   * @returns Observable<ProductCodeDto[]>
   */
  getProductCodes(unitId: string, collectionDate: Date, productCategory?: string): Observable<ProductCodeDto[]> {
    // Format date as YYYY-MM-DD (consistent with Change Unit Collection Date component)
    const year = collectionDate.getFullYear();
    const month = String(collectionDate.getMonth() + 1).padStart(2, '0');
    const day = String(collectionDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    let params = new HttpParams()
      .set('unitId', unitId)
      .set('collectionDate', formattedDate);

    if (productCategory) {
      params = params.set('productCategory', productCategory);
    }

    return this.http
      .get<PathogenReductionApiResponse<ProductCodeDto[]>>(
        `${this.baseUrl}/product-codes`,
        { params }
      )
      .pipe(map(response => response.data));
  }

  /**
   * GET /pathogen-reduction/product-details
   * Get product details from COMPONENTS table when Product Code is selected
   * Auto-populates: weight, volume, anticoagulant, platelet count, equipment type
   * Based on FMB populate_cnt_wt_vol and populate_equipType procedures
   *
   * @param unitId - The validated unit ID (14 characters, parsed)
   * @param productCode - Selected product code (e.g., "E3087V00")
   * @param collectionDate - Collection date from unit validation
   * @returns Observable<ProductDetailsDto | null>
   */
  getProductDetails(
    unitId: string,
    productCode: string,
    collectionDate: Date
  ): Observable<ProductDetailsDto | null> {
    // Format date as YYYY-MM-DD
    const year = collectionDate.getFullYear();
    const month = String(collectionDate.getMonth() + 1).padStart(2, '0');
    const day = String(collectionDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const params = new HttpParams()
      .set('unitId', unitId)
      .set('productCode', productCode)
      .set('collectionDate', formattedDate);

    return this.http
      .get<PathogenReductionApiResponse<ProductDetailsDto[]>>(
        `${this.baseUrl}/product-details`,
        { params }
      )
      .pipe(
        map(response => {
          // API returns array with single element or empty array if not found
          return response.data && response.data.length > 0 ? response.data[0] : null;
        })
      );
  }

  /**
   * GET /pathogen-reduction/specific-gravity?productCode={productCode}
   * Get specific gravity for a product code from VALID_PRODUCTS table
   * Used for volume calculation: volume = weight / specific_gravity
   * Based on FMB query: SELECT NVL(specific_gravity,1) FROM valid_products
   * WHERE product_code = SUBSTR(?, 1, 5) AND eff_date <= date AND (term_date IS NULL OR term_date > date)
   *
   * @param productCode - Product code (first 5 characters used for lookup)
   * @returns Observable<number> - Specific gravity value (defaults to 1.025 if not found)
   */
  getSpecificGravity(productCode: string): Observable<number> {
    const params = new HttpParams().set('productCode', productCode);

    return this.http
      .get<{ success: boolean; specificGravity: number }>(
        `${this.baseUrl}/specific-gravity`,
        { params }
      )
      .pipe(
        map(response => response.specificGravity || 1.025),
        catchError(() => of(1.025)) // Default fallback on error
      );
  }

  /**
   * GET /pathogen-reduction/interim-product-codes?productCategory={productCategory}
   * Retrieve interim product codes for suitability products (after pathogen reduction)
   * Database Filter: pathogen_reduction_flag = 'Y'
   * Supports optional productCategory query parameter to filter results
   *
   * @param productCategory - Optional product category filter (e.g., "PLT", "PLAS")
   * @returns Observable<InterimProductCodeDto[]>
   */
  getInterimProductCodes(productCategory?: string): Observable<InterimProductCodeDto[]> {
    let params = new HttpParams();
    if (productCategory) {
      params = params.set('productCategory', productCategory);
    }

    return this.http
      .get<PathogenReductionApiResponse<InterimProductCodeDto[]>>(
        `${this.baseUrl}/interim-product-codes`,
        { params }
      )
      .pipe(map(response => response.data));
  }

  /**
   * GET /pathogen-reduction/cad-product-codes
   * Retrieve CAD product codes based on suitability product code
   * For Intermediate Process: only uses suitProdCode
   * For Final Products: uses DECODE logic (PLAS -> suitProdCode, else -> cadProdCode)
   *
   * @param productCategory - Product category (e.g., 'PLT', 'PLAS')
   * @param suitProdCode - Suitability product code (SUIT_PROD_CODE)
   * @param cadProdCode - CAD product code (optional - only for Final Products)
   * @returns Observable<ProductCodeDto[]>
   */
  getCadProductCodes(
    productCategory: string,
    suitProdCode: string,
    cadProdCode?: string  // Optional parameter
  ): Observable<ProductCodeDto[]> {
    let params = new HttpParams()
      .set('productCategory', productCategory)
      .set('suitProdCode', suitProdCode);

    // Only add cadProdCode if provided (for Final Products tab)
    if (cadProdCode) {
      params = params.set('cadProdCode', cadProdCode);
    }

    return this.http
      .get<PathogenReductionApiResponse<ProductCodeDto[]>>(
        `${this.baseUrl}/cad-product-codes`,
        { params }
      )
      .pipe(map(response => response.data));
  }

  /**
   * GET /pathogen-reduction/calculate-intended-use
   * Calculate full 8-character product code from 5-character base code
   * Called on blur event when user tabs out of Interim Product Code field
   *
   * @param request - Contains unitId and base product code (5 chars)
   * @returns Observable<CalculateIntendedUseResponseDto> - Full product code (8 chars)
   */
  calculateIntendedUse(
    request: CalculateIntendedUseRequestDto
  ): Observable<CalculateIntendedUseResponseDto> {
    const params = new HttpParams()
      .set('unitId', request.unitId)
      .set('baseProductCode', request.baseProductCode);

    return this.http
      .get<PathogenReductionApiResponse<CalculateIntendedUseResponseDto[]>>(
        `${this.baseUrl}/calculate-intended-use`,
        { params }
      )
      .pipe(map(response => response.data[0]));
  }

  /**
   * GET /pathogen-reduction/chapters
   * Retrieve active chapters for Upload Manually dropdown
   *
   * @returns Observable<ChapterDto[]>
   */
  getChapters(): Observable<ChapterDto[]> {
    return this.http
      .get<PathogenReductionApiResponse<ChapterDto[]>>(
        `${this.baseUrl}/chapters`
      )
      .pipe(map(response => response.data));
  }

  /**
   * GET /pathogen-reduction/remove-bag-enabled
   * Check if remove bag buttons should be enabled
   * When API returns TRUE: buttons are ENABLED
   * When API returns FALSE: buttons are DISABLED
   * Used to control:
   * - Tab 1: Remove Psoralen button
   * - Tab 2: Remove Illumination Bag button
   * - Tab 3: Remove CAD Bag button
   *
   * @returns Observable<boolean> - true = enable buttons, false = disable buttons
   */
  getRemoveBagEnabled(): Observable<boolean> {
    return this.http
      .get<PathogenReductionApiResponse<boolean[]>>(
        `${this.baseUrl}/remove-bag-enabled`
      )
      .pipe(map(response => response.data[0])); // Extract first element from array
  }

  /**
   * GET /pathogen-reduction/{unitId}/final-products
   * Retrieve final products for a specific unit
   *
   * @param unitId - Unit identifier
   * @param suitProdCode - Suitability product code (required filter)
   * @returns Observable<PathogenFinalProductDto[]>
   */
  getFinalProducts(
    unitId: string,
    suitProdCode: string
  ): Observable<PathogenFinalProductDto[]> {
    let params = new HttpParams().set('suitProdCode', suitProdCode);

    return this.http
      .get<PathogenReductionApiResponse<PathogenFinalProductDto[]>>(
        `${this.baseUrl}/${encodeURIComponent(unitId)}/final-products`,
        { params }
      )
      .pipe(map(response => response.data));
  }

  /**
   * POST /pathogen-reduction/reprint-label
   * Reprint label for a final product
   *
   * @param request - Reprint label request
   * @returns Observable<any>
   */
  reprintLabel(request: ReprintLabelRequestDto): Observable<PathogenReductionApiResponse<ReprintLabelResponseDto[]>> {
    return this.http.post<PathogenReductionApiResponse<ReprintLabelResponseDto[]>>(
      `${this.baseUrl}/reprint-label`,
      request
    );
  }

  /**
   * 5. POST /pathogen-reduction/check-suitability
   * Run suitability check algorithm for a unit
   * Does NOT save results - only returns suitability status and reasons
   *
   * @param request - Check suitability request (unitId, productCode)
   * @returns Observable<CheckSuitabilityResponseDto[]> - Returns array with suitability results
   */
  checkSuitability(
    request: CheckSuitabilityRequestDto
  ): Observable<CheckSuitabilityResponseDto[]> {
    return this.http
      .post<PathogenReductionApiResponse<CheckSuitabilityResponseDto[]>>(
        `${this.baseUrl}/check-suitability`,
        request
      )
      .pipe(map(response => response.data));
  }

  /**
   * 6. POST /pathogen-reduction/suitability
   * Save suitability check results (creates PATHOGEN_REDUCTION_DETAILS record)
   *
   * @param request - Save suitability request
   * @returns Observable<SaveSuitabilityResponse> - Returns first item from array
   */
  saveSuitability(
    request: SaveSuitabilityRequestDto
  ): Observable<SaveSuitabilityResponse> {
    return this.http
      .post<PathogenReductionApiResponse<SaveSuitabilityResponse[]>>(
        `${this.baseUrl}/suitability`,
        request
      )
      .pipe(map(response => response.data[0])); // Return first item from array
  }

  /**
   * 7. PUT /pathogen-reduction/suitability
   * Update suitability step fields (product code, suitability date/user)
   *
   * @param request - Update suitability request
   * @returns Observable<void>
   */
  updateSuitability(request: UpdateSuitabilityRequestDto): Observable<void> {
    return this.http
      .put<PathogenReductionApiResponse<void>>(
        `${this.baseUrl}/suitability`,
        request
      )
      .pipe(map(() => void 0));
  }

  /**
   * 8. POST /pathogen-reduction/sterile-docking
   * Insert sterile docking record (calls lab_common.insert_sterile_docking PL/SQL procedure)
   *
   * @param request - Sterile docking request
   * @returns Observable<SterileDockingResponse>
   */
  insertSterileDocking(
    request: SterileDockingRequestDto
  ): Observable<SterileDockingResponse> {
    return this.http
      .post<PathogenReductionApiResponse<SterileDockingResponse>>(
        `${this.baseUrl}/sterile-docking`,
        request
      )
      .pipe(map(response => response.data));
  }

  /**
   * 9. PUT /pathogen-reduction/intermediate-process
   * Update intermediate process steps (illumination and/or treatment times)
   *
   * @param request - Update intermediate process request
   * @returns Observable<void>
   */
  updateIntermediateProcess(
    request: UpdateIntermediateProcessRequestDto
  ): Observable<void> {
    return this.http
      .put<PathogenReductionApiResponse<void>>(
        `${this.baseUrl}/intermediate-process`,
        request
      )
      .pipe(map(() => void 0));
  }

  /**
   * 10. PUT /pathogen-reduction/final-transfer
   * Update final transfer step (CAD end time, number of bags, final transfer date/user)
   *
   * @param request - Update final transfer request
   * @returns Observable<void>
   */
  updateFinalTransfer(
    request: UpdateFinalTransferRequestDto
  ): Observable<void> {
    return this.http
      .put<PathogenReductionApiResponse<void>>(
        `${this.baseUrl}/final-transfer`,
        request
      )
      .pipe(map(() => void 0));
  }

  /**
   * 11. POST /pathogen-reduction/final-products
   * Save final products created after pathogen reduction (batch insert)
   *
   * @param request - Save final products request
   * @returns Observable<SaveFinalProductsResponse>
   */
  saveFinalProducts(
    request: SaveFinalProductsRequestDto
  ): Observable<SaveFinalProductsResponse> {
    return this.http
      .post<PathogenReductionApiResponse<SaveFinalProductsResponse>>(
        `${this.baseUrl}/final-products`,
        request
      )
      .pipe(map(response => response.data));
  }

  /**
   * 12. POST /pathogen-reduction/upload
   * Upload Manually - Upload pathogen reduction data from CSV file
   * Following the same approach as FTP upload (section 19.5.6)
   * Inserts data into LTAPI.API_PATHOGEN_REDUCTION table
   *
   * Required CSV columns:
   * - UnitId (13-15 chars)
   * - ProductCode (max 10 chars)
   * - TreatmentStartTime (format: YYYYMMDD HH:MM or YYYY-MM-DD HH:MM)
   * - Status (0 = fail, 1 = success)
   * - SiteCode (max 20 chars)
   * - SetLotNumber (max 15 chars)
   * - SetCode (max 15 chars)
   *
   * @param file - CSV file to upload
   * @param chapterId - Chapter ID for the upload
   * @returns Observable with upload results (success/error counts)
   */
  uploadData(file: File, chapterId: string): Observable<PathogenReductionUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chapterId', chapterId);

    return this.http
      .post<PathogenReductionApiResponse<PathogenReductionUploadResponse[]>>(
        `${this.baseUrl}/upload`,
        formData
      )
      .pipe(map(response => response.data[0])); // Extract first element from array
  }
}

/**
 * Upload response interface
 */
export interface PathogenReductionUploadResponse {
  successCount: number;
  errorCount: number;
  errors: string[];
  results: PathogenReductionUploadResult[];
}

export interface PathogenReductionUploadResult {
  unitId: string;
  productCode: string;
  success: boolean;
  errorMessage?: string;
}
