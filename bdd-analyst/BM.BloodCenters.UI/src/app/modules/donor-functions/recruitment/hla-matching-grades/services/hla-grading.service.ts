import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  HlaGradingModel,
  HlaGradingDropdownModel,
  HlaGradingParamsDto,
  CreateHlaGradingDto,
  UpdateHlaGradingDto,
  ApiResponse
} from '../models/hla-grading.model';

@Injectable({
  providedIn: 'root'
})
export class HlaGradingService {
  private apiService = inject(ApiService);

  getHlaGradingRecords(
    take: number,
    skip: number,
    params: HlaGradingParamsDto
  ): Observable<{ data: HlaGradingModel[]; total: number }> {
    return this.apiService.post<ApiResponse<HlaGradingModel[]>>(
      API.RECRUITMENT.HLA_MATCHING_GRADES.SEARCH(take, skip),
      params
    ).pipe(
      map(response => ({
        data: response.data || [],
        total: response.total || 0
      }))
    );
  }

  getDropdowns(): Observable<HlaGradingDropdownModel> {
    return this.apiService.get<ApiResponse<HlaGradingDropdownModel[]>>(
      API.RECRUITMENT.HLA_MATCHING_GRADES.DROPDOWNS
    ).pipe(
      map(response => {
        const data = response.data;
        if (Array.isArray(data) && data.length > 0) {
          return data[0];
        }
        return { grades: [], hlaCodes: [] };
      })
    );
  }

  createHlaGrading(dto: CreateHlaGradingDto): Observable<ApiResponse<object>> {
    return this.apiService.post<ApiResponse<object>>(
      API.RECRUITMENT.HLA_MATCHING_GRADES.CREATE,
      dto
    );
  }

  updateHlaGrading(dto: UpdateHlaGradingDto): Observable<ApiResponse<object>> {
    return this.apiService.put<ApiResponse<object>>(
      API.RECRUITMENT.HLA_MATCHING_GRADES.UPDATE,
      dto
    );
  }

  getNextGradeId(): Observable<number> {
    return this.apiService.get<ApiResponse<number[]>>(
      API.RECRUITMENT.HLA_MATCHING_GRADES.NEXT_GRADE_ID
    ).pipe(
      map(response => {
        const data = response.data;
        if (Array.isArray(data) && data.length > 0) {
          return data[0];
        }
        return 1;
      })
    );
  }
}
