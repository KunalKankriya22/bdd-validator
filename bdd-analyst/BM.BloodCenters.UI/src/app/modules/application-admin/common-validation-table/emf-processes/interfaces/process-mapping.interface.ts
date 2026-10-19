export interface ProcessMappingDto {
  processCode: string;
  mappingName: string;
  dataTableName?: string;
  dataColumnName?: string;
  whereClause?: string;
  sqlStmt?: string;
  programId?: string;
  insertDate?: string;
  insertUser?: string;
  auditKey?: number;
}

export interface CreateProcessMappingDto {
  processCode: string;
  mappingName: string;
  dataTableName?: string;
  dataColumnName?: string;
  whereClause?: string;
  sqlStmt?: string;
}

export interface UpdateProcessMappingDto {
  processCode: string;
  mappingName: string;
  originalMappingName?: string;  // For rename
  dataTableName?: string;
  dataColumnName?: string;
  whereClause?: string;
  sqlStmt?: string;
}

export interface ProcessMappingQueryDto {
  processCode?: string;
  mappingName?: string;
  searchText?: string;
}
