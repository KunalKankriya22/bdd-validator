import { Moment } from 'moment';

/**
 * Lab Address interface matching backend LabAddressDto
 */
export interface LabAddressDto {
  intFlag: string;
  addr1: string;
  addr2?: string | null;
  addr3?: string | null;
  city: string;
  stateCode?: string | null;
  zip: string;
  country: string;
  phoneNumber?: string | null;
  intPhoneNumber?: string | null;
  telexNumber?: string | null;
  faxNumber?: string | null;
}

/**
 * ValidRemoteTestingLab response DTO
 * Represents a valid remote testing lab record from the API
 */
export interface ValidRemoteTestingLabDto {
  testingLabId: string;
  chapterId: string;
  testingLabName: string;
  contractId: string;
  cliaNumber?: string | null;
  medicalDirector?: string | null;
  addressId?: number | null;
  effDate: string;
  termDate?: string | null;
  lastModifiedDate?: string | null;

  // Address information (joined)
  intFlag?: string | null;
  addr1?: string | null;
  addr2?: string | null;
  addr3?: string | null;
  city?: string | null;
  stateCode?: string | null;
  zip?: string | null;
  country?: string | null;
  phoneNumber?: string | null;
  intPhoneNumber?: string | null;
  telexNumber?: string | null;
  faxNumber?: string | null;
}

/**
 * Form value interface for add/edit
 * Uses Moment for date handling in form controls
 */
export interface ValidRemoteTestingLabFormValue {
  testingLabId: string | null;
  testingLabName: string | null;
  contractId: string | null;
  cliaNumber: string | null;
  medicalDirector: string | null;
  effDate: Moment | null;
  termDate: Moment | null;
  intFlag: boolean;
  addr1: string | null;
  addr2: string | null;
  addr3: string | null;
  city: string | null;
  stateCode: string | null;
  zip: string | null;
  country: string | null;
  phoneNumber: string | null;
  intPhoneNumber: string | null;
  telexNumber: string | null;
  faxNumber: string | null;
}

/**
 * Filter value interface for filter panel
 */
export interface ValidRemoteTestingLabFilterValue {
  effectiveDatePeriod?: string | null;
  effectiveDate?: string | null;
  terminationDatePeriod?: string | null;
  terminationDate?: string | null;
}

/**
 * Query parameters DTO for filtering/sorting/searching
 * Matches backend ValidRemoteTestingLabQueryDto
 */
export interface ValidRemoteTestingLabQueryDto {
  testingLabId?: string;
  testingLabName?: string;
  contractId?: string;
  city?: string;
  stateCode?: string;
  effDateFrom?: string;
  effDateTo?: string;
  termDateFrom?: string;
  termDateTo?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}

/**
 * Response DTO for list endpoint
 */
export interface ValidRemoteTestingLabResponseDto {
  data: ValidRemoteTestingLabDto[];
  totalCount: number;
}

/**
 * Create request DTO
 * Sent to CREATE endpoint
 */
export interface CreateValidRemoteTestingLabRequestDto {
  testingLabId: string;
  testingLabName: string;
  contractId: string;
  cliaNumber?: string | null;
  medicalDirector?: string | null;
  effDate: string;
  termDate?: string | null;
  address: LabAddressDto;
}

/**
 * Update request DTO
 * Sent to UPDATE endpoint
 */
export interface UpdateValidRemoteTestingLabRequestDto {
  testingLabName: string;
  contractId: string;
  cliaNumber?: string | null;
  medicalDirector?: string | null;
  effDate: string;
  termDate?: string | null;
  address: LabAddressDto;
}

/**
 * Testing Lab Lookup DTO for autocomplete/search
 * Matches Oracle Forms TEST_LAB_ID_LOV1 functionality
 */
export interface TestingLabLookupDto {
  testingLabId: string;
  testingLabName: string;
}
