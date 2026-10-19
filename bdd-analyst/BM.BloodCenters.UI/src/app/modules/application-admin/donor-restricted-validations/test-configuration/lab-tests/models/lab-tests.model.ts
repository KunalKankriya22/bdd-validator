export interface TestIdOption {
  testId: string;
  description?: string;
  testGroup?: string;
}

/**
 * Maps to DefineTestsLabDto from backend (PascalCase)
 */
export interface DefineTestsLabDto {
  TestId?: string;
  Description?: string;
  ShortId?: string;
  Group?: string;
  AntigenTest?: boolean;
  AutoSchedule?: boolean;
  EditResults?: boolean;
  DiscrepancyCheck?: boolean;
  NoOfResults?: number;
  FullResult?: boolean;
  EffectiveDate?: string;
  TerminationDate?: string;
  ModificationDate?: string;
}

export interface TestDetails {
  description: string;
  shortId: string;
  group: string;
  antigenTest: string;
  autoSchedule: string;
  editResults: string;
  discrepancyCheck: string;
  noOfResults: number | string;
  fullResult: string;
  effDateTime: Date | string | null;
  termDateTime: Date | string | null;
  modificationDate: Date | string | null;
}

// Dropdown DTOs from backend
export interface CodeDescriptionDto {
  Code: string;
  Description: string;
}

export interface BooleanDropdownDto {
  Value: boolean;
  Label: string;
}

export interface NumberDropdownDto {
  Value: number;
  Label: string;
}

export interface DefineTestsLabDropdownDto {
  Group: CodeDescriptionDto[];
  AntigenTest: BooleanDropdownDto[];
  AutoSchedule: BooleanDropdownDto[];
  EditResults: BooleanDropdownDto[];
  DiscrepancyCheck: BooleanDropdownDto[];
  NoOfResults: NumberDropdownDto[];
  FullResult: BooleanDropdownDto[];
}

// Mapped dropdown options for UI
export interface DropdownOptions {
  group: { value: string; display: string }[];
  antigenTest: { value: boolean; display: string }[];
  autoSchedule: { value: boolean; display: string }[];
  editResults: { value: boolean; display: string }[];
  discrepancyCheck: { value: boolean; display: string }[];
  noOfResults: { value: number; display: string }[];
  fullResult: { value: boolean; display: string }[];
}

// Create/Update DTOs for API
export interface DefineTestsLabCreateDto {
  TestId: string;
  Description: string;
  ShortId: string;
  Group?: string;
  AntigenTest?: boolean | null;
  AutoSchedule: boolean;
  EditResults: boolean;
  DiscrepancyCheck: boolean;
  NoOfResults: number;
  FullResult: boolean;
  EffectiveDate: string;
  TerminationDate?: string | null;
}

export interface DefineTestsLabUpdateDto {
  Description: string;
  ShortId: string;
  Group?: string;
  AntigenTest?: boolean | null;
  AutoSchedule: boolean;
  EditResults: boolean;
  DiscrepancyCheck: boolean;
  NoOfResults: number;
  FullResult: boolean;
  EffectiveDate: string;
  TerminationDate?: string | null;
}

// Filter values from /api/v1/define-test-results-lab/filter-values
export interface DefineTestResultsLabFilterValuesDto {
  InterdictionCodes: string[];
  AttributeCodes: string[];
  AttributeGroups: string[];
}

export interface FilterDropdownOptions {
  interdictionCodes: { value: string; display: string }[];
  attributeCodes: { value: string; display: string }[];
  tests: { value: string; display: string }[];
}

// Filter request DTO for POST /api/v1/define-test-results-lab/filter-by-testid
export interface DefineTestResultsLabFilterRequest {
  interdiction?: string;
  plateSeq?: string;
  effectivePeriod?: string;
  effectiveDate?: string;
  terminationPeriod?: string;
  terminationDate?: string;
  searchKeyword?: string;
}

