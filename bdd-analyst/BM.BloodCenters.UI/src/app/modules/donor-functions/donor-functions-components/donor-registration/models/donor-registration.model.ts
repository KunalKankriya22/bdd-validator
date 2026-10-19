export interface RegisterDonationDto {
  transactionId: string | null;
  donorId: string | null;
  unitId: string | null;
  voidUnitId: string | null;
  donationType: string | null;
  donationTypeDescription: string | null;
  procedureCode: string | null;
  procedureCodeDescription: string | null;
  equipType: string | null;
  sVenipuncture: string | null;
  lookupId: string | null;
  screenerId: string | null;
  physicalId: string | null;
  bleedStartPhlebL1: string | null;
  bleedStartPhlebL2: string | null;
  bleedStartPhlebR1: string | null;
  bleedStartPhlebR2: string | null;
  bleedEndPhlebL: string | null;
  bleedEndPhlebR: string | null;
  otherSPhleb: string | null;
  otherEPhleb: string | null;
  materialId: string | null;
  firstReviewerId: string | null;
  creditSponsor: string | null;
  sReactions: string | null;
  collDate: string | null;
  driveId: string | null;
  gender: string | null;
  donorWeight: number | null;
  chapterId: string | null;
  warehouseId: string | null;
  programId: string | null;
  auditKey: number | null;
}

export interface CreateRegisterDonationRequest {
  // === Required fields ===
  donorId?: string;
  unitId: string;
  donationType: string;
  driveId: string;

  // === Donation details ===
  procedureCode?: string;
  equipType?: string;
  lookupId?: string;
  screenerId?: string;
  physicalId?: string;
  firstReviewerId?: string;
  creditSponsor?: string;
  materialId?: string;
  armUsed?: string;
  deferralReason?: string;
  deferralType?: string;
  deferredThruDate?: string;
  sVenipuncture?: string;
  collDate?: string;
  sReaction?: string;

  // === Bleed times ===
  bleedStartTimeL1?: string;
  bleedStartPhlebL1?: string;
  bleedEndTimeL?: string;
  bleedEndPhlebL?: string;
  bleedStartTimeL2?: string;
  bleedStartPhlebL2?: string;
  bleedEndTimeL2?: string;
  bleedEndPhlebL2?: string;
  bleedStartTimeR1?: string;
  bleedStartPhlebR1?: string;
  bleedEndTimeR?: string;
  bleedEndPhlebR?: string;
  bleedStartTimeR2?: string;
  bleedStartPhlebR2?: string;
  bleedEndTimeR2?: string;
  bleedEndPhlebR2?: string;
  actualRbcLoss?: number;
  actualPlasmaLoss?: number;

  // === Donor demographics ===
  gender?: string;
  donorWeight?: number;
  employerId?: string;
  lastName?: string;
  firstName?: string;
  dateOfBirth?: string;
  middleName?: string;
  lastNameSuffix?: string;
  height?: string;
  bloodType?: string;
  ethnicGroup?: string;
  alternateId?: string;
  alternateType?: string;
  scanId?: string;
  idQueue?: string;
  employerName?: string;
  employerCity?: string;
  employerZip?: string;
  eUspsId?: number | null;

  // === US address ===
  streetName?: string;
  suiteApt?: string;
  uspsId?: number | null;
  city?: string;
  zip?: string;
  state?: string;
  hAreaCode?: string;
  hPhoneNo?: string;
  dAreaCode?: string;
  dPhoneNo?: string;
  extension?: number;
  mAreaCode?: string;
  mPhoneNo?: string;
  email?: string;
  preferredContactPhone?: string;

  // === International address (flat fields) ===
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
  intlCity?: string;

  // === Alternate address ===
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
  altIntlCityName?: string;
  preferredContactAddress?: string;

  // === New donor flag ===
  isNewDonor?: boolean;
  newDonorDetails?: CreateDonorRequest;

  // === Nested international address objects ===
  donorInternationalAddress?: RegisterDonationIntlAddressPayload;
  employerInternationalAddress?: RegisterDonationIntlAddressPayload;

