import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { InstitutionForm } from '../interfaces/institution.interface';
import {
  CreateInstitutionRequest,
  UpdateInstitutionRequest,
  InstitutionApiResponse,
  InstitutionApiResponseCamel
} from '../interfaces/institution-api.interface';
import { mapInstitutionFormToApi, mapInstitutionFormToUpdateApi } from '../mapper/institution.mapper';
import { API } from '../../../../core/constants/api.constants';
import { ApiService } from '../../../../shared/services/api.service';
import { keysToCamelCase } from '@shared/utils/case-converter.util';
export interface Institution {
  id: string;
  description: string;
  shortName?: string;
  shortNameRequired?: boolean;
}

export interface LookupCode {
  codeType: string;
  code: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class InstitutionService {

  private savedInstitution: Institution | null = null;

  private readonly http = inject(HttpClient);
  private apiService = inject(ApiService);

  public createInstitution(institution: InstitutionForm): Observable<any> {
    const payload: CreateInstitutionRequest = mapInstitutionFormToApi(institution);
    return this.apiService.post<any>(API.INSTITUTION.CREATE, payload);
  }

  public getInstitution(): Observable<InstitutionApiResponseCamel | null> {
    return this.apiService.get<InstitutionApiResponse[]>(API.INSTITUTION.GET).pipe(
      map((res) => {

        if (Array.isArray(res) && res.length > 0) {
          const camelCaseInstitution = keysToCamelCase<InstitutionApiResponseCamel>(res[0], true);
          return camelCaseInstitution;
        }
        return null;
      })
    );
  }
  
  public updateInstitution(
    instId: string,
    institution: InstitutionForm
  ): Observable<any> {
    const payload: UpdateInstitutionRequest = mapInstitutionFormToUpdateApi(institution);

    return this.apiService.put<any>(
      API.INSTITUTION.UPDATE.replace('{instId}', instId),
      payload
    );
  }

  public uploadLogo(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.apiService.post(
      API.AUTH.UPLOAD,
      formData,
      { responseType: 'text' }
    ) as Observable<string>;
  }

  public downloadLogo(fileName: string, cacheBust: boolean = false): Observable<Blob> {
    let apiUrl = `/api/v1/Auth/download/${fileName}`;

    // Add timestamp query parameter to prevent caching
    if (cacheBust) {
      const timestamp = new Date().getTime();
      apiUrl += `?t=${timestamp}`;
    }

    return this.apiService.get(apiUrl, { responseType: 'blob' }) as Observable<Blob>;
  }

  public getStatesLookup(): Observable<LookupCode[]> {
    return this.apiService.get<LookupCode[]>(API.INSTITUTION.STATES_LOOKUP);
  }

  public getCountriesLookup(): Observable<LookupCode[]> {
    return this.apiService.get<LookupCode[]>(API.INSTITUTION.COUNTRIES_LOOKUP);
  }
}