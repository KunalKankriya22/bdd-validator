// ── Filter / Report ──────────────────────────────────────────────────────────

export interface CollectionStatisticsRequest {
  fromDate: string;
  toDate: string;
  option?: string;
  donationTypes?: string;
  procedureCodes?: string;
}

export interface DailyStatisticsDto {
  collectionDate: string;
  collectionDay: string;
  actualDraw: number;
  actualDeferral: number;
}

export interface DonationProcedureStatisticsDto {
  collectionDate: string;
  donationType: string;
  procedureCode: string;
  donationProcedureCount: number;
}

export interface CollectionStatisticsResponse {
  fromDate: string;
  toDate: string;
  totalDraws: number;
  totalDeferrals: number;
  totalProcedures: number;
  dailyStatistics: DailyStatisticsDto[];
  procedureStatistics: DonationProcedureStatisticsDto[];
}

// ── Date Detail (VENI + Deferral breakdown) ──────────────────────────────────

export interface DateDetailRequest {
  collectionDate: string;
  option?: string;
  donationTypes?: string;
  procedureCodes?: string;
}

export interface VenipunctureStatDto {
  veniCode: string;
  veniDesc: string;
  veniCount: number;
}

export interface GeneralStatRow {
  donationType?: string | null;
  procedureCode?: string | null;
  donationProcCount?: number | null;
  veniCode?: string | null;
  veniDesc?: string | null;
  veniCount?: number | null;
  interCode?: string | null;
  originatedFrom?: string | null;
  defCount?: number | null;
}

export interface DeferralStatDto {
  interCode: string;
  originatedFrom: string;
  description: string;
  defCount: number;
}

export interface DateDetailResponse {
  procedureStatistics: DonationProcedureStatisticsDto[];
  venipunctureStatistics: VenipunctureStatDto[];
  deferralStatistics: DeferralStatDto[];
  totalProcedureCount: number;
  totalVeniCount: number;
  totalDeferralCount: number;
}

// ── Units ────────────────────────────────────────────────────────────────────

export interface UnitsRequest {
  collectionDate: string;
  option?: string;
  donationType?: string;
  procedureCode?: string;
}

export interface UnitRowDto {
  unitId: string | null;
  displayUnitId: string;
  donationType: string;
  procedureCode: string;
  transactionId?: string;
  collDate?: string;
  driveId?: string;
  donorId?: string;
  deferralReason?: string | null;
  bagType?: string;
  donorCue?: string;
  deferralId?: string | null;
  attrib01?: string | null;
  attrib02?: string | null;
  attrib03?: string | null;
  attrib04?: string | null;
  attrib05?: string | null;
  attrib06?: string | null;
  attrib07?: string | null;
  attrib08?: string | null;
}

// ── Goals ────────────────────────────────────────────────────────────────────

export interface GoalsRequest {
  collectionDate: string;
  option?: string;
}

export interface GoalRowDto {
  donationType: string;
  donationTypeDescription: string;
  procedureCode: string;
  procedureCodeDescription: string;
  goalCount: number;
}

// ── Shared / LOV ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

export interface CollectionOptionItem {
  value: string;
  label: string;
}

export interface DonationTypeLookup {
  code: string;
  description: string;
}

export interface ProcedureCodeLookup {
  code: string;
  description: string;
}
