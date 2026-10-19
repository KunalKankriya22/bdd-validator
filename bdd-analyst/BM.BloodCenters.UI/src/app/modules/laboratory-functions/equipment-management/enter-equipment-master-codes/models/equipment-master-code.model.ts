export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  statusCode?: number;
  data?: T[];
  total?: number;
}

export interface CodeTypeDto {
  code: string;
  codeDesc: string;
}

export interface UserGroupDto {
  grpId: string;
  descrip: string;
}

export interface EquipmentMasterCodeDto {
  codeType: string;
  code: string;
  codeDesc: string;
  effDate: string | null;
  termDate: string | null;
  restrictEdit: string | null;
  modifiedBy: string | null;
  lastModifiedDate: string | null;
}

export interface CreateEquipmentMasterCodeRequest {
  codeType: string;
  code: string;
  codeDesc: string;
  effDate: string | null;
  termDate: string | null;
  restrictEdit: string | null;
}

export interface UpdateEquipmentMasterCodeRequest {
  codeDesc: string;
  effDate: string | null;
  termDate: string | null;
  restrictEdit: string | null;
}

export interface EquipmentMasterCodeFilter {
  effectiveDate?: Date;
  terminationDate?: Date;
  effectiveDatePeriod?: 'BEFORE' | 'AFTER';
  terminationDatePeriod?: 'BEFORE' | 'AFTER';
  userGroup?: string;
}
