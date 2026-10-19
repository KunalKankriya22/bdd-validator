export interface ReturnResult<T> {
  success: boolean;
  message: string;
  data?: T[];
  item?: T;
  statusCode?: number;
  total?: number;
}

export interface DonorBasicInfoResponse {
  donorId: string;
  lastName: string;
  firstName: string;
  dateOfBirth: string | null;
  gender: string | null;
  bloodType: string | null;
  chapterId: string;
  donorWeight: number | null;
}

export interface DonorEligibilityInput {
  donorId: string;
  donorName: string;
  dateOfBirth: string;
  sex: string;
  bloodType: string;
  donorWeight?: number | null;
  donationType?: string | null;
  procedureCode?: string | null;
  lockDonationType?: boolean;
}

export interface DonorEligibilityResult {
  donationType: string;
  procedureCode: string;
  overrideFlag: boolean;
  eligibilityStatus: 'Y' | 'N';
}

export interface DonationType {
  code: string;
  description: string;
}

export interface DonationTypeResponse {
  donationType: string;
  description: string;
  sortSequence: number;
  chapterId: string;
}

export interface ProcedureCodeResponse {
  procedureCode: string;
  description: string;
  sortSequence: number;
}

export interface ProcedureCodeEligibility {
  procedureCode: string;
  description: string;
  eligStatus: 'Yes' | 'No';
  eligibilityDate: string | null;
  reason: string | null;
  interType: string | null;
}

export interface CheckEligibilityRequest {
  donorId: string;
  procedureCode: string;
  donationType: string;
  collectionDate: string;
  donorWeight: number;
}

export interface EligibilityCheckResult {
  eligStatus: string;
  deferralDate: string | null;
  interType: string | null;
  deferralReason: string | null;
}

export interface DonorInterdiction {
  donorId: string;
  interCode: string;
  interType: string;
  interDesc: string | null;
  effDate: string;
  termDate: string | null;
  releaseDate: string | null;
  chapterId: string;
}
