export interface TestIdOption {
  testId: string;
  description?: string;
  testGroup?: string;
}

/**
 * Maps to DefineTestsDonorDto from backend
 */
export interface TestDetails {
  description: string;
  shortId: string;
  profileTest: string;
  antigenType: string;
  antigenGroup: string;
  testGroup: string;
  testGroupValue: string;
  viewLevel: number | string;
  effectiveDate: Date | string | null;
  terminationDate: Date | string | null;
  modificationDate: Date | string | null;
}

// Mapped dropdown options for add/edit form UI
export interface DropdownOptions {
  profileTest: { value: boolean; display: string }[];
  antigenType: { value: string; display: string }[];
  antigenGroup: { value: string; display: string }[];
  testGroup: { value: string; display: string }[];
  viewLevel: { value: number; display: string }[];
}

// Create DTO for POST /api/v1/define-tests-donor
export interface DefineTestsDonorCreateDto {
  TestId: string;
  Description: string;
  ShortId: string;
  ProfileTest: boolean | null;
  AntigenType?: string;
  AntigenGroup?: string;
  TestGroup: string | null;
  ViewLevel: number;
  EffectiveDate: string;
  TerminationDate?: string | null;
  InsertUser: string;
}

// Update DTO for PUT /api/v1/define-tests-donor/{testId}
export interface DefineTestsDonorUpdateDto {
  Description: string;
  ShortId: string;
  ProfileTest: boolean | null;
  AntigenType?: string;
  AntigenGroup?: string;
  TestGroup: string | null;
  ViewLevel: number;
  EffectiveDate: string;
  TerminationDate?: string | null;
}

// Filter dropdown options from /api/v1/define-test-results-donor/filter-values
export interface FilterDropdownOptions {
  interdictions: { value: string; display: string }[];
}

// Dropdown response models for edit mode
export interface TestDropdownItem {
  testId: string;
  description: string;
  testGroup: string;
}

export interface InterdictionDropdownItem {
  code: string;
  description: string;
}

export interface ResultCodeDropdownItem {
  code: string;
  description: string;
}

// Mapped dropdown options for edit mode UI
export interface EditModeDropdownOptions {
  tests: { value: string; display: string }[];
  interdictions: { value: string; display: string }[];
  resultCodes: { value: string; display: string }[];
}

// Filter request DTO for POST /api/v1/define-test-results-donor/filter-by-testid
export interface DefineTestResultsDonorFilterRequest {
  interdiction?: string;
  effectivePeriod?: string;
  effectiveDate?: string;
  terminationPeriod?: string;
  terminationDate?: string;
  searchKeyword?: string;
}

// Bulk upsert DTOs
export interface DefineTestResultsDonorUpsertItemDto {
  auditKey?: number; // Only included for existing records (auditKey > 0)
  ChapterId?: string;
  ResultCode: string;
  Interdiction1?: string | null;
  Interdiction2?: string | null;
  Interdiction3?: string | null;
  EffectiveDate: string;
  TerminationDate?: string | null;
}

export interface DefineTestResultsDonorBulkUpsertDto {
  Records: DefineTestResultsDonorUpsertItemDto[];
}

export interface DefineTestResultsDonorBulkUpsertResultDto {
  TotalRecords: number;
  CreatedCount: number;
  UpdatedCount: number;
  FailureCount: number;
  SuccessCount: number;
  Success: boolean;
  Message?: string;
}

// Table display model for donor test results
export interface DonorTestResultModel {
  testId: string;
  chapterId: string;
  resultCode: string;
  interdiction1: string | null;
  interdiction2: string | null;
  interdiction3: string | null;
  effectiveDate: Date | string | null;
  terminationDate: Date | string | null;
  modificationDate: Date | string | null;
  auditKey: number;
}

// Request params for table data
export interface DonorTestResultRequestParams {
  testId?: string;
  searchKeyword?: string;
  interdiction?: string;
  effectiveDatePeriod?: 'After' | 'Before';
  effectiveDate?: Date | string;
  terminationDatePeriod?: 'After' | 'Before';
  terminationDate?: Date | string;
  sort?: string;
}

// Filter value model
export interface DonorTestResultFilterValue {
  interdiction: string | null;
  effectiveDatePeriod: 'After' | 'Before' | null;
  effectiveDate: Date | string | null;
  terminationDatePeriod: 'After' | 'Before' | null;
  terminationDate: Date | string | null;
}

// Edit model for inline table editing
export interface DonorTestResultEditModel {
  testId: string;
  chapterId: string;
  resultCode: string;
  interdiction1: string | null;
  interdiction2: string | null;
  interdiction3: string | null;
  effectiveDate: Date | null;
  terminationDate: Date | null;
  auditKey: number;
  errors?: { [key: string]: string };
  isDirty?: boolean;
}
