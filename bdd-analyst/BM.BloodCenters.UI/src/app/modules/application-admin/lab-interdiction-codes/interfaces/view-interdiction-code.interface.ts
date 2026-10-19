export interface InterdictionCodeApiResponse {
  interCode: string;
  interType: string;
  interDesc: string;
  systemInterCode: string;
  systemInterFlag: string;
  effDate: string;
  lastModifiedDate: string;
  auditKey: number;
  programId: string;
  changeControlFlag: string;
  termDate?: string;
}


export interface AppliedFilters {
  type?: string;            // Interdiction type: 'H', 'B', 'N', etc.
  system?: 'Y' | 'N' | '';  // System flag
  effPeriod?: string;       // Effective date period, e.g., 'lastMonth'
  effDate?: Date | null;    // Specific effective date
  termPeriod?: string;      // Termination date period
  termDate?: Date | null;   // Specific termination date
}