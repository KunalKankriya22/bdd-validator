import { Injectable } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import {
  MobilePcLaptopRegisterModel,
  MobilePcLaptopRegisterParamsDto,
  MobilePcLaptopRegisterDto,
  UpdateMobilePcLaptopRegisterDto,
  ChapterLookup,
  MobilePcLaptopRegisterApiResponse,
  MobilePcLaptopRegisterRawData
} from '../models/mobile-pc-laptop-register.model';

@Injectable({
  providedIn: 'root'
})
export class MobilePcLaptopRegisterService {
  constructor(
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  getMobilePcLaptopRegister(
    take: number,
    skip: number,
    params: MobilePcLaptopRegisterParamsDto
  ): Observable<{ data: MobilePcLaptopRegisterModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.MOBILE_PC_LAPTOP_REGISTER(take, skip);

    return this.apiService.post<MobilePcLaptopRegisterApiResponse>(endpoint, params).pipe(
      map((response: MobilePcLaptopRegisterApiResponse) => ({
        data: this.mapRawDataToModels(response.data || []),
        totalRecords: response.total || 0
      })),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  private mapRawDataToModels(rawData: MobilePcLaptopRegisterRawData[]): MobilePcLaptopRegisterModel[] {
    return rawData.map(item => ({
      laptopId: item.laptopId,
      temporaryId: item.ltTempId,
      chapterId: item.chapterId,
      chapter: item.chapterId,
      createdDate: item.insertDate ? new Date(item.insertDate) : undefined,
      createdBy: item.insertUser,
      modifiedDate: item.insertDate ? new Date(item.insertDate) : undefined,
      currentSequence: item.currentSeq,
      auditIncrement: item.incrementBy,
      refreshDate: item.refreshDate ? new Date(item.refreshDate) : undefined,
      location: item.location?.trim() || '',
      detail1: item.detail1?.trim() || '',
      detail2: item.detail2?.trim() || '',
      detail3: item.detail3?.trim() || '',
      detail4: item.detail4?.trim() || ''
    }));
  }

  getMobilePcLaptopRegisterFilters(): Observable<{ chapters: ChapterLookup[] }> {
    return this.apiService.get<{ chapters: ChapterLookup[] }>(
      API.APPLICATION_ADMIN.MOBILE_PC_LAPTOP_REGISTER_FILTERS
    ).pipe(
      catchError(error => {
        const errorMessage = error?.error?.message || error?.message || 'Error loading filters';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        return throwError(() => error);
      })
    );
  }

  getChapters(): Observable<ChapterLookup[]> {
    return this.apiService.get<{ chapterId: string; chapterName?: string }[]>(API.CHAPTER.ACTIVE_LOOKUP).pipe(
      map((response) => response
        .map(item => ({
          chapterId: item.chapterId,
          chapterName: item.chapterName || item.chapterId
        }))
        .sort((a, b) => a.chapterId.localeCompare(b.chapterId))
      ),
      catchError(error => {
        const errorMessage = error?.error?.message || error?.message || 'Error loading chapters';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        return throwError(() => error);
      })
    );
  }

  addMobilePcLaptopRegister(data: MobilePcLaptopRegisterDto): Observable<any> {
    return this.apiService.post<any>(
      API.APPLICATION_ADMIN.MOBILE_PC_LAPTOP_REGISTER_ADD_EDIT,
      data
    );
  }

  updateMobilePcLaptopRegister(data: UpdateMobilePcLaptopRegisterDto): Observable<any> {
    return this.apiService.put<any>(
      API.APPLICATION_ADMIN.MOBILE_PC_LAPTOP_REGISTER_ADD_EDIT,
      data
    );
  }

  // Helper to format date to ISO string for API
  formatDateForApi(date: Date | null): string {
    if (!date) return '';
    return new Date(date).toISOString();
  }
}
