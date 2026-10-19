export interface DonationEntryDetailsData {
  unitId: string;
  collDate?: string;
}

export interface DonationDetails {
  unitId?: string;
  donationType?: string;
  donationTypeDesc?: string;
  procedureCode?: string;
  procedureCodeDesc?: string;
  screenerId?: string;
  screenerName?: string;
  physicalId?: string;
  physicalName?: string;
  deferralReason?: string;
  deferralReasonDesc?: string;
  deferralThru?: string;
  deferralType?: string;
  reactionCode?: string;
  reactionDesc?: string;
  materialVeriId?: string;
  materialVeriName?: string;
  voidUnitId?: string;
  donorCue?: string;
  rbcLoss?: number;
  plasmaLoss?: number;
  donationDate?: string;
  donationTime?: string;
  armUsed?: string;
  venipunctureId?: string;
  reviewId?: string;
  equipmentType?: string;
  lookupId?: string;
  transactionId?: string;
  creditSponsor?: string;
  status?: string;
  statusDesc?: string;
  programId?: string;
  chapterId?: string;
  createdDate?: string;
  modifiedDate?: string;
}

export interface DonorInfo {
  donorId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  lastNameSuffix?: string;
  bloodType?: string;
  dateOfBirth?: string;
  gender?: string;
  weight?: number;
  streetName?: string;
  suiteApt?: string;
  city?: string;
  state?: string;
  zip?: string;
  intlAddr?: string;
  homeAreaCode?: string;
  homePhone?: string;
  checkHome?: string;
  workAreaCode?: string;
  workPhone?: string;
  extension?: string;
  checkWork?: string;
  mobileAreaCode?: string;
  mobilePhone?: string;
  checkMobile?: string;
  email?: string;
  alternateId?: string;
  alternateIdType?: string;
  employmentSchool?: string;
  ethnicGroup?: string;
  alternateStreet?: string;
  alternateSuite?: string;
  emergencyCity?: string;
  emergencyState?: string;
  emergencyZip?: string;
  employerCity?: string;
  employerState?: string;
  employerZip?: string;
  employerIntlAddr?: string;
}

export interface DonationEntryDetailsWithDonor {
  donationDetails?: DonationDetails;
  donorInfo?: DonorInfo;
}

export interface DonationEntryDetailsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: DonationEntryDetailsWithDonor;
}
