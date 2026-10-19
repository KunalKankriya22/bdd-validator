/**
 * TypeScript models for Pathogen Reduction Manager
 * Generated from API documentation: pathogen-reduction-api-documentation.md
 * Base URL: /api/pathogen-reduction
 */

/**
 * PathogenReductionDetailsDto - Full pathogen reduction record details
 */
export interface PathogenReductionDetailsDto {
  unitId: string;
  chapterId: string;
  productCode: string;
  processDateTime: string | null;      // PROCESS_DATE_TIME - Process date/time
  suitStatusCode: string | null;
  suitabilityDate: string | null;
  suitabilityUser: string | null;
  sterileDockDate: string | null;
  sterileDockUser: string | null;
  illuminationStartTime: string | null;
  illuminationEndTime: string | null;
  treatmentStartTime: string | null;
  treatmentTime: string | null;         // TREATMENT_TIME - Treatment elapsed time (e.g., "23:59")
  treatmentDate: string | null;         // TREATMENT_DATE - Treatment/Illumination date
  operatorId: string | null;            // OPERATOR_ID - Operator ID for intermediate process
  treatmentEndTime: string | null;
  cadEndTime: string | null;
  finalTransferDate: string | null;
  finalTransferUser: string | null;
  numBags: number | null;
  insertDate: string;
  insertUser: string;
  // Intermediate Process Tab - Additional fields
  illuminatorReference: string | null;  // ILLUMINATOR_REFERENCE - Serial Number (9 chars)
  productCategory: string | null;       // PROD_CATEGORY - Product Category (PLT, PLAS, etc.)
  // Final Transfer/Storage Tab - Additional fields
  collDate: string | null;              // COLL_DATE - Collection Date
  suitProdCode: string | null;          // SUIT_PROD_CODE - Interim Product Code (8 chars)
  cadProdCode: string | null;           // CAD_PROD_CODE - CAD Product Code (8 chars)
  cadStartTime: string | null;          // CAD_START_TIME - CAD Start Time
  cadTotalTime: string | null;          // CAD_TOTAL_TIME - CAD Elapsed Time (10 chars)
  illuminatorMessage: string | null;    // ILLUMINATOR_MESSAGE - Instrument Message (240 chars)
  illuminationStatus: number | null;    // ILLUMINATION_STATUS - 0 = Incomplete, 1 = Complete
  volTypeSet: string | null;            // VOL_TYPE_SET - Volume Type Set (5 chars)
  setIdLotNo: string | null;            // SET_ID_LOT_NO - Set ID Lot Number (10 chars)
  cadStatus: string | null;             // CAD_STATUS - Calculated: EARLY, LATE, or READY
  cadStatusMessage: string | null;      // CAD_STATUS_MESSAGE - Display message for CAD status
}

/**
 * CheckSuitabilityRequestDto - Request to check unit suitability
 * Matches FMB Check_Suitability procedure input
 */
export interface CheckSuitabilityRequestDto {
  unitId: string; // Max 14 chars
  productCode: string; // Max 5 chars
  processDateTime: Date; // Process date/time - when product is being processed for pathogen reduction
  rbcContentStatus?: string | null; // 'Y' = Acceptable, 'N' = Not Acceptable, null = Not entered (from form)
  aggrAcc?: string | null; // 'Y' = Acceptable, 'N' = Not Acceptable, null = Not entered (from form)
}

/**
 * CheckSuitabilityResponseDto - Suitability check results
 * Matches FMB Check_Suitability procedure output exactly:
 * OUT p_status_flag VARCHAR2 - 'Y' = suitable, 'N' = not suitable
 * OUT p_status VARCHAR2 - NULL if suitable, error messages separated by newlines if not
 */
export interface CheckSuitabilityResponseDto {
  unitId: string;
  productCode: string;
  statusFlag: string; // 'Y' = suitable, 'N' = not suitable (matches FMB p_status_flag)
  status: string | null; // NULL if suitable, error messages with \n if not (matches FMB p_status)
}

