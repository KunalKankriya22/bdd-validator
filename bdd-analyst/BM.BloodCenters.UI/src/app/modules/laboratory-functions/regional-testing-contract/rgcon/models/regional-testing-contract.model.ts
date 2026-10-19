/**
 * Models and DTOs for Regional Testing Contract Profile Management
 * Based on API Documentation: MLT-12617
 * Database Table: SBCSYS.RGT_CONTRACT_PROFILE
 */

/**
 * Profile Type Enumeration
 * P = Procedure/Primary
 * A = Analyte/Ad Hoc
 * S = Screening/Secondary
 */
export type ProfileType = 'P' | 'A' | 'S';

/**
 * Response DTO: Regional Testing Contract Profile
 * Used for GET operations and list display
 */
export interface RegionalTestingContractProfileDto {
  contractId: string;
  profileType: ProfileType;
  profileSetId: string;
  effDate: string; // ISO date string from API
  termDate: string | null; // ISO date string or null

  // Display-only fields (computed or joined from other tables)
  facilityName?: string;
  clientChapter?: string;
}

/**
 * Create DTO: Used for POST /api/regional-testing-contract-profiles
 */
export interface CreateRegionalTestingContractProfileDto {
  contractId: string; // Required, max 9 chars
  profileType?: ProfileType; // Optional
  profileSetId: string; // Required, max 20 chars
  effDate: string; // Required, YYYY-MM-DD format
  termDate?: string; // Optional, YYYY-MM-DD format
}

/**
 * Update DTO: Used for PUT /api/regional-testing-contract-profiles/{contractId}/{profileSetId}
 */
export interface UpdateRegionalTestingContractProfileDto {
  profileType?: ProfileType; // Optional
  profileSetId: string; // Required, max 20 chars
  effDate: string; // Required, YYYY-MM-DD format
  termDate?: string; // Optional, YYYY-MM-DD format
}

/**
 * Query DTO: Used for filtering and searching
 * POST /api/regional-testing-contract-profiles/{take}/{skip}
 */
export interface RegionalTestingContractProfileQueryDto {
  contractId?: string;
  profileType?: string;
  profileSetId?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';

  // Additional filter criteria (UI-specific)
  clientChapter?: string;
  showTerminated?: boolean;
  effectiveDateAfter?: string;
  effectiveDateBefore?: string;
  terminationDateBefore?: string;
}

/**
 * API Response Wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
  totalCount?: number;
}

/**
 * Error Response
 */
export interface ErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

/**
 * Filter Criteria (UI State)
 */
export interface FilterCriteria {
  clientChapter?: string;
  effectiveDatePeriod?: 'After' | 'Before';
  effectiveDate?: Date;
  terminationDatePeriod?: 'Before';
  terminationDate?: Date;
}

/**
 * Contract Details Form Data (Step 1 of Wizard)
 */
export interface ContractDetailsFormData {
  contractId: string;
  facilityName: string;
  clientChapter: string;
  effectiveDate: Date;
  terminationDate?: Date;
  addressDetails?: AddressDetailsFormData;
  contacts?: ContactInformationFormData[];
}

/**
 * Address Details Form Data
 */
export interface AddressDetailsFormData {
  isInternational: boolean;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  city?: string;
  state?: string;
  postalZip?: string;
  country: string;
  phoneNumber?: string;
  fax?: string;
  internationalPhoneNumber?: string;
  internationalFax?: string;
}

/**
 * Contact Information Form Data
 */
export interface ContactInformationFormData {
  type: string; // 'Facility' | 'Laboratory' | 'Billing' | 'Other'
  lastName: string;
  firstName: string;
  title?: string;
  phoneNumber?: string;
  fax?: string;
}

/**
 * Profile Test Data (for Profile Tests table in Step 2)
 * Database Table: CONTRACT_TESTS
 */
