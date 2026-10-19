/**
 * Consignee Models
 * Based on API documentation: C:\consigneedetails\consignee-api-documentation.md
 * JIRA: MLT-14183
 */

/** Response DTO for consignee data */
export interface ConsigneeDto {
  consigneeId: string;
  customerId: string;
  chapterId: string;
  name: string;
  shortName: string;
  intFlag: string | null;
  address1: string;
  address2: string | null;
  address3: string | null;
  city: string;
  state: string | null;
  zip: string;
  country: string;
  phoneNo: string | null;
  phoneExt: string | null;
  faxNo: string | null;
  telexNo: string | null;
  intPhone: string | null;
  zone: string | null;
  zoneDescription: string | null;
  adLocation: string | null;
  outOfState: string | null;
  arShipToNo: string | null;
  effDate: string;
  termDate: string | null;
  lastModifiedDate: string | null;
  programId: string | null;
}

/** Request DTO for creating a consignee */
export interface CreateConsigneeDto {
  consigneeId?: string | null;
  customerId: string;
  name: string;
  shortName: string;
  intFlag?: string | null;
  address1: string;
  address2?: string | null;
  address3?: string | null;
  city: string;
  state?: string | null;
  zip: string;
  country: string;
  phoneNo?: string | null;
  phoneExt?: string | null;
  faxNo?: string | null;
  telexNo?: string | null;
  intPhone?: string | null;
  zone?: string | null;
  adLocation?: string | null;
  outOfState?: string | null;
  arShipToNo?: string | null;
  effDate: string;
  termDate?: string | null;
}

/** Request DTO for updating a consignee */
export interface UpdateConsigneeDto {
  name: string;
  shortName: string;
  intFlag?: string | null;
  address1: string;
  address2?: string | null;
  address3?: string | null;
  city: string;
  state?: string | null;
  zip: string;
  country: string;
  phoneNo?: string | null;
  phoneExt?: string | null;
  faxNo?: string | null;
  telexNo?: string | null;
  intPhone?: string | null;
  zone?: string | null;
  adLocation?: string | null;
  outOfState?: string | null;
  arShipToNo?: string | null;
  effDate: string;
  termDate?: string | null;
}

/** Query DTO for filtering consignees */
export interface ConsigneeQueryDto {
  consigneeId?: string | null;
  name?: string | null;
  zone?: string | null;
  state?: string | null;
  includeTerminated?: string;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

/** Zone lookup for dropdown */
export interface ZoneLookup {
  code: string;
  description: string;
}

/** State lookup for dropdown */
export interface StateLookup {
  code: string;
  description: string;
}

/** Postal/ZIP lookup for dropdown */
export interface PostalZipLookup {
  code: string;
  description: string;
}

/** Country lookup for dropdown */
export interface CountryLookup {
  code: string;
  description: string;
}

/** Out of State options */
export interface OutOfStateLookup {
  code: string;
  description: string;
}

/** Customer data for "Same as customer" feature */
export interface CustomerDataForConsignee {
  customerId: string;
  name: string;
  shortName: string;
  intFlag: string | null;
  address1: string;
  address2: string | null;
  address3: string | null;
  city: string;
  state: string | null;
  zip: string;
  country: string;
  phoneNo: string | null;
  faxNo: string | null;
  intPhone: string | null;
  telexNo: string | null;
}

/** Field max lengths from API documentation */
export const CONSIGNEE_FIELD_LENGTHS = {
  consigneeId: 10,
  customerId: 10,
  name: 50,
  shortName: 15,
  address1: 50,
  address2: 50,
  address3: 50,
  city: 75,
  state: 2,
  zip: 15,
  country: 50,
  phoneNo: 20,
  phoneExt: 5,
  faxNo: 20,
  telexNo: 20,
  intPhone: 20,
  zone: 2,
  adLocation: 8,
  arShipToNo: 8
} as const;
