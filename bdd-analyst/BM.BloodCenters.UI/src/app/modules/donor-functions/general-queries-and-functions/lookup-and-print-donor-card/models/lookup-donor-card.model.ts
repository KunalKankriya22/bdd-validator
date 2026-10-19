export interface DonorDetailsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: DonorDetailsItem | null;
  errorResponse: { errorCode: string; error: string };
}

export interface DonorDetailsItem {
  donorId: string;
  lastName: string;
  firstName: string;
  middleName: string;
  lastNameSuffix: string;
  dateOfBirth: string;
  gender: string;
  ssn: string;
  alias: string;
  height: string;
  donorWeight: number | null;
  noteId: string;
  employerId: string;
  alternateId: string;
  alternateIdType: string;
  ethnicGroup: string;
  scanId: string;
  bloodType: string;
  donorSince: string;
  lifeCredit: number | null;
  ytdCredit: number | null;
  ageYrs: number | null;
  lastDonDate: string;
  postCount: number | null;
  allowedToDonatFlg: string;
  ethnicGroupDesc: string;
  alternateIdTypeDesc: string;
  lifeDonations: number | null;
  ytdDonations: number | null;
  lifetimeGallon: number | null;
  writesRequiredNext: number | null;
  gallonImageFile: string | null;
  lastDonation: LastDonationItem | null;
  attributes: DonorAttributeItem[];
  address: DonorAddressItem | null;
  employer: DonorEmployerItem | null;
  currentDonation: CurrentDonationItem | null;
  rbcLoss: number | null;
  plasmaLoss: number | null;
}

export interface LastDonationItem {
  lastDonDate: string;
  lastUnitId: string;
  lastDonType: string;
  lastDonTypeDesc: string;
  lastProcCode: string;
  lastProcCodeDesc: string;
  postCount: number | null;
}

export interface DonorAttributeItem {
  code: string;
  attrType: string;
  description: string;
}

export interface DonorAddressItem {
  streetName: string;
  suiteApt: string;
  city: string;
  state: string;
  zip: string;
  homeAreaCode: string;
  homePhoneNo: string;
  dayAreaCode: string;
  dayPhoneNo: string;
  extension: number | null;
  email: string;
  mobileAreaCode: string;
  mobilePhoneNo: string;
  otherContactNo: string;
  preferredContactFlag: string;
  preferredContactAddrFlag: string;
  intlAddrFlag: string;
  intlAddress1: string;
  intlAddress2: string;
  intlAddress3: string;
  intlAddress4: string;
  countryName: string;
  intlPostalCode: string;
  intlHomePhone: string;
  intlWorkPhone: string;
  intlWorkPhoneExt: string;
  intlMobilePhone: string;
  intlFaxNo: string;
  intlCityName: string;
  intlCity: string;
  altStreetName: string;
  altSuiteApt: string;
  altIntlAddress1: string;
  altIntlAddress2: string;
  altIntlAddress3: string;
  altIntlAddress4: string;
  altCountryName: string;
  altIntlPostalCode: string;
  altIntlAddrFlag: string;
  altIntlCityName: string;
  altIntlPhoneNo: string;
}

export interface DonorEmployerItem {
  employerId: string;
  employerName: string;
  city: string;
  state: string;
  zip: string;
  intlAddrFlag: string;
  intlCity: string;
  intlState: string;
  intlPostalCode: string;
  intlCountryName: string;
}

export interface CurrentDonationItem {
  transactionId: string;
  donationType: string;
  donationTypeDesc: string;
  procedureCode: string;
  procedureCodeDesc: string;
  creditSponsor: string;
  creditSponsorName: string;
  idVerified: string;
  unitId: string;
  setId: string;
  creditCount: number | null;
  rbcLoss: number | null;
  plasmaLoss: number | null;
}

export interface DonorPictureResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: { donorId: string; pictureBase64: string } | null;
}

export interface PrinterItem {
  code: string;
  description: string;
}

export interface PrintersResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: PrinterItem[];
  total: number;
}

export interface PrintCardRequest {
  donorId: string;
  printerName: string;
  driveId: string;

  // Donor info
  lastName: string;
  firstName: string;
  middleName: string;
  lastNameSuffix: string;
  gender: string;
  ssn: string;
  dateOfBirth: string;
  alias: string;
  height: string;
  weight: number | null;
  ethnicGroup: string;
  alternateId: string;
  alternateIdType: string;
  scanId: string;
  bloodType: string;

  // Address info
  streetName: string;
  suiteApt: string;
  city: string;
  state: string;
  zip: string;
  homeAreaCode: string;
  homePhoneNo: string;
  dayAreaCode: string;
  dayPhoneNo: string;
  extension: string;
  email: string;

  // Employer info
  employerName: string;

  // Donation info
  creditSponsor: string;
  idVerified: string;
  unitId: string;

  // International address
  intlAddress1: string;
  intlAddress2: string;
  intlAddress3: string;
  intlAddress4: string;
  intlPostalCode: string;
  countryName: string;
  intlHomePhone: string;
  intlWorkPhone: string;
  intlWorkPhoneExt: string;
  intlMobilePhone: string;
  intlFaxNo: string;
  intlAddrFlag: string;

  // Status
  abbrEligStatus: string;
}

export interface PrintCardDialogData {
  printRequest: Omit<PrintCardRequest, 'printerName'>;
  printers: PrinterItem[];
}

export interface YtdLossDialogData {
  rbcLoss: number | null;
  plasmaLoss: number | null;
}

export interface YtdLossResponse {
  success: boolean;
  statusCode: number;
  item: { rbcLoss: number; plasmaLoss: number } | null;
}

export interface CentralNoteItem {
  noteId: string;
  noteSequence: number;
  note: string;
  insertUser: string;
  insertDate: string;
}

export interface CentralNotesResponse {
  success: boolean;
  statusCode: number;
  data: CentralNoteItem[];
  total: number;
}

export interface CommentsDialogData {
  donorId: string;
}

export interface DonationTypeLovItem {
  donationType: string;
  description: string;
}

export interface ProcedureCodeLovItem {
  procedureCode: string;
  description: string;
}

export interface LovListResponse<T> {
  success: boolean;
  statusCode: number;
  data: T[];
  total: number;
}

export interface AlternateIdTypeLovItem {
  code: string;
  description: string;
}

export interface CityStateLovItem {
  zip: string;
  city: string;
  state: string;
  uspsId: number;
}

export interface CityLovItem {
  city: string;
  state: string;
}

export interface SponsorLovItem {
  sponsorId: string;
  name: string;
}

export interface EthnicGroupLovItem {
  code: string;
  description: string;
}

export interface HeightLovItem {
  code: string;
  description: string;
}

export interface CheckDonorEligibilityRequest {
  donorId: string;
  procedureCode: string;
  donationType: string;
  donorWeight: number | null;
}

export interface CheckDonorEligibilityResponse {
  success: boolean;
  statusCode: number;
  item: {
    eligStatus: string;
    eligDescription: string;
    deferDate: string | null;
    deferReason: string | null;
    interType: string | null;
  } | null;
}
