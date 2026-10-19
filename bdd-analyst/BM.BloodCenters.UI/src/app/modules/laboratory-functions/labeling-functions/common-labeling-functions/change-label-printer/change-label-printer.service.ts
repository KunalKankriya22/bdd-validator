import { Injectable, inject } from '@angular/core';
import { HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { ApiResponse } from '@shared/interfaces/api-response.interface';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  LabelPrinter,
  ProcessingFacility,
  ProcessingFacilityDetail,
  CurrentSettings,
  SaveSettingsRequest,
} from './change-label-printer.model';

const SKIP = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

@Injectable({ providedIn: 'root' })
export class ChangeLabelPrinterService {
  private readonly apiService = inject(ApiService);

  getLabelPrinters(warehouseId?: string): Observable<ApiResponse<LabelPrinter[]>> {
    const options = warehouseId
      ? { ...SKIP, params: new HttpParams().set('warehouseId', warehouseId) }
      : SKIP;
    return this.apiService.get<ApiResponse<LabelPrinter[]>>(
      API.CHANGE_LABEL_PRINTER.LABEL_PRINTERS,
      options,
    );
  }

  getTieTagPrinters(warehouseId?: string): Observable<ApiResponse<LabelPrinter[]>> {
    const options = warehouseId
      ? { ...SKIP, params: new HttpParams().set('warehouseId', warehouseId) }
      : SKIP;
    return this.apiService.get<ApiResponse<LabelPrinter[]>>(
      API.CHANGE_LABEL_PRINTER.TIETAG_PRINTERS,
      options,
    );
  }

  getProcessingFacilities(): Observable<ApiResponse<ProcessingFacility[]>> {
    return this.apiService.get<ApiResponse<ProcessingFacility[]>>(
      API.CHANGE_LABEL_PRINTER.PROCESSING_FACILITIES,
      SKIP,
    );
  }

  getProcessingFacilityDetails(auditKey: number): Observable<ApiResponse<ProcessingFacilityDetail>> {
    return this.apiService.get<ApiResponse<ProcessingFacilityDetail>>(
      API.CHANGE_LABEL_PRINTER.PROCESSING_FACILITY_DETAILS(auditKey),
      SKIP,
    );
  }

  saveSettings(request: SaveSettingsRequest): Observable<ApiResponse<CurrentSettings>> {
    return this.apiService.post<ApiResponse<CurrentSettings>>(
      API.CHANGE_LABEL_PRINTER.SAVE_SETTINGS,
      request,
      SKIP,
    );
  }
}
