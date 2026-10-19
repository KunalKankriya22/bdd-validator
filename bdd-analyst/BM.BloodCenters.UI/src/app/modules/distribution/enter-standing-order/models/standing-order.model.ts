/**
 * Standing Order Models and DTOs
 * Based on API Documentation: /api/standing-orders
 */

// ─── Common Response Wrapper ───────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[] | null;
  totalCount?: number;
  total?: number;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

// ─── Standing Order (Header) DTOs ──────────────────────────────────────────

/** API response DTO for standing order */
export interface StandingOrderDto {
  chapterId: string;
  contractId: string;
  consigneeId: string;
  weekDay: string; // SUN, MON, TUE, WED, THU, FRI, SAT
  confirmFlag: string; // Y or N
  requiredTime: number | null; // 0-23 hours
  effDate: string; // ISO DateTime
  termDate: string | null; // ISO DateTime
  lastModifiedDate: string | null; // ISO DateTime
}

/** Display DTO for standing order list (with formatted dates) */
export interface StandingOrderListDto {
  contractId: string;
  consigneeId: string;
  weekDay: string;
  weekDayDisplay: string; // Full name: Monday, Tuesday, etc.
  confirmation: string; // Yes or No
  timeRequired: string; // 9:00 AM, 10:00 AM, etc.
  effectiveDate: string; // DD-MMM-YYYY
  terminationDate: string | null; // DD-MMM-YYYY or --
  modificationDate: string | null; // DD-MMM-YYYY, HH:MM AM/PM
}

/** Query DTO for listing standing orders */
export interface StandingOrderQueryDto {
  contractId?: string | null;
  consigneeId?: string | null;
  weekDay?: string | null;
  customerId?: string | null;
  fromDate?: string | null; // YYYY-MM-DD
  toDate?: string | null; // YYYY-MM-DD
  searchKeyword?: string | null;
  sortColumn?: string;
  sortOrder?: string; // ASC or DESC
}

/** Create standing order request DTO */
export interface CreateStandingOrderDto {
  contractId: string; // Max 10 chars, required
  consigneeId: string; // Max 10 chars, required
  weekDay: string; // SUN-SAT, required
  confirmFlag: string; // Y or N, required
  requiredTime?: number | null; // 0-23, optional
  effDate: string; // YYYY-MM-DD, required, not in past
  termDate?: string | null; // YYYY-MM-DD, optional, >= effDate
}

/** Update standing order request DTO */
export interface UpdateStandingOrderDto {
  confirmFlag: string; // Y or N, required
  requiredTime?: number | null; // 0-23, optional
  effDate: string; // YYYY-MM-DD, required
  termDate?: string | null; // YYYY-MM-DD, optional, >= effDate
}

// ─── Standing Order Items (Detail) DTOs ────────────────────────────────────

/** API response DTO for standing order item */
export interface StandingOrderItemDto {
  chapterId?: string;
  contractId?: string;
  consigneeId?: string;
  weekDay?: string;
  itemNo: number;
  productType: string;
  productTypeShortName?: string | null;
  bloodType: string; // Max 4 chars, NOT NULL in DB
  bloodTypeDescription?: string | null;
  tier?: string | null; // VARCHAR2(2) in DB
  qty: number;
  subOk?: string | null; // Y or N
  minQty?: number | null;
  effDate: string; // ISO DateTime
  termDate?: string | null; // ISO DateTime
  lastModifiedDate?: string | null; // ISO DateTime
  attributeDisplay?: string | null;
  attribGroup?: string | null;
  attribCode?: string | null;
}

/** Display DTO for standing order items list */
export interface StandingOrderItemListDto {
  itemNo: number;
  weekDay: string;
  weekDayDisplay: string;
  productType: string;
  productName: string;
  abOrh: string; // Blood type or --
  tier: string; // Tier value or --
  quantity: number;
  substitution: string; // Yes - Allowed or No
  minimumQuantity: string; // Number or --
  attributeDisplay: string; // Formatted attribute or --
  effectiveDate: string; // DD-MMM-YYYY
  terminationDate: string | null; // DD-MMM-YYYY or --
}

/** Query DTO for listing standing order items */
export interface StandingOrderItemQueryDto {
  productType?: string | null;
  bloodType?: string | null;
  tier?: string | null; // VARCHAR2(2) in DB
  fromDate?: string | null; // YYYY-MM-DD
  toDate?: string | null; // YYYY-MM-DD
  searchKeyword?: string | null;
  sortColumn?: string;
  sortOrder?: string; // ASC or DESC
}

