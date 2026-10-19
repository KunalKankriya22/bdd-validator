import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  CreateComponentSpikingDto,
  ComponentSpikingResponseDto,
  ProcessCodeDto,
  SpikingTypeDto,
  ProductDto,
  LotNumberDto,
  ApiResponse,
} from '../models/spike.model';

/**
 * Spike Component API Service
 * Handles all API calls for the Spike a Component feature
 * All endpoints are from SpikeComponentController
 */
@Injectable({
  providedIn: 'root',
})
export class SpikeApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Create a component spiking record
   * POST /api/v1/lab/spike-component
   */
  createComponentSpiking(dto: CreateComponentSpikingDto): Observable<ComponentSpikingResponseDto> {
    return this.apiService
      .post<ApiResponse<ComponentSpikingResponseDto>>(API.SPIKE_COMPONENT.CREATE, dto)
      .pipe(
        map((response) => {
          if (response?.item) {
            return response.item;
          }
          throw new Error(response?.message || 'Failed to create component spiking record');
        }),
        catchError((error) => {
          return throwError(() => error);
        }),
      );
  }

  /**
   * Get active process codes for dropdown
   * GET /api/v1/lab/spike-component/process-codes
   */
  getProcessCodes(): Observable<ProcessCodeDto[]> {
    return this.apiService
      .get<ApiResponse<ProcessCodeDto[]>>(API.SPIKE_COMPONENT.PROCESS_CODES)
      .pipe(
        map((response) => response?.data || []),
        catchError(() => of([])),
      );
  }

  /**
   * Get active spiking types for dropdown
   * GET /api/v1/lab/spike-component/spiking-types
   */
  getSpikingTypes(): Observable<SpikingTypeDto[]> {
    return this.apiService
      .get<ApiResponse<SpikingTypeDto[]>>(API.SPIKE_COMPONENT.SPIKING_TYPES)
      .pipe(
        map((response) => response?.data || []),
        catchError(() => of([])),
      );
  }

  /**
   * Get valid bag lot numbers for dropdown
   * GET /api/v1/lab/spike-component/bag-lots
   */
  getBagLots(): Observable<LotNumberDto[]> {
    return this.apiService
      .get<ApiResponse<LotNumberDto[]>>(API.SPIKE_COMPONENT.BAG_LOTS)
      .pipe(
        map((response) => response?.data || []),
        catchError(() => of([])),
      );
  }

  /**
   * Get filter lot numbers for dropdown
   * GET /api/v1/lab/spike-component/filter-lots?productType=...
   * Returns active filter lots filtered by product type via VALID_FILTERS (per FRISPIKE FMB)
   */
  getFilterLots(productType: string): Observable<LotNumberDto[]> {
    const params = new URLSearchParams({ productType });
    return this.apiService.get<ApiResponse<LotNumberDto[]>>(`${API.SPIKE_COMPONENT.FILTER_LOTS}?${params.toString()}`).pipe(
      map((response) => response?.data || []),
      catchError(() => of([])),
    );
  }

  /**
   * Get products filtered by unit ID, collection date, and process code
   * GET /api/v1/lab/spike-component/products
   */
  getProducts(unitId: string, collDate: string, processCode: string, chapterId: string): Observable<ProductDto[]> {
    const params = new URLSearchParams({
      unitId,
      collDate,
      processCode,
      chapterId,
    });

    return this.apiService
      .get<ApiResponse<ProductDto[]>>(`${API.SPIKE_COMPONENT.PRODUCTS}?${params.toString()}`)
      .pipe(
        map((response) => response?.data || []),
        catchError(() => of([])),
      );
  }

  /**
   * Get unit collection dates from UNITS table
   * Returns dates where unit has valid components for spiking
   * GET /api/v1/lab/spike-component/unit-collection-dates
   */
  getUnitCollectionDates(unitId: string, chapterId: string): Observable<{ collDate: string }[]> {
    const params = new URLSearchParams({ unitId, chapterId });

    return this.apiService
      .get<ApiResponse<{ collDate: string }[]>>(
        `${API.SPIKE_COMPONENT.UNIT_COLLECTION_DATES}?${params.toString()}`,
      )
      .pipe(
        map((response) => response?.data || []),
        catchError(() => of([])),
      );
  }
}
