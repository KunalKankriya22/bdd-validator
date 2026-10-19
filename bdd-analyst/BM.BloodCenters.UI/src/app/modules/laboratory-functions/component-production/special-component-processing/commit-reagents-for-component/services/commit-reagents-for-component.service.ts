import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  ApiResponse,
  CodeScheme,
  ProcessCodeDropdownDto,
  StageCodeDropdownDto,
  UnitInfoDto,
  UnitProductDto,
  ComponentInfoDto,
  KitDto,
  CreateKitDto,
  UpdateKitDto,
  CreateKitResponseDto,
} from '../models/commit-reagents-for-component.model';

const SKIP_TOAST = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

@Injectable({ providedIn: 'root' })
export class CommitReagentsForComponentService {
  private readonly apiService = inject(ApiService);

  getCodeScheme(): Observable<CodeScheme> {
    return this.apiService
      .get<ApiResponse<CodeScheme>>(API.COMMIT_REAGENTS.CODE_SCHEME, SKIP_TOAST)
      .pipe(
        map(r => r?.data || 'I'),
        catchError(() => of('I' as CodeScheme))
      );
  }

  // Step 1
  getProcessCodes(): Observable<ProcessCodeDropdownDto[]> {
    return this.apiService
      .get<ApiResponse<ProcessCodeDropdownDto[]>>(API.COMMIT_REAGENTS.PROCESS_CODES, SKIP_TOAST)
      .pipe(
        map(r => r?.data || []),
        catchError(() => of([]))
      );
  }

  // Step 2
  getStageCodes(processCode: string): Observable<StageCodeDropdownDto[]> {
    return this.apiService
      .get<ApiResponse<StageCodeDropdownDto[]>>(
        `${API.COMMIT_REAGENTS.STAGE_CODES}?processCode=${encodeURIComponent(processCode)}`,
        SKIP_TOAST
      )
      .pipe(
        map(r => r?.data || []),
        catchError(() => of([]))
      );
  }

  // Step 3
  getUnitInfo(unitId: string): Observable<UnitInfoDto | null> {
    return this.apiService
      .get<ApiResponse<UnitInfoDto>>(
        `${API.COMMIT_REAGENTS.UNIT_INFO}?unitId=${encodeURIComponent(unitId)}`,
        SKIP_TOAST
      )
      .pipe(
        map(r => r?.data || null),
        catchError(() => of(null))
      );
  }

  // Step 4
  getUnitProducts(unitId: string, collDate: string, processCode: string): Observable<UnitProductDto[]> {
    const params = new URLSearchParams({ unitId, collDate, processCode });
    return this.apiService
      .get<ApiResponse<UnitProductDto[]>>(
        `${API.COMMIT_REAGENTS.UNIT_PRODUCTS}?${params.toString()}`,
        SKIP_TOAST
      )
      .pipe(
        map(r => r?.data || []),
        catchError(() => of([]))
      );
  }

  // Step 5
  getComponentInfo(
    unitId: string,
    collDate: string,
    productCode: string,
    componentPrefix: string,
    processCode: string
  ): Observable<ComponentInfoDto | null> {
    const params = new URLSearchParams({ unitId, collDate, productCode, componentPrefix, processCode });
    return this.apiService
      .get<ApiResponse<ComponentInfoDto>>(
        `${API.COMMIT_REAGENTS.COMPONENT_INFO}?${params.toString()}`,
        SKIP_TOAST
      )
      .pipe(
        map(r => r?.data || null),
        catchError(() => of(null))
      );
  }

  // Step 6 — Retrieve / check kit
  checkKit(
    unitId: string,
    collDate: string,
    productCode: string,
    componentPrefix: string,
    processCode: string,
    stageCode: string
  ): Observable<KitDto | null> {
    const params = new URLSearchParams({ unitId, collDate, productCode, componentPrefix, processCode, stageCode });
    return this.apiService
      .get<ApiResponse<KitDto>>(
        `${API.COMMIT_REAGENTS.KIT}?${params.toString()}`,
        SKIP_TOAST
      )
      .pipe(map(r => r?.data || null));
  }

  // Step 7 — Latest kit template (INSERT mode)
  getLatestKit(processCode: string, stageCode: string): Observable<KitDto | null> {
    const params = new URLSearchParams({ processCode, stageCode });
    return this.apiService
      .get<ApiResponse<KitDto>>(
        `${API.COMMIT_REAGENTS.LATEST_KIT}?${params.toString()}`,
        SKIP_TOAST
      )
      .pipe(
        map(r => r?.data || null),
        catchError(() => of(null))
      );
  }

  // Step 8a — Update existing kit (EDIT mode)
  updateKit(kitId: string, data: UpdateKitDto): Observable<void> {
    return this.apiService
      .put<ApiResponse<void>>(`${API.COMMIT_REAGENTS.KIT}/${kitId}`, data)
      .pipe(map(() => void 0));
  }

  // Step 8b — Create new kit (INSERT mode)
  createKit(data: CreateKitDto): Observable<CreateKitResponseDto> {
    return this.apiService
      .post<ApiResponse<CreateKitResponseDto>>(API.COMMIT_REAGENTS.KIT, data)
      .pipe(map(r => r.data));
  }
}
