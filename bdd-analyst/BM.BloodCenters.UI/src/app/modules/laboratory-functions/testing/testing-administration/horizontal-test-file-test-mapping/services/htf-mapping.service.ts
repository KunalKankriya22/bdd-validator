import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  HtfMappingDto,
  HtfMappingQueryDto,
  HtfMappingReturnResult,
  CreateHtfMappingDto,
  UpdateHtfMappingDto,
  TestIdDropdownDto
} from '../models/htf-mapping.model';

@Injectable({ providedIn: 'root' })
export class HtfMappingService {
  private readonly apiService = inject(ApiService);

  getAll(
    take: number,
    skip: number,
    query: HtfMappingQueryDto
  ): Observable<{ data: HtfMappingDto[]; totalRecords: number }> {
    const endpoint = API.HORIZONTAL_TEST_FILE_TEST_MAPPING.LIST(take, skip);

    const requestBody: HtfMappingQueryDto = {
      searchKeyword: query.searchKeyword || null,
      sortColumn: query.sortColumn || null,
      sortOrder: query.sortOrder || null,
    };

    return this.apiService
      .post<HtfMappingReturnResult<HtfMappingDto>>(endpoint, requestBody)
      .pipe(
        map((result) => ({
          data: result?.data || [],
          totalRecords: result?.total || 0
        })),
        catchError((error) => throwError(() => error))
      );
  }

  create(
    dto: CreateHtfMappingDto
  ): Observable<HtfMappingReturnResult<HtfMappingDto>> {
    const endpoint = API.HORIZONTAL_TEST_FILE_TEST_MAPPING.CREATE;

    return this.apiService
      .post<HtfMappingReturnResult<HtfMappingDto>>(endpoint, dto)
      .pipe(catchError((error) => throwError(() => error)));
  }

  update(
    sequenceNo: number,
    dto: UpdateHtfMappingDto
  ): Observable<HtfMappingReturnResult<HtfMappingDto>> {
    const endpoint = API.HORIZONTAL_TEST_FILE_TEST_MAPPING.UPDATE(sequenceNo);

    return this.apiService
      .put<HtfMappingReturnResult<HtfMappingDto>>(endpoint, dto)
      .pipe(catchError((error) => throwError(() => error)));
  }

  delete(sequenceNo: number): Observable<HtfMappingReturnResult<boolean>> {
    const endpoint = API.HORIZONTAL_TEST_FILE_TEST_MAPPING.DELETE(sequenceNo);

    return this.apiService
      .delete<HtfMappingReturnResult<boolean>>(endpoint)
      .pipe(catchError((error) => throwError(() => error)));
  }

  getTestIdsDropdown(): Observable<TestIdDropdownDto[]> {
    const endpoint = API.HORIZONTAL_TEST_FILE_TEST_MAPPING.TEST_IDS_DROPDOWN;

    return this.apiService
      .get<TestIdDropdownDto[]>(endpoint)
      .pipe(catchError((error) => throwError(() => error)));
  }

  getNextSequenceNo(): Observable<number> {
    const endpoint = API.HORIZONTAL_TEST_FILE_TEST_MAPPING.NEXT_SEQUENCE_NO;

    return this.apiService
      .get<HtfMappingReturnResult<number>>(endpoint)
      .pipe(
        map((result) => result?.data?.[0] ?? 1),
        catchError((error) => throwError(() => error))
      );
  }
}
