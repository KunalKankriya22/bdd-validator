export interface ValidateUnitResponse {
  unitId: string;
  collDate: string;
  chapterId?: string;
  isValid: boolean;
  hasComponents: boolean;
  componentCount: number;
}

export interface ProductOption {
  productCode: string;
  productDesc: string;
  productType?: string;
}

export interface ComponentPrefix {
  componentPrefix: string;
}

export interface ComponentNoteData {
  unitId: string;
  collDate: string;
  productCode: string;
  componentPrefix: string;
  noteId?: string;
  note?: string;
  productDesc?: string;
}

export interface SaveNoteRequest {
  unitId: string;
  collDate: string;
  productCode: string;
  componentPrefix: string;
  note: string;
}

export interface SaveNoteResponse {
  noteId: string;
  message: string;
}

export interface ComponentNotesFormState {
  unitId: string;
  collectionDate: string;
  collectionDateRaw: string;
  productCode: string;
  productDescription: string;
  componentPrefix: string;
  isUnitValidated: boolean;
  isProductSelected: boolean;
}

export const FIELD_LENGTHS = {
  UNIT_ID: 15,
  NOTE_MAX: 240,
  PRODUCT_CODE: 10,
} as const;