  interdictions?: InterdictionItem[];
  sessionId?: string;
}

export interface RegisterDonationIntlAddressPayload {
  streetName?: string | null;
  addr1?: string | null;
  addr2?: string | null;
  addr3?: string | null;
  addr4?: string | null;
  countryName?: string | null;
  postalCode?: string | null;
  homePhone?: string | null;
  workPhone?: string | null;
  workPhoneExt?: string | null;
  mobilePhone?: string | null;
  faxNo?: string | null;
  email?: string | null;
  intlAddrFlag?: string;
  modifiedFlag?: string;
}

export interface InternationalAddressPayload {
  streetName: string;
  addr1?: string | null;
  addr2?: string | null;
  addr3?: string | null;
  addr4?: string | null;
  country: string;
  postalCode?: string | null;
  homePhoneNo?: string | null;
  workPhoneNo?: string | null;
  workPhoneExt?: string | null;
  mobilePhoneNo?: string | null;
  faxNo?: string | null;
  email?: string | null;
}

export interface AlternateAddressPayload {
  addressType: string;
  streetName?: string | null;
  suiteApt?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  uspsId?: number | null;
  intlAddress1?: string | null;
  intlAddress2?: string | null;
  intlAddress3?: string | null;
  intlAddress4?: string | null;
  countryName?: string | null;
  intlCity?: string | null;
  intlPostalCode?: string | null;
  intlAddrFlag?: string | null;
  mobilePhoneNumber?: string | null;
  otherContactNumber?: string | null;
  altIntlPhoneNumber?: string | null;
  preferredContactPhone?: string | null;
  preferredContactAddress?: string | null;
}

export interface BatchRegisterDonationRequest {
  donorId: string;
  firstUnitId: string;
  lastUnitId: string;
  donationType: string;
  procedureCode?: string;
  equipType?: string;
  sVenipuncture?: string;
  lookupId?: string;
  screenerId?: string;
  physicalId?: string;
  collDate?: string;
  driveId: string;
  gender?: string;
  donorWeight?: number;
}

export interface UpdateRegisterDonationRequest {
  transactionId: string;
  unitId?: string;
  voidUnitId?: string;
  donationType?: string;
  procedureCode?: string;
  equipType?: string;
  sVenipuncture?: string;
  lookupId?: string;
  screenerId?: string;
  physicalId?: string;
  bleedStartPhlebL1?: string;
  bleedStartPhlebL2?: string;
  bleedStartPhlebR1?: string;
  bleedStartPhlebR2?: string;
  bleedEndPhlebL?: string;
  bleedEndPhlebR?: string;
  otherSPhleb?: string;
  otherEPhleb?: string;
  materialId?: string;
  firstReviewerId?: string;
  creditSponsor?: string;
  sReaction?: string;
  collDate?: string;
  gender?: string;
  donorWeight?: number;
  auditKey?: number;
}

export interface RegisterDonationQuery {
  donorId?: string;
  unitId?: string;
  driveId?: string;
  donationType?: string;
  collDateFrom?: string;
  collDateTo?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortDirection?: string;
}

export interface DriveLookupDto {
  driveId: string;
  driveDate: string;
  driveType: string | null;
  sponsorName: string | null;
}

export interface ProcedureCodeLookupDto {
  procedureCode: string;
  description: string | null;
}

export interface VenipunctureCodeLookupDto {
  code: string;
  description: string | null;
}

export interface EmployeeLookupDto {
  staffNo: string;
  employeeName: string | null;
}

export interface InterdictionCodeLookupDto {
  interCode: string;
  interDesc: string | null;
  interType: string | null;
}

export interface EmployerLookupDto {
  employerId: string;
  employerName: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  uspsId: number | null;
  intlAddrFlag: string | null;
}

export interface EthnicGroupLookupDto {
  code: string;
  description: string | null;
}

export interface AlternateTypeLookupDto {
  code: string;
  description: string | null;
}

export interface DonationTypeLookupDto {
  donationType: string;
  description: string | null;
}

export interface SponsorLookupDto {
  sponsorId: string;
  name: string | null;
}

