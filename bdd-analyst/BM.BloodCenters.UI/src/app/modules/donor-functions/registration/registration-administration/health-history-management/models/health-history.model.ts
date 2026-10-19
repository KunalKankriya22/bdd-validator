// ==================== HH QUESTIONS ====================

export interface HHQuestionModel {
  questionCode: string;
  refCode: string;
  questionDescription: string;
  gender: string;
  readMoreFlag: string;
  manualAuditFlag: string;
  manualAuditHistFlag: string;
  validateLookBackDate: string;
  periodTypeForLookBack: string;
  periodNumberForLookBack: number | null;
  effectiveDate: string;
  terminationDate?: string;
  chapterId?: string;
  programId?: string;
  insertDate?: string;
  insertUser?: string;
}

export interface HHQuestionSearchParams {
  searchFor?: string;
  questionCode?: string;
  gender?: string;
  activeOnly?: boolean;
  excludeTerminatedToday?: boolean;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
  validateLookBackDate?: string;
  periodTypeForLookBack?: string;
  effectiveDatePeriod?: 'After' | 'Before';
  effectiveDate?: string;
  terminationDatePeriod?: 'After' | 'Before';
  terminationDate?: string;
}

export interface HHQuestionFilterValue {
  sex?: string;
  validateLookBackDate?: string;
  periodTypeForLookBack?: string;
  effectiveDatePeriod?: 'After' | 'Before';
  effectiveDate?: string;
  terminationDatePeriod?: 'After' | 'Before';
  terminationDate?: string;
}

export interface GenderDropdownOption {
  code: string;
  description: string;
}

export interface InterdictionCodeOption {
  code: string;
  description: string;
}

export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  errorCode?: string;
  errorResponse?: { errorCode?: string; error?: string };
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

// ==================== HH RESPONSES ====================

export interface HHResponseModel {
  questionCode: string;
  questionDescription?: string;
  response: string;
  donorResponse?: string;
  answerCode: string;
  answerDescription: string;
  groupCode: string;
  interdictionCode: string;
  deferralPeriod: number | null;
  periodType: string;
  commentRequired: string;
  manualAuditFlag: string;
  additionalDateFlag: string;
  effectiveDate: string;
  terminationDate?: string;
  chapterId?: string;
  insertDate?: string;
  insertUser?: string;
}

export interface HHResponseSearchParams {
  questionCode?: string;
  searchFor?: string;
  answerCode?: string;
  response?: string;
  groupCode?: string;
  effectiveDate?: string;
  effectiveDatePeriod?: string;
  terminationDate?: string;
  terminationDatePeriod?: string;
  activeOnly?: boolean;
  sortBy?: string;
  sortDir?: string;
}

export interface PeriodTypeOption {
  key: string;
  value: string;
}

export interface HHResponseCommentModel {
  commentCode?: string;
  commentDet: string;
  effDate: string;
  termDate?: string;
}

export interface HHResponseCommentContext {
  questionCode: string;
  answerCode: string;
  response: string;
}

// ==================== HH TEMPLATES ====================

export interface HHTemplateQuestionDto {
  donationType: string;
  questionCode: string;
  templateId: string;
  questionDescription: string;
  screenerAsk: string;
  abbrFlag: string;
  abbrDispSeq: number | null;
  repeatHhFlag: string;
  gender: string;
  displayOrder: number | null;
  sortSequence: string;
  parentQuestionCode: string;
  subQuestionFlag: string;
  parentRespFlag: string;
  gotoNotes: string;
  effDate: string;
  termDate: string | null;
  validCodeType: string;
  randomizationFlag: string;
  programId: string;
  insertDate: string;
  insertUser: string;
  auditKey: number;
  chapterId: string;
}

export interface HHTemplateSearchParams {
  templateId?: string;
  donationType?: string;
  questionCode?: string;
  gender?: string;
  abbrFlag?: string;
  parentQuestionCode?: string;
  includeTerminated?: boolean;
  status?: string;
  effectiveDate?: string;
  effectiveDatePeriod?: string;
  terminationDate?: string;
  terminationDatePeriod?: string;
  sortBy?: string;
  sortDir?: string;
}

export interface HHTemplateFilterValue {
  status?: string;
  donationType?: string;
  effectiveDatePeriod?: 'After' | 'Before';
  effectiveDate?: string;
  terminationDatePeriod?: 'After' | 'Before';
  terminationDate?: string;
}

export interface HHTemplateModel {
  templateId: string;
  donationType: string;
  donationTypeDescription?: string;
  randomizeFlag: string;
  status: string;
  effectiveDate: string;
  terminationDate?: string;
}

export interface HHTemplateDetailModel {
  templateId: string;
  donationType: string;
  donationTypeDescription: string;
  randomizeFlag?: string;
  status?: string;
  effectiveDate: string;
  terminationDate?: string;
  assignedQuestions: HHTemplateQuestionDto[];
}

// ==================== SHARED ====================

export interface DropdownOption {
  code: string;
  description: string;
}

export interface QuestionDropdownOption extends DropdownOption {
  gender?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalRecords: number;
}

export interface TemplateListItem {
  templateId: string;
  status: string;
  effDate: string | null;
  termDate: string | null;
}
