// Main data model for Valid Donation Type Procedure Code
export interface ValidDonationTypeProcedureCodeModel {
  DonationType?: string;
  ProcedureCode?: string;
  AttribGroup?: string;
  AttribCode?: string;
  EffDate?: string;
  TermDate?: string | null;
  SortSequence?: number;
  LastModifiedDate?: string;
  ProgramId?: string;
  Status?: string;
}

// API response model (camelCase from backend)
export interface ValidDonationTypeProcedureCodeApiModel {
  donationType?: string;
  procedureCode?: string;
  attribGroup?: string;
  attribCode?: string;
  effDate?: string;
  termDate?: string | null;
  sortSequence?: number;
  lastModifiedDate?: string;
  programId?: string;
  status?: string;
}

// Request DTO for fetching data
export interface ValidDonationTypeProcedureCodeParamsDto {
  searchKeyword?: string | null;
  donationType?: string | null;
  procedureCode?: string | null;
  attributeGroup?: string | null;
  attributeCode?: string | null;
  period?: string | null;
  effectiveDate?: string | null;
  terminationDate?: string | null;
  terminationPeriod?: string | null;
  pageNumber?: number;
  pageSize?: number;
  sort?: 'A' | 'D';
}

// Filter values
export interface DonationTypeProcedureCodeFilterValue {
  donationType: string | null;
  procedureCode: string | null;
  attributeGroup: string | null;
  attributeCode: string | null;
  period: string | null;
  effectiveDate: Date | null;
  terminationDate: Date | null;
  terminationPeriod: string | null;
}

// Add DTO
export interface AddDonationTypeProcedureCodeDto {
  donationType: string;
  procedureCode: string;
  attribGroup: string;
  attribCode: string;
  effDate: string;
  termDate?: string | null;
  sortSequence: number;
}

// Update DTO
export interface UpdateDonationTypeProcedureCodeDto {
  donationType: string;
  procedureCode: string;
  attribGroup: string;
  attribCode: string;
  effDate: string;
  termDate?: string | null;
}

// Filter chip
export interface FilterChip {
  key: string;
  label: string;
  value: any;
  removable?: boolean;
}

// Lookup types for dropdowns
export interface DonationTypeLookup {
  code: string;
  description: string;
}

export interface ProcedureCodeLookup {
  code: string;
  description: string;
}

export interface AttributeGroupLookup {
  code: string;
  description: string;
}

export interface AttributeCodeLookup {
  code: string;
  description: string;
}

// Filter LOV response
export interface DonationTypeProcedureCodeFilterLov {
  donationTypes?: DonationTypeLookup[];
  procedureCodes?: ProcedureCodeLookup[];
  attributeGroups?: AttributeGroupLookup[];
}

// API Response
export interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

// API Response for Add/Update operations
export interface ApiOperationResponse {
  success: boolean;
  message: string;
}

// Dropdown options response from getAllDropdownOptions
export interface DropdownOptionsResponse {
  donationTypes: DonationTypeLookup[];
  procedureCodes: ProcedureCodeLookup[];
  attributeGroups: AttributeGroupLookup[];
}

// Attribute codes response from getAttributeCodes
export interface AttributeCodesResponse {
  data: AttributeCodeLookup[];
}

// Period options for filter
export const PERIOD_OPTIONS = [
  { value: 'After', label: 'After' },
  { value: 'Before', label: 'Before' }
];
