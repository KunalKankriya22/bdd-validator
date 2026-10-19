import { Moment } from 'moment';

export interface TestIdOption {
  testId: string;
  testDesc?: string;
}

export interface OverrideRuleModel {
  testId: string;
  chapterId: string;
  currentResultStatus: string;
  newResultStatus: string;
  overrideFlag: string;
  interCode: string;
  interDescription: string;
  effDate: Date | string;
  termDate: Date | string | null;
  programId: string;
  insertDate: Date | string;
  insertUser: string;
  auditKey: number;
}

export interface OverrideRuleRequestParams {
  testId?: string;
  chapterId?: string;
  searchKeyword?: string;
  overrideFlag?: string;
  interdictionCode?: string;
  effectiveDatePeriod?: 'before' | 'after';
  effectiveDate?: Date | string;
  terminationDatePeriod?: 'before' | 'after';
  terminationDate?: Date | string;
  sort?: string;
}

export interface OverrideRuleFilterValue {
  overrideFlag: string | null;
  interdictionCode: string | null;
  effectiveDatePeriod: 'BEFORE' | 'AFTER' | 'before' | 'after' | null;
  effectiveDate: Moment | Date | string | null;
  terminationDatePeriod: 'BEFORE' | 'AFTER' | 'before' | 'after' | null;
  terminationDate: Moment | Date | string | null;
}

export interface OverrideRuleDto {
  testId: string;
  chapterId: string;
  currentResultStatus: string;
  newResultStatus: string;
  overrideFlag: string;
  interdictionCode: string;
  effectiveDate: Date | string;
  programId: string;
}

export interface UpdateOverrideRuleDto extends OverrideRuleDto {
  auditKey: number;
}

export interface OverrideRuleEditModel {
  testId: string;  // Read-only, from selected testId
  chapterId: string;  // Always "ALL" based on API examples
  currentResultStatus: string;
  newResultStatus: string;
  overrideFlag: string;
  interCode: string;  // Note: API uses interCode, not interdictionCode
  effDate: Moment | null;
  termDate: Moment | null;
  originalTermDate?: Moment | null;
  effDateReadonly?: boolean;  // True if effective date was in the past when entering edit mode
  auditKey: number;  // 0 for new, existing value for updates
  userId?: string;  // User ID for INSERT_USER column - extracted from auth context if not provided
  errors?: {[key: string]: string};  // Validation errors
  isDirty?: boolean;  // Track if row was modified
}

export interface InterdictionCode {
  interCode: string;
  interDesc: string;
}

export interface TestResultApiResponse {
  resulT_CODE: string;
  resulT_DESCRIPTION?: string;
}

export interface TestResult {
  resultCode: string;
  resultDescription?: string;
}
