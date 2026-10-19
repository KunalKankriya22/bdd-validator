/**
 * DTOs for Modify Contract for Hospital/Patient Batch API
 */

/**
 * Unit information returned from query
 */
export interface UnitDto {
  unitId: string;
  osUnitId?: string;
  collDate: Date | null;
  contractId: string | null;
  batchId: string | null;
  receivedDate: Date | null;
  chapterId: string;
  changeFlag: string;
  collIdFlag: string | null;
  qcTestFlag: string | null;
  qcTestDate: Date | null;
  externalUnitId?: string;
  internalUnitId?: string;
  oldProfile?: string;
  newProfile?: string;
}

/**
 * Request to query contract batch
 */
export interface QueryContractBatchRequestDto {
  oldContractId: string; // Required, max 10 chars
  oldBatchId: string; // Required, max 20 chars
  oldRcvdCollDate: Date; // Required
}

/**
 * Response from query contract batch
 */
export interface QueryContractBatchResponseDto {
  oldContractId: string;
  oldBatchId: string;
  oldRcvdCollDate: Date;
  oldContractType: string;
  oldProfileSetId: string;
  oldContractDescription?: string;
  units: UnitDto[];
  totalUnits: number;
}

/**
 * Request to validate new contract
 */
export interface ValidateContractRequestDto {
  newContractId: string; // Required, max 10 chars
  newBatchId?: string; // Optional, max 20 chars
  newRcvdCollDate: Date; // Required
  newContractType: string; // Required, must be 'IN', 'TS', or 'RG'
}

/**
 * Response from validate contract
 */
export interface ValidateContractResponseDto {
  isValid: boolean;
  profileSetId: string;
  contractType: string;
  contractDescription?: string;
  message: string;
}

export interface ReceivedDateOption {
  receivedDate: Date;
}

/**
 * Unit change information for modification
 */
export interface UnitChangeDto {
  unitId: string;
  collDate: Date;
  chapterId: string;
  changeFlag: string; // 'Y' to modify, 'N' to skip
}

/**
 * Old contract info for modification
 */
export interface OldContractInfo {
  oldContractId: string;
  oldBatchId: string;
  oldRcvdCollDate: Date;
  oldContractType: string;
  oldProfileSetId?: string;
}

/**
 * New contract info for modification
 */
export interface NewContractInfo {
  newContractId: string;
  newBatchId?: string; // Auto-generated if null
  newRcvdCollDate: Date;
  newContractType: string;
  newProfileSetId?: string;
}

/**
 * Request to modify contract batch
 */
export interface ModifyContractBatchRequestDto {
  oldContractInfo: OldContractInfo;
  newContractInfo: NewContractInfo;
  units: UnitChangeDto[]; // Array of units with changeFlag
}

/**
 * Response from modify contract batch
 */
export interface ModifyContractBatchResponseDto {
  success: boolean;
  message: string;
  generatedBatchId?: string;
  unitsModified: number;
  unitsSkipped: number;
  warnings: string[];
}

/**
 * Contract dropdown option
 */
export interface ContractOption {
  contractId: string;
  description: string;
  contractType: string;
}

/**
 * Batch dropdown option
 */
export interface BatchOption {
  batchId: string;
  description?: string;
}

/**
 * Profile Set dropdown option
 */
export interface ProfileSetOption {
  profileSetId: string;
  description?: string;
}
