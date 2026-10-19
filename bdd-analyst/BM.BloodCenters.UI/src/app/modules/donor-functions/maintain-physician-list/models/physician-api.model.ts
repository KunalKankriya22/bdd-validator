export interface PhysicianDto {
  phyId: string;
  chapterId: string;
  lastName: string;
  firstName: string;
  mi?: string | null;
  streetName?: string | null;
  uspsId?: number | null;
  specialtyCode: string;
  specialtyDesc?: string | null;
  areaCode?: string | null;
  phoneNo?: string | null;
  zipCode?: string | null;
  city?: string | null;
  state?: string | null;
  effDate: string; // ISO 8601 format
  termDate?: string | null; // ISO 8601 format
  comments?: string | null;
  intlAddrFlag?: string | null;
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
  programId?: string | null;
  insertUser?: string | null;
  insertDate?: string | null; // ISO 8601 format
}

export interface PhysicianSearchRequest {
  searchKeyword?: string | null;
  chapterId?: string | null;
  activeOnly?: boolean;
  city?: string | null;
  state?: string | null;
  effDateFrom?: string | null; // ISO 8601 format
  effDateTo?: string | null; // ISO 8601 format
  termDateFrom?: string | null; // ISO 8601 format
  termDateTo?: string | null; // ISO 8601 format
  sortColumn?: string | null;
  sortOrder?: string | null;
}

export interface PhysicianSearchResponse {
  success: boolean;
  message: string;
  data: PhysicianDto[];
  totalCount: number;
  statusCode: number;
}

export interface CreatePhysicianRequest {
  lastName: string;
  firstName: string;
  mi?: string | null;
  specialtyCode: string;
  streetName?: string | null;
  uspsId?: number | null;
  areaCode?: string | null;
  phoneNo?: string | null;
  effDate: string; // ISO 8601 format
  termDate?: string | null; // ISO 8601 format
  comments?: string | null;
  intlAddrFlag?: string | null;
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
  lastName: string;
  firstName: string;
  mi?: string | null;
  specialtyCode: string;
  streetName?: string | null;
  uspsId?: number | null;
  areaCode?: string | null;
  phoneNo?: string | null;
  effDate: string; // ISO 8601 format
  termDate?: string | null; // ISO 8601 format
  comments?: string | null;
  intlAddrFlag?: string | null;
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

// Backend returns "item" not "data" for create/update responses
export interface PhysicianCreateUpdateResponse {
  success: boolean;
  message: string;
  item: PhysicianDto;
  statusCode: number;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

export interface PhysicianDeleteResponse {
  success: boolean;
  message: string;
  statusCode: number;
}
