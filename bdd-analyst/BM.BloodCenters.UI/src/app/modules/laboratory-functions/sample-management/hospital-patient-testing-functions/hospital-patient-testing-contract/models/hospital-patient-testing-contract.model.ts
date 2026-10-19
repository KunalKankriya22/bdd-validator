import { Moment } from 'moment';

// ============================================================================
// API RESPONSE MODELS (Match Backend DTOs)
// ============================================================================

export interface ReturnResult<T> {
  success: boolean;
  data?: T[];
  item?: T;
  total?: number;
  message: string;
  statusCode: number;
}

export interface AdHocTestingContract {
  contractId: string;
  chapterId: string;
  testId: string;
  testDesc: string | null;
  stopLabelFlag: 'Y' | 'N' | null;
  effDate: string;
  termDate: string | null;
  lastModifiedDate: string | null;
  programId: string | null;
}

export interface TestDropdownDto {
  testId: string;
  testDesc: string;
  testGroup: string | null;
}

export interface ContractDropdownDto {
  contractId: string;
  company: string;
}

export interface ContractLookupDto {
  contractId: string;
  company: string | null;
  centerId: string | null;
  noOfDuplicates: number | null;
  effDate: string | null;
  termDate: string | null;
}

// ============================================================================
// REQUEST MODELS (Sent to Backend)
// ============================================================================

export interface AdHocTestingContractQueryDto {
  take?: number;
  skip?: number;
  chapterId?: string;
  chapterLocalDate?: string;
  testId?: string;
  stopLabelFlag?: 'Y' | 'N';
  searchKeyword?: string;
  sortColumn?: 'TestId' | 'EffDate' | 'TermDate';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateAdHocTestingContractRequest {
  contractId: string;
  testId: string;
  stopLabelFlag?: 'Y' | 'N';
  effDate: string;
  termDate?: string;
}

export interface UpdateAdHocTestingContractRequest {
  stopLabelFlag?: 'Y' | 'N';
  effDate: string;
  termDate?: string;
}

// ============================================================================
// FRONTEND MODELS - TABLE DISPLAY
// ============================================================================

export interface AdHocTestingContractTableModel {
  contractId: string;
  chapterId: string;
  testId: string;
  testDesc: string;
  stopLabelFlag: 'Y' | 'N' | null;
  effDate: string;
  termDate: string | null;
  lastModifiedDate: string;
  programId: string | null;
}

export interface TestingContractTableModel {
  contractId: string;
  customerType: string;
  chapterId: string;
  description: string;
  unitScheme: string;
  effDate: string;
  termDate: string | null;
}

// ============================================================================
// FRONTEND MODELS - CONTRACT DETAIL VIEW
// ============================================================================

export interface TestingContractDetail {
  contractId: string;
  company: string;
  addressId: number;
  address: string;
  addr1: string;
  addr2: string;
  addr3: string;
  city: string;
  stateCode: string;
  zip: string;
  country: string;
  intFlag: string;
  phoneNumber: string;
  fax: string;
  internationalPhoneNumber: string;
  internationalFax: string;
  chapterId: string;
  chapterDescription: string;
  taxIdForm: string;
  unitScheme: string;
  centerId: string;
  unitIdPattern: string;
  ediInput: string;
  resultsInd: string;
  confirmTest: string;
  redTubeCount: number;
  purpleTubeCount: number;
  effDate: string;
  termDate: string | null;
  lastModifiedDate: string | null;
}

export interface ContractContact {
  contactId: number;
  customerId: string;
  instId: string;
  contactType: string;
  contactTypeDesc: string;
  lastName: string;
  firstName: string;
  title: string;
  phoneNumber: string;
  faxNumber: string;
  emailId: string;
  lastModifiedDate: string | null;
}

// ============================================================================
// FRONTEND MODELS - FORMS
// ============================================================================

export interface AdHocTestingContractFormValue {
  testId: string;
  testDesc: string;
  stopLabelFlag: 'Y' | 'N' | null;
  effDate: Moment | null;
  termDate: Moment | null;
}

export interface CustomerContactInfoFormValue {
  internationalAddress: boolean;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  city: string;
  state: string;
  postalZip: string;
  country: string;
  phoneNumber: string;
  fax: string;
  internationalPhoneNumber: string;
  internationalFax: string;
}

export interface ContractInfoFormValue {
  chapterId: string;
  chapterDescription: string;
  taxIdForm: string;
  unitScheme: string;
  centerId: string;
  unitIdPattern: string;
  ediInput: string;
  resultsInd: string;
  confirmTest: string;
  redTubeCount: number | null;
  purpleTubeCount: number | null;
  effDate: Moment | null;
  termDate: Moment | null;
  modifiedDate: string | null;
}

export interface ContactInfoFormValue {
  contactType: string;
  lastName: string;
  firstName: string;
  title: string;
  phoneNumber: string;
  faxNumber: string;
  emailId: string;
}

export interface ContractFilterModel {
  contractId: string | null;
  contractType: string | null;
  effDatePeriod: 'After' | 'Before';
  effDate: Moment | null;
  termDatePeriod: 'After' | 'Before';
  termDate: Moment | null;
}

// ============================================================================
// SEARCH BAR MODELS
// ============================================================================

export interface ContractSearchCriteria {
  showTerminated: boolean;
  contractId: string | null;
  company: string | null;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// ============================================================================
// LOOKUP MODELS
// ============================================================================

export interface LookUp {
  key: string;
  value: string;
}

export interface LookUpWithDescription {
  key: string;
  value: string;
  description: string;
}

export interface ContractLookup {
  contractId: string;
  description: string;
  contractType?: string;
}

export interface DropdownOption {
  code: string;
  description: string;
}
