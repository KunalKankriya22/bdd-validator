import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  PhysicianModel,
  PhysicianSpecialtyModel,
  ZipCodeLookupModel,
  CreatePhysicianRequest,
  UpdatePhysicianRequest,
  PhysicianQueryParams,
  ApiResponse
} from '../models/physician.model';
import { PhysicianSearchRequest } from '../models/physician-api.model';
import { PhysicianApiService } from './physician-api.service';
import { PhysicianMapper } from '../utils/physician-mapper.util';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class PhysicianService {
  private readonly physicianApiService = inject(PhysicianApiService);
  private readonly apiService = inject(ApiService);

  getPhysicians(params: PhysicianQueryParams = {}): Observable<ApiResponse<PhysicianModel>> {
    const searchRequest: PhysicianSearchRequest = {
      searchKeyword: params.searchText || null,
      chapterId: params.chapterId || null,
      activeOnly: true,
      effDateFrom: params.effectiveDateFrom || null,
      effDateTo: params.effectiveDateTo || null,
      termDateFrom: params.terminationDateFrom || null,
      termDateTo: params.terminationDateTo || null,
      sortColumn: params.sortColumn || 'LastName',
      sortOrder: params.sortDirection?.toUpperCase() || 'ASC'
    };

    return this.physicianApiService.searchPhysicians(searchRequest).pipe(
      map(response => ({
        success: response.success,
        statusCode: response.statusCode,
        message: response.message,
        data: response.data.map(dto => PhysicianMapper.toModel(dto)),
        total: response.totalCount
      }))
    );
  }

  createPhysician(request: CreatePhysicianRequest): Observable<PhysicianModel> {
    const apiRequest = PhysicianMapper.toCreateRequest(request);

    return this.physicianApiService.createPhysician(apiRequest).pipe(
      map(dto => PhysicianMapper.toModel(dto))
    );
  }

  updatePhysician(physicianId: string, request: UpdatePhysicianRequest): Observable<PhysicianModel> {
    const chapterId = request.chapterId;
    const apiRequest = PhysicianMapper.toUpdateRequest(request);

    return this.physicianApiService.updatePhysician(physicianId, chapterId, apiRequest).pipe(
      map(dto => PhysicianMapper.toModel(dto))
    );
  }

  deletePhysician(physicianId: string, chapterId: string): Observable<void> {
    return this.physicianApiService.deletePhysician(physicianId, chapterId).pipe(
      map(() => void 0)
    );
  }

  // Fetches active PHYSP specialties from VALID_MASTER_CODES
  getSpecialties(): Observable<PhysicianSpecialtyModel[]> {
    return this.apiService.get<any>(API.LOOKUPS.BY_CODE_TYPE('PHYSP')).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data
            .filter((item: any) => item.isActive)
            .map((item: any) => ({
              code: item.code,
              description: item.description,
              codeType: 'PHYSP'
            }));
        }
        return [];
      })
    );
  }

  lookupZipCode(zipCode: string): Observable<ZipCodeLookupModel[]> {
    return this.apiService.get<any>(
      `${API.ALTERNATE_DEMOGRAPHICS.CITY_STATE}?zip=${zipCode}`
    ).pipe(
      map(response => {
        if (response.success && response.data && response.data.length > 0) {
          return response.data.map((item: any) => ({
            zipCode: item.zip,
            city: item.city,
            state: item.state,
            uspsId: item.uspsId
          } as ZipCodeLookupModel));
        }
        return [];
      })
    );
  }

}
