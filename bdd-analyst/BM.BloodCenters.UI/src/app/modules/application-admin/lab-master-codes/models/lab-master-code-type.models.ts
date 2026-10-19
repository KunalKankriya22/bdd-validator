// Request DTOs
export interface CreateLabMasterCodeTypeDto {
  codeType: string;
  description: string;
  effectiveDate: Date | string;
  terminationDate?: Date | string | null;
  changeControlFlag?: string;
}

export interface UpdateLabMasterCodeTypeDto {
  codeType: string;
  description: string;
  effectiveDate: Date | string;
  terminationDate?: Date | string | null;
}

// Response DTOs
export interface LabMasterCodeTypeEditResponse {
  code: string;
  description: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
  codeBehavior?: string;
  numericalValue?: number;
  modificationDate: Date;
}

// Display Model (for grid/table)
export interface LabMasterCodeType {
  code: string;
  description: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
  status: string;
  modificationDate?: Date;
}