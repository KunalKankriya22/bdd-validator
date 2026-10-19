// ── Shared API response wrapper ──────────────────────────────────────────────

export interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T[];
  totalCount: number;
}

// ── Row / Query DTOs (aligned to BE Equipment model) ─────────────────────────

export interface EquipmentStatusItem {
  chapterId: string;
  equipType: string;
  equipId: string;
  equipReference: string;
  serialNumber: string;
  location: string;
  status: string;
  statusDescription: string;
  firstProductionDate: string | null;
  lastProductionDate: string | null;
  // Detail-only fields (populated by GetById endpoint)
  locationDescription?: string | null;
  receivedDate?: string | null;
  usageHoursPerDay?: number | null;
  usageDaysPerWeek?: number | null;
  manufacturer?: string | null;
  serviceContact?: string | null;
  servicePhone?: string | null;
  serviceStartDate?: string | null;
  serviceEndDate?: string | null;
}

export interface EquipmentStatusQueryDto {
  equipmentType?: string | null;
  equipmentId?: string | null;
  reference?: string | null;
  status?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

// ── Dropdown DTOs (aligned to BE EquipmentLookupDto) ─────────────────────────

export interface EquipmentLookupDto {
  code: string;
  description: string;
}

export interface EquipmentIdLookupDto {
  code: string;
  reference: string;
  serviceDates: string | null;
}

export interface EquipmentReferenceLookupDto {
  code: string;
  serviceDates: string | null;
}

// ── Statistics (aligned to BE EquipmentStatisticsDto) ────────────────────────

export interface EquipmentStatisticsDto {
  equipType: string;
  equipTypeDescription: string | null;
  equipId: string;
  equipReference: string;
  firstProductionDate: string | null;
  monthToDate: DowntimePeriodDto;
  previousMonth: DowntimePeriodDto;
  yearToDate: DowntimePeriodDto;
  previousYear: DowntimePeriodDto;
}

export interface DowntimePeriodDto {
  daysInService: number;
  eventCount: number;
  totalDowntimeHours: number;
  percentAvailable: number;
}

// ── Equipment Details (for detail view — maps to enhanced GetById response) ──

export interface ConfigurableDetailDto {
  sequence: number;
  description: string;
  value: string;
}
