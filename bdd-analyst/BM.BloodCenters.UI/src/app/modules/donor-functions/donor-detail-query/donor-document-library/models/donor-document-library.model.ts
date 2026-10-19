export interface DonorDocumentDisplay {
  sessionId: string;
  docName: string;
  docType?: string;
  docId: string;
  docLinkedTable: string;
  docLinkedColumn: string;
  docLinkedDesc: string;
  linkedValues: string[];
}

export interface LinkedValueRow {
  sessionId: string;
  docLinkedTable: string;
  docLinkedColumn: string;
  linkedValue: string;
  docLinkedDesc: string;
}

export interface UploadDocumentData {
  donorId: string;
  donorName?: string;
}
