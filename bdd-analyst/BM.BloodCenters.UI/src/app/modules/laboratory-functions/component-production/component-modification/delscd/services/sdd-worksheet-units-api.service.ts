import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  SddWorksheetLookupDto,
  SddWorksheetUnitDto,
  DeleteSddWorksheetUnitsRequestDto,
  DeleteSddWorksheetUnitsResponseDto,
  ApiResponse
} from '../models/sdd-worksheet-units.model';

@Injectable({
  providedIn: 'root'
})
export class SddWorksheetUnitsApiService {
  private readonly apiService = inject(ApiService);

  getWorksheets(): Observable<SddWorksheetLookupDto[]> {
    return this.apiService
      .get<ApiResponse<SddWorksheetLookupDto[]>>(API.SDD_WORKSHEET_UNITS.WORKSHEETS)
      .pipe(map((response) => response.data || []));
  }

  getUnits(worksheetId: string, take: number, skip: number, sortOrder?: 'asc' | 'desc'): Observable<{ items: SddWorksheetUnitDto[]; totalCount: number }> {
    let params = new HttpParams();
    if (sortOrder === 'asc' || sortOrder === 'desc') {
      params = params.set('sortOrder', sortOrder);
    }
    return this.apiService
      .get<ApiResponse<SddWorksheetUnitDto[]>>(API.SDD_WORKSHEET_UNITS.UNITS(worksheetId, take, skip), { params })
      .pipe(map((response) => ({
        items: response.data || [],
        totalCount: response.total ?? 0
      })));
  }

  deleteUnits(request: DeleteSddWorksheetUnitsRequestDto): Observable<DeleteSddWorksheetUnitsResponseDto> {
    return this.apiService
      .delete<ApiResponse<DeleteSddWorksheetUnitsResponseDto>>(API.SDD_WORKSHEET_UNITS.DELETE, { body: request })
      .pipe(map((response) => (response.item ?? response.data) as DeleteSddWorksheetUnitsResponseDto));
  }
}
