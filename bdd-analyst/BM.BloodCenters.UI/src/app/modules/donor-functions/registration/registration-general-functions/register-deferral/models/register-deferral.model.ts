import { Moment } from 'moment';

export interface DriveOption {
  driveId: string;
  driveDate: string;
  sponsorName: string;
  locationId: string;
}

export interface DriveInfo {
  driveId: string;
  driveDate: string;
  driveName: string;
  sponsorName: string;
  locationId: string;
}

export interface DonorDemographics {
  donorId: string;
  lastName: string;
  lastNameSuffix: string;
  firstName: string;
  middleName: string;
  dateOfBirth: string;
  gender: string;
  donorWeight: number | null;
  bloodType: string;
  aboDescription: string;
  status: string;
  scanId: string;
  alternateId: string;
  alternateIdType: string;
  ethnicGroup: string;
  programId: string;
  chapterId: string;
}

export interface DonorAddress {
  streetName: string;
  suiteApt: string;
  city: string;
  state: string;
  zip: string;
  hAreaCode: string;
  hPhoneNo: string;
  dAreaCode: string;
  dPhoneNo: string;
  extension: string;
  mAreaCode: string;
  mPhoneNo: string;
  email: string;
  preferredContactFlag: string;
  employerName: string;
  employerId: string;
  eCity: string;
  eState: string;
  eZip: string;
  intlAddrFlag: string;
  intlAddress1: string;
  intlAddress2: string;
  intlAddress3: string;
  intlAddress4: string;
  countryName: string;
  intlPostalCode: string;
  intlHomePhoneNo: string;
  intlWorkPhoneNo: string;
  intlWorkPhoneExt: string;
  intlMobilePhoneNo: string;
  intlFaxNo: string;
  preferredContactAddrFlag: string;
  uspsId: number | null;
  eUspsId: number | null;
  addressType: string;
  donorId: string;
  programId: string;
  chapterId: string;
  altStreetName: string;
  altSuiteApt: string;
  altUspsId: number | null;
  altIntlAddress1: string;
  altIntlAddress2: string;
  altIntlAddress3: string;
  altIntlAddress4: string;
  altCountryName: string;
  altIntlPostalCode: string;
  altIntlAddrFlag: string;
  otherContactNo: string;
  altIntlPhoneNo: string;
  altCity: string;
  altState: string;
  altZip: string;
  empIntlAddrFlag: string;
  empIntlCity: string;
  empIntlState: string;
  empIntlPostalCode: string;
  empIntlCountryName: string;
}

export interface DonationDetails {
  lookupId: string;
  donationType: string;
  procedureCode: string;
  physicalId: string;
  deferralReason: string;
  deferredThruDate: string;
  deferralType: string;
  screenerId: string;
  firstReviewerId: string;
  equipType: string;
  deferralId: string;
  transactionId: string;
  creditSponsor: string;
  donorId: string;
  driveId: string;
  programId: string;
  chapterId: string;
  collDate: string;
  setId: string;
  bagType: string;
  creditCount: number;
  startDataEntryTime: string;
  endDataEntryTime: string;
}

export interface InterdictionItem {
  interCode: string;
  interType: string;
  description: string;
  comments: string;
  transactionId: string;
  termDate: string;
  releaseDate: string;
  releaseUser: string;
  programId: string;
  chapterId: string;
  collDate: string;
}

export interface RegisterHoldRequest {
  driveId: string;
  driveDate: string;
  deferralId: string;
  setId: string;
  sessionId: string;
  donation: RegisterHoldDonation;
  lastName: string;
  firstName: string;
  dateOfBirth: string;
  gender: string;
}

export interface RegisterHoldDonation {
  lookupId: string;
  donationType: string;
  procedureCode: string;
  physicalId: string;
  deferralReason: string;
  deferredThruDate: string;
  deferralType: string;
  screenerId: string;
  firstReviewerId: string;
  equipType: string;
  deferralId: string;
  creditSponsor: string;
}

export interface DeferralRegistrationRequest {
  driveId: string;
  driveDate: string;
  deferralId: string;
  setId: string;
  idQueue?: string;
  donor: DonorDemographics;
  address: DonorAddress;
  donation: DonationDetails;
  interdictions: InterdictionItem[];
  loggedInUserName: string;
  chapterId: string;
}

export interface DeferralRegistrationResponse {
  deferralId: string;
  donorId: string;
  transactionId: string;
  driveId: string;
  driveDate: string;
  driveName: string;
  enteredBy: string;
  donor: DonorDemographics;
  address: DonorAddress;
  donation: DonationDetails;
  interdictions: InterdictionItem[];
}

export interface RegistrationResult {
  success: boolean;
  message: string;
  transactionId: string;
  errorCode: string;
  setId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errorCode: string;
  errorMessage: string;

  success: boolean;
  message: string;
  item: DeferralValidationResult;
  validatedDeferralId?: string;
}

export interface DeferralValidationResult {
  deferralId: string;
  isValid: boolean;
}

export interface LookupOption {
  code: string;
  description: string;
  sortSequence?: number;
}

export interface DeferralInterdictionLookupDto {
  interCode: string;
  interDesc: string;
  interType: string;
}

export interface DeferralReasonLookupOption {
  reasonCode: string;
}

export interface DonationTypeLookupOption {
  donationType: string;
  description: string;
  sortSequence?: number;
}

export interface ProcedureCodeLookupOption {
  procedureCode: string;
  description: string;
}

export interface EmployerLookupOption {
  employerId: string;
  employerName: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  uspsId: number | null;
  intlAddrFlag: string | null;
}

export interface EmployeeOption {
  staffNo: string;
  fullName: string;
  lastName: string;
  firstName: string;
}

export interface CityStateResult {
  city: string;
  state: string;
  zip: string;
  uspsId: number;
}

export interface DeferralSearchResult {
  deferralId: string;
  donorId: string;
  enteredBy: string;
  driveDate: string;
  driveId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total: number;
  errorResponse: {
    errorCode: string | null;
    error: string | null;
  };
}

export interface FieldValidationResult {
  success: boolean;
  message: string;
  statusCode: number;
}

export type DeferralFormMode = 'add' | 'update';

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

export interface InterdictionCodeLookupDto {
  interCode: string;
  interDesc: string | null;
  interType: string | null;
}

export interface ManualHoldsDialogData {
  interdictionCodes: InterdictionCodeLookupDto[];
  existingHolds?: InterdictionCodeLookupDto[];
}

export interface ManualHoldsDialogResult {
  action: 'ok' | 'cancel';
  selectedHolds?: InterdictionCodeLookupDto[];
}

