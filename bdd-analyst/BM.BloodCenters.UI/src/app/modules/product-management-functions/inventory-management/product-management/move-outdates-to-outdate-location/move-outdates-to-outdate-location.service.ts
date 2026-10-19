import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  ApiResponse,
  OutdatedProductDto,
  OutdatedProductListResponse,
  OutdatedProductQueryDto,
  MoveProductToOutdateRequestDto,
  MoveProductToOutdateResponseDto,
  WarehouseDto,
  DiscardCodeDto,
  PickSlipDto,
  PickSlipProductDto,
  PickSlipApiDto,
  PickSlipProductApiDto,
  ProductDropdownDto,
} from './move-outdates-to-outdate-location.model';

const SKIP = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

@Injectable({ providedIn: 'root' })
export class MoveOutdatesToOutdateLocationService {
  private readonly apiService = inject(ApiService);

  // ─── Get All Outdated Products (Paginated with filters) ───────────────────

  getOutdatedProducts(
    take: number,
    skip: number,
    query: OutdatedProductQueryDto
  ): Observable<OutdatedProductListResponse> {
    return this.apiService
      .post<ApiResponse<OutdatedProductDto[]>>(API.MOVE_OUTDATES.LIST(take, skip), query, SKIP)
      .pipe(
        map((res) => ({
          data: res.data ?? [],
          total: res.total ?? 0,
        }))
      );
  }

  // ─── Get Product By ID (for Unit ID scan validation) ──────────────────────

  getProductById(productId: string): Observable<ApiResponse<OutdatedProductDto>> {
    return this.apiService
      .get<ApiResponse<OutdatedProductDto>>(API.MOVE_OUTDATES.GET_BY_ID(productId), SKIP)
      .pipe(map((res) => this.normalizeResponse<OutdatedProductDto>(res)));
  }

  // ─── Move Product to Outdate Location ─────────────────────────────────────

  moveProductToOutdate(
    dto: MoveProductToOutdateRequestDto
  ): Observable<ApiResponse<MoveProductToOutdateResponseDto>> {
    return this.apiService.post<ApiResponse<MoveProductToOutdateResponseDto>>(
      API.MOVE_OUTDATES.CREATE,
      dto
    );
  }

  // ─── Get Warehouses Dropdown ───────────────────────────────────────────────

  getWarehouses(): Observable<WarehouseDto[]> {
    return this.apiService
      .get<ApiResponse<WarehouseDto[]>>(API.MOVE_OUTDATES.WAREHOUSES, SKIP)
      .pipe(map((res) => this.normalizeArray<WarehouseDto>(res)));
  }

  // ─── Get Discard Codes Dropdown ────────────────────────────────────────────

  getDiscardCodes(): Observable<DiscardCodeDto[]> {
    return this.apiService
      .get<ApiResponse<DiscardCodeDto[]>>(API.MOVE_OUTDATES.DISCARD_CODES, SKIP)
      .pipe(map((res) => this.normalizeArray<DiscardCodeDto>(res)));
  }

  // ─── Validate Unit ID (screen-specific chained validation) ────────────────

  validateUnit(parsedUnitId: string, pickSlipId: string): Observable<ApiResponse<PickSlipProductApiDto[]>> {
    return this.apiService
      .post<ApiResponse<PickSlipProductApiDto[]>>(API.MOVE_OUTDATES.VALIDATE_UNIT, { unitId: parsedUnitId, pickSlipId }, SKIP)
      .pipe(map((res) => this.normalizeResponse<PickSlipProductApiDto[]>(res)));
  }

  // ─── Get Pick Slips Dropdown ────────────────────────────────────────────────

  getPickSlips(): Observable<PickSlipDto[]> {
    return this.apiService
      .get<ApiResponse<PickSlipApiDto[]>>(API.MOVE_OUTDATES.PICK_SLIPS, SKIP)
      .pipe(
        map((res) =>
          this.normalizeArray<PickSlipApiDto>(res).map((ps) => ({
            pickSlipId: ps.pickSlipId,
            dateTime: ps.dateAndTime,
            totalProducts: ps.totalProduct,
          }))
        )
      );
  }

  // ─── Get Products on Pick Slip (for modal dialog) ─────────────────────────

  getProductsOnPickSlip(pickSlipId: string): Observable<PickSlipProductDto[]> {
    return this.apiService
      .get<ApiResponse<PickSlipProductApiDto[]>>(
        API.MOVE_OUTDATES.PICK_SLIP_PRODUCTS(pickSlipId),
        SKIP
      )
      .pipe(
        map((res) =>
          this.normalizeArray<PickSlipProductApiDto>(res).map((p) => ({
            unitId: p.unitId,
            product: `${p.productId} - ${p.productType ?? ''}`.trim(),
            checkDigit: p.checkDigit ?? '',
            status: 'OD',
          }))
        )
      );
  }

  // ─── Get Product Dropdown for Pick Slip ───────────────────────────────────

  getProductDropdown(pickSlipId: string): Observable<ProductDropdownDto[]> {
    return this.apiService
      .get<ApiResponse<ProductDropdownDto[]>>(
        API.MOVE_OUTDATES.PICK_SLIP_PRODUCT_DROPDOWN(pickSlipId),
        SKIP
      )
      .pipe(map((res) => this.normalizeArray<ProductDropdownDto>(res)));
  }

  // ─── Helper Methods ────────────────────────────────────────────────────────

  private normalizeResponse<T>(res: any): ApiResponse<T> {
    return {
      ...res,
      success: res.success ?? (res.statusCode === 200 && !res.errorResponse?.errorCode),
      data: res.data ?? res.item ?? null,
    } as ApiResponse<T>;
  }

  private normalizeArray<T>(res: any): T[] {
    const list = res.data ?? res.item ?? res.items ?? [];
    return Array.isArray(list) ? list : [];
  }
}
