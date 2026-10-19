import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import moment from 'moment';
import {
  DonorResponseConfiguration,
  ValidHHResource,
  AddValidHHResourceRequest,
  UpdateValidHHResourceRequest,
  DonorResponseConfigurationApiResponse,
  ResourceConfigurationApiResponse,
  RetrieveValidHHResourceConfigRequest,
  SaveDonorResponseConfigRequest,
  ApiResponse
} from '../models/fasttrak-web-configuration.model';
import { API } from '../../../../../../core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class FastTrakWebConfigurationService {
  private apiService = inject(ApiService);

  getDonorResponseConfiguration(): Observable<DonorResponseConfiguration | null> {
    return this.apiService.get<ApiResponse<DonorResponseConfigurationApiResponse>>(
      API.DONOR_FUNCTIONS.FASTTRAK_WEB_CONFIG.DONOR_RESPONSE_CONFIG
    ).pipe(
      map(response => {
        if (response?.data && response.data.length > 0) {
          return this.transformDonorResponseFromApi(response.data[0]);
        }
        return null;
      })
    );
  }

  getResourceConfiguration(): Observable<ResourceConfigurationApiResponse> {
    return this.apiService.get<ResourceConfigurationApiResponse>(
      API.DONOR_FUNCTIONS.FASTTRAK_WEB_CONFIG.RESOURCE_CONFIG
    );
  }

  private transformDonorResponseFromApi(apiResponse: DonorResponseConfigurationApiResponse): DonorResponseConfiguration {
    return {
      onlineResponsesFlag: apiResponse.donorResponseFlag === 'Y',
      multiLanguageFlag: apiResponse.multiLangaugeFlag === 'Y',
      effectiveDate: apiResponse.effectiveDate ? moment(apiResponse.effectiveDate) : null,
      terminationDate: apiResponse.terminationDate ? moment(apiResponse.terminationDate) : null,
      auditKey: apiResponse.auditKey ?? null
    };
  }

  saveDonorResponseConfiguration(request: SaveDonorResponseConfigRequest): Observable<ApiResponse<DonorResponseConfigurationApiResponse>> {
    return this.apiService.post<ApiResponse<DonorResponseConfigurationApiResponse>>(
      API.DONOR_FUNCTIONS.FASTTRAK_WEB_CONFIG.DONOR_RESPONSE_CONFIG,
      request
    );
  }

  retrieveResources(request: RetrieveValidHHResourceConfigRequest): Observable<ApiResponse<ValidHHResource>> {
    return this.apiService.post<ApiResponse<ValidHHResource>>(
      API.DONOR_FUNCTIONS.FASTTRAK_WEB_CONFIG.RETRIEVE_RESOURCES,
      request
    );
  }

  addResource(resource: AddValidHHResourceRequest): Observable<ApiResponse<ValidHHResource>> {
    return this.apiService.post<ApiResponse<ValidHHResource>>(
      API.DONOR_FUNCTIONS.FASTTRAK_WEB_CONFIG.ADD_RESOURCE,
      resource
    );
  }

  updateResource(resource: UpdateValidHHResourceRequest): Observable<ApiResponse<ValidHHResource>> {
    return this.apiService.put<ApiResponse<ValidHHResource>>(
      API.DONOR_FUNCTIONS.FASTTRAK_WEB_CONFIG.UPDATE_RESOURCE,
      resource
    );
  }
}
