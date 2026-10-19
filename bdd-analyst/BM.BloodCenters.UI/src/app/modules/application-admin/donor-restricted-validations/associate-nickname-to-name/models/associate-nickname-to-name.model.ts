// Frontend model (camelCase for UI consistency)
export interface AssociateNicknameToName {
  nickName: string;
  firstName: string;
  effDate: string;
  termDate: string | null;
  programId: string;
  insertDate: string;
  insertUser: string;
  auditKey: number;
  isActive?: boolean; // Computed client-side based on termDate
}

// API Response model (matches backend response structure)
export interface AssociateNicknameApiModel {
  nickName: string;
  firstName: string;
  effDate: string;
  termDate?: string | null;
  programId: string;
  insertDate: string;
  insertUser: string;
  auditKey: number;
}

// API Response wrapper for list endpoint
export interface AssociateNicknameApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: AssociateNicknameApiModel[];
  total: number;
}

// API Response wrapper for single item endpoint
export interface AssociateNicknameSingleApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: AssociateNicknameApiModel;
  total: number;
}

// API Response for mutations (create/update)
export interface AssociateNicknameMutationResponse {
  success: boolean;
  message: string;
  statusCode: number;
  total: number;
  item?: AssociateNicknameApiModel;
  error?: string;
}

// Filter interface matching API search request body
export interface AssociateNicknameFilter {
  searchItem?: string; // Global search across nickName and firstName
  nickName?: string;
  firstName?: string;
  effectiveDate?: string; // ISO date string
  effectivePeriod?: string; // Period filter: 'BEFORE' or 'AFTER'
  terminationDate?: string; // ISO date string
  terminationPeriod?: string; // Period filter: 'BEFORE' or 'AFTER'
  includeTerminated?: boolean;
  sort?: string; // Sort order
}

// Create request (POST /api/v1/associate-nickname-to-name)
export interface AssociateNicknameCreateRequest {
  nickName: string;
  firstName: string;
  effDate: string; // ISO date string
  termDate?: string | null; // ISO date string
}

// Update request (PUT /api/v1/associate-nickname-to-name/{nickName}/{firstName})
export interface AssociateNicknameUpdateRequest {
  nickName: string;
  firstName: string;
  effDate: string; // ISO date string
  termDate?: string | null; // ISO date string
}

// Filter chip for UI display
export interface FilterChip {
  key: string;
  label: string;
  value: string;
}

// Dialog data for Add/Edit
export interface AddUpdateDialogData {
  mode: 'add' | 'edit';
  nickName?: string;
  firstName?: string;
  effDate?: Date;
  termDate?: Date | null;
}

// Form data returned from Add/Edit component
export interface AssociateNicknameFormData {
  nickName: string;
  firstName: string;
  effDate: Date;
  termDate?: Date | null;
}
