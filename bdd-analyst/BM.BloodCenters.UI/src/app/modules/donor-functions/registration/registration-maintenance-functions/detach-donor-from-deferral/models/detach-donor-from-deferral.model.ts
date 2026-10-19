export interface ReturnResult<T> {
  success: boolean;
  message: string;
  error: string;
  errorCode?: string;
  statusCode: number;
  data: T[];
  item: T;
  total: number;
}

export interface DeferralWithDonorDto {
  deferralId: string;
  transactionId: string;
  donorId: string;
  collDate: string;
  enteredBy: string;
  unitId: string;
  programId: string;
  chapterId: string;
  driveId: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  aboDescription?: string;
  streetName?: string;
  suiteApt?: string;
  city?: string;
  state?: string;
  zip?: string;
  homeAreaCode?: string;
  homePhone?: string;
  businessAreaCode?: string;
  businessPhone?: string;
  ethnicGroup?: string;
  intlAddrFlag?: string;
  intlAddress?: string;
  employerName?: string;
  employerCity?: string;
  employerState?: string;
  employerZip?: string;
  employerIntlAddress?: string;
  donationType?: string;
  procedureCode?: string;
  deferralReason?: string;
  deferredThruDate?: string;
}

export interface DetachDeferralRequest {
  deferralId: string;
  confirmationDeferralId: string;
}