export interface CityStateLookupDto {
  uspsId: number;
  city: string;
  state: string;
  zip: string;
}

export interface CodeDescriptionDto {
  code: string;
  description: string | null;
}

export interface DeferralReasonLookupDto {
  reasonCode: string;
}

export type DonorRegistrationMode = 'search' | 'add' | 'edit';

export type ContentSection = 'donor' | 'personal' | 'address' | 'contact' | 'employer' | 'donation';

export interface ContentNavItem {
  id: ContentSection;
  label: string;
}

export interface AlternateDemographicsDialogData {
  localAddress?: {
    streetName: string;
    suiteApt: string;
    city: string;
    floor: string;
    zip: string;
    country: string;
  };
  internationalAddress?: {
    address1: string;
    address2: string;
    address3: string;
    address4: string;
    city: string;
    country: string;
    postalCode: string;
  };
  phoneInfo?: {
    mobilePhone: string;
    otherContact: string;
    alternateIntlPhone: string;
    preferredContact: string;
  };
  mode: 'local' | 'international';
}

export interface AlternateDemographicsDialogResult {
  action: 'apply' | 'cancel';
  data?: AlternateDemographicsDialogData;
}

export type ArmUsedValue = 'L' | 'R' | 'B' | 'O' | '';

export interface BleedTimeDetailsDialogData {
  doubleStickId: string;
  currentDriveDate: string;
  employees: EmployeeLookupDto[];
  selectedArm: ArmUsedValue;
  leftArm: BleedTimeArm;
  rightArm: BleedTimeArm;
  other: BleedTimeArm;
  drawStartTime: string;
  mrsLoss: string;
  phlebotomistLoss: string;
}

export interface BleedTimeArm {
  startTime1: string;
  startPhleb1: string;
  endTime1: string;
  endPhleb1: string;
  startTime2: string;
  startPhleb2: string;
  endTime2: string;
  endPhleb2: string;
}

export interface BleedTimeDetailsDialogResult {
  action: 'apply' | 'cancel';
  selectedArm?: ArmUsedValue;
  data?: BleedTimeDetailsDialogData;
}

export type { UnitValidationResponse, UnitValidationApiResponse }
  from '../../../../APIsAndIntegration/Lab-API-Interfaces/manual-donor-interface/models/manual-donor-interface.model';

export interface ManualHoldsDialogData {
  interdictionCodes: InterdictionCodeLookupDto[];
  existingHolds?: InterdictionCodeLookupDto[];
}

export interface ManualHoldsDialogResult {
  action: 'ok' | 'cancel';
  selectedHolds?: InterdictionCodeLookupDto[];
}

export interface CreateDonationInterdictionRequest {
  transactionId: string;
  donorId: string;
  interCode: string;
}

export interface InterdictionItem {
  interCode: string;
  interType: string;
  description: string;
  comments: string;
  transactionId: string;
  termDate: string;
  releaseDate: string;
  releaseUser: string;
  programId: string;
  chapterId: string;
  collDate: string;
}

export interface NewDonorAddressDto {
  streetName?: string;
  suiteApt?: string;
  city?: string;
  zip?: string;
  state?: string;
  uspsId?: number;
  hAreaCode?: string;
  hPhoneNo?: string;
  dAreaCode?: string;
  dPhoneNo?: string;
  extension?: string;
  mAreaCode?: string;
  mPhoneNo?: string;
  email?: string;
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
}

export interface CreateDonorRequest {
  lastName: string;
  firstName: string;
  dateOfBirth: string;
  gender: string;
  middleName?: string;
  salutation?: string;
  alias?: string;
  lastNameSuffix?: string;
  ethnicGroup?: string;
  alternateId?: string;
  alternateIdType?: string;
  claimedDonation?: number;
  lang?: string;
  scanId?: string;
  ssn?: string;
  address?: NewDonorAddressDto;
}

export interface CreateDonorResponse {
  donorId: string;
  chapterId: string;
}

export interface FieldValidationResult {
  success: boolean;
  message: string;
  statusCode: number;
}
