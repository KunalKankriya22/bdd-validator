// ✅ PATTERN: Export all interfaces for type safety

export interface DonorInfo {
  donorName: string;
  dateOfBirth: string;  // Format: MM-DD-YYYY from API
  sex: string;
  abo: string;
  address: string;
  homePhone: string;
  businessPhone: string;
}

export interface DonorCommunication {
  // ✅ PATTERN: Required fields from actual API response
  dateAndTime: string;                    // ISO 8601 format: "1993-11-18T07:04:13"
  communicationType: string;              // e.g., "NOTFY"
  communicationTypeDescription: string;   // e.g., "Donor Notification" (can be empty string)
  communicationCode: string;              // e.g., "MIS09"
  communicationCodeDescription: string;   // Can be empty string from API
  actionCode: string;                     // Can be empty string from API
  actionCodeDescription: string;          // Can be empty string from API
  comments: string;                       // e.g., "Notification : "
  staffId: string;                        // Can be empty string from API
  staffName: string;                      // e.g., ", " (can be empty/just comma)
  insertUserName: string;                 // e.g., "A. Donsys"
  letterId: string;                       // e.g., "LSQ0545603" (string, not number)

  // ✅ PATTERN: Optional fields - not in current API response but may be added later
  targetDate?: string;                    // ISO 8601 format (not currently in API)
  actionDate?: string;                    // ISO 8601 format (not currently in API)
}

export interface LookupItem {
  code: string;
  description: string;
}

export interface StaffItem {
  staffId: string;
  name: string;
}

export interface AddDropdownValues {
  communicationTypes: LookupItem[];
  staffList: StaffItem[];
  actionCodes: LookupItem[];
}

export interface LetterDetails {
  letterCode: string;
  description: string;
  generatedBy: string;
  generatedName: string;
  generatedOn: string;        // ISO 8601 format
  authorizedBy: string;
  authorizedName: string;
  authorizedOn: string;       // ISO 8601 format
  reprintBy?: string;         // Optional - may not exist if never reprinted
  reprintName?: string;       // Optional - may not exist if never reprinted
  reprintOn?: string;         // Optional - may not exist if never reprinted, ISO 8601 format
  letterText: string;
  modifyIndicator: string;    // e.g., "Y" or "N"
}

// ✅ PATTERN: Generic API response wrapper for notification-log endpoints
export interface NotificationLogApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T[];
  total?: number;               // Optional - may not be present in all responses
  errorResponse?: {             // Optional - may not be present in all responses
    errorCode: string;
    error: string;
  };
}

// Interfaces for CREATE/UPDATE operations
export interface CreateCommunicationRequest {
  communicationType: string;
  communicationCode: string;
  comments?: string;
  staffId?: string;
  actionCode?: string;
  targetDate?: string;      // ISO 8601 format: "2025-08-15T00:00:00"
  actionDate?: string;       // ISO 8601 format: "2025-08-15T00:00:00"
}
