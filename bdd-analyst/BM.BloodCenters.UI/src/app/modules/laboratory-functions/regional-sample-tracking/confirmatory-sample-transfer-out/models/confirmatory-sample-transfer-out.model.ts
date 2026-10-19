export interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total?: number;
  errorResponse?: { errorCode: string; error: string };
  errorCode?: string;
}

export interface BoxHeaderDto {
  boxId: string;
  shipmentNo: string | null;
  facilityCode: string;
  facilityDesc: string;
  boxStatus: 'O' | 'C';
  externalFacFlag: string;
  packDate: string;
  closedDate: string | null;
  closedUser: string | null;
  unitCount: number;
  units: BoxUnitDto[] | null;
}

export interface BoxUnitDto {
  sampleSeqNo: string;
  unitId: string;
  checkDigit: string | null;
  collDate: string;
  contractId: string | null;
  sampleType: string;
  frozenFlag: string | null;
  tests: BoxUnitTestDto[];
}

export interface BoxUnitTestDto {
  testId: string;
  testDesc: string;
}

export interface FacilityDropdownDto {
  code: string;
  description: string;
  isExternal: string;
}

export interface SampleTypeDropdownDto {
  code: string;
  description: string;
}

export interface TestIdDropdownDto {
  testId: string;
  testDesc: string;
  testGroup: string;
}

export interface CreateBoxDto {
  boxId?: string | null;
  facilityCode: string;
  shipmentNo?: string | null;
}

export interface UpdateBoxDto {
  facilityCode?: string;
  shipmentNo?: string | null;
}

export interface AddUnitToBoxDto {
  unitId: string;
  collDate: string;
  sampleType: string;
  frozenFlag?: string | null;
  testIds?: string[];
}

export interface UpdateUnitInBoxDto {
  unitId: string;
  collDate: string;
  sampleType: string;
  frozenFlag?: string | null;
}

export interface AddTestToSampleDto {
  testId: string;
  facilityCode: string;
  unitId: string;
  sampleType: string;
  collDate: string;
}

export interface ValidateUnitDto {
  unitId: string;
}

export interface ValidateUnitResponseDto {
  unitId: string;
  checkDigit: string | null;
  collectionDate: string | null;
  collDate: string;
  chapterId: string | null;
  contractId: string | null;
  isValid: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  hasComponents: boolean;
  componentCount: number;
}
