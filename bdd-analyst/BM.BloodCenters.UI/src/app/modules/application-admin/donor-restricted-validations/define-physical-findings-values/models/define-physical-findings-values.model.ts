export interface LookupItem {
  key: string | null;
  value: string;
}

export interface PhysicalFindingsLookups {
  donationTypes: LookupItem[];
  procedureCodes: LookupItem[];
  physicalCodes: LookupItem[];
  interdictionCodes: LookupItem[];
  equipmentTypes: LookupItem[];
  operators?: LookupItem[];
  manualAuditFlags?: LookupItem[];
  genders?: LookupItem[];
  dataTypes?: LookupItem[];
}

export interface DefinePhysicalFindingsValuesModel {
  physicalCode: string;
  physicalCodeDescription?: string;
  dataType: string;
  minimumValue: string;
  maximumValue: string;
  operator: string;
  gender: string;  // Changed from 'sex' to match database column GENDER
  fromAge: number;
  toAge: number;
  interdiction: string;
  interdictionDescription?: string;
  equipmentType: string;
  equipmentTypeDescription?: string;
  commentsRequired: string;
  manualAuditRequired: string;
  effectiveDate: Date | string;
  terminationDate?: Date | string | null;
  donationType?: string;
  donationTypeDescription?: string;
  procedureCode?: string;
  procedureCodeDescription?: string;
}

export interface DefinePhysicalFindingsValuesParamsDto {
  searchKeyword?: string;
  donationType?: string;
  procedureCode?: string;
  operator?: string;
  interdiction?: string;
  manualAuditFindingsFlag?: string;
  equipmentType?: string;
  effectiveDate?: string;
  effectivePeriod?: string;
  terminationDate?: string;
  terminationPeriod?: string;
  sort?: 'A' | 'D';
}

export interface DefinePhysicalFindingsValuesResponse {
  data: DefinePhysicalFindingsValuesModel[];
  totalRecords: number;
}

export interface PhysicalRuleFormData {
  donationType: string;
  procedureCode: string;
  physicalCode: string;
  newProcedureCode?: string | null;
  newPhysicalCode?: string | null;
  dataType: string;
  minimumValue: string;
  maximumValue: string;
  operator: string;
  gender: string;  // Changed from 'sex' to match database column GENDER
  fromAge: number;
  toAge: number;
  interdiction: string;
  commentsRequired: string;
  manualAuditRequired: string;
  equipmentType: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
}

