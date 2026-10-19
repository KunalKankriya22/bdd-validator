/**
 * Models for Donor Antigens Query
 * Based on API Documentation for MLT-10917
 */

/**
 * Donor demographic and identifying information
 */
export interface DonorInfo {
  donorId: string;
  donorName: string;
  dateOfBirth: string;
  gender: string;
  aboType: string;
}

/**
 * RBC antigen test result
 */
export interface RbcAntigen {
  testId: string;
  resultCode: string;
  isPositive: boolean;
}

/**
 * HLA antigen typing across all loci
 */
export interface HlaAntigens {
  a1: string | null;
  a2: string | null;
  b1: string | null;
  b2: string | null;
  c1: string | null;
  c2: string | null;
  d1: string | null;
  d2: string | null;
  dr: string | null;
}

/**
 * Complete donor antigens query response data
 */
export interface DonorAntigensData {
  donorInfo: DonorInfo;
  rbcAntigens: RbcAntigen[];
  hlaAntigens: HlaAntigens;
}

/**
 * API response wrapper
 */
export interface DonorAntigensQueryResponse {
  success: boolean;
  statusCode: number;
  message: string;
  item: DonorAntigensData;
}

/**
 * Donor interdiction record (mock model for dialog)
 */
export interface DonorInterdiction {
  interdiction: string;
  type: string;
  unitId: string;
  effectiveDate: string;
  termDate: string;
  userId: string;
  originated: string;
  reason: string;
  releasedBy: string;
  releaseDate: string;
  description: string;
  note: string;
}

/**
 * Filter options for interdictions dialog
 */
export interface InterdictionFilterValue {
  showTerminated: boolean;
}
