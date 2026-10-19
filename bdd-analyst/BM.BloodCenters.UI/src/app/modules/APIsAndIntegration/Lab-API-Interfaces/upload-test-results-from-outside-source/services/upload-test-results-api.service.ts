import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { LoginService } from '@shared/services/login.service';
import { API } from '../../../../../core/constants/api.constants';
import {
  ChapterOption,
  FileLocationResponse,
  UploadTestResultsResponseDto
} from '../models/upload-test-results.model';

@Injectable({
  providedIn: 'root'
})
export class UploadTestResultsApiService {
  constructor(
    private apiService: ApiService,
    private loginService: LoginService
  ) {}

  /**
   * Get list of available chapters
   */
  getChapters(): Observable<ChapterOption[]> {
    return this.apiService
      .get<any>(API.CHAPTER.GET)
      .pipe(
        map(response => {
          // Handle both direct array and wrapped response
          const chapters = Array.isArray(response) ? response : (response?.data || []);

          if (!chapters || chapters.length === 0) {
            return [];
          }

          return chapters.map((chapter: any) => ({
            chapterId: chapter.chapterId,
            chapterName: chapter.chapterName,
            chapterCode: chapter.chapterCode,
            effectiveDate: chapter.effDate || chapter.effectiveDate,
            terminationDate: chapter.termDate || chapter.terminationDate
          }));
        })
      );
  }

  /**
   * Get the default browse file location from MASTER_CODES
   */
  getFileLocation(): Observable<FileLocationResponse> {
    return this.apiService.get<FileLocationResponse>(API.APPLICATION_ADMIN.FILE_LOCATION);
  }

  /**
   * Upload test results files
   */
  uploadTestResults(chapterId: string, files: File[]): Observable<UploadTestResultsResponseDto> {
    const formData = new FormData();

    // Append multiple files with same key name: "files"
    for (const file of files) {
      formData.append('files', file);
    }

    // Get logged in username
    const loggedInUserName = this.loginService.getStoredUsername();

    const endpoint = API.APPLICATION_ADMIN.UPLOAD_TEST_RESULTS(chapterId, loggedInUserName);

    return this.apiService.post<UploadTestResultsResponseDto>(
      endpoint,
      formData
    );
  }
}
