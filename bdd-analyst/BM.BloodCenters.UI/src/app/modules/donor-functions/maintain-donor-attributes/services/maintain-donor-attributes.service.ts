import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../../../shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import {
  MaintainDonorAttributeDonorDetails,
  MaintainDonorAttribute,
  MaintainDonorAttributeProperty,
  CreateMaintainDonorAttributeRequest,
  UpdateMaintainDonorAttributeRequest,
  BulkTerminateMaintainDonorAttributeRequest,
} from '../models/maintain-donor-attributes.models';

@Injectable({ providedIn: 'root' })
export class MaintainDonorAttributesService {
  constructor(private apiService: ApiService) {}

  getDonorDetails(donorId: string): Observable<MaintainDonorAttributeDonorDetails> {
    return this.apiService
      .get<{ item?: MaintainDonorAttributeDonorDetails }>(API.MAINTAIN_DONOR_ATTRIBUTE.DONOR_DETAILS(donorId))
      .pipe(
        map((res) => res?.item || (res as unknown as MaintainDonorAttributeDonorDetails)),
        catchError((err) => throwError(() => err)),
      );
  }

  getAttributes(
    donorId: string,
    showTerminated = false,
    effDateAfter?: string,
    effDateBefore?: string,
    termDateBefore?: string,
    termDateAfter?: string,
    search?: string,
  ): Observable<MaintainDonorAttribute[]> {
    let params = new HttpParams().set('showTerminated', showTerminated.toString());
    if (effDateAfter) params = params.set('effDateAfter', effDateAfter);
    if (effDateBefore) params = params.set('effDateBefore', effDateBefore);
    if (termDateBefore) params = params.set('termDateBefore', termDateBefore);
    if (termDateAfter) params = params.set('termDateAfter', termDateAfter);
    if (search) params = params.set('search', search);

    return this.apiService
      .get<{ data?: MaintainDonorAttribute[] }>(API.MAINTAIN_DONOR_ATTRIBUTE.ATTRIBUTES(donorId), { params })
      .pipe(
        map((res) => res?.data || []),
        catchError((err) => throwError(() => err)),
      );
  }

  getPropertiesDropdown(): Observable<MaintainDonorAttributeProperty[]> {
    return this.apiService
      .get<{ data?: MaintainDonorAttributeProperty[] }>(API.MAINTAIN_DONOR_ATTRIBUTE.PROPERTIES_DROPDOWN)
      .pipe(
        map((res) => res?.data || []),
        catchError((err) => throwError(() => err)),
      );
  }

  createAttribute(donorId: string, request: CreateMaintainDonorAttributeRequest): Observable<void> {
    return this.apiService
      .post<void>(API.MAINTAIN_DONOR_ATTRIBUTE.CREATE(donorId), request)
      .pipe(catchError((err) => throwError(() => err)));
  }

  updateAttribute(donorId: string, interCode: string, effDate: string, request: UpdateMaintainDonorAttributeRequest): Observable<void> {
    return this.apiService
      .put<void>(API.MAINTAIN_DONOR_ATTRIBUTE.UPDATE(donorId, interCode, effDate), request)
      .pipe(catchError((err) => throwError(() => err)));
  }

  bulkTerminate(donorId: string, request: BulkTerminateMaintainDonorAttributeRequest): Observable<void> {
    return this.apiService
      .put<void>(API.MAINTAIN_DONOR_ATTRIBUTE.BULK_TERMINATE(donorId), request)
      .pipe(catchError((err) => throwError(() => err)));
  }
}
