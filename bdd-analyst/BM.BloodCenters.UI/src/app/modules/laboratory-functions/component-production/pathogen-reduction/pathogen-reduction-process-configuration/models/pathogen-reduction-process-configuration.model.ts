/**
 * List response item — matches BE field names exactly
 */
export interface PathogenReductionProcessConfiguration {
  chapterId: string;              // Chapter ID
  volumeTypeSet: string;          // PK - FK to MASTER_CODES (code_type='VTYST')
  volumeTypeSetDesc?: string;     // Description from MASTER_CODES (optional, may come from API)
  suspensionType: string | null;  // SUSPENSION_TYPE
  equipType: string | null;       // EQUIP_TYPE
  minVol: number | null;          // MIN_VOL
  maxVol: number | null;          // MAX_VOL
  minPltCount: number | null;     // MIN_PLT_COUNT
  maxPltCount: number | null;     // MAX_PLT_COUNT
  minCadTime: number | null;      // MIN_CAD_TIME
  maxCadTime: number | null;      // MAX_CAD_TIME
  maxStorageDays: number | null;  // MAX_STORAGE_DAYS
  finalMinVolume: number | null;  // FINAL_MIN_VOLUME
  finalMaxVolume: number | null;  // FINAL_MAX_VOLUME
  finalMinPltCount: number | null; // FINAL_MIN_PLT_COUNT
  finalMaxPltCount: number | null; // FINAL_MAX_PLT_COUNT
  finalMaxNoBags: number;         // FINAL_MAX_NO_BAGS - NOT NULL
  effDate: string;                // EFF_DATE - NOT NULL - ISO UTC
  termDate: string | null;        // TERM_DATE - ISO UTC or null
  insertDate?: string;            // INSERT_DATE - ISO UTC
  insertUser: string;             // INSERT_USER
  programId: string;              // PROGRAM_ID
  auditKey?: number;              // AUDIT_KEY
}

/**
 * Request body for list POST (all optional)
 */
export interface PathogenReductionProcessConfigurationFilter {
  searchKeyword?: string;
  volumeTypeSet?: string;         // Exact match
  suspensionType?: string;        // Exact match
  equipType?: string;             // Exact match
  effDateAfter?: string;          // ISO date
  effDateBefore?: string;         // ISO date
  termDateAfter?: string;         // ISO date
  termDateBefore?: string;        // ISO date
  sort?: string;                  // "volumeTypeSet_asc", "effDate_desc" etc.
}

/**
 * Request body for Create POST
 */
export interface CreatePathogenReductionProcessConfiguration {
  volumeTypeSet: string;          // Required - FK to MASTER_CODES (code_type='VTYST')
  suspensionType?: string | null; // Optional - code_desc from MASTER_CODES (code_type='SUSTY')
  equipType?: string | null;      // Optional - code_desc from MASTER_CODES (code_type='PEQUP')
  minVol?: number | null;         // Optional (integer, >0)
  maxVol?: number | null;         // Optional (integer, >0)
  minPltCount?: number | null;    // Optional (>0)
  maxPltCount?: number | null;    // Optional (>0)
  minCadTime?: number | null;     // Optional (integer, >0)
  maxCadTime?: number | null;     // Optional (integer, >0)
  finalMinVolume?: number | null; // Optional (integer, >0)
  finalMaxVolume?: number | null; // Optional (integer, >0)
  finalMinPltCount?: number | null; // Optional (>0)
  finalMaxPltCount?: number | null; // Optional (>0)
  finalMaxNoBags: number;         // Required (integer, >0)
  maxStorageDays?: number | null; // Optional (integer, >0)
  effDate: string;                // Required, ISO UTC, >= today
  termDate?: string | null;       // Optional, ISO UTC, >= effDate
}

/**
 * Request body for Update PUT (composite key in URL)
 */
export interface UpdatePathogenReductionProcessConfiguration {
  suspensionType?: string | null; // Optional - code_desc from MASTER_CODES
  equipType?: string | null;      // Optional - code_desc from MASTER_CODES
  minVol?: number | null;
  maxVol?: number | null;
  minPltCount?: number | null;
  maxPltCount?: number | null;
  minCadTime?: number | null;
  maxCadTime?: number | null;
  finalMinVolume?: number | null;
  finalMaxVolume?: number | null;
  finalMinPltCount?: number | null;
  finalMaxPltCount?: number | null;
  finalMaxNoBags: number;         // Required
  maxStorageDays?: number | null;
  effDate: string;                // Required
  termDate?: string | null;       // Optional, >= effDate
}

/**
 * Filter panel form value
 */
export interface PathogenReductionProcessConfigurationFilterValue {
  volumeTypeSet: string | null;
  suspensionType: string | null;
  equipType: string | null;
  effDate: string | null;
  effDatePeriod: 'BEFORE' | 'AFTER' | null;
  termDate: string | null;
  termDatePeriod: 'BEFORE' | 'AFTER' | null;
}

/**
 * Lookup dropdown value from API
 */
export interface LookupValue {
  code: string;
  codeDesc: string;
}
