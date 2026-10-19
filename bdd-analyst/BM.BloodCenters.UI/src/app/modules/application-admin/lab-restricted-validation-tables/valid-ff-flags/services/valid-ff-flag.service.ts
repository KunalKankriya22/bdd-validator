import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  ValidFfFlagModel,
  ValidFfFlagParamsDto,
  ValidFfFlagFilterLov,
  DropdownOption,
  ValidFfFlagDto,
  UpdateValidFfFlagDto,
  ReturnResult
} from '../models/valid-ff-flag.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class ValidFfFlagService {
  private readonly apiService = inject(ApiService);

  getValidFfFlags(
    params: ValidFfFlagParamsDto
  ): Observable<{ data: ValidFfFlagModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.VALID_FF_FLAG;

    return this.apiService
      .post<ReturnResult<ValidFfFlagModel>>(endpoint, params)
      .pipe(
        map(res => ({
          data: res.data ?? [],
          totalRecords: res.total ?? 0
        }))
      );
  }

  getValidFfFlagFilters(): Observable<ReturnResult<ValidFfFlagFilterLov>> {
    return this.apiService.get(
      API.APPLICATION_ADMIN.VALID_FF_FLAG_FILTERS
    );
  }

  getAddDropdownChapters(): Observable<ReturnResult<DropdownOption>> {
    return this.apiService.get(
      API.APPLICATION_ADMIN.VALID_FF_FLAG_ADD_CHAPTERS
    );
  }

  getAddDropdownCollectionFacilities(chapterId: string): Observable<ReturnResult<DropdownOption>> {
    const options = { params: new HttpParams().set('chapterId', chapterId) };
    return this.apiService.get(
      API.APPLICATION_ADMIN.VALID_FF_FLAG_ADD_COLLECTION_FACILITIES,
      options
    );
  }

  getAddDropdownSourceTypes(): Observable<ReturnResult<DropdownOption>> {
    return this.apiService.get(
      API.APPLICATION_ADMIN.VALID_FF_FLAG_ADD_SOURCE_TYPES
    );
  }

  addValidFfFlag(
    payload: ValidFfFlagDto
  ): Observable<ReturnResult<ValidFfFlagModel>> {
    return this.apiService.post(
      API.APPLICATION_ADMIN.VALID_FF_FLAG_CREATE,
      payload
    );
  }

  updateValidFfFlag(
    payload: UpdateValidFfFlagDto
  ): Observable<ReturnResult<ValidFfFlagModel>> {
    return this.apiService.put(
      API.APPLICATION_ADMIN.VALID_FF_FLAG_UPDATE,
      payload
    );
  }
}
