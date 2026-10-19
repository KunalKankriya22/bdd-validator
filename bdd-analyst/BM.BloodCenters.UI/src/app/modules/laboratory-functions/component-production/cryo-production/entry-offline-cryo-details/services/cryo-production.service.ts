import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  CreateCryoProductionDto,
  UpdateCryoProductionDto,
  CryoProductionDto,
  CryoProductionQueryDto,
  ThawMethodDto,
  CentrifugeLookupDto,
  UnitValidationRequestDto,
  UnitValidationResultDto,
  AutoSelectProductRequestDto,
  AutoSelectProductResponseDto,
  CatalogNumberLovDto,
  OldProductLovDto,
  ProductCodeOption,
  CryoTemperatureRangeDto,
  CryoFreezeTimeRangeDto,
  ReprintLabelRequestDto,
  IntendedUseResponseDto,
  ProductVariantDto,
  ApiResponse,
  CentrifugeValidationDto,
  TemperatureValidationDto,
  FreezeTimeValidationDto,
  CheckBlInterdictionRequestDto,
  CheckBlInterdictionResponseDto,
  UpdateAddOnBagsRequestDto,
  UpdateAddOnBagsResponseDto,
  ValidateCatalogNumberRequestDto,
  ValidateCatalogNumberResponseDto,
  ValidateNewProductRequestDto,
  ValidateNewProductResponseDto
} from '../models/cryo-production.model';

@Injectable({
  providedIn: 'root'
})
export class CryoProductionService {
  private readonly apiService = inject(ApiService);

