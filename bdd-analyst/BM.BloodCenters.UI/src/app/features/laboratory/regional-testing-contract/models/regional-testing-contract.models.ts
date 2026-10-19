/**
 * Regional Testing Contract Models
 * Generated from API Documentation: rgicntct-api-documentation.md
 */

// ============================================================================
// Response Models
// ============================================================================

export interface RegionalTestingContract {
  contractId: string; // Unique contract identifier (auto-generated: CNT{timestamp})
  chapterId: string; // Blood center chapter identifier
  contractType: string; // Contract type (R=Regional, T=Testing, S=Supplier)
  customerName: string; // Customer organization name
  customerId: string; // Customer identifier
  exportCode: string; // Export/country code
  agreementDate: string | null; // Date of agreement (ISO 8601)
  effDate: string; // Effective start date (ISO 8601)
  termDate: string | null; // Termination date (ISO 8601, null=active)
  addressId: number | null; // Address reference ID
  contactName: string; // Contact type flag
  lastModifiedDate: string; // Last modification timestamp (ISO 8601)
  programId: string; // Program identifier (RGICNTCT)
  auditKey: number; // Audit trail key (auto-generated)
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  totalCount?: number;
}

// ============================================================================
// Request DTOs
// ============================================================================

export interface CreateRegionalTestingContractDto {
  contractType: string; // Must be R, T, or S
  customerName: string; // Required, not empty, max 100 chars
  customerId: string; // Required, not empty, max 20 chars
  exportCode: string; // Required, not empty, max 10 chars
  agreementDate?: string; // Optional, ISO 8601 format
  effDate: string; // Required, cannot be in past (create only), YYYY-MM-DD
  termDate?: string | null; // Optional, must be >= effDate, not in past, YYYY-MM-DD
  addressId?: number | null; // Optional
}

export interface UpdateRegionalTestingContractDto {
  contractType: string; // Must be R, T, or S
  customerName: string; // Required, not empty, max 100 chars
  customerId: string; // Required, not empty, max 20 chars
  exportCode: string; // Required, not empty, max 10 chars
  agreementDate?: string; // Optional, ISO 8601 format
  effDate: string; // Required, past dates allowed on update, YYYY-MM-DD
  termDate?: string | null; // Optional, must be >= effDate, YYYY-MM-DD
  addressId?: number | null; // Optional
}

export interface RegionalTestingContractQueryDto {
  contractType?: string | null; // Filter by contract type (R, T, or S)
  searchKeyword?: string | null; // Search across customer names
  showTerminated?: boolean; // Include terminated contracts (default: false)
  sortColumn?: string; // Column to sort by (EffDate, CustomerName, ContractType)
  sortOrder?: string; // ASC or DESC (default: DESC)
}

// ============================================================================
// Profile Test Models
// ============================================================================

export interface ProfileTest {
  contractId: string;
  profileSetId: string; // Max 20 chars
  profileType: string | null; // P=Primary, A=Ad Hoc, S=Secondary
  testId: string;
  description: string;
  width: number | null;
  length: number | null;
  required: string; // Y/N
  extract: string; // Y/N
  electronicFile: string; // Y/N
  effDate: string; // ISO 8601
  termDate: string | null; // ISO 8601
}

export interface CreateProfileTestDto {
  contractId: string;
  profileSetId: string;
  profileType?: string | null;
  testId: string;
  description?: string;
  width?: number | null;
  length?: number | null;
  required?: string;
  extract?: string;
  electronicFile?: string;
  effDate: string;
  termDate?: string | null;
}

export interface UpdateProfileTestDto {
  contractId: string;
  profileSetId: string;
  profileType?: string | null;
  testId: string;
  description?: string;
  width?: number | null;
  length?: number | null;
  required?: string;
  extract?: string;
  electronicFile?: string;
  effDate: string;
  termDate?: string | null;
}

// ============================================================================
// Non-Profile Test Models
// TODO: Implement when RGT_NON_PROFILE API is available
// ============================================================================

export interface NonProfileTest {
  contractId: string;
  testId: string;
  description: string;
  effDate: string;
  termDate: string | null;
}

// ============================================================================
// Customer Override Models
// TODO: Implement when customer override API is available
// ============================================================================

export interface CustomerOverride {
  contractId: string;
  reactiveTestId: string;
  description: string;
  result: string;
  plateSequence: string;
}

export interface ReactiveTest {
  testId: string;
  testResults: string;
  sequence: number;
}

export interface ConfirmatoryTest {
  testId: string;
  description: string;
  effDate: string;
  termDate: string | null;
}

// ============================================================================
// Contact Models
// TODO: Implement when contacts API is available
// ============================================================================

export interface Contact {
  contactId?: number;
  type: string; // Required
  lastName: string; // Required
  firstName: string; // Required
  title: string;
  phoneNumber: string;
  fax: string;
}

// ============================================================================
// Address Models
// TODO: Implement when addresses API is available
// ============================================================================

export interface Address {
  addressId?: number;
  addressLine1: string; // Required
  addressLine2: string;
  addressLine3: string;
  city: string;
  state: string; // Required
  postalZip: string;
  country: string; // Required
  phoneNumber: string;
  fax: string;
  internationalPhoneNumber: string;
  internationalFax: string;
  isInternational: boolean;
}

// ============================================================================
// Filter Models
// ============================================================================

export interface ContractFilter {
  clientChapter: string | null;
  periodAfter: string | null;
  periodBefore: string | null;
  effectiveDateAfter: string | null;
  effectiveDateBefore: string | null;
  terminationDateAfter: string | null;
  terminationDateBefore: string | null;
}

// ============================================================================
// Lookup Models
// TODO: Replace with API data when available
// ============================================================================

export interface ContractTypeLookup {
  code: string;
  description: string;
}

export interface TestIdLookup {
  testId: string;
  description: string;
}

export interface ChapterLookup {
  chapterId: string;
  chapterName: string;
}

// ============================================================================
// UI Models
// ============================================================================

export interface ContractFormData {
  // Step 1: Contract Details
  contractType: string;
  customerName: string;
  customerId: string;
  exportCode: string;
  agreementDate: Date | null;
  effDate: Date | null;
  termDate: Date | null;
  addressId: number | null;

  // Step 2: Contract Tests
  profileTests: ProfileTest[];
  nonProfileTests: NonProfileTest[];
  customerOverrides: CustomerOverride[];
}

export const CONTRACT_TYPES: ContractTypeLookup[] = [
  { code: 'R', description: 'Regional' },
  { code: 'T', description: 'Testing' },
  { code: 'S', description: 'Supplier' }
];

export const PROFILE_TYPES: { code: string; description: string }[] = [
  { code: 'P', description: 'Primary' },
  { code: 'A', description: 'Ad Hoc' },
  { code: 'S', description: 'Secondary' }
];

export const YES_NO_OPTIONS: { code: string; description: string }[] = [
  { code: 'Y', description: 'Yes' },
  { code: 'N', description: 'No' }
];
