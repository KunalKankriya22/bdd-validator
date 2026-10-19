/**
 * Valid Test Staging Parameters - Data Models
 *
 * Module: Valid Test Staging Parameters (TPARM)
 * API: /api/valid-test-staging-parameters
 * Oracle Form: VTSTPARM
 */

// ============================================================================
// API Response Models
// ============================================================================

/**
 * Valid Test Parameter DTO - Response model
 * Represents a test staging parameter returned from the API
 */
export interface ValidTestParmDto {
  /** Parameter code (max 8 chars, immutable after creation) */
  parmCode: string;

  /** Parameter description (max 100 chars) */
  description: string;

  /** Data type classification */
  datatype: DatatypeEnum;

  /** Related parameter/equipment/reagent code (max 8 chars) */
  relatedCode: string | null;

  /** Void code reference */
  voidCode: string | null;

  /** Run flag indicator (Y/N) */
  runFlag: string | null;

  /** Effective date (timezone-aware) */
  effDate: string;

  /** Termination date */
  termDate: string | null;

  /** Last modification timestamp */
  lastModifiedDate: string | null;

  /** Program identifier (VTSTPARM) */
  programId: string | null;
}

/**
 * API Response Wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  totalCount?: number;
}

// ============================================================================
// API Request Models
// ============================================================================

/**
 * Create Valid Test Parameter Request DTO
 */
export interface CreateValidTestParmRequestDto {
  /** Parameter code (max 8 chars, uppercase, unique) */
  parmCode: string;

  /** Parameter description (max 100 chars) */
  description: string;

  /** Data type classification */
  datatype: DatatypeEnum;

  /** Related parameter/equipment/reagent code (conditional) */
  relatedCode?: string | null;

  /** Void code reference */
  voidCode?: string | null;

  /** Run flag indicator (Y/N) */
  runFlag: string;

  /** Effective date (cannot be in past on create) */
  effDate?: string | null;
}

/**
 * Update Valid Test Parameter Request DTO
 */
export interface UpdateValidTestParmRequestDto {
  /** Parameter description (max 100 chars) */
  description: string;

  /** Data type classification */
  datatype: DatatypeEnum;

  /** Related parameter/equipment/reagent code (conditional) */
  relatedCode?: string | null;

  /** Void code reference */
  voidCode?: string | null;

  /** Run flag indicator (Y/N) */
  runFlag: string;

  /** Effective date */
  effDate: string;

  /** Termination date (must be >= effDate) */
  termDate?: string | null;
}

/**
 * Query/Filter DTO for searching parameters
 */
export interface ValidTestParmQueryDto {
  /** Filter by parameter code */
  parmCode?: string | null;

  /** Filter by datatype */
  datatype?: string | null;

  /** Filter by run flag */
  runFlag?: string | null;

  /** Search keyword (across code and description) */
  searchKeyword?: string | null;

  /** Column to sort by */
  sortColumn?: string | null;

  /** Sort order (ASC or DESC) */
  sortOrder?: string | null;

  /** Filter by effective date - operator (After/Before) */
  effDateOperator?: DateFilterOperator | null;

  /** Filter by effective date - value */
  effDateValue?: string | null;

  /** Filter by termination date - operator (After/Before) */
  termDateOperator?: DateFilterOperator | null;

  /** Filter by termination date - value */
  termDateValue?: string | null;

  /** Filter by void code */
  voidCode?: string | null;

  /** Filter by related code */
  relatedCode?: string | null;
}

// ============================================================================
// Lookup Models
// ============================================================================

/**
 * Datatype Lookup Item
 */
export interface DatatypeLookup {
  /** Datatype code */
  typeCode: string;

  /** Datatype description */
  description: string;
}

/**
 * Void Code Lookup Item
 */
export interface VoidCodeLookup {
  /** Void code */
  code: string;

  /** Void code description */
  codeDesc: string;
}

/**
 * Related Code Lookup Item
 * Dynamic based on datatype selection
 */
export interface RelatedCodeLookup {
  /** Related code */
  code: string;

  /** Related code description */
  codeDesc: string;
}

// ============================================================================
// Enums
// ============================================================================

/**
 * Valid Datatype Values
 */
export enum DatatypeEnum {
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  NUMBER = 'NUMBER',
  DEVICE = 'DEVICE',
  REAGENT = 'REAGENT'
}

/**
 * Run Flag Values
 */
export enum RunFlagEnum {
  YES = 'Y',
  NO = 'N'
}

/**
 * Date Filter Operators
 */
export enum DateFilterOperator {
  AFTER = 'After',
  BEFORE = 'Before'
}

// ============================================================================
// UI Models
// ============================================================================

/**
 * Filter State for UI
 */
export interface TparmFilterState {
  datatype: string | null;
  relatedCode: string | null;
  voidCode: string | null;
  effDateOperator: DateFilterOperator | null;
  effDateValue: Date | null;
  termDateOperator: DateFilterOperator | null;
  termDateValue: Date | null;
}

/**
 * Form Mode
 */
export enum FormMode {
  ADD = 'add',
  EDIT = 'edit',
  VIEW = 'view'
}

/**
 * List Item for Display (includes chips)
 */
export interface TparmListItem {
  parmCode: string;
  description: string;
  datatype: string;
  relatedCode: string | null;
  effDate: string;
  termDate: string | null;
}
