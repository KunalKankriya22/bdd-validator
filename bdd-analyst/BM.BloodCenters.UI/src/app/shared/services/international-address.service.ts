import { Injectable, signal, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import {
  InternationalAddressModel,
  CountryModel,
  SaveInternationalAddressRequest,
  ValidateInternationalAddressRequest
} from '../models/international-address.model';
import { ApiService } from './api.service';
import { ValidMasterCodesService } from './valid-master-codes.service';
import { API } from '../../core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class InternationalAddressService {
  private readonly apiService = inject(ApiService);
  private readonly validMasterCodesService = inject(ValidMasterCodesService);

  // Session state using signals (Angular 20)
  private internationalAddress = signal<InternationalAddressModel | null>(null);
  private modifiedFlag = signal<boolean>(false);

  // Observable for components that prefer observables
  private internationalAddress$ = new BehaviorSubject<InternationalAddressModel | null>(null);

  /**
   * Get list of countries from shared lookup (VALID_MASTER_CODES CODE_TYPE='CNTRY').
   * Results are memory-cached via ValidMasterCodesService — one API call per session.
   */
  getCountries(): Observable<CountryModel[]> {
    return this.validMasterCodesService.getCountries();
  }

  /**
   * Validate international address before saving.
   * POST /api/v1/shared/international-address/validate
   */
  validate(request: ValidateInternationalAddressRequest): Observable<any> {
    return this.apiService.post(API.INTERNATIONAL_ADDRESS.VALIDATE, request);
  }

  /**
   * Save international address and link to target table.
   * POST /api/v1/shared/international-address/save
   */
  saveAddress(request: SaveInternationalAddressRequest): Observable<any> {
    return this.apiService.post(API.INTERNATIONAL_ADDRESS.SAVE, request);
  }

  // ===== Session State Management =====

  getInternationalAddress() {
    return this.internationalAddress();
  }

  setInternationalAddress(address: InternationalAddressModel | null): void {
    this.internationalAddress.set(address);
    this.internationalAddress$.next(address);
    this.modifiedFlag.set(address !== null && this.hasAnyValue(address));
  }

  getInternationalAddress$(): Observable<InternationalAddressModel | null> {
    return this.internationalAddress$.asObservable();
  }

  isModified(): boolean {
    return this.modifiedFlag();
  }

  clearInternationalAddress(): void {
    this.internationalAddress.set(null);
    this.internationalAddress$.next(null);
    this.modifiedFlag.set(false);
  }

  private hasAnyValue(address: InternationalAddressModel): boolean {
    return !!(
      address.streetName ||
      address.addr1 ||
      address.addr2 ||
      address.addr3 ||
      address.country ||
      address.postalCode ||
      address.homePhoneNo ||
      address.workPhoneNo ||
      address.workPhoneExt ||
      address.mobilePhoneNo ||
      address.faxNo ||
      address.email
    );
  }

  createEmptyAddress(): InternationalAddressModel {
    return {
      streetName: '',
      addr1: null,
      addr2: null,
      addr3: null,
      country: '',
      postalCode: null,
      homePhoneNo: null,
      workPhoneNo: null,
      workPhoneExt: null,
      mobilePhoneNo: null,
      faxNo: null,
      email: null,
      intlAddrFlag: 'N',
      modifiedFlag: 'N'
    };
  }
}