/**
 * SaveSuitabilityRequestDto - Save suitability check results
 */
export interface SaveSuitabilityRequestDto {
  unitId: string; // Max 14 chars
  collDate?: string | null; // ISO DateTime, optional
  productCode: string; // Max 5 chars
  productCategory?: string | null; // Optional
  volumeTypeSet?: string | null; // Optional
  suspensionType?: string | null; // Optional
  initPltCount?: number | null; // Initial platelet count, optional
  rbcContentStatus?: string | null; // RBC content status (e.g., "P", "F"), optional
  bleedEndTime?: string | null; // ISO DateTime, optional
  initialProdWeight?: number | null; // Optional
  initialProdVol?: number | null; // Initial product volume, optional
  equipType?: string | null; // Equipment type, optional
  anticoagulantVolume?: number | null; // Optional
  aggrAcc?: string | null; // Aggregates acceptance ("A", "N"), optional
  processDateTime?: string | null; // ISO DateTime, optional
  suitProdCode?: string | null; // Suitability product code (interim), optional
  suitStatusCode?: string | null; // 'A' = Approved (PHERESIS), 'R' = Rejected
  suitStatusReason?: string | null; // Rejection reason (required if rejected), VARCHAR2(200)
  suitabilityDate: string; // ISO DateTime
  suitabilityUser: string; // Max 6 chars
}

/**
 * UpdateSuitabilityRequestDto - Update suitability step
 */
export interface UpdateSuitabilityRequestDto {
  unitId: string; // Max 14 chars
  productCode: string; // Max 5 chars
  suitabilityDate: string; // ISO DateTime
  suitabilityUser: string; // Max 6 chars
}

/**
 * SterileDockingRequestDto - Insert sterile docking record
 * Calls lab_common.insert_sterile_docking PL/SQL procedure
 */
export interface SterileDockingRequestDto {
  unitId: string; // Max 14 chars, required
  procCode: string; // Process code, required
  weldMachine: string; // Welding machine ID, required
  waferLotNo: string; // Wafer lot number, required
  setLotNo: string; // Set lot number, required
  weldOk: string; // Weld OK status: "Y" or "N", required (1 char)
  dockDate: string; // ISO DateTime, required
  dockUser: string; // Max 6 chars, required
}

/**
 * UpdateIntermediateProcessRequestDto - Update intermediate process times
 */
export interface UpdateIntermediateProcessRequestDto {
  unitId: string; // Max 14 chars
  treatmentDate?: string | null; // ISO DateTime, optional
  treatmentStartTime?: string | null; // ISO DateTime, optional
  treatmentTime?: string | null; // Treatment elapsed time as HH:mm (e.g., "00:05"), optional
  operatorId?: string | null; // Max 30 chars, optional
  illuminatorMessage?: string | null; // Max 200 chars, optional
  cadProdCode?: string | null; // Max 8 chars, optional
  cadStartTime?: string | null; // ISO DateTime, optional
  illuminatorReference?: string | null; // Illuminator reference/serial number, optional
  illuminationStatus?: number | null; // 0 = Incomplete, 1 = Complete
}

/**
 * UpdateFinalTransferRequestDto - Update final transfer step
 */
export interface UpdateFinalTransferRequestDto {
  unitId: string; // Max 14 chars
  cadEndTime: string; // ISO DateTime, required
  numBags: number; // Must be > 0
  finalTransferDate: string; // ISO DateTime, required
  finalTransferUser: string; // Max 6 chars
}

/**
 * FinalProductItemDto - Single final product item
 */
export interface FinalProductItemDto {
  finalUnitId: string; // Max 14 chars
  productCode?: string | null; // Max 5 chars, optional
  volume?: number | null; // Must be > 0 if provided
}

/**
 * SaveFinalProductsRequestDto - Save final products (batch)
 */
export interface SaveFinalProductsRequestDto {
  sourceUnitId: string; // Max 14 chars
  finalProducts: FinalProductItemDto[]; // Array length > 0
}

