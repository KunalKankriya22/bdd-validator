export interface DonationNoteDto {
  noteId: string;
  noteSequence: number;
  note: string;
  auditKey: number;
  insertDate: string;
  insertUser: string;
  insertUserName: string;
  programId: string;
  chapterId: string;
}

export interface DonationNotesApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: DonationNoteDto[];
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

export interface DonationNotesAccessItem {
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  message?: string;
}

export interface DonationNotesAccessApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: DonationNotesAccessItem;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

export interface DonationNotesMutationApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: DonationNoteDto[];
  total: number;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

export interface DonationNotesDeleteApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: boolean;
  errorResponse: {
    errorCode: string;
    error: string;
  };
}

export interface DonationNotesDialogData {
  unitId?: string;
  deferralId?: string;
  transactionId?: string;
  chapterId?: string;
  collectionDate?: string;
  title?: string;
  contextLabel?: string;
  contextValue?: string;
  valueLabel?: string;
  valueDisplay?: string;
  context?: 'DONATION' | 'RGITUBES'; // Source context for API routing
}

export interface DonationNotesLoadResult {
  notes: DonationNoteDto[];
  access: DonationNotesAccessItem;
}

export type DonationNotesDialogResult =
  | { action: 'close' }
  | undefined;
