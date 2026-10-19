import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ViewInstitution } from '../interfaces/view-institution.interface';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../app/core/constants/api.constants';
import { ChapterModel } from '../../../application-admin/institutions/view-institution/view-institution';

export interface ChaptersApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: ChapterModel[];
}

@Injectable({
  providedIn: 'root'
})
export class ViewInstitutionService {

  constructor(private apiService: ApiService) {}

  getInstitutions(): Observable<ViewInstitution[]> {
    return this.apiService.get<ViewInstitution[]>(API.INSTITUTION.GET);
  }

  getChapters(): Observable<ChapterModel[]>{
    return this.apiService.get<ChaptersApiResponse>(API.INSTITUTION.ALL_CHAPTERS).pipe(
      map(response => {
        console.log('Raw API response:', response);

        // Handle the response wrapper and extract data array
        if (response && response.data && Array.isArray(response.data)) {
          console.log('Returning data array with', response.data.length, 'chapters');
          return response.data;
        }

        // Check if response itself is an array (in case API service already unwrapped it)
        if (Array.isArray(response)) {
          console.log('Response is already an array with', response.length, 'items');
          return response as unknown as ChapterModel[];
        }

        // Fallback to empty array if structure is unexpected
        console.warn('Unexpected API response structure:', response);
        return [];
      })
    );
  }
}
