export interface DeferralDetailDto {
  deferralId: string;
  donorId: string | null;
  transactionId: string | null;
  driveId: string | null;
  driveDate: string | null;
  setId: string | null;
  lookupId: string | null;
  donationType: string | null;
  procedureCode: string | null;
  physicalId: string | null;
  deferralReason: string | null;
  deferredThruDate: string | null;
  deferralType: string | null;
  screenerId: string | null;
  firstReviewerId: string | null;
  equipType: string | null;
  bagType: string | null;
  noteId: string | null;
  collDate: string | null;
  chapterId: string | null;
  programId: string | null;
  insertUser: string | null;
  insertedBy: string | null;
  nAuditFlag: string | null;
  // Donor Information
  lastName: string | null;
  firstName: string | null;
  lastNameSuffix: string | null;
  middleName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  height: string | null;
  donorWeight: number | null;
  bloodType: string | null;
  aboDescription: string | null;
  employerId: string | null;
  donorStatus: string | null;
  scanId: string | null;
  alternateId: string | null;
  alternateIdType: string | null;
  ethnicGroup: string | null;
  // Address Information
  intlAddrFlag: string | null;
  streetName: string | null;
  suiteApt: string | null;
  uspsId: number | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  hAreaCode: string | null;
  hPhoneNo: string | null;
  dAreaCode: string | null;
  dPhoneNo: string | null;
  extension: string | null;
  mAreaCode: string | null;
  mPhoneNo: string | null;
  email: string | null;
  preferredContactFlag: string | null;
  preferredContactAddrFlag: string | null;
  intlAddress1: string | null;
  intlAddress2: string | null;
  intlAddress3: string | null;
  intlAddress4: string | null;
  countryName: string | null;
  intlPostalCode: string | null;
  intlHomePhoneNo: string | null;
  intlWorkPhoneNo: string | null;
  intlWorkPhoneExt: string | null;
  intlMobilePhoneNo: string | null;
  intlFaxNo: string | null;
  altStreetName: string | null;
  altSuiteApt: string | null;
  altUspsId: number | null;
  altIntlAddress1: string | null;
  altIntlAddress2: string | null;
  altIntlAddress3: string | null;
  altIntlAddress4: string | null;
  altCountryName: string | null;
  altIntlPostalCode: string | null;
  altIntlAddrFlag: string | null;
  otherContactNo: string | null;
  altIntlPhoneNo: string | null;
  altCity: string | null;
  altState: string | null;
  altZip: string | null;
  employerName: string | null;
  empIntlAddrFlag: string | null;
  empZip: string | null;
  empCity: string | null;
  empState: string | null;
  empUspsId: number | null;
  empIntlCity: string | null;
  empIntlState: string | null;
  empIntlPostalCode: string | null;
  empIntlCountryName: string | null;
}

export interface UpdateDeferralRequestDto {
  driveId?: string | null;
  lookupId?: string | null;
  donationType?: string | null;
  procedureCode?: string | null;
  physicalId?: string | null;
  deferralReason?: string | null;
  deferredThruDate?: string | null;
  deferralType?: string | null;
  screenerId?: string | null;
  firstReviewerId?: string | null;
  equipType?: string | null;
  firstName?: string | null;
  lastNameSuffix?: string | null;
  middleName?: string | null;
  dateOfBirth?: string | null;
  donorWeight?: number | null;
  ethnicGroup?: string | null;
  alternateId?: string | null;
  alternateIdType?: string | null;
  scanId?: string | null;
  employerId?: string | null;
  city?: string | null;
  zip?: string | null;
  streetName?: string | null;
  suiteApt?: string | null;
  uspsId?: number | null;
  hAreaCode?: string | null;
  hPhoneNo?: string | null;
  dAreaCode?: string | null;
  dPhoneNo?: string | null;
  extension?: string | null;
  mAreaCode?: string | null;
  mPhoneNo?: string | null;
  email?: string | null;
  preferredContactFlag?: string | null;
  preferredContactAddrFlag?: string | null;
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
  altStreetName?: string | null;
  altSuiteApt?: string | null;
  altUspsId?: number | null;
  altIntlAddress1?: string | null;
  altIntlAddress2?: string | null;
  altIntlAddress3?: string | null;
  altIntlAddress4?: string | null;
  altCountryName?: string | null;
  altIntlPostalCode?: string | null;
  altIntlAddrFlag?: string | null;
  otherContactNo?: string | null;
  altIntlPhoneNo?: string | null;
  employerInternationalAddress?: {
    streetName?: string | null;
    addr1?: string | null;
    addr2?: string | null;
    addr3?: string | null;
    addr4?: string | null;
    countryName?: string | null;
    postalCode?: string | null;
    homePhone?: string | null;
    workPhone?: string | null;
    workPhoneExt?: string | null;
    mobilePhone?: string | null;
    faxNo?: string | null;
    email?: string | null;
    intlAddrFlag?: string;
    modifiedFlag?: string;
  };
  interdictions?: CreateDeferralInterdictionDto[];
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T[];
  total?: number;
  errorResponse?: {
    errorCode: string | null;
    error: string | null;
  };
}

export interface DeferralValidationResponse {
  isValid: boolean;
}

export interface CreateDeferralInterdictionDto {
  transactionId: string;
  interCode: string;
  comments?: string;
}

export interface DeferralInterdictionDto {
  interCode: string;
  interType: string;
  description: string;
  comments: string;
  transactionId: string;
  termDate: string;
  releaseDate: string;
  releaseUser: string;
}

export interface FieldValidationResult {
  success: boolean;
  message: string;
  statusCode: number;
}

export interface DriveLookupDto {
  driveId: string;
  driveDate: string;
  sponsorName?: string;
  locationId?: string;
}

export interface EmployeeLookupDto {
  staffNo: string;
  staffName: string;
  firstName?: string;
  lastName?: string;
}

export interface DonationTypeLookupDto {
  code: string;
  description: string;
  sortSequence?: number;
}

export interface ProcedureCodeLookupDto {
  code: string;
  description: string;
  donationType?: string;
  sortSequence?: number;
}

export interface EquipmentTypeLookupDto {
  code: string;
  description: string;
}

export interface DeferralReasonLookupDto {
  code: string;
  description?: string;
}

export interface DeferralTypeLookupDto {
  code: string;
  description: string;
}

export interface EthnicGroupLookupDto {
  code: string;
  description: string;
}

export interface EmployerLookupDto {
  employerId?: string;
  employerName: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  uspsId?: number;
  intlAddrFlag?: string;
}

export interface AlternateTypeLookupDto {
  code: string;
  description: string;
}

export interface CityLookupDto {
  city: string;
  state: string;
  zip: string;
  uspsId: number;
}

export interface ManualHoldLookupDto {
  interCode: string;
  interDesc: string;
  interType: string;
  timeZone: string | null;
}

export interface CountryLookupDto {
  code: string;
  description: string;
}

export type ContentSection =
  | 'deferral-donor-info'
  | 'personal-info'
  | 'address-info'
  | 'contact-info'
  | 'employer-info'
  | 'donation-info';

export interface ContentNavItem {
  id: ContentSection;
  label: string;
}

export type UpdateDeferralMode = 'search' | 'update';

export const DEFERRAL_TYPES = {
  INDEFINITE: 'IND',
  NOT_APPLICABLE: 'NA',
  UNKNOWN: '99',
} as const;

export const SPECIAL_STAFF_IDS = {
  UNKNOWN_99: '99',
  UNKNOWN_88: '88',
} as const;

export type PhoneType = 'home' | 'work' | 'mobile';
