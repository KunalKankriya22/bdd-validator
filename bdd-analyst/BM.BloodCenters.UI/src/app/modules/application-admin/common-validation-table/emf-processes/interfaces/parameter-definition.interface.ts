export interface ParameterDefinitionDto {
  procCode: string;
  parmNo: number;
  parmCode: string;
  parmType: 'CHAR' | 'DATE' | 'NUM';
  defaultValue?: string;
  refTable?: string;
  refColumn?: string;
  parmInout?: string;
  programId?: string;
  insertDate?: string;
  insertUser?: string;
  auditKey?: number;
}

export interface CreateParameterDefinitionDto {
  procCode: string;
  parmNo: number;
  parmCode: string;
  parmType: string;
  defaultValue?: string;
  refTable?: string;
  refColumn?: string;
}

export interface UpdateParameterDefinitionDto extends CreateParameterDefinitionDto {
  oldParmCode?: string;
}
