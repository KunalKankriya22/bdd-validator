export interface ErrorResponse {
  errorCode: string;
  error: string;
}

export interface UnitValidationResult {
  isValid: boolean;
  message: string | null;
  errorCode: string | null;
  errorResponse: ErrorResponse | null;
  maxCollDate: string | null;
}

export interface CollectionDateOption {
  collDate: string;
}

export interface SeparationTimesData {
  unitId: string;
  collDate: string;
  chapterId: string;
  firstSepTime: string | null;
  firstSepCentrifugeId: string | null;
  firstSepUserId: string | null;
  firstSepEntryMode: string | null;
  secondSepTime: string | null;
  secondSepCentrifugeId: string | null;
  secondSepUserId: string | null;
  secondSepEntryMode: string | null;
  bleedStartTime: string | null;
  bleedEndTime: string | null;
}

export interface CentrifugeOption {
  equipId: string;
  serialNumber: string;
}

export interface UpdateSeparationTimesPayload {
  firstSepTime: string | null;
  firstSepCentrifugeId: string | null;
  firstSepEntryMode: string | null;
  secondSepTime: string | null;
  secondSepCentrifugeId: string | null;
  secondSepEntryMode: string | null;
}
