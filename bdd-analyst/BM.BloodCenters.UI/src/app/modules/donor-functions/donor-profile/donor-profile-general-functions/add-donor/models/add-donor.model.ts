import { FindDonorResult, FindDonorSearchCriteria } from '@shared/components/find-donor/find-donor.model';
import { AlternateDemographicsModel } from '@shared/models/alternate-demographics.model';
import { InternationalAddressModel } from '@shared/models/international-address.model';
import { EmployerIntlAddressResult } from '../employer-intl-address-dialog/employer-intl-address-dialog.component';

export interface AddDonorNavigationState {
  mode: 'add' | 'modify';
  searchCriteria?: FindDonorSearchCriteria;
  donorId?: string;
  donor?: FindDonorResult;
  fromInvestigateDuplicate?: boolean;
}

export interface DonorAddressRequest {
  streetName?: string;
  suiteApt?: string;
  city?: string;
  zip?: string;
  state?: string;
  hAreaCode?: string;
  hPhoneNo?: string;
  dAreaCode?: string;
  dPhoneNo?: string;
  extension?: number | null;
  mAreaCode?: string;
  mPhoneNo?: string;
  preferredPhone?: string;
  email?: string;
  employerName?: string;
  eCity?: string;
  eZip?: string;
  eState?: string;
  intlAddrFlag?: string;
  intlAddress1?: string;
  intlAddress2?: string;
  intlAddress3?: string;
  intlAddress4?: string;
  countryName?: string;
  intlPostalCode?: string;
  intlHomePhoneNo?: string;
  intlWorkPhoneNo?: string;
  intlWorkPhoneExt?: string;
  intlMobilePhoneNo?: string;
  intlFaxNo?: string;
  altStreetName?: string;
  altSuiteApt?: string;
  altUspsId?: number;
  altIntlAddress1?: string;
  altIntlAddress2?: string;
  altIntlAddress3?: string;
  altIntlAddress4?: string;
  altCountryName?: string;
  altIntlPostalCode?: string;
  altIntlAddrFlag?: string;
  otherContactNo?: string;
  altIntlPhoneNo?: string;
  altPreferredContactPhone?: string;
  preferredContactAddrFlag?: string;
  empIntlAddrFlag?: string;
  empIntlAddress1?: string;
  empIntlAddress2?: string;
  empIntlAddress3?: string;
  empIntlAddress4?: string;
  empIntlCity?: string;
  empIntlState?: string;
  empCountryName?: string;
  empIntlPostalCode?: string;
  empIntlHomePhoneNo?: string;
  empIntlWorkPhoneNo?: string;
  empIntlWorkPhoneExt?: string;
  empIntlMobilePhoneNo?: string;
  empIntlFaxNo?: string;
  empEmail?: string;
}

export interface PotentialDuplicateEntry {
  donorId: string;
  grade?: number | null;
}

export interface CreateDonorRequest {
  lastName: string;
  firstName?: string;
  middleName?: string;
  salutation?: string;
  alias?: string;
  lastNameSuffix?: string;
  gender: string;
  dateOfBirth?: string;
  ethnicGroup?: string;
  alternateId?: string;
  alternateIdType?: string;
  claimedDonation?: number | null;
  lang?: string;
  scanId?: string;
  employerId?: string;
  prevBloodCenter?: string;
  previosDonorId?: string;
  migratedUnit?: number | null;
  migratedCity?: string;
  migratedState?: string;
  migratedZip?: string;
  migratedAddr2?: string;
  migratedAddr3?: string;
  address: DonorAddressRequest;
  potentialDuplicates?: PotentialDuplicateEntry[];
}

export interface ModifyDonorRequest extends CreateDonorRequest {
  donorId: string;
}

export interface DonorResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: DonorData;
  errorResponse: {
    errorCode: string | null;
    error: string | null;
  };
}

export interface DonorData {
  donorId: string;
  lastName: string;
  firstName: string;
  middleName: string;
  salutation: string;
  alias: string;
  lastNameSuffix: string;
  gender: string;
  dateOfBirth: string;
  ethnicGroup: string;
  ethnicGroupDescription: string;
  alternateId: string;
  alternateIdType: string;
  claimedDonation: number | null;
  lang: string;
  scanId: string;
  ssn: string;
  bloodType: string;
  status: string;
  streetName: string;
  suiteApt: string;
  city: string;
  state: string;
  zip: string;
  uspsId: number | null;
  homeAreaCode: string;
  homePhoneNo: string;
  workAreaCode: string;
  workPhoneNo: string;
  workExtension: string;
  mobileAreaCode: string;
  mobilePhoneNo: string;
  preferredContactFlag: string;
  email: string;
  employerId: string;
  employerName: string;
  employerCity: string;
  employerState: string;
  employerZip: string;
  prevBloodCenter: string;
  previousDonorId: string;
  migratedUnit: number | null;
  migratedCity: string;
  migratedState: string;
  migratedZip: string;
  migratedStreetName: string;
  migratedSuiteApt: string;
  intlAddrFlag: string;
  internationalAddress: InternationalAddressModel | null;
  alternateAddress: AlternateDemographicsModel | null;
  employerIntlAddrFlag: string;
  employerInternationalAddress: EmployerIntlAddressResult | null;
  insertDate: string;
  insertUser: string;
  lastUpdated: string;
}

export interface CityStateResult {
  uspsId: number;
  city: string;
  state: string;
  zip: string;
}

export interface CityStateLookupResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: CityStateResult;
  errorResponse: {
    errorCode: string | null;
    error: string | null;
  };
}

export interface LookupOption {
  code: string;
  description: string;
}
