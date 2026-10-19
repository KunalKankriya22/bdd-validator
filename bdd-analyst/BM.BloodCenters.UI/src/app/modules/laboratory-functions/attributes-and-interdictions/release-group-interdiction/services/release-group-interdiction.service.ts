import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  ReleaseGroupInterdictionDto,
  ReleaseGroupInterdictionQueryDto,
  ReleaseGroupInterdictionDeleteRequestDto,
  ReleaseGroupInterdictionUnitInfoDto,
  DriveDropdownItem,
  BatchDropdownItem,
  CollectionDateDropdownItem,
  LotNumberDropdownItem,
  TbIdDropdownItem,
  ApiResponse,
  DropdownApiResponse,
} from '../models/release-group-interdiction.models';

@Injectable({
  providedIn: 'root',
})
export class ReleaseGroupInterdictionService {
  private readonly apiService = inject(ApiService);

  getAll(
    take: number,
    skip: number,
    query: ReleaseGroupInterdictionQueryDto,
  ): Observable<{ data: ReleaseGroupInterdictionDto[]; totalCount: number }> {
    return this.apiService
      .post<ApiResponse<ReleaseGroupInterdictionDto>>(
        API.RELEASE_GROUP_INTERDICTION.GET_ALL(take, skip),
        query,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map((response) => ({
          data: response?.data ?? [],
          totalCount: response?.total ?? response?.totalCount ?? 0,
        })),
        catchError((error) => {
          console.error('Error fetching group interdictions:', error);
          return throwError(() => error);
        }),
      );
  }

  deleteInterdictions(
    request: ReleaseGroupInterdictionDeleteRequestDto,
  ): Observable<{ success: boolean; message: string }> {
    return this.apiService
      .post<{ success: boolean; message: string }>(
        API.RELEASE_GROUP_INTERDICTION.DELETE,
        request,
      )
      .pipe(
        catchError((error) => {
          console.error('Error deleting interdictions:', error);
          return throwError(() => error);
        }),
      );
  }

  getUnitsInfo(
    controlMode: string,
    filterValue: string,
  ): Observable<ReleaseGroupInterdictionUnitInfoDto[]> {
    return this.apiService
      .get<ApiResponse<ReleaseGroupInterdictionUnitInfoDto>>(
        `${API.RELEASE_GROUP_INTERDICTION.UNITS_INFO}?controlMode=${encodeURIComponent(controlMode)}&filterValue=${encodeURIComponent(filterValue)}`,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map((response) => response?.data ?? []),
        catchError((error) => {
          console.error('Error fetching units info:', error);
          return throwError(() => error);
        }),
      );
  }

  getDrivesDropdown(sourceTestId: string): Observable<DriveDropdownItem[]> {
    return this.apiService
      .get<DropdownApiResponse<DriveDropdownItem>>(
        `${API.RELEASE_GROUP_INTERDICTION.DROPDOWN_DRIVES}?sourceTestId=${encodeURIComponent(sourceTestId)}`,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map((response) => response?.data ?? []),
        catchError((error) => {
          console.error('Error fetching drives dropdown:', error);
          return throwError(() => error);
        }),
      );
  }

  getBatchesDropdown(sourceTestId: string): Observable<BatchDropdownItem[]> {
    return this.apiService
      .get<DropdownApiResponse<BatchDropdownItem>>(
        `${API.RELEASE_GROUP_INTERDICTION.DROPDOWN_BATCHES}?sourceTestId=${encodeURIComponent(sourceTestId)}`,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map((response) => response?.data ?? []),
        catchError((error) => {
          console.error('Error fetching batches dropdown:', error);
          return throwError(() => error);
        }),
      );
  }

  getCollectionDatesDropdown(sourceTestId: string): Observable<CollectionDateDropdownItem[]> {
    return this.apiService
      .get<DropdownApiResponse<CollectionDateDropdownItem>>(
        `${API.RELEASE_GROUP_INTERDICTION.DROPDOWN_COLLECTION_DATES}?sourceTestId=${encodeURIComponent(sourceTestId)}`,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map((response) => response?.data ?? []),
        catchError((error) => {
          console.error('Error fetching collection dates dropdown:', error);
          return throwError(() => error);
        }),
      );
  }

  getLotNumbersDropdown(sourceTestId: string): Observable<LotNumberDropdownItem[]> {
    return this.apiService
      .get<DropdownApiResponse<LotNumberDropdownItem>>(
        `${API.RELEASE_GROUP_INTERDICTION.DROPDOWN_LOT_NUMBERS}?sourceTestId=${encodeURIComponent(sourceTestId)}`,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map((response) => response?.data ?? []),
        catchError((error) => {
          console.error('Error fetching lot numbers dropdown:', error);
          return throwError(() => error);
        }),
      );
  }

  getTbIdsDropdown(sourceTestId: string): Observable<TbIdDropdownItem[]> {
    return this.apiService
      .get<DropdownApiResponse<TbIdDropdownItem>>(
        `${API.RELEASE_GROUP_INTERDICTION.DROPDOWN_TB_IDS}?sourceTestId=${encodeURIComponent(sourceTestId)}`,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      )
      .pipe(
        map((response) => response?.data ?? []),
        catchError((error) => {
          console.error('Error fetching TB IDs dropdown:', error);
          return throwError(() => error);
        }),
      );
  }
}