/** Create standing order item request DTO */
export interface CreateStandingOrderItemDto {
  itemNo?: number; // Auto-generated if 0, optional
  productType: string; // Max 5 chars, required
  bloodType: string; // Max 4 chars, NOT NULL in DB
  tier?: string | null; // Default: '1', VARCHAR2(2) in DB
  qty: number; // > 0, required
  subOk?: string | null; // Y or N, optional
  minQty?: number | null; // > 0 and <= qty, optional
  effDate: string; // YYYY-MM-DD, required, not in past
  termDate?: string | null; // YYYY-MM-DD, optional, >= effDate
  attribGroup?: string | null;
  attribCode?: string | null;
}

/** Update standing order item request DTO */
export interface UpdateStandingOrderItemDto {
  productType: string; // Max 5 chars, NOT NULL in DB
  bloodType: string; // Max 4 chars, NOT NULL in DB
  tier?: string | null; // VARCHAR2(2) in DB
  qty?: number; // > 0
  subOk?: string | null; // Y or N
  minQty?: number | null; // > 0 and <= qty
  effDate?: string; // YYYY-MM-DD
  termDate?: string | null; // YYYY-MM-DD, >= effDate
  attribGroup?: string | null;
  attribCode?: string | null;
}

// ─── Filter Panel Models ───────────────────────────────────────────────────

/** Filter values for standing order list screen */
export interface StandingOrderFilterValue {
  customerType: string | null;
  contractId: string | null;
  contractName: string | null;
  consigneeId: string | null;
}

/** Filter values for standing order items screen */
export interface StandingOrderItemFilterValue {
  productType: string | null;
  bloodType: string | null;
  tier: number | null;
}

// ─── Dropdown Options (LOV - List of Values) ──────────────────────────────

/** Generic dropdown option */
export interface LovOption {
  code: string;
  description: string;
}

export interface ContractOption extends LovOption {
  customerId: string;
}

/** Week day option */
export interface WeekDayOption {
  code: string; // SUN, MON, TUE, WED, THU, FRI, SAT
  display: string; // Sunday, Monday, Tuesday, etc.
}

/** Time option for required time dropdown */
export interface TimeOption {
  value: number; // 0-23
  display: string; // 12:00 AM, 1:00 AM, ..., 11:00 PM
}

/** Blood type option */
export interface BloodTypeOption {
  code: string; // O+, O-, A+, A-, B+, B-, AB+, AB-
  display: string;
}

/** Substitution option */
export interface SubstitutionOption {
  code: string; // Y or N
  display: string; // Yes - Allowed or No
}

// ─── Constants ─────────────────────────────────────────────────────────────

/** Week day constants */
export const WEEK_DAYS: WeekDayOption[] = [
  { code: 'SUN', display: 'Sunday' },
  { code: 'MON', display: 'Monday' },
  { code: 'TUE', display: 'Tuesday' },
  { code: 'WED', display: 'Wednesday' },
  { code: 'THU', display: 'Thursday' },
  { code: 'FRI', display: 'Friday' },
  { code: 'SAT', display: 'Saturday' }
];

/** Time options (0-23 hours) */
export const TIME_OPTIONS: TimeOption[] = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 === 0 ? 12 : i % 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return {
    value: i,
    display: `${hour}:00 ${ampm}`
  };
});

/** Blood type constants */
export const BLOOD_TYPES: BloodTypeOption[] = [
  { code: 'O+', display: 'O+' },
  { code: 'O-', display: 'O-' },
  { code: 'A+', display: 'A+' },
  { code: 'A-', display: 'A-' },
  { code: 'B+', display: 'B+' },
  { code: 'B-', display: 'B-' },
  { code: 'AB+', display: 'AB+' },
  { code: 'AB-', display: 'AB-' }
];

/** Substitution options */
export const SUBSTITUTION_OPTIONS: SubstitutionOption[] = [
  { code: 'Y', display: 'Yes - Allowed' },
  { code: 'N', display: 'No' }
];

/** Confirmation options */
export const CONFIRMATION_OPTIONS: SubstitutionOption[] = [
  { code: 'Y', display: 'Yes' },
  { code: 'N', display: 'No' }
];

// ─── Helper Functions ──────────────────────────────────────────────────────

/** Convert week day code to display name */
export function getWeekDayDisplay(code: string): string {
  const day = WEEK_DAYS.find(d => d.code === code);
  return day ? day.display : code;
}

/** Convert time number to display format (9:00 AM) */
export function getTimeDisplay(time: number | null | undefined): string {
  if (time === null || time === undefined) {
    return '--';
  }
  const option = TIME_OPTIONS.find(t => t.value === time);
  return option ? option.display : '--';
}

/** Convert Y/N to Yes/No */
export function getYesNoDisplay(value: string | null | undefined): string {
  if (value === 'Y') return 'Yes';
  if (value === 'N') return 'No';
  return '--';
}

/** Convert Y/N to Yes - Allowed/No for substitution */
export function getSubstitutionDisplay(value: string | null | undefined): string {
  if (value === 'Y') return 'Yes - Allowed';
  if (value === 'N') return 'No';
  return '--';
}