  /**
   * Create CRYO Separation (Entry operation)
   * POST /cryo-production
   * Note: Backend returns array in data property, we extract first element
   */
  createCryoSeparation(dto: CreateCryoProductionDto): Observable<CryoProductionDto> {
    const endpoint = API.CRYO_PRODUCTION.CREATE;

    return this.apiService.post<ApiResponse<CryoProductionDto[]>>(endpoint, dto).pipe(
      map(response => {
        if (!response.data || response.data.length === 0) {
          throw new Error('No data returned from server');
        }
        return response.data[0];
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Update CRYO Record (Offline/Freeze operation)
   * PUT /cryo-production/{unitId}
   * Note: Backend returns array in data property, we extract first element
   */
  updateCryoRecord(unitId: string, dto: UpdateCryoProductionDto): Observable<CryoProductionDto> {
    const endpoint = API.CRYO_PRODUCTION.UPDATE(unitId);

    return this.apiService.put<ApiResponse<CryoProductionDto[]>>(endpoint, dto).pipe(
      map(response => {
        if (!response.data || response.data.length === 0) {
          throw new Error('No data returned from server');
        }
        return response.data[0];
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get CRYO Record by Unit ID
   * GET /cryo-production/{unitId}
   */
  getCryoRecordByUnitId(unitId: string): Observable<CryoProductionDto> {
    const endpoint = API.CRYO_PRODUCTION.GET_BY_UNIT(unitId);

    return this.apiService.get<ApiResponse<CryoProductionDto>>(endpoint).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No data returned from server');
        }
        return response.data;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Search CRYO Production Records
   * POST /cryo-production/{take}/{skip}
   */
  searchCryoRecords(
    take: number,
    skip: number,
    query: CryoProductionQueryDto
  ): Observable<{ data: CryoProductionDto[]; totalCount: number }> {
    const endpoint = API.CRYO_PRODUCTION.SEARCH(take, skip);

    return this.apiService.post<ApiResponse<CryoProductionDto[]>>(endpoint, query).pipe(
      map(response => ({
        data: response.data || [],
        totalCount: response.totalCount || 0
      })),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Active Thaw Methods (LOV)
   * GET /cryo-production/thaw-methods
   */
  getActiveThawMethods(): Observable<ThawMethodDto[]> {
    const endpoint = API.CRYO_PRODUCTION.THAW_METHODS;

    return this.apiService.get<ApiResponse<ThawMethodDto[]>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Active Centrifuges (LOV)
   * GET /cryo-production/centrifuges
   */
  getActiveCentrifuges(): Observable<CentrifugeLookupDto[]> {
    const endpoint = API.CRYO_PRODUCTION.CENTRIFUGES;

    return this.apiService.get<ApiResponse<CentrifugeLookupDto[]>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete CRYO Record
   * DELETE /cryo-production/{unitId}
   */
  deleteCryoRecord(unitId: string): Observable<void> {
    const endpoint = API.CRYO_PRODUCTION.DELETE(unitId);

    return this.apiService.delete<ApiResponse<void>>(endpoint).pipe(
      map(() => undefined),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Validate Unit for CRYO Processing
   * POST /cryo-production/validate-unit
   * Returns comprehensive validation result with existing separation details if available
   */
  validateUnit(request: UnitValidationRequestDto): Observable<UnitValidationResultDto> {
    const endpoint = API.CRYO_PRODUCTION.VALIDATE_UNIT;

    return this.apiService.post<ApiResponse<UnitValidationResultDto>>(endpoint, request).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No validation data returned from server');
        }
        return response.data;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Auto-Select CRYO Product
   * POST /cryo-production/auto-select-product
   * Automatically selects the most appropriate CRYO product based on unit attributes
   */
  autoSelectProduct(request: AutoSelectProductRequestDto): Observable<AutoSelectProductResponseDto> {
    const endpoint = API.CRYO_PRODUCTION.AUTO_SELECT_PRODUCT;

    return this.apiService.post<ApiResponse<AutoSelectProductResponseDto>>(endpoint, request).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No product selection data returned from server');
        }
        return response.data;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Catalog Numbers for Unit and Product Type
   * GET /cryo-production/catalog-numbers?unitId={unitId}&productType={productType}
   */
  getCatalogNumbers(unitId: string, productType: string): Observable<CatalogNumberLovDto[]> {
    const endpoint = API.CRYO_PRODUCTION.CATALOG_NUMBERS(unitId, productType);

    return this.apiService.get<ApiResponse<CatalogNumberLovDto[]>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Old Products (DUFFP) for Unit
   * GET /cryo-production/old-products/{unitId}
   */
  getOldProducts(unitId: string): Observable<OldProductLovDto[]> {
    const endpoint = API.CRYO_PRODUCTION.OLD_PRODUCTS(unitId);

    return this.apiService.get<ApiResponse<OldProductLovDto[]>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Product Code Variants for Catalog Number
   * GET /cryo-production/product-variants?catalogNumber={cat}&antiCode={anti}&volume={vol}
   */
  getProductVariants(catalogNumber: string, antiCode?: string, volume?: number): Observable<ProductVariantDto[]> {
    const endpoint = API.CRYO_PRODUCTION.GET_PRODUCT_VARIANTS(catalogNumber, antiCode, volume);

    return this.apiService.get<ApiResponse<ProductVariantDto[]>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Temperature Ranges for Thaw Method
   * GET /cryo-production/temperature-ranges/{thawMethod}
   */
  getTemperatureRanges(thawMethod: string): Observable<CryoTemperatureRangeDto> {
    const endpoint = API.CRYO_PRODUCTION.TEMPERATURE_RANGES(thawMethod);

    return this.apiService.get<ApiResponse<CryoTemperatureRangeDto>>(endpoint).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No temperature range data returned from server');
        }
        return response.data;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Freeze Time Ranges for Thaw Method
   * GET /cryo-production/freeze-time-ranges/{thawMethod}
   */
  getFreezeTimeRanges(thawMethod: string): Observable<CryoFreezeTimeRangeDto> {
    const endpoint = API.CRYO_PRODUCTION.FREEZE_TIME_RANGES(thawMethod);

    return this.apiService.get<ApiResponse<CryoFreezeTimeRangeDto>>(endpoint).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No freeze time range data returned from server');
        }
        return response.data;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Separation Info for Unit
   * GET /cryo-production/separation-info/{unitId}
   */
  getSeparationInfo(unitId: string): Observable<CryoProductionDto> {
    const endpoint = API.CRYO_PRODUCTION.GET_SEPARATION_INFO(unitId);

    return this.apiService.get<ApiResponse<CryoProductionDto>>(endpoint).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No separation info returned from server');
        }
        return response.data;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Intended Use for Unit and Product Code
   * GET /cryo-production/intended-use/{unitId}?productCode={code}
   */
  getIntendedUse(unitId: string, productCode: string): Observable<IntendedUseResponseDto> {
    const endpoint = API.CRYO_PRODUCTION.GET_INTENDED_USE(unitId, productCode);

    return this.apiService.get<ApiResponse<IntendedUseResponseDto>>(endpoint).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No intended use data returned from server');
        }
        return response.data;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Reprint CRYO Label
   * POST /cryo-production/reprint-label
   */
  reprintLabel(request: ReprintLabelRequestDto): Observable<string> {
    const endpoint = API.CRYO_PRODUCTION.REPRINT_LABEL;

    return this.apiService.post<ApiResponse<void>>(endpoint, request).pipe(
      map(response => response.message || 'Label reprinted successfully'),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * ✅ NEW - Validate Centrifuge
   * POST /cryo-production/validate-centrifuge
   * Validates centrifuge is in service and not on hold
   */
  validateCentrifuge(request: {
    centrifugeScan?: string;
    centrifugeId?: string;
  }): Observable<CentrifugeValidationDto> {
    const endpoint = API.CRYO_PRODUCTION.VALIDATE_CENTRIFUGE;

    return this.apiService.post<ApiResponse<CentrifugeValidationDto>>(endpoint, request).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No centrifuge validation data returned from server');
        }
        return response.data;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * ✅ NEW - Validate Temperature
   * POST /cryo-production/validate-temperature
   * Validates temperature is within range for selected thaw method
   */
  validateTemperature(thawMethod: string, temperature: number): Observable<TemperatureValidationDto> {
    const endpoint = API.CRYO_PRODUCTION.VALIDATE_TEMPERATURE;

    return this.apiService.post<ApiResponse<TemperatureValidationDto>>(endpoint, {
      thawMethod,
      temperature
    }).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No temperature validation data returned from server');
        }
        return response.data;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * ✅ NEW - Validate Freeze Time
   * POST /cryo-production/validate-freeze-time
   * Validates freeze time ranges (worksheet-to-freeze and separation-to-freeze)
   */
  validateFreezeTime(
    unitId: string,
    freezeTime: string,
    thawMethod: string
  ): Observable<FreezeTimeValidationDto> {
    const endpoint = API.CRYO_PRODUCTION.VALIDATE_FREEZE_TIME;

    return this.apiService.post<ApiResponse<FreezeTimeValidationDto>>(endpoint, {
      unitId,
      freezeTime,
      thawMethod
    }).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No freeze time validation data returned from server');
        }
        return response.data;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * ✅ NEW - Check Slow Bleed Interdiction
   * POST /cryo-production/check-bl-interdiction
   * Checks if BLFA or BLHO interdiction should be placed after separation
   */
  checkBlInterdiction(request: CheckBlInterdictionRequestDto): Observable<CheckBlInterdictionResponseDto> {
    const endpoint = API.CRYO_PRODUCTION.CHECK_BL_INTERDICTION;

    return this.apiService.post<ApiResponse<CheckBlInterdictionResponseDto>>(endpoint, request).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No BL interdiction data returned from server');
        }
        return response.data;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * ✅ NEW - Update Add-On Bags Product Code
   * PUT /cryo-production/update-add-on-bags
   * Updates sterile docked add-on bags with new product code after separation
   */
  updateAddOnBags(request: UpdateAddOnBagsRequestDto): Observable<UpdateAddOnBagsResponseDto> {
    const endpoint = API.CRYO_PRODUCTION.UPDATE_ADD_ON_BAGS;

    return this.apiService.put<ApiResponse<UpdateAddOnBagsResponseDto>>(endpoint, request).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No add-on bags update data returned from server');
        }
        return response.data;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * ✅ NEW - Validate Catalog Number
   * POST /cryo-production/validate-catalog-number
   * Validates catalog number is valid for unit's bag code and anticoagulant
   */
  validateCatalogNumber(request: ValidateCatalogNumberRequestDto): Observable<ValidateCatalogNumberResponseDto> {
    const endpoint = API.CRYO_PRODUCTION.VALIDATE_CATALOG_NUMBER;

    return this.apiService.post<ApiResponse<ValidateCatalogNumberResponseDto>>(endpoint, request).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No catalog number validation data returned from server');
        }
        return response.data;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * ✅ NEW - Validate New Product Code
   * POST /cryo-production/validate-new-product
   * Validates new product code is valid ISBT code for chapter
   */
  validateNewProduct(request: ValidateNewProductRequestDto): Observable<ValidateNewProductResponseDto> {
    const endpoint = API.CRYO_PRODUCTION.VALIDATE_NEW_PRODUCT;

    return this.apiService.post<ApiResponse<ValidateNewProductResponseDto>>(endpoint, request).pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No new product validation data returned from server');
        }
        return response.data;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}
