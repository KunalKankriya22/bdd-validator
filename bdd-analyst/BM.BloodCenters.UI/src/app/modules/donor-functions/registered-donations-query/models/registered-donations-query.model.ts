export interface DonationQueryResult {
  unitId: string | null;
  setId: string | null;
  driveId: string | null;
  collectionDate: string | null;
  donorId: string | null;
  donationType: string | null;
  procedureCode: string | null;
  insertUser: string | null;
  insertDate: string | null;
  auditFlag: string | null;
  transactionId: string | null;
}

export interface DonationQueryRequest {
  driveDateFrom?: string | null;
  driveDateTo?: string | null;
  driveId?: string | null;
  userId?: string | null;
  unitId?: string | null;
  setId?: string | null;
  sortDirection?: string | null;
}

export interface DriveOption {
  driveId: string;
  driveName: string;
}

export interface UserOption {
  userId: string;
  userName: string;
}

export interface SetOption {
  setId: string;
  collectionDate: string;
}

export interface UnitValidationResponse {
  parsedUnitId: string;
  checkDigit: string | null;
  codeScheme: 'I' | 'C';
  manualUnitId: string;
  codabarUnitScheme: 'A' | 'N' | '8' | null;
  entryMode: 'S' | 'M';
  barcodeType: 'CODE128' | 'CODABAR';
  chapterScheme: 'I' | 'C';
}

export interface UnitValidationApiResponse {
  success: boolean;
  message: string;
  errorCode: string | null;
  item: UnitValidationResponse | null;
}

export interface PhlebotomyDetailsDto {
  armUsed: string | null;
  collDate: string | null;
  l1BleedStart: string | null;
  l1BleedEnd: string | null;
  l2BleedStart: string | null;
  l2BleedEnd: string | null;
  r1BleedStart: string | null;
  r1BleedEnd: string | null;
  r2BleedStart: string | null;
  r2BleedEnd: string | null;
  phleb1Id: string | null;
  phleb2Id: string | null;
  phleb3Id: string | null;
  phleb4Id: string | null;
  phlebEnd1Id: string | null;
  phlebEnd2Id: string | null;
  phlebEnd3Id: string | null;
  phlebEnd4Id: string | null;
  otherStartTime: string | null;
  otherEndTime: string | null;
  otherStartPhleb: string | null;
  otherEndPhleb: string | null;
  driveStartTime: string | null;
  rbcLoss: string | null;
  plasmaLoss: string | null;
  doubleStickId: string | null;
  driveId: string | null;
}

export interface PhlebotomyDetailsDialogData {
  transactionId: string;
}
