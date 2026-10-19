export interface InterdictionCodePayload {
  take: number;
  skip: number;
  searchText?: string;
  sortOrder?: string;
  interType?: string;
  systemInterFlag?: string;
  periodEffDate?: string;
  effectiveDate?: string;
  periodTermDate?: string;
  terminationDate?: string;
}

export interface AddInterdictionCodeModel {
  interCode: string;
  interType: string;
  interDesc: string;
  systemInterCode: string;
  systemInterFlag: string;
  effDate: string;              // calendar date, must be >= today (UTC)
  programId: string;
  changeControlFlag: string;
  termDate?: string;            // calendar date, must be >= effDate
}

export interface EditInterdictionCodeModel {
  interType: string;
  interDesc: string;
  systemInterCode: string;
  systemInterFlag: string;
  programId: string;
  changeControlFlag: string;
  termDate?: string | null;     // calendar date, must be >= effDate
  interCode : string
}

/**
 * Tab type for the interdiction codes view
 */
export type InterdictionCodeTabType = 'donor' | 'lab';
