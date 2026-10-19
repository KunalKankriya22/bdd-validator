export interface AntigenGroupTest {
  testId: string;
  description: string;
  result: string;
  effDate: Date | string;
  termDate: Date | string | null;
  modificationDate: Date | string | null;
  antigenGroupCode?: string;
}

export interface AntigenGroupDropdown {
  code: string;
  description: string;
}

export interface AntigenGroupQueryParams {
  antigenGroupCode?: string;
  testId?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface CreateAntigenGroupTestDto {
  antigenGroupCode: string;
  testId: string;
  testResult: string;
  effDate: string;
  termDate: string | null;
}

export interface UpdateAntigenGroupTestDto {
  testResult: string;
  effDate: string;
  termDate: string | null;
}

export interface LookUp {
  key: string;
  value: string;
}

export interface AntigenGroupDefinitionApiDto {
  antigenGroup: string;
  testId: string;
  testDesc: string;
  testResult: string;
  effDate: string;
  termDate: string | null;
  lastModifiedDate: string | null;
  programId: string;
}

export interface AntigenGroupLookupApiDto {
  code: string;
  codeDesc: string;
}

export interface TestIdLookupApiDto {
  testId: string;
  testDesc: string;
}

export interface TestResultLookupApiDto {
  resultStatus: string;
  codeDesc: string;
}

export interface CombinationNumberDropdown {
  matrixId: number | 'NEW';
  rarityPercent: number | null;
  antigenCombination?: string | null;
}

export interface AntigenRarityTest {
  testId: string;
  description: string;
  result: string;
  effDate: Date | string;
  termDate: Date | string | null;
  modificationDate: Date | string | null;
  matrixId?: number;
}

export interface AntigenRarityHeader {
  matrixId: number;
  rarityPercent: number;
  antigenCombination: string;
  effDate: Date | string;
  termDate: Date | string | null;
  lastModifiedDate: Date | string | null;
}

export interface AntigenRarityDetail {
  matrixId: number;
  testId: string;
  testDescription: string;
  testResult: string;
  effDate: Date | string;
  termDate: Date | string | null;
  lastModifiedDate: Date | string | null;
}

export interface AntigenRarityQueryParams {
  matrixId?: number;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface CreateAntigenRarityHeaderDto {
  rarityPercent: number;
  effDate: string;
  termDate: string | null;
}

export interface CreateAntigenRarityDetailDto {
  matrixId: number;
  testId: string;
  testResult: string;
  effDate: string;
  termDate: string | null;
}

export interface UpdateAntigenRarityHeaderDto {
  rarityPercent: number;
  effDate: string;
  termDate: string | null;
}

export interface UpdateAntigenRarityDetailDto {
  testResult: string;
  effDate: string;
  termDate: string | null;
}

export interface ValidRarityCodeHeaderApiDto {
  matrixId: number;
  rarityPercent: number;
  effDate: string;
  termDate: string | null;
  lastModifiedDate: string;
  programId: string;
  auditKey: number;
  antigenCombination: string | null;
}

export interface ValidRarityCodeDetailApiDto {
  matrixId: number;
  testId: string;
  testResult: string;
  effDate: string;
  termDate: string | null;
  lastModifiedDate: string;
  programId: string;
  testDescription: string | null;
}

export interface MatrixIdLovApiDto {
  matrixId: number;
  rarityPercent: number;
  antigenCombination?: string | null;
}

export interface RarityTestIdLovApiDto {
  testId: string;
  testDesc: string;
}

export interface RarityTestResultLovApiDto {
  resultStatus: string;
  codeDesc: string;
}

export interface ReturnResult<T = unknown> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  total?: number;
  totalCount?: number;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
