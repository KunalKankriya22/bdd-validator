// Fixed Profile Tube Check-In Models (matching backend API specification)

export interface FixedProfileUnit {
  osUnitId: string; // Operating System Unit ID (external) - Max 15 chars - Required
  unitId?: string | null; // Internal Unit ID - Max 13 chars - Defaults to osUnitId if null
  redTubeFlag?: string | null; // Red tube 1 indicator: "Y", "P", or "S" (Yes/Plasma/Serum)
  purpleTubeFlag?: string | null; // Purple tube indicator: "Y", "P", or "S"
  redTube2?: string | null; // Red tube 2 indicator: "Y", "P", or "S"
  serumPlasmaInd?: string | null; // Serum/Plasma indicator: "Y", "P", or "S"
  warehouseId?: string | null; // Warehouse ID - Max 10 chars
  osChkDigit?: number | null; // OS check digit: 0-9
  chkDigit?: number | null; // Internal check digit: 0-9
  // Additional fields returned by GET endpoint
  collDate?: string; // Collection date (returned in list view)
  receivedDate?: string; // Received date (returned in list view)
  chapterId?: string; // Chapter ID (returned in list view)
  batchId?: string; // Batch ID (returned in list view)
  contractId?: string; // Contract ID (returned in list view)
  programId?: string; // Program ID (returned in list view)
  insertDats?: string; // Insert timestamp (returned in list view)
}

export interface BatchCheckinRequest {
  batchId?: string | null; // Batch ID. Use "NEW" or null for auto-generation (format: MMDDYY-TS####)
  contractId: string; // Contract ID - Max 9 chars - Required
  collDate: string; // Collection date - ISO 8601 format - Required
  receivedDate: string; // Received date - ISO 8601 format - Required - Must be >= collDate
  profileSetId?: string | null; // Profile set ID - Max 10 chars
  profileSeqNo?: number | null; // Profile sequence number - Positive integer
  units: FixedProfileUnit[]; // Array of units - Min 1, Max 100 recommended
}

export interface BatchCheckinResponse {
  success: boolean; // Overall operation success
  message: string; // Human-readable message
  item?: {
    batchId: string; // Generated or provided batch ID
    unitsProcessed: number; // Number of units successfully checked in
    testsScheduled: number; // Total UTRS test records created across all units
    success: boolean; // Check-in success flag
  };
  statusCode: number; // HTTP status code (201 for success, 400 for error, 500 for server error)
  errorCode?: string; // Error code (e.g., "0080", "0029", "0340", "1171", "1256", "0093")
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

export interface TestServiceContract {
  contractId: string;
  company: string;
  barCodeProtocol: 'X' | 'C' | '8' | 'N' | 'A' | 'V'; // Critical for barcode routing
  ediInputInd: 'Y' | 'N';
  redTubeCount: number | null;
  purpleTubeCount: number | null;
  effDate: Date;
  termDate: Date | null;
}

export interface ContractTest {
  testId: string;
  testName: string;
  effDate: Date;
  termDate: Date | null;
}
