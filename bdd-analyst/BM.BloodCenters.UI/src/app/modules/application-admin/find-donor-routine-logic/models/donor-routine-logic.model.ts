/**
 * Request model for donor search using Find Donor Routine Logic
 */
export interface DonorSearchRequest {
  ssn?: number;
  lastName?: string;
  firstName?: string;
  dateOfBirth?: string;
  gender?: 'M' | 'F';
  topResults?: number;
  chapterId?: string;
  insertUser: string;
  searchItem?: string;
  bloodType?: string;
}

/**
 * Response model for donor search with grading
 */
export interface DonorSearchResponse {
  sessionId: string;
  totalDonors: number;
  grade1Count: number;
  grade2Count: number;
  grade3Count: number;
  grade4Count: number;
  grade5Count: number;
  searchCriteria: DonorSearchRequest;
  donors: DonorSearchResult[];
}

/**
 * Individual donor search result with grade (unique donors grouped)
 */
export interface DonorSearchResult {
  sessionId: string;
  donorId: string;
  ssn?: number;
  lastName: string;
  firstName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  bloodType?: string;
  soundexKey: string;
  grade: number;
  dgmId: number;
  insertDate: string;
  chapterId: string;
  programId: string;
}

/**
 * Match grade summary for selected donor (from session endpoint)
 */
export interface MatchGradeSummary {
  sessionId: string;
  totalDonors: number;
  grade1Count: number;
  grade2Count: number;
  grade3Count: number;
  grade4Count: number;
  grade5Count: number;
  results: SessionResult[];
}

/**
 * Session result record for data table
 */
export interface SessionResult {
  sessionId: string;
  donorId: string;
  ssn?: number;
  lastName: string;
  firstName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  bloodType?: string;
  soundexKey: string;
  grade: number;
  dgmId: number;
  insertDate: string;
  chapterId: string;
  programId: string;
}

/**
 * Grade filter type
 */
export type GradeFilter = 'all' | '1' | '2' | '3' | '4' | '5';
