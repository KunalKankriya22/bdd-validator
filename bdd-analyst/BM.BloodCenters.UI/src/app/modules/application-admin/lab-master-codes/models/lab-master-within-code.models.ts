// DTO for creating a new Lab Master Code
 export interface CreateLabMasterCodeDto {
  codeType: string;
  code: string;
  description: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
  sequence1?: number | null;
  sequence2?: number | null;
  sequence3?: number | null;
  numericalValue?: number | null;
  changeControlFlag?: string;
}

// DTO for updating an existing Lab Master Code
export interface UpdateLabMasterCodeDto {
  description: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
  sequence1?: number | null;
  sequence2?: number | null;
  sequence3?: number | null;
  numericalValue?: number | null;
  codeBehavior?: string; 
}

//  Response DTO for Lab Master Code edit screen
export interface LabMasterCodeEditResponseDto {
  codeType: string;
  code: string;
  description: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
  sequence1?: number | null;
  sequence2?: number | null;
  sequence3?: number | null;
  numericalValue?: number | null;
  codeBehavior?: string;
  modificationDate?: Date;
}

// Lab Master Code entity (for grid display or local state)
export interface LabMasterCode {
  codeType: string;
  codeTypeDescription: string; 
  code: string;
  description: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
  status?: string;
  sequence1?: number | null;
  sequence2?: number | null;
  sequence3?: number | null;
  numericalValue?: number | null;
  codeBehavior?: string;
  modificationDate?: Date;
}