export interface IdpConvRefValueDto {
  convRefId: number;
  sourceId: string;
  targetId: string;
  sourceCodeType: string;
  sourceValue: string;
  sourceTable: string | null;
  sourceColumn: string | null;
  targetCodeType: string;
  targetValue: string;
  targetTable: string | null;
  targetColumn: string | null;
  effDate: string | null;
  termDate: string | null;
  convProcCall: number | null;
}

export interface CreateIdpConvRefValueDto {
  sourceId: string;
  targetId: string;
  sourceCodeType: string;
  sourceValue: string;
  sourceTable?: string;
  sourceColumn?: string;
  targetCodeType: string;
  targetValue: string;
  targetTable?: string;
  targetColumn?: string;
  effDate?: string;
  termDate?: string;
  convProcCall?: number;
}

export interface UpdateIdpConvRefValueDto {
  sourceCodeType: string;
  sourceValue: string;
  sourceTable?: string;
  sourceColumn?: string;
  targetCodeType: string;
  targetValue: string;
  targetTable?: string;
  targetColumn?: string;
  effDate?: string;
  termDate?: string;
  convProcCall?: number;
}

export interface IdpConvRefValueQueryDto {
  sourceId: string;
  targetId: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface IdpConvLookupItemDto {
  code: string;
  description: string;
}

export interface IdpConvGridResponse {
  data: IdpConvRefValueDto[];
  totalCount: number;
}
