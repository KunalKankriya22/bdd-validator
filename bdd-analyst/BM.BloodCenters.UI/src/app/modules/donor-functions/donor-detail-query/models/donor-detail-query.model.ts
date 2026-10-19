/**
 * Models for Donor Detail Query (SDONQ) feature
 * MLT-10898: Donor Detail Query Implementation
 */

/**
 * Complete donor detail information including demographics, statistics, and last donation
 */
export interface DonorDetail {
  donorId: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  dateOfBirth: string;
  sex: string;
  aboRh: string;
  alternateType?: string;
  alternateId?: string;
  phoneHome?: string;
  phoneMobile?: string;
  phoneWork?: string;
  extension?: string;
  preferredContactFlag?: 'H' | 'W' | 'M';
  address: DonorAddress;
  alternateAddress?: AlternateAddress;
  statistics: DonorStatistics;
  lastDonation?: LastDonationInfo;
  hasDocuments?: boolean;
  documentCount?: number;
}

/**
 * Donor address information
 */
export interface DonorAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
}

/**
 * Alternate address information
 */
export interface AlternateAddress {
  streetName?: string;
  suiteApt?: string;
  city?: string;
  state?: string;
  zip?: string;
  intlAddress1?: string;
  intlAddress2?: string;
  intlAddress3?: string;
  intlAddress4?: string;
  countryName?: string;
  intlPostalCode?: string;
  isInternational: boolean;
  preferredContactAddrFlag?: 'P' | 'A';
}

/**
 * Donor donation statistics and tenure information
 */
export interface DonorStatistics {
  lifeDonations: number;
  lifeLtr: number;
  ytdDonations: number;
  ytdLtr: number;
  lifetimeGallon: number;
  unitsRequiredNext: number;
  donorSince: string;
  yearsAsDonor: number;
}

/**
 * Last donation information
 */
export interface LastDonationInfo {
  unitId: string;
  status?: string;
  date: string;
  donation: string;
  procedure: string;
}

/**
 * Donor eligibility record for a specific procedure
 */
export interface DonorEligibility {
  proc: string;
  status: string;
  eligibilityDate: string;
  reason: string;
}

/**
 * Donor attribute record
 */
export interface DonorAttribute {
  code: string;
  type: string;
  description: string;
}

/**
 * Donor search criteria for Find Donor dialog
 */
export interface DonorSearchCriteria {
  lastName?: string;
  firstName?: string;
  dateOfBirth?: string;
  sex?: string;
  phoneNumber?: string;
  address?: string;
  donorId?: string;
  unitId?: string;
  deferralId?: string;
}

/**
 * Donor search result
 */
export interface DonorSearchResult {
  donorId: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  dateOfBirth: string;
  alternateId?: string;
  sex: string;
  aboRh: string;
  contactInfo: DonorContactInfo;
}

/**
 * Contact information displayed in search results
 */
export interface DonorContactInfo {
  address: string;
  phoneNumber: string;
}

/**
 * Quick link configuration for navigation panel
 */
export interface QuickLink {
  label: string;
  icon: string;
  route: string;
  enabled: boolean;
}

/**
 * API response wrapper for donor detail data
 */
export interface DonorDetailResponse {
  donor: DonorDetail;
  eligibility: DonorEligibility[];
  attributes: DonorAttribute[];
}

/**
 * API response wrapper for donor search
 */
export interface DonorSearchResponse {
  results: DonorSearchResult[];
  totalCount: number;
}

export interface CentralNote {
  noteId: number;
  noteSequence: number;
  note?: string;
  createdBy: string;
  insertDate: string;
}

export interface CellLoss {
  cellType: string;
  daysBetween: number;
  cumulativeLoss: number;
}

export interface InterdictionHold {
  interType: string;
  interCode: string;
  description: string;
  originatedFrom?: string;
  effDate: string;
  termDate?: string;
  donorId: string;
  transactionId?: string;
  unitId?: string;
  reasonCode?: string;
}

export interface MergedDonor {
  secondaryDonorId: string;
  gender: string;
  dateOfBirth: string;
  lastName: string;
  firstName?: string;
  middleName?: string;
}

export interface MergedDonorInterdiction {
  donorId: string;
  interType: string;
  interCode: string;
  unitId: string;
  effDate: string;
  termDate: string;
}

export interface MergeHoldUnit {
  unitId: string;
  collDate: string;
  donorId: string;
}

export interface YtdLossDialogData {
  rbcLoss: number | null;
  plasmaLoss: number | null;
}

export interface PotentialDuplicate {
  setId: string;
  donorId: string;
  mergeFlag: string;
  resolveUser?: string;
  resolveDate?: string;
  demographicsUser?: string;
  demographicsCheck?: string;
  demographicsDate?: string;
  interdictionsUser?: string;
  interdictionsCheck?: string;
  interdictionsDate?: string;
  donationsUser?: string;
  donationsCheck?: string;
  donationsDate?: string;
  keydataUser?: string;
  keydataCheck?: string;
  keydataDate?: string;
}

export interface DonorLetter {
  letterCode?: string;
  letterId?: string;
  documentType?: string;
  generateDate?: string;
  authorizedBy?: string;
  letterTitle?: string;
}
