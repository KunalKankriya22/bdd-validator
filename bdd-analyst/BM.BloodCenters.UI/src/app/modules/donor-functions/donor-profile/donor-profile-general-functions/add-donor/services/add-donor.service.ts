import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError, map, of } from 'rxjs';
import { HttpContext } from '@angular/common/http';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../../core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '../../../../../../core/constants/http-context.constants';
import {
  CreateDonorRequest,
  ModifyDonorRequest,
  DonorResponse,
  DonorData,
  CityStateLookupResponse,
  CityStateResult,
} from '../models/add-donor.model';

interface AddDonorApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total?: number;
  errorResponse: {
    errorCode: string | null;
    error: string | null;
  };
}

@Injectable({ providedIn: 'root' })
export class AddDonorService {
  private readonly apiService = inject(ApiService);

  createDonor(request: CreateDonorRequest): Observable<DonorResponse> {
    return this.apiService.post<DonorResponse>(API.ADD_DONOR.CREATE, request).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  getDonorById(donorId: string): Observable<DonorData> {
    return this.apiService.get<AddDonorApiResponse<Record<string, unknown>[]>>(API.ADD_DONOR.GET_BY_ID(donorId)).pipe(
      map((response) => {
        const raw = Array.isArray(response.data) ? response.data[0] : response.data;
        if (!raw) throw new Error('Donor not found');
        return this.mapToDonorData(raw as Record<string, unknown>);
      }),
      catchError((error) => throwError(() => error))
    );
  }

  private mapToDonorData(raw: Record<string, unknown>): DonorData {
    const intlFlag = (raw['intlAddrFlag'] as string) || 'N';
    return {
      donorId: (raw['donorId'] as string) || '',
      lastName: (raw['lastName'] as string) || '',
      firstName: (raw['firstName'] as string) || '',
      middleName: (raw['middleName'] as string) || '',
      salutation: (raw['salutation'] as string) || '',
      alias: (raw['alias'] as string) || '',
      lastNameSuffix: (raw['lastNameSuffix'] as string) || '',
      gender: (raw['gender'] as string) || '',
      dateOfBirth: (raw['dateOfBirth'] as string) || '',
      ethnicGroup: (raw['ethnicGroup'] as string) || '',
      ethnicGroupDescription: '',
      alternateId: (raw['alternateId'] as string) || '',
      alternateIdType: (raw['alternateIdType'] as string) || '',
      claimedDonation: (raw['claimedDonation'] as number) ?? null,
      lang: (raw['lang'] as string) || '',
      scanId: (raw['scanId'] as string) || '',
      ssn: '',
      bloodType: (raw['bloodType'] as string) || '',
      status: (raw['status'] as string) || '',
      streetName: (raw['streetName'] as string) || '',
      suiteApt: (raw['suiteApt'] as string) || '',
      city: (raw['city'] as string) || '',
      state: (raw['state'] as string) || '',
      zip: (raw['zip'] as string) || '',
      uspsId: (raw['uspsId'] as number) ?? null,
      homeAreaCode: (raw['hAreaCode'] as string) || '',
      homePhoneNo: (raw['hPhoneNo'] as string) || '',
      workAreaCode: (raw['dAreaCode'] as string) || '',
      workPhoneNo: (raw['dPhoneNo'] as string) || '',
      workExtension: '',
      mobileAreaCode: (raw['mAreaCode'] as string) || '',
      mobilePhoneNo: (raw['mPhoneNo'] as string) || '',
      preferredContactFlag: (raw['preferredContactFlag'] as string) || '',
      email: (raw['email'] as string) || '',
      employerId: (raw['employerId'] as string) || '',
      employerName: (raw['empName'] as string) || (raw['employerName'] as string) || '',
      employerCity: (raw['eCity'] as string) || '',
      employerState: (raw['eState'] as string) || '',
      employerZip: (raw['eZip'] as string) || '',
      prevBloodCenter: (raw['prevBloodCenter'] as string) || '',
      previousDonorId: (raw['previosDonorId'] as string) || '',
      migratedUnit: (raw['migratedUnit'] as number) ?? null,
      migratedCity: (raw['migratedCity'] as string) || '',
      migratedState: (raw['migratedState'] as string) || '',
      migratedZip: (raw['migratedZip'] as string) || '',
      migratedStreetName: (raw['migratedStreetName'] as string) || '',
      migratedSuiteApt: (raw['migratedSuiteApt'] as string) || '',
      intlAddrFlag: intlFlag,
      internationalAddress: intlFlag === 'Y' ? {
        streetName: (raw['intlAddress1'] as string) || '',
        addr1: (raw['intlAddress1'] as string) || '',
        addr2: (raw['intlAddress2'] as string) || '',
        addr3: (raw['intlAddress3'] as string) || '',
        addr4: (raw['intlAddress4'] as string) || '',
        country: (raw['countryName'] as string) || '',
        postalCode: (raw['intlPostalCode'] as string) || '',
        homePhoneNo: (raw['intlHomePhoneNo'] as string) || '',
        workPhoneNo: (raw['intlWorkPhoneNo'] as string) || '',
        workPhoneExt: (raw['intlWorkPhoneExt'] as string) || '',
        mobilePhoneNo: (raw['intlMobilePhoneNo'] as string) || '',
        faxNo: (raw['intlFaxNo'] as string) || '',
        email: (raw['email'] as string) || '',
        intlAddrFlag: 'Y',
      } : null,
      alternateAddress: (raw['altStreetName'] || raw['altIntlAddress1'] || raw['altIntlAddrFlag'] || raw['preferredContactAddrFlag']) ? {
        addressType: (raw['altIntlAddrFlag'] as string) === 'Y' ? 'I' as const : 'L' as const,
        streetName: (raw['altStreetName'] as string) || null,
        suiteApt: (raw['altSuiteApt'] as string) || null,
        city: (raw['altCity'] as string) || null,
        state: (raw['altState'] as string) || null,
        zip: (raw['altZip'] as string) || null,
        uspsId: (raw['altUspsId'] as number) ?? null,
        intlAddress1: (raw['altIntlAddress1'] as string) || null,
        intlAddress2: (raw['altIntlAddress2'] as string) || null,
        intlAddress3: (raw['altIntlAddress3'] as string) || null,
        intlAddress4: (raw['altIntlAddress4'] as string) || null,
        countryName: (raw['altCountryName'] as string) || null,
        intlCity: null,
        intlPostalCode: (raw['altIntlPostalCode'] as string) || null,
        intlAddrFlag: (raw['altIntlAddrFlag'] as string) || null,
        mobilePhoneNumber: ((raw['mAreaCode'] as string) || '') + ((raw['mPhoneNo'] as string) || '') || null,
        otherContactNumber: (raw['otherContactNo'] as string) || null,
        altIntlPhoneNumber: (raw['altIntlPhoneNo'] as string) || null,
        preferredContactPhone: (raw['preferredContactFlag'] as string) || null,
        preferredContactAddress: (raw['preferredContactAddrFlag'] as string) || null,
      } : null,
      employerIntlAddrFlag: (raw['empIntlAddrFlag'] as string) || 'N',
      employerInternationalAddress: (raw['empIntlAddrFlag'] as string) === 'Y' ? {
        city: (raw['empIntlCity'] as string) || '',
        state: (raw['empIntlState'] as string) || '',
        country: (raw['empCountryName'] as string) || '',
        postalCode: (raw['empIntlPostalCode'] as string) || '',
        intlAddrFlag: 'Y',
        modifiedFlag: 'N',
      } : null,
      insertDate: (raw['insertDate'] as string) || '',
      insertUser: (raw['insertUser'] as string) || '',
      lastUpdated: (raw['insertDate'] as string) || '',
    };
  }

  modifyDonor(donorId: string, request: ModifyDonorRequest): Observable<DonorResponse> {
    return this.apiService.put<DonorResponse>(API.ADD_DONOR.MODIFY(donorId), request).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  getCityStateByZip(zip: string): Observable<CityStateResult> {
    return this.apiService.get<CityStateLookupResponse>(API.ADD_DONOR.CITY_STATE_LOOKUP(zip)).pipe(
      map((response) => response.data),
      catchError((error) => throwError(() => error))
    );
  }

  getCitiesByZip(zip: string): Observable<CityStateResult[]> {
    return this.apiService.get<any>(
      API.DONOR_DEMOGRAPHICS.CITY_STATE + '?zip=' + encodeURIComponent(zip)
    ).pipe(
      map((response) => response?.data || []),
      catchError(() => of([]))
    );
  }

  searchCities(search: string): Observable<{ code: string; description: string }[]> {
    return this.apiService.get<AddDonorApiResponse<unknown>>(
      API.ADD_DONOR.LOOKUPS.CITIES(search)
    ).pipe(
      map((res) => this.extractLookupItems(res.data)),
      catchError(() => of([]))
    );
  }

  getZipsByCity(city: string): Observable<{ code: string; description: string }[]> {
    return this.apiService.get<AddDonorApiResponse<unknown>>(
      API.ADD_DONOR.LOOKUPS.ZIPS(city)
    ).pipe(
      map((res) => this.extractLookupItems(res.data)),
      catchError(() => of([]))
    );
  }

  getSystemParameterValue(code: string): Observable<string> {
    return this.apiService.get<any>(API.SYSTEM_PARAMETER.GET_BY_CODE(code)).pipe(
      map(response => response?.item?.parameterValue || ''),
      catchError(() => of(''))
    );
  }

  searchEmployers(searchName: string, searchType: string = 'S'): Observable<{ code: string; description: string }[]> {
    const request = { SearchName: searchName.toUpperCase(), SearchType: searchType };
    return this.apiService.post<AddDonorApiResponse<unknown>>(
      API.DONOR_EMPLOYER.SEARCH(100, 0), request
    ).pipe(
      map((response: any) => {
        const items = response?.data || [];
        if (!Array.isArray(items)) return [];
        return items.map((emp: Record<string, string>) => ({
          code: emp['employerId'] || emp['EmployerId'] || '',
          description: emp['employerName'] || emp['EmployerName'] || '',
        }));
      }),
      catchError(() => of([]))
    );
  }

  getLookupEmployers(): Observable<{ code: string; description: string }[]> {
    return this.apiService.get<AddDonorApiResponse<unknown>>(
      API.ADD_DONOR.LOOKUPS.EMPLOYERS
    ).pipe(
      map((res) => this.extractLookupItems(res.data)),
      catchError((error) => throwError(() => error))
    );
  }

  getLookupSalutations(): Observable<{ code: string; description: string }[]> {
    return this.apiService.get<AddDonorApiResponse<unknown>>(
      API.ADD_DONOR.LOOKUPS.SALUTATIONS
    ).pipe(
      map((res) => this.extractLookupItems(res.data)),
      catchError((error) => throwError(() => error))
    );
  }

  getLookupEthnicGroups(): Observable<{ code: string; description: string }[]> {
    return this.apiService.get<AddDonorApiResponse<unknown>>(
      API.ADD_DONOR.LOOKUPS.ETHNIC_GROUPS
    ).pipe(
      map((res) => this.extractLookupItems(res.data)),
      catchError((error) => throwError(() => error))
    );
  }

  getLookupLanguages(): Observable<{ code: string; description: string }[]> {
    return this.apiService.get<AddDonorApiResponse<unknown>>(
      API.ADD_DONOR.LOOKUPS.LANGUAGES
    ).pipe(
      map((res) => this.extractLookupItems(res.data)),
      catchError((error) => throwError(() => error))
    );
  }

  validateAreaCode(areaCode: string): Observable<boolean> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService.get<AddDonorApiResponse<unknown>>(
      API.LOOKUPS.VALIDATE('AREAC', areaCode),
      { context }
    ).pipe(
      map(response => response?.success === true),
      catchError(() => of(false))
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractLookupItems(data: any): { code: string; description: string }[] {
    if (!data) return [];
    let items = data;
    if (Array.isArray(items) && items.length > 0 && Array.isArray(items[0])) {
      items = items[0];
    }
    if (!Array.isArray(items)) return [];
    return items.map((item: Record<string, string>) => ({
      code: item['value'] || item['Value'] || item['code'] || '',
      description: item['label'] || item['Label'] || item['description'] || '',
    }));
  }
}
