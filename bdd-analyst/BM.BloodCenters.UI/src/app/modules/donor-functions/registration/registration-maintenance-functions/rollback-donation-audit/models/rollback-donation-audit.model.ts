export interface DonorProfile {
  donorName: string;
  dob: string;
  gender: string;
  transactionId: string;
  date: string;
  auditUser: string;
  donationType: string;
  procedureCode: string;
  signature: string;
}

export interface HealthHistoryItem {
  id: string;
  question: string;
  response: string;
  answer: string;
  description: string;
  interdiction: string;
  incident: string;
  deferredThru: string;
  comment: string;
}

export interface PhysicalFinding {
  code: string;
  description: string;
  value: string;
  interdiction: string;
  interdictionDescription: string;
}

export interface RetrieveResponse {
  donorProfile: DonorProfile;
  healthHistory: HealthHistoryItem[];
  physicalFindings: PhysicalFinding[];
  collectionDate: string;
  okToDonate: boolean;
}

export interface ReturnResult<T> {
  success: boolean;
  message: string;
  error: string;
  statusCode: number;
  data: T[];
  item: T;
  total: number;
}

export interface RetrieveRequest {
  type: 'Donation' | 'Deferral';
  id: string;
  collectionDate?: string; // Required for Donation mode, optional for Deferral
}

export interface RollbackRequest {
  type: 'Donation' | 'Deferral';
  id: string;
  transactionId: string;
}

export interface CollectionDateInfo {
  collectionDate: string;
  collectionDateFormatted: string;
}
