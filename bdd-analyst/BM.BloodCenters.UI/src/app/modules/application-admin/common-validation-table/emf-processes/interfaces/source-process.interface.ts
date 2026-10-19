export interface SourceProcess {
  processCode: string;
  processSeq: number;
  processAt?: string;
  lookingFor?: string;
  dataTableName?: string;
  dataColumnName?: string;
  sqlOper?: string;
  response?: string;
  sqlStmt?: string;
  paramFlag?: string;
  programId?: string;
  insertDate: string;
  insertUser: string;
  auditKey: number;
}

export interface SourceProcessDto {
  processCode: string;
  processSeq: number;
  processAt?: string;
  lookingFor?: string;
  dataTableName?: string;
  dataColumnName?: string;
  sqlOper?: string;
  response?: string;
  sqlStmt?: string;
  paramFlag?: string;
  programId?: string;
  insertDate: string;
  insertUser: string;
  auditKey: number;
  targetProcesses: TargetProcessDto[];
}

export interface TargetProcessDto {
  processCode: string;
  processAt?: string;
  actionSeq: string;
  actionCode: string;
  actionOn?: string;
  actionValue?: string;
  dataTableName?: string;
  dataColumnName?: string;
  sqlOper?: string;
  response?: string;
  processOrder?: string;
  altProcessOrder?: string;
  parentActionSeq?: string;
  actionFncs?: string;
  programId?: string;
  insertDate: string;
  insertUser: string;
  auditKey: number;
}

export interface CreateSourceProcessRequestDto {
  processCode: string;
  processSeq: number;
  processAt?: string;
  lookingFor?: string;
  dataTableName?: string;
  dataColumnName?: string;
  sqlOper?: string;
  response?: string;
  sqlStmt?: string;
  paramFlag?: string;
  programId?: string;
}

export interface UpdateSourceProcessRequestDto {
  processAt?: string;
  lookingFor?: string;
  dataTableName?: string;
  dataColumnName?: string;
  sqlOper?: string;
  response?: string;
  sqlStmt?: string;
  paramFlag?: string;
  programId?: string;
  auditKey: number;
}

export interface SourceProcessQueryDto {
  processCode?: string;
  processSeq?: number;
  lookingFor?: string;
  dataTableName?: string;
  dataColumnName?: string;
  sqlOper?: string;
  response?: string;
  paramFlag?: string;
  insertUser?: string;
  fromDate?: string;
  toDate?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface CreateTargetProcessRequestDto {
  processCode: string;
  actionSeq: string;
  actionCode: string;
  processAt?: string;
  actionOn?: string;
  actionValue?: string;
  dataTableName?: string;
  dataColumnName?: string;
  sqlOper?: string;
  response?: string;
  processOrder?: string;
  altProcessOrder?: string;
  parentActionSeq?: string;
  actionFncs?: string;
  programId?: string;
}

export interface UpdateTargetProcessRequestDto {
  actionSeq?: string;
  actionCode: string;
  processAt?: string;
  actionOn?: string;
  actionValue?: string;
  dataTableName?: string;
  dataColumnName?: string;
  sqlOper?: string;
  response?: string;
  processOrder?: string;
  altProcessOrder?: string;
  parentActionSeq?: string;
  actionFncs?: string;
  programId?: string;
  auditKey: number;
}

export interface TargetProcessQueryDto {
  processCode?: string;
  actionSeq?: string;
  actionCode?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}
