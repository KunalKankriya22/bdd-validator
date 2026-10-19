export interface ViewNotificationLetterDialogData {
  donorId: string;
  letterSeqNo?: string;
  chapterId?: string;
}

export interface ViewNotificationLetterDialogResult {
  action: 'close';
}

export interface NotificationLetter {
  letterCode: string;
  letterSeqNo: string;
  chapterId: string;
  letterTitle?: string;
  letterId?: string;
  documentType?: string;
  authorizedBy?: string;
  authorizedDate?: string;
  generatedBy?: string;
  generatedDate?: string;
  lastReprintedBy?: string;
  lastReprintedOn?: string;
}

export interface NotificationLetterListResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: { letters: NotificationLetter[] }[] | null;
  total: number;
  errorResponse: { errorCode: string; error: string };
}

export interface NotificationLetterTextResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: { letterText: string }[] | null;
  total: number;
  errorResponse: { errorCode: string; error: string };
}
