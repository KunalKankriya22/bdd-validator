// Backend API Response
export interface InstitutionApiResponse {
  INST_ID: string;
  INST_NAME: string;
  INST_SHORT_NAME: string;
  ADDRESS_ID: number;
  PRINT_HDR: string;
  SYSTEM_NAME: string;
  CODABAR_UNIT_SCHEME: string | null;
  ALPHA_NUMERIC?: string | null; // NEW: HL7 Scheme
  TAX_ID?: string | null;
  REG_NO?: string | null;
  LIC_NO?: string | null;
  CONTRACT_PREFIX?: string | null;
  PROGRAM_ID: string;
  AUDIT_KEY: number;
  EFF_DATE: string;
  TERM_DATE?: string | null; // NEW: Termination Date
  LAST_MODIFIED_DATE: string;
  LAST_MODIFIED_BY?: string | null;

  // Address fields
  ADDR_1: string;
  ADDR_2?: string | null;
  ADDR_3?: string | null;
  CITY: string;
  STATE_CODE?: string | null;
  ZIP: string;
  COUNTRY: string;
  PHONE_NUMBER?: string | null;
  INT_PHONE_NUMBER?: string | null;
  FAX_NUMBER?: string | null;
  INT_FLAG: string; // 'Y' or 'N'
  TELEX_NUMBER?: string | null;
}

// Frontend version - camelCase (after conversion)
export interface InstitutionApiResponseCamel {
  instId: string;
  instName: string;
  instShortName: string;
  addressId: number;
  printHdr: string;
  systemName: string;
  codabarUnitScheme: string | null;
  alphaNumeric?: string | null; // NEW: HL7 Scheme
  taxId?: string | null;
  regNo?: string | null;
  licNo?: string | null;
  contractPrefix?: string | null;
  programId: string;
  auditKey: number;
  effDate: string;
  termDate?: string | null; // NEW: Termination Date
  lastModifiedDate: string;
  lastModifiedBy?: string | null;

  // Address fields
  addr1: string;
  addr2?: string | null;
  addr3?: string | null;
  city: string;
  stateCode?: string | null;
  zip: string;
  country: string;
  phoneNumber?: string | null;
  intPhoneNumber?: string | null;
  faxNumber?: string | null;
  intlFaxNo?: string | null;
  intFlag: string;
  telexNumber?: string | null;
}

// Backend API Request for Create/Update
export interface CreateInstitutionRequest {
  // Required fields
  INST_ID: string;
  INST_NAME: string;
  INST_SHORT_NAME: string;
  PRINT_HDR: string;
  SYSTEM_NAME: string;
  CONTRACT_PREFIX: string;
  PROGRAM_ID: string;

  // Registration Info - Optional fields per FMB
  CODABAR_UNIT_SCHEME: string | null;
  REG_NO?: string | null; // Optional per FMB
  LIC_NO?: string | null;
  EFF_DATE: string | null;

  // Address - Required fields
  ADDR_1: string;
  ADDR_2?: string | null;
  ADDR_3?: string | null;
  CITY: string;
  STATE_CODE?: string | null; // Required if INT_FLAG = 'N'
  ZIP: string;
  COUNTRY: string;

  // Contact - Optional fields
  PHONE_NUMBER?: string | null;
  INT_PHONE_NUMBER?: string | null;
  FAX_NUMBER?: string | null;
  TELEX_NUMBER?: string | null;

  INT_FLAG: 'Y' | 'N';
}

// Backend API Request for Update 
export interface UpdateInstitutionRequest extends CreateInstitutionRequest {
}
