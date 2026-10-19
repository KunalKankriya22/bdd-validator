export type TransferMode = 'I' | 'E';

export interface BoxDropdownItem {
  boxId: string;
  shipmentNo: string;
  facilityCode?: string;
}

export interface BoxValidationResult {
  boxId: string;
  contractId: string | null;
  profileSetId: string | null;
  shipmentNo: string | null;
  shipmentDate: string | null;
  receivedDate: string | null;
  batchId: string | null;
  boxStatus: string | null;
}

export interface SampleTransferInDetail {
  boxId: string;
  extUnitId: string;
  intUnitId: string;
  collDate: string;
  contractId: string;
  sampleType: string;
  frozenFlag: string;
  thawFlag: string;
  sampleSeqNo: string;
  chapterId: string;
  acceptFlag: string;
  aliquot: string;
  verifyFlag?: string;
}

export interface ContractDropdownItem {
  contractId: string;
  company: string;
  centerId?: string;
}

export interface ProfileSetDropdownItem {
  profileSetId: string;
  profileDesc: string;
  profileType?: string;
  profileSeqNo?: number;
  termDate?: string;
}

export interface BatchDropdownItem {
  batchId: string;
  receivedDate: string;
}

export interface SampleTypeDropdownItem {
  code: string;
  codeDesc: string;
}

export interface TestDropdownItem {
  testId: string;
  testDesc: string;
  testGroup: string;
}

export interface OverrideCodeItem {
  code: string;
  codeDesc: string;
}

export interface CheckInRequest {
  transferMode: TransferMode;
  boxId: string;
  contractId?: string;
  profileSetId?: string;
  shipmentNo?: string;
  shipmentDate?: string;
  receivedDate?: string;
  batchId?: string;
  extUnitId?: string;
  intUnitId?: string;
  collDate?: string;
  sampleType?: string;
  newSampleType?: string;
  frozenFlag?: string;
  thawFlag?: string;
  thawStartTime?: string;
  aliquot?: string;
  isNewSample?: boolean;
  acceptFlag?: string;
  ovrUserId?: string;
  ovrReasonCode?: string;
  ovrHoldCode?: string;
  ovrComments?: string;
  adhocTestIds?: string[];
}

export interface OverrideData {
  userId: string;
  password: string;
  reasonCode: string;
  holdCode: string;
  comments: string;
}

export interface ContractValidationResult {
  contractId: string;
  barCodeProtocol: string | null;
  unitIdType: string | null;
  copyIsbtFlag: string | null;
}

export interface BarcodeSchemeResult {
  contractId: string;
  barcodeScheme: string | null;
}

export interface DuplicateSampleResult {
  isDuplicate: boolean;
}

export interface SampleDataResult {
  unitId: string;
  collDate: string | null;
  contractId: string | null;
  sampleType: string | null;
  frozenFlag: string | null;
  thawFlag: string | null;
  sampleSeqNo: string | null;
  boxId: string | null;
}

export interface CopyUnitsResult {
  intUnitId: string;
  chkDigit: string | null;
}

export interface SampleNotationItem {
  notationCode: string;
  notationType: string;
  shortDesc: string;
  testId: string;
  effDate: string;
  termDate: string;
  notationDesc: string;
}

export interface UpdateSampleDetailRequest {
  boxId: string;
  intUnitId: string;
  aliquot: string;
  sampleType?: string;
  newSampleType?: string;
  frozenFlag?: string;
  thawFlag?: string;
}

export interface ApiErrorResponse {
  errorCode: string;
  error: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  errorCode?: string;
  error?: string;
  errorResponse?: ApiErrorResponse;
  data: T;
}

export interface NotationAccessResult {
  canAdd: boolean;
  canDelete: boolean;
  message: string;
}
