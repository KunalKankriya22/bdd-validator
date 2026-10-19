export interface BatchLookupModel {
  setId: string;
  foundOn: string;
  source: string;
}

export interface BatchSearchDto {
  setId?: string;
  transactionId?: string;
  searchKeyword?: string; // Search keyword
  // Note: Backend doesn't support status filtering in LOV endpoint
}

export interface DuplicateDonorModel {
  donorId: string;
  donorName: string;
  dateOfBirth: string;
  gender: string; // API uses 'gender'
  sex?: string; // Backward compatibility - mapped from gender
  mergeFlag: string; // API uses 'mergeFlag'
  flag?: 'Primary' | 'Secondary' | 'FALSE' | 'NOMER'; // Backward compatibility - mapped from mergeFlag
  setStatusCode?: string;
  bloodType?: string;
  demographicsCheck?: string;
  interdictionsCheck?: string;
  donationsCheck?: string;
  attributesCheck?: string;
  keydataCheck?: string;
  allChecksComplete?: boolean;
}

export interface InterdictionModel {
  interCode: string;
  effDate: string;
  termDate: string;
  description: string;
  donorId: string;
  unitId: string;
  collDate: string;
}

export interface UnitToBeCheckedModel {
  interCode: string;
  effDate: string;
  termDate: string;
  description: string;
  donorId: string;
  unitId: string;
  collDate: string;
}

export interface BatchRetrieveResponseModel {
  setId: string;
  foundOn: string;
  duplicates: DuplicateDonorModel[]; // Each donor has setStatusCode field
}

export interface MergeDonorRequest {
  setId: string;
  primaryDonorId: string;
  secondaryDonorId: string;
  note?: string;
}

export interface ResolveDonorRequest {
  setId: string;
  firstDonorId: string;
  secondDonorId: string;
}

export interface MergePreviewRequest {
  primaryDonorId: string;
  secondaryDonorId: string;
}

export interface MergePreviewResponse {
  primaryDonor: DonorPreviewInfo;
  secondaryDonor: DonorPreviewInfo;
  aboMismatch: boolean;
  warnings: string[];
}

export interface DonorPreviewInfo {
  donorId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
}

export interface MergeDonorInterdiction {
  interCode: string;
  effDate: string;
  termDate: string;
  description: string;
  unitId: string;
  donorId: string;
}

export interface MergeDonorHoldUnit {
  donorId: string;
  originalDonorId: string;
  unitId: string;
  collDate: string;
  status: string;
}

export interface MergeDonorResultModel {
  primaryDonorId: string;
  secondaryDonorId: string;
  setId: string;
  status: string;
  interdictions: MergeDonorInterdiction[];
  holdUnits: MergeDonorHoldUnit[];
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