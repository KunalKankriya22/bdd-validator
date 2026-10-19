export interface DropdownItem {
  value: string;
  label: string;
}

export type ParameterDatatype = 'NUMERIC' | 'DATETIME' | 'DEVICE' | 'REAGENT';

export interface ParmCodeDetail {
  parmCode: string;
  description: string;
  datatype: ParameterDatatype;
  relatedCode?: string | null;
  voidCode?: string | null;
  effDate?: string | null;
  termDate?: string | null;
  isAssigned?: boolean;
}

export interface AssignedParameter {
  testId?: string;
  parmType?: string;
  parmCode: string;
  parmDesc?: string | null;
  datatype?: ParameterDatatype;
  relatedCode?: string | null;
  sequence: number;
  acceptMin?: number | string | null;
  acceptMax?: number | string | null;
  effDate?: string | null;
  effTime?: string | null;
  termDate?: string | null;
  termTime?: string | null;
  tech1Reqd?: string | null;
  tech2Reqd?: string | null;
  programId?: string | null;
  lastModifiedDate?: string | null;
  isNew?: boolean;
}

export interface QueryRequest {
  testId: string;
  parmType: string;
}

export interface UpsertRecord {
  parmCode: string;
  relatedCode?: string | null;
  sequence: number;
  acceptMin?: string | null;
  acceptMax?: string | null;
  effDate: string;
  termDate?: string | null;
  isNew: boolean;
}

export interface BulkUpsertRequest {
  testId: string;
  parmType: string;
  tech1Reqd?: string;
  tech2Reqd?: string;
  records: UpsertRecord[];
}

export interface FilterCriteria {
  datatype?: ParameterDatatype;
  relatedCode?: string;
  voidCode?: string;
  effDatePeriod?: 'Before' | 'After';
  effDate?: string;
  termDatePeriod?: 'Before' | 'After';
  termDate?: string;
}

export interface ApiResponse<T = void> {
  success: boolean;
  message?: string;
  statusCode?: number;
  data?: T;
  totalCount?: number;
}
