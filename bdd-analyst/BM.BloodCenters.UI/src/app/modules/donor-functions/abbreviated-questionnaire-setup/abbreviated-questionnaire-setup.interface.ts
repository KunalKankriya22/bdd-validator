export interface AbbreviatedQuestionnaireSetup {
  noOfDonations: string;
  minDonations: string;
  freqBetweenDonations: string;
  freqType: string;
  deferralPeriod: string;
  donationType: string;
  effectiveDate: string | null;
  terminationDate: string | null;
}

export interface UpdateAbbreviatedQuestionnaireSetupPayload {
  noOfDonations: string;
  minDonations: string;
  freqBetweenDonations: string;
  freqType: string;
  deferralPeriod: string;
  donationType: string;
  effectiveDate: string | null;
  terminationDate: string | null;
  originalEffectiveDate: string | null;
}

export interface DonationTypeLookup {
  donationType: string;
  description: string;
}

export interface AbbreviatedQuestionnaireSetupApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: AbbreviatedQuestionnaireSetup[];
  item?: AbbreviatedQuestionnaireSetup;
  total?: number;
}

export interface DonationTypeLookupApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: DonationTypeLookup[];
  total?: number;
}
