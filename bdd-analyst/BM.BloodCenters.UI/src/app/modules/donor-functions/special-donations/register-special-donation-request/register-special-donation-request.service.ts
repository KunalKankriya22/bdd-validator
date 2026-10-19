import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  SpecialDonationSearchRequest,
  SpecialPatientListItem,
  SpecialPatientDetail,
  CreateSpecialPatientRequest,
  CreateSpecialSurgeryRequest,
  UpdateSpecialSurgeryRequest,
  AddSpecialDonorRequest,
  LookupItem,
} from './register-special-donation-request.models';

@Injectable({ providedIn: 'root' })
export class RegisterSpecialDonationRequestService {
  private api = inject(ApiService);

  search(request: SpecialDonationSearchRequest): Observable<any> {
    return this.api.post<any>(API.SPECIAL_DONATION_REQUEST.SEARCH, request);
  }

  getPatientDetail(patId: string): Observable<any> {
    return this.api.get<any>(API.SPECIAL_DONATION_REQUEST.GET_DETAIL(patId));
  }

  createPatient(request: CreateSpecialPatientRequest): Observable<any> {
    return this.api.post<any>(API.SPECIAL_DONATION_REQUEST.CREATE_PATIENT, request);
  }

  updatePatient(patId: string, request: CreateSpecialPatientRequest): Observable<any> {
    return this.api.put<any>(API.SPECIAL_DONATION_REQUEST.UPDATE_PATIENT(patId), request);
  }

  createSurgery(request: CreateSpecialSurgeryRequest): Observable<any> {
    return this.api.post<any>(API.SPECIAL_DONATION_REQUEST.CREATE_SURGERY, request);
  }

  updateSurgery(surgId: string, request: UpdateSpecialSurgeryRequest): Observable<any> {
    return this.api.put<any>(API.SPECIAL_DONATION_REQUEST.UPDATE_SURGERY(surgId), request);
  }

  addDonor(request: AddSpecialDonorRequest): Observable<any> {
    return this.api.post<any>(API.SPECIAL_DONATION_REQUEST.ADD_DONOR, request);
  }

  deleteDonor(surgId: string, seqNo: number): Observable<any> {
    return this.api.delete<any>(API.SPECIAL_DONATION_REQUEST.DELETE_DONOR(surgId, seqNo));
  }

  getHospitals(search?: string): Observable<any> {
    const url = search
      ? `${API.SPECIAL_DONATION_REQUEST.LOOKUP_HOSPITALS}?search=${encodeURIComponent(search)}`
      : API.SPECIAL_DONATION_REQUEST.LOOKUP_HOSPITALS;
    return this.api.get<any>(url);
  }

  getConsignees(hospitalId?: string, search?: string): Observable<any> {
    let url = API.SPECIAL_DONATION_REQUEST.LOOKUP_CONSIGNEES;
    const params: string[] = [];
    if (hospitalId) params.push(`hospitalId=${encodeURIComponent(hospitalId)}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (params.length) url += '?' + params.join('&');
    return this.api.get<any>(url);
  }

  getSurgeryTypes(): Observable<any> {
    return this.api.get<any>(API.SPECIAL_DONATION_REQUEST.LOOKUP_SURGERY_TYPES);
  }

  getPatientTypes(): Observable<any> {
    return this.api.get<any>(API.SPECIAL_DONATION_REQUEST.LOOKUP_PATIENT_TYPES);
  }

  getProductTypes(): Observable<any> {
    return this.api.get<any>(API.SPECIAL_DONATION_REQUEST.LOOKUP_PRODUCT_TYPES);
  }

  getShipLocations(): Observable<any> {
    return this.api.get<any>(API.SPECIAL_DONATION_REQUEST.LOOKUP_CONSIGNEES);
  }

  getPatientStatuses(): Observable<any> {
    return this.api.get<any>(API.SPECIAL_DONATION_REQUEST.LOOKUP_PATIENT_STATUSES);
  }

  getAboTypes(): Observable<any> {
    return this.api.get<any>(API.SPECIAL_DONATION_REQUEST.LOOKUP_ABO_TYPES);
  }

  getPhysicians(): Observable<any> {
    return this.api.post<any>(API.PHYSICIAN.SEARCH, { ActiveOnly: true });
  }

  generatePatientId(): Observable<any> {
    return this.api.get<any>(API.SPECIAL_DONATION_REQUEST.GENERATE_PAT_ID);
  }

  generateSurgeryId(): Observable<any> {
    return this.api.get<any>(API.SPECIAL_DONATION_REQUEST.GENERATE_SURG_ID);
  }

  createPatientWithSurgery(dto: any): Observable<any> {
    return this.api.post<any>(API.SPECIAL_DONATION_REQUEST.PATIENT_WITH_SURGERY, dto);
  }
}
