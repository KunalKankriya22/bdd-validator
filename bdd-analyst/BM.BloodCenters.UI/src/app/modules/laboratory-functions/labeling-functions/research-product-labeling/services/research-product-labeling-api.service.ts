import { Injectable, inject } from '@angular/core';
import { HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  ApiResponse,
  ValidateUnitResponse,
  ValidateProductRequest,
  ValidateProductResponse,
  ResearchTypeDto,
  ResearchProductDto,
  LabeledProductDto,
  ValidateResearchProductRequest,
  CatalogNumberDto,
  ValidateCatalogRequest,
  BiohazardCheckRequest,
  BiohazardCheckResponse,
  CalculateExpiryRequest,
  CalculateExpiryResponse,
  LabelPreviewRequest,
  LabelPreviewResponse,
  GenerateLabelRequest,
  CompleteRelabelingRequest,
  CompleteRelabelingResponse,
  ChapterConfigDto,
} from '../models/research-product-labeling.model';

const SKIP = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

@Injectable({ providedIn: 'root' })
export class ResearchProductLabelingApiService {
  private readonly apiService = inject(ApiService);

  // ── 1. Validate Unit ──
  validateUnit(unitId: string, warehouseId?: string): Observable<ApiResponse<ValidateUnitResponse>> {
    let params = new HttpParams();
    if (warehouseId) params = params.set('warehouseId', warehouseId);
    return this.apiService.get<ApiResponse<ValidateUnitResponse>>(
      API.RESEARCH_PRODUCT_LABELING.VALIDATE_UNIT(unitId),
      { ...SKIP, params },
    );
  }

  // ── 2. Validate Product ──
  validateProduct(request: ValidateProductRequest): Observable<ApiResponse<ValidateProductResponse>> {
    return this.apiService.post<ApiResponse<ValidateProductResponse>>(
      API.RESEARCH_PRODUCT_LABELING.VALIDATE_PRODUCT,
      request,
      SKIP,
    );
  }

  // ── 3. Get Research Types (Type LOV) ──
  getResearchTypes(): Observable<ApiResponse<ResearchTypeDto[]>> {
    return this.apiService.get<ApiResponse<ResearchTypeDto[]>>(
      API.RESEARCH_PRODUCT_LABELING.RESEARCH_TYPES,
      SKIP,
    );
  }

  // ── 4. Get Research Products (Research Product Code LOV) ──
  getResearchProducts(): Observable<ApiResponse<ResearchProductDto[]>> {
    return this.apiService.get<ApiResponse<ResearchProductDto[]>>(
      API.RESEARCH_PRODUCT_LABELING.RESEARCH_PRODUCTS,
      SKIP,
    );
  }

  // ── 5. Validate Research Product ──
  validateResearchProduct(request: ValidateResearchProductRequest): Observable<ApiResponse<ResearchProductDto>> {
    return this.apiService.post<ApiResponse<ResearchProductDto>>(
      API.RESEARCH_PRODUCT_LABELING.VALIDATE_RESEARCH_PRODUCT,
      request,
      SKIP,
    );
  }

  // ── 6. Get Labeled Products (Original Product Code LOV) ──
  getLabeledProducts(unitId: string, collectionDate: string): Observable<ApiResponse<LabeledProductDto[]>> {
    const params = new HttpParams().set('collectionDate', collectionDate);
    return this.apiService.get<ApiResponse<LabeledProductDto[]>>(
      API.RESEARCH_PRODUCT_LABELING.LABELED_PRODUCTS(unitId),
      { ...SKIP, params },
    );
  }

  // ── 7. Get Catalog Numbers (Bag LOV) ──
  getCatalogNumbers(unitId: string, productType: string): Observable<ApiResponse<CatalogNumberDto[]>> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('productType', productType);
    return this.apiService.get<ApiResponse<CatalogNumberDto[]>>(
      API.RESEARCH_PRODUCT_LABELING.CATALOG_NUMBERS,
      { ...SKIP, params },
    );
  }

  // ── 8. Validate Catalog ──
  validateCatalog(request: ValidateCatalogRequest): Observable<ApiResponse<null>> {
    return this.apiService.post<ApiResponse<null>>(
      API.RESEARCH_PRODUCT_LABELING.VALIDATE_CATALOG,
      request,
      SKIP,
    );
  }

  // ── 9. Check Biohazard ──
  checkBiohazard(request: BiohazardCheckRequest): Observable<ApiResponse<BiohazardCheckResponse>> {
    return this.apiService.post<ApiResponse<BiohazardCheckResponse>>(
      API.RESEARCH_PRODUCT_LABELING.CHECK_BIOHAZARD,
      request,
      SKIP,
    );
  }

  // ── 10. Calculate Expiry ──
  calculateExpiry(request: CalculateExpiryRequest): Observable<ApiResponse<CalculateExpiryResponse>> {
    return this.apiService.post<ApiResponse<CalculateExpiryResponse>>(
      API.RESEARCH_PRODUCT_LABELING.CALCULATE_EXPIRY,
      request,
      SKIP,
    );
  }

  // ── 11. Label Preview ──
  getLabelPreview(request: LabelPreviewRequest): Observable<ApiResponse<LabelPreviewResponse>> {
    return this.apiService.post<ApiResponse<LabelPreviewResponse>>(
      API.RESEARCH_PRODUCT_LABELING.LABEL_PREVIEW,
      request,
      SKIP,
    );
  }

  // ── 12. Generate Label (Print) ──
  generateLabel(request: GenerateLabelRequest): Observable<ApiResponse<null>> {
    return this.apiService.post<ApiResponse<null>>(
      API.RESEARCH_PRODUCT_LABELING.GENERATE_LABEL,
      request,
      SKIP,
    );
  }

  // ── 13. Complete Relabeling (Verification) ──
  completeRelabeling(request: CompleteRelabelingRequest): Observable<ApiResponse<CompleteRelabelingResponse>> {
    return this.apiService.post<ApiResponse<CompleteRelabelingResponse>>(
      API.RESEARCH_PRODUCT_LABELING.COMPLETE_RELABELING,
      request,
      SKIP,
    );
  }

  // ── 14. Get Chapter Config ──
  getChapterConfig(): Observable<ApiResponse<ChapterConfigDto>> {
    return this.apiService.get<ApiResponse<ChapterConfigDto>>(
      API.RESEARCH_PRODUCT_LABELING.CHAPTER_CONFIG,
      SKIP,
    );
  }
}
