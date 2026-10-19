/**
 * Match field options for Last Name, First Name
 * BE values → FE display
 */
export const NAME_MATCH_OPTIONS = [
  { value: 'SAME', label: 'Same' },
  { value: 'DIFF', label: 'Different' },
  { value: 'SIMM', label: 'Similar' },
  { value: 'SNDX', label: 'Soundex' }
];

/**
 * DOB Match options (no Soundex)
 */
export const DOB_MATCH_OPTIONS = [
  { value: 'SAME', label: 'Same' },
  { value: 'DIFF', label: 'Different' },
  { value: 'SIMM', label: 'Similar' }
];

/**
 * Gender Match options
 */
export const GENDER_MATCH_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'DIFF', label: 'Different' }
];

/**
 * Grade options (1-5)
 */
export const GRADE_OPTIONS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' }
];

/**
 * Display label lookup for name/DOB match fields (table column formatting)
 */
export const MATCH_LABELS: Record<string, string> = {
  'SAME': 'Same',
  'DIFF': 'Different',
  'SIMM': 'Similar',
  'SNDX': 'Soundex'
};

/**
 * Display label lookup for gender field
 */
export const GENDER_LABELS: Record<string, string> = {
  'M': 'Male',
  'F': 'Female',
  'DIFF': 'Different'
};

/**
 * DonorGradingMatrix — matches BE response item exactly
 */
export interface DonorGradingMatrix {
  dgmId: number;
  lastnameMatch: string;    // SAME, DIFF, SIMM, SNDX
  firstnameMatch: string;   // SAME, DIFF, SIMM, SNDX
  dobMatch: string;          // SAME, DIFF, SIMM
  genderMatch: string;       // M, F, DIFF
  grade: number;             // 1-5
}

/**
 * Request body for list endpoint (POST /api/v1/donor-grading-matrix/{take}/{skip})
 * All fields optional
 */
export interface DonorGradingMatrixFilter {
  searchKeyword?: string;
  lastnameMatch?: string;
  firstnameMatch?: string;
  dobMatch?: string;
  genderMatch?: string;
  grade?: number;
  sort?: string;             // "dgmId_asc", "dgmId_desc"
}

/**
 * Request body for adding a new record (POST /api/v1/donor-grading-matrix)
 */
export interface CreateDonorGradingMatrix {
  lastnameMatch: string;     // Required, max 5
  firstnameMatch: string;    // Required, max 5
  dobMatch: string;           // Required, max 5
  genderMatch: string;        // Required, max 5
  grade: number;              // Required
}

/**
 * Request body for updating a record (PUT /api/v1/donor-grading-matrix/{dgmId})
 * dgmId is in URL, not body
 */
export interface UpdateDonorGradingMatrix {
  lastnameMatch: string;     // Required, max 5
  firstnameMatch: string;    // Required, max 5
  dobMatch: string;           // Required, max 5
  genderMatch: string;        // Required, max 5
  grade: number;              // Required
}

/**
 * Filter panel form value interface
 */
export interface DonorGradingMatrixFilterValue {
  lastnameMatch: string | null;
  firstnameMatch: string | null;
  dobMatch: string | null;
  genderMatch: string | null;
  grade: number | null;
}