export interface ProfileTestData {
  testId: string;
  description: string;
  width: number | null;
  length: number | null;
  required: 'Y' | 'N';
  extract: 'Y' | 'N';
  electronicFile: 'Y' | 'N';
  effectiveDate: string;
  terminationDate: string | null;
  isNew?: boolean;
}

/**
 * Profile Set Data (grouping of profile tests)
 * Database Table: RGT_CONTRACT_PROFILE
 */
export interface ProfileSetData {
  profileSetId: string;
  profileType: ProfileType | null;
  effectiveDate: string; // Profile set effective date
  terminationDate: string | null;
  tests: ProfileTestData[];
}

/**
 * Non-Profile Test Data
 * Database Table: RGT_NON_PROFILE
 */
export interface NonProfileTestData {
  testId: string;
  description: string;
  effectiveDate: string;
  terminationDate: string | null;
  lastModifiedUser: string;
  lastModifiedDate: string;
}

/**
 * Confirmatory Override Test (child row in Customer Override section)
 * Database Table: VALID_CUSTOMER_CONFIRM_TESTS
 */
export interface ConfirmatoryOverrideTestData {
  testId: string;
  description: string;
  effectiveDate: string;
  terminationDate: string | null;
  isNew?: boolean;
}

/**
 * Customer Override of Confirmatory Tests Data (header + child tests)
 * Database Table: VALID_CUSTOMER_CONFIRM_TESTS
 */
export interface CustomerOverrideData {
  reactiveTestId: string;
  description: string;
  result: string;
  plateSequence: 'I' | 'R';
  confirmatoryTests: ConfirmatoryOverrideTestData[];
}

/**
 * Reactive Test Result (for Customer Override Query Panel)
 */
export interface ReactiveTestResult {
  testId: string;
  testResults: string;
  sequence: string;
}

/**
 * Confirmatory Test Result (for Customer Override Query Panel)
 */
export interface ConfirmatoryTestResult {
  testId: string;
  description: string;
  effectiveDate: string;
  terminationDate: string | null;
}

/**
 * Test Group Lookup (for Select Multiple Test panel)
 */
export interface TestGroupLookup {
  groupId: string;
  description: string;
}

/**
 * Test By Group Lookup (for Select Multiple Test panel table)
 */
export interface TestByGroupLookup {
  testId: string;
  testGroup: string;
  description: string;
}

/**
 * Input data for Select Multiple Test Panel
 */
export interface SelectMultipleTestPanelData {
  excludedTestIds: string[];
  contractId: string;
}

/**
 * Input data for Confirmatory Tests Query Panel
 */
export interface ConfirmatoryQueryPanelData {
  contractId: string;
  reactiveTests: ReactiveTestResult[];
  confirmatoryTests: ConfirmatoryTestResult[];
}

/**
 * Lookup/Dropdown Data Interfaces
 */
export interface ChapterLookup {
  chapterId: string;
  chapterName: string;
}

export interface TestLookup {
  testId: string;
  description: string;
  testGroup?: string;
}

export interface ResultLookup {
  resultCode: string;
  resultDescription: string;
}

export interface StateLookup {
  stateCode: string;
  stateName: string;
}

export interface CountryLookup {
  countryCode: string;
  countryName: string;
}

/**
 * Contact Type Options (Static)
 */
export const CONTACT_TYPES = [
  { value: 'Facility', label: 'Facility' },
  { value: 'Laboratory', label: 'Laboratory' },
  { value: 'Billing', label: 'Billing' },
  { value: 'Other', label: 'Other' }
] as const;

/**
 * Profile Type Options (Static)
 */
export const PROFILE_TYPES = [
  { value: 'P', label: 'Primary/Procedure' },
  { value: 'A', label: 'Ad Hoc/Analyte' },
  { value: 'S', label: 'Secondary/Screening' }
] as const;

/**
 * Show Terminated Options (Static)
 */
