/**
 * Drive Equipment Parameters - Data Models
 * Models for Drive Profile, QC Parameters, QC Dependency, and Physical Equipment
 */

// ============================================
// TAB TYPE ENUM
// ============================================
export enum DriveEquipmentTabType {
  DRIVE_PROFILE = 'drive-profile',
  QC_PARAMETERS = 'qc-parameters',
  QC_DEPENDENCY = 'qc-dependency',
  PHYSICAL_EQUIPMENT = 'physical-equipment'
}

// ============================================
// DRIVE PROFILE MODELS
// ============================================
export interface DriveProfileModel {
  deviceType: string;
  driveProfileType: string;
  driveProfileTypeDescription?: string;
  code: string;
  codeDescription?: string;
  effectiveDate: string | Date;
  terminationDate?: string | Date | null;
  modificationDate?: string | Date | null;
}

export interface DriveProfileCreateDto {
  deviceType: string;
  driveProfileType: string;
  code: string;
  effectiveDate: string;
  terminationDate?: string | null;
}

export interface DriveProfileUpdateDto {
  OriginalCode: string;  // Original value of code field
  originalEffectiveDate: string;  // Original value of effective date field
  deviceType: string;
  driveProfileType: string;
  code: string;
  effectiveDate: string;
  terminationDate?: string | null;
}

export interface DriveProfileFilterParams {
  searchKeyword?: string;
  driveProfileType?: string;
  deviceType?: string;
  code?: string;
  effDateFrom?: string;
  effDateTo?: string;
  termDateFrom?: string;
  termDateTo?: string;
  sort?: string;
}

// Drive Profile Dropdown Response Interfaces
export interface DriveProfileTypeOption {
  code: string;
  description: string;
  codeType: string;
  effectiveDate: string;
}

export interface DriveProfileCodeOption {
  code: string;
  description: string;
  codeType: string;
  effectiveDate: string;
}

// ============================================
// QC PARAMETERS MODELS
// ============================================
export interface QcParametersModel {
  deviceType: string;
  equipmentSupply: string;
  sortSequence: number;
  qcParameterCode: string;
  qcParameterDescription?: string;
  qcCheckCode: string;
  qcCheckDescription?: string;
  dataType: string;
  qcTargetValue?: string;
  qcTargetValueDescription?: string;
  childSequence?: number;
  rangeFlag: string;
  rangeDetailsValue?: number;
  scanRequest: string;
  scanWhat?: string;
  scanWhatDescription?: string;
  equipmentType?: string;
  effectiveDate: string | Date;
  terminationDate?: string | Date | null;
  modificationDate?: string | Date | null;
  auditKey?: number;
  programId?: string;
  insertUser?: string;
  insertDate?: string | Date;
}

export interface QcParametersCreateDto {
  deviceType: string;
  equipmentSupply: string;
  qcParameterCode: string;
  qcCheckCode: string;
  dataType: string;
  qcTargetValue?: string;
  childSequence?: number;
  rangeFlag: string;
  rangeDetailsValue?: number;
  scanRequest: string;
  scanWhat?: string;
  equipmentType?: string;
  effectiveDate: string;
  terminationDate?: string | null;
}

export interface QcParametersUpdateDto {
  deviceType: string;
  equipmentSupply: string;
  auditKey: number;
  sortSequence: number;
  qcParameterCode: string;
  qcCheckCode: string;
  dataType: string;
  qcTargetValue?: string;
  childSequence?: number;
  rangeFlag: string;
  rangeDetailsValue?: number;
  scanRequest: string;
  scanWhat?: string;
  equipmentType?: string;
  effectiveDate: string;
  terminationDate?: string | null;
}

export interface QcParametersFilterParams {
  searchKeyword?: string;
  deviceType?: string;
  equipmentSupply?: string;
  qcParameterCode?: string;
  qcCheckCode?: string;
  dataType?: string;
  effDateFrom?: string;
  effDateTo?: string;
  termDateFrom?: string;
  termDateTo?: string;
  sort?: string;
}

// QC Parameters Dropdown Response Interfaces
export interface QcParameterCodeOption {
  code: string;
  description: string;
  codeType: string;
  effectiveDate: string;
}

export interface QcValueTypeOption {
  code: string;
  description: string;
  codeType: string;
  effectiveDate: string;
}

export interface QcEquipmentTypeOption {
  code: string;
  description: string;
  codeType: string;
  effectiveDate: string;
}

export interface MasterCodeModel {
  code?: string;
  description?: string;
  codeType?: string;
  effectiveDate?: string;
  terminationDate?: string;
}

// ============================================
// QC DEPENDENCY MODELS
// ============================================
export interface QcDependencyModel {
  deviceType: string;
  equipmentSupplyCode: string;
  sourceParamCode: string;
  sourceParamDescription: string;
  dependentCode: string;
  dependentDescription: string;
  effectiveDate: string | Date;
  terminationDate?: string | Date | null;
  modificationDate?: string | Date | null;
  auditKey?: number;
  programId?: string;
  insertUser?: string;
  insertDate?: string | Date;
}

export interface QcDependencyCreateDto {
  deviceType: string;
  equipmentSupplyCode: string;
  sourceParamCode: string;
  dependentCode: string;
  effectiveDate: string;
  terminationDate?: string | null;
}

export interface QcDependencyUpdateDto {
  auditKey: number;
  sourceParamCode: string;
  dependentCode: string;
  effectiveDate: string;
  terminationDate?: string | null;
}

export interface QcDependencyFilterParams {
  searchKeyword?: string;
  deviceType?: string;
  equipmentSupplyCode?: string;
  sourceParamCode?: string;
  dependentCode?: string;
  effDateFrom?: string;
  effDateTo?: string;
  termDateFrom?: string;
  termDateTo?: string;
  sort?: string;
}

// QC Dependency Dropdown Response Interfaces
export interface QcDependencyParamCodeOption {
  code: string;
  description: string;
  codeType: string;
  effectiveDate: string;
}

// ============================================
// PHYSICAL EQUIPMENT MODELS
// ============================================
export interface PhysicalEquipmentModel {
  physicalCode: string;
  physicalCodeDescription: string;
  equipmentType: string;
  equipmentTypeDescription: string;
  effectiveDate: string | Date;
  terminationDate?: string | Date | null;
  auditKey?: number;
}

export interface PhysicalEquipmentCreateDto {
  physicalCode: string;
  equipType: string;
  effectiveDate: string;
  terminationDate?: string | null;
}

export interface PhysicalEquipmentUpdateDto {
  physicalCode: string;
  equipType: string;
  auditKey: number;
  terminationDate?: string | null;
}

export interface PhysicalCodeOption {
  code: string;
  description: string;
  codeType: string;
  effectiveDate?: string;
}

export interface EquipmentTypeOption {
  code: string;
  description: string;
  codeType: string;
  effectiveDate?: string;
}

export interface PhysicalEquipmentFilterParams {
  searchKeyword?: string;
  effDateFrom?: string;
  effDateTo?: string;
  termDateFrom?: string;
  termDateTo?: string;
  sort?: string;
}

// ============================================
// TAB STATE
// ============================================
export interface DriveEquipmentTabState {
  filters: DriveProfileFilterParams | QcParametersFilterParams | QcDependencyFilterParams | PhysicalEquipmentFilterParams;
  searchKeyword: string;
  pagination: {
    take: number;
    skip: number;
  };
  selectedType?: string;
}
