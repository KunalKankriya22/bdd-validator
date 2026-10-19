// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  total?: number;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  error: string;
  data: [];
  total: 0;
}

// Main Donation DTO
export interface AuditDonationDto {
  unitId: string;
  transactionId: string;
  donorId: string;
  donorName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  homePhone: string;
  businessPhone: string;
  collectionDate: string;
  donationType: string;
  procedureCode: string;
  signature: string;
  donorSignatureFlag: string;
  auditDate?: string;
  auditUser?: string;
  unitInDef?: string;
  deferralStatus?: string;
  hasActiveAuditHold?: boolean;
  donorWeight?: string | number | null;
  extension?: string;
  driveDate?: string;
}

// Health History Template Question DTO
export interface HHTemplateQuestionDto {
  sortSequence: number;
  questionCode: string;
  questionDescription: string;
  donationType: string;
  templateId: string;
  ask?: string;
  abbrFlag?: string;
  abbrSeq?: number | null;
  repeated?: string;
  questionNumber?: number | null;
  parentQuestion?: string;
  responseFlag?: string;
  subFlag?: string;
  goToNotes?: string;
  effDate: string;
  termDate: string;
  isAbbreviated?: boolean;  // true when template loaded in abbreviated (aDHQ) mode
}

// Health History DTO - matches actual API response
export interface HealthHistoryDto {
  transactionId: string;
  questionCode: string;
  questionDescription: string;
  answerCode: string;
  answerDescription?: string;
  response: string;
  startDate?: string;
  endDate?: string;
  incidentDate?: string;
  deferralPeriod?: number;
  periodType?: string;
  defThruDate?: string;
  interCode?: string;
  interPeriodType?: string;     // From VALID_INTERDICTIONS.PERIOD_TYPE — 'P' = permanent deferral
  groupCode?: string;
  comments?: string;
  auditKey: number;
  // UI-only fields
  questionText?: string;        // Alias for questionDescription
  deferralThrough?: string;     // Alias for defThruDate
  interdiction?: string;        // Alias for interCode
  _commentRequired?: boolean;   // From VALID_HH_ANSWERS.comment_req='Y'
  _showDateRange?: boolean;     // From VALID_HH_ANSWERS.additional_date_flag='Y'
  localId?: number;             // Client-only monotonic ID for unsaved rows (auditKey===0); prevents comment bleed
}

// Extended dropdown option for answer codes — includes business rule flags
export interface AnswerCodeOption extends DropdownOption {
  commentReq?: boolean;
  additionalDateFlag?: boolean;
  deferralPeriod?: number;
  periodType?: string;
  interCode?: string;
  numeralValue?: number;  // VALID_MASTER_CODES.NUMERAL_VALUE for PRTYP: D=1, W=7, M=31, Y=365
}

export interface AddHealthHistoryResponseRequest {
  questionCode: string;
  answerCode?: string | null;
  response?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  incidentDate?: string | null;
  deferralPeriod?: number | null;
  periodType?: string | null;
  defThruDate?: string | null;
  interCode?: string | null;
  groupCode?: string | null;
  comments?: string | null;
}

export interface UpdateHealthHistoryRequest {
  questionCode: string;
  auditKey?: number;
  answerCode?: string | null;
  response?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  incidentDate?: string | null;
  deferralPeriod?: number | null;
  periodType?: string | null;
  defThruDate?: string | null;
  interCode?: string | null;
  groupCode?: string | null;
  comments?: string | null;
  lastContactDate?: string | null;
  commentCode?: string | null;
}

// Physical Findings DTO
export interface PhysicalFindingDto {
  transactionId: string;
  physicalCode: string;
  description: string;          // Alias for physicalDescription for UI
  physicalDescription: string;
  value: string;
  interdiction?: string;        // Interdiction code/flag
  comments?: string;            // Comments field
  auditKey: string;
}

// Rules for each physical code — determines input type and valid values
export interface PhysicalValueRulesDto {
  physicalCode: string;
  dataType: string;             // row-level: N=whole number, D=decimal, C=character
  primaryDataType: string;      // dominant type for this code: D wins N wins C (from BE SQL)
  itemOperator?: string;        // BETWEEN | MORE | LESS | EQUAL
  itemValue?: string;           // threshold or valid character value
  itemValueMax?: string;        // upper bound for BETWEEN
  interCode?: string;           // triggered interdiction code
  commentReqFlag?: string;      // Y = comments required when this value triggers
}

// Aggregated rules per physical code (built client-side from PhysicalValueRulesDto[])
export interface PhysicalNumericRule {
  operator: string;        // BETWEEN | MORE | LESS
  threshold: number;
  max?: number;
  interCode: string | null;
  commentsRequired: boolean;
}

export interface PhysicalCodeRules {
  dataType: string;         // 'C' | 'N' | 'D'
  // validValues: used for dropdown display (only non-empty when dataType='C')
  validValues: { value: string; interCode: string | null; commentsRequired: boolean }[];
  // charValues: ALL C-type values regardless of primaryDataType — used for:
  //   1. C-primary: same as validValues (dropdown options)
  //   2. N/D-primary with C rows: LOV button next to text input (matches old app F9/LISTVAL)
  charValues: { value: string; interCode: string | null; commentsRequired: boolean }[];
  numericRules: PhysicalNumericRule[];
}

// Physical findings template row (from PHYSICAL_FINDINGS_TEMPLATE)
export interface PhysicalFindingTemplateDto {
  sortSequence: number;
  physicalCode: string;
  physicalDescription: string;
}

// Valid hold inter code (from VALID_INTERDICTIONS WHERE manual_hold_flag='Y')
export interface HoldInterCodeDto {
  interCode: string;
  interDescription: string;
}

// Add Physical Finding — interCode is NOT sent; auto-determined by server from VALID_PHYSICAL_RULES
export interface AddPhysicalFindingRequest {
  physicalCode: string;
  physicalValue?: string | null;
  comments?: string | null;
}

export interface UpdatePhysicalFindingRequest {
  physicalCode: string;
  physicalValue?: string | null;
  interCode?: string | null;
  comments?: string | null;
  reason?: string | null;
  tempAtt?: string | null;
}

// Interdiction (Holds) DTO
export interface DonationInterdictionDto {
  transactionId: string;
  unitId: string;
  interCode: string;
  interDescription: string;
  interType: string;
  comments: string;
  releaseDate: string;
  releaseUser: string;
  auditKey: string;
}

export interface AddInterdictionRequest {
  interCode: string;
  interType: string;
  comments?: string;
  collectionDate?: string;
}

export interface AddQuestionToTemplateRequest {
  questionCode: string;
  donationType: string;
  sortSequence: number;
  templateId?: string;
}

export interface SaveDonationAuditRequest {
  donorSignatureFlag: string;
  donationType: string;
  procedureCode: string;
}

export interface HHQuestionListDto {
  questionCode: string;
  questionDescription: string;
  refCode?: string;
  gender?: string;
  effectiveDate?: string;
  terminationDate?: string;
}

// UI-specific interfaces
export interface StatusIndicator {
  type: 'J' | 'V' | 'C';
  label: string;
  color: string;
  tooltip?: string;
}

export interface DropdownOption {
  value: string;
  label: string;
}
