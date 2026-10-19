export interface SponsorLookupModel {
  name: string;
  sponsorId: string;
}

export interface SponsorSearchDto {
  sponsorName: string;
  chapterId: string;
}

export interface DuplicateSponsorModel {
  sponsorId: string;
  name: string;
  programId: string;
  systemName: string;
  streetName: string;
  address1: string;
  address2: string;
  uspsId: string;
  intlAddress1: string;
  intlAddress2: string;
  intlAddress3: string;
  countryName: string;
  intlAddrFlag: string;
  contactLastName: string;
  contactFirstName: string;
  noteId: string;
}

export interface SponsorDriveModel {
  driveId: string;
  driveDate: string;
  driveType: string;
  driveTypeDisplay: string;
  status: string;
}

export interface MergeSponsorRequest {
  fromSponsorId: string;
  toSponsorId: string;
}

export interface DuplicateSponsorMergeResultModel {
  fromSponsorId: string;
  toSponsorId: string;
  merged: boolean;
}

export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  errorCode?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}
