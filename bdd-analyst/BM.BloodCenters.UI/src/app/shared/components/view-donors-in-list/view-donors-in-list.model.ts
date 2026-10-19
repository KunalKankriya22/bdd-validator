export interface DonorListInfo {
  listId: string;
  name: string;
  type: string;
  size: string;
  priority: string;
  fullEligibility: boolean;
  donorOverride: boolean;
}

export interface DonorInList {
  donorId: string;
  lastName: string;
  firstName: string;
  sex: string;
  homePhoneInternational: string;
  businessPhoneInternational: string;
  lockBy: string;
  donorStatus: string;
}

export interface ViewDonorsInListResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    listInfo: DonorListInfo;
    donors: DonorInList[];
  };
  total: number;
  errorResponse: {
    errorCode: string | null;
    error: string | null;
  };
}

export interface ViewDonorsInListDialogData {
  listId?: string;
}

export type ViewDonorsInListDialogResult =
  | { action: 'close' }
  | undefined;
