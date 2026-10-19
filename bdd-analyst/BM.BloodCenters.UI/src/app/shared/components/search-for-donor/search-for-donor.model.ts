export interface SearchForDonorCriteria {
  lastName?: string;
  firstName?: string;
  dob?: string;
  gender?: string;
  areaCode?: string;
  phoneNo?: string;
  address?: string;
  donorId?: string;
  unitId?: string;
  deferralId?: string;
}

export interface DonorSearchResult {
  donorId: string;
  lastName: string;
  firstName: string;
  middleName: string | null;
  dateOfBirth: string;
  gender: string;
  bloodType: string | null;
  address: string | null;
  suiteApt: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  alternateId: string | null;
  alternateIdType: string | null;
  homeAreaCode: string | null;
  homePhone: string | null;
  dayAreaCode: string | null;
  dayPhone: string | null;
  mobileAreaCode: string | null;
  mobilePhone: string | null;
  intlHomePhone: string | null;
  intlWorkPhone: string | null;
  intlAddrFlag: string | null;
  preferredContactFlag: string | null;
}

export interface SearchForDonorResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: DonorSearchResult[];
  total: number;
  errorResponse: {
    errorCode: string | null;
    error: string | null;
  };
}

export interface SearchForDonorDialogData {
  prefilledCriteria?: SearchForDonorCriteria;
}

export type SearchForDonorDialogResult =
  | { action: 'select'; donor: DonorSearchResult }
  | { action: 'cancel' }
  | undefined;
