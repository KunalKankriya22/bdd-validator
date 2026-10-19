/**
 * Models for Internal Contract feature
 * Maps to CONTRACTS, ADDRESSES_LAB, CONTACTS, and CONTRACT_TESTS tables
 */

/**
 * Contract entity - CONTRACTS table
 */
export interface Contract {
  contractType: string;           // CHAR(2), PK - from MASTER_CODES CONTR
  contractId: string;              // CHAR(9), PK - auto-generated
  chapterId: string;               // CHAR(3), FK to CHAPTERS
  company: string;                 // CHAR(50), required
  addressId: number | null;        // NUMBER(6), FK to ADDRESSES_LAB
  taxIdForm: string | null;        // CHAR(9), numeric only
  barCodeProtocol: string;         // CHAR(1), required - BARCD lookup
  unitIdPattern: string | null;    // CHAR(1) - '=' or '&' for protocol 8 only
  ediInputInd: string | null;      // CHAR(1) - 'Y' or null
  resultOutputInd: string;         // CHAR(1) - 'R', 'B', or 'E'
  confirmTestFlag: string | null;  // CHAR(1) - 'Y' or null
  effDate: string;                 // DATE, required
  termDate: string | null;         // DATE, optional
  lastModifiedDate?: string;       // DATETIME - auto-set by backend
  programId?: string;              // CHAR(30) - audit trail
  chapterName?: string;            // Chapter name from lookup - populated by backend
}

/**
 * Address entity - ADDRESSES_LAB table
 */
export interface Address {
  addressId?: number | null;       // NUMBER(6), PK - auto-generated
  addressLine1?: string;           // CHAR(50)
  addressLine2?: string | null;    // CHAR(50)
  city?: string;                   // CHAR(50)
  stateCode?: string | null;       // CHAR(2) - required for domestic
  zipCode?: string | null;         // CHAR(10)
  country?: string | null;         // CHAR(50)
  intFlag?: string | null;         // CHAR(1) - 'Y' for international
  // Backend DTO properties (different naming)
  addr1?: string;
  addr2?: string | null;
  addr3?: string | null;
  zip?: string | null;
  phoneNumber?: string | null;
  intPhoneNumber?: string | null;
  telexNumber?: string | null;
  faxNumber?: string | null;
}

/**
 * Contact entity - CONTACTS table
 */
export interface Contact {
  contactId: number | null;        // NUMBER(6), PK - from sequence
  contractId?: string;             // CHAR(9), FK to CONTRACTS
  chapterId?: string;              // CHAR(4)
  contactType: string;             // CHAR(1) - 'C'=Contract, 'I'=Institution
  contactLastName: string;         // CHAR(50), required
  contactFirstName: string;        // CHAR(50), required
  contactTitle: string | null;     // CHAR(30)
  phoneNumber?: string | null;     // CHAR(12) - 999-999-9999
  faxNumber?: string | null;       // CHAR(12) - 999-999-9999
  lastModifiedDate?: string;       // DATETIME - auto-set by backend
  programId?: string;              // CHAR(30) - audit trail
}

/**
 * Contract Test entity - CONTRACT_TESTS table
 */
export interface ContractTest {
  contractId?: string;             // CHAR(9), FK to CONTRACTS
  chapterId?: string;              // CHAR(4)
  testId: string;                  // CHAR(10), required - FK to VALID_TESTS
  stopLabelFlag: string;           // CHAR(1) - 'Y' or 'N'
  effDate: string;                 // DATE, required
  termDate: string | null;         // DATE, optional
  lastModifiedDate?: string;       // DATETIME
  programId?: string;              // CHAR(30)
  // Additional field from lookup
  testDescription?: string;        // Test description from VALID_TESTS
}

/**
 * Master Code lookup - MASTER_CODES table
 */
export interface MasterCode {
  codeType: string;                // Code type (CONTR, BARCD, etc.)
  codeValue: string;               // Code value
  codeDescription: string;         // Display description
}

/**
 * Valid Test lookup - VALID_TESTS table
 */
export interface ValidTest {
  testId: string;                  // CHAR(10), PK
  testDescription: string;         // Test name/description
  chapterId?: string;              // Chapter-specific test
  testGroup?: string;              // Test group (AG, ABORH, etc.)
  effDate?: string;                // Effective date
  termDate?: string | null;        // Termination date
}

/**
 * State lookup
 */
export interface State {
  stateCode: string;               // Two-letter state code
  stateName: string;               // Full state name
}

/**
 * Country lookup
 */
export interface Country {
  countryCode: string;             // Country code
  countryName: string;             // Full country name
}

/**
 * Combined contract with all related data
 */
export interface ContractWithDetails {
  contract: Contract;
  address: Address | null;
  contacts: Contact[];
  tests: ContractTest[];
}

/**
 * Request DTO for creating/updating a contract
 */
export interface SaveContractRequest {
  contract: Contract;
  address: Address | null;
  contacts: Contact[];
  tests: ContractTest[];
  // User context fields
  loggedInUserName: string;
  chapterId: string;
  programId: string;
}

/**
 * Response DTO for contract save
 */
export interface SaveContractResponse {
  contractId: string;              // Generated contract ID
  message: string;
}

/**
 * Request DTO for getting contract by ID
 */
export interface GetContractRequest {
  contractId: string;
  chapterId: string;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode: number;
  data?: T;
  item?: T;  // Single item response (used by create/update)
  total?: number;
  errorCode?: string;
  error?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * Result output indicator options
 */
export interface ResultOutputOption {
  value: string;
  label: string;
}

/**
 * Stop label flag options
 */
export interface StopLabelFlagOption {
  value: string;
  label: string;
}

/**
 * Contact type options
 */
export interface ContactTypeOption {
  value: string;
  label: string;
}

/**
 * Contract list item - for main screen DataTable
 */
export interface ContractListItem {
  contractId: string;
  contractType: string;
  chapterId: string;
  chapterName: string;           // From CHAPTERS lookup
  company: string;
  effDate: string;
  termDate: string | null;
  lastModifiedDate: string;
  testCount?: number;             // Count of associated tests
  contactCount?: number;          // Count of associated contacts
}

/**
 * Parameters DTO for list filtering/searching
 */
export interface InternalContractParamsDto {
  searchKeyword?: string;         // Search by company or contract ID
  chapterId?: string;             // Filter by chapter
  contractType?: string;          // Filter by contract type
  effectiveDate?: string;         // YYYY-MM-DD format
  effectivePeriod?: 'Before' | 'After';  // Before or After effective date
  terminationDate?: string;       // YYYY-MM-DD format
  terminationPeriod?: 'Before' | 'After';  // Before or After termination date
  sort?: 'A' | 'D';               // Ascending or Descending (default: A)
}

/**
 * List response from API
 */
export interface InternalContractListResponse {
  data: ContractListItem[];
  total: number;
  totalRecords: number;  // Alias for total
}