/**
 * ProductCategoryDto - Valid product category for pathogen reduction
 */
export interface ProductCategoryDto {
  productCategory: string; // e.g., "PLT", "PLAS"
  categoryDescription: string; // e.g., "Platelets", "Plasma"
}

/**
 * SuspensionTypeDto - Suspension type lookup
 */
export interface SuspensionTypeDto {
  suspensionType: string;
  equipType: string; // Equipment type associated with this suspension type
  description?: string; // Optional description
}

/**
 * UnitDetailsDto - Unit details from UNITS table
 * Retrieved from GET /pathogen-reduction/units/{unitId}
 */
export interface UnitDetailsDto {
  unitId: string;
  chapterId: string;
  collDate: string; // Collection date (ISO DateTime)
  checkDigit: string;
  bleedStartTime: string; // Bleed start time (ISO DateTime)
  bleedEndTime: string; // Bleed end time (ISO DateTime)
  donorCode: string;
}

/**
 * VolumeTypeSetDto - Volume type set lookup
 */
export interface VolumeTypeSetDto {
  volumeTypeSet: string;
  description: string;
}

/**
 * EquipmentSerialNumberDto - Equipment serial number lookup
 */
export interface EquipmentSerialNumberDto {
  serialNumber: string;
  equipmentType: string;
}

/**
 * IlluminatorEquipmentTypeDto - Illuminator equipment type lookup
 */
export interface IlluminatorEquipmentTypeDto {
  code: string;
  codeDesc: string;
}

/**
 * SterileDockingMachineDto - Sterile docking machine lookup
 */
export interface SterileDockingMachineDto {
  code: string;
  codeDesc: string;
}

/**
 * WaferLotNumberDto - Wafer lot number lookup
 */
export interface WaferLotNumberDto {
  lotNumber: string;
  expirationDate: string | null;
}

/**
 * SetLotNumberDto - Set lot number lookup
 */
export interface SetLotNumberDto {
  lotNumber: string;
  volumeTypeSet: string;
  expirationDate: string | null;
}

/**
 * ProductCodeDto - Product code lookup for initial products (before pathogen reduction)
 * Database Filter: pathogen_reduction_flag != 'Y'
 */
export interface ProductCodeDto {
  productCode: string;
  description: string;
  productType: string;
  productCategory: string;
}

/**
 * InterimProductCodeDto - Interim product code lookup for suitability products (after pathogen reduction)
 * Database Filter: pathogen_reduction_flag = 'Y'
 */
export interface InterimProductCodeDto {
  productCode: string;
  description: string;
  productType: string;
  productCategory: string;
}

/**
 * PathogenConfigDto - Configuration ranges for pathogen reduction
 */
export interface PathogenConfigDto {
  productCategory: string;
  parameterName: string; // e.g., "RBC_CONTENT", "AGGREGATES"
  minValue: number;
  maxValue: number;
  effDate: string; // ISO DateTime
  termDate: string | null; // ISO DateTime, nullable
}

/**
 * PathogenReductionStatusDto - Status overview for dashboard
 */
export interface PathogenReductionStatusDto {
  totalUnits: number;
  suitableUnits: number;
  unsuitableUnits: number;
  completedUnits: number;
  inProgressUnits: number;
  pendingSuitabilityCheck: number;
}

/**
 * PathogenReductionQueryStatusDto - Query Status for units in CAD process
 * Returns units currently being processed through Component Adsorption Device
 * Source: CPIPRMGR FMB - populate_prd_status_block procedure
 */
export interface PathogenReductionQueryStatusDto {
  unitId: string; // Blood unit identifier
  cadProductCode: string; // CAD product code
  volumeTypeSet: string; // Volume type set
  cadStartTime: string; // CAD process start date/time (ISO format)
  cadEndTime: string | null; // CAD process end date/time (NULL if still in progress)
  cadTimeElapsed: number; // Time elapsed since CAD start (in hours)
  priority: number; // 1=Ready Almost Overdue, 2=Ready Within Range, 3=Not Ready, 4=Discard Exceeded
  statusDescription: string; // Human-readable status based on priority
}