/**
 * API Response DTO for GET /api/v1/define-test-results-lab/filter-by-testid?testId=xxx
 * Returns an array of test result records
 */
export interface DefineTestResultsLabDto {
  TestId: string;
  ResultCode: string;
  PlateSeq: string;
  InterdictionCode?: string | null;
  VerifyFlag?: boolean | null;
  NoOfRepeats: number;
  AttributeGroup?: string | null;
  AttributeCode?: string | null;
  ConfirmTest1?: string | null;
  ConfirmTest2?: string | null;
  ConfirmTest3?: string | null;
  ConfirmTest4?: string | null;
  ConfirmTest5?: string | null;
  ConfirmTest6?: string | null;
  SecondTech?: boolean | null;
  AutoOnly?: boolean | null;
  EffectiveDate: string;
  TerminationDate?: string | null;
  ModificationDate: string;
  AuditKey: number;
}

/**
 * Array response type for the filter-by-testid endpoint
 */
export type DefineTestResultsLabArrayResponse = DefineTestResultsLabDto[];

// Bulk upsert DTOs - Request payload (camelCase)
export interface DefineTestResultsLabUpsertItemDto {
  auditKey?: number; // Only include for existing records (auditKey > 0), omit for new records
  resultCode: string;
  plateSeq: string;
  interdictionCode?: string | null;
  verifyFlag?: boolean | null;
  noOfRepeats?: number | null;
  attributeCode?: string;
  confirmTest1?: string;
  confirmTest2?: string;
  confirmTest3?: string;
  confirmTest4?: string;
  confirmTest5?: string;
  confirmTest6?: string;
  secondTech?: boolean | null;
  autoOnly?: boolean | null;
  effectiveDate: string;
  terminationDate?: string | null;
}

export interface DefineTestResultsLabBulkUpsertDto {
  records: DefineTestResultsLabUpsertItemDto[];
}

export interface DefineTestResultsLabBulkUpsertResultDto {
  TotalRecords: number;
  CreatedCount: number;
  UpdatedCount: number;
  FailureCount: number;
  SuccessCount: number;
  Success: boolean;
  Message?: string;
}

export interface LabTestModel {
  resultCode: string;
  initialRepeat: string;
  interdictionCode: string | null;
  noOfRepeats: number | string;
  attributeCode: string;
  confirmTest1: string;
  confirmTest2: string;
  confirmTest3: string;
  confirmTest4: string;
  confirmTest5: string;
  confirmTest6: string;
  machineResult: string;
  result2: string;
  effDate: Date | string;
  termDate: Date | string | null;
  modificationDate: Date | string;
  auditKey: number;
}

export interface LabTestRequestParams {
  testId?: string;
  searchKeyword?: string;
  initialRepeat?: string;
  interdictionCode?: string;
  effectiveDatePeriod?: 'Before' | 'After';
  effectiveDate?: Date | string;
  terminationDatePeriod?: 'Before' | 'After';
  terminationDate?: Date | string;
  sort?: string;
}

export interface LabTestFilterValue {
  initialRepeat: string | null;
  interdictionCode: string | null;
  effectiveDatePeriod: 'Before' | 'After' | null;
  effectiveDate: Date | string | null;
  terminationDatePeriod: 'Before' | 'After' | null;
  terminationDate: Date | string | null;
}

export interface LabTestEditModel {
  resultCode: string;
  initialRepeat: string;
  interdictionCode: string | null;
  noOfRepeats: number | string | null;
  attributeCode: string | null;
  confirmTest1: string | null;
  confirmTest2: string | null;
  confirmTest3: string | null;
  confirmTest4: string | null;
  confirmTest5: string | null;
  confirmTest6: string | null;
  machineResult: string | null;
  result2: string | null;
  effDate: Date | null;
  termDate: Date | null;
  auditKey: number;
  errors?: { [key: string]: string };
  isDirty?: boolean;
  lastDateField?: 'effDate' | 'termDate';
}
