export interface ReturnResult<T> {
  success: boolean;
  message: string;
  error?: string;
  errorCode?: string;
  statusCode: number;
  data?: T[];
  item?: T;
  total?: number;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

export interface ContractLovItem {
  contractId: string;
  company: string;
}

export interface AddressModel {
  addressId: number;
  addr1: string;
  addr2?: string;
  addr3?: string;
  city: string;
  stateCode?: string;
  zip: string;
  country: string;
  phoneNumber?: string;
  intPhoneNumber?: string;
  telexNumber?: string;
  faxNumber?: string;
  intFlag?: string;
}

export interface ContractResponse {
  contractId: string;
  contractType: string;
  chapterId: string;
  company: string;
  addressId: number;
  taxIdForm?: string;
  barCodeProtocol: string;
  barCodeDescription?: string;
  unitIdPattern?: string;
  centerId?: string;
  ediInputInd?: string;
  resultOutputInd?: string;
  confirmTestFlag?: string;
  effDate: string;
  termDate?: string;
  lastModifiedDate: string;
  chapterName?: string;
  address?: AddressModel;
}

export interface CreateContractRequest {
  contractType: string;
  company: string;
  taxIdForm?: string;
  barCodeProtocol: string;
  unitIdPattern?: string;
  centerId?: string;
  ediInputInd?: string;
  resultOutputInd?: string;
  confirmTestFlag?: string;
  effDate?: string;
  termDate?: string;
  address?: AddressModel;
}

export interface UpdateContractRequest {
  company: string;
  taxIdForm?: string;
  barCodeProtocol: string;
  unitIdPattern?: string;
  centerId?: string;
  ediInputInd?: string;
  resultOutputInd?: string;
  confirmTestFlag?: string;
  effDate?: string;
  termDate?: string;
  address?: AddressModel;
}

export interface ContractTest {
  contractId: string;
  chapterId: string;
  testId: string;
  testDescription?: string;
  stopLabelFlag: string;
  effDate: string;
  termDate?: string;
  lastModifiedDate: string;
  auditKey: number;
}

export interface UpsertContractTestItem {
  testId: string;
  stopLabelFlag: string;
  effDate?: string;
  termDate?: string;
  auditKey?: number;
}

export interface BulkUpsertContractTests {
  records: UpsertContractTestItem[];
}

export interface ContactModel {
  contactId: number;
  contractId: string;
  chapterId?: string;
  contactType: string;
  contactLastName: string;
  contactFirstName: string;
  contactTitle?: string;
  phoneNumber?: string;
  faxNumber?: string;
}

export interface ContactItem {
  contactId?: number;
  contactType: string;
  contactLastName: string;
  contactFirstName: string;
  contactTitle?: string;
  phoneNumber?: string;
  faxNumber?: string;
}

export interface BulkSaveContacts {
  records: ContactItem[];
}

export interface CodeDescription {
  code: string;
  description: string;
}

export interface TestLovItem {
  testId: string;
  testDescription: string;
  testGroup?: string;
  effDate: string;
  termDate?: string;
}

export interface ContractSearchRequest {
  contractId?: string;
  company?: string;
  contractType: string;
}

export interface EditableTestRow {
  testId: string;
  testDescription: string;
  stopLabelFlag: string;
  effDate: Date | null;
  termDate: Date | null;
  lastModifiedDate?: string;
  auditKey: number;
  isDirty: boolean;
  errors: { [key: string]: string };
}

export interface EditableContactRow {
  contactId: number | null;
  contactType: string;
  contactLastName: string;
  contactFirstName: string;
  contactTitle: string;
  phoneNumber: string;
  faxNumber: string;
  isDirty: boolean;
  errors: { [key: string]: string };
}
