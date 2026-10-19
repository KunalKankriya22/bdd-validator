/**
 * TypeScript models for Deferral Entry Details API
 * Based on API Documentation: drwdefrl-api-documentation.md
 * Module: Donor
 * Base URL: /api/deferral-entry-details
 */

/**
 * Address information DTO
 */
export interface AddressDto {
  streetName?: string | null;
  suiteApt?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  intlAddr?: string | null;
}

/**
 * Phone number information DTO
 */
export interface PhoneDto {
  areaCode?: string | null;
  phoneNo?: string | null;
  extension?: string | null;
  formattedPhone?: string | null;
}

/**
 * Employer information DTO
 */
export interface EmployerDto {
  employerId?: string | null;
  employerName?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  intlAddr?: string | null;
}

/**
 * Comprehensive donor information DTO
 */
export interface DonorInformationDto {
  bloodType?: string | null;
  lastName?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastNameSuffix?: string | null;
  alternateIdType?: string | null;
  alternateId?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  donorWeight?: number | null;
  email?: string | null;
  ethnicGroup?: string | null;
  status?: string | null;
  preferredContactFlag?: string | null;
  address?: AddressDto | null;
  homePhone?: PhoneDto | null;
  dayPhone?: PhoneDto | null;
  mobilePhone?: PhoneDto | null;
  employer?: EmployerDto | null;
}

/**
 * Main deferral entry details DTO (response from API)
 */
export interface DeferralEntryDetailsDto {
  donorId: string;
  driveDate: string;
  deferralId?: string | null;
  creditSponsor?: string | null;
  lookupId?: string | null;
  screenerId?: string | null;
  physicalId?: string | null;
  donationType?: string | null;
  deferralType?: string | null;
  procedureCode?: string | null;
  deferralReason?: string | null;
  deferredThruDate?: string | null;
  firstReviewerId?: string | null;
  transactionId?: string | null;
  bagType?: string | null;
  setId?: string | null;
  creditCount?: number | null;
  equipType?: string | null;
  donorInfo?: DonorInformationDto | null;
}

/**
 * Query/filter parameters for deferral entry details
 * Used in POST /deferral-entry-details/{take}/{skip}
 */
export interface DeferralEntryDetailsQueryDto {
  donorId?: string | null;
  deferralReason?: string | null;
  donationType?: string | null;
  procedureCode?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: 'ASC' | 'DESC' | null;
}

/**
 * API response wrapper for single deferral entry details
 */
export interface DeferralEntryDetailsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: DeferralEntryDetailsDto;
}

/**
 * API response wrapper for list of deferral entry details
 */
export interface DeferralEntryDetailsListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: DeferralEntryDetailsDto[];
  total: number;
}

/**
 * Dialog data for opening Deferral Entry Details Dialog
 * Contains the composite key: donorId + driveDate
 */
export interface DeferralEntryDetailsDialogData {
  donorId: string;
  driveDate: string;
}
