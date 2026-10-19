export interface SendLetterDialogData {
  donorIds: string[];
}

export interface SendLetterResult {
  letterSent: boolean;
  letterSeqNo?: string;
}

export interface CommunicationCode {
  code: string;
  description: string;
}

export interface LetterListItem {
  letterCode: string;
  letterTitle: string;
  versionNo: number;
}

export interface LetterDetail {
  letterCode: string;
  letterTitle: string;
  versionNo: number;
  versionDate: string | null;
  letterContent: string;
}

export interface GenerateLetterRequest {
  donorIds: string[];
  letterCode: string;
  templateText: string;
}

export interface GenerateLetterResponse {
  mergedText: string;
  donorId: string;
}

export interface SaveLetterRequest {
  donorId: string;
  commType: string;
  commCode: string;
  comments: string | null;
  letterCode: string;
  mergedText: string;
}

export interface SaveLetterResponse {
  letterSeqNo: string;
  success: boolean;
}

export type DialogState = 'INITIAL' | 'RETRIEVED' | 'GENERATED' | 'SAVED';
