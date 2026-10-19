/**
 * ResourceAvailabilityRuleModel
 * Represents a resource availability rule record from the API
 */
export interface ResourceAvailabilityRuleModel {
  chapterId?: string;
  resourceCode?: string;
  resourceDescription?: string;
  weekDay?: string; // MON, TUE, WED, THU, FRI, SAT, SUN
  maxAvailable?: number | null;
  effectiveDate?: string; // ISO 8601 format
  terminationDate?: string | null; // ISO 8601 format
  isResourceTerminated?: boolean;
  // Legacy field names for backward compatibility
  resourceDesc?: string;
  effDate?: string;
  termDate?: string | null;
}

/**
 * Valid Resource Model
 * Represents a valid resource from VALID_RESOURCES table
 */
export interface ValidResourceModel {
  resourceCode: string;
  resourceDescription?: string;
  termDate?: string | null;
  sortSeq?: number;
  isTerminated?: boolean;
}

/**
 * Resource Availability Summary Model
 * Summary view showing resource availability by day of week
 */
export interface ResourceAvailabilitySummaryModel {
  sortSeq?: number;
  resourceCode: string;
  resourceDescription?: string;
  chapterId: string;
  monday?: number | null;
  tuesday?: number | null;
  wednesday?: number | null;
  thursday?: number | null;
  friday?: number | null;
  saturday?: number | null;
  sunday?: number | null;
}

/**
 * Request DTO for fetching Resource Availability Rules
 * POST /api/v1/resource-availability/details
 */
export interface ResourceAvailabilityRulesParamsDto {
  chapterId: string;
  resourceCode: string;
  day?: string;
  showTerminated: string; // 'str'
  effectiveDate?: string; // ISO 8601 format: "2026-04-02T22:54:41.891Z"
  terminationDate?: string; // ISO 8601 format: "2026-04-02T22:54:41.891Z"
  periodEffDate?: string;
  periodTermDate?: string;
  sortDirection?: string;
}

/**
 * DTO for creating new Resource Availability Rule
 * POST /api/v1/resource-availability/insert
 */
export interface CreateResourceAvailabilityRuleDto {
  chapterId: string;
  loggedInUserName: string;
  resourceCode: string;
  weekDay: string;
  maxAvailable: number | null;
  effectiveDate: string; // ISO 8601 format: "2026-04-03T10:14:40.139Z"
  terminationDate?: string | null; // ISO 8601 format: "2026-04-03T10:14:40.139Z"
}

/**
 * DTO for updating existing Resource Availability Rule
 * PUT /api/v1/resource-availability/update
 */
export interface UpdateResourceAvailabilityRuleDto {
  chapterId: string;
  loggedInUserName: string;
  resourceCode: string;
  weekDay: string;
  maxAvailable: number | null;
  effectiveDate: string; // Original effective date for WHERE clause
  terminationDate?: string | null;
}

/**
 * Week Day Model
 * Represents a week day from the dropdown API
 */
export interface WeekDayModel {
  weekDayCode?: string;
  weekDayName?: string;
  sortOrder?: number;
  // Legacy/alternative property names for backward compatibility
  code?: string;
  Code?: string;
  value?: string;
  Value?: string;
  description?: string;
  Description?: string;
}

/**
 * Filter values for Resource Availability Rules
 */
export interface ResourceAvailabilityFilterValue {
  day: string | null;
  effectiveDateFrom: string | null;
  effectiveDateTo: string | null;
  terminationDateFrom: string | null;
  terminationDateTo: string | null;
}