export const SHOW_TERMINATED_OPTIONS = [
  { value: 'No', label: 'No' },
  { value: 'Yes', label: 'Yes' }
] as const;

/**
 * Yes/No Dropdown Options (for Profile Tests table columns)
 */
export const YES_NO_OPTIONS = [
  { value: 'Y', label: 'Yes' },
  { value: 'N', label: 'No' }
] as const;

/**
 * Plate Sequence Display Map
 */
export const PLATE_SEQUENCE_MAP: Record<string, string> = {
  'I': 'Initial tests',
  'R': 'Repeat tests'
};

/**
 * Contract DTO: Response from contract list/search API
 * Based on API Documentation: MLT-12608, MLT-12617
 */
export interface ContractDto {
  contractId: string;
  chapterId: string;
  contractType: string;
  customerName: string;
  customerId: string | null;
  exportCode: string | null;
  agreementDate: string | null;
  effDate: string;
  termDate: string | null;
  addressId: number | null;
  contactName: string | null;
  lastModifiedDate: string | null;
  programId: string | null;
  auditKey: number | null;
  sTermFlag: string | null;
  altELevel: number | null;
  dispChkdigitFlag: string | null;
  taxIdForm: string | null;
  unitIdType: string;
  sEditRates: string | null;
  resultOutputInd: string;
  confirmTestFlag: string | null;
  odReportingMethod: string | null;
  ediInputInd: string | null;
  barCodeProtocol: string | null;
  copyIsbtFlag: string | null;
  noOfDuplicates: number | null;
  nonProfileEf: string | null;
  contactType: string;
  cbcChapterId: string | null;
  altSeLevel: number | null;
  poNo: string | null;
  plateCapacity: number | null;
  unitIdPattern: string | null;
  resultsMethod: string | null;
  centerId: string | null;
  dupCheckinFlag: string | null;
  profileSeqNo: number | null;
  chapterName?: string;
  address?: {
    addressId: number;
    addr1: string;
    addr2?: string;
    addr3?: string;
    city: string;
    stateCode: string;
    zip: string;
    country: string;
    phoneNumber?: string;
    intPhoneNumber?: string;
    telexNumber?: string;
    faxNumber?: string;
  } | null;
  profiles?: ContractProfileDto[];
  chapters?: ContractChapterDto[];
  confirmTests?: ContractConfirmTestDto[];
  contacts?: ContractContactDto[];
  nonProfileTests?: ContractNonProfileTestDto[];
  contractTests?: ContractTestDto[];
}

/**
 * Contract Profile DTO (child entity)
 */
export interface ContractProfileDto {
  contractId: string;
  profileType: string;
  profileSetId: string;
  effDate: string;
  termDate: string | null;
  auditKey: number | null;
  programId: string | null;
}

/**
 * Contract Chapter DTO (child entity)
 */
export interface ContractChapterDto {
  contractId: string;
  chapterId: string;
  effDate: string; // Chapter-specific effective date
  termDate?: string | null; // Chapter-specific termination date
  auditKey: number | null;
  programId: string | null;
}

/**
 * Contract Confirm Test DTO (child entity)
 * Structure for API: reactiveTestId, reactiveTestResult, reactivePlateSeq, confirmTestId, effDate, termDate
 */
export interface ContractConfirmTestDto {
  reactiveTestId: string;
  reactiveTestResult: string; // POS, NEG, etc. from GET /reactive-test-results/{testId}/lookup
  reactivePlateSeq: number; // Plate sequence number (0 or 1)
  confirmTestId: string;
  effDate: string; // Effective date (YYYY-MM-DD)
  termDate?: string | null; // Termination date (YYYY-MM-DD or null)
}

/**
 * Contract Contact DTO (child entity)
 */
export interface ContractContactDto {
  contactId: number;
  contractId: string;
  contactType: string;
  contactLastName: string;
  contactFirstName: string;
  contactTitle: string | null;
  phoneNumber: string | null;
  faxNumber: string | null;
  telexNumber: string | null;
}

