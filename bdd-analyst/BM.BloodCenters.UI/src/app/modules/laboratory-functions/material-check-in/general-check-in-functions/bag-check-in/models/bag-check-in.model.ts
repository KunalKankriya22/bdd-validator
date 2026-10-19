export interface BagBatch {
  batchId: string;
  receivedDate?: string;
  minTemp: number;
  maxTemp: number;
  unitCount: number;
}

export interface BagUnit {
  unitId: string;
  catalogNumber?: string;
  driveId?: string;
  name?: string;
  lotNumber?: string;
  donorDecisionCode?: string;
  cue?: string;
  protocol?: string;
  collDate?: string;
  batchId?: string;
}

export interface BagValidateUnitResponse {
  alreadyCheckedIn: boolean;
  driveId?: string;
  name?: string;
  cue?: string;
  collDate?: string;
  hasTubeData: boolean;
  warningCode?: string;       // raw donor_decision_code — N/A/O/T triggers alert dialog
  bleedWarningCode?: string;  // '9211' = slow bleed, '9001' = bleed time exceeded
  bleedWarningMessage?: string;
  isPheresis?: boolean;
}

export interface BagCatalog {
  catalogNumber: string;
}

export interface BagLot {
  lotNumber: string;
  termDate?: string;
}

export interface BagCheckInRequest {
  batchId?: string;
  chapterId?: string;
  warehouseId?: string;
  unitId: string;
  catalogNumber: string;
  lotNumber: string;
  minTemp: number;
  maxTemp: number;
}

export interface BagCheckInResponse {
  batchId: string;
  unitId: string;
  expiredLotWarning?: boolean;
  expiredLotMessage?: string;
}

/** Single tube field definition returned by the formats API */
export interface TubeFieldDefinition {
  /** Angular form control name: red1 | red2 | purple1 | purple2 */
  controlName: string;
  /** Human-readable label, e.g. "Red Top 1" */
  label: string;
}

/** Tube check-in format from API — includes which fields are active */
export interface TubeFormat {
  formatCode: string;
  description: string;
  /** Active tube fields for this format — drives dynamic form inputs */
  fields: TubeFieldDefinition[];
  /**
   * Control name of the field that carries a mandatory asterisk.
   * null = "at least one of any" (no specific field marked required).
   * 'red1' for R* formats, 'purple1' for P* formats.
   */
  requiredControlName?: string | null;
}

export interface TubeCheckInSubmitRequest {
  formatCode: string;
  unitId?: string;    // red1 / Red Top 1
  unitId1?: string;   // red2 / Red Top 2
  sunitId?: string;   // purple1 / Purple Top 1
  sunitId2?: string;  // purple2 / Purple Top 2
}

export interface TubeCheckInSubmitResponse {
  masterUnitId: string;
  message: string;
}

export interface TubeCheckInEntry {
  unitId: string;
  redTop1: string;
  redTop2: string;
  purpleTop1: string;
  purpleTop2: string;
}

/** Request to validate a single tube scan */
export interface TubeValidateUnitRequest {
  unitId: string;
  /** red1 | red2 | purple1 | purple2 */
  tubeType: string;
}

/** Response from validate-unit endpoint */
export interface TubeValidateUnitResponse {
  alreadyCheckedIn: boolean;
  errorCode?: string;   // 0150 = already checked in, 0160 = duplicate in system
  errorMessage?: string;
}
