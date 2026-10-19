// ─── Validate Header (pre-RETRIEVE) ──────────────────────────────────────────

export interface ValidateHeaderRequest {
  checkinType: CheckInType;
  batchId?: string | null;
  driveId: string;
  groupSiteId: string;
  collectionDate: string;   // YYYY-MM-DD
  shipperId?: string | null;
  minTemp?: number | null;
  maxTemp?: number | null;
}

export interface ValidateHeaderResponse {
  success: boolean;
  message?: string | null;
  errorCode?: string | null;  // "0033" = non-blocking date age warning; other codes = hard errors
}

// ─── Shippers dropdown ───────────────────────────────────────────────────────

export interface ShipperOption {
  shipperNo: string;
}

export interface GetShippersResponse {
  success: boolean;
  total: number;
  data: ShipperOption[];
}

// ─── Drives dropdown ─────────────────────────────────────────────────────────

export interface DriveOption {
  driveId: string;
  driveScheduledDate: string;
  groupSiteId: string;
  siteName: string;
}

export interface GetDrivesResponse {
  success: boolean;
  total: number;
  data: DriveOption[];
}

// ─── Step 1: GET /batches ────────────────────────────────────────────────────

export interface BatchOption {
  batchId: string;
  receivedDate: string;
  minTemp: number;
  maxTemp: number;
  unitCount: number;
  contractId?: string | null;
}

export interface GetBatchesResponse {
  success: boolean;
  data: BatchOption[];
}

// ─── Step 4: GET /units ──────────────────────────────────────────────────────

export interface GetUnitsParams {
  collectionDate: string;         // YYYY-MM-DD
  driveId?: string;               // required when checkInType = 'U'
  batchId?: string;               // required when checkInType = 'B'
  shipperNumber?: string;
}

export interface RetrievedUnit {
  unitId: string;
  collectionDate: string;
  donationType: string;
  procedureCode: string;          // shown as "Protocol" in the UI
  donorId: string;
  driveId: string;
  // UI-only state added after fetch
  uiStatus?: 'PENDING' | 'SCANNED' | 'TRANSFERRED' | 'ERROR';
  uiWarnings?: TransferWarning[];
  uiInterdictions?: string[];
}

export interface GetUnitsResponse {
  success: boolean;
  total: number;
  data: RetrievedUnit[];
}

// ─── Step 5: POST /validate-unit ─────────────────────────────────────────────

export interface ValidateUnitRequest {
  unitId: string;
  driveId: string;
  collectionDate: string;         // YYYY-MM-DD
}

export interface ValidateUnitResponse {
  success: boolean;
  message?: string;
  errorCode?: string;
}

// ─── Step 6: GET /donation-details ───────────────────────────────────────────

export interface DonationDetails {
  unitId: string;
  collectionDate: string;
  bleedStartTime: string | null;
  bleedStartTimeL2: string | null;
  bleedStartTimeR1: string | null;
  bleedStartTimeR2: string | null;
  bleedEndTime: string | null;
  bleedEndTimeL2: string | null;
  bleedEndTimeR: string | null;
  bleedEndTimeR2: string | null;
  donationType: string;
  procedureCode: string;
  donorAbo: string | null;
  donorDecisionCode?: string | null;
  r1TubePresent: boolean;
  r2TubePresent: boolean;
  p1TubePresent: boolean;
  p2TubePresent: boolean;
  catalogNumber: string | null;
  lotNumber: string | null;
  warehouseId?: string | null;
  chkDigit?: string | null;
  equipReference: string | null;
  equipType?: string | null;
  attributes: string[];
}

export interface GetDonationDetailsResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: DonationDetails[];
}

// ─── Transfer warning ─────────────────────────────────────────────────────────

export interface TransferWarning {
  code: string;
  message: string;
}

// ─── Step 5b: POST /validate-transfer ────────────────────────────────────────

export interface BleedTimeResult {
  isValid: boolean;
  isSlowBleed: boolean;
  requiresInterdiction: boolean;
  interdictionCode?: string;
  errorCode?: string;
  warningMessage?: string;
  bleedDurationMinutes: number;
}

export interface ValidateTransferResponse {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
  donationDetails?: DonationDetails;
  bleedTimeResult?: BleedTimeResult;
  warnings: TransferWarning[];
}

// ─── Step 7: POST / (transfer) ───────────────────────────────────────────────

export interface TransferRequest {
  unitId: string;
  collectionDate: string;         // YYYY-MM-DD
  driveId: string;
  groupSiteId: string;
  checkinType: CheckInType;
  batchId: string | null;
  shipperId: string | null;
  materialShipmentId: string | null;
  contractId: string | null;
  minTemp: number | null;
  maxTemp: number | null;
  donorDecisionScan: string | null;
}

export interface TransferUnitResult {
  unitId: string;
  success: boolean;
  donorDecisionCode: string | null;
  donorAbo: string | null;
  tubesCheckedIn: {
    r1: boolean;
    r2: boolean;
    p1: boolean;
    p2: boolean;
  };
  attributesTransferred: number;
  interdictionsApplied: string[];
  warningsGenerated: TransferWarning[];
  catalogNumber: string | null;
  lotNumber: string | null;
  /** Populated only when the batch was auto-generated (no batch was selected). UI uses this to update the Batch ID filter field. */
  generatedBatchId?: string | null;
}

export interface TransferResponse {
  success: boolean;
  message: string;
  data: TransferUnitResult[];
}

// ─── Check-In Type (hardcoded — no API) ─────────────────────────────────────

export const CHECK_IN_TYPE_OPTIONS = [
  { value: 'U', label: 'Unit',  description: 'Units (Bags)' },
  { value: 'T', label: 'Tubes', description: 'Tubes Only'   },
  { value: 'B', label: 'Both',  description: 'Tubes and Units' },
] as const;

export type CheckInType = 'U' | 'T' | 'B';
