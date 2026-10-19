import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { API } from '../../../../core/constants/api.constants';
import {
  PhysicianDto,
  PhysicianSearchRequest,
  PhysicianSearchResponse,
  CreatePhysicianRequest,
  UpdatePhysicianRequest,
  PhysicianCreateUpdateResponse,
  PhysicianDeleteResponse
} from '../models/physician-api.model';

@Injectable({
  providedIn: 'root'
})
export class PhysicianApiService {
  private readonly http = inject(HttpClient);

  // POST /physicians/search
  searchPhysicians(
    searchRequest: PhysicianSearchRequest = {}
  ): Observable<PhysicianSearchResponse> {
    const url = `${environment.apiUrl}${API.PHYSICIAN.SEARCH}`;

    return this.http.post<PhysicianSearchResponse>(url, searchRequest);
  }

  // POST /physicians
  createPhysician(request: CreatePhysicianRequest): Observable<PhysicianDto> {
    const url = `${environment.apiUrl}${API.PHYSICIAN.CREATE}`;

    return this.http.post<PhysicianCreateUpdateResponse>(url, request).pipe(
      map(response => response.item)  // Backend returns "item" for create/update
    );
  }

  // PUT /physicians/{phyId}/{chapterId}
  updatePhysician(
    phyId: string,
    chapterId: string,
    request: UpdatePhysicianRequest
  ): Observable<PhysicianDto> {
    const url = `${environment.apiUrl}${API.PHYSICIAN.UPDATE(phyId, chapterId)}`;

    return this.http.put<PhysicianCreateUpdateResponse>(url, request).pipe(
      map(response => response.item)  // Backend returns "item" for create/update
    );
  }

  // DELETE /physicians/{phyId}/{chapterId}
  deletePhysician(phyId: string, chapterId: string): Observable<boolean> {
    const url = `${environment.apiUrl}${API.PHYSICIAN.DELETE(phyId, chapterId)}`;

    return this.http.delete<PhysicianDeleteResponse>(url).pipe(
      map(response => response.success)
    );
  }
}
