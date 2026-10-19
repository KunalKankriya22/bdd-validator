export interface UnitLevelQCDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  productCode?: string;
  productDescription?: string;
  qcLabelFlag?: string;
  systemLabelDecision?: string;
  labelDats?: string | null;
  abo?: string;
  rh?: string;
  donorInterface?: string;
  expirationDate?: string | null;
  volume?: number | null;
  status?: string;
  insertDate: string;
  insertUser: string;
}

export interface UnitLevelQCDetailDto extends UnitLevelQCDto {
  testResultStatus?: string;
  testCompletionDate?: string | null;
  testCount?: number | null;
  testsPassed?: number | null;
  testsFailed?: number | null;
}

export interface QcStatusDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  contractId: string;
  contractType: string;
  donorInterface: string;
  testingFlag: string;
  nursingAuditFlag: string;
  componentReview: string;
  qcLabelFlag: string;
  qcLabelDate: string | null;
  expectedBagCount: number;
  actualComponentCount: number;
  isEligibleForQc: boolean;
}

export interface QcStatusResponse {
  success: boolean;
  statusCode: number;
  message: string;
  item: QcStatusDto;
}

export interface CommitQcRequest {
  componentReview: string;
  qcLabelFlag: string;
}

export interface CommitQcResponse {
  success: boolean;
  statusCode: number;
  message: string;
  item: boolean;
}

export interface ComponentDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  productCode: string;
  componentPrefix: string;
  bagId: string;
  expiryDate: string | null;
  systemLabelDecision: string | null;
  rejectReasonCode: string | null;
  insertDats: string | null;
  labelDats: string | null;
}

export interface ComponentsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ComponentDto[];
  total: number;
}

export interface TestDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  testId: string;
  testSeqNo: number;
  resultStatus1: string;
  tbId: string;
  absorbance: string;
  ratio: string;
}

export interface TestsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: TestDto[];
  total: number;
}

export interface UnitLevelQCQueryDto {
  unitId?: string;
  productCode?: string;
  qcLabelFlag?: string;
  systemLabelDecision?: string;
  abo?: string;
  rh?: string;
  status?: string;
  collDateFrom?: string;
  collDateTo?: string;
  labelDatsFrom?: string;
  labelDatsTo?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface UnitLevelQCQueryResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: UnitLevelQCDto[];
  totalCount: number;
}

export interface UnitLevelQCDetailResponse {
  success: boolean;
  statusCode: number;
  message: string;
  item: UnitLevelQCDetailDto;
}

export interface UnitLevelQCValidateRequest {
  unitId: string;
}

export interface UnitLevelQCValidateResponse {
  success: boolean;
  statusCode: number;
  message: string;
  isValid: boolean;
  validationErrors?: string[];
}

export interface UnitLevelQCFilterValue {
  unitId?: string;
  productCode?: string;
  qcLabelFlag?: string;
  systemLabelDecision?: string;
  abo?: string;
  rh?: string;
  status?: string;
  collDateFrom?: Date | null;
  collDateTo?: Date | null;
  labelDatsFrom?: Date | null;
  labelDatsTo?: Date | null;
}

export interface FilterChip {
  key: string;
  label: string;
  value: string;
}

export interface DropdownOption {
  value: string;
  label: string;
}

export interface TableColumn {
  field: string;
  header: string;
  sortable: boolean;
  width?: string;
  type?: 'text' | 'date' | 'number';
}
