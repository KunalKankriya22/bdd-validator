import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  ReturnResult,
  ComponentQuerySummaryDto,
  ComponentQueryDto,
  ConvertedProductDto,
  ComponentAttributeDto,
  ComponentInterdictionDto,
} from '../models/component-query.model';

@Injectable({ providedIn: 'root' })
export class ComponentQueryApiService {
  private readonly apiService = inject(ApiService);

  getSummary(unitId: string): Observable<ReturnResult<ComponentQuerySummaryDto>> {
    return this.apiService.get<ReturnResult<ComponentQuerySummaryDto>>(
      API.COMPONENT_QUERY.SUMMARY(unitId)
    );
  }

  getComponents(unitId: string, take: number, skip: number, sortOrder?: string): Observable<ReturnResult<ComponentQueryDto>> {
    return this.apiService.get<ReturnResult<ComponentQueryDto>>(
      API.COMPONENT_QUERY.COMPONENTS(unitId, take, skip, sortOrder)
    );
  }

  getConverted(unitId: string, take: number, skip: number, sortOrder?: string): Observable<ReturnResult<ConvertedProductDto>> {
    return this.apiService.get<ReturnResult<ConvertedProductDto>>(
      API.COMPONENT_QUERY.CONVERTED(unitId, take, skip, sortOrder)
    );
  }

  getAttributes(unitId: string, productCode: string, sortOrder?: string): Observable<ReturnResult<ComponentAttributeDto>> {
    return this.apiService.get<ReturnResult<ComponentAttributeDto>>(
      API.COMPONENT_QUERY.ATTRIBUTES(unitId, productCode, sortOrder),
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    );
  }

  getInterdictions(unitId: string, productCode: string, sortOrder?: string): Observable<ReturnResult<ComponentInterdictionDto>> {
    return this.apiService.get<ReturnResult<ComponentInterdictionDto>>(
      API.COMPONENT_QUERY.INTERDICTIONS(unitId, productCode, sortOrder),
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    );
  }
}
