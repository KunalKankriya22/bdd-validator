/**
 * Extract Test Results - TypeScript Interfaces and Models
 */

/**
 * Contract DTO - Response model for active contracts
 */
export interface ContractDto {
  contractId: string;
  contractName: string;
  effDate: string;
  termDate: string | null;
  chapterId: string;
  type: string;
  centerId: string | null;
  resultsMethod: string | null;
}

/**
 * Batch DTO - Response model for batches ready for extraction
 */
export interface BatchDto {
  batchId: string;
  unitCount: number;
  chapterId: string | null;
  receivedDate: string | null;
}

/**
 * Unit DTO - Response model for units within selected batches
 */
export interface UnitDto {
  unitId: string;
  checkDigit: string | null;
  osUnitId: string | null;
  receivedDate: string | null;
  qcCheckinDate: string | null;
}

/**
 * Extraction Query DTO - Request model for filtering batches
 */
export interface ExtractionQueryDto {
  contractId: string;
  resultType: string;
  chapterId: string;
  centerId?: string | null;
  otherBatches?: boolean;
}

/**
 * Unit Query DTO - Request model for filtering units by batch IDs
 */
export interface UnitQueryDto {
  batchIds: string[];
  chapterId: string;
  contractId: string;
}

/**
 * Create Extraction Request DTO - Request model for creating extraction
 */
export interface CreateExtractionRequestDto {
  contractId: string;
  resultType: string;
  chapterId: string;
  centerId?: string | null;
  resultsMethod?: string | null;
  selectedBatches: string[];
  selectedUnits: string[];
  afterTime?: string | null;
  rsmAutoReport?: boolean;
}

/**
 * Extraction Response DTO - Response model for successful extraction creation
 */
export interface ExtractionResponseDto {
  resultParmId: string;
  contractId: string;
  resultType: string;
  extractionDate: string;
  unitsProcessed: number;
}

/**
 * API Response wrapper for contract list
 */
export interface ContractsApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ContractDto[];
  total: number;
}

/**
 * API Response wrapper for batch list
 */
export interface BatchesApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: BatchDto[];
  total: number;
}

/**
 * API Response wrapper for unit list
 */
export interface UnitsApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: UnitDto[];
  total: number;
}

/**
 * API Response wrapper for extraction creation
 */
export interface CreateExtractionApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ExtractionResponseDto[];
}

/**
 * Result Type options for dropdown
 */
export interface ResultType {
  value: string;
  label: string;
}

/**
 * Result type constants
 */
export const RESULT_TYPES: ResultType[] = [
  { value: 'I', label: 'Initial' },
  { value: 'R', label: 'Repeat' },
  { value: 'F', label: 'Final' }
];

/**
 * Batch with selection state - Extended model for UI
 */
export interface BatchWithSelection extends BatchDto {
  selected: boolean;
}

/**
 * Unit with selection state - Extended model for UI
 */
export interface UnitWithSelection extends UnitDto {
  selected: boolean;
}
