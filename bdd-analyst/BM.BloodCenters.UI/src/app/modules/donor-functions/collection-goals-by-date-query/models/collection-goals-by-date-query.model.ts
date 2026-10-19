export interface GoalTypeOption {
  code: string;
  description: string;
}

export interface CustodianOption {
  custodianId: string;
  custodianName: string;
}

export interface DonationTypeBreakdown {
  donationType: string;
  donationTypeDescription: string;
  goalCount: number;
}

export interface BloodTypeBreakdown {
  bloodType: string;
  bloodTypeDescription: string;
  goalCount: number;
}

export interface ProcedureCodeBreakdown {
  procedureCode: string;
  procedureCodeDescription: string;
  goalCount: number;
}

export interface CollectionGoalsSummaryItem {
  goalType: string;
  goalTypeDescription: string;
  goalCustodian: string;
  totalGoalRecords: number;
  totalGoalCount: number;
  startDate: string;
  endDate: string;
  dayOfWeek: string;
  byDonationType: DonationTypeBreakdown[];
  byBloodType: BloodTypeBreakdown[];
  byProcedureCode: ProcedureCodeBreakdown[];
}

export interface ErrorResponse {
  errorCode: string;
  error: string;
}

export interface CollectionGoalsSummaryResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: CollectionGoalsSummaryItem[];
  total: number;
  errorResponse: ErrorResponse;
}

export interface CollectionGoalsQueryRequest {
  goalType: string;
  custodian: string;
  startDate: string;
  endDate: string;
  chapterId?: string;
  sortDirection?: string;
  sortField?: string;
}

// Flattened row for table display
export interface CollectionGoalTableRow {
  day: string;
  startDate: string;
  endDate: string;
  donationType: string;
  procedureCode: string;
  aboTypeDescription: string;
  goalCount: number;
}

export interface GoalTypesResponse {
  data: GoalTypeOption[];
}

export interface CustodiansResponse {
  data: CustodianOption[];
}
