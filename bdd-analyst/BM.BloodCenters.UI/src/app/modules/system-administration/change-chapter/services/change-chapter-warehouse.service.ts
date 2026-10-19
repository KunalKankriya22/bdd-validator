import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginService } from '../../../../shared/services/login.service';
import { environment } from '../../../../../environments/environment';

/*
  Backend APIs:
  GET  /api/v1/change-chapter-warehouse/chapters?loggedInUserName={username}
  GET  /api/v1/change-chapter-warehouse/chapters/{chapterId}/warehouses
  PUT  /api/v1/application-administration/change-chapter-warehouse
  GET  /api/v1/change-chapter-warehouse/chapters/details/{chapterId}
*/

const BASE_URL = `${environment.apiUrl}/api/v1/change-chapter-warehouse`;
const ADMIN_BASE_URL = `${environment.apiUrl}/api/v1/application-administration/change-chapter-warehouse`;

@Injectable({
  providedIn: 'root',
})
export class ChangeChapterWarehouseService {
  constructor(
    private http: HttpClient,
    private loginService: LoginService
  ) {}

  /* GET ALL CHAPTERS */
  getAllChapters(): Observable<ChapterResponse[]> {
    const loggedInUserName = this.loginService.getStoredUsername();

    const params = new HttpParams()
      .set('loggedInUserName', loggedInUserName);

    return this.http.get<ChapterResponse[]>(`${BASE_URL}/chapters`, { params });
  }

  /* GET WAREHOUSES BY CHAPTER*/
  getWarehousesByChapter(chapterId: string): Observable<WarehouseResponse[]> {
    return this.http.get<WarehouseResponse[]>(`${BASE_URL}/chapters/${chapterId}/warehouses`);
  }

  /* PUT CHANGE CHAPTER + WAREHOUSE*/
  updateChapterAndWarehouse(
    payload: ChangeChapterWarehouseRequest,
  ): Observable<ChangeChapterWarehouseResponse> {
    return this.http.put<ChangeChapterWarehouseResponse>(ADMIN_BASE_URL, payload);
  }

  /* GET CHAPTER DETAILS BY ID */
  getChapterDetails(chapterId: string): Observable<ChapterDetailsResponse> {
    return this.http.get<ChapterDetailsResponse>(`${BASE_URL}/chapters/details/${chapterId}`);
  }
}

/* MODELS*/

export interface ChapterResponse {
  chapterId: string;
  chapterName: string;
}

export interface WarehouseResponse {
  warehouseId: string;
  warehouseName: string;
}

export interface ChangeChapterWarehouseRequest {
  userId: string;
  oldChapterId: string;
  newChapterId: string;
  newChapterName: string;
  oldWarehouseId: string;
  newWarehouseId: string;
  newWarehouseName: string;
}

export interface ChangeChapterWarehouseResponse {
  message: string;
  oldChapterId: string;
  newChapterId: string;
  oldWarehouseId: string;
  newWarehouseId: string;
}

export interface ChapterDetailsResponse {
  chapterId: string;
  chapterName: string;
  chapterTimezone: string;
}