/**
 * Chapter DTO for Upload Manually dropdown
 */
export interface ChapterDto {
  chapterId: string;
  chapterName: string;
}

/**
 * PathogenFinalProductDto - Final products for a pathogen reduction unit
 * Maps to PATHOGEN_FINAL_PRODUCTS table
 */
export interface PathogenFinalProductDto {
  unitId: string;                    // UNIT_ID - Source unit
  productCode: string;               // PRODUCT_CODE - Final product code
  prodWeight: number | null;         // PROD_WEIGHT - Product weight
  prodVol: number | null;            // PROD_VOL - Product volume
  anticoagulantVolume: number | null;// ANTICOAGULANT_VOLUME - Anticoagulant volume
  finalPltCount: number | null;      // FINAL_PLT_COUNT - Platelet count
  suitProdCode: string | null;       // SUIT_PROD_CODE - Suitability product code
  cadProdCode: string | null;        // CAD_PROD_CODE - CAD product code
  insertDate: string;                // INSERT_DATE - Timestamp
  insertUser: string;                // INSERT_USER - User
  programId: string | null;          // PROGRAM_ID - Program
  auditKey: number | null;           // AUDIT_KEY - Audit key
}

/**
 * ReprintLabelRequestDto - Request to reprint a product label
 */
export interface ReprintLabelRequestDto {
  unitId: string;       // Unit ID
  productCode: string;  // Product Code
  collDate: string;     // Collection Date (ISO DateTime)
}

/**
 * ReprintLabelResponseDto - Response from reprint label request
 */
export interface ReprintLabelResponseDto {
  unitId: string;
  productCode: string;
  productDesc?: string;
  collDate: string;
  expiryDate?: string;
  cmvStatus?: string;
  preprintedLabel: boolean;
  timeLimitWarning?: string;
}

/**
 * API Response wrapper for GET endpoints
 */
export interface PathogenReductionApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  totalCount?: number;
}

/**
 * Error response structure
 */
export interface PathogenReductionErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

/**
 * Success response for save operations
 */
export interface SaveSuitabilityResponse {
  unitId: string;
}

/**
 * Success response for sterile docking
 */
export interface SterileDockingResponse {
  result: number;
  message: string;
}

/**
 * Success response for final products
 */
export interface SaveFinalProductsResponse {
  count: number;
}

/**
 * Product details from COMPONENTS table when Product Code is selected
 * Auto-populates: weight, volume, anticoagulant, platelet count, equipment type
 * Based on FMB populate_cnt_wt_vol and populate_equipType procedures
 */
export interface ProductDetailsDto {
  /** Initial Platelet Count (only for PLT products) - Example: 4.0 (displayed as 4.0 x 10^11) */
  initPltCount?: number | null;

  /** Product Weight in grams - Example: 360.50 */
  initialProdWeight?: number | null;

  /** Initial Product Volume in ml (calculated: weight / specific_gravity) - Example: 350.00 */
  initialProdVol?: number | null;

  /** Anticoagulant Volume in ml - Example: 10 */
  anticoagulantVolume?: number | null;

  /** Equipment Type - Example: "AMIC" */
  equipType?: string | null;

  /** Specific Gravity (used for calculation, typically not displayed) */
  specificGravity?: number | null;
}

/**
 * Request DTO for Calculate Intended Use API
 * Calculates full 8-character product code from 5-character base code
 */
export interface CalculateIntendedUseRequestDto {
  /** Unit ID */
  unitId: string;

  /** Base product code (5 characters, e.g., "A8331") */
  baseProductCode: string;
}

/**
 * Response DTO for Calculate Intended Use API
 * Returns full 8-character product code
 */
export interface CalculateIntendedUseResponseDto {
  /** Full product code (8 characters, e.g., "A8331V00") */
  fullProductCode: string;

  /** Product description */
  description?: string;
}
