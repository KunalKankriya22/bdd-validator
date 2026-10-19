/**
 * Donor Communication Query Models
 * JIRA: MLT-11066
 * API: /api/v1/donor-communication-query
 */

/**
 * Query request payload for searching donor communications
 */
export interface DonorCommunicationQueryRequest {
  fromDate: string; // ISO 8601 format: "2026-05-01T00:00:00Z"
  toDate: string; // ISO 8601 format: "2026-05-13T23:59:59Z"
  userId?: string;
  commType?: string;
  commCode?: string;
  donorId?: string;
  pendingActionsOnly?: boolean; // Filter for null action codes (converted to "T"/"F" in service)
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Communication record returned from query
 * All updatable fields are always present (nullable fields return null, not omitted)
 */
export interface CommunicationRecord {
  donorId: string;
  name: string; // Format: "Last, First Middle"
  dob: string; // Format: "MM-DD-YYYY"
  sex: string; // M or F
  abo: string; // Blood type description
  comType: string;
  comCode: string;
  insertUser: string;

  // DISPLAY FIELDS - Show these in the UI (chapter local time)
  comDate: string; // Format: "MM-DD-YYYY" - Communication Date
  insertDate: string; // Format: "MM-DD-YYYY"
  targetDate: string | null; // Updatable (MM-DD-YYYY)
  actionDate: string | null; // Updatable (MM-DD-YYYY)

  // GMT FIELDS - Use these for API calls (PUT/DELETE/GET by ID)
  insertDateGmt: string; // Format: "YYYY-MM-DDTHH:mm:ss" in GMT
  targetDateGmt: string | null; // Format: "YYYY-MM-DDTHH:mm:ss" in GMT
  actionDateGmt: string | null; // Format: "YYYY-MM-DDTHH:mm:ss" in GMT

  actionCode: string | null; // Updatable
  comDesc: string | null; // Updatable
  chapterId: string;
}

/**
 * API response for communication query
 */
export interface DonorCommunicationQueryResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: CommunicationRecord[];
  total: number;
  errorResponse?: ErrorResponse;
}

/**
 * Action code option for dropdown
 */
export interface ActionCodeOption {
  code: string;
  description: string;
}

/**
 * Update communication request payload
 * Only these fields can be updated
 */
export interface UpdateCommunicationRequest {
  actionCode?: string | null; // Max 5 characters
  targetDate?: string | null; // ISO 8601 format
  actionDate?: string | null; // ISO 8601 format
  comDesc?: string | null; // Max 2000 characters
}

/**
 * API response for update operation
 */
export interface UpdateCommunicationResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data?: CommunicationRecord;
  errorResponse?: ErrorResponse;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  errorCode: string;
  error: string;
}

/**
 * Communication type option for dropdown
 */
export interface CommunicationTypeOption {
  code: string;
  description: string;
}

/**
 * Communication type API response wrapper
 */
export interface CommunicationTypeResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: CommunicationTypeOption[];
  total: number;
  errorResponse?: ErrorResponse;
}

/**
 * Communication code option for dropdown
 */
export interface CommunicationCodeOption {
  code: string;
  description: string;
}

/**
 * Communication code API response wrapper
 */
export interface CommunicationCodeResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: CommunicationCodeOption[];
  total: number;
  errorResponse?: ErrorResponse;
}

/**
 * User list item for dropdown
 */
export interface UserListItem {
  userId: string;
  userName: string; // Format: "Last, First"
}

/**
 * Composite ID for identifying a communication record
 */
export interface CommunicationCompositeId {
  donorId: string;
  comType: string;
  comCode: string;
  insertUser: string;
  insertDate: string;
}

/**
 * Dropdown item structure from combined API
 */
export interface DropdownItem {
  key: string;
  value: string;
  description: string;
}

/**
 * Combined communication dropdowns API response
 */
export interface CommunicationDropdownsResponse {
  communicationType: DropdownItem[];
  communicationCode: DropdownItem[];
}
