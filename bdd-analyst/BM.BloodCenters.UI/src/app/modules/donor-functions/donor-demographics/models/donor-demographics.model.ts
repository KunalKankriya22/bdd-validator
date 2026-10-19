/**
 * Donor Demographics Models
 * Based on API Documentation for DPWDEMGR (MLT-10761)
 */

/**
 * Phone number structure
 */
export interface PhoneDto {
  areaCode: string | null;
  phoneNo: string | null;
}

/**
 * Work phone with extension
 */
export interface WorkPhoneDto extends PhoneDto {
  extension: number | null;
}

/**
 * Phone numbers for donor
 */
export interface PhonesDto {
  home: PhoneDto | null;
  work: WorkPhoneDto | null;
  mobile: PhoneDto | null;
  preferredContact: string | null; // H/W/M
}

/**
 * Address information
 */
export interface AddressDto {
  streetName: string | null;
  suiteApt: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  county: string | null;
  uspsId: number | null;
  intlAddress1: string | null;
  intlAddress2: string | null;
  intlAddress3: string | null;
  intlAddress4: string | null;
  countryName: string | null;
  intlPostalCode: string | null;
  intlWorkPhoneNo: string | null;
  intlWorkPhoneExt: string | null;
  intlHomePhoneNo: string | null;
  intlMobilePhoneNo: string | null;
  intlFaxNo: string | null;
}

/**
 * Personal information
 */
export interface PersonalInfoDto {
  language: string | null;
  alias: string | null;
  lastNameSuffix: string | null;
  ethnicGroup: string | null;
  salutation: string | null;
  height: string | null;
  donorWeight: number | null;
  claimedDonations: number | null;
}

/**
 * Complete donor demographics response
 */
export interface DonorDemographicsDto {
  donorId: string;
  chapterId: string | null;
  header: DonorHeaderDto;
  address: AddressDto;
  phones: PhonesDto;
  email: string | null;
  personalInfo: PersonalInfoDto;
  employer: EmployerDto;
  intlAddrFlag: string;
}

/**
 * Update address DTO (no read-only fields)
 */
export interface UpdateAddressDto {
  streetName: string | null;
  suiteApt: string | null;
  city: string | null;
  zip: string | null;
  state: string | null;
  county: string | null;
  uspsId: number | null;
  intlAddress1: string | null;
  intlAddress2: string | null;
  intlAddress3: string | null;
  intlAddress4: string | null;
  countryName: string | null;
  intlPostalCode: string | null;
  intlAddrFlag: string | null;
  intlWorkPhoneNo: string | null;
  intlWorkPhoneExt: string | null;
  intlHomePhoneNo: string | null;
  intlMobilePhoneNo: string | null;
  intlFaxNo: string | null;
}

export interface UpdateEmployerDto {
  employerId: string | null;
  employerName: string | null;
  city: string | null;
  zip: string | null;
  state: string | null;
  uspsId: number | null;
}

/**
 * Update donor demographics request
 */
export interface UpdateDonorDemographicsDto {
  address: UpdateAddressDto;
  phones: PhonesDto;
  email: string | null;
  personalInfo: PersonalInfoDto;
  employer?: UpdateEmployerDto;
}

/**
 * Master code option for dropdowns
 */
export interface MasterCodeOption {
  code: string;
  description: string;
  active?: boolean;
}

/**
 * Donor header information (read-only)
 */
export interface DonorHeaderDto {
  name: string;
  dateOfBirth: string | null;
  sex: string | null;
  abo: string | null;
}

/**
 * Employer information (read-only)
 */
export interface EmployerDto {
  employerId: string | null;
  employerName: string | null;
  city: string | null;
  zip: string | null;
  state: string | null;
}

/**
 * API Response wrapper matching backend ReturnResult<T>
 */
export interface ReturnResult<T> {
  success: boolean;
  message: string;
  error?: string;
  errorCode?: string;
  statusCode: number;
  data?: T[];
  item?: T;
  total?: number;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * Dialog data for DonorDemographicsDialogComponent
 */
export interface DonorDemographicsDialogData {
  donorId: string;
  readOnly?: boolean;
}

/**
 * Height options for dropdown
 */
export const HEIGHT_OPTIONS: string[] = [
  "4' 0\"", "4' 1\"", "4' 2\"", "4' 3\"", "4' 4\"", "4' 5\"", "4' 6\"", "4' 7\"", "4' 8\"", "4' 9\"", "4' 10\"", "4' 11\"",
  "5' 0\"", "5' 1\"", "5' 2\"", "5' 3\"", "5' 4\"", "5' 5\"", "5' 6\"", "5' 7\"", "5' 8\"", "5' 9\"", "5' 10\"", "5' 11\"",
  "6' 0\"", "6' 1\"", "6' 2\"", "6' 3\"", "6' 4\"", "6' 5\"", "6' 6\"", "6' 7\"", "6' 8\"", "6' 9\"", "6' 10\"", "6' 11\"",
  "7' 0\""
];

/**
 * Preferred contact options
 */
export const PREFERRED_CONTACT_OPTIONS = [
  { value: 'H', label: 'Home' },
  { value: 'W', label: 'Work' },
  { value: 'M', label: 'Mobile' }
];

export interface CityStateResult {
  city: string;
  state: string;
  zip: string;
  uspsId: number | null;
  county?: string;
}

export interface EmployerSearchRequest {
  searchName: string;
  searchType: 'M' | 'L' | 'S';
  sortColumn?: string;
  sortDirection?: 'A' | 'D';
}

export interface EmployerResult {
  employerId: string;
  employerName: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  uspsId: number | null;
  effDate: string | null;
  termDate: string | null;
  chapterId: string | null;
  intlAddrFlag: string | null;
}
