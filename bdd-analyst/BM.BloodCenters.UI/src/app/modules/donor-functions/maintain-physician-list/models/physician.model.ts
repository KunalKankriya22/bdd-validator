export interface PhysicianModel {
  physicianId: string;
  lastName: string;
  firstName?: string | null;
  middleName?: string | null;
  physicianName: string;
  specialtyCode: string;
  specialtyDescription?: string | null;
  phoneNumber?: string | null;
  streetAddress?: string | null;
  hasInternationalAddress?: boolean;
  internationalAddressId?: number | null;
  intlAddress1?: string | null;
  intlAddress2?: string | null;
  intlAddress3?: string | null;
  intlAddress4?: string | null;
  countryName?: string | null;
  intlPostalCode?: string | null;
  intlHomePhoneNo?: string | null;
  intlWorkPhoneNo?: string | null;
  intlWorkPhoneExt?: string | null;
  intlMobilePhoneNo?: string | null;
  intlFaxNo?: string | null;
  zipCode?: string | null;
  uspsId?: number | null;
  city?: string | null;
  state?: string | null;
  effectiveDate: Date | string;
  terminationDate?: Date | string | null;
  comments?: string | null;
  chapterId?: string;
  createdBy?: string;
  createdDate?: Date | string;
  lastModifiedBy?: string;
  lastModifiedDate?: Date | string;
}

export interface PhysicianSpecialtyModel {
  code: string;
  description: string;
  codeType?: string;
}

export interface ZipCodeLookupModel {
  zipCode: string;
  city: string;
  state: string;
  uspsId: number;
  county?: string;
}

export interface CreatePhysicianRequest {
  lastName: string;
  firstName?: string | null;
  middleName?: string | null;
  specialtyCode?: string | null;
  phoneNumber?: string | null;
  streetAddress?: string | null;
  zipCode?: string | null;
  uspsId?: number | null;
  effectiveDate: string; // ISO format YYYY-MM-DD
  terminationDate?: string | null; // ISO format YYYY-MM-DD
  comments?: string | null;
  chapterId: string;
  loggedInUserName: string;
  internationalAddressId?: number | null;
  intlAddrFlag: 'Y' | 'N' | null;
  // International address fields
  intlAddress1?: string | null;
  intlAddress2?: string | null;
  intlAddress3?: string | null;
  intlAddress4?: string | null;
  countryName?: string | null;
  intlPostalCode?: string | null;
  intlHomePhoneNo?: string | null;
  intlWorkPhoneNo?: string | null;
  intlWorkPhoneExt?: string | null;
  intlMobilePhoneNo?: string | null;
  intlFaxNo?: string | null;
}

export interface UpdatePhysicianRequest {
  physicianId: string;
  lastName: string;
  firstName?: string | null;
  middleName?: string | null;
  specialtyCode?: string | null;
  phoneNumber?: string | null;
  streetAddress?: string | null;
  zipCode?: string | null;
  uspsId?: number | null;
  effectiveDate: string; // ISO format YYYY-MM-DD
  terminationDate?: string | null; // ISO format YYYY-MM-DD
  comments?: string | null;
  chapterId: string;
  loggedInUserName: string;
  internationalAddressId?: number | null;
  intlAddrFlag: 'Y' | 'N' | null;
  // International address fields
  intlAddress1?: string | null;
  intlAddress2?: string | null;
  intlAddress3?: string | null;
  intlAddress4?: string | null;
  countryName?: string | null;
  intlPostalCode?: string | null;
  intlHomePhoneNo?: string | null;
  intlWorkPhoneNo?: string | null;
  intlWorkPhoneExt?: string | null;
  intlMobilePhoneNo?: string | null;
  intlFaxNo?: string | null;
}

export interface PhysicianQueryParams {
  searchText?: string;
  effectiveDateFrom?: string;
  effectiveDateTo?: string;
  terminationDateFrom?: string;
  terminationDateTo?: string;
  chapterId?: string;
  pageSize?: number;
  pageIndex?: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  total: number;
}
