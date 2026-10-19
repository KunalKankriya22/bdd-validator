import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import type {
  ProcessCodeItem,
  ProductCodeItem,
  ProductCodesResponse,
  AliquotItem,
  RetrieveNoteRequest,
  SpecialProcessingNoteDto,
  SaveNoteRequest,
  SpecialProcessingApiResponse,
} from '../models/enter-note-for-special-processing.model';

@Injectable({ providedIn: 'root' })
export class EnterNoteForSpecialProcessingService {
  private readonly apiService = inject(ApiService);

  getProcessCodes(): Observable<ProcessCodeItem[]> {
    return this.apiService.get<SpecialProcessingApiResponse<ProcessCodeItem>>(
      API.ENTER_NOTE_FOR_SPECIAL_PROCESSING.GET_PROCESS_CODES
    ).pipe(
      map((response) => response?.data ?? []),
      catchError(() => of([]))
    );
  }

  getProductCodes(processCode: string, unitId: string): Observable<ProductCodesResponse> {
    return this.apiService.get<ProductCodesResponse>(
      API.ENTER_NOTE_FOR_SPECIAL_PROCESSING.GET_PRODUCT_CODES(processCode, unitId),
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    );
  }

  getAliquots(processCode: string, unitId: string, productCode: string): Observable<AliquotItem[]> {
    return this.apiService.get<SpecialProcessingApiResponse<AliquotItem>>(
      API.ENTER_NOTE_FOR_SPECIAL_PROCESSING.GET_ALIQUOTS(processCode, unitId, productCode),
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    ).pipe(
      map((response) => response?.data ?? [])
    );
  }

  retrieve(request: RetrieveNoteRequest): Observable<SpecialProcessingApiResponse<SpecialProcessingNoteDto>> {
    return this.apiService.post<SpecialProcessingApiResponse<SpecialProcessingNoteDto>>(
      API.ENTER_NOTE_FOR_SPECIAL_PROCESSING.RETRIEVE,
      request,
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    );
  }

  save(request: SaveNoteRequest): Observable<SpecialProcessingApiResponse<SpecialProcessingNoteDto>> {
    return this.apiService.post<SpecialProcessingApiResponse<SpecialProcessingNoteDto>>(
      API.ENTER_NOTE_FOR_SPECIAL_PROCESSING.SAVE,
      request,
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    );
  }
}
