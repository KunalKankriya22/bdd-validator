export interface ProcessCodeItem {
  processCode: string;
  description: string;
}

export interface ProductCodeItem {
  productCode: string;
  description: string;
  collectionDate?: string;
}

export interface ProductCodesResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item?: { productCode: string; description: string | null; collectionDate: string | null };
  data?: ProductCodeItem[];
  total?: number;
  error?: string;
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}

export interface AliquotItem {
  aliquot: string;
}

export interface RetrieveNoteRequest {
  processCode: string;
  unitId: string;
  productCode: string;
  aliquot?: string;
}

export interface SpecialProcessingNoteDto {
  processCode: string;
  processDescription: string;
  unitId: string;
  collectionDate: string;
  chapterId?: string;
  productCode: string;
  productDescription: string;
  componentPrefix?: string;
  aliquot?: string;
  noteId?: number;
  noteText?: string;
  insertUser?: string;
  insertDate?: string;
}

export interface SaveNoteRequest {
  processCode: string;
  unitId: string;
  productCode: string;
  aliquot?: string;
  noteText: string;
}

export interface SpecialProcessingApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T[];
  item?: T;
  total?: number;
  error?: string;
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}