/**
 * Contract Non-Profile Test DTO (child entity from API response)
 */
export interface ContractNonProfileTestDto {
  testId: string;
  testGroup: string;
  effDate: string;
  termDate?: string | null;
  // Additional fields that may be returned by API
  testDesc?: string;
  programId?: string | null;
  auditKey?: number | null;
  insertUser?: string | null;
  insertDate?: string | null;
}

/**
 * Contract Test DTO (detailed test configuration for profiles)
 * Used in Step 2 - Profile Tests screen
 */
export interface ContractTestDto {
  profileSetId: string;
  testId: string;
  interfaceColumn: number;
  interfaceLength?: number | null;
  stopLabelFlag: string; // Y/N
  extract: string; // Y/N
  electronicFileFlag: string; // Y/N
  effDate: string;
  termDate?: string | null;
}

/**
 * Contract Query DTO: Used for filtering and searching contract list
 * POST /regional-testing-contract/{take}/{skip}
 */
export interface ContractQueryDto {
  contractId?: string;
  contractType?: string;
  customerName?: string;
  customerId?: string;
  chapterId?: string; // Filter by chapter ID
  effDateFrom?: string; // YYYY-MM-DD format
  effDateTo?: string; // YYYY-MM-DD format
  showTerminated?: boolean;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Create Contract DTO: Used for POST /regional-testing-contract
 */
export interface CreateContractDto {
  contractType: string;
  customerName: string;
  customerId?: string;
  exportCode?: string;
  agreementDate?: string;
  effDate: string;
  termDate?: string;
  addressId?: number;
  sTermFlag?: string;
  altELevel?: number;
  dispChkdigitFlag?: string;
  taxIdForm?: string;
  unitIdType: string;
  sEditRates?: string;
  resultOutputInd: string;
  confirmTestFlag?: string;
  odReportingMethod?: string;
  ediInputInd?: string;
  barCodeProtocol?: string;
  copyIsbtFlag?: string;
  noOfDuplicates?: number;
  nonProfileEf?: string;
  contactType: string;
  cbcChapterId?: string;
  altSeLevel?: number;
  poNo?: string;
  plateCapacity?: number;
  unitIdPattern?: string;
  resultsMethod?: string;
  centerId?: string;
  dupCheckinFlag?: string;
  profileSeqNo?: number;
  address?: {
    addr1: string;
    addr2?: string;
    addr3?: string;
    city: string;
    stateCode: string;
    zip: string;
    country: string;
    phoneNumber?: string;
    intPhoneNumber?: string;
    telexNumber?: string;
    faxNumber?: string;
  };
  profiles?: Array<{
    profileType: string;
    profileSetId: string;
    effDate: string;
    termDate?: string;
  }>;
  chapters?: Array<{
    chapterId: string;
    effDate: string;
    termDate?: string;
  }>;
  confirmTests?: Array<{
    reactiveTestId: string;
    reactiveTestResult: string;
    reactivePlateSeq: number;
    confirmTestId: string;
    effDate: string;
    termDate?: string;
  }>;
  contacts?: Array<{
    contactType: string;
    contactLastName: string;
    contactFirstName: string;
    contactTitle?: string;
    phoneNumber?: string;
    faxNumber?: string;
    telexNumber?: string;
  }>;
  nonProfileTests?: Array<{
    testId: string;
    testGroup: string;
    effDate: string;
    termDate?: string;
  }>;
  contractTests?: Array<{
    profileSetId: string;
    testId: string;
    interfaceColumn: number;
    interfaceLength?: number;
    stopLabelFlag: string;
    extract: string;
    electronicFileFlag: string;
    effDate: string;
    termDate?: string;
  }>;
}

/**
 * Update Contract DTO: Used for PUT /regional-testing-contract/{contractId}
 */
export interface UpdateContractDto extends CreateContractDto {
  // Same structure as Create
}
