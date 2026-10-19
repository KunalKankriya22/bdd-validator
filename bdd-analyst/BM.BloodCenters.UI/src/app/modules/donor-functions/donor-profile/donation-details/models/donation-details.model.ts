export interface DonationRecord {
  donorId: string;
  unitId: string | null;
  displayUnitId: string | null;
  transactionId: string;
  deferralId: string | null;
  collDate: string;
  donationType: string | null;
  procedureCode: string | null;
  procedureCodeDesc: string | null;
  deferralReason: string | null;
  creditSponsor: string | null;
  creditSponsorName: string | null;
  driveId: string | null;
  driveSponsor: string | null;
  chapterId: string;
  noteId: string | null;
  hasNotes: boolean;
  hasComments: boolean;
  voidUnitId: string | null;
  displayVoidUnitId: string | null;
  lastInterfaceDate: string | null;
  physicalFindings: PhysicalFinding[];
  donationInterdictions: DonationHold[];
  labUnitInterdictions: LabInterdiction[];
}

export interface PhysicalFinding {
  physicalCode: string;
  physicalValue: string | null;
  physicalValueRepeat: string | null;
  interCode: string | null;
}

export interface DonationHold {
  interCode: string;
  interDesc: string | null;
  releaseDate: string | null;
  releaseUser: string | null;
  termDate: string | null;
}

export interface LabInterdiction {
  interCode: string;
  insertDats: string;
}

export interface DonorHeaderInfo {
  name: string;
  dateOfBirth: string | null;
  sex: string | null;
  abo: string | null;
}

export interface DonationDetailsData {
  donorId: string;
  sourceLabel?: string;
  sourcePath?: string;
}

export interface DonationDetailsQuery {
  sortColumn?: string | null;
  sortOrder?: string | null;
}

export interface DonationDetailsResponse {
  success: boolean;
  message: string | null;
  statusCode: number | null;
  data: DonationRecord[];
  total: number | null;
}

export interface DonorHeaderResponse {
  success: boolean;
  message: string | null;
  statusCode: number | null;
  data: DonorHeaderInfo[];
  total: number | null;
}

export interface EquipSupplyItem {
  equipOrSupply: string | null;
  equipSupplyCode: string | null;
  equipReference: string | null;
  catalogNo: string | null;
  lotNo: string | null;
  phyCode: string | null;
  tempQcStatus: string | null;
}

export interface DonationAttribute {
  attribCode: string;
  attribValue: string | null;
  attribDesc: string | null;
  insertUser: string | null;
  insertDate: string | null;
}

export interface AuxDonation {
  unitId: string;
  displayUnitId: string | null;
  collDate: string;
  donorId: string;
  locationId: string | null;
  sponsorId: string | null;
  oldDonorId: string | null;
  bagType: string | null;
  startTime: string | null;
  category: string | null;
}

export interface SponsorLookup {
  sponsorId: string;
  name: string | null;
}

export interface DonationDetailsAccess {
  canEditSponsor: boolean;
}

export interface ApiListResponse<T> {
  success: boolean;
  message: string | null;
  statusCode: number | null;
  data: T[];
  total: number | null;
}

export interface ApiItemResponse<T> {
  success: boolean;
  message: string | null;
  statusCode: number | null;
  item: T;
}

export interface EquipSupplyDialogData {
  transactionId: string;
  chapterId: string;
}

export interface SponsorDetailsDialogData {
  unitId: string | null;
  collDate: string;
  driveId: string | null;
  creditSponsor: string | null;
  creditSponsorName: string | null;
  canEditSponsor: boolean;
}

export interface ShowAttributesDialogData {
  transactionId: string;
  unitId: string | null;
  donorInfo: DonorHeaderInfo | null;
  totalDonationCredits: number;
}

export interface ShowAuxUnitsDialogData {
  donorId: string;
  donorInfo: DonorHeaderInfo | null;
  totalDonationCredits: number;
}

export interface PhysicalFindingComment {
  physicalCode: string;
  comments: string | null;
}

export interface PhysicalFindingsCommentsDialogData {
  transactionId: string;
  chapterId: string;
  unitId: string | null;
  collDate: string;
  physicalFindings: PhysicalFinding[];
}
