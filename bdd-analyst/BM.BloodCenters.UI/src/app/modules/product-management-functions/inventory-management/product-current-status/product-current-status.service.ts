import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  ProductCurrentStatusQueryDto,
  ProductCurrentStatusSummaryDto,
  ProductCodeLovDto,
  ApiResponse,
} from './product-current-status.model';

const SKIP = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

@Injectable({ providedIn: 'root' })
export class ProductCurrentStatusService {
  private readonly apiService = inject(ApiService);

  getSummary(query: ProductCurrentStatusQueryDto): Observable<ProductCurrentStatusSummaryDto> {
    return this.apiService
      .post<ApiResponse<ProductCurrentStatusSummaryDto>>(
        API.PRODUCT_CURRENT_STATUS.SUMMARY,
        query,
        SKIP
      )
      .pipe(map((res) => res.data));
  }

  getProductCodeLov(unitId: string, codeScheme?: string): Observable<ProductCodeLovDto[]> {
    return this.apiService
      .get<ApiResponse<ProductCodeLovDto[]>>(
        API.PRODUCT_CURRENT_STATUS.LOV_PRODUCT_CODES(unitId, codeScheme),
        SKIP
      )
      .pipe(map((res) => res.data ?? []));
  }

  getAliquotLov(unitId: string, productCode: string): Observable<string[]> {
    return this.apiService
      .get<ApiResponse<string[]>>(
        API.PRODUCT_CURRENT_STATUS.LOV_ALIQUOTS(unitId, productCode),
        SKIP
      )
      .pipe(map((res) => res.data ?? []));
  }
}
