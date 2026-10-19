export interface FindDonorSearchCriteria {
  unitId?: string;
  scanId?: string;
  donorId?: string;
  lastName?: string;
  firstName?: string;
  dob?: string;
  sex?: string;
  alternateId?: string;
  alternateIdType?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface FindDonorResult {
  grade?: number | null;
  donorId: string;
  lastName?: string;
  firstName?: string;
  middleName?: string | null;
  dob?: Date | string | null;
  sex?: string;
  aboRh?: string | null;
  alternateId?: string | null;
  alternateIdType?: string | null;
  address?: string | null;
  phone?: string | null;
}

export interface FindDonorResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: FindDonorResult[];
  total: number;
  errorResponse: {
    errorCode: string | null;
    error: string | null;
  };
}

export interface FindDonorDialogData {
  mode?: 'add' | 'modify';
  programName?: string;
  prefilledCriteria?: FindDonorSearchCriteria;
  searchOnOpen?: FindDonorSearchCriteria;
}

export interface AlternateIdType {
  code: string;
  description: string;
}

export interface AlternateIdTypesResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: AlternateIdType[];
  total: number;
  errorResponse: {
    errorCode: string | null;
    error: string | null;
  };
}

export interface FindDonorNewData {
  lastName?: string;
  firstName?: string;
  sex?: string;
  dob?: string;
}

export interface DonorLookupItem {
  lastName: string;
  firstName: string;
  dateOfBirth: string;
  gender: string;
  alternateId?: string;
  alternateIdType?: string;
}

export interface DonorLookupResponse {
  success: boolean;
  statusCode: number;
  item?: DonorLookupItem;
  errorCode?: string;
  errorResponse?: string;
}

export interface FindDonorFieldInfo {
  required: boolean;
  doubleEntry: boolean;
  protectedEntry: boolean;
}

export interface FindDonorConfig {
  confirmatoryField: string;
  firstNameVisible: boolean;
  donorIdEnabled: boolean;
  donorIdDoubleEntry: boolean;
  allowNew: string;
  allowSelect: string;
  allowHold: string;
  selectAllowedLevels: number;
  newAllowedLevel: number;
  selectAllowedMultilevel: number;
  gradingLevel: number;
  altIdMode: string;
  fields?: Record<string, FindDonorFieldInfo>;
}

export interface FindDonorConfigResponse {
  success: boolean;
  statusCode: number;
  item?: FindDonorConfig;
}

export type FindDonorDialogResult =
  | { action: 'select'; donor: FindDonorResult; searchCriteria?: FindDonorSearchCriteria }
  | { action: 'new'; searchCriteria?: FindDonorSearchCriteria; newData?: FindDonorNewData }
  | { action: 'hold'; donor?: FindDonorResult; searchCriteria?: FindDonorSearchCriteria }
  | { action: 'cancel' }
  | undefined;
