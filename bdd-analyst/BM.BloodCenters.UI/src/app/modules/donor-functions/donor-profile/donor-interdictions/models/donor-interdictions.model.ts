/**
 * Models for Donor Interdictions (DPWDNINT)
 * Based on Oracle Forms FMB and backend API
 */

/**
 * Donor information displayed in header
 * Mapped from API response
 */
export interface DonorInfo {
  donorId: string;
  donorName: string;
  dateOfBirth: string;  // Already formatted as "20-APR-1970"
  gender: string;       // "Female" or "Male"
  aboType: string;      // Blood type from API (bloodType)
}

/**
 * API response for donor details
 * GET /api/v1/donor/{donorId}/interdiction-details
 */
export interface DonorDetailsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: {
    donorId: string;
    name: string;
    dateOfBirth: string;
    gender: string;
    street: string;
    bloodType: string;
    otherInters: number;
  };
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

/**
 * Donor interdiction record from API
 * Maps to DONOR_INTERDICTIONS block in FMB
 */
export interface DonorInterdiction {
  interCode: string;             // Interdiction code (e.g., "102A", "PHYPD")
  interType: string;             // Interdiction type (e.g., "INTER")
  interDesc?: string | null;      // Description (nullable from LEFT JOIN)
  unitId?: string | null;        // Unit ID (optional, with check digit)
  effDate: string;               // Effective date (ISO format)
  termDate?: string | null;      // Termination date (ISO format, null if active)
  releaseDate?: string | null;   // Release date (ISO format)
  insertUser: string;            // User who created the interdiction
  releaseUser?: string | null;   // User who released the interdiction
  originatedFrom?: string;       // Origin (e.g., "DONATION", "SCREENING")
  reasonCode?: string;           // Reason code
  termReason?: string | null;    // Termination reason description
  groupMode: string | null;      // Group mode (e.g., "DRIVE")
  groupId: string | null;        // Group ID (e.g., "DRV0174057")
  chapterId: string;             // Chapter ID
  donorId: string;               // Donor ID
  noteId?: string | null;        // Note ID
  notes?: string | null;         // Notes
}

/**
 * API response from backend
 * GET /api/v1/donor/{donorId}/interdictions
 */
export interface DonorInterdictionsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: DonorInterdiction[];
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}
